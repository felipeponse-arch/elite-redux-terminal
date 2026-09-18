// Seção 23 (2026-09-18, "aprofundar mais no que dá pra aprender no
// Smogon"): breakpoints de EV por nível - achado ao ler "A Beginner's
// Guide to Understanding EVs" da Smogon University ("at level 50, EVs are
// worked with in multiples of 8" em vez de 4). calcFinalStat já usa a
// fórmula padrão de status desde o Gen 3 (a mesma referenciada no artigo),
// e ela fica cada vez mais grosseira quanto MENOR o nível - a norma no
// Elite Redux, que trava tudo por level cap. evBreakpointNote() é função
// pura; constrói os EVs de teste PROGRAMATICAMENTE a partir de uma
// varredura real (não chuta valores "redondos" e espera que deem
// desperdício - o tamanho de cada platô depende do nível/stat base real),
// depois confirma a integração ao vivo em "Meu build".
async function section23() {
  var T = window.__erTest;
  if (!T) { check("ponte de teste disponível", false); return; }
  if (!achou("evBreakpointNote exposta na ponte de teste", typeof T.evBreakpointNote === "function")) return;

  // Mesma ordem/nomes que STAT_LABELS_SHORT no artifact_template.html -
  // não exposta na ponte de teste (é só uma constante de rótulo, não
  // regra de jogo), então espelhada aqui de propósito.
  var STAT_LABELS_SHORT = ["HP", "Atk", "Def", "SpA", "SpD", "Spe"];

  await prepararRunPadrao();
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  var cap = T.getCurrentCap() || 50;

  var fx = null;
  T.SPECIES.some(function (sp) {
    if (!sp || T.formFamilyOf(sp).length > 1) return false;
    if (TIME_PADRAO.indexOf(sp.n) !== -1) return false;
    fx = sp;
    return true;
  });
  if (!achou("espécie fixture pro teste de breakpoints de EV", fx)) return;

  // Pro mesmo stat, acha o maior EV de um "platô" (todo EV nesse platô dá
  // o MESMO stat final) - garante desperdício de verdade nessa fixture, no
  // nível real da run, em vez de chutar um número redondo. minEvFor[i]
  // guarda o menor EV daquele platô (o que a função de produção deveria
  // sugerir).
  var ivs31 = [31, 31, 31, 31, 31, 31];
  var evsTeste = [0, 0, 0, 0, 0, 0];
  var minEvEsperado = [null, null, null, null, null, null];
  for (var i = 0; i < 6; i++) {
    var valorPorEv = [];
    for (var ev = 0; ev <= 252; ev += 4) valorPorEv.push(T.calcFinalStat(fx.b[i], 31, ev, cap, i));
    // Acha o maior EV cujo valor é igual ao de algum EV MENOR - esse é o
    // fim de um platô com desperdício de verdade.
    var melhorFimDePlato = -1, melhorInicioDePlato = -1;
    for (var j = valorPorEv.length - 1; j > 0; j--) {
      for (var k = 0; k < j; k++) {
        if (valorPorEv[k] === valorPorEv[j]) { melhorFimDePlato = j; melhorInicioDePlato = k; break; }
      }
      if (melhorFimDePlato !== -1) break;
    }
    if (melhorFimDePlato !== -1) {
      evsTeste[i] = melhorFimDePlato * 4;
      minEvEsperado[i] = melhorInicioDePlato * 4;
    }
  }
  var statsComDesperdicio = minEvEsperado.map(function (v, i) { return v !== null ? i : null; }).filter(function (v) { return v !== null; });
  if (!achou("fixture tem desperdício de EV de verdade em pelo menos 1 stat neste nível (" + cap + ")", statsComDesperdicio.length > 0)) return;

  // ---- função pura: sem espécie válida ou sem nenhum EV, nunca mostra nota ----
  check("sem espécie válida, evBreakpointNote não quebra e devolve vazio",
    T.evBreakpointNote(null, ivs31, evsTeste, cap, null, "") === "");
  check("com todo EV zerado, evBreakpointNote nunca aparece (nada pra desperdiçar)",
    T.evBreakpointNote(fx, ivs31, [0, 0, 0, 0, 0, 0], cap, null, "") === "");

  // ---- função pura: EVs construídos pra desperdiçar de verdade batem
  // exatamente com o que a varredura manual prevê ----
  var nota = T.evBreakpointNote(fx, ivs31, evsTeste, cap, null, "");
  var falhas = [];
  if (nota === "") falhas.push("nota vazia, mas a fixture tem desperdício de verdade em " + statsComDesperdicio.length + " stat(s)");
  for (var s = 0; s < 6; s++) {
    var deveriaAparecer = minEvEsperado[s] !== null;
    var apareceu = nota.indexOf(STAT_LABELS_SHORT[s] + " (") !== -1;
    if (deveriaAparecer && !apareceu) falhas.push(STAT_LABELS_SHORT[s] + ": deveria estar na nota (EV " + evsTeste[s] + " -> " + minEvEsperado[s] + ") e não está");
    if (!deveriaAparecer && apareceu) falhas.push(STAT_LABELS_SHORT[s] + ": não deveria estar na nota (sem desperdício nesse stat) mas está");
    if (deveriaAparecer) {
      if (nota.indexOf(String(evsTeste[s])) === -1) falhas.push(STAT_LABELS_SHORT[s] + ": nota não cita o EV atual (" + evsTeste[s] + ")");
      if (nota.indexOf(String(minEvEsperado[s])) === -1) falhas.push(STAT_LABELS_SHORT[s] + ": nota não cita o EV mínimo (" + minEvEsperado[s] + ")");
    }
  }
  var totalEsperado = statsComDesperdicio.reduce(function (a, i) { return a + (evsTeste[i] - minEvEsperado[i]); }, 0);
  if (nota !== "" && nota.indexOf(String(totalEsperado)) === -1) falhas.push("nota não cita o total de EV realocável esperado (" + totalEsperado + ")");
  check("nota de breakpoint bate exatamente com a varredura manual (stats certos, EVs certos, total certo)",
    falhas.length === 0, falhas.slice(0, 5).join(" | "));

  // ---- trocando pros EVs mínimos, a nota some (nada mais desperdiçado) ----
  check("com os EVs no valor MÍNIMO de cada platô, a nota some (não há mais desperdício)",
    T.evBreakpointNote(fx, ivs31, minEvEsperado.map(function (v, i) { return v === null ? 0 : v; }), cap, null, "") === "");

  // ---- integração ao vivo: "Meu build" mostra a nota de verdade na tela ----
  setSearch(fx.n);
  await wait(120);
  var row = document.querySelector('#species-list .species-row[data-x="' + fx.x + '"]');
  if (achou("linha de " + fx.n + " na busca (breakpoints de EV)", row)) {
    row.click();
    await wait(60);
    var out = document.getElementById("mybuild-status-preview");
    if (achou("preview de status existe", out)) {
      // Trava o campo de nível no MESMO cap usado pra montar `nota` -
      // "Meu build" deixa simular outro nível de propósito (persiste entre
      // espécies até o cap real mudar), e outra seção da suíte pode ter
      // deixado um valor simulado diferente aqui; sem isto o teste ficaria
      // refém de qual seção rodou por último, em vez de testar só
      // evBreakpointNote.
      var levelEl = document.getElementById("mybuild-level");
      if (levelEl) { levelEl.value = String(cap); levelEl.dispatchEvent(new Event("input", { bubbles: true })); }
      for (var e = 0; e < 6; e++) {
        var el = document.getElementById("mybuild-ev-" + e);
        if (el) { el.value = String(evsTeste[e]); el.dispatchEvent(new Event("input", { bubbles: true })); }
      }
      await wait(60);
      // O navegador normaliza "&rarr;" pro caractere → de verdade ao
      // inserir/serializar innerHTML - a string crua devolvida pela função
      // nunca bate literalmente com o innerHTML depois disso, sem ligação
      // nenhuma com o valor calculado (que já foi conferido acima, direto
      // na função pura). Compara com essa mesma normalização aplicada.
      check("com os EVs desperdiçados de verdade, a nota de breakpoint aparece na tela de 'Meu build'",
        out.innerHTML.indexOf(nota.replace(/&rarr;/g, "→")) !== -1, nota.slice(0, 140));

      for (var e2 = 0; e2 < 6; e2++) {
        var el2 = document.getElementById("mybuild-ev-" + e2);
        var minimo = minEvEsperado[e2] === null ? 0 : minEvEsperado[e2];
        if (el2) { el2.value = String(minimo); el2.dispatchEvent(new Event("input", { bubbles: true })); }
      }
      await wait(60);
      check("trocando pros EVs mínimos, a nota de breakpoint some (não fica pendurada)",
        out.innerHTML.indexOf("saltos de EV") === -1);
    }
  }
}
