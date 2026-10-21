# 04 — Flash Fire e Dry Skin absorvem o golpe

Status: resolvido (no master: 470d17f a 3e000e5, merge cf65535; marcado em 21/10)
Tamanho: P
Bloqueado por: 03
Divergências: A4, M2 (detalhe em `docs/calibracao/divergencias.json`)
Autorização: regra do usuário de 15/10/2026 (o código do jogo manda). Registrar em `docs/decisoes_mecanicas.md`.

## O que entrega
- **Flash Fire**: imune a Fire (entrada em `tipos.js`, hoje fora por causa do comentário da linha 126). Depois da absorção, os golpes Fire do dono valem x1,5 até sair; o bônus não acumula.
- **Dry Skin**: imune a Water, cura 25% (como Water Absorb). Mantém Fire x1,25.

## Fonte (código do jogo)
`abilities.cc:696-706` e `battle_util.c:4479` (Flash Fire, `ABSORB_RESULT_FLASH_FIRE`), `abilities.cc:1471-1487` (Dry Skin = `Impl<ABILITY_WATER_ABSORB>.onAbsorb`); `er-config` `AbilityList` `expanded_description`: Flash Fire "complete immunity to Fire-type moves".

## Critérios de aceite
- [x] Fire contra Flash Fire e Water contra Dry Skin dão dano 0 no duelo (hoje x1,000).
- [x] x1,5 do Flash Fire só depois da absorção; Mold Breaker atravessa.
- [x] 20 Pokémon de chefão (Flash Fire) e 5 (Dry Skin) passam a lutar certo.


## O que mudou (15/10/2026, branch `calibracao-04`)
- `src/regras/tipos.js`: Flash Fire (18) imune a Fire; Dry Skin (87) imune a Water com cura 25% (o Fire x1,25 e a cura/dano do clima continuam vindo do texto); Elemental Vortex (665, Flash Fire + Water Absorb) passa a absorver também Fire. A tabela alimenta as telas do app, que agora mostram "Flash Fire (imune)" e "Dry Skin (imune, cura 25%)".
- `src/regras/duelo.js`: o texto "Powers up Fire-type moves by 1.5x if hit by a Fire-type move" vira `ef.absorveReforca = { tipo: "Fire", mult: 1.5 }` (Elemental Vortex herda). No duelo (`ritmo`), o Fire do dono sai x1,5 depois da absorção, sem acumular: em n turnos o fator médio é `(1 + 1,5 x (n-1)) / n`. Sem absorção não há bônus: o rival tem outro golpe de dano (o motor, e a IA do jogo, evitam o golpe absorvido) ou tem Mold Breaker.
- `tests/unit/imunidades_de_habilidade.test.mjs`: o teste "Flash Fire não vira imunidade" (decisão de 28/09, só pelo texto) foi invertido.
- `docs/decisoes_mecanicas.md`: nova linha de 15/10/2026 que revê a escolha de 28/09.

## Números
- Teste novo: `tests/unit/absorcao_flash_fire_dry_skin.test.mjs`, 8 testes com chefões reais (Ninetales de Courtney, Toxicroak de Brawly 1) e a razão isolada: Fire contra Flash Fire x0 (era x1,000), Water contra Dry Skin x0 (era x1,000), Fire contra Dry Skin x1,25, Elemental Vortex x0 nos dois, Mold Breaker passa com o mesmo dano de quem não tem a habilidade.
- Sabotagens novas: 9 (`absorcao-*`), as 9 pegas; conferi que o trecho de cada uma existe uma vez só no arquivo.
- 21 Pokémon de chefão têm Flash Fire e 5 têm Dry Skin (a varredura contou 20 e 5): passam a ter a imunidade. O ticket falava em 45 e 17 espécies.
- Suíte inteira: 836 testes, 835 passam, 1 `todo` (Insect Impact, já existente). `npm run check`: tudo OK, exceto o erro de lint de `pipeline_build.js:67`, que já está no master (ticket 01).

## O que ficou de fora
- **Rank não recalculado** (ticket 08): as espécies com Flash Fire (45) e Dry Skin (17) mudam de rank.
- A cura de 25% da absorção (Dry Skin, Water Absorb...) segue só como texto da tela (`healPct`); o duelo não cura quem absorve. Vale para todas as absorções, não só estas duas.
- O Dry Skin no sol/chuva (1/8 do HP por turno, `abilities.cc:1474-1481`) já estava no texto ("Water/Rain heals. Fire/Sun hurts") e não foi mexido.
- O x1,5 da Flash Fire só entra quando o rival é forçado a lançar Fire. Se quiser que o motor também conte o rival "descuidado" (a IA do jogo às vezes erra), é uma decisão de modelagem, não de código do jogo.

## Comentários
- Origem: varredura de calibração de 14 e 15/10/2026 (`docs/calibracao/`). Sem comentários ainda.
