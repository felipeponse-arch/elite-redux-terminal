# 05 — Rascunho de build coerente com a espécie

Status: pronto-para-revisao (branch `pipeline-rascunho`, sobre `pipeline-quem-resolve` 6446f3b; sem merge e sem publicação)
Bloqueado por: nenhum
Origem: revisão de metagame de 15/10/2026 sobre as 17 builds geradas pelo pipeline (`origin/versao-12-builds-novas`, `docs/tickets/versao-nova/12-builds-novas.md`).

## O que muda (`src/regras/pipeline_build.js`; o cálculo de dano NÃO mudou)
1. **Item**: espécie que ainda evolui (mesma regra de `validateAiBuild`, sem Mega) e com Eviolite liberado até a Etapa (`primeiroLugarDoItem`) leva `Eviolite` no rascunho, com aviso; item recusado (limite do time) fica sem item. Habilidade que gasta o item e pedra da Mega temporária continuam mandando no slot. O pipeline não propõe Leftovers/Life Orb (isso era do script da v12, fora do módulo).
2. **EVs**: Speed base < 60 (`LIMIAR_VELOCIDADE_BAIXA_PIPELINE`) troca os 252 de Velocidade por 252 em HP e 4 na defesa mais baixa, e Jolly/Timid vira Adamant/Modest, SALVO quando a Velocidade decide "bate primeiro" (`baterPrimeiro` com `porQue: "velocidade"`) ou o set tem Electro Ball. O ataque fica em 252, então o dano medido é o mesmo. Motivo escrito em `motivos`. Por que 60: piso da faixa média do jogo; cobre as lentas do caso (28 a 32); espécie de 60 a 80 segue como era.
3. **Natureza/split**: a natureza é física (Adamant/Jolly) só com maioria de golpes físicos e especial (Modest/Timid) só com maioria especial; empate decide o atributo base maior (regra dura, no filtro de cada conjunto). Body Press e Foul Play (usam outro atributo) não contam. Atributo fraco (< 60% do outro, ex. Atk 57 x SpA 100) tira 15 pontos do score do conjunto (`PENA_ATRIBUTO_FRACO_PIPELINE`): não é veto, porque o Ledian (Atk 55 x SpA 97) com Aerodynamics + Mega Punch é caso conferido na calculadora do jogo e segue físico.
4. **Hidden Power**: fora do kit e do preenchimento (`GOLPES_SEM_TIPO_DEFINIDO`). Sem tipo definido o motor lê Normal 80 sem STAB; o pipeline nunca define tipo, então a regra é "nunca". O melhor golpe disponível entra no lugar.
5. **Recuo**: conjunto com golpe de recuo (dado `MOVE_CATEGORIAS.rc`) passa na frente quando a habilidade escolhida anula o recuo (`semRecuo` do motor, Rock Head); `motivos` diz "Rock Head (habilidade escolhida): anula o recuo de Head Smash".

## Antes/depois (dado da v12, etapa 7, 1º candidato; "antes" = pipeline de 6446f3b)
| Espécie | Antes | Depois |
|---|---|---|
| Braviary Redux (Atk 57, SpA 100) | Adamant 252 Atk/252 Spe, Giant Gale + Hidden Power + Rock Tomb + Blaze Kick | Modest 252 SpA/252 Spe, Giant Gale + Return + Overheat + Rock Tomb (sem Hidden Power; o set físico caiu para 3º) |
| Roserade Mega (Atk 83, SpA 145) | 4º candidato Adamant (Double Hit + Leafage + Toxic Needles) | 1º a 3º Modest; o físico fica por último (hk 0) |
| Grimer Redux (Spe 28) | Modest 252 SpA/252 Spe, sem item | Modest 252 HP/252 SpA/4 SpD/0 Spe, Eviolite |
| Phanpy Redux (Spe 32) | Adamant 252 Atk/252 Spe, sem item | Adamant 252 HP/252 Atk/4 SpD/0 Spe, Eviolite; Hidden Power sai do 3º candidato |
| Donphan Redux (Rock Head entre as habilidades) | Guardian Coat + Head Smash | Rock Head + Head Smash, Eviolite |

## Critérios de aceite
- [x] Testes com dado real em `tests/unit/pipeline_rascunho.test.mjs` (10): Bulbasaur/Geodude (ainda evoluem, lentos), Venusaur (sem Eviolite), Eviolite antes da Etapa, Alakazam e Bulbasaur por velocidade (mantêm Spe), 7 espécies no split, Butterfree (atributo fraco), 5 espécies sem Hidden Power, Geodude/Graveler/Onix com Rock Head e o rascunho passando em `validateAiBuild`/`fecharBuild`. As espécies novas da 2.65.4 só existem no branch `dados-2654`; o antes/depois acima foi medido nele e o teste usa espécies equivalentes do dado atual.
- [x] 9 sabotagens `pipeline-rascunho-*` pegas (tests/unit/mutacoes.mjs). Equivalente sem sabotagem: "Eviolite sem checar evolução", porque `validateAiBuild` já recusa Eviolite em quem não evolui (conflitoDeItem).
- [x] `pipeline_build.test.mjs`: o Nidorino saiu da premissa "algum hit-kill de 2" no teste do Flame Burst (os de 2 eram sets mistos com Modest num bicho de Atk 72 x SpA 55; sobraram os Adamant, hit-kill de 1). Sem outra mudança nos 47 testes.

## Limites
- Electro Ball preso à Velocidade foi decidido sem teste (nenhuma espécie lenta do dado atual o leva no pipeline). Gyro Ball troca Velocidade por bulk (a medida só subestima).
- O dano mostrado segue medido com EVs de referência (ataque + 252 Spe) e sem item, como antes.
- Limiar 60 e razão 60%/15 pontos são escolhas minhas: ajustáveis em uma linha cada.
