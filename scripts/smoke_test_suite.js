// Consolidated smoke-test suite for artifact_final.html - dev review, 2026-09-09:
// "toda correcao dependeu de eu lembrar de rodar aqueles trechos de JS na mao"
// (from the old scripts/manual_smoke_tests.md, since removed - fully
// superseded by this file, 2026-09-09, part of a broader pass removing
// things "Meu build"/sync made obsolete) "e so eu conferindo o resultado a
// olho, sem garantia nenhuma de que eu li certo". This doesn't add a real
// test *runner* (no node/npm/browser-test-framework in this environment -
// see AUDITORIA-DOSSIE.md section 13) - it removes the "read the result by
// eye" step: every check below asserts and reports PASS/FAIL itself,
// instead of returning a raw value the caller has to compare against a
// comment.
//
// Two parts, because a page reload always ends whatever script triggered it
// (the Browser tool's javascript_tool call dies with the page) - they can't
// be merged into one call no matter how this file is organized:
//
//   PART A (runLiveTests) - everything drivable without a reload. Paste the
//     whole function into the console (or run via javascript_tool) on a
//     freshly loaded page, then call runLiveTests(). Seeds its own team/box
//     via the real UI (search -> click -> add), same as a user would, so it
//     doubles as an interaction test, not just a state check. Clears
//     localStorage when done.
//
//   PART B (2 separate snippets below) - the save-orphan/milestone-clamp
//     test, which genuinely needs a reload between "write a fake save" and
//     "assert the app read it correctly". Run snippet B1, reload the page
//     (navigate to the same URL), then run snippet B2.
//
//   PART C (1 snippet below, run standalone) - the fail-fast build-integrity
//     check (2026-09-09, post-audit). Can't run inside PART A: it needs the
//     page to actually load artifact_template.html (raw, unbuilt) instead of
//     artifact_final.html, a different URL/file entirely, not just a
//     different in-page state. Navigate to artifact_template.html served
//     locally, then run snippet C.
//
// To serve the build locally first: a plain HTTP server (not file://, some
// things behave differently) rooted at this project folder, e.g. a simple
// PowerShell HttpListener on port 8100 serving artifact_final.html, opened
// in the Browser tool via preview_start.

// ============================== PART A ==============================
// Refactor de 2026-09-13 (achado real da auditoria de QA: "2907 linhas,
// não é mais sustentável como arquivo único" - splitting recomendado
// pela própria auditoria). A Parte A não mora mais inteira aqui - virou
// ~12 arquivos pequenos em scripts/smoke_tests/ (helpers compartilhados +
// 1 arquivo por grupo de seções + o orquestrador), listados em
// scripts/smoke_tests/manifest.json. runLiveTests() continua sendo o
// jeito de rodar tudo (fetch + slice neste marcador + eval, exatamente
// como sempre foi) - só que agora ELE MESMO busca e concatena os arquivos
// do manifest antes de montar e chamar a suíte de verdade. Quem chama
// runLiveTests() (uso manual no console, tests/run_ci_smoke.mjs) não
// precisa mudar nada.
async function runLiveTests() {
  const base = "/scripts/smoke_tests/";
  const manifest = await (await fetch(base + "manifest.json")).json();
  let combined = "";
  for (const file of manifest) {
    combined += (await (await fetch(base + file)).text()) + "\n";
  }
  combined += "\nwindow.__smokeTestsRunAllSections = runAllSections;\n";
  // eslint-disable-next-line no-eval -- carregador da suíte: roda os arquivos de scripts/smoke_tests na página
  (0, eval)(combined);
  return await window.__smokeTestsRunAllSections();
}

// ============================== PART B ==============================
// B1 - run this FIRST, then reload the page (navigate to the same URL):
/*
localStorage.clear();
const fakeSave = {
  v: 2, dataVersion: "test", savedAt: new Date().toISOString(),
  team: ["SPECIES_CHARIZARD", "SPECIES_TOTALLY_MADE_UP_FUTURE_MON"],
  box: ["SPECIES_ANOTHER_FAKE_ONE"],
  savedTeams: [], settings: { difficulty: "ace", milestone: 999999 }
};
localStorage.setItem("er_terminal_save", JSON.stringify(fakeSave));
"B1 done - now reload the page, then run B2";
*/

