# 03 — Multiplicadores de habilidade que o texto não ensina ao motor

Status: resolvido (no master: 470d17f a 3e000e5, merge cf65535; marcado em 21/10)
Tamanho: M
Bloqueado por: 02
Divergências: A1, A2, A3, M1, M5, M6, N1, N2, B2, B3, B5 (detalhe em `docs/calibracao/divergencias.json`)
Autorização: regra do usuário de 15/10/2026 (o código do jogo manda). Registrar em `docs/decisoes_mecanicas.md`.

## O que entrega
Corrigir no `efeitoDasHabilidadesNoDuelo` (ou, melhor, numa tabela explícita por habilidade, ver ticket 08):
- **A1 Magma Armor**: x0,7 só em Water e Ice. Hoje o regex de `duelo.js:1276` põe x0,7 em tudo e a tabela de tipos aplica de novo.
- **A2 Tough Claws, Big Pecks**: golpe de contato x1,3 (Long Reach e Punching Glove tiram o contato).
- **A3 Giant Wings**: golpes com a flag `air` x1,3.
- **M1 Steely Spirit, Airborne**: Steel / Flying x1,3, do dono e do aliado.
- **M5 Punk Rock**: som recebido x0,5. **M6 Water Bubble**: Water do dono x2.
- **N1 Nosferatu**: só a cura de 1/2 do dano; **remover o +20%** (`duelo.js:437`).
- **N2 Thick Blubber**: Speed x0,5. **B2 Hyper Cleanse**: Poison recebido x0,5.
- **B3**: Warmonger (Rock/Steel/Fighting x1,3), Hammer Fist (soco ou martelo x1,25), Plasma Lamp (Fire/Electric x1,2), Deep Freeze (Water/Ice x1,25), Devious Present (Ice ou arremesso x1,5).
- **B5**: Atomic Fire recuo 33% (effect do dado); Double Shock 2 acertos.

## Fonte (código do jogo)
`abilities.cc`: Magma Armor 990-994, Big Pecks 2089 e Tough Claws 2438-2440, Giant Wings 4661-4666, Steely Spirit 3435, Airborne 6861, Punk Rock 3279-3289, Water Bubble 2706-2718, Thick Blubber, Hyper Cleanse 10319-10323, Warmonger 10787, Hammer Fist 11551, Plasma Lamp 6072, Deep Freeze 9361, Devious Present 11439; Nosferatu `battle_util.c:4748-4756`. Config: `MoveList` (hit_count, effect).

## Critérios de aceite
- [x] Para cada habilidade: medição com e sem a habilidade (isolada das innates) bate com o número do código (tolerância 2%).
- [x] Teste de unidade com sabotagem para cada uma.
- [x] Nosferatu: contato não ganha mais x1,2; a cura 1/2 continua.


