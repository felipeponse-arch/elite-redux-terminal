// Comparação Motor x IA (time-pelo-motor/01, Fase E): a leitura da resposta da IA e o juiz comum.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CASOS, montarRun, gerarPrompt, lerRespostaIA, timeDeMembros, metricasDoTime } from "../../scripts/comparar_motor_ia.mjs";

const caso = CASOS[0];
const { R, ctx } = montarRun(caso);
const { prompt, validSnames } = gerarPrompt(R, caso);

test("os 12 casos cobrem várias etapas, mono e favorito, e todo Pokémon do elenco existe", () => {
  assert.equal(CASOS.length, 12);
  assert.ok(new Set(CASOS.map((c) => c.etapa)).size >= 6);
  assert.ok(CASOS.filter((c) => c.monotype).length >= 2 && CASOS.some((c) => c.favoritos && c.favoritos.length));
  assert.ok(prompt.includes('{"team":["sname1","sname2",...],"reasoning":"..."}') && validSnames.every((s) => prompt.includes(s)));
});

test("lerRespostaIA usa a validação do app: descarta fora da lista e repetido, aceita cerca de código, recusa o inválido", () => {
  const a = validSnames[0], b = validSnames[1];
  const ok = lerRespostaIA(R, "```json\n" + JSON.stringify({ team: [a, "SPECIES_INVENTADO", a, b], reasoning: "x" }) + "\n```", validSnames);
  assert.ok(ok.ok);
  assert.deepEqual(ok.snames, [a, b]);
  assert.equal(ok.descartados, 2);
  // Resposta que não traz nenhuma espécie real = falha (a mesma regra do validar de generateTeamForArchetype).
  for (const ruim of ["não sei", "{\"team\":[\"SPECIES_INVENTADO\"]}", "{\"team\":\"x\"}", "{quebrado", ""]) assert.equal(lerRespostaIA(R, ruim, validSnames).ok, false, ruim);
});

test("juiz comum: a nota da luta no Motor é a mesma do avaliarTimePelaLutaCompleta (mesma luta, mesmos buffs)", () => {
  const cands = R.motorCandidatos(ctx, [], []);
  const time = timeDeMembros(R, cands, validSnames.slice(0, 3).map((sname) => ({ sname })));
  assert.equal(time.length, 3);
  const m = metricasDoTime(R, ctx, time);
  assert.equal(m.porLuta.length, 29);
  const luta = ctx.lutas.todas.find((l) => l.nome === "Roxanne 1");
  const boss = R.BOSSES.find((b) => b.name === luta.nome);
  const meus = time.map((c) => R.motorUnidade(ctx, c, luta.nivel));
  const direto = R.avaliarTimePelaLutaCompleta(meus, R.bossPartyPorDificuldade(boss), luta.nivel, { buffs: luta.buffs, campo: R.regraDeCampoDoChefao(luta.nome), dupla: luta.dupla });
  assert.equal(m.porLuta.find((l) => l.luta === "Roxanne 1").p, direto.nota);
  // Time da IA sem build avaliável não entra: fica de fora em vez de virar nota inventada.
  assert.equal(timeDeMembros(R, cands, [{ sname: "SPECIES_INEXISTENTE" }]).length, 0);
});
