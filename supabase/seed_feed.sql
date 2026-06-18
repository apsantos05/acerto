-- ACERTE — Seed do feed inicial: perfil 'Acerte Oficial' + 50 posts. Idempotente.
-- Pré-requisito: supabase/admin_role.sql (coluna profiles.role).

-- 1) Usuário de sistema (sem login) para o perfil oficial.
--    Requer pgcrypto (gen_salt/crypt) — habilitado por padrão no Supabase.
--    Alternativa: crie o usuário no painel (Authentication > Add user) e pule este insert.
insert into auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000',
  'ace00000-0000-4000-a000-000000000001',
  'authenticated', 'authenticated', 'oficial@acerte.app',
  crypt('seed-acerte-oficial', gen_salt('bf')), now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Acerte Oficial","username":"acerteoficial"}',
  false, '', '', '', ''
) on conflict (id) do nothing;

-- 2) Perfil oficial (sobrescreve username/role mesmo se a trigger já criou).
insert into public.profiles (id, username, full_name, bio, role)
values ('ace00000-0000-4000-a000-000000000001', 'acerteoficial', 'Acerte Oficial', 'Perfil oficial da comunidade Acerte.', 'official')
on conflict (id) do update set
  username = excluded.username,
  full_name = excluded.full_name,
  bio = excluded.bio,
  role = excluded.role;

