// Modo Motor do Meu Time, Fase D (ticket time-pelo-motor/01, 21/10/2026): papéis por build, tags, sinergia e explicação.
// Dado real (espécies, lutas e níveis da run). Cada papel tem um caso real em que a prova fecha e um em que ela NÃO fecha
// (o golpe está na build mas o simulador não mostra o efeito). Teste que protege comportamento não se afrouxa para passar.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { carregarRegras } from "./carregar_regras.mjs";

const igual = (a, b, msg) => assert.equal(JSON.stringify(a), JSON.stringify(b), msg);

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
const papeisDe = (cl, nome) => cl.membros.find((m) => m.nome === nome).papeis;
const temPapel = (cl, nome, papel) => papeisDe(cl, nome).some((p) => p.papel === papel);

// ---------- papéis: prova fecha ----------
const SUPORTES = {
  Whimsicott: ["Prankster", ["Tailwind", "Moonblast", "Energy Ball", "Encore"], "Timid", [0, 0, 0, 252, 4, 252]],
  Hatterene: ["Magic Bounce", ["Trick Room", "Dazzling Gleam", "Psychic", "Mystical Fire"], "Quiet", [252, 0, 0, 252, 4, 0]]
};

test("armador: Tailwind do Whimsicott vale pontos medidos na luta completa (Archie Mt Pyre, Etapa 4); a mesma build sem o golpe faz menos", () => {
  const r = run({ milestone: 4, nomes: ["Whimsicott", "Hatterene", "Garchomp", "Scizor", "Metagross", "Gyarados"], builds: SUPORTES });
  const cands = r.cand(["Whimsicott", "Hatterene"]).filter((c) => c.sp.x === c.base.x);
  const time = [cands.find((c) => c.nome === "Whimsicott")].concat(cands.filter((c) => !c.travado).slice(0, 3), cands.filter((c) => c.nome === "Hatterene"));
  const cl = r.R.motorClassificar(r.ctx, time);
  const arm = papeisDe(cl, "Whimsicott").find((p) => p.papel === "armador");
  assert.ok(arm, JSON.stringify(papeisDe(cl, "Whimsicott")));
  assert.ok(arm.prova.pontosDoEfeito >= 1);
  // A prova é reproduzível pelo contrafactual: o time com e sem os golpes de armar o campo, na mesma luta.
  const luta = r.ctx.lutas.amostra.find((l) => l.nome === arm.prova.luta);
  assert.equal(r.R.motorDeltaSemTipos(r.ctx, time, time[0], luta, r.R.MOTOR_TIPOS_DE_ARMAR), arm.prova.pontosDoEfeito);
  assert.ok(temPapel(cl, "Hatterene", "armador"), "Trick Room da Hatterene também vale pontos nessa amostra");
});

test("suporte: Sleep Powder e Leech Seed do Venusaur valem pontos contra Archie (Etapa 2); só entra a utilidade, não o dano nem o setup", () => {
  const r = run({ milestone: 2, nomes: ["Venusaur", "Breloom", "Clefable", "Garchomp", "Metagross", "Gyarados"], builds: {
    Venusaur: ["Overgrow", ["Sleep Powder", "Giga Drain", "Sludge Bomb", "Leech Seed"], "Modest", [0, 0, 0, 252, 4, 252]],
    Breloom: ["Technician", ["Spore", "Mach Punch", "Seed Bomb", "Bullet Seed"], "Jolly", [0, 252, 0, 0, 4, 252]],
    Clefable: ["Magic Guard", ["Thunder Wave", "Moonblast", "Soft-Boiled", "Encore"], "Bold", [252, 0, 252, 0, 4, 0]] } });
  const time = r.cand(["Venusaur", "Breloom", "Clefable"]).filter((c) => c.sp.x === c.base.x);
  assert.equal(time.length, 6);
  const cl = r.R.motorClassificar(r.ctx, time);
  const sup = papeisDe(cl, "Venusaur").find((p) => p.papel === "suporte");
  assert.ok(sup, JSON.stringify(papeisDe(cl, "Venusaur")));
  assert.ok(sup.prova.exemplos.every((e) => e.pontos >= 1));
  // A prova é o contrafactual: o time com a build dele sem os golpes de utilidade, na mesma luta.
  const luta = r.ctx.lutas.amostra.find((l) => l.nome === sup.prova.exemplos[0].luta);
  const v = time.find((c) => c.nome === "Venusaur");
  assert.equal(r.R.motorDeltaSemTipos(r.ctx, time, v, luta, r.R.MOTOR_TIPOS_DE_UTILIDADE), sup.prova.exemplos[0].pontos);
});

