// Parte 2 de 5 de time_pelo_motor.test.mjs (dividido em 06/11/2026 para rodar em paralelo; ver tests/pesados.json).
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

test("mesma entrada, mesmo resultado (e a segunda rodada vem do cache, sem simular de novo)", () => {
  const outra = run();
  const r2 = outra.R.montarTimePeloMotor(outra.ctx, {});
  rodada.variantes.forEach((v, i) => {
    igual(nomesDe(r2.variantes[i]), nomesDe(v), v.chave);
    igual(r2.variantes[i].metricas, v.metricas, v.chave);
  });
  const falhas = base.ctx.cache.falhas;
  const r3 = base.R.montarTimePeloMotor(base.ctx, {});
  assert.equal(base.ctx.cache.falhas, falhas, "a segunda rodada não pode simular nada novo");
  igual(r3.variantes.map(nomesDe), rodada.variantes.map(nomesDe));
  // Tempo medido (relógio de parede, em ms): presente em cada variante e no total.
  assert.ok(Number.isFinite(rodada.tempoMs) && rodada.variantes.every((v) => Number.isFinite(v.tempoMs) && v.avaliacoes > 0));
});
