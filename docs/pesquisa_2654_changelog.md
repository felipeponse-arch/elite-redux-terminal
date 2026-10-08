# Curadoria 2.65.4: changelog oficial x dado NextDex

Pesquisa de 07/10/2026 (especialista Meta Pokémon). Só leitura: nenhum dado, script ou build foi alterado.
Complementa `docs/pesquisa_versao_2654.md` (lista completa do que mudou no dado).

Fontes usadas (todas oficiais ou do próprio dado):
- Changelog oficial https://eliteredux.net/full-changelog/ (baixado de novo em 07/10: 292.551 bytes, idêntico à cópia anterior).
- Índice https://eliteredux.net/full-documentation/ e página de download.
- Dados: `data/raw/snapshots/gameData_2.65beta.json.gz` (A, igual byte a byte a `data/gameData_265beta.json`) e `data/gameData_2654.json` (B).
- Repositórios oficiais Elite-Redux: `er-config` (histórico de commits e `SpeciesList.textproto`) e `eliteredux-source` (branch `upcoming`, clone local no scratchpad da sessão).
- Repositório NextDex (ForwardFeed/ER-nextdex) só para saber como o rótulo "2.65.4" nasce.

## 1. Notas oficiais posteriores à 2.65beta

O changelog lista, do mais novo para o mais antigo: **2.65.3b**, **2.65 Beta 2**, **2.65 Public Beta**, 2.5 e anteriores.
- NÃO existem notas de 2.65.1, 2.65.2, 2.65.4 nem 2.65.4.1b. Onde procurei:
  - changelog ao vivo (07/10);
  - índice da documentação e página de download (o link de download diz "v2.65.3b");
  - API do GitHub `eliteredux-source`: releases = lista vazia, tags = lista vazia;
  - texto de versão no código (`src/strings.c`, `hall_of_fame.c`, `start_menu.c` no tip do `upcoming` de 07/10): ainda "v2.65 Beta2.1".
- O changelog não traz datas. Datei a 2.65.3b pelos commits do `er-config` (ver seção 4).
- Discord (anúncio da 2.65.4.1b): NÃO VERIFICADO. Não tenho leitura dele nesta sessão; o anúncio só chegou a mim pela sua mensagem.

Entradas da **2.65 Beta 2** (sem detalhe de dado; todas "NÃO TEM"): lineup de Mega Stones do Adoption Center; rework de Attract/infatuation; "vários movepools" e "ajustes pontuais" sem nomear espécie; Hydra corrigida; descrição do Aurora's Gale; Last Resort; Mt. Pyre/Matt; Battle Info com habilidade selvagem randomizada. Observação: Hydra ("Multi-Headed + Hubris") e Aurora's Gale ("Majestic Bird + North Wind") têm texto idêntico em A e B; Last Resort idêntico. Nada a conferir.

## 2. 2.65.3b contra o dado 2.65.4 (B)

Veredito é sempre contra B. Coluna "Já em A": a mudança já estava no dado 2.65beta (A).
Leitura dos nomes de evolução: no changelog, "Magneton: nível 23 -> 30" quer dizer Magnemite evolui para Magneton no 30; idem Rhydon (Rhyhorn, 32) e Rhyperior (Rhydon, 50). Os nomes grafados "Belossom", "Victreebell", "Amoongus" foram lidos como Bellossom, Victreebel, Amoonguss.

