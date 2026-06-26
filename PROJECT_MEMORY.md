# ACERTAVEST — MEMÓRIA COMPLETA DO PROJETO

> Documento de handoff para futuras sessões. Resume arquitetura, banco, scripts,
> decisões e histórico. Mantenha atualizado ao concluir mudanças relevantes.
> Última atualização: commit `49294bb`.

---

## Visão Geral

- **O que é:** AcertaVest — plataforma SaaS para **vestibulandos de
  Medicina**. Posicionamento: "o LinkedIn + GitHub do futuro médico". Slogan:
  **"Estude junto. Passe junto."**
- **Público-alvo:** estudantes que vão prestar Medicina (Fuvest/USP, Comvest/Unicamp,
  Unesp, ENEM, Einstein, Famerp, etc.).
- **Objetivo:** biblioteca acadêmica (provas, gabaritos, apostilas, simulados,
  resumos, redações) + comunidade (feed, ranking, perfil público) + plano de
  estudos + simulados, monetizada por assinatura.
- **Diferenciais:** acervo organizado por **universidade / matéria / vestibular**,
  reputação/ranking reais, simulados com correção no servidor, e curadoria
  automatizada (importação, OCR, classificação por IA).

---

## Stack Tecnológica

- **Frontend/Backend:** Next.js **16.2.9** (App Router, **Turbopack**), React 19,
  TypeScript, Tailwind CSS v4. Componentes server por padrão; client onde há
  interação (`"use client"`).
  - ⚠️ `AGENTS.md` avisa: *"this is NOT the Next.js you know"* — consultar
    `node_modules/next/dist/docs/` antes de usar APIs do Next.
- **Banco / Auth / Storage:** **Supabase** (PostgreSQL + Auth + Storage).
- **Hospedagem:** **Vercel** (deploy automático no push para `main`).
- **Repositório:** `github.com/apsantos05/acertavest` · branch principal **`main`**.
- **Serviços externos:** Anthropic API (Claude **Haiku 4.5**) para classificação/
  títulos por IA; Telegram (MTProto via gramjs) para ingestão; Tesseract + Poppler
  (OCR, binários de sistema).
- **Bibliotecas:** `@supabase/ssr`, `@supabase/supabase-js`, `lucide-react` (ícones).
  DevDeps de scripts (instaláveis sob demanda): `telegram`, `input`, `pdf-parse`,
  `@anthropic-ai/sdk`.
- **Comandos padrão:** `npm run lint` (eslint), `npx tsc --noEmit`, `npm run build`.
  **Convenção da sessão:** rodar os 3 + commit + push ao concluir.
- **Quirk Windows/OneDrive:** o build às vezes falha com `spawn UNKNOWN`/`0xC0000409`
  (worker). Resolve com `rm -rf .next` e reexecutar — **não é erro de código**.

### ⚠️ Acesso ao banco (IMPORTANTE)
O MCP do Supabase disponível é de **outra conta** e **não tem acesso** ao projeto
real (`gagjjfxijjgdzqaikqpz.supabase.co`). Portanto **o Claude não roda SQL nem
escreve no banco**. Consequências:
- Todo SQL é entregue em arquivos `supabase/*.sql` para o usuário rodar no SQL Editor.
- Os scripts `scripts/admin/*` e `scripts/**/import*` são executados **pelo usuário**
  localmente, com a `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`.
- Validação possível pelo Claude: `lint` + `type-check` + `build` + testes de funções
  puras via `node -e`. Não há teste em navegador nem execução contra o banco real.

---

## Banco de Dados

RLS habilitado em todas as tabelas. Conteúdo aprovado é público; escrita só do
dono; admin via `is_admin()`. **Trigger `on_auth_user_created`** cria a linha em
`profiles` ao cadastrar (função `handle_new_user`).

> ⚠️ **Divergência real x schema.sql:** o banco real divergiu do `schema.sql` do
> repo. No real, `faculties.slug` e `vestibulares.slug` são **NOT NULL comuns**
> (não geradas), `faculties` tem colunas extras **`type`** e **`state`**, e **não há
> unique em `name`** (por isso usar `WHERE NOT EXISTS`, nunca `ON CONFLICT (name)`).

### profiles
Perfil do usuário (FK `id → auth.users`).
Campos: `id, username, full_name, email, avatar_url, cover_url, bio, objective
('Medicina'), dream_faculty, target_exams[], city, state, target_exam (legado),
points (legado), streak_days, study_streak, last_activity_at, badges[] (legado),
role ('user'|'admin'), plan ('free'|'premium'|'premium_med'), premium_until,
created_at`.
- `role` controla admin; `plan`/`premium_until` controlam assinatura.
- `study_streak`/`last_activity_at` mantidos por triggers de atividade.

### faculties
Universidades (coleções). Campos reais: `id, name, slug (NOT NULL), type, state,
created_at`. Relaciona-se com `materials.faculty_id`. Semeada com as universidades
prioritárias.

### vestibulares
Bancas/vestibulares. Campos: `id, name, slug (NOT NULL), created_at`. Relaciona-se
com `materials.vestibular_id`.

