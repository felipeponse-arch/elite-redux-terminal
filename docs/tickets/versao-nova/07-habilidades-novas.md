# v07 — Habilidades novas (dados-2654/04, 05, 06 + delta do upcoming)

Status: pronto-para-revisao (branch `versao-07-habilidades-novas`, empilhada em `versao-06-habilidades-mudadas`, sem merge, sem PR).
Tamanho: G
Autorização: Felipe, 15/10/2026 (fila v06–v09 repassada pelo "Elite Redux - Construção"). Regra do Felipe: quando as fontes divergem vale o CÓDIGO do jogo; o app mira a versão mais nova (er-config `d1a9a4c` + código `486026e`).
Peça P1 respeitada: nenhuma regra foi gerada do `abilities.cc`; cada regra foi escrita à mão, lida do código, e o texto da habilidade continua sendo o que o motor lê.

## O dado: o delta da config nova entra no app
A NextDex 2.65.4 não tem as 9 habilidades do upcoming (`d1a9a4c`), nem o Sharpness, nem as habilidades novas de 7 espécies. Em vez de remendar a mão, o delta virou um patch reprodutível:
- `scripts/extracao/config_nova.mjs <pasta da er-config> <commit>` compara `AbilityList.textproto` e `SpeciesList.textproto` com o `dex_compact.json` e grava `data/config_nova.json` (pequeno, committado: a extração roda sem a er-config à mão).
- `scripts/extracao/transform.mjs --config-nova=data/config_nova.json` aplica o patch por cima da extração. Teste `extracao_transform`: `dex_compact.json` == extração do bruto 2.65.4 + patch, byte a byte.
- O que o patch traz: **Keen Edge vira Sharpness** (mesmo id 271; nome trocado também em bosses, boss_reference_builds, builds, species_rank e nos textos PT); **17 textos novos** de habilidades que existem nos dois lados ("Keen Edge moves" -> "Slashing/Sharpness moves", Power Fists "Punching moves", Cool Exit "once per battle"...); **9 habilidades novas** (ids 1063–1071: Photokinesis, Photon Burst, Rippling Punch, Cackling, Fresh Snowfall, Sticky Situation, Bioluminescent, Blinking Flash, Brain Freeze); **10 espécies**: Chinchou/Litwick/Lampent/Chandelure Redux (Photokinesis), Lanturn/Lumineon (Photon Burst), Heliolisk (Photokinesis innate), Raichu Mega Y (Shiny Lightning vira No Guard), Kirlia Redux (Tidal Rush vira Hydration, `b726428`) e Morpekyll Hangry 97/104/78/62/74/121 (`dfe30fb`) — os dois remendos do `dados-2654/01` que o v05 deixou de fora.
- Build do Lanturn com Drizzle (a espécie perdeu a habilidade) foi para `builds_pendentes_de_revisao.json` (dados-2654/08).
- Gate de texto: `scripts/medir_texto_novo.mjs` contra a AbilityList da config: 0 habilidades perdem o efeito (os 2 "muda" são nomes repetidos, Embody Aspect e As One). O parser passou a aceitar "Sharpness moves", "Slashing moves" e "Boost the power of ...".