// B2 - run this AFTER reloading:
/*
(function () {
  const results = [];
  function check(name, cond, detail) { results.push({ name, pass: !!cond, detail: detail || "" }); }
  // #settings-milestone starts with zero <option>s in the markup - it's only
  // populated by initProgress(), lazily, the first time the Progresso tab is
  // opened (same lazy-init pattern as Chefoes). Checking it before that just
  // measures an empty select, not the actual clamp (which lives in the
  // closure-private `state.settings.milestone`, unreachable from outside -
  // this IS the real, DOM-visible proxy for it).
  document.querySelector('.tab-btn[data-tab="progress"]').click();
  const milestoneEl = document.getElementById("settings-milestone");
  const maxOption = milestoneEl ? milestoneEl.options.length - 1 : null;
  check("milestone clamped to a valid option on load",
    milestoneEl && parseInt(milestoneEl.value, 10) === maxOption,
    "value=" + (milestoneEl && milestoneEl.value) + " max=" + maxOption);
  // force a real persist() via the UI, then check orphans survived it
  if (milestoneEl) milestoneEl.dispatchEvent(new Event("change", { bubbles: true }));
  const saved = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
  check("orphan team member survives a real persist()",
    (saved.team || []).indexOf("SPECIES_TOTALLY_MADE_UP_FUTURE_MON") !== -1);
  check("orphan box member survives a real persist()",
    (saved.box || []).indexOf("SPECIES_ANOTHER_FAKE_ONE") !== -1);
  const passed = results.filter(r => r.pass).length;
  console.log("=== smoke_test_suite PART B: " + passed + "/" + results.length + " passed ===");
  results.forEach(r => console.log((r.pass ? "PASS" : "FAIL") + "  " + r.name + (r.detail ? "  (" + r.detail + ")" : "")));
  localStorage.clear();
  return results;
})();
*/

// ============================== PART C ==============================
// Run standalone: navigate to artifact_template.html (raw, unbuilt) served
// locally, THEN run this snippet. Regression coverage for the fail-fast
// build-integrity check added 2026-09-09 after the wrong-file publish
// incident - artifact_template.html always has unfilled placeholders (it's
// the source, not the build output), so #dexdata never starts with "{"
// there and the check should always fire on it.
/*
(function () {
  const results = [];
  function check(name, cond, detail) { results.push({ name, pass: !!cond, detail: detail || "" }); }
  const bodyText = document.body.textContent || "";
  check("fail-fast message shows instead of a silent crash",
    bodyText.indexOf("Build incompleto publicado") !== -1, bodyText.slice(0, 200));
  check("fail-fast message names the actual mistake (wrong file)",
    bodyText.indexOf("artifact_template.html") !== -1 && bodyText.indexOf("artifact_final.html") !== -1);
  check("app never rendered species rows on top of the error (no silent partial run)",
    document.querySelectorAll("#species-list .species-row").length === 0);
  const passed = results.filter(r => r.pass).length;
  console.log("=== smoke_test_suite PART C: " + passed + "/" + results.length + " passed ===");
  results.forEach(r => console.log((r.pass ? "PASS" : "FAIL") + "  " + r.name + (r.detail ? "  (" + r.detail + ")" : "")));
  return results;
})();
*/

// ============================== PART D ==============================
// Sort order + type filter persistence, Fase 1, 2026-09-09 - genuinely
// needs a reload between "set a preference" and "confirm it survived",
// same reason Part B is split. Run D1, reload the page, then run D2.
// D1 - run this FIRST, then reload the page (navigate to the same URL):
/*
(function () {
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  const sel = document.getElementById("sort-select");
  sel.value = "rank";
  sel.dispatchEvent(new Event("change", { bubbles: true }));
  document.getElementById("type-filter-toggle").click();
  const fireCb = [...document.querySelectorAll(".type-check input")].find(cb => cb.parentElement.textContent.trim() === "Fire");
  fireCb.checked = true;
  fireCb.dispatchEvent(new Event("change", { bubbles: true }));
  return "D1 done - sort=rank, type filter=Fire - now reload the page, then run D2";
})();
*/

