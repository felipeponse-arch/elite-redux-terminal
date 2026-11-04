// TK-43: alvo dormindo no motor (valor esperado). Fonte: er-repo battle_scripts_1.s:3564-3573 (Dream Eater), :4909-4911 (Nightmare),
// battle_util.c:6886 (Wake-Up Slap: sono OU Comatose), :6944 (Dream Invasion = MOVE_DREAM_INVERSION: só STATUS1_SLEEP),
// :2616-2621 (residual do Nightmare só com STATUS1_SLEEP), :3197 (IsPowderImmune), abilities.cc:5969 (Archmage Dragon: Atk -1).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 8, difficulty: "ace", levelCapMode: "more" });
const NIVEL = 55;
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const unidade = (habs, golpe, status = [], tipos = ["Normal"], hp = 600) => {
  const ids = habs.map(idHab);
  const u = { sp: { n: "Teste", sname: "SPECIES_TESTE43", inn: [] }, tipos, ids, ef: R.efeitoDasHabilidadesNoDuelo(ids, "T43_" + habs.join("+"), null), item: "", it: R.itemDoDuelo("", null),
    stats: [hp, 300, 300, 300, 300, 100], golpesProntos: [], statusIds: status.map((n) => R.MOVE_ID_BY_NAME[n]), clima: null };
  u.golpeIds = [R.MOVE_ID_BY_NAME[golpe]];
  u.golpesProntos = R.prepararGolpesDuelo(u.golpeIds, u, null);
  return u;
};
const dano = (a, d) => R.danoNoDuelo(a, d, NIVEL).melhor.dano;
const alvo = (habs = [], tipos = ["Normal"]) => unidade(habs, "Tackle", [], tipos);

test("Dream Eater: com golpe de sono no set vale uma fração; sem ele, 0; Comatose vale cheio", () => {
  const sem = dano(unidade([], "Dream Eater"), alvo());
  const com = dano(unidade([], "Dream Eater", ["Hypnosis"]), alvo());
  const cheio = dano(unidade([], "Dream Eater"), alvo(["Comatose"]));
  assert.equal(sem, 0);
  assert.ok(com > 0 && com < cheio, `fração ${com} de ${cheio}`);
  assert.ok(dano(unidade([], "Dream Eater", ["Spore"]), alvo()) > com, "Spore (100%) dorme mais que Hypnosis (60%)");
});

test("Dream Eater: imunidades ao sono e ao pó zeram a fração", () => {
  const eater = (st) => unidade([], "Dream Eater", [st]);
  assert.equal(dano(eater("Hypnosis"), alvo(["Insomnia"])), 0, "Insomnia");
  assert.equal(dano(eater("Spore"), alvo([], ["Grass"])), 0, "Grass x pó");
  assert.equal(dano(eater("Spore"), alvo(["Overcoat"])), 0, "Overcoat x pó");
  assert.ok(dano(eater("Hypnosis"), alvo([], ["Grass"])) > 0, "Grass não barra Hypnosis (não é pó)");
});

test("Nightmare: falha sem sono; com golpe de sono tira dano e o residual de 1/4; Comatose sem o residual", () => {
  // PV 50: o golpe mata em 1 turno (n = 1), então Spore (5/3 turnos de sono) vale fração 1 e as contas ficam exatas. Nightmare é Ghost: alvo Psychic.
  const nm = (st) => unidade([], "Nightmare", st);
  const psi = (habs = []) => unidade(habs, "Tackle", [], ["Psychic"], 50);
  assert.equal(dano(nm([]), psi()), 0);
  const comatose = dano(nm([]), psi(["Comatose"])); // o golpe acerta, mas o status é tirado no fim do turno (battle_util.c:2619-2626): sem residual
  assert.ok(comatose > 0);
  const comSono = dano(nm(["Spore"]), psi());
  assert.ok(Math.abs(comSono - (comatose + 50 / 4)) < 1e-9, `${comSono} vs ${comatose} + 12,5`);
});

test("Wake-Up Slap: poder x2 em alvo dormindo ou Comatose", () => {
  const w = (st) => unidade([], "Wake-Up Slap", st);
  const base = dano(w([]), alvo());
  assert.ok(dano(w(["Spore"]), alvo()) > base, "golpe de sono no set");
  assert.ok(Math.abs(dano(w([]), alvo(["Comatose"])) / base - 2) < 1e-9, "Comatose = x2");
});

test("Dream Invasion: x2 só em STATUS1_SLEEP (Comatose não conta no código)", () => {
  const d = (st) => unidade([], "Dream Invasion", st);
  const base = dano(d([]), alvo());
  assert.ok(dano(d(["Spore"]), alvo()) > base);
  assert.equal(dano(d([]), alvo(["Comatose"])), base);
});

test("Archmage: golpe Dragon tem 30% de baixar o Atk do alvo (valor esperado em aoGolpear)", () => {
  const ef = R.efeitoDasHabilidadesNoDuelo([idHab("Archmage")], "T43_Archmage", null);
  const a = ef.aoGolpear.filter((x) => x.tipo === "Dragon" && x.stat === "atk");
  assert.equal(a.length, 1);
  assert.equal(a[0].n, -1);
  assert.equal(a[0].p, 0.3);
});

test("Cleanse: Heal Bell na entrada limpa o status que o usuário já traz (queimadura); sem ele a luta piora", () => {
  // abilities.cc:12991-13001 (onEntry usa MOVE_HEAL_BELL, até 2x por batalha). No 1x1 vale a 1ª entrada.
  const eu = (habs) => Object.assign(unidade(habs, "Tackle", [], ["Normal"], 400), { statusInicial: { queimar: 1 } });
  const inimigo = unidade([], "Tackle", [], ["Normal"], 400);
  const luta = (habs) => R.resultadoDoDuelo(eu(habs), inimigo, NIVEL, { detalhe: true });
  const sem = luta([]), com = luta(["Cleanse"]);
  assert.notDeepEqual(com, sem);
  assert.ok(R.efeitoDasHabilidadesNoDuelo([idHab("Cleanse")], "T43_Cleanse", null).limpaNaEntrada);
});
