# Comparação Motor x IA (time-pelo-motor/01, Fase E)

Gerado por `node scripts/comparar_motor_ia.mjs --comparar`. A IA foi reproduzida: o mesmo prompt do botão de IA do Meu Time, respondido por um agente separado, validado pela mesma `snamesValidosDoTime` do app. Motor e IA são julgados pelo mesmo juiz (luta completa nas 29 lutas da run, mesma Etapa, level cap e buffs).

## Amostra

12 casos; 12 com resposta válida da IA, 0 respostas inválidas (falha registrada), 0 sem resposta ainda.

| Caso | Etapa | Estilo | Clima/Tática | Mono | Favorito | Elenco |
|---|---|---|---|---|---|---|
| c01 | 0 | Balance | - | - | - | 8 |
| c02 | 1 | Hyper Offense | - | - | - | 9 |
| c03 | 2 | Bulky Offense | - | - | - | 10 |
| c04 | 2 | Stall | - | - | - | 10 |
| c05 | 3 | Hyper Offense | Rain | - | - | 12 |
| c06 | 3 | Balance | - | - | SPECIES_SCIZOR | 12 |
| c07 | 4 | Bulky Offense | - | - | - | 12 |
| c08 | 5 | Stall | Telas | - | - | 13 |
| c09 | 6 | Balance | - | - | - | 14 |
| c10 | 7 | Hyper Offense | - | - | - | 14 |
| c11 | 2 | - | - | Fire | - | 15 |
| c12 | 5 | Bulky Offense | - | Steel | - | 13 |

Favorito: só o Motor recebe (o prompt da IA do app não tem favoritos). Ferramentas: a IA do app consulta `buildStandardAiTools`; o agente reproduzido responde só pelo prompt.

## Resultado por caso (vitórias nas 29 lutas, pontos médios por luta; entre parênteses, só as lutas que ainda faltam na Etapa)

| Caso | IA | Motor (variante do estilo) | Motor (melhor variante) |
|---|---|---|---|
| c01 | 20/29, 11.4 pts (20/29, 11.4) | seguro: 20/29, 11.4 pts (20/29, 11.4) | ofensivo: 20/29, 11.4 pts (20/29, 11.4) |
| c02 | 17/29, 9.5 pts (16/28, 9.3) | ofensivo: 16/29, 9.5 pts (15/28, 9.3) | ofensivo: 16/29, 9.5 pts (15/28, 9.3) |
| c03 | 14/29, 8.3 pts (13/27, 8.2) | seguro: 23/29, 12.8 pts (21/27, 12.5) | sinergia: 26/29, 13.6 pts (24/27, 13.4) |
| c04 | 23/29, 12.7 pts (21/27, 12.5) | seguro: 25/29, 13.6 pts (23/27, 13.4) | ofensivo: 25/29, 13.6 pts (23/27, 13.4) |
| c05 | 23/29, 12.5 pts (19/25, 12.1) | sinergia: 24/29, 13.4 pts (20/25, 13.0) | ofensivo: 26/29, 14.3 pts (22/25, 14.0) |
| c06 | 25/29, 13.5 pts (22/25, 13.6) | seguro: 24/29, 13.2 pts (21/25, 13.2) | ofensivo: 24/29, 13.2 pts (21/25, 13.2) |
| c07 | 20/29, 11.7 pts (13/21, 10.7) | seguro: 26/29, 14.4 pts (18/21, 13.8) | ofensivo: 26/29, 14.4 pts (18/21, 13.8) |
| c08 | 21/29, 11.8 pts (14/20, 11.5) | sinergia: 27/29, 15.3 pts (19/20, 15.3) | ofensivo: 29/29, 15.9 pts (20/20, 15.8) |
| c09 | 21/29, 11.9 pts (12/18, 11.0) | seguro: 24/29, 13.7 pts (15/18, 13.6) | seguro: 24/29, 13.7 pts (15/18, 13.6) |
| c10 | 17/29, 9.9 pts (6/9, 10.7) | ofensivo: 27/29, 15.3 pts (9/9, 16.4) | ofensivo: 27/29, 15.3 pts (9/9, 16.4) |
| c11 | 13/29, 7.7 pts (12/27, 7.7) | seguro: 18/29, 9.8 pts (16/27, 9.5) | sinergia: 18/29, 9.8 pts (16/27, 9.5) |
| c12 | 14/29, 8.2 pts (10/20, 8.5) | seguro: 25/29, 13.7 pts (19/20, 14.6) | sinergia: 25/29, 13.7 pts (19/20, 14.7) |

## Agregado (média ± desvio entre os casos com resposta válida da IA)

| Medida | IA | Motor (estilo) | Motor (melhor) |
|---|---|---|---|
| vitórias nas 29 | 19.0 ± 3.8 | 23.3 ± 3.3 | 23.8 ± 3.7 |
| pontos médios por luta (29) | 10.8 ± 1.9 | 13.0 ± 1.8 | 13.2 ± 1.9 |
| dispersão dos pontos entre as lutas (29) | 5.4 ± 0.6 | 4.5 ± 0.8 | 4.3 ± 1.1 |
| pontos médios nas lutas DENTRO da amostra de busca | 5.7 ± 3.0 | 10.8 ± 3.0 | 11.4 ± 3.0 |
| pontos médios nas lutas FORA da amostra de busca | 12.3 ± 1.9 | 13.8 ± 1.4 | 13.9 ± 1.5 |
| cobertura nas lutas que faltam (%) | 64.6 ± 12.5 | 80.7 ± 13.5 | 82.7 ± 14.2 |

