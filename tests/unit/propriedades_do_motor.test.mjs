// TK-30 (29/10/2026, decisão do usuário): testes por propriedade (fast-check) do motor de duelo, com espécies INVENTADAS e golpes reais de dano.
// Seed fixa: a falha é reprodutível. Se uma propriedade falhar, o contraexemplo é achado do motor (não se muda o motor aqui).
// Simetria não entra: o motor não tem operação com par simétrico (ataque A->B e B->A usam golpes e stats diferentes).
import { test } from "node:test";
import assert from "node:assert/strict";
import fc from "fast-check";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 8, difficulty: "ace", levelCapMode: "more" });
const GOLPES = ["Tackle", "Surf", "Flamethrower", "Earthquake", "Thunderbolt", "Ice Beam", "Shadow Ball", "Close Combat", "Psychic", "Moonblast", "Dragon Claw", "Mach Punch"];
const EF_POSSIVEIS = [0, 0.25, 0.5, 1, 2, 4];
const CFG = { seed: 20261029, numRuns: 150, endOnFailure: true };

const stat = fc.integer({ min: 5, max: 255 });
const tipos = fc.uniqueArray(fc.integer({ min: 0, max: R.TYPES.length - 1 }), { minLength: 1, maxLength: 2 });
const especie = fc.record({ t: tipos, b: fc.tuple(stat, stat, stat, stat, stat, stat), k: fc.integer({ min: 1, max: 99999 }) })
  .map(({ t, b, k }) => ({ x: 90000 + k, i: 90000 + k, n: "Fixa" + k, sname: "SPECIES_FIXA_" + k, t, b, ab: [], inn: [], ev: [], lm: [], tu: [] }));
const unid = (s, golpe) => R.unidadeDeDuelo(s, R.SETS_DE_DUELO[0], null, 50, [R.MOVE_ID_BY_NAME[golpe]], null);
const par = fc.tuple(especie, especie, fc.constantFrom(...GOLPES), fc.integer({ min: 1, max: 100 }));

test("dano nunca negativo nem NaN; efetividade só nos valores possíveis", () => {
  fc.assert(fc.property(par, ([a, d, g, nivel]) => {
    const r = R.danoNoDuelo(unid(a, g), unid(d, "Tackle"), nivel).melhor;
    assert.ok(Number.isFinite(r.dano) && r.dano >= 0, "dano " + r.dano);
    if (r.efTipo !== undefined) assert.ok(EF_POSSIVEIS.includes(r.efTipo), "efTipo " + r.efTipo);
  }), CFG);
});

test("fração de HP restante de cada lutador fica entre 0 e 1 (e o total não passa do tamanho do time)", () => {
  fc.assert(fc.property(fc.tuple(especie, especie, fc.constantFrom(...GOLPES)), ([a, d, g]) => {
    const r = R.simularLutaContraChefao([unid(a, g)], [unid(d, g)], 50, null);
    assert.ok(r.hpRestante >= 0 && r.hpRestante <= 1 + 1e-9, "hpRestante " + r.hpRestante);
    assert.ok(r.derrubados >= 0 && r.derrubados <= r.total);
  }), CFG);
});
