// Seção 27 (2026-09-29): botão "Montar time contra este chefão" (aba Chefões),
// que substituiu o cartão "Enviar para o Claude" (texto pra copiar e colar na
// conversa). Clique de verdade, sem IA (o app não usa mais, 06/11/2026): simulador de duelo, troca do time, time antigo guardado,
// plano da luta no cartão da aba Time e o botão de voltar ao time anterior.
async function section27() {
  await prepararRunPadrao();
  var T = window.__erTest;
  if (!T) { check("ponte de teste disponível", false); return; }
  // Espera a simulação do botão terminar (o status "Simulando…" aparece e some).
  async function esperarMontagem() {
    for (var q = 0; q < 400; q++) {
      await wait(50);
      var s = document.getElementById("boss-team-status");
      if (q >= 2 && (!s || !/Simulando/.test(s.textContent))) break;
    }
    await wait(150);
  }
  var timeAntes = T.state.team.slice();
  var donos = T.state.team.concat(T.state.box);
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
    await esperarMontagem();
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
    check("membros sem build ganham o aviso 'faltou build', sem travar o fluxo",
      /^Faltou build/.test(document.getElementById("chefao-build-status").textContent), document.getElementById("chefao-build-status").textContent);
    // Clicar de novo não cria um segundo "Antes de ..." (reaproveita a vaga).
    document.querySelector('.tab-btn[data-tab="bosses"]').click();
    await wait(50);
    document.getElementById("boss-montar-time").click();
    await esperarMontagem();
    check("clicar de novo reaproveita a vaga do 'Antes de ...' (não gasta outra das 3)",
      T.state.savedTeams.filter(function (t) { return /^Antes de /.test(t.name); }).length === 1, T.state.savedTeams.map(function (t) { return t.name; }));
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
      document.getElementById("boss-montar-time").click();
      await esperarMontagem();
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
    // nada a restaurar: o app não usa mais IA
  }
}
