// Ticket 16 (07/10/2026): golpes de poder 1 no dado com o poder do código oficial (src/script_conditions.cc
// CustomMoveDamage; battle_script_commands.c Cmd_calculatesetdamage). Antes valiam quase zero no simulador.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 9 });
// unidade mínima: dexNo define o peso pela Pokédex nacional (dado real de poder_variavel.json)
const unid = (dexNo, stats, golpes = ["Tackle"]) => {
  const u = { ef: R.efeitoDasHabilidadesNoDuelo([], "x", null), tipos: ["Normal"], stats, ids: [], sp: { i: dexNo, n: "x" + dexNo } };
  u.golpesProntos = R.prepararGolpesDuelo(golpes.map((n) => R.MOVE_ID_BY_NAME[n]), u, null);
  return u;
};
const poder = (efeito, atq, def) => R.poderVariavelDuelo(efeito, atq, def);
const S = [300, 100, 100, 100, 100, 100];

test("Low Kick/Grass Knot pelo peso do alvo: Pikachu (6 kg) 20, Charizard (90,5 kg) 80, Snorlax (460 kg) 120", () => {
  assert.equal(poder("Low Kick", unid(1, S), unid(25, S)), 20);
  assert.equal(poder("Low Kick", unid(1, S), unid(6, S)), 80);
  assert.equal(poder("Low Kick", unid(1, S), unid(143, S)), 120);
});

test("Heavy Slam/Heat Crash pela razão de pesos (inteira): Snorlax x Pikachu = 120; Pikachu x Snorlax = 40", () => {
  assert.equal(poder("Heat Crash", unid(143, S), unid(25, S)), 120);
  assert.equal(poder("Heat Crash", unid(25, S), unid(143, S)), 40);
  assert.equal(poder("Heat Crash", unid(6, S), unid(6, S)), 40); // razão 1
});

test("Gyro Ball: 25 x vel. do alvo / a sua + 1, até 150; Electro Ball pela razão, com o bug do jogo em 5x (= 4)", () => {
  const lento = unid(1, [300, 100, 100, 100, 100, 20]), rapido = unid(1, [300, 100, 100, 100, 100, 200]);
  assert.equal(poder("Gyro Ball", lento, rapido), 150);
  assert.equal(poder("Gyro Ball", rapido, lento), 3);
  assert.equal(poder("Electro Ball", rapido, unid(1, [300, 100, 100, 100, 100, 50])), 150); // razão 4
  assert.equal(poder("Electro Ball", rapido, lento), 4); // razão 10: o código devolve ARRAY_COUNT - 1
});

test("no duelo: Heavy Slam do Snorlax causa dano de verdade; Seismic Toss tira o nível", () => {
  const snorlax = unid(143, [400, 150, 100, 60, 100, 30], ["Heavy Slam"]);
  const d = R.danoNoDuelo(snorlax, unid(25, [200, 60, 60, 60, 60, 120]), 50);
  assert.ok(d.melhor.dano > 50, "Heavy Slam com poder 120: " + d.melhor.dano);
  const st = R.danoNoDuelo(unid(1, S, ["Seismic Toss"]), unid(25, [200, 60, 60, 60, 60, 120]), 50);
  assert.equal(Math.round(st.melhor.dano), 50);
});

// Revisão de 07/10: Technician e seguimento olhavam o poder 1 do dado (Low Kick de 120 ganhava x1,5).
test("Technician em golpe de poder variável usa o poder real: Low Kick em Snorlax (120) não ganha; em Pikachu (20) ganha", () => {
  const comHab = (habs) => {
    const u = { ef: R.efeitoDasHabilidadesNoDuelo(habs.map((n) => R.ABILITY_ID_BY_NAME[n]), "PVT_" + habs.join(), null), tipos: ["Fighting"], stats: S, ids: [], sp: { i: 1, n: "x1" } };
    u.golpesProntos = R.prepararGolpesDuelo([R.MOVE_ID_BY_NAME["Low Kick"]], u, null);
    return u;
  };
  const dano = (u, dex) => R.danoNoDuelo(u, unid(dex, S), 50).melhor.dano;
  assert.ok(Math.abs(dano(comHab(["Technician"]), 143) - dano(comHab([]), 143)) < 1e-6, "120 de poder: sem bônus");
  assert.ok(dano(comHab(["Technician"]), 25) / dano(comHab([]), 25) > 1.3, "20 de poder: ganha a Technician (x1,5 no poder)");
});

// Seguimento (+N de poder depois do golpe do tipo) em golpe de poder variável: soma-se ao poder REAL contra o alvo
// (battle_util.c: CalcMoveBasePower já devolve o poder calculado), não ao 1 do dado.
test("seguimento em golpe de poder variável usa o poder real: Low Kick + 40 de seguimento vale (pv+40)/pv", () => {
  // cópia do efeito: o cache de efeitoDasHabilidadesNoDuelo é compartilhado entre chaves iguais
  const comSeg = (seg) => {
    const u = { ef: Object.assign({}, R.efeitoDasHabilidadesNoDuelo([], "x", null)), tipos: ["Normal"], stats: S, ids: [], sp: { i: 1, n: "x1" } };
    if (seg) u.ef.seguimento = seg;
    u.golpesProntos = R.prepararGolpesDuelo([R.MOVE_ID_BY_NAME["Low Kick"]], u, null);
    return u;
  };
  const razao = (dex) => R.danoNoDuelo(comSeg({ tipo: "Fighting", poder: 40 }), unid(dex, S), 50).melhor.dano / R.danoNoDuelo(comSeg(null), unid(dex, S), 50).melhor.dano;
  // o dano tem uma constante fixa (+2), então a razão fica um pouco abaixo da do poder
  assert.ok(razao(25) > 2.5 && razao(25) < 3.01, "Pikachu (poder 20): " + razao(25)); // (20+40)/20 = 3
  assert.ok(razao(6) > 1.4 && razao(6) < 1.51, "Charizard (poder 80): " + razao(6)); // 120/80 = 1,5
  assert.ok(razao(143) > 1.28 && razao(143) < 1.34, "Snorlax (poder 120): " + razao(143)); // 160/120
});
