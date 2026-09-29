// Seções 25 a 29: time e caixa nunca compartilham o mesmo Pokémon, auditoria WCAG/eMAG, trava de level cap no gerador de build por IA, botão 'Gerar build com IA' no Meu Time e 'remover' banca pra caixa.
// Extraído de scripts/smoke_test_suite.js (refactor 2026-09-13) - conteúdo idêntico ao original, só movido pra seu próprio arquivo.
async function section10() {
  // --- 25. Time e caixa nunca compartilham o mesmo Pokémon (achado real em
  // revisão de código, 2026-09-12) - o botão "+ Caixa" na ficha da Dex só
  // desabilitava por `inBox`, nunca por `inTeam`: dava pra clicar
  // "Adicionar à caixa" com o Pokémon JÁ no time, deixando o mesmo x nos
  // dois arrays ao mesmo tempo (quebra a garantia que rosterMove() dá em
  // todo outro ponto de entrada - "nunca no time E na caixa"). Corrigido
  // desabilitando também por `inTeam` + uma checagem de defesa em
  // profundidade dentro do próprio handler de clique.
  // Garante 1 vaga livre no time - se estiver 6/6 (comum a essa altura da
  // suíte), clicar "+ Time" abriria o modal de troca em vez de adicionar
  // direto, o que quebraria as checagens abaixo.
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(30);
  const freeSlotBtn = document.querySelector(".team-slot .remove-btn");
  if (freeSlotBtn) { freeSlotBtn.click(); await wait(30); }
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  // Meowth - espécie não usada em nenhuma fixture anterior desta suíte
  // (Eevee/Forretress/Magcargo etc. já passaram por várias seções antes
  // desta e podiam estar no time ou na caixa por causa disso, invalidando
  // a checagem de "estado inicial limpo" que este teste precisa).
  setSearch("Meowth");
  await wait(120);
  const meowthRow = document.querySelector("#species-list .species-row");
  if (meowthRow) {
    meowthRow.click();
    await wait(30);
    // Texto curto nos botões de ação da ficha (achado real do usuário,
    // 2026-09-12: "+ Adicionar ao time" + "+ Adicionar à caixa" juntos
    // empilhavam em vez de ficar lado a lado numa largura de painel comum,
    // virando duas barras enormes). A frase completa mora no title/aria-label.
    check("botões de ação da ficha usam texto curto ('+ Time'/'+ Caixa', não mais 'Adicionar ao time/à caixa')",
      document.getElementById("add-team-btn").textContent === "+ Time" &&
      document.getElementById("add-box-btn").textContent === "+ Caixa" &&
      document.getElementById("add-team-btn").title.indexOf("Adicionar ao time") !== -1,
      { team: document.getElementById("add-team-btn").textContent, box: document.getElementById("add-box-btn").textContent });
    document.getElementById("add-team-btn").click();
    await wait(50);
    const addBoxBtnAfterTeam = document.getElementById("add-box-btn");
    check("botão '+ Caixa' fica desabilitado quando a espécie já está no time (não só quando já está na caixa)",
      // Rótulo continua "+ Caixa" (redesenho 2026-09-24: os dois botões diziam
      // "No time" lado a lado); o motivo fica no title.
      !!addBoxBtnAfterTeam && addBoxBtnAfterTeam.disabled && addBoxBtnAfterTeam.textContent === "+ Caixa" && addBoxBtnAfterTeam.title === "Já está no time",
      addBoxBtnAfterTeam && { disabled: addBoxBtnAfterTeam.disabled, text: addBoxBtnAfterTeam.textContent });
    addBoxBtnAfterTeam.click(); // deveria ser um no-op de verdade, não só visual
    await wait(30);
    const saveAfterGuard = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
    check("clicar mesmo assim não escreve o Pokémon na caixa (defesa em profundidade no handler, não só no disabled do botão)",
      (saveAfterGuard.box || []).indexOf("SPECIES_MEOWTH") === -1, saveAfterGuard.box);
  } else {
    check("Meowth encontrado pro teste de exclusividade time/caixa", false);
  }
  setSearch("");
  await wait(30);

  // --- 26. Auditoria WCAG/eMAG (2026-09-12) - todo .notes-status precisa
  // anunciar mensagens de status pra leitor de tela, mesmo padrão que o
  // toast/sync-banner/storage-banner já seguiam. Regressão-guarda: confirma
  // que as ocorrências reais no DOM (mybuild-status só existe com uma
  // build ativa, então não é checado aqui; team-strategy-status foi removido
  // junto com a Leitura estratégica, 2026-09-18) têm role="status"
  // aria-live="polite".
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(30);
  const teamStatusIds = ["archetype-status"];
  const missingAriaLiveTeam = teamStatusIds.filter(function (id) {
    var el = document.getElementById(id);
    return !el || el.getAttribute("aria-live") !== "polite" || el.getAttribute("role") !== "status";
  });
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  setSearch("Bulbasaur");
  await wait(120);
  const bulbaRowAudit = document.querySelector("#species-list .species-row");
  if (bulbaRowAudit) { bulbaRowAudit.click(); await wait(30); }
  const speciesStatusEl = document.getElementById("species-notes-status");
  const missingAriaLive = missingAriaLiveTeam.concat(
    (!speciesStatusEl || speciesStatusEl.getAttribute("aria-live") !== "polite" || speciesStatusEl.getAttribute("role") !== "status") ? ["species-notes-status"] : []
  );
  check("spans de status (.notes-status) anunciam mudança pra leitor de tela (role=status aria-live=polite)",
    missingAriaLive.length === 0, missingAriaLive);
  setSearch("");

  // --- 27. Gerador de build por IA: trava por level cap + exclusividade de
  // item no time (achados reais do usuário, 2026-09-12/13: "no gerador de
  // build ele não está considerando os golpes que estão disponíveis por lv"
  // + "todos os poke tem praticamente os mesmos itens... nenhum outro pode
  // ter a build montada com life orb").
  document.querySelector('.tab-btn[data-tab="progress"]').click();
  await wait(30);
  var diffSel = document.getElementById("settings-level-cap");
  var msSel27 = document.getElementById("settings-milestone");
  // Achado em auditoria de QA (2026-09-13): esta seção mudava
  // dificuldade/milestone e nunca restaurava - mesma classe de bug do
  // bloco de auto-evolução do Charmander mais acima (agora com
  // milestoneSelBeforeCharm). Inofensivo só porque nada depois desta
  // seção, até agora, dependia do valor anterior - captura e restaura no
  // fim da seção antes que isso mude.
  var diffSelBefore27 = diffSel ? diffSel.value : null;
  var msSelBefore27 = msSel27 ? msSel27.value : null;
  if (diffSel) { diffSel.value = "more"; diffSel.dispatchEvent(new Event("change", { bubbles: true })); }
  if (msSel27) { msSel27.value = "0"; msSel27.dispatchEvent(new Event("change", { bubbles: true })); }
  await wait(30);
  // Milestone 0 + Level Cap More = level cap 18 (data/levelcaps.json), o mesmo "lv 18"
  // do relato do usuário - Bulbasaur real tem golpes de nível 24 e 37
  // (Bind, Giga Drain, Grass Whistle, Natural Gift, Power Whip, Synthesis,
  // Petal Blizzard, Grassy Glide, Leaf Storm, Magical Leaf, Venoshock),
  // todos ACIMA do cap 18 - conferido direto no dado bruto antes de
  // escrever este teste, não chutado.
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  await addByName("Bulbasaur", false);
  await addByName("Charmeleon", false);
  window.__genAiPrompts = [];
  window.claude = {
    use: async function (name) {
      if (name !== "sample") return null;
      return {
        json: async function (prompt, opts) {
          window.__genAiPrompts.push(prompt);
          return { ability: "Overgrow", nature: "Modest", item: "", moves: ["Tackle", "Growl", "Vine Whip", "Sleep Powder"], evs: [0, 0, 0, 252, 0, 4], rationale: "teste level cap" };
        }
      };
    }
  };
  setSearch("Bulbasaur");
  await wait(120);
  var bulbaRow27 = document.querySelector("#species-list .species-row");
  if (bulbaRow27) {
    bulbaRow27.click();
    await wait(30);
    var aiBtn27 = document.getElementById("mybuild-ai-generate");
    if (aiBtn27) { aiBtn27.click(); await wait(150); }
  }
  var capPrompt = window.__genAiPrompts[0] || "";
  var aboveCapMoves = ["Bind", "Giga Drain", "Grass Whistle", "Natural Gift", "Power Whip", "Synthesis", "Petal Blizzard", "Grassy Glide", "Leaf Storm", "Magical Leaf", "Venoshock"];
  // Só o bloco do movepool: desde 2026-09-26 o prompt também traz a descrição
  // de itens ("Binding Band: ... binding moves" contém "Bind").
  var iniMovepool = capPrompt.indexOf("Movepool real");
  var blocoMovepool = iniMovepool === -1 ? capPrompt : capPrompt.slice(iniMovepool, capPrompt.indexOf("</dados_do_jogo>", iniMovepool));
  // Linha do movepool: "- Nome [tipo, ...]" (movePromptLine).
  var leakedMoves = aboveCapMoves.filter(function (m) { return blocoMovepool.indexOf("\n- " + m + " [") !== -1; });
  check("o bloco do movepool do prompt tem linhas de golpe no formato esperado (a checagem acima não é vazia)",
    /\n- [^\n]+ \[/.test(blocoMovepool));
  check("prompt de build por IA não lista golpes de nível acima do level cap atual (18)",
    !!capPrompt && leakedMoves.length === 0, leakedMoves);

  // Salva manualmente uma build com Life Orb pro Bulbasaur (fonte de
  // verdade real, não simulada) - depois gera pro Charmeleon tentando o
  // MESMO item de propósito, pra confirmar que ele fica (item pode repetir no
  // time desde 2026-09-27; antes a validação descartava).
  function setSel27(id, v) { var e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event("change", { bubbles: true })); }
  var abiSel = document.getElementById("mybuild-ability");
  if (abiSel) setSel27("mybuild-ability", abiSel.options[1] ? abiSel.options[1].value : "");
  var itemInput = document.getElementById("mybuild-item");
  if (itemInput) { itemInput.value = "Life Orb"; itemInput.dispatchEvent(new Event("input", { bubbles: true })); }
  var saveBtn27 = document.getElementById("mybuild-save");
  if (saveBtn27) { saveBtn27.click(); await wait(50); }
  setSearch("Charmeleon");
  await wait(120);
  var charRow27 = document.querySelector("#species-list .species-row");
  window.__genAiPrompts = [];
  window.claude = {
    use: async function (name) {
      if (name !== "sample") return null;
      return {
        json: async function (prompt, opts) {
          window.__genAiPrompts.push(prompt);
          return { ability: "Flame Body", nature: "Adamant", item: "Life Orb", moves: ["Scratch", "Smokescreen", "Fire Fang", "Slash"], evs: [0, 252, 0, 0, 0, 4], rationale: "teste item duplicado" };
        }
      };
    }
  };
  if (charRow27) {
    charRow27.click();
    await wait(30);
    var aiBtn27b = document.getElementById("mybuild-ai-generate");
    if (aiBtn27b) { aiBtn27b.click(); await wait(150); }
  }
  var itemPrompt = window.__genAiPrompts[0] || "";
  // 2026-09-27 o item passou a poder repetir; 2026-09-29 o usuário viu Hyper
  // Offense com Life Orb em todo mundo e decidiu: no máximo 2 iguais no time.
  // A IA volta a ver o que o time já segura.
  check("prompt de build por IA mostra os itens do time e o limite de 2 iguais",
    /Itens JA EM USO[^\n]*Life Orb/.test(itemPrompt) && /no MAXIMO 2 membros com o mesmo item/.test(itemPrompt), itemPrompt.slice(0, 400));
  var saveAfter27 = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
  // Busca pela origem, não pela posição: desde 2026-09-16 a auto-evolução é
  // reversível, e o Charizard que a seção 08 evoluiu volta a Charmeleon quando
  // o cap cai pra 18 - trazendo a build salva dele junto (mesma criatura).
  var charBuild27 = (saveAfter27.customBuilds["SPECIES_CHARMELEON"] || []).filter(function (b) { return b.source === "ia"; })[0];
  check("build por IA com o mesmo item de UM outro membro mantém o item (o 2º igual ainda é permitido)",
    !!charBuild27 && charBuild27.item === "Life Orb" && charBuild27.ability === "Flame Body",
    charBuild27);

  // Golpes repetidos entre membros do time (achado real do usuário,
  // 2026-09-20: "em grande maioria eles usam sempre o mesmo move... a
  // estratégia não tem variedade") - mesma disciplina do teste de item
  // acima, mas SEM a trava de defesa em profundidade pós-validação (não dá
  // pra remover 1 de 4 golpes sem deixar a build quebrada, ao contrário do
  // item que tem "vazio" como fallback válido - ver comentário de
  // teamMovesInUse). O Charmeleon salvo no teste anterior tem moves reais e
  // conhecidos (Scratch/Smokescreen/Fire Fang/Slash) - gera agora pro
  // Bulbasaur (também no time) e confere que o prompt cita esses golpes.
  window.__genAiPrompts = [];
  window.claude = {
    use: async function (name) {
      if (name !== "sample") return null;
      return {
        json: async function (prompt, opts) {
          window.__genAiPrompts.push(prompt);
          return { ability: "Overgrow", nature: "Bold", item: "", moves: ["Tackle", "Growl", "Vine Whip", "Growth"], evs: [252, 0, 252, 0, 0, 0], rationale: "teste golpe duplicado" };
        }
      };
    }
  };
  setSearch("Bulbasaur");
  await wait(120);
  var bulbaRow27b = [].slice.call(document.querySelectorAll("#species-list .species-row")).find(function (r) { return r.textContent.indexOf("Bulbasaur") !== -1; });
  if (bulbaRow27b) {
    bulbaRow27b.click();
    await wait(30);
    var aiBtn27c = document.getElementById("mybuild-ai-generate");
    if (aiBtn27c) { aiBtn27c.click(); await wait(150); }
  }
  var movePrompt = window.__genAiPrompts[0] || "";
  check("prompt de build por IA avisa quais golpes já estão em uso por outros membros do time",
    movePrompt.indexOf("Golpes JA EM USO") !== -1 && movePrompt.indexOf("Scratch") !== -1 && movePrompt.indexOf("Fire Fang") !== -1,
    movePrompt.slice(0, 600));
  setSearch("");
  await wait(30);

  // Papéis já cobertos por outros membros (achado real do usuário,
  // 2026-09-22: a correção de golpe repetido não bastou - "a estratégia não
  // tem variedade" também vem da IA nunca saber que papel os outros membros
  // já cumprem). Wartortle tem papel real confirmado (Pivô) em
  // data/species_role.json - fixture achada no dado, não inventada. Precisa
  // estar no time (não só na caixa/box) pra teamRolesInUse() contar.
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(30);
  var freeSlotRole = document.querySelector(".team-slot .remove-btn");
  if (freeSlotRole) { freeSlotRole.click(); await wait(30); }
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  setSearch("Wartortle");
  await wait(120);
  var wartortleRow = [].slice.call(document.querySelectorAll("#species-list .species-row")).find(function (r) { return r.textContent.indexOf("Wartortle") !== -1; });
  if (wartortleRow) {
    wartortleRow.click();
    await wait(30);
    var addTeamBtnW = document.getElementById("add-team-btn");
    if (addTeamBtnW && !addTeamBtnW.disabled) { addTeamBtnW.click(); await wait(30); }
  }
  window.__genAiPrompts = [];
  window.claude = {
    use: async function (name) {
      if (name !== "sample") return null;
      return {
        json: async function (prompt, opts) {
          window.__genAiPrompts.push(prompt);
          return { ability: "Torrent", nature: "Bold", item: "", moves: ["Tackle", "Withdraw", "Water Gun", "Rapid Spin"], evs: [252, 0, 252, 0, 4, 0], rationale: "teste papel Wartortle" };
        }
      };
    }
  };
  var aiBtnW = document.getElementById("mybuild-ai-generate");
  if (aiBtnW) { aiBtnW.click(); await wait(150); }
  setSearch("");
  await wait(30);

  setSearch("Charmeleon");
  await wait(120);
  var charRowRole = [].slice.call(document.querySelectorAll("#species-list .species-row")).find(function (r) { return r.textContent.indexOf("Charmeleon") !== -1; });
  window.__genAiPrompts = [];
  window.claude = {
    use: async function (name) {
      if (name !== "sample") return null;
      return {
        json: async function (prompt, opts) {
          window.__genAiPrompts.push(prompt);
          return { ability: "Blaze", nature: "Adamant", item: "", moves: ["Ember", "Scratch", "Smokescreen", "Dragon Rage"], evs: [252, 252, 0, 0, 0, 4], rationale: "teste papel duplicado" };
        }
      };
    }
  };
  if (charRowRole) {
    charRowRole.click();
    await wait(30);
    var aiBtnRole2 = document.getElementById("mybuild-ai-generate");
    if (aiBtnRole2) { aiBtnRole2.click(); await wait(150); }
  }
  var rolePrompt = window.__genAiPrompts[0] || "";
  check("prompt de build por IA avisa quais papéis já estão cobertos por outros membros do time",
    rolePrompt.indexOf("Papeis JA COBERTOS") !== -1 && rolePrompt.indexOf("Pivô") !== -1,
    rolePrompt.slice(0, 700));
  // Desde 2026-09-28 o elenco da próxima luta vai no próprio prompt
  // (blocoContextoIA) - a build sai numa chamada só, sem ferramentas.
  check("prompt de build por IA traz o contexto já calculado, sem mandar usar ferramenta",
    rolePrompt.indexOf("CONTEXTO JA CALCULADO PELO APP") !== -1 && rolePrompt.indexOf("getNextBossRoster") === -1,
    rolePrompt.slice(-900));
  setSearch("");
  await wait(30);

  // Gerador de build ignorava o arquétipo escolhido (achado real do
  // usuário, 2026-09-13, com print do time montado via "Montar melhor
  // time": "a build tem que ser de acordo com o ritmo que nós escolhemos e
  // a IA recomendou"). Define Clima=Trick Room (implicação mais concreta e
  // fácil de checar num prompt: Velocidade baixa de propósito) e confirma
  // que o prompt da build por IA passa a mencionar isso - depois limpa o
  // arquétipo e confirma que a menção desaparece (condicional de verdade,
  // não sempre presente).
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(30);
  var weatherChip27 = selecionarArquetipo("weather", "Trick Room");
  await wait(30);
  window.__genAiPrompts = [];
  window.claude = {
    use: async function (name) {
      if (name !== "sample") return null;
      return {
        json: async function (prompt, opts) {
          window.__genAiPrompts.push(prompt);
          return { ability: "Overgrow", nature: "Brave", item: "", moves: ["Tackle", "Growl", "Vine Whip", "Sleep Powder"], evs: [252, 252, 0, 0, 0, 0], rationale: "teste arquétipo" };
        }
      };
    }
  };
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  setSearch("Bulbasaur");
  await wait(120);
  var bulbaRow27d = document.querySelector("#species-list .species-row");
  if (bulbaRow27d) {
    bulbaRow27d.click();
    await wait(30);
    var aiBtn27d = document.getElementById("mybuild-ai-generate");
    if (aiBtn27d) { aiBtn27d.click(); await wait(150); }
  }
  var archPrompt = window.__genAiPrompts[0] || "";
  check("prompt de build por IA menciona o Clima e campo do time (Trick Room) quando um arquétipo está escolhido",
    archPrompt.indexOf("Clima e campo do time: Trick Room") !== -1 && archPrompt.indexOf("Velocidade BAIXA") !== -1,
    archPrompt.slice(0, 500));

  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(30);
  if (weatherChip27) selecionarArquetipo("weather", "");
  await wait(30);
  window.__genAiPrompts = [];
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  if (bulbaRow27b) {
    var aiBtn27e = document.getElementById("mybuild-ai-generate");
    if (aiBtn27e) { aiBtn27e.click(); await wait(150); }
  }
  var noArchPrompt = window.__genAiPrompts[0] || "";
  check("sem arquétipo escolhido, o prompt NÃO menciona Estilo/Clima e campo/Tática do time (condicional de verdade)",
    !!noArchPrompt && noArchPrompt.indexOf("Estilo do time") === -1 && noArchPrompt.indexOf("Clima e campo do time") === -1 && noArchPrompt.indexOf("Tatica do time") === -1,
    noArchPrompt.slice(0, 300));

  delete window.claude;
  setSearch("");
  await wait(30);
  document.querySelector('.tab-btn[data-tab="progress"]').click();
  await wait(30);
  if (diffSel && diffSelBefore27 !== null) { diffSel.value = diffSelBefore27; diffSel.dispatchEvent(new Event("change", { bubbles: true })); }
  if (msSel27 && msSelBefore27 !== null) { msSel27.value = msSelBefore27; msSel27.dispatchEvent(new Event("change", { bubbles: true })); }
  await wait(30);
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  // --- 28. Botão "Gerar build com IA" direto no card do Meu Time (achado
  // real do usuário, 2026-09-13: "não achei o botão de criar build na tela
  // do time como eu pedi" - antes só existia na ficha da Dex, obrigando o
  // jogador a trocar de aba). Chama a MESMA generateBuildWithAI() de sempre
  // (agora com um id de status por espécie, já que até 6 cards existem ao
  // mesmo tempo nesta tela - não dá pra reusar #mybuild-ai-status, que é
  // único). Também confirma que o botão novo NÃO aciona o "copiar" que já
  // existia (mesmo estilo visual, classe DIFERENTE de propósito). Usa
  // Squirtle - mas Squirtle NÃO é "espécie nova" de verdade: o teste de
  // mock da IA lá em cima (setSearch("Squirtle"), por volta da linha 1438)
  // já roda o gerador nela e deixa uma build de verdade salva. Rodando só
  // este trecho isolado isso não aparece (sem seção anterior pra sujar o
  // localStorage), mas rodando a suíte inteira o card do time já nasce COM
  // build salva e o botão "Gerar build com IA" nunca chega a existir -
  // achado exatamente assim, suíte completa passando 202 checks menos este,
  // isolado passando 100%. Em vez de caçar outra espécie "virgem" (o mesmo
  // erro se repete assim que alguém mais usar essa espécie em outro teste
  // futuro - já rotulamos Squirtle de "nova" uma vez e erramos), limpa de
  // verdade qualquer build salva da espécie de teste ANTES de assumir que
  // ela está vazia, usando o próprio botão real "Apagar esta"
  // (#mybuild-clear) da Dex - nunca mexendo direto no localStorage por fora
  // da UI.
  setSearch("Squirtle");
  await wait(120);
  const rowSquirtlePre28 = document.querySelector("#species-list .species-row");
  if (rowSquirtlePre28) {
    rowSquirtlePre28.click();
    await wait(30);
    for (let clearTry = 0; clearTry < 4; clearTry++) {
      const clearBtnPre28 = document.getElementById("mybuild-clear");
      if (!clearBtnPre28) break;
      clearBtnPre28.click();
      await wait(30);
    }
  }
  setSearch("");
  await wait(30);
  // Esvazia o time primeiro - garante vaga livre pro Squirtle independente
  // de quantos membros o time seed desta seção já tinha acumulado.
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(30);
  esvaziarTimePelosBotoes();
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  await addByName("Squirtle", false);
  const dexData28 = JSON.parse(document.getElementById("dexdata").textContent);
  const abilitiesByIdx28 = {};
  dexData28.abilities.forEach(function (a, i) { if (a) abilitiesByIdx28[i] = a[0]; });
  const movesByIdx28 = {};
  dexData28.moves.forEach(function (m, i) { if (m) movesByIdx28[i] = m[0]; });
  const sp28 = dexData28.species.find(function (s) { return s && s.sname === "SPECIES_SQUIRTLE"; });
  const squirtleOnTeam28 = (JSON.parse(localStorage.getItem("er_terminal_save") || "{}").team || []).indexOf("SPECIES_SQUIRTLE") !== -1;
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);
  const genBtn28 = sp28 && document.getElementById("ts-ai-generate-" + sp28.x);
  check("card do Meu Time tem o botão 'Gerar build com IA' quando não há build salva",
    !!genBtn28, { spFound: sp28 && sp28.n, squirtleOnTeam: squirtleOnTeam28 });
  if (genBtn28 && sp28) {
    const abiName28 = abilitiesByIdx28[sp28.ab[0]];
    const moveNames28 = sp28.lm.slice(0, 4).map(function (p) { return movesByIdx28[p[1]]; });
    window.claude = {
      use: async function (name) {
        if (name !== "sample") return null;
        return {
          json: async function () {
            return { ability: abiName28, nature: "Modest", item: "", moves: moveNames28, evs: [0, 0, 0, 0, 0, 0], rationale: "teste botão do time" };
          }
        };
      }
    };
    genBtn28.click();
    await wait(150);
    const saveAfter28 = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
    const build28 = (saveAfter28.customBuilds[sp28.sname] || [])[0];
    check("clicar no botão do card do time gera e salva a build de verdade (mesma validação de sempre)",
      !!build28 && build28.ability === abiName28, build28);
    check("o card do time atualiza sozinho pra mostrar a build nova, sem precisar trocar de aba",
      !!document.querySelector('.ts-build-copy[data-x="' + sp28.x + '"]') && !document.getElementById("ts-ai-generate-" + sp28.x));
    const copyBtn28 = document.querySelector('.ts-build-copy[data-x="' + sp28.x + '"]');
    if (copyBtn28) {
      copyBtn28.click();
      await wait(50);
      check("o botão 'copiar' ao lado continua funcionando (classes não colidiram)",
        document.getElementById("toast").textContent.indexOf("copiado") !== -1,
        document.getElementById("toast").textContent);
    }
    delete window.claude;
  }

  // --- 29. "remover" do Meu Time banca pra caixa, não descarta (achado em
  // auditoria completa da equipe, 2026-09-13) - antes disto,
  // state.team = state.team.filter(...) sozinho fazia o Pokémon sumir de
  // verdade (nem ia pra caixa), inconsistente com rosterMove()/
  // applyRecommendedTeam()/renderSavedTeams() "Carregar", que sempre banem
  // quem sai do time. Não assume QUEM está no time neste ponto da suíte
  // (muitas seções anteriores já mexeram nele) - só que há pelo menos 1
  // membro, e testa a remoção do primeiro encontrado.
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);
  const saveBefore29 = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
  const teamBefore29 = saveBefore29.team || [];
  if (teamBefore29.length) {
    const removedSname29 = teamBefore29[0];
    const removeBtn29 = document.querySelector(".remove-btn");
    if (removeBtn29) {
      removeBtn29.click();
      await wait(50);
      const saveAfter29 = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
      const stillInTeam29 = (saveAfter29.team || []).indexOf(removedSname29) !== -1;
      const nowInBox29 = (saveAfter29.box || []).indexOf(removedSname29) !== -1;
      check("'remover' do Meu Time manda o Pokémon pra caixa em vez de descartar",
        !stillInTeam29 && nowInBox29,
        { removedSname29, teamAfter: saveAfter29.team, boxHasIt: nowInBox29 });
    } else { check("botão 'remover' encontrado no card do Meu Time", false); }
  } else { check("time tinha pelo menos 1 membro pro teste de 'remover'", false, teamBefore29); }

  // --- 30. "Novo jogo" (reset de time e caixa) - pedido do usuário,
  // 2026-09-13, reescrito na auditoria de 2026-09-18 (bug real: usava
  // window.confirm() nativo, que o iframe sandboxed de um Artifact
  // publicado bloqueia sem erro nenhum - o botão "não fazia nada" pro
  // usuário). Agora usa o <dialog> #confirm-modal - testa os dois caminhos
  // de verdade, clicando nos botões reais do diálogo, não mockando window.
  // confirm. Semeia um Pikachu novo no time (não reusa fixture de seções
  // anteriores) e uma anotação real pra confirmar que ela sobrevive ao
  // reset.
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  setSearch("Pikachu");
  await wait(120);
  const pikaRow30 = document.querySelector("#species-list .species-row");
  if (pikaRow30) {
    pikaRow30.click();
    await wait(30);
    const notesArea30 = document.getElementById("species-notes-input");
    notesArea30.value = "nota de teste - deve sobreviver ao reset";
    document.getElementById("species-notes-save").click();
    await wait(30);
    document.getElementById("add-team-btn").click();
    await wait(30);
    document.querySelector('.tab-btn[data-tab="team"]').click();
    await wait(50);

    const resetBtn30 = document.getElementById("reset-team-box-btn");
    check("botão 'Novo jogo' existe e fica habilitado quando há time/caixa", !!resetBtn30 && resetBtn30.disabled === false);

    if (resetBtn30) {
      const teamBeforeCancel30 = JSON.parse(localStorage.getItem("er_terminal_save") || "{}").team;
      resetBtn30.click();
      await wait(50);
      const dialog30 = document.getElementById("confirm-modal");
      check("clicar em 'Novo jogo' abre o diálogo de confirmação (não window.confirm)", dialog30 && dialog30.open);
      check("diálogo explica o que será perdido e o que sobrevive",
        document.getElementById("confirm-modal-message").textContent.indexOf("Builds, anotações e times salvos continuam guardados") !== -1);
      document.getElementById("confirm-modal-cancel").click();
      await wait(50);
      check("cancelar fecha o diálogo sem mudar nada",
        !dialog30.open && JSON.stringify(teamBeforeCancel30) === JSON.stringify(JSON.parse(localStorage.getItem("er_terminal_save") || "{}").team));

      // 2026-09-24: "Novo jogo" zera a RUN inteira, não só time e caixa. Semeia
      // estado de run em todos os campos que antes sobreviviam ao reset.
      const S30 = window.__erTest.state;
      const dificuldadeAntes30 = S30.settings.difficulty;
      S30.settings.milestone = 2;
      S30.settings.runConfirmedAt = new Date().toISOString();
      S30.archetype = { pace: "Balance", weather: "Rain", monotype: null, reasoning: "teste" };
      S30.autoEvolved = { SPECIES_RATICATE: { from: "Rattata", lvl: 20 } };
      S30.gymSkillsCleared = { Roxanne: ["teste"] };
      resetBtn30.click();
      await wait(50);
      check("diálogo do 'Novo jogo' diz que zera a run inteira e o que continua guardado",
        /zera a sua run/.test(document.getElementById("confirm-modal-message").textContent) &&
          /Dificuldade, level cap e modo de Mega ficam como estão/.test(document.getElementById("confirm-modal-message").textContent));
      document.getElementById("confirm-modal-ok").click();
      await wait(80);
      const saveAfterReset30 = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
      check("confirmar 'Novo jogo' zera time E caixa",
        saveAfterReset30.team.length === 0 && saveAfterReset30.box.length === 0,
        { team: saveAfterReset30.team, box: saveAfterReset30.box });
      check("'Novo jogo' também volta a insígnia pro início e limpa arquétipo, auto-evolução e buffs de ginásio",
        saveAfterReset30.settings.milestone === 0 &&
          !saveAfterReset30.archetype.pace && !saveAfterReset30.archetype.weather &&
          Object.keys(saveAfterReset30.autoEvolved || {}).length === 0 &&
          Object.keys(saveAfterReset30.gymSkillsCleared || {}).length === 0,
        { milestone: saveAfterReset30.settings.milestone, archetype: saveAfterReset30.archetype, autoEvolved: saveAfterReset30.autoEvolved, gym: saveAfterReset30.gymSkillsCleared });
      check("'Novo jogo' mantém as opções de setup do jogo (dificuldade) mas pede pra confirmar a run de novo",
        saveAfterReset30.settings.difficulty === dificuldadeAntes30 && !saveAfterReset30.settings.runConfirmedAt &&
          document.getElementById("run-setup-banner").hidden === false);
      check("'Novo jogo' anota no log \"O que o app fez sozinho\"",
        (saveAfterReset30.autoLog || []).some(function (e) { return e.text.indexOf("Novo jogo:") === 0; }));
      check("anotação sobrevive ao reset (só a composição de time/caixa é limpa)",
        saveAfterReset30.notes && saveAfterReset30.notes.SPECIES_PIKACHU === "nota de teste - deve sobreviver ao reset");
      check("botão 'Novo jogo' fica desabilitado depois, sem nada pra resetar",
        document.getElementById("reset-team-box-btn").disabled === true);
    }
  } else { check("Pikachu encontrado pro teste de 'Novo jogo'", false); }
}
