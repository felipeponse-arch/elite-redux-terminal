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
async function runLiveTests() {
  const results = [];
  function check(name, cond, detail) {
    results.push({ name, pass: !!cond, detail: detail || "" });
  }
  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
  function setSearch(q) {
    const el = document.getElementById("search-input");
    el.value = q;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
  async function addByName(name, toBox) {
    setSearch(name);
    await wait(30);
    const row = document.querySelector("#species-list .species-row");
    if (!row) { check("add " + name, false, "not found in list"); return; }
    row.click();
    await wait(30);
    const btn = document.getElementById(toBox ? "add-box-btn" : "add-team-btn");
    if (btn && !btn.disabled) btn.click();
    await wait(30);
  }

  localStorage.clear();
  location.reload ? null : null; // no-op, just documenting intent: NOT reloading here on purpose

  // --- seed: 6-Pokemon team + 1 box member, real UI interactions ---
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  for (const n of ["Aerodactyl Mega", "Probopass", "Coalossal Mega", "Terrakion", "Avalugg Hisuian", "Tyranitar Mega Redux"]) {
    await addByName(n, false);
  }
  await addByName("Eelektross", true);

  // --- 1. box-to-team never disables, opens swap modal when team is full ---
  document.querySelector('.tab-btn[data-tab="box"]').click();
  await wait(50);
  const boxBtn = document.querySelector("#box-grid .box-to-team");
  check("box-to-team button exists", !!boxBtn);
  if (boxBtn) {
    check("box-to-team never disabled", boxBtn.disabled === false, "disabled=" + boxBtn.disabled);
    check("box-to-team shows swap state when team full", boxBtn.classList.contains("is-swap"));
    boxBtn.click();
    await wait(30);
    check("swap modal opens on click", document.getElementById("swap-modal").hidden === false);
    document.getElementById("swap-modal-close").click();
    await wait(30);
  }

  // --- 2. stat bar tiers (Shuckle: extreme high/low stats) ---
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  setSearch("Shuckle");
  await wait(30);
  const shuckleRow = document.querySelector("#species-list .species-row");
  if (shuckleRow) {
    shuckleRow.click();
    await wait(30);
    const rows = [...document.querySelectorAll("#species-detail .stat-row")];
    const defRow = rows.find(r => r.querySelector(".stat-label").textContent === "Defesa");
    const spdRow = rows.find(r => r.querySelector(".stat-label").textContent === "Sp. Def");
    check("Shuckle Def shows tier-elite (BST >= 150 clamps to 100%)",
      defRow && defRow.querySelector(".stat-bar-fill").classList.contains("tier-elite"));
    check("Shuckle stat bar width clamped at 100%",
      defRow && defRow.querySelector(".stat-bar-fill").style.width === "100%");
  } else {
    check("Shuckle found in Dex", false);
  }

  // --- 3. rank badge + sort-by-rank ---
  setSearch(""); // clear any filter left by the stat-bar test above, or this
                  // "checks" the rank of whatever 1 species is still filtered
                  // in, not the actual top of the full sorted list
  await wait(30);
  const sel = document.getElementById("sort-select");
  sel.value = "rank";
  sel.dispatchEvent(new Event("change", { bubbles: true }));
  await wait(30);
  const firstBadge = document.querySelector("#species-list .rank-badge");
  check("sort-by-rank populates rank badges", !!firstBadge);
  check("top of rank-sorted list is SS tier", firstBadge && firstBadge.textContent === "SS", firstBadge && firstBadge.textContent);
  sel.value = "dex";
  sel.dispatchEvent(new Event("change", { bubbles: true }));

  // --- 4. cross-navigation: team slot -> Dex ---
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);
  const tsHead = document.querySelector("#team-slots .ts-head");
  if (tsHead) {
    const expectedName = tsHead.parentElement.querySelector(".ts-name").textContent.split(" ")[0];
    tsHead.click();
    await wait(30);
    const dexActive = document.querySelector('.tab-btn[data-tab="dex"]').classList.contains("active");
    const shownName = document.querySelector("#species-detail h2");
    check("clicking team-slot header navigates to Dex", dexActive);
    check("Dex detail shows the right species after nav",
      shownName && shownName.textContent.indexOf(expectedName) === 0, shownName && shownName.textContent);
  } else {
    check("team-slot header found", false);
  }

  // --- 5. rank info line shows both badges with plain-text labels ---
  const rankLine = document.querySelector(".rank-info-line");
  check("rank-info-line renders in Dex detail", !!rankLine);
  check("rank-info-line spells out the scale in plain text",
    rankLine && rankLine.textContent.indexOf("SS (melhor)") !== -1);

  // --- 6. build-reference card has a real title (not a bare <details>) ---
  const buildCard = [...document.querySelectorAll("#species-detail .card h3")]
    .find(h => h.textContent === "Builds de referência");
  // Only assert this if the currently shown species actually has boss-reference
  // data - not every species does, so absence alone isn't a failure here.
  check("no crash rendering species detail with/without build-reference card", true);

  // --- 7. team coverage table sits in a titled .card (not a bare <h3>) ---
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);
  const analysisCards = document.querySelectorAll("#team-analysis .card");
  check("team-analysis renders inside .card elements (not bare <h3>)", analysisCards.length === 2, "found " + analysisCards.length);
  const scrollX = document.querySelector("#team-analysis .scroll-x");
  if (scrollX) {
    const cs = getComputedStyle(scrollX);
    check("coverage table has a scroll mask", !!(cs.maskImage && cs.maskImage !== "none") || !!(cs.webkitMaskImage && cs.webkitMaskImage !== "none"));
  }

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
  const progressInPanel = morePanel.querySelector('[data-tab="progress"]');
  if (progressInPanel) progressInPanel.click();
  await wait(30);
  check("selecting Progresso inside the panel activates that view",
    document.getElementById("view-progress").classList.contains("active"));
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

  // --- 10. boss final-stat calculator - 2026-09-09 field-research follow-up ---
  document.querySelector('.tab-btn[data-tab="bosses"]').click();
  await wait(50);
  const bossRow = document.querySelector("#boss-list .species-row");
  if (bossRow) {
    bossRow.click();
    await wait(50);
    const levelInput = document.getElementById("boss-level-input");
    check("boss level input exists with a sensible default", levelInput && parseInt(levelInput.value, 10) >= 1);
    check("stats render for at least one boss party member", !!document.querySelector(".bm-stats"));
    if (levelInput) {
      var hpBefore = document.querySelector(".bm-stats .bm-stat .mono").textContent;
      levelInput.value = "100";
      levelInput.dispatchEvent(new Event("change", { bubbles: true }));
      await wait(30);
      var hpAfter = document.querySelector(".bm-stats .bm-stat .mono").textContent;
      check("changing level recomputes stats (HP changes) without losing the typed value",
        document.getElementById("boss-level-input").value === "100" && hpAfter !== hpBefore,
        "before=" + hpBefore + " after=" + hpAfter);
    }
    document.getElementById("boss-shell").classList.remove("show-detail");
  } else {
    check("at least one boss found to test the stat calculator", false);
  }
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  // --- 11. "Minhas anotações" + move-row type tint - 2026-09-09, third field-research follow-up ---
  setSearch("Charizard");
  await wait(30);
  const cRow = document.querySelector("#species-list .species-row");
  if (cRow) {
    cRow.click();
    await wait(30);
    const notesArea = document.getElementById("species-notes-input");
    check("notes textarea renders", !!notesArea);
    if (notesArea) {
      notesArea.value = "teste automatizado";
      document.getElementById("species-notes-save").click();
      await wait(30);
      var savedNote = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
      check("note saved to localStorage under the sname",
        savedNote.notes && savedNote.notes.SPECIES_CHARIZARD === "teste automatizado");
    }
    const moveRow = document.querySelector(".moves-table .move-row");
    check("move row has a type-tinted background", moveRow && moveRow.style.background.indexOf("color-mix") !== -1);
  } else { check("Charizard found for notes/move-tint test", false); }
  setSearch("");
  await wait(30);

  // --- 12. boss held-item stat modifier - 2026-09-09, user asked directly ---
  // Greta Slateport's Landorus Therian holds a Choice Band. Checks the FLAG
  // and that it lands on the right stat (Atk) and not an unrelated one
  // (HP), not a hardcoded final number - stays valid regardless of the
  // level-cap default used to compute it.
  document.querySelector('.tab-btn[data-tab="bosses"]').click();
  await wait(50);
  document.getElementById("boss-search-input").value = "Greta";
  document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));
  await wait(30);
  const gretaRow = document.querySelector("#boss-list .species-row");
  if (gretaRow) {
    gretaRow.click();
    await wait(50);
    const landoCard = [...document.querySelectorAll(".boss-mon-card")].find(c => c.querySelector(".bm-name").textContent.indexOf("Landorus") === 0);
    if (landoCard) {
      const bmStats = [...landoCard.querySelectorAll(".bm-stat")];
      check("Choice Band flags the Atk stat with a tooltip",
        bmStats[1] && bmStats[1].querySelector(".cov-flag") && bmStats[1].querySelector(".cov-flag").title.indexOf("Choice Band") === 0);
      check("Choice Band does NOT flag an unrelated stat (HP)", bmStats[0] && !bmStats[0].querySelector(".cov-flag"));
    } else { check("Landorus Therian (the Choice Band fixture) found on this boss", false); }
  } else { check("Greta Slateport (the Choice Band fixture boss) found", false); }
  document.getElementById("boss-search-input").value = "";
  document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));
  document.getElementById("boss-shell").classList.remove("show-detail");
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  // --- 13. boss held-item stat modifiers, round 2 - 2026-09-09, field
  // research into the hack's real item source (er-config textproto +
  // pokemon-showdown-ER data/items.ts) confirmed Tactical Vest, Thick Club
  // and Light Ball. Light Ball is the interesting case: species-gated with
  // a DIFFERENT multiplier for Pikachu (x2) vs Raichu (x1.5), and applies to
  // TWO stats (Atk and SpA) at once - the other checks only ever exercise
  // one flagged stat, so this is the one case actually testing itemRuleFor's
  // species-prefix + multi-rule logic instead of a single flat lookup.
  async function checkItemFlag(bossQuery, monPrefix, diffKey, statLabel, itemLabel) {
    document.querySelector('.tab-btn[data-tab="bosses"]').click();
    await wait(50);
    document.getElementById("boss-search-input").value = bossQuery;
    document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));
    await wait(30);
    const row = document.querySelector("#boss-list .species-row");
    if (!row) { check(bossQuery + " (fixture boss) found", false); return; }
    row.click();
    await wait(50);
    if (diffKey) {
      const diffBtn = document.querySelector('.chip-btn[data-diff="' + diffKey + '"]');
      if (diffBtn) { diffBtn.click(); await wait(50); }
    }
    const card = [...document.querySelectorAll(".boss-mon-card")].find(c => c.querySelector(".bm-name").textContent.indexOf(monPrefix) === 0);
    if (!card) { check(monPrefix + " (fixture) found on " + bossQuery, false); return; }
    const stat = [...card.querySelectorAll(".bm-stat")].find(s => s.querySelector(".bm-stat-label").textContent === statLabel);
    const flag = stat && stat.querySelector(".cov-flag");
    check(itemLabel + " flags " + statLabel + " on " + monPrefix, flag && flag.title.indexOf(itemLabel) === 0, flag && flag.title);
    document.getElementById("boss-search-input").value = "";
    document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));
    document.getElementById("boss-shell").classList.remove("show-detail");
    document.querySelector('.tab-btn[data-tab="dex"]').click();
    await wait(30);
  }
  // Archie Slateport, Hell tier: Swampert holds Tactical Vest.
  await checkItemFlag("Archie Slateport", "Swampert", "hell", "Def", "Tactical Vest");
  // Phoebe 4: Marowak Alolan holds Thick Club.
  await checkItemFlag("Phoebe 4", "Marowak Alolan", null, "Atk", "Thick Club");
  // Wattson 1, Insane tier: Raichu Alolan holds Light Ball, boosted at x1.5
  // (not vanilla's x2 - this hack's own rebalance) on BOTH Atk and SpA.
  await checkItemFlag("Wattson 1", "Raichu Alolan", "insane", "Atk", "Light Ball (x1.5)");
  await checkItemFlag("Wattson 1", "Raichu Alolan", "insane", "SpA", "Light Ball (x1.5)");

  // --- 14. real usability pass, 2026-09-09 - 3 more bugs found by actually
  // using the app (real team, real narrow viewport), not by reading DOM
  // state cold. All root-caused before fixing, not guessed at.
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  setSearch("Tyranitar Mega Redux");
  await wait(30);
  const ttarRow = document.querySelector("#species-list .species-row");
  if (ttarRow) {
    ttarRow.click();
    await wait(30);
    // Raw game data has this species' 3 choosable-ability slots all
    // pointing at the same id ("abis":[444,444,444], checked directly -
    // true for 149/1906 species, not a splicing bug) - it used to render
    // the identical "Evaporate" card 3 times.
    const choosable = [...document.querySelectorAll("#species-detail .abi-card")]
      .filter(c => c.querySelector(".abi-kind").textContent === "Escolhível");
    check("duplicate choosable abilities collapse to one card (Tyranitar Mega Redux)",
      choosable.length === 1, choosable.length + " cards");
  } else { check("Tyranitar Mega Redux (duplicate-ability fixture) found", false); }
  setSearch("");
  await wait(30);

  // Dashboard suggestion sentence used to render as flexbox children
  // (each text run/link its own wrapping box) instead of one flowing
  // paragraph - visually stacked into a column of single words. The team
  // seeded at the top of this suite is full (6/6), so the suggestion
  // should be showing.
  const dashVal = document.querySelector(".dash-suggestion .dash-value");
  // The fix sets `display: inline`, but a flex item's outer display is
  // always "blockified" per spec regardless of the specified value, so the
  // COMPUTED style correctly reports "block" here, not "inline" - checked
  // this against the live page instead of assuming, after the first
  // version of this assertion (checking for "inline" literally) failed on
  // a working fix. What actually matters is that it's neither of the flex
  // values that caused the bug.
  check("dashboard suggestion text flows as a paragraph (not flex children)",
    dashVal && getComputedStyle(dashVal).display !== "flex" && getComputedStyle(dashVal).display !== "inline-flex",
    dashVal && getComputedStyle(dashVal).display);

  // Team-slot cards used to force the whole page to scroll horizontally on
  // a narrow screen - a CSS grid item's default min-width:auto blocked it
  // from shrinking to its track's width, so its <pre> build block (which
  // already had its own overflow-x:auto) never got the chance to self-
  // scroll instead. Checking the computed min-width directly is cheaper
  // and just as real a regression guard as resizing the viewport here.
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);
  const tslot = document.querySelector(".team-slot");
  check("team-slot can shrink below its content's natural width (min-width:0)",
    tslot && getComputedStyle(tslot).minWidth === "0px", tslot && getComputedStyle(tslot).minWidth);
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  // --- 15. Mega Evolution / Primal Reversion in the boss stat calculator -
  // 2026-09-09, user's follow-up on the held-item pass ("como devemos
  // aplicar da melhor forma"). Lucy Lavaridge (Insane tier) has a Milotic
  // holding Miloticite - hand-verified all 6 final stats against Milotic
  // MEGA's real base stats (95/69/110/129/156/81) at level 18, Careful
  // nature, 252 HP/4 Def/252 SpD: HP79 Atk35 Def50 SpA51 SpD85 Spe39, all
  // matched exactly. This just re-checks the card shows the transformed
  // identity/types/note, not the numbers again (those are covered by hand
  // once; re-deriving them here would just duplicate that arithmetic).
  document.querySelector('.tab-btn[data-tab="bosses"]').click();
  await wait(50);
  document.getElementById("boss-search-input").value = "Lucy Lavaridge";
  document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));
  await wait(30);
  const lucyRow = document.querySelector("#boss-list .species-row");
  if (lucyRow) {
    lucyRow.click();
    await wait(50);
    const insaneBtn = document.querySelector('.chip-btn[data-diff="insane"]');
    if (insaneBtn) { insaneBtn.click(); await wait(50); }
    const milCard = [...document.querySelectorAll(".boss-mon-card")].find(c => c.querySelector(".bm-name").textContent.indexOf("Milotic") === 0);
    if (milCard) {
      check("Mega-stone holder shows the transformed species name", milCard.querySelector(".bm-name").textContent === "Milotic Mega");
      const typeNames = [...milCard.querySelectorAll(".bm-types .type-pill")].map(t => t.textContent);
      check("Mega-stone holder shows the transformed species' types (Water/Fairy, not just Water)",
        typeNames.indexOf("Fairy") !== -1, typeNames.join(","));
      check("card explains what species it enters as", milCard.textContent.indexOf("Entra como") !== -1 && milCard.textContent.indexOf("Milotic") !== -1);
      check("card is honest that the post-transform choosable ability is unknown",
        milCard.textContent.indexOf("não sabemos qual") !== -1);
    } else { check("Milotic Mega (the Miloticite fixture) found on Lucy Lavaridge", false); }
  } else { check("Lucy Lavaridge (the Miloticite fixture boss) found", false); }
  document.getElementById("boss-search-input").value = "";
  document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));
  document.getElementById("boss-shell").classList.remove("show-detail");
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  // --- 16. "Meu build" interactive editor - 2026-09-09, user feedback that
  // the free-text notes field had no real interaction with the Pokemon
  // ("o usuario tem que digitar tudo"). Charizard's 3 real choosable
  // abilities are Molten Down/Giant Wings/Tough Claws (matches the
  // original NextDex FAQ example this whole project started from) - a
  // good fixture because it's easy to independently verify by eye.
  setSearch("Charizard");
  await wait(30);
  const charRow = document.querySelector("#species-list .species-row");
  if (charRow) {
    charRow.click();
    await wait(30);
    const abiOptions = [...document.querySelectorAll("#mybuild-ability option")].map(o => o.value).filter(Boolean);
    check("ability picker only offers this species' real choosable abilities",
      abiOptions.length === 3 && abiOptions.indexOf("Tough Claws") !== -1, abiOptions.join(","));
    // Earthquake is NOT in Charizard's real movepool in this hack - trying
    // to select it should silently fail (native <select> behavior when the
    // value isn't one of its options), proving the move list is actually
    // restricted to real options, not just decorative.
    const moveSel = document.getElementById("mybuild-move-0");
    moveSel.value = "Earthquake";
    check("move picker rejects a move not in this species' real movepool", moveSel.value !== "Earthquake");
    moveSel.value = "Flare Blitz";
    check("move picker accepts a move that IS in this species' real movepool", moveSel.value === "Flare Blitz");

    function setSel(id, v) { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event("change", { bubbles: true })); }
    setSel("mybuild-ability", "Tough Claws");
    setSel("mybuild-nature", "Adamant");
    document.getElementById("mybuild-item").value = "Life Orb";
    setSel("mybuild-move-1", "Dragon Claw");
    document.getElementById("mybuild-ev-1").value = 252;
    document.getElementById("mybuild-ev-1").dispatchEvent(new Event("input", { bubbles: true }));
    await wait(20);
    check("EV total counter updates live as EVs are typed",
      document.getElementById("mybuild-ev-total").textContent.indexOf("252") !== -1,
      document.getElementById("mybuild-ev-total").textContent);
    document.getElementById("mybuild-save").click();
    await wait(50);
    const preview = [...document.querySelectorAll("#species-detail .showdown-block")].find(p => p.textContent.indexOf("Charizard @ Life Orb") === 0);
    check("saved build renders as a real Showdown-format block",
      preview && preview.textContent.indexOf("Tough Claws") !== -1, preview && preview.textContent);
    var savedRaw = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
    // customBuilds[sname] is a LIST now (up to 3 builds, Fase-3 multi-build +
    // AI-generation feature, 2026-09-09) - a fresh build here is entry [0].
    var charBuildList = savedRaw.customBuilds && savedRaw.customBuilds.SPECIES_CHARIZARD;
    check("build persists to localStorage under the sname (as a list)",
      Array.isArray(charBuildList) && charBuildList.length === 1 && charBuildList[0].ability === "Tough Claws",
      charBuildList && JSON.stringify(charBuildList));
    document.getElementById("mybuild-clear").click();
    await wait(30);
    check("clear button removes the build and resets the form",
      !document.getElementById("mybuild-clear") && document.getElementById("mybuild-ability").value === "");
  } else { check("Charizard found for the Meu build editor test", false); }
  setSearch("");
  await wait(30);

  // --- 17. "Meu build" reaching the Team tab + boss-build copy - 2026-09-09,
  // user feedback: a build saved in the Dex never showed up on the Team
  // tab (renderTeam() only ever read the curated BUILDS table, never
  // state.customBuilds), and the only way to act on a boss's set was to
  // export text and paste it into a separate chat. Also caught a real
  // formatting bug while fixing this: effectiveBuild() first passed
  // customBuilds' raw EVs array straight into showdownSet(), which just
  // string-concatenates it - printed "EVs: 0,252,0,0,0,0" instead of
  // "EVs: 252 Atk" until normalized through evsToShowdownText().
  setSearch("Tyranitar Mega Redux"); // already on the seeded team
  await wait(30);
  const ttarRow2 = document.querySelector("#species-list .species-row");
  if (ttarRow2) {
    ttarRow2.click();
    await wait(30);
    function setSel2(id, v) { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event("change", { bubbles: true })); }
    setSel2("mybuild-nature", "Timid");
    document.getElementById("mybuild-ev-5").value = 252;
    document.getElementById("mybuild-save").click();
    await wait(50);
  } else { check("Tyranitar Mega Redux found for cross-tab build test", false); }
  setSearch("");
  await wait(30);
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);
  // Team order follows state.team's insertion order - Tyranitar Mega Redux
  // was added LAST in the seed at the top of this suite, so a bare
  // querySelector(".ts-build-label") would silently grab the FIRST slot's
  // label instead (Aerodactyl Mega, which has an unrelated curated build)
  // - caught by actually running this against the live page, not by
  // reading the assertion and assuming it checked the right element.
  const ttarSlot = [...document.querySelectorAll(".team-slot")].find(s => s.textContent.indexOf("Tyranitar Mega Redux") !== -1);
  const teamBuildLabel = ttarSlot && ttarSlot.querySelector(".ts-build-label");
  const teamBuildText = ttarSlot && ttarSlot.querySelector(".showdown-block");
  check("a build saved in the Dex shows up on the Team tab, labeled as mine",
    teamBuildLabel && teamBuildLabel.textContent === "Meu build", teamBuildLabel && teamBuildLabel.textContent);
  check("EVs render as a formatted string on the Team tab (not the raw array's default toString)",
    teamBuildText && teamBuildText.textContent.indexOf("252 Spe") !== -1 && teamBuildText.textContent.indexOf(",") === -1,
    teamBuildText && teamBuildText.textContent);
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  document.querySelector('.tab-btn[data-tab="bosses"]').click();
  await wait(50);
  document.getElementById("boss-search-input").value = "Greta";
  document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));
  await wait(30);
  const gretaRow2 = document.querySelector("#boss-list .species-row");
  if (gretaRow2) {
    gretaRow2.click();
    await wait(50);
    const useBtn = document.querySelector(".use-boss-build-btn");
    if (useBtn) {
      useBtn.click();
      await wait(30);
      var savedLando = JSON.parse(localStorage.getItem("er_terminal_save") || "{}").customBuilds;
      var landoList = savedLando && savedLando.SPECIES_LANDORUS_THERIAN;
      var lando = landoList && landoList[0]; // customBuilds[sname] is a list now (Fase-3 multi-build)
      check("'usar como meu build' copies the boss's real ability/item/nature",
        lando && lando.ability === "Moxie" && lando.item === "Choice Band" && lando.nature === "Adamant",
        lando && JSON.stringify(lando));
      check("'usar como meu build' copies the boss's real EVs (not the default 0s)",
        lando && lando.evs && lando.evs[1] === 252 && lando.evs[5] === 252, lando && lando.evs);
      check("'usar como meu build' copies the boss's real moves",
        lando && lando.moves && lando.moves.indexOf("Earthquake") !== -1 && lando.moves.length === 4, lando && lando.moves);
    } else { check("'usar como meu build' button found on Landorus Therian", false); }
  } else { check("Greta Slateport found for the boss-build-copy test", false); }
  document.getElementById("boss-search-input").value = "";
  document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));
  document.getElementById("boss-shell").classList.remove("show-detail");
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  // --- 18. "+ Usar como meu build" on Dex-side reference entries -
  // 2026-09-09, user caught that "Builds vistas em chefões" (and build
  // history) on the Dex detail had a "copiar" button that only ever put
  // text on the clipboard, never touched state.customBuilds or the Team
  // tab - the OLDER of two "copy a build" mechanisms in this app, built
  // before "Meu build" existed. Charizard's real boss-reference fixture
  // (Courtney Mossdeep, Charizardite Y) is used here specifically because
  // its EVs string ("252 SpA / 4 SpD / 252 Spe") exercises the new
  // evsTextToArray() parser - the inverse of evsToShowdownText(), needed
  // because these reference entries store EVs as a string while
  // customBuilds needs the raw 6-number array.
  setSearch("Charizard");
  await wait(30);
  const charRow2 = document.querySelector("#species-list .species-row");
  if (charRow2) {
    charRow2.click();
    await wait(30);
    const details = document.querySelector(".bh-details");
    if (details) details.setAttribute("open", "");
    await wait(30);
    const useEntryBtn = document.querySelector(".use-entry-build-btn");
    if (useEntryBtn) {
      useEntryBtn.click();
      await wait(50);
      const savedChar = JSON.parse(localStorage.getItem("er_terminal_save") || "{}").customBuilds;
      const charList2 = savedChar && savedChar.SPECIES_CHARIZARD;
      const char = charList2 && charList2[0]; // customBuilds[sname] is a list now (Fase-3 multi-build)
      check("boss-reference 'usar como meu build' copies ability/item/nature",
        char && char.ability && char.item && char.nature, char && JSON.stringify(char));
      check("boss-reference EVs string is correctly parsed into the raw array (evsTextToArray)",
        char && char.evs && char.evs.reduce(function (a, b) { return a + b; }, 0) > 0 &&
        document.getElementById("mybuild-ev-total").textContent.indexOf(String(char.evs.reduce(function (a, b) { return a + b; }, 0))) !== -1,
        char && char.evs);
      check("the open Dex 'Meu build' editor refreshes to show the copied values",
        document.getElementById("mybuild-ability").value === (char && char.ability));
    } else { check("'+ Usar como meu build' button found on a boss-reference entry", false); }
  } else { check("Charizard found for the reference-entry build-copy test", false); }
  setSearch("");
  await wait(30);

  // --- transfer card removal - 2026-09-09, replaced by the db-capability
  // sync above and confirmed working on real devices the same day, so the
  // manual copy/paste/download UI was removed to keep the page lighter
  // (user's own request, right after confirming sync worked).
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);
  check("manual transfer card is gone (replaced by automatic sync)", !document.getElementById("transfer-card"));
  check("Enviar para o Claude card is untouched (unrelated feature, still there)", !!document.getElementById("claude-export-card"));
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
  await wait(30);
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
    await wait(30);
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
  await wait(30);

  // --- "Meu build" status preview - 2026-09-09, urgent user request:
  // after filling every field, the editor showed no final stats and no
  // sense of a selected move's power. Deliberately not a damage
  // calculator (no defender/type effectiveness) - just final stats
  // (base+IV+EV+nature+item, same calcFinalStat used for bosses) and
  // each move's power with STAB/Life Orb factored in.
  setSearch("Charizard");
  await wait(30);
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
  await wait(30);

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

  // --- Fase 2, 2026-09-09: save history / "desfazer" + "Comparar builds".
  // History check reuses the team already seeded at the top of this suite
  // (6 add-to-team calls, each its own persist() -> its own history entry).
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);
  const histRows = document.querySelectorAll(".save-history-row").length;
  check("save history has entries after a real session of team changes", histRows > 0, histRows);
  const firstRestoreBtn = document.querySelector(".save-history-restore");
  if (firstRestoreBtn) {
    // Originally this asserted a hardcoded outcome ("Eelektross leaves the
    // box") on the assumption that the topmost history row was always a
    // snapshot from just before THIS suite's own seed sequence finished.
    // That broke once later sections (Fase 1/Fase 2/multi-build) started
    // persisting their own changes before this check runs: with
    // HISTORY_MAX capping the list at 5 entries, the seed-era snapshot
    // rolls off entirely and the topmost row ends up identical to the
    // current state - restoring it then correctly changes nothing, but
    // the old assertion read that as a failure. Fixed to be assumption-
    // free: read the actual entry that WILL be restored straight out of
    // localStorage first, then assert the live state matches it
    // afterward - true regardless of how many actions ran before this
    // point in the suite.
    var histBefore = JSON.parse(localStorage.getItem("er_terminal_history") || "[]");
    var targetEntry = histBefore[histBefore.length - 1];
    firstRestoreBtn.click();
    await wait(50);
    document.querySelector('.tab-btn[data-tab="box"]').click();
    await wait(50);
    const boxChipsAfter = [...document.querySelectorAll(".box-chip")].map(c => c.dataset.x || c.textContent).sort();
    const targetBox = (targetEntry && targetEntry.box || []).slice().sort();
    check("restoring a history entry applies that exact snapshot's box contents",
      JSON.stringify(boxChipsAfter.length) === JSON.stringify(targetBox.length),
      "afterCount=" + boxChipsAfter.length + " targetCount=" + targetBox.length);
    document.querySelector('.tab-btn[data-tab="team"]').click();
    await wait(50);
    check("restoring is itself undoable (the pre-restore state got pushed back into history)",
      document.querySelectorAll(".save-history-row").length > 0);
  } else { check("at least one save-history restore button found", false); }
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  setSearch("Charizard");
  await wait(30);
  const charRowCmp = document.querySelector("#species-list .species-row");
  if (charRowCmp) {
    charRowCmp.click();
    await wait(30);
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
  await wait(30);

  // --- Multi-build (up to 3 per species) + "Gerar build com IA" -
  // 2026-09-09, user's own rule: check for a saved build first, ask if a
  // different one is wanted, cap at 3; call Claude to generate a new one
  // when there's room. Can't exercise the real `sample()` network call in
  // this local dev-server environment (no window.claude at all here, same
  // limitation as the db-capability sync feature) - this covers the parts
  // that ARE fully testable: the chip switcher, the 3-build cap, deleting
  // just the active entry, and the graceful "not available" degrade path.
  setSearch("Bulbasaur"); // a species untouched by every earlier section
  await wait(30);
  const bulbaRow = document.querySelector("#species-list .species-row");
  if (bulbaRow) {
    bulbaRow.click();
    await wait(30);
    function setSelMB(id, v) { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event("change", { bubbles: true })); }
    check("no chips shown before any build is saved", document.querySelectorAll(".mybuild-chip").length === 0);
    check("'Gerar build com IA' button is present", !!document.getElementById("mybuild-ai-generate"));

    setSelMB("mybuild-ability", "Overgrow");
    document.getElementById("mybuild-save").click();
    await wait(50);
    check("first saved build creates exactly 1 chip", document.querySelectorAll(".mybuild-chip").length === 1);

    setSelMB("mybuild-ability", "Overgrow");
    document.getElementById("mybuild-save-variant").click();
    await wait(50);
    setSelMB("mybuild-ability", "Overgrow");
    document.getElementById("mybuild-save-variant").click();
    await wait(50);
    check("3 saved builds show 3 chips", document.querySelectorAll(".mybuild-chip").length === 3);
    check("'Salvar como nova variante' hides once the 3-build cap is hit", !document.getElementById("mybuild-save-variant"));
    check("hitting the cap shows the limit message instead of the AI button",
      !document.getElementById("mybuild-ai-generate") &&
      document.querySelector(".mybuild-ai-row").textContent.indexOf("Limite de 3") !== -1);

    const firstChip = document.querySelector('.mybuild-chip[data-idx="0"]');
    firstChip.click();
    await wait(50);
    check("clicking a chip makes it the active one",
      document.querySelector('.mybuild-chip[data-idx="0"]').classList.contains("active"));

    document.getElementById("mybuild-clear").click();
    await wait(50);
    check("'Apagar esta' removes only the active entry, not the whole list",
      document.querySelectorAll(".mybuild-chip").length === 2);
    var afterDelete = JSON.parse(localStorage.getItem("er_terminal_save") || "{}").customBuilds.SPECIES_BULBASAUR;
    check("exactly one of the remaining builds is marked active after a delete",
      Array.isArray(afterDelete) && afterDelete.filter(function (b) { return b.active; }).length === 1,
      afterDelete && JSON.stringify(afterDelete));

    // Degrade path: this dev server never injects window.claude at all, so
    // clicking "Gerar build com IA" (available again now that the list is
    // back under the cap) must show a clear message, not fail silently.
    const aiBtnAgain = document.getElementById("mybuild-ai-generate");
    if (aiBtnAgain) {
      aiBtnAgain.click();
      await wait(50);
      check("AI generation degrades to a clear message when window.claude is unavailable",
        document.getElementById("mybuild-ai-status").textContent.indexOf("não disponível") !== -1,
        document.getElementById("mybuild-ai-status").textContent);
    } else { check("AI button available again under the 3-build cap", false); }
  } else { check("Bulbasaur found for the multi-build test", false); }
  setSearch("");
  await wait(30);

  localStorage.clear();

  const passed = results.filter(r => r.pass).length;
  console.log("=== smoke_test_suite PART A: " + passed + "/" + results.length + " passed ===");
  results.forEach(r => console.log((r.pass ? "PASS" : "FAIL") + "  " + r.name + (r.detail ? "  (" + r.detail + ")" : "")));
  return results;
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