### materials (tabela central)
Campos: `id, owner_id (→profiles), vestibular_id (→vestibulares), faculty_id
(→faculties), title, description, summary, vestibular (texto), faculdade (texto),
year, subject, material_type, file_url, external_url, storage_path, upload_kind
('file'|'link'), tags[], keywords[], editora, priority ('alta'|'normal'),
difficulty, file_hash (sha256, único), slug, status ('pending'|'approved'|
'rejected'), rating, ratings_count, views_count, created_at, updated_at,
updated_by (→profiles)`.
- **A biblioteca/SEO filtram pelas colunas de TEXTO** `faculdade`/`vestibular`/
  `subject` (não pelos *_id). `faculty_id`/`vestibular_id` são o vínculo relacional.
- `file_hash` único → dedup de importação (mesmo arquivo = 1 registro).
- `material_type` tem CHECK ampliado (ver `materials_ingest_fixed.sql`).

### saved_materials / saved_posts
Favoritos (PK composta user+item). RLS own-only.

### posts / comments / likes
Feed social. `likes` é **polimórfico** (`target_type` 'post'|'material', `target_id`,
`user_id`; PK composta). `comments` (post_id, author_id, content).

### material_ratings
Avaliação 1–5 por material (unique material+user). RPC `recompute_material_rating`
atualiza `materials.rating`.

### simulados / simulado_questions / simulado_attempts / simulado_answers
- `simulados`: title, vestibular, faculty, subjects[], duration_minutes,
  official_minutes, official_questions, rules, difficulty, question_count, status
  ('draft'|'published').
- `simulado_questions`: subject, question_text, alternatives (jsonb), correct_answer,
  explanation, difficulty, order_index.
- `simulado_attempts`: simulado_id, user_id, total_questions, duration_minutes,
  status ('in_progress'|'completed'|'expired'), started_at, finished_at, score.
- `simulado_answers`: attempt_id, question_id, selected_answer, is_correct.

### user_badges
Badges persistidos (PK profile_id+badge_code, earned_at). Escrita só via
`sync_user_badges()` (security definer). Leitura pública.

### study_tasks / weekly_goals
Plano de estudos. status ('active'|'completed'|'archived'), progress, completed_at,
archived_at. RLS own-only.

### RPCs / funções importantes
`handle_new_user` (trigger), `is_admin()`, `increment_material_view`,
`calculate_reputation`, `get_reputation_ranking(subject, vestibular, limit)`,
`get_profile_reputation(profile_id)`, `start_simulado`, `finish_simulado`,
`get_simulado_questions`, `admin_delete_material`, `admin_delete_post`,
`register_study_activity`, `sync_user_badges`, `recompute_material_rating`,
`touch_updated_at` (trigger updated_at), `is_premium(profile_id)`.

### Ordem recomendada de execução dos SQLs (banco do zero / sincronizar)
1. `schema.sql` → 2. `fix_profile_trigger.sql` → 3. `migration_fix_production_schema.sql`
→ 4. `fix_rls_write.sql` → 5. `fix_materials_schema.sql` →
6. `fix_interactions_and_upload.sql` → 7. `fix_lookup_slug.sql` →
8. `material_ratings.sql` → 9. `material_types.sql` → 10. `reputation_ranking.sql` →
11. `admin_role.sql` → 12. `admin_delete.sql` → 13. `avatars_bucket.sql` →
14. `study_planner.sql` → 15. `study_history.sql` → 16. `simulados.sql` →
17. `simulado_timer.sql` → 18. `profile_revamp.sql` →
19. **`materials_ingest_fixed.sql`** → 20. **`materials_ai_fixed.sql`** →
21. **`plans_fixed.sql`** → 22. **`admin_material_edit.sql`** →
23. **`plan_gating.sql`** (limite de simulados na RPC + trigger de favoritos) →
24. **`study_tracks.sql`** (trilhas + cronograma + progresso + seed de 11 trilhas) →
25. **`payments.sql`** (subscriptions + payment_events + trigger anti-tamper de plano) →
26. **`simulados_oficiais.sql`** (categoria oficial + auto-save/flags + TRI + ranking + seed das 9 provas) →
27. **`diagnostico_aprovacao.sql`** (approval_diagnostics + RLS; insert só via service role).
Seeds: `seed_materials.sql`, `seed_feed.sql`, `seed_simulados.sql`.
Auditoria documentada em `supabase/database_audit.md`.

---

## Sistema de Planos

Coluna `profiles.plan` com **valores exatos no banco: `free`, `premium`,
`premium_med`** (+ `premium_until`). Helper SQL `is_premium(profile_id)`.
Front: `src/lib/plan.ts` (`Plan`, `normalizePlan`, `PLAN_LABEL`) e badge
`src/components/profile/plan-badge.tsx`.

### Free (R$ 0)
Biblioteca pública (provas e gabaritos), feed, ranking, perfil, **2 simulados/mês**,
**até 20 favoritos**, envio de materiais.

### Premium (R$ 19/mês)
Tudo do Free + acervo completo, apostilas das melhores editoras, **simulados
ilimitados**, correção no servidor, **favoritos ilimitados**, recomendações por
matéria, estatísticas avançadas, sem anúncios.

### Premium Medicina (R$ 39/mês)
Tudo do Premium + trilhas por universidade, simulados oficiais por banca, correção
de redação, cronograma personalizado, prioridade nos materiais da universidade-alvo.

