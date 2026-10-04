// Efeito do campeão monotype (04/10): o jogo anuncia um efeito por tipo (src/battle_main.c HandleMonoChampSpecialEffects
// e src/battle_message.c). O simulador ainda não os conta (naoSimulado); a tela e a IA mostram o texto.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 9 });

test("os 18 chefões Monochamp têm regra de campo com texto, marcada como não simulada", () => {
  const nomes = R.BOSSES.filter((b) => /^Monochamp /.test(b.name)).map((b) => b.name);
  assert.equal(nomes.length, 18);
  for (const n of nomes) {
    const r = R.regraDeCampoDoChefao(n);
    assert.ok(r && r.texto && r.texto.length > 20, n + " sem texto");
    assert.equal(r.naoSimulado, true, n + " deve avisar que o simulador não conta");
  }
});

test("regra do monotype não altera a simulação (sem sala/inversa/gravidade)", () => {
  const foes = R.BOSSES.find((b) => b.name === "Monochamp Bug").party.slice(0, 2).map((m) => R.foeDeDuelo(m, 85, null)).filter(Boolean);
  const com = R.foesComRegraDeCampo(foes, R.regraDeCampoDoChefao("Monochamp Bug"));
  com.forEach((f, i) => { assert.equal(f.ef.sala || 0, foes[i].ef.sala || 0); assert.equal(!!f.ef.inversa, !!foes[i].ef.inversa); assert.equal(!!f.ef.gravidade, !!foes[i].ef.gravidade); });
});

test("as regras que o simulador conta seguem sem o aviso (Tate & Liza 1, Steven)", () => {
  assert.equal(R.regraDeCampoDoChefao("Tate And Liza 1").naoSimulado, undefined);
  assert.equal(R.regraDeCampoDoChefao("Steven Doubles").naoSimulado, undefined);
  assert.equal(R.regraDeCampoDoChefao("Flannery 1"), null);
});
