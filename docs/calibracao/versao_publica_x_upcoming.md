# A calibração vale para a versão pública? Código de 28/03 (7d85acd) x 14/10 (486026e)

Pedido da Construção (15/10/2026). Como o `upcoming` (`486026e`) **não é comprovadamente a versão pública** e a âncora mais próxima do dado do app é o código de **28/03/2026** (`eliteredux-source` `7d85acd`, `er-config` `6a30b66`, NextDex 2.65beta), esta tabela confere, para cada uma das 27 divergências de `docs/calibracao/divergencias.json` e para cada mudança dos tickets 01 a 06, se o trecho do código ou da config do jogo é igual nas duas versões.

Método: o texto de cada bloco (`Impl<ABILITY_X>`, função C ou trecho entre dois marcadores) foi extraído por `git show <commit>:<arquivo>`, sem comentários e com espaço em branco normalizado, e comparado byte a byte. A config foi lida com os mesmos leitores usados nos tickets 01 e 02 (`scripts/categorias_pela_config.mjs`, `scripts/itens_pela_config.mjs`). Números de linha: `7d85acd` → `486026e` (as linhas citadas nos tickets são as do `486026e`).

## Resumo
- **25 de 27 divergências têm o trecho do jogo IGUAL nas duas versões**: o número que os tickets 01 a 06 puseram no motor vale também para o código de 28/03.
- **Diferem: M8, B1.**
  - **M8** (Madness Enhancement x0,5 → x0,8) e **B1** (Feathercoat x0,9/x0,8 → x0,85/x0,7) são divergências de versão por definição; os tickets 01 a 06 não as tocaram (são dos tickets 07 e 08). O motor segue o 2.65beta nelas.
  - Na **config** (não conta como divergência de código): o conjunto de golpes com flag `air`, `horn`, `striker`, `throwing` e a flag `light` inteira só existem como estão em `d1a9a4c` (detalhe em A3, A7, N3).
- Textos de habilidade (`description` em `AbilityList.textproto`) mudaram de redação em Warmonger, Hammer Fist, Deep Freeze, Devious Present, Hyper Cleanse, Thick Blubber, Feathercoat e Madness Enhancement; o **código** dessas habilidades é igual (menos as duas de M8 e B1). O motor lê o texto do NextDex 2.65beta do dado do app, que é o da âncora: nada a fazer para o 2.65beta.

## Efeito nos tickets
| Ticket | Vale para o código de 28/03? | Por quê |
|---|---|---|
| 01 categorias de golpe | **Sim, com 2 ressalvas** | As 8 categorias antigas (soco, mordida, corte, pulso, chifre, chute, flecha, martelo) têm as mesmas flags nos 1032 golpes do app nas duas configs. Ressalvas: o **Ice Ball** ganha `throwing` só em `d1a9a4c` (1 golpe a mais em "arremesso" no dado de hoje), e a categoria **luz** (25 golpes) não existe em `6a30b66`. Nenhuma habilidade do 2.65beta lê `luz`. `DoesMoveMatchFlag` é igual. |
| 02 parâmetros de item | **Sim** | Os 212 itens com efeito: idênticos. `holdEffectModifier`, Expert Belt/Life Orb, Quick Claw, Wide Lens e o Soul Dew na Sp. Def: idênticos. |
| 03 multiplicadores de habilidade | **Sim** | Todos os blocos (A1, A2, A3, M1, M5, M6, B2, B3, N1, N2) e o recuo/hit_count da config (B5) são idênticos. |
| 04 Flash Fire e Dry Skin | **Sim** | `FLASH_FIRE`, `DRY_SKIN`, `WATER_ABSORB` e o trecho da absorção em `battle_util.c`: idênticos. |
| 05 Multiscale e Booster Energy | **Sim** | `MULTISCALE`, `BRAIN_MASS`, `SHADOW_SHIELD`, os dois `Handler` e `GetHighestStatIdExcept`: idênticos. |
| 06 prioridade e campo | **Sim** | `GetMovePriority`, o reforço do terreno, a névoa (Atk e quedas de status), Sand Guard, Sun Basking, Queenly Majesty e `IsBattlerWeatherAffected`: idênticos. |

