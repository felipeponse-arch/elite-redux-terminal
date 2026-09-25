// Seções 8, 9 e 10: dropdown 'Mais', resumo do dashboard e a calculadora de stat final de chefão.
// Extraído de scripts/smoke_test_suite.js (refactor 2026-09-13) - conteúdo idêntico ao original, só movido pra seu próprio arquivo.
async function section03() {
  await prepararRunPadrao();
  // --- 8. "Mais" dropdown (Progresso/Tipos) - design proposal A, 2026-09-09 ---
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  const moreToggle = document.getElementById("tabs-more-toggle");
  const morePanel = document.getElementById("tabs-more-panel");
  check("Mais panel starts hidden", morePanel.hidden === true);
  // The DOM property alone missed a real bug: .tabs-more-panel's own
  // `display: flex` (an author rule) always beat the browser's native
  // [hidden] handling regardless of the hidden attribute/property being
  // correctly set - found 2026-09-09 by actually looking at a fresh page
  // load, not by reading this same assertion. Check the rendered box too.
  check("Mais panel is actually invisible while hidden (not just .hidden===true)",
    getComputedStyle(morePanel).display === "none");
  moreToggle.click();
  check("Mais panel opens on click", morePanel.hidden === false);
  // Tipos fica sempre no "Mais"; Progresso vai pra barra principal em tela
  // larga (2026-09-24).
  const typesInPanel = morePanel.querySelector('[data-tab="types"]');
  if (typesInPanel) typesInPanel.click();
  await wait(30);
  check("selecting Tipos inside the panel activates that view",
    document.getElementById("view-types").classList.contains("active"));
  check("panel closes after selecting an item inside it", morePanel.hidden === true);
  check("Mais toggle highlights while Progresso/Tipos is active", moreToggle.classList.contains("active"));
  moreToggle.click();
  document.body.click();
  check("clicking outside the dropdown closes it", morePanel.hidden === true);
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  // --- 9. dashboard summary - design proposal B, 2026-09-09 ---
  document.getElementById("dex-shell").classList.remove("show-detail");
  const dash = document.querySelector(".dashboard-card");
  check("dashboard renders with a 6-member team", !!dash);
  check("dashboard shows team completeness", dash && dash.textContent.indexOf("6/6") !== -1);
  check("dashboard shows a shared-risk item", dash && dash.textContent.indexOf("fracos") !== -1);
  const suggestionLink = document.querySelector(".dash-suggestion .goto-species[data-x]");
  if (suggestionLink) {
    suggestionLink.click();
    await wait(30);
    check("clicking a dashboard suggestion opens its Dex detail",
      document.querySelector('.tab-btn[data-tab="dex"]').classList.contains("active") &&
      document.getElementById("dex-shell").classList.contains("show-detail"));
    document.getElementById("back-to-list").click();
    await wait(30);
  }

  // --- 9b. dashboard EMPILHADA acima da Dex, não ao lado (achado grave do
  // usuário, 2026-09-18: "a tela buga e some as informações do poke" -
  // reproduzia sempre ao ir de Meu Time -> clicar num Pokémon -> voltar pra
  // Dex). Causa real: #view-dex.active nunca tinha flex-direction definida
  // (caía no padrão "row"), e só havia correção pra isso abaixo de 860px -
  // funcionava "por sorte" enquanto o dashboard era estreito o bastante,
  // até a linha "Velocidade" (texto longo) quebrar essa sorte em qualquer
  // largura de desktop normal, espremendo .dex-shell numa fatia de poucos
  // px (conteúdo real no DOM, mas ilegível na tela - por isso "sumia" sem
  // erro nenhum no console). Testado num viewport de verdade (não só a
  // regra CSS em isolado) pra pegar exatamente essa classe de regressão. ----
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);
  const teamHead = document.querySelector(".ts-head.goto-species");
  if (achou("cabeçalho de um membro do time (pra navegar de volta pra Dex)", teamHead)) {
    teamHead.click();
    await wait(60);
    const dashEl = document.getElementById("dashboard");
    const shellEl = document.getElementById("dex-shell");
    const dashRect = dashEl.getBoundingClientRect();
    const shellRect = shellEl.getBoundingClientRect();
    check("dashboard e a Dex ficam EMPILHADOS (dashboard acima, shell abaixo) - nunca lado a lado",
      shellRect.top >= dashRect.bottom - 1, JSON.stringify({ dashBottom: dashRect.bottom, shellTop: shellRect.top }));
    check("a Dex usa a largura inteira da tela (não espremida ao lado do dashboard)",
      shellRect.width >= window.innerWidth * 0.9, shellRect.width + " de " + window.innerWidth);
    document.getElementById("back-to-list") && document.getElementById("back-to-list").click();
    await wait(30);
  }

  // --- 10. boss final-stat calculator - 2026-09-09 field-research follow-up ---
  document.querySelector('.tab-btn[data-tab="bosses"]').click();
  await wait(50);
  const bossRow = document.querySelector("#boss-list .species-row");
  if (bossRow) {
    bossRow.click();
    await wait(50);
    const levelInput = document.getElementById("boss-level-input");
    check("boss level input exists with a sensible default", levelInput && parseInt(levelInput.value, 10) >= 1);
    check("stats render for at least one boss party member", !!document.querySelector("#boss-detail .bm-stats"));
    if (levelInput) {
      // Achado em auditoria de QA (2026-09-13), causa raiz de verdade da
      // flake documentada há muitas sessões (não era timing nenhum): o
      // seletor `.bm-stats .bm-stat .mono` NÃO era escopado ao chefão -
      // `.bm-stats`/`.bm-stat`/`.mono` são reusados também pelo card
      // "Builds de referência" da Dex (buildHistoryHtml(), linha ~3980,
      // nível FIXO, não bossState.level) e, por causa disso, dentro de
      // CADA card do Meu Time que tem histórico de build
      // (renderTeam() -> buildHistoryHtml(sp), linha ~4910). Como o time
      // seed desta suíte (6 membros) já entra com histórico, e a aba Time
      // vem ANTES da aba Chefões no HTML, um `document.querySelector`
      // global pegava o PRIMEIRO desses blocos (de nível fixo, dentro de
      // #team-slots, ainda no DOM mesmo com a aba escondida) em vez do
      // card de verdade do chefão - por isso HP nunca "mudava", em
      // qualquer nível. Escopar a `#boss-detail` resolve na causa raiz.
      var hpBefore = document.querySelector("#boss-detail .bm-stats .bm-stat .mono").textContent;
      var targetLevel = levelInput.value === "100" ? "50" : "100";
      levelInput.value = targetLevel;
      levelInput.dispatchEvent(new Event("change", { bubbles: true }));
      await pollUntil(function () {
        var el = document.querySelector("#boss-detail .bm-stats .bm-stat .mono");
        return !!el && el.textContent !== hpBefore;
      });
      var hpAfter = document.querySelector("#boss-detail .bm-stats .bm-stat .mono").textContent;
      check("changing level recomputes stats (HP changes) without losing the typed value",
        document.getElementById("boss-level-input").value === targetLevel && hpAfter !== hpBefore,
        "before=" + hpBefore + " after=" + hpAfter);
    }
    document.getElementById("boss-shell").classList.remove("show-detail");
  } else {
    check("at least one boss found to test the stat calculator", false);
  }
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

}
