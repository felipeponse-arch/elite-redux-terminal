// Seção 18 (2026-09-16, Etapa 3 da pauta): Level Cap separado da Dificuldade,
// conferência da run (U1) e registro do que o app fez sozinho (U4).
// Tudo que a seção muda (seletores, confirmação, caixa) é restaurado no fim.
async function section18() {
  await prepararRunPadrao();
  var T = window.__erTest;
  if (!T) { check("ponte de teste disponível", false); return; }
  var banner = document.getElementById("run-setup-banner");
  var originais = {
    runConfirmedAt: T.state.settings.runConfirmedAt,
    milestone: T.state.settings.milestone,
    box: T.state.box.slice()
  };

  // ---- U1: aviso de conferência ----
  check("aviso de conferência aparece só enquanto a run não foi confirmada",
    !!banner && banner.hidden === !!T.state.settings.runConfirmedAt, "hidden=" + (banner && banner.hidden));
  if (banner) banner.hidden = false;
  document.getElementById("run-setup-open").click();
  await wait(50);
  check("\"Conferir\" abre o Progresso e esconde o aviso",
    document.getElementById("view-progress").classList.contains("active") && banner.hidden);

  var diff = document.getElementById("settings-difficulty");
  var capSel = document.getElementById("settings-level-cap");
  var ms = document.getElementById("settings-milestone");
  function escolher(el, v) { el.value = String(v); el.dispatchEvent(new Event("change", { bubbles: true })); }

  // ---- Level Cap x Dificuldade ----
  escolher(ms, 0);
  escolher(capSel, "elite");
  escolher(diff, "easy");
  await wait(30);
  check("Level Cap Elite + Dificuldade Easy dá o cap da coluna Elite (16)",
    T.getCurrentCap() === 16 && document.getElementById("cap-display").textContent.indexOf("16") !== -1,
    document.getElementById("cap-display").textContent);
  escolher(diff, "elite");
  await wait(30);
  check("trocar só a Dificuldade não muda o level cap", T.getCurrentCap() === 16, String(T.getCurrentCap()));
  escolher(capSel, "more");
  await wait(30);
  check("trocar o Level Cap pra More muda o cap (18)", T.getCurrentCap() === 18, String(T.getCurrentCap()));

  // ---- Trilha visual da jornada (redesign 2026-09-18) - deriva de
  // LEVELCAPS/state.settings.milestone, tem que acompanhar o <select>
  // #settings-milestone nos dois sentidos (ela nunca escreve estado). ----
  var trailNodes = document.querySelectorAll("#progress-trail .trail-node");
  check("trilha renderiza 1 nó por linha de LEVELCAPS.rows",
    trailNodes.length === T.LEVELCAPS.rows.length, trailNodes.length + " vs " + T.LEVELCAPS.rows.length);
  escolher(ms, 0);
  await wait(30);
  trailNodes = document.querySelectorAll("#progress-trail .trail-node");
  check("milestone 0: nó 0 é 'active', o resto 'locked' (nenhum 'done' ainda)",
    trailNodes[0].querySelector(".trail-dot").classList.contains("active") &&
    trailNodes[1].querySelector(".trail-dot").classList.contains("locked") &&
    document.querySelectorAll("#progress-trail .trail-dot.done").length === 0);
  escolher(ms, 3);
  await wait(30);
  trailNodes = document.querySelectorAll("#progress-trail .trail-node");
  check("milestone 3: nós 0-2 viram 'done', nó 3 é 'active', dali pra frente 'locked'",
    trailNodes[0].querySelector(".trail-dot").classList.contains("done") &&
    trailNodes[2].querySelector(".trail-dot").classList.contains("done") &&
    trailNodes[3].querySelector(".trail-dot").classList.contains("active") &&
    trailNodes[4].querySelector(".trail-dot").classList.contains("locked"),
    trailNodes[3].querySelector(".trail-dot").className);
  check("rótulo do nó ativo usa o texto real de LEVELCAPS.rows (nunca inventado)",
    trailNodes[3].querySelector(".trail-label").textContent.trim() === T.LEVELCAPS.rows[3].milestone,
    trailNodes[3].querySelector(".trail-label").textContent);

  document.querySelector('#tabs-more-panel [data-tab="types"]').click();
  await wait(50);
  var cabecalho = document.querySelector("#levelcap-table thead");
  check("tabela de level caps usa as colunas do jogo (Easy/More/Elite)",
    !!cabecalho && /Easy[\s\S]*More[\s\S]*Elite/.test(cabecalho.textContent), cabecalho ? cabecalho.textContent : "(sem tabela)");

  // ---- Speed tiers (referência do Smogon "SV OU Speed Tiers", pedido do
  // usuário 2026-09-18) - velocidade calculada no level cap ATUAL, não
  // nível 100 fixo como lá. Confere geometria real (ordenação/contagem) E
  // que o número bate exatamente com calcFinalStat - nunca confia só na
  // presença do texto na tela. ----
  var speedRows = document.querySelectorAll("#speedtier-table tbody tr");
  check("tabela de Speed tiers renderiza 1 linha por espécie real", speedRows.length === T.SPECIES.length, speedRows.length + " vs " + T.SPECIES.length);
  var stResult = T.computeSpeedTiers("");
  check("Speed tiers vem ordenada por 'Investido' decrescente (o mais rápido primeiro)",
    stResult.rows.every(function (r, i) { return i === 0 || stResult.rows[i - 1].invested >= r.invested; }));
  var fastest = stResult.rows[0];
  var expectedInvested = T.calcFinalStat(fastest.base, 31, 252, stResult.level, 5, "Jolly", null, fastest.sp.n);
  check("o número 'Investido' do mais rápido bate exatamente com calcFinalStat (mesma fórmula de 'Meu build'/chefão)",
    fastest.invested === expectedInvested, fastest.invested + " vs " + expectedInvested);
  var expectedScarf = T.calcFinalStat(fastest.base, 31, 252, stResult.level, 5, "Jolly", "Choice Scarf", fastest.sp.n);
  check("'+ Choice Scarf' empilha 1.5x em cima do investido (não é o mesmo número)",
    fastest.scarf === expectedScarf && fastest.scarf > fastest.invested, { scarf: fastest.scarf, invested: fastest.invested });
  // debounce de 80ms adicionado em auditoria (2026-09-18) - pollUntil em
  // vez de wait(ms) fixo, exatamente a convenção documentada no mesmo dia
  // (00_helpers.js), pra não travar num número mágico maior que o debounce.
  var stSearch = document.getElementById("speedtier-search");
  stSearch.value = "Ninjask";
  stSearch.dispatchEvent(new Event("input", { bubbles: true }));
  await pollUntil(function () { return document.querySelectorAll("#speedtier-table tbody tr").length <= 1; }, 500);
  var filteredRows = document.querySelectorAll("#speedtier-table tbody tr");
  check("busca da tabela de Speed tiers filtra por nome (1 resultado pra 'Ninjask')",
    filteredRows.length === 1 && filteredRows[0].textContent.indexOf("Ninjask") !== -1, filteredRows.length);
  stSearch.value = "";
  stSearch.dispatchEvent(new Event("input", { bubbles: true }));
  await pollUntil(function () { return document.querySelectorAll("#speedtier-table tbody tr").length > 1; }, 500);

  // ---- Glossário de papéis (referência do Smogon "SV OU Role
  // Compendium") - os 4 papéis reais já calculados por
  // compute_species_role.ps1 (Pivô/Tanque/Wallbreaker/Sweeper), nunca uma
  // lista nova. Confere que CADA exemplo mostrado realmente tem aquele
  // papel em SPECIES_ROLE - nunca confia só no card ter renderizado algo. ----
  var roleCards = [...document.querySelectorAll("#role-compendium .card")];
  check("glossário de papéis renderiza os 4 papéis reais (Pivô/Tanque/Wallbreaker/Sweeper)", roleCards.length === 4, roleCards.length);
  var roleGroups = T.computeRoleCompendium();
  check("todo exemplo mostrado em cada papel realmente tem esse papel em SPECIES_ROLE (nunca um exemplo fora do critério)",
    roleGroups.every(function (g) {
      return g.examples.every(function (ex) {
        var real = T.SPECIES_ROLE[ex.sp.sname];
        return real && real.roles.indexOf(g.role) !== -1;
      });
    }));
  check("a contagem no título de cada papel bate com quantas espécies reais têm aquele papel",
    roleGroups.every(function (g) {
      var realCount = T.SPECIES.filter(function (sp) {
        var r = T.SPECIES_ROLE[sp.sname];
        return r && r.roles.indexOf(g.role) !== -1;
      }).length;
      return realCount === g.total;
    }), roleGroups.map(function (g) { return g.role + ":" + g.total; }));
  var firstChip = document.querySelector("#role-compendium .role-chip");
  if (achou("pelo menos 1 chip de exemplo no glossário de papéis", firstChip)) {
    var chipName = firstChip.querySelector(".goto-species") ? firstChip.querySelector(".goto-species").textContent : firstChip.textContent;
    firstChip.click();
    await wait(50);
    check("clicar num chip do glossário de papéis navega pra ficha real dele na Dex",
      document.querySelector('.tab-btn[data-tab="dex"]').classList.contains("active") &&
      document.querySelector(".detail-titles h2") && chipName.indexOf(document.querySelector(".detail-titles h2").textContent) !== -1,
      document.querySelector(".detail-titles h2") && document.querySelector(".detail-titles h2").textContent);
    document.getElementById("back-to-list") && document.getElementById("back-to-list").click();
    await wait(30);
  }

  // ---- Destaque de arquétipo Monotype no Glossário de Papéis e Speed
  // Tiers (achado em auditoria, 2026-09-18, item 18) - antes as duas
  // referências eram cegas ao arquétipo escolhido. Confere que o destaque
  // aparece SÓ nas espécies do tipo certo (nunca a mais, nunca a menos) -
  // recalculado de forma independente, não só "apareceu alguma marcação". ----
  var tipoMonotype = T.MONOTYPE_ARCHETYPES[0];
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);
  selecionarArquetipo("monotype", tipoMonotype);
  await wait(30);
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  document.querySelector('#tabs-more-panel [data-tab="types"]').click();
  await wait(50);

  var roleGroupsComArquetipo = T.computeRoleCompendium();
  check("computeRoleCompendium sinaliza \"combina\" só pra espécies do Monotype ativo (nunca a mais/menos)",
    roleGroupsComArquetipo.every(function (g) {
      return g.examples.every(function (ex) {
        var combinaEsperado = T.speciesTypeNames(ex.sp).indexOf(tipoMonotype) !== -1;
        return ex.combina === combinaEsperado;
      });
    }), roleGroupsComArquetipo.map(function (g) { return g.role + ":" + g.examples.map(function (e) { return e.sp.n + "=" + e.combina; }).join(","); }));
  var chipsDestacados = document.querySelectorAll("#role-compendium .role-chip-match");
  var todosExemplosQueCombinam = roleGroupsComArquetipo.reduce(function (a, g) { return a + g.examples.filter(function (e) { return e.combina; }).length; }, 0);
  check("a quantidade de chips destacados na tela bate com o recálculo independente",
    chipsDestacados.length === todosExemplosQueCombinam, chipsDestacados.length + " vs " + todosExemplosQueCombinam);

  var linhasDestacadas = document.querySelectorAll("#speedtier-table tbody tr.speedtier-row-match");
  var todasAsLinhas = document.querySelectorAll("#speedtier-table tbody tr");
  var esperadoLinhasDestacadas = [...todasAsLinhas].filter(function (tr) {
    var nome = tr.querySelector(".goto-species").textContent;
    var sp = T.SPECIES.find(function (s) { return s.n === nome; });
    return sp && T.speciesTypeNames(sp).indexOf(tipoMonotype) !== -1;
  }).length;
  check("Speed Tiers destaca as linhas certas pro Monotype ativo (recalculado de forma independente)",
    linhasDestacadas.length === esperadoLinhasDestacadas && esperadoLinhasDestacadas > 0,
    linhasDestacadas.length + " vs " + esperadoLinhasDestacadas + " esperadas (de " + todasAsLinhas.length + " linhas)");

  // ---- Rank relativo por Monotype (achado real, pesquisa Smogon 2026-09-21:
  // "Pokemon are ranked separately for each type" - o próprio formato
  // Monotype do Smogon ranqueia cada espécie por tipo, não com um número só.
  // Confere que a badge aparece SÓ na ficha de espécie que tem o tipo ativo,
  // com o tier certo (cross-checado contra SPECIES_RANK direto), some quando
  // a espécie não tem esse tipo, e some de vez quando o Monotype é limpo. ----
  var especieComTipo = T.SPECIES.find(function (s) {
    return s && T.speciesTypeNames(s).indexOf(tipoMonotype) !== -1 &&
      T.SPECIES_RANK[s.sname] && T.SPECIES_RANK[s.sname].monoRanks && T.SPECIES_RANK[s.sname].monoRanks[tipoMonotype];
  });
  var especieSemTipo = T.SPECIES.find(function (s) {
    return s && T.speciesTypeNames(s).indexOf(tipoMonotype) === -1;
  });
  if (achou("espécie real com o tipo Monotype ativo e monoRanks calculado", especieComTipo) &&
      achou("espécie real sem o tipo Monotype ativo", especieSemTipo)) {
    setSearch(especieComTipo.n);
    await wait(120);
    var rowComTipo = document.querySelector("#species-list .species-row");
    if (rowComTipo) { rowComTipo.click(); await wait(30); }
    var badgeMono = document.querySelector(".rank-badge-mono");
    var tierEsperado = T.SPECIES_RANK[especieComTipo.sname].monoRanks[tipoMonotype].tier;
    check("badge de rank Monotype aparece na ficha de uma espécie do tipo ativo, com o tier certo",
      !!badgeMono && badgeMono.textContent.trim() === tierEsperado,
      { achado: badgeMono && badgeMono.textContent, esperado: tierEsperado, especie: especieComTipo.n });
    document.getElementById("back-to-list").click();
    await wait(30);

    setSearch(especieSemTipo.n);
    await wait(120);
    var rowSemTipo = document.querySelector("#species-list .species-row");
    if (rowSemTipo) { rowSemTipo.click(); await wait(30); }
    check("badge de rank Monotype NÃO aparece na ficha de uma espécie sem o tipo ativo",
      !document.querySelector(".rank-badge-mono"));
    document.getElementById("back-to-list").click();
    await wait(30);
    setSearch("");
    await wait(30);
  } else {
    check("pré-condição da checagem de rank Monotype (fixtures reais achadas)", false);
  }

  // limpa o arquétipo pra não vazar estado pras seções seguintes
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(30);
  selecionarArquetipo("monotype", "");
  await wait(30);
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  // Badge de rank Monotype some de vez quando o arquétipo é limpo, mesmo na
  // MESMA espécie que mostrava antes (não é só "nunca apareceu").
  if (especieComTipo) {
    setSearch(especieComTipo.n);
    await wait(120);
    var rowDepoisDeLimpar = document.querySelector("#species-list .species-row");
    if (rowDepoisDeLimpar) { rowDepoisDeLimpar.click(); await wait(30); }
    check("badge de rank Monotype some depois de limpar o arquétipo (mesma espécie que mostrava antes)",
      !document.querySelector(".rank-badge-mono"));
    document.getElementById("back-to-list").click();
    await wait(30);
    setSearch("");
    await wait(30);
  }

  // ---- Nota de combo autossuficiente habilidade-condicional x golpe
  // (pedido do usuário, 2026-09-23: "com tudo que aprendemos, temos
  // oportunidade de colocar algo de novo no que já temos hoje") - a ficha da
  // espécie mostra a nota quando existe combo real (CONDITION_MOVE_SYNERGY),
  // some quando não existe, e a mesma ferramenta que a IA usa
  // (getConditionMoveSynergy) devolve o mesmo dado. ----
  var especieComCombo = T.SPECIES.find(function (s) {
    return s && s.sname && T.CONDITION_MOVE_SYNERGY[s.sname] && T.CONDITION_MOVE_SYNERGY[s.sname].length;
  });
  var especieSemCombo = T.SPECIES.find(function (s) {
    return s && s.sname && !T.CONDITION_MOVE_SYNERGY[s.sname];
  });
  if (achou("espécie real com combo autossuficiente condicional", especieComCombo) &&
      achou("espécie real sem combo autossuficiente condicional", especieSemCombo)) {
    var hit = T.CONDITION_MOVE_SYNERGY[especieComCombo.sname][0];
    setSearch(especieComCombo.n);
    await wait(120);
    var rowCombo = document.querySelector("#species-list .species-row");
    if (rowCombo) { rowCombo.click(); await wait(30); }
    var notaCombo = document.querySelector(".ts-build-note");
    check("ficha da espécie com combo real mostra a nota, citando a habilidade e o golpe",
      !!notaCombo && notaCombo.textContent.indexOf("Combo autossuficiente") !== -1 &&
        notaCombo.textContent.indexOf(hit.habilidade) !== -1 && notaCombo.textContent.indexOf(hit.golpes[0]) !== -1,
      { especie: especieComCombo.n, hit: hit, nota: notaCombo && notaCombo.textContent });
    document.getElementById("back-to-list").click();
    await wait(30);

    setSearch(especieSemCombo.n);
    await wait(120);
    var rowSemCombo = document.querySelector("#species-list .species-row");
    if (rowSemCombo) { rowSemCombo.click(); await wait(30); }
    check("ficha da espécie sem combo real não mostra a nota de combo autossuficiente",
      [].slice.call(document.querySelectorAll(".ts-build-note")).every(function (n) { return n.textContent.indexOf("Combo autossuficiente") === -1; }));
    document.getElementById("back-to-list").click();
    await wait(30);
    setSearch("");
    await wait(30);

    var toolResult = T.aiTool_getConditionMoveSynergy({ sname: especieComCombo.sname });
    check("ferramenta de IA getConditionMoveSynergy devolve o mesmo combo real mostrado na ficha",
      toolResult.combos.length === T.CONDITION_MOVE_SYNERGY[especieComCombo.sname].length &&
        toolResult.combos[0].ability === hit.habilidade,
      toolResult);
  } else {
    check("pré-condição da checagem de combo autossuficiente (fixtures reais achadas)", false);
  }

  document.querySelector('#tabs-more-panel [data-tab="progress"]').click();
  await wait(30);
  escolher(diff, "ace");

  // ---- U1: confirmação ----
  document.getElementById("settings-run-confirm").click();
  await wait(30);
  var salvo = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
  check("confirmar grava a data no save",
    typeof T.state.settings.runConfirmedAt === "string" && salvo.settings && salvo.settings.runConfirmedAt === T.state.settings.runConfirmedAt);
  check("status mostra que a run foi confirmada",
    document.getElementById("settings-run-status").textContent.indexOf("Confirmado") !== -1,
    document.getElementById("settings-run-status").textContent);

  // ---- U4: registro do que o app fez sozinho ----
  var charmander = T.getSpeciesBySname("SPECIES_CHARMANDER");
  if (achou("Charmander no dado", charmander)) {
    escolher(ms, 0); // cap 18 com More: Charmander (evolui no 16) evolui sozinho
    T.state.box = T.state.box.filter(function (x) { return x !== charmander.x; });
    T.state.box.push(charmander.x);
    var antes = T.state.autoLog.length;
    escolher(capSel, "elite"); // 16: ainda evolui
    escolher(capSel, "more");
    await wait(50);
    var log = T.state.autoLog;
    check("evolução automática entra no registro", log.length > 0 && /Charm/.test(log[0].text), log.length ? log[0].text : "(vazio)");
    check("registro aparece no Progresso",
      document.querySelectorAll("#auto-log-list li time").length > 0 && document.getElementById("auto-log-list").textContent.indexOf("Charm") !== -1);
    salvo = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
    check("registro vai pro save", Array.isArray(salvo.autoLog) && salvo.autoLog.length >= Math.min(antes + 1, 30));
  }

  // ---- ordem da próxima luta (bug achado junto do P4) ----
  var msAntes = T.state.settings.milestone;
  T.state.settings.milestone = 0;
  var prox0 = T.getRemainingBossEntries()[0];
  T.state.settings.milestone = 8;
  var prox8 = T.getRemainingBossEntries()[0];
  T.state.settings.milestone = 7;
  var lista7 = T.getRemainingBossEntries();
  T.state.settings.milestone = msAntes;
  check("sem badge, a próxima luta é Roxanne (não o Alto Comando)", !!prox0 && /^Roxanne/.test(prox0.name), prox0 && prox0.name);
  check("com os 8 badges, a próxima luta é o Alto Comando", !!prox8 && prox8.cat === "Alto Comando", prox8 && prox8.name);
  check("com 7 badges: 8º ginásio, depois Alto Comando, Campeão por último",
    lista7.length >= 3 && /^(Juan|Wallace)/.test(lista7[0].name) && lista7[1].cat === "Alto Comando" && lista7[lista7.length - 1].cat === "Campeao",
    lista7.map(function (b) { return b.name; }).join(", "));

  // ---- P4: velocidade base contra a próxima luta ----
  var rapido = T.getSpeciesBySname("SPECIES_JOLTEON"), lento = T.getSpeciesBySname("SPECIES_SNORLAX"), medio = T.getSpeciesBySname("SPECIES_PIKACHU");
  if (achou("Jolteon, Snorlax e Pikachu no dado", rapido && lento && medio)) {
    var chefeFalso = { party: [{ x: rapido.x }, { x: lento.x }, { x: medio.x }, { x: 999999 }] };
    var r = T.bossSpeedSummary(chefeFalso, [lento, medio]);
    var esperadoMaior = [rapido, lento, medio].filter(function (s) { return s.b[5] > medio.b[5]; }).length;
    check("velocidade: compara com o mais rápido do time e ignora membro do chefão sem espécie",
      !!r && r.fastest === medio && r.total === 3 && r.faster === esperadoMaior && r.tied === [rapido, lento, medio].filter(function (s) { return s.b[5] === medio.b[5]; }).length,JSON.stringify(r && { f: r.fastest.n, t: r.total, m: r.faster, e: r.tied }));
    check("velocidade: sem time não há comparação", T.bossSpeedSummary(chefeFalso, []) === null);
  }
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(50);
  var dashVel = document.querySelector("#dashboard .dash-speed");
  check("dashboard mostra a linha de velocidade com o aviso de que é só base",
    !dashVel || dashVel.textContent.indexOf("Só base") !== -1, dashVel ? dashVel.textContent : "(sem próxima luta no marco atual)");

  // restaura
  T.state.box = originais.box;
  T.state.settings.runConfirmedAt = originais.runConfirmedAt;
  escolher(capSel, "more");
  escolher(ms, originais.milestone);
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
}
