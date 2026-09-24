// Seções 15, 16, 17, 17b e 17c: Mega Evolution/Primal Reversion na calculadora de chefão, editor interativo 'Meu build' e IVs reais de referência.
// Extraído de scripts/smoke_test_suite.js (refactor 2026-09-13) - conteúdo idêntico ao original, só movido pra seu próprio arquivo.
async function section05() {
  await prepararRunPadrao();
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
  await wait(120);
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
  await wait(120);

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
  await wait(120);
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
  await wait(120);
  document.querySelector('.tab-btn[data-tab="team"]').click();
  // Achado em auditoria de QA (2026-09-13): era um wait(50) fixo - a
  // classe de flakiness já documentada em memória ("aparece intermitente
  // num primeiro load 'frio', some ao rodar de novo") desta seção 17.
  // Espera renderTeam() de verdade ter terminado (o slot já existir no
  // DOM) em vez de torcer por 50ms, que aparentemente nem sempre bastam
  // logo depois do primeiro carregamento da página.
  await pollUntil(function () {
    return [...document.querySelectorAll(".team-slot")].some(s => s.textContent.indexOf("Tyranitar Mega Redux") !== -1);
  });
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

  // --- 17b. "+ Usar como meu build" on Dex-side reference entries -
  // (renumbered from a duplicate "18" in a QA audit, 2026-09-13 - this
  // section and the "18b" one right after it are direct continuations of
  // section 17 above, same "usar como meu build" copy mechanism, just the
  // Dex-side entry point instead of the boss tab's. A LATER, unrelated
  // section also claimed "18" - see the "TYPE_MOD_ABILITIES coverage"
  // section further down - and a project-memory note already got the two
  // confused once, see its own comment for that story.)
  // 2026-09-09, user caught that "Builds vistas em chefões" (and build
  // history) on the Dex detail had a "copiar" button that only ever put
  // text on the clipboard, never touched state.customBuilds or the Team
  // tab - the OLDER of two "copy a build" mechanisms in this app, built
  // before "Meu build" existed. Charizard's real boss-reference fixture
  // (Courtney Mossdeep, Charizardite Y) is used here specifically because
  // its EVs string ("252 SpA / 4 SpD / 252 Spe") exercises the new
  // evsTextoParaArray() parser - the inverse of evsToShowdownText(), needed
  // because these reference entries store EVs as a string while
  // customBuilds needs the raw 6-number array.
  setSearch("Charizard");
  await wait(120);
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
      check("boss-reference EVs string is correctly parsed into the raw array (evsTextoParaArray)",
        char && char.evs && char.evs.reduce(function (a, b) { return a + b; }, 0) > 0 &&
        document.getElementById("mybuild-ev-total").textContent.indexOf(String(char.evs.reduce(function (a, b) { return a + b; }, 0))) !== -1,
        char && char.evs);
      check("the open Dex 'Meu build' editor refreshes to show the copied values",
        document.getElementById("mybuild-ability").value === (char && char.ability));
    } else { check("'+ Usar como meu build' button found on a boss-reference entry", false); }
  } else { check("Charizard found for the reference-entry build-copy test", false); }
  setSearch("");
  await wait(120);

  // --- 17c. IVs reais de referência de chefão não podem virar 31 fixo -
  // (renumbered from "18b" alongside 17b above, same reason - see its comment)
  // bug real achado em auditoria (2026-09-11): scripts/extract_boss_builds.ps1
  // reconstruía a entrada por campo nomeado e descartava ivsRaw/evsRaw
  // (mesmo dado que extract_bosses.ps1 já extraía de verdade), então o
  // template hardcodava ivs:[31,31,31,31,31,31] mesmo quando o chefão real
  // NÃO era flawless. Cofagrigus (Phoebe 2) é um caso real confirmado
  // (ivsRaw [31,31,31,31,31,0] - 0 de IV de Velocidade, típico de um set de
  // Trick Room de verdade, e o próprio moveset inclui Trick Room) - testa
  // exatamente o cenário que passaria despercebido antes da correção.
  setSearch("Cofagrigus");
  await wait(120);
  const cofagrigusRow = document.querySelector("#species-list .species-row");
  if (cofagrigusRow) {
    cofagrigusRow.click();
    await wait(30);
    const details2 = document.querySelector(".bh-details");
    if (details2) details2.setAttribute("open", "");
    await wait(30);
    const useEntryBtn2 = document.querySelector(".use-entry-build-btn");
    if (useEntryBtn2) {
      useEntryBtn2.click();
      await wait(50);
      const savedCofagrigus = JSON.parse(localStorage.getItem("er_terminal_save") || "{}").customBuilds;
      const cofagrigusList = savedCofagrigus && savedCofagrigus.SPECIES_COFAGRIGUS;
      const cof = cofagrigusList && cofagrigusList[cofagrigusList.length - 1];
      check("boss-reference com IV real NÃO-flawless (Cofagrigus/Phoebe 2, 0 de IV de Velocidade) copia o IV verdadeiro, não 31 fixo",
        cof && Array.isArray(cof.ivs) && JSON.stringify(cof.ivs) === JSON.stringify([31, 31, 31, 31, 31, 0]),
        cof && JSON.stringify(cof.ivs));
    } else { check("'+ Usar como meu build' button found on Cofagrigus (IV real test)", false); }
  } else { check("Cofagrigus found for the IV-real reference-entry test", false); }
  setSearch("");
  await wait(120);

}
