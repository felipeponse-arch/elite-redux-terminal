# Config oficial x NextDex: 2.65beta (7be1617) contra 2.65.4 (7285071)

Gerado em 07/10/2026 por pesquisa (nada de dado, script, build ou bosses.json foi alterado; o md5 de data/bosses.json antes e depois da execução do script é o mesmo, b8bdb822...).

## Fontes e método

- Config oficial: github.com/Elite-Redux/er-config. Arquivos baixados por raw.githubusercontent.com no commit **7be1617** (2.65beta) e no **7285071** (último antes da geração do dado 2.65.4, 07/10 00:09 UTC): AbilityList.textproto, TrainerList.textproto, MoveList.textproto, ItemList.proto, ItemEnum.proto e items/*.textproto. Listagem de arquivos pela árvore do GitHub (API git/trees) nos dois commits.
- NextDex: data/raw/snapshots/gameData_2.65beta.json.gz (beta) e data/gameData_2654.json (novo).
- Histórico: clone local do er-config (scratchpad, repos/er-config) usado só para datar cada mudança com git --no-pager log. **Datas**: 7be1617 é de 13/03/2026 18:41 PDT (14/03 01:41 UTC); o 14/03 do rótulo "2.65beta" é a data desse commit da config, NÃO a do dado. O dado beta (creationDate) é de **28/03/2026 17:17 UTC** e contém os 54 commits do er-config entre 14/03 e 28/03 (último: 6a30b66, 28/03 03:03 -04:00; lista em 3C). Por isso o ponto de comparação fiel ao dado beta é 6a30b66 (chamado "Cx" abaixo).
- Evidência de apoio já presente no scratchpad (não baixada de novo por mim, tratar como apoio): changelog.txt (cópia da página oficial Full Changelog do eliteredux.net, topo = 2.65.3b; não traz notas da 2.65.4) e src_log.txt (299 commits do eliteredux-source, branch upcoming, 28/03 a 06/10/2026). Quando cito "commit xxxxxxx" ou "changelog", é daí.
- Alinhamento: o array de habilidades do dado 2.65.4 tem 1063 posições e bate **posição a posição** com a AbilityList de 7285071 (1063 entradas; única divergência de texto: Insect Eater, que o config deixa sem descrição). O mesmo vale para a beta com 7be1617 (1034).

## 1. Habilidades

### 1.1 Contagem

- Linhas em "Descrição mudou": **164**. Todas existem nos dois AbilityList, e o texto antes/depois do pesquisa_versao_2654.md é idêntico ao campo description dos dois commits (0 divergências). Como o dado beta é de 28/03, as 164 são diferenças reais entre o dado beta e o 2.65.4 (nenhuma estava só no intervalo 14/03 a 28/03).
- **MECÂNICA: 10** firmes (a descrição curta e o config mostram a mudança) e **MECÂNICA provável: 10** (Cute Charm e Yuki Onna, onde a mudança só aparece no expanded do config e no changelog; mais 8 em que a descrição curta mudou condição, número ou alcance mas o expanded do config é igual nos 3 commits, ver 1.2b). Total mecânico ou provável: 20.
- **TEXTO: 144** (com 10 grupos de dúvida, listados em 1.4).
- Contexto: o commit f11j de 08/06/2026 "Update many ability descriptions (most suggestions from cheesed_to_meet_you_'s Google doc)" explica a maior parte dos 152; o de 01/07/2026 reescreveu a descrição de Triage "to reduce ambiguity".

### 1.2 Tabela das MECÂNICAS (10 firmes)

| Habilidade | Antes (2.65beta) | Depois (2.65.4) | O que muda |
|---|---|---|---|
| Oblivious | Imune a infatuation, Scare, Intimidate e Taunt. | Imune a infatuation, Scare, Intimidate e "disabling". | Alcance: passa a imunizar também Disable, Encore e Torment, não só Taunt (expanded 7285071). |
| Friend Guard | Aliado recebe 50% menos dano em dupla (expanded 7be1617). | Aliado recebe 25% menos dano em dupla (expanded 7285071; a descrição curta já dizia 25%). | Número: a redução ao aliado cai de 50% para 25%. Commit 273fc71 (19/05/2026) "Update Friend Guard and related abilities to new effect". Herdeiras: Caretaker e Food Lovers (só o expanded mudou). |
| Justified | Boosts Attack instead of being hit by Dark-type moves. | Boosts highest attack instead of being hit by Dark-type moves. | Efeito: o +1 passa a ir no maior entre Atk e SpAtk (antes só Atk). |
| Pyro Shells | Triggers 50 BP Outburst after using a Mega Launcher move. | Uses 50BP Explosion or Outburst after using Mega Launcher move. | Efeito: golpe físico dispara Explosion 50 BP, especial/status dispara Outburst 50 BP (antes sempre Outburst). Commit 48d1b77 (04/05/2026). |
| Madness Enhancement | Enrages in fog, halves damage when enraged. | Enrages in fog, reduces damage taken by 20% when enraged. | Número: redução de dano enraged cai de 50% para 20%. Commit ddf17c5 (03/05/2026). |
| Scarecrow | Scare + Bad Luck. | Scare + Cotton Down. | Efeito: troca Bad Luck por Cotton Down (-1 Speed dos adversários ao ser atingido). Commit 89d7991 (21/04/2026). |
| Magus Blades | Dual Wield + Best Offense. | Best Offense + Keen Edge moves hit twice for 60%. | Número: o expanded passa de "70% do dano normal" para "2º hit com 60% do dano original". Commit d3ef522 (05/05/2026). O desenho exato (1º hit integral?) só está no texto do expanded. |
| World Serpent | Long Reach + Grip Pincer. | Serpent Bind + Grip Pincer. | Efeito: troca Long Reach por Serpent Bind (50% de prender, -1 Speed por turno preso, ignora mudanças de defesa e sempre acerta). Commit ede59d0 (14/05/2026). |
| Feathercoat | Takes 10% less damage from attacks, 20% if resisted. | Takes 15% less damage from attacks, 30% if resisted. | Número: 10%/20% sobe para 15%/30%. Commit 9bf23e8 (19/04/2026). |
| King of the Jungle | Infiltrator + deals 1.5x more damage to Grass-types. | Grassy Surge + Infiltrator. | Efeito: perde o 1,5x contra Grass e ganha Grassy Surge (8 turnos). Commit 138ce08 (20/04/2026). |


### 1.2b MECÂNICA provável (10)

Cute Charm e Yuki Onna: o expanded do config mudou (some a restrição de sexo oposto). As outras 8: o config confirma o efeito NOVO, mas o expanded é idêntico em 7be1617, 6a30b66 (28/03, último commit antes do corte do dado beta) e 7285071, ou seja, o config não mostra que o efeito mudou. Ou a descrição curta da beta estava incompleta (mudança só de texto), ou o jogo/motor funcionava diferente do que ela dizia. Para o app (motor escrito pela descrição curta) vale como correção a conferir; por isso "provável". **Essas 8 são "prováveis" só porque a descrição curta mudou; o expanded não mudou. Nenhuma fonte mostra que o efeito no jogo mudou: conferir no código do jogo antes de mexer no motor.**

| Habilidade | Antes (2.65beta) | Depois (2.65.4) | O que muda e o que o config diz |
|---|---|---|---|
| Cute Charm | 50% chance to attract on contact. | 50% chance to infatuate on contact. | Condição (só no expanded): some a frase "só funciona em Pokémon do sexo oposto". O changelog oficial (2.65 Beta 2) cita "Attract/infatuation reworked, removing some old restrictions". Herdeiras: Prim and Proper, Pure Love, Tender Affection. |
| Yuki Onna | Scare + Intimidate. 30% chance to infatuate on hit. | Intimidate + Scare. 30% chance to infatuate on contact. | Condição (só no expanded): mesma retirada da restrição de sexo oposto. |
| Chuckster | Once per entry, take 1/2 damage and force-switch the target. | Once per entry, halves contact dmg then forces attacker out. | Condição: só vale ao receber golpe de contato e a troca forçada é a do atacante (a curta antiga não dizia contato). Config: expanded igual nos 3 commits e já exige contato; confirma o efeito novo, não mostra mudança. |
| Lawnmower | Removes terrain on switch-in. Stat up if terrain removed. | Removes Terrain on switch-in, then ups Def or Sp. Def. | Alcance: diz qual stat sobe. Config: expanded igual nos 3 commits (Defense +1 ao remover Grassy ou Electric; Special Defense +1 ao remover Misty, Psychic ou Toxic). |
| Low Visibility | Summons Eerie Fog on entry. | Summons fog on entry. Lasts 8 turns. | Número: passa a dizer 8 turnos. Config: expanded igual nos 3 commits ("lasting 8 turns (12 with Smoke Ball)"). |
| Toxic Surge | sets Toxic Terrain on entry. | Casts Toxic Terrain on entry. Lasts 8 turns. | Número: passa a dizer 8 turnos (mesmo caso de Low Visibility). Config: expanded igual nos 3 commits (8 turnos, 12 com Terrain Extender). |
| Perish Body | If hit, casts Perish Song. | Uses Perish Song when hit by a contact move. | Condição: só golpe de contato (a curta antiga omitia). Config: expanded igual nos 3 commits e já diz contato. |
| Jaws of Carnage | Devours 1/2 of the foe when defeating it. | KOs heal 1/4 of max HP, 1/2 if using a biting move. | Número: cura de 1/4 (1/2 com mordida) em vez de "devorar 1/2 do alvo". Config: expanded igual nos 3 commits (50% de HP máx com mordida, 25% com outros, só em KO por golpe direto). |
| Poison Absorb | Redirects Poison moves. Absorbs them, healing 25% HP. | Redirects and absorbs Poison moves. Heals in Toxic Terrain. | Alcance: acrescenta cura em Toxic Terrain e some o 25% da curta. Config: expanded igual nos 3 commits (1/4 ao absorver + 1/8 por turno em Toxic Terrain). |
| Weather Control | Negates all weather based moves from enemies. | Immune to all weather-based moves. | Alcance: de "golpes de clima dos inimigos" para "imune a golpes de clima". Config: expanded igual nos 3 commits (lista de golpes imunes). |

Portadoras no dado 2.65.4 (entradas de espécie com a habilidade em abis ou inns): Friend Guard 61, Cute Charm 44, Oblivious 41, Justified 17, Feathercoat 5, Caretaker 3, Pyro Shells 2, e 1 cada de Food Lovers, Yuki Onna, Scarecrow, World Serpent, King of the Jungle, Magus Blades, Madness Enhancement.

### 1.3 TEXTO (144)

Limber, Rough Skin, Illuminate, Guts, Marvel Scale, Aftermath, Weak Armor, Heavy Metal, Grass Pelt, Stamina, Triage, Fluffy, Vengeance, Blitz Boxer, Growing Tooth, Lead Coat, Coil Up, Tectonize, Dragonslayer, Short Circuit, Flaming Soul, Sea Guardian, Flock, Frozen Soul, Sun Worship, Pollinate, Spectral Shroud, Hardened Sheath, Parry, Scrapyard, Loose Quills, Toxic Debris, Loose Rocks, Hellblaze, Riptide, Forest Rage, Volt Rush, Infernal Rage, Radiance, Shocking Jaws, Earth Eater, Purgatory, Super Hot Goo, Nika, Freezing Point, Cryo Proficiency, Mystic Blades, Determination, Fighter, Fortitude, Early Grave, Flaming Jaws, Berserk DNA, Clap Trap, Spike Armor, Chrome Coat, Purifying Salt, Guard Dog, Stygian Rush, Tidal Rush, Mind Crunch, Sharp Edges, Toxic Chain, Poison Puppeteer, Pretty Privilege, Ice Downfall, Ultra Instinct, Higher Rank, Petrify, Fluffiest, Atomic Punch, Rage Point, Shocking Maw, Lucky Halo, Know Your Place, Magical Fists, Cutthroat, Twinkle Toes, Deep Freeze, JunshiSanda, Gladiator, Corrupted Mind, Cryo Architect, Glacial Rage, Embody Aspect, We Will Rock You, Headstrong, Blur, Elude, Serpent Bind, Chilling Presence, Hemotoxin, Biofilm, Chokehold, Festivities, Fey Flight, Best Offense, Impaler, Superheavy, Komodo, Envenom, Purple Haze, Hyper Cleanse, Sludge Spit, Swamp Thing, Warmonger, Soul Harvest, Thick Blubber, Deep Fried, Lunar Wrath, Power Leak, Strong Foundation, Fog Machine, Drop Blocks, Turf War, Chainsaw, Galeforce Wings, Hammer Fist, Devious Present, Zen Garden, Brain Overload, Chestnut Axe, Rain Shroud, Angelic Wings, Wrestle Showman, Fire's Wrath, Break it Down, Backflip, Overcast, Flower Necklace, Storm Cloud, Drakelp Head, Thunder Clouds, Acid Reflux, Survivor Bias, Power Outage, Daredevil, Petal Shield, Ghost Pepper, Icicle Fist, Wind Chimes, Aura Armor, Deflect, Overwhelming Mind.

### 1.4 TEXTO com dúvida (10 grupos; mantidos como TEXTO porque o expanded do config não mudou ou os textos são equivalentes)

(Jaws of Carnage, Poison Absorb, Weather Control e Perish Body saíram desta lista: estão em 1.2b como "provável".)

- **Purple Haze**: "depois de um golpe" virou "depois de um golpe de dano"; o expanded (inalterado) ainda diz "depois de um golpe".
- **Sludge Spit**: "depois de um ataque" virou "depois de um golpe" (sem expanded para conferir).
- **Drop Blocks**: "quando atingido" virou "atingido por golpe de dano" (sem expanded).
- **Hyper Cleanse**: "metade do dano de veneno" virou "metade do dano de golpes Poison" (sem expanded).
- **Atomic Punch**: "+30% dano Steel" virou "golpes Steel 1,3x"; o expanded novo acrescenta que punho Steel recebe o bônus duas vezes (antes sem expanded).
- **Best Offense**: textos equivalentes, mas o commit 0908a39 (06/05/2026) diz "Update Best Offense ability to new effect".
- **Illuminate, Heavy Metal, Lead Coat, Chrome Coat**: a descrição passou a citar Ghost removido do alvo / peso duplicado ou triplicado; os expanded dos dois commits já traziam isso.
- **Aftermath**: "o maior" virou "Explosion se Attack maior, Outburst se SpAtk maior" no expanded (esclarecimento provável).
- **Zen Garden**: descrição fala em semente; expanded inalterado já descrevia 50% aleatório com semente garantindo. Commit 18/05/2026 corrigiu o código da semente.
- **Drakelp Head**: descrição passou a trazer o número 35% (sem expanded).

### 1.5 Mudanças de habilidade que só aparecem no config (fora das 164)

São 18 habilidades cuja description/expanded_description mudou no config (7be1617 para 7285071) sem a descrição curta da NextDex mudar. Fontes: AbilityList.textproto 7be1617, 6a30b66 e 7285071. **4 delas (Craving, Flower Veil, Steelworker, Mental Pollution) já estavam no dado beta e não são mudança da 2.65.4**; restam 14. Phobia (renomeação) tem o mesmo caso na description do config.

| Habilidade | Mudança | Classe | No dado beta (até 28/03)? |
|---|---|---|---|
| Wonder Skin, Fort Knox | expanded passa a excluir também Familia Bond (além de Parental Bond e Multi-Headed) do bloqueio | MECÂNICA (consequência de Familia Bond) | não (commit 27/04 "Update Familia Bond to bypass Fort Knox/Wonder Skin") |
| Caretaker, Food Lovers | expanded: Friend Guard 50% para 25% | MECÂNICA (herda Friend Guard, ver 1.2) | não (19/05) |
| Craving | o expanded perde as bagas Leppa e Custap | MECÂNICA (alcance), mas **não é diferença da 2.65.4** | **sim**: commit 699498c, 21/03 "Remove Leppa and Custap berries from Craving (they don't work)"; já valia no dado beta |
| Flower Veil | expanded perde a frase "Includes self-stat drops" | TEXTO (commit "Update flower veil description") | **sim**: commit 7bb58e7, 24/03 |
| Steelworker | expanded: resiste Ghost e Steel para Ghost e Dark | TEXTO | **sim**: commit e56fc45, 14/03 "Fix steelworker description" |
| Mental Pollution | description e expanded: "confused" para "enraged" | MECÂNICA (gatilho), já no dado | **sim**: commit bda12c4, 21/03 "Change mental pollution to trigger on enrage"; a NextDex da beta já dizia enraged |
| Phobia (ex-Menacing Situation) | description do config: 20% para 30% Fear | TEXTO (alinha o config à NextDex) | **sim**: commit 68cf8a1, 18/03 "Fix menacing situation description" |
| Pure Power | expanded de Attack para Special Attack | TEXTO (a descrição curta já dizia Sp.Atk) | não (12/04 "Fix Pure Power expanded description") |
| Frostmaw | expanded dizia burn, passa a frostbite | TEXTO (descrição curta já dizia frostbite) | não (17/05 "Fix some abilities having wrong expanded descriptions") |
| Glacial Ghost | expanded: "reduz a precisão do oponente em 25%" para "evasão de 25%" | TEXTO | não (12/04 "Fix Glacial Ghost description") |
| Discipline, Thundercall, Marine Apex, Mighty Horn, Arctic Fur, Molten Core, Aurora's Gale | expanded estava deslocado (cada um tinha o texto de outra habilidade) e foi realinhado | TEXTO | não (17/05 "Fix some abilities having wrong expanded descriptions"; Aurora's Gale também no changelog Beta 2) |

Renomeações (5): Absorbant para Absorbent, Menacing Situation para Phobia, Apple Pie para Apple Cake, Frosty Prescence para Frosty Presence, Wings of Pestilence para Malediction. Mesmo efeito em todas. Em Phobia a description do config (20% para 30% Fear) só alinha o config à NextDex, que já dizia 30% na beta.

### 1.6 As 34 linhas de "Novas": 29 novas de verdade + 5 renomeadas no mesmo id

Confirmadas no AbilityList.textproto de 7285071: **34 de 34 presentes**. Mas só **29 são novas de verdade** (IDs que não existiam em 7be1617): as 5 primeiras da lista de "Novas" do pesquisa_versao_2654.md são as renomeações acima (mesmo ID, nome novo). As 29: Butterfly Wings, Sand Titan, Familia Bond, Mega Sol, Petroleum Jelly, Spicy Spray, Crimson Crown, Mana Coat, Hemorrhage, Overclock, Bad Guy, Ignition, Smarty Pants, Bird Type, Insect Eater, Creepy Crawlie, Third-Degree Burn, Engulf, Grimace, Thermal Dweller, Lethal Touch, Frosty, Poison Upsurge, Packed Ice, Bush Rush, Guerilla Fighter, Sour Apple, Searchlight, Light Wield.

- Posições 1034 a 1062 no array (config e NextDex iguais). Têm expanded_description no config 22 das 29; sem expanded: Insect Eater, Thermal Dweller, Lethal Touch, Guerilla Fighter, Sour Apple, Searchlight e Light Wield.
- Insect Eater: o config não tem description; a NextDex tem ("Deal 1.5x dmg to Bug-types. Take 0.5x dmg from Bug-types.").
- Portadoras no dado 2.65.4: 15 das 29 têm pelo menos uma espécie (Ignition 3, Third-Degree Burn 3, e 1 cada de Butterfly Wings, Sand Titan, Familia Bond, Mega Sol, Petroleum Jelly, Spicy Spray, Crimson Crown, Overclock, Engulf, Thermal Dweller, Sour Apple, Searchlight, Light Wield). As outras 14 não têm portador na NextDex.

### 1.7 Alerta de pipeline: o ÍNDICE das habilidades mudou

Provado com o AbilityList dos dois commits e com os dois dados NextDex (mesmo deslocamento):

- Índices **386 a 393**. Na beta: 386 Spectralize, 387 Spectral Shroud, 388 Discipline, 389 Thundercall, 390 Marine Apex, 391 Mighty Horn, 392 Hardened Sheath, 393 Arctic Fur. Na 2.65.4: 386 Spectral Shroud, 387 Discipline, 388 Thundercall, 389 Marine Apex, 390 Mighty Horn, 391 Hardened Sheath, 392 Arctic Fur, 393 Spectralize. Ou seja, Spectralize foi para o fim do trecho e as outras 7 subiram um índice. Os demais 1026 índices da beta mantêm a mesma habilidade (só os 5 renomeados trocam de nome).
- Índices **1017/1018**: no config o nome e o ID estavam trocados entre Icicle Fist e Abominable Monster na 2.65beta (commit 21/04/2026 "Fix Icicle Fist and Abominable Monster ids being swapped in descriptions"). Por posição/nome a NextDex não mudou (1017 Icicle Fist, 1018 Abominable Monster nas duas).
- Consequência: tudo que guarda habilidade por índice da beta (data/bosses.json abiId, builds, saves) aponta para a habilidade errada nos índices 386 a 393 se for lido com o dado 2.65.4. Em bosses.json hoje: 927 de 927 habilidades batem com o dado beta; só 921 batem com o dado 2.65.4 (6 mons com habilidade errada).
- Mesma coisa nas espécies: o array species foi de 1907 para 1923 posições; só 740 dos 927 mons de bosses.json têm o nome certo no índice da 2.65.4.

## 2. Chefões x config

### 2.1 Segurança do script

Li scripts/conferir_chefoes_config.mjs inteiro antes: sem --aplicar ele só lê (data/bosses.json, data/gameData_2654.json, TrainerList e AbilityList) e imprime; a única escrita (writeFileSync em bosses.json) está dentro do if de --aplicar. Conferido: md5 de bosses.json igual antes e depois.

### 2.2 Execução literal pedida

`node scripts/conferir_chefoes_config.mjs <pasta 7285071>/TrainerList.textproto "--categorias=."` deu **201 diferenças** (ocorrências por campo: espécie 189, habilidade 169, item 4, natureza 3, golpes 2, EVs 2). **Esse número não mede NextDex x config**: o script lê o data/bosses.json (gerado da NextDex **beta**, com índices da beta) e traduz os índices com o gameData_2654.json. Como os índices de espécie e habilidade mudaram (1.7), quase tudo é nome trocado por deslocamento (ex.: "espécie: app Lairon Redux / jogo LAIRON_REDUX" é a mesma espécie com índice deslocado). Não usar esse resultado.

### 2.3 Comparações com versões casadas (harness no scratchpad, reaproveitando as funções exportadas do script, sem gravar nada)

| Comparação | Diferenças |
|---|---|
| A) bosses.json (beta) x TrainerList 7be1617, mapa beta | **0** (as 123 lutas de bosses.json batem com a config da beta; o harness está validado) |
| B) bosses.json (beta) x TrainerList 7285071, mapa beta | 8 (Padrão/Insane), mais 4 de Hell = 12 linhas em 8 treinadores: o que a config mudou na 2.65.4 e o bosses.json ainda tem da beta |
| C) NextDex 2.65.4 (bosses reconstruídos do gameData_2654.json, 123 lutas) x TrainerList 7285071 | **24, todas "item: NextDex vazio / jogo EVIOLITE"** (19 Padrão/Insane + 5 Hell). Dos 24, **19 já estão remendados em data/bosses.json pelo ticket 02**; só os 5 de Hell estão abertos |
| C') idem para os 895 treinadores do dado | 343: 332 Eviolite, 5 de golpes "NONE" (preenchimento de Hell, equivalente), 6 nomes sem correspondência por ID sem prefixo TRAINER_ (Brendan/May Treecko/Torchic/Mudkip Meteor Falls) |

Conclusão: o time dos chefões do dado NextDex 2.65.4 **bate com a config em espécie, habilidade, natureza, golpes e EVs**; a única coisa que a NextDex perdeu é o **Eviolite**.

### 2.4 Causa do Eviolite perdido

No dado cru, items[0] é o próprio Eviolite (ITEM_EVIOLITE, id 310; vale na beta e na 2.65.4). O código de extract_bosses.ps1 (linha 52) usa `if ($mon["item"] -and ...)`, e 0 é falso, então o item índice 0 vira "sem item". Prova: o dado tem exatamente **332** mons de treinador com item 0 e a config tem exatamente **332** Eviolite em 8208 mons (a config tem outros 45 mons sem item, que o dado não marca com 0). Ou seja, "item 0" = Eviolite sempre. O conserto atual (--aplicar, ticket 02) só cobre party/insane; **Hell não é coberto** (5 casos nos chefões) e regenerar bosses.json do dado cru apaga o remendo. Corrigir na extração (tratar 0 como item válido) resolveria os 332. **Situação no app hoje**: conferi os 24 contra o data/bosses.json atual: 19 (Padrão/Insane) já têm Eviolite, remendados pelo ticket 02 com --aplicar; **só os 5 de Hell estão abertos** (Tabitha Mt Chimney Hell 3, Shelly Weather Institute Hell 5, Calvin 1 Hell 1, 4 e 5). Regenerar bosses.json do dado cru sem corrigir a extração apagaria os 19 remendos.

### 2.5 O que a config mudou nos times (7be1617 para 7285071)

- 292 linhas de time mudaram em **130 treinadores** de 933 (nenhum treinador novo ou removido; 34 mudanças de tamanho de time). TrainerList.textproto é **idêntico byte a byte em 7be1617 e 6a30b66** (28/03): nenhuma dessas 292 linhas está no dado beta; os 31 commits que o alteram são todos posteriores a 28/03.
- Dos 123 de bosses.json, mudaram **8 treinadores** (o dado 2.65.4 da NextDex já tem tudo isso; é o bosses.json atual, da beta, que está desatualizado):
  - Matt (Padrão 6): Barbaracle troca o item Choice Band por Barbaracite e a habilidade Anticipation por Spike Armor. Matt (Insane 6): Blastoise (Blastoisinite X, Firefighter) vira Starmie (Starminite, Jolly, Swift Swim; golpes Psychokinetic Slam, Liquidation, Triple Axel, High Jump Kick; EVs 0/252/0/0/0/252).
  - Matt Mt Pyre (Insane 6): Inteleon (Inteleonite) vira Starmie (Starminite, mesmo set); Hell 5: Calyrex Shadow Rider passa a ter As One Shadow Rider.
  - Lucy Lavaridge (Insane 5): Dudunsparce, Normalize vira Tectonize.
  - Courtney Mossdeep (Hell 3): Scream Tail, Armor Tail vira Fur Coat.
  - Archie Slateport (Hell 5) e Archie Mt Pyre (Insane 6 e Hell 6): Sharpedo, Swift Swim vira Rain Shroud.
  - Monochamp Electric (Padrão 4): Porygon-Z, natureza Jolly vira Timid; (Padrão 6) Flygon Redux B, Flygonite R vira Flygonite R B.
  - Monochamp Psychic (Padrão 6): Espeon Galaxy (Feline Prowess) vira Espeon (Soul Heart).
- Fora do app (não estão em bosses.json): as lutas de rival (Brendan/May em Route 103/110/119, Rustboro, Lilycove, com versões Treecko/Torchic/Mudkip) concentram a maior parte das 292 linhas (commits de 11 e 20/05/2026 "Added the new elite and ace teams for rival fights" e "Updated Rival Fights"), além de ~100 treinadores comuns, grunts Aqua/Magma e Ace Trainers.

### 2.6 Novo na config e invisível na NextDex: habilidades de batalha do Hell

A config 7285071 tem BattleSkillList.textproto e **TrainerBattleSkillList.textproto** (157 entradas, 155 treinadores; vão de Route 102 até Wattson 1), arquivos que **não existem em 7be1617**. São efeitos de campo e habilidades extras por treinador no modo Hell (ex.: Sticky Web, Spikes, clima permanente, "Extra Ability", Focus Sash, e Eviolite de time inteiro em 1 treinador). O gameData da NextDex não traz isso (nenhuma chave equivalente). Dos chefões do app, 10 têm skill: Steven Granite Cave, Archie Slateport, Greta Slateport, Roxanne 1, Brawly 1, Wattson 1, Leaf Altering Cave, Shedinjite Abandoned Ship, Crobatite Dewford Manor, Sinnoh Megas Mauville Game Corner. Se o app mostra/simula Hell, isso é lacuna da NextDex (não verificado se o Insane ou o Padrão usam skills: o arquivo não distingue).

## 3. Itens

Fonte: items/*.textproto e ItemList.proto/ItemEnum.proto nos dois commits.

- **Nenhum item mudou de efeito.** ItemList.proto e ItemEnum.proto idênticos (mesmo sha); BattleList, BerriesList, ItemsList, KeyItemsList, MedicineList, PokeBallsList, TmHmList e UnusedList idênticos byte a byte. Só MegaStonesList.textproto mudou (6 de 287 itens).
- O config não guarda o efeito em si além de hold_effect (campo não mudou em nenhum item). A lógica dos itens vive no código-fonte do jogo (não consultei o código de item; no log só há "fixed eviolite bugs", 29/03/2026, e "Move eviolite battle skill implementation to gBattleSkills", 08/08/2026, sem detalhe do que mudou).

Só renomes, texto e disponibilidade (MegaStonesList):

| Item | Mudança | No dado beta (até 28/03)? |
|---|---|---|
| ITEM_SKARMORITE | nome Skarmorite para **Skarmorite X** | não (20/05, commit 2dda856 "another fix and added X to the other one") |
| ITEM_SKARMORITE_Y | nome Skarmorite para **Skarmorite Y** | não (20/05, d37326a "fixed skarmorite Y to be named Y") |
| ITEM_ARBOKITE | **perde adoption_center** (sai do Centro de Adoção; o changelog Beta 2 fala em "a couple removed") | não (27/04, cbdac78 "Arbok Mega Changed to Evo") |
| ITEM_RAICHUNITE_X | nome "Raichu" para **Raichunite X** (texto errado; changelog 2.65.3b) | **sim** (14/03, 53a97d5) |
| ITEM_URSALUNITE | descrição "Ursaring" para "Ursaluna" (typo; changelog 2.65.3b) | **sim** (14/03, 20ec2eb) |
| ITEM_DURALUDITE | descrição "DuraludonP." para "Duraludon" e **adoption_center: true** (changelog 2.65.3b: "Duraludonite is now available in the Adoption Center") | **sim** (14/03, 2e29630 "Added Duraludonite to Shop") |

Resumo: dos 6 itens alterados entre 7be1617 e 7285071, 3 já estavam no dado beta (Raichunite X, Ursalunite, Duraludite); as mudanças da 2.65.4 são só Skarmorite X/Y (rótulo) e Arbokite fora do Centro de Adoção. Disponibilidade: afeta o que o app diz sobre "onde achar" (scripts/gerar_onde_achar_itens.mjs). Detalhe do Centro de Adoção por espécie em 3B.

## 3A. Golpes (MoveList.textproto)

Fonte: MoveList.textproto em 7be1617, 6a30b66 (28/03) e 7285071; comparação campo a campo (descrição, descrição curta, effect, argument, flags, poder, precisão, PP, prioridade, chance, tipo, custom_behavior). No config, "description" corresponde ao lDesc da NextDex e "short_description" ao desc.

- 1032 golpes nos três commits (mesmos ids). Entre 7be1617 e 7285071, **84 golpes** têm alguma diferença no config: 49 já no dado beta (14 a 28/03) e 38 depois (3 aparecem nos dois grupos: Sky Uppercut, Beak Blast, Incite).
- Dos 49 do dado beta: 37 são só estruturais (refator de 21/03 "Begin moving move configs to protos", que troca effect/argument por custom_behavior sem mudar o jogo; é por isso que a NextDex mostra **eff/arg: 0 alterações**) e 12 com valor ou texto: Whirlpool (chance 100 para 30), Hold Back (chance 50), Burning Jealousy (50% de queimar só se o alvo tem buffs), Frost Brand (10), Lightning Strike (20), Spectral Flame (sem chance), Fetch (PP 5), Waterlog (prioridade +3, chance 20), Incite (texto), Prism Blast (chance 100 para 10), Party Favors (texto) e Concoction (tipo Mystery para Grass). Nenhum desses é diferença A para B.
- Dos 38 posteriores: os **37 da lista do versao §4** (NextDex) **mais Incite**, que a NextDex não mostra: argument.effect MOVE_EFFECT_DOUBLESLAP para MOVE_EFFECT_ENRAGE (commit 7477d89, 12/04, "Fix incite using the wrong move effect") = MECÂNICA (correção do efeito aplicado).
- Origem dos 37: 30 no commit 9e54b3d (27/04) "Up dating the moves to Champion ways + updating trainers" (PP das proteções, poderes, Growth para Grass, Clangorous Soul, Make It Rain); Blizzard, Fire Blast e Muddy Water em 8bb34e1 (12/04); Pocket Sand em e89a485 (30/04); Sky Uppercut em c018862 (24/06); Stone Axe em c3bf9ad (25/07, "not technician boosted": 60 para 65 tira o bônus de Technician); Ice Ball (flag Throw Based, campo throwing) em 79538b5 (27/09).
- Classificação dos 37: **35 MECÂNICA** (poder 14, PP 15, chance 3, precisão 2, prioridade 1, tipo 1, flag 1; Beak Blast e Pocket Sand têm dois campos) e **2 TEXTO** (os dois lDesc): Sky Uppercut e Muddy Water.
- **Sky Uppercut** (lDesc "...uppercut thrown skywards" para "...Super-effective on Flying-types"): TEXTO. O efeito "super-efetivo contra Flying" já existia em 7be1617 (effect EFFECT_SE_AGAINST_TYPE_HIT com argument TYPE_FLYING) e em 6a30b66 (custom_behavior.attack.super_effective_vs TYPE_FLYING); só a descrição passou a dizer (commit 24/06 "Update Sky Uppercut description to include super-effectiveness against Flying types"). Poder, tipo, PP e precisão iguais.
- **Muddy Water** (lDesc "Ground-and Water-type" para "Ground and Water-type"): TEXTO, só um hífen de typo (commit 8bb34e1).
- **Clangorous Soul** (precisão 100 para 101): interpretação, não confirmada em código: 101 é o único valor acima de 100 em toda a MoveList (os golpes que não erram não têm campo de precisão: 224 no config, 223 com acc 0 na NextDex), então 101 funciona como sentinela provável de "não erra", mas pode ser typo do commit de 27/04. Efeito prático nulo se o golpe só atinge o próprio usuário (target 2 no dado). O commit 9e54b3d não explica.
- **Blizzard e Pocket Sand já tinham o texto novo na beta; só o número mudou**: a description de Blizzard em 6a30b66 já diz "20% frostbite chance" com effect_chance ainda 30 (agora 20); a de Pocket Sand já diz "10% acc. drop, +1 priority" com effect_chance e priority ausentes (agora 10 e 1, commit e89a485 "Fix Pocket Sand missing priority and effect chance"). Ou seja, o jogo passou a cumprir o que o texto já dizia.
- **Ice Ball**: única mudança de flag (Throw Based, NextDex flags 0,12,14 no dado novo). MECÂNICA: golpes e habilidades de arremesso (Devious Present, por exemplo) passam a contar o Ice Ball.
- Interações para o rank: Stone Axe a 65 deixa de receber Technician; Pocket Sand ganha +1 de prioridade; Blizzard e Fire Blast perdem 10 pontos de chance de efeito.

## 3B. Centro de Adoção e campos de espécie (SpeciesList e itens)

Fonte: SpeciesList.textproto e items/MegaStonesList.textproto em 7be1617, 6a30b66 e 7285071. Nada disso existe no dump da NextDex.

- adoption_center_badge (por espécie): **0 espécies em 7be1617** (o campo só nasce em 14/03, commit fcab1b4 "Move adoption center data to species list"), 66 em 6a30b66 (já no dado beta) e **69 em 7285071**. Diferença dado beta para 2.65.4: **+3, nenhuma saiu**: Grimer Redux (insígnia 2), Phanpy Redux (1) e Rufflet Redux (2), que entram junto com as espécies novas. Distribuição em 7285071 por insígnia: 0:9, 1:16, 2:16, 3:12, 4:4, 5:5, 6:1, 7:2, 8:4. Munchlax Redux (insígnia 4) já estava no dado beta.
- Itens com adoption_center (MegaStonesList): 140 em 7be1617, 141 em 6a30b66, 140 em 7285071. **Duraludite entrou em 14/03** (2e29630, já no dado beta; não é diferença A para B). **Arbokite saiu em 27/04** (cbdac78 "Arbok Mega Changed to Evo", junto com a remoção de Arbok Mega do SpeciesList; Arbok passa a evoluir para Asudem no nível 55). Resumo A para B: **-1 item (Arbokite), +0**.
- Outros campos de espécie comparados entre 6a30b66 e 7285071 (adoption_center_badge, preferred_climate, allowed_climate, elevation, amphibious, exclude_land, rare, bp_cost, randomizer_category, randomizer_banned, randomizer_alt_gender, tier, universal_tutors, linked_species, genderless, allow_deevolution_to): a única mudança é randomizer_banned de Duraludon Partner Mega (SPECIES_HIDDEN removido; commit 12/04 "Unban Duraludon Partner Mega"). Os campos de clima servem ao gerador de encontros do randomizer e não mudaram.
- **Presente (mystery gift) e encontro fixo**: o er-config não tem arquivo nem campo para isso (arquivos em 7285071: Ability, BattleFrontier, BattleSkill, Help, Item, LimitedRandomizer, Move, MoveBehavior, Species, Trainer, TrainerBattleSkill). Os mystery gifts de Meloetta, Silvally e Volcanion e os encontros da Victory Road não são verificáveis pela config.
- Espécies: a config tem 16 novas (Asudem, Grimer Redux, Muk Redux, Moravine, Phanpy Redux, Donphan Redux, Mastophan, Volbeep, Astrobeep, Illumars, Illuminaut, Rufflet Redux, Braviary Redux, Isoshrew, Isoslash, Noxislash) e 1 removida (Arbok Mega); a 17ª "nova" da NextDex é Duraludon Partner Mega, que já existia na config como banida do randomizer.

## 3C. Datas: o que do diff 7be1617 para 7285071 já estava no dado beta

Commits do er-config entre 7be1617 (13/03 PDT) e o corte do dado beta (28/03/2026 17:17 UTC): **54** (de 272 até 7285071; os outros 218 são posteriores). Colunas: hash, data UTC, assunto.

| Commit | Data UTC | Assunto |
|---|---|---|
| 2e29630 | 2026-03-14 18:19 | Movepool changes + Level to evos changed + Added Duraludonite to Shop |
| d1b84fe | 2026-03-14 18:19 | Movepool changes + Level to evos changed + Added Duraludonite to Shop |
| 3fc626b | 2026-03-14 18:19 | Merge branch 'upcoming' of https://github.com/Elite-Redux/er-config into upcoming |
| 059bf0a | 2026-03-14 21:10 | Fix bad species animations on golbat and venomoth |
| e56fc45 | 2026-03-14 21:12 | Fix steelworker description |
| 8fe8dcf | 2026-03-14 21:25 | Gave Clefable Energy Wave + Take Flight + Bellossom Poison Absorb |
| cf9f9d8 | 2026-03-14 21:25 | Merge branch 'upcoming' of https://github.com/Elite-Redux/er-config into upcoming |
| fcab1b4 | 2026-03-15 00:37 | Move adoption center data to species list |
| 0f40bf4 | 2026-03-15 00:37 | Merge branch 'upcoming' of https://github.com/Elite-Redux/er-config into upcoming |
| 20ec2eb | 2026-03-15 04:51 | Fix Ursalunite description |
| 53a97d5 | 2026-03-15 04:52 | Fix Raichunite X name |
| b46993d | 2026-03-15 06:49 | Fix Chesnaught Clemont reverting into non-battle-bond Chesnaught |
| 68cf8a1 | 2026-03-18 19:12 | Fix menacing situation description |
| 612a8b8 | 2026-03-19 08:06 | Remove Sunstrike and Tempest Storm from move lists |
| e7996fc | 2026-03-21 00:21 | Party Favors |
| 7ac92d5 | 2026-03-21 00:50 | Prism Blast |
| c622184 | 2026-03-21 04:12 | Waterlog and incite |
| 08edf09 | 2026-03-21 04:21 | Spectral Flame |
| fd28324 | 2026-03-21 04:43 | Concoction |
| 4d45b89 | 2026-03-21 05:03 | Fetch! |
| bdc3765 | 2026-03-21 05:08 | Remove unused move effects |
| 18543b2 | 2026-03-21 05:11 | Teatime |
| af3df06 | 2026-03-21 07:21 | Fix fetch pp |
| 699498c | 2026-03-21 07:55 | Remove Leppa and Custap berries from Craving (they don't work) |
| a344f53 | 2026-03-21 08:09 | Remove effect chance that doesn't do anything |
| c87eb96 | 2026-03-21 08:11 | Add missing magic coat flags for waterlog and spectral flame |
| b83241e | 2026-03-21 08:13 | Add magic coat flags to add 3rd type effects |
| bda12c4 | 2026-03-21 08:26 | Change mental pollution to trigger on enrage |
| d791b3d | 2026-03-22 00:14 | Begin moving move configs to protos for cross-platform support |
| 047655d | 2026-03-22 01:39 | Migrate simple attacks to move behavior configs |
| 600a6f3 | 2026-03-22 01:55 | Migrate more stuff |
| 0e9a896 | 2026-03-22 03:06 | Allow moves to directly implement behaviors |
| e32df9d | 2026-03-22 03:20 | Migrate some moves to custom behaviors and fix excalibur |
| dee13f9 | 2026-03-22 03:28 | Add DRENCH_HIT |
| 10947c1 | 2026-03-22 04:25 | Handle multiple move effects on attacks |
| fd54131 | 2026-03-22 04:30 | Remove EFFECT_SONICBOOM |
| 0bdc0f0 | 2026-03-22 05:03 | Move some weird on-hit effects to using move effects |
| f1a73bf | 2026-03-22 05:08 | Migrate leech seed hit |
| a45c692 | 2026-03-22 05:35 | Handle recoil fractions |
| 0630f71 | 2026-03-22 22:19 | Mega Tyranitar Stat Rechange |
| 9237932 | 2026-03-22 22:19 | Merge branch 'upcoming' of https://github.com/Elite-Redux/er-config into upcoming |
| 32629f9 | 2026-03-23 00:27 | Try doing move damage modifiers via scripting |
| 5e77752 | 2026-03-23 00:27 | Merge branch 'upcoming' of https://github.com/Elite-Redux/er-config into upcoming |
| 3776072 | 2026-03-23 06:25 | Fix Burning Jealousy, Lightning Strike, and Volt Bolt effects to match descriptions. |
| 78dcd41 | 2026-03-23 07:54 | Fix Hold Back and Frost Brand missing effect chance |
| 33b7960 | 2026-03-24 00:20 | Revert burning jealousy effect and update description |
| 7bb58e7 | 2026-03-25 05:47 | Update flower veil description |
| a298e6d | 2026-03-25 15:39 | Updated M-ARcanine Hisui |
| 4226235 | 2026-03-25 15:47 | Updated Mega Hydreigon Sprite positioning |
| b7f9c33 | 2026-03-27 01:17 | Crag Jungus changed to Hopper |
| 123fc66 | 2026-03-27 01:49 | Munchlax R movepool done |
| 1d75d43 | 2026-03-27 05:04 | Remove overheat move effect because it isn't used |
| 063cb60 | 2026-03-27 05:51 | Fix Clay Dart being supereffective vs wrong type |
| 6a30b66 | 2026-03-28 07:03 | Remove unnecessary argument from Esper Wing effect |

Resumo por área (7be1617 até 6a30b66 = já no dado beta; 6a30b66 até 7285071 = diferença real A para B):

| Área | Já no dado beta | Depois de 28/03 |
|---|---|---|
| Habilidades (descrição/expanded) | Craving, Flower Veil, Steelworker, Mental Pollution, Phobia (5) | 183 entradas do AbilityList (as 164 linhas da lista, com Embody Aspect em 4 ids, mais 16 só do config: 14 da tabela 1.5, Absorbent e a troca de Icicle Fist/Abominable Monster) |
| Golpes | 49 (37 estruturais + 12) | 38 (37 NextDex + Incite) |
| Itens | Raichunite X, Ursalunite, Duraludite (+adoption) | Skarmorite X/Y, Arbokite fora |
| Espécies | adoption_center_badge 66, learnset 25, evo 3 | learnset 399 espécies, 16 novas, Arbok Mega fora, +3 no Centro de Adoção |
| Treinadores | 0 (TrainerList idêntico) | 292 linhas em 130 treinadores (31 commits) |
| Habilidades de batalha do Hell | não existiam | criadas em 20/07 (c95fb47) |


## 4. As 10 mudanças mais relevantes para builds e rank

1. Índice de habilidade deslocado (386 a 393) e de espécie (+16 posições): qualquer dado do app guardado por índice da beta lê a coisa errada. Risco de pipeline antes de qualquer rank.
2. Friend Guard 50% para 25% (61 entradas de espécie, mais Caretaker e Food Lovers): enfraquece suporte de dupla.
3. Feathercoat 10/20% para 15/30% (5 entradas): buff.
4. Justified agora aumenta o maior ataque (17 entradas) e Oblivious passa a bloquear Disable/Encore/Torment (41).
5. Infatuation sem restrição de sexo (Cute Charm 44 entradas, mais Prim and Proper, Pure Love, Tender Affection, Yuki Onna): afeta duelo simulado.
6. Familia Bond (dois golpes, 100% e 50%, ignora Fort Knox/Wonder Skin) e as outras 28 habilidades novas; só 15 das 29 têm portador, e Ignition e Third-Degree Burn são as com mais (3 cada).
7. Pyro Shells (Explosion se físico), King of the Jungle (agora Grassy Surge + Infiltrator), Scarecrow (Cotton Down no lugar de Bad Luck), World Serpent (Serpent Bind), Magus Blades (2º hit a 60%), Madness Enhancement (20%): 1 a 2 espécies cada, mas mudam as builds dessas espécies.
8. Eviolite: 332 mons de treinador têm Eviolite que a extração derruba (24 nas 123 lutas de chefão). **No app, 19 dos 24 (Padrão/Insane) já foram remendados pelo ticket 02; só os 5 de Hell estão abertos** (Tabitha Mt Chimney Hell 3, Shelly Weather Institute Hell 5, Calvin 1 Hell 1/4/5). A correção de fundo (tratar item 0 como item válido na extração) evita o remendo.
9. Times de chefões mudados na config: Matt (Starmie Starminite no lugar de Blastoise/Inteleon), Lucy (Tectonize), Archie (Rain Shroud), Monochamp Electric/Psychic. O bosses.json do app ainda tem a versão da beta (a NextDex 2.65.4 já está certa).
10. Habilidades de batalha do Hell (TrainerBattleSkillList, 155 treinadores) e rivais reescritos: nenhum dos dois entra no app hoje.

## 5. O que não deu para verificar

- Nenhum código-fonte do jogo (er-repo) foi lido por mim; os commits citados vêm de src_log.txt (mensagens, sem o diff). Nada de efeito de item, e Justified/Oblivious/Cute Charm/Yuki Onna não aparecem no log (a origem vem só do texto do config e do changelog).
- A classificação de Magus Blades, Cute Charm e Yuki Onna depende só do texto expandido do config.
- O changelog oficial salvo vai até a 2.65.3b: não há notas oficiais da 2.65.4 para confrontar.
- Golpes e espécies foram comparados só no nível do config (seções 3A e 3B); o efeito dentro do jogo não foi lido no código. O significado de precisão 101 (Clangorous Soul) é interpretação.
- Dos 10 "MECÂNICA provável" (1.2b), 8 só têm a descrição curta como sinal: o config não mostra mudança de efeito. Se o jogo já funcionava como a nova descrição diz, são só texto.
- Se o modo Padrão/Insane também usa as habilidades de batalha do Hell não está no arquivo.

## 6. Revisão crítica (o que reabri antes de entregar)

- Todas as 164 linhas foram conferidas contra description e expanded dos DOIS commits (script): 0 divergência de texto curto e 27 com expanded alterado, cada uma lida uma a uma.
- Hardened Sheath tinha expanded errado na beta (trazia o texto de Arctic Fur, 35% de redução); o novo traz "ataque +1 quando golpe de chifre acerta", igual à descrição curta: TEXTO, não mecânica.
- Jaws of Carnage, Poison Absorb, Weather Control e Perish Body: o expanded inalterado dos dois commits já descrevia o efeito da descrição nova. Na rodada 2 passaram a "MECÂNICA provável" (1.2b) porque a descrição curta, que é a base do motor do app, mudou; verificar no código antes de mudar o motor.
- Friend Guard foi capturada duas vezes (a linha própria e dois herdeiros fora da lista, 1.5); Wonder Skin e Fort Knox entram pela Familia Bond.
- O resultado de 201 diferenças do script literal foi descartado como artefato de índice, com as três comparações casadas como prova.
- Rodada 2 do Gauntlet: o baseline 7be1617 era 14 dias anterior ao dado beta; refiz a classificação de "já estava no dado" contra 6a30b66 (último commit antes do corte de 28/03 17:17 UTC), o que tirou Craving, Flower Veil, Steelworker, Mental Pollution e Phobia, 3 itens e 49 golpes da conta de mudanças da 2.65.4.
- Reclassifiquei 8 habilidades de TEXTO para MECÂNICA provável por critério único: a descrição curta mudou condição, número ou alcance (1.2b).
