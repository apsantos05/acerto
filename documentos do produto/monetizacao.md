# Monetização — AcertaVest

Estratégia freemium: o gratuito constrói hábito e SEO (acervo público
indexável); o Premium converte quem está perto da prova e quer vantagem.

## Planos

### Gratuito (R$ 0)
**Objetivo:** aquisição + retenção + conteúdo indexável.
- Biblioteca pública: **provas e gabaritos** (o que traz tráfego orgânico).
- Feed, ranking, perfil, reputação.
- **2 simulados/mês**, até **20 favoritos**.
- Envio de materiais (gera acervo e engajamento).

### Premium (R$ 19/mês)
**Objetivo:** monetizar o estudante geral de vestibular.
- Acervo **completo**: apostilas e materiais das melhores editoras
  (Bernoulli, Poliedro, Hexag, Farias Brito, COC...).
- **Simulados ilimitados** + correção no servidor.
- Favoritos ilimitados + **recomendações por matéria**.
- Estatísticas avançadas no dashboard.
- Sem anúncios.

### Premium Medicina (R$ 39/mês)
**Objetivo:** ticket mais alto para o público de maior intenção (Medicina).
- Tudo do Premium +
- **Trilhas por universidade** (USP, Unicamp, Unesp, Einstein, Famerp...).
- **Simulados oficiais por banca**.
- **Correção de redação**.
- **Cronograma de estudos personalizado**.
- **Prioridade** nos materiais da universidade-alvo.

## O que fica grátis vs premium

| Recurso | Free | Premium | Premium Med |
|---|:--:|:--:|:--:|
| Provas + gabaritos públicos | ✅ | ✅ | ✅ |
| Apostilas / editoras premium | — | ✅ | ✅ |
| Simulados | 2/mês | ∞ | ∞ + oficiais |
| Favoritos | 20 | ∞ | ∞ |
| Recomendações por matéria | — | ✅ | ✅ |
| Trilhas por universidade | — | — | ✅ |
| Correção de redação | — | — | ✅ |
| Cronograma personalizado | — | — | ✅ |

## Onde está o maior valor percebido
1. **Conteúdo exclusivo por universidade-alvo** (quem quer USP paga por material de USP).
2. **Correção de redação** (dor real, alto custo percebido).
3. **Simulados oficiais por banca** + estatísticas de desempenho.
4. **Cronograma personalizado** (organização = conversão emocional).

## Implementação técnica (estado)
- `supabase/plans.sql`: coluna `profiles.plan` (`free|premium|premium_med`),
  `premium_until` e a função `is_premium()` para gating.
- Página `/planos` com os 3 planos e CTAs.
- **Falta (próximo passo):** checkout (Stripe/Mercado Pago) + webhook que
  atualiza `plan`/`premium_until`, e o gating real nas queries premium
  (ex.: `materials` com flag premium filtrados por `is_premium()`).

> ⚠️ Integração de pagamento e cobrança não foram implementadas: exigem chaves
> e um provedor (Stripe/Mercado Pago). A estrutura de planos está pronta para
> plugar o checkout.
