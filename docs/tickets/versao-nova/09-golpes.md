# v09 — Golpes novos e alterados (upcoming d1a9a4c)

Status: pronto-para-revisao (branch `versao-09-golpes`, empilhada em `versao-08-sono-paralisia`, sem merge, sem PR).
Tamanho: M
Autorização: Felipe, 15/10/2026 (fila v06–v09). Fonte: `MoveList.textproto` e `SpeciesList.textproto` da er-config `d1a9a4c`.

## Conferência dos golpes que já existiam
Comparei os 1032 golpes da NextDex 2.65.4 com a MoveList de `d1a9a4c`, golpe a golpe: **tipo, poder, precisão, PP e prioridade são iguais** (nenhum golpe alterado). A única diferença é o campo `split` em 32 golpes ("USE_HIGHEST_OFFENSE", "HITS_DEF" na NextDex x "SPECIAL"/"PHYSICAL" na config): é só a forma de guardar (a NextDex deriva o split do efeito), sem mudança de regra. As **flags** (punho, mordida, corte, chifre, chute, flecha, martelo, arremesso, luz, lunar, broca) já tinham vindo da config no calibracao-01; `data/golpes_flags_config.json` foi regerado contra `d1a9a4c` (1041 golpes).

## Os 9 golpes novos (ids 1032–1040, na ordem da config)
| Golpe | Tipo / split | Poder / precisão | Efeito (config) | Flags |
|---|---|---|---|---|
| Eerie Laugh | Dark / status | — / 100 | paralisa ignorando o tipo | som |
| Baneful Kick | Poison / físico | 85 / 100 | 10% de veneno | contato, chute |
| Cheap Stab | Dark / físico | 85 / 100 | — | contato, chifre |
| Arc Blast | Electric / especial | 95 / 95 | 20% de -1 SpDef | luz |
| Ghoulish Gore | Ghost / físico | 85 / 100 | — | contato, chifre |
| Glitter Beam | Fairy / especial | 85 / 100 | 20% de -1 precisão | luz |
| Luster Glow | Psychic / especial | 85 / 90 | 40% de -1 Ataque | luz |
| Sparkling Blast | Water / especial | 90 / 100 | — | luz |
| Scorching Ray | Fire / especial | 85 / 100 | 20% de queimadura | luz |

Pelo código manda o `effect_chance` (Scorching Ray: 20%, a descrição inglesa diz 30%; Arc Blast: o efeito é -SpDef, a descrição diz "defense"). A config não traz PP em 8 deles: o app guarda 10 (o motor não gasta PP).

## Quem aprende
48 espécies ganham os golpes novos por level-up ou tutor (ex.: Alakazam Luster Glow 51, Electrode Arc Blast 56, Hitmonlee Baneful Kick 46, Rhyhorn Cheap Stab por tutor), como a config.

## Como entra no dado
`scripts/extracao/config_nova.mjs` ganhou `golpes` e `aprende` no patch (`data/config_nova.json`); `transform.mjs --config-nova` aplica; `scripts/extracao/golpes_novos.mjs` acerta os derivados por id (`move_categorias.json`, `move_roles.json` — Eerie Laugh é "suporte" —, `move_translations_pt.json`, com tradução PT dos 9). Teste `extracao_transform` continua travando dex == bruto + patch.

## Fica de fora (decisão para o Felipe / Construção)
- **Aprendizado em geral**: a config tem ~600 espécies com golpes de level-up/tutor diferentes da NextDex 2.65.4 (tutores novos como Tailwind, Focus Punch, Clear Smog, Reflect...; alguns golpes tirados, ex. Arbok perde Baneful Bunker no 61). Só os 9 golpes novos foram sincronizados. Sincronizar o resto mexe nas opções de golpe de 600 espécies (builds, rank): fica para o fechamento (dados-2654/10) se o Felipe quiser.
- 2 espécies novas na config sem entrada no dex (Bruxish Mega, Jellicent Mega): entram com as espécies novas (dados-2654/09).
- Sem rank recalculado.

## Testes e sabotagens
`tests/unit/golpes_novos_2654.test.mjs` (4 testes: dado, aprendizado, reforço por categoria de flag com Photokinesis/Striker/Mighty Horn, Eerie Laugh como plano de paralisia); `categorias_de_golpe_da_config` agora confere 1041 golpes. 4 sabotagens `versao-*` em arquivos de dado (Arc Blast sem luz, Eerie Laugh sem papel e sem efeito, Hitmonlee sem Baneful Kick): as 4 pegas trocando o arquivo em disco (o atalho de sabotagem rápida só troca código de regra). Suíte 986 testes, 0 falhas; `npm run check` limpo; app abre sem erro de JavaScript.
