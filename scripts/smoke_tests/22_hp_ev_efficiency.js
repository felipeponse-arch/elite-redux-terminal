// Seção 22 (2026-09-18, "vai pra 2"): nota de eficiência de EV de HP pra
// quem carrega Leftovers/Black Sludge (cura 1/16 do HP máximo por turno,
// mecânica vanilla inalterada desde sempre) - achado ao estudar o "Sets
// Compendium" do formato Monotype do Smogon (ver memória
// project_elite_redux_frontend_next_phase). hpEvEfficiencyNote() é função
// pura; testa ela direto pra uma faixa inteira de EVs de uma espécie real,
// depois confirma a integração ao vivo em "Meu build".
// Sem Level cap o nível de cálculo é 100 (ticket 04) e não há platô de EV; a seção roda no marco 3 (cap 50, "more"), o nível que ela sempre usou.
async function section22() {
  var T0 = window.__erTest;
  var msOriginal = T0 && T0.state.settings.milestone;
  if (T0) T0.state.settings.milestone = 3;
  try { await section22Corpo(); } finally { if (T0) T0.state.settings.milestone = msOriginal; }
}
async function section22Corpo() {
  var T = window.__erTest;
  if (!T) { check("ponte de teste disponível", false); return; }
  if (!achou("hpEvEfficiencyNote exposta na ponte de teste", typeof T.hpEvEfficiencyNote === "function")) return;

  // Precisa de um run configurado ANTES de ler o level cap - sem isso
  // (rodando esta seção sozinha, modo isolado) o cap fica indefinido e
  // instável entre a varredura e a checagem ao vivo, além de não refletir
  // o estado real em que esta feature é usada (sempre com cap já
  // configurado em Progresso).
  await prepararRunPadrao();
  T.state.settings.milestone = 3; // cap 50 (ver o comentário da seção); o wrapper restaura o marco
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  var cap = T.nivelDeCalculo();
  // Fixture: espécie sem forma múltipla (mantém o teste simples) cujo HP
  // base gere EV=0 com resto != 1 - senão o teste não exercitaria o
  // caminho "mostra a nota" de jeito nenhum.
  var fx = null;
  T.SPECIES.some(function (sp) {
    if (!sp || T.formFamilyOf(sp).length > 1) return false;
    if (TIME_PADRAO.indexOf(sp.n) !== -1) return false;
    var hp0 = T.calcFinalStat(sp.b[0], 31, 0, cap, 0);
    if (hp0 % 16 === 1) return false;
    fx = sp;
    return true;
  });
  if (!achou("espécie fixture com HP EV=0 não-ideal pro teste de eficiência", fx)) return;

  // ---- função pura: sem item de cura de 1/16, nunca mostra nota ----
  check("sem Leftovers/Black Sludge, hpEvEfficiencyNote nunca aparece (mesmo com EV ruim)",
    T.hpEvEfficiencyNote(fx, 0, "", cap) === "" && T.hpEvEfficiencyNote(fx, 0, "Choice Scarf", cap) === "");
  check("sem espécie válida, hpEvEfficiencyNote não quebra e devolve vazio",
    T.hpEvEfficiencyNote(null, 0, "Leftovers", cap) === "");

  // ---- função pura: varre 0..252 (de 4 em 4) e confere CADA resultado
  // contra o cálculo real - os números citados na nota precisam bater com
  // calcFinalStat de verdade, não só "apareceu algum texto" ----
  var baseHp = fx.b[0];
  var idealEv = null, zeroEv = null;
  for (var ev = 0; ev <= 252; ev += 4) {
    var hp = T.calcFinalStat(baseHp, 31, ev, cap, 0);
    if (idealEv === null && hp % 16 === 1) idealEv = ev;
    if (zeroEv === null && hp % 16 === 0) zeroEv = ev;
  }
  var falhasVarredura = [];
  for (var ev2 = 0; ev2 <= 252; ev2 += 4) {
    var hpAtual = T.calcFinalStat(baseHp, 31, ev2, cap, 0);
    var nota = T.hpEvEfficiencyNote(fx, ev2, "Leftovers", cap);
    if (hpAtual % 16 === 1) {
      if (nota !== "") falhasVarredura.push("EV " + ev2 + ": HP já ideal mas mostrou nota");
      continue;
    }
    var melhorEv = idealEv !== null ? idealEv : zeroEv;
    if (melhorEv === null || melhorEv === ev2) {
      if (nota !== "") falhasVarredura.push("EV " + ev2 + ": não há EV melhor (ou é o próprio), mas mostrou nota");
      continue;
    }
    var melhorHp = T.calcFinalStat(baseHp, 31, melhorEv, cap, 0);
    if (nota === "") { falhasVarredura.push("EV " + ev2 + ": deveria mostrar nota e não mostrou"); continue; }
    if (nota.indexOf(String(hpAtual)) === -1) falhasVarredura.push("EV " + ev2 + ": nota não cita o HP atual (" + hpAtual + ")");
    if (nota.indexOf(String(melhorEv)) === -1) falhasVarredura.push("EV " + ev2 + ": nota não cita a EV ideal (" + melhorEv + ")");
    if (nota.indexOf(String(melhorHp)) === -1) falhasVarredura.push("EV " + ev2 + ": nota não cita o HP que a EV ideal renderia (" + melhorHp + ")");
  }
  check("varredura completa (0..252 EV de HP, de 4 em 4): todo caso bate com calcFinalStat real, sem falso positivo/negativo",
    falhasVarredura.length === 0, falhasVarredura.slice(0, 5).join(" | "));

  // ---- integração ao vivo: "Meu build" mostra a nota de verdade na tela ----
  setSearch(fx.n);
  await wait(120);
  var row = document.querySelector('#species-list .species-row[data-x="' + fx.x + '"]');
  if (achou("linha de " + fx.n + " na busca (eficiência de EV de HP)", row)) {
    row.click();
    await wait(60);
    var itemEl = document.getElementById("mybuild-item");
    var evHpEl = document.getElementById("mybuild-ev-0");
    var out = document.getElementById("mybuild-status-preview");
    if (achou("campos de item/EV de HP e preview de status existem", itemEl && evHpEl && out)) {
      itemEl.value = "Leftovers";
      itemEl.dispatchEvent(new Event("input", { bubbles: true }));
      evHpEl.value = "0";
      evHpEl.dispatchEvent(new Event("input", { bubbles: true }));
      await wait(50);
      var notaEsperada = T.hpEvEfficiencyNote(fx, 0, "Leftovers", cap);
      check("com Leftovers e EV 0 (fixture escolhida pra não ser ideal), a nota aparece na tela de 'Meu build'",
        notaEsperada !== "" && out.innerHTML.indexOf(notaEsperada) !== -1,
        "esperado: " + notaEsperada.slice(0, 120));

      var melhorEvTeste = idealEv !== null ? idealEv : zeroEv;
      if (melhorEvTeste !== null) {
        evHpEl.value = String(melhorEvTeste);
        evHpEl.dispatchEvent(new Event("input", { bubbles: true }));
        await wait(50);
        check("trocando pra EV ideal, a nota some (não fica pendurada)",
          out.innerHTML.indexOf("cura 1/16 do HP máximo") === -1);
      }

      itemEl.value = "";
      itemEl.dispatchEvent(new Event("input", { bubbles: true }));
      evHpEl.value = "0";
      evHpEl.dispatchEvent(new Event("input", { bubbles: true }));
      await wait(50);
      check("tirando o item, a nota some mesmo com EV ruim de novo",
        out.innerHTML.indexOf("cura 1/16 do HP máximo") === -1);
    }
  }
}
