# Investigação: por que `pipeline-prioridade-do-alvo-pelo-dado` só é "pega" em ~2 de 11 rodadas (15/10/2026)

Só leitura e medição; nada no motor, no teste ou no catálogo foi alterado. Base: master `78f5756`.

## Resposta curta
Não há estado compartilhado entre arquivos de teste que explique isso. A sabotagem **sobrevive de forma determinística**: nenhum teste a pega, nem sozinho nem na suíte inteira. As "pegadas" ocasionais não vêm da regra sabotada.

## Medição
Sabotagem aplicada pelas mesmas variáveis do `carregarRegras` (`MUTACAO_ARQUIVO/DE/PARA`):

| Execução | Resultado |
|---|---|
| `pipeline_build.test.mjs` sozinho | passa (status 0, 0 falhas) |
| `duelo_pela_interface.test.mjs` sozinho | passa |
| `prioridade_condicional_no_duelo.test.mjs` sozinho | passa |
| suíte inteira (`tests/unit/*.test.mjs`) | passa; só o `todo` conhecido do Insect Impact |

## Por que sobrevive
A sabotagem troca a prioridade EFETIVA do golpe do alvo (`r.meu.melhor.prio`, que já vem zerada por Psychic Terrain e Surprise!) pela do dado (`gp.prio`). Os dois testes que a deveriam pegar (`pipeline_build.test.mjs`: "Psychic Terrain zera a prioridade do alvo no motor" com Tapu Lele, e "Indeedee: só quem arma o Psychic Terrain...") usam o Flame Burst do Ninetales de Courtney contra um atacante com Psychic Surge.

Desde a decisão de 14/10 (golpe com prioridade barrado pelo Psychic Terrain FALHA inteiro), o motor devolve nesse cenário `golpe: null` e `dano: 0`:

```
prio do dado 1 | prio efetiva 0 | golpe null | dano 0
ameacas: []
```
`pipelineAmeacasDePrioridade` só põe a ameaça na lista se `dano > 0 && prio > 0`. Com `dano = 0` a ameaça nunca entra, **seja qual for a conta de `prio`**. A linha sabotada virou código morto para o Psychic Terrain. O caminho da Surprise! (névoa; zera a prioridade mas o dano segue > 0, aproximação mantida em 14/10) é o único em que `prio` ainda importa, e nenhum teste do pipeline o exercita (`prioridade_condicional_no_duelo.test.mjs` testa o motor, não a lista de ameaças do pipeline).

A sabotagem foi escrita antes de 14/10 (quando o terreno só tirava a prioridade e o dano seguia) e perdeu a proteção quando a decisão mudou.

## De onde vêm as pegadas ocasionais (hipótese, não reproduzida)
O runner conta como "pega" qualquer teste que falhe. Há asserções de tempo que falham por carga da máquina, sem relação com a regra: `pipeline_build.test.mjs:401` (`ms < 2000` por espécie) e `checar_paralelo.test.mjs:66` (`< 1500` ms). Numa rodada completa com várias sabotagens em paralelo (CPUs/2 processos, carga média ~9 aqui), o atraso derruba esses testes de vez em quando. O cache `tests/.sabotagem_cache.json` então grava esse arquivo como "o que pega", e as rodadas seguintes rodam só ele primeiro. Isso bate com "2 de 11". O `vaga.test.mjs` usa uma pasta temporária por teste (`ER_VAGA_PASTA`), então não toca a vaga real: descartado como causa.

## Proposta (não aplicada)
1. Dar à sabotagem um teste que a pegue de verdade: o caso que ainda depende da prioridade efetiva é a **Surprise!** (alvo com Surprise! na névoa: o golpe com prioridade do alvo mantém dano > 0 mas prioridade efetiva 0). Um teste no pipeline com um atacante candidato com Surprise! e `clima = "nevoa"` contra um alvo de golpe com prioridade, esperando `alvoAgeAntes === false`.
2. Ajustar a descrição da sabotagem: hoje diz "ignora Psychic Terrain e Surprise!"; para o Psychic Terrain o efeito é nulo desde 14/10.
3. No runner, não gravar no cache um arquivo que só falhou por tempo: ou trocar as asserções de tempo por orçamento relativo (múltiplo da mediana de uma espécie conhecida), ou ignorar falhas cujo nome case com `ms` no `--completo`.
