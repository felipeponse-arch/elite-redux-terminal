// Caminho "resposta da IA -> build validada -> o que gravar" (src/regras/gravacao_build_ia.js e
// lista_de_builds.js), no Node sem navegador (ticket 06 da dívida técnica, 2026-10-08).
// A tela só faz o pedido e mostra o status; aqui a "saida" é simulada com listas.
import test from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 6 });
const plain = (x) => JSON.parse(JSON.stringify(x));

// Uma espécie com resposta que a validação aceita (habilidade, 4 golpes liberados e sinergia).
function achar() {
  for (const sp of R.SPECIES.filter((s) => !s.mega && s.ab && s.ab.length)) {
    const nomes = R.availableMovesFor(sp).names;
    const habs = R.uniqueIds(sp.ab).map((id) => R.ABILITIES[id][0]);
    for (const ability of habs) for (let i = 0; i + 4 <= nomes.length && i < 40; i++) {
      const raw = { ability, nature: "Adamant", item: "Leftovers", moves: nomes.slice(i, i + 4), ivs: [31, 31, 31, 31, 31, 31], evs: [0, 252, 0, 0, 4, 252], rationale: "teste" };
      if (R.validateAiBuild(sp, raw, {}, {})) return { sp, raw: plain(raw) };
    }
  }
  throw new Error("nenhuma espécie com resposta válida");
}
const { sp, raw } = achar();
const copia = (o) => JSON.parse(JSON.stringify(o));
function saidaFalsa() {
  const s = { agiu: 0, avisos: [], toasts: [] };
  s.agir = (mudar) => { s.agiu++; return mudar(); };
  s.aviso = (t) => s.avisos.push(t);
  s.toast = (t) => s.toasts.push(t);
  return s;
}
const entrada = (source, active, i) => ({ ability: raw.ability, nature: "Jolly", item: "", moves: ["M" + i, "N" + i, "O" + i, "P" + i], ivs: [31, 31, 31, 31, 31, 31], evs: [0, 0, 0, 0, 0, 0], source, active, savedAt: "2026-10-0" + (i + 1) + "T00:00:00Z", rationale: "" });
function cenario(lista, { noTime = true, milestone = 6 } = {}) {
  R.state.settings.milestone = milestone;
  R.state.team = noTime ? [sp.x] : [];
  R.state.autoLog = [];
  R.state.customBuilds = {};
  if (lista.length) R.state.customBuilds[sp.sname] = lista.map(([src, ativa], i) => entrada(src, ativa, i));
}
const lista = () => R.state.customBuilds[sp.sname] || [];
const fontes = () => lista().map((b) => b.source + (b.active ? "*" : "")).join(",");
const cap = () => R.getCurrentCap();
const validar = (opts = {}, bruto = raw) => R.validarRespostaDeBuildDaIa(sp, copia(bruto), opts).valor;
const gravar = (opts, saida, bruto = raw) => R.gravarRespostaValidadaDaIa(sp, validar(opts, bruto), copia(bruto), opts, cap(), saida);

// ---------- resposta -> build validada ----------

test("validarRespostaDeBuildDaIa: aceita a build real e rejeita com o motivo técnico e o da tela", () => {
  assert.ok(R.validarRespostaDeBuildDaIa(sp, copia(raw), {}).valor);
  const ruim = R.validarRespostaDeBuildDaIa(sp, { ...copia(raw), ability: "Habilidade Inexistente" }, {});
  assert.equal(ruim.valor, undefined);
  assert.match(ruim.motivo, /Habilidade Inexistente/);
  assert.equal(ruim.motivoParaJogador, ruim.motivo, "com motivo específico, tela e modelo veem o mesmo");
  for (const lixo of [null, "texto", 7]) {
    const r = R.validarRespostaDeBuildDaIa(sp, lixo, {});
    assert.match(r.motivo, /fora do permitido/);
    assert.equal(r.motivoParaJogador, "A resposta não bateu com os dados reais deste Pokémon.");
  }
  const repetido = R.validarRespostaDeBuildDaIa(sp, { ...copia(raw), moves: [raw.moves[0], raw.moves[0], raw.moves[2], raw.moves[3]] }, {});
  assert.match(repetido.motivo, /repetido/);
});

