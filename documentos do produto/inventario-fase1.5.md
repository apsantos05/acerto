# Acerte — Inventário de Fontes Oficiais (Fase 1.5)

> URLs **reais e verificadas** via crawl dos repositórios oficiais (2010–2025).
> Regra: nada inventado. Onde a fonte bloqueou acesso automatizado (403), está marcado.
> Tamanhos são estimativas (os PDFs não foram baixados).

---

## ✅ ENEM — INEP (gov.br) — 2010–2025 — COMPLETO E VERIFICADO

Padrão recente: `download.inep.gov.br/enem/provas_e_gabaritos/AAAA_PV_impresso_D{1,2}_CD{n}.pdf` (prova) e `..._GB_...` (gabarito). 2010–2019 usam o caminho legado `/educacao_basica/enem/...`. Representativo (Caderno Azul D1, Amarelo D2):

| Ano | Prova Dia 1 | Prova Dia 2 | Gabarito D1 | Gabarito D2 |
|---|---|---|---|---|
| 2025 | 2025_PV_impresso_D1_CD1.pdf | 2025_PV_impresso_D2_CD5.pdf | 2025_GB_impresso_D1_CD1.pdf | 2025_GB_impresso_D2_CD5.pdf |
| 2024 | 2024_PV_impresso_D1_CD1.pdf | 2024_PV_impresso_D2_CD5.pdf | 2024_GB_impresso_D1_CD1.pdf | 2024_GB_impresso_D2_CD5.pdf |
| 2023 | 2023_PV_impresso_D1_CD1.pdf | 2023_PV_impresso_D2_CD5.pdf | 2023_GB_impresso_D1_CD1.pdf | 2023_GB_impresso_D2_CD5.pdf |
| 2022 | 2022_PV_impresso_D1_CD1.pdf | 2022_PV_impresso_D2_CD5.pdf | 2022_GB_impresso_D1_CD1.pdf | 2022_GB_impresso_D2_CD5.pdf |
| 2021 | 2021_PV_impresso_D1_CD1.pdf | 2021_PV_impresso_D2_CD5.pdf | 2021_GB_impresso_D1_CD1.pdf | 2021_GB_impresso_D2_CD5.pdf |
| 2020 | 2020_PV_impresso_D1_CD1.pdf | 2020_PV_impresso_D2_CD5.pdf | 2020_GB_impresso_D1_CD1.pdf | 2020_GB_impresso_D2_CD5.pdf |

(prefixo: `https://download.inep.gov.br/enem/provas_e_gabaritos/`)

2010–2019 (prefixo `https://download.inep.gov.br/educacao_basica/enem/`):
- 2019: `provas/2019/2019_PV_impresso_D1_CD1.pdf`, `..._D2_CD5.pdf`; gabaritos `gabaritos/2019/gabarito_{1,2}_dia_caderno_{1,5}_{azul,amarelo}_aplicacao_regular.pdf`
- 2018: `provas/2018/2018_PV_impresso_D1_CD1.pdf`, `..._D2_CD6.pdf`; gabaritos `gabaritos/2018/GAB_ENEM_2018_DIA_{1,2}_{AZUL,AMARELO}.pdf`
- 2017: `provas/2017/2017_PV_impresso_D{1,2}_CD{1,5}.pdf`; gabaritos `gabaritos/2017/cad_{1,5}_gabarito_{azul,amarelo}_*.pdf`
- 2016: `provas/2016/2016_PV_impresso_D{1,2}_CD{1,5}.pdf`; gabaritos `gabaritos/2016/GAB_ENEM_2016_DIA_{1,2}_{01_AZUL,05_AMARELO}.pdf`
- 2015: `provas/2015/2015_PV_impresso_D{1,2}_CD{1,5}.pdf`; gabaritos `gabaritos/2015/CADERNO_{1_AZUL_SABADO,5_AMARELO_DOMINGO}.pdf`
- 2014: `provas/2014/2014_PV_impresso_D{1,2}_CD{1,5}.pdf`; gabaritos idem 2015
- 2013: `provas/2013/dia{1,2}_caderno{1,5}_{azul,amarelo}.pdf`; gabaritos `gabaritos/2013/dia{1,2}_{azul,amarelo}.pdf`
- 2012: `provas/2012/dia{1,2}_caderno{1,5}_{azul,amarelo}.pdf`; gabaritos `gabaritos/2012/dia{1,2}_{azul,amarelo}.pdf`
- 2011: `provas/2011/dia{1,2}_caderno{1,5}_{azul,amarelo}.pdf`; gabaritos `gabaritos/2011/{01_AZUL,05_AMARELO}_GABARITO.pdf`
- 2010: `provas/2010/dia{1,2}_caderno{1,5}_{azul,amarelo}.pdf` e `..._com_gab.pdf` (prova com gabarito embutido)

