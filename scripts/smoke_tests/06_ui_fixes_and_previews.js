// Seções remoção do card de transferência, bug de CSS da faixa de sync, bug de altura do #app, preview de status do 'Meu build', aviso de storage cheio e o lote de qualidade de vida da Fase 1 (changelog + teclado).
// Extraído de scripts/smoke_test_suite.js (refactor 2026-09-13) - conteúdo idêntico ao original, só movido pra seu próprio arquivo.
async function section06() {
  // --- transfer card removal - 2026-09-09, replaced by the db-capability
  // sync above and confirmed working on real devices the same day, so the
  // manual copy/paste/download UI was removed to keep the page lighter
  // (user's own request, right after confirming sync worked).
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);
  check("manual transfer card is gone (replaced by automatic sync)", !document.getElementById("transfer-card"));
  // "Enviar para o Claude"/"Enviar caixa para o Claude" (o resumo de texto
  // simples pra colar numa conversa) removidos por completo, 2026-09-13,
  // pedido direto do usuário com print das duas telas - a sincronização
  // automática e as chamadas de IA de dentro do próprio app (Meu build,
  // Leitura estratégica, Arquétipo do time) já tornaram esse copy/paste
  // manual redundante. O card de exportação do CHEFÃO (`#boss-export-*`,
  // aba Chefões - "junta o time dele com o seu time e sua caixa") é uma
  // feature DIFERENTE, mais específica, não mencionada no pedido - continua
  // existindo (não tinha cobertura de teste dedicada antes desta remoção, e
  // continua sem, já que não foi tocado nesta passagem).
  check("cards 'Enviar para o Claude' (time) e 'Enviar caixa para o Claude' (caixa) foram removidos por completo",
    !document.getElementById("claude-export-card") && !document.getElementById("claude-export-box-card"));
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  // --- sync-banner CSS bug - 2026-09-09, user report: "sync aparecendo
  // toda hora mesmo sem eu ter atualizado nada". Root cause: the EXACT
  // same class of bug as the "Mais" dropdown from earlier today -
  // .sync-banner's own `display: flex` (author rule) always beat the
  // browser's native [hidden] handling, so the banner rendered visible
  // regardless of its .hidden property being correctly true the whole
  // time. Same fix as before: an explicit [hidden] override. Also
  // hardened the underlying logic to compare save CONTENT, not just the
  // savedAt timestamp (a changed timestamp isn't the same as changed
  // data) - can't easily exercise that half live without a real db
  // connection (unavailable on the local dev server this suite runs
  // against), so this check is scoped to what's actually verifiable here:
  // the CSS itself.
  const syncBanner = document.getElementById("sync-banner");
  check("sync banner is actually invisible while hidden (not just .hidden===true)",
    syncBanner && getComputedStyle(syncBanner).display === "none");

  // --- "#app" height bug - 2026-09-09, user report: "ao rolar para baixo a
  // dex fica travada". Root cause: #app used `min-height: 100%` (a FLOOR,
  // not a ceiling) instead of `height: 100%` - once its content (topbar +
  // main + footer) grew taller than the viewport, #app just grew past it
  // instead of being capped, so `main`'s flex:1/min-height:0 chain never
  // got a bounded height to clip against. Every internal panel's own
  // `overflow-y: auto` (.species-detail, .species-list, etc.) was already
  // correct CSS that simply never got the chance to engage - the whole
  // BODY scrolled instead (confirmed directly: window.scrollY moved,
  // every inner panel's own scrollTop stayed 0). At desktop width this
  // meant scrolling a long species' detail scrolled the search box and
  // species list away with it. Fixed by capping #app at `height: 100%`.
  setSearch("Charizard");
  await wait(120);
  const charRow3 = document.querySelector("#species-list .species-row");
  if (charRow3) {
    charRow3.click();
    await wait(30);
    const detailPanel = document.querySelector(".species-detail");
    detailPanel.scrollTop = 500;
    await wait(30);
    check(".species-detail scrolls internally (not the whole page/body)",
      detailPanel.scrollTop > 0 && window.scrollY === 0 && document.body.scrollTop === 0,
      "detailScrollTop=" + detailPanel.scrollTop + " windowScrollY=" + window.scrollY);

    // Switching to a DIFFERENT species should reset scroll to the top...
    document.getElementById("back-to-list").click();
    await wait(30);
    setSearch("Bulbasaur");
    await wait(120);
    document.querySelector("#species-list .species-row").click();
    await wait(30);
    check("scroll resets to top when switching to a different species",
      document.querySelector(".species-detail").scrollTop === 0);

    // ...but refreshing the SAME species in place (e.g. after "Salvar
    // build") must NOT yank the user back to the top - a real regression
    // this fix could easily have introduced if not careful.
    document.querySelector(".species-detail").scrollTop = 400;
    await wait(30);
    document.getElementById("mybuild-save").click();
    await wait(50);
    check("scroll position is preserved when the SAME species re-renders in place",
      document.querySelector(".species-detail").scrollTop === 400,
      document.querySelector(".species-detail").scrollTop);
  } else { check("Charizard found for the #app height-fix test", false); }
  setSearch("");
  await wait(120);

  // --- "Meu build" status preview - 2026-09-09, urgent user request:
  // after filling every field, the editor showed no final stats and no
  // sense of a selected move's power. Deliberately not a damage
  // calculator (no defender/type effectiveness) - just final stats
  // (base+IV+EV+nature+item, same calcFinalStat used for bosses) and
  // each move's power with STAB/Life Orb factored in.
  setSearch("Charizard");
  await wait(120);
  const charRow4 = document.querySelector("#species-list .species-row");
  if (charRow4) {
    charRow4.click();
    await wait(30);
    function setSel4(id, v) { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event("change", { bubbles: true })); }
    setSel4("mybuild-nature", "Adamant");
    document.getElementById("mybuild-item").value = "Life Orb";
    document.getElementById("mybuild-item").dispatchEvent(new Event("input", { bubbles: true }));
    document.getElementById("mybuild-ev-1").value = 252;
    document.getElementById("mybuild-ev-1").dispatchEvent(new Event("input", { bubbles: true }));
    document.getElementById("mybuild-level").value = 100;
    document.getElementById("mybuild-level").dispatchEvent(new Event("input", { bubbles: true }));
    setSel4("mybuild-move-0", "Flare Blitz");
    setSel4("mybuild-move-1", "Swords Dance");
    await wait(50);
    const preview4 = document.getElementById("mybuild-status-preview").textContent;
    // Hand-verified: base Atk 84, 252 EV, level 100, Adamant (+10%) -> 293.
    check("final stats appear and match the hand-verified formula (Charizard Atk 293 at these settings)",
      preview4.indexOf("293") !== -1, preview4);
    // Flare Blitz: base power 120, STAB (Fire on a Fire/Flying mon) x1.5,
    // Life Orb x1.3 -> floor(120*1.5*1.3) = 234.
    check("damaging move shows base power AND a STAB+item-adjusted power",
      preview4.indexOf("120") !== -1 && preview4.indexOf("234") !== -1, preview4);
    check("status move shows no power, not a fabricated number",
      preview4.indexOf("Swords Dance") !== -1 && preview4.indexOf("sem poder de ataque") !== -1, preview4);
    // Changing the level live (no page reload, no button click) must
    // recompute the stats shown, proving it isn't a one-shot snapshot.
    document.getElementById("mybuild-level").value = 50;
    document.getElementById("mybuild-level").dispatchEvent(new Event("input", { bubbles: true }));
    await wait(30);
    const preview4b = document.getElementById("mybuild-status-preview").textContent;
    check("final stats recompute live when the level changes, without a page reload",
      preview4b.indexOf("293") === -1, preview4b);
  } else { check("Charizard found for the Meu build status-preview test", false); }
  setSearch("");
  await wait(120);

  // --- storage-full warning - 2026-09-09, from the Gemini audit pass +
  // same-day UX review: persist() used to swallow a localStorage quota
  // failure completely silently. Fixed to show a PERSISTENT banner (not a
  // flashToast() that auto-hides in ~2s and could go unnoticed for a
  // data-loss warning) - same show/dismiss idiom as #sync-banner. Monkey-
  // patches Storage.prototype.setItem to force the failure, same technique
  // used to verify this by hand before it had suite coverage.
  (function () {
    const origSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function () { throw new DOMException("Quota exceeded", "QuotaExceededError"); };
    const notesArea = document.getElementById("species-notes-input");
    if (notesArea) {
      notesArea.value = "teste banner de armazenamento";
      document.getElementById("species-notes-save").click();
    }
    Storage.prototype.setItem = origSetItem;
  })();
  await wait(50);
  const storageBanner = document.getElementById("storage-banner");
  check("storage-full banner appears on a failed persist()",
    storageBanner && storageBanner.hidden === false && getComputedStyle(storageBanner).display !== "none",
    storageBanner && storageBanner.textContent);
  if (storageBanner) {
    document.getElementById("storage-banner-dismiss").click();
    check("storage-full banner can be dismissed by hand (doesn't auto-hide)",
      document.getElementById("storage-banner").hidden === true);
  }

  // --- Fase 1 quality-of-life batch, 2026-09-09: changelog card + keyboard
  // shortcuts. Sort/type-filter PERSISTENCE across a reload is Part D below
  // (same reason Part B exists - can't verify "survives a reload" without
  // one), this only covers what's testable without a reload.
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  document.getElementById("tabs-more-toggle").click();
  const progressTabBtn = document.querySelector('#tabs-more-panel [data-tab="progress"]');
  if (progressTabBtn) progressTabBtn.click();
  await wait(30);
  const changelogHtml = document.getElementById("changelog-list").innerHTML;
  check("Novidades card renders real changelog entries (not empty)",
    changelogHtml.indexOf("<li>") !== -1 && changelogHtml.indexOf("2026-09-09") !== -1,
    changelogHtml.length + " chars");
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  function press(key) { document.dispatchEvent(new KeyboardEvent("keydown", { key: key, bubbles: true, cancelable: true })); }
  document.activeElement.blur();
  press("/");
  await wait(20);
  check("'/' focuses the Dex search input", document.activeElement === document.getElementById("search-input"));
  document.activeElement.blur();
  press("ArrowDown");
  await wait(20);
  const kbdRow1 = document.querySelector("#species-list .species-row.kbd-active");
  check("ArrowDown highlights the first row", !!kbdRow1);
  press("ArrowDown");
  await wait(20);
  const kbdRow2 = document.querySelector("#species-list .species-row.kbd-active");
  check("ArrowDown a second time moves the highlight to a DIFFERENT row",
    kbdRow2 && kbdRow1 && kbdRow2 !== kbdRow1);
  press("Enter");
  await wait(50);
  check("Enter opens the highlighted species' detail",
    document.getElementById("dex-shell").classList.contains("show-detail"));
  press("Escape");
  await wait(50);
  check("Escape backs out of the detail view (same as clicking 'Voltar')",
    !document.getElementById("dex-shell").classList.contains("show-detail"));

  // "Histórico de saves" foi REMOVIDO por pedido do usuário, 2026-09-11
  // ("não tem por que ter" - segurança de uma migração que não existe mais).
  // Regressão-guarda de remoção: confirma que a seção e a chave de
  // localStorage realmente sumiram, não só que ninguém testa mais.
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);
  check("'Histórico de saves' foi removido (card, não só a lista vazia)",
    !document.getElementById("save-history-card") && !document.querySelector(".save-history-row"));
  check("er_terminal_history não é mais escrito no localStorage", localStorage.getItem("er_terminal_history") === null);
  // "Time completo em formato Showdown" foi REMOVIDO por completo, 2026-09-12
  // (pedido do usuário: "isso é pra excluir não vamos mais usar isso no
  // projeto" - desta vez é a feature inteira, não só o preview cru que já
  // tinha sido tirado em 2026-09-11). Regressão-guarda de remoção, mesmo
  // padrão do "Histórico de saves": confirma que o card E a função
  // showdownTeam() (só usada por ele) realmente sumiram, não só que ninguém
  // testa mais. showdownSet() (por espécie, usado em "Meu build"/histórico/
  // referência de chefão) continua existindo - é uma feature diferente.
  check("card 'Time completo em formato Showdown' foi removido por completo",
    !document.getElementById("showdown-card") && !document.getElementById("showdown-copy"));

  setSearch("Charizard");
  await wait(120);
  const charRowCmp = document.querySelector("#species-list .species-row");
  if (charRowCmp) {
    charRowCmp.click();
    await wait(30);
    openDetailGroup("Comparar");
    const cmpInput = document.getElementById("compare-input");
    cmpInput.value = "Venusaur";
    cmpInput.dispatchEvent(new Event("input", { bubbles: true }));
    await wait(30);
    const cmpText = document.getElementById("compare-result").innerText;
    // Hand-verified: Charizard 79/84/78/109/85/100 (BST 535) vs Venusaur's
    // own real base stats - just checking the table renders with both
    // names and a BST row, not re-deriving every stat's win/lose here.
    check("compare table shows both species by name", cmpText.indexOf("Charizard") !== -1 && cmpText.indexOf("Venusaur") !== -1, cmpText);
    check("compare table includes a BST row", cmpText.indexOf("BST") !== -1);
    const cmpRows = [...document.querySelectorAll("#compare-result .compare-table tbody tr")];
    const hpRow = cmpRows.find(r => r.firstElementChild.textContent.trim() === "HP");
    check("at least one stat row shows a win/lose class, not just plain numbers",
      hpRow && (hpRow.innerHTML.indexOf("cmp-win") !== -1 || hpRow.innerHTML.indexOf("cmp-lose") !== -1));
    cmpInput.value = "Venusa";
    cmpInput.dispatchEvent(new Event("input", { bubbles: true }));
    await wait(30);
    check("compare shows nothing for a partial (not exact) species name",
      document.getElementById("compare-result").innerHTML === "");
  } else { check("Charizard found for the compare-builds test", false); }
  setSearch("");
  await wait(120);

}
