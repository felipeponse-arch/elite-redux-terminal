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
