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
const nomesDe = (v) => v.membros.map((m) => m.nome);

const base = run();
const rodada = base.R.montarTimePeloMotor(base.ctx, {});

test("o Modo Motor não chama a IA: o fonte não tem claude.use nem pedirIA", () => {
  const src = readFileSync(new URL("../../src/regras/time_pelo_motor.js", import.meta.url), "utf8");
  assert.doesNotMatch(src, /claude\.use|pedirIA/);
  // E roda inteiro no Node, onde nem existe `claude` (o carregador só tem src/regras).
  assert.equal(typeof base.R.claude, "undefined");
  assert.ok(rodada.variantes.length >= 2 && rodada.variantes.every((v) => v.membros.length === 6));
});

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

test("aceite (dívida 20): Centiskorch com Coil Up sai com Fire Fang, não com Fire Lash (top-1 contra o campo)", () => {
  const r = run({ milestone: 0, nomes: ["Centiskorch", "Scizor", "Klefki"] });
  const out = r.R.montarTimePeloMotor(r.ctx, { favoritos: [r.sp("Centiskorch").sname], variantes: ["ofensivo"] });
  const m = out.variantes[0].membros.find((x) => x.nome === "Centiskorch");
  assert.ok(m, "o favorito está no time");
  assert.equal(m.origem, "pipeline");
  assert.equal(m.build.ability, "Coil Up");
  assert.ok(m.build.moves.includes("Fire Fang"), JSON.stringify(m.build.moves));
  assert.ok(!m.build.moves.includes("Fire Lash"), JSON.stringify(m.build.moves));
});

test("risco 5: favoritos (1, 3 e 6) nunca saem; vagas livres são preenchidas; 6 favoritos = sem troca no plano B", () => {
  const sn = (n) => base.sp(n).sname;
  [["Ledian"], ["Ledian", "Klefki", "Gyarados"], ELENCO.slice(0, 6)].forEach((favs) => {
    const out = base.R.montarTimePeloMotor(base.ctx, { favoritos: favs.map(sn) });
    out.variantes.forEach((v) => {
      favs.forEach((f) => assert.ok(nomesDe(v).includes(f), f + " saiu em " + v.chave));
      assert.equal(v.membros.length, 6);
      assert.equal(v.membros.filter((m) => m.travado).length, favs.length);
      v.planoB.trocas.forEach((t) => assert.ok(!favs.includes(t.sai), "plano B tirou o favorito " + t.sai));
      assert.doesNotMatch(v.explicacao.join(" "), /tirar|retirar|remov|substitu/i, "nunca sugere tirar favorito");
    });
    if (favs.length < 6) {
      const trocas = out.variantes.flatMap((v) => v.planoB.trocas);
      assert.ok(trocas.length > 0, "com vaga livre o plano B acha troca medida (" + favs.length + " favoritos)");
      trocas.forEach((t) => assert.ok(t.vaga >= favs.length && !favs.includes(t.sai) && t.deltaPontos > 0, JSON.stringify(t)));
    }
    if (favs.length === 6) out.variantes.forEach((v) => {
      igual(v.planoB.trocas, []);
      assert.match(v.planoB.motivo, /favoritos/);
    });
  });
});

test("favorito da mesma linha evolutiva: nunca some em silêncio (está em membros ou em avisos, dizendo quem entrou)", () => {
  const r = run({ milestone: 2, nomes: ["Charmander", "Charizard", "Scizor", "Klefki", "Gyarados", "Metagross"] });
  const favs = ["Charmander", "Charizard", "Scizor"];
  const out = r.R.montarTimePeloMotor(r.ctx, { favoritos: favs.map((n) => r.sp(n).sname), variantes: ["ofensivo"] });
  const v = out.variantes[0];
  favs.forEach((n) => assert.ok(nomesDe(v).includes(n) || v.avisos.concat(out.avisos).some((a) => a.includes(n + " é favorito")), n + " sumiu sem aviso"));
  const fora = favs.filter((n) => !nomesDe(v).includes(n));
  assert.equal(fora.length, 1, "dois da mesma linha: só um entra");
  assert.ok(v.avisos.some((a) => a.includes(fora[0]) && /divide a linha evolutiva com (Charmander|Charizard)/.test(a)), v.avisos.join(" | "));
});

