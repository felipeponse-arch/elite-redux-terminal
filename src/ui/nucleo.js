  // ===== src/ui/nucleo.js =====
  // Estado do app (state), gravação no aparelho e a camada de ações (acao/TELAS): toda mudança grava uma vez e redesenha cada tela uma vez.
  // Interface: lê e desenha a página. Colado no <script> principal por
  // scripts/build.mjs (marcador @ui nucleo.js) no MESMO lugar de onde saiu do
  // template (fase 5 da refatoração, 2026-09-24) - a ordem de execução não mudou.

  // ---------------- state ----------------
  var state = {
    query: "",
    typeFilter: new Set(),
    sort: "dex",
    selected: null,
    team: [],
    box: [],
    // megaMode (2026-09-16, regra de jogo passada pelo usuário): o Elite Redux
    // tem dois modos de Mega Evolução - ver megaMode() e battleUnitsOf().
    settings: { difficulty: "ace", levelCapMode: "more", milestone: 0, megaMode: "temporaria", runConfirmedAt: null },
    savedTeams: [],
    // snames from the last loaded save that this data build doesn't
    // recognise (e.g. a save made on a newer game version). Kept verbatim
    // and written back by buildSave() so importing an old save into this
    // build, then saving again, doesn't delete those Pokemon for good.
    orphans: { team: [], box: [] },
    // Free-text notes per species, sname-keyed - "minhas anotações", 2026-09-09
    // field research follow-up: the official NextDex for this same game has
    // a per-species notes field the PLAYER fills in, separate from anything
    // the site curates - this project had build history and boss-reference
    // builds (both things I write), but nothing where the user writes
    // something themselves without going through me. Purely additive field,
    // safe default {} for any save saved before this existed - no
    // SCHEMA_VERSION bump needed, same pattern as adding `orphans` earlier.
    notes: {},
    // Evoluções feitas SOZINHAS pela auto-evolução por level cap, keyed pelo
    // sname de destino: { from: snameDeOrigem, lvl: nivelExigido }. Existe
    // pra poder DESFAZER (ver devolveChainByX) - achado real do usuário,
    // 2026-09-16: "eu ainda estava no lv 55 e vc evoluiu pra Selenumbra, mas
    // no jogo ele só evolui no 56". O dado está certo (Volcarona Redux ->
    // Selenumbra no 56); o furo era a evolução ser irreversível: passar por
    // um cap maior nem que por um instante (ex: trocar a dificuldade antes
    // do marco) evoluía e nunca mais voltava.
    autoEvolved: {},
    // Registro do que o app mudou sozinho (item U4 da pauta, 2026-09-16) -
    // o aviso passageiro (toast) some em segundos; aqui fica guardado.
    autoLog: [],
    // Quais buffs de Gym Skill o jogador ja "tirou" de cada lider (venceu o
    // treinador de apoio correspondente) - sname-agnostico, chaveado pelo
    // nome-base do lider (mesma chave de GYM_LEADER_MILESTONE). O app NUNCA
    // pede pra dizer qual treinador, so se o efeito ja saiu ou nao (pedido
    // explicito do usuario).
    gymSkillsCleared: {},
    // Interactive "meu build" per species, sname-keyed - 2026-09-09, user
    // feedback: the free-text notes field above has "no interaction with
    // the Pokemon", the user has to type everything by hand instead of
    // picking from real options. This is the structured counterpart -
    // ability/nature/item/moves picked from that species' own real data
    // (choosable abilities, its actual movepool, the full item list), IVs/
    // EVs as numbers - rendered as a Showdown block via the same
    // showdownSet() every other build source already uses. Purely
    // additive, same {} safe-default pattern as notes/orphans.
    customBuilds: {},
    // Sets de "Estratégias" já gerados, por sname (pedido do usuário,
    // 2026-09-24: economizar chamada de IA - antes ficavam só na memória e
    // cada recarga da página pagava a mesma chamada de novo). Ver
    // sanitizarStrategySets() em applySave().
    strategySets: {},
    // Arquétipo do time (Fase 3b do roadmap de estratégia, 2026-09-12) - dois
    // eixos INDEPENDENTES (fonte real trazida pelo usuário, r/VGC via
    // Reddit): ritmo (Hyper Offense/Balance/Bulky Offense/Stall/Semi-Stall)
    // e clima (Sand/Rain/Sun/Snow/Trick Room) - um time pode ser os dois ao
    // mesmo tempo (ex: "Sand Balance"). null = ainda não definido. Os dois
    // <select> são a fonte de verdade (controle explícito, RN05); a IA usa
    // esse alvo pra MONTAR um time real (generateTeamForArchetype), nunca
    // decide o alvo sozinha nem aplica sem o jogador clicar "Usar este time".
    // `reasoning` guarda o motivo da ÚLTIMA recomendação aplicada de verdade.
    // Purely additive, mesmo padrão {} -> null-fields de notes/customBuilds.
    // Monotype adicionado como terceiro eixo (2026-09-17) - null = não
    // definido, mesma disciplina dos outros dois.
    archetype: { pace: null, weather: null, monotype: null, tatica: null, reasoning: "" }
  };

  var STORE_KEY = "er_terminal_save";

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }




  // As 4 operações que mudam builds salvas são AÇÕES (ver acao()): gravam e
  // redesenham o que mostra build (card do time, ficha aberta, confronto do
  // chefão) sozinhas - quem chama não precisa lembrar de nada disso.
  function setOrReplaceActiveBuild(sname, build, source) {
    return acao(telasDeBuild(sname), function () {
      var list = getBuildList(sname).slice();
      var activeIdx = -1;
      for (var i = 0; i < list.length; i++) { if (list[i].active) { activeIdx = i; break; } }
      var entry = entradaDeBuild(build, source, sname, activeIdx !== -1 ? list[activeIdx] : null);
      if (activeIdx !== -1) { list[activeIdx] = entry; }
      else if (list.length < 3) { list.forEach(function (b) { b.active = false; }); list.push(entry); }
      else { list.forEach(function (b, i) { b.active = (i === 0); }); list[0] = entry; }
      state.customBuilds[sname] = list;
      return true;
    });
  }
  // New explicit action, 2026-09-09 (user's own rule): ALWAYS adds a
  // separate variant rather than overwriting - refuses past the 3-build
  // cap instead of silently dropping one, since these are deliberate
  // choices (manual or AI), not disposable snapshots like save history.
  function addBuildVariant(sname, build, source) {
    return acao(telasDeBuild(sname), function () {
      var list = getBuildList(sname).slice();
      if (list.length >= 3) return false;
      list.forEach(function (b) { b.active = false; });
      list.push(entradaDeBuild(build, source, sname, null));
      state.customBuilds[sname] = list;
      return true;
    });
  }
  function setActiveBuildIndex(sname, idx) {
    return acao(telasDeBuild(sname), function () {
      var list = getBuildList(sname);
      if (idx < 0 || idx >= list.length) return false;
      list.forEach(function (b, i) { b.active = (i === idx); });
      return true;
    });
  }
  // Build nova depois da evolução (2026-09-27): com a lista cheia (3), sai a
  // variante mais antiga que não é a ativa nem `preservar` (a de antes de
  // evoluir). Devolve a build que saiu (pro registro) ou null.
  // `protegerManuais` (2026-09-30, revisão): time novo e chefão nunca tiram uma
  // build feita à mão pelo jogador - sem vaga, a build nova é recusada (mesma regra
  // de addBuildVariant: escolha deliberada não some em silêncio).
  function abrirVagaPreservando(sname, preservar, protegerManuais) {
    var lista = getBuildList(sname);
    if (lista.length < 3) return null;
    var velha = lista.map(function (b, i) { return { b: b, i: i }; })
      .filter(function (o) { return o.b !== preservar && !o.b.active && !(protegerManuais && o.b.source === "manual"); })
      .sort(function (x, y) { return String(x.b.savedAt).localeCompare(String(y.b.savedAt)); })[0];
    if (!velha) return null;
    removeBuildIndex(sname, velha.i);
    return velha.b;
  }
  function removeBuildIndex(sname, idx) {
    return acao(telasDeBuild(sname), function () {
      var list = getBuildList(sname).slice();
      if (idx < 0 || idx >= list.length) return false;
      list.splice(idx, 1);
      if (list.length && !list.some(function (b) { return b.active; })) list[0].active = true;
      if (list.length) state.customBuilds[sname] = list; else delete state.customBuilds[sname];
      return true;
    });
  }


  function persist(opts) {
    var save = buildSave(opts);
    // lsSet() already swallows a quota/disabled-storage exception and
    // returns false - persist() used to just ignore that, so a full
    // localStorage (customBuilds/notes/build history all grow unbounded
    // over time) would silently drop every save from that point on, with
    // no sign anything was wrong until the user reloaded and found nothing
    // there. Real gap flagged by an external audit pass, 2026-09-09.
    // UPDATE, same day: this used flashToast() at first, but a UX review
    // pointed out a toast auto-hides in ~2s - fine for a routine "Salvo.",
    // wrong for a data-loss warning the user might not be looking at the
    // screen for. showStorageBanner() below stays up until dismissed by
    // hand, same idiom as showSyncBanner().
    if (!lsSet(STORE_KEY, JSON.stringify(save))) {
      showStorageBanner("Não deu para salvar - armazenamento cheio? Tente apagar anotações antigas.");
    }
    pushToSync(save);
    // O botão "Novo jogo" só fica habilitado se houver algo da run pra zerar
    // (insígnia, arquétipo... além de time/caixa) - toda mudança passa por aqui.
    updateResetTeamBoxBtn();
  }

  function showStorageBanner(text) {
    document.getElementById("storage-banner-text").textContent = text;
    document.getElementById("storage-banner").hidden = false;
  }
  // ---------------- camada de ações (fase 2 da refatoração, 2026-09-24) ----------------
  // Toda mudança de estado feita pelo jogador passa por acao(telas, mudar):
  //   1. `mudar()` altera o state (devolver false = nada mudou, nada acontece);
  //   2. o save é gravado UMA vez (persist);
  //   3. cada tela afetada é redesenhada UMA vez, na ordem de TELAS_ORDEM.
  // Ações chamadas de dentro de outra ação (ex.: aplicar várias trocas de uma
  // vez) viram um lote: gravam e redesenham só quando a de fora termina.
  // Antes cada ponto do app decidia sozinho o que gravar e o que redesenhar -
  // 38 lugares - e boa parte dos defeitos de 2026-09-24 veio disso (campo que
  // não era gravado, tela que ficava desatualizada, gravação em dobro).
  //
  // Telas escondidas não são desenhadas: a troca de aba já redesenha a aba que
  // abre (ver o listener de .tab-btn). As funções de desenho não têm efeito
  // colateral - quem dispara a revisão automática das builds é a ação.
  function abaAtiva(nome) {
    var b = document.querySelector('.tab-btn[data-tab="' + nome + '"]');
    return !!b && b.classList.contains("active");
  }
  // Ficha aberta do Pokémon selecionado, mantendo a rolagem (selectSpecies
  // volta pro topo e, no celular, abriria o detalhe - por isso só quando o
  // painel está à mostra).
  //
  // Achado da fase 6 (2026-09-24, primeiro teste com recarga automatizado):
  // antes conferia a classe show-detail, que a busca tira ao digitar. No
  // computador a ficha continua na tela sem ela (só o CSS do celular esconde o
  // painel) - aí a ficha congelava: "+ Time" ficava ativo com o Pokémon já no
  // time, e salvar build não aparecia. O que vale é o painel estar escondido.
  function redesenharFichaAberta() {
    if (state.selected === null || state.selected === undefined) return;
    var painel = document.getElementById("species-detail");
    if (!painel || getComputedStyle(painel).display === "none") return;
    var y = painel.scrollTop;
    selectSpecies(state.selected);
    painel.scrollTop = y;
  }
  var TELAS = {
    contadores: function () {
      document.getElementById("team-count-badge").textContent = state.team.length + "/6";
      document.getElementById("box-count-badge").textContent = state.box.length;
      syncRowAddButtons();
      updateResetTeamBoxBtn();
    },
    resumo: function () { scheduleDashboardRefresh(); },
    lista: function () { renderList(); },
    time: function () { if (abaAtiva("team")) renderTeam(); },
    caixa: function () { if (abaAtiva("box")) renderBox(); },
    // Só a grade de times salvos (o renderTeam inteiro já a inclui).
    timesSalvos: function () { if (abaAtiva("team")) renderSavedTeams(); },
    ficha: redesenharFichaAberta,
    // Aba escondida: marca e redesenha quando ela abrir (ver o listener de
    // .tab-btn) - mesmo padrão do dashboardDirty.
    chefao: function () {
      if (bossState.selected === null) return;
      if (abaAtiva("bosses")) { renderBossDetail(); chefaoDesatualizado = false; } else chefaoDesatualizado = true;
    },
    progresso: function () {
      renderCapBadge();
      if (document.getElementById("cap-display")) renderCapDisplay();
      renderProgressTrail();
      renderRunStatus();
    },
    log: function () { renderAutoLog(); },
    // Marcador: não desenha nada, só diz que builds mudaram (dispara a revisão
    // automática em concluirAcoes).
    builds: function () {}
  };
  var TELAS_BUILD = ["builds", "resumo", "time", "chefao"];
  function telasDeBuild(sname) { return TELAS_BUILD.concat(["ficha:" + sname]); }
  var TELAS_ORDEM = ["contadores", "resumo", "lista", "time", "timesSalvos", "caixa", "ficha", "chefao", "progresso", "log", "builds"];
  // Mudança que mexe no time ou nas builds pode precisar de revisão automática.
  var TELAS_QUE_REVISAM = ["time", "builds"];
  var acaoProfundidade = 0, acaoGravar = false, acaoTelas = {};
  var chefaoDesatualizado = false;
  function acao(telas, mudar) {
    var mudou;
    acaoProfundidade++;
    try {
      mudou = mudar();
    } finally {
      acaoProfundidade--;
      if (mudou !== false) {
        acaoGravar = true;
        (telas || []).forEach(function (t) { acaoTelas[t] = true; });
      }
      if (acaoProfundidade === 0) concluirAcoes();
    }
    return mudou;
  }
  // "ficha:SNAME" = redesenhar a ficha só se ela for desse Pokémon. Redesenhar
  // a ficha de OUTRO Pokémon apagaria o que o jogador estiver digitando nela
  // (editor de build, anotação) sem motivo.
  function fichaAfetada(telas) {
    if (telas.ficha) return true;
    var sp = state.selected !== null && state.selected !== undefined ? getSpeciesByX(state.selected) : null;
    return !!sp && !!telas["ficha:" + sp.sname];
  }
  function concluirAcoes() {
    var telas = acaoTelas, gravar = acaoGravar;
    acaoTelas = {};
    acaoGravar = false;
    if (gravar) persist();
    if (fichaAfetada(telas)) telas.ficha = true;
    if (telas.time) delete telas.timesSalvos; // renderTeam já desenha a grade
    TELAS_ORDEM.forEach(function (t) { if (telas[t]) TELAS[t](); });
    if (TELAS_QUE_REVISAM.some(function (t) { return telas[t]; })) agendarRevisoes();
  }

  // Preferências de acessibilidade (alto contraste / tamanho da fonte),
  // 2026-09-13 - chave PRÓPRIA, separada de er_terminal_save de propósito:
  // são preferências de EXIBIÇÃO deste aparelho específico (um jogador
  // pode querer alto contraste no celular e não no notebook), não dado de
  // jogo - não fazem parte do que a sincronização entre aparelhos
  // propaga. Aplicado aqui, no boot, antes da sync/loadSave, pra nunca
  // piscar sem o ajuste entre o primeiro paint e o JS rodar.
  var A11Y_KEY = "er_terminal_a11y";
  function loadA11yPrefs() {
    try {
      var raw = lsGet(A11Y_KEY);
      return raw ? JSON.parse(raw) : { highContrast: false, fontScale: 1 };
    } catch (e) { return { highContrast: false, fontScale: 1 }; }
  }
  function applyA11yPrefs(prefs) {
    document.documentElement.setAttribute("data-high-contrast", prefs.highContrast ? "true" : "false");
    document.documentElement.style.setProperty("--user-font-scale", String(prefs.fontScale || 1));
  }
  function saveA11yPrefs(prefs) {
    lsSet(A11Y_KEY, JSON.stringify(prefs));
    applyA11yPrefs(prefs);
  }
  applyA11yPrefs(loadA11yPrefs());

  (function loadSave() {
    var raw = lsGet(STORE_KEY);
    if (raw) {
      try {
        var lido = JSON.parse(raw);
        // Soma de verificação (save.js): passou no parse mas não é o que foi
        // gravado. Carrega mesmo assim - applySave já descarta o que não faz
        // sentido, e recomeçar do exemplo perderia mais - mas guarda a cópia
        // crua e avisa, igual ao caso do JSON quebrado logo abaixo.
        var somaErrada = conferirSomaDoSave(lido) === "errada";
        if (somaErrada) {
          lsSet(STORE_KEY + "_corrupted_backup", raw);
          showStorageBanner(
            "O save deste navegador não bate com a soma de verificação (o conteúdo mudou depois de gravado). " +
            "Carreguei o que deu para aproveitar - confira time, caixa e builds. A cópia original ficou em \"" +
            STORE_KEY + "_corrupted_backup\" no armazenamento local deste navegador."
          );
        }
        applySave(lido);
        // Cobre o caso de um save de ANTES desta feature existir: se o cap
        // salvo já libera evoluções que nunca foram aplicadas, aplica agora
        // mesmo, antes da primeira renderização.
        // A soma errada também regrava: o aviso sai uma vez só (a cópia crua já foi guardada).
        if (autoEvolveRoster(true) || reconciliouAoAplicar || somaErrada) persist({ manterData: true }); // ajuste automático, não ação do jogador
        return;
      } catch (e) {
        // BUG P0 achado em auditoria, 2026-09-18: antes disto, um save
        // corrompido (gravação incompleta, disco cheio, extensão de
        // navegador) caía direto pro seed de exemplo abaixo, que persist()
        // JÁ sobrescrevia a chave corrompida na mesma passagem - perda de
        // progresso 100% silenciosa, sem nenhum aviso. Uma falha de
        // ESCRITA (quota) já ganhava banner persistente (showStorageBanner
        // logo acima) - a falha de LEITURA no carregamento não ganhava
        // nada. Guarda o texto cru numa chave separada ANTES de qualquer
        // coisa escrever por cima (só dá uma chance de recuperação manual,
        // nunca tenta recuperar sozinho - o JSON pode estar genuinamente
        // truncado) e avisa com o MESMO banner persistente de sempre.
        lsSet(STORE_KEY + "_corrupted_backup", raw);
        showStorageBanner(
          "O save salvo neste navegador não pôde ser lido (ficou corrompido). Uma cópia do texto original foi " +
          "guardada em \"" + STORE_KEY + "_corrupted_backup\" no armazenamento local deste navegador, caso queira " +
          "tentar recuperar à mão. Recomeçando com um time de exemplo, sem mexer nessa cópia."
        );
      }
    }
    // First visit on this browser: seed with Claude's latest recommendation
    // instead of starting empty, and persist so it only happens once.
    applySave({ savedTeams: SAVEDTEAMS_SEED.slice(0, 3) });
    persist();
  })();
