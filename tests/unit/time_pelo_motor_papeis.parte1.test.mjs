// Parte 1 de 4 de time_pelo_motor_papeis.test.mjs (dividido em 06/11/2026 para rodar em paralelo; ver tests/pesados.json).
// Modo Motor do Meu Time, Fase D (ticket time-pelo-motor/01, 21/10/2026): papéis por build, tags, sinergia e explicação.
// Dado real (espécies, lutas e níveis da run). Cada papel tem um caso real em que a prova fecha e um em que ela NÃO fecha
// (o golpe está na build mas o simulador não mostra o efeito). Teste que protege comportamento não se afrouxa para passar.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";


// Run com o elenco dado (6 no time, o resto na caixa) e builds salvas opcionais: { nome: [habilidade, golpes, natureza, evs] }.
// `comFatia`: false (padrão) liga o juiz só dos chefões, o das Fases C e D, onde estes casos foram escolhidos (os elencos e as lutas aqui são
// fixados à mão). O juiz com as lutas comuns (todas-as-lutas/02, fatia 60/40) muda QUEM o Modo Motor escolhe, não o que um papel ou uma tag
// exige como prova; a fatia tem os testes dela em time_pelo_motor_comuns.test.mjs e o último teste deste arquivo confere que a tag de clima
// continua com prova no juiz com a fatia.
function run({ milestone = 2, nomes, builds = {}, comFatia = false }) {
  const R = carregarRegras({ milestone });
  if (!comFatia) R.LUTAS_COMUNS_RUN = null;
  const sp = (n) => R.SPECIES.find((s) => s && s.n === n);
  nomes.forEach((n) => assert.ok(sp(n), "espécie inexistente: " + n));
  R.state.team = nomes.slice(0, 6).map((n) => sp(n).x);
  R.state.box = nomes.slice(6).map((n) => sp(n).x);
  Object.keys(builds).forEach((n) => {
    const [ability, moves, nature, evs] = builds[n];
    R.state.customBuilds[sp(n).sname] = [{ active: true, ability, moves, item: "", nature, evs }];
  });
  const ctx = R.contextoDoMotor();
  ctx.cache = R.criarCacheDoMotor();
  ctx.fecharItens = false; // motor-item/01: o fechamento de item muda o time escolhido; estes casos fixam o papel no time SEM item (aprendizados 21/10); com item: motor_item.test.mjs
  const cand = (travados) => R.motorCandidatos(ctx, travados.map((n) => sp(n).sname), []);
  const usaLutas = (...nomesDasLutas) => {
    ctx.lutas = Object.assign({}, ctx.lutas, { amostra: nomesDasLutas.map((n) => ctx.lutas.todas.find((l) => l.nome === n)) });
    nomesDasLutas.forEach((n, i) => assert.ok(ctx.lutas.amostra[i], "luta inexistente: " + n));
  };
  return { R, sp, ctx, cand, usaLutas };
}

// ---------- papéis: prova fecha ----------
const SUPORTES = {
  Whimsicott: ["Prankster", ["Tailwind", "Moonblast", "Energy Ball", "Encore"], "Timid", [0, 0, 0, 252, 4, 252]],
  Hatterene: ["Magic Bounce", ["Trick Room", "Dazzling Gleam", "Psychic", "Mystical Fire"], "Quiet", [252, 0, 0, 252, 4, 0]]
};

