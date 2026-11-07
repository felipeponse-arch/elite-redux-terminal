// 8º ginásio (docs/tickets/oitavo-ginasio-dupla/01): Juan 1 + Wallace e depois Juan 5 + Wallace 5, duas duplas seguidas, sem cura
// (SootopolisCity_Gym_1F/scripts.pory:268-291; FLAG_SYS_DISABLE_AUTOHEAL em battle_main.c:846 e pokemon.c:2121).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 7, difficulty: "ace", levelCapMode: "more" });
const golpe = (extra) => Object.assign({ nome: "T", tipo: "Normal", cat: "F", contato: false, prio: 0, precisao: 1, forcaBase: 80, forca: 80, poder: 80, status: [], cats: [], flags: [], crit: { estagio: 0, sempre: false }, recuo: 0, custoHP: 0, dreno: 0 }, extra || {});
const unidade = (g, stats) => ({ sp: { n: "Teste", sname: "T", b: [100, 100, 100, 100, 100, 100] }, tipos: ["Normal"], ids: [], ef: R.efeitoDasHabilidadesNoDuelo([], "OG_vazio", null), item: "", it: R.itemDoDuelo("", null), stats: stats || [320, 100, 100, 100, 100, 100], golpesProntos: [g] });
const forte = () => unidade(golpe({ forca: 9000, forcaBase: 9000, poder: 9000 }), [900, 300, 300, 300, 300, 300]);
const fracos = () => unidade(golpe({ forca: 1, forcaBase: 1, poder: 1 }), [10, 10, 10, 10, 10, 10]);

test("insígnia 8 ainda não saiu: Juan 5 e Wallace 5 são a 2ª dupla do ginásio, não revanche; com a insígnia, voltam a ser", () => {
  for (const n of ["Juan 5", "Wallace 5"]) assert.equal(R.ehRevancheDeLider(n), false, n);
  assert.equal(R.ehRevancheDeLider("Juan 2"), true, "Juan 2 segue revanche");
  const pos = carregarRegras({ milestone: 8 });
  for (const n of ["Juan 5", "Wallace 5"]) assert.equal(pos.ehRevancheDeLider(n), true, n + " depois da insígnia");
});

test("a 2ª luta herda HP, status e desmaiados da 1ª (sem cura)", () => {
  const foes = R.bossPartyPorDificuldade(R.BOSSES.find((b) => b.name === "Juan 5")).map((m) => R.foeDeDuelo(m, 50, null)).filter(Boolean);
  const meus = [forte(), forte(), forte()];
  const limpo = R.simularDuplaContraChefao(meus, foes, 50, null);
  assert.ok(limpo.heranca.every((h) => h.vivo), "sem herança todos de pé");
  const ini = { heranca: [{ frac: 0.5, vivo: true, status: { paralisar: 1 } }, { frac: 0, vivo: false, status: {} }, { frac: 1, vivo: true, status: {} }] };
  const r = R.simularDuplaContraChefao(meus, foes, 50, ini);
  assert.equal(r.heranca[1].vivo, false, "o desmaiado da luta 1 continua desmaiado");
  assert.equal(r.heranca[1].frac, 0);
  assert.ok(r.heranca[0].frac <= 0.5 && r.heranca[0].status.paralisar === 1, "HP e status da luta 1 seguem");
  assert.ok(r.vivos <= 2, "vivos " + r.vivos);
});

test("simularOitavoGinasio: 2 duplas seguidas; luta 2 só roda se a 1 for vencida", () => {
  const tam = (n) => R.bossPartyPorDificuldade(R.BOSSES.find((b) => b.name === n)).length;
  const r = R.simularOitavoGinasio([forte(), forte(), forte(), forte()], 50);
  assert.equal(r.dupla, true);
  assert.equal(r.luta1.total, tam("Juan 1") + tam("Wallace"));
  assert.equal(r.luta2.total, tam("Juan 5") + tam("Wallace 5"));
  assert.equal(r.total, r.luta1.total + r.luta2.total);
  const perde = R.simularOitavoGinasio([fracos(), fracos()], 50);
  assert.equal(perde.venceu, false);
  assert.equal(perde.luta2, null, "perdeu a 1ª: não há 2ª");
});

test("simularOitavoGinasio: quem desmaiou na 1ª luta não luta na 2ª", () => {
  const meio = () => unidade(golpe({ forca: 250, forcaBase: 250, poder: 250 }), [500, 150, 150, 150, 150, 100]);
  const r = R.simularOitavoGinasio([meio(), meio(), meio(), meio(), meio(), meio()], 50);
  assert.ok(r.luta1.venceu && r.luta1.vivos < 6, "fixture: ganha a 1ª com baixas, vivos " + r.luta1.vivos);
  assert.ok(r.luta2.vivos <= r.luta1.vivos, "2ª não ressuscita ninguém: " + r.luta2.vivos + " x " + r.luta1.vivos);
  assert.ok(r.luta2.heranca.filter((h) => h.vivo).length <= r.luta1.vivos);
});