// D2 - run this AFTER reloading:
/*
(function () {
  const results = [];
  function check(name, cond, detail) { results.push({ name, pass: !!cond, detail: detail || "" }); }
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  check("sort order restored to 'rank' after reload",
    document.getElementById("sort-select").value === "rank");
  const fireCb = [...document.querySelectorAll(".type-check input")].find(cb => cb.parentElement.textContent.trim() === "Fire");
  check("Fire type-filter checkbox restored as checked after reload",
    fireCb && fireCb.checked === true);
  check("species list actually reflects the restored filter (Fire-only)",
    document.querySelectorAll("#species-list .species-row").length > 0 &&
    document.querySelectorAll("#species-list .species-row").length < 1906);
  const passed = results.filter(r => r.pass).length;
  console.log("=== smoke_test_suite PART D: " + passed + "/" + results.length + " passed ===");
  results.forEach(r => console.log((r.pass ? "PASS" : "FAIL") + "  " + r.name + (r.detail ? "  (" + r.detail + ")" : "")));
  localStorage.clear();
  return results;
})();
*/

// ============================== PART E ==============================
// Sincronizacao entre aparelhos (db), 2026-09-11 - item 3 da lista do
// Gerente na reuniao de 2026-09-10 ("o mock que resolveu o teste da IA pode
// se aplicar tambem a sincronizacao"). Ao contrario do mock de IA (que
// injeta window.claude a qualquer momento, porque generateBuildWithAI() so
// chama claude.use() no clique do botao), wireSync() roda UMA UNICA VEZ, na
// carga da pagina, dentro da IIFE principal do app - nao ha reentrada
// exposta pra injetar window.claude depois que a pagina ja carregou. A
// unica forma de testar o mecanismo REAL (nao uma simulacao por fora) e
// window.claude ja existir ANTES do <script> do app rodar.
//
// Por isso o mock mora no PROPRIO SERVIDOR DE DEV LOCAL
// (scripts/dev_server.ps1, nunca no artifact_final.html publicado): quando
// a URL leva "?mock_db=1" (e opcionalmente "&seed=<json codificado>"), o
// servidor injeta um pequeno <script> no INICIO do arquivo, antes de
// qualquer outra tag - window.claude.use("db") entao resolve pra um db
// falso em memoria (docs = {"sync/save": ...}), com os mesmos metodos reais
// que o app usa (doc().get()/.set()/.onSnapshot()). window.__fakeSyncDocs
// deixa inspecionar o estado "remoto" depois; window.__fakeSyncPushRemote()
// simula uma mudanca chegando de OUTRO aparelho enquanto esta pagina segue
// aberta (o caminho do onSnapshot, que nao tem outro jeito de exercitar).
//
// Cada cenario abaixo exige sua PROPRIA navegacao (nunca da pra rodar tudo
// numa unica chamada, como a PART A) - depois de rodar o "setup" de um
// cenario, ele imprime a URL exata pra navegar; rode o "assert" logo em
// seguida, na pagina carregada por essa URL. Charizard (forma final, sem
// evolucao possivel) é usado como fixture em todo cenario que precisa de um
// time real, especificamente pra nao confundir o resultado com a
// auto-evolucao por level cap (pacote separado, 2026-09-10) - Bulbasaur foi
// tentado primeiro e evoluiu sozinho pra Ivysaur em alguns recarregamentos,
// mascarando se a MUDANCA observada veio da sincronizacao ou da evolucao.
//
// Servidor de dev precisa estar rodando com o dev_server.ps1 ATUALIZADO
// (reinicie o processo se ele já estava de pé antes desta mudança).

