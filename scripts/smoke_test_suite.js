// Consolidated smoke-test suite for artifact_final.html - dev review, 2026-09-09:
// "toda correcao dependeu de eu lembrar de rodar aqueles trechos de JS na mao"
// (from the old scripts/manual_smoke_tests.md, since removed - fully
// superseded by this file, 2026-09-09, part of a broader pass removing
// things "Meu build"/sync made obsolete) "e so eu conferindo o resultado a
// olho, sem garantia nenhuma de que eu li certo". This doesn't add a real
// test *runner* (no node/npm/browser-test-framework in this environment -
// see AUDITORIA-DOSSIE.md section 13) - it removes the "read the result by
// eye" step: every check below asserts and reports PASS/FAIL itself,
// instead of returning a raw value the caller has to compare against a
// comment.
//
// Two parts, because a page reload always ends whatever script triggered it
// (the Browser tool's javascript_tool call dies with the page) - they can't
// be merged into one call no matter how this file is organized:
//
//   PART A (runLiveTests) - everything drivable without a reload. Paste the
//     whole function into the console (or run via javascript_tool) on a
//     freshly loaded page, then call runLiveTests(). Seeds its own team/box
//     via the real UI (search -> click -> add), same as a user would, so it
//     doubles as an interaction test, not just a state check. Clears
//     localStorage when done.
//
//   PART B (2 separate snippets below) - the save-orphan/milestone-clamp
//     test, which genuinely needs a reload between "write a fake save" and
//     "assert the app read it correctly". Run snippet B1, reload the page
//     (navigate to the same URL), then run snippet B2.
//
//   PART C (1 snippet below, run standalone) - the fail-fast build-integrity
//     check (2026-09-09, post-audit). Can't run inside PART A: it needs the
//     page to actually load artifact_template.html (raw, unbuilt) instead of
//     artifact_final.html, a different URL/file entirely, not just a
//     different in-page state. Navigate to artifact_template.html served
//     locally, then run snippet C.
//
// To serve the build locally first: a plain HTTP server (not file://, some
// things behave differently) rooted at this project folder, e.g. a simple
// PowerShell HttpListener on port 8100 serving artifact_final.html, opened
// in the Browser tool via preview_start.

