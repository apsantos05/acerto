# 💳 Checkout do Acerte — Mercado Pago Assinaturas

Integração de pagamento recorrente para os planos **Premium (R$ 19/mês)** e
**Premium Medicina (R$ 39/mês)**, usando a API de **Preapproval (Assinaturas)**
do Mercado Pago. O plano do usuário (`profiles.plan`) é atualizado automaticamente
pelo webhook e o gating existente passa a refletir o acesso.

---

## 1. Pré-requisitos no banco

Rode no **SQL Editor do Supabase** (idempotente):

1. `supabase/plans_fixed.sql` (se ainda não rodou) — `profiles.plan` / `premium_until`.
2. `supabase/payments.sql` — tabelas `subscriptions` e `payment_events`, RLS e o
   **trigger que impede o usuário de trocar o plano manualmente**.

---

## 2. Variáveis de ambiente

| Variável | Onde usar | Descrição |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Front + servidor | URL pública (ex.: `https://acerto.vercel.app`). Usada nos redirects e no `notification_url`. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Servidor** | Supabase → Settings → API → `service_role`. Só o webhook usa. **Nunca** `NEXT_PUBLIC_`. |
| `MERCADO_PAGO_ACCESS_TOKEN` | **Servidor** | Mercado Pago → Suas integrações → sua aplicação → Credenciais (Teste ou Produção). |
| `MERCADO_PAGO_WEBHOOK_SECRET` | **Servidor** | Mercado Pago → Webhooks → "Assinatura secreta". Valida o `x-signature`. |

> 🚫 As três últimas **não** podem ter prefixo `NEXT_PUBLIC_` — senão vazam no
> bundle do browser. Na Vercel, adicione-as em Project Settings → Environment
> Variables (Production/Preview/Development) e faça redeploy.

---

## 3. Configurar o Mercado Pago

1. Crie uma aplicação em **https://www.mercadopago.com.br/developers** → "Suas integrações".
2. Em **Credenciais**, copie o **Access Token** (use o de **Teste** para sandbox).
3. Em **Webhooks**, cadastre a URL:
   `https://SEU_SITE/api/mercado-pago/webhook`
   - Eventos: marque **Pagamentos** e **Planos e assinaturas (preapproval)**.
   - Copie a **Assinatura secreta** → `MERCADO_PAGO_WEBHOOK_SECRET`.
4. Garanta que `NEXT_PUBLIC_SITE_URL` aponta para o mesmo domínio do webhook.

---

## 4. Como o fluxo funciona

```
/planos  ──clica "Assinar"──►  GET /api/checkout/premium(-med)
   │
   ├─ não logado → redireciona p/ /cadastro?plano=<plano>
   └─ logado → cria preapproval no MP → redireciona p/ init_point (Mercado Pago)
                         │
              usuário paga/autoriza
                         │
   MP → POST /api/mercado-pago/webhook  (valida x-signature)
                         │
   webhook (service role) → profiles.plan + premium_until + subscriptions
                         │
            gating existente já reflete o acesso
```

Retornos do usuário: `/checkout/success`, `/checkout/pending`, `/checkout/failure`.

---

## 5. Rotas criadas

- `GET /api/checkout/premium` — inicia assinatura Premium.
- `GET /api/checkout/premium-med` — inicia assinatura Premium Medicina.
- `POST /api/mercado-pago/webhook` — recebe e processa as notificações.

---

## 6. Testar em sandbox (sem cobrança real)

1. Use o **Access Token de TESTE** e crie **usuários de teste** em
   Mercado Pago → "Suas integrações" → **Contas de teste** (um vendedor e um comprador).
2. Configure `MERCADO_PAGO_ACCESS_TOKEN` (teste) + `MERCADO_PAGO_WEBHOOK_SECRET`.
3. Suba o site num domínio público (preview da Vercel) — o webhook precisa ser
   acessível pela internet. (Para localhost, use um túnel tipo `ngrok` e ajuste o
   `NEXT_PUBLIC_SITE_URL`.)
4. Logue no Acerte, vá em `/planos`, clique em **Assinar Premium**.
5. No checkout do MP, pague com o **comprador de teste** e os
   **cartões de teste** do MP (ex.: aprovado `APRO`, recusado `OTHE`).
6. Confira:
   - `payment_events` recebeu o evento;
   - `subscriptions` ficou `active`;
   - `profiles.plan` virou `premium`/`premium_med` e `premium_until` ~30 dias à frente;
   - o gating liberou os recursos premium.

### Cenários a validar
- Free assinando **premium** → vira premium.
- Free assinando **premium_med** → vira premium_med.
- Premium fazendo **upgrade** para premium_med → assina o novo; ao autorizar, plano sobe.
- **Cancelamento** (preapproval `cancelled`) → volta para `free`.
- **Pendente** (Pix/boleto) → fica em `/checkout/pending` até aprovar.
- **Recusado** → `/checkout/failure`, plano inalterado.

---

## 7. Segurança implementada

- Access token e service role **só no servidor** (route handlers); nunca no front.
- Webhook valida `x-signature` (HMAC-SHA256) com o secret; em produção, assinatura
  inválida é **rejeitada (401)**.
- Todos os eventos são gravados em `payment_events` (auditoria).
- Trigger `protect_plan_columns` impede o usuário de alterar `plan`/`premium_until`
  manualmente — só `service_role` (webhook) ou admin mudam.
- Admin mantém acesso total independentemente do plano (gating já trata isso).
