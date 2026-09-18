// Seção 21 (2026-09-18, auditoria completa pedida pelo usuário): dois
// achados da mesma auditoria, agrupados por serem a mesma classe de risco
// (perda de dado sem confirmação). "Times salvos" nunca tinha teste
// automatizado nenhum. PC Box: "remover da caixa" apagava o Pokémon de vez,
// sem confirmar - mais grave que o "Novo jogo" (um clique só, ícone
// pequeno do lado de um botão grande de "→ time", fácil de clicar errado).
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

  // ---- PC Box: "remover da caixa" ganhou confirmação (achado grave da
  // auditoria - apagava de vez, sem aviso, com 1 clique). ----
  document.querySelector('.tab-btn[data-tab="box"]').click();
  await wait(50);
  var boxSlot = document.querySelector(".pcbox-slot:not(.empty)");
  if (achou("pelo menos 1 Pokémon na caixa pra testar a remoção", boxSlot)) {
    var removidoX = parseInt(boxSlot.dataset.x, 10);
    var boxAntes = T.state.box.length;
    boxSlot.click();
    await wait(30);
    var removeBtn21 = document.querySelector(".pcbox-detail .remove-btn");
    if (achou("botão de remover da caixa no painel de detalhe", removeBtn21)) {
      removeBtn21.click();
      await wait(50);
      var dialogBox = document.getElementById("confirm-modal");
      check("remover da caixa abre o diálogo de confirmação (achado grave: antes apagava na hora)",
        dialogBox && dialogBox.open && /não dá pra desfazer/.test(document.getElementById("confirm-modal-message").textContent),
        dialogBox && document.getElementById("confirm-modal-message").textContent);

      document.getElementById("confirm-modal-cancel").click();
      await wait(30);
      check("cancelar preserva o Pokémon na caixa", T.state.box.indexOf(removidoX) !== -1 && T.state.box.length === boxAntes);

      removeBtn21.click();
      await wait(30);
      document.getElementById("confirm-modal-ok").click();
      await wait(50);
      check("confirmar remove o Pokémon da caixa de vez (e só da caixa, não mexe no time)",
        T.state.box.indexOf(removidoX) === -1 && T.state.box.length === boxAntes - 1 && T.state.team.length === 6,
        { boxAntes: boxAntes, boxDepois: T.state.box.length, team: T.state.team.length });
    }
  }

  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
}
