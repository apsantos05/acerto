-- ACERTE — Seed de simulados (questões AUTORAIS). Idempotente por título.
-- Pré-requisito: supabase/simulados.sql (tabelas + RLS + RPCs).

do $$
declare sid uuid;
begin
  select id into sid from public.simulados where title = 'Simulado FUVEST Medicina';
  if sid is null then
    insert into public.simulados (title, description, vestibular, faculty, duration_minutes, difficulty, subjects, question_count, status)
    values ('Simulado FUVEST Medicina', 'Simulado autoral no estilo FUVEST: questões conteudistas e interdisciplinares de Biologia, Química, Física e Matemática. Questões originais, não copiadas de provas oficiais.', 'FUVEST', 'USP', 60, 'médio', ARRAY['Biologia','Química','Física','Matemática']::text[], 5, 'published')
    returning id into sid;

    insert into public.simulado_questions (simulado_id, subject, question_text, alternatives, correct_answer, explanation, difficulty, order_index) values
    (sid, 'Biologia', 'Em células eucarióticas, a maior parte do ATP produzido por fosforilação oxidativa é gerada em qual organela?', '{"A":"Ribossomo","B":"Complexo golgiense","C":"Mitocôndria","D":"Lisossomo","E":"Retículo endoplasmático rugoso"}'::jsonb, 'C', 'A fosforilação oxidativa ocorre na membrana interna das mitocôndrias, onde a cadeia transportadora de elétrons gera a maior parte do ATP celular.', 'fácil', 1),
    (sid, 'Química', 'Na combustão completa do metano (CH4), quantos mols de O2 são consumidos por mol de metano? (CH4 + 2 O2 → CO2 + 2 H2O)', '{"A":"0,5","B":"1","C":"2","D":"3","E":"4"}'::jsonb, 'C', 'Pela equação balanceada, 1 mol de CH4 reage com 2 mols de O2, produzindo 1 mol de CO2 e 2 mols de H2O.', 'médio', 2),
    (sid, 'Física', 'Um corpo parte do repouso com aceleração constante de 2 m/s². Qual é sua velocidade após 5 s?', '{"A":"2 m/s","B":"5 m/s","C":"7 m/s","D":"10 m/s","E":"25 m/s"}'::jsonb, 'D', 'Como parte do repouso, v = a·t = 2 · 5 = 10 m/s.', 'fácil', 3),
    (sid, 'Matemática', 'Seja a função f(x) = 2x + 3. Qual é o valor de f(4)?', '{"A":"8","B":"9","C":"10","D":"11","E":"14"}'::jsonb, 'D', 'f(4) = 2·4 + 3 = 8 + 3 = 11.', 'fácil', 4),
    (sid, 'Biologia', 'No cruzamento entre dois indivíduos heterozigotos (Aa × Aa), para um gene com dominância completa, qual é a proporção fenotípica esperada na descendência?', '{"A":"1 : 1","B":"3 : 1","C":"1 : 2 : 1","D":"9 : 3 : 3 : 1","E":"1 : 3 inverso"}'::jsonb, 'B', 'Aa × Aa gera 1 AA : 2 Aa : 1 aa. Com dominância completa, AA e Aa têm o mesmo fenótipo, resultando em 3 dominantes : 1 recessivo.', 'médio', 5);
  end if;
end;
$$;

