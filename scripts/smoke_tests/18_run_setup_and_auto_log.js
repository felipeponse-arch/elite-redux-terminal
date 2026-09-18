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