test("sweeper: Salamence com Dragon Dance encadeia nocautes e o time faz mais de 1 ponto a menos sem o setup (Shelly Seafloor Cavern, Etapa 4)", () => {
  const r = run({ milestone: 4, nomes: ["Gyarados", "Garchomp", "Scizor", "Salamence", "Blissey", "Ferrothorn"], builds: {
    Gyarados: ["Intimidate", ["Dragon Dance", "Waterfall", "Earthquake", "Ice Fang"], "Jolly", [0, 252, 0, 0, 4, 252]],
    Garchomp: ["Rough Skin", ["Swords Dance", "Earthquake", "Outrage", "Stone Edge"], "Jolly", [0, 252, 0, 0, 4, 252]],
    Scizor: ["Technician", ["Swords Dance", "Bullet Punch", "Close Combat", "Roost"], "Adamant", [0, 252, 0, 0, 4, 252]],
    Salamence: ["Intimidate", ["Dragon Dance", "Outrage", "Earthquake", "Roost"], "Jolly", [0, 252, 0, 0, 4, 252]] } });
  const cands = r.cand(["Gyarados", "Garchomp", "Scizor", "Salamence"]);
  const time = cands.filter((c) => c.travado && c.sp.x === c.base.x).concat(cands.filter((c) => !c.travado).slice(0, 2));
  r.usaLutas("Shelly Seafloor Cavern");
  const cl = r.R.motorClassificar(r.ctx, time);
  const sw = papeisDe(cl, "Salamence").find((p) => p.papel === "sweeper");
  assert.ok(sw, JSON.stringify(papeisDe(cl, "Salamence")));
  assert.ok(sw.prova.nocautesSeguidos >= 2 && sw.prova.pontosGanhosPeloSetup >= 1, JSON.stringify(sw));
  // Mesma luta, mesmo time: Garchomp e Scizor também têm setup na build e NÃO ganham o rótulo (sem encadeamento medido com ganho).
  assert.ok(!temPapel(cl, "Scizor", "sweeper"));
});

test("risco 8: ter o golpe NÃO dá o papel (setup sem ganho medido, U-turn sem prova de pivô, Toxic/Haze/Recover sem efeito na amostra)", () => {
  const r = run({ milestone: 2, nomes: ["Garchomp", "Scizor", "Toxapex", "Metagross", "Gyarados", "Blissey"], builds: {
    Garchomp: ["Rough Skin", ["Swords Dance", "Earthquake", "Outrage", "Stone Edge"], "Jolly", [0, 252, 0, 0, 4, 252]],
    Scizor: ["Technician", ["U-turn", "Bullet Punch", "Swords Dance", "Roost"], "Adamant", [0, 252, 0, 0, 4, 252]],
    Toxapex: ["Regenerator", ["Toxic", "Scald", "Recover", "Haze"], "Bold", [252, 0, 252, 0, 4, 0]] } });
  const cands = r.cand(["Garchomp", "Scizor", "Toxapex"]).filter((c) => c.sp.x === c.base.x);
  const time = cands.slice(0, 6);
  const cl = r.R.motorClassificar(r.ctx, time); // amostra padrão da Etapa 2: nenhuma luta em que a utilidade do Toxapex pese
  ["Garchomp", "Scizor", "Toxapex"].forEach((n) => {
    const m = cl.membros.find((x) => x.nome === n);
    ["sweeper", "pivô", "pivo", "suporte"].forEach((p) => assert.ok(!m.papeis.some((x) => x.papel === p), n + " ganhou " + p + " só por ter o golpe"));
  });
  // O Garchomp tem sequência de nocautes mas o setup não rende ponto na luta completa: o rótulo some, o número fica no log medido.
  assert.ok(cl.membros.every((m) => m.papeis.every((p) => p.papel !== "pivô")));
  assert.ok(cl.naoMedidos.some((t) => /pivô/.test(t)), "o pivô é declarado como não medido");
});

