// Seção 31 (2026-10-21): Modo Motor no Meu Time (ticket time-pelo-motor/01, Fase F). Clique de verdade: o Motor é o botão padrão e monta o
// time SEM chamar a IA (claude.use nunca é tocado), em passos que não travam a página; as três variantes aparecem com papéis e prova; usar uma
// variante troca o time; repetir dá o mesmo resultado; o chip "IA (Claude)" devolve o caminho antigo, esse sim chamando claude.use.
async function section31() {
  await prepararRunPadrao();
  var T = window.__erTest;
  if (!T) { check("ponte de teste disponível", false); return; }
  var S = T.state;
  var claudeAntes = window.claude, chamadas = [];
  window.claude = { use: async function (n) { chamadas.push(n); return null; } };
  var snapshot = JSON.parse(JSON.stringify(T.buildSave()));
  T.definirPausasIA([0, 0]);
  try {
    S.settings.milestone = 2;
    S.settings.difficulty = "ace";
    var nomes = ["SPECIES_CENTISKORCH", "SPECIES_SCIZOR", "SPECIES_GARCHOMP", "SPECIES_METAGROSS", "SPECIES_GRIMMSNARL", "SPECIES_TOGEKISS"];
    S.team = nomes.map(function (n) { return T.getSpeciesBySname(n).x; });
    S.box = ["SPECIES_KLEFKI", "SPECIES_GARDEVOIR"].map(function (n) { return T.getSpeciesBySname(n).x; });
    S.customBuilds = {};
    S.archetype.monotype = null;
    document.querySelector('.tab-btn[data-tab="team"]').click();
    await wait(60);

    // O card de arquétipo nasce recolhido (as escolhas ficam no resumo); o jogador abre em "Ajustar".
    var detalhes = document.querySelector("#team-strategy details.arquetipo");
    if (!achou("card de arquétipo", detalhes)) return;
    if (!detalhes.open) { detalhes.querySelector("summary").click(); await wait(40); }

    // ---- o botão do Motor ----
    var chipMotor = document.getElementById("modo-montagem-motor");
    if (!achou("chip 'Motor (padrão, sem IA)'", chipMotor)) return;
    chipMotor.click();
    await wait(30);
    check("com o modo Motor, o card mostra 'Montar time pelo Motor' e não mostra 'Gerar time completo'",
      !!document.getElementById("motor-montar") && !document.getElementById("archetype-build-complete") &&
      document.getElementById("modo-montagem-motor").getAttribute("aria-pressed") === "true" && document.getElementById("modo-montagem-ia").getAttribute("aria-pressed") === "false");
    // Favorito: Togekiss nunca sai.
    var fav = document.querySelector('[data-motor-fav="SPECIES_TOGEKISS"]');
    if (!achou("chip de favorito do Togekiss", fav)) return;
    fav.click();
    await wait(20);
    check("o chip de favorito fica marcado e mantém o foco para quem usa teclado",
      document.querySelector('[data-motor-fav="SPECIES_TOGEKISS"]').getAttribute("aria-pressed") === "true" && document.activeElement && document.activeElement.dataset.motorFav === "SPECIES_TOGEKISS");

    // ---- monta; a página não pode travar (maior intervalo entre batidas de 50 ms) ----
    var maiorSilencio = 0, ultima = Date.now(), batendo = true;
    (function bater() { if (!batendo) return; var agora = Date.now(); maiorSilencio = Math.max(maiorSilencio, agora - ultima); ultima = agora; setTimeout(bater, 50); })();
    var t0 = Date.now();
    document.getElementById("motor-montar").click();
    var pronto = await pollUntil(function () { return !!document.getElementById("motor-resultado"); }, 90000);
    var tempoTela = Date.now() - t0;
    batendo = false;
    window.__tempoMotorMs = tempoTela; // lido pelo relatório do teste
    if (!achou("cartão 'Time pelo Motor'", pronto && document.getElementById("motor-resultado"))) return;
    var card = document.getElementById("motor-resultado");
    var varas = card.querySelectorAll(".motor-variante");
    check("o resultado traz as três variantes (ofensivo, seguro, sinergia), cada uma com 6 Pokémon", varas.length === 3 &&
      [].every.call(varas, function (v) { return v.querySelectorAll(".motor-membro").length === 6; }), [].map.call(varas, function (v) { return v.querySelector("h4").textContent; }));
    check("o favorito (Togekiss) está nas três variantes, marcado como favorito",
      [].every.call(varas, function (v) { return [].some.call(v.querySelectorAll(".motor-membro"), function (m) { return /Togekiss/.test(m.textContent) && /favorito/.test(m.textContent); }); }));
    check("cada Pokémon mostra a build e o papel provado ou o motivo de não ter papel",
      [].every.call(card.querySelectorAll(".motor-membro"), function (m) { return !!m.querySelector(".motor-build").textContent.trim() && /Sem papel provado|:/.test(m.querySelector(".motor-papeis").textContent); }));
    check("cada variante traz o plano B e a explicação ('Por que este time')",
      [].every.call(varas, function (v) { return /Plano B/.test(v.textContent) && !!v.querySelector(".motor-explicacao li"); }));
    check("o Motor não tocou na IA (claude.use nunca foi chamado)", chamadas.length === 0, chamadas);
    check("a página continuou respondendo durante a montagem (maior silêncio até 1,5 s)", maiorSilencio <= 1500, maiorSilencio + " ms de silêncio máximo; montagem de " + tempoTela + " ms");
    check("o status diz que foi sem IA e o tempo", /sem consultar a IA/.test(document.getElementById("archetype-status").textContent), document.getElementById("archetype-status").textContent);

    // ---- usar uma variante troca o time ----
    var nomesDasVariantes = [].map.call(varas, function (v) { return [].map.call(v.querySelectorAll(".motor-membro-nome .goto-species"), function (e) { return e.textContent; }).join("|"); });
    var usarSeguro = card.querySelector('[data-motor-usar="seguro"]');
    if (!achou("botão 'Usar esta variante' do seguro", usarSeguro)) return;
    usarSeguro.click();
    await wait(60);
    var doTime = S.team.map(function (x) { return T.getSpeciesByX(x).n; }).sort().join("|");
    check("'Usar esta variante' troca o time para os Pokémon da variante e marca 'Time em uso'",
      doTime === nomesDasVariantes[1].split("|").sort().join("|") && document.querySelector('[data-motor-usar="seguro"]').disabled && /Time em uso/.test(document.querySelector('[data-motor-usar="seguro"]').textContent), doTime + " x " + nomesDasVariantes[1]);

    // ---- mesma entrada, mesmo resultado (e bem mais rápido, com o cache) ----
    var t1 = Date.now();
    document.getElementById("motor-montar").click();
    await wait(30);
    await pollUntil(function () { return /Time montado pelo Motor/.test(document.getElementById("archetype-status").textContent) && !document.getElementById("motor-montar").disabled; }, 90000);
    var nomes2 = [].map.call(document.querySelectorAll("#motor-resultado .motor-variante"), function (v) { return [].map.call(v.querySelectorAll(".motor-membro-nome .goto-species"), function (e) { return e.textContent; }).join("|"); });
    check("montar de novo com a mesma entrada dá as mesmas variantes", JSON.stringify(nomes2) === JSON.stringify(nomesDasVariantes), nomes2);
    window.__tempoMotorRepetidoMs = Date.now() - t1;

    // ---- a troca para a IA ----
    document.getElementById("modo-montagem-ia").click();
    await wait(40);
    check("trocar para 'IA (Claude)' mostra 'Gerar time completo' e esconde o Motor e o resultado",
      !!document.getElementById("archetype-build-complete") && !document.getElementById("motor-montar") && !document.getElementById("motor-resultado") && document.activeElement.id === "modo-montagem-ia");
    selecionarArquetipo("pace", "Hyper Offense");
    await wait(30);
    window.claude = { use: async function (n) { chamadas.push(n); return n === "sample" ? { json: async function () { return { team: [], reasoning: "" }; } } : null; } };
    document.getElementById("archetype-build-complete").click();
    var iaChamada = await pollUntil(function () { return chamadas.indexOf("sample") !== -1; }, 4000);
    check("no modo IA o botão chama a IA (claude.use)", iaChamada, chamadas);
    await wait(100);
    document.getElementById("modo-montagem-motor").click();
    await wait(40);
    check("voltar ao Motor traz o botão do Motor de volta", !!document.getElementById("motor-montar") && !document.getElementById("archetype-build-complete"));
    selecionarArquetipo("pace", "");
  } finally {
    window.claude = claudeAntes;
    T.applySave(snapshot);
  }
}
