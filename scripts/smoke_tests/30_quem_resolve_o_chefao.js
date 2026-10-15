// Seção 30 (2026-10-15): "Quem derruba este chefão" na aba Chefões (ticket pipeline-build-2026-10-14/04). Clique de verdade:
// o card nasce recolhido e sem cálculo; abrir o card abre o 1º Pokémon e calcula só ele; abrir outro calcula o outro;
// o time e a caixa do jogador vêm antes dos demais; trocar a variante do chefão para a que não é a da run não calcula;
// o que o jogador abriu sobrevive ao redesenho do detalhe.
async function section30() {
  await prepararRunPadrao();
  var T = window.__erTest;
  if (!T) { check("ponte de teste disponível", false); return; }
  var S = T.state;
  var snapshot = JSON.parse(JSON.stringify(T.buildSave()));
  try {
    S.settings.milestone = 3; // Meteor Falls (Courtney) é um chefão que falta na Etapa 3, level cap do modo fácil
    S.settings.difficulty = "ace";
    S.team = ["SPECIES_LEDIAN", "SPECIES_ACCELGOR"].map(function (s) { return T.getSpeciesBySname(s).x; });
    S.box = ["SPECIES_STEELIX", "SPECIES_SCIZOR"].map(function (s) { return T.getSpeciesBySname(s).x; });
    S.customBuilds = {};
    document.querySelector('.tab-btn[data-tab="bosses"]').click();
    await wait(50);
    var busca = document.getElementById("boss-search-input");
    busca.value = "Courtney Meteor Falls";
    busca.dispatchEvent(new Event("input", { bubbles: true }));
    var linha = document.querySelector("#boss-list .species-row");
    if (!achou("Courtney Meteor Falls na lista de chefões", linha)) return;
    linha.click();
    await wait(60);

    var card = document.getElementById("boss-quem-resolve");
    if (!achou("card 'Quem derruba este chefão'", card)) return;
    var membros = card.querySelectorAll(".qr-membro");
    check("o card nasce recolhido, com um grupo por Pokémon do chefão e nenhum cálculo feito", !card.open && membros.length >= 3 &&
      card.querySelectorAll(".pipe-cand").length === 0 && !card.querySelector(".qr-corpo").innerHTML.trim(), membros.length + " grupos");

    card.querySelector("summary").click();
    check("abrir o card abre o 1º Pokémon e calcula (só ele)", await pollUntil(function () { return card.open && membros[0].open; }, 2000));
    check("o 1º Pokémon mostra os cartões com veredito e selo do módulo", await pollUntil(function () { return membros[0].querySelectorAll(".pipe-cand").length >= 2; }, 20000),
      membros[0].querySelector(".qr-corpo").textContent.slice(0, 100));
    check("os outros Pokémon do chefão continuam sem cálculo", !membros[1].open && membros[1].querySelectorAll(".pipe-cand").length === 0);
    var itens = [].slice.call(membros[0].querySelectorAll(".qr-item"));
    check("cada resultado diz de onde vem (time, caixa ou fora da caixa)", itens.length >= 2 && itens.every(function (i) { return /No seu time|Na sua caixa|Fora da caixa/.test(i.querySelector(".qr-origem").textContent); }));
    var origens = itens.map(function (i) { return i.querySelector(".qr-origem").classList.contains("fora") ? 1 : 0; });
    check("time e caixa vêm antes dos demais", origens.join("") === origens.slice().sort().join(""), origens.join(""));
    check("cada resultado traz o selo e o botão que abre a ficha", itens.every(function (i) { return !!i.querySelector(".pipe-selo") && !!i.querySelector(".goto-species"); }));
    check("os resultados do time e da caixa são do jogador", itens.filter(function (i) { return !i.querySelector(".qr-origem.fora"); }).every(function (i) {
      return /Ledian|Accelgor|Steelix|Scizor/.test(i.querySelector(".pipe-membro-nome").textContent); }));

    // ---- abrir outro Pokémon calcula o outro; o redesenho do detalhe não fecha nada ----
    membros[1].querySelector("summary").click();
    check("abrir o 2º Pokémon calcula o 2º", await pollUntil(function () { return membros[1].querySelectorAll(".pipe-cand, .pipe-vazio").length >= 1 && !/Calculando/.test(membros[1].textContent); }, 20000));
    var nivel = document.getElementById("boss-level-input");
    // mesmo valor: o change redesenha o detalhe inteiro
    nivel.dispatchEvent(new Event("change", { bubbles: true }));
    await wait(80);
    var depois = document.getElementById("boss-quem-resolve");
    check("o redesenho do detalhe mantém o card e os dois Pokémon abertos, já preenchidos (cache)", depois && depois !== card && depois.open &&
      depois.querySelectorAll(".qr-membro")[0].open && depois.querySelectorAll(".qr-membro")[1].open &&
      await pollUntil(function () { return depois.querySelectorAll(".qr-membro")[0].querySelectorAll(".pipe-cand").length >= 2; }, 5000));

    // ---- variante que não é a da run ----
    var outraVariante = [].filter.call(document.querySelectorAll("#boss-detail [data-diff]"), function (b) { return b.dataset.diff !== "party"; })[0];
    if (outraVariante) {
      outraVariante.click();
      await wait(60);
      var cardOutra = document.getElementById("boss-quem-resolve");
      cardOutra.querySelector("summary").click();
      await wait(60);
      check("na variante que não é a da sua Dificuldade o card avisa e não calcula", /usa o time que o chefão tem na sua Dificuldade/.test(cardOutra.textContent) && cardOutra.querySelectorAll(".qr-membro").length === 0);
    }
  } finally {
    T.applySave(snapshot);
    S.selected = null;
  }
}
