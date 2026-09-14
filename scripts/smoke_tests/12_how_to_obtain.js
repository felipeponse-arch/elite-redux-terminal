// Seção 12: "Como obter" (espécies exclusivas, curadas em data/how_to_obtain.json)
// + nota de level cap corrigida - 2026-09-13, achados de uma varredura real
// de dúvidas de jogadores (fórum PokeCommunity) cruzada contra o que o
// Terminal já cobre.
async function section12() {
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  setSearch("Greninja");
  await wait(120);
  var rows = [...document.querySelectorAll("#species-list .species-row")];
  var battleBondRow = rows.find(function (r) { return r.textContent.indexOf("Battle Bond") !== -1; });
  var baseRow = rows.find(function (r) { return r.textContent.indexOf("Battle Bond") === -1 && r.textContent.indexOf("Mega") === -1 && r.textContent.indexOf("Ash") === -1; });

  check("achou Greninja Battle Bond e Greninja base na busca", !!battleBondRow && !!baseRow);

  if (battleBondRow) {
    battleBondRow.click();
    await wait(60);
    var card = [...document.querySelectorAll(".detail-group .card h3")].find(function (h) { return h.textContent === "Como obter"; });
    check("card \"Como obter\" aparece pra Greninja Battle Bond (espécie exclusiva curada)", !!card);
    check("card cita o presente de Mystery Gift após Flannery",
      !!card && card.parentElement.textContent.indexOf("Mystery Gift") !== -1 && card.parentElement.textContent.indexOf("Flannery") !== -1);
    document.getElementById("back-to-list").click();
    await wait(30);
  }

  if (baseRow) {
    setSearch("Greninja");
    await wait(120);
    rows = [...document.querySelectorAll("#species-list .species-row")];
    baseRow = rows.find(function (r) { return r.textContent.indexOf("Battle Bond") === -1 && r.textContent.indexOf("Mega") === -1 && r.textContent.indexOf("Ash") === -1; });
    if (baseRow) {
      baseRow.click();
      await wait(60);
      var cardBase = [...document.querySelectorAll(".detail-group .card h3")].find(function (h) { return h.textContent === "Como obter"; });
      check("Greninja comum (não-exclusivo) NÃO mostra card \"Como obter\" - escopo é só espécies curadas", !cardBase);
      document.getElementById("back-to-list").click();
      await wait(30);
    }
  }

  // Amostra das entradas novas (pesquisa mais funda no Discord oficial,
  // 2026-09-13) - não testa as 14 uma a uma, só confirma que o mecanismo
  // genérico (card só aparece pra quem está no data/how_to_obtain.json)
  // segue funcionando com o arquivo maior.
  setSearch("Regidrago");
  await wait(120);
  var regidragoRow = document.querySelector("#species-list .species-row");
  if (regidragoRow) {
    regidragoRow.click();
    await wait(60);
    var cardRegi = [...document.querySelectorAll(".detail-group .card h3")].find(function (h) { return h.textContent === "Como obter"; });
    check("card \"Como obter\" aparece pro Regidrago (Mystery Gift, achado na varredura do Discord oficial)", !!cardRegi);
    check("card cita Mystery Gift pro Regidrago",
      !!cardRegi && cardRegi.parentElement.textContent.indexOf("Mystery Gift") !== -1);
    document.getElementById("back-to-list").click();
    await wait(30);
  }

  // Nota de level cap corrigida (achado real: FAQ oficial diz que dá pra
  // AUMENTAR a dificuldade de novo depois de abaixar, só marca o Hall da
  // Fama - nossa nota antiga dizia o oposto, "nao aumentada de novo depois").
  document.getElementById("tabs-more-toggle").click();
  await wait(30);
  document.getElementById("tabs-more-panel").querySelector('[data-tab="progress"]').click();
  await wait(60);
  var noteText = document.getElementById("settings-note").textContent;
  check("nota de level cap não afirma mais que a dificuldade não pode ser aumentada de novo (achado corrigido contra a FAQ oficial)",
    noteText.indexOf("nao aumentada de novo depois") === -1 && noteText.indexOf("não aumentada de novo depois") === -1);
  check("nota de level cap explica que não existe opção pra desativar o cap em si",
    noteText.indexOf("desativar o level cap") !== -1);

  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
}