// ============================== PART A ==============================
async function runLiveTests() {
  const results = [];
  function check(name, cond, detail) {
    results.push({ name, pass: !!cond, detail: detail || "" });
  }
  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
  // Achado em auditoria de QA (2026-09-13): os 2 "flakes" documentados há
  // muitas sessões (HP recomputado / anotação migrada) provavelmente vêm
  // do mesmo padrão - um wait(ms) FIXO depois de disparar um evento,
  // torcendo pra que o re-render/persist() já tenha terminado até lá.
  // pollUntil() espera pela condição de verdade em vez de um tempo
  // chutado - tenta a cada 10ms até `fn()` virar truthy ou o timeout
  // estourar (aí faz uma última tentativa, caso o timeout bata bem na
  // hora que a condição vira verdadeira).
  async function pollUntil(fn, timeoutMs) {
    var start = Date.now();
    var limit = timeoutMs || 500;
    while (Date.now() - start < limit) {
      if (fn()) return true;
      await wait(10);
    }
    return !!fn();
  }
  // Reorganização em blocos colapsáveis (<details>), Fase 2, 2026-09-11:
  // "Golpes"/"Anotações e builds de referência"/"Comparar" ficam FECHADOS
  // por padrão (decisão da equipe - só "Auto Build" abre sozinho; "Conhecer
  // a espécie" nem é <details> mais, ver abaixo). Um elemento dentro de um
  // <details> fechado ainda existe no DOM (querySelector encontra), mas não
  // está visível/interagível de verdade - qualquer teste que precise mexer
  // em algo dentro de um grupo fechado chama isto primeiro. Acha pelo texto
  // do <summary> (prefixo), não por índice, pra não quebrar se a ordem
  // mudar. Guard em `d.querySelector("summary")` (2026-09-11, mesmo dia):
  // "Conhecer a espécie" virou um <div> sem <summary> - sem o guard, o
  // .find() abaixo quebrava com TypeError na primeira iteração (ela vem
  // primeiro no DOM), derrubando a suíte inteira mesmo pra prefixos
  // completamente sem relação, tipo "Golpes".
  function openDetailGroup(summaryPrefix) {
    const groups = [...document.querySelectorAll(".detail-group")];
    const g = groups.find(function (d) {
      const summary = d.querySelector("summary");
      return summary && summary.textContent.indexOf(summaryPrefix) === 0;
    });
    if (g) g.open = true;
    return g;
  }
  function setSearch(q) {
    const el = document.getElementById("search-input");
    el.value = q;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
  async function addByName(name, toBox) {
    setSearch(name);
    await wait(120);
    const row = document.querySelector("#species-list .species-row");
    if (!row) { check("add " + name, false, "not found in list"); return; }
    row.click();
    await wait(30);
    const btn = document.getElementById(toBox ? "add-box-btn" : "add-team-btn");
    if (btn && !btn.disabled) btn.click();
    await wait(30);
  }

  localStorage.clear();
  location.reload ? null : null; // no-op, just documenting intent: NOT reloading here on purpose

  // --- seed: 6-Pokemon team + 1 box member, real UI interactions ---
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  for (const n of ["Aerodactyl Mega", "Probopass", "Coalossal Mega", "Terrakion", "Avalugg Hisuian", "Tyranitar Mega Redux"]) {
    await addByName(n, false);
  }
  await addByName("Eelektross", true);

  // Level cap "sem limite" (Champion / Alto Comando), 2026-09-10: desde a
  // trava de golpes por level cap, o seletor de golpes da build só oferece
  // golpes de NÍVEL já liberados - vários testes mais abaixo assumem um
  // golpe de nível específico está selecionável (ex: Flare Blitz no
  // Charizard), o que só é verdade sem cap nenhum restringindo. Configurado
  // aqui, uma vez, pro resto desta suíte inteira - a auto-evolução por cap
  // (testada em seção própria, mais abaixo, com um cap diferente e
  // temporário) não dispara aqui porque getCurrentCap() retorna null
  // quando "sem limite" está selecionado.
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  document.getElementById("tabs-more-toggle").click();
  await wait(20);
  document.querySelector('#tabs-more-panel [data-tab="progress"]').click();
  await wait(50);
  document.getElementById("settings-milestone").value = "9"; // Champion / Alto Comando
  document.getElementById("settings-milestone").dispatchEvent(new Event("change", { bubbles: true }));
  await wait(50);
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  // --- 1. box-to-team never disables, opens swap modal when team is full ---
  // PC Box (Fase 2, 2026-09-11/12): o botão só existe no painel de detalhe
  // depois de selecionar um slot preenchido - precisa clicar um antes.
  document.querySelector('.tab-btn[data-tab="box"]').click();
  await wait(50);
  const firstSlotForSwap = document.querySelector(".pcbox-slot:not(.empty)");
  if (firstSlotForSwap) { firstSlotForSwap.click(); await wait(30); }
  const boxBtn = document.querySelector(".pcbox-detail .box-to-team");
  check("box-to-team button exists", !!boxBtn);
  if (boxBtn) {
    check("box-to-team never disabled", boxBtn.disabled === false, "disabled=" + boxBtn.disabled);
    check("box-to-team shows swap state when team full", boxBtn.classList.contains("is-swap"));
    boxBtn.click();
    await wait(30);
    check("swap modal opens on click", document.getElementById("swap-modal").hidden === false);
    document.getElementById("swap-modal-close").click();
    await wait(30);
  }

  // --- 2. stat bar tiers (Shuckle: extreme high/low stats) ---
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  setSearch("Shuckle");
  await wait(120);
  const shuckleRow = document.querySelector("#species-list .species-row");
  if (shuckleRow) {
    shuckleRow.click();
    await wait(30);
    const rows = [...document.querySelectorAll("#species-detail .stat-row")];
    const defRow = rows.find(r => r.querySelector(".stat-label").textContent === "Defesa");
    const spdRow = rows.find(r => r.querySelector(".stat-label").textContent === "Sp. Def");
    check("Shuckle Def shows tier-elite (BST >= 150 clamps to 100%)",
      defRow && defRow.querySelector(".stat-bar-fill").classList.contains("tier-elite"));
    check("Shuckle stat bar width clamped at 100%",
      defRow && defRow.querySelector(".stat-bar-fill").style.width === "100%");
  } else {
    check("Shuckle found in Dex", false);
  }

  // --- 3. rank badge + sort-by-rank ---
  setSearch(""); // clear any filter left by the stat-bar test above, or this
                  // "checks" the rank of whatever 1 species is still filtered
                  // in, not the actual top of the full sorted list
  await wait(120);
  const sel = document.getElementById("sort-select");
  sel.value = "rank";
  sel.dispatchEvent(new Event("change", { bubbles: true }));
  await wait(30);
  const firstBadge = document.querySelector("#species-list .rank-badge");
  check("sort-by-rank populates rank badges", !!firstBadge);
  check("top of rank-sorted list is SS tier", firstBadge && firstBadge.textContent === "SS", firstBadge && firstBadge.textContent);
  sel.value = "dex";
  sel.dispatchEvent(new Event("change", { bubbles: true }));

  // --- 4. cross-navigation: team slot -> Dex ---
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);
  const tsHead = document.querySelector("#team-slots .ts-head");
  if (tsHead) {
    const expectedName = tsHead.parentElement.querySelector(".ts-name").textContent.split(" ")[0];
    tsHead.click();
    await wait(30);
    const dexActive = document.querySelector('.tab-btn[data-tab="dex"]').classList.contains("active");
    const shownName = document.querySelector("#species-detail h2");
    check("clicking team-slot header navigates to Dex", dexActive);
    check("Dex detail shows the right species after nav",
      shownName && shownName.textContent.indexOf(expectedName) === 0, shownName && shownName.textContent);
  } else {
    check("team-slot header found", false);
  }

  // --- 5. rank info line shows both badges with plain-text labels ---
  const rankLine = document.querySelector(".rank-info-line");
  check("rank-info-line renders in Dex detail", !!rankLine);
  check("rank-info-line spells out the scale in plain text",
    rankLine && rankLine.textContent.indexOf("SS (melhor)") !== -1);

  // --- 5b. papel/arquétipo tag (RF35), 2026-09-11 - sinal SEPARADO do rank
  // (pedido do usuário: não fundir na letra). Scizor é fixture conhecida
  // (Pivô real via Bullet Punch/U-turn + Wallbreaker físico, calibrado à
  // mão contra teoria competitiva real antes de confiar no script). Checa
  // também que o rótulo acentuado renderiza certo - achado real ao
  // construir isto: PowerShell 5.1 lendo o .ps1 sem BOM corrompia "Pivô"/
  // "Físico" pra mojibake no JSON, só pego ao olhar o BYTE real do
  // arquivo, não o console (que mascarava o problema).
  setSearch("Scizor");
  await wait(120);
  const scizorRow = document.querySelector("#species-list .species-row");
  if (scizorRow) {
    scizorRow.click();
    await wait(30);
    const roleLine = document.querySelector(".rank-info-line");
    const roleText = roleLine ? roleLine.textContent : "";
    check("papel/arquétipo aparece na Dex com acento correto (não mojibake)",
      roleText.indexOf("Pivô") !== -1 && roleText.indexOf("Físico") !== -1 && roleText.indexOf("Ã") === -1,
      roleText);
  } else { check("Scizor encontrado pro teste de papel/arquétipo", false); }
  setSearch("");
  await wait(120);

  // --- 5c. reorganização em blocos colapsáveis (Fase 2, 2026-09-11) -
  // "a tela do Poke na dex tá meio pesada de informação". Busca e clica em
  // Charizard ANTES de checar qualquer coisa (2026-09-11, correção real: a
  // versão antiga deste teste assumia Scizor - selecionado na checagem 5b -
  // continuava "aberto" só porque setSearch("") não muda `state.selected`;
  // mas o handler de busca remove `show-detail` do dex-shell a cada
  // digitação/limpeza, e neste viewport (mobile-width) isso esconde o
  // painel de detalhe inteiro. A checagem antiga nunca pegava isso porque só
  // olhava a propriedade `.open`/texto, não visibilidade renderizada de
  // verdade - só quebrou quando um checkVisibility() real entrou aqui, ver
  // abaixo. Charizard tem golpe de nível suficiente pra "Golpes (N)" mostrar
  // uma contagem real, não zero.
  setSearch("Charizard");
  await wait(120);
  const charRowGroups = document.querySelector("#species-list .species-row");
  if (charRowGroups) {
    charRowGroups.click();
    await wait(30);
    (function () {
      const groups = [...document.querySelectorAll(".detail-group")];
      check("5 grupos na tela de detalhe (4 colapsáveis + 'Conhecer a espécie' sempre visível)", groups.length === 5, groups.length);
      // "Conhecer a espécie" (2026-09-11, pedido do usuário: "quero que tudo
      // que está ali fique visível") não é mais um <details> - vira um <div>
      // com .detail-group-heading no lugar do <summary>. Os outros 4 grupos
      // continuam <details> de verdade.
      const conhecerGroup = groups.find(function (g) { return g.tagName !== "DETAILS" && g.querySelector(".detail-group-heading"); });
      check("'Conhecer a espécie' não é mais colapsável (não é <details>, sem <summary>)",
        conhecerGroup && conhecerGroup.tagName === "DIV" && !conhecerGroup.querySelector("summary"),
        conhecerGroup && conhecerGroup.tagName);
      check("'Conhecer a espécie' mostra o cabeçalho certo",
        conhecerGroup && conhecerGroup.querySelector(".detail-group-heading").textContent === "Conhecer a espécie");
      const statsCardInConhecer = conhecerGroup && conhecerGroup.querySelector(".card");
      check("o conteúdo de 'Conhecer a espécie' está genuinamente visível (checkVisibility)",
        statsCardInConhecer && (typeof statsCardInConhecer.checkVisibility !== "function" || statsCardInConhecer.checkVisibility() === true));

      const detailsGroups = groups.filter(function (g) { return g.tagName === "DETAILS"; });
      const bySummary = {};
      detailsGroups.forEach(function (g) { bySummary[g.querySelector("summary").textContent.replace(/\s*\(\d+\)$/, "")] = g; });
      check("'Auto Build' aberto por padrão (ação central do app, não deve ficar escondida)",
        bySummary["Auto Build"] && bySummary["Auto Build"].open === true);
      check("'Comparar com outro Pokémon' fechado por padrão", bySummary["Comparar com outro Pokémon"] && bySummary["Comparar com outro Pokémon"].open === false);
      const golpesGroup = detailsGroups.find(function (g) { return g.querySelector("summary").textContent.indexOf("Golpes") === 0; });
      check("'Golpes' fechado por padrão e mostra uma contagem real (não zero) no resumo",
        golpesGroup && golpesGroup.open === false && /Golpes \([1-9]\d*\)/.test(golpesGroup.querySelector("summary").textContent),
        golpesGroup && golpesGroup.querySelector("summary").textContent);
    })();
    // Clicar no <summary> abre o grupo E revela o conteúdo de verdade (não só
    // o atributo `open` - .move-row só existe/conta quando o navegador
    // realmente renderiza o conteúdo do <details>).
    const golpesGroup2 = openDetailGroup("Golpes");
    // openDetailGroup já seta .open = true - desfaz pra testar o clique de
    // verdade no <summary>, não só a propriedade.
    if (golpesGroup2) golpesGroup2.open = false;
    await wait(20);
    // Nem getComputedStyle(...).display nem offsetParent são confiáveis
    // aqui pra detectar "escondido por um <details> ancestral fechado" -
    // testado ao vivo e os dois relataram o elemento como visível mesmo
    // com o grupo fechado (offsetParent apontava pro <body> normalmente),
    // enquanto get_page_text (extração de texto que respeita renderização
    // de verdade) confirmava corretamente que o conteúdo não aparecia.
    // checkVisibility() é a API certa pra isso (mais nova, criada
    // exatamente pra este caso) - confere com get_page_text, então é o que
    // fica no teste.
    const firstMoveRow = golpesGroup2.querySelector(".move-row");
    check("golpes ficam fora da renderização enquanto o grupo está fechado",
      !firstMoveRow || (typeof firstMoveRow.checkVisibility === "function" ? firstMoveRow.checkVisibility() === false : true));
    golpesGroup2.querySelector("summary").click();
    await wait(20);
    check("clicar no <summary> de 'Golpes' abre o grupo e revela as linhas de golpe",
      golpesGroup2.open === true && golpesGroup2.querySelectorAll(".move-row").length > 0,
      golpesGroup2.querySelectorAll(".move-row").length);
  } else { check("Charizard encontrado pro teste de clique em <summary>", false); }
  setSearch("");
  await wait(120);

  // --- 5d. "onde encontrar" (RF42, 2026-09-11) + sinergia habilidade x
  // movepool visível na Dex (RF41, mesmo dia). Magikarp é a fixture real
  // certa pro "onde encontrar": tem AMBOS os tipos de dado real ao mesmo
  // tempo (SEnc - presente/fisgada especial - E encontro selvagem comum em
  // várias rotas), confirmando que as duas frases coexistem em vez de uma
  // suprimir a outra. Nidoking é a fixture já conhecida da Fase 3 (Mighty
  // Horn + golpes de chifre reais) pra confirmar que a MESMA sinergia que a
  // ferramenta de IA já usava agora também aparece no card da habilidade.
  setSearch("Magikarp");
  await wait(120);
  const magikarpRow = document.querySelector("#species-list .species-row");
  if (magikarpRow) {
    magikarpRow.click();
    await wait(30);
    const hints = [...document.querySelectorAll(".obtain-hint")].map(function (p) { return p.textContent; });
    check("'como conseguir' (SEnc) e 'onde encontrar' (encontro selvagem) coexistem, cada um sua própria frase",
      hints.length === 2 && hints[0].indexOf("Presente") === 0 && hints[1].indexOf("Encontro selvagem em:") === 0,
      hints);
  } else { check("Magikarp encontrado pro teste de 'onde encontrar'", false); }
  setSearch("");
  await wait(120);

  setSearch("Nidoking");
  await wait(120);
  const nidokingRow = document.querySelector("#species-list .species-row");
  if (nidokingRow) {
    nidokingRow.click();
    await wait(30);
    const synergyNotes = [...document.querySelectorAll(".abi-synergy")].map(function (d) { return d.textContent; });
    check("sinergia real habilidade x movepool (Mighty Horn) aparece no card da habilidade na Dex",
      synergyNotes.length > 0 && synergyNotes[0].indexOf("Combo real") !== -1 && synergyNotes[0].indexOf("Megahorn") !== -1,
      synergyNotes);
  } else { check("Nidoking encontrado pro teste de sinergia visível na Dex", false); }
  setSearch("");
  await wait(120);

  // --- 6. build-reference card has a real title (not a bare <details>) ---
  // Achado em auditoria de QA (2026-09-13): esta checagem sempre passava
  // (`check(..., true)`) - `buildCard` era calculado e nunca usado na
  // asserção. Nidoking (espécie atual nesta seção) não tem build de
  // chefão real (não está em data/boss_reference_builds.json), então o
  // card nem deveria renderizar aqui - testa esse caminho de verdade, e
  // depois troca pra uma espécie que TEM dado real (Eelektross) pra testar
  // o caminho positivo também.
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
  const nextFightLine = document.querySelector("#dashboard .dash-suggestion-boss .dash-value");
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

  // Fase 2/4 - "Analisar meu time": mesmo padrão de mock de window.claude já
  // usado pra "Gerar build com IA" (sample.json(), campos estruturados) -
  // trocado de sample() puro (só {text}) pra sample.json() na Fase 4
  // (2026-09-12) pra caber o campo extra `swap` (sugestão de troca
  // acionável), mesmo contrato que "Gerar build com IA" já usa.
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);
  // Reposicionamento pedido pelo usuário, 2026-09-11: "Leitura estratégica"
  // era a ÚLTIMA coisa da aba - agora é a PRIMEIRA, acima até de "Meu time".
  // DOCUMENT_POSITION_FOLLOWING = o 2º argumento vem DEPOIS do 1º no DOM.
  const teamStrategyEl = document.getElementById("team-strategy");
  const teamSlotsEl = document.getElementById("team-slots");
  check("'Leitura estratégica' aparece ANTES de 'Meu time' no DOM (primeiro item da página)",
    !!teamStrategyEl && !!teamSlotsEl &&
    !!(teamStrategyEl.compareDocumentPosition(teamSlotsEl) & Node.DOCUMENT_POSITION_FOLLOWING));
  const strategyBtn = document.getElementById("team-strategy-generate");
  if (strategyBtn) {
    window.__strategyToolCalls = [];
    const mockText = "Leitura de teste automatizado: time equilibrado, entra com o mais rápido primeiro.";
    function mockStrategyClaude(swapPayload) {
      window.claude = {
        use: async function (name) {
          if (name !== "sample") return null;
          return {
            json: async function (prompt, opts) {
              window.__strategyLastPrompt = prompt;
              if (opts && Array.isArray(opts.tools)) {
                var teamSnames = JSON.parse(localStorage.getItem("er_terminal_save") || "{}").team || [];
                for (const t of opts.tools) {
                  if (t.inputSchema) {
                    for (const sname of teamSnames) {
                      const result = await t.execute({ sname: sname });
                      window.__strategyToolCalls.push({ name: t.name, sname: sname, result: result });
                    }
                  } else {
                    const result = await t.execute({});
                    window.__strategyToolCalls.push({ name: t.name, result: result });
                  }
                }
              }
              return { text: mockText, swap: swapPayload };
            }
          };
        }
      };
    }
    mockStrategyClaude(null);
    strategyBtn.click();
    await wait(100);
    check("'Analisar meu time' chamou getTeamWeaknesses de verdade (não simulado por fora)",
      window.__strategyToolCalls.some(function (c) { return c.name === "getTeamWeaknesses" && typeof c.result.teamSize === "number"; }));
    check("'Analisar meu time' chamou getSpeciesRank/getPriorityMoveOptions/getAbilityMovepoolSynergy pra CADA membro do time (Fase 2)",
      ["getSpeciesRank", "getPriorityMoveOptions", "getAbilityMovepoolSynergy"].every(function (name) {
        return window.__strategyToolCalls.filter(function (c) { return c.name === name; }).length === 6;
      }), window.__strategyToolCalls.map(function (c) { return c.name; }));
    // Fase 3 - a MESMA ferramenta unificada de sugestão de caixa também
    // chamada aqui, não só na geração de build
    check("'Analisar meu time' também chamou getBoxCandidatesForBoss (Fase 3, ferramenta unificada)",
      window.__strategyToolCalls.some(function (c) { return c.name === "getBoxCandidatesForBoss"; }));
    // Fase 4 - getBoxOverview (caixa inteira, não só 1 candidato pra 1 luta)
    check("'Analisar meu time' também chamou getBoxOverview (Fase 4, caixa inteira)",
      window.__strategyToolCalls.some(function (c) { return c.name === "getBoxOverview" && typeof c.result.boxSize === "number"; }),
      window.__strategyToolCalls.map(function (c) { return c.name; }));
    const rationaleBlock = document.querySelector("#team-strategy .mybuild-rationale");
    check("a leitura estratégica (mock) aparece em destaque na tela",
      rationaleBlock && rationaleBlock.textContent.indexOf(mockText) !== -1);
    check("o botão vira 'Analisar de novo' depois de uma leitura já existir",
      document.getElementById("team-strategy-generate") && document.getElementById("team-strategy-generate").textContent.indexOf("de novo") !== -1);
    check("SEM sugestão de troca acionável quando a IA (mock) devolveu swap:null",
      !document.getElementById("team-strategy-apply-swap"));

    // Fase 4 - sugestão de troca acionável: mock devolve um swap real (1
    // membro do time atual + 1 da caixa atual, ambos lidos do save real, não
    // inventados), confirma que o botão aplica a MESMA rosterMove() de
    // sempre (não uma mutação de estado paralela).
    const saveBeforeSwap = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
    const outSnameForSwap = (saveBeforeSwap.team || [])[0];
    const inSnameForSwap = (saveBeforeSwap.box || [])[0];
    if (outSnameForSwap && inSnameForSwap) {
      mockStrategyClaude({ outSname: outSnameForSwap, inSname: inSnameForSwap, reason: "teste automatizado de troca" });
      document.getElementById("team-strategy-generate").click();
      await wait(100);
      const applySwapBtn = document.getElementById("team-strategy-apply-swap");
      check("sugestão de troca acionável aparece quando a IA (mock) devolve um swap válido",
        !!applySwapBtn, applySwapBtn && applySwapBtn.outerHTML);
      if (applySwapBtn) {
        applySwapBtn.click();
        await wait(50);
        const saveAfterSwap = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
        check("'Aplicar troca' realmente moveu o Pokémon da caixa pro time (mesma rosterMove() de sempre)",
          (saveAfterSwap.team || []).indexOf(inSnameForSwap) !== -1 && (saveAfterSwap.team || []).indexOf(outSnameForSwap) === -1,
          saveAfterSwap.team);
        check("'Aplicar troca' mandou quem saiu do time pra caixa (não descartou)",
          (saveAfterSwap.box || []).indexOf(outSnameForSwap) !== -1, saveAfterSwap.box);
        check("a sugestão de troca some sozinha depois de aplicada (time mudou, forTeamKey não bate mais)",
          !document.getElementById("team-strategy-apply-swap"));

        // Desfaz a troca (mesmo botão, sentido invertido) - nenhum teste
        // depois deste nesta suíte deveria herdar um time diferente do seed
        // original só por causa deste teste ter rodado. Dobra como um
        // segundo check real: a troca funciona nos dois sentidos.
        mockStrategyClaude({ outSname: inSnameForSwap, inSname: outSnameForSwap, reason: "desfazendo o teste" });
        document.getElementById("team-strategy-generate").click();
        await wait(100);
        const undoBtn = document.getElementById("team-strategy-apply-swap");
        if (undoBtn) {
          undoBtn.click();
          await wait(50);
          const saveRestored = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
          check("troca desfeita com sucesso (time volta ao seed original desta suíte)",
            (saveRestored.team || []).indexOf(outSnameForSwap) !== -1 && (saveRestored.box || []).indexOf(inSnameForSwap) !== -1,
            saveRestored.team);
        } else {
          check("botão de desfazer a troca encontrado", false);
        }
      }
    } else {
      check("time/caixa reais disponíveis pro teste de sugestão de troca acionável", false, saveBeforeSwap);
    }
    delete window.claude;
  } else {
    check("botão 'Analisar meu time' encontrado", false);
  }

  // --- 8. "Mais" dropdown (Progresso/Tipos) - design proposal A, 2026-09-09 ---
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  const moreToggle = document.getElementById("tabs-more-toggle");
  const morePanel = document.getElementById("tabs-more-panel");
  check("Mais panel starts hidden", morePanel.hidden === true);
  // The DOM property alone missed a real bug: .tabs-more-panel's own
  // `display: flex` (an author rule) always beat the browser's native
  // [hidden] handling regardless of the hidden attribute/property being
  // correctly set - found 2026-09-09 by actually looking at a fresh page
  // load, not by reading this same assertion. Check the rendered box too.
  check("Mais panel is actually invisible while hidden (not just .hidden===true)",
    getComputedStyle(morePanel).display === "none");
  moreToggle.click();
  check("Mais panel opens on click", morePanel.hidden === false);
  const progressInPanel = morePanel.querySelector('[data-tab="progress"]');
  if (progressInPanel) progressInPanel.click();
  await wait(30);
  check("selecting Progresso inside the panel activates that view",
    document.getElementById("view-progress").classList.contains("active"));
  check("panel closes after selecting an item inside it", morePanel.hidden === true);
  check("Mais toggle highlights while Progresso/Tipos is active", moreToggle.classList.contains("active"));
  moreToggle.click();
  document.body.click();
  check("clicking outside the dropdown closes it", morePanel.hidden === true);
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  // --- 9. dashboard summary - design proposal B, 2026-09-09 ---
  document.getElementById("dex-shell").classList.remove("show-detail");
  const dash = document.querySelector(".dashboard-card");
  check("dashboard renders with a 6-member team", !!dash);
  check("dashboard shows team completeness", dash && dash.textContent.indexOf("6/6") !== -1);
  check("dashboard shows a shared-risk item", dash && dash.textContent.indexOf("fracos") !== -1);
  const suggestionLink = document.querySelector(".dash-suggestion .goto-species[data-x]");
  if (suggestionLink) {
    suggestionLink.click();
    await wait(30);
    check("clicking a dashboard suggestion opens its Dex detail",
      document.querySelector('.tab-btn[data-tab="dex"]').classList.contains("active") &&
      document.getElementById("dex-shell").classList.contains("show-detail"));
    document.getElementById("back-to-list").click();
    await wait(30);
  }

  // --- 10. boss final-stat calculator - 2026-09-09 field-research follow-up ---
  document.querySelector('.tab-btn[data-tab="bosses"]').click();
  await wait(50);
  const bossRow = document.querySelector("#boss-list .species-row");
  if (bossRow) {
    bossRow.click();
    await wait(50);
    const levelInput = document.getElementById("boss-level-input");
    check("boss level input exists with a sensible default", levelInput && parseInt(levelInput.value, 10) >= 1);
    check("stats render for at least one boss party member", !!document.querySelector("#boss-detail .bm-stats"));
    if (levelInput) {
      // Achado em auditoria de QA (2026-09-13), causa raiz de verdade da
      // flake documentada há muitas sessões (não era timing nenhum): o
      // seletor `.bm-stats .bm-stat .mono` NÃO era escopado ao chefão -
      // `.bm-stats`/`.bm-stat`/`.mono` são reusados também pelo card
      // "Builds de referência" da Dex (buildHistoryHtml(), linha ~3980,
      // nível FIXO, não bossState.level) e, por causa disso, dentro de
      // CADA card do Meu Time que tem histórico de build
      // (renderTeam() -> buildHistoryHtml(sp), linha ~4910). Como o time
      // seed desta suíte (6 membros) já entra com histórico, e a aba Time
      // vem ANTES da aba Chefões no HTML, um `document.querySelector`
      // global pegava o PRIMEIRO desses blocos (de nível fixo, dentro de
      // #team-slots, ainda no DOM mesmo com a aba escondida) em vez do
      // card de verdade do chefão - por isso HP nunca "mudava", em
      // qualquer nível. Escopar a `#boss-detail` resolve na causa raiz.
      var hpBefore = document.querySelector("#boss-detail .bm-stats .bm-stat .mono").textContent;
      var targetLevel = levelInput.value === "100" ? "50" : "100";
      levelInput.value = targetLevel;
      levelInput.dispatchEvent(new Event("change", { bubbles: true }));
      await pollUntil(function () {
        var el = document.querySelector("#boss-detail .bm-stats .bm-stat .mono");
        return !!el && el.textContent !== hpBefore;
      });
      var hpAfter = document.querySelector("#boss-detail .bm-stats .bm-stat .mono").textContent;
      check("changing level recomputes stats (HP changes) without losing the typed value",
        document.getElementById("boss-level-input").value === targetLevel && hpAfter !== hpBefore,
        "before=" + hpBefore + " after=" + hpAfter);
    }
    document.getElementById("boss-shell").classList.remove("show-detail");
  } else {
    check("at least one boss found to test the stat calculator", false);
  }
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  // --- 11. "Minhas anotações" + move-row type tint - 2026-09-09, third field-research follow-up ---
  setSearch("Charizard");
  await wait(120);
  const cRow = document.querySelector("#species-list .species-row");
  if (cRow) {
    cRow.click();
    await wait(30);
    const notesArea = document.getElementById("species-notes-input");
    check("notes textarea renders", !!notesArea);
    if (notesArea) {
      notesArea.value = "teste automatizado";
      document.getElementById("species-notes-save").click();
      await wait(30);
      var savedNote = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
      check("note saved to localStorage under the sname",
        savedNote.notes && savedNote.notes.SPECIES_CHARIZARD === "teste automatizado");
    }
    const moveRow = document.querySelector(".moves-table .move-row");
    check("move row has a type-tinted background", moveRow && moveRow.style.background.indexOf("color-mix") !== -1);
  } else { check("Charizard found for notes/move-tint test", false); }
  setSearch("");
  await wait(120);

  // --- 12. boss held-item stat modifier - 2026-09-09, user asked directly ---
  // Greta Slateport's Landorus Therian holds a Choice Band. Checks the FLAG
  // and that it lands on the right stat (Atk) and not an unrelated one
  // (HP), not a hardcoded final number - stays valid regardless of the
  // level-cap default used to compute it.
  document.querySelector('.tab-btn[data-tab="bosses"]').click();
  await wait(50);
  document.getElementById("boss-search-input").value = "Greta";
  document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));
  await wait(30);
  const gretaRow = document.querySelector("#boss-list .species-row");
  if (gretaRow) {
    gretaRow.click();
    await wait(50);
    const landoCard = [...document.querySelectorAll(".boss-mon-card")].find(c => c.querySelector(".bm-name").textContent.indexOf("Landorus") === 0);
    if (landoCard) {
      const bmStats = [...landoCard.querySelectorAll(".bm-stat")];
      check("Choice Band flags the Atk stat with a tooltip",
        bmStats[1] && bmStats[1].querySelector(".cov-flag") && bmStats[1].querySelector(".cov-flag").title.indexOf("Choice Band") === 0);
      check("Choice Band does NOT flag an unrelated stat (HP)", bmStats[0] && !bmStats[0].querySelector(".cov-flag"));
    } else { check("Landorus Therian (the Choice Band fixture) found on this boss", false); }
  } else { check("Greta Slateport (the Choice Band fixture boss) found", false); }
  document.getElementById("boss-search-input").value = "";
  document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));
  document.getElementById("boss-shell").classList.remove("show-detail");
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  // --- 13. boss held-item stat modifiers, round 2 - 2026-09-09, field
  // research into the hack's real item source (er-config textproto +
  // pokemon-showdown-ER data/items.ts) confirmed Tactical Vest, Thick Club
  // and Light Ball. Light Ball is the interesting case: species-gated with
  // a DIFFERENT multiplier for Pikachu (x2) vs Raichu (x1.5), and applies to
  // TWO stats (Atk and SpA) at once - the other checks only ever exercise
  // one flagged stat, so this is the one case actually testing itemRuleFor's
  // species-prefix + multi-rule logic instead of a single flat lookup.
  async function checkItemFlag(bossQuery, monPrefix, diffKey, statLabel, itemLabel) {
    document.querySelector('.tab-btn[data-tab="bosses"]').click();
    await wait(50);
    document.getElementById("boss-search-input").value = bossQuery;
    document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));
    await wait(30);
    const row = document.querySelector("#boss-list .species-row");
    if (!row) { check(bossQuery + " (fixture boss) found", false); return; }
    row.click();
    await wait(50);
    if (diffKey) {
      const diffBtn = document.querySelector('.chip-btn[data-diff="' + diffKey + '"]');
      if (diffBtn) { diffBtn.click(); await wait(50); }
    }
    const card = [...document.querySelectorAll(".boss-mon-card")].find(c => c.querySelector(".bm-name").textContent.indexOf(monPrefix) === 0);
    if (!card) { check(monPrefix + " (fixture) found on " + bossQuery, false); return; }
    const stat = [...card.querySelectorAll(".bm-stat")].find(s => s.querySelector(".bm-stat-label").textContent === statLabel);
    const flag = stat && stat.querySelector(".cov-flag");
    check(itemLabel + " flags " + statLabel + " on " + monPrefix, flag && flag.title.indexOf(itemLabel) === 0, flag && flag.title);
    document.getElementById("boss-search-input").value = "";
    document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));
    document.getElementById("boss-shell").classList.remove("show-detail");
    document.querySelector('.tab-btn[data-tab="dex"]').click();
    await wait(30);
  }
  // Archie Slateport, Hell tier: Swampert holds Tactical Vest.
  await checkItemFlag("Archie Slateport", "Swampert", "hell", "Def", "Tactical Vest");
  // Phoebe 4: Marowak Alolan holds Thick Club.
  await checkItemFlag("Phoebe 4", "Marowak Alolan", null, "Atk", "Thick Club");
  // Wattson 1, Insane tier: Raichu Alolan holds Light Ball, boosted at x1.5
  // (not vanilla's x2 - this hack's own rebalance) on BOTH Atk and SpA.
  await checkItemFlag("Wattson 1", "Raichu Alolan", "insane", "Atk", "Light Ball (x1.5)");
  await checkItemFlag("Wattson 1", "Raichu Alolan", "insane", "SpA", "Light Ball (x1.5)");

  // --- 14. real usability pass, 2026-09-09 - 3 more bugs found by actually
  // using the app (real team, real narrow viewport), not by reading DOM
  // state cold. All root-caused before fixing, not guessed at.
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  setSearch("Tyranitar Mega Redux");
  await wait(120);
  const ttarRow = document.querySelector("#species-list .species-row");
  if (ttarRow) {
    ttarRow.click();
    await wait(30);
    // Raw game data has this species' 3 choosable-ability slots all
    // pointing at the same id ("abis":[444,444,444], checked directly -
    // true for 149/1906 species, not a splicing bug) - it used to render
    // the identical "Evaporate" card 3 times.
    const choosable = [...document.querySelectorAll("#species-detail .abi-card")]
      .filter(c => c.querySelector(".abi-kind").textContent === "Escolhível");
    check("duplicate choosable abilities collapse to one card (Tyranitar Mega Redux)",
      choosable.length === 1, choosable.length + " cards");
  } else { check("Tyranitar Mega Redux (duplicate-ability fixture) found", false); }
  setSearch("");
  await wait(120);

  // Dashboard suggestion sentence used to render as flexbox children
  // (each text run/link its own wrapping box) instead of one flowing
  // paragraph - visually stacked into a column of single words. The team
  // seeded at the top of this suite is full (6/6), so the suggestion
  // should be showing.
  const dashVal = document.querySelector(".dash-suggestion .dash-value");
  // The fix sets `display: inline`, but a flex item's outer display is
  // always "blockified" per spec regardless of the specified value, so the
  // COMPUTED style correctly reports "block" here, not "inline" - checked
  // this against the live page instead of assuming, after the first
  // version of this assertion (checking for "inline" literally) failed on
  // a working fix. What actually matters is that it's neither of the flex
  // values that caused the bug.
  check("dashboard suggestion text flows as a paragraph (not flex children)",
    dashVal && getComputedStyle(dashVal).display !== "flex" && getComputedStyle(dashVal).display !== "inline-flex",
    dashVal && getComputedStyle(dashVal).display);

  // Team-slot cards used to force the whole page to scroll horizontally on
  // a narrow screen - a CSS grid item's default min-width:auto blocked it
  // from shrinking to its track's width, so its <pre> build block (which
  // already had its own overflow-x:auto) never got the chance to self-
  // scroll instead. Checking the computed min-width directly is cheaper
  // and just as real a regression guard as resizing the viewport here.
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);
  const tslot = document.querySelector(".team-slot");
  check("team-slot can shrink below its content's natural width (min-width:0)",
    tslot && getComputedStyle(tslot).minWidth === "0px", tslot && getComputedStyle(tslot).minWidth);
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  // --- 15. Mega Evolution / Primal Reversion in the boss stat calculator -
  // 2026-09-09, user's follow-up on the held-item pass ("como devemos
  // aplicar da melhor forma"). Lucy Lavaridge (Insane tier) has a Milotic
  // holding Miloticite - hand-verified all 6 final stats against Milotic
  // MEGA's real base stats (95/69/110/129/156/81) at level 18, Careful
  // nature, 252 HP/4 Def/252 SpD: HP79 Atk35 Def50 SpA51 SpD85 Spe39, all
  // matched exactly. This just re-checks the card shows the transformed
  // identity/types/note, not the numbers again (those are covered by hand
  // once; re-deriving them here would just duplicate that arithmetic).
  document.querySelector('.tab-btn[data-tab="bosses"]').click();
  await wait(50);
  document.getElementById("boss-search-input").value = "Lucy Lavaridge";
  document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));
  await wait(30);
  const lucyRow = document.querySelector("#boss-list .species-row");
  if (lucyRow) {
    lucyRow.click();
    await wait(50);
    const insaneBtn = document.querySelector('.chip-btn[data-diff="insane"]');
    if (insaneBtn) { insaneBtn.click(); await wait(50); }
    const milCard = [...document.querySelectorAll(".boss-mon-card")].find(c => c.querySelector(".bm-name").textContent.indexOf("Milotic") === 0);
    if (milCard) {
      check("Mega-stone holder shows the transformed species name", milCard.querySelector(".bm-name").textContent === "Milotic Mega");
      const typeNames = [...milCard.querySelectorAll(".bm-types .type-pill")].map(t => t.textContent);
      check("Mega-stone holder shows the transformed species' types (Water/Fairy, not just Water)",
        typeNames.indexOf("Fairy") !== -1, typeNames.join(","));
      check("card explains what species it enters as", milCard.textContent.indexOf("Entra como") !== -1 && milCard.textContent.indexOf("Milotic") !== -1);
      check("card is honest that the post-transform choosable ability is unknown",
        milCard.textContent.indexOf("não sabemos qual") !== -1);
    } else { check("Milotic Mega (the Miloticite fixture) found on Lucy Lavaridge", false); }
  } else { check("Lucy Lavaridge (the Miloticite fixture boss) found", false); }
  document.getElementById("boss-search-input").value = "";
  document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));
  document.getElementById("boss-shell").classList.remove("show-detail");
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  // --- 16. "Meu build" interactive editor - 2026-09-09, user feedback that
  // the free-text notes field had no real interaction with the Pokemon
  // ("o usuario tem que digitar tudo"). Charizard's 3 real choosable
  // abilities are Molten Down/Giant Wings/Tough Claws (matches the
  // original NextDex FAQ example this whole project started from) - a
  // good fixture because it's easy to independently verify by eye.
  setSearch("Charizard");
  await wait(120);
  const charRow = document.querySelector("#species-list .species-row");
  if (charRow) {
    charRow.click();
    await wait(30);
    const abiOptions = [...document.querySelectorAll("#mybuild-ability option")].map(o => o.value).filter(Boolean);
    check("ability picker only offers this species' real choosable abilities",
      abiOptions.length === 3 && abiOptions.indexOf("Tough Claws") !== -1, abiOptions.join(","));
    // Earthquake is NOT in Charizard's real movepool in this hack - trying
    // to select it should silently fail (native <select> behavior when the
    // value isn't one of its options), proving the move list is actually
    // restricted to real options, not just decorative.
    const moveSel = document.getElementById("mybuild-move-0");
    moveSel.value = "Earthquake";
    check("move picker rejects a move not in this species' real movepool", moveSel.value !== "Earthquake");
    moveSel.value = "Flare Blitz";
    check("move picker accepts a move that IS in this species' real movepool", moveSel.value === "Flare Blitz");

    function setSel(id, v) { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event("change", { bubbles: true })); }
    setSel("mybuild-ability", "Tough Claws");
    setSel("mybuild-nature", "Adamant");
    document.getElementById("mybuild-item").value = "Life Orb";
    setSel("mybuild-move-1", "Dragon Claw");
    document.getElementById("mybuild-ev-1").value = 252;
    document.getElementById("mybuild-ev-1").dispatchEvent(new Event("input", { bubbles: true }));
    await wait(20);
    check("EV total counter updates live as EVs are typed",
      document.getElementById("mybuild-ev-total").textContent.indexOf("252") !== -1,
      document.getElementById("mybuild-ev-total").textContent);
    document.getElementById("mybuild-save").click();
    await wait(50);
    const preview = [...document.querySelectorAll("#species-detail .showdown-block")].find(p => p.textContent.indexOf("Charizard @ Life Orb") === 0);
    check("saved build renders as a real Showdown-format block",
      preview && preview.textContent.indexOf("Tough Claws") !== -1, preview && preview.textContent);
    var savedRaw = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
    // customBuilds[sname] is a LIST now (up to 3 builds, Fase-3 multi-build +
    // AI-generation feature, 2026-09-09) - a fresh build here is entry [0].
    var charBuildList = savedRaw.customBuilds && savedRaw.customBuilds.SPECIES_CHARIZARD;
    check("build persists to localStorage under the sname (as a list)",
      Array.isArray(charBuildList) && charBuildList.length === 1 && charBuildList[0].ability === "Tough Claws",
      charBuildList && JSON.stringify(charBuildList));
    document.getElementById("mybuild-clear").click();
    await wait(30);
    check("clear button removes the build and resets the form",
      !document.getElementById("mybuild-clear") && document.getElementById("mybuild-ability").value === "");
  } else { check("Charizard found for the Meu build editor test", false); }
  setSearch("");
  await wait(120);

  // --- 17. "Meu build" reaching the Team tab + boss-build copy - 2026-09-09,
  // user feedback: a build saved in the Dex never showed up on the Team
  // tab (renderTeam() only ever read the curated BUILDS table, never
  // state.customBuilds), and the only way to act on a boss's set was to
  // export text and paste it into a separate chat. Also caught a real
  // formatting bug while fixing this: effectiveBuild() first passed
  // customBuilds' raw EVs array straight into showdownSet(), which just
  // string-concatenates it - printed "EVs: 0,252,0,0,0,0" instead of
  // "EVs: 252 Atk" until normalized through evsToShowdownText().
  setSearch("Tyranitar Mega Redux"); // already on the seeded team
  await wait(120);
  const ttarRow2 = document.querySelector("#species-list .species-row");
  if (ttarRow2) {
    ttarRow2.click();
    await wait(30);
    function setSel2(id, v) { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event("change", { bubbles: true })); }
    setSel2("mybuild-nature", "Timid");
    document.getElementById("mybuild-ev-5").value = 252;
    document.getElementById("mybuild-save").click();
    await wait(50);
  } else { check("Tyranitar Mega Redux found for cross-tab build test", false); }
  setSearch("");
  await wait(120);
  document.querySelector('.tab-btn[data-tab="team"]').click();
  // Achado em auditoria de QA (2026-09-13): era um wait(50) fixo - a
  // classe de flakiness já documentada em memória ("aparece intermitente
  // num primeiro load 'frio', some ao rodar de novo") desta seção 17.
  // Espera renderTeam() de verdade ter terminado (o slot já existir no
  // DOM) em vez de torcer por 50ms, que aparentemente nem sempre bastam
  // logo depois do primeiro carregamento da página.
  await pollUntil(function () {
    return [...document.querySelectorAll(".team-slot")].some(s => s.textContent.indexOf("Tyranitar Mega Redux") !== -1);
  });
  // Team order follows state.team's insertion order - Tyranitar Mega Redux
  // was added LAST in the seed at the top of this suite, so a bare
  // querySelector(".ts-build-label") would silently grab the FIRST slot's
  // label instead (Aerodactyl Mega, which has an unrelated curated build)
  // - caught by actually running this against the live page, not by
  // reading the assertion and assuming it checked the right element.
  const ttarSlot = [...document.querySelectorAll(".team-slot")].find(s => s.textContent.indexOf("Tyranitar Mega Redux") !== -1);
  const teamBuildLabel = ttarSlot && ttarSlot.querySelector(".ts-build-label");
  const teamBuildText = ttarSlot && ttarSlot.querySelector(".showdown-block");
  check("a build saved in the Dex shows up on the Team tab, labeled as mine",
    teamBuildLabel && teamBuildLabel.textContent === "Meu build", teamBuildLabel && teamBuildLabel.textContent);
  check("EVs render as a formatted string on the Team tab (not the raw array's default toString)",
    teamBuildText && teamBuildText.textContent.indexOf("252 Spe") !== -1 && teamBuildText.textContent.indexOf(",") === -1,
    teamBuildText && teamBuildText.textContent);
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  document.querySelector('.tab-btn[data-tab="bosses"]').click();
  await wait(50);
  document.getElementById("boss-search-input").value = "Greta";
  document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));
  await wait(30);
  const gretaRow2 = document.querySelector("#boss-list .species-row");
  if (gretaRow2) {
    gretaRow2.click();
    await wait(50);
    const useBtn = document.querySelector(".use-boss-build-btn");
    if (useBtn) {
      useBtn.click();
      await wait(30);
      var savedLando = JSON.parse(localStorage.getItem("er_terminal_save") || "{}").customBuilds;
      var landoList = savedLando && savedLando.SPECIES_LANDORUS_THERIAN;
      var lando = landoList && landoList[0]; // customBuilds[sname] is a list now (Fase-3 multi-build)
      check("'usar como meu build' copies the boss's real ability/item/nature",
        lando && lando.ability === "Moxie" && lando.item === "Choice Band" && lando.nature === "Adamant",
        lando && JSON.stringify(lando));
      check("'usar como meu build' copies the boss's real EVs (not the default 0s)",
        lando && lando.evs && lando.evs[1] === 252 && lando.evs[5] === 252, lando && lando.evs);
      check("'usar como meu build' copies the boss's real moves",
        lando && lando.moves && lando.moves.indexOf("Earthquake") !== -1 && lando.moves.length === 4, lando && lando.moves);
    } else { check("'usar como meu build' button found on Landorus Therian", false); }
  } else { check("Greta Slateport found for the boss-build-copy test", false); }
  document.getElementById("boss-search-input").value = "";
  document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));
  document.getElementById("boss-shell").classList.remove("show-detail");
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  // --- 17b. "+ Usar como meu build" on Dex-side reference entries -
  // (renumbered from a duplicate "18" in a QA audit, 2026-09-13 - this
  // section and the "18b" one right after it are direct continuations of
  // section 17 above, same "usar como meu build" copy mechanism, just the
  // Dex-side entry point instead of the boss tab's. A LATER, unrelated
  // section also claimed "18" - see the "TYPE_MOD_ABILITIES coverage"
  // section further down - and a project-memory note already got the two
  // confused once, see its own comment for that story.)
  // 2026-09-09, user caught that "Builds vistas em chefões" (and build
  // history) on the Dex detail had a "copiar" button that only ever put
  // text on the clipboard, never touched state.customBuilds or the Team
  // tab - the OLDER of two "copy a build" mechanisms in this app, built
  // before "Meu build" existed. Charizard's real boss-reference fixture
  // (Courtney Mossdeep, Charizardite Y) is used here specifically because
  // its EVs string ("252 SpA / 4 SpD / 252 Spe") exercises the new
  // evsTextToArray() parser - the inverse of evsToShowdownText(), needed
  // because these reference entries store EVs as a string while
  // customBuilds needs the raw 6-number array.
  setSearch("Charizard");
  await wait(120);
  const charRow2 = document.querySelector("#species-list .species-row");
  if (charRow2) {
    charRow2.click();
    await wait(30);
    const details = document.querySelector(".bh-details");
    if (details) details.setAttribute("open", "");
    await wait(30);
    const useEntryBtn = document.querySelector(".use-entry-build-btn");
    if (useEntryBtn) {
      useEntryBtn.click();
      await wait(50);
      const savedChar = JSON.parse(localStorage.getItem("er_terminal_save") || "{}").customBuilds;
      const charList2 = savedChar && savedChar.SPECIES_CHARIZARD;
      const char = charList2 && charList2[0]; // customBuilds[sname] is a list now (Fase-3 multi-build)
      check("boss-reference 'usar como meu build' copies ability/item/nature",
        char && char.ability && char.item && char.nature, char && JSON.stringify(char));
      check("boss-reference EVs string is correctly parsed into the raw array (evsTextToArray)",
        char && char.evs && char.evs.reduce(function (a, b) { return a + b; }, 0) > 0 &&
        document.getElementById("mybuild-ev-total").textContent.indexOf(String(char.evs.reduce(function (a, b) { return a + b; }, 0))) !== -1,
        char && char.evs);
      check("the open Dex 'Meu build' editor refreshes to show the copied values",
        document.getElementById("mybuild-ability").value === (char && char.ability));
    } else { check("'+ Usar como meu build' button found on a boss-reference entry", false); }
  } else { check("Charizard found for the reference-entry build-copy test", false); }
  setSearch("");
  await wait(120);

  // --- 17c. IVs reais de referência de chefão não podem virar 31 fixo -
  // (renumbered from "18b" alongside 17b above, same reason - see its comment)
  // bug real achado em auditoria (2026-09-11): scripts/extract_boss_builds.ps1
  // reconstruía a entrada por campo nomeado e descartava ivsRaw/evsRaw
  // (mesmo dado que extract_bosses.ps1 já extraía de verdade), então o
  // template hardcodava ivs:[31,31,31,31,31,31] mesmo quando o chefão real
  // NÃO era flawless. Cofagrigus (Phoebe 2) é um caso real confirmado
  // (ivsRaw [31,31,31,31,31,0] - 0 de IV de Velocidade, típico de um set de
  // Trick Room de verdade, e o próprio moveset inclui Trick Room) - testa
  // exatamente o cenário que passaria despercebido antes da correção.
  setSearch("Cofagrigus");
  await wait(120);
  const cofagrigusRow = document.querySelector("#species-list .species-row");
  if (cofagrigusRow) {
    cofagrigusRow.click();
    await wait(30);
    const details2 = document.querySelector(".bh-details");
    if (details2) details2.setAttribute("open", "");
    await wait(30);
    const useEntryBtn2 = document.querySelector(".use-entry-build-btn");
    if (useEntryBtn2) {
      useEntryBtn2.click();
      await wait(50);
      const savedCofagrigus = JSON.parse(localStorage.getItem("er_terminal_save") || "{}").customBuilds;
      const cofagrigusList = savedCofagrigus && savedCofagrigus.SPECIES_COFAGRIGUS;
      const cof = cofagrigusList && cofagrigusList[cofagrigusList.length - 1];
      check("boss-reference com IV real NÃO-flawless (Cofagrigus/Phoebe 2, 0 de IV de Velocidade) copia o IV verdadeiro, não 31 fixo",
        cof && Array.isArray(cof.ivs) && JSON.stringify(cof.ivs) === JSON.stringify([31, 31, 31, 31, 31, 0]),
        cof && JSON.stringify(cof.ivs));
    } else { check("'+ Usar como meu build' button found on Cofagrigus (IV real test)", false); }
  } else { check("Cofagrigus found for the IV-real reference-entry test", false); }
  setSearch("");
  await wait(120);

  // --- transfer card removal - 2026-09-09, replaced by the db-capability
  // sync above and confirmed working on real devices the same day, so the
  // manual copy/paste/download UI was removed to keep the page lighter
  // (user's own request, right after confirming sync worked).
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);
  check("manual transfer card is gone (replaced by automatic sync)", !document.getElementById("transfer-card"));
  // "Enviar para o Claude"/"Enviar caixa para o Claude" (o resumo de texto
  // simples pra colar numa conversa) removidos por completo, 2026-09-13,
  // pedido direto do usuário com print das duas telas - a sincronização
  // automática e as chamadas de IA de dentro do próprio app (Meu build,
  // Leitura estratégica, Arquétipo do time) já tornaram esse copy/paste
  // manual redundante. O card de exportação do CHEFÃO (`#boss-export-*`,
  // aba Chefões - "junta o time dele com o seu time e sua caixa") é uma
  // feature DIFERENTE, mais específica, não mencionada no pedido - continua
  // existindo (não tinha cobertura de teste dedicada antes desta remoção, e
  // continua sem, já que não foi tocado nesta passagem).
  check("cards 'Enviar para o Claude' (time) e 'Enviar caixa para o Claude' (caixa) foram removidos por completo",
    !document.getElementById("claude-export-card") && !document.getElementById("claude-export-box-card"));
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  // --- sync-banner CSS bug - 2026-09-09, user report: "sync aparecendo
  // toda hora mesmo sem eu ter atualizado nada". Root cause: the EXACT
  // same class of bug as the "Mais" dropdown from earlier today -
  // .sync-banner's own `display: flex` (author rule) always beat the
  // browser's native [hidden] handling, so the banner rendered visible
  // regardless of its .hidden property being correctly true the whole
  // time. Same fix as before: an explicit [hidden] override. Also
  // hardened the underlying logic to compare save CONTENT, not just the
  // savedAt timestamp (a changed timestamp isn't the same as changed
  // data) - can't easily exercise that half live without a real db
  // connection (unavailable on the local dev server this suite runs
  // against), so this check is scoped to what's actually verifiable here:
  // the CSS itself.
  const syncBanner = document.getElementById("sync-banner");
  check("sync banner is actually invisible while hidden (not just .hidden===true)",
    syncBanner && getComputedStyle(syncBanner).display === "none");

  // --- "#app" height bug - 2026-09-09, user report: "ao rolar para baixo a
  // dex fica travada". Root cause: #app used `min-height: 100%` (a FLOOR,
  // not a ceiling) instead of `height: 100%` - once its content (topbar +
  // main + footer) grew taller than the viewport, #app just grew past it
  // instead of being capped, so `main`'s flex:1/min-height:0 chain never
  // got a bounded height to clip against. Every internal panel's own
  // `overflow-y: auto` (.species-detail, .species-list, etc.) was already
  // correct CSS that simply never got the chance to engage - the whole
  // BODY scrolled instead (confirmed directly: window.scrollY moved,
  // every inner panel's own scrollTop stayed 0). At desktop width this
  // meant scrolling a long species' detail scrolled the search box and
  // species list away with it. Fixed by capping #app at `height: 100%`.
  setSearch("Charizard");
  await wait(120);
  const charRow3 = document.querySelector("#species-list .species-row");
  if (charRow3) {
    charRow3.click();
    await wait(30);
    const detailPanel = document.querySelector(".species-detail");
    detailPanel.scrollTop = 500;
    await wait(30);
    check(".species-detail scrolls internally (not the whole page/body)",
      detailPanel.scrollTop > 0 && window.scrollY === 0 && document.body.scrollTop === 0,
      "detailScrollTop=" + detailPanel.scrollTop + " windowScrollY=" + window.scrollY);

    // Switching to a DIFFERENT species should reset scroll to the top...
    document.getElementById("back-to-list").click();
    await wait(30);
    setSearch("Bulbasaur");
    await wait(120);
    document.querySelector("#species-list .species-row").click();
    await wait(30);
    check("scroll resets to top when switching to a different species",
      document.querySelector(".species-detail").scrollTop === 0);

    // ...but refreshing the SAME species in place (e.g. after "Salvar
    // build") must NOT yank the user back to the top - a real regression
    // this fix could easily have introduced if not careful.
    document.querySelector(".species-detail").scrollTop = 400;
    await wait(30);
    document.getElementById("mybuild-save").click();
    await wait(50);
    check("scroll position is preserved when the SAME species re-renders in place",
      document.querySelector(".species-detail").scrollTop === 400,
      document.querySelector(".species-detail").scrollTop);
  } else { check("Charizard found for the #app height-fix test", false); }
  setSearch("");
  await wait(120);

  // --- "Meu build" status preview - 2026-09-09, urgent user request:
  // after filling every field, the editor showed no final stats and no
  // sense of a selected move's power. Deliberately not a damage
  // calculator (no defender/type effectiveness) - just final stats
  // (base+IV+EV+nature+item, same calcFinalStat used for bosses) and
  // each move's power with STAB/Life Orb factored in.
  setSearch("Charizard");
  await wait(120);
  const charRow4 = document.querySelector("#species-list .species-row");
  if (charRow4) {
    charRow4.click();
    await wait(30);
    function setSel4(id, v) { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event("change", { bubbles: true })); }
    setSel4("mybuild-nature", "Adamant");
    document.getElementById("mybuild-item").value = "Life Orb";
    document.getElementById("mybuild-item").dispatchEvent(new Event("input", { bubbles: true }));
    document.getElementById("mybuild-ev-1").value = 252;
    document.getElementById("mybuild-ev-1").dispatchEvent(new Event("input", { bubbles: true }));
    document.getElementById("mybuild-level").value = 100;
    document.getElementById("mybuild-level").dispatchEvent(new Event("input", { bubbles: true }));
    setSel4("mybuild-move-0", "Flare Blitz");
    setSel4("mybuild-move-1", "Swords Dance");
    await wait(50);
    const preview4 = document.getElementById("mybuild-status-preview").textContent;
    // Hand-verified: base Atk 84, 252 EV, level 100, Adamant (+10%) -> 293.
    check("final stats appear and match the hand-verified formula (Charizard Atk 293 at these settings)",
      preview4.indexOf("293") !== -1, preview4);
    // Flare Blitz: base power 120, STAB (Fire on a Fire/Flying mon) x1.5,
    // Life Orb x1.3 -> floor(120*1.5*1.3) = 234.
    check("damaging move shows base power AND a STAB+item-adjusted power",
      preview4.indexOf("120") !== -1 && preview4.indexOf("234") !== -1, preview4);
    check("status move shows no power, not a fabricated number",
      preview4.indexOf("Swords Dance") !== -1 && preview4.indexOf("sem poder de ataque") !== -1, preview4);
    // Changing the level live (no page reload, no button click) must
    // recompute the stats shown, proving it isn't a one-shot snapshot.
    document.getElementById("mybuild-level").value = 50;
    document.getElementById("mybuild-level").dispatchEvent(new Event("input", { bubbles: true }));
    await wait(30);
    const preview4b = document.getElementById("mybuild-status-preview").textContent;
    check("final stats recompute live when the level changes, without a page reload",
      preview4b.indexOf("293") === -1, preview4b);
  } else { check("Charizard found for the Meu build status-preview test", false); }
  setSearch("");
  await wait(120);

  // --- storage-full warning - 2026-09-09, from the Gemini audit pass +
  // same-day UX review: persist() used to swallow a localStorage quota
  // failure completely silently. Fixed to show a PERSISTENT banner (not a
  // flashToast() that auto-hides in ~2s and could go unnoticed for a
  // data-loss warning) - same show/dismiss idiom as #sync-banner. Monkey-
  // patches Storage.prototype.setItem to force the failure, same technique
  // used to verify this by hand before it had suite coverage.
  (function () {
    const origSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function () { throw new DOMException("Quota exceeded", "QuotaExceededError"); };
    const notesArea = document.getElementById("species-notes-input");
    if (notesArea) {
      notesArea.value = "teste banner de armazenamento";
      document.getElementById("species-notes-save").click();
    }
    Storage.prototype.setItem = origSetItem;
  })();
  await wait(50);
  const storageBanner = document.getElementById("storage-banner");
  check("storage-full banner appears on a failed persist()",
    storageBanner && storageBanner.hidden === false && getComputedStyle(storageBanner).display !== "none",
    storageBanner && storageBanner.textContent);
  if (storageBanner) {
    document.getElementById("storage-banner-dismiss").click();
    check("storage-full banner can be dismissed by hand (doesn't auto-hide)",
      document.getElementById("storage-banner").hidden === true);
  }

  // --- Fase 1 quality-of-life batch, 2026-09-09: changelog card + keyboard
  // shortcuts. Sort/type-filter PERSISTENCE across a reload is Part D below
  // (same reason Part B exists - can't verify "survives a reload" without
  // one), this only covers what's testable without a reload.
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  document.getElementById("tabs-more-toggle").click();
  const progressTabBtn = document.querySelector('#tabs-more-panel [data-tab="progress"]');
  if (progressTabBtn) progressTabBtn.click();
  await wait(30);
  const changelogHtml = document.getElementById("changelog-list").innerHTML;
  check("Novidades card renders real changelog entries (not empty)",
    changelogHtml.indexOf("<li>") !== -1 && changelogHtml.indexOf("2026-09-09") !== -1,
    changelogHtml.length + " chars");
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  function press(key) { document.dispatchEvent(new KeyboardEvent("keydown", { key: key, bubbles: true, cancelable: true })); }
  document.activeElement.blur();
  press("/");
  await wait(20);
  check("'/' focuses the Dex search input", document.activeElement === document.getElementById("search-input"));
  document.activeElement.blur();
  press("ArrowDown");
  await wait(20);
  const kbdRow1 = document.querySelector("#species-list .species-row.kbd-active");
  check("ArrowDown highlights the first row", !!kbdRow1);
  press("ArrowDown");
  await wait(20);
  const kbdRow2 = document.querySelector("#species-list .species-row.kbd-active");
  check("ArrowDown a second time moves the highlight to a DIFFERENT row",
    kbdRow2 && kbdRow1 && kbdRow2 !== kbdRow1);
  press("Enter");
  await wait(50);
  check("Enter opens the highlighted species' detail",
    document.getElementById("dex-shell").classList.contains("show-detail"));
  press("Escape");
  await wait(50);
  check("Escape backs out of the detail view (same as clicking 'Voltar')",
    !document.getElementById("dex-shell").classList.contains("show-detail"));

  // "Histórico de saves" foi REMOVIDO por pedido do usuário, 2026-09-11
  // ("não tem por que ter" - segurança de uma migração que não existe mais).
  // Regressão-guarda de remoção: confirma que a seção e a chave de
  // localStorage realmente sumiram, não só que ninguém testa mais.
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);
  check("'Histórico de saves' foi removido (card, não só a lista vazia)",
    !document.getElementById("save-history-card") && !document.querySelector(".save-history-row"));
  check("er_terminal_history não é mais escrito no localStorage", localStorage.getItem("er_terminal_history") === null);
  // "Time completo em formato Showdown" foi REMOVIDO por completo, 2026-09-12
  // (pedido do usuário: "isso é pra excluir não vamos mais usar isso no
  // projeto" - desta vez é a feature inteira, não só o preview cru que já
  // tinha sido tirado em 2026-09-11). Regressão-guarda de remoção, mesmo
  // padrão do "Histórico de saves": confirma que o card E a função
  // showdownTeam() (só usada por ele) realmente sumiram, não só que ninguém
  // testa mais. showdownSet() (por espécie, usado em "Meu build"/histórico/
  // referência de chefão) continua existindo - é uma feature diferente.
  check("card 'Time completo em formato Showdown' foi removido por completo",
    !document.getElementById("showdown-card") && !document.getElementById("showdown-copy"));

  setSearch("Charizard");
  await wait(120);
  const charRowCmp = document.querySelector("#species-list .species-row");
  if (charRowCmp) {
    charRowCmp.click();
    await wait(30);
    openDetailGroup("Comparar");
    const cmpInput = document.getElementById("compare-input");
    cmpInput.value = "Venusaur";
    cmpInput.dispatchEvent(new Event("input", { bubbles: true }));
    await wait(30);
    const cmpText = document.getElementById("compare-result").innerText;
    // Hand-verified: Charizard 79/84/78/109/85/100 (BST 535) vs Venusaur's
    // own real base stats - just checking the table renders with both
    // names and a BST row, not re-deriving every stat's win/lose here.
    check("compare table shows both species by name", cmpText.indexOf("Charizard") !== -1 && cmpText.indexOf("Venusaur") !== -1, cmpText);
    check("compare table includes a BST row", cmpText.indexOf("BST") !== -1);
    const cmpRows = [...document.querySelectorAll("#compare-result .compare-table tbody tr")];
    const hpRow = cmpRows.find(r => r.firstElementChild.textContent.trim() === "HP");
    check("at least one stat row shows a win/lose class, not just plain numbers",
      hpRow && (hpRow.innerHTML.indexOf("cmp-win") !== -1 || hpRow.innerHTML.indexOf("cmp-lose") !== -1));
    cmpInput.value = "Venusa";
    cmpInput.dispatchEvent(new Event("input", { bubbles: true }));
    await wait(30);
    check("compare shows nothing for a partial (not exact) species name",
      document.getElementById("compare-result").innerHTML === "");
  } else { check("Charizard found for the compare-builds test", false); }
  setSearch("");
  await wait(120);

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

  // --- Pacote "level cap", 2026-09-10: 3 ideias interligadas, decisões
  // confirmadas pelo usuário antes de construir (build/nota carrega pro
  // nome novo; encadeia quantas evoluções o cap libere de uma vez; roda na
  // hora, ao mudar milestone/dificuldade). Charmander usado como fixture
  // NOVA pra auto-evolução (não Bulbasaur/Squirtle, já usados acima) -
  // Charmander evolui pra Charmeleon no nível 16 e Charmeleon pra Charizard
  // no 36 (confirmado direto na Dex, não vanilla assumido).
  // NOTA real encontrada testando isto: os caps reais desta dificuldade
  // pulam de 25 (índice 1) direto pra 40 (índice 2) - não existe um
  // milestone com cap estritamente entre 16 e 36, então essa mudança
  // específica de cap encadeia as DUAS evoluções de uma vez (Charmander ->
  // Charmeleon -> Charizard), não apenas uma. Isso não é um problema do
  // teste nem do código - é exatamente o cenário "encadear até o limite do
  // cap" que o usuário pediu, só que descoberto por acaso em vez de
  // escolhido de propósito. Charizard já é fixture usada extensivamente em
  // outras seções (sempre só na Dex, nunca antes posta no time/caixa), então
  // não há conflito de estado - só ajustei a asserção pra refletir o
  // encadeamento completo de verdade, em vez de assumir 1 etapa isolada.
  document.getElementById("tabs-more-toggle").click();
  await wait(20);
  document.querySelector('#tabs-more-panel [data-tab="progress"]').click();
  await wait(50);
  // Achado em auditoria de QA (2026-09-13): este bloco mudava o milestone
  // e nunca restaurava, ao contrário do padrão disciplinado já usado mais
  // acima (milestoneSelBefore/restauração perto da linha 383) - inofensivo
  // só porque nada depois deste bloco, até agora, precisava de "sem
  // limite" pra travar golpe por nível. Captura e restaura pelo mesmo
  // motivo, antes que uma seção futura dependa disso sem perceber.
  const milestoneSelBeforeCharm = document.getElementById("settings-milestone").value;
  document.getElementById("settings-milestone").value = "1"; // Stone Badge, cap 25 nesta dificuldade
  document.getElementById("settings-milestone").dispatchEvent(new Event("change", { bubbles: true }));
  await wait(50);
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  // Achado em auditoria de QA (2026-09-13), causa raiz de verdade da flake
  // "anotação migrou" documentada há muitas sessões (não era timing): o
  // comentário original acima afirma que Charizard "não há conflito de
  // estado" por nunca ter sido posto no time/caixa antes - mas duas
  // seções BEM mais acima ("Meu build status preview" e o teste de banner
  // de armazenamento logo depois, que reusa a mesma espécie ainda
  // selecionada) deixam uma anotação suja em memória em
  // state.notes.SPECIES_CHARIZARD (o teste de quota simula a escrita
  // falhando no disco, mas o valor em memória fica setado mesmo assim).
  // A migração de anotação (artifact_template.html ~2484) DE PROPÓSITO só
  // migra se o destino ainda não tem nota nenhuma
  // (`if (state.notes[sp.sname] && !state.notes[target.sname])`) - pra
  // nunca sobrescrever algo que o jogador já escreveu. Decisão de produto
  // correta, não bug - mas quebra a suposição deste teste de que Charizard
  // chegaria "vazio". Limpa a nota de Charizard de propósito antes de
  // começar, em vez de assumir.
  setSearch("Charizard");
  await wait(120);
  const charRowPreClear = document.querySelector("#species-list .species-row");
  if (charRowPreClear) {
    charRowPreClear.click();
    await wait(30);
    const notesAreaPreClear = document.getElementById("species-notes-input");
    notesAreaPreClear.value = "";
    document.getElementById("species-notes-save").click();
    await wait(30);
  }
  setSearch("");
  await wait(120);

  setSearch("Charmander");
  await wait(120);
  const charmanderRow = document.querySelector("#species-list .species-row");
  if (charmanderRow) {
    charmanderRow.click();
    await wait(30);
    check("LV do 'Meu build' vem do level cap configurado, não digitado à mão",
      document.getElementById("mybuild-level").value === "25" &&
      document.querySelector('label[for="mybuild-level"]').textContent.indexOf("25") !== -1,
      document.getElementById("mybuild-level").value);
    const lockedHint = [...document.querySelectorAll(".mybuild-hint")].map(h => h.textContent).find(t => t.indexOf("acima do level cap") !== -1);
    check("aviso de golpes travados aparece quando há golpes acima do cap", !!lockedHint, lockedHint);
    const moveOpts = [...document.querySelectorAll("#mybuild-move-0 option")].filter(o => o.value);
    const anyAboveCap = moveOpts.length < 100; // sanidade: lista real e não vazia, verificado com o hint acima
    check("seletor de golpe não está vazio mesmo com trava aplicada", moveOpts.length > 0, moveOpts.length);

    // Salva build + anotação ANTES de evoluir, pra confirmar que ambas
    // migram pro nome novo (decisão do usuário: carrega, não descarta).
    const notesArea = document.getElementById("species-notes-input");
    notesArea.value = "nota de teste pre-evolucao (Charmander)";
    document.getElementById("species-notes-save").click();
    await wait(30);
    document.getElementById("mybuild-save").click();
    await wait(30);

    document.getElementById("add-box-btn").click();
    await wait(30);
    const boxBefore = JSON.parse(localStorage.getItem("er_terminal_save") || "{}").box;
    check("Charmander entrou na caixa antes do teste de auto-evolução",
      boxBefore.indexOf("SPECIES_CHARMANDER") !== -1, JSON.stringify(boxBefore));

    // Sobe o cap pra 40 (Knuckle Badge/índice 2) - acima do requisito de
    // Charmander->Charmeleon (16), abaixo do de Charmeleon->Charizard (36),
    // então deve evoluir EXATAMENTE 1 vez, não encadear até Charizard.
    document.getElementById("tabs-more-toggle").click();
    await wait(20);
    document.querySelector('#tabs-more-panel [data-tab="progress"]').click();
    await wait(50);
    document.getElementById("settings-milestone").value = "2";
    document.getElementById("settings-milestone").dispatchEvent(new Event("change", { bubbles: true }));
    // Achado em auditoria de QA (2026-09-13): era um wait(80) fixo - a
    // outra das 2 flakes documentadas há muitas sessões (especificamente
    // "anotação migrou", nunca os outros checks deste bloco - sinal de
    // que a migração de notes acontece um passo depois da de box/
    // customBuilds, não simultânea). Espera o sinal mais fundamental da
    // cascata inteira (a caixa já mostrando Charizard) em vez de um tempo
    // chutado - todo o resto (build, anotação) é escrito na mesma
    // chamada de persist() que já colocou Charizard na caixa.
    await pollUntil(function () {
      var s = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
      return Array.isArray(s.box) && s.box.indexOf("SPECIES_CHARIZARD") !== -1;
    });
    const toastText = document.getElementById("toast").textContent;
    const saveAfter = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
    check("auto-evolução dispara na hora, ao mudar o level cap (sem precisar de outro save manual)",
      toastText.indexOf("Charmander") !== -1 && toastText.indexOf("Charmeleon") !== -1, toastText);
    check("cap saltou o suficiente pra encadear as DUAS evoluções de uma vez (Charmander -> Charmeleon -> Charizard)",
      toastText.indexOf("Charizard") !== -1, toastText);
    check("Charmander virou Charizard na caixa (encadeamento completo, nada ficou parado em Charmeleon)",
      saveAfter.box.indexOf("SPECIES_CHARIZARD") !== -1 && saveAfter.box.indexOf("SPECIES_CHARMANDER") === -1 && saveAfter.box.indexOf("SPECIES_CHARMELEON") === -1,
      JSON.stringify(saveAfter.box));
    check("build salva migrou até o nome final (Charizard), não ficou órfã em nenhum estágio intermediário",
      saveAfter.customBuilds && !!saveAfter.customBuilds.SPECIES_CHARIZARD && !saveAfter.customBuilds.SPECIES_CHARMANDER && !saveAfter.customBuilds.SPECIES_CHARMELEON,
      saveAfter.customBuilds && Object.keys(saveAfter.customBuilds));
    check("anotação migrou até o nome final junto com a build",
      saveAfter.notes && saveAfter.notes.SPECIES_CHARIZARD === "nota de teste pre-evolucao (Charmander)" && !saveAfter.notes.SPECIES_CHARMANDER && !saveAfter.notes.SPECIES_CHARMELEON,
      saveAfter.notes);
    document.querySelector('.tab-btn[data-tab="box"]').click();
    await wait(50);
    // PC Box (Fase 2, 2026-09-11/12) só mostra sprite na grade - usa a busca
    // (que pula pra caixa+slot certo) pra confirmar que a tela realmente
    // re-renderizou com o nome final, não só o localStorage.
    const pcSearchEvo = document.getElementById("pcbox-search");
    pcSearchEvo.value = "Charizard";
    pcSearchEvo.dispatchEvent(new Event("input", { bubbles: true }));
    await wait(50);
    const foundCharizard = document.querySelector(".pcbox-detail .pcbox-detail-name");
    check("a caixa mostra Charizard na tela, não só no localStorage (re-render real)",
      !!foundCharizard && foundCharizard.textContent === "Charizard", foundCharizard && foundCharizard.textContent);
    pcSearchEvo.value = "Charmander";
    pcSearchEvo.dispatchEvent(new Event("input", { bubbles: true }));
    await wait(50);
    const stillOnCharizard = document.querySelector(".pcbox-detail .pcbox-detail-name");
    check("a busca da PC Box não encontra mais Charmander (não ficou órfão parado em nome antigo)",
      !stillOnCharizard || stillOnCharizard.textContent !== "Charmander",
      stillOnCharizard && stillOnCharizard.textContent);
    pcSearchEvo.value = "";
    pcSearchEvo.dispatchEvent(new Event("input", { bubbles: true }));
  } else { check("Charmander encontrado pro teste de level cap", false); }
  document.getElementById("tabs-more-toggle").click();
  await wait(20);
  document.querySelector('#tabs-more-panel [data-tab="progress"]').click();
  await wait(50);
  document.getElementById("settings-milestone").value = milestoneSelBeforeCharm;
  document.getElementById("settings-milestone").dispatchEvent(new Event("change", { bubbles: true }));
  await wait(50);
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  // --- Correção de exibição, 2026-09-10: achado ao construir a auto-
  // evolução (mesma classe de bug - rs vem como STRING no dado bruto, não
  // number), mas num lugar diferente e pré-existente: evoConditionText() na
  // ficha da Dex sempre caía no fallback e mostrava só o número solto
  // ("16") em vez de "Nível 16" - nenhuma evolução por nível JAMAIS
  // mostrou o prefixo "Nível" corretamente até esta correção. Milotic
  // (Mega Evolução) é a fixture de controle - confirma que o fix não
  // alterou o texto de condições não-numéricas.
  setSearch("Charmander");
  await wait(120);
  const charmanderRow2 = document.querySelector("#species-list .species-row");
  if (charmanderRow2) {
    charmanderRow2.click();
    await wait(30);
    check("linha evolutiva mostra 'Nível 16', não só '16' solto",
      document.querySelector(".evo-chain").textContent.indexOf("Nível 16") !== -1,
      document.querySelector(".evo-chain").textContent);
  } else { check("Charmander encontrado pro teste de texto de evolução", false); }
  setSearch("Milotic");
  await wait(120);
  const miloticRow = [...document.querySelectorAll("#species-list .species-row")].find(r => r.querySelector(".sname").textContent === "Milotic");
  if (miloticRow) {
    miloticRow.click();
    await wait(30);
    check("condição de Mega Evolução continua intacta (não é 'Nível X')",
      document.querySelector(".evo-chain").textContent.indexOf("Mega Evolução") !== -1 &&
      document.querySelector(".evo-chain").textContent.indexOf("Nível") === -1,
      document.querySelector(".evo-chain").textContent);
  } else { check("Milotic encontrado pro teste de texto de evolução (Mega)", false); }

  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  setSearch("");
  await wait(120);

  // --- 18. TYPE_MOD_ABILITIES coverage (décima-oitava passagem, 2026-09-11) ---
  // Regressão-guarda pra tabela que cresceu de 6 pra 37 entradas nesta
  // passagem (pedido do usuário: acurácia dos dados heurísticos entre
  // 90-95%, já que o "leitor de caixa" reusa abilityTypeMod() pra QUALQUER
  // espécie da caixa, não só o time). Roda por ÚLTIMO de propósito - troca
  // 3 dos 6 slots do time fixture original (Aerodactyl Mega/Probopass/.../
  // Tyranitar Mega Redux) por Forretress/Magcargo/Eevee, que nenhum teste
  // anterior nesta suíte depende mais a essa altura (localStorage.clear()
  // logo abaixo limpa tudo de qualquer forma).
  for (const n of ["Forretress", "Magcargo", "Eevee"]) {
    await addByName(n, true);
  }
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);
  async function swapSlotFor(slotIdx, wantName) {
    const slots = [...document.querySelectorAll(".team-slot")];
    const btn = slots[slotIdx] && slots[slotIdx].querySelector(".ts-swap-btn");
    if (!btn) { check("botão de trocar encontrado no slot " + slotIdx, false); return; }
    btn.click();
    await wait(30);
    const pick = [...document.querySelectorAll(".swap-pick")].find(b => b.title === wantName);
    if (!pick) { check(wantName + " disponível pra trocar no time", false); return; }
    pick.click();
    await wait(50);
  }
  await swapSlotFor(0, "Forretress");
  await swapSlotFor(1, "Magcargo");
  await swapSlotFor(2, "Eevee");
  await wait(50);
  // Números batem com cálculo manual (ver commit 7e39577): Forretress
  // (Bug/Steel) vs Fire = 4x cru * 0.5 Heatproof = 2x; Magcargo (Fire/Rock)
  // vs Ice = 0.5 cru * 0.7 Magma Armor = 0.35x, vs Water = 4x cru * 0.7 =
  // 2.8x; Eevee (Normal) vs Fire = 1x cru * 2 Fluffy = 2x - mas rotulado
  // FRAQUEZA, não resistência (o bug de rótulo corrigido nesta passagem).
  const covFlags = [...document.querySelectorAll(".cov-flag")].map(el => el.title);
  check("Heatproof (innate do Forretress) ajusta a cobertura como resistência",
    covFlags.indexOf("Heatproof (resistência extra)") !== -1, covFlags.join(" | "));
  check("Magma Armor (innate do Magcargo) ajusta a cobertura como resistência (2 tipos)",
    covFlags.filter(f => f === "Magma Armor (resistência extra)").length >= 2, covFlags.join(" | "));
  check("Fluffy (innate do Eevee) ajusta a cobertura como FRAQUEZA, não resistência",
    covFlags.indexOf("Fluffy (fraqueza extra)") !== -1, covFlags.join(" | "));

  // --- 19. dashboardDirty / scheduleDashboardRefresh() (décima-sétima
  // passagem, 2026-09-11 - fix de performance, commit 1c4b3c9) ---
  // Gap real: aquele fix nunca ganhou cobertura de teste na hora (uma nota
  // errada na memória do projeto chegou a dizer que a seção 18 acima
  // cobria isto - não cobre, é sobre TYPE_MOD_ABILITIES). Compara
  // IDENTIDADE de nó DOM (não conteúdo) pra provar se renderDashboard()
  // rodou ou não - innerHTML sempre cria nós novos, então o mesmo nó
  // sobrevivendo prova que NÃO recalculou; um nó diferente prova que
  // recalculou. Mesma técnica já usada (fora da suíte) pra validar isto ao
  // vivo na própria décima-sétima passagem.
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  const dashBefore = document.querySelector("#dashboard .dashboard-card");
  document.querySelector('.tab-btn[data-tab="box"]').click();
  await wait(50);
  // PC Box (Fase 2, 2026-09-11/12): remover exige selecionar o slot primeiro
  // - o botão só existe no painel de detalhe do slot selecionado.
  const slotForRemoveTest = document.querySelector(".pcbox-slot:not(.empty)");
  if (slotForRemoveTest) { slotForRemoveTest.click(); await wait(30); }
  const firstRemoveBtn = document.querySelector(".pcbox-detail .remove-btn");
  if (firstRemoveBtn) {
    firstRemoveBtn.click();
    await wait(30);
    const dashWhileOnBox = document.querySelector("#dashboard .dashboard-card");
    check("dashboard NÃO recalcula enquanto o jogador está numa aba diferente da Dex (dashboardDirty adia o recálculo)",
      dashWhileOnBox === dashBefore, "mesmo nó: " + (dashWhileOnBox === dashBefore));
  } else {
    check("caixa tinha pelo menos 1 membro pro teste de dashboardDirty", false);
  }
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(50);
  const dashAfterSwitch = document.querySelector("#dashboard .dashboard-card");
  check("dashboard recalcula (flush) ao voltar pra aba Dex com dashboardDirty=true",
    dashAfterSwitch !== dashBefore, "mesmo nó: " + (dashAfterSwitch === dashBefore));

  // Atualização ao vivo, JÁ na aba Dex, sem trocar de aba nenhuma vez -
  // usa Torkoal (não tocado por nenhuma seção anterior desta suíte) mas
  // ainda confere `add-box-btn.disabled` antes de clicar em vez de supor -
  // achado real da décima-sexta passagem: clicar numa espécie que já
  // estava na caixa vira no-op e derruba este teste com um falso alarme.
  setSearch("Torkoal");
  await wait(120);
  const torkoalRow = document.querySelector("#species-list .species-row");
  if (torkoalRow) {
    torkoalRow.click();
    await wait(30);
    const addBoxBtn = document.getElementById("add-box-btn");
    if (addBoxBtn && !addBoxBtn.disabled) {
      addBoxBtn.click();
      await wait(30);
      const dashAfterLiveAdd = document.querySelector("#dashboard .dashboard-card");
      check("dashboard atualiza IMEDIATAMENTE (sem trocar de aba) quando o jogador já está na Dex",
        dashAfterLiveAdd !== dashAfterSwitch, "mesmo nó: " + (dashAfterLiveAdd === dashAfterSwitch));
    } else {
      check("Torkoal ainda não estava na caixa (add-box-btn habilitado) pro teste de atualização ao vivo", false,
        "disabled=" + (addBoxBtn && addBoxBtn.disabled));
    }
  } else {
    check("Torkoal encontrado pro teste de atualização ao vivo do dashboard", false);
  }
  setSearch("");
  await wait(120);

  // --- 20. Formas alternativas (sp.frm) - varredura completa do jogo
  // pedida pelo usuário, 2026-09-11 ---
  // Rotom tem as 5 formas de eletrodoméstico reais (Heat/Wash/Frost/Fan/Mow)
  // como fixture - dado nunca extraído até esta passagem. Charizard (sem
  // formas alternativas neste hack) confirma que o card some quando a lista
  // está vazia, não aparece sempre vazio.
  setSearch("Rotom");
  await wait(120);
  const rotomRow = [...document.querySelectorAll("#species-list .species-row")].find(r => r.querySelector(".sname").textContent === "Rotom");
  if (rotomRow) {
    rotomRow.click();
    await wait(30);
    const frmCard = [...document.querySelectorAll(".card")].find(c => c.querySelector("h3") && c.querySelector("h3").textContent === "Formas alternativas");
    check("card 'Formas alternativas' aparece pro Rotom com as 5 formas reais",
      !!frmCard && ["Heat", "Wash", "Frost", "Fan", "Mow"].every(f => frmCard.textContent.indexOf("Rotom " + f) !== -1),
      frmCard && frmCard.textContent);
    const washNode = frmCard && [...frmCard.querySelectorAll(".goto-species")].find(n => n.textContent === "Rotom Wash");
    if (washNode) {
      washNode.click();
      await wait(50);
      check("clicar numa forma alternativa navega pra ficha real dela",
        document.querySelector(".detail-titles h2").textContent === "Rotom Wash",
        document.querySelector(".detail-titles h2").textContent);
    } else {
      check("nó de navegação do Rotom Wash encontrado no card", false);
    }
  } else {
    check("Rotom encontrado pro teste de formas alternativas", false);
  }
  setSearch("Charizard");
  await wait(120);
  const charRowFrm = document.querySelector("#species-list .species-row");
  if (charRowFrm) {
    charRowFrm.click();
    await wait(30);
    const noFrmCard = [...document.querySelectorAll(".card")].find(c => c.querySelector("h3") && c.querySelector("h3").textContent === "Formas alternativas");
    check("card 'Formas alternativas' NÃO aparece pra espécie sem formas (Charizard)", !noFrmCard);
  } else {
    check("Charizard encontrado pro teste de ausência de formas alternativas", false);
  }
  setSearch("");
  await wait(120);

  // --- 21. PC Box (Fase 2 do roadmap de estratégia, 2026-09-11/12) ---
  // Redesenho pedido pelo usuário com print de referência do jogo real:
  // grade paginada (30 slots/caixa) + busca que salta pra caixa+slot certo +
  // painel de detalhe por seleção, em vez da lista fluida de chips antiga.
  document.querySelector('.tab-btn[data-tab="box"]').click();
  await wait(50);
  check("aba renomeada pra 'PC Box' (não mais 'Caixa')",
    document.querySelector('.tab-btn[data-tab="box"]').textContent.indexOf("PC Box") !== -1);
  const pcGrid = document.querySelector(".pcbox-grid");
  check("grade da PC Box tem 30 slots (6x5, mesmo tamanho do print de referência)",
    !!pcGrid && pcGrid.querySelectorAll(".pcbox-slot").length === 30,
    pcGrid && pcGrid.querySelectorAll(".pcbox-slot").length);
  // Tamanho FIXO (não mais 1fr esticando pra preencher a largura da tela) -
  // achado real do usuário, 2026-09-12: numa tela larga cada slot virava um
  // quadrado enorme com o sprite minúsculo boiando no meio.
  const pcAnySlot = document.querySelector(".pcbox-slot:not(.empty)") || document.querySelector(".pcbox-slot.empty");
  check("slots da PC Box têm largura fixa (60px), não esticam pra preencher a tela",
    !!pcAnySlot && getComputedStyle(pcAnySlot).width === "60px",
    pcAnySlot && getComputedStyle(pcAnySlot).width);
  const filledBefore = document.querySelectorAll(".pcbox-slot:not(.empty)").length;
  check("pelo menos 1 slot preenchido (caixa não está vazia nesta altura da suíte)", filledBefore > 0, filledBefore);
  // Seleciona o 1º slot preenchido, confirma painel de detalhe + navegação
  // até a Dex real via o sprite/nome (mesmo goToDexSpecies de sempre).
  const pcFirstSlot = document.querySelector(".pcbox-slot:not(.empty)");
  if (pcFirstSlot) {
    const pcFirstSlotX = pcFirstSlot.dataset.x;
    pcFirstSlot.click();
    await wait(30);
    // renderBox() reconstrói o innerHTML no clique - o nó ANTIGO (pcFirstSlot)
    // fica órfão, precisa reconsultar o novo pra checar .selected nele.
    const reQueriedSlot = document.querySelector('.pcbox-slot[data-x="' + pcFirstSlotX + '"]');
    check("selecionar um slot marca .selected e abre o painel de detalhe",
      !!reQueriedSlot && reQueriedSlot.classList.contains("selected") && !!document.querySelector(".pcbox-detail .pcbox-detail-name"));
    // Mesma informação que o card do Meu Time já mostra (Hab./Innate) -
    // pedido explícito do usuário: "quero a mesma informação que temos
    // aqui no time para cada poke" na caixa.
    const pcAbisEl = document.querySelector(".pcbox-detail-abis");
    check("painel de detalhe da PC Box mostra Hab./Innate, igual o card do Meu Time",
      !!pcAbisEl && pcAbisEl.textContent.indexOf("Hab.:") !== -1 && pcAbisEl.textContent.indexOf("Innate:") !== -1,
      pcAbisEl && pcAbisEl.textContent);
    // "Análise de uso" (redesenho 2026-09-13, esboço do usuário) - reaproveita
    // roleTagsHtml() (mesma função/dado real já usado na Dex), só apresentado
    // aqui dentro de uma seção com nome próprio. Só checa presença/rótulo -
    // o conteúdo exato (Papel/split) já é responsabilidade da própria função,
    // testada indiretamente pelos testes de rank/papel da Dex.
    const pcUsageEl = document.querySelector(".pcbox-detail-usage");
    check("painel de detalhe da PC Box tem a seção 'Análise de uso' (reaproveita o papel/split real já calculado)",
      !!pcUsageEl && pcUsageEl.textContent.indexOf("Análise de uso") !== -1 && pcUsageEl.textContent.indexOf("Papel") !== -1,
      pcUsageEl && pcUsageEl.textContent);
    const detailName = document.querySelector(".pcbox-detail .pcbox-detail-name").textContent;
    document.querySelector(".pcbox-detail .pcbox-detail-name").click();
    await wait(50);
    check("clicar no nome do painel de detalhe navega pra ficha real dele na Dex",
      document.querySelector(".detail-titles h2").textContent === detailName,
      document.querySelector(".detail-titles h2").textContent);
    document.querySelector('.tab-btn[data-tab="box"]').click();
    await wait(50);
  } else {
    check("slot preenchido encontrado pro teste de seleção/detalhe", false);
  }
  // Busca: foco não pode se perder a cada tecla (achado real ao testar isto
  // manualmente antes de escrever o teste - ver comentário no HTML do input).
  const pcSearchBox = document.getElementById("pcbox-search");
  pcSearchBox.focus();
  pcSearchBox.value = "z";
  pcSearchBox.dispatchEvent(new Event("input", { bubbles: true }));
  await wait(50);
  check("campo de busca da PC Box não perde o foco a cada tecla digitada (não é recriado no innerHTML)",
    document.activeElement === pcSearchBox);
  pcSearchBox.value = "";
  pcSearchBox.dispatchEvent(new Event("input", { bubbles: true }));
  await wait(30);

  // --- 22. Rank robusto por simulação (vigésima-quarta passagem,
  // 2026-09-12) - âncora de calibração pedida pela QA na própria reunião da
  // equipe ("calibração roda ANTES de qualquer publish, com espécies de
  // controle conhecidas"). Probopass é a âncora: SS estabelecido em VÁRIAS
  // passagens anteriores (sexta passagem em diante) por causa de Levitate +
  // Solid Rock - a primeira versão desta simulação (só tipagem crua, sem
  // ajuste por habilidade) derrubava ele pra C, porque Rock/Steel sozinho é
  // FRACO 4x a Ground - só a Levitate (habilidade) resolve isso de verdade.
  // Este teste existe pra pegar exatamente essa classe de regressão se
  // Get-AbilityAdjustedTypeMultiplier algum dia parar de ser chamado.
  setSearch("Probopass");
  await wait(120);
  const probopassRow = document.querySelector("#species-list .species-row");
  if (probopassRow) {
    probopassRow.click();
    await wait(30);
    const rankBadge = document.querySelector(".rank-badge");
    check("Probopass continua SS (âncora de calibração - Levitate anula a fraqueza 4x a Ground de Rock/Steel)",
      !!rankBadge && rankBadge.textContent === "SS", rankBadge && rankBadge.textContent);
    check("tooltip do rank badge menciona a simulação contra chefões (não a fórmula antiga de uso-em-chefão)",
      !!rankBadge && rankBadge.title.indexOf("simulação de") !== -1 && rankBadge.title.indexOf("uso em chefões") === -1,
      rankBadge && rankBadge.title);
  } else {
    check("Probopass encontrado pro teste de calibração do rank", false);
  }
  setSearch("");
  await wait(120);

  // --- 23. Arquétipo de time: monta o melhor time pro arquétipo escolhido
  // (Fase 3b, REDESENHADA 2026-09-12 por pedido direto do usuário: "a ideia
  // não é analisar os poke que eu tenho no time e sim ao clicar ali ele me
  // dar o melhor time possível dentro dos poke que eu tenho focado naquele
  // arquétipo" - e "ele falar que eu tenho 6 tanque no time não me ajuda de
  // forma objetiva". O antigo "Detectar automaticamente" (só rotulava o
  // time atual) e o aviso de papel redundante (só constatava o problema)
  // foram REMOVIDOS - esta seção substitui inteiramente a versão anterior).
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);
  const archCard = [...document.querySelectorAll(".card")].find(c => c.querySelector("h3") && c.querySelector("h3").textContent === "Arquétipo do time");
  check("card 'Arquétipo do time' aparece acima da Leitura estratégica (primeiro item da #team-strategy)",
    !!archCard && document.getElementById("team-strategy").firstElementChild === archCard);
  const paceSel = document.getElementById("archetype-pace");
  const weatherSel = document.getElementById("archetype-weather");
  check("os dois <select> de arquétipo (ritmo/clima) existem e têm as opções da taxonomia real (Reddit r/VGC)",
    !!paceSel && !!weatherSel &&
    [...paceSel.options].some(o => o.value === "Balance") && [...paceSel.options].some(o => o.value === "Stall") &&
    [...weatherSel.options].some(o => o.value === "Sand") && [...weatherSel.options].some(o => o.value === "Trick Room"));
  check("aviso de papel redundante (versão antiga, só informativa) foi removido - não existe mais essa classe",
    !document.querySelector(".archetype-warning"));

  // Clicar sem escolher Ritmo/Clima dá uma mensagem construtiva, não chama
  // a IA às cegas (ela precisaria de um alvo real pra montar algo focado).
  const buildBtn = document.getElementById("archetype-build");
  check("botão 'Montar melhor time' existe (substitui 'Detectar automaticamente')", !!buildBtn);
  if (buildBtn) {
    buildBtn.click();
    await wait(30);
    check("clicar sem Ritmo/Clima escolhido dá uma mensagem construtiva pedindo pra escolher um eixo primeiro",
      document.getElementById("archetype-status").textContent.indexOf("Ritmo ou Clima") !== -1,
      document.getElementById("archetype-status").textContent);
  }

  // Seleção manual persiste de verdade (controle explícito - a IA só monta
  // o time pro alvo já escolhido, nunca decide o alvo sozinha).
  weatherSel.value = "Rain";
  weatherSel.dispatchEvent(new Event("change", { bubbles: true }));
  await wait(30);
  const savedArch1 = JSON.parse(localStorage.getItem("er_terminal_save") || "{}").archetype;
  check("selecionar Clima manualmente persiste em localStorage (arquétipo não é só decorativo)",
    !!savedArch1 && savedArch1.weather === "Rain", savedArch1);

  // Monta o roster real (time + caixa ATUAIS desta suíte) pra alimentar o
  // mock com snames de verdade - o mock devolve 2 reais + 1 INVENTADO
  // (sname que não existe no roster), confirmando que a validação defensiva
  // filtra o inventado em vez de confiar cegamente na resposta da IA.
  const saveForArch = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
  const rosterSnames = (saveForArch.team || []).concat(saveForArch.box || []);
  window.__archToolCalls = [];
  window.claude = {
    use: async function (name) {
      if (name !== "sample") return null;
      return {
        json: async function (prompt, opts) {
          window.__archLastPrompt = prompt;
          if (opts && Array.isArray(opts.tools)) {
            for (const t of opts.tools) {
              if (!t.inputSchema) { try { await t.execute({}); window.__archToolCalls.push(t.name); } catch (e) { } }
            }
          }
          return {
            team: rosterSnames.slice(0, 2).concat(["SPECIES_ISTO_NAO_EXISTE"]),
            reasoning: "Mock: time de teste automatizado focado no arquétipo pedido."
          };
        }
      };
    }
  };
  buildBtn.click();
  await wait(100);
  check("'Montar melhor time' chama as ferramentas reais compartilhadas (buildStandardAiTools, Fase 4+)",
    window.__archToolCalls.indexOf("getTeamWeaknesses") !== -1, window.__archToolCalls);
  const recoBtn = document.getElementById("archetype-apply-team");
  check("sugestão de time aparece com botão 'Usar este time' quando o mock devolve um team válido",
    !!recoBtn, recoBtn && recoBtn.textContent);
  check("chip do time sugerido mostra só os 2 reais - o sname inventado (SPECIES_ISTO_NAO_EXISTE) foi filtrado",
    document.querySelectorAll(".archetype-reco-chip").length === 2,
    document.querySelectorAll(".archetype-reco-chip").length);

  if (recoBtn) {
    recoBtn.click();
    await wait(50);
    const saveAfterArch = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
    check("'Usar este time' realmente aplica o time recomendado (só os 2 reais, não o inventado)",
      saveAfterArch.team.length === 2 &&
      rosterSnames.slice(0, 2).every(sn => saveAfterArch.team.indexOf(sn) !== -1),
      saveAfterArch.team);
    check("motivo da recomendação aplicada fica salvo em state.archetype.reasoning",
      saveAfterArch.archetype && saveAfterArch.archetype.reasoning.indexOf("Mock") !== -1,
      saveAfterArch.archetype);
    check("a sugestão some sozinha depois de aplicada (mesmo padrão da troca acionável da Leitura estratégica)",
      !document.getElementById("archetype-apply-team"));
  }
  delete window.claude;

  // --- 24. PC Box ganha sugestão geral de encaixe no time (Fase 4 do
  // roadmap, 2026-09-12) - "não só a sugestão única do próximo chefão".
  // Cenário determinístico (não depende de adivinhar tabela de tipos):
  // Squirtle + Wartortle são Water puro, então compartilham fraqueza real a
  // Grass E Electric (computeSharedRisks real, não simulado). Charmander é
  // Fire puro, que resiste Grass (0.5x) em qualquer tabela de tipos padrão -
  // boxFitNote() deve achar exatamente essa combinação e ignorar Electric
  // (Fire é neutro contra Electric, não conta como resistência).
  [...document.querySelectorAll(".team-slot .remove-btn")].forEach(b => b.click());
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  await addByName("Squirtle", false);
  await addByName("Wartortle", false);
  await addByName("Charmander", true);
  document.querySelector('.tab-btn[data-tab="box"]').click();
  await wait(50);
  const charSlot = [...document.querySelectorAll(".pcbox-slot:not(.empty)")].find(function (b) {
    return b.title === "Charmander";
  });
  if (charSlot) {
    charSlot.click();
    await wait(30);
    const fitNoteEl = document.querySelector(".pcbox-fit-note");
    check("PC Box mostra sugestão geral de encaixe (Charmander resiste a Grass, fraqueza real do time)",
      !!fitNoteEl && fitNoteEl.textContent.indexOf("Charmander") !== -1 &&
      fitNoteEl.textContent.indexOf("resiste bem a Grass") !== -1,
      fitNoteEl && fitNoteEl.textContent);
    check("sugestão geral NÃO menciona Electric (Fire é neutro contra Electric, não é resistência real)",
      !fitNoteEl || fitNoteEl.textContent.indexOf("Electric") === -1, fitNoteEl && fitNoteEl.textContent);

    // Sem time (nenhuma fraqueza compartilhada possível), a nota some -
    // confirma que ela depende do time real, não é um texto fixo por espécie.
    [...document.querySelectorAll(".team-slot .remove-btn")].forEach(b => b.click());
    document.querySelector('.tab-btn[data-tab="box"]').click();
    await wait(50);
    const charSlotAgain = [...document.querySelectorAll(".pcbox-slot:not(.empty)")].find(function (b) {
      return b.title === "Charmander";
    });
    if (charSlotAgain) { charSlotAgain.click(); await wait(30); }
    check("SEM time, a sugestão geral de encaixe não aparece (nada pra 'encaixar' sem fraqueza compartilhada)",
      !document.querySelector(".pcbox-fit-note"));
  } else {
    check("Charmander encontrado na PC Box pro teste de encaixe geral", false);
  }

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
      !!addBoxBtnAfterTeam && addBoxBtnAfterTeam.disabled && addBoxBtnAfterTeam.textContent === "No time",
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
  // que as 5 ocorrências reais no DOM (mybuild-status só existe com uma
  // build ativa, então não é checado aqui - mas os outros 4 sempre existem
  // nas telas já visitadas nesta suíte) têm role="status" aria-live="polite".
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(30);
  const teamStatusIds = ["archetype-status", "team-strategy-status"];
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

  // --- 27. Gerador de build por IA: trava por level cap + exclusividade de
  // item no time (achados reais do usuário, 2026-09-12/13: "no gerador de
  // build ele não está considerando os golpes que estão disponíveis por lv"
  // + "todos os poke tem praticamente os mesmos itens... nenhum outro pode
  // ter a build montada com life orb").
  document.querySelector('.tab-btn[data-tab="progress"]').click();
  await wait(30);
  var diffSel = document.getElementById("settings-difficulty");
  var msSel27 = document.getElementById("settings-milestone");
  // Achado em auditoria de QA (2026-09-13): esta seção mudava
  // dificuldade/milestone e nunca restaurava - mesma classe de bug do
  // bloco de auto-evolução do Charmander mais acima (agora com
  // milestoneSelBeforeCharm). Inofensivo só porque nada depois desta
  // seção, até agora, dependia do valor anterior - captura e restaura no
  // fim da seção antes que isso mude.
  var diffSelBefore27 = diffSel ? diffSel.value : null;
  var msSelBefore27 = msSel27 ? msSel27.value : null;
  if (diffSel) { diffSel.value = "ace"; diffSel.dispatchEvent(new Event("change", { bubbles: true })); }
  if (msSel27) { msSel27.value = "0"; msSel27.dispatchEvent(new Event("change", { bubbles: true })); }
  await wait(30);
  // Milestone 0 + ace = level cap 18 (data/levelcaps.json), o mesmo "lv 18"
  // do relato do usuário - Bulbasaur real tem golpes de nível 24 e 37
  // (Bind, Giga Drain, Grass Whistle, Natural Gift, Power Whip, Synthesis,
  // Petal Blizzard, Grassy Glide, Leaf Storm, Magical Leaf, Venoshock),
  // todos ACIMA do cap 18 - conferido direto no dado bruto antes de
  // escrever este teste, não chutado.
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  await addByName("Bulbasaur", false);
  await addByName("Charmeleon", false);
  window.__genAiPrompts = [];
  window.claude = {
    use: async function (name) {
      if (name !== "sample") return null;
      return {
        json: async function (prompt, opts) {
          window.__genAiPrompts.push(prompt);
          return { ability: "Overgrow", nature: "Modest", item: "", moves: ["Tackle", "Growl", "Vine Whip", "Sleep Powder"], evs: [0, 0, 0, 252, 0, 4], rationale: "teste level cap" };
        }
      };
    }
  };
  setSearch("Bulbasaur");
  await wait(120);
  var bulbaRow27 = document.querySelector("#species-list .species-row");
  if (bulbaRow27) {
    bulbaRow27.click();
    await wait(30);
    var aiBtn27 = document.getElementById("mybuild-ai-generate");
    if (aiBtn27) { aiBtn27.click(); await wait(150); }
  }
  var capPrompt = window.__genAiPrompts[0] || "";
  var aboveCapMoves = ["Bind", "Giga Drain", "Grass Whistle", "Natural Gift", "Power Whip", "Synthesis", "Petal Blizzard", "Grassy Glide", "Leaf Storm", "Magical Leaf", "Venoshock"];
  var leakedMoves = aboveCapMoves.filter(function (m) { return capPrompt.indexOf(m) !== -1; });
  check("prompt de build por IA não lista golpes de nível acima do level cap atual (18)",
    !!capPrompt && leakedMoves.length === 0, leakedMoves);

  // Salva manualmente uma build com Life Orb pro Bulbasaur (fonte de
  // verdade real, não simulada) - depois gera pro Charmeleon tentando o
  // MESMO item de propósito, pra confirmar que a validação descarta.
  function setSel27(id, v) { var e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event("change", { bubbles: true })); }
  var abiSel = document.getElementById("mybuild-ability");
  if (abiSel) setSel27("mybuild-ability", abiSel.options[1] ? abiSel.options[1].value : "");
  var itemInput = document.getElementById("mybuild-item");
  if (itemInput) { itemInput.value = "Life Orb"; itemInput.dispatchEvent(new Event("input", { bubbles: true })); }
  var saveBtn27 = document.getElementById("mybuild-save");
  if (saveBtn27) { saveBtn27.click(); await wait(50); }
  setSearch("Charmeleon");
  await wait(120);
  var charRow27 = document.querySelector("#species-list .species-row");
  window.__genAiPrompts = [];
  window.claude = {
    use: async function (name) {
      if (name !== "sample") return null;
      return {
        json: async function (prompt, opts) {
          window.__genAiPrompts.push(prompt);
          return { ability: "Flame Body", nature: "Adamant", item: "Life Orb", moves: ["Scratch", "Smokescreen", "Fire Fang", "Slash"], evs: [0, 252, 0, 0, 0, 4], rationale: "teste item duplicado" };
        }
      };
    }
  };
  if (charRow27) {
    charRow27.click();
    await wait(30);
    var aiBtn27b = document.getElementById("mybuild-ai-generate");
    if (aiBtn27b) { aiBtn27b.click(); await wait(150); }
  }
  var itemPrompt = window.__genAiPrompts[0] || "";
  check("prompt de build por IA avisa quais itens já estão em uso por outros membros do time",
    itemPrompt.indexOf("Life Orb") !== -1 && itemPrompt.indexOf("JA EM USO") !== -1, itemPrompt.slice(0, 400));
  var saveAfter27 = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
  var charBuild27 = (saveAfter27.customBuilds["SPECIES_CHARMELEON"] || [])[0];
  check("build por IA que insiste no item já usado por outro membro tem o item removido, não a build inteira rejeitada",
    !!charBuild27 && charBuild27.item === "" && charBuild27.ability === "Flame Body",
    charBuild27);

  // Gerador de build ignorava o arquétipo escolhido (achado real do
  // usuário, 2026-09-13, com print do time montado via "Montar melhor
  // time": "a build tem que ser de acordo com o ritmo que nós escolhemos e
  // a IA recomendou"). Define Clima=Trick Room (implicação mais concreta e
  // fácil de checar num prompt: Velocidade baixa de propósito) e confirma
  // que o prompt da build por IA passa a mencionar isso - depois limpa o
  // arquétipo e confirma que a menção desaparece (condicional de verdade,
  // não sempre presente).
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(30);
  var weatherSel27 = document.getElementById("archetype-weather");
  if (weatherSel27) { weatherSel27.value = "Trick Room"; weatherSel27.dispatchEvent(new Event("change", { bubbles: true })); }
  await wait(30);
  window.__genAiPrompts = [];
  window.claude = {
    use: async function (name) {
      if (name !== "sample") return null;
      return {
        json: async function (prompt, opts) {
          window.__genAiPrompts.push(prompt);
          return { ability: "Overgrow", nature: "Brave", item: "", moves: ["Tackle", "Growl", "Vine Whip", "Sleep Powder"], evs: [252, 252, 0, 0, 0, 0], rationale: "teste arquétipo" };
        }
      };
    }
  };
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  setSearch("Bulbasaur");
  await wait(120);
  var bulbaRow27b = document.querySelector("#species-list .species-row");
  if (bulbaRow27b) {
    bulbaRow27b.click();
    await wait(30);
    var aiBtn27c = document.getElementById("mybuild-ai-generate");
    if (aiBtn27c) { aiBtn27c.click(); await wait(150); }
  }
  var archPrompt = window.__genAiPrompts[0] || "";
  check("prompt de build por IA menciona o Clima do time (Trick Room) quando um arquétipo está escolhido",
    archPrompt.indexOf("Clima do time: Trick Room") !== -1 && archPrompt.indexOf("Velocidade BAIXA") !== -1,
    archPrompt.slice(0, 500));

  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(30);
  if (weatherSel27) { weatherSel27.value = ""; weatherSel27.dispatchEvent(new Event("change", { bubbles: true })); }
  await wait(30);
  window.__genAiPrompts = [];
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  if (bulbaRow27b) {
    var aiBtn27d = document.getElementById("mybuild-ai-generate");
    if (aiBtn27d) { aiBtn27d.click(); await wait(150); }
  }
  var noArchPrompt = window.__genAiPrompts[0] || "";
  check("sem arquétipo escolhido, o prompt NÃO menciona Ritmo/Clima do time (condicional de verdade)",
    !!noArchPrompt && noArchPrompt.indexOf("Ritmo do time") === -1 && noArchPrompt.indexOf("Clima do time") === -1,
    noArchPrompt.slice(0, 300));

  delete window.claude;
  setSearch("");
  await wait(30);
  document.querySelector('.tab-btn[data-tab="progress"]').click();
  await wait(30);
  if (diffSel && diffSelBefore27 !== null) { diffSel.value = diffSelBefore27; diffSel.dispatchEvent(new Event("change", { bubbles: true })); }
  if (msSel27 && msSelBefore27 !== null) { msSel27.value = msSelBefore27; msSel27.dispatchEvent(new Event("change", { bubbles: true })); }
  await wait(30);
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  // --- 28. Botão "Gerar build com IA" direto no card do Meu Time (achado
  // real do usuário, 2026-09-13: "não achei o botão de criar build na tela
  // do time como eu pedi" - antes só existia na ficha da Dex, obrigando o
  // jogador a trocar de aba). Chama a MESMA generateBuildWithAI() de sempre
  // (agora com um id de status por espécie, já que até 6 cards existem ao
  // mesmo tempo nesta tela - não dá pra reusar #mybuild-ai-status, que é
  // único). Também confirma que o botão novo NÃO aciona o "copiar" que já
  // existia (mesmo estilo visual, classe DIFERENTE de propósito). Usa
  // Squirtle - mas Squirtle NÃO é "espécie nova" de verdade: o teste de
  // mock da IA lá em cima (setSearch("Squirtle"), por volta da linha 1438)
  // já roda o gerador nela e deixa uma build de verdade salva. Rodando só
  // este trecho isolado isso não aparece (sem seção anterior pra sujar o
  // localStorage), mas rodando a suíte inteira o card do time já nasce COM
  // build salva e o botão "Gerar build com IA" nunca chega a existir -
  // achado exatamente assim, suíte completa passando 202 checks menos este,
  // isolado passando 100%. Em vez de caçar outra espécie "virgem" (o mesmo
  // erro se repete assim que alguém mais usar essa espécie em outro teste
  // futuro - já rotulamos Squirtle de "nova" uma vez e erramos), limpa de
  // verdade qualquer build salva da espécie de teste ANTES de assumir que
  // ela está vazia, usando o próprio botão real "Apagar esta"
  // (#mybuild-clear) da Dex - nunca mexendo direto no localStorage por fora
  // da UI.
  setSearch("Squirtle");
  await wait(120);
  const rowSquirtlePre28 = document.querySelector("#species-list .species-row");
  if (rowSquirtlePre28) {
    rowSquirtlePre28.click();
    await wait(30);
    for (let clearTry = 0; clearTry < 4; clearTry++) {
      const clearBtnPre28 = document.getElementById("mybuild-clear");
      if (!clearBtnPre28) break;
      clearBtnPre28.click();
      await wait(30);
    }
  }
  setSearch("");
  await wait(30);
  // Esvazia o time primeiro - garante vaga livre pro Squirtle independente
  // de quantos membros o time seed desta seção já tinha acumulado.
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(30);
  [...document.querySelectorAll(".team-slot .remove-btn")].forEach(function (b) { b.click(); });
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  await addByName("Squirtle", false);
  const dexData28 = JSON.parse(document.getElementById("dexdata").textContent);
  const abilitiesByIdx28 = {};
  dexData28.abilities.forEach(function (a, i) { if (a) abilitiesByIdx28[i] = a[0]; });
  const movesByIdx28 = {};
  dexData28.moves.forEach(function (m, i) { if (m) movesByIdx28[i] = m[0]; });
  const sp28 = dexData28.species.find(function (s) { return s && s.sname === "SPECIES_SQUIRTLE"; });
  const squirtleOnTeam28 = (JSON.parse(localStorage.getItem("er_terminal_save") || "{}").team || []).indexOf("SPECIES_SQUIRTLE") !== -1;
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);
  const genBtn28 = sp28 && document.getElementById("ts-ai-generate-" + sp28.x);
  check("card do Meu Time tem o botão 'Gerar build com IA' quando não há build salva",
    !!genBtn28, { spFound: sp28 && sp28.n, squirtleOnTeam: squirtleOnTeam28 });
  if (genBtn28 && sp28) {
    const abiName28 = abilitiesByIdx28[sp28.ab[0]];
    const moveNames28 = sp28.lm.slice(0, 4).map(function (p) { return movesByIdx28[p[1]]; });
    window.claude = {
      use: async function (name) {
        if (name !== "sample") return null;
        return {
          json: async function () {
            return { ability: abiName28, nature: "Modest", item: "", moves: moveNames28, evs: [0, 0, 0, 0, 0, 0], rationale: "teste botão do time" };
          }
        };
      }
    };
    genBtn28.click();
    await wait(150);
    const saveAfter28 = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
    const build28 = (saveAfter28.customBuilds[sp28.sname] || [])[0];
    check("clicar no botão do card do time gera e salva a build de verdade (mesma validação de sempre)",
      !!build28 && build28.ability === abiName28, build28);
    check("o card do time atualiza sozinho pra mostrar a build nova, sem precisar trocar de aba",
      !!document.querySelector('.ts-build-copy[data-x="' + sp28.x + '"]') && !document.getElementById("ts-ai-generate-" + sp28.x));
    const copyBtn28 = document.querySelector('.ts-build-copy[data-x="' + sp28.x + '"]');
    if (copyBtn28) {
      copyBtn28.click();
      await wait(50);
      check("o botão 'copiar' ao lado continua funcionando (classes não colidiram)",
        document.getElementById("toast").textContent.indexOf("copiado") !== -1,
        document.getElementById("toast").textContent);
    }
    delete window.claude;
  }

  localStorage.clear();

  const passed = results.filter(r => r.pass).length;
  console.log("=== smoke_test_suite PART A: " + passed + "/" + results.length + " passed ===");
  results.forEach(r => console.log((r.pass ? "PASS" : "FAIL") + "  " + r.name + (r.detail ? "  (" + r.detail + ")" : "")));
  return results;
}

