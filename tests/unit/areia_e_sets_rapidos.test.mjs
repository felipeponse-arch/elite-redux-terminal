// Diagnóstico dos físicos subavaliados (03/10): Tyranitar/Rock sem o +50% de Sp. Def na areia (código oficial
// battle_util.c) e o menu de sets sem Jolly/Timid.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 9 });
const ef = R.efeitoDasHabilidadesNoDuelo([], "x", null);
const unid = (tipos, clima) => ({ ef, tipos, clima: clima || null, stats: [300, 100, 100, 100, 100, 100], ids: [] });
const especial = (tipo, u) => { u.golpesProntos = R.prepararGolpesDuelo([R.MOVE_ID_BY_NAME["Dazzling Gleam"]], u, u.clima); return u; };

test("areia: tipo Rock recebe menos dano especial (+50% de Sp. Def), outro tipo não muda", () => {
  const atq = (clima) => especial("Fairy", unid(["Fairy"], clima));
  const dano = (def, clima) => R.danoNoDuelo(atq(clima), def, 80).melhor.dano;
  const rock = unid(["Rock"], "areia"), rockSem = unid(["Rock"]);
  assert.ok(Math.abs(dano(rock, "areia") / dano(rockSem, null) - 1 / 1.5) < 0.02, "Rock na areia: 1/1,5 do dano especial");
  const normal = unid(["Normal"], "areia");
  assert.ok(Math.abs(dano(normal, "areia") / dano(unid(["Normal"]), null) - 1) < 1e-9, "Normal não muda");
});

test("areia: o +50% é só em Sp. Def (golpe físico em Rock não muda)", () => {
  const fis = (clima) => { const u = unid(["Fighting"], clima); u.golpesProntos = R.prepararGolpesDuelo([R.MOVE_ID_BY_NAME["Close Combat"]], u, clima); return u; };
  assert.equal(R.danoNoDuelo(fis("areia"), unid(["Rock"], "areia"), 80).melhor.dano, R.danoNoDuelo(fis(null), unid(["Rock"]), 80).melhor.dano);
});

test("menu de sets do simulador tem Jolly e Timid", () => {
  const nat = R.SETS_DE_DUELO.map((s) => s.nature);
  assert.ok(nat.includes("Jolly") && nat.includes("Timid"));
  assert.equal(R.SETS_DE_DUELO.length, 5);
});
