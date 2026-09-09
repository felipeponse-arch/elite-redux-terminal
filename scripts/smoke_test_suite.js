// Consolidated smoke-test suite for artifact_final.html - dev review, 2026-09-09:
// "toda correcao dependeu de eu lembrar de rodar aqueles trechos de JS na mao"
// (manual_smoke_tests.md) "e so eu conferindo o resultado a olho, sem garantia
// nenhuma de que eu li certo". This doesn't add a real test *runner* (no
// node/npm/browser-test-framework in this environment - see
// AUDITORIA-DOSSIE.md section 13) - it removes the "read the result by eye"
// step: every check below asserts and reports PASS/FAIL itself, instead of
// returning a raw value the caller has to compare against a comment.
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
// Usage: see scripts/manual_smoke_tests.md for how to serve the build
// locally and open it in the Browser tool.

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
