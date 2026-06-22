# AcertaVest

Plataforma web para vestibulandos de Medicina compartilharem provas, simulados,
resumos e materiais de estudo.

## Stack

- Next.js com App Router
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase PostgreSQL
- Deploy preparado para Vercel

## Como rodar

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## Supabase

Crie um projeto no Supabase e copie `.env.example` para `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua-chave-publicavel
```

Depois execute o SQL em `supabase/schema.sql` no SQL Editor do Supabase para
criar as tabelas iniciais, políticas de acesso e o gatilho que cria o perfil
automaticamente após o cadastro.

O schema também cria a estrutura da Biblioteca:

- `vestibulares`: lista de vestibulares usada para organizar os materiais
- `faculties`: lista de faculdades usada para organizar os materiais
- `materials`: materiais com vestibular, faculdade, ano, matéria, tipo,
  arquivo/link, tags, status de aprovação e contador de visualizações
- `saved_materials`: materiais salvos por usuário
- `increment_material_view`: função usada pela página individual para contar
  visualizações
- bucket público `materials` no Supabase Storage, aceitando PDF, JPG, PNG e WebP

O feed da comunidade usa:

- `posts`: publicações com texto, tags e material anexado
- `likes`: curtidas de posts e materiais por usuário
- `comments`: comentários dos posts
- `saved_posts`: posts salvos por usuário

O perfil público usa campos adicionais em `profiles`, incluindo `username`,
`avatar_url`, `bio`, `dream_faculty`, `target_exams`, `state`, `streak_days` e
`badges`.

O ranking usa:

- `likes`: curtidas recebidas em materiais
- `calculate_reputation`: função que calcula reputação por usuário
- `get_reputation_ranking`: função que retorna ranking geral ou filtrado

Pontuação:

- Material aprovado: +20
- Curtida recebida em material: +2
- Salvamento recebido em material: +5
- Comentário ajudando outro aluno: +3
- Post publicado: +5

## Rotas

- `/` Home
- `/login` Login com Supabase Auth
- `/cadastro` Cadastro com Supabase Auth
- `/dashboard` Painel do estudante
- `/biblioteca` Biblioteca de materiais
- `/biblioteca/[id]` Página individual do material
- `/biblioteca/enviar` Envio de PDF, imagem ou link externo
- `/meus-materiais` Materiais enviados pelo usuário
- `/feed` Comunidade
- `/perfil` Perfil do estudante
- `/perfil/[username]` Perfil público do estudante
- `/configuracoes/perfil` Edição de perfil
- `/ranking` Ranking

## Deploy na Vercel

No painel da Vercel, configure as mesmas variáveis de ambiente:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Em seguida faça o deploy normalmente como projeto Next.js.