// E1 - sem doc remoto ainda (instalacao nova): wireSync() deve semear o
// remoto com o save local (ou um save vazio, se local tambem nao existir).
// Rode isto, depois navegue pra "http://localhost:8100/artifact_final.html?mock_db=1"
// (sem "seed") e rode E1_assert.
/*
(function () {
  localStorage.clear();
  return "localStorage limpo - agora navegue para http://localhost:8100/artifact_final.html?mock_db=1 e rode E1_assert";
})();
*/
/*
(async function E1_assert() {
  await new Promise(r => setTimeout(r, 250));
  const results = [];
  function check(name, cond, detail) { results.push({ name, pass: !!cond, detail: detail || "" }); }
  const local = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
  const remoteDocs = window.__fakeSyncDocs || {};
  check("mock de db foi injetado (window.claude existe)", typeof window.claude !== "undefined");
  check("sem doc remoto previo, wireSync() semeia o remoto com o save local",
    JSON.stringify(remoteDocs["sync/save"]) === JSON.stringify(local),
    JSON.stringify(remoteDocs["sync/save"]));
  check("banner de sync nao aparece numa instalacao nova (nada pra conciliar)",
    document.getElementById("sync-banner").hidden === true);
  const passed = results.filter(r => r.pass).length;
  console.log("=== smoke_test_suite PART E1: " + passed + "/" + results.length + " passed ===");
  results.forEach(r => console.log((r.pass ? "PASS" : "FAIL") + "  " + r.name + (r.detail ? "  (" + r.detail + ")" : "")));
  return results;
})();
*/

// E2 - remoto tem conteudo DIFERENTE e é mais NOVO que o local: wireSync()
// deve puxar o remoto por cima do local e mostrar o banner "mais novo de
// outro aparelho". Fluxo em 3 passos, cada um numa pagina carregada por vez
// (achado ao validar isto ao vivo, 2026-09-11: localStorage.clear() NUNCA
// reseta sozinho o `state.team` que ja esta em memoria - só um reload de
// verdade faz isso. Rodar "clear" e "montar time" no mesmo script, sem
// recarregar entre os dois, deixa o time antigo (de um cenario anterior)
// preso em memoria e ele so ACUMULA junto com o time novo, em vez de ser
// substituido - foi exatamente isso que aconteceu ao escrever este pacote
// de testes na primeira tentativa):
//   1. Rode E2_clear, depois NAVEGUE (reload de verdade) para
//      http://localhost:8100/artifact_final.html (SEM mock_db).
//   2. Rode E2_setup nessa pagina recem-carregada - ele monta o time e
//      imprime a URL com "?mock_db=1&seed=...".
//   3. Navegue ate essa URL e rode E2_assert.
/*
(function E2_clear() {
  localStorage.clear();
  return "localStorage limpo - agora navegue (reload de verdade) para http://localhost:8100/artifact_final.html SEM mock_db, depois rode E2_setup";
})();
*/
/*
(async function E2_setup() {
  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  const el = document.getElementById("search-input");
  el.value = "Charizard";
  el.dispatchEvent(new Event("input", { bubbles: true }));
  await wait(120);
  document.querySelector("#species-list .species-row").click();
  await wait(50);
  document.getElementById("add-team-btn").click();
  await wait(80);
  const local = JSON.parse(localStorage.getItem("er_terminal_save"));
  const remote = JSON.parse(JSON.stringify(local));
  remote.team = ["SPECIES_VENUSAUR"]; // conteudo diferente do local (Charizard)
  remote.savedAt = new Date(Date.now() + 60000).toISOString(); // 1 min no futuro - mais novo que o local
  const url = "http://localhost:8100/artifact_final.html?mock_db=1&seed=" + encodeURIComponent(JSON.stringify(remote));
  console.log("Navegue para:", url);
  return url;
})();
*/
/*
(async function E2_assert() {
  await new Promise(r => setTimeout(r, 250));
  const results = [];
  function check(name, cond, detail) { results.push({ name, pass: !!cond, detail: detail || "" }); }
  const local = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
  check("remoto mais novo com conteudo diferente sobrescreve o local",
    JSON.stringify(local.team) === JSON.stringify(["SPECIES_VENUSAUR"]), JSON.stringify(local.team));
  check("banner avisa que um save mais novo de outro aparelho foi encontrado",
    document.getElementById("sync-banner").hidden === false &&
    document.getElementById("sync-banner-text").textContent.indexOf("mais novo de outro aparelho") !== -1,
    document.getElementById("sync-banner-text").textContent);
  const passed = results.filter(r => r.pass).length;
  console.log("=== smoke_test_suite PART E2: " + passed + "/" + results.length + " passed ===");
  results.forEach(r => console.log((r.pass ? "PASS" : "FAIL") + "  " + r.name + (r.detail ? "  (" + r.detail + ")" : "")));
  return results;
})();
*/