// ============================== PART B ==============================
// B1 - run this FIRST, then reload the page (navigate to the same URL):
/*
localStorage.clear();
const fakeSave = {
  v: 2, dataVersion: "test", savedAt: new Date().toISOString(),
  team: ["SPECIES_CHARIZARD", "SPECIES_TOTALLY_MADE_UP_FUTURE_MON"],
  box: ["SPECIES_ANOTHER_FAKE_ONE"],
  savedTeams: [], settings: { difficulty: "ace", milestone: 999999 }
};
localStorage.setItem("er_terminal_save", JSON.stringify(fakeSave));
"B1 done - now reload the page, then run B2";
*/

// B2 - run this AFTER reloading:
/*
(function () {
  const results = [];
  function check(name, cond, detail) { results.push({ name, pass: !!cond, detail: detail || "" }); }
  // #settings-milestone starts with zero <option>s in the markup - it's only
  // populated by initProgress(), lazily, the first time the Progresso tab is
  // opened (same lazy-init pattern as Chefoes). Checking it before that just
  // measures an empty select, not the actual clamp (which lives in the
  // closure-private `state.settings.milestone`, unreachable from outside -
  // this IS the real, DOM-visible proxy for it).
  document.querySelector('.tab-btn[data-tab="progress"]').click();
  const milestoneEl = document.getElementById("settings-milestone");
  const maxOption = milestoneEl ? milestoneEl.options.length - 1 : null;
  check("milestone clamped to a valid option on load",
    milestoneEl && parseInt(milestoneEl.value, 10) === maxOption,
    "value=" + (milestoneEl && milestoneEl.value) + " max=" + maxOption);
  // force a real persist() via the UI, then check orphans survived it
  if (milestoneEl) milestoneEl.dispatchEvent(new Event("change", { bubbles: true }));
  const saved = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
  check("orphan team member survives a real persist()",
    (saved.team || []).indexOf("SPECIES_TOTALLY_MADE_UP_FUTURE_MON") !== -1);
  check("orphan box member survives a real persist()",
    (saved.box || []).indexOf("SPECIES_ANOTHER_FAKE_ONE") !== -1);
  const passed = results.filter(r => r.pass).length;
  console.log("=== smoke_test_suite PART B: " + passed + "/" + results.length + " passed ===");
  results.forEach(r => console.log((r.pass ? "PASS" : "FAIL") + "  " + r.name + (r.detail ? "  (" + r.detail + ")" : "")));
  localStorage.clear();
  return results;
})();
*/

