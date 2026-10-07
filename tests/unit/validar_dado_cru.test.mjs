// Validação do dado cru do NextDex na ingestão (scripts/validar_dado_cru.mjs, lote 2).
import test from "node:test";
import assert from "node:assert/strict";
import { validarDadoCru } from "../../scripts/validar_dado_cru.mjs";

const piso = { abilities: 1, moves: 1, species: 1, items: 1, trainers: 1 };
const bom = () => ({
  abilities: [{ id: 1, name: "Sturdy" }],
  moves: [{ id: 1, name: "Tackle", pwr: 40, types: [0] }],
  species: [{ id: 1, NAME: "SPECIES_A", stats: { base: [1, 2, 3, 4, 5, 6], types: [0, 0], abis: [1], inns: [0] }, levelUpMoves: [{ id: 1, lv: 1 }], evolutions: [{ in: -1 }] }],
  items: [{ id: 1, name: "Potion" }],
  trainers: [{ name: "T", party: [{ spc: 0, item: 0, moves: [1, 0] }], insane: [], hell: [], rem: [] }],
  typeT: ["Normal"], effT: [], mapsT: [],
});

test("dado íntegro passa (in:-1 de megapedra é aceito)", () => assert.deepEqual(validarDadoCru(bom(), piso), []));

test("campo que sumiu ou virou outro tipo é pego", () => {
  const g = bom(); delete g.moves;
  assert.match(validarDadoCru(g, piso)[0], /"moves" sumiu/);
});

test("dado truncado (abaixo do piso) é pego", () => {
  assert.match(validarDadoCru(bom(), { ...piso, species: 1700 }).join("|"), /abaixo do piso 1700/);
});

test("referências quebradas: habilidade, golpe, espécie de time e stat fora de faixa", () => {
  const g = bom();
  g.species[0].stats.abis = [99];
  g.species[0].levelUpMoves = [{ id: 77, lv: 1 }];
  g.trainers[0].party[0].spc = 5;
  g.species[0].stats.base[0] = 999;
  const t = validarDadoCru(g, piso).join("|");
  assert.match(t, /stats base inválidos/);
  assert.match(t, /espécie 5 inexistente/);
  const h = bom(); h.species[0].stats.abis = [99]; h.species[0].levelUpMoves = [{ id: 77, lv: 1 }];
  const t2 = validarDadoCru(h, piso).join("|");
  assert.match(t2, /habilidade id 99/);
  assert.match(t2, /golpe id 77/);
});

test("id duplicado e potência absurda são pegos", () => {
  const g = bom(); g.moves.push({ id: 1, name: "Dup", pwr: 9999, types: [0] });
  const t = validarDadoCru(g, piso).join("|");
  assert.match(t, /id duplicado/);
  assert.match(t, /pwr 9999/);
});
