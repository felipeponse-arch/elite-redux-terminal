// Ticket design-2026-11-04/03 (decisão do usuário, 05/11/2026): espécie sem sprite oficial usa o sprite da base e mostra aviso.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { carregarRegras } from "./carregar_regras.mjs";

const ler = (a) => JSON.parse(readFileSync(new URL("../../data/" + a, import.meta.url), "utf8"));
const dex = ler("dex_compact.json");
const idx = ler("sprite_index.json");
const prov = ler("sprites_provisorios.json").provisorios;
const porSname = (s) => dex.species.find((sp) => sp && sp.sname === s);
const R = carregarRegras();

test("cada espécie provisória usa a casa do atlas da forma base e mostra o aviso", () => {
  const nomes = Object.keys(prov);
  assert.ok(nomes.includes("SPECIES_BRUXISH_MEGA") && nomes.includes("SPECIES_JELLICENT_MEGA"));
  for (const s of nomes) {
    const sp = porSname(s), base = porSname(prov[s]);
    assert.ok(sp && base, s);
    assert.equal(idx.index[sp.x], idx.index[base.x], s + " deve usar o sprite de " + prov[s]);
    assert.notEqual(idx.index[sp.x], undefined);
    assert.match(R.avisoSemSpriteHtml(sp.x, idx), /sem sprite oficial/);
  }
});

test("espécie com sprite oficial não mostra o aviso", () => {
  const provX = new Set(Object.keys(prov).map((s) => porSname(s).x));
  for (const sp of dex.species.filter((s) => s && !provX.has(s.x))) {
    if (R.avisoSemSpriteHtml(sp.x, idx) !== "") assert.fail(sp.n + " mostra aviso sem ser provisória");
  }
  assert.equal(R.avisoSemSpriteHtml(porSname("SPECIES_BRUXISH").x, idx), "");
});
