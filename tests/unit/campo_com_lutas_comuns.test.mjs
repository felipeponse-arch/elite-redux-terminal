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

test("Excadrill na Etapa 8: com as comuns a build do campo troca Mold Breaker por Tough Claws (sem elas era Mold Breaker)", () => {
  R.LUTAS_COMUNS_RUN = null;
  const sem = campo(excadrill).candidatos[0].build;
  R.LUTAS_COMUNS_RUN = comuns;
  const com = campo(excadrill).candidatos[0].build;
  assert.equal(sem.ability, "Mold Breaker");
  assert.equal(com.ability, "Tough Claws");
});

test("sem o arquivo das comuns o alvo campo volta a medir só chefões", () => {
  R.LUTAS_COMUNS_RUN = null;
  const a = R.pipelineResolverAlvo({ campo: true });
  R.LUTAS_COMUNS_RUN = comuns;
  assert.equal(a.pesosComuns.length, 0);
  assert.equal(a.foes.length, a.nChefoes);
});