| # | Entrada do changelog | Categoria | Veredito | Já em A | Evidência no dado |
|---|---|---|---|---|---|
| 1 | Munchlax Redux no Adoption Center | encontro | NÃO TEM no dado; **CONFIRMA no config** | sim (config 28/03) | O Adoption Center não existe no dump NextDex, mas o `er-config` tem `adoption_center_badge: 4` em SPECIES_MUNCHLAX_REDUX tanto em 6a30b66 (28/03, último commit antes do corte do dado A) quanto em 7285071. O campo nasceu em 14/03 (commit fcab1b4). Diferença A -> B no config: +3 espécies no Centro (Grimer Redux, Phanpy Redux, Rufflet Redux), nenhuma saiu (docs/pesquisa_2654_config.md 3B) |
| 2 | Duraludonite no Adoption Center | item | NÃO TEM no dado; **CONFIRMA no config** | sim (config 14/03) | O item chama-se "Duraludite" (ITEM_DURALUDITE, id 908) no dado, nome diferente do changelog; a disponibilidade não está no dump. No `er-config`, `adoption_center: true` em ITEM_DURALUDITE entra no commit 2e29630 (14/03, "Added Duraludonite to Shop") e está em 6a30b66 e 7285071. Na outra direção, **Arbokite saiu do Centro de Adoção em 27/04** (cbdac78, "Arbok Mega Changed to Evo"), mudança A -> B que o dump não mostra. O Mega Duraludon (SPECIES_DURALUDON_PARTNER_MEGA) só existe em B no dump, mas já existia no config (banido do randomizer até 12/04) |
| 3 | Party Favors, Prism Blast, Incite, Waterlog, Spectral Flame, Concoction, Fetch, Teatime "implementados" | golpe | CONFIRMA | sim | os 8 são golpes (não habilidades) e existem idênticos em A e B (ex.: Party Favors 60 BP PP10; Prism Blast 95 BP PP5). "Implementado" (funciona) não é visível no dado |
| 4 | Magneton evolução 23 -> 30 | evolução | CONFIRMA | sim | `species[Magnemite].evolutions = {kd:0, rs:"30"}` |
| 5 | Rhydon evolução 23 -> 32 | evolução | CONFIRMA | sim | Rhyhorn rs "32" |
| 6 | Rhyperior evolução 36 -> 50 | evolução | CONFIRMA | sim | Rhydon rs "50" |
| 7 | Starmie aprende Stone Edge, High Jump Kick, Close Combat, Ice Spinner, Triple Axel | movepool | CONFIRMA | sim | Stone Edge (tutor), HJK e CC (nv 51), Ice Spinner (nv 61), Triple Axel (nv 71) |
| 8 | Mega Starmie inata Spiteful -> Blur | inata | CONTRADIZ | A confirma | A: inatas Break it Down, Blur, Mystic Power. B: Break it Down, **Own Tempo**, Mystic Power. Mudança posterior sem nota. Provável commit de 20/04 "Updated Mega Starmie + Mega Sneasler" (inferência, não conferi o diff) |
| 9 | Clefable aprende Energy Wave, Take Flight | movepool | CONFIRMA | sim | ambos via tutor |
| 10 | Bellossom inata Healer -> Poison Absorb | inata | CONFIRMA | sim | Bellossom inatas Flower Veil, Poison Absorb, Triage |
| 11 | Victreebel aprende Sweet Scent, Ingrain, Acid, Sludge Wave | movepool | CONFIRMA | sim | Sweet Scent nv1, Ingrain tutor, Acid nv17, Sludge Wave nv46 |
| 12 | Samurott Hisuiano inata Battle Armor -> Shell Armor | inata | CONFIRMA | sim | inatas Torrent, Shell Armor, Keen Edge |
| 13 | Meganium aprende Earth Power | movepool | CONFIRMA | sim | tutor |
| 14 | Jumpluff aprende Giga Drain | movepool | CONFIRMA | sim | nv 37 |
| 15 | Volbeat aprende Quick Attack, Insect Impact, Facade | movepool | CONFIRMA | sim | nv1, nv17, tutor |
| 16 | Luxio aprende Play Rough, Cut | movepool | CONFIRMA | sim | ambos tutor |
| 17 | Amoonguss habilidade Infiltrator -> Rain Dish | habilidade | CONFIRMA | sim | Amoonguss abis Rain Dish, Mycelium Might, Toxic Surge. (Foongus, a pré-evolução, ainda tinha Infiltrator em A e ganhou Rain Dish em B: mudança do 2.65.4) |
| 18 | Drampa aprende Weather Ball | movepool | CONFIRMA | sim | tutor |
| 19 | Dracovish aprende Sandstorm | movepool | CONFIRMA | sim | tutor |
| 20 | Overqwil aprende Rain Dance | movepool | CONFIRMA | sim | tutor |
| 21 | Torterra: Amnesia do nv 56 -> nv 71 | movepool | CONTRADIZ | não | Torterra não aprende Amnesia em A nem em B (nem nível, nem tutor/TM). Maior nível da lista é Fissure no 56. Também não há nível 71. Possível erro do changelog (espécie errada) |
| 22 | Pentadug Alolino troca habilidade Moustache e inata Loose Rocks | habilidade/inata | CONFIRMA | sim | abis Costar, Loose Rocks, Steelworker; inatas Multi-Headed, Steely Spirit, Moustache |
| 23 | Victreebel Redux não aprende mais Drain Brain | movepool | CONFIRMA | sim | ausente em A e B (ausência só prova o estado final, não o "antes") |
| 24 | Throh Redux não aprende mais Arm Thrust | movepool | CONTRADIZ | não | Throh Redux ainda tem Arm Thrust nv 17 em A e B; também no `SpeciesList.textproto` do `er-config` em 07/10 (`learnset` com MOVE_ARM_THRUST) |
| 25 | Mega Baxcalibur Defesa 105 -> 117 | status | CONFIRMA | sim | base [115,175,117,105,101,87] |
| 26 | Mystery gifts de Meloetta, Silvally, Volcanion no pós-game | encontro | NÃO TEM | - | `SEnc` vazio para os três em A e B; o dump não traz a regra de presente | (revisado: o `er-config` não tem arquivo nem campo de presente; continua NÃO TEM)
| 27 | "Alguns encontros da Victory Road atualizados" | encontro | NÃO TEM | - | as 7 variantes de mapa Victory Road são idênticas em A e B (só 3 mapas mudaram, e por espécies novas); sem baseline anterior à 2.65.3b não dá para ver o que foi atualizado | (revisado: o `er-config` não guarda tabelas de encontro, só clima do randomizer, que não mudou; continua NÃO TEM)
| 28 | Várias habilidades funcionando enquanto desmaiado | correção de código | NÃO TEM | - | comportamento, não texto |
| 29 | Habilidades -ate com 90% de chance de ativar | correção de código | NÃO TEM | - | descrições de Pixilate/Aerilate/Refrigerate/Galvanize iguais em A e B |
| 30 | Madness Enhancement aplicava status inexistente em vez de Enrage | correção de código | NÃO TEM | - | comportamento. Texto mudou em B: "halves damage when enraged" -> "reduces damage taken by 20% when enraged" (commit de 03/05, "novo valor de redução"), não é desta nota |
| 31 | Greedy e Retribution Blow não ativavam como atacante | correção de código | NÃO TEM | - | textos iguais em A e B |
| 32 | Wind Chimes não espalhava golpes de som | correção de código | NÃO TEM | - | texto só reescrito em B |
| 33 | Flower Veil não bloqueava queda própria de status | correção de código | CONFIRMA (só texto) | sim | desc "Protects Grass-type allies from status and stat drops", igual em A e B (commit "Update flower veil description", 24/03). O comportamento em si não é visível |
| 34 | Power Construct em algumas versões de Zygarde | correção de código | NÃO TEM | - | espécies existem; comportamento |
| 35 | Chesnaught Clemont voltando ao Chesnaught normal | correção de código | NÃO TEM | - | formas "Clemont-Chesnaught" e "Chesnaught Battle Bond" existem em A e B; a reversão é lógica |
| 36 | Aurora Borealis não aumentava precisão de Blizzard e Sheer Cold | correção de código | NÃO TEM | - | texto "Moves always benefit from hail" não cita precisão |
| 37 | Crash ao passar o mouse em Fearow Redux/Terrow da beta 1 | correção de código | NÃO TEM | - | interface |
| 38 | Clones de Rain Dish ferindo o dono com Blood Price | correção de código | NÃO TEM | - | comportamento |
| 39 | Pesquisador de fósseis não revivia | correção de código | NÃO TEM | - | script do jogo |
| 40 | Redirecionamento não funcionava em quem tem status não volátil | correção de código | NÃO TEM | - | comportamento |
| 41 | Yuki Onna e Fearmonger não baixavam Special Attack | correção de código | NÃO TEM | - | textos não citam o stat. Yuki Onna foi só reescrito em B ("Intimidate + Scare. 30% ... on contact") |
| 42 | Venomoth e Golbat travados na animação | correção de código | NÃO TEM | - | gráfico |
| 43 | Texto errado de Steelworker, Ursalunite e Raichunite X | texto | NÃO TEM | - | descrição de item não existe no dump. Steelworker (habilidade) está igual em A e B ("Normal moves become Steel. Steel resists Ghost and Dark."); os itens Ursalunite e Raichunite X/Y existem com esses nomes |
| 44 | Troca forçada tirando itens | correção de código | NÃO TEM | - | comportamento |
| 45 | Adoption Center listado por número da Dex | interface | NÃO TEM | - | interface |