test("wallbreaker e tanque com prova (Etapa 2, elenco do pipeline) e abstenção de quem não prova nada", () => {
  const r = run({ milestone: 2, nomes: ["Blissey", "Ferrothorn", "Clefable", "Dragonite", "Corviknight", "Mandibuzz"] });
  const out = r.R.montarTimePeloMotor(r.ctx, { variantes: ["ofensivo"] });
  const v = out.variantes[0];
  const m = (n) => v.membros.find((x) => x.nome === n);
  const wall = m("Ferrothorn").papeis.find((p) => p.papel === "wallbreaker");
  assert.ok(wall && wall.prova.nocautesEmRobustos >= 2 && wall.prova.nocautesEmRobustos * 2 >= wall.prova.nocautes, JSON.stringify(m("Ferrothorn").papeis));
  const tan = m("Blissey").papeis.find((p) => p.papel === "tanque");
  assert.ok(tan && tan.prova.confrontos >= 2 && tan.prova.exemplos.every((e) => e.turnos >= 3 && e.hpFinal >= 0.4), JSON.stringify(m("Blissey").papeis));
  // Abstenção: Mandibuzz não prova nada nas lutas da amostra. Sem papel, com o motivo, e o texto diz isso.
  assert.equal(m("Mandibuzz").papeis.length, 0);
  assert.match(m("Mandibuzz").abstencao, /nenhuma prova/);
  assert.ok(v.explicacao.some((t) => t.startsWith("Mandibuzz: sem papel provado")));
  // Multirrótulo: a Blissey tem DOIS papéis no mesmo time, cada um com a sua prova.
  const blis = m("Blissey").papeis.map((p) => p.papel).sort();
  assert.deepEqual([...blis], ["tanque", "wallbreaker"]);
  v.membros.forEach((x) => x.papeis.forEach((p) => assert.ok(p.prova && Object.keys(p.prova).length > 0, x.nome + " " + p.papel + " sem prova")));
});

// ---------- tags e a 3ª variante ----------
const POOL_CLIMA = ["Politoed", "Ludicolo", "Kingdra", "Swampert", "Floatzel", "Gyarados", "Scizor", "Garchomp", "Metagross", "Togekiss", "Pelipper", "Torkoal", "Charizard", "Venusaur", "Lilligant"];
const clima = run({ milestone: 3, nomes: POOL_CLIMA });
// As 3 variantes usam um pool sem Politoed/Pelipper/Charizard: com a precisão corrigida (mecanica-01: Skill Link/Pinnacle Blade deixaram de "sempre acertar"; Plasma Lamp x1,2),
// a chuva do Politoed passou a render mais que o sol no pool completo e a sinergia escolhe a chuva. Aqui o sol é a única armação (Charizard seria o 2º beneficiário do sol e tira o Togekiss).
const sol = run({ milestone: 3, nomes: POOL_CLIMA.filter((n) => !["Politoed", "Pelipper", "Charizard"].includes(n)) });
const tresVariantes = sol.R.montarTimePeloMotor(sol.ctx, { variantes: ["ofensivo", "seguro", "sinergia"] });
const porChave = (k) => tresVariantes.variantes.find((v) => v.chave === k);

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