test("amostra fixa: todo nome existe em LUTAS_DA_RUN (nome errado some da amostra sem ninguém ver)", () => {
  const nomes = new Set(base.R.LUTAS_DA_RUN.map((p) => p[0]));
  base.R.MOTOR_AMOSTRA_DE_LUTAS.forEach((n) => assert.ok(nomes.has(n), n));
  assert.equal(base.R.MOTOR_AMOSTRA_DE_LUTAS.length, 10);
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

test("risco 6: Mega só depois da liberação; item não liberado na Etapa nunca entra; só Pokémon do jogador", () => {
  const cedo = run({ milestone: 0 }), tarde = run({ milestone: 4 });
  const cc = cedo.R.motorCandidatos(cedo.ctx, [], []), ct = tarde.R.motorCandidatos(tarde.ctx, [], []);
  assert.ok(cc.every((c) => c.sp.x === c.base.x), "sem Mega antes da 4ª insígnia");
  assert.ok(ct.some((c) => c.sp.x !== c.base.x), "com a Mega liberada ela aparece (o teste não é vazio)");
  // Pool: ninguém de fora do time e da caixa.
  const meus = new Set(cedo.R.xsDoJogador());
  assert.ok(cc.every((c) => meus.has(c.x)));
  // Item da build salva que a Etapa ainda não libera: o Modo Motor tira o item e avisa (nunca usa).
  const R = cedo.R, scizor = cedo.sp("Scizor");
  const tardio = R.ITEMS.find((i) => R.etapaDoItem(i) >= 5);
  R.state.customBuilds[scizor.sname] = [{ active: true, ability: "Technician", moves: ["Bullet Punch", "Swords Dance", "U-turn", "Roost"], item: tardio, nature: "Adamant", evs: [0, 252, 0, 0, 4, 252] }];
  const out = R.montarTimePeloMotor(cedo.ctx, { favoritos: [scizor.sname], variantes: ["ofensivo"] });
  const m = out.variantes[0].membros.find((x) => x.nome === "Scizor");
  assert.equal(m.origem, "build-salva");
  assert.equal(m.build.item, "");
  assert.ok(out.avisos.some((a) => a.includes(tardio)), "avisa do item");
  out.variantes[0].membros.forEach((x) => assert.ok(!x.build.item || R.liberadoNaRun(0, cedo.ctx.cap, { item: x.build.item }), x.nome + " " + x.build.item));
});

test("mono: todo candidato e todo membro tem o tipo da run", () => {
  const r = run({ nomes: ["Scizor", "Metagross", "Klefki", "Garchomp", "Gardevoir", "Ledian", "Ferrothorn"], mono: "Steel" });
  const out = r.R.montarTimePeloMotor(r.ctx, { variantes: ["ofensivo"] });
  assert.ok(out.variantes[0].membros.length >= 3);
  out.variantes[0].membros.forEach((m) => assert.ok(r.R.speciesTypeNames(r.R.getSpeciesByX(m.x)).includes("Steel") || r.R.speciesTypeNames(r.R.SPECIES.find((s) => s && s.sname === m.sname)).includes("Steel"), m.nome));
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

test("orçamento de tempo: estourar não quebra, devolve o melhor time achado e avisa", () => {
  const r = run();
  r.ctx.orcamentoMs = 1;
  const out = r.R.montarTimePeloMotor(r.ctx, { variantes: ["ofensivo"] });
  const v = out.variantes[0];
  assert.ok(v.membros.length >= 1);
  assert.ok(v.avisos.some((a) => /orçamento/.test(a)));
});

// ---- Fase F1: em passos e aquecido (a tela não trava; o tempo do caso comum fica abaixo de 10 s) ----
test("F1: o gerador cede a vez várias vezes, termina no mesmo time do síncrono e o aquecimento tira as builds da conta", () => {
  const { R, ctx } = run({ nomes: ELENCO });
  const aq = R.motorAquecerBuildsEmPassos(ctx);
  let passosAq = 0, r;
  while (!(r = aq.next()).done) passosAq++;
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