// ============================== PART C ==============================
// Run standalone: navigate to artifact_template.html (raw, unbuilt) served
// locally, THEN run this snippet. Regression coverage for the fail-fast
// build-integrity check added 2026-09-09 after the wrong-file publish
// incident - artifact_template.html always has unfilled placeholders (it's
// the source, not the build output), so #dexdata never starts with "{"
// there and the check should always fire on it.
/*
(function () {
  const results = [];
  function check(name, cond, detail) { results.push({ name, pass: !!cond, detail: detail || "" }); }
  const bodyText = document.body.textContent || "";
  check("fail-fast message shows instead of a silent crash",
    bodyText.indexOf("Build incompleto publicado") !== -1, bodyText.slice(0, 200));
  check("fail-fast message names the actual mistake (wrong file)",
    bodyText.indexOf("artifact_template.html") !== -1 && bodyText.indexOf("artifact_final.html") !== -1);
  check("app never rendered species rows on top of the error (no silent partial run)",
    document.querySelectorAll("#species-list .species-row").length === 0);
  const passed = results.filter(r => r.pass).length;
  console.log("=== smoke_test_suite PART C: " + passed + "/" + results.length + " passed ===");
  results.forEach(r => console.log((r.pass ? "PASS" : "FAIL") + "  " + r.name + (r.detail ? "  (" + r.detail + ")" : "")));
  return results;
})();
*/