test("risco 4: armador sem DOIS beneficiários medidos NÃO ganha a tag (zero e um beneficiário, no mesmo elenco)", () => {
  const { R, ctx, cand } = clima;
  const base = cand([]).filter((c) => c.sp.x === c.base.x);
  const pega = (...ns) => ns.map((n) => base.find((c) => c.nome === n));
  const itensDoSol = (time) => R.motorSinergia(ctx, time).itens.filter((i) => i.cond.id === "clima:sol");
  // Zero beneficiário: os Pokémon de chuva perdem no sol.
  const zero = pega("Torkoal", "Kingdra", "Floatzel", "Ludicolo", "Swampert", "Pelipper");
  assert.equal(itensDoSol(zero).length, 0);
  assert.equal(R.motorClassificar(ctx, zero).tags.filter((t) => t.armador).length, 0);
  // Um beneficiário (Lilligant): o time até faz pontos a mais com o sol, então SÓ a regra dos dois beneficiários segura a tag.
  const um = pega("Torkoal", "Lilligant", "Kingdra", "Pelipper", "Metagross", "Scizor");
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

test("risco 4: dois beneficiários medidos mas o time NÃO ganha na luta simulada (Trick Room da Hatterene) também não ganha a tag", () => {
  const r = run({ milestone: 3, nomes: ["Hatterene", "Ferrothorn", "Garchomp", "Slowbro", "Metagross", "Hippowdon"], builds: { Hatterene: SUPORTES.Hatterene } });
  const base = r.cand(["Hatterene"]).filter((c) => c.sp.x === c.base.x);
  const sin = r.R.motorSinergia(r.ctx, base.slice(0, 6));
  const sala = sin.itens.find((i) => i.cond.id === "sala");
  assert.ok(sala && sala.beneficiarios.length >= 2, "o caso precisa ter os dois beneficiários medidos");
  const cl = r.R.motorClassificar(r.ctx, base.slice(0, 6));
  assert.ok(!cl.tags.some((t) => /Trick Room/.test(t.tag)), JSON.stringify(cl.tags));
});

test("elenco pequeno: as três variantes chegam nos mesmos Pokémon e as duas últimas avisam, com o mesmo texto", () => {
  const r = run({ milestone: 2, nomes: ["Blissey", "Ferrothorn", "Clefable", "Dragonite", "Corviknight", "Mandibuzz"] });
  const out = r.R.montarTimePeloMotor(r.ctx, {});
  assert.equal(out.variantes.length, 3);
  assert.equal(new Set(out.variantes.map((v) => v.membros.map((m) => m.nome).sort().join())).size, 1);
  out.variantes.slice(1).forEach((v) => assert.ok(v.avisos.some((a) => /chegou nos mesmos Pokémon da variante "Mais ofensivo"/.test(a)), v.chave + ": " + v.avisos.join(" | ")));
  assert.equal(out.variantes[0].avisos.filter((a) => /chegou nos mesmos/.test(a)).length, 0);
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

// ---------- explicação, legado e tempo ----------
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

test("risco 9: o papel legado da espécie (SPECIES_ROLE, ficha, builds, prompt) não muda; o classificador novo é paralelo", () => {
  const { R } = clima;
  const antes = JSON.stringify(R.SPECIES_ROLE), rotulos = JSON.stringify(R.ROLE_LABEL_PT);
  const arquivo = readFileSync(new URL("../../data/species_role.json", import.meta.url), "utf8");
  igual(JSON.parse(arquivo), JSON.parse(antes), "o dado carregado é o arquivo");
  R.montarTimePeloMotor(clima.ctx, { variantes: ["sinergia"] }); // roda tudo de novo (cache quente)
  assert.equal(JSON.stringify(R.SPECIES_ROLE), antes, "montar o time não pode mexer no papel legado");
  assert.equal(JSON.stringify(R.ROLE_LABEL_PT), rotulos);
  // O módulo novo nem lê o legado: nenhum caminho dele pode regredir por causa daqui.
  const src = readFileSync(new URL("../../src/regras/time_pelo_motor.js", import.meta.url), "utf8");
  assert.ok(!/SPECIES_ROLE|ROLE_LABEL_PT|species_role/.test(src.replace(/\/\/.*$/gm, "")), "o código (fora dos comentários) lê o papel legado");
  // Os campos novos têm nome próprio (papeis, não papel/roles) e o consumidor legado segue devolvendo a lista da espécie.
  porChave("sinergia").membros.forEach((m) => { assert.ok(Array.isArray(m.papeis)); assert.ok(!("papel" in m) && !("roles" in m)); });
  const sn = R.SPECIES.find((s) => s && s.n === "Garchomp").sname;
  assert.ok(Array.isArray(R.SPECIES_ROLE[sn].roles) && R.SPECIES_ROLE[sn].roles.length > 0);
});

test("tempo: a classificação tem teto de 3 s por variante (medido: 0,1 a 0,4 s) e cabe no tempo da variante", () => {
  tresVariantes.variantes.forEach((v) => {
    assert.ok(Number.isFinite(v.tempoClassificacaoMs) && v.tempoClassificacaoMs >= 0, v.chave);
    assert.ok(v.tempoClassificacaoMs <= 3000, v.chave + " classificação " + v.tempoClassificacaoMs + " ms");
    assert.ok(v.tempoClassificacaoMs <= v.tempoMs, v.chave);
  });
  console.log("# tempo (ms): " + tresVariantes.variantes.map((v) => v.chave + " total " + v.tempoMs + ", classificação " + v.tempoClassificacaoMs).join(" | ") + " | tudo " + tresVariantes.tempoMs);
});

test("com a fatia 60/40 o juiz escolhe outro time, mas a sinergia de sol continua com a prova medida (armador + dois beneficiários + ganho do time)", () => {
  const r = run({ milestone: 3, nomes: POOL_CLIMA, comFatia: true });
  assert.ok(r.ctx.lutas.comuns.amostra.length > 0, "o juiz com a fatia precisa ter comuns na amostra");
  const v = r.R.montarTimePeloMotor(r.ctx, { variantes: ["sinergia"] }).variantes[0];
  const tag = v.tags.find((x) => x.tag === "clima: sol");
  assert.ok(tag, JSON.stringify(v.tags));
  assert.equal(tag.armador, "Torkoal");
  assert.ok(tag.beneficiarios.length >= 2 && tag.beneficiarios.every((b) => b.ganhoPorDuelo >= r.R.MOTOR_PROVA_BENEFICIO), JSON.stringify(tag.beneficiarios));
  assert.ok(tag.ganhoDoTime > 0 && tag.lutasMedidas >= 1);
  assert.ok(v.metricas.comuns && v.metricas.comuns.lutas > 0, "a conferência das comuns vem junto");
});

// Os 3 casos que o juiz com a fatia mudou (21/10): os papéis são da BUILD e da ordem do time na luta, não do juiz. Com a fatia, Ferrothorn,
// Blissey e Clefable seguem com os mesmos papéis e provas; só a Mandibuzz mudou (de abstenção para "revenge killer") porque o time saiu em
// outra ordem (o juiz escolhe a ordem) e a prova de revenge killer depende de quem entra depois do nocaute. O invariante abaixo vale nos dois juízes.
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

test("com a fatia: nenhuma tag de armador nasce com menos de dois beneficiários medidos, em nenhuma variante", () => {
  const r = run({ milestone: 3, nomes: POOL_CLIMA, comFatia: true });
  const out = r.R.montarTimePeloMotor(r.ctx, { variantes: ["ofensivo", "seguro", "sinergia"] });
  let tagsDeArmador = 0;
  out.variantes.forEach((v) => v.tags.filter((x) => x.armador).forEach((x) => {
    tagsDeArmador++;
    assert.ok(x.beneficiarios.length >= 2 && x.ganhoDoTime > 0, v.chave + " " + JSON.stringify(x));
  }));
  assert.ok(tagsDeArmador >= 1, "o caso real precisa gerar ao menos uma tag para a checagem provar algo");
});