Conclusão: **a calibração dos tickets 01 a 06 vale para o código de 28/03.** O que depende da versão é só o que os tickets 07 e 08 já separam (M8, B1, as flags novas e os golpes novos).

## Tabela por divergência
| Divergência | Trecho comparado (7d85acd → 486026e) | Igual nas duas? | Observação |
|---|---|---|---|
| **A1** Magma Armor aplicado em dobro e em todo golpe | `abilities.cc` Impl<ABILITY_MAGMA_ARMOR> (linha 1014 → 990, igual) | sim |  |
| **A2** Tough Claws e Big Pecks (contato x1,3) sem efeito | `abilities.cc` Impl<ABILITY_BIG_PECKS> (linha 2110 → 2089, igual)<br>`abilities.cc` Impl<ABILITY_TOUGH_CLAWS> (linha 2458 → 2438, igual)<br>`battle_util.c` IsMoveMakingContact (linha 6531 → 6578, igual) | sim |  |
| **A3** Giant Wings (golpe de asa, vento ou ar x1,3) sem efeito | `abilities.cc` Impl<ABILITY_GIANT_WINGS> (linha 4668 → 4661, igual) | sim | Config `air`: 35 golpes em `6a30b66`, 36 em `d1a9a4c` (entra o Fly). A regra é a mesma; o conjunto muda em 1 golpe. |
| **A4** Flash Fire não absorve Fire | `abilities.cc` Impl<ABILITY_FLASH_FIRE> (linha 720 → 696, igual)<br>`battle_util.c` absorção Flash Fire (linha 4431 → 4479, igual) | sim | `AbilityList.textproto` (Flash Fire): descrição igual nas duas. |
| **A5** Booster Energy não ativa Protosynthesis/Quark Drive | `abilities.cc` ProtosynthesisHandler (linha 6921 → 6917, igual)<br>`abilities.cc` Impl<ABILITY_PROTOSYNTHESIS> (linha 6963 → 6959, igual)<br>`abilities.cc` QuarkDriveHandler (linha 6977 → 6973, igual)<br>`abilities.cc` Impl<ABILITY_QUARK_DRIVE> (linha 7019 → 7015, igual)<br>`battle_util.c` GetHighestStatIdExcept (linha 8687 → 8754, igual) | sim |  |
| **A6** Multiscale e Brain Mass: metade do dano só no 1º golpe com HP cheio | `abilities.cc` Impl<ABILITY_MULTISCALE> (linha 1969 → 1947, igual)<br>`abilities.cc` Impl<ABILITY_BRAIN_MASS> (linha 11485 → 11518, igual)<br>`abilities.cc` Impl<ABILITY_SHADOW_SHIELD> (linha 3191 → 3171, igual) | sim |  |
| **A7** 98 golpes sem categoria (Iron Fist, Strong Jaw, Keen Edge/Sharpness, Striker, Mega Launcher, Mighty Horn, Archer, Super Slammer) | `abilities.cc` DoesMoveMatchFlag (linha 358 → 331, igual) | sim | Config `MoveList.textproto`: `iron_fist` 36/36, `strong_jaw` 28/28, `keen_edge` 51/51, `mega_launcher` 87/87, `arrow` 19/19, `hammer` 32/32, nenhum golpe do app muda de flag. `horn` 22 → 24 e `striker` 20 → 21 só por golpes que não existem em `6a30b66` (9 golpes novos). |
| **A8** Parâmetros de item: tipo, Plates, Muscle Band, Wise Glasses, Gems, Soul Dew, Wide Lens | `battle_util.c` holdEffectModifier (tipo, Plate, Muscle, Wise, Soul Dew, gema) (linha 6956 → 7007, igual)<br>`battle_util.c` Expert Belt / Life Orb (CalcFinalDmg) (linha 7611 → 7674, igual)<br>`battle_main.c` Quick Claw (ordem de turno) (linha 4408 → 4419, igual)<br>`battle_script_commands.c` Wide Lens / Zoom Lens (precisão) (linha 1378 → 1381, igual)<br>`battle_util.c` Soul Dew na Sp. Def (B_SOUL_DEW_BOOST) (linha 7394 → 7455, igual) | sim | Config `items/*`: os 212 itens com efeito de batalha têm `hold_effect`, `hold_effect_strength` e `hold_effect_type` idênticos nas duas (0 diferenças). |
| **M1** Steely Spirit e Airborne (Steel/Flying x1,3, do dono e do aliado) sem efeito | `abilities.cc` Impl<ABILITY_STEELY_SPIRIT> (linha 3455 → 3435, igual)<br>`abilities.cc` Impl<ABILITY_AIRBORNE> (linha 6865 → 6861, igual) | sim |  |
| **M2** Dry Skin não absorve Water | `abilities.cc` Impl<ABILITY_DRY_SKIN> (linha 1494 → 1471, igual)<br>`abilities.cc` Impl<ABILITY_WATER_ABSORB> (linha 632 → 608, igual) | sim |  |
| **M3** Grassy Glide sem +1 no Grassy Terrain | `battle_main.c` GetMovePriority (linha 4257 → 4267, igual) | sim | Config: o `effect` do Grassy Glide é `EFFECT_GRASSY_GLIDE` nas duas. |
| **M4** Misty Terrain: Dragon x0,5 só existe no motor | `battle_util.c` reforço do terreno (linha 7037 → 7088, igual) | sim |  |
| **M5** Punk Rock: som recebido x0,5 não entra | `abilities.cc` Impl<ABILITY_PUNK_ROCK> (linha 3299 → 3279, igual) | sim |  |
| **M6** Water Bubble: Water dado x2 não entra | `abilities.cc` Impl<ABILITY_WATER_BUBBLE> (linha 2726 → 2706, igual)<br>`abilities.cc` Impl<ABILITY_HEATPROOF> (linha 1484 → 1460, difere) | sim | O bloco da Water Bubble é igual; o da Heatproof, de onde ela herda o Fire x0,5, muda só a flag `.noBurnDamage` (sem efeito no dano). |
| **M7** Neblina: o x0,8 vale só para alvo Ghost, no Atk do atacante | `battle_util.c` névoa no Atk (linha 7224 → 7275, igual)<br>`battle_script_commands.c` quedas de status na névoa (linha 8597 → 8637, igual) | sim |  |
| **M8** Madness Enhancement: x0,8 na versão atual (era x0,5 na 2.65beta) | `abilities.cc` Impl<ABILITY_MADNESS_ENHANCEMENT> (linha 9938 → 9939, difere) | **não** | **Diferem.** 2.65beta: x0,5; atual: x0,8. É a divergência de versão por definição (ticket 07/08). |
| **M9** 'Normal vira X' (Aerilate, Pixilate, Refrigerate, Galvanize, Draconize...): STAB, não x1,3 | `abilities.cc` macro ATE_ABILITY (linha 322 → 295, igual)<br>`abilities.cc` Impl<ABILITY_NORMALIZE> (linha 1582 → 1559, igual)<br>`abilities.cc` Impl<ABILITY_CRYSTALLIZE> (linha 3751 → 3731, igual)<br>`abilities.cc` Impl<ABILITY_SUPERCONDUCTOR> (linha 8206 → 8205, igual) | sim |  |
| **M10** Multiplicadores de habilidade entram no dano final, não no poder | `battle_util.c` CalcFinalDmg (linha 7453 → 7516, difere) | sim | A ordem do cálculo é igual. O que difere na função: Friend Guard, Caretaker e Food Lovers do parceiro passam de x0,5 para x0,75 (só em dupla; não afeta o 1x1). |
| **B1** Feathercoat e Dead Bark: x0,85 normal e x0,7 resistido (versão atual) | `abilities.cc` Impl<ABILITY_FEATHERCOAT> (linha 12327 → 12377, difere)<br>`abilities.cc` Impl<ABILITY_BARK_SKIN> (linha 11369 → 11401, igual) | **não** | **Diferem no Feathercoat**: 2.65beta x0,9 / x0,8; atual x0,85 / x0,7. O Dead Bark (código `BARK_SKIN`) é igual nas duas: x0,85 / x0,7. |
| **B2** Hyper Cleanse: Poison recebido x0,5 | `abilities.cc` Impl<ABILITY_HYPER_CLEANSE> (linha 10297 → 10319, igual) | sim |  |
| **B3** Warmonger, Hammer Fist, Plasma Lamp, Deep Freeze (ataque), Devious Present | `abilities.cc` Impl<ABILITY_WARMONGER> (linha 10760 → 10787, igual)<br>`abilities.cc` Impl<ABILITY_HAMMER_FIST> (linha 11518 → 11551, igual)<br>`abilities.cc` Impl<ABILITY_PLASMA_LAMP> (linha 6077 → 6072, igual)<br>`abilities.cc` Impl<ABILITY_DEEP_FREEZE> (linha 9361 → 9361, igual)<br>`abilities.cc` Impl<ABILITY_DEVIOUS_PRESENT> (linha 11407 → 11439, igual) | sim |  |
| **B5** Atomic Fire (recuo 33% pelo effect) e Double Shock (2 acertos) | (só config) | sim | Config: Atomic Fire `EFFECT_RECOIL_33` e Double Shock `hit_count: 2` nas duas; os 15 golpes de recuo fixo e os 6 de `hit_count` > 1 são os mesmos. |
| **N1** Nosferatu: o +20% de dano não existe no código | `battle_util.c` Nosferatu (cura) (linha 4700 → 4748, igual) | sim |  |
| **N2** Thick Blubber: Speed x0,5 não entra | `abilities.cc` Impl<ABILITY_THICK_BLUBBER> (linha 10811 → 10838, igual) | sim |  |
| **N3** Categorias sem suporte: arremesso (23), light (25), lunar (7), drill (5) | `abilities.cc` Impl<ABILITY_ROCKY_PAYLOAD> (linha 5803 → 5798, igual)<br>`abilities.cc` Impl<ABILITY_DEVIOUS_PRESENT> (linha 11407 → 11439, igual) | sim | Config: `throwing` 22 → 23 (o **Ice Ball** ganha a flag em `d1a9a4c`), `lunar` 7/7, `drill` 5/5, **`light` 0 → 25 (a flag não existe em `6a30b66`)**. Nenhuma habilidade do 2.65beta lê `light`. |
| **N4** Sand Guard e Sun Basking bloqueiam prioridade com o clima | `abilities.cc` Impl<ABILITY_SAND_GUARD> (linha 6242 → 6237, igual)<br>`abilities.cc` Impl<ABILITY_SUN_BASKING> (linha 7439 → 7436, igual)<br>`abilities.cc` Impl<ABILITY_QUEENLY_MAJESTY> (linha 2977 → 2957, igual)<br>`battle_util.c` IsBattlerWeatherAffected (linha 8607 → 8674, igual) | sim |  |
| **N5** Utility Umbrella não é modelado | `battle_util.c` IsBattlerWeatherAffected (linha 8607 → 8674, igual)<br>`battle_util.c` sol/chuva no dano (linha 7525 → 7588, igual) | sim | Config: o item Utility Umbrella e os outros 211 itens com efeito são idênticos nas duas. |

## Achado fora das 27
- `CalcFinalDmg`: Friend Guard, Caretaker e Food Lovers do parceiro passam de x0,5 (28/03) para x0,75 (14/10). Só dupla; o motor 1x1 não usa.
- A config de 14/10 tem 9 golpes e 38 habilidades a mais que a de 28/03 (1067 x 1029 habilidades, 1041 x 1032 golpes): é a deriva do ticket 08.

## Reprodução
Ferramentas na pasta de trabalho da sessão (`/tmp`), mas o método cabe em `git show 7d85acd:src/abilities.cc` e `git show 486026e:src/abilities.cc` (e `battle_util.c`, `battle_main.c`, `battle_script_commands.c`) seguido de comparação do bloco; para a config, `git show 6a30b66:MoveList.textproto` e `d1a9a4c:MoveList.textproto`, `items/*.textproto` e `AbilityList.textproto`.