### Gating por plano (IMPLEMENTADO)
Helpers server-side em **`src/lib/gating.ts`**: `getViewer()`, `isPremium()`,
`isPremiumMed()`, `canAccessMaterial()`, `canTakeSimulado()`, `canFavoriteMaterial()`
(+ `viewerIsPremium`, `isPremiumMaterial`, `simuladosUsedThisMonth`, `favoritesUsed`).
- **Admin tem acesso total** (role==='admin' conta como premium em todos os helpers).
- **Limites Free:** 2 simulados/mês (`FREE_SIMULADOS_PER_MONTH`), 20 favoritos
  (`FREE_FAVORITES_LIMIT`).
- **Material premium** = apostilas / materiais com editora (`isPremiumMaterial`);
  provas e gabaritos seguem livres. A biblioteca continua **pública (SEO)**: o
  metadado fica visível; bloqueia-se o ACESSO ao arquivo (prévia + modal de upgrade).
- **Reforço REAL no banco** (`supabase/plan_gating.sql`, não burlável pelo client):
  `plan_has_premium()` + `start_simulado` com limite mensal + trigger
  `enforce_favorites_limit` em `saved_materials`.
- **UI:** `src/components/plan/upgrade-modal.tsx` (`UpgradeModal` + `UpgradeButton`)
  — botão leva a `/planos`. Integrado em material-detail (locked), save-material-button
  (limite 20) e simulado-runner (limite 2/mês, `canStart`).

> ⚠️ **Checkout/pagamento ainda não existe** — CTAs levam a `/cadastro?plano=...`.
> Falta o webhook que seta `plan`/`premium_until` (Stripe/Mercado Pago).

---

## Administração (/admin)

- Rota **admin-only**: `isCurrentUserAdmin()` (lê `profiles.role==='admin'`); senão
  `notFound()`.
- **Paginação server-side** (50/página) via `?tab=&page=` — `getAdminMaterials(status,
  page, pageSize, search)` com `.range()` + `count: "exact"`. **Bug histórico
  corrigido:** havia `.limit(200)` que escondia a maioria dos pendentes.
- **Contagens reais:** `getAdminCounts()` (head counts pendentes/aprovados/
  rejeitados/total/posts/simulados).
- **Busca server-side** (`?q=`): `.or(ilike)` em title/description/summary/subject/
  faculdade/vestibular/editora/material_type + `year.eq` quando o termo é ano.
- **Abas:** Pendentes / Todos / Posts / Simulados (links server-side, preservam `q`).
- **Ações por material:** Aprovar, Rejeitar, **Editar** (modal com todos os campos +
  preview do PDF), Excluir (com confirmação; RPC `admin_delete_material` + remoção do
  Storage).
- **Ações em massa** (seleção por checkbox na página atual): aprovar/rejeitar/excluir
  + alterar faculdade/matéria/vestibular/status. Em lotes.
- **Curadoria:** Reclassificar selecionados/página; Corrigir títulos inválidos
  (rápido, por metadados — o caso profundo com PDF é via script).
- **UX:** toasts (`src/components/ui/toast.tsx`), loading states, ComboBox com busca
  (`src/components/ui/combo-box.tsx`).
- **Histórico:** `updated_at` (trigger) + `updated_by` (admin que alterou).
- Componentes: `admin-panel.tsx`, `moderation-card.tsx`, `material-edit-modal.tsx`,
  `bulk-action-bar.tsx`, `post-moderation-card.tsx`, `simulado-admin-card.tsx`.
- Lib: `src/lib/admin.ts`.

> Ações "para TODOS os 900+ pendentes" são feitas pelos **scripts** (que paginam no
> banco), não pela UI (que opera na página atual, para não carregar tudo no client).

---

## Biblioteca

- `/biblioteca` — filtros/busca/paginação **server-side** (`src/lib/materials.ts`,
  `queryMaterials`, `getLibraryFacets`, `getLibraryData`). 24/página. Fallback mock
  só com DB vazio.
- `/biblioteca/[id]` — detalhe + `generateMetadata` por material + **materiais
  relacionados** (mesma matéria) + incremento de views.
- `/biblioteca/enviar` — upload (PDF→bucket `materials`, ou link); `findOrCreateLookup`
  cria faculties/vestibulares com **slug**.
- `/meus-materiais`, `/favoritos` (saved_materials).
- **Organização por matéria/universidade/vestibular** via as colunas de texto +
  catálogo (`src/lib/catalog.ts`).
- **SEO hubs:** `/universidades/[slug]`, `/materias/[slug]`, `/vestibulares/[slug]`
  (índice + slug) com `generateMetadata`/`generateStaticParams`/JSON-LD breadcrumb;
  `sitemap.ts` + `robots.ts`; metadata base + OpenGraph no layout; rodapé
  (`site-footer.tsx`) com linkagem interna. Componentes em `src/components/catalog/`.
- **Catálogo** (`catalog.ts`): 17 universidades (USP, UNICAMP, UNESP, UFSC, UFPR,
  UFMG, UNIFESP, FAMERP, ALBERT EINSTEIN, SANTA CASA, SLMANDIC, UFRJ, FAMEMA, UFSCAR,
  PUC, PUC-SP, ENEM/SISU), 12 matérias, 17 vestibulares. `filter` = valor da coluna.
