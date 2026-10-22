# 08 e 09 — Lista para o usuário aprovar (etapa 1, só leitura)

Status: para-o-usuario
Gerado em 21/10/2026. Nada em `data/builds.json` foi alterado. Rank não recalculado.

## Como foi medido
- Universo: 230 sets curados em `data/builds.json`; 74 tocados por mudança de EFEITO (stats, tipo, habilidade/inata, golpe, sono). Fora: sets que só mudaram movepool por nível ou texto.
- Antes x depois: motor atual (v183), um Pokémon sozinho nas 29 lutas da run, Etapa final. `pts` = pontos médios; `V` = lutas vencidas de 29. "Antes" = mesmo set com stats/tipo/habilidades/inatas e poder de golpe da 2.65beta (snapshot em `data/raw/snapshots/`). É régua relativa de um Pokémon só, não nota de time.
- NÃO medido: mudança de regra de habilidade (não há regra antiga no motor) e chance de efeito secundário, PP. Esses vão como "estimado".
- Propostas: todas passaram `validateAiBuild` com `availableMovesFor`; a melhor pelo motor 1x1, não pelo gosto da comunidade. Playtester decide.
- Fonte dos números: NextDex 2.65.4 contra o snapshot beta; efeitos de habilidade em `docs/pesquisa_2654_config.md` e `docs/decisoes_mecanicas.md`.

## A. Quebradas pela versão nova (14) — precisam de ajuste
Habilidade escolhível ou golpe que a espécie não tem mais. A medida "depois" aplica a habilidade antiga mesmo assim (ilegal no app).

| Espécie (set) | O que mudou | pts antes → depois | Proposta (validada) |
|---|---|---|---|
| Cacjack | Destiny Bond saiu do movepool; slot Tipping Point→Shadow Shield; inata Ominous Shroud→Phantom | 0,94 → 0,41 | Trocar Destiny Bond por Sucker Punch (0,59) |
| Scovillain Mega | Big Leaves saiu (agora Unnerve/Sun Basking/Rite Of Spring); natureza Jolly com golpes especiais já reprovava | 0,50 → 0,54 | Rite Of Spring + natureza Modest (0,62) |
| Machamp Redux | Multiscale saiu; stats 70/110/110/45/115/55 → 127/128/92/30/77/51 | 1,18 → 1,34 (ilegal) | Impenetrable (1,01) — cai 25% frente ao ilegal |
| Beefender | Beast Boost saiu; tipo Bug/Flying→Bug/Fighting; stats 60/124/60/78/60/112 → 55/112/95/40/80/112 | 0,66 → 0,83 (ilegal) | Aerodynamics (0,91) |
| Roserade Mega | Corrosion e Victory Dance saíram; stats 60/145/70/145/90/125 → 80/83/99/145/101/127 | 0,39 → 0,36 | Equinox + Victory Dance→Bullet Seed (0,40) |
| Fujiflap | Air Blower saiu; Atk 125→121, Spe 120→103; Grav Apple 80→90 | 0,78 → 0,95 (ilegal) | Hustle + Dragon Claw→Wing Attack (1,31) |
| Flairgrance | Fairy Aura saiu; stats 121/72/89/99/140/29 → 121/61/99/101/101/70 | 1,02 → 1,33 (ilegal) | Purple Haze (1,32) |
| Sneasler Mega | Weak Armor saiu; Def 70→90, SpD 120→100 | 0,88 → 0,88 | Adrenaline Rush (1,55) |
| Crabominable Mega | Icicle Fist virou inata (não escolhível) | 1,25 → 1,65 (ilegal) | Hyper Aggressive (1,77) |
| Morpekyll (ofensivo) | Unburden saiu; HP 87→97, Atk 121→104 | 1,09 → 1,12 | Looter (1,13) |
| Boarlock (ofensivo) | Gluttony saiu; stats 120/65/65/110/130/60 → 143/35/75/111/132/54 | 0,87 → 1,08 | Magic Guard (1,09) |
| Lanturn | Drizzle saiu (ganhou Photon Burst) | 0,71 → 0,71 | Photon Burst + Water Gun→Signal Beam (0,76) |
| Brontonana | Dragon Energy saiu do movepool | 2,05 → 2,05 | Dragon Energy→Chloroblast (1,63): perde 20% |
| Wormadam Trash | Roost saiu do movepool | 0,23 → 0,23 | Roost→Leech Life (0,74) |

Arcanine Hisuian Mega (item do `builds_pendentes_de_revisao.json`) já não tem build curada: nada a fazer.

## B. Pioram de verdade (medido), mas continuam legais (5)

| Espécie | O que mudou | pts antes → depois | Proposta |
|---|---|---|---|
| Heliomodo | Spe 120→119; inata Solar Power→Sun Basking; Fire Blast 30→20% | 1,73 → 1,29 (V 2→1) | Avisar. Opção: Shock Wave→Sunny Day (1,34), ganho pequeno |
| Breezing | HP 120→90 | 1,79 → 1,32 (V 2→1) | Opção: Nasty Plot→Gust (1,87); decidir com playtester |
| Arbok | 90/105/84/65/84/80 → 60/95/69/65/79/80 | 0,54 → 0,41 | Avisar; melhor troca Poison Fang→Jaw Lock rende só 0,49 |
| Victreebel Redux | inata Bad Luck→Bad Omen | 0,95 → 0,88 | Manter |
| Exeggutor Redux | SpA 130→120, Spe 30→40 | 1,33 → 1,20 | Opção: Energy Wave→Psychic (1,52) |

