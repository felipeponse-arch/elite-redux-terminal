// Depende de dado: rank/lutas (muda quando o rank é recalculado; não é regra de jogo fixa).
// TK-20 D9.5b: a regra de campo do chefão vem do dado (bosses.json `campo`, extraído do script do mapa do jogo),
// não do nome. Caracterização: os mesmos 5 chefões simulados de antes + os 18 Monochamp; nenhum outro ganhou campo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";
import { extrairCampos } from "../../scripts/extrair_campo_chefoes.mjs";

const R = carregarRegras({ milestone: 9 });
const T = "Trick Room permanente a luta inteira", G = "Gravity a luta inteira (Ground acerta voadores, sem Levitate)";

test("Tate & Liza e Steven: mesma regra de antes (caracterização)", () => {
  assert.deepEqual({ ...R.regraDeCampoDoChefao("Tate And Liza 1") }, { sala: true, inversa: true, texto: "Trick Room permanente e batalha INVERTIDA (tabela de tipos ao contrario) a luta inteira" });
  assert.deepEqual({ ...R.regraDeCampoDoChefao("Tate And Liza 2") }, { sala: true, texto: T });
  assert.deepEqual({ ...R.regraDeCampoDoChefao("Tate And Liza 3") }, { sala: true, texto: T });
  assert.deepEqual({ ...R.regraDeCampoDoChefao("Steven Doubles") }, { gravidade: true, texto: G });
  assert.deepEqual({ ...R.regraDeCampoDoChefao("Steven Doubles Legends") }, { gravidade: true, texto: G });
});

test("só esses 23 chefões têm campo, cada um com fonte carimbada", () => {
  const comCampo = R.BOSSES.filter((b) => b.campo);
  assert.equal(comCampo.length, 23);
  comCampo.forEach((b) => assert.match(b.campo.fonte, /^er-repo [0-9a-f]+ data\/maps\/.+scripts\.pory:\d+$/, b.name));
  assert.equal(R.regraDeCampoDoChefao("Steven"), null);
  assert.equal(R.regraDeCampoDoChefao("Roxanne 1"), null);
});

test("o extrator lê o script como o jogo: case sem o id não herda o do case vizinho", () => {
  const txt = ["script X{", "setvar(VAR_BATTLE_FIELD_EFFECT_TYPE, BATTLE_FIELD_EFFECT_ROOM)", "switch(var(V)){", "case 0:", "trainerbattle_no_intro(TRAINER_A_B, t)", "break", "case 1:", "setvar(VAR_BATTLE_FIELD_ID, STATUS_FIELD_GRAVITY)", "trainerbattle_no_intro(TRAINER_A_C, t)", "break", "}", "}"].join("\n");
  const r = extrairCampos(txt);
  assert.deepEqual(r.map((x) => x.nome), ["A C"]);
  assert.equal(r[0].campo.id, "STATUS_FIELD_GRAVITY");
});

test("bosses.json guarda o campo dos 23 chefões (falha se o pipeline regerar sem rodar o extrator)", () => {
  const esperados = ["Tate And Liza 1", "Tate And Liza 2", "Tate And Liza 3", "Steven Doubles", "Steven Doubles Legends"]
    .concat(R.BOSSES.filter((b) => /^Monochamp /.test(b.name)).map((b) => b.name));
  assert.equal(esperados.length, 23);
  esperados.forEach((n) => assert.ok(R.BOSSES.find((b) => b.name === n).campo, n + " sem campo"));
});