-- 3) 50 posts iniciais (não duplica: insere só se ainda não existir o mesmo conteúdo do autor).
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Qual foi sua nota na redação da FUVEST? Como vocês treinam pra chegar lá?', ARRAY['dúvida']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Qual foi sua nota na redação da FUVEST? Como vocês treinam pra chegar lá?');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Como vocês estudam Biologia pra Medicina? Por onde começar?', ARRAY['dúvida']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Como vocês estudam Biologia pra Medicina? Por onde começar?');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Qual matéria mais derruba vocês no vestibular?', ARRAY['dúvida']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Qual matéria mais derruba vocês no vestibular?');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Vale a pena fazer simulado toda semana ou é melhor espaçar?', ARRAY['dúvida']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Vale a pena fazer simulado toda semana ou é melhor espaçar?');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Quantas horas por dia vocês conseguem estudar de verdade (sem se enganar)?', ARRAY['dúvida']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Quantas horas por dia vocês conseguem estudar de verdade (sem se enganar)?');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Como organizar o cronograma pra dar conta da 1ª e da 2ª fase da FUVEST?', ARRAY['dúvida']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Como organizar o cronograma pra dar conta da 1ª e da 2ª fase da FUVEST?');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Química orgânica: alguém tem um método que realmente funcionou?', ARRAY['dúvida']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Química orgânica: alguém tem um método que realmente funcionou?');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Como vocês fixam as fórmulas de Física sem enlouquecer?', ARRAY['dúvida']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Como vocês fixam as fórmulas de Física sem enlouquecer?');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Qual a melhor estratégia pra redação do ENEM, competência por competência?', ARRAY['dúvida']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Qual a melhor estratégia pra redação do ENEM, competência por competência?');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Vocês fazem resumo ou preferem flashcards? O que rende mais pra revisão?', ARRAY['dúvida']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Vocês fazem resumo ou preferem flashcards? O que rende mais pra revisão?');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Como lidar com a ansiedade na semana da prova?', ARRAY['dúvida']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Como lidar com a ansiedade na semana da prova?');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Pra UNICAMP, como treinar as questões discursivas da 2ª fase?', ARRAY['dúvida']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Pra UNICAMP, como treinar as questões discursivas da 2ª fase?');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Alguém indica como revisar as leituras obrigatórias da FUVEST sem ler tudo de novo?', ARRAY['dúvida']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Alguém indica como revisar as leituras obrigatórias da FUVEST sem ler tudo de novo?');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Quantas questões dá pra errar e ainda passar em Medicina na FUVEST?', ARRAY['dúvida']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Quantas questões dá pra errar e ainda passar em Medicina na FUVEST?');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Como vocês mantêm a constância nos estudos por tantos meses?', ARRAY['dúvida']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Como vocês mantêm a constância nos estudos por tantos meses?');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Inglês cai bastante? Vale a pena focar ou deixar por último?', ARRAY['dúvida']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Inglês cai bastante? Vale a pena focar ou deixar por último?');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Genética é o meu terror. Alguma dica de como estudar de forma que fixe?', ARRAY['dúvida']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Genética é o meu terror. Alguma dica de como estudar de forma que fixe?');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Como equilibrar revisão de conteúdo antigo com a matéria nova?', ARRAY['dúvida']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Como equilibrar revisão de conteúdo antigo com a matéria nova?');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Vocês usam provas antigas como base? De quantos anos atrás vale a pena?', ARRAY['dúvida']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Vocês usam provas antigas como base? De quantos anos atrás vale a pena?');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Como melhorar a interpretação de texto e ganhar velocidade nas provas longas?', ARRAY['dúvida']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Como melhorar a interpretação de texto e ganhar velocidade nas provas longas?');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Dica: resolva uma prova antiga inteira por semana e cronometre. Muda o jogo.', ARRAY['dica']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Dica: resolva uma prova antiga inteira por semana e cronometre. Muda o jogo.');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Dica: pra redação, monte um banco de repertório por eixo (meio ambiente, tecnologia, saúde, educação).', ARRAY['dica']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Dica: pra redação, monte um banco de repertório por eixo (meio ambiente, tecnologia, saúde, educação).');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Dica: use revisão espaçada (24h, 7 dias, 30 dias) e veja a retenção disparar.', ARRAY['dica']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Dica: use revisão espaçada (24h, 7 dias, 30 dias) e veja a retenção disparar.');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Dica: em Biologia, priorize o que mais cai pra Medicina: citologia, genética e fisiologia.', ARRAY['dica']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Dica: em Biologia, priorize o que mais cai pra Medicina: citologia, genética e fisiologia.');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Dica: mantenha um caderno de erros e revise ele antes de cada simulado.', ARRAY['dica']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Dica: mantenha um caderno de erros e revise ele antes de cada simulado.');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Dica: na 2ª fase da FUVEST/UNICAMP, treine resposta objetiva e direta ao comando da questão.', ARRAY['dica']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Dica: na 2ª fase da FUVEST/UNICAMP, treine resposta objetiva e direta ao comando da questão.');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Dica: estude por questões, não só por teoria. O vestibular cobra aplicação.', ARRAY['dica']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Dica: estude por questões, não só por teoria. O vestibular cobra aplicação.');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Dica: durma bem. Noite mal dormida derruba mais nota que falta de conteúdo.', ARRAY['dica']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Dica: durma bem. Noite mal dormida derruba mais nota que falta de conteúdo.');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Dica: em Química, domine estequiometria e termoquímica. É base pra quase tudo.', ARRAY['dica']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Dica: em Química, domine estequiometria e termoquímica. É base pra quase tudo.');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Dica: leia o resumo das obras obrigatórias e complemente com análises confiáveis.', ARRAY['dica']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Dica: leia o resumo das obras obrigatórias e complemente com análises confiáveis.');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Dica: simulado sem correção e análise não conta. O ouro está em revisar os erros.', ARRAY['dica']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Dica: simulado sem correção e análise não conta. O ouro está em revisar os erros.');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Dica: defina metas semanais realistas e marque o que você cumpriu.', ARRAY['dica']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Dica: defina metas semanais realistas e marque o que você cumpriu.');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Dica: em Física, entenda o conceito antes de decorar a fórmula.', ARRAY['dica']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Dica: em Física, entenda o conceito antes de decorar a fórmula.');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Dica: comece a prova pelo que você domina e garanta os pontos fáceis primeiro.', ARRAY['dica']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Dica: comece a prova pelo que você domina e garanta os pontos fáceis primeiro.');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Dica: cuidado com o ''estudar bonito''. Caderno colorido não é aprendizado.', ARRAY['dica']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Dica: cuidado com o ''estudar bonito''. Caderno colorido não é aprendizado.');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Dica: estude por gabaritos comentados, não só pela resposta certa.', ARRAY['dica']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Dica: estude por gabaritos comentados, não só pela resposta certa.');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Dica: pro ENEM, treine gestão de tempo. São muitas questões em poucas horas.', ARRAY['dica']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Dica: pro ENEM, treine gestão de tempo. São muitas questões em poucas horas.');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Dica: agrupe assuntos por afinidade e estude em blocos, não pulando de tema.', ARRAY['dica']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Dica: agrupe assuntos por afinidade e estude em blocos, não pulando de tema.');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Dica: explique a matéria em voz alta. Se travar, você achou a lacuna.', ARRAY['dica']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Dica: explique a matéria em voz alta. Se travar, você achou a lacuna.');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Dica: reserve um dia mais leve na semana. Constância vence intensidade.', ARRAY['dica']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Dica: reserve um dia mais leve na semana. Constância vence intensidade.');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Cada questão que você resolve hoje é um passo a mais rumo ao jaleco. 🤍', ARRAY['motivação']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Cada questão que você resolve hoje é um passo a mais rumo ao jaleco. 🤍');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Não compare seu capítulo 3 com o capítulo 20 de outra pessoa. Siga firme.', ARRAY['motivação']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Não compare seu capítulo 3 com o capítulo 20 de outra pessoa. Siga firme.');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Disciplina vence motivação. Apareça todo dia, mesmo sem vontade.', ARRAY['motivação']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Disciplina vence motivação. Apareça todo dia, mesmo sem vontade.');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'O cansaço é temporário, a aprovação é pra sempre. Bora!', ARRAY['motivação']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'O cansaço é temporário, a aprovação é pra sempre. Bora!');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Você não precisa ser perfeito hoje. Só precisa ser melhor que ontem.', ARRAY['motivação']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Você não precisa ser perfeito hoje. Só precisa ser melhor que ontem.');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Lembra por que você começou. A Medicina vale cada madrugada.', ARRAY['motivação']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Lembra por que você começou. A Medicina vale cada madrugada.');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Plante hoje o que você quer colher no resultado. 🌱', ARRAY['motivação']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Plante hoje o que você quer colher no resultado. 🌱');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Errar no simulado é de graça. Aprenda agora pra acertar na prova.', ARRAY['motivação']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Errar no simulado é de graça. Aprenda agora pra acertar na prova.');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Um dia você vai olhar pra trás e agradecer por não ter desistido.', ARRAY['motivação']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Um dia você vai olhar pra trás e agradecer por não ter desistido.');
insert into public.posts (author_id, content, tags)
select 'ace00000-0000-4000-a000-000000000001', 'Respira. Foca. Continua. Seu nome naquela lista é questão de tempo.', ARRAY['motivação']::text[]
where not exists (select 1 from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001' and content = 'Respira. Foca. Continua. Seu nome naquela lista é questão de tempo.');

select count(*) as posts_do_oficial from public.posts where author_id = 'ace00000-0000-4000-a000-000000000001';