# Ingestão de materiais do Telegram → biblioteca

Pipeline para baixar PDFs de canais/grupos do Telegram, **classificá-los**
(universidade, vestibular, matéria, ano, tipo, editora, dificuldade,
prioridade), opcionalmente **rodar OCR** em PDFs escaneados e **enriquecer com
IA** (resumo, descrição, tags), e publicar na biblioteca do AcertaVest — sem
duplicações e pendentes para moderação.

> ⚠️ Tudo roda **localmente, na sua máquina**, com as suas credenciais. O login
> do Telegram, a service-role do Supabase e a chave da Anthropic ficam só com
> você. `content/telegram/`, `sources.json` e `.env.local` são gitignored.

## Ordem do pipeline

```
pull → normalize → [ocr] → [ai-classify] → revisar curated.json → import
```
OCR e IA são opcionais (entre colchetes). Sem eles, a classificação por
heurística (nome + legenda + texto do PDF) já funciona.

## Pré-requisitos

### Dependências Node (uma vez)

```bash
npm i -D telegram input pdf-parse @anthropic-ai/sdk
```
- `telegram` + `input`: cliente do Telegram e prompts de login.
- `pdf-parse`: extrai texto do PDF (classificação melhor; opcional).
- `@anthropic-ai/sdk`: classificação por IA (opcional).

### Tesseract + Poppler (só se for usar OCR)

OCR precisa de dois binários de **sistema** no PATH:

- **Tesseract OCR** — com o idioma português (`por`).
  - Windows: instale o build do **UB Mannheim**
    (https://github.com/UB-Mannheim/tesseract/wiki). No instalador, em
    *Additional language data*, marque **Portuguese**. Adicione a pasta de
    instalação (ex.: `C:\Program Files\Tesseract-OCR`) ao PATH.
  - Confira: `tesseract --version` e `tesseract --list-langs` (deve listar `por`).
- **Poppler** — fornece o `pdftoppm` (rasteriza o PDF em imagens).
  - Windows: baixe o Poppler for Windows
    (https://github.com/oschwartz10612/poppler-windows/releases) e adicione a
    pasta `Library\bin` ao PATH.
  - Confira: `pdftoppm -v`.

### Variáveis no `.env.local` (gitignored)

```
# Telegram (etapa pull)
TELEGRAM_API_ID=123456
TELEGRAM_API_HASH=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TELEGRAM_SESSION=

# Supabase (etapa import) — service_role IGNORA o RLS
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
IMPORT_OWNER_USERNAME=acerteoficial
IMPORT_STATUS=pending        # pending = moderação em /admin; approved = direto
IMPORT_MAX_MB=10

# OCR (etapa ocr) — opcionais
OCR_LANG=por
OCR_MAX_PAGES=3
OCR_DPI=200

# IA (etapa ai-classify) — opcionais (exceto a chave)
ANTHROPIC_API_KEY=sk-ant-...
AI_MODEL=claude-haiku-4-5
AI_BATCH_SIZE=5
AI_MAX_CHARS=4000
```

As 9 origens já estão em `scripts/telegram/sources.json`. Você precisa **já ser
membro** dos canais privados, ou o script tenta entrar pelo link.

## Etapas

```bash
# 1) Baixar os PDFs (1ª vez pede telefone + código; salve a TELEGRAM_SESSION impressa)
node scripts/telegram/pull-telegram.mjs

# 2) Classificar + dedup por hash (escreve cache de texto p/ OCR e IA)
node scripts/telegram/normalize.mjs

# 2.5) OCR dos PDFs escaneados (needsOcr) — opcional
node scripts/telegram/ocr.mjs --dry     # lista os candidatos
node scripts/telegram/ocr.mjs           # roda o OCR e reclassifica

# 2.7) Enriquecer com IA (resumo, descrição, tags, matéria, vestibular...) — opcional
node scripts/telegram/ai-classify.mjs --dry   # estima nº de requisições, sem custo
node scripts/telegram/ai-classify.mjs         # chama o Claude Haiku em lote

#    -> REVISE content/telegram/curated.json e marque "skip": true no que não deve entrar.

# 3) Importar (sobe PDFs ao bucket e cria/atualiza os registros, status pending)
node scripts/telegram/import-materials.mjs --dry
node scripts/telegram/import-materials.mjs
```

Rode antes no SQL Editor: **`supabase/materials_ingest.sql`** (colunas e tipos)
e **`supabase/materials_ai.sql`** (coluna `summary`).

## OCR — como funciona

`ocr.mjs` seleciona os itens com `needsOcr: true` (ou sem texto em cache),
rasteriza as primeiras `OCR_MAX_PAGES` páginas com `pdftoppm`, roda o Tesseract
(`-l por`), grava o texto no cache e **reclassifica** o item com o texto
recuperado, marcando `needsOcr: false`. Rode OCR **antes** de curar manualmente
(ele sobrescreve a classificação dos itens escaneados). Se os binários não
estiverem no PATH, o script falha com instrução clara em vez de inventar texto.

## IA — como funciona e controle de custo

`ai-classify.mjs` usa **Claude Haiku** (barato) com **structured outputs** (JSON
garantido) para gerar, por material: `summary`, `description`, `tags`,
`difficulty`, `subject`, `vestibular` e `universidade` (escolhida entre as
universidades válidas). Mescla no `curated.json`.

Custo é contido por padrão:
- **só itens pendentes** do `curated.json` (não toca em material aprovado);
- **cache por sha256** em `content/telegram/cache/ai/` — não reprocessa o mesmo
  PDF; rerodar só classifica o que falta;
- **texto limitado** a `AI_MAX_CHARS` por item;
- **lote** de `AI_BATCH_SIZE` itens por requisição (menos chamadas);
- modelo barato e **sem "thinking"**;
- **`--dry`** estima o número de requisições sem gastar nada.

Para evitar custo alto: comece com `--dry`, rode em lotes maiores
(`AI_BATCH_SIZE=8`), reduza `AI_MAX_CHARS`, e processe primeiro só os de
prioridade alta (marque `skip:true` no resto, rode a IA, depois reavalie). Para
volumes grandes e sem pressa, a Batches API da Anthropic dá mais 50% de
desconto — posso adaptar o script se quiser.

## Observações

- **Sem duplicatas:** dedup por **sha256**. O mesmo arquivo em canais diferentes
  vira 1 item; reimportar **atualiza metadados** em vez de criar registro novo.
- **Moderação:** com `IMPORT_STATUS=pending`, tudo entra pendente para você
  aprovar em `/admin` antes de publicar.
- **Bucket > 10 MB:** `update storage.buckets set file_size_limit = 52428800 where id = 'materials';`
- **Plano B (sem API do Telegram):** export do Telegram Desktop (JSON + mídia);
  me avise que escrevo o conversor para o mesmo `manifest.json`.
