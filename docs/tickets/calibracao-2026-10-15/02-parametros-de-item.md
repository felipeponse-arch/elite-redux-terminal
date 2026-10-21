# 02 — Parâmetros de item pelo código do jogo

Status: resolvido (no master: 470d17f a 3e000e5, merge cf65535; marcado em 21/10)
Tamanho: M
Bloqueado por: nenhum
Divergências: A8, N5 (detalhe em `docs/calibracao/divergencias.json`)
Autorização: regra do usuário de 15/10/2026 (o código do jogo manda). Registrar em `docs/decisoes_mecanicas.md`.

## O que entrega
- Itens de tipo (Charcoal, Mystic Water, Dragon Fang, Black Glasses, Miracle Seed...) e Plates: **x1,3** (hoje x1,2, `duelo.js:721`).
- Muscle Band e Wise Glasses: **x1,15** (hoje x1,1, `duelo.js:713-714`).
- Gems: **x1,5** uma vez (hoje x1,3, `duelo.js:2075`).
- Soul Dew: x1,5 no golpe especial de Latias/Latios.
- Wide Lens: +12% de precisão (hoje 10%). Quick Claw: 20% de agir primeiro.
- Utility Umbrella: sol e chuva sem efeito no portador (sem bônus de Fire/Water, sem corte).
- Ler o valor do `hold_effect_strength` da `er-config` (`items/*.textproto`) em vez de números soltos no `itemDoDuelo`.
- Já corretos, não mexer: Life Orb x1,3, Expert Belt x1,2, Choice Band/Specs x1,5, Choice Scarf, Assault Vest e Tactical Vest x1,5, Eviolite x1,5, Leftovers 1/16, Punching Glove x1,1.

## Fonte (código do jogo)
`battle_util.c:7005-7034` (`holdEffectModifier = 1 + strength/100`, itens de tipo, Plates, Muscle Band, Wise Glasses, Soul Dew, Gems), `battle_util.c:8674-8683` (Utility Umbrella), `battle_main.c:4419` (Quick Claw), `tools/codegen/src/er/item/ItemGenerator.kt:51` (`holdEffectParam = holdEffectStrength`). Config: `er-config` `items/BattleList.textproto` e `ItemsList.textproto`. Adamant Orb não existe na config nem em `src/`: não tem efeito (o motor já está certo).

## Critérios de aceite
- [x] Medido: Charcoal, Mystic Water, Black Glasses, Spooky Plate = x1,3; Muscle Band e Wise Glasses = x1,15; Fire Gem = x1,5.
- [x] Teste com sabotagem para cada família (tipo, Muscle/Wise, Gem).
- [x] 43 Pokémon de chefão passam a lutar com os valores certos.


## O que mudou (15/10/2026, branch `calibracao-02`)
- `scripts/itens_pela_config.mjs` (novo) lê `items/*.textproto` da er-config e grava `data/itens_config.json` (212 itens com efeito de batalha; er-config `d1a9a4c`, idêntica em `6a30b66`, a da época do dado 2.65beta): `e` = efeito do jogo (para `HOLD_EFFECT_CUSTOM` vale o nome do item, como o `ItemGenerator.kt:38-45` gera o enum), `f` = `hold_effect_strength`, `t` = `hold_effect_type`. Ligado no `build.mjs`, no `artifact_template.html` (`ITENS_CONFIG`), em `types/app-globais.d.ts` e no `carregar_regras.mjs`.
- `src/regras/duelo.js` (`itemDoDuelo`): modificador = `1 + força/100`, lido da config. Item de tipo e Plate x1,3 (era 1,2); Muscle Band e Wise Glasses x1,15 (era 1,1); gema x1,5 uma vez (era 1,3); Wide Lens +12% de precisão (era 10%). O tipo do item de tipo e da gema vem do `hold_effect_type` da config, não mais do texto (o texto só vale para item que a config não traz).
- **Soul Dew** (novo): Latias e Latios (e megas) levam x1,5 no golpe especial e na Sp. Def (`battle_util.c:7020-7026` e `7455-7461`; a segunda parte vale porque `B_SOUL_DEW_BOOST = GEN_3`; o ticket só citava o ataque).
- **Quick Claw** (novo): 20% de o mais lento agir primeiro, no mesmo mecanismo do Quick Draw (`comSaque`); os dois sorteios são independentes no jogo (`battle_main.c:4413-4420`), então a chance combinada é `1 - (1-q)(1-c)` (30% + 20% = 44%, não 50%). Klutz, Frisk e roubo reduzem pelo `itemAtivoDuelo`.
- **Utility Umbrella** (novo): sol e chuva não reforçam nem cortam o dano do portador (Fire/Water, `battle_util.c:7589-7637`); Klutz desliga o item. A carga do Solar Beam segue valendo, porque no jogo ela lê `IsWeatherActive`, não o guarda-chuva (`battle_script_commands.c:2628`).
- Deixados como estão: Life Orb 1,3, Expert Belt 1,2 (**armadilha**: a config diz `hold_effect_strength: 30`, mas `battle_util.c:7674-7676` usa `UQ_4_12(1.2)` fixo; o teste fixa os dois), Choice Band/Specs/Scarf, Assault Vest, Tactical Vest e Eviolite 1,5, Leftovers 1/16, Punching Glove 1,1.
- `docs/decisoes_mecanicas.md`: nova linha de 15/10/2026. `tests/unit/itens_no_duelo.test.mjs`: o teste do Charcoal passou de "entre 1,15 e 1,2" para "entre 1,25 e 1,3".

