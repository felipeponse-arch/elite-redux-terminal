// Depende de dado: rank/lutas (muda quando o rank é recalculado; não é regra de jogo fixa).
// todas-as-lutas/03: o alvo { campo: true } mede também as lutas comuns (mesma fatia 60/40 do rank, vinda de data/lutas_comuns_run.json).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 8 });
const comuns = R.LUTAS_COMUNS_RUN;
const campo = (sp) => R.candidatosDeBuild(sp, { alvo: { campo: true } });
const excadrill = R.SPECIES.find((s) => s && s.n === "Excadrill");

test("o alvo campo traz chefões e comuns, e a fatia é a do arquivo do rank", () => {
  const a = R.pipelineResolverAlvo({ campo: true });
  assert.ok(a.nChefoes > 0 && a.pesosComuns.length > 0, "sem comuns no alvo");
  assert.equal(a.foes.length, a.nChefoes + a.pesosComuns.length);
  assert.equal(a.fatia, comuns.fatia);
});

test("Excadrill na Etapa 8: com 3 comuns por etapa a build do campo não muda (Mold Breaker, golpes iguais aos de só chefões)", () => {
  R.LUTAS_COMUNS_RUN = null;
  const sem = campo(excadrill).candidatos[0].build;
  R.LUTAS_COMUNS_RUN = comuns;
  const com = campo(excadrill).candidatos[0].build;
  assert.equal(sem.ability, "Mold Breaker");
  assert.equal(com.ability, "Mold Breaker");
  assert.deepEqual(com.moves, sem.moves);
});

test("sem o arquivo das comuns o alvo campo volta a medir só chefões", () => {
  R.LUTAS_COMUNS_RUN = null;
  const a = R.pipelineResolverAlvo({ campo: true });
  R.LUTAS_COMUNS_RUN = comuns;
  assert.equal(a.pesosComuns.length, 0);
  assert.equal(a.foes.length, a.nChefoes);
});

test("número: fracMedia = 0,6 x pior chefão + 0,4 x média das comuns ponderada pela ameaça", () => {
  const linha = (frac) => ({ frac, n: 3, primeiro: true, extra: 0, primeiroMult: 1, porQue: "velocidade" });
  const tabela = { Golpe: { g: { nome: "Golpe" }, linhas: [linha(0.9), linha(0.5), linha(1.0), linha(0.2)] } };
  const alvo = { foes: [{}, {}, {}, {}], nChefoes: 2, pesosComuns: [3, 1], fatia: 0.6 };
  const r = R.pipelineAvaliarConjunto(tabela, ["Golpe"], [], alvo);
  // pior chefão 0,5; comuns (3x1,0 + 1x0,2)/4 = 0,8 -> 0,6x0,5 + 0,4x0,8 = 0,62
  assert.ok(Math.abs(r.fracMedia - 0.62) < 1e-9, "fracMedia = " + r.fracMedia);
});

test("o campo usa 3 comuns por etapa", () => {
  const a = R.pipelineResolverAlvo({ campo: true });
  const etapas = new Set(comuns.lutas.party.map((c) => c.etapa));
  assert.ok(a.pesosComuns.length > 3 && a.pesosComuns.length <= 3 * etapas.size, "comuns = " + a.pesosComuns.length);
});