### Contagem (45 entradas da 2.65.3b)
- CONFIRMA: **23** (20 de dado + 1 só de texto, a #33 + 2 só no config, #1 e #2)
- CONTRADIZ: **3** (#8 Mega Starmie, #21 Torterra, #24 Throh Redux)
- NÃO TEM: **19** (mystery gifts, encontros da Victory Road e as correções de comportamento/interface)
- Beta 2: 8 entradas genéricas, todas NÃO TEM, fora da contagem.

### O achado principal desta seção
Das 23 confirmações (21 delas no dado, mais 2 só no config), **todas já estavam no dado 2.65beta (A)**. A única entrada em que A e B diferem é a do Mega Starmie (#8). Ou seja: o "2.65beta" do app NÃO é a beta 1 de março; é um corte do desenvolvimento que já continha o conteúdo da 2.65.3b. Prova no `er-config` (os 54 commits entre 14/03 e 28/03 estão listados em docs/pesquisa_2654_config.md 3C):
- 14/03 (commits posteriores ao 7be1617, que é de 13/03 18:41 PDT): nível das evoluções + Duraludonite na loja e no Centro de Adoção (d1b84fe, 2e29630), Clefable/Bellossom (8fe8dcf), descrições de Steelworker (e56fc45) e Ursalunite (20ec2eb), nome de Raichunite X (53a97d5), Chesnaught Clemont (b46993d), dados do Centro de Adoção movidos para a lista de espécies (fcab1b4);
- 20/03: os 8 golpes novos "implementados" (e7996fc Party Favors, 7ac92d5 Prism Blast, c622184 Waterlog/Incite, 08edf09 Spectral Flame, fd28324 Concoction, 4d45b89 Fetch, 18543b2 Teatime);
- 24/03: descrição de Flower Veil.
- O campo `creationDate` do snapshot A é **28/03/2026 17:17 UTC**. O "14/03/2026" do rótulo usado no app/briefing é a data do **commit 7be1617 do `er-config`** (13/03/2026 18:41 PDT = 14/03 01:41 UTC), usado como referência da "2.65beta" na config; não é a data do dado. O dado A já contém os 54 commits do `er-config` de 14/03 a 28/03 (o último é o 6a30b66, 28/03 03:03 -04:00), por isso o ponto de comparação fiel ao dado A na config é 6a30b66 e não 7be1617.
- Consequência: as diferenças A -> B não são "o que mudou da 2.65.3b para a 2.65.4". São 28/03 -> 06/10 de um branch de desenvolvimento (ver seção 4).

Contradições (#21, #24) não explicadas por timing: o tip do `er-config` de 07/10 ainda mantém Arm Thrust na Throh Redux. Ou o changelog está errado, ou a remoção não foi para o branch `upcoming`. Não decidi nem corrigi nada; é pergunta para o usuário/comunidade.

## 3. O inverso: mudanças grandes do dado que o changelog não menciona

Contagens de `docs/pesquisa_versao_2654.md` (A -> B), todas sem nota oficial:
- Espécies: 17 novas (Asudem, Duraludon Mega, Grimer/Muk Redux, Moravine, Phanpy/Donphan Redux, Mastophan, Volbeep, Astrobeep, Illumars, Illuminaut, Rufflet/Braviary Redux, Isoshrew, Isoslash, Noxislash); 1 removida (Arbok Mega); 114 espécies com mudança de status/tipo/habilidade/inata/evolução (45 com status, 97 com habilidade ou inata, 7 com tipo); movepool por nível alterado em 439 espécies, tutor em 308, evolução em 8.
- Habilidades: 29 novas + 5 renomeadas no mesmo id (Absorbant -> Absorbent, Menacing Situation -> Phobia, Apple Pie -> Apple Cake, Frosty Prescence -> Presence, Wings of Pestilence -> Malediction), 164 com descrição alterada (a maioria só reescrita; as mecânicas reais estão na lista abaixo).
- Golpes: 37 alterados (PP de proteções 10 -> 5; Blizzard e Fire Blast 30% -> 20%; ~15 golpes com poder alterado). Pela config: eff/arg sem alteração na NextDex, flags 1 (Ice Ball, Throw Based); 35 mecânicos e 2 só texto (Sky Uppercut, Muddy Water), mais Incite (efeito corrigido) que o dado não mostra (docs/pesquisa_2654_config.md 3A).
- Itens: 2 renomeados (Skarmorite -> X e Y; só rótulo). Pela config: nenhum item mudou de efeito; no Centro de Adoção, Arbokite saiu (27/04) e 3 espécies entraram (Grimer, Phanpy e Rufflet Redux); Duraludite entrou em 14/03 e já estava em A (docs/pesquisa_2654_config.md 3B).
- Encontros: 3 mapas (Isoshrew em Granite Cave 1F e Route 106; Volbeep e Illumars em Mauville).
- Treinadores: 24 chefões/rivais com time normal alterado (May/Brendan de Rustboro e Route 110 trocados quase inteiros; Matt, Drake, Norman, Wally etc.), sem mudar o total de 895.
- Fora do dado, no código do branch `upcoming` (sem nota): sono e paralisia estilo Pokémon Champions ligados (`B_USE_CHAMPIONS_SLEEP` e `B_USE_CHAMPIONS_PARALYSIS` = TRUE em `battle_config.h`), "Fix Normal-type moves ignoring resistances and immunities" (28/05), eviolite e Cursed Body (29/03), Mist (23/04), refator de Battle Skills do Hell, vários ajustes de habilidade (Friend Guard 50% -> 25%, Feathercoat, Scarecrow, King of the Jungle, Pyro Shells, Magus Blades, Best Offense, World Serpent, Madness Enhancement).

## 4. O dado "2.65.4" da NextDex é a 2.65.4.1b?

**Não dá para afirmar.** Evidências:
1. "2.65.4" é um rótulo escolhido pelo autor da NextDex. O README dele diz "last time I used ... -o 2.65.4 -rd"; `static/js/data_version.js` apenas lista "2.65beta" e "2.65.4". Nada liga o rótulo a um release.
2. O dado B é gerado a partir do branch de desenvolvimento, não de uma versão fechada. `creationDate` de B = 07/10/2026 00:09 UTC (06/10 20:09 no fuso -04 dos commits). O `er-config` recebeu depois 3 commits no mesmo dia 07/10 (04:20 "R Kirlia Tidal Rush to Hydration", 04:32 "updated polartic teams", 13:34 "Fixed Morpekyll HP stat"); B ainda mostra Kirlia Redux com Tidal Rush, então B é anterior a esses commits. O dado, portanto, já está atrás do tip do desenvolvimento e nenhum release é identificado por ele.
3. O repositório oficial não marca versões: releases e tags vazios; o texto de versão no código ainda diz "v2.65 Beta2.1"; o site e o link de download ainda dizem 2.65.3b.
4. Parte grande do conteúdo de B entrou em poucos dias antes do corte: 25 a 28/09 e 05/10 (habilidades "tipo" como Bird Type/Ignition, Third-Degree Burn, Engulf; 17 espécies novas em 05/10). Se a 2.65.4.1b saiu antes de 05/10, B contém conteúdo ainda não lançado. A data do anúncio no Discord é a peça que falta.

O que falta para ter certeza:
- A data/hora do anúncio da 2.65.4.1b e as notas dele (para comparar com as 17 espécies, 29 habilidades novas e mudanças de golpe).
- A confirmação do autor da NextDex (ou do mantenedor do jogo) de que o corte de 06/10 é o build lançado.
- Conferência no jogo 2.65.4.1b em pontos de prova: existência de Asudem/Volbeep/Illuminaut, Searchlight, Light Wield, Mega Duraludon, Arbok Mega ausente, Protect com 5 PP, Blizzard 20%, Kirlia Redux com Tidal Rush ou Hydration (este último distingue o corte de 06/10 do tip de 07/10).
- Se existir, o commit/tag do build lançado no `eliteredux-source`.

## 5. Não verificado (e por quê)
- Notas e data do anúncio da 2.65.4.1b: sem acesso ao Discord nesta sessão.
- Qualquer item "NÃO TEM" de comportamento (correções de código): o dado NextDex traz só texto/estrutura, não a lógica; a verificação exigiria o código fonte do release.
- Adoption Center, mystery gifts, loja: fora do dump NextDex.
- Data "14/03/2026": resolvida, é a data do commit 7be1617 do `er-config` (referência da "2.65beta" na config); o dado A é de 28/03/2026 17:17 UTC.
- O clone do `eliteredux-source` é parcial (sem blobs antigos); por isso as buscas por histórico de linha (`git log -S`) não foram feitas.

Memória/decisão registrada em `docs/decisoes_mecanicas.md`: nenhuma alteração (somente leitura).
