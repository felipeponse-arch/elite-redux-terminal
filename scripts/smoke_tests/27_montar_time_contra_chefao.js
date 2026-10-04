// Seção 27 (2026-09-29): botão "Montar time contra este chefão" (aba Chefões),
// que substituiu o cartão "Enviar para o Claude" (texto pra copiar e colar na
// conversa). Clique de verdade; a IA das builds é simulada (window.claude), o
// resto é o app real: simulador de duelo, troca do time, time antigo guardado,
// plano da luta no cartão da aba Time e o botão de voltar ao time anterior.
async function section27() {
  await prepararRunPadrao();
  var T = window.__erTest;
  if (!T) { check("ponte de teste disponível", false); return; }
  var claudeAntes = window.claude;
  T.definirPausasIA([0, 0]);
  var timeAntes = T.state.team.slice();
  var donos = T.state.team.concat(T.state.box);
  var prompts = [];
  // Resposta que a validação recusa: o teste é do fluxo, não da qualidade da build.
  window.claude = { use: async function (n) { return n === "sample" ? { json: async function (p) { prompts.push(p); return { ability: "Nada", moves: [] }; } } : null; } };
  try {
    document.querySelector('.tab-btn[data-tab="bosses"]').click();
    await wait(50);
    var busca = document.getElementById("boss-search-input");
    // Regra de campo visível na tela do chefe (04/10): antes só a simulação e a IA a viam.
    function abrirChefao(nome) { busca.value = nome; busca.dispatchEvent(new Event("input", { bubbles: true })); var r = document.querySelector("#boss-list .species-row"); if (r) r.click(); }
    abrirChefao("Tate And Liza 1"); await wait(40);
    var det = document.getElementById("boss-detail").textContent;
    check("a Tate & Liza 1 mostra a regra de campo (Trick Room e invertida)", /Regra de campo desta luta/.test(det) && /INVERTIDA/.test(det) && !/ainda não conta este efeito/.test(det), det.slice(0, 160));
    abrirChefao("Monochamp Bug"); await wait(40);
    det = document.getElementById("boss-detail").textContent;
    check("o campeão monotype mostra o efeito e avisa que o simulador ainda não o conta", /Regra de campo desta luta/.test(det) && /infestação/.test(det) && /ainda não conta este efeito/.test(det), det.slice(0, 160));
    // Revisão dos ginásios (04/10): revanche de líder não tem os buffs do ginásio (só o 1º encontro).
    abrirChefao("Roxanne 2"); await wait(40);
    det = document.getElementById("boss-detail").textContent;
    check("a revanche (Roxanne 2) avisa que não tem buffs do ginásio e não lista nenhum", /Esta é uma revanche/.test(det) && !document.querySelector(".gym-skill-summary") && !document.querySelector("[data-gymskill]"), det.slice(0, 120));
    abrirChefao("Roxanne 1"); await wait(40);
    check("o 1º encontro (Roxanne 1) lista os buffs do ginásio", !!document.querySelector("[data-gymskill]"));
    abrirChefao("Flannery 1"); await wait(40);
    check("a Flannery 1 (sem regra de campo) não mostra o cartão", !/Regra de campo desta luta/.test(document.getElementById("boss-detail").textContent));
    busca.value = "Flannery 1";
    busca.dispatchEvent(new Event("input", { bubbles: true }));
    await wait(30);
    var row = document.querySelector("#boss-list .species-row");
    if (!achou("Flannery 1 na lista de chefões", row)) return;
    row.click();
    await wait(30);
    check("o cartão antigo de copiar texto saiu", !document.getElementById("boss-export-text") && !document.getElementById("boss-export-copy"));
    var botao = document.getElementById("boss-montar-time");
    if (!achou("botão 'Montar time contra este chefão'", botao)) return;
    botao.click();
    // Espera o fluxo inteiro (duelos + 1 build por membro, IA simulada).
    // Só "Faltou build" encerra: o aviso fica vazio ENQUANTO as builds são pedidas
    // (parar no vazio cortava a espera no meio quando o duelo ficou mais pesado).
    for (var i = 0; i < 300; i++) {
      await wait(50);
      var st = document.getElementById("chefao-build-status");
      if (st && /^Faltou build/.test(st.textContent) && prompts.length) break;
    }
    check("o botão leva pra aba Meu time", document.querySelector('.tab-btn[data-tab="team"]').classList.contains("active"));
    var time = T.state.team.slice();
    check("o time foi trocado pelos escolhidos (até 6, todos do time ou da caixa de antes)",
      // Pode entrar a forma de batalha (mega já liberada) de uma criatura que o jogador tem.
      time.length >= 1 && time.length <= 6 && time.every(function (x) {
        return donos.some(function (d) { return T.formFamilyOf(T.getSpeciesByX(d)).some(function (f) { return f.x === x; }); });
      }),
      time.map(function (x) { return T.getSpeciesByX(x).n; }));
    var salvo = T.state.savedTeams.filter(function (t) { return t.name === "Antes de Flannery 1"; })[0];
    check("o time anterior ficou em Times salvos como 'Antes de Flannery 1'", !!salvo && salvo.team.length === timeAntes.length, T.state.savedTeams);
    var card = document.querySelector(".ts-generated-team");
    check("o cartão 'Time gerado contra Flannery 1' aparece na aba Meu time", !!card && /contra Flannery 1/.test(card.textContent), card && card.textContent.slice(0, 120));
    var itens = document.querySelectorAll(".plano-chefao li");
    check("o plano lista os 6 Pokémon dela, em ordem", itens.length === 6 && /Sunflora/.test(itens[0].textContent), [].map.call(itens, function (li) { return li.textContent.slice(0, 40); }));
    check("o plano avisa que ela arma sol", !!card && /Ele arma sol/.test(card.textContent));
    // Debug de 04/10: mudar os buffs depois de montar deixava a linha "na conta" velha e sem aviso.
    check("sem mexer nos buffs, o cartão não acusa mudança", !/Você mudou os buffs/.test(card.textContent));
    var clearedAntes = JSON.stringify(T.state.gymSkillsCleared);
    T.state.gymSkillsCleared = Object.assign({}, T.state.gymSkillsCleared, { Flannery: T.GYM_SKILLS.leaders.Flannery.buffs.map(function (b) { return b.id; }) });
    T.TELAS.time();
    var cardNovo = document.querySelector(".ts-generated-team");
    check("marcar buffs depois de montar avisa que o plano ficou velho", !!cardNovo && /Você mudou os buffs/.test(cardNovo.textContent), cardNovo && cardNovo.textContent.slice(cardNovo.textContent.indexOf("Buffs do gin") - 10, cardNovo.textContent.indexOf("Buffs do gin") + 260));
    T.state.gymSkillsCleared = JSON.parse(clearedAntes);
    T.TELAS.time();
    // Luta inteira (2026-09-29): o cartão mostra o placar e a ordem das lutas.
    var passos = document.querySelectorAll(".plano-luta li");
    check("o cartão mostra a luta simulada inteira, passo a passo", !!card && /Luta simulada inteira/.test(card.textContent) && passos.length >= 1,
      [].map.call(passos, function (li) { return li.textContent.slice(0, 60); }));
    check("pediu uma build por membro, mirando a Flannery 1",
      prompts.length >= time.length && prompts.every(function (p) { return /OBJETIVO DEST[AE] (BUILD|TIME): vencer Flannery 1/.test(p); }), prompts.length);
    check("build recusada vira aviso de 'faltou build', sem travar o fluxo",
      /^Faltou build/.test(document.getElementById("chefao-build-status").textContent), document.getElementById("chefao-build-status").textContent);
    // Clicar de novo não cria um segundo "Antes de ..." (reaproveita a vaga).
    document.querySelector('.tab-btn[data-tab="bosses"]').click();
    await wait(50);
    document.getElementById("boss-montar-time").click();
    for (var j = 0; j < 300; j++) {
      await wait(50);
      var st2 = document.getElementById("chefao-build-status");
      if (st2 && /^Faltou build/.test(st2.textContent)) break;
    }
    check("clicar de novo reaproveita a vaga do 'Antes de ...' (não gasta outra das 3)",
      T.state.savedTeams.filter(function (t) { return /^Antes de /.test(t.name); }).length === 1, T.state.savedTeams.map(function (t) { return t.name; }));
    // Economia de IA (2026-09-30): quem já tem build ativa feita pra este chefão
    // neste level cap não pede build de novo ao clicar outra vez.
    var capAgora = T.getCurrentCap() || 0;
    T.state.team.forEach(function (x) {
      var spT = T.getSpeciesByX(x);
      T.state.customBuilds[spT.sname] = [{ ability: "", nature: "Hardy", item: "", moves: ["Tackle"], evs: [0, 0, 0, 0, 0, 0], ivs: [31, 31, 31, 31, 31, 31],
        source: "ia", active: true, savedAt: "2026-09-30", rationale: "", feitaPara: { chefao: "Flannery 1|" + (T.bossState.diff || "party"), cap: capAgora } }];
    });
    var pedidosAntes = prompts.length;
    document.querySelector('.tab-btn[data-tab="bosses"]').click();
    await wait(50);
    document.getElementById("boss-montar-time").click();
    for (var m = 0; m < 300; m++) {
      await wait(50);
      var stM = document.getElementById("chefao-build-status");
      if (stM && /Mantidas/.test(stM.textContent)) break;
    }
    check("clicar de novo com builds já feitas pra este chefão não pede nenhuma build à IA",
      prompts.length === pedidosAntes && /Mantidas as builds que já eram contra Flannery 1/.test((document.getElementById("chefao-build-status") || {}).textContent || ""),
      { pedidos: prompts.length - pedidosAntes, status: (document.getElementById("chefao-build-status") || {}).textContent });
    // Revisão de 2026-09-30: o mesmo chefão tem 3 times (Padrão/Insane/Hell) - trocar a
    // variante e clicar de novo tem que pedir build nova (a marca é chefão + variante).
    document.querySelector('.tab-btn[data-tab="bosses"]').click();
    await wait(50);
    var outraVariante = [].filter.call(document.querySelectorAll("#boss-detail [data-diff]"), function (b) { return b.dataset.diff !== (T.bossState.diff || "party"); })[0];
    if (achou("botão de outra variante (Insane/Hell) da Flannery 1", outraVariante)) {
      outraVariante.click();
      await wait(50);
      var pedidosVariante = prompts.length;
      document.getElementById("boss-montar-time").click();
      for (var v = 0; v < 300; v++) {
        await wait(50);
        var stV = document.getElementById("chefao-build-status");
        if (stV && /^Faltou build/.test(stV.textContent) && prompts.length > pedidosVariante) break;
      }
      check("outra variante do mesmo chefão (outro time) pede build nova",
        prompts.length > pedidosVariante, { variante: T.bossState.diff, pedidos: prompts.length - pedidosVariante });
    }
    // Segundo chefão (revisão de 2026-09-30): montar contra outro chefão com o time
    // do botão na tela NÃO pode trocar o backup do time do jogador pelo do botão.
    var snamesAntes = timeAntes.map(function (x) { return T.getSpeciesByX(x).sname; }).sort().join(",");
    busca = document.getElementById("boss-search-input");
    busca.value = "Wattson";
    busca.dispatchEvent(new Event("input", { bubbles: true }));
    await wait(30);
    var row2 = document.querySelector("#boss-list .species-row");
    if (achou("Wattson na lista de chefões", row2)) {
      row2.click();
      await wait(30);
      prompts.length = 0;
      document.getElementById("boss-montar-time").click();
      for (var k = 0; k < 300; k++) {
        await wait(50);
        var st3 = document.getElementById("chefao-build-status");
        if (st3 && /^Faltou build/.test(st3.textContent) && prompts.length) break;
      }
      var backup = T.state.savedTeams.filter(function (t) { return /^Antes de /.test(t.name); });
      check("com um 2º chefão, o backup continua sendo o time do JOGADOR (não o montado pelo botão)",
        backup.length === 1 && backup[0].team.slice().sort().join(",") === snamesAntes,
        backup.map(function (t) { return t.name + ": " + t.team.join(","); }));
    }
    var voltar = document.getElementById("chefao-restaurar");
    if (achou("botão 'Voltar ao time anterior'", voltar)) {
      voltar.click();
      await wait(50);
      check("voltar ao time anterior restaura o time de antes",
        T.state.team.slice().sort().join(",") === timeAntes.slice().sort().join(","), T.state.team.map(function (x) { return T.getSpeciesByX(x).n; }));
    }
  } finally {
    T.definirPausasIA([4000, 10000]);
    if (claudeAntes === undefined) delete window.claude; else window.claude = claudeAntes;
  }
}
