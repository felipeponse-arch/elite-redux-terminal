// Tipo Stellar (TK-04, achado motor-D1.4; decisão do usuário 28/10): tabela contra battle_util.c:1012-1013 e 1056-1057
// (er-repo f34fc2b), Tera Starstorm só Stellar com usuário Stellar (battle_main.c:5038, 5119-5121) e Tera Orb / Terapagos
// Primal só no modo debug do jogo (data/scripts/debug.inc:203): nunca liberada, com o aviso na tela.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 9 });
const NOMES = R.TYPES.filter((t) => t !== "Mystery" && t !== "None");

test("tabela normal: Stellar bate x2 só em Stellar; ninguém passa de x1 em Stellar; Stellar fora da lista de tipos usáveis", () => {
  for (const def of NOMES) assert.equal(R.typeMultiplier("Stellar", [def]), def === "Stellar" ? 2 : 1, "Stellar -> " + def);
  for (const atk of NOMES.filter((t) => t !== "Stellar")) assert.equal(R.typeMultiplier(atk, ["Stellar"]), 1, atk + " -> Stellar");
  assert.equal(R.USABLE_TYPES.includes("Stellar"), false);
});

test("tabela inversa: Stellar contra Stellar vira 0,5 e o resto segue 1 (sInverseTypeEffectivenessTable)", () => {
  const ef = () => R.efeitoDasHabilidadesNoDuelo([], "x", null);
  const golpe = { nome: "T", tipo: "Stellar", cat: "E", contato: false, prio: 0, precisao: 1, forcaBase: 80, forca: 80, poder: 80, status: [], cats: [] };
  const unid = (tipos, inv) => ({ tipos, ef: Object.assign(ef(), { inversa: inv ? 99 : 0 }), item: "", ids: [], stats: [300, 100, 100, 100, 100, 100], golpesProntos: [golpe] });
  const dano = (def, inv) => R.danoNoDuelo(unid(["Stellar"], inv), unid(def, inv), 50).melhor.dano;
  const normal = dano(["Normal"], false);
  assert.ok(dano(["Stellar"], false) > normal * 1.9, "x2 em Stellar");
  assert.ok(dano(["Stellar"], true) < normal * 0.6, "x0,5 em Stellar na inversa");
});

test("Tera Starstorm: Stellar só com usuário Stellar; senão Normal", () => {
  const ids = [R.MOVE_ID_BY_NAME["Tera Starstorm"]];
  const tipoDe = (tipos) => R.prepararGolpesDuelo(ids, { tipos, ef: R.efeitoDasHabilidadesNoDuelo([], "x", null), stats: [300, 100, 100, 100, 100, 100], ids: [] }, null)[0].tipo;
  assert.equal(tipoDe(["Stellar"]), "Stellar");
  assert.equal(tipoDe(["Normal"]), "Normal");
  assert.equal(tipoDe(["Water"]), "Normal");
});

test("Tera Orb: travada para sempre (Etapa 10) e a Terapagos Primal avisa 'só no modo debug do jogo'", () => {
  assert.equal(R.MEGA_PEDRAS_TARDIAS["Tera Orb"], 10);
  assert.equal(R.liberadoNaRun(9, null, { pedra: "Tera Orb" }), false);
  const primal = R.DATA.species.find((s) => s && s.sname === "SPECIES_TERAPAGOS_STELLAR");
  assert.equal(R.megaFormLiberada(primal), false);
  assert.equal(R.quandoMega(primal), "só no modo debug do jogo");
  assert.match(R.rotuloEtapaDaMega(primal), /modo debug do jogo/);
  // outra pedra tardia segue com a frase de Etapa
  const mega = R.DATA.species.find((s) => s && s.sname === "SPECIES_FLOETTE_ETERNAL_MEGA") || R.DATA.species.find((s) => s && R.isMegaForm(s) && R.stonesOf(s).includes("Gardevoirite"));
  assert.match(R.quandoMega(mega), /^só a partir da /);
});
