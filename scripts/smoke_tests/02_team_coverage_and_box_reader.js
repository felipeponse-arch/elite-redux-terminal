// Seções 6, 7 e 7b: card de builds de referência, tabela de cobertura do time e o 'leitor de caixa' (sugestão de próxima luta).
// Extraído de scripts/smoke_test_suite.js (refactor 2026-09-13) - conteúdo idêntico ao original, só movido pra seu próprio arquivo.
async function section02() {
  await prepararRunPadrao();
  // --- 6. build-reference card has a real title (not a bare <details>) ---
  // Achado em auditoria de QA (2026-09-13): esta checagem sempre passava
  // (`check(..., true)`) - `buildCard` era calculado e nunca usado na
  // asserção. Nidoking (espécie atual nesta seção) não tem build de
  // chefão real (não está em data/boss_reference_builds.json), então o
  // card nem deveria renderizar aqui - testa esse caminho de verdade, e
  // depois troca pra uma espécie que TEM dado real (Eelektross) pra testar
  // o caminho positivo também.
  // Seleciona o Nidoking aqui mesmo - antes a seção herdava a seleção deixada
  // pela 01 e, rodando sozinha, testava a espécie errada (Q1, 2026-09-16).
  setSearch("Nidoking");
  await wait(120);
  const nidokingRow = [...document.querySelectorAll("#species-list .species-row")]
    .find(function (r) { return r.textContent.indexOf("Nidoking") !== -1 && r.textContent.indexOf("Redux") === -1; });
  if (achou("Nidoking na busca", nidokingRow)) { nidokingRow.click(); await wait(30); }
  const buildCardAbsent = [...document.querySelectorAll("#species-detail .card h3")]
    .find(h => h.textContent === "Builds de referência");
  check("espécie sem build de chefão real (Nidoking) não mostra o card 'Builds de referência'", !buildCardAbsent);

  setSearch("Eelektross");
  await wait(120);
  const eelektrossRow6 = document.querySelector("#species-list .species-row");
  if (eelektrossRow6) {
    eelektrossRow6.click();
    await wait(30);
    const buildCard = [...document.querySelectorAll("#species-detail .card h3")]
      .find(h => h.textContent === "Builds de referência");
    // .closest("details") É esperado (a seção inteira "Golpes/Anotações e
    // builds de referência/Comparar" vive dentro de um <details
    // class="detail-group"> colapsável de propósito, Fase 2 2026-09-11) -
    // o que este teste verifica é só que o TÍTULO em si é um <h3> de
    // verdade dentro de um .card, não texto solto ou um <summary> fazendo
    // o papel de cabeçalho.
    check("espécie com build de chefão real (Eelektross) mostra o card 'Builds de referência' com título de verdade",
      !!buildCard && !!buildCard.closest(".card"));
  } else { check("Eelektross encontrado pro teste do card de builds de referência", false); }
  setSearch("");
  await wait(120);

  // --- 7. team coverage table sits in a titled .card (not a bare <h3>) ---
  // 2 cards em #team-analysis (Riscos compartilhados + Cobertura defensiva)
  // - "Leitura estratégica" morou aqui até a décima-nona/vigésima-primeira
  // passagem (2026-09-11), quando subiu pro topo da página como seu próprio
  // elemento #team-strategy (pedido do usuário - ver checagem 7c abaixo).
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);
  const analysisCards = document.querySelectorAll("#team-analysis .card");
  check("team-analysis renders inside .card elements (not bare <h3>)", analysisCards.length === 2, "found " + analysisCards.length);
  const scrollX = document.querySelector("#team-analysis .scroll-x");
  if (scrollX) {
    const cs = getComputedStyle(scrollX);
    check("coverage table has a scroll mask", !!(cs.maskImage && cs.maskImage !== "none") || !!(cs.webkitMaskImage && cs.webkitMaskImage !== "none"));
  }

  // --- 7b. "leitor de caixa" (reunião 2026-09-11) - Fase 1 (dashboard) +
  // Fase 2 (análise de time por IA) + Fase 3 (ferramenta unificada). Não
  // dá pra chamar bestBoxCandidateForBoss()/BOSSES direto daqui (fecham
  // dentro da IIFE do app, o teste só enxerga o DOM) - as checagens abaixo
  // são estruturais: se uma sugestão aparecer, ela precisa ser
  // autoconsistente com o que já está renderizado em outro lugar da tela
  // (o nome sugerido é mesmo um membro real da caixa), não um valor
  // hardcoded que quebraria se o balanceamento do jogo mudar.
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  document.getElementById("tabs-more-toggle").click();
  await wait(20);
  document.querySelector('#tabs-more-panel [data-tab="progress"]').click();
  await wait(50);
  const milestoneSelBefore = document.getElementById("settings-milestone").value;
  document.getElementById("settings-milestone").value = "1"; // muitos chefões ainda faltam
  document.getElementById("settings-milestone").dispatchEvent(new Event("change", { bubbles: true }));
  await wait(50);
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(50);
  // Classe própria (.dash-suggestion-boss), não :last-child nem substring -
  // achado real ao rodar isto pela primeira vez: a sugestão por RANK que já
  // existia (dash-suggestion "normal") também tem "na caixa" no texto,
  // então :last-child + indexOf("na caixa") colidia com ela quando a
  // sugestão de chefão não renderiza (falso positivo pra classe errada).
  const nextFightLine = document.querySelector("#team-nextfight .dash-suggestion-boss .dash-value");
  const nextFightText = nextFightLine ? nextFightLine.textContent : "";
  if (nextFightLine) {
    check("linha 'Próxima luta' do dashboard (Fase 1) tem o formato esperado (chefão: espécie na caixa + motivo)",
      /.+: .+ na caixa (imune a|resiste bem a) .+/.test(nextFightText), nextFightText);
    // confirma que a espécie sugerida é mesmo um membro REAL da caixa agora
    // (não do time, não inventado) - cruza com a aba Caixa renderizada
    const suggestedName = nextFightLine.querySelector(".goto-species") ? nextFightLine.querySelector(".goto-species").textContent : "";
    document.querySelector('.tab-btn[data-tab="box"]').click();
    await wait(50);
    // PC Box (Fase 2, 2026-09-11/12) só mostra sprite na grade, não nome de
    // toda espécie ao mesmo tempo - usa a própria busca da PC Box (que já
    // pula pra caixa+slot certo e seleciona) pra confirmar que a espécie
    // sugerida é mesmo um membro real, em vez de listar todos os nomes.
    const pcSearch = document.getElementById("pcbox-search");
    pcSearch.value = suggestedName || "";
    pcSearch.dispatchEvent(new Event("input", { bubbles: true }));
    await wait(50);
    const foundDetailName = document.querySelector(".pcbox-detail .pcbox-detail-name");
    check("a espécie sugerida na Fase 1 é mesmo um membro real da caixa (não inventado, não do time)",
      !!suggestedName && !!foundDetailName && foundDetailName.textContent === suggestedName,
      { suggestedName: suggestedName, foundInBox: foundDetailName && foundDetailName.textContent });
    pcSearch.value = "";
    pcSearch.dispatchEvent(new Event("input", { bubbles: true }));
    document.querySelector('.tab-btn[data-tab="dex"]').click();
    await wait(30);
  } else {
    // Nenhuma sugestão é um resultado válido (a caixa pode genuinamente não
    // ter nada mais seguro que o time já tem) - só registra, não falha.
    check("dashboard sem sugestão de 'próxima luta' é um resultado aceito (caixa sem candidato melhor)", true);
  }
  // restaura o milestone "sem limite" que o resto da suíte inteira depende
  document.getElementById("tabs-more-toggle").click();
  await wait(20);
  document.querySelector('#tabs-more-panel [data-tab="progress"]').click();
  await wait(50);
  document.getElementById("settings-milestone").value = milestoneSelBefore;
  document.getElementById("settings-milestone").dispatchEvent(new Event("change", { bubbles: true }));
  await wait(50);
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);
  // Reposicionamento pedido pelo usuário, 2026-09-11: o card de arquétipo
  // era a ÚLTIMA coisa da aba - agora é a PRIMEIRA, acima até de "Meu time".
  // "Leitura estratégica" (que morava aqui) foi removida em 2026-09-18 -
  // "Gerar time completo" cobre a mesma necessidade numa ação só - mas o
  // elemento #team-strategy e seu reposicionamento continuam existindo pro
  // card "Arquétipo do time". DOCUMENT_POSITION_FOLLOWING = o 2º argumento
  // vem DEPOIS do 1º no DOM.
  const teamStrategyEl = document.getElementById("team-strategy");
  const teamSlotsEl = document.getElementById("team-slots");
  check("'Arquétipo do time' aparece ANTES de 'Meu time' no DOM (primeiro item da página)",
    !!teamStrategyEl && !!teamSlotsEl &&
    !!(teamStrategyEl.compareDocumentPosition(teamSlotsEl) & Node.DOCUMENT_POSITION_FOLLOWING));
}
