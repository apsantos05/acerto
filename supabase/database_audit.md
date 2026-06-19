# Auditoria de compatibilidade SQL × banco real

> **Fonte da verdade:** o banco Supabase real. Eu **não tenho acesso de
> leitura/escrita** ao projeto (o MCP do Supabase é de outra conta). A auditoria
> usou três evidências concretas do repositório como espelho do banco real:
> os erros que você reportou (42P10, 23502), o arquivo `fix_lookup_slug.sql`
> (que já documenta a forma real das tabelas de lookup) e o código de produção
> que escreve nessas tabelas (`upload-material-form.tsx`).

## 1. Forma real das tabelas de lookup (confirmada)

Diferente do `schema.sql` do repositório (que define `slug` como coluna
**gerada** e `name` como **unique**), o banco real tem:

| Tabela | Forma real (evidência) |
|---|---|
| `faculties` | `id, name, slug, type, state, created_at`. `slug` é **NOT NULL comum** (não gerada). `name` **não é unique**. `type/state` existiam como NOT NULL. |
| `vestibulares` | inclui `slug` **NOT NULL comum**. `name` **não é unique**. |

Evidências: o erro `42P10` (não há unique em `name`) e `23502` (slug null), e o
próprio `fix_lookup_slug.sql`, que faz backfill de `slug` e dropa NOT NULL de
`faculties.type/state` — algo que só faz sentido na forma real acima.

## 2. Erros encontrados

| # | Arquivo | Erro | Tipo |
|---|---|---|---|
| 1 | `materials_ingest.sql` | `on conflict (name)` em `faculties`/`vestibulares` — **não há unique em `name`** | `42P10` |
| 2 | `materials_ingest.sql` | `insert into public.vestibulares (name)` **sem `slug`** (NOT NULL) | `23502` |
| 3 | `materials_ingest.sql` | seed de `faculties` não garantia `slug`/`type`/`state` nem a existência das colunas | risco `23502`/`42703` |
| 4 | `materials_ingest.sql` | sem índice único de `slug` em `vestibulares` (dedup frágil) | integridade |
| 5 | `scripts/telegram/import-materials.mjs` | `getOrCreate` inseria `{ name }` **sem `slug`** em `faculties`/`vestibulares` | `23502` (em runtime do import) |

**Não eram problemas** (verificados): `materials_ai.sql` (só `add column if not
exists summary`) e `plans.sql` (colunas + `is_premium()`), ambos idempotentes e
compatíveis.

**Divergência da base (não alterada):** `schema.sql` (linhas ~250/256) também usa
`on conflict (name)` em `vestibulares`/`faculties`. No banco real isso falharia,
mas a base já foi aplicada de outra forma; não toquei nela para não arriscar o
ambiente existente. Fica como **risco documentado** — se um dia recriar o banco
do zero, alinhe `schema.sql` antes.

## 3. Correções aplicadas

### `materials_ingest.sql` (e cópia `materials_ingest_fixed.sql`)
- Removido todo `ON CONFLICT (name)` → seeds via `WHERE NOT EXISTS` por `slug`.
- `vestibulares` agora é semeado **com `slug`** (corrige `23502`).
- Garante colunas: `add column if not exists slug/type/state` (faculties),
  `slug` (vestibulares); **dropa NOT NULL** de `faculties.type/state`.
- **Backfill** de slugs nulos legados (deriva do `name`).
- Índices únicos de `slug` criados **só se não houver duplicados** (DO block com
  `raise notice` caso existam — não quebra a migration).
- Seeds completos das universidades/vestibulares (inclui FAMEMA e UFSCAR que o
  classificador pode produzir), com `slug` válido.
- Colunas de `materials` garantidas defensivamente (`faculdade`, `vestibular`,
  `faculty_id`, `vestibular_id`, além de editora/priority/difficulty/file_hash/
  slug/keywords).
- Bloco de verificação amplia checagens (slug nulo deve ser 0 nas duas tabelas).

### `scripts/telegram/import-materials.mjs`
- `getOrCreate` agora insere `{ name, slug }` (com `slugifyName`) e trata
  `23505` recuperando pelo `slug` — espelhando `upload-material-form.tsx`, que
  já fazia certo.

### `materials_ai_fixed.sql` / `plans_fixed.sql`
- Cópias validadas dos arquivos (já estavam corretos); incluídas por pedido,
  prontas para produção.

## 4. Validações automáticas no código (grep)

| Verificação | Resultado |
|---|---|
| Uso de tabela `faculdades` (inexistente) | **Nenhum.** O código usa a coluna `materials.faculdade` (correta) e a tabela `faculties` via `from("faculties")` (correta). `options.faculdades` é apenas um campo de UI (lista de faculdades), não tabela. |
| `SELECT` de coluna inexistente | **Nenhum.** `materialSelect` e os filtros (`faculdade/subject/vestibular/material_type/year`) referenciam só colunas existentes. |
| `insert` incompatível com `vestibulares.slug` | **Encontrado e corrigido** em `import-materials.mjs`. `upload-material-form.tsx` já enviava `slug`. |
| Erros futuros (corrida em slug) | `getOrCreate` agora trata `23505`; `materials_ingest` é re-executável sem erro. |

## 5. Riscos identificados

- **`faculties.type`** pode ter um CHECK no banco real restringindo valores. Os
  seeds usam `'publica'`/`'privada'`. Se houver um CHECK diferente, ajuste os
  valores. *(Não consigo inspecionar o CHECK sem acesso ao banco.)*
- **`type/state` NOT NULL antigos**: a migration dropa o NOT NULL antes de
  semear, então `state` nulo (PUC/ENEM) é aceito.
- **Slugs duplicados legados**: se existirem, o índice único **não** é criado
  (a migration avisa via `notice`); resolva os duplicados e rode de novo.
- **`schema.sql` base** ainda tem `ON CONFLICT (name)` — risco só ao recriar o
  banco do zero (ver seção 2).

## 6. Comandos / validações executados por mim

- `Grep` no repositório: `faculdades|faculties|vestibulares`, padrões de
  `insert into ... (faculties|vestibulares)`, e `from("faculties"|"vestibulares")`.
- Leitura de: `materials_ingest.sql`, `materials_ai.sql`, `plans.sql`,
  `fix_lookup_slug.sql`, `schema.sql`, `upload-material-form.tsx`,
  `import-materials.mjs`.
- `npm run lint` + `npm run build` após alterar o código (`.mjs` não entra no
  build do Next, mas o app permanece verde).

> ⚠️ **Não executei os SQLs no banco real** (sem acesso). A correção foi feita
> por análise estática + espelhamento do `fix_lookup_slug.sql` e do código de
> produção, e por construção idempotente. **Rode `materials_ingest_fixed.sql`
> no SQL Editor** — o bloco de verificação ao final deve retornar tudo `ok`/`0`.

## 7. Ordem recomendada de execução (lookups + ingestão)

1. `schema.sql` (base, já aplicado)
2. `fix_lookup_slug.sql` (se ainda não rodou)
3. **`materials_ingest_fixed.sql`** ← este
4. `materials_ai_fixed.sql`
5. `plans_fixed.sql`
6. Depois: rodar o import (`scripts/telegram` ou `scripts/import-local`).
