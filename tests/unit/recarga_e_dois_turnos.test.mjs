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

test("Hyper Beam e Giga Impact são recarga (efeito Recharge), entram com dano x0,5; every_other_turn NÃO leva a penalidade", () => {
  for (const nome of ["Hyper Beam", "Giga Impact"]) {
    const g = prep(nome)[0];
    assert.ok(g, nome + " tem que entrar");
    assert.ok(perto(g.forca, g.forcaBase * 0.5), nome + ": " + g.forca + " x " + g.forcaBase);
  }
  for (const nome of ["Rock Wrecker", "Eternabeam", "Hydro Cannon", "Gigaton Hammer", "Blood Moon", "Tsunami Hammer"]) {
    const g = prep(nome)[0];
    assert.ok(g && perto(g.forca, g.forcaBase) && g.alterna === true, nome + " alterna, sem x0,5");
  }
  assert.equal(prep("Hydro Cannon", ["Rampage"])[0].alterna, false, "Rampage libera a repetição");
});

test("as 4 habilidades liberam a repetição do every_other_turn (battle_util.c:1607)", () => {
  for (const ab of ["Rampage", "Master Hand", "Raging Goddess", "Berserker Rage"]) assert.equal(prep("Blast Burn", [ab])[0].alterna, false, ab);
});

test("duelo: Hydro Cannon alterna com o melhor outro golpe; com Rampage repete; Hyper Beam segue x0,5", () => {
  const NIVEL = 55;
  const mon = (hab, golpes) => {
    const s = R.SPECIES.find((x) => x && x.n === "Blastoise");
    const u = R.unidadeDaBuild(s, { ability: "Run Away", nature: "Modest", evs: [0, 0, 0, 252, 0, 0], item: "", moves: golpes }, NIVEL, null);
    const ids = hab.map((n) => R.ABILITY_ID_BY_NAME[n]);
    u.ids = ids; u.ef = R.efeitoDasHabilidadesNoDuelo(ids, "Blastoise|" + hab.join("+"), null);
    u.golpeIds = golpes.map((n) => R.MOVE_ID_BY_NAME[n]);
    u.golpesProntos = R.prepararGolpesDuelo(u.golpeIds, u, null);
    return u;
  };
  const alvo = mon([], ["Tackle"]);
  const d = (hab, golpes) => R.danoNoDuelo(mon(hab, golpes), alvo, NIVEL).melhor.dano;
  const cheio = d(["Rampage"], ["Hydro Cannon"]), outro = d([], ["Ice Beam"]);
  assert.ok(cheio > outro, "o teste precisa do Hydro Cannon como melhor golpe");
  assert.ok(perto(d([], ["Hydro Cannon"]), cheio / 2), "sem outro golpe, o turno alternado vale 0");
  assert.ok(perto(d([], ["Hydro Cannon", "Ice Beam"]), (cheio + outro) / 2), "alterna com o melhor outro");
  assert.ok(perto(d(["Rampage"], ["Hydro Cannon", "Ice Beam"]), cheio), "Rampage repete");
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