test("textoDaRetentativaDeBuild: leva o motivo e o pedido de corrigir no mesmo formato", () => {
  const t = R.textoDaRetentativaDeBuild("golpe X fora do movepool");
  assert.ok(t.startsWith("\n\nSUA RESPOSTA ANTERIOR FOI REJEITADA"));
  assert.ok(t.includes("Motivo: golpe X fora do movepool Corrija"));
  assert.ok(t.endsWith("no mesmo formato JSON."));
});

test("lote de builds: exige o campo builds; acha a build do membro por sname ou por nome", () => {
  assert.deepEqual(plain(R.validarRespostaDoLoteDeBuilds({ builds: { A: 1 } })), { valor: { A: 1 } });
  for (const lixo of [null, {}, { builds: "x" }, { builds: 0 }, { outra: 1 }]) {
    assert.deepEqual(plain(R.validarRespostaDoLoteDeBuilds(lixo)), { motivo: "a resposta não trouxe o campo builds." });
  }
  const porSname = R.buildDoLoteDeBuilds(sp, { [sp.sname]: copia(raw) }, {});
  assert.ok(porSname.validada && porSname.bruto.ability === raw.ability);
  const porNome = R.buildDoLoteDeBuilds(sp, { [sp.n]: copia(raw) }, {});
  assert.ok(porNome.validada);
  assert.deepEqual(plain(R.buildDoLoteDeBuilds(sp, {}, {})), { validada: null });
  const invalida = R.buildDoLoteDeBuilds(sp, { [sp.sname]: { ...copia(raw), nature: "Inexistente" } }, {});
  assert.ok(invalida.bruto && invalida.validada === null);
});

// ---------- resposta velha demais ----------

test("respostaDaIaObsoleta: o mundo mudou enquanto a IA respondia", () => {
  cenario([["ia", true]]);
  const ativa = R.getActiveBuild(sp.sname);
  assert.equal(R.respostaDaIaObsoleta(sp, {}), false, "sem modo automático nunca é obsoleta");
  assert.equal(R.respostaDaIaObsoleta(sp, { modo: "revisao", anterior: ativa }), false);
  assert.equal(R.respostaDaIaObsoleta(sp, { modo: "revisao", anterior: { outra: 1 } }), true, "a ativa trocou");
  R.state.team = [];
  assert.equal(R.respostaDaIaObsoleta(sp, { modo: "revisao", anterior: ativa }), true, "saiu do time");
  assert.equal(R.respostaDaIaObsoleta(sp, { chefao: { boss: { name: "X" } } }), true);
  assert.equal(R.respostaDaIaObsoleta(sp, { timeNovo: true }), true);
  R.state.team = [sp.x];
  assert.equal(R.respostaDaIaObsoleta(sp, { timeNovo: true }), false);
  assert.equal(R.respostaDaIaObsoleta(sp, { modo: "ponte" }), true, "ponte: o jogador já fez uma build");
  cenario([]);
  assert.equal(R.respostaDaIaObsoleta(sp, { modo: "ponte" }), false);
  R.state.team = [];
  assert.equal(R.respostaDaIaObsoleta(sp, { modo: "ponte" }), true);
});

// ---------- build validada -> gravar ----------

test("build normal: entra como variante da IA, ativa, num único agir, com aviso rápido", () => {
  cenario([["manual", true]]);
  const s = saidaFalsa();
  assert.equal(gravar({}, s), true);
  assert.equal(fontes(), "manual,ia*");
  assert.equal(s.agiu, 1);
  assert.deepEqual(s.toasts, ["Build gerada por IA salva para " + sp.n]);
  assert.deepEqual(s.avisos, []);
  const gravada = R.getActiveBuild(sp.sname);
  assert.equal(gravada.ability, raw.ability);
  assert.deepEqual(plain(gravada.moves), raw.moves);
  assert.equal(gravada.planoConsultado, true, "o prompt já pediu o plano");
  assert.deepEqual(plain(R.state.autoLog), [], "build normal não escreve no log");
});

test("silencioso (modo automático): grava sem o aviso rápido", () => {
  cenario([]);
  const s = saidaFalsa();
  assert.equal(gravar({ silencioso: true }, s), true);
  assert.equal(lista().length, 1);
  assert.deepEqual(s.toasts, []);
});