// ---------- tags e a 3ª variante ----------
const POOL_CLIMA = ["Politoed", "Ludicolo", "Kingdra", "Swampert", "Floatzel", "Gyarados", "Scizor", "Garchomp", "Metagross", "Togekiss", "Pelipper", "Torkoal", "Charizard", "Venusaur", "Lilligant"];
// As 3 variantes usam um pool sem Politoed/Pelipper/Charizard: com a precisão corrigida (mecanica-01: Skill Link/Pinnacle Blade deixaram de "sempre acertar"; Plasma Lamp x1,2),
// a chuva do Politoed passou a render mais que o sol no pool completo e a sinergia escolhe a chuva. Aqui o sol é a única armação (Charizard seria o 2º beneficiário do sol e tira o Togekiss).
// ---------- explicação, legado e tempo ----------
// Sol e chuva são a mesma sinergia, medida da mesma forma, cada uma no pool do seu tipo de beneficiário (regra do usuário, 22/10/2026):
// nadadores de chuva perdem no sol e poluem a medida do sol, e vice-versa. Com a fatia, as duas precisam sair com prova medida.
const SOL_POOL = ["Torkoal", "Lilligant", "Venusaur", "Charizard", "Togekiss", "Scizor"];
const CHUVA_POOL = ["Politoed", "Pelipper", "Kingdra", "Floatzel", "Ludicolo", "Swampert", "Gyarados", "Scizor"];
// Lutas de prova: no máximo 5 (teste rápido); escolhidas onde o clima muda o resultado do time (medido 22/10: sol Norman 1 4 vs 3, Archie 13,7 vs 5; chuva Wattson 1 5,23 vs 4, Glacia 1,46 vs 0,44).
[["clima: sol", "Torkoal", SOL_POOL, ["Norman 1", "Archie"]], ["clima: chuva", "Politoed", CHUVA_POOL, ["Wattson 1", "Glacia"]]].forEach(([nomeTag, armador, pool, lutas]) => {
  test("com a fatia 60/40 a sinergia de " + nomeTag + " continua com a prova medida (armador + dois beneficiários + ganho do time)", () => {
    const r = run({ milestone: 3, nomes: pool, comFatia: true });
    r.usaLutas(...lutas);
    assert.ok(r.ctx.lutas.comuns.amostra.length > 0, "o juiz com a fatia precisa ter comuns na amostra");
    const v = r.R.montarTimePeloMotor(r.ctx, { variantes: ["sinergia"] }).variantes[0];
    const tag = v.tags.find((x) => x.tag === nomeTag);
    assert.ok(tag, JSON.stringify(v.membros.map((m) => m.nome)) + JSON.stringify(v.tags));
    assert.equal(tag.armador, armador);
    assert.ok(tag.beneficiarios.length >= 2 && tag.beneficiarios.every((b) => b.ganhoPorDuelo >= r.R.MOTOR_PROVA_BENEFICIO), JSON.stringify(tag.beneficiarios));
    assert.ok(tag.ganhoDoTime > 0 && tag.lutasMedidas >= 1 && tag.lutasMedidas <= 5);
    assert.ok(v.metricas.comuns && v.metricas.comuns.lutas > 0, "a conferência das comuns vem junto");
  });
});
// Os 3 casos que o juiz com a fatia mudou (21/10): os papéis são da BUILD e da ordem do time na luta, não do juiz. Com a fatia, Ferrothorn,
// Blissey e Clefable seguem com os mesmos papéis e provas; só a Mandibuzz mudou (de abstenção para "revenge killer") porque o time saiu em
// outra ordem (o juiz escolhe a ordem) e a prova de revenge killer depende de quem entra depois do nocaute. O invariante abaixo vale nos dois juízes.
const sol = run({ milestone: 3, nomes: POOL_CLIMA.filter((n) => !["Politoed", "Pelipper", "Charizard"].includes(n)) });
const tresVariantes = sol.R.montarTimePeloMotor(sol.ctx, { variantes: ["ofensivo", "seguro", "sinergia"] });
const porChave = (k) => tresVariantes.variantes.find((v) => v.chave === k);

test("risco 4: armador sem DOIS beneficiários medidos NÃO ganha a tag (zero e um beneficiário, no mesmo elenco)", () => {
  // Metagross e Garchomp entram com build montada à mão (só Splash): não causam dano, logo não podem virar 2º beneficiário do sol, seja qual for o dado.
  const { R, ctx, cand } = run({ milestone: 3, nomes: POOL_CLIMA, builds: { Metagross: ["Clear Body", ["Splash", "Protect", "Rest", "Sleep Talk"], "Bold", [252, 0, 252, 0, 4, 0]], Garchomp: ["Rough Skin", ["Splash", "Protect", "Rest", "Sleep Talk"], "Bold", [252, 0, 252, 0, 4, 0]] } });
  const base = cand([]).filter((c) => c.sp.x === c.base.x);
  const pega = (...ns) => ns.map((n) => base.find((c) => c.nome === n));
  const itensDoSol = (time) => R.motorSinergia(ctx, time).itens.filter((i) => i.cond.id === "clima:sol");
  // Zero beneficiário: os Pokémon de chuva perdem no sol.
  const zero = pega("Torkoal", "Kingdra", "Floatzel", "Ludicolo", "Swampert", "Pelipper");
  assert.equal(itensDoSol(zero).length, 0);
  assert.equal(R.motorClassificar(ctx, zero).tags.filter((t) => t.armador).length, 0);
  // Um beneficiário (Lilligant): o time até faz pontos a mais com o sol, então SÓ a regra dos dois beneficiários segura a tag.
  const um = pega("Torkoal", "Lilligant", "Kingdra", "Pelipper", "Metagross", "Garchomp");
  assert.equal(itensDoSol(um).length, 1);
  assert.equal(itensDoSol(um)[0].beneficiarios.length, 1);
  let com = 0, sem = 0, entrou = false;
  ctx.lutas.amostra.forEach((l) => {
    const r = R.motorSimularComClima(ctx, um, l, "sol", 0);
    if (!r) return;
    com += r.pontos; sem += R.motorSimular(ctx, um, l).p; entrou = entrou || r.armadorEntrou;
  });
  assert.ok(entrou && com > sem, "o caso precisa ter ganho do time (" + com + " x " + sem + ")");
  assert.equal(R.motorClassificar(ctx, um).tags.filter((t) => t.armador).length, 0);
});

