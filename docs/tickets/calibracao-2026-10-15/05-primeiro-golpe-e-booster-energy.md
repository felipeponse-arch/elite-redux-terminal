# 05 — Primeiro golpe com HP cheio e Booster Energy

Status: resolvido (no master: 470d17f a 3e000e5, merge cf65535; marcado em 21/10)
Tamanho: M
Bloqueado por: 03
Divergências: A5, A6 (detalhe em `docs/calibracao/divergencias.json`)
Autorização: regra do usuário de 15/10/2026 (o código do jogo manda). Registrar em `docs/decisoes_mecanicas.md`.

## O que entrega
- **A6 Multiscale e Brain Mass**: o x0,5 vale só para o **1º golpe com HP cheio**; depois x1,0. Hoje `duelo.js:305,1407` usa x0,75 fixo. Reusar o mecanismo `primeiroGolpeRecebido` (Chuckster). Efeito no rótulo "mata no turno 1" do pipeline de build: o 1º golpe contra um Multiscale vale metade.
- **A5 Booster Energy**: com Protosynthesis ou Quark Drive, o maior atributo sobe x1,3 (Speed x1,5), no foe e na build. Hoje só o sol arma (`duelo.js:1656`); o item só é lido na validação de build. O item é consumido.

## Fonte (código do jogo)
`abilities.cc:1947` (Multiscale), `11518` (Brain Mass), `6917-6957` (`ProtosynthesisHandler`) e `6962-6970` (x1,5 em Speed, x1,3 nos outros). Config: `AbilityList` `expanded_description` de Protosynthesis ("When sun ends, Booster Energy activates if held").

## Critérios de aceite
- [x] Steven (Slither Wing) e Crobatite Dewford Manor (Flutter Mane) lutam com o x1,3.
- [x] Multiscale: o 1º golpe do duelo vale x0,5; o 2º x1,0.
- [x] Rótulo "mata no turno 1" revisto contra alvo com Multiscale.


## O que mudou (15/10/2026, branch `calibracao-05`)
- **A6** `src/regras/duelo.js`: Multiscale, Shadow Shield e Brain Mass leem `ef.golpeCheio = 0,5` em vez de `reducao.todos *= 0,75`. O corte do 1º golpe passou a entrar no dano por turno (`danoComStatusNoDuelo`, junto com o da Chuckster): em n turnos o dano médio vale (0,5 + n-1)/n. O Mold Breaker do atacante atravessa. A Chuckster, que antes só valia na corrida com plano de status, passa a valer em toda luta (o ramo sem plano ignorava o corte).
- **A6** `src/regras/pipeline_build.js`: a linha de cada golpe conta os golpes com o 1º pela metade (`golpesNecessariosComPrimeiroDuelo`, novo em `duelo.js`), o "garantido" também, e o motivo ganha "O 1º golpe contra o X vale metade (HP cheio: Multiscale e parecidas)".
- **A5** `src/regras/duelo.js`: `ef.paradoxoItem` (texto "or with Booster Energy" de Protosynthesis e Quark Drive) + `it.boosterEnergy`; `maiorAtributoDuelo(u)` devolve o maior atributo pela regra do jogo (primeiro estritamente maior na ordem Atk, Def, Speed, SpA, SpD) e o multiplicador (x1,3; Speed x1,5), pelo clima ou pelo item (sem Klutz). Ataque, defesa e Velocidade usam o helper. O Protosynthesis no sol ganha também a Speed x1,5.
- `docs/decisoes_mecanicas.md`: nova linha de 15/10/2026.

## Números
- Teste novo: `tests/unit/primeiro_golpe_e_booster_energy.test.mjs`, 15 testes com chefões reais: Slither Wing (Steven) x1,296 e Flutter Mane (Crobatite Dewford Manor) x1,297 no melhor golpe, os Iron do Monochamp com Speed x1,5 (Valiant, Boulder, Crown, Heart, Bundle) e Iron Exo x1,297, Scream Tail (Blunder) levando 1/1,3 de golpe especial; Multiscale em 6 turnos: dano causado x0,917.
- Sabotagens novas: 16 (`primeiro-golpe-*`, `booster-energy-*`), as 16 pegas; conferi que o trecho de cada uma existe uma vez só no arquivo.
- 9 Pokémon de chefão seguram o Booster Energy (o ticket falava em 9). Multiscale 20 e Shadow Shield 22 Pokémon de chefão; Brain Mass nenhum.
- Pipeline de build, medido com Garchomp, Charizard e Gengar contra os 42 alvos com Multiscale ou Shadow Shield: em **28 de 126** melhores candidatos o rótulo passa de "derruba em 1 golpe" para "2 golpes" (Machamp Redux de Matt, Tapu Lele, Aegislash, Dusknoir, Cofagrigus, Calyrex Shadow Rider...). O dano por golpe mostrado sobe 33% (o x0,75 saiu e o corte virou "só o 1º golpe", explicado no motivo).
- Suíte inteira: 851 testes, 850 passam, 1 `todo` (Insect Impact, já existente). `npm run check`: tudo OK, exceto o erro de lint de `pipeline_build.js:67`, que já está no master (ticket 01).

## O que ficou de fora
- **Rank não recalculado** (ticket 08).
- Terreno elétrico do Quark Drive: o texto "in Electric Terrain" não está ligado (o ticket pedia só o Booster Energy); o motor só arma o Protosynthesis pelo sol.
- A reativação do Multiscale quando o HP volta ao máximo (cura) não existe: o motor trata o 1º golpe da luta.
- O Booster Energy fixa o maior atributo na entrada; o motor o calcula pelos atributos base da luta (sem estágios), como já fazia com o sol.
- A Chuckster passou a cortar o 1º golpe em toda luta (antes só na corrida com plano de status). Isso mexe no dano que quem enfrenta uma Chuckster causa; a Chuckster não tem teste próprio de luta além do cruzamento com a Multiscale.

## Comentários
- Origem: varredura de calibração de 14 e 15/10/2026 (`docs/calibracao/`). Sem comentários ainda.