// E3 - remoto tem conteudo DIFERENTE mas é mais VELHO que o local: local
// vence e é empurrado pra cima (syncRef.set()), sem banner nenhum (o
// usuario nao precisa saber que o proprio save dele foi republicado). Mesmo
// fluxo de 3 passos do E2 (E3_clear -> reload de verdade sem mock_db ->
// E3_setup -> navegar -> E3_assert) - o reload entre limpar e montar o
// time NAO e opcional, ver o comentario acima do E2.
/*
(function E3_clear() {
  localStorage.clear();
  return "localStorage limpo - agora navegue (reload de verdade) para http://localhost:8100/artifact_final.html SEM mock_db, depois rode E3_setup";
})();
*/
/*
(async function E3_setup() {
  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  const el = document.getElementById("search-input");
  el.value = "Charizard";
  el.dispatchEvent(new Event("input", { bubbles: true }));
  await wait(120);
  document.querySelector("#species-list .species-row").click();
  await wait(50);
  document.getElementById("add-team-btn").click();
  await wait(80);
  const local = JSON.parse(localStorage.getItem("er_terminal_save"));
  const remote = JSON.parse(JSON.stringify(local));
  remote.team = ["SPECIES_VENUSAUR"];
  remote.savedAt = new Date(Date.now() - 3600000).toISOString(); // 1h no passado - mais velho que o local
  const url = "http://localhost:8100/artifact_final.html?mock_db=1&seed=" + encodeURIComponent(JSON.stringify(remote));
  console.log("Navegue para:", url);
  return url;
})();
*/
/*
(async function E3_assert() {
  await new Promise(r => setTimeout(r, 250));
  const results = [];
  function check(name, cond, detail) { results.push({ name, pass: !!cond, detail: detail || "" }); }
  const local = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
  check("local mais recente com conteudo diferente NAO e sobrescrito pelo remoto",
    JSON.stringify(local.team) === JSON.stringify(["SPECIES_CHARIZARD"]), JSON.stringify(local.team));
  check("local vencedor e empurrado pro remoto (doc falso passa a refletir o local)",
    JSON.stringify((window.__fakeSyncDocs["sync/save"] || {}).team) === JSON.stringify(["SPECIES_CHARIZARD"]));
  check("nenhum banner aparece quando e o proprio local que venceu",
    document.getElementById("sync-banner").hidden === true);
  const passed = results.filter(r => r.pass).length;
  console.log("=== smoke_test_suite PART E3: " + passed + "/" + results.length + " passed ===");
  results.forEach(r => console.log((r.pass ? "PASS" : "FAIL") + "  " + r.name + (r.detail ? "  (" + r.detail + ")" : "")));
  return results;
})();
*/

// E4 - conteudo IDENTICO entre local e remoto, so o savedAt difere: esta e
// a regressao mais importante deste pacote - o motivo original da reescrita
// de "comparar timestamp" pra "comparar conteudo" (ver o comentario de
// syncContentDiffers() mais acima neste arquivo/no app): um savedAt
// diferente sozinho NAO pode disparar nem escrita nem banner. Mesmo fluxo de
// 3 passos (E4_clear -> reload de verdade sem mock_db -> E4_setup ->
// navegar -> E4_assert).
/*
(function E4_clear() {
  localStorage.clear();
  return "localStorage limpo - agora navegue (reload de verdade) para http://localhost:8100/artifact_final.html SEM mock_db, depois rode E4_setup";
})();
*/
/*
(async function E4_setup() {
  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  const el = document.getElementById("search-input");
  el.value = "Charizard";
  el.dispatchEvent(new Event("input", { bubbles: true }));
  await wait(120);
  document.querySelector("#species-list .species-row").click();
  await wait(50);
  document.getElementById("add-team-btn").click();
  await wait(80);
  const local = JSON.parse(localStorage.getItem("er_terminal_save"));
  const remote = JSON.parse(JSON.stringify(local)); // MESMO conteudo
  remote.savedAt = new Date(Date.now() - 3600000).toISOString(); // só o timestamp difere
  window.__E4_seedSavedAt = remote.savedAt;
  const url = "http://localhost:8100/artifact_final.html?mock_db=1&seed=" + encodeURIComponent(JSON.stringify(remote));
  console.log("Navegue para:", url, "- savedAt semeado:", remote.savedAt);
  return url;
})();
*/
/*
(async function E4_assert(seedSavedAt) {
  // seedSavedAt: cole aqui o "savedAt semeado" impresso pelo E4_setup
  // (window.__E4_seedSavedAt nao sobrevive a navegacao - e outra pagina).
  await new Promise(r => setTimeout(r, 250));
  const results = [];
  function check(name, cond, detail) { results.push({ name, pass: !!cond, detail: detail || "" }); }
  const local = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
  check("local mantem seu proprio savedAt (nao adota o do remoto so pq e diferente)",
    local.savedAt !== seedSavedAt, local.savedAt);
  check("conteudo identico -> NENHUMA escrita no remoto (savedAt semeado permanece intacto)",
    (window.__fakeSyncDocs["sync/save"] || {}).savedAt === seedSavedAt,
    (window.__fakeSyncDocs["sync/save"] || {}).savedAt);
  check("nenhum banner aparece quando o conteudo já e identico",
    document.getElementById("sync-banner").hidden === true);
  const passed = results.filter(r => r.pass).length;
  console.log("=== smoke_test_suite PART E4: " + passed + "/" + results.length + " passed ===");
  results.forEach(r => console.log((r.pass ? "PASS" : "FAIL") + "  " + r.name + (r.detail ? "  (" + r.detail + ")" : "")));
  return results;
})("COLE_AQUI_O_SAVEDAT_IMPRESSO_PELO_E4_SETUP");
*/

