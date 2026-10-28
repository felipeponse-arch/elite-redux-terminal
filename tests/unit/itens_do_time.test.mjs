// TK-14 (motor-D5.3, decisão do usuário 28/10): UMA lista de itens para o set do duelo, o Motor e a IA.
// Paridade: as três rotas enxergam o mesmo conjunto (src/regras/itens_do_time.js).
import test from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 9, difficulty: "ace", levelCapMode: "more" });

test("itensDoTime: só item liberado na Etapa e não esgotado no time", () => {
  const todos = R.itensDoTime(99, null);
  assert.deepEqual(todos.slice().sort(), R.AI_ITEM_POOL.filter((n) => R.liberadoNaRun(99, null, { item: n })).sort());
  const i = todos[0];
  assert.ok(!R.itensDoTime(99, null, { [i]: ["A", "B"] }).includes(i), "esgotado sai");
  assert.ok(R.itensDoTime(99, null, { [i]: ["A"] }).includes(i), "um dono ainda cabe");
  const tardio = R.AI_ITEM_POOL.find((n) => !R.MEGA_FORMS[n] && R.etapaDoItem(n) > 1);
  assert.ok(tardio && !R.itensDoTime(R.etapaDoItem(tardio) - 1, null).includes(tardio), "travado pela Etapa");
});

test("o palpite do set do duelo (itemDoSetDuelo) está sempre no conjunto único", () => {
  const ef = (o) => Object.assign({ klutz: false, statusProprio: [], curaEnvenenado: false, gostaDeBaga: false, unburden: false }, o);
  const casos = [ef({}), ef({ statusProprio: [{ quais: "queimar" }] }), ef({ curaEnvenenado: true }), ef({ gostaDeBaga: true })];
  for (const e of casos) for (const nome of ["tanque", "atacante"]) {
    const n = R.itemDoSetDuelo({ nome }, R.SPECIES.find((s) => !(s.ev || []).length), e);
    assert.ok(R.AI_ITEM_POOL.includes(n), n + " fora do conjunto único");
  }
  const evolui = R.SPECIES.find((s) => (s.ev || []).some((v) => !R.isMegaEvoKind(v[0])));
  assert.ok(R.AI_ITEM_POOL.includes(R.itemDoSetDuelo({ nome: "tanque" }, evolui, ef({}))));
  const veneno = R.SPECIES.find((s) => !(s.ev || []).length && R.speciesTypeNames(s).includes("Poison"));
  assert.ok(R.AI_ITEM_POOL.includes(R.itemDoSetDuelo({ nome: "tanque" }, veneno, ef({}))));
});

test("Motor: fixos e candidatos de tipo vêm do conjunto único (Psychic = Twisted Spoon, não Odd Incense)", () => {
  assert.ok(R.MOTOR_ITENS_FIXOS.every((n) => R.AI_ITEM_POOL.includes(n)));
  assert.ok(R.AI_ITEM_POOL.includes("Muscle Band") && R.AI_ITEM_POOL.includes("Wise Glasses"));
  assert.equal(R.itemDeTipoDoTime("Psychic"), "Twisted Spoon");
  for (const t of Object.values(R.ITENS_IA_TIPO)) assert.ok(R.AI_ITEM_POOL.includes(R.itemDeTipoDoTime(t)));
});

test("Motor: todo candidato (inclusive o de tipo) está no conjunto único; golpe Psychic oferece Twisted Spoon", () => {
  const R8 = carregarRegras({ milestone: 9 });
  const sp = (n) => R8.SPECIES.find((s) => s && s.n === n);
  R8.state.team = ["Gardevoir", "Klefki", "Scizor"].map((n) => sp(n).x);
  const ctx = R8.contextoDoMotor(); ctx.cache = R8.criarCacheDoMotor();
  const g = sp("Gardevoir");
  const c = { sp: g, sname: g.x, build: { moves: ["Psychic", "Moonblast", "Shadow Ball", "Calm Mind"] }, chaveBuild: "tk14-psy" };
  const lista = R8.motorItensCandidatos(ctx, c);
  assert.ok(lista.length > 0 && lista.every((n) => R8.AI_ITEM_POOL.includes(n)), lista.join(","));
  assert.ok(!lista.includes("Odd Incense"));
  assert.ok(R8.itensDoTime(ctx.etapa, ctx.cap).includes("Twisted Spoon") === lista.includes("Twisted Spoon"));
});
