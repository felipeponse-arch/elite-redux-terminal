// Meu Time na mesma régua do rank (ticket todas-as-lutas/02, 21/10/2026): o juiz do Modo Motor pesa as lutas COMUNS mais perigosas de cada
// etapa (data/lutas_comuns_run.json, pré-calculado pelo rank) com a fatia do rank (chefões 60%, comuns 40%), sem simular as 538 ao vivo.
// Dado real: espécies, builds e lutas da run; nenhum valor à mão.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { carregarRegras } from "./carregar_regras.mjs";

const ELENCO = ["Centiskorch", "Scizor", "Garchomp", "Metagross", "Grimmsnarl", "Togekiss", "Klefki", "Gardevoir", "Ledian", "Gyarados"];
function run({ milestone = 2, antes = () => {} } = {}) {
  const R = carregarRegras({ milestone });
  antes(R);
  const sp = (n) => R.SPECIES.find((s) => s && s.n === n);
  R.state.team = ELENCO.slice(0, 6).map((n) => sp(n).x);
  R.state.box = ELENCO.slice(6).map((n) => sp(n).x);
  const ctx = R.contextoDoMotor();
  ctx.cache = R.criarCacheDoMotor();
  return { R, ctx };
}
const dado = JSON.parse(readFileSync(new URL("../../data/lutas_comuns_run.json", import.meta.url), "utf8"));
const base = run();

test("o arquivo do rank: até 30 comuns por etapa, as 9 etapas (a 4 também), cada luta com time, sem chefão", () => {
  assert.equal(dado.fatia, 0.6);
  assert.equal(dado.porEtapa, 30);
  const chefoes = new Set(base.R.LUTAS_DA_RUN.map((p) => p[0]));
  for (const tier of ["party", "insane"]) {
    const porEtapa = {};
    dado.lutas[tier].forEach((l) => {
      porEtapa[l.etapa] = (porEtapa[l.etapa] || 0) + 1;
      assert.ok(dado.times[l.nome] && dado.times[l.nome].party.length > 0, "sem time: " + l.nome);
      assert.ok(!chefoes.has(l.nome), "chefão na lista de comuns: " + l.nome);
      assert.ok(Number.isFinite(l.peso) && l.peso > 0 && l.peso < 1, "peso de ameaça: " + l.nome + " " + l.peso);
    });
    assert.deepEqual(Object.keys(porEtapa).map(Number).sort((a, b) => a - b), [0, 1, 2, 3, 4, 5, 6, 7, 8], tier);
    assert.ok(Object.values(porEtapa).every((n) => n <= 30), tier + " " + JSON.stringify(porEtapa));
  }
});

test("o contexto: comuns só da dificuldade e das etapas que faltam; a amostra espaça as mais perigosas de cada etapa", () => {
  const c = base.ctx.lutas.comuns;
  assert.equal(c.fatia, 0.6);
  assert.ok(c.todas.length > 200 && c.restantes.length > 100 && c.restantes.every((l) => l.etapa >= 2));
  assert.ok(c.amostra.length >= 1 && c.amostra.length <= 3, "amostra: " + c.amostra.length);
  assert.ok(c.amostra.every((l) => l.etapa >= 2));
  // Cada uma da amostra é a mais perigosa da sua etapa (o rank mede a ameaça, o motor só lê).
  c.amostra.forEach((l) => {
    const mesmaEtapa = c.restantes.filter((x) => x.etapa === l.etapa);
    assert.ok(mesmaEtapa.every((x) => x.peso <= l.peso + 1e-12), l.nome + " não é a mais perigosa da etapa " + l.etapa);
  });
  assert.ok(c.conferencia.length > c.amostra.length && c.conferencia.length <= 3 * 7, "conferência: " + c.conferencia.length);
  // Elite usa a lista do Insane (outros times e outros pesos).
  const elite = run({ antes: (R) => { R.state.settings.difficulty = "elite"; } }).ctx.lutas.comuns;
  assert.notEqual(elite.todas.map((l) => l.nome).join("|"), c.todas.map((l) => l.nome).join("|"));
});