Contando resposta inválida como zero vitória: IA 19.0 vitórias médias nas 29 (só os 12 casos com resposta).

Diferença Motor(estilo) - IA em pontos médios por luta (média, erro padrão entre casos, casos melhor/igual/pior): 29 lutas: 2.2 (ep 0.6; 10/0/2); dentro da amostra de busca: 5.0 (ep 1.1; 11/0/1); FORA da amostra de busca: 1.5 (ep 0.6; 9/0/3).

## Cobertura de ameaças (lutas perdidas e em quantos casos)

- IA: Norman 1 (12), Tate And Liza 1 (11), Drake (11), Archie Mt Pyre (10), Maxie Magma Hideout (10), Archie (9), Wattson 1 (8), Shelly Weather Institute (7)
- Motor (estilo): Norman 1 (12), Tate And Liza 1 (11), Drake (8), Maxie Magma Hideout (8), Wattson 1 (4), Matt Mt Pyre (4), Archie Mt Pyre (4), Tabitha Mossdeep (4)

## Plano B

A IA do app não oferece plano B. O Motor oferece (troca medida na luta mais difícil):

- c01: nenhuma troca em vaga livre melhora a luta mais difícil (Archie) na simulação
- c02: nenhuma troca em vaga livre melhora a luta mais difícil (Archie) na simulação
- c03: nenhuma troca em vaga livre melhora a luta mais difícil (Maxie Magma Hideout) na simulação
- c04: nenhuma troca em vaga livre melhora a luta mais difícil (Maxie Magma Hideout) na simulação
- c05: Pelipper -> Gengar (+2 pts em Maxie Magma Hideout)
- c06: Gyarados -> Metagross (+14.05 pts em Maxie Magma Hideout)
- c07: Tyranitar Mega -> Lucario Mega X (+1 pts em Maxie Magma Hideout)
- c08: nenhuma troca em vaga livre melhora a luta mais difícil (Tate And Liza 1) na simulação
- c09: nenhuma troca em vaga livre melhora a luta mais difícil (Maxie Magma Hideout) na simulação
- c10: nenhuma troca em vaga livre melhora a luta mais difícil (Matt) na simulação
- c11: nenhuma troca em vaga livre melhora a luta mais difícil (Archie) na simulação
- c12: Lucario Mega X -> Lucario Mega Z (+2 pts em Drake)

## Reprodutibilidade (Motor rodado 2x, cache novo)

12/12 casos deram os mesmos Pokémon e builds nas três variantes.

## Tempo

| Caso | Motor, 1ª rodada (ms) | Motor, 2ª rodada (ms) |
|---|---|---|
| c01 | 9149 | 9051 |
| c02 | 7410 | 7385 |
| c03 | 12226 | 12146 |
| c04 | 8234 | 8246 |
| c05 | 11665 | 11725 |
| c06 | 10604 | 10545 |
| c07 | 12792 | 12673 |
| c08 | 13400 | 13235 |
| c09 | 12828 | 12521 |
| c10 | 11713 | 11297 |
| c11 | 10606 | 10161 |
| c12 | 12218 | 11429 |

Tempo da IA: não medido pelo script (vem do agente, fora do Node).

## Falhas conhecidas


## Limitações

- O prompt da IA do app não tem favoritos: o c06 trava Scizor só para o Motor. No c08 (Tática Telas) e no c05 (clima) o Motor também recebe um insumo (sinergia medida) que o prompt da IA não tem.
- O agente respondeu só pelo prompt, sem as ferramentas `buildStandardAiTools` que a IA do app usa, e sem conferir os snames; a validação do app é que decide (nada foi corrigido).
- Os dois lados usam as mesmas builds top-1 do pipeline contra o campo: isso favorece a IA, que no app teria builds salvas ou curadas, sem essa garantia.
- O agente é um Sonnet em chat; o modelo do `claude.use` do app pode ser outro.
- O tempo da IA não foi medido. O Motor busca em uma amostra de 3 a 10 lutas, julgada junto com as outras (por isso a conclusão usa só as lutas FORA da amostra): a IA não vê o juiz, então parte da vantagem do Motor é otimizar a própria régua. Amostra de 12 casos, um elenco por caso, uma resposta da IA por caso (o ruído da própria IA não foi medido).

## Conclusão

Nas lutas FORA da amostra de busca, com a variante do estilo, o Motor supera o desvio entre casos, com 1 resposta da IA por caso: diferença média de 1.5 pontos por luta (erro padrão 0.6, n=12), melhor em 9, pior em 3. O ruído da própria IA (respostas repetidas) não foi medido. Vale só para esta amostra e estas limitações. O Motor NÃO vira padrão sem aprovação do usuário.