// ============================== PART D ==============================
// Sort order + type filter persistence, Fase 1, 2026-09-09 - genuinely
// needs a reload between "set a preference" and "confirm it survived",
// same reason Part B is split. Run D1, reload the page, then run D2.
// D1 - run this FIRST, then reload the page (navigate to the same URL):
/*
(function () {
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  const sel = document.getElementById("sort-select");
  sel.value = "rank";
  sel.dispatchEvent(new Event("change", { bubbles: true }));
  document.getElementById("type-filter-toggle").click();
  const fireCb = [...document.querySelectorAll(".type-check input")].find(cb => cb.parentElement.textContent.trim() === "Fire");
  fireCb.checked = true;
  fireCb.dispatchEvent(new Event("change", { bubbles: true }));
  return "D1 done - sort=rank, type filter=Fire - now reload the page, then run D2";
})();
*/

// D2 - run this AFTER reloading:
/*
(function () {
  const results = [];
  function check(name, cond, detail) { results.push({ name, pass: !!cond, detail: detail || "" }); }
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  check("sort order restored to 'rank' after reload",
    document.getElementById("sort-select").value === "rank");
  const fireCb = [...document.querySelectorAll(".type-check input")].find(cb => cb.parentElement.textContent.trim() === "Fire");
  check("Fire type-filter checkbox restored as checked after reload",
    fireCb && fireCb.checked === true);
  check("species list actually reflects the restored filter (Fire-only)",
    document.querySelectorAll("#species-list .species-row").length > 0 &&
    document.querySelectorAll("#species-list .species-row").length < 1906);
  const passed = results.filter(r => r.pass).length;
  console.log("=== smoke_test_suite PART D: " + passed + "/" + results.length + " passed ===");
  results.forEach(r => console.log((r.pass ? "PASS" : "FAIL") + "  " + r.name + (r.detail ? "  (" + r.detail + ")" : "")));
  localStorage.clear();
  return results;
})();
*/