test("com a fatia: wallbreaker e tanque seguem com prova; quem não tem papel segue com abstenção e motivo", () => {
  const r = run({ milestone: 2, nomes: ["Blissey", "Ferrothorn", "Clefable", "Dragonite", "Corviknight", "Mandibuzz"], comFatia: true });
  const v = r.R.montarTimePeloMotor(r.ctx, { variantes: ["ofensivo"] }).variantes[0];
  const m = (n) => v.membros.find((x) => x.nome === n);
  const wall = m("Ferrothorn").papeis.find((p) => p.papel === "wallbreaker");
  assert.ok(wall && wall.prova.nocautesEmRobustos >= 2 && wall.prova.nocautesEmRobustos * 2 >= wall.prova.nocautes, JSON.stringify(m("Ferrothorn").papeis));
  assert.deepEqual([...m("Blissey").papeis.map((p) => p.papel).sort()], ["tanque", "wallbreaker"]);
  v.membros.forEach((x) => {
    x.papeis.forEach((p) => assert.ok(p.prova && Object.keys(p.prova).length > 0, x.nome + " " + p.papel + " sem prova"));
    assert.ok(x.papeis.length > 0 || /nenhuma prova/.test(x.abstencao), x.nome + ": sem papel e sem abstenção com motivo");
  });
});

test("tag tática com prova (elenco construído, sem caso real positivo): Tailwind do Whimsicott + dois beneficiários + ganho do time", () => {
  const r = run({ milestone: 4, nomes: ["Whimsicott", "Blissey", "Dragonite", "Garchomp", "Gyarados", "Hatterene"], builds: { Whimsicott: SUPORTES.Whimsicott } });
  const time = r.cand(["Whimsicott"]).filter((c) => c.sp.x === c.base.x);
  assert.equal(time.length, 6);
  const cl = r.R.motorClassificar(r.ctx, time);
  const tag = cl.tags.find((t) => /tática/.test(t.tag));
  assert.ok(tag, JSON.stringify(cl.tags));
  assert.equal(tag.tag, "tática: Tailwind");
  assert.equal(tag.armador, "Whimsicott");
  assert.ok(tag.beneficiarios.length >= 2 && tag.beneficiarios.every((b) => b.ganhoPorDuelo >= r.R.MOTOR_PROVA_BENEFICIO));
  assert.ok(tag.ganhoDoTime > 0);
  assert.ok(cl.membros.find((m) => m.nome === "Whimsicott").contribuicoes.some((c) => c.tipo === "habilita"));
});

