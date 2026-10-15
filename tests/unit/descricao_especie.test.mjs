// Descrição de teste do jogo escondida na ficha (15/10/2026): o Noxislash mostrava "Hi i use this for implementing.".
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const sp = (n) => R.DATA.species.find((s) => s && s.n === n);

test("descrição de teste do desenvolvedor some; a oficial fica", () => {
  assert.match(sp("Noxislash").d, /implementing/, "fixture: o dado traz o texto de teste");
  assert.equal(R.descricaoDaEspecie(sp("Noxislash")), "");
  assert.match(R.descricaoDaEspecie(sp("Beedrill")), /\w/);
  const sobram = R.DATA.species.filter((s) => s && /implementing/i.test(R.descricaoDaEspecie(s)));
  assert.deepEqual(sobram.map((s) => s.n), []);
});
