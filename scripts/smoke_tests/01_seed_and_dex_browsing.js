// Seed do time/caixa (usado pelo resto da suíte inteira) + navegação básica
// da Dex: box-to-team/swap modal, tiers de stat bar, rank badge + sort,
// navegação cruzada time->Dex, linha de rank/papel, blocos colapsáveis,
// "onde encontrar" + sinergia habilidade x movepool.
// Extraído de scripts/smoke_test_suite.js (refactor 2026-09-13) - conteúdo
// idêntico ao original, só movido pra seu próprio arquivo.
async function section01() {
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
    // <dialog> nativo desde 2026-09-13 - `.open` é o jeito certo de checar
    // (o `.hidden` de antes era da <div> manual, não existe mais aqui).
    check("swap modal opens on click", document.getElementById("swap-modal").open === true);
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
      // 6 desde 2026-09-18: "Estratégias" (sets nomeados por IA, referência
      // ao dex do Smogon) entrou como um 5º grupo colapsável, logo depois
      // de "Auto Build".
      check("6 grupos na tela de detalhe (5 colapsáveis + 'Conhecer a espécie' sempre visível)", groups.length === 6, groups.length);
      // "Conhecer a espécie" (2026-09-11, pedido do usuário: "quero que tudo
      // que está ali fique visível") não é mais um <details> - vira um <div>
      // com .detail-group-heading no lugar do <summary>. Os outros 5 grupos
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

  // ---- Lista da Dex em lotes (2026-09-24, achado da auditoria de 23/09):
  // reconstruir as 1906 linhas custava ~30ms por busca/filtro; agora só um
  // lote entra e o resto vem com a rolagem/seta pra baixo, sem perder nada:
  // busca e filtro valem pra lista INTEIRA. ----
  const ulLote = document.getElementById("species-list");
  const totalReal = window.__erTest.SPECIES.length;
  check("lista da Dex sem filtro renderiza só um lote, não as " + totalReal + " linhas de uma vez",
    ulLote.querySelectorAll(".species-row").length > 0 && ulLote.querySelectorAll(".species-row").length < totalReal / 4,
    ulLote.querySelectorAll(".species-row").length + " linhas");
  const rowsPrimeiro = ulLote.querySelectorAll(".species-row").length;
  ulLote.scrollTop = ulLote.scrollHeight;
  await wait(80);
  check("rolar até o fim traz mais linhas",
    ulLote.querySelectorAll(".species-row").length > rowsPrimeiro, ulLote.querySelectorAll(".species-row").length + " vs " + rowsPrimeiro);
  let voltasLote = 0;
  while (ulLote.querySelectorAll(".species-row").length < totalReal && voltasLote++ < 60) {
    ulLote.scrollTop = ulLote.scrollHeight;
    await wait(30);
  }
  check("rolando o bastante a lista completa aparece (nenhuma espécie some por causa dos lotes)",
    ulLote.querySelectorAll(".species-row").length === totalReal, ulLote.querySelectorAll(".species-row").length + "/" + totalReal);
  // Busca acha uma espécie que ficaria muito além do primeiro lote.
  const ultimaEspecie = window.__erTest.SPECIES.slice().sort(function (a, b) { return (a.i || 9999) - (b.i || 9999) || a.x - b.x; })[totalReal - 1];
  setSearch(ultimaEspecie.n);
  await wait(150);
  check("busca acha a espécie do fim da lista, fora do primeiro lote",
    [...ulLote.querySelectorAll(".species-row .sname")].some(function (s) { return s.textContent === ultimaEspecie.n; }), ultimaEspecie.n);
  setSearch("");
  await wait(150);
  check("limpar a busca volta a um lote só", ulLote.querySelectorAll(".species-row").length < totalReal / 4,
    ulLote.querySelectorAll(".species-row").length + " linhas");
  // Seta pra baixo na última linha renderizada traz o próximo lote (não trava).
  const antesSeta = ulLote.querySelectorAll(".species-row").length;
  const ultimaLinha = ulLote.querySelectorAll(".species-row")[antesSeta - 1];
  ultimaLinha.classList.add("kbd-active");
  document.body.focus();
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
  await wait(50);
  check("seta pra baixo na última linha renderizada traz o próximo lote e move o cursor",
    ulLote.querySelectorAll(".species-row").length > antesSeta &&
      ulLote.querySelectorAll(".species-row")[antesSeta].classList.contains("kbd-active"),
    ulLote.querySelectorAll(".species-row").length + " vs " + antesSeta);
  ulLote.querySelectorAll(".kbd-active").forEach(function (r) { r.classList.remove("kbd-active"); });
  setSearch("");
  await wait(150);
}