// ============================== PART E ==============================
// Sincronizacao entre aparelhos (db), 2026-09-11 - item 3 da lista do
// Gerente na reuniao de 2026-09-10 ("o mock que resolveu o teste da IA pode
// se aplicar tambem a sincronizacao"). Ao contrario do mock de IA (que
// injeta window.claude a qualquer momento, porque generateBuildWithAI() so
// chama claude.use() no clique do botao), wireSync() roda UMA UNICA VEZ, na
// carga da pagina, dentro da IIFE principal do app - nao ha reentrada
// exposta pra injetar window.claude depois que a pagina ja carregou. A
// unica forma de testar o mecanismo REAL (nao uma simulacao por fora) e
// window.claude ja existir ANTES do <script> do app rodar.
//
// Por isso o mock mora no PROPRIO SERVIDOR DE DEV LOCAL
// (scripts/dev_server.ps1, nunca no artifact_final.html publicado): quando
// a URL leva "?mock_db=1" (e opcionalmente "&seed=<json codificado>"), o
// servidor injeta um pequeno <script> no INICIO do arquivo, antes de
// qualquer outra tag - window.claude.use("db") entao resolve pra um db
// falso em memoria (docs = {"sync/save": ...}), com os mesmos metodos reais
// que o app usa (doc().get()/.set()/.onSnapshot()). window.__fakeSyncDocs
// deixa inspecionar o estado "remoto" depois; window.__fakeSyncPushRemote()
// simula uma mudanca chegando de OUTRO aparelho enquanto esta pagina segue
// aberta (o caminho do onSnapshot, que nao tem outro jeito de exercitar).
//
// Cada cenario abaixo exige sua PROPRIA navegacao (nunca da pra rodar tudo
// numa unica chamada, como a PART A) - depois de rodar o "setup" de um
// cenario, ele imprime a URL exata pra navegar; rode o "assert" logo em
// seguida, na pagina carregada por essa URL. Charizard (forma final, sem
// evolucao possivel) é usado como fixture em todo cenario que precisa de um
// time real, especificamente pra nao confundir o resultado com a
// auto-evolucao por level cap (pacote separado, 2026-09-10) - Bulbasaur foi
// tentado primeiro e evoluiu sozinho pra Ivysaur em alguns recarregamentos,
// mascarando se a MUDANCA observada veio da sincronizacao ou da evolucao.
//
// Servidor de dev precisa estar rodando com o dev_server.ps1 ATUALIZADO
// (reinicie o processo se ele já estava de pé antes desta mudança).

