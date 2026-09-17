// Seção 19 (2026-09-17): dois achados da verificação de "Gym Skills" contra o
// código-fonte oficial (github.com/Elite-Redux/eliteredux-source, branch
// upcoming, conferido linha a linha em src/battle_main.c).
//
// P1 - DIFF_TO_BOSSKEY estava deslocado uma posição: o jogo usa o mesmo
// campo "party" pra Easy E Ace (a diferença entre elas é só EVs habilitados,
// não o time), e só troca de time em Elite ("insane") e Hell ("hell", que o
// app não modela). O app usava ace->insane e elite->hell, mostrando o time
// errado por padrão pra quem joga Ace ou Elite.
async function section19() {
  await prepararRunPadrao();
  var T = window.__erTest;
  if (!T) { check("ponte de teste disponível", false); return; }

  var diffOriginal = T.state.settings.difficulty;
  document.querySelector('.tab-btn[data-tab="bosses"]').click();
  await wait(50);
  document.getElementById("boss-search-input").value = "Roxanne 1";
  document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));
  await wait(30);
  var row = document.querySelector("#boss-list .species-row");
  if (achou("Roxanne 1 (fixture) na lista de chefões", row)) {
    function timeSelecionadoPara(dificuldade) {
      T.state.settings.difficulty = dificuldade;
      row.click();
      return document.querySelectorAll(".boss-mon-card .bm-name").length;
    }
    // O fixture Roxanne 1 tem 5 membros no time "party" (Easy/Ace) e 6 no
    // "insane" (Elite) - conferido direto em data/bosses.json antes de
    // escrever este teste, não chutado.
    check("Dificuldade Easy mostra o time \"party\" (5 membros) por padrão",
      timeSelecionadoPara("easy") === 5, "membros=" + document.querySelectorAll(".boss-mon-card .bm-name").length);
    check("Dificuldade Ace mostra o time \"party\" (5 membros) por padrão, não o \"insane\"",
      timeSelecionadoPara("ace") === 5, "membros=" + document.querySelectorAll(".boss-mon-card .bm-name").length);
    check("Dificuldade Elite mostra o time \"insane\" (6 membros) por padrão",
      timeSelecionadoPara("elite") === 6, "membros=" + document.querySelectorAll(".boss-mon-card .bm-name").length);
    var insaneBtn = document.querySelector('.chip-btn[data-diff="insane"]');
    check("o seletor manual de chips (Padrão/Insane/Hell) continua disponível pra conferir os outros tiers",
      !!insaneBtn);
  }
  T.state.settings.difficulty = diffOriginal;
  document.getElementById("boss-search-input").value = "";
  document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));

  // P2 - Gym Skills: achado real durante a investigação, o mecanismo que a
  // FAQ oficial descreve (derrotar treinador de apoio tira um buff do líder)
  // NÃO vem do sistema exclusivo do modo Hell (que eu tinha achado primeiro
  // e é irrelevante pra quem joga Ace/Elite/Easy). Vem do script de cada
  // ginásio (EventScript_CheckTrainers), sem trava de dificuldade - achado
  // só depois que o usuário confirmou, jogando, que via isso em qualquer
  // dificuldade. Dado extraído de scripts.pory de cada ginásio real.
  check("ponte expõe GYM_SKILLS com os 9 líderes confirmados na fonte",
    !!T.GYM_SKILLS && Object.keys(T.GYM_SKILLS.leaders || {}).length === 9,
    T.GYM_SKILLS && JSON.stringify(Object.keys(T.GYM_SKILLS.leaders || {})));
  check("gymLeaderBaseName tira o número da rebatalha",
    T.gymLeaderBaseName("Roxanne 3") === "Roxanne" && T.gymLeaderBaseName("Wallace") === "Wallace");

  document.getElementById("boss-search-input").value = "Roxanne 1";
  document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));
  await wait(30);
  var roxRow = document.querySelector("#boss-list .species-row");
  if (achou("Roxanne 1 (fixture) achada de novo pro card de Gym Skills", roxRow)) {
    roxRow.click();
    await wait(50);
    var card = document.querySelector('#boss-detail [data-gym-leader="Roxanne"]');
    if (achou("card \"Buffs do ginásio\" aparece pra um líder de ginásio", card)) {
      var boxes = card.querySelectorAll("[data-gymskill]");
      check("mostra os 3 buffs confirmados de Roxanne, sem citar nenhum treinador de apoio pelo nome",
        boxes.length === 3 && !/Josh|Tommy|Marc/.test(card.textContent), "boxes=" + boxes.length);
      check("todos começam desmarcados (nada foi tirado ainda nesta run de teste)",
        [...boxes].every(function (b) { return !b.checked; }));
      check("resumo mostra 3 de 3 buffs restantes", /3 de 3/.test(card.querySelector(".gym-skill-summary").textContent),
        card.querySelector(".gym-skill-summary").textContent);

      boxes[0].click();
      boxes[0].dispatchEvent(new Event("change", { bubbles: true }));
      await wait(30);
      card = document.querySelector('#boss-detail [data-gym-leader="Roxanne"]');
      check("marcar um buff atualiza o resumo pra 2 de 3 e persiste no save",
        /2 de 3/.test(card.querySelector(".gym-skill-summary").textContent) &&
        Array.isArray(JSON.parse(localStorage.getItem("er_terminal_save") || "{}").gymSkillsCleared.Roxanne),
        card.querySelector(".gym-skill-summary").textContent);

      // desmarca de volta, deixando o save como estava antes do teste
      var stillChecked = card.querySelector("[data-gymskill]:checked");
      if (stillChecked) { stillChecked.click(); stillChecked.dispatchEvent(new Event("change", { bubbles: true })); await wait(30); }
    }
  }

  document.getElementById("boss-search-input").value = "Sidney";
  document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));
  await wait(30);
  var sidneyRow = document.querySelector("#boss-list .species-row");
  if (achou("Sidney (Alto Comando, fixture de não-líder)", sidneyRow)) {
    sidneyRow.click();
    await wait(50);
    check("chefão que não é líder de ginásio não ganha o card de Gym Skills",
      !document.querySelector("#boss-detail [data-gym-leader]"));
  }

  document.getElementById("boss-search-input").value = "Juan 1";
  document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));
  await wait(30);
  var juanRow = document.querySelector("#boss-list .species-row");
  if (achou("Juan 1 (fixture, ginásio sem buffs progressivos)", juanRow)) {
    juanRow.click();
    await wait(50);
    var juanCard = document.querySelector('#boss-detail [data-gym-leader="Juan"]');
    check("Sootopolis (Juan/Wallace) mostra a trava explicada, sem checkboxes de buff",
      !!juanCard && juanCard.querySelectorAll("[data-gymskill]").length === 0 && /10 treinadores/.test(juanCard.textContent),
      juanCard ? juanCard.textContent.slice(0, 120) : "(sem card)");
  }

  document.getElementById("boss-search-input").value = "";
  document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
}