## Veredito por habilidade (as 38 novas)
| Habilidade | Veredito | Fonte (486026e) | No motor |
|---|---|---|---|
| Butterfly Wings, Sand Titan, Mega Sol, Petroleum Jelly, Crimson Crown, Overclock, Thermal Dweller, Lethal Touch, Sour Apple, Searchlight, Bad Guy, Ignition, Smarty Pants, Bird Type, Creepy Crawlie, Frosty, Poison Upsurge, Bush Rush, Guerilla Fighter, Engulf, Bioluminescent, Brain Freeze | já lidas; **conferidas** | `abilities.cc` 12662–12830 | testes de confirmação. Frosty/Poison Upsurge: o motor lê o x1,2 (o x1,5 abaixo de 1/3 de HP não entra, como Blaze/Torrent) |
| Familia Bond | **corrigida** | `abilities.cc:12662`, `battle_script_commands.c:995-1003` | golpe duplo 100% + 50% e **atravessa Fort Knox/Wonder Skin** (`resistsFortKnox`): vale também para Parental Bond, Multi-Headed, Hydra, Hand Barnacles e 3 > 1; Hyper Aggressive continua barrado |
| Photokinesis | **nova regra** | `abilities.cc:12837` | golpe de luz (flag `light`, categoria "luz") x1,3 |
| Photon Burst | **nova regra** | `abilities.cc:12845` | luz x1,3 e o golpe é calculado contra a Defesa física, mesmo especial |
| Rippling Punch | **nova regra** | `abilities.cc:12854` | soco também é som (Soundproof barra, Punk Rock conta) |
| Spicy Spray | **nova regra** | `abilities.cc:12687` | qualquer golpe que causa dano queima o atacante (sem contato, sem chance); Fire e Water Veil imunes |
| Third-Degree Burn | **nova regra** | `abilities.cc:12735` | queima qualquer tipo; golpe Fire atravessa as habilidades do alvo (Flash Fire, Wonder Guard, Fort Knox...) |
| Cackling | **nova regra** | `abilities.cc:12864` | Eerie Laugh na entrada paralisa o alvo, ignorando o tipo (Electric também); "duas vezes por batalha" = uma entrada no modelo |
| Hemorrhage | **nova regra** | `abilities.cc:12714` | o Hemotoxin do sangramento: quem sangra perde as habilidades |
| Mana Coat | **nova regra** | `abilities.cc:12705` | golpe físico x1,3 com Psychic Terrain no campo |
| Light Wield | **nova regra** | `abilities.cc:12819` | Light Screen de 3 turnos do lado do dono (o Light Clay de 5 não entra) |
| Insect Eater | **nova regra** | `abilities.cc:4086` | x1,5 contra alvo Bug, x0,5 contra atacante Bug, **pelo tipo do Pokémon**, não do golpe. O mesmo vale para Dragonslayer (`:4073`), que o motor tratava pelo tipo do golpe e foi corrigido; o Lumberjack (`:5752`) segue como estava (tabela de tipos) — resíduo registrado |
| Fresh Snowfall | **nova regra** | `abilities.cc:12877` | Powder Snow de 30 de poder ao levar golpe ESPECIAL |
| Sticky Situation | **nova regra** | `abilities.cc:12888` | golpe Bug derruba a Speed do alvo (-1 por acerto, sem chance) |
| Packed Ice | **parcial** | `abilities.cc:12781` | imune a Ice (tabela de tipos); o +2 de Defesa depois da absorção não está no motor |
| Sea Guardian, Sun Worship | **leitura corrigida** | `abilities.cc:4553`, `4809` | "Ups highest stat by +1 on entry in rain/sun" passou a ser lido (só com a chuva/o sol da luta) |
| Grimace | **sem regra** | `abilities.cc:10720` | Mean Look na entrada: o duelo não modela troca (como Tag e Arena Trap) |
| Blinking Flash | **sem regra** | `abilities.cc:12907` | -1 de precisão com 10% de chance: o motor não tem estágio de precisão |

Conferência final: `tests/unit/habilidades_novas_2654.test.mjs` percorre os ids 1034–1071 e exige que cada um seja lido ou esteja na tabela de sem regra com motivo (Grimace, Blinking Flash). Nenhuma esquecida.

## Dois defeitos achados no caminho
- **Chance de status em dobro**: a frase "X moves have a N% chance to cause Y" era lida por duas rotinas; Resonance (30% de sangramento no som) saía 51% e o Brain Freeze nasceria igual. Uma leitura só.
- **Dragonslayer** valia pelo tipo do golpe (`resistTipo`); o código manda o tipo do atacante.

## Testes e sabotagens
- `tests/unit/habilidades_novas_2654.test.mjs` (19 testes, dado real e unidades sintéticas); suíte unitária 977 testes, 0 falhas; `npm run check` limpo; `artifact_final.html` abre no Chromium sem erro de JavaScript, rótulo "build 2.65.4".
- 17 sabotagens novas `versao-*` (luz, Photon Burst, Rippling Punch, Spicy Spray, Third-Degree Burn x2, Cackling, chance em dobro, Hemorrhage, Mana Coat, Light Wield, Insect Eater, Familia Bond, Fresh Snowfall, Sticky Situation, Sea Guardian, Packed Ice): todas pegas pelos testes (rodadas direto; o portão `--mudados` completo não foi rodado, ≈37 min por 25).

## Ressalvas
- Rank NÃO recalculado; as 9 habilidades e os 10 remendos de espécie não passaram pelo rank (ticket de fechamento).
- Sem tradução PT para as 9 habilidades novas (a ficha cai para o inglês).
- Golpes novos do upcoming (Eerie Laugh, Powder Snow tipados, flags `light`) são do v09; aqui o Eerie Laugh e o Powder Snow entram só como efeito da habilidade.
