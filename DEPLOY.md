# 🚀 Deploy do Acerte na Vercel

Guia completo para publicar o Acerte (Next.js 16 + Supabase) em produção.

---

## 1. Pré-requisitos

- [x] Build local passando (`npm run build` → exit 0).
- [x] `.env.local` **não** versionado (já coberto pelo `.gitignore`).
- [x] Repositório no GitHub: `https://github.com/apsantos05/acerto`.
- [ ] Últimas alterações **commitadas e enviadas** para a branch `main` (a Vercel faz build a partir do que está no GitHub).
- [ ] Conta na Vercel conectada ao GitHub.

> ⚠️ A Vercel builda o que está **no GitHub**, não o seu disco local. Faça `git push` antes de cada deploy.

---

## 2. Variáveis de ambiente necessárias

Apenas duas — ambas públicas (prefixo `NEXT_PUBLIC_`, embutidas no bundle no build):

| Variável | Valor | Onde achar |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://gagjjfxijjgdzqaikqpz.supabase.co` | Supabase → Project Settings → Data API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` | Supabase → Project Settings → API Keys |

🚫 **NUNCA** adicione a `service_role` na Vercel como `NEXT_PUBLIC_*` — ela ignora o RLS e ficaria exposta no browser.

> Como são `NEXT_PUBLIC_`, elas precisam existir na Vercel **antes/no momento do build**, nos ambientes **Production, Preview e Development**.

---

## 3. Deploy via Dashboard da Vercel (recomendado)

1. Acesse https://vercel.com/new
2. **Import Git Repository** → selecione `apsantos05/acerto`.
3. A Vercel detecta **Next.js** automaticamente (não mude Build Command nem Output).
   - Framework Preset: `Next.js`
   - Build Command: `next build` (padrão)
   - Install Command: `npm install` (padrão)
4. Abra **Environment Variables** e adicione as duas variáveis da seção 2 (marque os 3 ambientes).
5. Clique **Deploy**. Ao terminar, você recebe uma URL `https://acerto-xxxx.vercel.app`.

---

## 4. Deploy via CLI (alternativa)

```bash
npm i -g vercel
vercel login
vercel link            # vincula a pasta ao projeto Vercel
# adicionar as variáveis (cole o valor quando pedir):
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production
# (repita para "preview" e "development" se quiser previews funcionando)
vercel --prod          # deploy de produção
```

---

## 5. Configuração no Supabase APÓS o deploy (CRÍTICO para o Auth)

Com a URL de produção em mãos (ex.: `https://acerto.vercel.app`):

1. Supabase → **Authentication → URL Configuration**:
   - **Site URL**: `https://acerto.vercel.app`
   - **Redirect URLs**: adicione
     - `https://acerto.vercel.app/**`
     - `https://*.vercel.app/**` (para deploys de preview)
     - `http://localhost:3000/**` (para desenvolvimento)
2. **Authentication → Providers → Email**:
   - Para beta sem fricção: desligar **"Confirm email"** (cadastro→login imediato).
   - Para produção real: manter confirmação **e** configurar **SMTP próprio** (Resend/SendGrid) em *Project Settings → Auth → SMTP* — o e-mail embutido do Supabase tem rate limit e não serve para volume.
3. Confirme que rodou `supabase/fix_profile_trigger.sql` (trigger `on_auth_user_created` + RLS) — garante perfil automático em produção.

---

## 6. Possíveis erros e soluções

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Failed to fetch` no cadastro/login | Env vars ausentes/erradas na Vercel | Confira a seção 2; após editar env, **Redeploy** (elas só entram no build) |
| Tela "variáveis do Supabase não configuradas" | `NEXT_PUBLIC_*` não definidas no ambiente do build | Adicione nas 3 abas (Prod/Preview/Dev) e redeploy |
| Login funciona mas redireciona errado / loop | Site URL / Redirect URLs faltando no Supabase | Seção 5, passo 1 |
| `email rate limit exceeded` no cadastro | SMTP embutido do Supabase saturado | Configurar SMTP próprio ou desligar confirmação (seção 5, passo 2) |
| Perfil não criado em `profiles` | Trigger ausente no banco | Rodar `supabase/fix_profile_trigger.sql` |
| Build falha na Vercel mas passa local | Versão de Node diferente | Em Project Settings → General, fixe Node 20+; ou adicione `"engines"` no package.json |
| Páginas de catálogo vazias | Sem dados-semente | Popular `vestibulares`, `faculties` e categorias |

---

## 7. Como fazer redeploy

- **Automático:** todo `git push` na branch `main` dispara um novo deploy de produção.
- **Manual (dashboard):** Vercel → projeto → aba **Deployments** → menu `...` no último deploy → **Redeploy**.
- **Após mudar env vars:** é obrigatório redeploy (as `NEXT_PUBLIC_*` são congeladas no build).
- **CLI:** `vercel --prod`.

---

## 8. Checklist final de go-live

- [ ] `git push origin main` com as últimas alterações.
- [ ] Projeto importado na Vercel + 2 env vars configuradas (3 ambientes).
- [ ] Primeiro deploy concluído com sucesso.
- [ ] Site URL + Redirect URLs configurados no Supabase.
- [ ] Política de e-mail decidida (confirmação on/off + SMTP).
- [ ] `fix_profile_trigger.sql` aplicado (perfil automático).
- [ ] Dados-semente populados (vestibulares/faculdades/categorias).
- [ ] Teste em produção: cadastro → confirma → login → perfil criado → upload de PDF.