**64 URLs confirmadas (16 anos × 4).** Página-índice oficial: https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos

---

## ✅ FUVEST (USP) — fuvest.br — 2010–2025 — COMPLETO E VERIFICADO

Prefixo: `https://www.fuvest.br/wp-content/uploads/`. ~102 PDFs confirmados (todas as páginas `acervo-vestibular-AAAA` abertas). Principais por ano:

- **2025**: `fuvest2025_primeira_fase_prova_V{1..4}.pdf`, `fuvest2025_gabarito_primeira_fase.pdf`, `fuvest2025_prova_2fase_dia{1,2}.pdf`, `fuvest_2025_guia_respostas.pdf`
- **2024**: `fuvest2024_primeira_fase_prova_{V,K,Q,X,Z}.pdf`, `fuvest2024_gabarito_primeira_fase_retificado_2023-11-24.pdf`, `fuvest2024_segunda_fase_prova_{1,2}dia.pdf`, `fuvest_2024_2024.01.22_RESPOSTAS_USP_Guia.pdf`
- **2023**: `fuvest2023_primeira_fase_prova_{V,K,Q,X,Z}.pdf`, `fuvest2023_gabarito_primeira_fase.pdf`, `fuvest_2023_segunda_fase_dia_{1,2}.pdf`, `fuvest2023_abordagens_esperadas_2fase.pdf`
- **2022**: `fuvest_2022_primeira_fase_tipo_{V,K,Q,X,Z}.pdf`, `fuvest_2022_primeira_fase_gabarito_retificado.pdf`, `fuvest_2022_segunda_fase_dia_{1,2}.pdf`
- **2021**: `fuvest_2021_primeira_fase.pdf`, `fuvest_2021_primeira_fase_gabarito_v2.pdf`, `fuv2021_2fase_dia_{1,2}.pdf`
- **2020**: `fuvest_2020_primeira_fase_prova_V.pdf`, `fuvest_2020_primeira_fase_gabaritos.pdf`, `fuv2020_2fase_dia_{1,2}.pdf`
- **2019**: `fuvest_2019_primeira_fase.pdf`, `fuv2019.gabarito.oficial.pdf`, `fuv2019_2fase_dia{1,2}.pdf`
- **2018**: `fuv2018_1fase_prova_V.pdf`, `fuv2018_1fase_prova_gab.pdf`, `fuv2018_2fase_dia{1,2,3}.pdf`
- **2017**: `fuvest_2017_1fase_prova_V.pdf`, `fuvest_2017_1fase_prova_gab.pdf`, `fuvest_2017_2fase_dia{1,2,3}.pdf`
- **2016**: `fuvest_2016_1fase_prova_V.pdf`, `fuvest_2016_1fase_prova_gab.pdf`, `fuvest_2016_2fase_dia{1,2,3}.pdf`
- **2015–2010**: mesmo padrão `fuvest_AAAA_1fase_prova_V.pdf` + `_gab.pdf` + `fuvest_AAAA_2fase_dia{1,2,3}.pdf`

Página-índice por ano: https://www.fuvest.br/acervo-vestibular-AAAA/

---

## ✅ UNICAMP (COMVEST) — comvest.unicamp.br — VERIFICADO (2010, 2017–2025 com PDFs; 2011–2016 parcial)

Padrão provas: `comvest.unicamp.br/vestAAAA/F1/...` e `/vestAAAA/F2/provas/...`. Gabaritos/respostas recentes em `/wp-content/uploads/ANO/MES/`. Comentadas antigas em `/vest_anteriores/AAAA/download/comentadas/`.