- **Tipos de material** (`src/lib/material-options.ts`): Apostila, Material teórico,
  Resumo, Revisão, Mapa mental, Lista de exercícios, Caderno de questões, Questões
  discursivas, Questões objetivas, Simulado, Prova, Gabarito, Correção comentada,
  Redação, Discursiva, Edital, Leitura.

---

## Pipeline de Materiais

Objetivo: importar PDFs em massa, classificar e publicar como `pending`.

### Telegram (`scripts/telegram/`)
1. `pull-telegram.mjs` — cliente MTProto (**gramjs**, pacote npm `telegram`); baixa
   PDFs de canais/grupos (config em `sources.json`), calcula **sha256**, entra em
   canais privados por link de convite. Gera `manifest.json`.
2. `normalize.mjs` — classifica (universidade/vestibular/matéria/tipo/editora/
   dificuldade/prioridade/keywords/slug/descrição), extrai texto (pdf-parse), dedup
   por hash → `curated.json`.
3. `ocr.mjs` — OCR de escaneados (Tesseract + Poppler), cache de texto, reclassifica.
4. `ai-classify.mjs` — enriquece com **Claude Haiku** (structured outputs): summary,
   description, tags, dificuldade, matéria, vestibular, universidade. Cache por hash,
   lotes, `--dry`.
5. `import-materials.mjs` — sobe ao bucket + grava em `materials` (service role),
   vincula `faculty_id`/`vestibular_id` (getOrCreate **com slug**), status `pending`,
   dedup por hash (UUID v5). Não aprova/exclui/toca no arquivo.
- `classify-lib.mjs` — heurísticos compartilhados (tabelas de universidades,
  editoras, matérias, tipos; `normalizeTitle`, `cleanTitle`, `slugify`, `keywordsFrom`,
  `computePriority`). `lib.mjs` — loadEnv, log, uuidv5, caches de texto/IA.
- Bloqueio atual: obter `TELEGRAM_API_ID`/`TELEGRAM_API_HASH` no my.telegram.org.

### Importação local (`scripts/import-local/`) — alternativa sem API do Telegram
`ingest.mjs` lê uma **pasta local** de PDFs (inclusive a pasta `files/` de um export
do Telegram Desktop), e `ocr.mjs`/`ai.mjs`/`import.mjs` reaproveitam os scripts do
Telegram via `CURATED_PATH`/`CACHE_DIR`.

### Curadoria (`scripts/admin/`)
- `reclassify-materials.mjs --dry/--apply` — reclassifica metadados (conservador: só
  altera com detecção confiante), com relatório e vínculo de faculty_id/vestibular_id.
- `clean-titles.mjs --dry/--apply` — corrige títulos gravados via `normalizeTitle`.
- `fix-invalid-titles.mjs --dry/--apply [--ocr] [--ai] [--pending]` — detecta títulos
  UUID/hash/genéricos, **baixa o PDF do Storage**, extrai texto (pdf-parse e/ou OCR),
  gera título (heurístico ou Claude Haiku), reclassifica, lista candidatos a
  simulado/prova. Cache de OCR por hash. Só metadados.

---

## OCR

- **Tesseract** (idioma `por`) + **Poppler** (`pdftoppm`) como binários de sistema
  no PATH; rasteriza as primeiras páginas e roda OCR. Guia de instalação em
  `scripts/telegram/README.md`.
- **pdf-parse** para PDFs com camada de texto (sem OCR).
- Usado em `scripts/telegram/ocr.mjs`, `scripts/import-local/ocr.mjs` e
  `scripts/admin/fix-invalid-titles.mjs --ocr`.
- **Problema descoberto:** 126 títulos inválidos vieram de PDFs **escaneados**
  (pdf-parse = 0 texto) → exigem OCR. Solução: `--ocr` no fix-invalid-titles, baixando
  do Storage + cache por hash (`content/admin/cache`).
- Itens que falham mesmo com OCR recebem tag `needs-ocr` (não há coluna dedicada).

---

## Simulados

- Estrutura: `simulados` + `simulado_questions` (+ alternativas jsonb) +
  `simulado_attempts` + `simulado_answers`.
- **Regras oficiais** por banca + **timer persistente** baseado em `started_at`
  (sobrevive a reload). Correção 100% no servidor (`start_simulado`/`finish_simulado`);
  gabarito não vai ao cliente antes de finalizar.
- Runner: `src/components/simulados/simulado-runner.tsx`. Lib: `src/lib/simulados.ts`.
### Simulados Oficiais (IMPLEMENTADO — `supabase/simulados_oficiais.sql`)
Categoria que reproduz os vestibulares. Em vez de tabelas novas, estende as existentes:
- `simulados`: +`kind` (rapido|oficial), `exam_slug`, `exam_day`, `plan_required`
  (free|premium|premium_med), `official_subjects`, `tri_weights`.
- `simulado_attempts`: +`draft_answers`, `flagged`, `time_remaining`, `ends_at`,
  `subject_scores`, `tri_scores` (auto-save + resultado).
- RPCs: `start_simulado` (gating por tipo/plano + `ends_at`), `autosave_attempt`
  (respostas/flags/tempo a cada 30s), `finish_simulado` (calcula desempenho por
  matéria + **TRI estimado** 300–1000 ponderado por dificuldade), `get_simulado_ranking(category)`.
