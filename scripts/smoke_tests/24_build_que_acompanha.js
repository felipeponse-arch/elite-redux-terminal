// Seção 24 - build que acompanha o jogador (pedido do usuário, 2026-09-24):
// plano de golpes derivado pelo level cap, Mega herdando a build da base, curada
// escolhida pelo estilo do time, fila de revisão automática (com a IA simulada) e
// as correções da base (build não some na evolução, volta de forma restaura a
// build, campos novos sobrevivem ao save). Roda no app de verdade
// (window.__erTest) e SEMPRE devolve o estado como estava (try/finally).
async function section24() {
  const TE = window.__erTest;
  const S = TE.state;
  const snapshot = JSON.parse(JSON.stringify(TE.buildSave()));
  const logAntes = S.autoLog.slice();
  const claudeAntes = window.claude;
  const nome = (id) => TE.MOVES[id][0];
  const capNoMarco = (m) => { S.settings.milestone = m; return TE.getCurrentCap(); };
  const build = (extra) => Object.assign({ ability: "", nature: "Jolly", item: "", moves: [], ivs: [31, 31, 31, 31, 31, 31], evs: [0, 0, 0, 0, 0, 0], source: "manual", active: true, savedAt: "x", rationale: "" }, extra);
  try {
    // ---- (a) evolução com build no destino: nada se perde, a da criatura segue ativa ----
    S.customBuilds = {
      SPECIES_FRAXURE: [build({ ability: "Moxie", moves: ["Dragon Claw"] })],
      SPECIES_HAXORUS: [build({ ability: "Mold Breaker", moves: ["Outrage"] })]
    };
    S.autoLog = [];
    TE.carryUserData("SPECIES_FRAXURE", "SPECIES_HAXORUS");
    const lista = S.customBuilds.SPECIES_HAXORUS;
    check("evolução com build no destino: a build da criatura chega ATIVA e a que já existia fica salva (antes era apagada)",
      lista.length === 2 && !lista[0].active && lista[0].moves[0] === "Outrage" && lista[1].active && lista[1].moves[0] === "Dragon Claw" && !S.customBuilds.SPECIES_FRAXURE,
      lista.map((b) => b.moves.join("/") + (b.active ? "*" : "")));
    check("a troca de build ativa vai pro log", S.autoLog.some((e) => e.text.indexOf("continua ativa em Haxorus") !== -1), S.autoLog.map((e) => e.text));
    S.customBuilds.SPECIES_HAXORUS = [1, 2, 3].map((i) => build({ ability: "Mold Breaker", moves: ["Outrage"], active: i === 1 }));
    S.customBuilds.SPECIES_FRAXURE = [build({ ability: "Moxie", moves: ["Dragon Claw"] })];
    TE.carryUserData("SPECIES_FRAXURE", "SPECIES_HAXORUS");
    check("destino já com 3 builds: a que não cabe fica na origem, nada se perde",
      S.customBuilds.SPECIES_HAXORUS.length === 3 && S.customBuilds.SPECIES_FRAXURE && S.customBuilds.SPECIES_FRAXURE[0].moves[0] === "Dragon Claw");

    // ---- (b) ida e volta de forma restaura a build; pilha de 2 etapas ----
    S.customBuilds = { SPECIES_FRAXURE: [build({ ability: "Moxie", moves: ["Dragon Claw", "Earthquake"], evs: [0, 252, 0, 0, 0, 252], source: "ia", rationale: "Moxie acumula" })] };
    TE.carryUserData("SPECIES_FRAXURE", "SPECIES_HAXORUS");
    const hax = S.customBuilds.SPECIES_HAXORUS[0];
    check("na evolução, a build ajustada guarda a versão anterior", hax.ability !== "Moxie" && hax.anterior && hax.anterior.sname === "SPECIES_FRAXURE" && hax.anterior.ability === "Moxie", hax.anterior);
    check("evolução pra frente marca a build pra revisão automática", hax.revisar === "evolucao" && hax.revisadaDe === "Fraxure", hax.revisar);
    TE.carryUserData("SPECIES_HAXORUS", "SPECIES_FRAXURE");
    const volta = S.customBuilds.SPECIES_FRAXURE && S.customBuilds.SPECIES_FRAXURE[0];
    check("cap desceu e a criatura voltou: a build original volta inteira e sem revisão pendente",
      volta && volta.ability === "Moxie" && volta.moves.join(",") === "Dragon Claw,Earthquake" && volta.rationale === "Moxie acumula" && !volta.anterior && !volta.revisar, volta);
    const axew = TE.getSpeciesBySname("SPECIES_AXEW");
    const habAxew = TE.uniqueIds(axew.ab).map((id) => TE.ABILITIES[id][0]).filter((h) => h !== "Moxie").pop();
    S.customBuilds = { SPECIES_HAXORUS: [build({ ability: "Mold Breaker", moves: ["Outrage"], revisar: "evolucao", revisadaDe: "Fraxure",
      anterior: { sname: "SPECIES_FRAXURE", ability: "Moxie", moves: ["Outrage"], rationale: "", anterior: { sname: "SPECIES_AXEW", ability: habAxew, moves: ["Outrage"], rationale: "" } } })] };
    TE.carryUserData("SPECIES_HAXORUS", "SPECIES_FRAXURE");
    const f1 = S.customBuilds.SPECIES_FRAXURE[0];
    check("regressão de 2 etapas, 1º passo: volta a versão do Fraxure e a do Axew continua guardada",
      f1.ability === "Moxie" && f1.anterior && f1.anterior.sname === "SPECIES_AXEW" && !f1.revisar, f1);
    TE.carryUserData("SPECIES_FRAXURE", "SPECIES_AXEW");
    check("regressão de 2 etapas, 2º passo: volta a versão do Axew", S.customBuilds.SPECIES_AXEW[0].ability === habAxew, S.customBuilds.SPECIES_AXEW[0]);
    S.customBuilds = { SPECIES_HAXORUS: [build({ ability: "Mold Breaker", moves: ["Outrage"], revisar: "evolucao", revisadaDe: "Fraxure", tentativasRevisao: 1 })] };
    TE.carryUserData("SPECIES_HAXORUS", "SPECIES_FRAXURE");
    const semAnt = S.customBuilds.SPECIES_FRAXURE[0];
    check("regressão sem versão guardada: a marca de revisão da evolução sai (não gasta IA à toa)", !semAnt.revisar && !semAnt.revisadaDe && semAnt.tentativasRevisao === undefined, semAnt);

    // ---- plano de golpes derivado pelo cap ----
    let fx = null;
    for (const sp of TE.SPECIES) {
      if (sp.tu.length < 2) continue;
      const fut = TE.golpesFuturosDe(sp, 18);
      if (fut.length) { fx = { sp, fut: fut[0], t1: nome(sp.tu[0]), t2: nome(sp.tu[1]) }; break; }
    }
    if (achou("espécie com golpe futuro e 2 de tutor (fixture do plano)", fx)) {
      let mAntes = null, mDepois = null;
      for (let m = 0; m < 10; m++) {
        const c = capNoMarco(m);
        if (c !== null && c < fx.fut.nivel && mAntes === null) mAntes = m;
        if ((c === null || c >= fx.fut.nivel) && mDepois === null) mDepois = m;
      }
      S.customBuilds = {};
      S.customBuilds[fx.sp.sname] = [build({ moves: [fx.t1, fx.t2], source: "ia", plano: { [fx.t1]: fx.fut.nome } })];
      const capA = capNoMarco(mAntes);
      const antes = TE.effectiveBuild(fx.sp);
      check("antes do nível: o time mostra o golpe de agora e a troca como próxima",
        antes.moves[0] === fx.t1 && antes.pendentes.length === 1 && TE.planoDaBuildHtml(antes).indexOf("Próximas trocas") !== -1, antes.moves);
      const capB = capNoMarco(mDepois);
      const depois = TE.effectiveBuild(fx.sp);
      check("cap liberou o golpe: ele entra sozinho no slot planejado", depois.moves[0] === fx.fut.nome && depois.trocas.length === 1, depois.moves);
      check("o que está salvo nunca é regravado (cap voltando desfaz a troca)", S.customBuilds[fx.sp.sname][0].moves[0] === fx.t1);
      const timeAntes = S.team;
      S.team = [fx.sp.x];
      S.autoLog = [];
      const houve = TE.registrarTrocasDoPlano(capA, capB);
      check("subida de cap registra a troca em \"O que o app fez sozinho\"",
        houve && S.autoLog.some((e) => e.text.indexOf(fx.fut.nome + " entrou no lugar de " + fx.t1) !== -1), S.autoLog[0] && S.autoLog[0].text);
      S.autoLog = [];
      TE.registrarTrocasDoPlano(capB, capA);
      check("descida de cap registra a volta do golpe", S.autoLog.some((e) => e.text.indexOf(fx.t1 + " voltou") !== -1), S.autoLog[0] && S.autoLog[0].text);
      S.team = timeAntes;

      // curada com plano (promovida pelo Playtester) também segue o cap
      const curAntes = TE.BUILDS[fx.sp.sname];
      TE.BUILDS[fx.sp.sname] = { ability: "", nature: "Jolly", evs: "252 Atk / 4 SpD / 252 Spe", item: "", moves: [fx.t1, fx.t2], plano: { [fx.t1]: fx.fut.nome }, fonte: "ia-curada-playtester", versao: "x", estilo: "ofensivo" };
      S.customBuilds = {};
      try {
        capNoMarco(mDepois);
        const bc = TE.effectiveBuild(fx.sp);
        check("curada com plano troca o golpe quando o cap libera", bc.origem === "curada" && bc.moves[0] === fx.fut.nome && TE.rotuloDaBuild(bc) === "Build curada (Ofensivo)", bc.moves);
      } finally {
        if (curAntes === undefined) delete TE.BUILDS[fx.sp.sname]; else TE.BUILDS[fx.sp.sname] = curAntes;
      }

      // editar a build: plano dos golpes que ficam continua; plano já consultado não pede de novo
      capNoMarco(mAntes);
      S.customBuilds[fx.sp.sname] = [build({ moves: [fx.t1, fx.t2], source: "ia", plano: { [fx.t1]: fx.fut.nome }, planoConsultado: true })];
      TE.setOrReplaceActiveBuild(fx.sp.sname, build({ nature: "Adamant", moves: [fx.t1, fx.t2] }), "manual");
      const editada = TE.getActiveBuild(fx.sp.sname);
      check("editar a build à mão mantém a troca planejada do golpe que continua", editada.plano && editada.plano[fx.t1] === fx.fut.nome && !editada.revisar, editada.plano);
      S.customBuilds[fx.sp.sname] = [build({ moves: [fx.t1, fx.t2], planoConsultado: true })];
      TE.setOrReplaceActiveBuild(fx.sp.sname, build({ nature: "Modest", moves: [fx.t2, fx.t1] }), "manual");
      check("mudar só natureza/EV de build cujo plano já foi consultado não pede plano de novo (custo)",
        !TE.getActiveBuild(fx.sp.sname).revisar && TE.getActiveBuild(fx.sp.sname).planoConsultado === true, TE.getActiveBuild(fx.sp.sname));
      TE.setOrReplaceActiveBuild(fx.sp.sname, build({ moves: [fx.t2] }), "manual");
      const semPlano = TE.getActiveBuild(fx.sp.sname);
      check("golpes mudaram e há golpe por liberar: a build fica marcada pra pedir só o plano", !semPlano.plano && semPlano.revisar === "plano", semPlano);

      // prompt e validação do plano vindo da IA
      const bloco = TE.planoPromptBlock(fx.sp, capA);
      check("o prompt da IA lista os golpes futuros com o nível", bloco.indexOf(fx.fut.nome) !== -1 && bloco.indexOf("nivel " + fx.fut.nivel) !== -1);
      const val = { moves: [fx.t1, fx.t2] };
      const r = TE.anexarPlanoDaIa(fx.sp, val, { [fx.t1]: fx.fut.nome, [fx.t2]: "Golpe Inventado" }, capA, null);
      check("plano da IA: passo válido entra, inventado sai com motivo", val.plano && val.plano[fx.t1] === fx.fut.nome && !val.plano[fx.t2] && r.descartados.length === 1, r.descartados);

      // sanitizador do save
      const fake = JSON.parse(JSON.stringify(snapshot));
      fake.customBuilds = {};
      fake.customBuilds[fx.sp.sname] = [build({ moves: [fx.t1, fx.t2], source: "curada", plano: { [fx.t1]: fx.fut.nome, "Fora da Build": "X", [fx.t2]: 7 },
        revisar: "evolucao", revisadaDe: "Algo", tentativasRevisao: 1, planoConsultado: true, lixo: "<script>",
        anterior: { sname: "SPECIES_X", ability: "A", moves: ["M1", 5], rationale: "r", anterior: { sname: "S2", moves: [], anterior: { sname: "S3", moves: [], anterior: { sname: "S4", moves: [] } } } } })];
      TE.applySave(fake);
      const b = S.customBuilds[fx.sp.sname] && S.customBuilds[fx.sp.sname][0];
      check("save: plano, pilha de versões (até 3), revisão e origem 'curada' sobrevivem; o que não tem formato certo sai",
        b && b.source === "curada" && JSON.stringify(b.plano) === JSON.stringify({ [fx.t1]: fx.fut.nome }) && b.revisar === "evolucao" && b.revisadaDe === "Algo" &&
          b.tentativasRevisao === 1 && b.planoConsultado === true && b.anterior && b.anterior.moves.join(",") === "M1" &&
          b.anterior.anterior.anterior && !b.anterior.anterior.anterior.anterior && b.lixo === undefined, b);
    }

    // ---- Mega herda a build da base e não entra na fila ----
    const chari = TE.getSpeciesBySname("SPECIES_CHARIZARD");
    const megaX = TE.getSpeciesBySname("SPECIES_CHARIZARD_MEGA_X");
    if (achou("Charizard e Charizard Mega X", chari && megaX)) {
      const golpes = chari.tu.slice(0, 4).map(nome);
      const habBase = TE.ABILITIES[TE.uniqueIds(chari.ab)[0]][0];
      S.customBuilds = { SPECIES_CHARIZARD: [build({ ability: habBase, nature: "Timid", moves: golpes, evs: [0, 0, 0, 252, 4, 252] })] };
      const bm = TE.effectiveBuild(megaX);
      const habMega = TE.uniqueIds(megaX.ab).map((id) => TE.ABILITIES[id][0]);
      check("Mega sem build própria herda os golpes da base e fica com uma habilidade que existe na Mega",
        bm && bm.origem === "base" && bm.moves.join(",") === golpes.join(",") && habMega.indexOf(bm.ability) !== -1 && TE.rotuloDaBuild(bm) === "Build da forma base", bm);
      check("Mega que herda a build da base não vira tarefa de IA", TE.tarefaDeRevisao(megaX) === null);
    }

    // ---- curada pelo estilo + fila de revisão (IA simulada) ----
    const swampert = TE.getSpeciesBySname("SPECIES_SWAMPERT");
    if (achou("Swampert (curada com Waterfall no nível 24)", swampert)) {
      S.customBuilds = {};
      capNoMarco(0);
      S.team = [swampert.x];
      const bc = TE.effectiveBuild(swampert);
      check("sem build própria, o time mostra a curada com o estilo no rótulo", bc && bc.origem === "curada" && /^Build curada \(/.test(TE.rotuloDaBuild(bc)), bc && TE.rotuloDaBuild(bc));
      const t = TE.tarefaDeRevisao(swampert);
      check("curada com golpe travado vira tarefa de golpe-ponte (uma vez, com IA)", t && t.tipo === "ponte" && t.alvo && t.alvo.moves.indexOf("Waterfall") !== -1, t && t.tipo);
      S.customBuilds = { SPECIES_SWAMPERT: [build({ moves: ["Earthquake"], source: "curada" })] };
      check("build salva com origem curada mostra o estilo no rótulo", /^Build curada \(Equilibrado\)$|^Build curada$/.test(TE.rotuloDaBuild(TE.effectiveBuild(swampert))), TE.rotuloDaBuild(TE.effectiveBuild(swampert)));
      S.customBuilds = { SPECIES_SWAMPERT: [build({ moves: ["Earthquake"], source: "ia", revisar: "evolucao", tentativasRevisao: 2 })] };
      check("build que já falhou 2 vezes na revisão não entra mais na fila", TE.tarefaDeRevisao(swampert) === null);

      // corrida: o jogador cria a build enquanto a IA responde a ponte
      S.settings.milestone = 9; // sem cap: a curada inteira é válida como resposta da IA
      const cur = TE.BUILDS.SPECIES_SWAMPERT;
      const resposta = { ability: cur.ability, nature: cur.nature, item: "", moves: cur.moves.slice(), evs: [252, 252, 0, 0, 4, 0], rationale: "ia" };
      const minha = build({ moves: ["Earthquake", "Waterfall"] });
      S.customBuilds = {};
      window.claude = { use: async (n) => n === "sample" ? { json: async () => { S.customBuilds.SPECIES_SWAMPERT = [minha]; return resposta; } } : null };
      const r1 = await TE.generateBuildWithAI(swampert, "sem-status", { modo: "ponte", alvo: cur, silencioso: true });
      check("corrida na ponte: build criada enquanto a IA respondia é preservada e a resposta é descartada",
        r1 === "obsoleta" && S.customBuilds.SPECIES_SWAMPERT.length === 1 && S.customBuilds.SPECIES_SWAMPERT[0] === minha, r1);
      // corrida na revisão pós-evolução
      const marcada = build({ moves: ["Earthquake"], source: "ia", revisar: "evolucao", revisadaDe: "Marshtomp" });
      const editadaNaHora = build({ moves: ["Earthquake", "Waterfall"], nature: "Adamant" });
      S.customBuilds = { SPECIES_SWAMPERT: [marcada] };
      window.claude = { use: async (n) => n === "sample" ? { json: async () => { S.customBuilds.SPECIES_SWAMPERT = [editadaNaHora]; return resposta; } } : null };
      const r2 = await TE.generateBuildWithAI(swampert, "sem-status", { modo: "revisao", anterior: marcada, deNome: "Marshtomp", silencioso: true });
      check("corrida na revisão: edição feita enquanto a IA respondia não é sobrescrita",
        r2 === "obsoleta" && S.customBuilds.SPECIES_SWAMPERT[0] === editadaNaHora, r2);
      // revisão sem corrida: a revisada vira ativa e a anterior fica salva
      S.customBuilds = { SPECIES_SWAMPERT: [marcada] };
      window.claude = { use: async (n) => n === "sample" ? { json: async () => resposta } : null };
      const r3 = await TE.generateBuildWithAI(swampert, "sem-status", { modo: "revisao", anterior: marcada, deNome: "Marshtomp", silencioso: true });
      const l3 = S.customBuilds.SPECIES_SWAMPERT;
      check("revisão pós-evolução: a nova vira a ativa e a anterior continua salva, sem marca de revisão",
        r3 === true && l3.length === 2 && !l3[0].active && l3[0] === marcada && !marcada.revisar && l3[1].active && l3[1].source === "ia" && l3[1].planoConsultado === true,
        l3.map((b) => b.moves.join("/") + (b.active ? "*" : "")));
    }

    // ---- "+" da lista da Dex com a ficha do mesmo Pokémon aberta ao lado
    // (levantamento de 2026-09-24: a ficha continuava oferecendo "Adicionar"). ----
    S.team = [];
    document.querySelector('.tab-btn[data-tab="dex"]').click();
    await wait(30);
    setSearch("Swampert");
    await wait(120);
    const linha = document.querySelector('#species-list .species-row[data-x="' + TE.getSpeciesBySname("SPECIES_SWAMPERT").x + '"]');
    if (achou("linha do Swampert na busca", linha)) {
      linha.click();
      await wait(60);
      const btnAntes = document.getElementById("add-team-btn");
      const ativoAntes = !!btnAntes && !btnAntes.disabled;
      linha.querySelector(".row-add-btn").click();
      await wait(60);
      const btnDepois = document.getElementById("add-team-btn");
      check("\"+\" da lista atualiza a ficha aberta do mesmo Pokémon (Adicionar ao time fica desativado)",
        ativoAntes && btnDepois && btnDepois.disabled && S.team.length === 1, { ativoAntes, desativadoDepois: btnDepois && btnDepois.disabled });
    }
    setSearch("");
  } finally {
    if (claudeAntes === undefined) delete window.claude; else window.claude = claudeAntes;
    TE.applySave(snapshot);
    S.autoLog = logAntes;
  }
}