do $$
declare sid uuid;
begin
  select id into sid from public.simulados where title = 'Simulado UNICAMP Medicina';
  if sid is null then
    insert into public.simulados (title, description, vestibular, faculty, duration_minutes, difficulty, subjects, question_count, status)
    values ('Simulado UNICAMP Medicina', 'Simulado autoral no estilo UNICAMP: questões contextualizadas com foco em interpretação, aplicação e raciocínio. Questões originais.', 'UNICAMP', 'UNICAMP', 60, 'médio', ARRAY['Biologia','Química','Física','Matemática']::text[], 5, 'published')
    returning id into sid;

    insert into public.simulado_questions (simulado_id, subject, question_text, alternatives, correct_answer, explanation, difficulty, order_index) values
    (sid, 'Biologia', 'Em uma cadeia alimentar, considere que apenas cerca de 10% da energia é transferida de um nível trófico ao seguinte. Se os produtores fixam 10.000 kcal, aproximadamente quanta energia chega aos consumidores secundários?', '{"A":"9.000 kcal","B":"5.000 kcal","C":"1.000 kcal","D":"100 kcal","E":"10 kcal"}'::jsonb, 'D', 'Produtores 10.000 → consumidores primários ~1.000 (10%) → consumidores secundários ~100 (10% de 1.000).', 'médio', 1),
    (sid, 'Química', 'Uma solução aquosa apresenta concentração de íons H+ igual a 1 × 10⁻³ mol/L. Qual é o pH dessa solução?', '{"A":"1","B":"2","C":"3","D":"7","E":"11"}'::jsonb, 'C', 'pH = -log[H+] = -log(10⁻³) = 3.', 'médio', 2),
    (sid, 'Física', 'Um objeto de 2 kg está a 5 m de altura em relação ao solo. Considerando g = 10 m/s², qual é sua energia potencial gravitacional?', '{"A":"10 J","B":"25 J","C":"50 J","D":"100 J","E":"1000 J"}'::jsonb, 'D', 'Ep = m·g·h = 2 · 10 · 5 = 100 J.', 'fácil', 3),
    (sid, 'Matemática', 'Em um município, foram registrados 2.000 casos de uma doença, dos quais 40% ocorreram em jovens. Quantos casos ocorreram em jovens?', '{"A":"400","B":"600","C":"800","D":"1.200","E":"40"}'::jsonb, 'C', '40% de 2.000 = 0,40 · 2.000 = 800 casos.', 'fácil', 4),
    (sid, 'Biologia', 'Durante um exercício físico intenso, a frequência respiratória aumenta. O principal estímulo para esse aumento é a elevação da concentração sanguínea de qual gás?', '{"A":"Oxigênio (O2)","B":"Gás carbônico (CO2)","C":"Nitrogênio (N2)","D":"Hidrogênio (H2)","E":"Hélio (He)"}'::jsonb, 'B', 'O aumento de CO2 (e a consequente queda do pH sanguíneo) é detectado por quimiorreceptores, que estimulam o centro respiratório a aumentar a ventilação.', 'médio', 5);
  end if;
end;
$$;