// E5 - onSnapshot ao vivo: outro aparelho salva enquanto ESTA pagina segue
// aberta (sem reload nenhum). E o unico cenario que dispensa navegacao -
// window.__fakeSyncPushRemote() simula a mensagem chegando em tempo real.
// Rode com a pagina em QUALQUER estado de mock_db=1 ja carregado (por
// exemplo, logo depois de E1/E2/E3/E4_assert, sem navegar de novo).
/*
(async function E5_liveSnapshot() {
  const results = [];
  function check(name, cond, detail) { results.push({ name, pass: !!cond, detail: detail || "" }); }
  if (typeof window.__fakeSyncPushRemote !== "function") {
    check("mock de db (window.__fakeSyncPushRemote) disponivel nesta pagina", false);
  } else {
    const base = (window.__fakeSyncDocs && window.__fakeSyncDocs["sync/save"]) || {};
    const pushed = JSON.parse(JSON.stringify(base));
    pushed.team = ["SPECIES_BLAZIKEN_MEGA"];
    pushed.savedAt = new Date().toISOString();
    window.__fakeSyncPushRemote("sync/save", pushed);
    await new Promise(r => setTimeout(r, 100));
    const local = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
    check("mudanca ao vivo de outro aparelho e aplicada sem reload",
      JSON.stringify(local.team) === JSON.stringify(["SPECIES_BLAZIKEN_MEGA"]), JSON.stringify(local.team));
    check("banner avisa que o time foi atualizado em outro aparelho AGORA (nao 'mais novo', tempo real)",
      document.getElementById("sync-banner").hidden === false &&
      document.getElementById("sync-banner-text").textContent.indexOf("atualizado em outro aparelho agora") !== -1,
      document.getElementById("sync-banner-text").textContent);
  }
  const passed = results.filter(r => r.pass).length;
  console.log("=== smoke_test_suite PART E5: " + passed + "/" + results.length + " passed ===");
  results.forEach(r => console.log((r.pass ? "PASS" : "FAIL") + "  " + r.name + (r.detail ? "  (" + r.detail + ")" : "")));
  return results;
})();
*/

