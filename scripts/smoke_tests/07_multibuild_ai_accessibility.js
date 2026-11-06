// Seções Multi-build (até 3 por espécie) e passe de acessibilidade da Fase 2. O "Gerar build com IA" saiu em 06/11/2026 (o app não usa mais IA).
async function section07() {
  await prepararRunPadrao();
  // --- Multi-build (up to 3 per species) + "Gerar build com IA" -
  // 2026-09-09, user's own rule: check for a saved build first, ask if a
  // different one is wanted, cap at 3; call Claude to generate a new one
  // when there's room. Can't exercise the real `sample()` network call in
  // this local dev-server environment (no window.claude at all here, same
  // limitation as the db-capability sync feature) - this covers the parts
  // that ARE fully testable: the chip switcher, the 3-build cap, deleting
  // just the active entry, and the graceful "not available" degrade path.
  setSearch("Bulbasaur"); // NOT actually untouched by every earlier section -
  // see the note below, found while adding the 2026-09-10 accessibility pass.
  await wait(120);
  const bulbaRow = document.querySelector("#species-list .species-row");
  if (bulbaRow) {
    bulbaRow.click();
    await wait(30);
    function setSelMB(id, v) { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event("change", { bubbles: true })); }
    // O botão "mybuild-save" chama setOrReplaceActiveBuild() - substitui a
    // build ATIVA em vigor, nunca soma uma nova (só "mybuild-save-variant",
    // via addBuildVariant(), realmente adiciona - ver os 2 cliques abaixo).
    // Achado real ao remover "Histórico de saves" (2026-09-11): a asserção
    // antiga aqui dizia "+1" e só "passava" porque o teste removido da
    // seção de histórico restaurava um snapshot antigo bem antes desta
    // seção rodar, o que sem querer ZERAVA de volta a build de Bulbasaur
    // que a seção "#app height bug" já tinha salvo - com esse efeito
    // colateral removido, "mybuild-save" clicado numa espécie que JÁ tem
    // build ativa corretamente FICA no mesmo número de chips (substituiu,
    // não somou). A invariante real e sem achismo de ordem de execução:
    // depois de "mybuild-save", o número de chips é o que já havia (se >=1,
    // porque substituiu) ou 1 (se era 0, porque criou a primeira).
    const chipsBeforeAnySave = document.querySelectorAll(".mybuild-chip").length;

    setSelMB("mybuild-ability", "Overgrow");
    document.getElementById("mybuild-save").click();
    await wait(50);
    const expectedAfterSave = Math.max(chipsBeforeAnySave, 1);
    check("'mybuild-save' cria a 1ª build (se não havia nenhuma) ou substitui a ativa em vigor (se já havia)",
      document.querySelectorAll(".mybuild-chip").length === expectedAfterSave,
      "before=" + chipsBeforeAnySave + " after=" + document.querySelectorAll(".mybuild-chip").length);

    setSelMB("mybuild-ability", "Overgrow");
    document.getElementById("mybuild-save-variant").click();
    await wait(50);
    setSelMB("mybuild-ability", "Overgrow");
    document.getElementById("mybuild-save-variant").click();
    await wait(50);
    check("3 saved builds show 3 chips", document.querySelectorAll(".mybuild-chip").length === 3);
    check("'Salvar como nova variante' hides once the 3-build cap is hit", !document.getElementById("mybuild-save-variant"));


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

  } else { check("Bulbasaur found for the multi-build test", false); }
  setSearch("");
  await wait(120);

  // --- Accessibility pass, 2026-09-10: Fase 2 item 3, deferred twice before
  // today for its own dedicated pass. Real gap found by looking, not
  // assumed: #species-list/#boss-list were plain <li>s with a global
  // arrow-key handler that only ever moved a CSS class (.kbd-active),
  // never real DOM focus - a screen reader or Tab-only user had no way to
  // reach the list at all except by already knowing the "/" shortcut.
  // Converted to the ARIA APG listbox pattern (role=listbox/option + a
  // roving tabindex) and extended arrow-key nav to the Chefões list, which
  // never had it before. Also: a global :focus-visible ring, aria-hidden on
  // purely decorative bits (type dots, sprite-fallback letters), aria-live
  // roles on the sync/storage banners, and a real focus trap + focus
  // return on the swap-team modal.
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  setSearch("");
  await wait(120);
  const a11yList = document.getElementById("species-list");
  check("species list is a real listbox (role=listbox + label)",
    a11yList.getAttribute("role") === "listbox" && !!a11yList.getAttribute("aria-label"));
  const a11yRows = document.querySelectorAll("#species-list .species-row");
  const a11yTabbable = [...a11yRows].filter(r => r.tabIndex === 0);
  check("exactly one species row is a tab stop at a time (roving tabindex)",
    a11yTabbable.length === 1, "tabbable=" + a11yTabbable.length);
  check("species rows expose role=option + aria-selected",
    a11yRows[0].getAttribute("role") === "option" && a11yRows[0].hasAttribute("aria-selected"));
  const a11yPip = document.querySelector(".type-pip");
  check("decorative type dots are aria-hidden (real type name is the text pill elsewhere)",
    a11yPip && a11yPip.getAttribute("aria-hidden") === "true");
  check("sync banner is a live region", document.getElementById("sync-banner").getAttribute("role") === "status");
  check("storage-full banner is an assertive live region (data-loss warning, not routine)",
    document.getElementById("storage-banner").getAttribute("role") === "alert");

  document.activeElement.blur();
  function pressA11y(key) { document.dispatchEvent(new KeyboardEvent("keydown", { key: key, bubbles: true, cancelable: true })); }
  pressA11y("ArrowDown");
  await wait(20);
  const a11yActiveRow = document.querySelector("#species-list .species-row.kbd-active");
  check("ArrowDown moves REAL DOM focus onto the highlighted row, not just a CSS class",
    a11yActiveRow && document.activeElement === a11yActiveRow && a11yActiveRow.tabIndex === 0,
    a11yActiveRow && document.activeElement === a11yActiveRow);

  document.querySelector('.tab-btn[data-tab="bosses"]').click();
  await wait(50);
  document.activeElement.blur();
  pressA11y("ArrowDown");
  await wait(20);
  const a11yBossRow = document.querySelector("#boss-list .species-row.kbd-active");
  check("Chefões list ALSO has arrow-key navigation now (previously had none at all)",
    a11yBossRow && document.activeElement === a11yBossRow);
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  // Modal focus management. Opening moves focus in; Tab traps inside it.
  // NOTE: this suite drives the page via synthetic events (no real mouse
  // click ever establishes browser-level document focus in this harness),
  // so "focus returns to the trigger button on close" isn't asserted here -
  // it depends on document.hasFocus(), which this harness doesn't reliably
  // have. Manually verified via real mouse clicks in this session instead
  // (same category of harness gap as the sample()/window.claude limitation
  // documented elsewhere in this file).
  setSearch("Bulbasaur");
  await wait(120);
  const bulbaRowA11y = document.querySelector("#species-list .species-row");
  if (achou("Bulbasaur na busca (teste de acessibilidade)", bulbaRowA11y)) {
    bulbaRowA11y.click();
    await wait(30);
    const addBtnA11y = document.getElementById("add-team-btn");
    if (addBtnA11y && !addBtnA11y.disabled) {
      // team is full (6/6) from the seed at the top of this suite, so this opens the swap modal
      addBtnA11y.click();
      await wait(50);
      const swapModal = document.getElementById("swap-modal");
      // <dialog> nativo desde 2026-09-13 - `.open` no lugar de `.hidden`
      // (a <div> manual de antes não existe mais).
      check("opening the swap modal moves focus inside it",
        swapModal.open && swapModal.contains(document.activeElement),
        document.activeElement && document.activeElement.className);
      // O teste de Tab-trap que existia aqui (focar o último elemento,
      // disparar Tab sintético, checar que voltou pro primeiro) foi
      // REMOVIDO ao trocar pro <dialog> nativo - pressA11y() só faz
      // document.dispatchEvent(KeyboardEvent) sintético, sem nenhum
      // listener nosso mais pra reagir a ele (o trap agora é o PRÓPRIO
      // navegador tratando uma tecla Tab de verdade, nível de motor/input,
      // não algo que um dispatchEvent de dentro da página consegue
      // simular). Manter o teste antigo aqui seria exatamente a mesma
      // classe de tautologia já achada e corrigida na seção 6 (QA,
      // 2026-09-13) - passaria sempre, sem testar nada de verdade. Testar
      // o trap de foco de verdade precisaria de um Tab real via Playwright
      // (page.keyboard.press(), fora do escopo desta suíte in-page) - o
      // comportamento em si é garantia nativa do navegador pra <dialog> +
      // showModal(), documentada e usada por isso mesmo.
      document.getElementById("swap-modal-close").click();
      await wait(30);
    }
  }
  setSearch("");
  await wait(120);


}
