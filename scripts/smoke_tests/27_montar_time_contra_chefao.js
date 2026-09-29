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
    // Luta inteira (2026-09-29): o cartão mostra o placar e a ordem das lutas.
    var passos = document.querySelectorAll(".plano-luta li");
    check("o cartão mostra a luta simulada inteira, passo a passo", !!card && /Luta simulada inteira/.test(card.textContent) && passos.length >= 1,
      [].map.call(passos, function (li) { return li.textContent.slice(0, 60); }));
    check("pediu uma build por membro, mirando a Flannery 1",
      prompts.length >= time.length && prompts.every(function (p) { return /OBJETIVO DESTA BUILD: vencer Flannery 1/.test(p); }), prompts.length);
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
