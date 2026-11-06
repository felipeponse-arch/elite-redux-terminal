// Seção 28 (2026-10-15): pipeline de build na tela (ticket pipeline-build-2026-10-14/02). Clique de verdade:
// o bloco "Sugestões do jogo para o time" (aba Meu Time, recolhido: só calcula ao abrir) e o botão
// "Ver sugestões do jogo" do editor "Meu build" (ficha). Sem IA: nada é gravado até "Salvar build".
async function section28() {
  await prepararRunPadrao();
  var T = window.__erTest;
  if (!T) { check("ponte de teste disponível", false); return; }
  var S = T.state;
  var snapshot = JSON.parse(JSON.stringify(T.buildSave()));
  try {
    S.settings.milestone = 1; // próximo líder de ginásio = o 2º ginásio
    S.team = ["SPECIES_CENTISKORCH", "SPECIES_LEDIAN", "SPECIES_TYPHLOSION"].map(function (s) { return T.getSpeciesBySname(s).x; });
    S.box = [];
    S.customBuilds = {};
    document.querySelector('.tab-btn[data-tab="team"]').click();
    T.renderTeam();
    await wait(30);

    // ---- bloco do time ----
    var det = document.getElementById("team-pipeline");
    var corpo = document.getElementById("team-pipeline-corpo");
    if (!achou("bloco 'Sugestões do jogo para o time'", det && corpo)) return;
    check("recolhido, o bloco do time não calcula nada (corpo vazio)", !det.open && corpo.innerHTML === "", corpo.innerHTML.slice(0, 80));
    det.querySelector("summary").click();
    check("ao abrir, cada membro ganha a melhor sugestão", await pollUntil(function () { return corpo.querySelectorAll(".pipe-membro").length === 3; }, 3000),
      corpo.querySelectorAll(".pipe-membro").length);
    var txt = corpo.textContent;
    check("mostra o alvo padrão (próximo líder de ginásio) e cada membro", /Centiskorch/.test(txt) && /Ledian/.test(txt) && /Typhlosion/.test(txt) && /Contra/.test(txt) && /: .+ e o ás /.test(txt), txt.slice(0, 160));
    check("cada sugestão traz o selo do módulo", corpo.querySelectorAll(".pipe-selo").length === 3 &&
      [].every.call(corpo.querySelectorAll(".pipe-selo"), function (s) { return /Calculado pelo código do jogo|Estimado/.test(s.textContent); }));
    check("a Coil Up do Centiskorch aparece entre os motivos (sinergia que o jogador pediu)", /Coil Up/.test(corpo.querySelector(".pipe-membro").textContent));
    var sel = document.getElementById("team-pipeline-alvo");
    if (achou("seletor 'Contra' do bloco", sel)) {
      var alvoOpt = [].filter.call(sel.options, function (o) { return o.value && /Wattson/.test(o.value); })[0];
      if (achou("opção Wattson 1 no seletor (chefões que faltam)", alvoOpt)) {
        sel.value = alvoOpt.value;
        sel.dispatchEvent(new Event("change", { bubbles: true }));
        check("trocar o alvo recalcula (o resumo cita o novo chefão)", await pollUntil(function () { return /Wattson 1:/.test(corpo.querySelector(".pipe-alvo-resumo").textContent); }, 3000), corpo.querySelector(".pipe-alvo-resumo").textContent);
      }
    }

    // ---- ficha ----
    var ir = corpo.querySelector(".pipe-ver");
    if (!achou("botão que abre a ficha do membro", ir)) return;
    ir.click();
    var botao = null;
    await pollUntil(function () { botao = document.getElementById("mybuild-pipeline-ver"); return !!botao; }, 3000);
    if (!achou("botão 'Ver sugestões do jogo' na ficha", botao)) return;
    var painel = document.getElementById("mybuild-pipeline-painel");
    check("a ficha abre com o painel escondido e o botão recolhido", painel.hidden && botao.getAttribute("aria-expanded") === "false");
    var sname = T.getSpeciesByX(S.selected).sname;
    var antes = T.getBuildList(sname).length;
    botao.click();
    check("o botão abre as sugestões (até 2)", await pollUntil(function () { return !painel.hidden && painel.querySelectorAll(".pipe-cand").length >= 2; }, 3000), painel.querySelectorAll(".pipe-cand").length);
    check("o botão avisa que está aberto (aria-expanded)", document.getElementById("mybuild-pipeline-ver").getAttribute("aria-expanded") === "true");
    var cand = painel.querySelector(".pipe-cand");
    check("cada sugestão mostra 4 golpes, habilidade, selo e o veredito", cand.querySelectorAll(".pipe-golpe").length === 4 && /Habilidade:/.test(cand.textContent) &&
      !!cand.querySelector(".pipe-selo") && /derruba|Derruba|Provável|sinergia/.test(cand.querySelector(".pipe-veredito").textContent), cand.textContent.slice(0, 120));
    var golpes = [].map.call(cand.querySelectorAll(".pipe-golpe"), function (g) { return g.textContent.trim(); });
    cand.querySelector(".pipe-usar").click();
    await wait(30);
    var noEditor = [0, 1, 2, 3].map(function (i) { return document.getElementById("mybuild-move-" + i).value; });
    check("'Usar golpes e habilidade no editor' preenche os 4 golpes", noEditor.join("|") === golpes.join("|"), noEditor.join("|") + " <> " + golpes.join("|"));
    check("e a habilidade", document.getElementById("mybuild-ability").value !== "");
    check("nada é gravado até 'Salvar build'", T.getBuildList(sname).length === antes, T.getBuildList(sname).length);
    var selF = document.getElementById("mybuild-pipeline-alvo");
    if (achou("seletor 'Contra' da ficha", selF)) {
      var op = [].filter.call(selF.options, function (o) { return o.value; })[0];
      selF.value = op.value;
      selF.dispatchEvent(new Event("change", { bubbles: true }));
      check("trocar o alvo na ficha recalcula e mantém o painel aberto", await pollUntil(function () { return painel.textContent.indexOf(op.value + ":") !== -1; }, 3000), painel.textContent.slice(0, 80));
    }
    document.getElementById("mybuild-pipeline-ver").click();
    await wait(20);
    check("clicar de novo esconde o painel", painel.hidden && painel.innerHTML === "");

    // ---- sem chefão adiante: o aviso do módulo aparece, sem erro ----
    S.settings.milestone = 9;
    T.renderTeam();
    document.getElementById("mybuild-pipeline-ver").click();
    await pollUntil(function () { return !painel.hidden && painel.textContent.length > 20; }, 3000);
    check("sem chefão adiante, o painel diz isso em vez de ficar vazio", /Sem chefão adiante|só por sinergia/i.test(painel.textContent), painel.textContent.slice(0, 140));
  } finally {
    T.applySave(snapshot);
    S.selected = null;
  }
}
