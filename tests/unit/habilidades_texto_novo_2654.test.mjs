// TK-00b (28/10): textos de habilidade que a v2.65.4.1 reescreveu. A regra do motor lê o TEXTO; cada teste prova que a redação nova ainda
// vira o efeito do código do jogo (er-repo f34fc2b, src/abilities.cc). Dono real = espécie da Dex atual.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const id = (n) => R.ABILITY_ID_BY_NAME[n];
const ef = (hab, clima) => R.efeitoDasHabilidadesNoDuelo([id(hab)], "TK00B|" + hab + "|" + (clima || ""), clima || null);
const dono = (hab) => R.SPECIES.find((s) => s && [].concat(s.ab, s.inn).includes(id(hab)));

test("Protean e Libero ('Changes type to move's type before use. Once per switch in.'): STAB em todo golpe (abilities.cc:2300-2306, 3221-3224)", () => {
  ["Protean", "Libero"].forEach((h) => {
    assert.ok(dono(h), h + " tem dono real na Dex");
    assert.equal(ef(h).stabTodos, true, h);
    assert.equal(R.habilidadeSemRegraNoDuelo(id(h)), false, h + " não é sem regra");
  });
});

test("Cool Exit ('at end of 2nd turn. Once per battle.'): sai no 2º turno (abilities.cc:500-520)", () => {
  assert.ok(dono("Cool Exit"));
  assert.equal(ef("Cool Exit").fogeNaMetade, true);
});

test("I Am Steve (Swoobat, Noivern): No Retreat na entrada = +1 nos cinco atributos (abilities.cc:11222-11225)", () => {
  assert.ok(dono("I Am Steve"));
  const e = ef("I Am Steve").estagioEntrada;
  ["atk", "def", "spa", "spd", "spe"].forEach((k) => assert.equal(e[k], 1, k));
});

test("Foggy Eye (Emboar Mega): só na névoa, Ghost x1,5 e resiste a Ghost (abilities.cc:11475-11487)", () => {
  assert.ok(dono("Foggy Eye"));
  const n = ef("Foggy Eye", "nevoa"), s = ef("Foggy Eye", null);
  assert.equal(n.bonusTipo.Ghost, 1.5);
  assert.equal(n.resistTipo.Ghost, 0.5);
  assert.equal(s.bonusTipo.Ghost, undefined, "sem névoa não vale");
  assert.equal(R.habilidadeSemRegraNoDuelo(id("Foggy Eye")), false);
});

test("composta que citava 'Keen Edge' (Blademaster, Molten Blades, Chestnut Axe) lê o Sharpness 1,3x do código (nome novo)", () => {
  ["Blademaster", "Molten Blades", "Chestnut Axe"].forEach((h) => assert.equal(ef(h).bonusCategoria.corte, 1.3, h));
});