test("a fatia vale 60/40: o valor do juiz é 0,6 x chefões + 0,4 x comuns, com as simulações de verdade", () => {
  const { R, ctx } = base;
  const cands = R.motorCandidatos(ctx, [], []);
  const time = cands.filter((c, i, a) => a.findIndex((x) => x.linha === c.linha) === i).slice(0, 6);
  const O = R.MOTOR_OBJETIVOS.seguro;
  const vB = O.valor(R.motorAvaliar(ctx, time, ctx.lutas.amostra), time.length, time, ctx);
  const vC = O.valor(R.motorAvaliar(ctx, time, ctx.lutas.comuns.amostra), time.length, time, ctx);
  assert.ok(Math.abs(vB - vC) > 0.01, "os dois lados precisam diferir para a conta provar algo: " + vB + " x " + vC);
  assert.ok(Math.abs(R.motorValorDoObjetivo(ctx, O, time) - (0.6 * vB + 0.4 * vC)) < 1e-12);
});

test("as comuns mudam a decisão: há pares de times reais que o juiz só dos chefões ordena ao contrário do juiz com a fatia", () => {
  const { R, ctx } = base;
  const cands = R.motorCandidatos(ctx, [], []);
  let semente = 11; // gerador fixo: nada de sorteio de verdade
  const rnd = () => (semente = (semente * 1103515245 + 12345) % 2147483648) / 2147483648;
  const O = R.MOTOR_OBJETIVOS.seguro, medidos = [];
  for (let i = 0; i < 30; i++) {
    const pool = cands.slice(), t = [];
    while (t.length < 6 && pool.length) {
      const c = pool.splice(Math.floor(rnd() * pool.length), 1)[0];
      if (!t.some((m) => m.linha === c.linha)) t.push(c);
    }
    medidos.push({ b: O.valor(R.motorAvaliar(ctx, t, ctx.lutas.amostra), t.length, t, ctx), f: R.motorValorDoObjetivo(ctx, O, t) });
  }
  let invertidos = 0;
  medidos.forEach((a) => medidos.forEach((b) => { if (a.b > b.b + 0.02 && b.f > a.f + 0.02) invertidos++; }));
  assert.ok(invertidos > 0, "sem nenhum par invertido a fatia não mudaria nada no Meu Time");
});

test("sem o arquivo das comuns o juiz é só dos chefões (como antes), e a montagem real traz a conferência das comuns", () => {
  const sem = run({ antes: (R) => { R.LUTAS_COMUNS_RUN = null; } });
  assert.equal(sem.ctx.lutas.comuns.amostra.length, 0);
  const cands = sem.R.motorCandidatos(sem.ctx, [], []);
  const time = cands.slice(0, 3), O = sem.R.MOTOR_OBJETIVOS.ofensivo;
  assert.equal(sem.R.motorValorDoObjetivo(sem.ctx, O, time), O.valor(sem.R.motorAvaliar(sem.ctx, time, sem.ctx.lutas.amostra), 3, time, sem.ctx));

  const r = base.R.montarTimePeloMotor(base.ctx, { variantes: ["seguro"] });
  const v = r.variantes[0];
  assert.equal(v.membros.length, 6);
  assert.ok(v.metricas.comuns && v.metricas.comuns.lutas >= 10 && v.metricas.comuns.vence <= v.metricas.comuns.lutas, JSON.stringify(v.metricas.comuns));
  const time6 = v.membros.map((m) => base.R.motorCandidatos(base.ctx, [], []).find((c) => c.sname === m.sname));
  assert.ok(Math.abs(v.metricas.objetivo - Math.round(base.R.motorValorDoObjetivo(base.ctx, base.R.MOTOR_OBJETIVOS.seguro, time6) * 1e4) / 1e4) < 1e-9,
    "a métrica do objetivo é a da fatia");
});
