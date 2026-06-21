// Módulo exclusivamente de servidor (usa o access token do Mercado Pago).
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Plan } from "@/lib/plan";

// Planos pagos e seus valores mensais (BRL).
export const PAID_PLANS = {
  premium: { amount: 19, reason: "Acerte Premium" },
  premium_med: { amount: 39, reason: "Acerte Premium Medicina" },
} as const;

export type PaidPlan = keyof typeof PAID_PLANS;

export function isPaidPlan(value: string): value is PaidPlan {
  return value === "premium" || value === "premium_med";
}

const MP_API = "https://api.mercadopago.com";

function accessToken(): string {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado no servidor.");
  }
  return token;
}

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://acertevest.com.br").replace(
    /\/$/,
    "",
  );
}

/** external_reference = "<userId>:<plan>" — liga o pagamento ao usuário/plano. */
export function buildExternalReference(userId: string, plan: PaidPlan): string {
  return `${userId}:${plan}`;
}

export function parseExternalReference(
  ref: string | null | undefined,
): { userId: string; plan: Plan } | null {
  if (!ref) return null;
  const [userId, plan] = ref.split(":");
  if (!userId || !isPaidPlan(plan ?? "")) return null;
  return { userId, plan: plan as Plan };
}

type Preapproval = {
  id: string;
  init_point?: string;
  status?: string;
  external_reference?: string;
  payer_email?: string;
};

/** Cria uma assinatura (preapproval) recorrente mensal e retorna o init_point. */
export async function createPreapproval(params: {
  userId: string;
  email: string | null | undefined;
  plan: PaidPlan;
}): Promise<Preapproval> {
  const { userId, email, plan } = params;
  const cfg = PAID_PLANS[plan];
  const site = getSiteUrl();

  const body = {
    reason: cfg.reason,
    external_reference: buildExternalReference(userId, plan),
    payer_email: email ?? undefined,
    back_url: `${site}/checkout/success`,
    notification_url: `${site}/api/mercado-pago/webhook`,
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: cfg.amount,
      currency_id: "BRL",
    },
    status: "pending",
  };

  const res = await fetch(`${MP_API}/preapproval`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Mercado Pago /preapproval falhou (${res.status}): ${text}`);
  }
  return (await res.json()) as Preapproval;
}

export async function getPreapproval(id: string): Promise<Preapproval> {
  const res = await fetch(`${MP_API}/preapproval/${id}`, {
    headers: { Authorization: `Bearer ${accessToken()}` },
  });
  if (!res.ok) {
    throw new Error(`Mercado Pago GET /preapproval/${id} falhou (${res.status}).`);
  }
  return (await res.json()) as Preapproval;
}

type Payment = {
  id: number | string;
  status?: string;
  external_reference?: string;
  metadata?: Record<string, unknown>;
};

export async function getPayment(id: string): Promise<Payment> {
  const res = await fetch(`${MP_API}/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${accessToken()}` },
  });
  if (!res.ok) {
    throw new Error(`Mercado Pago GET /v1/payments/${id} falhou (${res.status}).`);
  }
  return (await res.json()) as Payment;
}

/**
 * Valida a assinatura do webhook (header x-signature: "ts=...,v1=...").
 * Manifesto: id:<dataId>;request-id:<x-request-id>;ts:<ts>; — HMAC-SHA256 com
 * o MERCADO_PAGO_WEBHOOK_SECRET. Sem o secret configurado, retorna false.
 */
export function verifyWebhookSignature(params: {
  signatureHeader: string | null;
  requestId: string | null;
  dataId: string | null;
}): boolean {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim();
  if (!secret) return false;

  const { signatureHeader, requestId, dataId } = params;
  if (!signatureHeader || !dataId) return false;

  // Extrai ts e v1 do header "ts=123,v1=abc".
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((kv) => {
      const [k, v] = kv.split("=");
      return [k?.trim(), v?.trim()];
    }),
  ) as { ts?: string; v1?: string };

  if (!parts.ts || !parts.v1) return false;

  // O id alfanumérico deve entrar em minúsculas no manifesto (regra do MP).
  const id = /[a-zA-Z]/.test(dataId) ? dataId.toLowerCase() : dataId;
  const manifest = `id:${id};request-id:${requestId ?? ""};ts:${parts.ts};`;

  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(parts.v1, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
