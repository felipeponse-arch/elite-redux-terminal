# 03 — Perguntas para o Felipe (e para a Construção)

Status: pergunta 1 RESPONDIDA em 15/10/2026 (Felipe: aplicar; feito no ticket `docs/tickets/versao-nova/01-dupla-contagem.md`). As perguntas 2 e 3 seguem abertas. Nada aqui foi decidido nem mexido além disso; é o que o ticket 03 achou no caminho.

## 1. A sinergia por golpe da espécie soma por cima do texto em ~50 habilidades além das 15 do ticket (dupla contagem que já existia)

**O que acontece hoje (medido, motor da `calibracao-02`).** O `efeitoDasHabilidadesNoDuelo` lê o texto da habilidade (`bonusTipo`, `bonusCategoria`, `flagMult`) e, DEPOIS, soma a "sinergia por golpe" da espécie (`species_ability_synergy.json` -> `bonusGolpes`: a aproximação antiga, que pega o primeiro "Nx" do texto e aplica nos golpes marcados). Para a mesma habilidade e o mesmo golpe, os dois valem, e o motor multiplica (`duelo.js`, `hab *= bonusTipo[tipo]` e `hab *= max(porCategoria, bonusGolpes[golpe])`):

| Habilidade | Espécie / golpe | Código do jogo | Motor hoje |
|---|---|---|---|
| Nocturnal (Dark x1,25) | Zubat / Feint Attack | x1,25 | **x1,54** |
| Levitate (Flying x1,25) | Butterfree / Gust | x1,25 | **x1,55** |
| Electrocytes (Electric x1,25) | Pikachu / Electro Ball | x1,25 | **x1,55** |
| Overgrow, Blaze, Torrent, Swarm, Flock (x1,2 fixo) | espécies da sinergia | x1,2 | 1,2 x 1,2 = **x1,44** |

As habilidades que têm texto lido E entrada de sinergia (medido pela diferença de `bonusGolpes` entre o motor com e sem a regra geral; as 15 do ticket não entram aqui) são, além das quatro da tabela: Overgrow, Blaze, Torrent, Swarm, Levitate, Flock, Electrocytes, Short Circuit, Earthbound, Mighty Horn, Mega Launcher, Fairy Aura, Vengeance, Nocturnal, Psychic Mind, Fighter, Striker, Rockhard Will, Fossilized, Dragon's Maw, Raw Wood, Transistor, Aerialist, Combat Specialist, Dark Aura, Forest Rage, Combustion, Archer, Super Slammer, Pixie Power, Rocky Payload, Vengeful Spirit, Hellblaze, Gladiator, Dune Terror, Riptide, Master Hand, Warrior's Spear, Purgatory, Iron Barrage, Venom Crown, Smoldering Wood, Unicorn, Twinkle Toes, Samba, Aquatic Dweller, Atlantic Ruler, Gnashing Cannon, Overwhelming Mind, 3 > 1, We Will Rock You.

**O que o ticket 03 fez:** só as 15 habilidades que ele mesmo passou a ler do texto (Tough Claws, Big Pecks, Giant Wings, Steely Spirit, Airborne, Warmonger, Deep Freeze, Devious Present, Imposing Wings, Lucky Wings, Apex Predator, Lead Claws, Ice Picks, Bird of Prey, Reaper's Embarce) deixam de receber a sinergia (lista `BONUS_DE_GOLPE_LIDO_DO_TEXTO_DUELO` em `duelo.js`), para não contar x1,3 duas vezes.

**Efeito colateral dessa escolha (seja honesto com o número):** nas espécies que combinam uma dessas 15 com uma das ~50 acima, o motor antes pegava o MAIOR entre as sinergias (`bonusGolpes` é um máximo entre habilidades) e agora multiplica a nova leitura pelo valor duplicado da outra. Cinco Pokémon de chefão ficam ~20% ACIMA do que o código dá: Aerodactyl (Roxanne 2, Monochamp Rock), Charizard (Courtney Meteor Falls), Talonflame (Tabitha Mt Chimney) e o Braviary de Norman 5 (+56%, onde o certo seria +30%).

**A correção geral (já testada num rascunho, NÃO aplicada):** em vez da lista, pular a sinergia de qualquer habilidade cujo texto já deu `bonusTipo`/`bonusCategoria`/`flagMult`/`contatoMult` (3 linhas em `duelo.js`: uma função `bonusDeGolpeLidoDoTextoDuelo(ef)` e o `return` no laço de `ABILITY_SYNERGY`). Resultado medido: 82 Pokémon de chefão a mais mudam o melhor golpe em mais de 0,5%, **para baixo**, de x0,86 a x0,50 (Reshiram do Drake 4: x0,50; Zekrom e Xurkitree: x0,67; Yveltal e Darkrai: x0,75; Charizard, Talonflame, Aerodactyl: x0,83). Dois testes dependem do número inflado e precisariam ser reescritos: `duelo_pela_interface` "Occa Berry aguenta um turno a mais" (Charizard com Blaze) e "clima defensivo... sem névoa o Alakazam vence o Espeon".

**Pergunta:** aplico a correção geral (num ticket próprio, antes do 08, porque ela mexe no rank), ou mantemos a lista e deixamos o resto como está? Recomendação: aplicar, porque o código do jogo multiplica UMA vez; mas é uma mudança de ~80 chefões e vale você ver os testes novos antes.

## 2. Plasma Lamp: a precisão x1,2

O código (`abilities.cc:6070-6081`) tem também `onAccuracy`: golpes Fire/Electric com precisão x1,2. O ticket só pedia o dano; a precisão por tipo não existe no motor (`ef.precisaoMult` é global). Precisa de um campo novo por tipo; fica para quando alguém quiser. Quem usa: 1 espécie.

## 3. Long Reach e Punching Glove: o contato some só do bônus, não da reação do alvo

O jogo usa `IsMoveMakingContact` para tudo (Rough Skin, Rocky Helmet, Static, Gooey...). Neste ticket os três tiram o contato SÓ do bônus de poder (Tough Claws/Big Pecks), porque era o que o ticket pedia. O `g.contato` do golpe pronto segue `true` para quem tem Long Reach, e as reações do alvo (Rough Skin etc.) continuam disparando. Corrigir isso mexe em todo efeito de contato do motor. Pergunta: vale um ticket?