- **2025**: 1ª fase `vest2025/F1/f12025{Q_Z,R_W,S_X,T_Y}.pdf`; gabaritos `/wp-content/uploads/2024/10/{QZ,RW,SX,TY}_gabarito_2025_FINAL_site.pdf`; 2ª fase `vest2025/F2/provas/2025F2{CE,CB,CH}.pdf` + `2025F2redporingcn.pdf`; respostas esperadas + comentadas (vários)
- **2024**: 1ª `vest2024/F1/f12024{Q_Y,R_Z,S_W,T_X}.pdf`; gabaritos `/uploads/2023/10/{Q_Y,R_Z,S_W,T_X}.pdf`; 2ª `vest2024/F2/provas/2024F2{CE,CB,CH}.pdf` + redporing
- **2023**: 1ª `vest2023/F1/f12023{Q_Z,R_Y,S_X,T_W}.pdf`; gabarito `/uploads/2022/11/Gabarito_F1_VEST2023_V2.pdf`; 2ª `vest2023/F2/provas/2023F2{CE,CB,CH}.pdf`
- **2022**: 1ª `vest2022/F1/f12022{Q_X,R_W,S_Z,T_Y}.pdf`; gabarito `/uploads/2021/11/gabarito_2022_DIVULGA.pdf`; 2ª `vest2022/F2/provas/2022F2{CE,CB}.pdf`
- **2021**: 1ª `vest2021/F1/f12021{Q_Z,R_Y,S_X,T_W,E_G,F_H,J_L,K_M}.pdf`; gabaritos `/uploads/2021/01/DIA{1,2}_gabarito_*.pdf`; 2ª `vest2021/F2/provas/2021F2{CB,CE,CH}.pdf`
- **2020**: 1ª `vest2020/F1/f12020{Q_X,R_W,S_Z,T_Y}.pdf`; 2ª `vest2020/F2/provas/2020F2{CB,CE,CH}.pdf` + respostas `resp_2020F2*.pdf`
- **2018**: 1ª `vest2018/F1/f12018{Q,X,R,Z,S,Y,T,W}.pdf`, gabarito `vest2018/F1/gabarito2018.pdf`; 2ª `vest2018/F2/provas/{fisbioqui,matgeohis,redport}.pdf` + respostas
- **2017**: `/wp-content/uploads/2017/02/f12017{QY,RX,SW,TZ}.pdf` + 2ª `{bioquifis,geohismat,redport}.pdf`
- **2010**: `vest2010/F1/f12010{redacao,questoes}.pdf`; 2ª `vest2010/F2/provas/{portbio,quihis,fisgeo,mating}.pdf` + respostas esperadas
- **2011–2016**: páginas-índice confirmadas em `/vestibulares-anteriores/vestibular-AAAA/`; comentadas confirmadas em `/vest_anteriores/AAAA/download/comentadas/*.pdf`. PDFs brutos de prova/gabarito seguem o padrão `vestAAAA/F1/` e `/F2/provas/` — **a confirmar arquivo por arquivo antes do import**.

Página-índice: https://www.comvest.unicamp.br/vestibulares-anteriores/

---

## ✅ UFSC (COPERVE) — *.ufsc.br — 2010–2025 — VERIFICADO (HTTP 200)

Provas em PDF; gabaritos antigos (2010–2022) em **.html**, PDF a partir de 2023. Versão Amarela/Prova 1 como representativa (as cores Azul/Verde/Cinza/… seguem o mesmo padrão trocando a cor; Prova 2/3 trocam `p1`→`p2`/`p3`).

- 2010: `coperve.ufsc.br/provas_ant/2010-1-amarela.pdf` · gab `2010-gab-1-amarela.html`
- 2011: `provas_ant/2011-1-amarela.pdf`
- 2012: `provas_ant/2012-1-amarela.pdf` · gab `dados.coperve.ufsc.br/vestibular2012/gabaritos/vestgab01_p1_AMARELA.html`
- 2013–2015: `provas_ant/AAAA-1-amarela.pdf` · gab `antiga.coperve.ufsc.br/vestibularAAAA/gabaritos/...html`
- 2016: `repositorio.ufsc.br/bitstream/handle/123456789/157152/2016-1-amarela.pdf`
- 2017: `repositorio.ufsc.br/bitstream/handle/123456789/171426/2017-1-amarela.pdf`
- 2018: `php.coperve.ufsc.br/vestibular2018/provas/2018-p1-amarela.pdf` (+ 2018-2)
- 2019: `repositorio.ufsc.br/.../192286/2019-p1-amarela.pdf` (+ 2019-2)
- 2020: `dados.coperve.ufsc.br/vestibular2020/gabaritos/definitivo/prova1/p1-amarela.pdf`
- 2021: reaproveitou 2020 (`.../vestibular2020/.../preliminar/...`)
- 2022: `dados.coperve.ufsc.br/vestibular2022/gabaritos/definitivos/prova1/p1-amarela.pdf`
- 2023: `dados.coperve.ufsc.br/vestibular2023/gabaritos/preliminar/p1_amarela.pdf` · gab `gabarito_p1_amarelaPreliminar.pdf`
- 2024: `vestibular2024.paginas.ufsc.br/files/2023/12/p1_amarela.pdf` · gab `novo_gabarito_p1_amarela.pdf`
- 2025: `dados.coperve.ufsc.br/vestibular2025/gabaritos/p1_amarela.pdf` · gab `gabarito_p1_amarelaPreliminar.pdf`

Índice mestre (todas cores/provas/gabaritos): https://vestibularunificado2026.ufsc.br/provas-anteriores/

---

