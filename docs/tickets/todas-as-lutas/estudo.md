# Estudo: rank com todas as lutas (16/10/2026)

Ticket: [01-estudo-rank-com-todas-as-lutas.md](01-estudo-rank-com-todas-as-lutas.md). Nada mudou no app nem em `data/`.
Método: o MESMO rank v2 (peso por ameaça iterado, margem, 2 dificuldades), com as 29 lutas de chefão (base) e com elas mais as
538 lutas comuns da run. Scripts: `scripts/estudo/lutas_comuns.mjs`, `scripts/calcular_rank_v2.mjs --lutas-extra --saida`,
`scripts/estudo/comparar_ranks.mjs`.

## 1. Etapa de cada treinador (pelo mapa do jogo)
895 treinadores. Entram 538 lutas comuns (2053 Pokémon). Fora: 123 chefões (já contam), 210 revanches (no jogo não têm mapa
próprio), 9 sem mapa, 15 em mapa sem etapa conhecida (Mt Chimney 7, S.S. Tidal 8).
Por etapa: 0:75, 1:79, 2:53, 3:50, 4:0, 5:83, 6:129, 7:47, 8:22. A etapa 4 vazia é do resolvedor de mapas (rotas da época do
Norman caem na 5); conferir se o estudo virar padrão.

## 2. O que muda no rank
| | Fácil/Ace | Elite |
|---|---|---|
| Espécies que mudam de tier | 293 de 1598 (18%) | 453 (28%) |
| Variação média da nota | 4,1 pontos | 6,4 pontos |
| Pulam 2 tiers ou mais | 3 | 12 |
| Sobem mais | Orchestot C49→A83, Great Tusk C48→B73, Tinkaton B71→A89 | Orchestot C32→A82, Ash-Greninja C47→A83, Archaludon B61→A89 |
| Caem mais | Cobalion B58→C37, Weavile S93→A78, Hydreigon A82→B67 | Wishiwashi B65→C33, Ditto A79→B51, Swampert B74→B52 |

## 3. Contra a comunidade (percentil médio)
| | Fácil/Ace só chefões | Fácil/Ace todas | Elite só chefões | Elite todas |
|---|---|---|---|---|
| Fortes (maior = melhor) | 81,3 | 80,3 | 77,4 | **80,4** |
| Fracos (menor = melhor) | 33,2 | 37,0 | 35,9 | 36,8 |
Elite melhora nos fortes (+3); Fácil/Ace piora um pouco nos dois. Diferenças pequenas: a comunidade não decide sozinha.

## 4. Peso das lutas comuns — o achado principal
No Elite Redux o treinador comum é quase tão perigoso quanto o chefão: peso médio por luta 0,44 (comum) x 0,45 (chefão) no
Fácil/Ace e 0,48 x 0,55 no Elite (as mais perigosas: Kyra, Baneful Petalburg Woods, Mary, Johanna). Como são 538 contra 29, as
comuns ficam com **95% do peso total** e os chefões com 5%: o rank passa a medir "a run inteira" e quase deixa de medir os
chefões, que são as lutas que travam o progresso.

## 5. Custo
Rank completo: 2h20 (8418 s) contra 12 min só com chefões, com o processador inteiro ocupado. Para o Meu Time ao vivo, simular as
538 lutas é inviável (~2 min por time); precisaria de uma amostra pré-calculada (as comuns mais perigosas de cada etapa).
Ver também o ticket desempenho-calculo/01 (deduplicar adversários e cache devem cortar bastante esse tempo).

## 6. Recomendação
**Adotar com ajuste**: as lutas comuns entram, mas com uma fatia fixa do peso (ex.: chefões 50% + comuns 50%, ou 60/40), em vez
de cada luta pesar igual. Assim o rank ganha a run inteira sem perder os chefões. Antes de adotar: (a) medir 2 ou 3 divisões
(precisa rodar de novo, mas só o peso: guardar os resultados por luta para não refazer as 2h20); (b) aplicar o corte de tempo do
ticket desempenho-calculo/01; (c) no Meu Time, usar as 30 comuns mais perigosas de cada etapa mais os chefões.
