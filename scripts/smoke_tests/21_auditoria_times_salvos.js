// Seção 21 (2026-09-18, auditoria completa pedida pelo usuário): "Times
// salvos" nunca tinha teste automatizado - achado durante a auditoria.
// Cobre salvar, carregar, renomear e excluir (com o diálogo de confirmação
// novo, mesmo achado do bug do "Novo jogo": excluía sem avisar antes).
async function section21() {
  await prepararRunPadrao();
  var T = window.__erTest;
  if (!T) { check("ponte de teste disponível", false); return; }

  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);

  var nomeInput = document.getElementById("save-team-name");
  var saveBtn = document.getElementById("save-team-btn");
  if (!achou("campo de nome e botão 'salvar time' existem", nomeInput && saveBtn)) return;

  var totalAntes = T.state.savedTeams.length;
  nomeInput.value = "Time de teste da auditoria";
  saveBtn.click();
  await wait(50);
  check("salvar cria um novo slot com o nome digitado",
    T.state.savedTeams.length === totalAntes + 1 && T.state.savedTeams[T.state.savedTeams.length - 1].name === "Time de teste da auditoria",
    T.state.savedTeams.map(function (s) { return s.name; }));

  var idx = T.state.savedTeams.length - 1;
  var card = [...document.querySelectorAll(".saved-team-card")].find(function (c) {
    return c.textContent.indexOf("Time de teste da auditoria") !== -1;
  });
  if (achou("card do time recém-salvo na grade", card)) {
    // ---- renomear ----
    card.querySelector(".stc-rename").click();
    await wait(30);
    var renameInput = document.getElementById("stc-rename-input");
    if (achou("campo de renomear aparece", renameInput)) {
      renameInput.value = "Nome renomeado";
      document.querySelector(".stc-rename-save").click();
      await wait(30);
      check("renomear salva o novo nome", T.state.savedTeams[idx].name === "Nome renomeado", T.state.savedTeams[idx]);
    }

    // ---- excluir: achado da auditoria - antes apagava sem confirmar ----
    card = [...document.querySelectorAll(".saved-team-card")].find(function (c) {
      return c.textContent.indexOf("Nome renomeado") !== -1;
    });
    var delBtn = card && card.querySelector(".stc-delete");
    if (achou("botão 'Excluir' no card", delBtn)) {
      delBtn.click();
      await wait(50);
      var dialog21 = document.getElementById("confirm-modal");
      check("excluir agora abre o diálogo de confirmação antes de apagar (achado da auditoria)",
        dialog21 && dialog21.open && document.getElementById("confirm-modal-message").textContent.indexOf("Nome renomeado") !== -1,
        dialog21 && document.getElementById("confirm-modal-message").textContent);

      document.getElementById("confirm-modal-cancel").click();
      await wait(30);
      check("cancelar preserva o time salvo", T.state.savedTeams.length === totalAntes + 1);

      delBtn.click();
      await wait(30);
      document.getElementById("confirm-modal-ok").click();
      await wait(30);
      check("confirmar remove o slot salvo, sem afetar o time/caixa atuais",
        T.state.savedTeams.length === totalAntes && T.state.team.length === 6,
        { savedTeams: T.state.savedTeams.length, team: T.state.team.length });
    }
  }

  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
}
