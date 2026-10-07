// Ticket 17 (07/10/2026): status drench pelo código oficial (er-repo 217dd0f). Encharcado age por
// último na faixa de prioridade (battle_main.c goesLast) por 2 ou 3 turnos; tipo Water e Amphibious
// não ficam (battle_util.c CanBeDrenched); Hydrate encharca 10% (abilities.cc).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const efDe = (nomes) => R.efeitoDasHabilidadesNoDuelo(nomes.map(idHab), "DR_" + nomes.join("+"), null);
const perto = (a, b) => Math.abs(a - b) < 1e-9;
const golpe = (extra) => Object.assign({ nome: "T", tipo: "Normal", cat: "F", contato: false, prio: 0, precisao: 1, forcaBase: 80, forca: 80, poder: 80, status: [], cats: [], flags: [], crit: { estagio: 0, sempre: false }, recuo: 0, custoHP: 0, dreno: 0, efeito: "", chanceEfeito: 0 }, extra || {});
const unidade = (ef, g, extra) => Object.assign({ tipos: ["Normal"], ids: [], ef, item: "", stats: [320, 100, 100, 100, 100, 100], golpesProntos: [g] }, extra || {});

test("dado: Hydro Pump 30%, Surf 20%, Water Gun e Rapid River 10% viram chance de encharcar", () => {
  const u = unidade(efDe([]), golpe());
  const prep = (n) => R.prepararGolpesDuelo([R.MOVE_ID_BY_NAME[n]], u, null)[0];
  assert.equal(prep("Hydro Pump").efeito, "Drench Hit");
  assert.ok(perto(prep("Hydro Pump").chanceEfeito, 0.3));
  assert.ok(perto(prep("Surf").chanceEfeito, 0.2));
  assert.ok(perto(prep("Water Gun").chanceEfeito, 0.1));
  assert.ok(perto(prep("Rapid River").chanceEfeito, 0.1));
});

test("chance por golpe: precisão conta; Water, Amphibious e Shield Dust não ficam; Sheer Force tira; Hydrate 10%", () => {
  const hp = golpe({ tipo: "Water", efeito: "Drench Hit", chanceEfeito: 0.3, precisao: 0.8 });
  const atq = unidade(efDe([]), hp);
  assert.ok(perto(R.chanceDeEncharcarDuelo(atq, unidade(efDe([]), golpe()), hp), 0.24));
  assert.equal(R.chanceDeEncharcarDuelo(atq, unidade(efDe([]), golpe(), { tipos: ["Water"] }), hp), 0);
  assert.equal(R.chanceDeEncharcarDuelo(atq, unidade(efDe(["Amphibious"]), golpe()), hp), 0);
  assert.equal(R.chanceDeEncharcarDuelo(atq, unidade(efDe(["Shield Dust"]), golpe()), hp), 0);
  assert.equal(R.chanceDeEncharcarDuelo(unidade(efDe(["Sheer Force"]), hp), unidade(efDe([]), golpe()), hp), 0);
  const agua = golpe({ tipo: "Water" });
  assert.ok(perto(R.chanceDeEncharcarDuelo(unidade(efDe(["Hydrate"]), agua, { tipos: ["Water"] }), unidade(efDe([]), golpe()), agua), 0.1));
  assert.equal(R.chanceDeEncharcarDuelo(unidade(efDe(["Hydrate"]), agua, { tipos: ["Normal"] }), unidade(efDe([]), golpe()), agua), 0, "Hydrate só com usuário Water");
});

test("duração 2 ou 3 turnos, sem pegar de novo enquanto dura: turno 2 = p; com p = 1, encharcado nos turnos 2-3 e metade no 4", () => {
  assert.equal(R.chanceEncharcadoNoTurnoDuelo(0.3, 1), 0);
  assert.ok(perto(R.chanceEncharcadoNoTurnoDuelo(0.3, 2), 0.3));
  assert.ok(perto(R.chanceEncharcadoNoTurnoDuelo(1, 3), 1));
  assert.ok(perto(R.chanceEncharcadoNoTurnoDuelo(1, 4), 0.5));
  assert.ok(perto(R.chanceEncharcadoNoTurnoDuelo(1, 5), 0.5)); // quem durou 2 pega de novo no 4 e está encharcado no 5
});

test("no duelo: o lento que encharca passa a agir antes do rápido no turno que decide", () => {
  const forca = { forca: 160, forcaBase: 160, poder: 160 };
  const lento = (ef) => unidade(efDe([]), golpe(Object.assign({ efeito: ef, chanceEfeito: 1 }, forca)), { stats: [320, 100, 100, 100, 100, 50] });
  const rapido = (extra) => unidade(efDe([]), golpe(forca), Object.assign({ stats: [320, 100, 100, 100, 100, 150] }, extra));
  const sem = R.resultadoDoDuelo(lento(""), rapido(), 50, { detalhe: true });
  const com = R.resultadoDoDuelo(lento("Drench Hit"), rapido(), 50, { detalhe: true });
  assert.ok(sem.turnos >= 2, "luta de mais de um turno: " + sem.turnos);
  assert.equal(sem.venceu, false, "sem drench o rápido ganha");
  assert.equal(com.venceu, true, "encharcado, o rápido age por último");
  assert.equal(R.resultadoDoDuelo(lento("Drench Hit"), rapido({ tipos: ["Water"] }), 50, { detalhe: true }).venceu, false, "tipo Water não fica encharcado");
});