- **Seed das 9 provas** (ENEM 1º/2º dia, FUVEST, UNICAMP, UNESP, UFSC, FAMERP,
  Einstein, Santa Casa, SLMandic) com estrutura oficial aproximada (configurável no
  admin) + **questões representativas autorais** (5/prova) para rodar fim-a-fim. As
  questões REAIS devem ser importadas/cadastradas depois.
- **Gating** (`gating.ts`): rápidos ilimitados p/ todos; oficiais "premium" → Premium
  ilimitado, Free **2/mês**; oficiais "premium_med" (FAMERP/Einstein/Santa Casa/
  SLMandic) → só Premium Medicina. Admin total. `canStartSimulado()` espelha a RPC.
- **Runner** (`simulado-runner.tsx`): cronômetro **HH:MM:SS**, ⭐ "Revisar depois",
  auto-save 30s, restauração do rascunho ao recarregar, resultado com % por matéria + TRI.
- **Páginas:** `/simulados` (Oficiais + Rápidos), `/simulados/exames` + `/exames/[slug]`
  (hubs SEO, no sitemap), `/simulados/historico` (gate: free vê 3, premium completo),
  `/simulados/ranking` (categorias geral/enem/medicina/fuvest/unicamp; free top 5,
  premium top 20). Dashboard: `simulado-charts.tsx` (evolução, por matéria, média).
- Lib: `src/lib/simulados.ts` (`getOfficialSimulados`, `getQuickSimulados`,
  `getSimuladosByExam`, `getSimuladoHistory`, `getSimuladoRanking`, `OFFICIAL_EXAMS`).
- ⚠️ Rota SEO: usamos `/simulados/exames/[slug]` para não colidir com `/simulados/[id]`.

---

## Modo Noturno (IMPLEMENTADO)

- **Tailwind v4 por classe:** `@custom-variant dark` em `globals.css` + variáveis
  `--background`/`--foreground` para `:root` e `.dark`. A classe `.dark` fica no `<html>`.
- **Sem flash:** script inline em `layout.tsx` aplica `.dark` antes da 1ª pintura
  (lê `localStorage['acerte-theme']`, com fallback para `prefers-color-scheme`).
  `<html suppressHydrationWarning>`.
- **Estado:** `src/components/theme/theme-provider.tsx` usa `useSyncExternalStore`
  (fonte da verdade = classe no `<html>`, sem `setState` em efeito — exigência do
  lint `react-hooks/set-state-in-effect`). Toggle em `theme-toggle.tsx` (Sun/Moon),
  presente na navbar (desktop e mobile). Preferência salva em `localStorage`.
- **Cobertura:** navbar, app-shell, biblioteca, simulados, dashboard, admin, planos,
  perfil, feed, ranking, catálogo, auth e UI primitives receberam variantes `dark:`.
  Convenção de paleta: superfícies `bg-white→dark:bg-slate-900`, bordas
  `slate-200→slate-800`, texto `slate-600→slate-300` / `slate-950→white`, botão
  primário `slate-950/white→white/slate-950`, acentos `-500/15` (fundo) e `-300` (texto).

## Trilhas de Estudo (IMPLEMENTADO)

Área central nova: cronogramas guiados por universidade para Medicina.
- **Rotas:** `/trilhas` (lista) e `/trilhas/[slug]` (detalhe). No menu (navbar desktop
  e mobile) e no `sitemap.ts`.
- **Banco:** `supabase/study_tracks.sql` (idempotente, com SEED de 11 trilhas +
  cronograma de 2 semanas cada). Tabelas: `study_tracks`, `study_track_weeks`,
  `study_track_tasks`, `user_track_progress`. RPC `reset_track_progress`. RLS:
  trilhas/semanas/tarefas leitura pública + escrita admin (`is_admin()`); progresso
  own-only. Helper `study_tracks` usa `university`/`vestibular` com os MESMOS valores
  de `materials.faculdade`/`materials.vestibular` para a recomendação reusar a query
  da biblioteca.
- **Lib:** `src/lib/tracks.ts` (`getTracks`, `getTrackBySlug`, `getTrackDetail` com
  semanas+tarefas+progresso+recomendações de materiais/simulados).
- **Gating** (em `src/lib/gating.ts`): `PLAN_RANK`, `viewerPlanRank`, `canAccessTrack`,
  `isTrackWeekUnlocked`. Coluna `plan_required` (free/premium/premium_med) por trilha.
  Free/plano insuficiente: vê lista + prévia + **só a 1ª semana**; resto → modal de
  upgrade. Premium acessa trilhas `premium`; Premium Medicina acessa tudo; admin total.
  No seed: USP/Unicamp/Unesp/UFSC/UFPR/UFMG/Unifesp = `premium`; Famerp/Einstein/
  Santa Casa/SLMandic = `premium_med`.
- **Cronograma:** `src/components/trilhas/track-schedule.tsx` (client) — marcar/desmarcar
  tarefa (upsert/delete em `user_track_progress`), barra de progresso, resetar (RPC),
  "continuar de onde parou", semanas bloqueadas com prévia + `UpgradeButton`.
- **Admin:** aba "Trilhas" (`src/components/admin/track-admin-manager.tsx`) — criar/editar
  trilha, ativar/desativar, definir plano exigido, gerenciar semanas e tarefas
  (vincular material/simulado por id). `getAdminCounts` agora inclui `tracks`.
- **UX:** componentes já nascem com dark mode; cabeçalho premium em gradiente.

