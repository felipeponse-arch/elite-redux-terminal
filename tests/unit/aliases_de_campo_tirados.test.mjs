// TK-33b item 8: os aliases de migração CONDICAO_DO_ARQUETIPO e WEATHER_ARCHETYPES saíram; todos leem campo.js direto.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras, lerComMutacao } from "./carregar_regras.mjs";

const R = carregarRegras();

test("os aliases não existem mais e os nomes de campo.js têm o conteúdo que eles tinham", () => {
  assert.equal(R.CONDICAO_DO_ARQUETIPO, undefined);
  assert.equal(R.WEATHER_ARCHETYPES, undefined);
  assert.equal(R.ARQUETIPOS_DE_CAMPO.length, 11);
  assert.equal(Object.keys(R.CONDICAO_DO_ARQUETIPO_CAMPO).length, 10); // 9 + Psychic Terrain (TK-33a, comitê 29/10)
});

test("os consumidores citam o nome de campo.js (e ninguém cita o alias)", () => {
  const arquivos = [["src/regras/condicoes_habilidade.js", "condicoes_habilidade.js"], ["src/regras/save.js", "save.js"], ["src/ui/arquetipo.js", "arquetipo.js"], ["src/regras/dados_base.js", "dados_base.js"]];
  arquivos.forEach(([caminho, nome]) => {
    const t = lerComMutacao(caminho, nome);
    assert.ok(!/\bWEATHER_ARCHETYPES\b/.test(t) && !/\bCONDICAO_DO_ARQUETIPO\b/.test(t), caminho);
  });
});
