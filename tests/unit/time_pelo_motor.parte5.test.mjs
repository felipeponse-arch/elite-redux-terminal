// Parte 5 de 5 de time_pelo_motor.test.mjs (dividido em 06/11/2026 para rodar em paralelo; ver tests/pesados.json).
// Modo Motor do Meu Time, Fase C (ticket time-pelo-motor/01, 21/10/2026): montar o time SEM IA, só pelo simulador.
// Dado real (espécies, lutas e níveis da run); nada de valor à mão. Cada teste cobre um risco da §3 do ticket.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const ELENCO = ["Centiskorch", "Scizor", "Garchomp", "Metagross", "Grimmsnarl", "Togekiss", "Klefki", "Gardevoir", "Ledian", "Gyarados"];

// Run nova: o elenco vai 6 no time e o resto na caixa. O cache é compartilhado dentro do arquivo (as builds do pipeline custam ~0,6 s).
function run({ milestone = 2, nomes = ELENCO, mono = null, megaMode = "temporaria" } = {}) {
  const R = carregarRegras({ milestone, megaMode });
  const sp = (n) => R.SPECIES.find((s) => s && s.n === n);
  R.state.team = nomes.slice(0, 6).map((n) => sp(n).x);
  R.state.box = nomes.slice(6).map((n) => sp(n).x);
  R.state.archetype.monotype = mono;
  const ctx = R.contextoDoMotor();
  ctx.cache = R.criarCacheDoMotor();
  return { R, sp, ctx };
}
// Objetos do vm vêm de outro realm: compara pelo JSON.
const igual = (a, b, msg) => assert.equal(JSON.stringify(a), JSON.stringify(b), msg);
const nomesDe = (v) => v.membros.map((m) => m.nome);


// ---- Fase F1: em passos e aquecido (a tela não trava; o tempo do caso comum fica abaixo de 10 s) ----
const base = run();
const rodada = base.R.montarTimePeloMotor(base.ctx, {});

test("F1: o gerador cede a vez várias vezes, termina no mesmo time do síncrono e o aquecimento tira as builds da conta", () => {
  const { R, ctx } = run({ nomes: ELENCO });
  const aq = R.motorAquecerBuildsEmPassos(ctx);
  let passosAq = 0, r;
  while (!aq.next().done) passosAq++;
  assert.ok(passosAq >= 10, "uma cedida de vez por build calculada (pool de 10): " + passosAq);
  const falhasBuilds = Object.keys(ctx.cache.build).length;
  assert.ok(falhasBuilds >= 10, "as builds top-1 ficaram no cache");
  const g = R.montarTimePeloMotorEmPassos(ctx, {});
  let passos = 0, nomesPassos = {};
  while (!(r = g.next()).done) { passos++; nomesPassos[r.value] = true; }
  assert.ok(passos >= 40 && nomesPassos.vaga && nomesPassos.solo && nomesPassos.variante, "cede entre as avaliações da busca: " + passos);
  assert.equal(Object.keys(ctx.cache.build).length, falhasBuilds, "aquecido: a montagem não calcula nenhuma build nova");
  igual(r.value.variantes.map(nomesDe), rodada.variantes.map(nomesDe), "mesmo resultado do caminho síncrono");
});

test("uma espécie por linha evolutiva (Charmander, Charmeleon e Charizard no mesmo elenco: só um entra)", () => {
  const r = run({ milestone: 2, nomes: ["Charmander", "Charmeleon", "Charizard", "Scizor", "Klefki", "Gyarados", "Metagross"] });
  const nomeDaRaiz = (n) => r.R.getSpeciesByX(r.R.motorRaizDaLinha(r.sp(n).x)).n;
  assert.equal(nomeDaRaiz("Charizard"), "Charmander");
  assert.equal(nomeDaRaiz("Charmeleon"), "Charmander");
  assert.equal(nomeDaRaiz("Gyarados"), "Magikarp");
  // O filtro tem trabalho a fazer: os três viram candidatos distintos (x diferentes) da MESMA linha.
  const cands = r.R.motorCandidatos(r.ctx, [], []).filter((c) => ["Charmander", "Charmeleon", "Charizard"].includes(c.base.n));
  assert.ok(new Set(cands.map((c) => c.x)).size === 3 && new Set(cands.map((c) => c.linha)).size === 1);
  const out = r.R.montarTimePeloMotor(r.ctx, { variantes: ["ofensivo", "seguro"] });
  out.variantes.forEach((v) => {
    assert.ok(v.membros.filter((m) => ["Charmander", "Charmeleon", "Charizard"].includes(r.R.getSpeciesByX(m.x).n)).length <= 1);
    const linhas = v.membros.map((m) => r.R.motorRaizDaLinha(m.x));
    assert.equal(new Set(linhas).size, linhas.length, nomesDe(v).join());
  });
});

test("amostra: só lutas da Etapa atual em diante, no mínimo 3, e função só da Etapa (sem sorteio)", () => {
  [0, 3, 6, 8].forEach((m) => {
    const r = run({ milestone: m, nomes: ["Scizor", "Klefki"] });
    const a = r.ctx.lutas.amostra;
    assert.ok(a.length >= 3, "etapa " + m + ": " + a.length);
    assert.ok(a.every((l) => l.etapa >= m) || a.length === 3, "etapa " + m);
    igual(a.map((l) => l.nome), run({ milestone: m, nomes: ["Scizor"] }).ctx.lutas.amostra.map((l) => l.nome));
  });
  assert.equal(base.ctx.lutas.todas.length, 29);
});
