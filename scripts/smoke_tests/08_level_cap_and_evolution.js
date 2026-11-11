// Seções o pacote 'level cap' (auto-evolução do Charmander), a correção de exibição (evoConditionText) e a seção 18 (TYPE_MOD_ABILITIES).
// Extraído de scripts/smoke_test_suite.js (refactor 2026-09-13) - conteúdo idêntico ao original, só movido pra seu próprio arquivo.
async function section08() {
  await prepararRunPadrao();
  // --- Pacote "level cap", 2026-09-10: 3 ideias interligadas, decisões
  // confirmadas pelo usuário antes de construir (build/nota carrega pro
  // nome novo; encadeia quantas evoluções o cap libere de uma vez; roda na
  // hora, ao mudar milestone/dificuldade). Charmander usado como fixture
  // NOVA pra auto-evolução (não Bulbasaur/Squirtle, já usados acima) -
  // Charmander evolui pra Charmeleon no nível 16 e Charmeleon pra Charizard
  // no 36 (confirmado direto na Dex, não vanilla assumido).
  // NOTA real encontrada testando isto: os caps reais desta dificuldade
  // pulam de 25 (índice 1) direto pra 40 (índice 2) - não existe um
  // milestone com cap estritamente entre 16 e 36, então essa mudança
  // específica de cap encadeia as DUAS evoluções de uma vez (Charmander ->
  // Charmeleon -> Charizard), não apenas uma. Isso não é um problema do
  // teste nem do código - é exatamente o cenário "encadear até o limite do
  // cap" que o usuário pediu, só que descoberto por acaso em vez de
  // escolhido de propósito. Charizard já é fixture usada extensivamente em
  // outras seções (sempre só na Dex, nunca antes posta no time/caixa), então
  // não há conflito de estado - só ajustei a asserção pra refletir o
  // encadeamento completo de verdade, em vez de assumir 1 etapa isolada.
  document.getElementById("tabs-more-toggle").click();
  await wait(20);
  document.querySelector('.tab-btn[data-tab="progress"]').click();
  await wait(50);
  // Achado em auditoria de QA (2026-09-13): este bloco mudava o milestone
  // e nunca restaurava, ao contrário do padrão disciplinado já usado mais
  // acima (milestoneSelBefore/restauração perto da linha 383) - inofensivo
  // só porque nada depois deste bloco, até agora, precisava de "sem
  // limite" pra travar golpe por nível. Captura e restaura pelo mesmo
  // motivo, antes que uma seção futura dependa disso sem perceber.
  const milestoneSelBeforeCharm = document.getElementById("settings-milestone").value;
  document.getElementById("settings-milestone").value = "1"; // Stone Badge, cap 25 nesta dificuldade
  document.getElementById("settings-milestone").dispatchEvent(new Event("change", { bubbles: true }));
  await wait(50);
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  // Achado em auditoria de QA (2026-09-13), causa raiz de verdade da flake
  // "anotação migrou" documentada há muitas sessões (não era timing): o
  // comentário original acima afirma que Charizard "não há conflito de
  // estado" por nunca ter sido posto no time/caixa antes - mas duas
  // seções BEM mais acima ("Meu build status preview" e o teste de banner
  // de armazenamento logo depois, que reusa a mesma espécie ainda
  // selecionada) deixam uma anotação suja em memória em
  // state.notes.SPECIES_CHARIZARD (o teste de quota simula a escrita
  // falhando no disco, mas o valor em memória fica setado mesmo assim).
  // A migração de anotação (artifact_template.html ~2484) DE PROPÓSITO só
  // migra se o destino ainda não tem nota nenhuma
  // (`if (state.notes[sp.sname] && !state.notes[target.sname])`) - pra
  // nunca sobrescrever algo que o jogador já escreveu. Decisão de produto
  // correta, não bug - mas quebra a suposição deste teste de que Charizard
  // chegaria "vazio". Limpa a nota de Charizard de propósito antes de
  // começar, em vez de assumir.
  setSearch("Charizard");
  await wait(120);
  const charRowPreClear = document.querySelector("#species-list .species-row");
  if (charRowPreClear) {
    charRowPreClear.click();
    await wait(30);
    const notesAreaPreClear = document.getElementById("species-notes-input");
    notesAreaPreClear.value = "";
    document.getElementById("species-notes-save").click();
    await wait(30);
  }
  setSearch("");
  await wait(120);

  setSearch("Charmander");
  await wait(120);
  const charmanderRow = document.querySelector("#species-list .species-row");
  if (charmanderRow) {
    charmanderRow.click();
    await wait(30);
    check("LV do 'Meu build' vem do level cap configurado, não digitado à mão",
      document.getElementById("mybuild-level").value === "25" &&
      document.querySelector('label[for="mybuild-level"]').textContent.indexOf("25") !== -1,
      document.getElementById("mybuild-level").value);
    const lockedHint = [...document.querySelectorAll(".mybuild-hint")].map(h => h.textContent).find(t => t.indexOf("acima do level cap") !== -1);
    check("aviso de golpes travados aparece quando há golpes acima do cap", !!lockedHint, lockedHint);
    const moveOpts = [...document.querySelectorAll("#mybuild-move-0 option")].filter(o => o.value);
    check("seletor de golpe não está vazio mesmo com trava aplicada", moveOpts.length > 0, moveOpts.length);

    // Salva build + anotação ANTES de evoluir, pra confirmar que ambas
    // migram pro nome novo (decisão do usuário: carrega, não descarta).
    const notesArea = document.getElementById("species-notes-input");
    notesArea.value = "nota de teste pre-evolucao (Charmander)";
    document.getElementById("species-notes-save").click();
    await wait(30);
    document.getElementById("mybuild-save").click();
    await wait(30);

    document.getElementById("add-box-btn").click();
    await wait(30);
    const boxBefore = JSON.parse(localStorage.getItem("er_terminal_save") || "{}").box;
    check("Charmander entrou na caixa antes do teste de auto-evolução",
      boxBefore.indexOf("SPECIES_CHARMANDER") !== -1, JSON.stringify(boxBefore));

    // Sobe o cap pra 40 (Knuckle Badge/índice 2) - acima do requisito de
    // Charmander->Charmeleon (16), abaixo do de Charmeleon->Charizard (36),
    // então deve evoluir EXATAMENTE 1 vez, não encadear até Charizard.
    document.getElementById("tabs-more-toggle").click();
    await wait(20);
    document.querySelector('.tab-btn[data-tab="progress"]').click();
    await wait(50);
    document.getElementById("settings-milestone").value = "2";
    document.getElementById("settings-milestone").dispatchEvent(new Event("change", { bubbles: true }));
    // Achado em auditoria de QA (2026-09-13): era um wait(80) fixo - a
    // outra das 2 flakes documentadas há muitas sessões (especificamente
    // "anotação migrou", nunca os outros checks deste bloco - sinal de
    // que a migração de notes acontece um passo depois da de box/
    // customBuilds, não simultânea). Espera o sinal mais fundamental da
    // cascata inteira (a caixa já mostrando Charizard) em vez de um tempo
    // chutado - todo o resto (build, anotação) é escrito na mesma
    // chamada de persist() que já colocou Charizard na caixa.
    await pollUntil(function () {
      var s = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
      return Array.isArray(s.box) && s.box.indexOf("SPECIES_CHARIZARD") !== -1;
    });
    const toastText = document.getElementById("toast").textContent;
    const saveAfter = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
    check("auto-evolução dispara na hora, ao mudar o level cap (sem precisar de outro save manual)",
      toastText.indexOf("Charmander") !== -1 && toastText.indexOf("Charmeleon") !== -1, toastText);
    check("cap saltou o suficiente pra encadear as DUAS evoluções de uma vez (Charmander -> Charmeleon -> Charizard)",
      toastText.indexOf("Charizard") !== -1, toastText);
    check("Charmander virou Charizard na caixa (encadeamento completo, nada ficou parado em Charmeleon)",
      saveAfter.box.indexOf("SPECIES_CHARIZARD") !== -1 && saveAfter.box.indexOf("SPECIES_CHARMANDER") === -1 && saveAfter.box.indexOf("SPECIES_CHARMELEON") === -1,
      JSON.stringify(saveAfter.box));
    check("build salva migrou até o nome final (Charizard), não ficou órfã em nenhum estágio intermediário",
      saveAfter.customBuilds && !!saveAfter.customBuilds.SPECIES_CHARIZARD && !saveAfter.customBuilds.SPECIES_CHARMANDER && !saveAfter.customBuilds.SPECIES_CHARMELEON,
      saveAfter.customBuilds && Object.keys(saveAfter.customBuilds));
    check("anotação migrou até o nome final junto com a build",
      saveAfter.notes && saveAfter.notes.SPECIES_CHARIZARD === "nota de teste pre-evolucao (Charmander)" && !saveAfter.notes.SPECIES_CHARMANDER && !saveAfter.notes.SPECIES_CHARMELEON,
      saveAfter.notes);
    document.querySelector('.tab-btn[data-tab="box"]').click();
    await wait(50);
    // PC Box (Fase 2, 2026-09-11/12) só mostra sprite na grade - usa a busca
    // (que pula pra caixa+slot certo) pra confirmar que a tela realmente
    // re-renderizou com o nome final, não só o localStorage.
    const pcSearchEvo = document.getElementById("pcbox-search");
    pcSearchEvo.value = "Charizard";
    pcSearchEvo.dispatchEvent(new Event("input", { bubbles: true }));
    await wait(50);
    const foundCharizard = document.querySelector(".pcbox-detail .pcbox-detail-name");
    check("a caixa mostra Charizard na tela, não só no localStorage (re-render real)",
      !!foundCharizard && foundCharizard.textContent === "Charizard", foundCharizard && foundCharizard.textContent);
    pcSearchEvo.value = "Charmander";
    pcSearchEvo.dispatchEvent(new Event("input", { bubbles: true }));
    await wait(50);
    const stillOnCharizard = document.querySelector(".pcbox-detail .pcbox-detail-name");
    check("a busca da PC Box não encontra mais Charmander (não ficou órfão parado em nome antigo)",
      !stillOnCharizard || stillOnCharizard.textContent !== "Charmander",
      stillOnCharizard && stillOnCharizard.textContent);
    pcSearchEvo.value = "";
    pcSearchEvo.dispatchEvent(new Event("input", { bubbles: true }));
  } else { check("Charmander encontrado pro teste de level cap", false); }
  document.getElementById("tabs-more-toggle").click();
  await wait(20);
  document.querySelector('.tab-btn[data-tab="progress"]').click();
  await wait(50);
  document.getElementById("settings-milestone").value = milestoneSelBeforeCharm;
  document.getElementById("settings-milestone").dispatchEvent(new Event("change", { bubbles: true }));
  await wait(50);
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  // --- Correção de exibição, 2026-09-10: achado ao construir a auto-
  // evolução (mesma classe de bug - rs vem como STRING no dado bruto, não
  // number), mas num lugar diferente e pré-existente: evoConditionText() na
  // ficha da Dex sempre caía no fallback e mostrava só o número solto
  // ("16") em vez de "Nível 16" - nenhuma evolução por nível JAMAIS
  // mostrou o prefixo "Nível" corretamente até esta correção. Milotic
  // (Mega Evolução) é a fixture de controle - confirma que o fix não
  // alterou o texto de condições não-numéricas.
  setSearch("Charmander");
  await wait(120);
  const charmanderRow2 = document.querySelector("#species-list .species-row");
  if (charmanderRow2) {
    charmanderRow2.click();
    await wait(30);
    check("linha evolutiva mostra 'Nível 16', não só '16' solto",
      document.querySelector(".evo-chain").textContent.indexOf("Nível 16") !== -1,
      document.querySelector(".evo-chain").textContent);
  } else { check("Charmander encontrado pro teste de texto de evolução", false); }
  setSearch("Milotic");
  await wait(120);
  const miloticRow = [...document.querySelectorAll("#species-list .species-row")].find(r => r.querySelector(".sname").textContent === "Milotic");
  if (miloticRow) {
    miloticRow.click();
    await wait(30);
    check("condição de Mega Evolução continua intacta (não é 'Nível X')",
      document.querySelector(".evo-chain").textContent.indexOf("Mega Evolução") !== -1 &&
      document.querySelector(".evo-chain").textContent.indexOf("Nível") === -1,
      document.querySelector(".evo-chain").textContent);
  } else { check("Milotic encontrado pro teste de texto de evolução (Mega)", false); }

  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  setSearch("");
  await wait(120);

  // --- 18. TYPE_MOD_ABILITIES coverage (décima-oitava passagem, 2026-09-11) ---
  // Regressão-guarda pra tabela que cresceu de 6 pra 37 entradas nesta
  // passagem (pedido do usuário: acurácia dos dados heurísticos entre
  // 90-95%, já que o "leitor de caixa" reusa abilityTypeMod() pra QUALQUER
  // espécie da caixa, não só o time). Roda por ÚLTIMO de propósito - troca
  // 3 dos 6 slots do time fixture original (Aerodactyl Mega/Probopass/.../
  // Tyranitar Mega Redux) por Forretress/Magcargo/Eevee, que nenhum teste
  // anterior nesta suíte depende mais a essa altura (localStorage.clear()
  // logo abaixo limpa tudo de qualquer forma).
  for (const n of ["Forretress", "Magcargo", "Eevee"]) {
    await addByName(n, true);
  }
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);
  async function swapSlotFor(slotIdx, wantName) {
    const slots = [...document.querySelectorAll(".team-slot")];
    const btn = slots[slotIdx] && slots[slotIdx].querySelector(".ts-swap-btn");
    if (!btn) { check("botão de trocar encontrado no slot " + slotIdx, false); return; }
    btn.click();
    await wait(30);
    const pick = [...document.querySelectorAll(".swap-pick")].find(b => b.title === wantName);
    if (!pick) { check(wantName + " disponível pra trocar no time", false); return; }
    pick.click();
    await wait(50);
  }
  await swapSlotFor(0, "Forretress");
  await swapSlotFor(1, "Magcargo");
  await swapSlotFor(2, "Eevee");
  await wait(50);
  // Números batem com cálculo manual (ver commit 7e39577): Forretress
  // (Bug/Steel) vs Fire = 4x cru * 0.5 Heatproof = 2x; Magcargo (Fire/Rock)
  // vs Ice = 0.5 cru * 0.7 Magma Armor = 0.35x, vs Water = 4x cru * 0.7 =
  // 2.8x; Eevee (Normal) vs Fire = 1x cru * 2 Fluffy = 2x - mas rotulado
  // FRAQUEZA, não resistência (o bug de rótulo corrigido nesta passagem).
  const covFlags = [...document.querySelectorAll(".cov-flag")].map(el => el.title);
  check("Heatproof (innate do Forretress) ajusta a cobertura como resistência",
    covFlags.indexOf("Heatproof (resistência extra)") !== -1, covFlags.join(" | "));
  check("Magma Armor (innate do Magcargo) ajusta a cobertura como resistência (2 tipos)",
    covFlags.filter(f => f === "Magma Armor (resistência extra)").length >= 2, covFlags.join(" | "));
  check("Fluffy (innate do Eevee) ajusta a cobertura como FRAQUEZA, não resistência",
    covFlags.indexOf("Fluffy (fraqueza extra)") !== -1, covFlags.join(" | "));


  // ---- Build que muda de espécie precisa valer pra espécie nova (achado do
  // usuário, print de 2026-09-24: Haxorus com "Ability: Moxie" - habilidade só
  // do Axew/Fraxure - depois da auto-evolução; 583 dos 729 pares de evolução
  // por nível mudam o conjunto de habilidades escolhíveis neste hack). ----
  {
    const TE = window.__erTest;
    const fraxure = TE.getSpeciesBySname("SPECIES_FRAXURE");
    const haxorus = TE.getSpeciesBySname("SPECIES_HAXORUS");
    if (achou("Fraxure e Haxorus reais (fixture da evolução de build)", fraxure && haxorus)) {
      const escolhiveisHax = TE.uniqueIds(haxorus.ab).map(function (id) { return TE.ABILITIES[id][0]; });
      const logAntes = TE.state.autoLog.slice();
      const buildAntes = TE.state.customBuilds["SPECIES_HAXORUS"];
      const buildFraxAntes = TE.state.customBuilds["SPECIES_FRAXURE"];
      delete TE.state.customBuilds["SPECIES_HAXORUS"];
      TE.state.customBuilds["SPECIES_FRAXURE"] = [{ ability: "Moxie", nature: "Adamant", item: "", moves: ["Dragon Claw", "Earthquake"], ivs: [31, 31, 31, 31, 31, 31], evs: [0, 252, 0, 0, 0, 252], source: "ia", active: true, savedAt: "x", rationale: "Moxie acumula ataque" }];
      TE.carryUserData("SPECIES_FRAXURE", "SPECIES_HAXORUS");
      const carregada = (TE.state.customBuilds["SPECIES_HAXORUS"] || [])[0];
      check("evoluir Fraxure -> Haxorus leva a build, mas a habilidade vira uma escolhível REAL do Haxorus (não Moxie)",
        !!carregada && escolhiveisHax.indexOf(carregada.ability) !== -1 && carregada.ability !== "Moxie" &&
          carregada.moves.join(",") === "Dragon Claw,Earthquake" && carregada.rationale === "",
        carregada);
      check("o ajuste aparece no log \"O que o app fez sozinho\", com o valor antigo",
        TE.state.autoLog.some(function (e) { return e.text.indexOf("Build de Haxorus ajustada") === 0 && e.text.indexOf("Moxie") !== -1; }),
        TE.state.autoLog[0] && TE.state.autoLog[0].text);
      check("a build antiga sai da espécie anterior (não fica duplicada)", !TE.state.customBuilds["SPECIES_FRAXURE"]);
      // Save que já chegou contaminado (como o do usuário): conferido ao carregar.
      TE.state.customBuilds["SPECIES_HAXORUS"] = [{ ability: "Moxie", nature: "Adamant", item: "", moves: ["Dragon Claw"], ivs: [31, 31, 31, 31, 31, 31], evs: [0, 0, 0, 0, 0, 0], source: "ia", active: true, savedAt: "x", rationale: "" }];
      const mudou = TE.reconciliarBuildsSalvas();
      check("build já salva com habilidade inexistente na espécie é corrigida na conferência do save",
        mudou === true && escolhiveisHax.indexOf(TE.state.customBuilds["SPECIES_HAXORUS"][0].ability) !== -1,
        TE.state.customBuilds["SPECIES_HAXORUS"][0].ability);
      check("uma segunda conferência não muda mais nada (já valia)", TE.reconciliarBuildsSalvas() === false);
      if (buildAntes) TE.state.customBuilds["SPECIES_HAXORUS"] = buildAntes; else delete TE.state.customBuilds["SPECIES_HAXORUS"];
      if (buildFraxAntes) TE.state.customBuilds["SPECIES_FRAXURE"] = buildFraxAntes; else delete TE.state.customBuilds["SPECIES_FRAXURE"];
      TE.state.autoLog = logAntes;
    }
  }

}
