// Seções Multi-build (até 3 por espécie) + 'Gerar build com IA', passe de acessibilidade da Fase 2 e 'Resolve o problema do QA' (leitor de caixa/dashboard).
// Extraído de scripts/smoke_test_suite.js (refactor 2026-09-13) - conteúdo idêntico ao original, só movido pra seu próprio arquivo.
async function section07() {
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
    check("'Gerar build com IA' button is present", !!document.getElementById("mybuild-ai-generate"));

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
  if (bulbaRowA11y) {
    bulbaRowA11y.click();
    await wait(30);
    const addBtnA11y = document.getElementById("add-team-btn");
    if (addBtnA11y && !addBtnA11y.disabled) {
      // team is full (6/6) from the seed at the top of this suite, so this opens the swap modal
      addBtnA11y.click();
      await wait(50);
      const swapModal = document.getElementById("swap-modal");
      check("opening the swap modal moves focus inside it",
        !swapModal.hidden && swapModal.contains(document.activeElement),
        document.activeElement && document.activeElement.className);
      const modalFocusables = swapModal.querySelectorAll("button:not([disabled])");
      if (modalFocusables.length) {
        modalFocusables[modalFocusables.length - 1].focus();
        pressA11y("Tab");
        await wait(20);
        check("Tab from the last focusable in the modal wraps to the first (focus trap)",
          document.activeElement === modalFocusables[0]);
      }
      document.getElementById("swap-modal-close").click();
      await wait(30);
    }
  }
  setSearch("");
  await wait(120);

  // --- Resolve o problema do QA, 2026-09-10: reunião da equipe sobre onde o
  // Especialista em Meta Pokémon entra na geração de build por IA. Antes,
  // "não dá pra testar a chamada real de sample() localmente" era aceito
  // como limitação permanente (não existe window.claude no dev-server local).
  // Isso resolve a parte que REALMENTE precisa ser testada por QA: que o
  // app monta o prompt certo, que as ferramentas (getTeamWeaknesses/
  // getSpeciesRank) são chamadas de verdade, que a resposta é validada
  // contra os dados reais, e que ela é salva/exibida corretamente. Um
  // window.claude FALSO, só nesta suíte de testes (nunca no build
  // publicado), que devolve uma resposta fabricada usando valores REAIS
  // lidos direto das opções já renderizadas na tela (não chutados) - assim
  // a resposta sempre passa em validateAiBuild() sem precisar adivinhar
  // qual ability/golpe é real pra cada espécie. O que isso NÃO testa (e
  // nunca vai testar por aqui): se a IA de verdade, ao vivo, dá uma resposta
  // de qualidade - isso continua precisando do aparelho real do usuário.
  setSearch("Squirtle"); // espécie ainda não tocada por nenhuma seção anterior
  await wait(120);
  const squirtleRow = document.querySelector("#species-list .species-row");
  if (squirtleRow) {
    squirtleRow.click();
    await wait(30);
    const realAbility = document.querySelector("#mybuild-ability option[value]:not([value=''])");
    const realNature = document.querySelector("#mybuild-nature option[value]:not([value=''])");
    const realMoveOptions = [...document.querySelectorAll("#mybuild-move-0 option")].filter(o => o.value);
    if (realAbility && realNature && realMoveOptions.length >= 4) {
      const fakeMoves = realMoveOptions.slice(0, 4).map(o => o.value);
      const mockRationale = "Escolhido pra cobrir a fraqueza compartilhada do time (teste automatizado).";
      window.__mockToolCalls = [];
      window.claude = {
        use: async function (name) {
          if (name !== "sample") return null;
          return {
            json: async function (prompt, opts) {
              window.__mockLastPrompt = prompt;
              if (opts && Array.isArray(opts.tools)) {
                for (const t of opts.tools) {
                  const input = (t.name === "getSpeciesRank" || t.name === "getPriorityMoveOptions" || t.name === "getAbilityMovepoolSynergy") ? { sname: "SPECIES_SQUIRTLE" } : {};
                  const result = await t.execute(input);
                  window.__mockToolCalls.push({ name: t.name, result });
                }
              }
              if (!(opts && Array.isArray(opts.tools) && opts.tools.some(t => t.name === "getRemainingBosses"))) {
                window.__missingRemainingBossesTool = true;
              }
              return {
                ability: realAbility.value, nature: realNature.value, item: "",
                moves: fakeMoves, evs: [252, 0, 0, 252, 0, 4],
                rationale: mockRationale
              };
            }
          };
        }
      };
      const aiBtn = document.getElementById("mybuild-ai-generate");
      if (aiBtn) {
        aiBtn.click();
        await wait(80);
        check("o mock chamou getTeamWeaknesses (ferramenta real, não simulada por fora)",
          window.__mockToolCalls.some(c => c.name === "getTeamWeaknesses" && typeof c.result.teamSize === "number"),
          JSON.stringify(window.__mockToolCalls.find(c => c.name === "getTeamWeaknesses")));
        const rankCall = window.__mockToolCalls.find(c => c.name === "getSpeciesRank");
        check("o mock chamou getSpeciesRank e recebeu um tier real (ou null, mas nunca inventado)",
          rankCall && ("tier" in rankCall.result), rankCall && JSON.stringify(rankCall.result));
        // Papel/arquétipo (RF35) + golpe de prioridade (RF37) - 2026-09-11,
        // pedido do usuário na reunião sobre montagem de build. getSpeciesRank
        // agora também devolve roles/split (SPECIES_ROLE), e uma 4a ferramenta
        // real, getPriorityMoveOptions, devolve os golpes de prioridade que a
        // espécie realmente aprende (nível/tutor, mesmo escopo que
        // validateAiBuild aceita). Squirtle não tem golpe de prioridade real
        // nesta hack, então a lista esperada aqui é vazia - o ponto do teste
        // é confirmar que a ferramenta foi chamada de verdade e devolveu um
        // array (nunca undefined/erro), não que Squirtle tenha prioridade.
        check("getSpeciesRank também devolve roles/split (nunca undefined)",
          rankCall && Array.isArray(rankCall.result.roles) && typeof rankCall.result.split !== "undefined",
          rankCall && JSON.stringify(rankCall.result));
        const prioCall = window.__mockToolCalls.find(c => c.name === "getPriorityMoveOptions");
        check("o mock chamou getPriorityMoveOptions (quarta ferramenta real, nao simulada por fora)",
          prioCall && Array.isArray(prioCall.result.priorityMoves),
          prioCall && JSON.stringify(prioCall.result));
        // Fase 3 (sinergia habilidade x movepool real, 2026-09-11): Squirtle
        // tem um caso real e nao-trivial pra testar - Torrent (innate) e um
        // bonus de TIPO (Water), nao de flag, e a especie realmente aprende
        // varios golpes Water (Surf, Hydro Pump, Bubble...). Confirma que a
        // 5a ferramenta foi chamada de verdade e devolveu o combo real, nao
        // um array vazio por engano (o que aconteceria se o sname nao fosse
        // repassado certo pro mock, ou se ABILITY_SYNERGY nao tivesse sido
        // carregado).
        const synergyCall = window.__mockToolCalls.find(c => c.name === "getAbilityMovepoolSynergy");
        check("o mock chamou getAbilityMovepoolSynergy (quinta ferramenta real, nao simulada por fora)",
          synergyCall && Array.isArray(synergyCall.result.synergies),
          synergyCall && JSON.stringify(synergyCall.result));
        check("getAbilityMovepoolSynergy confirma Torrent (Water) com golpes Water reais de Squirtle",
          synergyCall && synergyCall.result.synergies.some(function (s) {
            return s.ability === "Torrent" && s.categoria === "Water" && s.golpesReaisQueSeBeneficiam.indexOf("Surf") !== -1;
          }),
          synergyCall && JSON.stringify(synergyCall.result.synergies));
        // getRemainingBosses - 2026-09-10, contexto de progressao para a IA
        // (pedido do usuario: "daqui ate o final o que faz sentido nesse
        // poke agora"). Sem interacao nova - le so state.settings.milestone,
        // ja configurado na aba Progresso. A suite inteira ja rodou com
        // milestone="9" (Champion / Alto Comando, configurado la em cima
        // pra destravar o seletor de golpes) - nesse milestone NAO falta
        // nenhum chefe, entao a lista deve vir vazia. O teste de exclusao
        // parcial (ex: milestone 2 -> Wattson em diante) foi verificado a
        // mao ao vivo, nao aqui (mudar milestone aqui quebraria os outros
        // testes de golpe por nivel que dependem de "sem limite").
        const bossesCall = window.__mockToolCalls.find(c => c.name === "getRemainingBosses");
        check("o mock chamou getRemainingBosses (terceira ferramenta real, nao simulada por fora)",
          !window.__missingRemainingBossesTool && bossesCall && Array.isArray(bossesCall.result.remainingBossNames) && Array.isArray(bossesCall.result.mostCommonTypesAhead),
          bossesCall && JSON.stringify(bossesCall.result));
        check("com milestone 9 (Champion / Alto Comando) ja configurado, nao falta nenhum chefe",
          bossesCall && bossesCall.result.remainingBossNames.length === 0,
          bossesCall && JSON.stringify(bossesCall.result.remainingBossNames));
        check("build gerada por IA foi validada e salva (aparece 1 chip 'IA 1')",
          document.querySelectorAll(".mybuild-chip").length === 1 &&
          document.querySelector(".mybuild-chip").textContent.indexOf("IA 1") !== -1,
          document.querySelector(".mybuild-chip") && document.querySelector(".mybuild-chip").textContent);
        const rationaleEl = document.querySelector(".mybuild-rationale");
        check("a justificativa aparece em destaque na tela (bloco .mybuild-rationale)",
          rationaleEl && rationaleEl.textContent.indexOf(mockRationale) !== -1,
          rationaleEl && rationaleEl.textContent);
        var savedSquirtle = JSON.parse(localStorage.getItem("er_terminal_save") || "{}").customBuilds.SPECIES_SQUIRTLE;
        var savedEntry = savedSquirtle && savedSquirtle[0];
        check("a ability/golpes salvos batem exatamente com o que a IA (mock) escolheu",
          savedEntry && savedEntry.ability === realAbility.value && JSON.stringify(savedEntry.moves) === JSON.stringify(fakeMoves),
          savedEntry && JSON.stringify(savedEntry));

        // sampleErrorMessage() - 2026-09-11, achado na reunião sobre o
        // material de IHC (tabela "mensagens frustrantes x construtivas"):
        // o catch de generateBuildWithAI() era genérico ("Erro ao gerar
        // build - tente de novo."), sem dizer o que aconteceu - o mesmo
        // defeito do exemplo "Erro de sintaxe!" do livro. Corrigido pra
        // branchear por code (contrato sample.d.ts 0.2.41). O mock troca
        // json() por uma versão que sempre rejeita com o code pedido -
        // ainda é o código REAL do app (sampleErrorMessage) reagindo, só o
        // resultado do sample() é fabricado, mesmo espírito do resto desta
        // suíte. Testa 1 code documentado (mensagem específica) e 1 code
        // desconhecido (sample.d.ts manda tratar como upstream_error -
        // "falha transitória, tentar de novo é uma ação real" - nunca cair
        // de volta na mensagem genérica antiga).
        async function checkErrorCode(code, expectedSubstr) {
          window.claude = { use: async function (name) { return name === "sample" ? { json: async function () { throw { code: code, message: "teste" }; } } : null; } };
          document.getElementById("mybuild-ai-generate") && document.getElementById("mybuild-ai-generate").click();
          await wait(80);
          const status = document.getElementById("mybuild-ai-status").textContent;
          check("sampleErrorMessage() dá uma mensagem construtiva pra code=\"" + code + "\" (não a genérica antiga)",
            status.indexOf(expectedSubstr) !== -1 && status.indexOf("Erro ao gerar build - tente de novo.") === -1,
            status);
        }
        await checkErrorCode("rate_limited", "espere um pouco");
        await checkErrorCode("um_code_que_nao_existe_ainda", "temporária");
      } else { check("botão 'Gerar build com IA' encontrado pro teste de mock", false); }
      // Limpa o mock - as seções mais acima (Bulbasaur) já rodaram e não
      // dependem mais disso, mas nada depois deste ponto deve herdar um
      // window.claude falso por engano.
      delete window.claude;
      delete window.__mockToolCalls;
      delete window.__mockLastPrompt;
      delete window.__missingRemainingBossesTool;
    } else { check("Squirtle tem opções reais suficientes (ability/nature/4 golpes) pro teste de mock", false); }
  } else { check("Squirtle encontrado pro teste de mock da IA", false); }
  setSearch("");
  await wait(120);

}