test("lista cheia (3): recusa, avisa o limite e não mexe em nada", () => {
  cenario([["ia", true], ["ia", false], ["manual", false]]);
  const antes = JSON.stringify(R.state.customBuilds);
  const s = saidaFalsa();
  assert.equal(gravar({}, s), false);
  assert.deepEqual(s.avisos, ["Limite de 3 builds atingido."]);
  assert.deepEqual(s.toasts, []);
  assert.equal(JSON.stringify(R.state.customBuilds), antes);
  assert.equal(R.textoDeLimiteDeBuilds(sp, { chefao: {} }), "Limite de 3 builds de " + sp.n + " com builds feitas por você - apague uma na ficha pra caber a nova.");
  assert.equal(R.textoDeLimiteDeBuilds(sp, { timeNovo: true }), R.textoDeLimiteDeBuilds(sp, { chefao: {} }));
});

test("depois da evolução (revisao): sai a mais antiga que não é a ativa nem a anterior; a anterior vira 'Antes de evoluir'", () => {
  cenario([["ia", false], ["ia", true], ["ia", false]]);
  const anterior = R.getActiveBuild(sp.sname);
  anterior.revisar = "plano"; anterior.tentativasRevisao = 1;
  const velha = lista()[0];
  const s = saidaFalsa();
  assert.equal(gravar({ modo: "revisao", anterior, deNome: "Forma Velha" }, s), true);
  assert.equal(lista().length, 3);
  assert.ok(!lista().includes(velha), "a mais antiga saiu");
  assert.ok(lista().includes(anterior), "a anterior ficou de reserva");
  assert.equal(anterior.antesDeEvoluir, "Forma Velha");
  assert.equal(anterior.revisar, undefined);
  assert.equal(anterior.tentativasRevisao, undefined);
  assert.equal(R.getActiveBuild(sp.sname).ability, raw.ability);
  const textos = R.state.autoLog.map((l) => l.text);
  assert.ok(textos.some((t) => t.startsWith("Pra caber a build nova de " + sp.n + ", saiu a variante mais antiga")));
  assert.ok(textos.some((t) => t.includes("depois da evolução") && t.includes('chip "Antes de evoluir"')));
});

test("contra um chefão, sem vaga que possa sair e ativa não manual: troca a ativa; com ativa manual, recusa", () => {
  cenario([["manual", false], ["manual", false], ["ia", true]]);
  const s = saidaFalsa();
  assert.equal(gravar({ chefao: { boss: { name: "Roxanne 1" } } }, s), true);
  assert.equal(fontes(), "manual,manual,ia*", "a ativa da IA foi trocada pela nova");
  assert.equal(R.getActiveBuild(sp.sname).ability, raw.ability);
  assert.deepEqual(s.avisos, []);
  cenario([["manual", true], ["manual", false], ["manual", false]]);
  assert.equal(gravar({ chefao: { boss: { name: "Roxanne 1" } } }, saidaFalsa()), false);
});

test("contra um chefão: abre vaga SEM tirar build feita à mão, marca para qual chefão e escreve no log", () => {
  cenario([["manual", true], ["manual", false], ["ia", false]]);
  const opts = { chefao: { boss: { name: "Roxanne 1" }, chave: "Roxanne 1" } };
  const s = saidaFalsa();
  assert.equal(gravar(opts, s), true);
  assert.equal(lista().filter((b) => b.source === "manual").length, 2, "as feitas à mão ficam");
  const nova = R.getActiveBuild(sp.sname);
  assert.equal(nova.source, "ia");
  assert.deepEqual(plain(nova.feitaPara), { chefao: "Roxanne 1", cap: cap() });
  assert.ok(R.state.autoLog.some((l) => l.text.startsWith("Build nova de " + sp.n + " para vencer Roxanne 1: " + raw.ability)));
  // sem a chave, vale o nome do chefão
  cenario([]);
  gravar({ chefao: { boss: { name: "Brawly 1" } } }, saidaFalsa());
  assert.equal(R.getActiveBuild(sp.sname).feitaPara.chefao, "Brawly 1");
});

test("contra um chefão com 3 builds feitas à mão: recusa e avisa (nunca apaga escolha do jogador)", () => {
  cenario([["manual", true], ["manual", false], ["manual", false]]);
  const s = saidaFalsa();
  assert.equal(gravar({ chefao: { boss: { name: "Roxanne 1" } } }, s), false);
  assert.equal(fontes(), "manual*,manual,manual");
  assert.match(s.avisos[0], /^Limite de 3 builds de .* com builds feitas por você/);
});