## Diagnóstico de Aprovação (IMPLEMENTADO — `supabase/diagnostico_aprovacao.sql`)

Ferramenta de captação/onboarding: avalia o aluno e recomenda trilha + plano.
- **Rotas:** `/diagnostico` (landing + form 10 etapas), `/diagnostico/resultado?id=`
  (resultado), `POST /api/diagnostico` (calcula no servidor e grava).
- **Banco:** tabela `approval_diagnostics` (campos do spec + `result jsonb`). RLS:
  **select** dono/admin; **sem policy de insert** → só service role grava (via API).
  Índices em user_id/created_at/university/plan.
- **Lógica (pura, `src/lib/diagnostico.ts`):** catálogo das perguntas + `sanitizeAnswers`
  (defesa no servidor) + `computeDiagnostic` (score 0–100, perfil, chance, riscos,
  trilha, plano, próximas ações). Score = horas + média + simulados/mês, com
  penalidade (falta de constância −10) e bônus (>4h + simulados +10), normalizado /85.
  Mapa universidade→slug bate com as trilhas (`TRACK_MAP`). ENEM/SISU → fallback `/trilhas`.
- **Plano recomendado:** Medicina → `premium_med` (pitch varia: cronograma se baixa
  constância, simulados oficiais se avançado); não-Medicina → `free` (<40) ou `premium`.
- **Dados server (`src/lib/diagnostico-data.ts`):** `saveDiagnostic` (service role),
  `getDiagnostico(id)` (capability URL via service role — id é UUID), `getAdminDiagnostics`.
- **Form:** `src/components/diagnostico/diagnostic-form.tsx` (multi-step, mobile-first,
  email opcional p/ anônimo). POST → redireciona a `/resultado?id=`.
- **Admin:** aba "Diagnósticos" (`diagnostics-admin.tsx`) — total, score médio, leads/7d,
  por plano, filtros por universidade/plano, lista (email/uni/score/plano/data). Read-only.
- **Marketing:** CTAs em home, `/planos`, `/trilhas`; `/diagnostico` no menu mobile e no
  sitemap; title/description de SEO no spec.
- **Segurança:** score só no servidor; cliente não grava (sem RLS insert); resultado por
  id não-adivinhável; admin lê tudo (RLS).

## Correção de Redação por IA (IMPLEMENTADO — `supabase/redacoes_ai.sql`)

- **Rotas:** `/redacoes` (lista + cota), `/redacoes/nova` (form), `/redacoes/[id]`
  (resultado, prévia limitada p/ Free), `POST /api/redacoes/corrigir`.
- **Banco:** `essay_submissions` (todos os campos do spec + `ai_raw_response jsonb`).
  RLS: **select** dono/admin; **sem insert/update do cliente** → só service role grava
  (a correção é feita no servidor; cliente não burla limite nem forja nota).
- **IA modular** (`src/lib/essay-ai.ts`): via **fetch REST** (sem SDK). `ESSAY_AI_PROVIDER`
  = `anthropic` (default, `ANTHROPIC_API_KEY`, modelo `claude-sonnet-4-6`) ou `openai`
  (`OPENAI_API_KEY`, `gpt-4o-mini`); `ESSAY_AI_MODEL` sobrescreve. Retorna JSON estruturado:
  ENEM por 5 competências (0–200, total 0–1000); demais 0–100 + feedbacks. Disclaimer
  fixo "Esta é uma estimativa automática e não substitui correção oficial."
- **Gating** (`gating.ts`): `canSubmitEssay` — Free 1/mês, Premium 5/mês, Premium Med 30/mês,
  admin ilimitado (validado no servidor + UI). Prévia limitada do resultado p/ Free
  (`viewerIsPremium` libera feedback completo).
- **Dados** (`src/lib/redacoes-data.ts`): create/apply/markFailed (service role),
  getMySubmissions, getSubmission (RLS), getEssayDashboard, getAdminEssays.
- **Admin:** aba "Redações" (`essays-admin.tsx`) — total, score médio, por tipo, top
  usuários, filtros (tipo/status/plano), lista. `getAdminCounts` inclui `essays`.
- **Dashboard:** `essay-dashboard.tsx` (total, média, evolução SVG, ponto fraco, CTA).
- **Fluxo:** valida usuário+limite → insere `processing` → chama IA → `completed`/`failed`
  → redireciona a `/redacoes/[id]`. Falha não consome cota.
- **Segurança:** chave da IA só no servidor; texto sanitizado (≥50 palavras, ≤8000 chars);
  resposta bruta salva p/ auditoria; status `failed` com mensagem amigável.
- **Risco:** a correção roda síncrona na rota (IA pode levar ~10–30s) → atenção ao
  timeout do serverless; futuro: processar em background/fila.

## Feed Social

- `/feed` (requer auth). Posts com avatar/nome/@username clicáveis, **curtir**,
  **comentar**, **salvar**. `likes` polimórfico; `saved_posts`.
- Componentes: `feed/post-card.tsx`, `feed/create-post.tsx`. Lib: `src/lib/feed.ts`,
  `feed-types.ts`. Autor exibe **badge de plano**.

---

## Perfil

- `/perfil` (redirect) e `/perfil/[username]` (público) — renderiza o mesmo
  `PublicProfile` para próprio e público.
