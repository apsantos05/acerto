# Ingestão LOCAL (sem API do Telegram)

Pipeline alternativo que **não depende** do `my.telegram.org`, `api_id` ou
`api_hash`. Lê PDFs de uma **pasta local**, classifica, deduplica por hash e
importa para a biblioteca — reaproveitando OCR, IA e import do pipeline do
Telegram. Use isto enquanto o portal do Telegram estiver bloqueado, ou como
fluxo definitivo de ingestão por pasta.

## De onde vêm os PDFs

Qualquer pasta serve, inclusive:
- PDFs que você já tem no PC / num HD;
- a pasta **`files/` de um export do Telegram Desktop** (Configurações →
  Avançado → Exportar dados, formato HTML/JSON + mídia) — assim você tira o
  conteúdo do Telegram sem a API;
- uma pasta sincronizada do Google Drive (baixe a pasta e aponte para ela).

## Pré-requisitos

```bash
npm i -D pdf-parse @anthropic-ai/sdk      # pdf-parse e IA são opcionais
```
- `@supabase/supabase-js` já é dependência do projeto.
- OCR (opcional) precisa de Tesseract + Poppler no PATH — veja
  `scripts/telegram/README.md` (mesmos binários).
- No SQL Editor rode `supabase/materials_ingest.sql` e `supabase/materials_ai.sql`.

`.env.local` (gitignored) — só o necessário para importar:
```
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
IMPORT_OWNER_USERNAME=acerteoficial
IMPORT_STATUS=pending
# IA (opcional): ANTHROPIC_API_KEY=sk-ant-...
```

## Uso

```bash
# 1) Ler a pasta, extrair texto, classificar e deduplicar por hash
node scripts/import-local/ingest.mjs "C:\caminho\para\seus-pdfs"

# 2) OCR dos escaneados (opcional)
node scripts/import-local/ocr.mjs --dry
node scripts/import-local/ocr.mjs

# 3) Enriquecer com IA (opcional)
node scripts/import-local/ai.mjs --dry
node scripts/import-local/ai.mjs

#    -> REVISE content/import-local/curated.json (marque "skip": true no lixo)

# 4) Importar (status pending → moderação em /admin)
node scripts/import-local/import.mjs --dry
node scripts/import-local/import.mjs
```

## Como funciona

- `ingest.mjs` é o único script novo: varre a pasta (recursivo), calcula
  **sha256** de cada PDF, extrai texto (pdf-parse, se instalado), classifica
  com os mesmos heurísticos do Telegram (universidade, vestibular, matéria,
  tipo, editora, ano, dificuldade, prioridade, slug, keywords, descrição) e
  **deduplica por hash** — gerando `content/import-local/curated.json`. O nome
  da pasta entra como contexto (ex.: uma pasta `Bernoulli/` marca a editora).
- `ocr.mjs`, `ai.mjs` e `import.mjs` são **wrappers finos**: apontam as
  variáveis `CURATED_PATH` e `CACHE_DIR` para `content/import-local/` e
  reaproveitam exatamente os scripts de `scripts/telegram/` (sem duplicar
  lógica). Mesmas flags, mesmas variáveis, mesmo controle de custo da IA.

## Dedup e idempotência

O id do material é derivado do sha256 (UUID v5). Reimportar o mesmo arquivo
**atualiza metadados** em vez de duplicar; o mesmo PDF em pastas diferentes vira
1 item só, com as origens agregadas em `sources`.
