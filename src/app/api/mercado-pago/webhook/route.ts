import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getPayment,
  getPreapproval,
  parseExternalReference,
  verifyWebhookSignature,
} from "@/lib/mercadopago";

export const dynamic = "force-dynamic";

function oneMonthFromNow(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

type AdminClient = ReturnType<typeof createAdminClient>;

async function setPlan(
  admin: AdminClient,
  userId: string,
  plan: string,
  premiumUntil: string | null,
) {
  const { error } = await admin
    .from("profiles")
    .update({ plan, premium_until: premiumUntil })
    .eq("id", userId);
  if (error) console.error("[webhook] update profiles falhou:", error);
}

async function upsertSubscription(
  admin: AdminClient,
  row: {
    user_id: string;
    plan: string;
    provider_subscription_id: string;
    status: string;
    current_period_start?: string | null;
    current_period_end?: string | null;
  },
) {
  const { error } = await admin.from("subscriptions").upsert(
    { provider: "mercado_pago", ...row },
    { onConflict: "provider,provider_subscription_id" },
  );
  if (error) console.error("[webhook] upsert subscription falhou:", error);
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const raw = await request.text();

  // Identificadores para validar a assinatura.
  const signature = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");
  const dataId =
    url.searchParams.get("data.id") ??
    url.searchParams.get("id") ??
    null;

  let body: Record<string, unknown> = {};
  try {
    body = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    body = {};
  }

  const bodyData = (body.data as { id?: string } | undefined) ?? undefined;
  const resourceId = dataId ?? bodyData?.id ?? (body.id as string | undefined) ?? null;

  const type =
    (body.type as string | undefined) ??
    url.searchParams.get("type") ??
    url.searchParams.get("topic") ??
    (body.topic as string | undefined) ??
    "";

  const secretConfigured = Boolean(process.env.MERCADO_PAGO_WEBHOOK_SECRET);
  const validSignature = verifyWebhookSignature({
    signatureHeader: signature,
    requestId,
    dataId: resourceId,
  });

  // Em produção (secret configurado) rejeita assinatura inválida.
  if (secretConfigured && !validSignature) {
    console.warn("[webhook] assinatura inválida — rejeitado.");
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }
  if (!secretConfigured) {
    console.warn(
      "[webhook] MERCADO_PAGO_WEBHOOK_SECRET ausente — processando SEM validar assinatura (apenas dev/sandbox).",
    );
  }

  let admin: AdminClient;
  try {
    admin = createAdminClient();
  } catch (clientError) {
    console.error("[webhook] service role indisponível:", clientError);
    // 200 evita reentrega infinita; o erro é de configuração nossa.
    return NextResponse.json({ ok: false, reason: "config" }, { status: 200 });
  }

  // Log bruto de auditoria (sempre).
  await admin
    .from("payment_events")
    .insert({ provider: "mercado_pago", event_type: type || "unknown", payload: body });

  try {
    if (!resourceId) {
      return NextResponse.json({ ok: true, ignored: "no id" }, { status: 200 });
    }

    // ---- Assinatura (preapproval): concede/cancela o plano ----
    if (type.includes("preapproval")) {
      const pre = await getPreapproval(resourceId);
      const ref = parseExternalReference(pre.external_reference);
      if (!ref) {
        return NextResponse.json({ ok: true, ignored: "no ref" }, { status: 200 });
      }

      if (pre.status === "authorized") {
        const periodEnd = oneMonthFromNow();
        await setPlan(admin, ref.userId, ref.plan, periodEnd);
        await upsertSubscription(admin, {
          user_id: ref.userId,
          plan: ref.plan,
          provider_subscription_id: pre.id,
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd,
        });
      } else if (pre.status === "cancelled") {
        await setPlan(admin, ref.userId, "free", null);
        await upsertSubscription(admin, {
          user_id: ref.userId,
          plan: ref.plan,
          provider_subscription_id: pre.id,
          status: "cancelled",
        });
      } else if (pre.status === "paused") {
        await upsertSubscription(admin, {
          user_id: ref.userId,
          plan: ref.plan,
          provider_subscription_id: pre.id,
          status: "paused",
        });
      }
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // ---- Pagamento recorrente: renova ou marca falha ----
    if (type.includes("payment")) {
      const payment = await getPayment(resourceId);
      const ref = parseExternalReference(payment.external_reference);
      if (!ref) {
        // Sem referência não dá para mapear o usuário com segurança.
        return NextResponse.json({ ok: true, ignored: "no ref" }, { status: 200 });
      }

      if (payment.status === "approved") {
        const periodEnd = oneMonthFromNow();
        await setPlan(admin, ref.userId, ref.plan, periodEnd);
      } else if (
        payment.status === "rejected" ||
        payment.status === "cancelled"
      ) {
        // Falha de pagamento: registra; o plano permanece até a validade atual.
        console.warn(`[webhook] pagamento ${payment.status} para ${ref.userId}`);
      }
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    return NextResponse.json({ ok: true, ignored: type }, { status: 200 });
  } catch (handlerError) {
    console.error("[webhook] erro ao processar:", handlerError);
    // 200 para evitar tempestade de reentregas; o evento já está logado.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

// MP às vezes faz um GET de teste ao salvar a URL no painel.
export async function GET() {
  return NextResponse.json({ ok: true });
}
