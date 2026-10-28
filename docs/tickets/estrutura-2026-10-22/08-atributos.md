
### 2026-10-28 - TK-08 feito (engenheira-do-motor, branch ticket/08)
- **Achado:** `GET_BASE_SPECIES_ID` = `gFormSpeciesIdTables[x][0]`, gerado de `form_of` (`FormSpeciesTableGenerator.kt`, `SpeciesList.textproto`). Todas as formas de Pikachu têm `form_of: SPECIES_PIKACHU` e Raichu Alolan/Mega X/Y `form_of: SPECIES_RAICHU`. Resultado: o x1,6 do jogo (`battle_util.c:7298-7305`) é código morto; TODA forma de Pikachu vale x2,0. Isto contradiz a premissa do ticket ("formas x1,6"); implementei o que o código faz. Raichu Alolan x1,5: a calibração 241 SpA continua.
- **Feito:** `ITEM_STAT_MODS` (calc_stat.js) virou fonte única: Light Ball (Pichu incluído), Thick Club, Deep Sea Tooth/Scale, Metal Powder, Quick Powder, Eviolite (exclusão Necrozma; `emDano`, o duelo lê a mesma regra). Premissa IV 31/EV documentada no código e em `docs/decisoes_mecanicas.md`.
- **Muda de número:** nenhuma build nem rank (Pikachu Pop Star, Raichu/Marowak Alolan dos chefões e as Eviolite já davam o mesmo valor). Só muda caso novo: Pichu, Clamperl, Ditto, Necrozma, nenhum em build/chefão hoje.
- **Testes:** `tests/unit/itens_de_atributo.test.mjs`; sabotagens `item-atributo-*`.
