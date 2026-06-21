// Módulo exclusivamente de servidor.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createPreapproval,
  getSiteUrl,
  type PaidPlan,
} from "@/lib/mercadopago";

/**
 * Inicia o checkout de um plano pago.
 * - Não logado -> manda para /cadastro?plano=<plan> (login/cadastro).
 * - Logado -> cria a assinatura no Mercado Pago e redireciona para o init_point.
 * - Erro -> volta para /planos?erro=checkout.
 */
export async function startCheckout(plan: PaidPlan): Promise<NextResponse> {
  const site = getSiteUrl();
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${site}/cadastro?plano=${plan}`, {
        status: 303,
      });
    }

    const preapproval = await createPreapproval({
      userId: user.id,
      email: user.email,
      plan,
    });

    if (!preapproval.init_point) {
      throw new Error("Mercado Pago não retornou init_point.");
    }

    // Registra a assinatura como 'pending' (auditoria). Não é crítico: se
    // falhar, o checkout segue — o webhook reconcilia depois.
    try {
      const admin = createAdminClient();
      await admin.from("subscriptions").upsert(
        {
          user_id: user.id,
          plan,
          provider: "mercado_pago",
          provider_subscription_id: preapproval.id,
          status: "pending",
        },
        { onConflict: "provider,provider_subscription_id" },
      );
    } catch (recordError) {
      console.error("[checkout] falha ao registrar assinatura pendente:", recordError);
    }

    return NextResponse.redirect(preapproval.init_point, { status: 303 });
  } catch (checkoutError) {
    console.error("[checkout] falha:", checkoutError);
    return NextResponse.redirect(`${site}/planos?erro=checkout`, { status: 303 });
  }
}
