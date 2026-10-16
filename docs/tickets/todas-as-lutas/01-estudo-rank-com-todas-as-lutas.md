# 01 — Estudo: rank com todas as lutas do jogo (não só chefões)

Status: pronto-para-agente (começar DEPOIS do reset do limite semanal, terça 21/10/2026 às 23h)
Pedido: Felipe, 16/10/2026 — "a gente tinha que pensar em todas as lutas, não só na luta contra os boss".
Decisão dele: primeiro um ESTUDO (relatório), mudar o rank e o Meu Time só depois de ver.

## Contexto
- Hoje o rank v2 e o "melhor no geral" do Meu Time usam só as 29 lutas de chefão da run (`LUTAS_DA_RUN`, src/regras/chefoes.js).
- O dado do jogo (`data/gameData_2654.json`, `trainers`) tem 895 treinadores, 3726 Pokémon (3348 sets distintos); ~441 com
  time Insane (Elite), 74 em dupla.

## O que o estudo entrega (só leitura no app; script novo em scripts/, nada gravado em data/)
1. **Etapa de cada treinador:** pelo mapa onde o código do jogo o coloca (`er-repo/data/maps/*/scripts.inc`, TRAINER_*) e a
   tabela mapa -> etapa já usada em `scripts/gerar_rank_disponibilidade.mjs`. Fora: revanches ("Nome 2..5"), pós-jogo,
   Trainer Hill/Frontier. Quantos ficaram sem etapa e por quê.
2. **Rank de comparação:** o mesmo método do rank v2 (peso por ameaça iterado, margem, 2 dificuldades), com os chefões + os
   treinadores comuns da run. Comparar com o rank atual: quem sobe, quem cai (top 30 de cada lado), mudança de tier.
3. **Checagem externa:** `scripts/validar_rank_v2.mjs` (fortes/fracos da comunidade, Spearman) nos dois ranks. Melhorou ou piorou?
4. **Peso:** quanto as lutas comuns pesam no total depois da iteração (se dominarem, o rank perde a capacidade de separar).
5. **Custo:** tempo do rank completo; proposta para o Meu Time (chefões + amostra dos treinadores mais perigosos por etapa,
   pré-calculada), com tempo medido no navegador.
6. Relatório curto em `docs/tickets/todas-as-lutas/estudo.md` com recomendação (adotar, adotar com ajuste, não adotar).

## Critérios de aceite
- [ ] Relatório com os 6 pontos e números medidos (não estimados).
- [ ] Nada muda no app nem em data/ (o estudo não publica).
- [ ] Felipe decide depois de ler.
