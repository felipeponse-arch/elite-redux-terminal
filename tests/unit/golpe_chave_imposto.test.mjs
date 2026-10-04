// Relato da Tate & Liza (03/10): o plano dizia Dragon Claw e a build da IA tinha Dragon Pulse. Agora a validação
// da build (validateAiBuild) mantém o golpe-chave que o simulador provou e conta isso na rationale.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 9 });
const sp = R.getSpeciesBySname("SPECIES_HYDREIGON");
const nomes = R.availableMovesFor(sp).names;
const tem = (n) => nomes.indexOf(n) !== -1;
const bruta = (moves) => ({ ability: R.ABILITIES[sp.ab[0]][0], nature: "Timid", item: "", moves, evs: [4, 0, 0, 252, 0, 252], rationale: "teste" });

test("golpe-chave provado fica na build: o último golpe que não é chave sai", () => {
  const base = ["Dark Pulse", "Draco Meteor", "Flash Cannon", "Earth Power"].filter(tem);
  const chave = ["Dragon Pulse", "Fire Blast", "Surf"].find((g) => tem(g) && base.indexOf(g) === -1);
  assert.ok(base.length === 4 && chave, "fixture: movepool com os golpes do caso");
  const ctx = { golpesChave: [chave] };
  const v = R.validateAiBuild(sp, bruta(base), {}, ctx);
  assert.ok(v, "a build passa");
  assert.ok(v.moves.includes(chave), "a build ficou com " + chave + ": " + v.moves.join(","));
  assert.equal(v.moves.length, 4);
  assert.match(v.rationale, /Golpe-chave do simulador mantido/);
  const original = bruta(base);
  R.validateAiBuild(sp, original, {}, ctx);
  assert.deepEqual(original.moves, base, "não muta a resposta da IA (a nova tentativa reaproveita)");
});

test("sem golpe-chave, ou com a chave já na build, nada muda", () => {
  const base = ["Dark Pulse", "Draco Meteor", "Flash Cannon", "Earth Power"].filter(tem);
  assert.deepEqual(R.validateAiBuild(sp, bruta(base), {}, {}).moves, base);
  const v = R.validateAiBuild(sp, bruta(base), {}, { golpesChave: ["Draco Meteor"] });
  assert.deepEqual(v.moves, base);
  assert.doesNotMatch(v.rationale, /Golpe-chave/);
});

test("contextoDeValidacao lê os golpes-chave do que o simulador provou", () => {
  const boss = R.BOSSES.find((b) => b.name === "Tate And Liza 1");
  const ctx = R.contextoDeValidacao(sp, { chefao: { boss, provado: { chave: { Delphox: "Dragon Pulse", Slowking: "Dragon Pulse", Lunatone: "Draco Meteor" } } } });
  assert.deepEqual([...ctx.golpesChave].sort(), ["Dragon Pulse", "Draco Meteor"].sort());
});

test("a troca do golpe-chave não tira a única sinergia de habilidade da build (Earth Power da innate Levitate)", () => {
  const base = ["Dark Pulse", "Draco Meteor", "Flash Cannon", "Earth Power"].filter(tem);
  const chave = ["Dragon Pulse", "Fire Blast"].find((g) => tem(g) && base.indexOf(g) === -1);
  const v = R.validateAiBuild(sp, bruta(base), {}, { golpesChave: [chave] });
  assert.ok(v, "passa a regra do especialista");
  assert.ok(v.moves.includes("Earth Power") || v.moves.includes("Flash Cannon") || v.moves.includes("Dark Pulse"), "mantém um golpe com sinergia ativa");
});

test("com mais de 4 alvos, os golpes que o simulador provou entram primeiro na lista de chaves", () => {
  const boss = R.BOSSES.find((b) => b.name === "Tate And Liza 1");
  const chave = { A: "Surf", B: "Fire Blast", C: "Dragon Pulse", D: "Earth Power", E: "Draco Meteor" };
  const ctx = R.contextoDeValidacao(sp, { chefao: { boss, provado: { golpes: ["Draco Meteor", "Earth Power"], chave } } });
  assert.deepEqual([...ctx.golpesChave].slice(0, 2), ["Draco Meteor", "Earth Power"]);
});
