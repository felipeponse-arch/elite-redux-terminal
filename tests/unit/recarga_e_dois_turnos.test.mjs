// TK-06 (decisão 7 do usuário, 28/10): recarga e golpe de 2 turnos lidos do EFEITO do dado, não da tradução PT.
// Dado real: Hyper Beam/Giga Impact (Recharge), Meteor Beam (Two Turn Secondary), Freeze Shock/Ice Burn (Two Turn
// Retaliation), Cheap Shot (Semi Invulnerable), Solar Beam/Blade (Solarbeam), Rock Wrecker (every_other_turn na er-config).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const mk = (ab) => ({ ef: R.efeitoDasHabilidadesNoDuelo((ab || []).map((n) => R.ABILITY_ID_BY_NAME[n]), "EG_" + (ab || []).join("+"), null), tipos: ["Normal"], stats: [100, 100, 100, 100, 100, 100] });
const prep = (nome, ab, clima) => R.prepararGolpesDuelo([R.MOVE_ID_BY_NAME[nome]], mk(ab), clima || null);
const perto = (a, b) => Math.abs(a - b) < 1e-6;

test("Hyper Beam, Giga Impact e Rock Wrecker são recarga, não carga: entram, com dano x0,5", () => {
  for (const nome of ["Hyper Beam", "Giga Impact", "Rock Wrecker", "Eternabeam"]) {
    const g = prep(nome)[0];
    assert.ok(g, nome + " tem que entrar (hoje caía no filtro de carga)");
    assert.ok(perto(g.forca, g.forcaBase * 0.5), nome + ": " + g.forca + " x " + g.forcaBase);
  }
});

test("Rampage, Master Hand e Raging Goddess: sem recarga após nocaute, x0,75 em vez de x0,5", () => {
  const base = prep("Hyper Beam")[0].forcaBase;
  assert.ok(perto(prep("Hyper Beam", ["Rampage"])[0].forca, base * 0.75));
  // Master Hand = Mega Launcher (x1,3 em feixe) + Rampage; Raging Goddess = Rampage + Hyper Aggressive (2º golpe).
  assert.ok(prep("Hyper Beam", ["Master Hand"])[0].forca > base * 0.75 * 1.2);
  assert.ok(prep("Hyper Beam", ["Raging Goddess"])[0].forca > base * 0.5 * 1.5);
});

test("golpe que não é de recarga não leva a penalidade", () => {
  const g = prep("Body Slam")[0];
  assert.ok(perto(g.forca, g.forcaBase));
});

test("golpes de 2 turnos pelo efeito: Meteor Beam, Freeze Shock, Ice Burn, Cheap Shot, Skull Bash saem; Accelerate os libera", () => {
  for (const nome of ["Meteor Beam", "Freeze Shock", "Ice Burn", "Cheap Shot", "Skull Bash", "Fly"]) {
    assert.equal(prep(nome).length, 0, nome + " é de dois turnos");
    assert.equal(prep(nome, ["Accelerate"]).length, 1, nome + " com Accelerate");
  }
});

test("Solar Beam/Blade: entram no sol ou com Chloroplast; Electro Shot na chuva", () => {
  assert.equal(prep("Solar Beam").length, 0);
  assert.equal(prep("Solar Beam", [], "sol").length, 1);
  assert.equal(prep("Solar Blade", ["Chloroplast"]).length, 1);
  assert.equal(prep("Electro Shot").length, 0);
  assert.equal(prep("Electro Shot", [], "chuva").length, 1);
});

test("golpes de recarga só entram na pool de espécie com Rampage (golpeUtil não os inclui)", () => {
  const sp = { lm: [[1, R.MOVE_ID_BY_NAME["Hyper Beam"]], [1, R.MOVE_ID_BY_NAME["Body Slam"]]], tu: [] };
  const ids = R.golpesDeDueloAte(sp, 100);
  assert.ok(!ids.includes(R.MOVE_ID_BY_NAME["Hyper Beam"]));
  assert.ok(ids.includes(R.MOVE_ID_BY_NAME["Body Slam"]));
});