do $$
declare sid uuid;
begin
  select id into sid from public.simulados where title = 'Simulado ENEM Medicina';
  if sid is null then
    insert into public.simulados (title, description, vestibular, faculty, duration_minutes, difficulty, subjects, question_count, status)
    values ('Simulado ENEM Medicina', 'Simulado autoral no estilo ENEM: questões contextualizadas por competências e habilidades, com foco em Ciências da Natureza, Matemática e Linguagens. Questões originais.', 'ENEM', 'ENEM / SISU', 60, 'fácil', ARRAY['Biologia','Química','Física','Matemática','Linguagens']::text[], 5, 'published')
    returning id into sid;

    insert into public.simulado_questions (simulado_id, subject, question_text, alternatives, correct_answer, explanation, difficulty, order_index) values
    (sid, 'Biologia', 'As campanhas de vacinação são essenciais para a saúde pública. Do ponto de vista imunológico, as vacinas atuam principalmente estimulando o organismo a produzir:', '{"A":"antígenos patogênicos","B":"anticorpos e células de memória","C":"hemácias","D":"plaquetas","E":"insulina"}'::jsonb, 'B', 'A vacina apresenta antígenos atenuados/inativados que induzem a produção de anticorpos e a formação de células de memória, garantindo resposta rápida em futuras exposições.', 'fácil', 1),
    (sid, 'Química', 'O aumento da concentração de gás carbônico (CO2) na atmosfera, decorrente da queima de combustíveis fósseis, está associado principalmente a qual fenômeno ambiental?', '{"A":"Chuva ácida","B":"Destruição da camada de ozônio","C":"Intensificação do efeito estufa","D":"Eutrofização das águas","E":"Inversão térmica"}'::jsonb, 'C', 'O CO2 é um gás de efeito estufa; seu acúmulo intensifica a retenção de calor na atmosfera, contribuindo para o aquecimento global.', 'fácil', 2),
    (sid, 'Física', 'Um aparelho elétrico de potência 100 W permanece ligado por 10 horas. Qual é a energia elétrica consumida nesse período?', '{"A":"10 Wh","B":"100 Wh","C":"1 kWh","D":"10 kWh","E":"100 kWh"}'::jsonb, 'C', 'E = P · t = 100 W · 10 h = 1.000 Wh = 1 kWh.', 'médio', 3),
    (sid, 'Matemática', 'Um estudante obteve as notas 6, 7, 8 e 9 em quatro avaliações. Qual é a média aritmética dessas notas?', '{"A":"6,0","B":"7,0","C":"7,5","D":"8,0","E":"30,0"}'::jsonb, 'C', 'Média = (6 + 7 + 8 + 9) / 4 = 30 / 4 = 7,5.', 'fácil', 4),
    (sid, 'Linguagens', 'Leia o trecho: "A leitura amplia horizontes, desenvolve o senso crítico e forma cidadãos mais conscientes." A ideia central defendida no texto é que a leitura:', '{"A":"é uma atividade dispensável","B":"contribui para a formação crítica e cidadã","C":"substitui completamente a escola","D":"serve apenas como entretenimento","E":"prejudica o raciocínio"}'::jsonb, 'B', 'O trecho associa a leitura ao desenvolvimento do senso crítico e à formação de cidadãos conscientes, o que corresponde diretamente à alternativa B.', 'fácil', 5);
  end if;
end;
$$;

do $$
declare sid uuid;
begin
  select id into sid from public.simulados where title = 'Simulado UNESP Medicina';
  if sid is null then
    insert into public.simulados (title, description, vestibular, faculty, duration_minutes, difficulty, subjects, question_count, status)
    values ('Simulado UNESP Medicina', 'Simulado autoral no estilo UNESP, com foco em Biologia e Química aplicadas à área da saúde. Questões originais.', 'UNESP', 'UNESP', 30, 'fácil', ARRAY['Biologia','Química']::text[], 3, 'published')
    returning id into sid;

    insert into public.simulado_questions (simulado_id, subject, question_text, alternatives, correct_answer, explanation, difficulty, order_index) values
    (sid, 'Biologia', 'No corpo humano, o sistema responsável pelo transporte de oxigênio e nutrientes às células é o sistema:', '{"A":"digestório","B":"circulatório","C":"nervoso","D":"urinário","E":"esquelético"}'::jsonb, 'B', 'O sistema circulatório, por meio do sangue impulsionado pelo coração, transporta oxigênio, nutrientes e remove resíduos das células.', 'fácil', 1),
    (sid, 'Química', 'Na molécula de água (H2O), o tipo de ligação química entre os átomos de hidrogênio e oxigênio é:', '{"A":"iônica","B":"metálica","C":"covalente polar","D":"covalente apolar","E":"ponte de hidrogênio"}'::jsonb, 'C', 'H e O compartilham elétrons (ligação covalente). Como o oxigênio é mais eletronegativo, a ligação é covalente polar.', 'médio', 2),
    (sid, 'Biologia', 'A molécula que armazena a informação genética e é formada por unidades chamadas nucleotídeos é o:', '{"A":"aminoácido","B":"DNA","C":"ácido graxo","D":"monossacarídeo","E":"glicerol"}'::jsonb, 'B', 'O DNA é um ácido nucleico formado por nucleotídeos (fosfato, desoxirribose e base nitrogenada) e armazena a informação genética.', 'fácil', 3);
  end if;
