// Parte 1 de 5 de time_pelo_motor.test.mjs (dividido em 06/11/2026 para rodar em paralelo; ver tests/pesados.json).
// Modo Motor do Meu Time, Fase C (ticket time-pelo-motor/01, 21/10/2026): montar o time SEM IA, só pelo simulador.
// Dado real (espécies, lutas e níveis da run); nada de valor à mão. Cada teste cobre um risco da §3 do ticket.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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


// ---- Fase F1: em passos e aquecido (a tela não trava; o tempo do caso comum fica abaixo de 10 s) ----
const base = run();
const rodada = base.R.montarTimePeloMotor(base.ctx, {});

test("orçamento de tempo: estourar não quebra, devolve o melhor time achado e avisa", () => {
  const r = run();
  r.ctx.orcamentoMs = 1;
  const out = r.R.montarTimePeloMotor(r.ctx, { variantes: ["ofensivo"] });
  const v = out.variantes[0];
  assert.ok(v.membros.length >= 1);
  assert.ok(v.avisos.some((a) => /orçamento/.test(a)));
});

test("risco 3: as variantes têm objetivos de verdade (a mesma régua ordena dois times reais em sentidos opostos)", () => {
  const { R, ctx } = base;
  const cands = R.motorCandidatos(ctx, [], []);
  let semente = 7; // gerador fixo: nada de sorteio de verdade
  const rnd = () => (semente = (semente * 1103515245 + 12345) % 2147483648) / 2147483648;
  const times = [];
  for (let i = 0; i < 60; i++) {
    const pool = cands.slice(), t = [];
    while (t.length < 6 && pool.length) {
      const c = pool.splice(Math.floor(rnd() * pool.length), 1)[0];
      if (!t.some((m) => m.linha === c.linha)) t.push(c);
    }
    times.push(t);
  }
  const O = R.MOTOR_OBJETIVOS;
  const nota = times.map((t) => { const rs = R.motorAvaliar(ctx, t, ctx.lutas.amostra); return { o: O.ofensivo.valor(rs, t.length), s: O.seguro.valor(rs, t.length) }; });
  const inverte = nota.some((a) => nota.some((b) => a.o > b.o + 0.02 && b.s > a.s + 0.02));
  assert.ok(inverte, "ofensivo e seguro precisam discordar em algum par de times reais");
  assert.notEqual(O.ofensivo.descricao, O.seguro.descricao);
  // Régua comum: todas as variantes trazem as mesmas métricas, medidas nas mesmas lutas.
  const chaves = (v) => Object.keys(v.metricas.restantes).sort().join();
  assert.equal(new Set(rodada.variantes.map(chaves)).size, 1);
  assert.equal(new Set(rodada.variantes.map((v) => v.metricas.completo.lutas)).size, 1);
});

test("favorito fraco: mostra a melhor tentativa com a métrica (vence X de Y), sem esconder o resultado", () => {
  const r = run({ milestone: 4, nomes: ["Ledian", "Klefki", "Togekiss", "Centiskorch", "Gardevoir", "Gyarados"] });
  const out = r.R.montarTimePeloMotor(r.ctx, { favoritos: ["Ledian", "Klefki", "Togekiss", "Centiskorch", "Gardevoir", "Gyarados"].map((n) => r.sp(n).sname), variantes: ["ofensivo"] });
  const v = out.variantes[0];
  assert.equal(v.membros.length, 6);
  assert.ok(v.metricas.restantes.vence < v.metricas.restantes.lutas, "esse time não vence tudo");
  assert.equal(v.melhorTentativa, v.metricas.restantes.vence < v.metricas.restantes.lutas / 2);
  assert.match(v.explicacao.join(" "), new RegExp("vence " + v.metricas.restantes.vence + ","));
});

test("risco 7: a luta usa os buffs do líder (mesmos ids de buffsAtivosDoChefao) e eles mudam o resultado", () => {
  const { R, ctx } = base;
  const luta = R.motorMontarLuta("Flannery 1", 3);
  const ids = R.buffsAtivosDoChefao("Flannery 1");
  assert.ok(ids.length > 0, "a Flannery tem buffs de ginásio");
  igual(luta.buffs, ids);
  assert.ok(luta.inicio, "hazards e status dos buffs entram no início da luta");
  const time = R.motorCandidatos(ctx, [], []).filter((c, i, a) => a.findIndex((d) => d.linha === c.linha) === i).slice(0, 6);
  const com = R.motorSimular(ctx, time, luta);
  const sem = R.motorSimular(ctx, time, Object.assign({}, luta, { buffs: [], inicio: null, chave: luta.chave + "|sem-buffs" }));
  assert.ok(com.p !== sem.p || com.d !== sem.d, "os buffs do líder precisam mexer na luta");
});

test("o Modo Motor não chama a IA: o fonte não tem claude.use nem pedirIA", () => {
  const src = readFileSync(new URL("../../src/regras/time_pelo_motor.js", import.meta.url), "utf8");
  assert.doesNotMatch(src, /claude\.use|pedirIA/);
  // E roda inteiro no Node, onde nem existe `claude` (o carregador só tem src/regras).
  assert.equal(typeof base.R.claude, "undefined");
  assert.ok(rodada.variantes.length >= 2 && rodada.variantes.every((v) => v.membros.length === 6));
});

test("risco 8 (Fase D): todo papel e toda tag carregam a prova medida; quem não prova nada fica com a abstenção", () => {
  rodada.variantes.forEach((v) => {
    v.membros.forEach((m) => {
      m.papeis.forEach((p) => assert.ok(p.prova && Object.keys(p.prova).length > 0, m.nome + " " + p.papel));
      assert.equal(m.papeis.length === 0, typeof m.abstencao === "string", m.nome);
    });
    v.tags.filter((t) => t.armador).forEach((t) => assert.ok(t.beneficiarios.length >= 2 && t.ganhoDoTime > 0, v.chave + " " + t.tag));
    // Proteção da Fase C: o texto nunca afirma papel nem tag sem o correspondente medido.
    const PAPEIS = ["wallbreaker", "sweeper", "revenge killer", "tanque", "armador", "suporte", "pivô"];
    v.membros.forEach((m) => {
      const linha = v.explicacao.find((x) => x.startsWith(m.nome + ":")) || "";
      const citados = PAPEIS.filter((p) => new RegExp("(^|[ ;(])" + p + " \\(").test(linha));
      assert.equal(JSON.stringify(citados.sort()), JSON.stringify(m.papeis.map((p) => p.papel).sort()), v.chave + " " + m.nome);
    });
    const tagsNoTexto = v.explicacao.filter((x) => /^Tag /.test(x)).map((x) => x.slice(4, x.indexOf(":", x.indexOf(":") + 1)));
    assert.equal(JSON.stringify(tagsNoTexto), JSON.stringify(v.tags.map((g) => g.tag)), v.chave);
  });
});

test("amostra fixa: todo nome existe em LUTAS_DA_RUN (nome errado some da amostra sem ninguém ver)", () => {
  const nomes = new Set(base.R.LUTAS_DA_RUN.map((p) => p[0]));
  base.R.MOTOR_AMOSTRA_DE_LUTAS.forEach((n) => assert.ok(nomes.has(n), n));
  assert.equal(base.R.MOTOR_AMOSTRA_DE_LUTAS.length, 10);
});
