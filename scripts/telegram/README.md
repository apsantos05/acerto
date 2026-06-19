# Ingestão de materiais do Telegram → biblioteca

Pipeline em 3 etapas para baixar PDFs (apostilas, provas, gabaritos, resumos…)
de canais/grupos do Telegram, **classificá-los** (universidade, vestibular,
matéria, ano, tipo, editora, dificuldade, prioridade) e publicá-los na
biblioteca do Acerte — sem duplicações e prontos para moderação.

> ⚠️ Tudo roda **localmente, na sua máquina**, com as suas credenciais. O login
> do Telegram (telefone/código/2FA) e a service-role key do Supabase ficam só
> com você. `content/telegram/`, `sources.json` e `.env.local` são gitignored.

## Pré-requisitos (uma vez)

```bash
npm i -D telegram input pdf-parse
```

- `telegram` + `input`: cliente do Telegram e prompts de login.
- `pdf-parse`: extrai o texto do PDF para classificar melhor (opcional — sem
  ele, classifica só por nome/legenda).

1. **Telegram API:** https://my.telegram.org → *API development tools* → gere
   `api_id` e `api_hash`.
2. **Supabase service_role:** Project Settings → API → `service_role` (secreta;
   ignora o RLS para gravar como o perfil oficial).
3. No `.env.local`:

   ```
   TELEGRAM_API_ID=123456
   TELEGRAM_API_HASH=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TELEGRAM_SESSION=
   SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
   IMPORT_OWNER_USERNAME=acerteoficial
   IMPORT_STATUS=pending        # pending = moderação em /admin; approved = direto
   IMPORT_MAX_MB=10
   ```

4. As 9 origens já estão em `scripts/telegram/sources.json` (canais públicos e
   links de convite privados). Você precisa **já ser membro** dos privados, ou o
   script tenta entrar pelo link automaticamente.

## Etapas

```bash
# 1) Baixar os PDFs (1ª vez pede telefone + código; salve a TELEGRAM_SESSION impressa)
node scripts/telegram/pull-telegram.mjs

# 2) Classificar (universidade, matéria, tipo, editora, prioridade…) + dedup por hash
node scripts/telegram/normalize.mjs
#    -> REVISE content/telegram/curated.json e marque "skip": true no que não deve entrar.
#       Reexecutar preserva suas edições.

# 3a) Prévia (não grava)
node scripts/telegram/import-materials.mjs --dry

# 3b) Importar (sobe PDFs ao bucket e cria/atualiza os registros)
node scripts/telegram/import-materials.mjs
```

Antes de importar, rode **`supabase/materials_ingest.sql`** no SQL Editor (cria
as colunas editora/priority/difficulty/file_hash/slug/keywords, amplia os tipos
de material e semeia as universidades prioritárias).

## Como a classificação funciona

- **Universidade + vestibular:** Fuvest→USP, Comvest→UNICAMP, Vunesp→UNESP,
  Mandic→SLMANDIC, Einstein→ALBERT EINSTEIN, etc. As 14 universidades
  prioritárias entram como `priority: "alta"`.
- **Editora:** detectada pelo canal de origem (apostilasbernoulli→Bernoulli) ou
  pelo texto. Bernoulli, Poliedro, Hexag, Farias Brito, COC, Anglo e Objetivo
  recebem prioridade alta.
- **Tipo:** Apostila, Simulado, Prova, Gabarito, Lista de exercícios, Resumo,
  Revisão, Caderno de questões, Redação, Correção comentada, Questões
  discursivas/objetivas, Material teórico.
- **Matéria, ano, dificuldade, keywords, slug e descrição** saem das mesmas
  heurísticas (nome + legenda + texto do PDF).
- Cada material fica vinculado à **universidade** (faculties) e ao
  **vestibular** (vestibulares), aparecendo na matéria *e* na universidade nos
  filtros da biblioteca.

## Observações

- **Sem duplicatas:** dedup por **sha256**. O mesmo arquivo em canais diferentes
  vira 1 item; reimportar **atualiza metadados** em vez de criar registro novo.
- **Moderação:** com `IMPORT_STATUS=pending`, tudo entra pendente para você
  aprovar em `/admin`.
- **Bucket > 10 MB:** para arquivos maiores, no SQL Editor:
  `update storage.buckets set file_size_limit = 52428800 where id = 'materials';`
- **OCR (futuro):** PDFs escaneados (sem camada de texto) são marcados com
  `needsOcr: true` no `curated.json` e classificados só por nome/legenda. OCR
  real (tesseract) e classificação/resumo por IA ficam como evolução — os
  scripts já isolam esses pontos (`extractText`, `description`) para plugar
  depois.
- **Plano B (sem API):** dá para exportar pelo Telegram Desktop (JSON + mídia);
  me avise que escrevo o conversor do `result.json` para o mesmo `manifest.json`.
