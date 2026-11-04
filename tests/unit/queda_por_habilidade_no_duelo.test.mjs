// Depende de dado: o texto das habilidades no NextDex (gameData.json) - "Biting moves have a 50% chance to lower defense", "slashing moves lower SpDef". A regra do motor está nas 3 linhas citadas do abilities.cc abaixo.
// TK-40: queda de atributo do alvo por habilidade ao golpear, lida no código do jogo (er-repo src/abilities.cc).
// - Crushing Jaw / Gnawing Away: golpe com FLAG_STRONG_JAW_BOOST, 50% (Random() % 2) de Defesa -1 (11635-11645; Gnawing Away reaproveita em 13004).
// - Sinister Claws: golpe Keen Edge, SpDef -1 sempre (12467-12477; uma vez por turno por alvo).
// Denting Blows, Whiplash e Chainsaw (Defesa -1 sempre) já estavam no motor (estagios_no_duelo.test.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const efDe = (nomes) => R.efeitoDasHabilidadesNoDuelo(nomes.map(idHab), "QH_" + nomes.join("+"), null);
const golpe = (cats) => ({ nome: "T", tipo: "Normal", cat: "F", contato: false, prio: 0, precisao: 1, forcaBase: 80, forca: 80, status: [], cats, crit: { estagio: 0, sempre: false } });
const unidade = (ef, g) => ({ tipos: ["Water"], ids: [], ef, item: "", stats: [300, 100, 100, 100, 100, 100], golpesProntos: [g] });
const est = (u, o, n) => R.estagiosMediosDuelo(u, o, u.golpesProntos[0], o.golpesProntos[0], n);
const perto = (a, b) => Math.abs(a - b) < 1e-9;

test("Crushing Jaw e Gnawing Away: mordida baixa a Defesa do alvo com 50% de chance; outro golpe não; Clear Body barra", () => {
  for (const hab of ["Crushing Jaw", "Gnawing Away"]) {
    const dono = (cats) => unidade(efDe([hab]), golpe(cats));
    const alvo = unidade(efDe([]), golpe([]));
    assert.ok(perto(est(alvo, dono(["mordida"]), 3).def, -0.5), hab + ": 3 turnos acumulam (3-1)/2 golpes x 50% x -1");
    assert.equal(est(alvo, dono(["soco"]), 3).def, 0, hab + ": golpe sem mordida");
    assert.equal(est(unidade(efDe(["Clear Body"]), golpe([])), dono(["mordida"]), 3).def, 0, hab + ": Clear Body");
  }
});

test("Sinister Claws: golpe cortante baixa a SpDef do alvo; outro golpe não", () => {
  const dono = (cats) => unidade(efDe(["Sinister Claws"]), golpe(cats));
  const alvo = unidade(efDe([]), golpe([]));
  assert.equal(est(alvo, dono(["corte"]), 3).spd, -1);
  assert.equal(est(alvo, dono(["mordida"]), 3).spd, 0);
});