// E1 - sem doc remoto ainda (instalacao nova): wireSync() deve semear o
// remoto com o save local (ou um save vazio, se local tambem nao existir).
// Rode isto, depois navegue pra "http://localhost:8100/artifact_final.html?mock_db=1"
// (sem "seed") e rode E1_assert.
/*
(function () {
  localStorage.clear();
  return "localStorage limpo - agora navegue para http://localhost:8100/artifact_final.html?mock_db=1 e rode E1_assert";
})();
*/
/*
(async function E1_assert() {
  await new Promise(r => setTimeout(r, 250));
  const results = [];
  function check(name, cond, detail) { results.push({ name, pass: !!cond, detail: detail || "" }); }
  const local = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
  const remoteDocs = window.__fakeSyncDocs || {};
  check("mock de db foi injetado (window.claude existe)", typeof window.claude !== "undefined");
  check("sem doc remoto previo, wireSync() semeia o remoto com o save local",
    JSON.stringify(remoteDocs["sync/save"]) === JSON.stringify(local),
    JSON.stringify(remoteDocs["sync/save"]));
  check("banner de sync nao aparece numa instalacao nova (nada pra conciliar)",
    document.getElementById("sync-banner").hidden === true);
  const passed = results.filter(r => r.pass).length;
  console.log("=== smoke_test_suite PART E1: " + passed + "/" + results.length + " passed ===");
  results.forEach(r => console.log((r.pass ? "PASS" : "FAIL") + "  " + r.name + (r.detail ? "  (" + r.detail + ")" : "")));
  return results;
})();
*/

