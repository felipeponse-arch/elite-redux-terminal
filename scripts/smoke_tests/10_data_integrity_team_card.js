// Seções 25, 26, 29 e 30: time e caixa nunca compartilham o mesmo Pokémon, auditoria WCAG/eMAG, "remover" do Meu Time e "Novo jogo".
// (As seções 27 e 28, do gerador de build por IA, saíram em 06/11/2026: o app não usa mais IA.)
async function section10() {
  // --- 25. Time e caixa nunca compartilham o mesmo Pokémon (achado real em
  // revisão de código, 2026-09-12) - o botão "+ Caixa" na ficha da Dex só
  // desabilitava por `inBox`, nunca por `inTeam`: dava pra clicar
  // "Adicionar à caixa" com o Pokémon JÁ no time, deixando o mesmo x nos
  // dois arrays ao mesmo tempo (quebra a garantia que rosterMove() dá em
  // todo outro ponto de entrada - "nunca no time E na caixa"). Corrigido
  // desabilitando também por `inTeam` + uma checagem de defesa em
  // profundidade dentro do próprio handler de clique.
  // Garante 1 vaga livre no time - se estiver 6/6 (comum a essa altura da
  // suíte), clicar "+ Time" abriria o modal de troca em vez de adicionar
  // direto, o que quebraria as checagens abaixo.
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(30);
  const freeSlotBtn = document.querySelector(".team-slot .remove-btn");
  if (freeSlotBtn) { freeSlotBtn.click(); await wait(30); }
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  // Meowth - espécie não usada em nenhuma fixture anterior desta suíte
  // (Eevee/Forretress/Magcargo etc. já passaram por várias seções antes
  // desta e podiam estar no time ou na caixa por causa disso, invalidando
  // a checagem de "estado inicial limpo" que este teste precisa).
  setSearch("Meowth");
  await wait(120);
  const meowthRow = document.querySelector("#species-list .species-row");
  if (meowthRow) {
    meowthRow.click();
    await wait(30);
    // Texto curto nos botões de ação da ficha (achado real do usuário,
    // 2026-09-12: "+ Adicionar ao time" + "+ Adicionar à caixa" juntos
    // empilhavam em vez de ficar lado a lado numa largura de painel comum,
    // virando duas barras enormes). A frase completa mora no title/aria-label.
    check("botões de ação da ficha usam texto curto ('+ Time'/'+ Caixa', não mais 'Adicionar ao time/à caixa')",
      document.getElementById("add-team-btn").textContent === "+ Time" &&
      document.getElementById("add-box-btn").textContent === "+ Caixa" &&
      document.getElementById("add-team-btn").title.indexOf("Adicionar ao time") !== -1,
      { team: document.getElementById("add-team-btn").textContent, box: document.getElementById("add-box-btn").textContent });
    document.getElementById("add-team-btn").click();
    await wait(50);
    const addBoxBtnAfterTeam = document.getElementById("add-box-btn");
    check("botão '+ Caixa' fica desabilitado quando a espécie já está no time (não só quando já está na caixa)",
      // Rótulo continua "+ Caixa" (redesenho 2026-09-24: os dois botões diziam
      // "No time" lado a lado); o motivo fica no title.
      !!addBoxBtnAfterTeam && addBoxBtnAfterTeam.disabled && addBoxBtnAfterTeam.textContent === "+ Caixa" && addBoxBtnAfterTeam.title === "Já está no time",
      addBoxBtnAfterTeam && { disabled: addBoxBtnAfterTeam.disabled, text: addBoxBtnAfterTeam.textContent });
    addBoxBtnAfterTeam.click(); // deveria ser um no-op de verdade, não só visual
    await wait(30);
    const saveAfterGuard = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
    check("clicar mesmo assim não escreve o Pokémon na caixa (defesa em profundidade no handler, não só no disabled do botão)",
      (saveAfterGuard.box || []).indexOf("SPECIES_MEOWTH") === -1, saveAfterGuard.box);
  } else {
    check("Meowth encontrado pro teste de exclusividade time/caixa", false);
  }
  setSearch("");
  await wait(30);

  // --- 26. Auditoria WCAG/eMAG (2026-09-12) - todo .notes-status precisa
  // anunciar mensagens de status pra leitor de tela, mesmo padrão que o
  // toast/sync-banner/storage-banner já seguiam. Regressão-guarda: confirma
  // que as ocorrências reais no DOM (mybuild-status só existe com uma
  // build ativa, então não é checado aqui; team-strategy-status foi removido
  // junto com a Leitura estratégica, 2026-09-18) têm role="status"
  // aria-live="polite".
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(30);
  const teamStatusIds = ["archetype-status"];
  const missingAriaLiveTeam = teamStatusIds.filter(function (id) {
    var el = document.getElementById(id);
    return !el || el.getAttribute("aria-live") !== "polite" || el.getAttribute("role") !== "status";
  });
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  setSearch("Bulbasaur");
  await wait(120);
  const bulbaRowAudit = document.querySelector("#species-list .species-row");
  if (bulbaRowAudit) { bulbaRowAudit.click(); await wait(30); }
  const speciesStatusEl = document.getElementById("species-notes-status");
  const missingAriaLive = missingAriaLiveTeam.concat(
    (!speciesStatusEl || speciesStatusEl.getAttribute("aria-live") !== "polite" || speciesStatusEl.getAttribute("role") !== "status") ? ["species-notes-status"] : []
  );
  check("spans de status (.notes-status) anunciam mudança pra leitor de tela (role=status aria-live=polite)",
    missingAriaLive.length === 0, missingAriaLive);
  setSearch("");

  // --- 29. "remover" do Meu Time banca pra caixa, não descarta (achado em
  // auditoria completa da equipe, 2026-09-13) - antes disto,
  // state.team = state.team.filter(...) sozinho fazia o Pokémon sumir de
  // verdade (nem ia pra caixa), inconsistente com rosterMove()/
  // applyRecommendedTeam()/renderSavedTeams() "Carregar", que sempre banem
  // quem sai do time. Não assume QUEM está no time neste ponto da suíte
  // (muitas seções anteriores já mexeram nele) - só que há pelo menos 1
  // membro, e testa a remoção do primeiro encontrado.
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);
  const saveBefore29 = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
  const teamBefore29 = saveBefore29.team || [];
  if (teamBefore29.length) {
    const removedSname29 = teamBefore29[0];
    const removeBtn29 = document.querySelector(".remove-btn");
    if (removeBtn29) {
      removeBtn29.click();
      await wait(50);
      const saveAfter29 = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
      const stillInTeam29 = (saveAfter29.team || []).indexOf(removedSname29) !== -1;
      const nowInBox29 = (saveAfter29.box || []).indexOf(removedSname29) !== -1;
      check("'remover' do Meu Time manda o Pokémon pra caixa em vez de descartar",
        !stillInTeam29 && nowInBox29,
        { removedSname29, teamAfter: saveAfter29.team, boxHasIt: nowInBox29 });
    } else { check("botão 'remover' encontrado no card do Meu Time", false); }
  } else { check("time tinha pelo menos 1 membro pro teste de 'remover'", false, teamBefore29); }

  // --- 30. "Novo jogo" (reset de time e caixa) - pedido do usuário,
  // 2026-09-13, reescrito na auditoria de 2026-09-18 (bug real: usava
  // window.confirm() nativo, que o iframe sandboxed de um Artifact
  // publicado bloqueia sem erro nenhum - o botão "não fazia nada" pro
  // usuário). Agora usa o <dialog> #confirm-modal - testa os dois caminhos
  // de verdade, clicando nos botões reais do diálogo, não mockando window.
  // confirm. Semeia um Pikachu novo no time (não reusa fixture de seções
  // anteriores) e uma anotação real pra confirmar que ela sobrevive ao
  // reset.
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  setSearch("Pikachu");
  await wait(120);
  const pikaRow30 = document.querySelector("#species-list .species-row");
  if (pikaRow30) {
    pikaRow30.click();
    await wait(30);
    const notesArea30 = document.getElementById("species-notes-input");
    notesArea30.value = "nota de teste - deve sobreviver ao reset";
    document.getElementById("species-notes-save").click();
    await wait(30);
    document.getElementById("add-team-btn").click();
    await wait(30);
    document.querySelector('.tab-btn[data-tab="team"]').click();
    await wait(50);

    const resetBtn30 = document.getElementById("reset-team-box-btn");
    check("botão 'Novo jogo' existe e fica habilitado quando há time/caixa", !!resetBtn30 && resetBtn30.disabled === false);

    if (resetBtn30) {
      const teamBeforeCancel30 = JSON.parse(localStorage.getItem("er_terminal_save") || "{}").team;
      resetBtn30.click();
      await wait(50);
      const dialog30 = document.getElementById("confirm-modal");
      check("clicar em 'Novo jogo' abre o diálogo de confirmação (não window.confirm)", dialog30 && dialog30.open);
      check("diálogo explica o que será perdido e o que sobrevive",
        document.getElementById("confirm-modal-message").textContent.indexOf("Builds, anotações e times salvos continuam guardados") !== -1);
      document.getElementById("confirm-modal-cancel").click();
      await wait(50);
      check("cancelar fecha o diálogo sem mudar nada",
        !dialog30.open && JSON.stringify(teamBeforeCancel30) === JSON.stringify(JSON.parse(localStorage.getItem("er_terminal_save") || "{}").team));

      // 2026-09-24: "Novo jogo" zera a RUN inteira, não só time e caixa. Semeia
      // estado de run em todos os campos que antes sobreviviam ao reset.
      const S30 = window.__erTest.state;
      const dificuldadeAntes30 = S30.settings.difficulty;
      S30.settings.milestone = 2;
      S30.settings.runConfirmedAt = new Date().toISOString();
      S30.archetype = { pace: "Balance", weather: "Rain", monotype: null, reasoning: "teste" };
      S30.autoEvolved = { SPECIES_RATICATE: { from: "Rattata", lvl: 20 } };
      S30.gymSkillsCleared = { Roxanne: ["teste"] };
      resetBtn30.click();
      await wait(50);
      check("diálogo do 'Novo jogo' diz que zera a run inteira e o que continua guardado",
        /zera a sua run/.test(document.getElementById("confirm-modal-message").textContent) &&
          /Dificuldade, level cap e modo de Mega ficam como estão/.test(document.getElementById("confirm-modal-message").textContent));
      document.getElementById("confirm-modal-ok").click();
      await wait(80);
      const saveAfterReset30 = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
      check("confirmar 'Novo jogo' zera time E caixa",
        saveAfterReset30.team.length === 0 && saveAfterReset30.box.length === 0,
        { team: saveAfterReset30.team, box: saveAfterReset30.box });
      check("'Novo jogo' também volta a insígnia pro início e limpa arquétipo, auto-evolução e buffs de ginásio",
        saveAfterReset30.settings.milestone === 0 &&
          !saveAfterReset30.archetype.pace && !saveAfterReset30.archetype.weather &&
          Object.keys(saveAfterReset30.autoEvolved || {}).length === 0 &&
          Object.keys(saveAfterReset30.gymSkillsCleared || {}).length === 0,
        { milestone: saveAfterReset30.settings.milestone, archetype: saveAfterReset30.archetype, autoEvolved: saveAfterReset30.autoEvolved, gym: saveAfterReset30.gymSkillsCleared });
      check("'Novo jogo' mantém as opções de setup do jogo (dificuldade) mas pede pra confirmar a run de novo",
        saveAfterReset30.settings.difficulty === dificuldadeAntes30 && !saveAfterReset30.settings.runConfirmedAt &&
          document.getElementById("run-setup-banner").hidden === false);
      check("'Novo jogo' anota no log \"O que o app fez sozinho\"",
        (saveAfterReset30.autoLog || []).some(function (e) { return e.text.indexOf("Novo jogo:") === 0; }));
      check("anotação sobrevive ao reset (só a composição de time/caixa é limpa)",
        saveAfterReset30.notes && saveAfterReset30.notes.SPECIES_PIKACHU === "nota de teste - deve sobreviver ao reset");
      check("botão 'Novo jogo' fica desabilitado depois, sem nada pra resetar",
        document.getElementById("reset-team-box-btn").disabled === true);
    }
  } else { check("Pikachu encontrado pro teste de 'Novo jogo'", false); }
}