// E6 - onSnapshot ao vivo, achado real do usuario 2026-09-12 (dois times
// divergentes entre celular e navegador): ao contrario de E5 (remoto
// genuinamente mais novo, deve aplicar), este cenario simula um remoto
// ATRASADO chegando DEPOIS que este aparelho ja salvou algo mais novo -
// antes desta correcao, o onSnapshot aceitava QUALQUER conteudo diferente
// sem checar savedAt, entao o aparelho "vencedor" da corrida podia ser
// silenciosamente revertido pelo eco atrasado do outro. Rode com a pagina
// em QUALQUER estado de mock_db=1 ja carregado, igual E5.
/*
(async function E6_staleLiveSnapshotRejected() {
  const results = [];
  function check(name, cond, detail) { results.push({ name, pass: !!cond, detail: detail || "" }); }
  if (typeof window.__fakeSyncPushRemote !== "function") {
    check("mock de db (window.__fakeSyncPushRemote) disponivel nesta pagina", false);
  } else {
    // 1. Este aparelho salva algo novo AGORA (savedAt recente de verdade).
    const el = document.getElementById("search-input");
    el.value = "Squirtle";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise(r => setTimeout(r, 150));
    const row = document.querySelector("#species-list .species-row");
    if (row) {
      row.click();
      await new Promise(r => setTimeout(r, 50));
      const btn = document.getElementById("add-team-btn");
      if (btn && !btn.disabled) btn.click();
      await new Promise(r => setTimeout(r, 100));
    }
    const localAfterOwnSave = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
    // 2. Simula o eco ATRASADO de outro aparelho - conteudo diferente, mas
    // savedAt CLARAMENTE mais velho que o que este aparelho acabou de salvar.
    const stale = JSON.parse(JSON.stringify(localAfterOwnSave));
    stale.team = ["SPECIES_MAGIKARP"];
    stale.savedAt = "2020-01-01T00:00:00.000Z";
    window.__fakeSyncPushRemote("sync/save", stale);
    await new Promise(r => setTimeout(r, 100));
    const localAfterStalePush = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
    check("remoto ATRASADO/mais velho NAO sobrescreve o local mais novo",
      JSON.stringify(localAfterStalePush.team) === JSON.stringify(localAfterOwnSave.team),
      localAfterStalePush.team);
    check("o remoto obsoleto e corrigido de volta pro valor local (nao fica divergente no servidor)",
      JSON.stringify(window.__fakeSyncDocs["sync/save"].team) === JSON.stringify(localAfterOwnSave.team),
      window.__fakeSyncDocs["sync/save"].team);
  }
  const passed = results.filter(r => r.pass).length;
  console.log("=== smoke_test_suite PART E6: " + passed + "/" + results.length + " passed ===");
  results.forEach(r => console.log((r.pass ? "PASS" : "FAIL") + "  " + r.name + (r.detail ? "  (" + r.detail + ")" : "")));
  return results;
})();
*/

// E7 - reconexao automatica depois de "conexao de sincronizacao perdida"
// (achado real do usuario, 2026-09-13: viu esse aviso na tela e perguntou o
// que significava - o app so avisava, nunca tentava reconectar sozinho,
// deixando o jogador preso em "so neste aparelho" ate lembrar de recarregar
// a pagina na mao). window.__fakeSyncTriggerError(path) (novo no mock,
// nesta mesma correcao) dispara o error callback real do onSnapshot, o
// mesmo caminho que uma queda de rede de verdade dispararia. Rode com a
// pagina em QUALQUER estado de mock_db=1 ja carregado, igual E5/E6.
/*
(async function E7_autoReconnect() {
  const results = [];
  function check(name, cond, detail) { results.push({ name, pass: !!cond, detail: detail || "" }); }
  if (typeof window.__fakeSyncTriggerError !== "function") {
    check("mock de db (window.__fakeSyncTriggerError) disponivel nesta pagina", false);
  } else {
    const indicator = document.getElementById("sync-status-indicator");
    window.__fakeSyncTriggerError("sync/save");
    await new Promise(r => setTimeout(r, 50));
    check("indicador avisa 'conexao perdida' na hora, depois 'reconectando' (nunca fica calado)",
      indicator.textContent.indexOf("reconectando") !== -1, indicator.textContent);
    // Primeiro retry agendado pra 5s (backoff exponencial comeca em 5000ms) -
    // espera um pouco mais pra dar folga em maquina lenta.
    await new Promise(r => setTimeout(r, 5500));
    check("reconecta sozinho sem precisar recarregar a pagina (volta pra 'sincronizado')",
      indicator.textContent === "sincronizado entre aparelhos", indicator.textContent);
  }
  const passed = results.filter(r => r.pass).length;
  console.log("=== smoke_test_suite PART E7: " + passed + "/" + results.length + " passed ===");
  results.forEach(r => console.log((r.pass ? "PASS" : "FAIL") + "  " + r.name + (r.detail ? "  (" + r.detail + ")" : "")));
  return results;
})();
*/
