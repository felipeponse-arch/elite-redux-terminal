// Habilidades "diversas" no duelo (2026-09-29): o resto que muda um 1x1 -
// Bulletproof, Wonder Guard, Bone Zone, Normalize, Pyromancy, evasão no clima,
// Slipstream, Equinox, dano de campo por turno, Rivalry, Soul Linker, Damp.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const efDe = (nomes, clima) => R.efeitoDasHabilidadesNoDuelo(nomes.map(idHab), "DV_" + nomes.join("+") + (clima || ""), clima || null);
const perto = (a, b) => Math.abs(a - b) < 1e-6;
const golpe = (cat, extra) => Object.assign({ nome: "T", tipo: "Normal", cat, contato: false, prio: 0, precisao: 1, forcaBase: 80, forca: 80, poder: 80, status: [], cats: [], flags: [], crit: { estagio: 0, sempre: false }, recuo: 0, custoHP: 0, dreno: 0 }, extra || {});
const unidade = (ef, g, extra) => Object.assign({ tipos: ["Water"], ids: [], ef, item: "", stats: [320, 100, 100, 100, 100, 100], golpesProntos: [g] }, extra || {});
const dano = (atq, def) => R.danoNoDuelo(atq, def, 50).melhor.dano;
const combinar = (eu, ele) => R.danoComStatusNoDuelo(eu, ele, R.danoNoDuelo(eu, ele, 50), R.danoNoDuelo(ele, eu, 50), 3, true);

test("Bulletproof barra golpe de bala; Wonder Guard só leva super efetivo", () => {
  const bala = unidade(efDe([]), golpe("F", { flags: ["Bullet Move"] }));
  assert.equal(dano(bala, unidade(efDe(["Bulletproof"]), golpe("F"))), 0);
  const normal = unidade(efDe([]), golpe("F", { tipo: "Normal" }));
  assert.equal(dano(normal, unidade(efDe(["Wonder Guard"]), golpe("F"))), 0);
  const planta = unidade(efDe([]), golpe("F", { tipo: "Grass" }));
  assert.ok(dano(planta, unidade(efDe(["Wonder Guard"]), golpe("F"))) > 0, "Grass contra Water: super efetivo passa");
});

test("Normalize: tudo vira Normal 1,1x e ignora resistência", () => {
  const ef = efDe(["Normalize"]);
  assert.equal(ef.converte.Fire.para, "Normal");
  assert.ok(ef.ignoraResist.Normal);
});

test("Pyromancy: chance de queimar do golpe x5", () => {
  const fp = R.MOVE_ID_BY_NAME["Fire Punch"];
  const u = (ab) => ({ ef: efDe(ab), tipos: ["Normal"], stats: [100, 100, 100, 100, 100, 100] });
  assert.ok(perto(R.prepararGolpesDuelo([fp], u(["Pyromancy"]), null)[0].status[0].p, 0.5));
});

test("Sand Veil só na areia: o rival erra mais (1,25x de evasão)", () => {
  const atq = unidade(efDe([]), golpe("F"));
  const semAreia = dano(atq, unidade(efDe(["Sand Veil"]), golpe("F")));
  const naAreia = dano(atq, unidade(efDe(["Sand Veil"], "areia"), golpe("F")));
  assert.ok(perto(semAreia / naAreia, 1.25));
});

test("Slipstream soma 20% da Velocidade ao ataque; Equinox iguala Atk e SpAtk pelo maior", () => {
  const alvo = unidade(efDe([]), golpe("F"));
  const rapido = { stats: [320, 100, 100, 100, 100, 200] };
  const base = dano(unidade(efDe([]), golpe("F"), rapido), alvo);
  assert.ok(dano(unidade(efDe(["Slipstream"]), golpe("F"), rapido), alvo) > base);
  const esp = unidade(efDe(["Equinox"]), golpe("E"), { stats: [320, 150, 100, 80, 100, 100] });
  const semEq = unidade(efDe([]), golpe("E"), { stats: [320, 150, 100, 80, 100, 100] });
  assert.ok(dano(esp, alvo) > dano(semEq, alvo));
});

test("dano de campo: Toxic Spill fere quem não é Poison, a cada turno", () => {
  const spill = unidade(efDe(["Toxic Spill"]), golpe("F"), { tipos: ["Poison"] });
  const alvo = (tipos) => unidade(efDe([]), golpe("F"), { tipos });
  const sem = combinar(unidade(efDe([]), golpe("F"), { tipos: ["Poison"] }), alvo(["Water"])).meu;
  assert.ok(perto(combinar(spill, alvo(["Water"])).meu - sem, 320 / 8));
  assert.ok(perto(combinar(spill, alvo(["Poison"])).meu, combinar(unidade(efDe([]), golpe("F"), { tipos: ["Poison"] }), alvo(["Poison"])).meu));
});

test("Rivalry e Soul Linker; Damp muda o tipo do rival no contato", () => {
  const riv = efDe(["Rivalry"]);
  assert.ok(perto(riv.danoMult, 1.125) && perto(riv.reducao.todos, 0.875));
  const eu = unidade(efDe(["Soul Linker"]), golpe("F")), ele = unidade(efDe([]), golpe("F"));
  const st = combinar(eu, ele), semLink = combinar(unidade(efDe([]), golpe("F")), ele);
  assert.ok(st.meu > semLink.meu && st.dele > semLink.dele, "cada lado leva também o dano que causa");
  assert.equal(efDe(["Damp"]).mudaTipoNoContato, "Water");
});
