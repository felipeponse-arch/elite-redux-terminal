# Estado da fila v01–v05 (15/10/2026, ~11:30 UTC)

Branches no GitHub, todas empilhadas a partir do master `cb8d1ce`, sem PR, sem master:
`versao-01-dupla-contagem` -> `versao-02-decisoes` -> `versao-03-selo` -> `versao-04-parser` -> `versao-05-dado` (parcial).
Nada de rank recalculado. Nada publicado.

## O que foi feito
| Ticket | Resultado |
|---|---|
| v01 dupla contagem | Correção geral aplicada (`bonusDeGolpeLidoDoTextoDuelo`); lista fixa de 15 nomes saiu; 5 testes reescritos; 5 sabotagens novas; **o portão achou uma sabotagem sobrevivente** (`loteB-estrategia-sem-armador`: o caso fixo da Courtney deixou de provar a regra) e o v01 ganhou um 3º caso fixo (Flannery 2, granizo); lint antigo de `pipeline_build.js:67` corrigido (travava o `npm run check`). Impacto medido em `docs/calibracao/dupla_contagem_impacto.md`. |
| v02 decisões | Decisão 75 reescrita (versão mais nova; código/config primeiro); fontes reordenadas; M9 "Normal vira X" = STAB x1,5 (31 habilidades, sem x1,3; o motor deixa de reproduzir a calculadora do Ledian: 98% x 78%-93%); Madness Enhancement x0,8; Feathercoat x0,85/x0,7 resistido; Dead Bark x0,85/x0,7 super efetivo (o motor nem lia). Tabela temporária `TEXTO_DA_VERSAO_NOVA_DUELO`. 8 sabotagens novas. |
| v03 selo | Toda build `calibrada` ("Calculado pelo código do jogo"); `estimada` só com habilidade sem regra no motor (atacante ou alvo; `habilidadeSemRegraNoDuelo`, a mesma conta da auditoria), fuga no Intimidate ou consulta sem alvo. `CASOS_CALIBRADOS` saiu. Prioridade do alvo vira só aviso. 11 sabotagens novas. |
| v04 parser | **Desvio do pedido** (ver `perguntas.md` P1): a `er-config` não tem dado estruturado de efeito de habilidade. Entregue: tabela de 74 textos novos da NextDex 2.65.4 -> redação que o parser conhece (57 habilidades perdiam o efeito), inclusive dentro de compostas, e o portão `scripts/medir_texto_novo.mjs`. Falta: Best Offense (código e texto discordam, P2). 4 sabotagens novas. |
| v05 dado | **Parcial** (`05-dado.md`): chefões contra o TrainerList `d1a9a4c` (6 mons corrigidos, `diferenças: 0`, `--aplicar-tudo`); flags de golpe e itens já estavam em `d1a9a4c`. **A troca do dado está bloqueada** (P3). |

## Portões (`npm run check` e suíte: verdes em cada branch; sabotagem `--mudados`: ver abaixo)
- Suíte: v01 918 testes (917 + 1 `todo`), v02 923, v03 933-ish, v04 933, v05 938; 0 falhas em todas. `npm run check` limpo em todas (o erro de lint antigo foi corrigido no v01).
- **Sabotagem `--mudados` SÓ RODOU NO v01 e ainda não terminou**: com o cache vazio são 284 sabotagens e ~37 min por lote de 25 (12 lotes, ~7 h; log em `/tmp/claude-0/dc/portao_v01.log` neste ambiente). Lotes 0 e 1 prontos (1 sobrevivente no 0, já corrigido; 25/25 no 1); lote 2 em andamento. Os portões de v02 a v05 **não foram rodados** (as sabotagens novas de cada ticket foram todas verificadas direto contra os testes do ticket: v02 9/9, v03 12/12, v04 4/4, v05 4/4). O cache de "arquivo que pega" é gravado a cada lote, então as rodadas seguintes serão bem mais rápidas.
- Recomendação: rodar a sabotagem completa no master depois de juntar (a regra da casa já manda).

## O que falta
1. **Troca do dado (v05, P3)**: portar a extração para Node ou rodar os `.ps1` no Windows; depois: NextDex 2.65.4 em `data/`, índices de espécie regerados (808 mudam), Eviolite (item 0), Arbok Mega fora, renomeações (Keen Edge -> Sharpness, Absorbant -> Absorbent, Menacing Situation -> Phobia, Apple Pie -> Apple Cake, Frosty Prescence -> Frosty Presence, Wings of Pestilence -> Malediction, Abominable Monster/Icicle Fist), "onde achar itens", rótulo do app "Dado: ...", alarme semanal. Antes: `node scripts/medir_texto_novo.mjs <gameData novo>` deve sair com código 0 (hoje só Best Offense some).
2. `dados-2654/02` a `07` (habilidades com efeito mudado/prováveis, 29 novas em 3 lotes, sono e paralisia Champions): não começados.
3. **Delta do upcoming** (`d1a9a4c` sobre `7285071`): 9 habilidades e 9 golpes novos, Keen Edge -> Sharpness, 15 habilidades novas sem efeito lido, partes novas de compostas (Serpent Bind, Cotton Down, Grim Neigh...), chefões novos do TrainerList, Best Offense (P2), King of the Jungle.
4. Builds `dados-2654/08` (revisar afetadas) e `09` (17 espécies novas).
5. M10 (ordem do cálculo, multiplicador de habilidade depois do +2): não feito.
6. Fechamento `dados-2654/10`: rank recalculado UMA vez (v01, v02 e o dado novo mexem no rank), histórico, publicar.
7. Sobras já conhecidas: Plasma Lamp (precisão x1,2), Long Reach/Punching Glove e a reação do alvo ao contato (perguntas 2 e 3 do `03-perguntas.md`); as 211 entradas de sinergia mantidas (Flash Fire, Motor Drive... soma sempre, o jogo só depois do gatilho); as outras leituras de texto fora do motor (`habilidadeArma`, condições de habilidade da UI) não foram medidas contra o texto novo; selo olha habilidade, não golpe com efeito sem regra.

## Gasto
Ver `gasto.md`: US$ 45,38 antes do v01 e 47,98 ao fim do v04 (amostra única; cada ticket custou pouco porque as compactações zeraram o contexto). O saldo de crédito não aparece nesta sessão; o Felipe informou ~US$ 44. A fila não parou por crédito: parou no bloqueio do v05.
