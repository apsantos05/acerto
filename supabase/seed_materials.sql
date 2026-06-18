-- ACERTE — Seed de materiais oficiais (import por LINK). Idempotente (dedup por external_url).
-- Pré-requisito: supabase/material_types.sql (tipos + índice único external_url).

insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2025 - Prova 1º dia (Caderno Azul)', 'ENEM 2025 - Prova 1º dia (Caderno Azul). Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2025, 'Geral', 'Prova', 'https://download.inep.gov.br/enem/provas_e_gabaritos/2025_PV_impresso_D1_CD1.pdf', 'link', 'approved', ARRAY['enem','2025','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2025 - Prova 2º dia (Caderno Amarelo)', 'ENEM 2025 - Prova 2º dia (Caderno Amarelo). Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2025, 'Geral', 'Prova', 'https://download.inep.gov.br/enem/provas_e_gabaritos/2025_PV_impresso_D2_CD5.pdf', 'link', 'approved', ARRAY['enem','2025','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2025 - Gabarito 1º dia', 'ENEM 2025 - Gabarito 1º dia. Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2025, 'Geral', 'Gabarito', 'https://download.inep.gov.br/enem/provas_e_gabaritos/2025_GB_impresso_D1_CD1.pdf', 'link', 'approved', ARRAY['enem','2025','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2025 - Gabarito 2º dia', 'ENEM 2025 - Gabarito 2º dia. Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2025, 'Geral', 'Gabarito', 'https://download.inep.gov.br/enem/provas_e_gabaritos/2025_GB_impresso_D2_CD5.pdf', 'link', 'approved', ARRAY['enem','2025','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2024 - Prova 1º dia (Caderno Azul)', 'ENEM 2024 - Prova 1º dia (Caderno Azul). Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2024, 'Geral', 'Prova', 'https://download.inep.gov.br/enem/provas_e_gabaritos/2024_PV_impresso_D1_CD1.pdf', 'link', 'approved', ARRAY['enem','2024','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2024 - Prova 2º dia (Caderno Amarelo)', 'ENEM 2024 - Prova 2º dia (Caderno Amarelo). Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2024, 'Geral', 'Prova', 'https://download.inep.gov.br/enem/provas_e_gabaritos/2024_PV_impresso_D2_CD5.pdf', 'link', 'approved', ARRAY['enem','2024','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2024 - Gabarito 1º dia', 'ENEM 2024 - Gabarito 1º dia. Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2024, 'Geral', 'Gabarito', 'https://download.inep.gov.br/enem/provas_e_gabaritos/2024_GB_impresso_D1_CD1.pdf', 'link', 'approved', ARRAY['enem','2024','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2024 - Gabarito 2º dia', 'ENEM 2024 - Gabarito 2º dia. Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2024, 'Geral', 'Gabarito', 'https://download.inep.gov.br/enem/provas_e_gabaritos/2024_GB_impresso_D2_CD5.pdf', 'link', 'approved', ARRAY['enem','2024','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2023 - Prova 1º dia (Caderno Azul)', 'ENEM 2023 - Prova 1º dia (Caderno Azul). Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2023, 'Geral', 'Prova', 'https://download.inep.gov.br/enem/provas_e_gabaritos/2023_PV_impresso_D1_CD1.pdf', 'link', 'approved', ARRAY['enem','2023','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2023 - Prova 2º dia (Caderno Amarelo)', 'ENEM 2023 - Prova 2º dia (Caderno Amarelo). Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2023, 'Geral', 'Prova', 'https://download.inep.gov.br/enem/provas_e_gabaritos/2023_PV_impresso_D2_CD5.pdf', 'link', 'approved', ARRAY['enem','2023','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2023 - Gabarito 1º dia', 'ENEM 2023 - Gabarito 1º dia. Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2023, 'Geral', 'Gabarito', 'https://download.inep.gov.br/enem/provas_e_gabaritos/2023_GB_impresso_D1_CD1.pdf', 'link', 'approved', ARRAY['enem','2023','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2023 - Gabarito 2º dia', 'ENEM 2023 - Gabarito 2º dia. Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2023, 'Geral', 'Gabarito', 'https://download.inep.gov.br/enem/provas_e_gabaritos/2023_GB_impresso_D2_CD5.pdf', 'link', 'approved', ARRAY['enem','2023','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2022 - Prova 1º dia (Caderno Azul)', 'ENEM 2022 - Prova 1º dia (Caderno Azul). Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2022, 'Geral', 'Prova', 'https://download.inep.gov.br/enem/provas_e_gabaritos/2022_PV_impresso_D1_CD1.pdf', 'link', 'approved', ARRAY['enem','2022','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2022 - Prova 2º dia (Caderno Amarelo)', 'ENEM 2022 - Prova 2º dia (Caderno Amarelo). Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2022, 'Geral', 'Prova', 'https://download.inep.gov.br/enem/provas_e_gabaritos/2022_PV_impresso_D2_CD5.pdf', 'link', 'approved', ARRAY['enem','2022','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2022 - Gabarito 1º dia', 'ENEM 2022 - Gabarito 1º dia. Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2022, 'Geral', 'Gabarito', 'https://download.inep.gov.br/enem/provas_e_gabaritos/2022_GB_impresso_D1_CD1.pdf', 'link', 'approved', ARRAY['enem','2022','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2022 - Gabarito 2º dia', 'ENEM 2022 - Gabarito 2º dia. Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2022, 'Geral', 'Gabarito', 'https://download.inep.gov.br/enem/provas_e_gabaritos/2022_GB_impresso_D2_CD5.pdf', 'link', 'approved', ARRAY['enem','2022','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2021 - Prova 1º dia (Caderno Azul)', 'ENEM 2021 - Prova 1º dia (Caderno Azul). Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2021, 'Geral', 'Prova', 'https://download.inep.gov.br/enem/provas_e_gabaritos/2021_PV_impresso_D1_CD1.pdf', 'link', 'approved', ARRAY['enem','2021','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2021 - Prova 2º dia (Caderno Amarelo)', 'ENEM 2021 - Prova 2º dia (Caderno Amarelo). Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2021, 'Geral', 'Prova', 'https://download.inep.gov.br/enem/provas_e_gabaritos/2021_PV_impresso_D2_CD5.pdf', 'link', 'approved', ARRAY['enem','2021','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2021 - Gabarito 1º dia', 'ENEM 2021 - Gabarito 1º dia. Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2021, 'Geral', 'Gabarito', 'https://download.inep.gov.br/enem/provas_e_gabaritos/2021_GB_impresso_D1_CD1.pdf', 'link', 'approved', ARRAY['enem','2021','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2021 - Gabarito 2º dia', 'ENEM 2021 - Gabarito 2º dia. Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2021, 'Geral', 'Gabarito', 'https://download.inep.gov.br/enem/provas_e_gabaritos/2021_GB_impresso_D2_CD5.pdf', 'link', 'approved', ARRAY['enem','2021','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2020 - Prova 1º dia (Caderno Azul)', 'ENEM 2020 - Prova 1º dia (Caderno Azul). Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2020, 'Geral', 'Prova', 'https://download.inep.gov.br/enem/provas_e_gabaritos/2020_PV_impresso_D1_CD1.pdf', 'link', 'approved', ARRAY['enem','2020','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2020 - Prova 2º dia (Caderno Amarelo)', 'ENEM 2020 - Prova 2º dia (Caderno Amarelo). Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2020, 'Geral', 'Prova', 'https://download.inep.gov.br/enem/provas_e_gabaritos/2020_PV_impresso_D2_CD5.pdf', 'link', 'approved', ARRAY['enem','2020','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2020 - Gabarito 1º dia', 'ENEM 2020 - Gabarito 1º dia. Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2020, 'Geral', 'Gabarito', 'https://download.inep.gov.br/enem/provas_e_gabaritos/2020_GB_impresso_D1_CD1.pdf', 'link', 'approved', ARRAY['enem','2020','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2020 - Gabarito 2º dia', 'ENEM 2020 - Gabarito 2º dia. Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2020, 'Geral', 'Gabarito', 'https://download.inep.gov.br/enem/provas_e_gabaritos/2020_GB_impresso_D2_CD5.pdf', 'link', 'approved', ARRAY['enem','2020','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2010 - Prova 1º dia (Caderno Azul)', 'ENEM 2010 - Prova 1º dia (Caderno Azul). Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2010, 'Geral', 'Prova', 'https://download.inep.gov.br/educacao_basica/enem/provas/2010/dia1_caderno1_azul.pdf', 'link', 'approved', ARRAY['enem','2010','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2010 - Prova 2º dia (Caderno Amarelo)', 'ENEM 2010 - Prova 2º dia (Caderno Amarelo). Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2010, 'Geral', 'Prova', 'https://download.inep.gov.br/educacao_basica/enem/provas/2010/dia2_caderno5_amarelo.pdf', 'link', 'approved', ARRAY['enem','2010','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2010 - Gabarito 1º dia', 'ENEM 2010 - Gabarito 1º dia. Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2010, 'Geral', 'Gabarito', 'https://download.inep.gov.br/educacao_basica/enem/provas/2010/dia1_caderno1_azul_com_gab.pdf', 'link', 'approved', ARRAY['enem','2010','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2010 - Gabarito 2º dia', 'ENEM 2010 - Gabarito 2º dia. Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2010, 'Geral', 'Gabarito', 'https://download.inep.gov.br/educacao_basica/enem/provas/2010/dia2_caderno5_amarelo_com_gab.pdf', 'link', 'approved', ARRAY['enem','2010','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2011 - Prova 1º dia (Caderno Azul)', 'ENEM 2011 - Prova 1º dia (Caderno Azul). Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2011, 'Geral', 'Prova', 'https://download.inep.gov.br/educacao_basica/enem/provas/2011/dia1_caderno1_azul.pdf', 'link', 'approved', ARRAY['enem','2011','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2011 - Prova 2º dia (Caderno Amarelo)', 'ENEM 2011 - Prova 2º dia (Caderno Amarelo). Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2011, 'Geral', 'Prova', 'https://download.inep.gov.br/educacao_basica/enem/provas/2011/dia2_caderno5_amarelo.pdf', 'link', 'approved', ARRAY['enem','2011','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2011 - Gabarito 1º dia', 'ENEM 2011 - Gabarito 1º dia. Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2011, 'Geral', 'Gabarito', 'https://download.inep.gov.br/educacao_basica/enem/gabaritos/2011/01_AZUL_GABARITO.pdf', 'link', 'approved', ARRAY['enem','2011','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2011 - Gabarito 2º dia', 'ENEM 2011 - Gabarito 2º dia. Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2011, 'Geral', 'Gabarito', 'https://download.inep.gov.br/educacao_basica/enem/gabaritos/2011/05_AMARELO_GABARITO.pdf', 'link', 'approved', ARRAY['enem','2011','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2012 - Prova 1º dia (Caderno Azul)', 'ENEM 2012 - Prova 1º dia (Caderno Azul). Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2012, 'Geral', 'Prova', 'https://download.inep.gov.br/educacao_basica/enem/provas/2012/dia1_caderno1_azul.pdf', 'link', 'approved', ARRAY['enem','2012','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2012 - Prova 2º dia (Caderno Amarelo)', 'ENEM 2012 - Prova 2º dia (Caderno Amarelo). Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2012, 'Geral', 'Prova', 'https://download.inep.gov.br/educacao_basica/enem/provas/2012/dia2_caderno5_amarelo.pdf', 'link', 'approved', ARRAY['enem','2012','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2012 - Gabarito 1º dia', 'ENEM 2012 - Gabarito 1º dia. Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2012, 'Geral', 'Gabarito', 'https://download.inep.gov.br/educacao_basica/enem/gabaritos/2012/dia1_azul.pdf', 'link', 'approved', ARRAY['enem','2012','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2012 - Gabarito 2º dia', 'ENEM 2012 - Gabarito 2º dia. Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2012, 'Geral', 'Gabarito', 'https://download.inep.gov.br/educacao_basica/enem/gabaritos/2012/dia2_amarelo.pdf', 'link', 'approved', ARRAY['enem','2012','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2013 - Prova 1º dia (Caderno Azul)', 'ENEM 2013 - Prova 1º dia (Caderno Azul). Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2013, 'Geral', 'Prova', 'https://download.inep.gov.br/educacao_basica/enem/provas/2013/dia1_caderno1_azul.pdf', 'link', 'approved', ARRAY['enem','2013','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2013 - Prova 2º dia (Caderno Amarelo)', 'ENEM 2013 - Prova 2º dia (Caderno Amarelo). Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2013, 'Geral', 'Prova', 'https://download.inep.gov.br/educacao_basica/enem/provas/2013/dia2_caderno5_amarelo.pdf', 'link', 'approved', ARRAY['enem','2013','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2013 - Gabarito 1º dia', 'ENEM 2013 - Gabarito 1º dia. Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2013, 'Geral', 'Gabarito', 'https://download.inep.gov.br/educacao_basica/enem/gabaritos/2013/dia1_azul.pdf', 'link', 'approved', ARRAY['enem','2013','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2013 - Gabarito 2º dia', 'ENEM 2013 - Gabarito 2º dia. Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2013, 'Geral', 'Gabarito', 'https://download.inep.gov.br/educacao_basica/enem/gabaritos/2013/dia2_amarelo.pdf', 'link', 'approved', ARRAY['enem','2013','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2014 - Prova 1º dia (Caderno Azul)', 'ENEM 2014 - Prova 1º dia (Caderno Azul). Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2014, 'Geral', 'Prova', 'https://download.inep.gov.br/educacao_basica/enem/provas/2014/2014_PV_impresso_D1_CD1.pdf', 'link', 'approved', ARRAY['enem','2014','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2014 - Prova 2º dia (Caderno Amarelo)', 'ENEM 2014 - Prova 2º dia (Caderno Amarelo). Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2014, 'Geral', 'Prova', 'https://download.inep.gov.br/educacao_basica/enem/provas/2014/2014_PV_impresso_D2_CD5.pdf', 'link', 'approved', ARRAY['enem','2014','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2014 - Gabarito 1º dia', 'ENEM 2014 - Gabarito 1º dia. Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2014, 'Geral', 'Gabarito', 'https://download.inep.gov.br/educacao_basica/enem/gabaritos/2014/CADERNO_1_AZUL_SABADO.pdf', 'link', 'approved', ARRAY['enem','2014','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2014 - Gabarito 2º dia', 'ENEM 2014 - Gabarito 2º dia. Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2014, 'Geral', 'Gabarito', 'https://download.inep.gov.br/educacao_basica/enem/gabaritos/2014/CADERNO_5_AMARELO_DOMINGO.pdf', 'link', 'approved', ARRAY['enem','2014','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2015 - Prova 1º dia (Caderno Azul)', 'ENEM 2015 - Prova 1º dia (Caderno Azul). Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2015, 'Geral', 'Prova', 'https://download.inep.gov.br/educacao_basica/enem/provas/2015/2015_PV_impresso_D1_CD1.pdf', 'link', 'approved', ARRAY['enem','2015','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2015 - Prova 2º dia (Caderno Amarelo)', 'ENEM 2015 - Prova 2º dia (Caderno Amarelo). Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2015, 'Geral', 'Prova', 'https://download.inep.gov.br/educacao_basica/enem/provas/2015/2015_PV_impresso_D2_CD5.pdf', 'link', 'approved', ARRAY['enem','2015','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2015 - Gabarito 1º dia', 'ENEM 2015 - Gabarito 1º dia. Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2015, 'Geral', 'Gabarito', 'https://download.inep.gov.br/educacao_basica/enem/gabaritos/2015/CADERNO_1_AZUL_SABADO.pdf', 'link', 'approved', ARRAY['enem','2015','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2015 - Gabarito 2º dia', 'ENEM 2015 - Gabarito 2º dia. Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2015, 'Geral', 'Gabarito', 'https://download.inep.gov.br/educacao_basica/enem/gabaritos/2015/CADERNO_5_AMARELO_DOMINGO.pdf', 'link', 'approved', ARRAY['enem','2015','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2016 - Prova 1º dia (Caderno Azul)', 'ENEM 2016 - Prova 1º dia (Caderno Azul). Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2016, 'Geral', 'Prova', 'https://download.inep.gov.br/educacao_basica/enem/provas/2016/2016_PV_impresso_D1_CD1.pdf', 'link', 'approved', ARRAY['enem','2016','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2016 - Prova 2º dia (Caderno Amarelo)', 'ENEM 2016 - Prova 2º dia (Caderno Amarelo). Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2016, 'Geral', 'Prova', 'https://download.inep.gov.br/educacao_basica/enem/provas/2016/2016_PV_impresso_D2_CD5.pdf', 'link', 'approved', ARRAY['enem','2016','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2016 - Gabarito 1º dia', 'ENEM 2016 - Gabarito 1º dia. Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2016, 'Geral', 'Gabarito', 'https://download.inep.gov.br/educacao_basica/enem/gabaritos/2016/GAB_ENEM_2016_DIA_1_01_AZUL.pdf', 'link', 'approved', ARRAY['enem','2016','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2016 - Gabarito 2º dia', 'ENEM 2016 - Gabarito 2º dia. Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2016, 'Geral', 'Gabarito', 'https://download.inep.gov.br/educacao_basica/enem/gabaritos/2016/GAB_ENEM_2016_DIA_2_05_AMARELO.pdf', 'link', 'approved', ARRAY['enem','2016','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2017 - Prova 1º dia (Caderno Azul)', 'ENEM 2017 - Prova 1º dia (Caderno Azul). Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2017, 'Geral', 'Prova', 'https://download.inep.gov.br/educacao_basica/enem/provas/2017/2017_PV_impresso_D1_CD1.pdf', 'link', 'approved', ARRAY['enem','2017','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2017 - Prova 2º dia (Caderno Amarelo)', 'ENEM 2017 - Prova 2º dia (Caderno Amarelo). Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2017, 'Geral', 'Prova', 'https://download.inep.gov.br/educacao_basica/enem/provas/2017/2017_PV_impresso_D2_CD5.pdf', 'link', 'approved', ARRAY['enem','2017','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2017 - Gabarito 1º dia', 'ENEM 2017 - Gabarito 1º dia. Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2017, 'Geral', 'Gabarito', 'https://download.inep.gov.br/educacao_basica/enem/gabaritos/2017/cad_1_gabarito_azul_5112017.pdf', 'link', 'approved', ARRAY['enem','2017','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2017 - Gabarito 2º dia', 'ENEM 2017 - Gabarito 2º dia. Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2017, 'Geral', 'Gabarito', 'https://download.inep.gov.br/educacao_basica/enem/gabaritos/2017/cad_5_gabarito_amarelo_12112017.pdf', 'link', 'approved', ARRAY['enem','2017','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2018 - Prova 1º dia (Caderno Azul)', 'ENEM 2018 - Prova 1º dia (Caderno Azul). Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2018, 'Geral', 'Prova', 'https://download.inep.gov.br/educacao_basica/enem/provas/2018/2018_PV_impresso_D1_CD1.pdf', 'link', 'approved', ARRAY['enem','2018','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2018 - Prova 2º dia (Caderno Amarelo)', 'ENEM 2018 - Prova 2º dia (Caderno Amarelo). Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2018, 'Geral', 'Prova', 'https://download.inep.gov.br/educacao_basica/enem/provas/2018/2018_PV_impresso_D2_CD6.pdf', 'link', 'approved', ARRAY['enem','2018','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2018 - Gabarito 1º dia', 'ENEM 2018 - Gabarito 1º dia. Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2018, 'Geral', 'Gabarito', 'https://download.inep.gov.br/educacao_basica/enem/gabaritos/2018/GAB_ENEM_2018_DIA_1_AZUL.pdf', 'link', 'approved', ARRAY['enem','2018','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2018 - Gabarito 2º dia', 'ENEM 2018 - Gabarito 2º dia. Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2018, 'Geral', 'Gabarito', 'https://download.inep.gov.br/educacao_basica/enem/gabaritos/2018/GAB_ENEM_2018_DIA_2_AMARELO.pdf', 'link', 'approved', ARRAY['enem','2018','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2019 - Prova 1º dia (Caderno Azul)', 'ENEM 2019 - Prova 1º dia (Caderno Azul). Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2019, 'Geral', 'Prova', 'https://download.inep.gov.br/educacao_basica/enem/provas/2019/2019_PV_impresso_D1_CD1.pdf', 'link', 'approved', ARRAY['enem','2019','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2019 - Prova 2º dia (Caderno Amarelo)', 'ENEM 2019 - Prova 2º dia (Caderno Amarelo). Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2019, 'Geral', 'Prova', 'https://download.inep.gov.br/educacao_basica/enem/provas/2019/2019_PV_impresso_D2_CD5.pdf', 'link', 'approved', ARRAY['enem','2019','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2019 - Gabarito 1º dia', 'ENEM 2019 - Gabarito 1º dia. Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2019, 'Geral', 'Gabarito', 'https://download.inep.gov.br/educacao_basica/enem/gabaritos/2019/gabarito_1_dia_caderno_1_azul_aplicacao_regular.pdf', 'link', 'approved', ARRAY['enem','2019','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('ENEM 2019 - Gabarito 2º dia', 'ENEM 2019 - Gabarito 2º dia. Fonte oficial: ENEM.', 'ENEM', 'ENEM / SISU', 2019, 'Geral', 'Gabarito', 'https://download.inep.gov.br/educacao_basica/enem/gabaritos/2019/gabarito_2_dia_caderno_5_amarelo_aplicacao_regular.pdf', 'link', 'approved', ARRAY['enem','2019','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2025 - 1ª fase (V1)', 'FUVEST 2025 - 1ª fase (V1). Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2025, 'Geral', 'Prova', 'https://www.fuvest.br/wp-content/uploads/fuvest2025_primeira_fase_prova_V1.pdf', 'link', 'approved', ARRAY['fuvest','2025','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2025 - Gabarito 1ª fase', 'FUVEST 2025 - Gabarito 1ª fase. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2025, 'Geral', 'Gabarito', 'https://www.fuvest.br/wp-content/uploads/fuvest2025_gabarito_primeira_fase.pdf', 'link', 'approved', ARRAY['fuvest','2025','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2025 - 2ª fase - 1º dia', 'FUVEST 2025 - 2ª fase - 1º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2025, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuvest2025_prova_2fase_dia1.pdf', 'link', 'approved', ARRAY['fuvest','2025','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2025 - 2ª fase - 2º dia', 'FUVEST 2025 - 2ª fase - 2º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2025, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuvest2025_prova_2fase_dia2.pdf', 'link', 'approved', ARRAY['fuvest','2025','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2025 - Guia de respostas (2ª fase)', 'FUVEST 2025 - Guia de respostas (2ª fase). Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2025, 'Geral', 'Gabarito', 'https://www.fuvest.br/wp-content/uploads/fuvest_2025_guia_respostas.pdf', 'link', 'approved', ARRAY['fuvest','2025','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2024 - 1ª fase (V)', 'FUVEST 2024 - 1ª fase (V). Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2024, 'Geral', 'Prova', 'https://www.fuvest.br/wp-content/uploads/fuvest2024_primeira_fase_prova_V.pdf', 'link', 'approved', ARRAY['fuvest','2024','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2024 - Gabarito 1ª fase', 'FUVEST 2024 - Gabarito 1ª fase. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2024, 'Geral', 'Gabarito', 'https://www.fuvest.br/wp-content/uploads/fuvest2024_gabarito_primeira_fase_retificado_2023-11-24.pdf', 'link', 'approved', ARRAY['fuvest','2024','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2024 - 2ª fase - 1º dia', 'FUVEST 2024 - 2ª fase - 1º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2024, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuvest2024_segunda_fase_prova_1dia.pdf', 'link', 'approved', ARRAY['fuvest','2024','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2024 - 2ª fase - 2º dia', 'FUVEST 2024 - 2ª fase - 2º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2024, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuvest2024_segunda_fase_prova_2dia.pdf', 'link', 'approved', ARRAY['fuvest','2024','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2024 - Abordagens esperadas (2ª fase)', 'FUVEST 2024 - Abordagens esperadas (2ª fase). Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2024, 'Geral', 'Gabarito', 'https://www.fuvest.br/wp-content/uploads/fuvest_2024_2024.01.22_RESPOSTAS_USP_Guia.pdf', 'link', 'approved', ARRAY['fuvest','2024','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2023 - 1ª fase (V)', 'FUVEST 2023 - 1ª fase (V). Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2023, 'Geral', 'Prova', 'https://www.fuvest.br/wp-content/uploads/fuvest2023_primeira_fase_prova_V.pdf', 'link', 'approved', ARRAY['fuvest','2023','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2023 - Gabarito 1ª fase', 'FUVEST 2023 - Gabarito 1ª fase. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2023, 'Geral', 'Gabarito', 'https://www.fuvest.br/wp-content/uploads/fuvest2023_gabarito_primeira_fase.pdf', 'link', 'approved', ARRAY['fuvest','2023','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2023 - 2ª fase - 1º dia', 'FUVEST 2023 - 2ª fase - 1º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2023, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuvest_2023_segunda_fase_dia_1.pdf', 'link', 'approved', ARRAY['fuvest','2023','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2023 - 2ª fase - 2º dia', 'FUVEST 2023 - 2ª fase - 2º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2023, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuvest_2023_segunda_fase_dia_2.pdf', 'link', 'approved', ARRAY['fuvest','2023','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2023 - Abordagens esperadas (2ª fase)', 'FUVEST 2023 - Abordagens esperadas (2ª fase). Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2023, 'Geral', 'Gabarito', 'https://www.fuvest.br/wp-content/uploads/fuvest2023_abordagens_esperadas_2fase.pdf', 'link', 'approved', ARRAY['fuvest','2023','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2022 - 1ª fase (V)', 'FUVEST 2022 - 1ª fase (V). Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2022, 'Geral', 'Prova', 'https://www.fuvest.br/wp-content/uploads/fuvest_2022_primeira_fase_tipo_V.pdf', 'link', 'approved', ARRAY['fuvest','2022','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2022 - Gabarito 1ª fase', 'FUVEST 2022 - Gabarito 1ª fase. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2022, 'Geral', 'Gabarito', 'https://www.fuvest.br/wp-content/uploads/fuvest_2022_primeira_fase_gabarito_retificado.pdf', 'link', 'approved', ARRAY['fuvest','2022','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2022 - 2ª fase - 1º dia', 'FUVEST 2022 - 2ª fase - 1º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2022, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuvest_2022_segunda_fase_dia_1.pdf', 'link', 'approved', ARRAY['fuvest','2022','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2022 - 2ª fase - 2º dia', 'FUVEST 2022 - 2ª fase - 2º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2022, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuvest_2022_segunda_fase_dia_2.pdf', 'link', 'approved', ARRAY['fuvest','2022','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2021 - 1ª fase', 'FUVEST 2021 - 1ª fase. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2021, 'Geral', 'Prova', 'https://www.fuvest.br/wp-content/uploads/fuvest_2021_primeira_fase.pdf', 'link', 'approved', ARRAY['fuvest','2021','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2021 - Gabarito 1ª fase', 'FUVEST 2021 - Gabarito 1ª fase. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2021, 'Geral', 'Gabarito', 'https://www.fuvest.br/wp-content/uploads/fuvest_2021_primeira_fase_gabarito_v2.pdf', 'link', 'approved', ARRAY['fuvest','2021','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2021 - 2ª fase - 1º dia', 'FUVEST 2021 - 2ª fase - 1º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2021, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuv2021_2fase_dia_1.pdf', 'link', 'approved', ARRAY['fuvest','2021','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2021 - 2ª fase - 2º dia', 'FUVEST 2021 - 2ª fase - 2º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2021, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuv2021_2fase_dia_2.pdf', 'link', 'approved', ARRAY['fuvest','2021','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2020 - 1ª fase (V)', 'FUVEST 2020 - 1ª fase (V). Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2020, 'Geral', 'Prova', 'https://www.fuvest.br/wp-content/uploads/fuvest_2020_primeira_fase_prova_V.pdf', 'link', 'approved', ARRAY['fuvest','2020','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2020 - Gabarito 1ª fase', 'FUVEST 2020 - Gabarito 1ª fase. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2020, 'Geral', 'Gabarito', 'https://www.fuvest.br/wp-content/uploads/fuvest_2020_primeira_fase_gabaritos.pdf', 'link', 'approved', ARRAY['fuvest','2020','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2020 - 2ª fase - 1º dia', 'FUVEST 2020 - 2ª fase - 1º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2020, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuv2020_2fase_dia_1.pdf', 'link', 'approved', ARRAY['fuvest','2020','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2020 - 2ª fase - 2º dia', 'FUVEST 2020 - 2ª fase - 2º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2020, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuv2020_2fase_dia_2.pdf', 'link', 'approved', ARRAY['fuvest','2020','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2019 - 1ª fase', 'FUVEST 2019 - 1ª fase. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2019, 'Geral', 'Prova', 'https://www.fuvest.br/wp-content/uploads/fuvest_2019_primeira_fase.pdf', 'link', 'approved', ARRAY['fuvest','2019','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2019 - Gabarito oficial', 'FUVEST 2019 - Gabarito oficial. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2019, 'Geral', 'Gabarito', 'https://www.fuvest.br/wp-content/uploads/fuv2019.gabarito.oficial.pdf', 'link', 'approved', ARRAY['fuvest','2019','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2019 - 2ª fase - 1º dia', 'FUVEST 2019 - 2ª fase - 1º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2019, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuv2019_2fase_dia1.pdf', 'link', 'approved', ARRAY['fuvest','2019','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2019 - 2ª fase - 2º dia', 'FUVEST 2019 - 2ª fase - 2º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2019, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuv2019_2fase_dia2.pdf', 'link', 'approved', ARRAY['fuvest','2019','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2010 - 1ª fase (V)', 'FUVEST 2010 - 1ª fase (V). Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2010, 'Geral', 'Prova', 'https://www.fuvest.br/wp-content/uploads/fuvest_2010_1fase_prova_V.pdf', 'link', 'approved', ARRAY['fuvest','2010','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2010 - Gabarito 1ª fase', 'FUVEST 2010 - Gabarito 1ª fase. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2010, 'Geral', 'Gabarito', 'https://www.fuvest.br/wp-content/uploads/fuvest_2010_1fase_prova_gab.pdf', 'link', 'approved', ARRAY['fuvest','2010','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2010 - 2ª fase - 1º dia', 'FUVEST 2010 - 2ª fase - 1º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2010, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuvest_2010_2fase_dia1.pdf', 'link', 'approved', ARRAY['fuvest','2010','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2010 - 2ª fase - 2º dia', 'FUVEST 2010 - 2ª fase - 2º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2010, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuvest_2010_2fase_dia2.pdf', 'link', 'approved', ARRAY['fuvest','2010','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2010 - 2ª fase - 3º dia', 'FUVEST 2010 - 2ª fase - 3º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2010, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuvest_2010_2fase_dia3.pdf', 'link', 'approved', ARRAY['fuvest','2010','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2011 - 1ª fase (V)', 'FUVEST 2011 - 1ª fase (V). Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2011, 'Geral', 'Prova', 'https://www.fuvest.br/wp-content/uploads/fuvest_2011_1fase_prova_V.pdf', 'link', 'approved', ARRAY['fuvest','2011','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2011 - Gabarito 1ª fase', 'FUVEST 2011 - Gabarito 1ª fase. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2011, 'Geral', 'Gabarito', 'https://www.fuvest.br/wp-content/uploads/fuvest_2011_1fase_prova_gab.pdf', 'link', 'approved', ARRAY['fuvest','2011','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2011 - 2ª fase - 1º dia', 'FUVEST 2011 - 2ª fase - 1º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2011, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuvest_2011_2fase_dia1.pdf', 'link', 'approved', ARRAY['fuvest','2011','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2011 - 2ª fase - 2º dia', 'FUVEST 2011 - 2ª fase - 2º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2011, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuvest_2011_2fase_dia2.pdf', 'link', 'approved', ARRAY['fuvest','2011','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2011 - 2ª fase - 3º dia', 'FUVEST 2011 - 2ª fase - 3º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2011, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuvest_2011_2fase_dia3.pdf', 'link', 'approved', ARRAY['fuvest','2011','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2012 - 1ª fase (V)', 'FUVEST 2012 - 1ª fase (V). Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2012, 'Geral', 'Prova', 'https://www.fuvest.br/wp-content/uploads/fuvest_2012_1fase_prova_V.pdf', 'link', 'approved', ARRAY['fuvest','2012','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2012 - Gabarito 1ª fase', 'FUVEST 2012 - Gabarito 1ª fase. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2012, 'Geral', 'Gabarito', 'https://www.fuvest.br/wp-content/uploads/fuvest_2012_1fase_prova_gab.pdf', 'link', 'approved', ARRAY['fuvest','2012','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2012 - 2ª fase - 1º dia', 'FUVEST 2012 - 2ª fase - 1º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2012, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuvest_2012_2fase_dia1.pdf', 'link', 'approved', ARRAY['fuvest','2012','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2012 - 2ª fase - 2º dia', 'FUVEST 2012 - 2ª fase - 2º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2012, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuvest_2012_2fase_dia2.pdf', 'link', 'approved', ARRAY['fuvest','2012','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2012 - 2ª fase - 3º dia', 'FUVEST 2012 - 2ª fase - 3º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2012, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuvest_2012_2fase_dia3.pdf', 'link', 'approved', ARRAY['fuvest','2012','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2013 - 1ª fase (V)', 'FUVEST 2013 - 1ª fase (V). Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2013, 'Geral', 'Prova', 'https://www.fuvest.br/wp-content/uploads/fuvest_2013_1fase_prova_V.pdf', 'link', 'approved', ARRAY['fuvest','2013','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2013 - Gabarito 1ª fase', 'FUVEST 2013 - Gabarito 1ª fase. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2013, 'Geral', 'Gabarito', 'https://www.fuvest.br/wp-content/uploads/fuvest_2013_1fase_prova_gab.pdf', 'link', 'approved', ARRAY['fuvest','2013','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2013 - 2ª fase - 1º dia', 'FUVEST 2013 - 2ª fase - 1º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2013, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuvest_2013_2fase_dia1.pdf', 'link', 'approved', ARRAY['fuvest','2013','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2013 - 2ª fase - 2º dia', 'FUVEST 2013 - 2ª fase - 2º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2013, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuvest_2013_2fase_dia2.pdf', 'link', 'approved', ARRAY['fuvest','2013','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2013 - 2ª fase - 3º dia', 'FUVEST 2013 - 2ª fase - 3º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2013, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuvest_2013_2fase_dia3.pdf', 'link', 'approved', ARRAY['fuvest','2013','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2014 - 1ª fase (V)', 'FUVEST 2014 - 1ª fase (V). Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2014, 'Geral', 'Prova', 'https://www.fuvest.br/wp-content/uploads/fuvest_2014_1fase_prova_V.pdf', 'link', 'approved', ARRAY['fuvest','2014','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2014 - Gabarito 1ª fase', 'FUVEST 2014 - Gabarito 1ª fase. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2014, 'Geral', 'Gabarito', 'https://www.fuvest.br/wp-content/uploads/fuvest_2014_1fase_prova_gab.pdf', 'link', 'approved', ARRAY['fuvest','2014','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2014 - 2ª fase - 1º dia', 'FUVEST 2014 - 2ª fase - 1º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2014, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuvest_2014_2fase_dia1.pdf', 'link', 'approved', ARRAY['fuvest','2014','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2014 - 2ª fase - 2º dia', 'FUVEST 2014 - 2ª fase - 2º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2014, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuvest_2014_2fase_dia2.pdf', 'link', 'approved', ARRAY['fuvest','2014','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2014 - 2ª fase - 3º dia', 'FUVEST 2014 - 2ª fase - 3º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2014, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuvest_2014_2fase_dia3.pdf', 'link', 'approved', ARRAY['fuvest','2014','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2015 - 1ª fase (V)', 'FUVEST 2015 - 1ª fase (V). Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2015, 'Geral', 'Prova', 'https://www.fuvest.br/wp-content/uploads/fuvest_2015_1fase_prova_V.pdf', 'link', 'approved', ARRAY['fuvest','2015','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2015 - Gabarito 1ª fase', 'FUVEST 2015 - Gabarito 1ª fase. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2015, 'Geral', 'Gabarito', 'https://www.fuvest.br/wp-content/uploads/fuvest_2015_1fase_prova_gab.pdf', 'link', 'approved', ARRAY['fuvest','2015','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2015 - 2ª fase - 1º dia', 'FUVEST 2015 - 2ª fase - 1º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2015, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuvest_2015_2fase_dia1.pdf', 'link', 'approved', ARRAY['fuvest','2015','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2015 - 2ª fase - 2º dia', 'FUVEST 2015 - 2ª fase - 2º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2015, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuvest_2015_2fase_dia2.pdf', 'link', 'approved', ARRAY['fuvest','2015','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2015 - 2ª fase - 3º dia', 'FUVEST 2015 - 2ª fase - 3º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2015, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuvest_2015_2fase_dia3.pdf', 'link', 'approved', ARRAY['fuvest','2015','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2016 - 1ª fase (V)', 'FUVEST 2016 - 1ª fase (V). Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2016, 'Geral', 'Prova', 'https://www.fuvest.br/wp-content/uploads/fuvest_2016_1fase_prova_V.pdf', 'link', 'approved', ARRAY['fuvest','2016','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2016 - Gabarito 1ª fase', 'FUVEST 2016 - Gabarito 1ª fase. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2016, 'Geral', 'Gabarito', 'https://www.fuvest.br/wp-content/uploads/fuvest_2016_1fase_prova_gab.pdf', 'link', 'approved', ARRAY['fuvest','2016','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2016 - 2ª fase - 1º dia', 'FUVEST 2016 - 2ª fase - 1º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2016, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuvest_2016_2fase_dia1.pdf', 'link', 'approved', ARRAY['fuvest','2016','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2016 - 2ª fase - 2º dia', 'FUVEST 2016 - 2ª fase - 2º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2016, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuvest_2016_2fase_dia2.pdf', 'link', 'approved', ARRAY['fuvest','2016','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2016 - 2ª fase - 3º dia', 'FUVEST 2016 - 2ª fase - 3º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2016, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuvest_2016_2fase_dia3.pdf', 'link', 'approved', ARRAY['fuvest','2016','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2017 - 1ª fase (V)', 'FUVEST 2017 - 1ª fase (V). Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2017, 'Geral', 'Prova', 'https://www.fuvest.br/wp-content/uploads/fuvest_2017_1fase_prova_V.pdf', 'link', 'approved', ARRAY['fuvest','2017','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2017 - Gabarito 1ª fase', 'FUVEST 2017 - Gabarito 1ª fase. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2017, 'Geral', 'Gabarito', 'https://www.fuvest.br/wp-content/uploads/fuvest_2017_1fase_prova_gab.pdf', 'link', 'approved', ARRAY['fuvest','2017','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2017 - 2ª fase - 1º dia', 'FUVEST 2017 - 2ª fase - 1º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2017, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuvest_2017_2fase_dia1.pdf', 'link', 'approved', ARRAY['fuvest','2017','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2017 - 2ª fase - 2º dia', 'FUVEST 2017 - 2ª fase - 2º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2017, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuvest_2017_2fase_dia2.pdf', 'link', 'approved', ARRAY['fuvest','2017','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2017 - 2ª fase - 3º dia', 'FUVEST 2017 - 2ª fase - 3º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2017, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuvest_2017_2fase_dia3.pdf', 'link', 'approved', ARRAY['fuvest','2017','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2018 - 1ª fase (V)', 'FUVEST 2018 - 1ª fase (V). Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2018, 'Geral', 'Prova', 'https://www.fuvest.br/wp-content/uploads/fuv2018_1fase_prova_V.pdf', 'link', 'approved', ARRAY['fuvest','2018','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2018 - Gabarito 1ª fase', 'FUVEST 2018 - Gabarito 1ª fase. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2018, 'Geral', 'Gabarito', 'https://www.fuvest.br/wp-content/uploads/fuv2018_1fase_prova_gab.pdf', 'link', 'approved', ARRAY['fuvest','2018','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2018 - 2ª fase - 1º dia', 'FUVEST 2018 - 2ª fase - 1º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2018, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuv2018_2fase_dia1.pdf', 'link', 'approved', ARRAY['fuvest','2018','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2018 - 2ª fase - 2º dia', 'FUVEST 2018 - 2ª fase - 2º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2018, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuv2018_2fase_dia2.pdf', 'link', 'approved', ARRAY['fuvest','2018','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('FUVEST 2018 - 2ª fase - 3º dia', 'FUVEST 2018 - 2ª fase - 3º dia. Fonte oficial: FUVEST.', 'FUVEST', 'USP', 2018, 'Geral', 'Discursiva', 'https://www.fuvest.br/wp-content/uploads/fuv2018_2fase_dia3.pdf', 'link', 'approved', ARRAY['fuvest','2018','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UNICAMP 2025 - 1ª fase (Q e Z)', 'UNICAMP 2025 - 1ª fase (Q e Z). Fonte oficial: UNICAMP.', 'UNICAMP', 'UNICAMP', 2025, 'Geral', 'Prova', 'https://www.comvest.unicamp.br/vest2025/F1/f12025Q_Z.pdf', 'link', 'approved', ARRAY['unicamp','2025','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UNICAMP 2025 - Gabarito 1ª fase (Q e Z)', 'UNICAMP 2025 - Gabarito 1ª fase (Q e Z). Fonte oficial: UNICAMP.', 'UNICAMP', 'UNICAMP', 2025, 'Geral', 'Gabarito', 'https://www.comvest.unicamp.br/wp-content/uploads/2024/10/QZ_gabarito_2025_FINAL_site.pdf', 'link', 'approved', ARRAY['unicamp','2025','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UNICAMP 2025 - 2ª fase - Ciências Biológicas/Saúde', 'UNICAMP 2025 - 2ª fase - Ciências Biológicas/Saúde. Fonte oficial: UNICAMP.', 'UNICAMP', 'UNICAMP', 2025, 'Biologia', 'Discursiva', 'https://www.comvest.unicamp.br/vest2025/F2/provas/2025F2CB.pdf', 'link', 'approved', ARRAY['unicamp','2025','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UNICAMP 2025 - Respostas esperadas 2ª fase (CB/S)', 'UNICAMP 2025 - Respostas esperadas 2ª fase (CB/S). Fonte oficial: UNICAMP.', 'UNICAMP', 'UNICAMP', 2025, 'Biologia', 'Gabarito', 'https://www.comvest.unicamp.br/wp-content/uploads/2024/12/Respostas-Esperadas_Dia-2_CBS.pdf', 'link', 'approved', ARRAY['unicamp','2025','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UNICAMP 2024 - 1ª fase (Q e Y)', 'UNICAMP 2024 - 1ª fase (Q e Y). Fonte oficial: UNICAMP.', 'UNICAMP', 'UNICAMP', 2024, 'Geral', 'Prova', 'https://www.comvest.unicamp.br/vest2024/F1/f12024Q_Y.pdf', 'link', 'approved', ARRAY['unicamp','2024','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UNICAMP 2024 - Gabarito 1ª fase (Q e Y)', 'UNICAMP 2024 - Gabarito 1ª fase (Q e Y). Fonte oficial: UNICAMP.', 'UNICAMP', 'UNICAMP', 2024, 'Geral', 'Gabarito', 'https://www.comvest.unicamp.br/wp-content/uploads/2023/10/Q_Y.pdf', 'link', 'approved', ARRAY['unicamp','2024','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UNICAMP 2024 - 2ª fase - Ciências Biológicas/Saúde', 'UNICAMP 2024 - 2ª fase - Ciências Biológicas/Saúde. Fonte oficial: UNICAMP.', 'UNICAMP', 'UNICAMP', 2024, 'Biologia', 'Discursiva', 'https://www.comvest.unicamp.br/vest2024/F2/provas/2024F2CB.pdf', 'link', 'approved', ARRAY['unicamp','2024','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UNICAMP 2023 - 1ª fase (Q e Z)', 'UNICAMP 2023 - 1ª fase (Q e Z). Fonte oficial: UNICAMP.', 'UNICAMP', 'UNICAMP', 2023, 'Geral', 'Prova', 'https://www.comvest.unicamp.br/vest2023/F1/f12023Q_Z.pdf', 'link', 'approved', ARRAY['unicamp','2023','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UNICAMP 2023 - Gabarito 1ª fase', 'UNICAMP 2023 - Gabarito 1ª fase. Fonte oficial: UNICAMP.', 'UNICAMP', 'UNICAMP', 2023, 'Geral', 'Gabarito', 'https://www.comvest.unicamp.br/wp-content/uploads/2022/11/Gabarito_F1_VEST2023_V2.pdf', 'link', 'approved', ARRAY['unicamp','2023','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UNICAMP 2023 - 2ª fase - Ciências Biológicas/Saúde', 'UNICAMP 2023 - 2ª fase - Ciências Biológicas/Saúde. Fonte oficial: UNICAMP.', 'UNICAMP', 'UNICAMP', 2023, 'Biologia', 'Discursiva', 'https://www.comvest.unicamp.br/vest2023/F2/provas/2023F2CB.pdf', 'link', 'approved', ARRAY['unicamp','2023','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UNICAMP 2022 - 1ª fase (Q e X)', 'UNICAMP 2022 - 1ª fase (Q e X). Fonte oficial: UNICAMP.', 'UNICAMP', 'UNICAMP', 2022, 'Geral', 'Prova', 'https://www.comvest.unicamp.br/vest2022/F1/f12022Q_X.pdf', 'link', 'approved', ARRAY['unicamp','2022','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UNICAMP 2022 - Gabarito 1ª fase', 'UNICAMP 2022 - Gabarito 1ª fase. Fonte oficial: UNICAMP.', 'UNICAMP', 'UNICAMP', 2022, 'Geral', 'Gabarito', 'https://www.comvest.unicamp.br/wp-content/uploads/2021/11/gabarito_2022_DIVULGA.pdf', 'link', 'approved', ARRAY['unicamp','2022','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UNICAMP 2022 - 2ª fase - Ciências Biológicas/Saúde', 'UNICAMP 2022 - 2ª fase - Ciências Biológicas/Saúde. Fonte oficial: UNICAMP.', 'UNICAMP', 'UNICAMP', 2022, 'Biologia', 'Discursiva', 'https://www.comvest.unicamp.br/vest2022/F2/provas/2022F2CB.pdf', 'link', 'approved', ARRAY['unicamp','2022','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UNICAMP 2021 - 1ª fase (Q e Z)', 'UNICAMP 2021 - 1ª fase (Q e Z). Fonte oficial: UNICAMP.', 'UNICAMP', 'UNICAMP', 2021, 'Geral', 'Prova', 'https://www.comvest.unicamp.br/vest2021/F1/f12021Q_Z.pdf', 'link', 'approved', ARRAY['unicamp','2021','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UNICAMP 2021 - 2ª fase - Ciências Biológicas/Saúde', 'UNICAMP 2021 - 2ª fase - Ciências Biológicas/Saúde. Fonte oficial: UNICAMP.', 'UNICAMP', 'UNICAMP', 2021, 'Biologia', 'Discursiva', 'https://www.comvest.unicamp.br/vest2021/F2/provas/2021F2CB.pdf', 'link', 'approved', ARRAY['unicamp','2021','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UNICAMP 2020 - 1ª fase (Q e X)', 'UNICAMP 2020 - 1ª fase (Q e X). Fonte oficial: UNICAMP.', 'UNICAMP', 'UNICAMP', 2020, 'Geral', 'Prova', 'https://www.comvest.unicamp.br/vest2020/F1/f12020Q_X.pdf', 'link', 'approved', ARRAY['unicamp','2020','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UNICAMP 2020 - 2ª fase - Ciências Biológicas/Saúde', 'UNICAMP 2020 - 2ª fase - Ciências Biológicas/Saúde. Fonte oficial: UNICAMP.', 'UNICAMP', 'UNICAMP', 2020, 'Biologia', 'Discursiva', 'https://www.comvest.unicamp.br/vest2020/F2/provas/2020F2CB.pdf', 'link', 'approved', ARRAY['unicamp','2020','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UNICAMP 2018 - 1ª fase (Q)', 'UNICAMP 2018 - 1ª fase (Q). Fonte oficial: UNICAMP.', 'UNICAMP', 'UNICAMP', 2018, 'Geral', 'Prova', 'https://www.comvest.unicamp.br/vest2018/F1/f12018Q.pdf', 'link', 'approved', ARRAY['unicamp','2018','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UNICAMP 2018 - Gabarito 1ª fase', 'UNICAMP 2018 - Gabarito 1ª fase. Fonte oficial: UNICAMP.', 'UNICAMP', 'UNICAMP', 2018, 'Geral', 'Gabarito', 'https://www.comvest.unicamp.br/vest2018/F1/gabarito2018.pdf', 'link', 'approved', ARRAY['unicamp','2018','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UNICAMP 2018 - 2ª fase - Física/Bio/Química', 'UNICAMP 2018 - 2ª fase - Física/Bio/Química. Fonte oficial: UNICAMP.', 'UNICAMP', 'UNICAMP', 2018, 'Biologia', 'Discursiva', 'https://www.comvest.unicamp.br/vest2018/F2/provas/fisbioqui.pdf', 'link', 'approved', ARRAY['unicamp','2018','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UNICAMP 2010 - 1ª fase - Questões', 'UNICAMP 2010 - 1ª fase - Questões. Fonte oficial: UNICAMP.', 'UNICAMP', 'UNICAMP', 2010, 'Geral', 'Prova', 'https://www.comvest.unicamp.br/vest2010/F1/f12010questoes.pdf', 'link', 'approved', ARRAY['unicamp','2010','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UNICAMP 2010 - 2ª fase - Português/Biologia', 'UNICAMP 2010 - 2ª fase - Português/Biologia. Fonte oficial: UNICAMP.', 'UNICAMP', 'UNICAMP', 2010, 'Biologia', 'Discursiva', 'https://www.comvest.unicamp.br/vest2010/F2/provas/portbio.pdf', 'link', 'approved', ARRAY['unicamp','2010','discursiva']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UFSC 2010 - Prova 1 (Amarela)', 'UFSC 2010 - Prova 1 (Amarela). Fonte oficial: UFSC.', 'UFSC', 'UFSC', 2010, 'Geral', 'Prova', 'http://www.coperve.ufsc.br/provas_ant/2010-1-amarela.pdf', 'link', 'approved', ARRAY['ufsc','2010','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UFSC 2010 - Gabarito Prova 1 (Amarela)', 'UFSC 2010 - Gabarito Prova 1 (Amarela). Fonte oficial: UFSC.', 'UFSC', 'UFSC', 2010, 'Geral', 'Gabarito', 'http://www.coperve.ufsc.br/provas_ant/2010-gab-3.pdf', 'link', 'approved', ARRAY['ufsc','2010','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UFSC 2011 - Prova 1 (Amarela)', 'UFSC 2011 - Prova 1 (Amarela). Fonte oficial: UFSC.', 'UFSC', 'UFSC', 2011, 'Geral', 'Prova', 'http://www.coperve.ufsc.br/provas_ant/2011-1-amarela.pdf', 'link', 'approved', ARRAY['ufsc','2011','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UFSC 2011 - Gabarito Prova 1 (Amarela)', 'UFSC 2011 - Gabarito Prova 1 (Amarela). Fonte oficial: UFSC.', 'UFSC', 'UFSC', 2011, 'Geral', 'Gabarito', 'http://www.coperve.ufsc.br/provas_ant/2011-gab-3.pdf', 'link', 'approved', ARRAY['ufsc','2011','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UFSC 2012 - Prova 1 (Amarela)', 'UFSC 2012 - Prova 1 (Amarela). Fonte oficial: UFSC.', 'UFSC', 'UFSC', 2012, 'Geral', 'Prova', 'http://www.coperve.ufsc.br/provas_ant/2012-1-amarela.pdf', 'link', 'approved', ARRAY['ufsc','2012','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UFSC 2013 - Prova 1 (Amarela)', 'UFSC 2013 - Prova 1 (Amarela). Fonte oficial: UFSC.', 'UFSC', 'UFSC', 2013, 'Geral', 'Prova', 'http://www.coperve.ufsc.br/provas_ant/2013-1-amarela.pdf', 'link', 'approved', ARRAY['ufsc','2013','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UFSC 2014 - Prova 1 (Amarela)', 'UFSC 2014 - Prova 1 (Amarela). Fonte oficial: UFSC.', 'UFSC', 'UFSC', 2014, 'Geral', 'Prova', 'http://www.coperve.ufsc.br/provas_ant/2014-1-amarela.pdf', 'link', 'approved', ARRAY['ufsc','2014','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UFSC 2015 - Prova 1 (Amarela)', 'UFSC 2015 - Prova 1 (Amarela). Fonte oficial: UFSC.', 'UFSC', 'UFSC', 2015, 'Geral', 'Prova', 'http://www.coperve.ufsc.br/provas_ant/2015-1-amarela.pdf', 'link', 'approved', ARRAY['ufsc','2015','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UFSC 2016 - Prova 1 (Amarela)', 'UFSC 2016 - Prova 1 (Amarela). Fonte oficial: UFSC.', 'UFSC', 'UFSC', 2016, 'Geral', 'Prova', 'https://repositorio.ufsc.br/bitstream/handle/123456789/157152/2016-1-amarela.pdf', 'link', 'approved', ARRAY['ufsc','2016','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UFSC 2017 - Prova 1 (Amarela)', 'UFSC 2017 - Prova 1 (Amarela). Fonte oficial: UFSC.', 'UFSC', 'UFSC', 2017, 'Geral', 'Prova', 'https://repositorio.ufsc.br/bitstream/handle/123456789/171426/2017-1-amarela.pdf', 'link', 'approved', ARRAY['ufsc','2017','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UFSC 2018 - Prova 1 (Amarela)', 'UFSC 2018 - Prova 1 (Amarela). Fonte oficial: UFSC.', 'UFSC', 'UFSC', 2018, 'Geral', 'Prova', 'https://php.coperve.ufsc.br/vestibular2018/provas/2018-p1-amarela.pdf', 'link', 'approved', ARRAY['ufsc','2018','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UFSC 2019 - Prova 1 (Amarela)', 'UFSC 2019 - Prova 1 (Amarela). Fonte oficial: UFSC.', 'UFSC', 'UFSC', 2019, 'Geral', 'Prova', 'https://repositorio.ufsc.br/bitstream/handle/123456789/192286/2019-p1-amarela.pdf', 'link', 'approved', ARRAY['ufsc','2019','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UFSC 2020 - Prova 1 (Amarela)', 'UFSC 2020 - Prova 1 (Amarela). Fonte oficial: UFSC.', 'UFSC', 'UFSC', 2020, 'Geral', 'Prova', 'http://dados.coperve.ufsc.br/vestibular2020/gabaritos/definitivo/prova1/p1-amarela.pdf', 'link', 'approved', ARRAY['ufsc','2020','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UFSC 2022 - Prova 1 (Amarela)', 'UFSC 2022 - Prova 1 (Amarela). Fonte oficial: UFSC.', 'UFSC', 'UFSC', 2022, 'Geral', 'Prova', 'http://dados.coperve.ufsc.br/vestibular2022/gabaritos/definitivos/prova1/p1-amarela.pdf', 'link', 'approved', ARRAY['ufsc','2022','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UFSC 2023 - Prova 1 (Amarela)', 'UFSC 2023 - Prova 1 (Amarela). Fonte oficial: UFSC.', 'UFSC', 'UFSC', 2023, 'Geral', 'Prova', 'http://dados.coperve.ufsc.br/vestibular2023/gabaritos/preliminar/p1_amarela.pdf', 'link', 'approved', ARRAY['ufsc','2023','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UFSC 2023 - Gabarito Prova 1 (Amarela)', 'UFSC 2023 - Gabarito Prova 1 (Amarela). Fonte oficial: UFSC.', 'UFSC', 'UFSC', 2023, 'Geral', 'Gabarito', 'http://dados.coperve.ufsc.br/vestibular2023/gabaritos/preliminar/gabarito_p1_amarelaPreliminar.pdf', 'link', 'approved', ARRAY['ufsc','2023','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UFSC 2024 - Prova 1 (Amarela)', 'UFSC 2024 - Prova 1 (Amarela). Fonte oficial: UFSC.', 'UFSC', 'UFSC', 2024, 'Geral', 'Prova', 'http://vestibular2024.paginas.ufsc.br/files/2023/12/p1_amarela.pdf', 'link', 'approved', ARRAY['ufsc','2024','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UFSC 2024 - Gabarito Prova 1 (Amarela)', 'UFSC 2024 - Gabarito Prova 1 (Amarela). Fonte oficial: UFSC.', 'UFSC', 'UFSC', 2024, 'Geral', 'Gabarito', 'http://vestibular2024.paginas.ufsc.br/files/2023/12/novo_gabarito_p1_amarela.pdf', 'link', 'approved', ARRAY['ufsc','2024','gabarito']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UFSC 2025 - Prova 1 (Amarela)', 'UFSC 2025 - Prova 1 (Amarela). Fonte oficial: UFSC.', 'UFSC', 'UFSC', 2025, 'Geral', 'Prova', 'https://dados.coperve.ufsc.br/vestibular2025/gabaritos/p1_amarela.pdf', 'link', 'approved', ARRAY['ufsc','2025','prova']::text[])
on conflict (external_url) do nothing;
insert into public.materials (title, description, vestibular, faculdade, year, subject, material_type, external_url, upload_kind, status, tags)
values ('UFSC 2025 - Gabarito Prova 1 (Amarela)', 'UFSC 2025 - Gabarito Prova 1 (Amarela). Fonte oficial: UFSC.', 'UFSC', 'UFSC', 2025, 'Geral', 'Gabarito', 'https://dados.coperve.ufsc.br/vestibular2025/gabaritos/gabarito_p1_amarelaPreliminar.pdf', 'link', 'approved', ARRAY['ufsc','2025','gabarito']::text[])
on conflict (external_url) do nothing;

select count(*) as materiais_no_banco from public.materials;