test("time novo: a build vira a ativa, a antiga fica de variante e o log registra", () => {
  cenario([["ia", true], ["ia", false], ["ia", false]]);
  const antiga = R.getActiveBuild(sp.sname);
  assert.equal(gravar({ timeNovo: true }, saidaFalsa()), true);
  assert.ok(lista().includes(antiga));
  assert.ok(R.state.autoLog.some((l) => l.text.startsWith("Build nova de " + sp.n + " para o time gerado: " + raw.ability)));
  assert.match(R.state.autoLog[R.state.autoLog.length - 1].text, /@ Leftovers\.$|Pra caber/);
});

test("ponte: grava como curada com os golpes-ponte e o log do level cap", () => {
  cenario([]);
  const alvo = { ability: raw.ability, nature: "Jolly", item: "", evs: "252 Atk / 4 SpD / 252 Spe", moves: raw.moves.slice(0, 3).concat(["Golpe Futuro"]) };
  const s = saidaFalsa();
  assert.equal(gravar({ modo: "ponte", alvo }, s), true);
  const g = R.getActiveBuild(sp.sname);
  assert.equal(g.source, "curada");
  assert.equal(g.nature, "Jolly", "natureza da curada");
  assert.equal(g.item, "", "item da curada");
  assert.equal(g.rationale, "Build curada adaptada ao level cap " + cap() + ": golpes-ponte até liberar os da curada.");
  assert.ok(R.state.autoLog[0].text.startsWith("Build curada de " + sp.n + " adaptada ao level cap " + cap() + ": "));
});

test("resposta obsoleta: devolve 'obsoleta', não grava, não chama a tela", () => {
  cenario([], { noTime: false });
  const s = saidaFalsa();
  assert.equal(gravar({ timeNovo: true }, s), "obsoleta");
  assert.equal(lista().length, 0);
  assert.equal(s.agiu, 0);
  assert.deepEqual(s.toasts.concat(s.avisos), []);
});

test("plano da resposta: troca válida entra na build e no aviso; a inválida é descartada com o motivo", () => {
  cenario([]);
  const s = saidaFalsa();
  const comPlano = { ...copia(raw), plano: { [raw.moves[0]]: "Golpe Que Nao Existe" } };
  assert.equal(gravar({}, s, comPlano), true);
  assert.equal(s.avisos.length, 1);
  assert.match(s.avisos[0], /^Trocas do plano descartadas: .*Golpe Que Nao Existe\.$/);
  assert.equal(R.getActiveBuild(sp.sname).plano, undefined);
});

// ---------- plano de uma build feita à mão ----------

function buildManualComFuturo() {
  R.state.settings.milestone = 0;
  const alvo = R.SPECIES.find((s) => !s.mega && s.lm && R.golpesFuturosDe(s, R.getCurrentCap()).length >= 2);
  const base4 = R.availableMovesFor(alvo).names.slice(0, 4);
  const e = R.entradaDeBuild({ ability: "A", nature: "Jolly", moves: base4, evs: [0, 0, 0, 0, 0, 0], ivs: [31, 31, 31, 31, 31, 31] }, "manual", alvo.sname, null);
  R.state.customBuilds = { [alvo.sname]: [e] };
  R.state.team = [alvo.x]; R.state.autoLog = [];
  return { alvo, e, base4, futuro: R.golpesFuturosDe(alvo, R.getCurrentCap())[0].nome };
}

test("gravarPlanoDaIa: grava o plano válido, limpa a marca de revisão e registra no log", () => {
  const { alvo, e, base4, futuro } = buildManualComFuturo();
  assert.equal(e.revisar, "plano");
  const s = saidaFalsa();
  assert.equal(R.gravarPlanoDaIa(alvo, e, base4.join("|"), { plano: { [base4[0]]: futuro } }, R.getCurrentCap(), s), true);
  assert.equal(s.agiu, 1);
  assert.deepEqual(plain(e.plano), { [base4[0]]: futuro });
  assert.equal(e.planoConsultado, true);
  assert.equal(e.revisar, undefined);
  assert.equal(e.tentativasRevisao, undefined);
  assert.match(R.state.autoLog[0].text, new RegExp("^Plano de golpes da build de " + alvo.n + ": " + base4[0] + " → " + futuro + " \\(nível \\d+\\)\\.$"));
});

test("gravarPlanoDaIa: 'nenhuma troca' também fecha a pergunta; plano inválido não vira erro", () => {
  const { alvo, e, base4 } = buildManualComFuturo();
  assert.equal(R.gravarPlanoDaIa(alvo, e, base4.join("|"), { plano: { [base4[0]]: "Golpe Que Nao Existe" } }, R.getCurrentCap(), saidaFalsa()), true);
  assert.equal(e.plano, undefined);
  assert.equal(e.planoConsultado, true);
  assert.deepEqual(plain(R.state.autoLog), []);
});

