# Comparação motor x simulador do jogo (WebAssembly 2.65.3b)

Data: 21/10/2026. Versão do simulador: Elite Redux 2.65.3b (aba Calculator de https://elite-redux-battle-simulator.darkchocolate069069.workers.dev/).
Ticket: `01-comparar-motor-com-simulador-wasm.md`. Teste permanente: `tests/unit/calibracao_simulador_wasm.test.mjs` (20 cenários, 80 casos).

## Método
- Só valores observados: preenchi atacante, defensor, nível, natureza, item, EVs (IVs 31, como o simulador fixa), habilidade, clima e telas na calculadora e anotei a faixa mínimo-máximo de UM acerto. Nada do site foi copiado (nem WebAssembly, nem código).
- Cada cenário tem os mesmos dois Pokémon no simulador e no motor (`unidadeDaBuild` + `danoNoDuelo`). Conferi também os atributos finais dos dois lados: bateram em todos (ex.: Ledian 154/150/99/73/143/189 x Ninetales 162/94/104/134/132/132).
- O motor devolve a média esperada. Para comparar com um acerto, tiro a precisão, a chance de crítico, o número de acertos e o 2º soco da Raging Boxer. Golpe que sempre acerta crítico (Aerial Ace) o simulador mostra com o crítico; a conta devolve o x1,5.
- Coluna "motor": faixa equivalente (média/0,925 = máximo; 85% disso = mínimo) e a média. Coluna "delta": média do motor contra a média da faixa do simulador. Tolerância do teste: 4% (ou 2,5 de dano em golpe fraco), porque o jogo arredonda a cada etapa.
- Estado de partida do motor: duelo.js depois da correção da Aerodynamics (abaixo). Antes dela, 3 casos (Aerial Ace nos cenários S1 a S3) ficavam 28% acima e o Dual Wingbeat 23% acima.

## Cenários
| Id | Atacante | Defensor | Campo |
|---|---|---|---|
| S1 | Ledian nv55 Jolly, 84 HP/172 Atk/252 Spe, Aerodynamics (inatas Raging Boxer, Iron Fist, Aerilate), Life Orb | Ninetales nv55 Modest, sem EV, Charcoal, Flaming Soul | nenhum |
| S2 | o mesmo, sem item | o mesmo | nenhum |
| S3 | o mesmo, Choice Band | o mesmo | nenhum |
| S4 | Excadrill nv50 Adamant 252 Atk/252 Spe, Tough Claws | Chansey nv50 Bold 252 HP/252 Def, Eviolite | nenhum |
| S5 | o mesmo | Chansey sem item | nenhum |
| S6 | Alakazam nv50 Timid 252 SpA/252 Spe, Trace, Choice Specs | Chansey sem item | nenhum |
| S7 | Alakazam, Life Orb | Chansey | nenhum |
| S8 | Charizard nv50 Timid 252 SpA/252 Spe, Molten Down | Chansey | Sol |
| S9 | Kingdra nv50 Modest 252 SpA/252 Spe, Swift Swim | Chansey | Chuva |
| S10 | Excadrill | Chansey com Reflect | nenhum |
| S11 | Alakazam | Chansey com Light Screen | nenhum |
| S12 | Excadrill | Chansey com Aurora Veil | nenhum |
| S13 | Excadrill, crítico | Chansey com Reflect | nenhum |
| S14 | Excadrill, crítico | Chansey sem tela | nenhum |
| S15 | Ledian (Mach Punch, Quick Attack, Bullet Punch, Aqua Jet) | Ninetales (Queenly Majesty) | nenhum |
| S16 | Scizor nv50 Adamant 252 Atk/252 Spe, Light Metal (inatas Pollinate, Hyper Cutter, Technician) | Chansey | nenhum |
| S17 | Alakazam, Expert Belt | Chansey | nenhum |
| S18 | Kingdra | Rhydon nv50 Impish 252 HP/252 Def, Lightning Rod | Areia |
| S19 | Excadrill | Glalie nv50 Impish 252 HP/252 Def, Refrigerate | Granizo |
| S20 | Excadrill | Chansey | Granizo |

Cobrem: Insect Impact, Aerilate (Mega Punch e Aerial Ace), Raging Boxer e Iron Fist (os golpes de soco), Life Orb, Choice Band, Choice Specs, Expert Belt, Eviolite, Reflect, Light Screen, Aurora Veil (x0,5 em singles e nada no crítico), crítico, Sol, Chuva, Areia (+50% de Sp. Def em Rock), Granizo (+50% de Def em Ice), imunidade por Queenly Majesty, super efetivo, Technician, Tough Claws, golpes de 2 acertos.

## Resultado: 80 casos
Dentro da tolerância: **80 de 80** (maior diferença +3,1% e -4,0%, ambas em dano pequeno de arredondamento). Oito imunidades iguais (Shadow Ball no Normal, golpes de prioridade na Queenly Majesty).

| # | Cen. | Golpe | Simulador | Motor | Delta |
|---|---|---|---|---|---|
| 1 | S1 | Mega Punch | 142-170 | 143-169 (média 155.9) | -0.0% |
| 2 | S1 | Aerial Ace | 106-127 | 107-125 (média 116.0) | -0.4% |
| 3 | S1 | Insect Impact | 30-36 | 30-36 (média 32.9) | -0.3% |
| 4 | S1 | Dual Wingbeat | 53-64 | 53-62 (média 57.4) | -1.9% |
| 5 | S2 | Mega Punch | 110-131 | 110-130 (média 120.0) | -0.5% |
| 6 | S2 | Insect Impact | 23-28 | 23-27 (média 25.3) | -0.8% |
| 7 | S2 | Aerial Ace | 82-98 | 82-96 (média 89.2) | -0.9% |
| 8 | S2 | Dual Wingbeat | 42-50 | 41-48 (média 44.2) | -4.0% |
| 9 | S3 | Mega Punch | 163-195 | 165-194 (média 179.3) | +0.1% |
| 10 | S3 | Insect Impact | 35-42 | 35-41 (média 37.8) | -1.8% |
| 11 | S3 | Aerial Ace | 120-144 | 122-143 (média 132.5) | +0.3% |
| 12 | S3 | Dual Wingbeat | 60-72 | 60-71 (média 65.8) | -0.4% |
| 13 | S4 | Earthquake | 147-176 | 150-177 (média 163.3) | +1.1% |
| 14 | S4 | Rock Slide | 62-74 | 64-75 (média 69.1) | +1.7% |
| 15 | S4 | Iron Head | 129-154 | 130-153 (média 141.8) | +0.2% |
| 16 | S4 | Drill Run | 164-196 | 166-195 (média 180.3) | +0.2% |
| 17 | S5 | Earthquake | 221-264 | 224-264 (média 244.1) | +0.7% |
| 18 | S5 | Rock Slide | 93-111 | 94-111 (média 102.8) | +0.8% |
| 19 | S5 | Iron Head | 193-230 | 195-229 (média 211.8) | +0.1% |
| 20 | S5 | Drill Run | 245-292 | 248-291 (média 269.5) | +0.4% |
| 21 | S6 | Psychic | 137-164 | 137-162 (média 149.5) | -0.6% |
| 22 | S6 | Shadow Ball | imune | imune | = |
| 23 | S6 | Focus Blast | 201-240 | 204-241 (média 222.5) | +0.9% |
| 24 | S6 | Energy Ball | 76-91 | 77-91 (média 83.9) | +0.5% |
| 25 | S7 | Psychic | 120-143 | 120-141 (média 130.6) | -0.7% |
| 26 | S7 | Shadow Ball | imune | imune | = |
| 27 | S7 | Focus Blast | 174-208 | 179-211 (média 194.8) | +2.0% |
| 28 | S7 | Energy Ball | 66-79 | 68-80 (média 73.6) | +1.6% |
| 29 | S8 | Flamethrower | 120-144 | 119-140 (média 129.2) | -2.1% |
| 30 | S8 | Fire Blast | 145-173 | 145-170 (média 157.5) | -0.9% |
| 31 | S8 | Solar Beam | 58-70 | 60-70 (média 64.8) | +1.2% |
| 32 | S8 | Air Slash | 59-71 | 60-70 (média 64.8) | -0.4% |
| 33 | S9 | Surf | 100-120 | 99-117 (média 108.0) | -1.8% |
| 34 | S9 | Hydro Pump | 157-187 | 157-184 (média 170.5) | -0.9% |
| 35 | S9 | Ice Beam | 57-69 | 58-68 (média 63.2) | +0.3% |
| 36 | S9 | Dragon Pulse | 86-103 | 86-101 (média 93.8) | -0.7% |
| 37 | S10 | Earthquake | 110-132 | 112-132 (média 122.0) | +0.9% |
| 38 | S10 | Rock Slide | 47-56 | 47-56 (média 51.4) | -0.2% |
| 39 | S10 | Iron Head | 96-115 | 97-114 (média 105.9) | +0.4% |
| 40 | S10 | Drill Run | 122-146 | 124-146 (média 134.8) | +0.6% |
| 41 | S11 | Psychic | 46-55 | 46-54 (média 50.2) | -0.5% |
| 42 | S11 | Shadow Ball | imune | imune | = |
| 43 | S11 | Focus Blast | 67-80 | 69-81 (média 74.9) | +1.9% |
| 44 | S11 | Energy Ball | 26-31 | 26-31 (média 28.3) | -0.6% |
| 45 | S12 | Earthquake | 110-132 | 112-132 (média 122.0) | +0.9% |
| 46 | S12 | Rock Slide | 47-56 | 47-56 (média 51.4) | -0.2% |
| 47 | S12 | Iron Head | 96-115 | 97-114 (média 105.9) | +0.4% |
| 48 | S12 | Drill Run | 122-146 | 124-146 (média 134.8) | +0.6% |
| 49 | S13 | Earthquake | 334-398 | 336-396 (média 366.1) | +0.0% |
| 50 | S13 | Rock Slide | 140-167 | 142-167 (média 154.2) | +0.4% |
| 51 | S13 | Iron Head | 289-345 | 292-343 (média 317.7) | +0.2% |
| 52 | S13 | Drill Run | 369-440 | 371-437 (média 404.3) | -0.1% |
| 53 | S14 | Earthquake | 334-398 | 336-396 (média 366.1) | +0.0% |
| 54 | S14 | Rock Slide | 140-167 | 142-167 (média 154.2) | +0.4% |
| 55 | S14 | Iron Head | 289-345 | 292-343 (média 317.7) | +0.2% |
| 56 | S14 | Drill Run | 369-440 | 371-437 (média 404.3) | -0.1% |
| 57 | S15 | Mach Punch | imune | imune | = |
| 58 | S15 | Quick Attack | imune | imune | = |
| 59 | S15 | Bullet Punch | imune | imune | = |
| 60 | S15 | Aqua Jet | imune | imune | = |
| 61 | S16 | Bullet Punch | 110-131 | 110-130 (média 120.0) | -0.4% |
| 62 | S16 | X-Scissor | 162-194 | 165-194 (média 179.1) | +0.6% |
| 63 | S16 | U-turn | 127-152 | 128-151 (média 139.7) | +0.1% |
| 64 | S16 | Bug Bite | 164-196 | 165-194 (média 179.1) | -0.5% |
| 65 | S17 | Psychic | 92-110 | 92-109 (média 100.5) | -0.5% |
| 66 | S17 | Focus Blast | 161-192 | 165-194 (média 179.8) | +1.9% |
| 67 | S17 | Energy Ball | 51-61 | 52-61 (média 56.6) | +1.2% |
| 68 | S17 | Shadow Ball | imune | imune | = |
| 69 | S18 | Surf | 219-261 | 221-260 (média 240.7) | +0.3% |
| 70 | S18 | Hydro Pump | 348-415 | 349-410 (média 379.6) | -0.5% |
| 71 | S18 | Ice Beam | 94-113 | 96-113 (média 104.6) | +1.1% |
| 72 | S18 | Dragon Pulse | 110-131 | 110-130 (média 119.8) | -0.6% |
| 73 | S19 | Earthquake | 69-83 | 70-83 (média 76.6) | +0.7% |
| 74 | S19 | Rock Slide | 58-70 | 61-71 (média 66.0) | +3.1% |
| 75 | S19 | Iron Head | 120-144 | 122-144 (média 133.2) | +0.9% |
| 76 | S19 | Drill Run | 78-94 | 78-91 (média 84.4) | -1.8% |
| 77 | S20 | Earthquake | 221-264 | 224-264 (média 244.1) | +0.7% |
| 78 | S20 | Rock Slide | 93-111 | 94-111 (média 102.8) | +0.8% |
| 79 | S20 | Iron Head | 193-230 | 195-229 (média 211.8) | +0.1% |
| 80 | S20 | Drill Run | 245-292 | 248-291 (média 269.5) | +0.4% |

## Divergências encontradas e causas
1. **Aerodynamics (corrigido).** Antes da correção, Aerial Ace e Dual Wingbeat de quem tem a Aerodynamics saíam 28% acima do simulador (Aerial Ace do S1: média 150 contra 116; Dual Wingbeat do S1: 74 por acerto contra 58). Causa: `data/species_ability_synergy.json` dava x1,3 a golpes de ar/asa quando o dono tem a Aerodynamics, e o motor somava (`ef.bonusGolpes`). No código do jogo a Aerodynamics só absorve Flying e sobe a Velocidade (`ferramentas/er-repo` 217dd0f, `src/abilities.cc:3750`, `onAbsorb`), sem bônus de dano; o simulador 2.65.3b também não aplica. A mesma regra vale para Motor Drive, Well Baked Body, Justified e Inflatable (só `onAbsorb`/`onDefender`). Correção: `SINERGIA_SEM_BONUS_DE_DANO_DUELO` em `src/regras/duelo.js`, as cinco saem da sinergia (85 entradas do JSON). Registro em `docs/decisoes_mecanicas.md` (21/10). Teste: S1 a S3 do arquivo `calibracao_simulador_wasm.test.mjs` (falhava antes: Aerial Ace 149,7 contra 116,5).
2. **Insect Impact (explicado).** O motor (média ~21% de 162 HP no teste de 10/10, 33 de dano) cai dentro do simulador 2.65.3b: 30-36 (18,5% a 22,2%) com Life Orb; sem item 23-28 contra 23-27 do motor; Choice Band 35-42 contra 35-41. A calculadora do jogo de 10/10 mostrava 16% a 19% (26-31): o motor nativo 2.65.3b, que é a mesma base de regras, não reproduz esse número; a diferença está entre a calculadora do jogo e o motor nativo, não no motor do app. Não mudei peso. O `todo` virou teste contra o simulador (`calibracao_calculadora_do_jogo.test.mjs`).
3. **Mega Punch/Aerilate (confirma a decisão de 15/10).** A calculadora do jogo de 10/10 dizia 78% a 93%; o motor dá ~98% desde a decisão do STAB x1,5 do código. O simulador 2.65.3b dá 87,7% a 104,9% (142-170 de 162): o motor cai dentro. Ou seja, o simulador concorda com o código e com o motor, não com a calculadora de 10/10.
4. Diferença pequena sem causa de regra: Dual Wingbeat do S2 (-4,0%, 44,2 contra 46 de média) e Rock Slide do S19 (+3,1%): arredondamento por etapa do jogo em dano baixo.

## Perguntas / o que ficou de fora
- Flash Fire e Elemental Vortex: resolvido na Fase B4 (21/10): saíram da sinergia e o x1,5 só liga pelo gatilho da absorção de Fire.
- O simulador é 2.65.3b; o app segue a upcoming. Onde o código mudou entre as duas versões (ex.: golpes novos), o simulador não vale como régua. Nesta rodada só usei golpes e habilidades que existem nas duas.
- Mudei o motor, então o rank precisa ser refeito no fim (regra "rank só no fim"); não recalculei.
