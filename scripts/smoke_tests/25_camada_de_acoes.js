// Seção 25 - camada de ações (fase 2 da refatoração, 2026-09-24). Toda mudança
// de estado passa por acao(telas, mudar): grava UMA vez e redesenha cada tela
// afetada UMA vez; ações dentro de ações viram lote; nada muda = nada acontece;
// tela escondida não é desenhada. Confere direto no app, contando gravações no
// localStorage e olhando se o nó do DOM foi trocado. Devolve o estado no fim.
async function section25() {
  const TE = window.__erTest;
  const S = TE.state;
  const snapshot = JSON.parse(JSON.stringify(TE.buildSave()));
  const setOriginal = Storage.prototype.setItem;
  let gravacoes = 0;
  Storage.prototype.setItem = function (k, v) {
    if (k === "er_terminal_save") gravacoes++;
    return setOriginal.call(this, k, v);
  };
  const contar = (fn) => { gravacoes = 0; fn(); return gravacoes; };
  try {
    document.querySelector('.tab-btn[data-tab="dex"]').click();
    await wait(30);

    check("ação que muda o estado grava exatamente 1 vez",
      contar(() => TE.acao([], () => { S.notes.__teste_acao = "x"; })) === 1);
    check("ação que devolve false (nada mudou) não grava",
      contar(() => TE.acao([], () => false)) === 0);

    // Lote: 3 mudanças dentro de uma ação = 1 gravação só.
    const n = contar(() => TE.acao([], () => {
      TE.acao([], () => { S.notes.__a = "1"; });
      TE.acao([], () => { S.notes.__b = "2"; });
      TE.acao([], () => { S.notes.__c = "3"; });
    }));
    check("ações aninhadas viram um lote: 1 gravação no fim, não 3", n === 1, n);

    // Erro dentro da ação não deixa a camada travada em "lote aberto".
    try { TE.acao([], () => { throw new Error("teste"); }); } catch (e) { /* esperado */ }
    check("depois de um erro dentro da ação, a próxima ação grava normalmente",
      contar(() => TE.acao([], () => { S.notes.__d = "4"; })) === 1);

    // Tela escondida não é desenhada: com a Dex aberta, "time" não troca o DOM
    // do time; quando a aba Time abre, ela se desenha (listener de .tab-btn).
    const marca = "<!--marca-teste-25-->";
    document.getElementById("team-slots").insertAdjacentHTML("beforeend", marca);
    TE.acao(["time"], () => { S.notes.__e = "5"; });
    check("aba Time escondida: a ação não redesenha o time", document.getElementById("team-slots").innerHTML.indexOf(marca) !== -1);
    document.querySelector('.tab-btn[data-tab="team"]').click();
    await wait(30);
    check("ao abrir a aba Time, ela se desenha de novo", document.getElementById("team-slots").innerHTML.indexOf(marca) === -1);
    TE.acao(["time"], () => { S.notes.__f = "6"; });
    document.getElementById("team-slots").insertAdjacentHTML("beforeend", marca);
    TE.acao(["time"], () => { S.notes.__f = "6"; });
    check("aba Time visível: a ação redesenha o time na hora", document.getElementById("team-slots").innerHTML.indexOf(marca) === -1);

    // Ficha: "ficha:SNAME" só redesenha a ficha aberta se for DESSE Pokémon -
    // redesenhar outra apagaria o que o jogador estiver digitando nela.
    document.querySelector('.tab-btn[data-tab="dex"]').click();
    await wait(30);
    setSearch("Swampert");
    await wait(120);
    const linha = document.querySelector('#species-list .species-row');
    if (achou("uma linha na busca pra abrir a ficha", linha)) {
      linha.click();
      await wait(60);
      const aberta = TE.getSpeciesByX(S.selected);
      const notas = document.getElementById("species-notes-input");
      if (achou("campo de anotação da ficha aberta", notas)) {
        notas.value = "digitando sem salvar";
        TE.acao(["ficha:SPECIES_QUE_NAO_E_ESTA"], () => { S.notes.__g = "7"; });
        check("ação de OUTRO Pokémon não redesenha a ficha aberta (texto digitado continua)",
          document.getElementById("species-notes-input").value === "digitando sem salvar");
        TE.acao(["ficha:" + aberta.sname], () => { S.notes.__h = "8"; });
        check("ação DESTE Pokémon redesenha a ficha aberta",
          document.getElementById("species-notes-input").value !== "digitando sem salvar");
      }
    }
    setSearch("");
  } finally {
    Storage.prototype.setItem = setOriginal;
    TE.applySave(snapshot);
    localStorage.setItem("er_terminal_save", JSON.stringify(snapshot));
  }
}