## C. Stats, tipo ou inata mudaram sem efeito medido (manter)
Sandslash Alolan Mega (Atk/Def/SpA/SpD/Spe ±1), Chandelure Mega Y (inata Ethereal Rush→Infiltrator, 1,34→1,36), Phanfernal (tipo Fire/Grass→Ghost/Grass, inata Phantom→Ignition, 1,27→1,27; Fire Blast perde STAB: avisar), Kleavor Mega (Stone Axe 60→65; medida 1,23→1,12 é ruído de limiar de nocaute, sem piora real).

## D. Habilidade (escolhida ou inata) com regra mudada — estimado, não medido

| Espécie (set) | Habilidade | Efeito da mudança | Direção | Proposta |
|---|---|---|---|---|
| Gothitelle Mega | Madness Enhancement | dano recebido enfurecido 0,5x → 0,8x | piora | Avisar |
| Gallade Redux | Best Offense | perde o x1,3 Keen Edge; +20% Def física (código) | piora provável | Avisar; playtester |
| Lucario | Justified | +1 no MAIOR ataque (Nasty Plot usa SpA) | melhora | Manter |
| Vileplume, Venusaur #0/#1, Bellossom, Ivysaur | Poison Absorb (inata) / Toxic Surge | cura em Toxic Terrain | neutro | Manter |
| Dududunsparce Mega | World Serpent | Long Reach→Serpent Bind | neutro | Manter |
| Flairgrance | Feathercoat (nova inata) | 10/20% → 15/30% | melhora | Ver A |
| Sigilyph #0 e #1, Victreebel Mega | Low Visibility / Wonder Skin | fog 8 turnos; Familia Bond | neutro | Manter |
| Claydol, Ratiking, Gargablox | Fort Knox | exclui Familia Bond | neutro | Manter |
| Exeggutor Redux, Shuckle | Oblivious | imune a Disable/Encore/Torment | melhora | Manter |
| Audino Mega | Pure Love (herda Cute Charm) | sem restrição de sexo | melhora | Manter |
| Rotom Mow | Lawnmower | sobe Def/SpD ao limpar terreno | neutro | Manter |
| Cacjack | Scarecrow | Bad Luck→Cotton Down | neutro | Ver A |

## E. Golpe com número ou PP novos (estimado)
- Fire Blast 30→20% de queimar: Heliomodo, Chandelure Mega X, Chandelure Mega Y, Chandelure, Tyranitar Redux, Wooly Worm #0/#1, Phanfernal, Typhlosion Hisuian, Escarginite. Blizzard 30→20%: Feraligatr, Wartortle. Dano igual; só o efeito secundário cai. Manter e avisar.
- Poder: Spirit Shackle 85→90 (Decidueye Mega, 6→7 vitórias de 29, melhora), Grav Apple 80→90 (Fujiflap), Stone Axe 60→65 (Kleavor Mega). Manter.
- Clangorous Soul precisão 100→101 (Kommo-o): manter.
- PP 10→5 (sem efeito no 1x1 do motor, mas o jogador vê): Protect em Whimsicott #1, Garbodor Mega, Vespiquen, Murkrow, Sigilyph #0, Tinkaton Redux, Spindaze #2, Lepastry, Ivysaur, Escavalier, Forretress, Trevenant, Araquanid, Swalot Mega; King's Shield em Ratiking e Mew; Burning Bulwark em Vanilluxe Redux Mega; Merculight em Ribombee Redux Mega. Night Slash PP 15→20 (Honchkrow, Bisharp). Manter; avisar nas notas.

## F. Sono e paralisia estilo Champions (10 sets, estimado)
Sono dura em média 5/3 turnos de ação perdida (antes 2); Early Bird 2/3; paralisia 12,5% de falha. Sets com golpe de sono: Malamar Mega e Sigilyph #1 (Hypnosis), Hippotaton (Yawn), Amoonguss e Parasect (Spore), Venusaur #0/#1, Bellossom e Butterfree (Sleep Powder), Mew (Dark Void). Nenhum tem golpe de paralisia. Leve piora do golpe de sono; manter e avisar.

## Itens
Nenhum set depende de item cujo efeito mudou (só Skarmorite X/Y mudou de nome; nenhum set usa).

## 09 — 17 espécies novas sem build curada
Etapa pelo `data/rank_disponibilidade.json` (índices de `levelcaps.json`). Nenhuma tem build em `data/builds.json`.

| Etapa | Espécies |
|---|---|
| 1 (Stone Badge, cap 25) | Isoshrew, Isoslash |
| 2 (Knuckle Badge, cap 40) | Volbeep, Illumars |
| 3 (Dynamo Badge, cap 50) | Astrobeep, Illuminaut, Noxislash |
| 4 (Heat Badge, cap 55) | Asudem, Duraludon Mega |
| SEM FONTE de Etapa | Grimer Redux, Muk Redux, Moravine, Phanpy Redux, Donphan Redux, Mastophan, Rufflet Redux, Braviary Redux |

## Perguntas ao usuário
1. Aplicar as propostas da tabela A (14 sets) como estão, ou o playtester revisa cada uma antes (recomendado, pois a escolha do motor é 1x1 e pode tirar o papel da build)?
2. Tabelas B/D/E/F: só avisar na nota da build (padrão), ou trocar golpe nas opções de Breezing, Exeggutor Redux e Heliomodo?
3. 09: as 8 espécies sem fonte de Etapa: gerar com Etapa 9 (set geral, sem trava de golpe por level cap), ou esperar fonte?
