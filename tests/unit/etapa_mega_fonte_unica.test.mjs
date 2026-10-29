// TK-33b item 6: a Etapa/líder da Mega nos textos vem de data/pedras_etapa.json (quandoVale + lideres),
// não de texto fixo em formas_mega.js, prompts_ia.js e mono_run.js.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 0 });
const et = R.PEDRAS_ETAPA.quandoVale.etapa;
const lider = R.PEDRAS_ETAPA.lideres[et];
const rotulo = "Etapa " + et + " (" + lider + ")";

test("rótulos de Etapa da Mega: cada Etapa de lideres vira 'Etapa n (líder)'", () => {
  assert.ok(lider, "a Etapa da Mega tem líder no JSON");
  assert.equal(Object.keys(R.PEDRAS_ETAPA.lideres).length, 4);
  Object.keys(R.PEDRAS_ETAPA.lideres).forEach((n) => {
    assert.equal(R.ROTULO_ETAPA_MEGA[n], "Etapa " + n + " (" + R.PEDRAS_ETAPA.lideres[n] + ")");
  });
});

test("aviso 'Mega ainda indisponível' (por espécie e no prompt de time) usa a Etapa do JSON", () => {
  const absol = R.getSpeciesBySname("SPECIES_ABSOL");
  const porEspecie = R.megaPromptBlock(absol);
  assert.ok(porEspecie.includes("depois da " + rotulo + " e agora NAO"), porEspecie);
  assert.ok(!/4a insignia/.test(porEspecie));
  const time = R.montarPromptTimeArquetipo([absol], null, null, null);
  assert.ok(time.includes("depois da " + rotulo + ". NAO sugira"), "prompt de time");
  assert.ok(!/4a insignia/.test(time));
});

test("loja de iniciais cita o líder da Etapa da Mega vindo do JSON", () => {
  const txt = R.compraDeInicialTexto(R.getSpeciesBySname("SPECIES_SQUIRTLE"));
  assert.equal(txt, "Loja de iniciais: depois de vencer a " + lider + ", por 15 BP no mercado de Slateport.");
});

test("trocando o líder no JSON, os textos de Mega acompanham (prova que nada é texto fixo)", () => {
  const salvo = { a: process.env.MUTACAO_ARQUIVO, d: process.env.MUTACAO_DE, p: process.env.MUTACAO_PARA };
  process.env.MUTACAO_ARQUIVO = "pedras_etapa.json";
  process.env.MUTACAO_DE = '"4": "Flannery"';
  process.env.MUTACAO_PARA = '"4": "Zzz"';
  let R2;
  try { R2 = carregarRegras({ milestone: 0 }); } finally {
    for (const [k, v] of [["MUTACAO_ARQUIVO", salvo.a], ["MUTACAO_DE", salvo.d], ["MUTACAO_PARA", salvo.p]]) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  }
  const absol = R2.getSpeciesBySname("SPECIES_ABSOL");
  assert.ok(R2.megaPromptBlock(absol).includes("Etapa 4 (Zzz)"), "formas_mega.js");
  assert.ok(R2.montarPromptTimeArquetipo([absol], null, null, null).includes("Etapa 4 (Zzz)"), "prompts_ia.js");
});

test("loja de iniciais acompanha o líder do JSON em memória (cache zerado)", () => {
  const antes = R.PEDRAS_ETAPA.lideres[et];
  R.PEDRAS_ETAPA.lideres[et] = "Zzz";
  R.compraDeInicialCache = null;
  try { assert.ok(R.compraDeInicialTexto(R.getSpeciesBySname("SPECIES_SQUIRTLE")).includes("vencer a Zzz,")); } finally { R.PEDRAS_ETAPA.lideres[et] = antes; R.compraDeInicialCache = null; }
});
