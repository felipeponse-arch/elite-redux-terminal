// Seção 13: descrição real de item, traduzida (data/item_descriptions.json +
// data/item_translations_pt.json) - 2026-09-13, achado real de pesquisa: o
// NextDex nunca expôs esse campo (usa a chave "desc" internamente, não
// "description" - por isso nosso pipeline sempre viu 0 de 929 itens com
// descrição até agora). Fonte de verdade real: github.com/Elite-Redux/
// er-config (arquivos .textproto do próprio jogo), traduzida na íntegra
// (818 de 818) seguindo o mesmo padrão de ABILITY_PT/MOVE_PT.
async function section13() {
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  // "Meu build": digitar um item exclusivo deste hack deve mostrar a
  // descrição real ao vivo, sem precisar salvar nada.
  setSearch("Pikachu");
  await wait(120);
  var rows = [...document.querySelectorAll("#species-list .species-row")];
  var basePikachu = rows.find(function (r) {
    return r.textContent.indexOf("Pikachu") !== -1 && r.textContent.indexOf("Alola") === -1 && r.textContent.indexOf("Partner") === -1;
  });
  check("achou o Pikachu base pra testar a descrição de item", !!basePikachu);
  if (basePikachu) {
    basePikachu.click();
    await wait(60);
    var itemInput = document.getElementById("mybuild-item");
    itemInput.value = "Swirly Glasses";
    itemInput.dispatchEvent(new Event("input", { bubbles: true }));
    await wait(60);
    var preview = document.getElementById("mybuild-status-preview");
    check("\"Meu build\" mostra a descrição real (em português) do item exclusivo deste hack ao digitar",
      !!preview && preview.textContent.indexOf("Swirly Glasses") !== -1 && preview.textContent.indexOf("categoria") !== -1 && preview.textContent.indexOf("físico/especial") !== -1);
    // item vazio não deve quebrar nem mostrar descrição nenhuma
    itemInput.value = "";
    itemInput.dispatchEvent(new Event("input", { bubbles: true }));
    await wait(60);
    check("item vazio no \"Meu build\" não mostra card de descrição (sem quebrar)",
      !preview.querySelector(".ts-item-desc"));
    document.getElementById("back-to-list").click();
    await wait(30);
  }

  // Card de build no Time: um build curado com item conhecido (Grotom,
  // Covert Cloak) deve mostrar a descrição junto do set.
  setSearch("Grotom");
  await wait(120);
  var grotomRow = document.querySelector("#species-list .species-row");
  if (grotomRow) {
    grotomRow.click();
    await wait(60);
    document.getElementById("add-team-btn").click();
    await wait(60);
    document.querySelector('.tab-btn[data-tab="team"]').click();
    await wait(150);
    var itemDesc = document.querySelector(".ts-item-desc");
    check("card de build do Time mostra a descrição real (em português) do item (Covert Cloak, Grotom)",
      !!itemDesc && itemDesc.textContent.indexOf("Covert Cloak") !== -1 && itemDesc.textContent.indexOf("efeitos secundários") !== -1);
    // Limpeza: manda o Grotom de volta pra caixa - não pode deixar o time
    // seed (6 membros, usado por outras seções) com 1 membro a mais.
    var removeBtn = [...document.querySelectorAll(".team-slot .remove-btn")].find(function (b) {
      return b.closest(".team-slot").textContent.indexOf("Grotom") !== -1;
    });
    if (removeBtn) removeBtn.click();
    await wait(60);
    document.querySelector('.tab-btn[data-tab="dex"]').click();
    await wait(30);
  }
}
