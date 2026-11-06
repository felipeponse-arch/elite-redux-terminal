// TK-33b item 6: a Etapa/líder da Mega nos textos vem de data/pedras_etapa.json (quandoVale + lideres),
// não de texto fixo em formas_mega.js, prompts_ia.js e mono_run.js.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 0 });
const et = R.PEDRAS_ETAPA.quandoVale.etapa;
const lider = R.PEDRAS_ETAPA.lideres[et];

test("rótulos de Etapa da Mega: cada Etapa de lideres vira 'Etapa n (líder)'", () => {
  assert.ok(lider, "a Etapa da Mega tem líder no JSON");
  assert.equal(Object.keys(R.PEDRAS_ETAPA.lideres).length, 4);
  Object.keys(R.PEDRAS_ETAPA.lideres).forEach((n) => {
    assert.equal(R.ROTULO_ETAPA_MEGA[n], "Etapa " + n + " (" + R.PEDRAS_ETAPA.lideres[n] + ")");
  });
});

test("loja de iniciais cita o líder da Etapa da Mega vindo do JSON", () => {
  const txt = R.compraDeInicialTexto(R.getSpeciesBySname("SPECIES_SQUIRTLE"));
  assert.equal(txt, "Loja de iniciais: depois de vencer a " + lider + ", por 15 BP no mercado de Slateport.");
});

test("loja de iniciais acompanha o líder do JSON em memória (cache zerado)", () => {
  const antes = R.PEDRAS_ETAPA.lideres[et];
  R.PEDRAS_ETAPA.lideres[et] = "Zzz";
  R.compraDeInicialCache = null;
  try { assert.ok(R.compraDeInicialTexto(R.getSpeciesBySname("SPECIES_SQUIRTLE")).includes("vencer a Zzz,")); } finally { R.PEDRAS_ETAPA.lideres[et] = antes; R.compraDeInicialCache = null; }
});
