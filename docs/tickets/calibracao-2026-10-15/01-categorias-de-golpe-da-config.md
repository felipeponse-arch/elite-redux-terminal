# 01 — Categorias de golpe vindas da config do jogo

Status: resolvido (no master: 470d17f a 3e000e5, merge cf65535; marcado em 21/10)
Tamanho: G
Bloqueado por: nenhum
Divergências: A7, N3 (detalhe em `docs/calibracao/divergencias.json`)
Autorização: regra do usuário de 15/10/2026 (o código do jogo manda). Registrar em `docs/decisoes_mecanicas.md`.

## O que entrega
- Trocar a origem de `data/move_categorias.json` (campos `c`: soco, mordida, corte, chifre, pulso, flecha, martelo, chute) da leitura do **texto** da NextDex para as **flags** do `MoveList.textproto` da `er-config`: `iron_fist`, `strong_jaw`, `keen_edge`, `horn`, `mega_launcher`, `arrow`, `hammer`, `striker`.
- Acrescentar o que o motor não tem: `throwing` (23 golpes), `light` (25), `lunar` (7), `drill` (5) e a flag `air` do Fly.
- Hoje faltam 98 golpes (martelo 31, pulso 27, corte 14, soco 9, mordida 6, flecha 5, chifre 4, chute 3) e sobra o Molten Strike em soco. Lista em `docs/calibracao/dados/categorias_de_golpe_faltando.json`.
- Script gerador novo, com teste de completude contra a `MoveList` (como o `gerar_mega_forms.mjs`).
- Habilidades de arremesso (Rocky Payload, Devious Present) passam a reforçar os golpes `throwing`.

## Fonte (código do jogo)
`abilities.cc:331-357` (`DoesMoveMatchFlag` lê as flags do golpe) e `abilities.cc` (Keen Edge, Strong Jaw, Iron Fist, Mega Launcher, Mighty Horn, Archer, Super Slammer usam `FLAG_*_BOOST` e `hornBased`, `arrowBased`, `hammerBased`, `throwingBased`). Config: `er-config` `MoveList.textproto` em `6a30b66` (bate com o dado do app) e `d1a9a4c` (atual).

## Critérios de aceite
- [x] Medido: Strong Jaw + Crunch, Keen Edge + Stone Edge e Karate Chop, Iron Fist + Brick Break, Super Slammer + Wood Hammer e Gigaton Hammer, Mega Launcher + Sludge Bomb, Striker + Pyro Ball passam de x1,000 para x1,3.
- [x] Teste de completude: toda flag da config aparece no `move_categorias.json`.
- [x] Sabotagem: tirar uma flag do gerador derruba o teste.
- [x] Rank NÃO recalculado aqui (ticket 08).


## Atenção
Na versão atual a habilidade `Keen Edge` chama-se `Sharpness`; a flag do golpe continua `keen_edge`. Ligar pelo golpe, nunca pelo nome da habilidade.

## O que mudou (15/10/2026, branch `calibracao-01`)
- `scripts/categorias_pela_config.mjs` (novo): lê o `MoveList.textproto` da er-config, traduz as flags em categorias (`FLAG_PARA_CATEGORIA`) e grava `data/golpes_flags_config.json` (325 golpes com flag; er-config `d1a9a4c`, as 8 categorias antigas idênticas em `6a30b66`).
- `scripts/extrair_categorias_golpes.mjs`: o campo `c` passa a vir dessas flags; chance, recuo, dreno, alvo e status continuam do NextDex. Rodado de novo com `data/gameData_265beta.json`: só o `c` de 145 golpes mudou (129 ganharam categoria; nenhum outro campo mudou).
- `data/move_categorias.json`: 196 para 325 golpes com categoria (soco 36, corte 51, chute 20, chifre 22, mordida 28, pulso 87, martelo 32, flecha 19, arremesso 23, luz 20, lunar 7, broca 5).
- `src/regras/duelo.js`: `PALAVRAS_DE_CATEGORIA` ganha `arremesso` (`/throw/`), então o texto "Rock-type and throwing moves" da Rocky Payload vira `bonusCategoria.arremesso = 1,5`. A tabela antiga de sinergia por golpe já cobria os golpes que as 6 espécies dela aprendem, então o dano delas não mudou.
- Efeito colateral real, no pipeline de build: o **Seismic Fist** (Ground, poder 85) é soco pela flag; com Iron Fist e Raging Boxer vira o melhor golpe do Ledian contra o Ninetales da Meteor Falls (138% a 162%, KO garantido; antes o Mega Punch, 99% a 117%) e a build fica "estimada" (a calculadora só conferiu Mega Punch e Aerial Ace). Três testes de `pipeline_build.test.mjs` foram reescritos para o novo melhor golpe; o teste dos casos conferidos agora chama `pipelineCasoConferido` direto.
- `docs/decisoes_mecanicas.md`: nova linha de 15/10/2026.
- Rebase sobre o master `0765bec`: o teste novo `efeitos_pela_interface.test.mjs` ("Low Kick pelo peso do alvo") media o Brick Break sem categoria; com a flag `iron_fist` ele é soco e o Machamp (Iron Fist de innate) o leva a 85 x 1,3 = 110,5 de poder. A razão de turnos contra o Shuckle passou de 1,6-2,1 para 2,2-3,0 (2,75 medido) e a comparação do Ferrothorn usa o Karate Chop (90, sem bônus) no lugar do Brick Break.

## Números
- Testes: `tests/unit/categorias_de_golpe_da_config.test.mjs`, 14 testes com chefões e espécies reais (Sharpedo de Archie, Machamp de Brawly 4, Tinkaton de Calvin E4, Garchomp Redux de Archie, Decidueye do Monochamp Ghost, Terrakion de Roxanne 3, Blastoise de Matt, Throh Redux). Provado: com o `move_categorias.json` antigo, 10 dos 14 falham. Suíte inteira: 752 testes, 751 passam, 1 `todo` (Insect Impact, já existente).
- Sabotagens novas: 6 (`categorias-flag-martelo-fora`, `-flag-strong-jaw-vira-corte`, `-flag-arremesso-fora`, `-parser-le-flag-de-bloco-aninhado`, `-dado-crunch-sem-mordida`, `-arremesso-sem-palavra-no-texto`), as 6 pegas.
- `npm run check`: tudo OK, exceto **um erro de lint que já está no master** e não é desta mudança: `src/regras/pipeline_build.js:67` (`no-useless-assignment`, `var boss = null` do commit `d8cb6dd`). Não mexi nele.

## O que ficou de fora
- **Rank não recalculado** (ticket 08): as categorias novas mudam o rank de muitas espécies (221 têm a habilidade e algum desses golpes).
- **Flag `air` do Fly** (e Giant Wings): é do dex_compact, ticket 03.
- **Devious Present** ("Ice and throwing moves by 50%"): o texto usa porcentagem, outro padrão; ticket 03 (B3).
- **luz, lunar e broca** ficam gravadas, mas nenhuma habilidade do dado 2.65beta as lê (Photokinesis e parecidas só existem na versão atual; Lunar Affinity e Mega Drill não têm texto casado).
- Versão atual do jogo: 9 golpes novos e a flag `light` em 25 golpes entram no ticket 08.
- Dado do app continua 2.65beta; a config usada é a mais nova, mas as 8 categorias que o motor lê são idênticas às de `6a30b66`.

## Comentários
- Origem: varredura de calibração de 14 e 15/10/2026 (`docs/calibracao/`). Sem comentários ainda.