- **Cabeçalho** estilo LinkedIn: **capa** (upload no bucket `avatars`, fallback
  gradiente) + **avatar** em camada `z-10` (não é coberto pela capa) + nome +
  `@username` + **badge de plano** abaixo do nome.
- **Avatar** (`profile-avatar.tsx`, tamanhos sm/md/lg/xl, ring branco).
- **Abas** (`profile-tabs.tsx`): Visão geral / Conquistas / Atividade.
- **Conquistas/Badges** (`src/lib/achievements.ts` + `user_badges` + `sync_user_badges`)
  — concessão automática por categoria, com progresso.
- **Sequência de estudos** (`study_streak`/`last_activity_at`) atualizada por triggers
  em post/comentário/material/simulado/tarefa.
- **Estatísticas reais:** materiais, posts, comentários, simulados, curtidas,
  reputação, posição (#) no ranking.
- Edição: `/configuracoes/perfil` (`edit-profile-form.tsx`) — dados públicos + upload
  de avatar e capa. Plano/badges são automáticos (não editáveis pelo usuário).

---

## Monetização

- **Página `/planos`** — 3 planos com features e CTAs (valores R$0/R$19/R$39).
- **Landing `/premium-medicina`** — página de vendas (hero, benefícios, universidades,
  biblioteca premium, simulados, depoimentos placeholder, FAQ com JSON-LD, CTA).
- Doc de design: `documentos do produto/monetizacao.md`.

### Checkout (IMPLEMENTADO — Mercado Pago Assinaturas)
- **Gateway:** Mercado Pago **Preapproval** (assinatura recorrente mensal) via REST
  (`fetch`, sem SDK). Lib: `src/lib/mercadopago.ts` (createPreapproval, getPreapproval,
  getPayment, verifyWebhookSignature HMAC, PAID_PLANS premium=19/premium_med=39).
- **Rotas:** `GET/POST /api/checkout/premium`, `/api/checkout/premium-med`
  (`src/lib/checkout.ts` → não logado redireciona p/ `/cadastro?plano=`; logado cria
  preapproval e redireciona ao init_point) e `POST /api/mercado-pago/webhook`.
- **Webhook:** valida `x-signature`; em produção rejeita assinatura inválida (401);
  registra tudo em `payment_events`; atualiza `profiles.plan`/`premium_until` e
  `subscriptions` via **service role** (`src/lib/supabase/admin.ts`). authorized→ativa,
  cancelled→free, payment approved→renova +1 mês.
- **Páginas:** `/checkout/success|failure|pending`. `/planos` e `/premium-medicina`
  agora apontam os CTAs pagos para as rotas de checkout.
- **Banco:** `supabase/payments.sql` — `subscriptions`, `payment_events`, RLS
  (leitura own/admin; escrita só service role) + **trigger `protect_plan_columns`**
  que impede o usuário de trocar `plan`/`premium_until` manualmente (só service
  role/admin). Espelha a falha que existia na policy `profiles_update_own`.
- **Env (servidor, sem `NEXT_PUBLIC_`):** `SUPABASE_SERVICE_ROLE_KEY`,
  `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_WEBHOOK_SECRET` + `NEXT_PUBLIC_SITE_URL`.
  Guia completo: `MERCADO_PAGO.md`.
- ⚠️ Mapeamento de pagamento recorrente→usuário depende de `external_reference`
  (`<userId>:<plan>`). Renovação mensal via payment só estende se o pagamento trouxer
  o external_reference; a concessão/cancelamento principais vêm do preapproval.

---

## Problemas Resolvidos

- **Limite de 200 no admin:** `getAdminMaterials` tinha `.limit(200)` → paginação
  server-side (commit `77cb37d`).
- **Slugs NOT NULL (23502):** inserts em faculties/vestibulares sem slug → fornecer
  `slug` (`upload-material-form`, `import-materials` getOrCreate, seeds).
- **ON CONFLICT (name) (42P10):** name não é unique no banco real → usar
  `WHERE NOT EXISTS` por slug.
- **faculdades x faculties:** a tabela é `faculties` (a coluna de texto em materials é
  `faculdade`).
- **Títulos com prefixo numérico** ("999 …") e **extensão colada** ("…ORIENTADASpdf")
  e **prefixos "5 B"/"12 A"** → `normalizeTitle` (`src/lib/title.ts` +
  `classify-lib.mjs`), preservando contagens ("1000 questões"), seções ("13.7"),
  siglas (ENEM/UECE/ITA/…) e títulos já em **caixa mista** (não rebaixa
  "(Amarela)"/"(Q e Y)").
- **Títulos inválidos (UUID/hash):** `fix-invalid-titles.mjs` (+ OCR).
- **Reclassificação agressiva:** detectores conservadores (só altera com confiança).
- **Paginação e busca no admin.**

---

## Próximas Tarefas

**Prioridade Alta:**
- ✅ **Modo noturno** — IMPLEMENTADO (ver seção "Modo Noturno").
- ✅ **Gating por plano** — IMPLEMENTADO (ver "Sistema de Planos"). Pré-requisito
  para o usuário rodar no banco: **`supabase/plan_gating.sql`**.
- ✅ **Integração de pagamento (checkout + webhook)** — IMPLEMENTADO (Mercado Pago,
  ver "Checkout" em Monetização). Pré-requisito p/ produção: rodar `payments.sql` +
  configurar as env vars + cadastrar o webhook no painel do MP (ver `MERCADO_PAGO.md`).
- **Recursos exclusivos do Premium Medicina** ainda a ligar: simulados oficiais por
  banca, correção de redação, cronograma personalizado (trilhas já existem). Hoje
  `isPremiumMed()` existe mas poucas features são exclusivas dele.
- OCR avançado / melhorias de SEO.

**Prioridade Média:** app mobile, IA de recomendação, cronograma inteligente,
simulados inteligentes.

**Prioridade Baixa:** marketplace, recursos sociais avançados.

---

## Convenções Importantes

- **Libs de dados** em `src/lib/*.ts`. Server: `@/lib/supabase/server`; client:
  `useAuth` de `@/components/auth/auth-provider`.
- **Toda query** em try/catch → `console.error` + retorna vazio/0 (nunca quebra a
  página). Helper `getSupabaseErrorMessage` (`src/lib/supabase-errors.ts`).
- **Normalização de dados** centralizada nas libs (ex.: `cleanMaterialTitle` aplicado
  em materials/admin/feed/profile/dashboard) — corrige a UI sem migração.
- **Lógica espelhada TS ↔ .mjs:** `src/lib/title.ts` ↔ `scripts/telegram/classify-lib.mjs`
  (e `reclassify.ts` ↔ detectores dos scripts). Comentário "manter em sincronia".
  Motivo: fronteira TS/.mjs (tsc não compila .mjs dos scripts).
- **SQL idempotente** (add column if not exists, drop policy if exists, WHERE NOT
  EXISTS, `not valid` em checks). Sempre com bloco de verificação no fim.
- **RLS:** leitura pública do conteúdo aprovado; escrita do dono; admin via
  `is_admin()` (`materials_admin_update`); writes de badges só via função security
  definer; favoritos/tarefas own-only. Scripts usam **service_role** (ignora RLS).
- **Segurança/curadoria:** scripts nunca aprovam/excluem automaticamente nem alteram
  o arquivo físico — só metadados, em lotes.
- **Commits:** mensagem em PT-BR, terminam com
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Rodar lint+tsc+build
  antes de commitar. Empurrar para `origin/main` (deploy Vercel).
- **`.gitignore`:** ignora `.env*`, `content/telegram/`, `content/import-local/`,
  `content/admin/`, `scripts/telegram/sources.json` (PDFs/caches/credenciais).

---

## Histórico de Commits Relevantes

(Mais recentes primeiro; foco em mudanças de arquitetura.)

- `49294bb` — normalizeTitle: só normaliza caixa quando o título é "cru" (preserva
  caixa mista, ex.: "(Amarela)", "(Q e Y)").
- `a265dd7` — normalizeTitle: preserva contagens ("1000 questões") e siglas
  (UECE/ITA/IME).
- `9c741cd` — Normalização de títulos: extensão colada, prefixos "5 B", Title Case.
- `038bc28` — Admin: busca server-side de materiais.
- `77cb37d` — Admin: paginação server-side (remove o `.limit(200)`).
- `03338e6` — fix-invalid-titles: OCR (Tesseract/Poppler) para PDFs escaneados.
- `94be7a8` — Curadoria de títulos inválidos (lê o PDF e gera título).
- `5c9cadf` — Remove prefixos numéricos artificiais dos títulos.
- `95bdaed` — Curadoria: reclassificação de materiais + hubs SEO completos.
- `f820670` — Admin: ações em massa na moderação.
- `1cbd1c4` — Moderação: edição completa de materiais pelo admin (modal + updated_by).
- `6871694` — Auditoria SQL × banco real: corrige slug/ON CONFLICT nos lookups.
- `48cbf75` — Perfil: badge de plano abaixo do nome + correção do banner.
- `411ec13` — Badge de plano do usuário (free/premium/premium_med) em todo lugar.
- `f1eef06` — Monetização: planos (Gratuito / Premium / Premium Medicina) + /planos.
- `dfa7ae1` — Favoritos, materiais relacionados e SEO de material.
- `4f3d10d` — SEO: hubs de universidades, matérias e vestibulares + sitemap/robots.
- `2d5fa9f` — Biblioteca escala: filtros/busca/paginação no servidor.
- `b88482a` — Pipeline de ingestão local (sem API do Telegram).
- `eb24720` — OCR (Tesseract) e classificação por IA (Claude Haiku) no pipeline.
- `f1827dc` — Pipeline de ingestão de materiais do Telegram.
- `b4b862d` — Reformulação do Perfil: capa, sequência, conquistas e atividade.
- (commit da landing `/premium-medicina`: `2927801`.)

> Para detalhes de qualquer commit: `git show <hash>`. Para o estado atual:
> `git log --oneline`.

---

## Como continuar (checklist para nova sessão)

1. Ler este arquivo + `AGENTS.md` (Next.js modificado).
2. Lembrar: **sem acesso ao banco** — SQL/scripts são entregues para o usuário rodar.
3. Antes de commitar: `npm run lint && npx tsc --noEmit && npm run build`.
   (Se `build` falhar com `spawn UNKNOWN`, `rm -rf .next` e repetir.)
4. Próxima prioridade: **modo noturno** e **gating por plano** (helpers no servidor +
   modal de upgrade), conforme a seção "Próximas Tarefas".
