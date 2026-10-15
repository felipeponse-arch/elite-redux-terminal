// Seção 29 (2026-10-15): a IA ESCOLHE ENTRE os candidatos do pipeline (ticket pipeline-build-2026-10-14/03).
// Clique de verdade no "Gerar build com IA" da ficha e chamada do lote do time; a IA é simulada (window.claude),
// a conferência é a real. O motor, os candidatos e a gravação são os do app.
async function section29() {
  await prepararRunPadrao();
  var T = window.__erTest;
  if (!T) { check("ponte de teste disponível", false); return; }
  var S = T.state;
  var snapshot = JSON.parse(JSON.stringify(T.buildSave()));
  var claudeAntes = window.claude;
  try {
    T.definirEscolhaEntreCandidatos(true);
    T.definirPausasIA([0, 0]);
    T.desligarRevisaoAutomatica(true);
    S.settings.milestone = 1; // próximo líder de ginásio = o 2º ginásio
    var ledian = T.getSpeciesBySname("SPECIES_LEDIAN");
    var typhlosion = T.getSpeciesBySname("SPECIES_TYPHLOSION");
    var centi = T.getSpeciesBySname("SPECIES_CENTISKORCH");
    S.team = [centi, ledian, typhlosion].map(function (s) { return s.x; });
    S.box = [];
    S.customBuilds = {};
    var cands = T.candidatosDeBuild(ledian, {}).candidatos;
    if (!achou("candidatos do Ledian para o teste (pelo menos 2)", cands.length >= 2)) return;

    var prompts = [];
    function ia(respostaDe) {
      prompts = [];
      window.claude = { use: async function (n) { return n === "sample" ? { json: async function (p) { prompts.push(p); return respostaDe(prompts.length); } } : null; } };
    }
    function salvas(sp) { return (T.getBuildList(sp.sname) || []).filter(function (b) { return b.source === "ia"; }); }
    async function clicarGerar(sp) {
      setSearch(sp.n);
      await wait(120);
      var row = document.querySelector('#species-list .species-row[data-x="' + sp.x + '"]');
      if (!achou("linha de " + sp.n + " na busca", row)) return false;
      row.click();
      await wait(60);
      var btn = document.getElementById("mybuild-ai-generate");
      if (!achou("botão Gerar build com IA de " + sp.n, btn)) return false;
      btn.click();
      await pollUntil(function () { return prompts.length >= 1 && salvas(sp).length >= 1; }, 3000);
      await wait(80);
      return true;
    }

    // ---- 1) ficha: a IA escolhe o candidato 2 e ajusta natureza e EVs ----
    ia(function () { return { escolha: 2, nature: "Jolly", item: "", evs: [0, 252, 0, 0, 0, 252], rationale: "teste escolha entre candidatos" }; });
    if (!(await clicarGerar(ledian))) return;
    var b1 = salvas(ledian)[0];
    check("o botão da ficha faz UMA chamada", prompts.length === 1, prompts.length);
    check("o prompt manda os candidatos (e não o movepool nem a ordem de decisão da build do zero)",
      /ENTRE os candidatos/.test(prompts[0] || "") && (prompts[0] || "").indexOf("Movepool real") === -1 && (prompts[0] || "").indexOf("ORDEM DE DECISAO") === -1, (prompts[0] || "").length);
    check("o prompt é bem menor que o da build do zero", (prompts[0] || "").length < T.montarPromptBuild(ledian, {}).length * 0.6, (prompts[0] || "").length + " contra " + T.montarPromptBuild(ledian, {}).length);
    if (achou("build do Ledian salva", b1)) {
      check("a build salva é o candidato 2 (habilidade e golpes dele), com a natureza e a explicação da IA",
        b1.ability === cands[1].habilidade && b1.moves.slice().sort().join("|") === cands[1].golpes.slice().sort().join("|") && b1.nature === "Jolly" && /teste escolha entre candidatos/.test(b1.rationale),
        JSON.stringify(b1).slice(0, 220));
      check("a build sai marcada pra revisão de plano (a IA não viu os golpes futuros)", b1.planoConsultado !== true);
    }

    // ---- 2) ficha: resposta fora dos candidatos cai no melhor do motor, sem outra chamada ----
    S.customBuilds = {};
    ia(function () { return { escolha: 99, ability: "Huge Power", moves: ["Surf", "Fly", "Splash", "Tackle"] }; });
    S.selected = null;
    document.getElementById("back-to-list") && document.getElementById("back-to-list").click();
    await wait(30);
    if (!(await clicarGerar(ledian))) return;
    var b2 = salvas(ledian)[0];
    check("resposta fora dos candidatos NÃO gasta outra chamada", prompts.length === 1, prompts.length);
    if (achou("build do motor salva", b2)) {
      check("cai no melhor candidato do motor (o 1º), sem golpe inventado, e diz isso na explicação",
        b2.ability === cands[0].habilidade && b2.moves.slice().sort().join("|") === cands[0].golpes.slice().sort().join("|") && /Melhor candidato do jogo/.test(b2.rationale),
        JSON.stringify(b2).slice(0, 220));
    }

    // ---- 3) lote do time: uma consulta só, bem menor; cada um confere por conta ----
    S.customBuilds = {};
    var membros = [centi, ledian, typhlosion];
    ia(function () {
      var lote = { builds: {} };
      lote.builds[centi.sname] = { escolha: 1, nature: "Adamant", item: "", evs: [0, 252, 0, 0, 0, 252], rationale: "lote ok" };
      lote.builds[ledian.sname] = { escolha: 77 }; // fora -> motor
      // Typhlosion some da resposta -> motor também (o candidato do ranking), sem outra chamada
      return lote;
    });
    var resultado = await T.gerarBuildsDoTimeComIA(membros, "sem-status", function () { return { timeNovo: true }; }, {}, function () {});
    check("o lote faz UMA consulta para os 3", prompts.length === 1, prompts.length);
    check("o prompt do lote é bem menor que o do lote da build do zero",
      (prompts[0] || "").length < T.montarPromptBuildsDoTime(membros, {}).length * 0.6, (prompts[0] || "").length + " contra " + T.montarPromptBuildsDoTime(membros, {}).length);
    check("os 3 ganharam build (quem a IA errou ou omitiu cai no melhor do motor)", membros.every(function (s) { return salvas(s).length === 1; }),
      membros.map(function (s) { return s.n + ":" + salvas(s).length; }));
    check("o resultado do lote marca os 3 como gravados", membros.every(function (s) { return resultado[s.sname] === true; }), JSON.stringify(resultado));
    var bc = salvas(centi)[0];
    var candC = T.candidatosDeBuild(centi, {}).candidatos[0];
    check("o Centiskorch ficou com o candidato 1 (Coil Up) escolhido pela IA", !!bc && bc.ability === candC.habilidade && /lote ok/.test(bc.rationale), bc && JSON.stringify(bc).slice(0, 160));

    // ---- 4) sem chefão adiante: segue o caminho antigo (prompt da build do zero) ----
    S.customBuilds = {};
    S.settings.milestone = 9;
    ia(function () { return { ability: "Nada", moves: [] }; });
    await T.generateBuildWithAI(ledian, "sem-status", {});
    check("sem chefão adiante, o botão usa o prompt da build do zero", /Movepool real/.test(prompts[0] || "") && !/ENTRE os candidatos/.test(prompts[0] || ""), (prompts[0] || "").slice(0, 120));
  } finally {
    T.definirEscolhaEntreCandidatos(true);
    T.definirPausasIA([4000, 10000]);
    T.desligarRevisaoAutomatica(false);
    if (claudeAntes === undefined) delete window.claude; else window.claude = claudeAntes;
    T.applySave(snapshot);
    S.selected = null;
  }
}