test("gravarPlanoDaIa: a build mudou ou saiu da lista enquanto a IA respondia = obsoleta, nada gravado", () => {
  const { alvo, e, base4, futuro } = buildManualComFuturo();
  const s = saidaFalsa();
  assert.equal(R.gravarPlanoDaIa(alvo, e, "outros|golpes|da|build", { plano: { [base4[0]]: futuro } }, R.getCurrentCap(), s), "obsoleta");
  R.state.customBuilds = {};
  assert.equal(R.gravarPlanoDaIa(alvo, e, base4.join("|"), { plano: { [base4[0]]: futuro } }, R.getCurrentCap(), s), "obsoleta");
  assert.equal(s.agiu, 0);
  assert.equal(e.plano, undefined);
});

// ---------- a lista de builds por baixo ----------

test("lista_de_builds: acrescentar, trocar a ativa, remover e escolher quem sai", () => {
  cenario([]);
  assert.equal(R.acrescentarVarianteNaLista(sp.sname, raw, "ia"), true);
  assert.equal(R.acrescentarVarianteNaLista(sp.sname, raw, "manual"), true);
  assert.equal(R.acrescentarVarianteNaLista(sp.sname, raw, "inexistente"), true);
  assert.equal(fontes(), "ia,manual,manual*", "fonte desconhecida vira manual; a nova é a ativa");
  assert.equal(R.acrescentarVarianteNaLista(sp.sname, raw, "ia"), false, "a partir de 3 recusa");
  assert.equal(lista().length, 3);
  // trocar a ativa substitui só ela
  assert.equal(R.trocarBuildAtivaNaLista(sp.sname, raw, "curada"), true);
  assert.equal(fontes(), "ia,manual,curada*");
  // sem ativa e cheia: troca a primeira
  lista().forEach((b) => { b.active = false; });
  R.trocarBuildAtivaNaLista(sp.sname, raw, "ia");
  assert.equal(fontes(), "ia*,manual,curada");
  // sem ativa e com vaga: acrescenta
  R.removerBuildDaLista(sp.sname, 2);
  lista().forEach((b) => { b.active = false; });
  R.trocarBuildAtivaNaLista(sp.sname, raw, "ia");
  assert.equal(fontes(), "ia,manual,ia*");
});

test("lista_de_builds: remover mantém uma ativa e apaga a chave da lista vazia; índice ruim não faz nada", () => {
  cenario([["ia", true], ["manual", false]]);
  assert.equal(R.removerBuildDaLista(sp.sname, 5), false);
  assert.equal(R.removerBuildDaLista(sp.sname, -1), false);
  assert.equal(R.removerBuildDaLista(sp.sname, 0), true);
  assert.equal(fontes(), "manual*", "a que sobrou vira a ativa");
  assert.equal(R.removerBuildDaLista(sp.sname, 0), true);
  assert.equal(sp.sname in R.state.customBuilds, false);
});

test("lista_de_builds: quem sai para abrir vaga = a mais antiga que não é ativa, nem preservada, nem manual protegida", () => {
  cenario([["manual", false], ["ia", true], ["ia", false]]);
  const [a, , c] = lista();
  assert.equal(R.buildQueSaiParaAbrirVaga(sp.sname, null, false).b, a, "a mais antiga");
  assert.equal(R.buildQueSaiParaAbrirVaga(sp.sname, a, false).b, c, "preservada fica");
  assert.equal(R.buildQueSaiParaAbrirVaga(sp.sname, null, true).b, c, "manual protegida fica");
  assert.equal(R.buildQueSaiParaAbrirVaga(sp.sname, c, true), null, "ninguém pode sair");
  cenario([["ia", true], ["ia", false]]);
  assert.equal(R.buildQueSaiParaAbrirVaga(sp.sname, null, false), null, "com vaga, ninguém sai");
  cenario([["ia", true], ["ia", false], ["ia", false]]);
  const saiu = R.liberarVagaNaLista(sp.sname, null, false);
  assert.equal(saiu.savedAt, "2026-10-02T00:00:00Z");
  assert.equal(lista().length, 2);
  assert.equal(R.liberarVagaNaLista(sp.sname, null, false), null);
});