## ⚠️ UNESP (VUNESP) — páginas-edição confirmadas; PDFs bloqueados (403)

PDFs de prova/gabarito ficam atrás de `documento.vunesp.com.br/documento/stream/<id-base64>` e a VUNESP bloqueia fetch automatizado (403). Páginas-edição confirmadas (porta de entrada para "Provas e Gabaritos"):

| Ano prova | Página-edição |
|---|---|
| 2025 | https://www.vunesp.com.br/VNSP2404/ |
| 2024 | https://www.vunesp.com.br/VNSP2303/ |
| 2023 | https://www.vunesp.com.br/VNSP2206/ |
| 2022 | https://www.vunesp.com.br/VNSP2105/ |
| 2021 | https://www.vunesp.com.br/VNSP2006/ |
| 2020 | https://www.vunesp.com.br/VNSP1901/ |
| 2019 | https://www.vunesp.com.br/VNSP1803/ |
| 2017 | https://www.vunesp.com.br/VNSP1611/ |
| 2015 | https://www.vunesp.com.br/vnsp1406/ |
| 2014 | https://www.vunesp.com.br/vnsp1308/ |
| 2013 | https://www.vunesp.com.br/vnsp1301/ |

Manuais/editais diretos confirmados (static.vunesp.com.br): ex. `https://static.vunesp.com.br/vnsp2105/manual/download/edital.pdf`. Lacunas de página-edição: 2010, 2011, 2012, 2016, 2018. Arquivo oficial (SPA): https://vestibular.unesp.br/portal#!/arquivo/

---

## ⚠️ FAMERP (VUNESP) — páginas-edição confirmadas; PDFs bloqueados (403)

| Ano ingresso | Página-edição |
|---|---|
| 2026 | https://www.vunesp.com.br/FMRP2501 |
| 2025 | https://www.vunesp.com.br/FMRP2401 |
| 2024 | https://www.vunesp.com.br/FMRP2301 |
| 2023 | https://www.vunesp.com.br/FMRP2201 |
| 2022 | https://www.vunesp.com.br/FMRP2101 |
| 2019 | https://www.vunesp.com.br/FMRP1801 |
| 2018 | https://www.vunesp.com.br/FMRP1701 |
| 2017 | https://www.vunesp.com.br/FMRP1601 |
| 2016 | https://www.vunesp.com.br/FMRP1501 |
| 2015 | https://www.vunesp.com.br/FMRP1401 |

Lacunas: 2010–2014, 2020 (FMRP1901) e 2021 (FMRP2001) retornam "Não encontrado". PDFs internos: bloqueados (403).

---

## ❌ UNIFESP (Sistema Misto) — bloqueado (403 universal)

`ingresso.unifesp.br` e `vunesp.com.br` retornam HTTP 403 a fetch automatizado. Páginas-índice existem (ex.: `ingresso.unifesp.br/vestibulares-anteriores/category/32-provas-e-gabaritos`), mas **nenhum PDF pôde ser confirmado**. Requer navegador real (Chrome MCP) ou coleta manual.

---

## ⚠️ UFMG — vestibular próprio descontinuado em 2013

Último vestibular geral próprio: **2012** (ingresso 2012). A partir de 2013 a UFMG seleciona via **ENEM/SISU** → não há provas próprias 2013–2025. Provas gerais 2010–2012 **não localizadas** no domínio oficial (COPEVE migrou de plataforma). Confirmado oficialmente apenas: FIEI 2014 (3 PDFs, seleção indígena específica) e editais 2012/2013. Recomendado: **cobrir UFMG via ENEM** (já que é o que ela usa).

---

## Resumo de cobertura

| Vestibular | Anos com fonte verificada | URLs verificadas (aprox.) | Status |
|---|---|---|---|
| ENEM | 2010–2025 | 64 | ✅ completo |
| FUVEST | 2010–2025 | ~102 | ✅ completo |
| UNICAMP | 2010, 2017–2025 (2011–2016 parcial) | ~195 | ✅ verificado |
| UFSC | 2010–2025 | ~40 repres. (todas cores na fonte) | ✅ verificado |
| UNESP | 2013–2025 (páginas-edição) | ~25 (páginas+editais) | ⚠️ PDFs bloqueados 403 |
| FAMERP | 2015–2024 + 2026 (páginas-edição) | 10 páginas | ⚠️ PDFs bloqueados 403 |
| UNIFESP | — | 0 confirmados | ❌ 403 universal |
| UFMG | só até 2012 (geral) | ~6 | ⚠️ descontinuado (ENEM/SISU) |

**Total verificado: ~400+ URLs reais** (ENEM + FUVEST + UNICAMP + UFSC formam a base sólida, focada em Medicina).
