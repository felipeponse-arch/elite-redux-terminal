// TK-33b item 10: regraDeCampoDoChefao sem repetição (TYPE_ tirado uma vez, texto do Trick Room numa constante,
// índice por nome em vez de filtrar BOSSES a cada chamada). Paridade com a implementação antiga + forma do código.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras, lerComMutacao } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 9 });

// A implementação de antes do TK-33b, copiada como régua de paridade.
function regraAntiga(nome) {
  const b = R.BOSSES.filter((x) => x.name === nome)[0];
  const c = b && b.campo;
  if (!c) return null;
  if (c.efeito === "MONOCHAMP") return { texto: R.EFEITO_DO_CAMPEAO_MONOTYPE[c.id.replace("TYPE_", "").charAt(0) + c.id.replace("TYPE_", "").slice(1).toLowerCase()], naoSimulado: true };
  const r = { texto: R.TEXTO_DO_CAMPO_POR_ID[c.id] };
  if (c.id === "STATUS_FIELD_TRICK_ROOM") r.sala = true;
  if (c.id === "STATUS_FIELD_GRAVITY") r.gravidade = true;
  if (c.inversa) { r.inversa = true; r.texto = "Trick Room permanente e batalha INVERTIDA (tabela de tipos ao contrario) a luta inteira"; }
  return r;
}

test("paridade: para todo chefão do dado (e nome que não existe) a regra é a mesma de antes", () => {
  const nomes = [...new Set(R.BOSSES.map((b) => b.name)), "Não existe", "constructor", ""];
  let comCampo = 0, inversas = 0, monos = 0;
  nomes.forEach((n) => {
    const nova = R.regraDeCampoDoChefao(n);
    assert.equal(JSON.stringify(nova), JSON.stringify(regraAntiga(n)), n); // JSON: objetos do vm têm outro Object.prototype
    if (nova) comCampo++;
    if (nova && nova.inversa) inversas++;
    if (nova && nova.naoSimulado) monos++;
  });
  assert.equal(monos, 18, "os 18 Monochamp");
  assert.ok(inversas >= 1, "pelo menos a Tate & Liza 1 inversa");
  assert.ok(comCampo >= 20, "contagem de lutas com campo: " + comCampo);
  assert.equal(R.regraDeCampoDoChefao("Tate And Liza 1").texto, "Trick Room permanente e batalha INVERTIDA (tabela de tipos ao contrario) a luta inteira");
});

test("forma do código: texto do Trick Room numa constante, TYPE_ uma vez, sem filtrar BOSSES por chamada", () => {
  const src = lerComMutacao("src/regras/chefoes.js", "chefoes.js");
  const corpo = src.slice(src.indexOf("function regraDeCampoDoChefao"), src.indexOf("function comportamentoDaIADoChefao"));
  assert.equal(src.split('"Trick Room permanente').length - 1, 1, "o texto 'Trick Room permanente' aparece uma vez no arquivo (como literal)");
  assert.equal(corpo.split('replace("TYPE_"').length - 1, 1, "TYPE_ tirado uma vez");
  assert.ok(!/BOSSES\.filter\(/.test(corpo), "sem filtro de BOSSES a cada chamada");
});