test("explicação por template: estilo, tags, papéis, condição de vitória e o que não foi medido; só os números da estrutura", () => {
  const v = porChave("sinergia"), txt = v.explicacao.join("\n");
  assert.match(txt, /^Estilo: (Hyper Offense|Bulky Offense|Balance|Stall)/m);
  assert.ok(["Hyper Offense", "Bulky Offense", "Balance", "Stall", null].includes(v.estilo));
  const cv = v.condicaoDeVitoria;
  assert.ok(txt.includes("o time vence " + cv.vitoriasNaAmostra + " das " + cv.lutas + " lutas da amostra"));
  if (cv.ameacaPrincipal) assert.ok(txt.includes(cv.ameacaPrincipal.nome));
  assert.match(txt, /Não medido: pivô/);
  v.membros.forEach((m) => {
    const linha = v.explicacao.find((t) => t.startsWith(m.nome + ":"));
    assert.ok(linha, m.nome);
    if (!m.papeis.length) assert.match(linha, /sem papel provado/);
    m.papeis.forEach((p) => assert.ok(linha.includes(p.papel), m.nome + " " + p.papel));
    // nenhum papel citado que a estrutura não tenha
    ["wallbreaker", "sweeper", "revenge killer", "tanque", "armador", "suporte", "pivô"].filter((p) => !m.papeis.some((x) => x.papel === p))
      .forEach((p) => assert.ok(!new RegExp("\\b" + p).test(linha.replace(/sem papel provado.*/, "")), m.nome + " citado como " + p));
  });
  assert.doesNotMatch(txt, /tirar|retirar|remov|substitu/i);
});

test("tempo: a classificação tem teto de 3 s por variante (medido: 0,1 a 0,4 s) e cabe no tempo da variante", () => {
  tresVariantes.variantes.forEach((v) => {
    assert.ok(Number.isFinite(v.tempoClassificacaoMs) && v.tempoClassificacaoMs >= 0, v.chave);
    assert.ok(v.tempoClassificacaoMs <= 3000, v.chave + " classificação " + v.tempoClassificacaoMs + " ms");
    assert.ok(v.tempoClassificacaoMs <= v.tempoMs, v.chave);
  });
  console.log("# tempo (ms): " + tresVariantes.variantes.map((v) => v.chave + " total " + v.tempoMs + ", classificação " + v.tempoClassificacaoMs).join(" | ") + " | tudo " + tresVariantes.tempoMs);
});

test("tag com prova: Torkoal (Drought) arma o sol, Lilligant e Togekiss ganham (medido por duelo) e o time faz pontos a mais", () => {
  const v = porChave("sinergia");
  const tag = v.tags.find((t) => t.tag === "clima: sol");
  assert.ok(tag, JSON.stringify(v.tags));
  assert.equal(tag.armador, "Torkoal");
  assert.equal(tag.via, "Drought");
  assert.ok(tag.beneficiarios.length >= 2 && tag.beneficiarios.every((b) => b.ganhoPorDuelo >= sol.R.MOTOR_PROVA_BENEFICIO));
  assert.ok(tag.ganhoDoTime > 0 && tag.lutasMedidas >= 1);
  const con = (n) => v.membros.find((m) => m.nome === n).contribuicoes.map((c) => c.tipo);
  assert.ok(con("Torkoal").includes("habilita"));
  assert.ok(con("Lilligant").includes("abusa") && con("Togekiss").includes("abusa"));
  // O texto usa só os números medidos.
  const linha = v.explicacao.find((t) => t.startsWith("Tag clima: sol"));
  assert.ok(linha.includes("+" + tag.ganhoDoTime) && tag.beneficiarios.every((b) => linha.includes(b.nome) && linha.includes("+" + b.ganhoPorDuelo)), linha);
});

test("3ª variante (sinergia): escolhe o par armador + beneficiários que o ofensivo e o seguro não escolhem (caso real, Etapa 3)", () => {
  const nomes = (k) => porChave(k).membros.map((m) => m.nome);
  const sin = nomes("sinergia");
  ["Torkoal", "Lilligant", "Togekiss"].forEach((n) => assert.ok(sin.includes(n), n + " fora da sinergia: " + sin.join()));
  ["ofensivo", "seguro"].forEach((k) => {
    assert.ok(!nomes(k).includes("Torkoal"), k + " também escolheu o Torkoal");
    assert.ok(!(nomes(k).includes("Lilligant") && nomes(k).includes("Togekiss")), k + " escolheu o par de beneficiários");
    assert.equal(porChave(k).tags.filter((t) => t.armador).length, 0, k + " ganhou tag de clima sem o armador");
  });
  // Mesma régua: as três trazem as mesmas métricas medidas nas mesmas lutas.
  assert.equal(new Set(tresVariantes.variantes.map((v) => Object.keys(v.metricas.restantes).sort().join())).size, 1);
  assert.notEqual(porChave("sinergia").objetivo.descricao, porChave("ofensivo").objetivo.descricao);
});