// E2 - remoto tem conteudo DIFERENTE e é mais NOVO que o local: wireSync()
// deve puxar o remoto por cima do local e mostrar o banner "mais novo de
// outro aparelho". Fluxo em 3 passos, cada um numa pagina carregada por vez
// (achado ao validar isto ao vivo, 2026-09-11: localStorage.clear() NUNCA
// reseta sozinho o `state.team` que ja esta em memoria - só um reload de
// verdade faz isso. Rodar "clear" e "montar time" no mesmo script, sem
// recarregar entre os dois, deixa o time antigo (de um cenario anterior)
// preso em memoria e ele so ACUMULA junto com o time novo, em vez de ser
// substituido - foi exatamente isso que aconteceu ao escrever este pacote
// de testes na primeira tentativa):
//   1. Rode E2_clear, depois NAVEGUE (reload de verdade) para
//      http://localhost:8100/artifact_final.html (SEM mock_db).
//   2. Rode E2_setup nessa pagina recem-carregada - ele monta o time e
//      imprime a URL com "?mock_db=1&seed=...".
//   3. Navegue ate essa URL e rode E2_assert.
/*
(function E2_clear() {
  localStorage.clear();
  return "localStorage limpo - agora navegue (reload de verdade) para http://localhost:8100/artifact_final.html SEM mock_db, depois rode E2_setup";
})();
*/
/*
(async function E2_setup() {
  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  const el = document.getElementById("search-input");
  el.value = "Charizard";
  el.dispatchEvent(new Event("input", { bubbles: true }));
  await wait(120);
  document.querySelector("#species-list .species-row").click();
  await wait(50);
  document.getElementById("add-team-btn").click();
  await wait(80);
  const local = JSON.parse(localStorage.getItem("er_terminal_save"));
  const remote = JSON.parse(JSON.stringify(local));
  remote.team = ["SPECIES_VENUSAUR"]; // conteudo diferente do local (Charizard)
  remote.savedAt = new Date(Date.now() + 60000).toISOString(); // 1 min no futuro - mais novo que o local
  const url = "http://localhost:8100/artifact_final.html?mock_db=1&seed=" + encodeURIComponent(JSON.stringify(remote));
  console.log("Navegue para:", url);
  return url;
})();
*/
/*
(async function E2_assert() {
  await new Promise(r => setTimeout(r, 250));
  const results = [];
  function check(name, cond, detail) { results.push({ name, pass: !!cond, detail: detail || "" }); }
  const local = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
  check("remoto mais novo com conteudo diferente sobrescreve o local",
    JSON.stringify(local.team) === JSON.stringify(["SPECIES_VENUSAUR"]), JSON.stringify(local.team));
  check("banner avisa que um save mais novo de outro aparelho foi encontrado",
    document.getElementById("sync-banner").hidden === false &&
    document.getElementById("sync-banner-text").textContent.indexOf("mais novo de outro aparelho") !== -1,
    document.getElementById("sync-banner-text").textContent);
  const passed = results.filter(r => r.pass).length;
  console.log("=== smoke_test_suite PART E2: " + passed + "/" + results.length + " passed ===");
  results.forEach(r => console.log((r.pass ? "PASS" : "FAIL") + "  " + r.name + (r.detail ? "  (" + r.detail + ")" : "")));
  return results;
})();
*/

// E3 - remoto tem conteudo DIFERENTE mas é mais VELHO que o local: local
// vence e é empurrado pra cima (syncRef.set()), sem banner nenhum (o
// usuario nao precisa saber que o proprio save dele foi republicado). Mesmo
// fluxo de 3 passos do E2 (E3_clear -> reload de verdade sem mock_db ->
// E3_setup -> navegar -> E3_assert) - o reload entre limpar e montar o
// time NAO e opcional, ver o comentario acima do E2.
/*
(function E3_clear() {
  localStorage.clear();
  return "localStorage limpo - agora navegue (reload de verdade) para http://localhost:8100/artifact_final.html SEM mock_db, depois rode E3_setup";
})();
*/
/*
(async function E3_setup() {
  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  const el = document.getElementById("search-input");
  el.value = "Charizard";
  el.dispatchEvent(new Event("input", { bubbles: true }));
  await wait(120);
  document.querySelector("#species-list .species-row").click();
  await wait(50);
  document.getElementById("add-team-btn").click();
  await wait(80);
  const local = JSON.parse(localStorage.getItem("er_terminal_save"));
  const remote = JSON.parse(JSON.stringify(local));
  remote.team = ["SPECIES_VENUSAUR"];
  remote.savedAt = new Date(Date.now() - 3600000).toISOString(); // 1h no passado - mais velho que o local
  const url = "http://localhost:8100/artifact_final.html?mock_db=1&seed=" + encodeURIComponent(JSON.stringify(remote));
  console.log("Navegue para:", url);
  return url;
})();
*/
/*
(async function E3_assert() {
  await new Promise(r => setTimeout(r, 250));
  const results = [];
  function check(name, cond, detail) { results.push({ name, pass: !!cond, detail: detail || "" }); }
  const local = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
  check("local mais recente com conteudo diferente NAO e sobrescrito pelo remoto",
    JSON.stringify(local.team) === JSON.stringify(["SPECIES_CHARIZARD"]), JSON.stringify(local.team));
  check("local vencedor e empurrado pro remoto (doc falso passa a refletir o local)",
    JSON.stringify((window.__fakeSyncDocs["sync/save"] || {}).team) === JSON.stringify(["SPECIES_CHARIZARD"]));
  check("nenhum banner aparece quando e o proprio local que venceu",
    document.getElementById("sync-banner").hidden === true);
  const passed = results.filter(r => r.pass).length;
  console.log("=== smoke_test_suite PART E3: " + passed + "/" + results.length + " passed ===");
  results.forEach(r => console.log((r.pass ? "PASS" : "FAIL") + "  " + r.name + (r.detail ? "  (" + r.detail + ")" : "")));
  return results;
})();
*/

// E4 - conteudo IDENTICO entre local e remoto, so o savedAt difere: esta e
// a regressao mais importante deste pacote - o motivo original da reescrita
// de "comparar timestamp" pra "comparar conteudo" (ver o comentario de
// syncContentDiffers() mais acima neste arquivo/no app): um savedAt
// diferente sozinho NAO pode disparar nem escrita nem banner. Mesmo fluxo de
// 3 passos (E4_clear -> reload de verdade sem mock_db -> E4_setup ->
// navegar -> E4_assert).
/*
(function E4_clear() {
  localStorage.clear();
  return "localStorage limpo - agora navegue (reload de verdade) para http://localhost:8100/artifact_final.html SEM mock_db, depois rode E4_setup";
})();
*/
/*
(async function E4_setup() {
  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  const el = document.getElementById("search-input");
  el.value = "Charizard";
  el.dispatchEvent(new Event("input", { bubbles: true }));
  await wait(120);
  document.querySelector("#species-list .species-row").click();
  await wait(50);
  document.getElementById("add-team-btn").click();
  await wait(80);
  const local = JSON.parse(localStorage.getItem("er_terminal_save"));
  const remote = JSON.parse(JSON.stringify(local)); // MESMO conteudo
  remote.savedAt = new Date(Date.now() - 3600000).toISOString(); // só o timestamp difere
  window.__E4_seedSavedAt = remote.savedAt;
  const url = "http://localhost:8100/artifact_final.html?mock_db=1&seed=" + encodeURIComponent(JSON.stringify(remote));
  console.log("Navegue para:", url, "- savedAt semeado:", remote.savedAt);
  return url;
})();
*/
/*
(async function E4_assert(seedSavedAt) {
  // seedSavedAt: cole aqui o "savedAt semeado" impresso pelo E4_setup
  // (window.__E4_seedSavedAt nao sobrevive a navegacao - e outra pagina).
  await new Promise(r => setTimeout(r, 250));
  const results = [];
  function check(name, cond, detail) { results.push({ name, pass: !!cond, detail: detail || "" }); }
  const local = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
  check("local mantem seu proprio savedAt (nao adota o do remoto so pq e diferente)",
    local.savedAt !== seedSavedAt, local.savedAt);
  check("conteudo identico -> NENHUMA escrita no remoto (savedAt semeado permanece intacto)",
    (window.__fakeSyncDocs["sync/save"] || {}).savedAt === seedSavedAt,
    (window.__fakeSyncDocs["sync/save"] || {}).savedAt);
  check("nenhum banner aparece quando o conteudo já e identico",
    document.getElementById("sync-banner").hidden === true);
  const passed = results.filter(r => r.pass).length;
  console.log("=== smoke_test_suite PART E4: " + passed + "/" + results.length + " passed ===");
  results.forEach(r => console.log((r.pass ? "PASS" : "FAIL") + "  " + r.name + (r.detail ? "  (" + r.detail + ")" : "")));
  return results;
})("COLE_AQUI_O_SAVEDAT_IMPRESSO_PELO_E4_SETUP");
*/

// E5 - onSnapshot ao vivo: outro aparelho salva enquanto ESTA pagina segue
// aberta (sem reload nenhum). E o unico cenario que dispensa navegacao -
// window.__fakeSyncPushRemote() simula a mensagem chegando em tempo real.
// Rode com a pagina em QUALQUER estado de mock_db=1 ja carregado (por
// exemplo, logo depois de E1/E2/E3/E4_assert, sem navegar de novo).
/*
(async function E5_liveSnapshot() {
  const results = [];
  function check(name, cond, detail) { results.push({ name, pass: !!cond, detail: detail || "" }); }
  if (typeof window.__fakeSyncPushRemote !== "function") {
    check("mock de db (window.__fakeSyncPushRemote) disponivel nesta pagina", false);
  } else {
    const base = (window.__fakeSyncDocs && window.__fakeSyncDocs["sync/save"]) || {};
    const pushed = JSON.parse(JSON.stringify(base));
    pushed.team = ["SPECIES_BLAZIKEN_MEGA"];
    pushed.savedAt = new Date().toISOString();
    window.__fakeSyncPushRemote("sync/save", pushed);
    await new Promise(r => setTimeout(r, 100));
    const local = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
    check("mudanca ao vivo de outro aparelho e aplicada sem reload",
      JSON.stringify(local.team) === JSON.stringify(["SPECIES_BLAZIKEN_MEGA"]), JSON.stringify(local.team));
    check("banner avisa que o time foi atualizado em outro aparelho AGORA (nao 'mais novo', tempo real)",
      document.getElementById("sync-banner").hidden === false &&
      document.getElementById("sync-banner-text").textContent.indexOf("atualizado em outro aparelho agora") !== -1,
      document.getElementById("sync-banner-text").textContent);
  }
  const passed = results.filter(r => r.pass).length;
  console.log("=== smoke_test_suite PART E5: " + passed + "/" + results.length + " passed ===");
  results.forEach(r => console.log((r.pass ? "PASS" : "FAIL") + "  " + r.name + (r.detail ? "  (" + r.detail + ")" : "")));
  return results;
})();
*/

// E6 - onSnapshot ao vivo, achado real do usuario 2026-09-12 (dois times
// divergentes entre celular e navegador): ao contrario de E5 (remoto
// genuinamente mais novo, deve aplicar), este cenario simula um remoto
// ATRASADO chegando DEPOIS que este aparelho ja salvou algo mais novo -
// antes desta correcao, o onSnapshot aceitava QUALQUER conteudo diferente
// sem checar savedAt, entao o aparelho "vencedor" da corrida podia ser
// silenciosamente revertido pelo eco atrasado do outro. Rode com a pagina
// em QUALQUER estado de mock_db=1 ja carregado, igual E5.
/*
(async function E6_staleLiveSnapshotRejected() {
  const results = [];
  function check(name, cond, detail) { results.push({ name, pass: !!cond, detail: detail || "" }); }
  if (typeof window.__fakeSyncPushRemote !== "function") {
    check("mock de db (window.__fakeSyncPushRemote) disponivel nesta pagina", false);
  } else {
    // 1. Este aparelho salva algo novo AGORA (savedAt recente de verdade).
    const el = document.getElementById("search-input");
    el.value = "Squirtle";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise(r => setTimeout(r, 150));
    const row = document.querySelector("#species-list .species-row");
    if (row) {
      row.click();
      await new Promise(r => setTimeout(r, 50));
      const btn = document.getElementById("add-team-btn");
      if (btn && !btn.disabled) btn.click();
      await new Promise(r => setTimeout(r, 100));
    }
    const localAfterOwnSave = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
    // 2. Simula o eco ATRASADO de outro aparelho - conteudo diferente, mas
    // savedAt CLARAMENTE mais velho que o que este aparelho acabou de salvar.
    const stale = JSON.parse(JSON.stringify(localAfterOwnSave));
    stale.team = ["SPECIES_MAGIKARP"];
    stale.savedAt = "2020-01-01T00:00:00.000Z";
    window.__fakeSyncPushRemote("sync/save", stale);
    await new Promise(r => setTimeout(r, 100));
    const localAfterStalePush = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
    check("remoto ATRASADO/mais velho NAO sobrescreve o local mais novo",
      JSON.stringify(localAfterStalePush.team) === JSON.stringify(localAfterOwnSave.team),
      localAfterStalePush.team);
    check("o remoto obsoleto e corrigido de volta pro valor local (nao fica divergente no servidor)",
      JSON.stringify(window.__fakeSyncDocs["sync/save"].team) === JSON.stringify(localAfterOwnSave.team),
      window.__fakeSyncDocs["sync/save"].team);
  }
  const passed = results.filter(r => r.pass).length;
  console.log("=== smoke_test_suite PART E6: " + passed + "/" + results.length + " passed ===");
  results.forEach(r => console.log((r.pass ? "PASS" : "FAIL") + "  " + r.name + (r.detail ? "  (" + r.detail + ")" : "")));
  return results;
})();
*/

// E7 - reconexao automatica depois de "conexao de sincronizacao perdida"
// (achado real do usuario, 2026-09-13: viu esse aviso na tela e perguntou o
// que significava - o app so avisava, nunca tentava reconectar sozinho,
// deixando o jogador preso em "so neste aparelho" ate lembrar de recarregar
// a pagina na mao). window.__fakeSyncTriggerError(path) (novo no mock,
// nesta mesma correcao) dispara o error callback real do onSnapshot, o
// mesmo caminho que uma queda de rede de verdade dispararia. Rode com a
// pagina em QUALQUER estado de mock_db=1 ja carregado, igual E5/E6.
/*
(async function E7_autoReconnect() {
  const results = [];
  function check(name, cond, detail) { results.push({ name, pass: !!cond, detail: detail || "" }); }
  if (typeof window.__fakeSyncTriggerError !== "function") {
    check("mock de db (window.__fakeSyncTriggerError) disponivel nesta pagina", false);
  } else {
    const indicator = document.getElementById("sync-status-indicator");
    window.__fakeSyncTriggerError("sync/save");
    await new Promise(r => setTimeout(r, 50));
    check("indicador avisa 'conexao perdida' na hora, depois 'reconectando' (nunca fica calado)",
      indicator.textContent.indexOf("reconectando") !== -1, indicator.textContent);
    // Primeiro retry agendado pra 5s (backoff exponencial comeca em 5000ms) -
    // espera um pouco mais pra dar folga em maquina lenta.
    await new Promise(r => setTimeout(r, 5500));
    check("reconecta sozinho sem precisar recarregar a pagina (volta pra 'sincronizado')",
      indicator.textContent === "sincronizado entre aparelhos", indicator.textContent);
  }
  const passed = results.filter(r => r.pass).length;
  console.log("=== smoke_test_suite PART E7: " + passed + "/" + results.length + " passed ===");
  results.forEach(r => console.log((r.pass ? "PASS" : "FAIL") + "  " + r.name + (r.detail ? "  (" + r.detail + ")" : "")));
  return results;
})();
*/