## Números
- Teste novo: `tests/unit/itens_da_config.test.mjs`, 20 testes com chefões reais: Torkoal de Flannery 4 (Charcoal), Phione de Archie (Mystic Water), Sagaracas de Tabitha (Miracle Seed), Mawile de Steven (Muscle Band), Blastoise de Matt (Wise Glasses), Ninetales de Courtney (Fire Gem), Latios do Monochamp Dragon (Soul Dew), Rotom Heat de Shelly (Utility Umbrella). Razão do dano com/sem o item, medida no motor: tipo 1,297, Muscle Band e Wise Glasses 1,148, Soul Dew 1,494 no ataque, gema 1,458 no 1º turno de um duelo, guarda-chuva no sol 0,670 (= 1/1,5). Esses números ficam um pouco abaixo do multiplicador (1,3 / 1,15 / 1,5) porque a fórmula de dano soma +2 no fim.
- Sabotagens novas: 20 (`itens-*`: tipo, Muscle Band, Wise Glasses, gema (2), Soul Dew (2), Wide Lens, Quick Claw (2), Utility Umbrella (3), gerador (3), dado (4)). Resultado da rodada no fim desta seção.
- 47 Pokémon de chefão passam a lutar com valores novos: Muscle Band 10, Gems 18, item de tipo 8, Wide Lens 4, Wise Glasses 2, Plates 2, Utility Umbrella 2, Soul Dew 1 (os 43 do ticket mais 2 Plates e 2 Utility Umbrella).
- Suíte inteira: 772 testes, 771 passam, 1 `todo` (Insect Impact, já existente). `npm run check`: tudo OK, exceto o erro de lint de `pipeline_build.js:67`, que já está no master (ticket 01).

## O que ficou de fora
- **Rank não recalculado** (ticket 08).
- Achados novos, não corrigidos (não eram do ticket): **Shell Bell** cura `dano/4` no jogo (`battle_util.c:6093-6107`) e o motor usa 1/8 (a config traz `hold_effect_strength: 2`, número que o código não lê); **Bright Powder/Lax Incense** cortam a precisão do atacante em `(100-10)/100 = 0,9` e o motor usa 1/1,1 = 0,909; **Zoom Lens** (+20% de precisão se o portador age depois) não existe no motor; **Big Root** é +50% no jogo (`battle_util.c:2373`) e o motor usa 1,3. Sugestão: um ticket "itens que o motor ainda não lê" depois do 08.
- Utility Umbrella do **alvo** no Thunder/Hurricane sob chuva e no Weather Ball: o jogo lê o guarda-chuva de quem leva o golpe (`battle_script_commands.c:1296`); o motor só tem o clima de quem ataca. Não mexi: dois chefões o seguram e nenhum deles é alvo desse caso.
- A fração "item ativo" (Frisk, Pickpocket, Knock Off, que dão 50%) não se aplica ao guarda-chuva: ele vale por inteiro, exceto com Klutz.
- As builds do app (`data/builds.json`) seguram Gem em 5 sets, Wide Lens em 6 e Wise Glasses em 1; o dano delas muda pelos novos números. O pipeline de build não foi reconferido contra a calculadora do jogo neste ticket.

## Comentários
- Origem: varredura de calibração de 14 e 15/10/2026 (`docs/calibracao/`). Sem comentários ainda.
