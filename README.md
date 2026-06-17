# Acerte

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
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
```

Depois execute o SQL em `supabase/schema.sql` no SQL Editor do Supabase para
criar as tabelas iniciais, politicas de acesso e o gatilho de perfil.

## Rotas

- `/` Home
- `/login` Login com Supabase Auth
- `/cadastro` Cadastro com Supabase Auth
- `/dashboard` Painel do estudante
- `/biblioteca` Biblioteca de materiais
- `/feed` Comunidade
- `/perfil` Perfil do estudante
- `/ranking` Ranking

## Deploy na Vercel

No painel da Vercel, configure as mesmas variáveis de ambiente:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Em seguida faça o deploy normalmente como projeto Next.js.