end;
$$;

do $$
declare sid uuid;
begin
  select id into sid from public.simulados where title = 'Simulado FAMERP Medicina';
  if sid is null then
    insert into public.simulados (title, description, vestibular, faculty, duration_minutes, difficulty, subjects, question_count, status)
    values ('Simulado FAMERP Medicina', 'Simulado autoral no estilo FAMERP, com foco em fisiologia, química e imunologia básica. Questões originais.', 'FAMERP', 'FAMERP', 30, 'fácil', ARRAY['Biologia','Química']::text[], 3, 'published')
    returning id into sid;

    insert into public.simulado_questions (simulado_id, subject, question_text, alternatives, correct_answer, explanation, difficulty, order_index) values
    (sid, 'Biologia', 'O órgão responsável pela produção do hormônio insulina, que regula a glicemia, é o:', '{"A":"fígado","B":"pâncreas","C":"rim","D":"baço","E":"estômago"}'::jsonb, 'B', 'As células beta das ilhotas pancreáticas (pâncreas) produzem insulina, hormônio que reduz a glicemia favorecendo a captação de glicose pelas células.', 'fácil', 1),
    (sid, 'Química', 'A 25 °C, o pH de uma solução aquosa neutra é igual a:', '{"A":"0","B":"1","C":"7","D":"10","E":"14"}'::jsonb, 'C', 'Em solução neutra a 25 °C, [H+] = [OH-] = 10⁻⁷ mol/L, logo pH = 7.', 'fácil', 2),
    (sid, 'Biologia', 'As células do sistema imune especializadas na produção de anticorpos são os:', '{"A":"hemácias","B":"plaquetas","C":"linfócitos B","D":"neurônios","E":"osteócitos"}'::jsonb, 'C', 'Os linfócitos B, ao se diferenciarem em plasmócitos, produzem anticorpos específicos contra antígenos.', 'médio', 3);
  end if;
end;
$$;

do $$
declare sid uuid;
begin
  select id into sid from public.simulados where title = 'Simulado UFSC Medicina';
  if sid is null then
    insert into public.simulados (title, description, vestibular, faculty, duration_minutes, difficulty, subjects, question_count, status)
    values ('Simulado UFSC Medicina', 'Simulado autoral no estilo UFSC, com questões de Biologia, Física e Matemática. Questões originais.', 'UFSC', 'UFSC', 30, 'fácil', ARRAY['Biologia','Física','Matemática']::text[], 3, 'published')
    returning id into sid;

    insert into public.simulado_questions (simulado_id, subject, question_text, alternatives, correct_answer, explanation, difficulty, order_index) values
    (sid, 'Biologia', 'Nas células vegetais, o processo de fotossíntese ocorre principalmente em qual organela?', '{"A":"mitocôndria","B":"cloroplasto","C":"núcleo","D":"ribossomo","E":"vacúolo"}'::jsonb, 'B', 'A fotossíntese ocorre nos cloroplastos, que contêm clorofila, pigmento capaz de captar a energia luminosa.', 'fácil', 1),
    (sid, 'Física', 'No Sistema Internacional de Unidades (SI), a unidade de força é o:', '{"A":"joule","B":"watt","C":"newton","D":"pascal","E":"volt"}'::jsonb, 'C', 'A força é medida em newton (N) no SI, sendo 1 N = 1 kg·m/s².', 'fácil', 2),
    (sid, 'Matemática', 'Qual é o valor da potência 2³?', '{"A":"4","B":"6","C":"8","D":"9","E":"16"}'::jsonb, 'C', '2³ = 2 · 2 · 2 = 8.', 'fácil', 3);
  end if;
end;
$$;

select count(*) as simulados, (select count(*) from public.simulado_questions) as questoes from public.simulados;