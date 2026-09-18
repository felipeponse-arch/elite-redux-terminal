// Helpers compartilhados por todas as seções da Parte A (scripts/smoke_tests/NN_*.js).
// Extraído de scripts/smoke_test_suite.js (refactor de 2026-09-13, achado
// real da auditoria de QA: "2907 linhas, não é mais sustentável como
// arquivo único" - a divisão em arquivos por feature era exatamente a
// recomendação). Nenhuma lógica mudou aqui, só o lugar onde ela mora -
// var/function no topo de um indirect eval anexam ao escopo global
// compartilhado por TODOS os arquivos concatenados por
// scripts/smoke_test_suite.js's runLiveTests(), então cada seção
// referencia `check`/`wait`/etc. como se estivessem no mesmo arquivo,
// exatamente como antes da divisão.
var results = [];
function check(name, cond, detail) {
  results.push({ name, pass: !!cond, detail: detail || "" });
}
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
// Fixture obrigatória (item Q4 da pauta técnica, 2026-09-16): registra uma
// checagem de que o dado/elemento do teste foi encontrado e devolve o valor.
// Uso: if (achou("Grotom na busca", row)) { ... } - se a fixture sumir, o
// teste FALHA com esse nome, em vez de pular o bloco em silêncio e deixar o
// total de aprovados parecendo verde.
function achou(nome, valor, detalhe) {
  check("fixture encontrada: " + nome, !!valor, detalhe);
  return valor;
}
// Achado em auditoria de QA (2026-09-13): os 2 "flakes" documentados há
// muitas sessões (HP recomputado / anotação migrada) provavelmente vêm
// do mesmo padrão - um wait(ms) FIXO depois de disparar um evento,
// torcendo pra que o re-render/persist() já tenha terminado até lá.
// pollUntil() espera pela condição de verdade em vez de um tempo
// chutado - tenta a cada 10ms até `fn()` virar truthy ou o timeout
// estourar (aí faz uma última tentativa, caso o timeout bata bem na
// hora que a condição vira verdadeira).
async function pollUntil(fn, timeoutMs) {
  var start = Date.now();
  var limit = timeoutMs || 500;
  while (Date.now() - start < limit) {
    if (fn()) return true;
    await wait(10);
  }
  return !!fn();
}
// Reorganização em blocos colapsáveis (<details>), Fase 2, 2026-09-11:
// "Golpes"/"Anotações e builds de referência"/"Comparar" ficam FECHADOS
// por padrão (decisão da equipe - só "Auto Build" abre sozinho; "Conhecer
// a espécie" nem é <details> mais, ver abaixo). Um elemento dentro de um
// <details> fechado ainda existe no DOM (querySelector encontra), mas não
// está visível/interagível de verdade - qualquer teste que precise mexer
// em algo dentro de um grupo fechado chama isto primeiro. Acha pelo texto
// do <summary> (prefixo), não por índice, pra não quebrar se a ordem
// mudar. Guard em `d.querySelector("summary")` (2026-09-11, mesmo dia):
// "Conhecer a espécie" virou um <div> sem <summary> - sem o guard, o
// .find() abaixo quebrava com TypeError na primeira iteração (ela vem
// primeiro no DOM), derrubando a suíte inteira mesmo pra prefixos
// completamente sem relação, tipo "Golpes".
function openDetailGroup(summaryPrefix) {
  const groups = [...document.querySelectorAll(".detail-group")];
  const g = groups.find(function (d) {
    const summary = d.querySelector("summary");
    return summary && summary.textContent.indexOf(summaryPrefix) === 0;
  });
  if (g) g.open = true;
  return g;
}
function setSearch(q) {
  const el = document.getElementById("search-input");
  el.value = q;
  el.dispatchEvent(new Event("input", { bubbles: true }));
}
// Estado padrão da suíte (item Q1 da pauta técnica, 2026-09-16): o mesmo que a
// seção 01 monta - 6 no time, Eelektross na caixa, dificuldade Ace, sem level
// cap (Campeão), mega temporária, aba Dex. Antes as seções 02-09 e 15 só
// passavam porque herdavam isso da 01: rodando sozinhas (npm run
// test:isolated), 9 de 17 quebravam. Cada seção que precisa desse ponto de
// partida chama isto no começo, pelos mesmos controles que o jogador usa.
var TIME_PADRAO = ["Aerodactyl Mega", "Probopass", "Coalossal Mega", "Terrakion", "Avalugg Hisuian", "Tyranitar Mega Redux"];
async function prepararRunPadrao() {
  // "Novo jogo" trocou de window.confirm() pro <dialog> #confirm-modal
  // (auditoria de 2026-09-18, bug real do usuário) - o clique só abre o
  // diálogo agora, precisa confirmar de verdade clicando no botão dele.
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(30);
  var resetBtn = document.getElementById("reset-team-box-btn");
  if (!resetBtn.disabled) {
    resetBtn.click();
    await wait(30);
    var okBtn = document.getElementById("confirm-modal-ok");
    if (okBtn) okBtn.click();
    await wait(30);
  }
  document.getElementById("tabs-more-toggle").click();
  await wait(20);
  document.querySelector('#tabs-more-panel [data-tab="progress"]').click();
  await wait(50);
  function escolher(id, valor) {
    var el = document.getElementById(id);
    if (el.value === String(valor)) return;
    el.value = String(valor);
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }
  escolher("settings-difficulty", "ace");
  escolher("settings-level-cap", "more");
  escolher("settings-milestone", 9);
  escolher("settings-mega-mode", "temporaria");
  await wait(50);
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  for (var i = 0; i < TIME_PADRAO.length; i++) await addByName(TIME_PADRAO[i], false);
  await addByName("Eelektross", true);
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
}
// Chips de arquétipo (Ritmo/Clima/Monotype) substituíram os 3 <select>
// antigos no redesign de 2026-09-18 - clica o chip .arch-chip do eixo/
// valor pedido (value="" acha o chip "Nenhum"). Devolve o chip clicado
// (ou undefined se não achou), pra quem chamar decidir se isso é falha.
function selecionarArquetipo(axis, value) {
  var sel = '.arch-chip[data-axis="' + axis + '"][data-value="' + (value || "") + '"]';
  var chip = document.querySelector(sel);
  if (chip) chip.click();
  return chip;
}
async function addByName(name, toBox) {
  setSearch(name);
  await wait(120);
  const row = document.querySelector("#species-list .species-row");
  if (!row) { check("add " + name, false, "not found in list"); return; }
  row.click();
  await wait(30);
  const btn = document.getElementById(toBox ? "add-box-btn" : "add-team-btn");
  if (btn && !btn.disabled) btn.click();
  await wait(30);
}
