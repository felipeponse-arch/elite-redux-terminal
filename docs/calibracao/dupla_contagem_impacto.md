# Dupla contagem da sinergia por golpe: o que muda se a correção geral for aplicada (16/10/2026)

Só documento, para o Felipe decidir a **pergunta 1 do `03-perguntas.md`**. A correção foi aplicada num rascunho local (worktree, não commitado); nenhum arquivo de `src/` ou `data/` entra neste commit. Base: master do GitHub `93b2a8a` (já com a pilha `calibracao-01..06`).

## 1. Resumo
- **A pergunta:** em ~50 habilidades o motor lê o número do texto E soma a sinergia por golpe da espécie (`species_ability_synergy.json`), então o bônus entra duas vezes (Nocturnal x1,25 sai ~x1,55; Overgrow x1,2 sai x1,44; Dragon's Maw e Transistor x1,5 saem x2,25).
- **O que a correção faz:** a sinergia por golpe deixa de somar para toda habilidade cujo texto já deu multiplicador de golpe (por tipo, categoria, flag `air` ou contato). Hoje a exceção vale só para as 15 habilidades do ticket 03.
- **Efeito medido:** **82 dos 690 Pokémon de chefão** mudam o melhor golpe em mais de 0,5%. **Todos para baixo**: de x0,50 a x0,99; 54 ficam entre x0,80 e x0,90, 13 entre x0,70 e x0,80, 8 entre x0,60 e x0,70, 1 abaixo de x0,60 (Reshiram do Drake 4, x0,50) e 6 perdem menos de 10%.
- **1x1 contra os casos de prova:** em **10 050 duelos** (595 builds de referência de `data/boss_reference_builds.json` contra o time do chefão para o qual foram feitas, em 3 níveis), **64 combinações build x Pokémon mudam de vencer/perder/empatar** (153 duelos, 1,5%): 23 passam de perder para vencer, 33 de vencer para perder e 8 envolvem empate. Mais 792 duelos (7,9%) mudam o HP final em mais de 2 pontos sem virar o resultado. Detalhe na seção 4.
- **Testes:** **5** testes quebram (não 2) no master atual; todos têm reescrita simples e a suíte volta a 912 de 913 (o `todo` conhecido) com elas. Seção 5.
- **Recomendação (a decisão é do Felipe):** aplicar, em ticket próprio e antes do rank. O jogo multiplica uma vez só, e o erro que fica é grande (até x2 num golpe). Ver a seção 6.

## 2. O que foi aplicado (rascunho local, não commitado)
Em `efeitoDasHabilidadesNoDuelo`, no laço de `ABILITY_SYNERGY`, junto da exceção das 15 habilidades:

```js
if (BONUS_DE_GOLPE_LIDO_DO_TEXTO_DUELO[h.name] || bonusDeGolpeLidoDoTextoDuelo(efeitoDasHabilidadesNoDuelo([id], "solo#" + id, null))) return;
// e a função nova:
function bonusDeGolpeLidoDoTextoDuelo(ef) { return Object.keys(ef.bonusTipo).length > 0 || Object.keys(ef.bonusCategoria).length > 0 || Object.keys(ef.flagMult).length > 0 || ef.contatoMult !== 1; }
```

Como se mediu:
- Cada um dos 690 Pokémon dos 123 chefões foi montado com `foeDeDuelo` no **nível 55** (cap do modo More após o 4º ginásio) e o melhor golpe foi medido contra um alvo neutro (Normal, 400 HP, atributos 100), antes e depois. "Fator da habilidade" = `forca / forcaBase` do melhor golpe (a parte que vem de habilidades, sem o STAB natural). "Dano" = razão do dano do melhor golpe depois/antes.
- O nível não muda a razão de forma relevante; o nível entra nas provas de 1x1 (40, 55 e 85).
- "Habilidades envolvidas" = habilidades do Pokémon com entrada de sinergia que cobria o melhor golpe e que deixam de somar. Em todas as 82 linhas há ao menos uma habilidade assim.

## 3. Os 82 Pokémon de chefão, do que mais cai para o que menos cai
Resumo por habilidade (quantas vezes aparece): Fossilized 9, Flock 9, Nocturnal 8, Dark Aura 7, Overgrow 7, Transistor 5, Dragon's Maw 4, Levitate 4, Psychic Mind 4, Big Pecks 3, Torrent 3, Earthbound 3, Swarm 3, Combustion 2, Riptide 2, Hellblaze 2, Aerialist 2, Tough Claws 2, Giant Wings 2, Blaze 2, Forest Rage 1, Mega Launcher 1, Electrocytes 1, Vengeance 1, Rockhard Will 1, Rocky Payload 1.

| # | Chefão (categoria) | Pokémon | Habilidades com sinergia que deixa de somar | Melhor golpe | Fator da habilidade no poder do golpe | Dano do melhor golpe |
|---:|---|---|---|---|---|---|
| 1 | Drake 4 (Alto Comando) #3 | Reshiram | Dragon's Maw (sinergia x1,50) | Draco Meteor | x2,25 → x1,50 | x0,50 (-50%) |
| 2 | Monochamp Electric (Superchefao (Monotype)) #5 | Xurkitree | Transistor (sinergia x1,50) | Thunderbolt | x2,25 → x1,50 | x0,67 (-33%) |
| 3 | Wattson 3 (Lider de Ginasio) #2 | Zekrom | Transistor (sinergia x1,50) | Bolt Strike | x2,25 → x1,50 | x0,67 (-33%) |
| 4 | Monochamp Dragon (Superchefao (Monotype)) #2 | Zekrom | Transistor (sinergia x1,50) | Bolt Strike | x2,25 → x1,50 | x0,67 (-33%) |
| 5 | Drake 3 (Alto Comando) #2 | Reshiram | Combustion (sinergia x1,50) | Blue Flare | x2,25 → x1,50 | x0,67 (-33%) |
| 6 | Wattson 3 (Lider de Ginasio) #3 | Xurkitree | Transistor (sinergia x1,50) | Thunder | x2,25 → x1,50 | x0,67 (-33%) |
| 7 | Monochamp Ice (Superchefao (Monotype)) #1 | Dewgong Redux | Dragon's Maw (sinergia x1,50) | Dragon Rush | x2,25 → x1,50 | x0,67 (-33%) |
| 8 | Dragonitenite Sage 3 (Treinador opcional) #2 | Reshiram | Combustion (sinergia x1,50) | Torch Song | x2,25 → x1,50 | x0,67 (-33%) |
| 9 | Granbullite Route123 (Treinador opcional) #4 | Raikou | Transistor (sinergia x1,50) | Rising Voltage | x2,25 → x1,50 | x0,67 (-33%) |
| 10 | Monochamp Dark (Superchefao (Monotype)) #2 | Darkrai Nightmare | Dark Aura (sinergia x1,33) | Dark Pulse | x1,77 → x1,33 | x0,75 (-25%) |
| 11 | Sidney 3 (Alto Comando) #2 | Darkrai | Dark Aura (sinergia x1,33) | Dark Pulse | x1,77 → x1,33 | x0,75 (-25%) |
| 12 | Sidney 3 (Alto Comando) #1 | Yveltal | Dark Aura (sinergia x1,33) | Dark Pulse | x1,77 → x1,33 | x0,75 (-25%) |
| 13 | Winona 4 (Lider de Ginasio) #3 | Yveltal | Dark Aura (sinergia x1,33) | Dark Pulse | x1,77 → x1,33 | x0,75 (-25%) |
| 14 | Winona 5 (Lider de Ginasio) #3 | Yveltal | Dark Aura (sinergia x1,33) | Dark Pulse | x1,77 → x1,33 | x0,75 (-25%) |
| 15 | Monochamp Flying (Superchefao (Monotype)) #4 | Yveltal | Dark Aura (sinergia x1,33) | Dark Pulse | x1,77 → x1,33 | x0,75 (-25%) |
| 16 | Dragonitenite Sage 1 (Treinador opcional) #2 | Zekrom | Dragon's Maw (sinergia x1,50) | Scale Shot → Thunderous Kick | x2,25 → x1,00 | x0,76 (-24%) |
| 17 | Matt Mt Pyre (Equipe Aqua (Admin)) #6 | Blastoise | Riptide (sinergia x1,30) | Spike Cannon | x1,69 → x1,30 | x0,77 (-23%) |
| 18 | Monochamp Fire (Superchefao (Monotype)) #5 | Charizard | Hellblaze (sinergia x1,30) | Raging Fury | x1,69 → x1,30 | x0,77 (-23%) |
| 19 | Sinnoh Megas Mauville Game Corner (Treinador opcional) #2 | Empoleon Mega | Riptide (sinergia x1,30) | Hydro Pump | x1,69 → x1,30 | x0,77 (-23%) |
| 20 | Sinnoh Megas Mauville Game Corner (Treinador opcional) #3 | Torterra Mega | Forest Rage (sinergia x1,30) | Grav Apple | x1,69 → x1,30 | x0,77 (-23%) |
| 21 | Monochamp Ghost (Superchefao (Monotype)) #4 | Typhlosion Hisuian | Hellblaze (sinergia x1,30) | Flamethrower | x1,69 → x1,30 | x0,77 (-23%) |
| 22 | Steven (Campeao) #1 | Genesect | Mega Launcher (sinergia x1,30) | Barrage | x1,30 → x1,00 | x0,77 (-23%) |
| 23 | Monochamp Bug (Superchefao (Monotype)) #3 | Vivillon Pokéball | Aerialist (sinergia x1,25) | Hurricane | x1,56 → x1,25 | x0,80 (-20%) |
| 24 | Calvin E4 (Treinador opcional) #5 | Skulberus | Nocturnal (sinergia x1,25) | Throat Chop | x1,56 → x1,25 | x0,80 (-20%) |
| 25 | Sidney (Alto Comando) #3 | Houndoom | Nocturnal (sinergia x1,25) | Black Magic | x1,56 → x1,25 | x0,80 (-20%) |
| 26 | Flannery 2 (Lider de Ginasio) #2 | Houndoom | Nocturnal (sinergia x1,25) | Dark Pulse | x1,56 → x1,25 | x0,80 (-20%) |
| 27 | Sidney 2 (Alto Comando) #2 | Cacturne | Nocturnal (sinergia x1,25) | Sucker Punch | x1,56 → x1,25 | x0,80 (-20%) |
| 28 | Calvin 2 (Treinador opcional) #1 | Mightyena | Nocturnal (sinergia x1,25) | Crunch | x1,56 → x1,25 | x0,80 (-20%) |
| 29 | Wattson 1 (Lider de Ginasio) #2 | Dedenne | Electrocytes (sinergia x1,25) | Thunder Shock | x1,56 → x1,25 | x0,80 (-20%) |
| 30 | Shelly Seafloor Cavern (Equipe Aqua (Admin)) #3 | Castform | Aerialist (sinergia x1,25) | Hurricane | x1,56 → x1,25 | x0,80 (-20%) |
| 31 | Spenser Fortree (Frontier Brain) #5 | Claydol | Levitate (sinergia x1,25) | Earth Power | x1,25 → x1,00 | x0,80 (-20%) |
| 32 | Tate And Liza 3 (Lider de Ginasio) #2 | Lunala | Nocturnal (sinergia x1,25) | Dazzling Gleam | x1,88 → x1,50 | x0,80 (-20%) |
| 33 | Calvin 1 (Treinador opcional) #2 | Poochyena | Nocturnal (sinergia x1,25) | Crunch | x1,56 → x1,25 | x0,80 (-20%) |
| 34 | Tate And Liza 2 (Lider de Ginasio) #2 | Claydol | Levitate (sinergia x1,25) | Earth Power → Psychic | x1,25 → x1,00 | x0,80 (-20%) |
| 35 | Monochamp Dark (Superchefao (Monotype)) #1 | Yveltal | Dark Aura (sinergia x1,33) | Baddy Bad → Bleakwind Storm | x1,77 → x1,30 | x0,83 (-17%) |
| 36 | Roxanne 2 (Lider de Ginasio) #3 | Aerodactyl | Fossilized (sinergia x1,20), Tough Claws (sinergia x1,00) | Head Smash | x1,87 → x1,56 | x0,83 (-17%) |
| 37 | Monochamp Rock (Superchefao (Monotype)) #4 | Aerodactyl | Fossilized (sinergia x1,20), Tough Claws (sinergia x1,00) | Head Smash | x1,87 → x1,56 | x0,83 (-17%) |
| 38 | Norman 5 (Lider de Ginasio) #1 | Braviary | Flock (sinergia x1,20), Big Pecks (sinergia x1,00), Giant Wings (sinergia x1,00) | Brave Bird | x2,43 → x2,03 | x0,83 (-17%) |
| 39 | Roxanne 3 (Lider de Ginasio) #4 | Aerodactyl | Fossilized (sinergia x1,20) | Head Smash | x1,44 → x1,20 | x0,83 (-17%) |
| 40 | Courtney Sunhollow (Equipe Magma (Admin)) #6 | Houndoom Redux | Vengeance (sinergia x1,20) | Raging Souls | x1,44 → x1,20 | x0,83 (-17%) |
| 41 | Juan 4 (Lider de Ginasio) #5 | Greninja Battle Bond | Torrent (sinergia x1,20) | Hydro Pump | x1,44 → x1,20 | x0,83 (-17%) |
| 42 | Calvin 3 (Treinador opcional) #4 | Dugtrio | Earthbound (sinergia x1,20) | Fissure | x1,94 → x1,62 | x0,83 (-17%) |
| 43 | Winona 1 (Lider de Ginasio) #5 | Aerodactyl | Fossilized (sinergia x1,20) | Head Smash | x1,44 → x1,20 | x0,83 (-17%) |
| 44 | Courtney Meteor Falls (Equipe Magma (Admin)) #3 | Charizard | Blaze (sinergia x1,20), Giant Wings (sinergia x1,00) | Heat Wave | x1,87 → x1,56 | x0,83 (-17%) |
| 45 | Leaf Altering Cave (Superchefao) #5 | Mewtwo | Psychic Mind (sinergia x1,20) | Psystrike | x1,44 → x1,20 | x0,83 (-17%) |
| 46 | Courtney Meteor Falls (Equipe Magma (Admin)) #2 | Alakazam | Psychic Mind (sinergia x1,20) | Eerie Spell | x1,44 → x1,20 | x0,83 (-17%) |
| 47 | Blunder (Treinador opcional) #3 | Lilligant | Overgrow (sinergia x1,20) | Solar Beam | x1,44 → x1,20 | x0,83 (-17%) |
| 48 | Flannery 2 (Lider de Ginasio) #6 | Talonflame | Flock (sinergia x1,20) | Brave Bird | x1,44 → x1,20 | x0,83 (-17%) |
| 49 | Flannery 5 (Lider de Ginasio) #6 | Talonflame | Flock (sinergia x1,20) | Brave Bird | x1,44 → x1,20 | x0,83 (-17%) |
| 50 | Norman 2 (Lider de Ginasio) #1 | Swellow | Flock (sinergia x1,20) | Brave Bird | x1,44 → x1,20 | x0,83 (-17%) |
| 51 | Calvin 4 (Treinador opcional) #5 | Vikavolt | Swarm (sinergia x1,20) | Bug Buzz | x1,44 → x1,20 | x0,83 (-17%) |
| 52 | Roxanne 2 (Lider de Ginasio) #4 | Armaldo | Fossilized (sinergia x1,20) | Stone Edge | x1,44 → x1,20 | x0,84 (-16%) |
| 53 | Drake 3 (Alto Comando) #3 | Serperior | Overgrow (sinergia x1,20) | Leaf Storm | x1,44 → x1,20 | x0,84 (-16%) |
| 54 | Drake 4 (Alto Comando) #4 | Serperior | Overgrow (sinergia x1,20) | Leaf Storm | x1,44 → x1,20 | x0,84 (-16%) |
| 55 | Monochamp Ground (Superchefao (Monotype)) #3 | Zygarde | Earthbound (sinergia x1,20) | Thousand Arrows | x1,44 → x1,20 | x0,84 (-16%) |
| 56 | Norman 1 (Lider de Ginasio) #3 | Talonflame | Flock (sinergia x1,20), Big Pecks (sinergia x1,00) | Dual Wingbeat | x1,44 → x1,20 | x0,84 (-16%) |
| 57 | Monochamp Psychic (Superchefao (Monotype)) #4 | Meowstic Female | Psychic Mind (sinergia x1,20) | Expanding Force | x1,80 → x1,50 | x0,84 (-16%) |
| 58 | Tabitha Mt Chimney (Equipe Magma (Admin)) #3 | Talonflame | Flock (sinergia x1,20), Big Pecks (sinergia x1,00) | Acrobatics | x1,87 → x1,56 | x0,84 (-16%) |
| 59 | Winona 1 (Lider de Ginasio) #1 | Swellow | Flock (sinergia x1,20) | Hurricane | x1,44 → x1,20 | x0,84 (-16%) |
| 60 | Courtney Sunhollow (Equipe Magma (Admin)) #4 | Charizard | Blaze (sinergia x1,20) | Flamethrower | x1,44 → x1,20 | x0,84 (-16%) |
| 61 | Sidney 3 (Alto Comando) #3 | Greninja | Torrent (sinergia x1,20) | Water Shuriken | x1,44 → x1,20 | x0,84 (-16%) |
| 62 | Shelly Weather Institute (Equipe Aqua (Admin)) #4 | Meowscarada | Overgrow (sinergia x1,20) | Flower Trick | x1,44 → x1,20 | x0,84 (-16%) |
| 63 | Winona 3 (Lider de Ginasio) #2 | Pelipper | Flock (sinergia x1,20) | Hurricane | x1,44 → x1,20 | x0,84 (-16%) |
| 64 | Maxie Mt Chimney (Equipe Magma) #5 | Venusaur | Overgrow (sinergia x1,20) | Giga Drain | x1,44 → x1,20 | x0,84 (-16%) |
| 65 | Drake 2 (Alto Comando) #1 | Aerodactyl | Fossilized (sinergia x1,20) | Rock Slide | x1,44 → x1,20 | x0,84 (-16%) |
| 66 | Lucy Lavaridge (Frontier Brain) #3 | Serperior | Overgrow (sinergia x1,20) | Giga Drain | x1,44 → x1,20 | x0,84 (-16%) |
| 67 | Roxanne 1 (Lider de Ginasio) #2 | Lileep | Fossilized (sinergia x1,20) | Ancient Power | x1,44 → x1,20 | x0,84 (-16%) |
| 68 | Flannery 3 (Lider de Ginasio) #5 | Volcarona | Swarm (sinergia x1,20) | Bug Buzz → Fire Blast | x1,44 → x1,00 | x0,85 (-15%) |
| 69 | Sidney 4 (Alto Comando) #3 | Greninja | Torrent (sinergia x1,20) | Water Shuriken → Gunk Shot | x1,44 → x1,50 | x0,86 (-14%) |
| 70 | Drake (Alto Comando) #3 | Regidrago | Dragon's Maw (sinergia x1,50) | Dragon Energy | x2,25 → x1,95 | x0,87 (-13%) |
| 71 | Phoebe (Alto Comando) #5 | Oricorio Sensu | Flock (sinergia x1,20) | Air Slash → Revelation Dance | x1,44 → x1,50 | x0,87 (-13%) |
| 72 | Steven Granite Cave (Treinador opcional) #3 | Lairon Redux | Rockhard Will (sinergia x1,20) | Rock Blast → Aqua Tail | x1,44 → x1,00 | x0,87 (-13%) |
| 73 | Brawly 4 (Lider de Ginasio) #4 | Chesnaught | Overgrow (sinergia x1,20) | Wood Hammer → Drain Punch | x1,44 → x1,00 | x0,88 (-12%) |
| 74 | Tabitha Mossdeep (Equipe Magma (Admin)) #6 | Coalossal | Rocky Payload (sinergia x1,50) | Power Gem → Magma Storm | x2,25 → x1,00 | x0,89 (-11%) |
| 75 | Juan 2 (Lider de Ginasio) #3 | Kabutops | Fossilized (sinergia x1,20) | Stone Edge → Sacred Sword | x2,02 → x1,40 | x0,90 (-10%) |
| 76 | Juan 4 (Lider de Ginasio) #3 | Kabutops | Fossilized (sinergia x1,20) | Stone Edge → Sacred Sword | x2,02 → x1,40 | x0,90 (-10%) |
| 77 | Norman 2 (Lider de Ginasio) #4 | Girafarig | Nocturnal (sinergia x1,25) | Crunch → Psychic Fangs | x1,95 → x1,25 | x0,91 (-9%) |
| 78 | Drake 3 (Alto Comando) #4 | Zygarde | Earthbound (sinergia x1,20) | Thousand Arrows → Outrage | x1,44 → x1,00 | x0,93 (-7%) |
| 79 | Maxie Magma Hideout (Equipe Magma) #2 | Volcarona | Swarm (sinergia x1,20) | Skitter Smack → Fiery Dance | x1,44 → x1,00 | x0,93 (-7%) |
| 80 | Steven (Campeao) #4 | Claydol | Levitate (sinergia x1,25) | Earth Power → Psycho Boost | x1,25 → x1,00 | x0,93 (-7%) |
| 81 | Tate And Liza 2 (Lider de Ginasio) #6 | Solrock | Levitate (sinergia x1,25) | Earthquake → Zen Headbutt | x1,25 → x1,00 | x0,96 (-4%) |
| 82 | Monochamp Psychic (Superchefao (Monotype)) #5 | Alakazam | Psychic Mind (sinergia x1,20) | Expanding Force → Aura Sphere | x1,44 → x1,00 | x0,99 (-1%) |

## 4. 1x1 contra os casos de prova
**Casos de prova usados:** `data/boss_reference_builds.json` (595 builds de referência por chefão, 427 espécies, 106 chefões). Cada build foi montada nos dois motores e duelou com **cada** Pokémon do time do chefão para o qual foi feita, nos níveis 40, 55 e 85. As builds de `data/builds.json` (curadas, 29 espécies) não têm chefão-alvo e ficaram de fora.

**Resultado:** dos 10 050 duelos, 153 viram o resultado (1,5%), em 64 combinações build x Pokémon de 56 builds distintas. **25** combinações são Pokémon que está na lista dos 82 (o chefão ficou mais fraco); **39** são Pokémon que NÃO está na lista (a build é que perde ou ganha a dupla contagem: a habilidade dela deixa de somar).

| Build de referência (espécie / habilidade) | Contra | Níveis em que vira | Antes → depois | Causa provável |
|---|---|---|---|---|
| Typhlosion / Earthbound | Courtney Meteor Falls #2 Alakazam | 40 | vence → perde | o Pokémon do chefão perde a dupla contagem |
| Eternatus / Power Core | Drake #3 Regidrago | 55, 85 | perde → vence | o Pokémon do chefão perde a dupla contagem |
| Torkoal / Mountaineer | Flannery 2 #6 Talonflame | 40 | perde → vence | o Pokémon do chefão perde a dupla contagem |
| Rotom Wash / Motor Drive | Juan 2 #3 Kabutops | 55, 85 | perde → vence | o Pokémon do chefão perde a dupla contagem |
| Orthworm / Iron Fist | Lucy Lavaridge #3 Serperior | 40, 55, 85 | perde → vence | o Pokémon do chefão perde a dupla contagem |
| Calyrex Shadow Rider / As One | Matt Mt Pyre #6 Blastoise | 40, 55, 85 | perde → vence | o Pokémon do chefão perde a dupla contagem |
| Rotom Heat / Flash Fire | Maxie Mt Chimney #5 Venusaur | 40, 55, 85 | perde → vence | o Pokémon do chefão perde a dupla contagem |
| Porygon2 / Frisk | Maxie Mt Chimney #5 Venusaur | 40, 55, 85 | perde → vence | o Pokémon do chefão perde a dupla contagem |
| Pecharunt / Shadow Shield | Monochamp Ghost #4 Typhlosion Hisuian | 40 | vence → perde | o Pokémon do chefão perde a dupla contagem |
| Zygarde / Power Construct | Monochamp Ground #3 Zygarde | 40, 55, 85 | vence → empata | o Pokémon do chefão perde a dupla contagem |
| Bewear Angry / Blind Rage | Norman 1 #3 Talonflame | 40, 55, 85 | perde → vence | o Pokémon do chefão perde a dupla contagem |
| Ditto / Imposter | Norman 2 #1 Swellow | 40, 55 | empata → vence | o Pokémon do chefão perde a dupla contagem |
| Ditto / Imposter | Norman 2 #4 Girafarig | 85 | empata → vence | o Pokémon do chefão perde a dupla contagem |
| Arceus / Multitype | Norman 5 #1 Braviary | 40, 55, 85 | perde → vence | o Pokémon do chefão perde a dupla contagem |
| Tyranitar / Solid Rock | Roxanne 3 #4 Aerodactyl | 40, 55 | perde → vence | o Pokémon do chefão perde a dupla contagem |
| Rotom Frost / Motor Drive | Shelly Weather Institute #4 Meowscarada | 40, 55, 85 | perde → vence | o Pokémon do chefão perde a dupla contagem |
| Tapu Fini / Water Veil | Shelly Weather Institute #4 Meowscarada | 40, 55, 85 | perde → vence | o Pokémon do chefão perde a dupla contagem |
| Muk Alolan / Poison Touch | Sidney 3 #2 Darkrai | 40, 55, 85 | perde → vence | o Pokémon do chefão perde a dupla contagem |
| Audino / Emergency Exit | Spenser Fortree #5 Claydol | 40 | perde → vence | o Pokémon do chefão perde a dupla contagem |
| Aggron Redux / Weak Armor | Steven #1 Genesect | 40, 55, 85 | perde → vence | o Pokémon do chefão perde a dupla contagem |
| Talonflame / Big Pecks | Tabitha Mt Chimney #3 Talonflame | 40, 55, 85 | perde → empata | o Pokémon do chefão perde a dupla contagem |
| Gliscor Redux / Predator | Tabitha Mt Chimney #3 Talonflame | 55, 85 | perde → vence | o Pokémon do chefão perde a dupla contagem |
| Zekrom / Beast Boost | Wattson 3 #3 Xurkitree | 40, 55, 85 | vence → perde | o Pokémon do chefão perde a dupla contagem |
| Corviknight / Impenetrable | Winona 1 #5 Aerodactyl | 40, 55, 85 | perde → vence | o Pokémon do chefão perde a dupla contagem |
| Yveltal / Opportunist | Winona 1 #5 Aerodactyl | 40, 55, 85 | vence → perde | o Pokémon do chefão perde a dupla contagem |
| Tinkaton Redux / Aquatic Dweller | Archie Mt Pyre #2 Wishiwashi | 40, 55, 85 | vence → perde | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Inteleon / Dual Wield | Archie Mt Pyre #3 Garchomp Redux | 40, 55, 85 | vence → perde | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Tinkaton Redux / Aquatic Dweller | Archie Mt Pyre #4 Goodra Hisuian | 40, 55, 85 | vence → perde | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Dhelmise / Soul Eater | Archie Slateport #1 Crobat | 40, 55, 85 | perde → vence | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Xurkitree / Transistor | Archie #3 Goodra Hisuian | 40, 55, 85 | vence → perde | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Miraidon / Surge Surfer | Archie #3 Goodra Hisuian | 40, 55, 85 | vence → perde | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Flamigo / Quick Feet | Brawly 1 #3 Lokix | 40, 55, 85 | vence → perde | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Chesnaught / Let's Roll | Brawly 4 #3 Toxicroak | 40, 55, 85 | vence → perde | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Talonflame / Predator | Flannery 2 #1 Torkoal | 40 | vence → perde | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Volcarona / Compound Eyes | Flannery 3 #2 Kyurem White | 40, 55, 85 | vence → perde | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Thundurus Therian / Transistor | Greta Slateport #4 Umbreon | 40, 55, 85 | vence → perde | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Landorus Therian / Moxie | Greta Slateport #5 Gengar | 40, 55, 85 | perde → vence | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Kabutops / Swift Swim | Juan 2 #2 Rotom Wash | 55, 85 | vence → perde | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Kabutops / Swift Swim | Juan 4 #1 Kyogre | 40, 55, 85 | vence → perde | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Kabutops / Swift Swim | Juan 4 #4 Palkia | 40, 55, 85 | vence → perde | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Reshiram / Drought | Maxie Mossdeep #3 Camerupt | 40, 55, 85 | vence → perde | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Kleavor / Sturdy | Monochamp Bug #1 Kleavor | 40, 55, 85 | vence → empata | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Zekrom / Dragon's Maw | Monochamp Dragon #1 Dialga | 40, 55, 85 | vence → empata | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Zygarde / Power Construct | Monochamp Ground #4 Groudon | 55, 85 | vence → perde | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Swellow / Air Blower | Norman 2 #3 Ditto | 40, 55 | empata → perde | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Girafarig / Scare | Norman 2 #3 Ditto | 85 | empata → perde | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Braviary / Giant Wings | Norman 5 #5 Arceus | 40, 55, 85 | vence → perde | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Gyaradeath / Scare | Phoebe #1 Dusknoir | 40, 55, 85 | vence → perde | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Aurorus / Aurora Borealis | Roxanne 4 #4 Aerodactyl | 40, 55, 85 | perde → vence | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Tyranitar / Solid Rock | Roxanne 4 #4 Aerodactyl | 55, 85 | perde → vence | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Castform / Anticipation | Shelly Seafloor Cavern #6 Meowscarada | 40, 55, 85 | vence → perde | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Shyduck / Anger Point | Shelly Weather Institute #6 Infernape Redux | 85 | vence → perde | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Darkrai / Dark Aura | Sidney #2 Toxtricity Redux Fuzz | 40 | vence → perde | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Greninja / Protean | Sidney #6 Absol | 40, 55, 85 | vence → perde | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Dusknoir / Iron Fist | Spenser Fortree #6 Dredwood | 40, 55 | perde → vence | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Claydol / Ancient Idol | Tabitha Mossdeep #1 Steelix | 40 | vence → perde | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Talonflame / Big Pecks | Tabitha Mt Chimney #5 Gliscor Redux | 55, 85 | vence → perde | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Delphox / Forewarn | Tate And Liza 1 #2 Oranguru | 40 | vence → perde | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Solrock / Victory Star | Tate And Liza 2 #4 Reuniclus | 40 | perde → vence | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Eelektross / Nosferatu | Wattson 1 #5 Exploud Redux | 40, 55, 85 | vence → perde | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Zekrom / Beast Boost | Wattson 3 #6 Manectric | 40 | vence → perde | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Yveltal / Opportunist | Winona 1 #2 Corviknight | 40 | vence → perde | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Aerodactyl / Speed Force | Winona 1 #2 Corviknight | 40, 55, 85 | vence → perde | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |
| Aerodactyl / Speed Force | Winona 1 #6 Altaria | 40, 55, 85 | vence → perde | habilidade da própria build (ou do chefão fora da lista de 82) perde a dupla contagem |

Leitura: a direção não é só a favor do jogador. Quando o chefão enfraquece, a build ganha; quando é a build de referência que usava uma habilidade com dupla contagem (Nocturnal, Flock, Levitate...), ela perde força e algumas passam de "vence" para "perde". Ou seja, o conjunto de builds de referência que "vence o chefão" muda nos dois sentidos, e o **rank** das espécies com essas habilidades cai (já estava nos planos do ticket 08/10 recalcular o rank depois).

## 5. Os testes que quebram: são 5, não 2
Medido no master `93b2a8a` com a correção aplicada. Em todos o motivo é o mesmo: o número inflado pela dupla contagem sustentava a premissa do cenário.

| # | Teste | Por que quebra | Reescrita verificada |
|---|---|---|---|
| 1 | `duelo_pela_interface`: "itens de defesa: ... Occa Berry segura o 1º Fire" | O Flamethrower do Charizard (que perde a dupla contagem) já não tira o bastante para a baga mudar o número de turnos | No chefão do cenário, trocar `golpes: ["Flamethrower"]` por `["Fire Blast"]` (só a linha da baga) |
| 2 | `duelo_pela_interface`: "clima defensivo..." (parte do Espeon) | A pré-condição "sem névoa o Alakazam vence o Espeon" deixa de valer: o Alakazam perde a dupla contagem e cai | `alakazam(["Psychic"], { clima })` do Espeon vira `{ clima, item: "Life Orb" }` |
| 3 | `efeitos_pela_interface`: "dreno: Giga Drain cura o que causa e vence o Snorlax; o Energy Ball ... perde" | O Venusaur (Overgrow somava 1,2 duas vezes) deixa de vencer o Snorlax com o Giga Drain | Dar `item: "Miracle Seed"` ao Venusaur (Giga Drain vence, Energy Ball segue perdendo) |
| 4 | `chefao_pela_interface`: "botão: contra um time só de Fire escolhe quem resiste..." | Com o time Fire mais fraco, o Machamp entra no lugar do Gengar/Garchomp (empate de escolha) e a asserção "Machamp fica de fora" falha | `flamejante` usa `Fire Blast` no lugar de `Flamethrower` (volta a deixar o Machamp de fora e o Rhyperior dentro) |
| 5 | `pipeline_build`: "garantido vale pela rolagem MÍNIMA: Pikachu x Ninetales..." | O Pikachu (habilidades elétricas que perdem a dupla contagem) passa a derrubar em 2 golpes (78% a 92%): sai da janela 93%-110% do teste | Trocar o Pikachu pelo **Charmeleon**, que tem a mesma janela nos dois motores (94% a 110%), e atualizar o título |

Aplicadas as cinco, a suíte fica em **913 testes, 912 passam, 1 `todo`** (Insect Impact, já existente).

## 6. Recomendação e custo
- **Aplicar a correção geral**, num ticket próprio (M), **antes de recalcular o rank**, porque ela muda 82 chefões e as builds de referência. Em B/C do `versao-nova-plano.md`, logo depois da troca do dado.
- **Custo:** 3 linhas de código, 5 testes reescritos, 1 decisão em `docs/decisoes_mecanicas.md` (a sinergia por golpe é só uma aproximação antiga e passa a valer apenas para a habilidade cujo texto o motor não lê). Sabotagens: uma para o laço novo; as de `habilidades-sinergia-soma-de-novo` e as existentes seguem valendo.
- **Se o Felipe preferir não aplicar:** os 5 Pokémon de chefão que ficam ~20% acima do jogo pela pilha (Aerodactyl x2, Charizard, Talonflame, Braviary de Norman 5) continuam assim, e a lista acima segue com o erro.
- **Alternativa mais conservadora (a conferir):** aplicar só nas habilidades de tipo/categoria sem condição no texto (Nocturnal, Levitate, Electrocytes...) e deixar as condicionais (Overgrow, Blaze, Torrent, Swarm, Flock, "x1,2 ou x1,5 com HP baixo") para um ticket depois. Não medida aqui.

## 7. O que não está medido
- O nível dos duelos é fixo (40, 55, 85), não a etapa real de cada chefão; o app usa o cap da etapa do jogador.
- Só 1x1 (sem troca de Pokémon, buffs de ginásio ou clima do time do chefão).
- Os alvos neutros medem o golpe, não o resultado de uma luta de verdade; o 1x1 da seção 4 cobre isso.
- A medida do jogo real (HP) para qualquer um destes casos só o Felipe faz.