## O que mudou (15/10/2026, branch `calibracao-03`)
Tudo em `src/regras/duelo.js` (leitura do texto), `src/regras/tipos.js` (Hyper Cleanse) e no dado; a regra e as linhas do código do jogo estão em `docs/decisoes_mecanicas.md` (linha de 15/10 "Multiplicadores de habilidade pelo código do jogo").
- **A1 Magma Armor**: o texto "Takes 30% less dmg from Water/Ice-type moves" deixa de cair no padrão "Takes N% less" (cortava tudo); sobra só a tabela de tipos. Medido: Water/Ice x0,70 (antes 0,49), Normal/Fire x1,0 (antes 0,7).
- **A2 Tough Claws, Big Pecks**: `Boosts the power of contact moves by 1.3x` -> `contatoMult`. Long Reach (`ef.semContato`, novo), Protective Pads e Punching Glove num soco tiram o contato do bônus. Apex Predator, Lead Claws, Ice Picks, Bird of Prey e Reaper's Embarce herdam.
- **A3 Giant Wings**: o texto "wing, wind or air-based moves by 1.3x" -> flag `Air/Wing Based` x1,3 (Lucky Wings, Imposing Wings herdam). O Aerial Ace NÃO tem a flag `air` na config (35 golpes no dado 2.65beta, 36 hoje, mesmo conjunto do app): fica em x1,0, ao contrário do que a varredura esperava.
- **M1 Steely Spirit, Airborne**: `Boosts own & ally's Steel-type moves by 1.3x` -> `bonusTipo` do dono. A parte do aliado (dupla) fica de fora.
- **M5 Punk Rock** som recebido x0,5 (`ef.reducao.som`). **M6 Water Bubble** Water x2 (Flame Bubble herda). **N2 Thick Blubber** Speed x0,5. **B2 Hyper Cleanse** Poison x0,5 (tabela de tipos).
- **N1 Nosferatu**: sem o +20% de contato; a cura de metade do dano fica.
- **B3** Warmonger (Rock/Steel/Fighting x1,3), Hammer Fist (soco e martelo x1,25), Plasma Lamp (Fire/Electric x1,2), Deep Freeze (Water/Ice x1,25), Devious Present (Ice e arremesso x1,5): um leitor de lista de tipos e categorias ("rock, steel, and fighting", "punch and hammer", "Water and Ice", "Fire & Electric type", "Ice and throwing").
- **B5**: Atomic Fire recuo 33% e Double Shock 2 acertos. `scripts/categorias_pela_config.mjs` passa a gravar também `recuos` (EFFECT_RECOIL_25/33/50: 15 golpes) e `acertos` (hit_count > 1: 6 golpes) em `data/golpes_flags_config.json`; `extrair_categorias_golpes.mjs` usa o recuo do jogo; só o `rc` do Atomic Fire mudou em `move_categorias.json` (50 -> 33). O Double Shock entra na tabela de acertos do motor.
- **Sinergia por golpe**: para as 15 habilidades acima ela não soma mais (senão Tough Claws no Charizard dava x1,69); ver `03-perguntas.md` sobre o resto.

## Números
- Testes: `tests/unit/multiplicadores_do_codigo_do_jogo.test.mjs` (54 testes, 46 deles razões com/sem a habilidade, isoladas das innates, tolerância de 2%) e mais 2 testes no `categorias_de_golpe_da_config.test.mjs`. Suíte inteira: 828 testes, 827 passam, 1 `todo` (Insect Impact, já existente).
- Sabotagens novas: 23 (`habilidades-*`), as 23 pegas por teste que falha de verdade (conferi que o trecho de cada uma existe uma vez só no arquivo).
- 11 dos 690 Pokémon de chefão mudam o melhor golpe em mais de 0,5%: Araquanid +98% (Water Bubble), Braviary de Norman 5 +56%, Dodrio +30% (Big Pecks), Aerodactyl x2, Charizard e Talonflame ~+20% (ver abaixo), Crobat e Scream Tail -16% (Nosferatu sem o +20%), Talonflame de Norman 1 -8% (Protective Pads tira o contato). A varredura falava em 21 chefões com Tough Claws/Big Pecks "sem efeito" e 14 com Giant Wings: parte deles já recebia o bônus pela sinergia por golpe da espécie, que a medição isolada da varredura (Garchomp contra Magikarp) não via.
- `npm run check`: tudo OK, exceto o erro de lint de `pipeline_build.js:67`, que já está no master (ticket 01). Um teste teve a premissa ajustada: `pipeline_build` "hit-kill de 2 golpes" não exige mais candidato de 2 golpes para Pidgeotto e Pidgeot (a Giant Wings deles passou a valer e os sets mais fortes viraram hit-kill de 1).

## Atenção
- Cinco Pokémon de chefão (Aerodactyl x2, Charizard, Talonflame e o Braviary de Norman 5) ficam ~20% ACIMA do código do jogo, porque a Giant Wings/Big Pecks nova deixa de "esconder" uma dupla contagem antiga de outra habilidade deles (Flock, Blaze...). A correção está em `03-perguntas.md` (pergunta 1); decisão sua.

## O que ficou de fora
- **Rank não recalculado** (ticket 08).
- A dupla contagem geral da sinergia por golpe (`03-perguntas.md`, 1), a precisão x1,2 da Plasma Lamp (2), o contato de Long Reach nas reações do alvo (3) e a parte do aliado de Steely Spirit/Airborne (dupla).
- Hammer Fist: a flag `punch` do jogo (`DoesMoveMatchFlag(... MOVE_FLAG_PUNCH)`) é a categoria soco do ticket 01; já está coberta.

## Comentários
- Origem: varredura de calibração de 14 e 15/10/2026 (`docs/calibracao/`). Sem comentários ainda.
