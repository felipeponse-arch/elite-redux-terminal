  // ===== src/regras/save.js =====
  // Save do app: formato gravado (buildSave), leitura defensiva (applySave e os
  // saneadores) e comparação do sync. Lê/escreve o `state`, nunca a página.
  // Colado dentro do <script> principal do app por scripts/build.mjs (marcador
  // @regras save.js), no mesmo escopo do resto do código. Só lógica: nada aqui
  // lê ou desenha a página - testável no Node (tests/unit). Movido do template na
  // fase 3 da refatoração (2026-09-24), sem mudar o comportamento.

  // sname list (persisted form) -> x list (runtime form), dropping anything
  // this data build no longer knows about. Unknown snames are NOT lost: the
  // caller collects them separately (state.orphans) and buildSave() writes
  // them back out untouched, so a save imported into an older/mismatched
  // data build doesn't silently delete Pokemon on the next persist() - see
  // AUDITORIA-DOSSIE.md 1.1.
  function snamesToXs(list, orphansOut) {
    if (!Array.isArray(list)) return [];
    return list.filter(function (sn) {
      var known = (typeof sn === "string") && !!SPECIES_BY_SNAME[sn];
      if (!known && orphansOut && typeof sn === "string") orphansOut.push(sn);
      return known;
    }).map(function (sn) { return SPECIES_BY_SNAME[sn].x; });
  }

  function xsToSnames(list) {
    return (list || []).map(snameOf).filter(Boolean);
  }

  // ---------------- persistence ----------------
  // Everything is stored under ONE versioned key so the whole save can be
  // migrated, exported and imported as a unit. Schema (v: 2):
  //   { v, team: [sname], box: [sname], savedTeams: [{name, team:[sname], depois?}],
  //     settings: {difficulty, levelCapMode, megaMode, milestone, runConfirmedAt, sort, typeFilter},
  //     motorFavoritos? [sname], notes, autoEvolved, autoLog, gymSkillsCleared, customBuilds, strategySets, archetype,
  //     orphans dentro de team/box, dataVersion, savedAt, soma }
  // v: applySave só avisa (log) quando o save é de formato MAIS NOVO que este app; ainda não há migração.
  // applySave é defensivo: campo inválido ou ausente em settings mantém o valor atual do state (não zera).
  var AUTO_LOG_MAX = 30;

  // Teto de espécies com sets de Estratégias guardados no save (os mais
  // antigos saem primeiro) - o save vai pro localStorage e pra sincronização.
  var STRATEGY_SETS_MAX = 60;

  var SCHEMA_VERSION = 2;
  var reconciliouAoAplicar = false;
  var dataDoSaveCarregado = null; // data do save que applySave carregou (buildSave com manterData) // antes de applySave (no-use-before-define, 2026-09-30)

  function applySave(save) {
    if (!save || typeof save !== "object") return;
    // Orphans (snames this build doesn't recognise) are stored INSIDE
    // save.team/save.box by buildSave(), not in a separate field, so they
    // keep re-partitioning correctly on every future load: known-again ->
    // back into the active list, still-unknown -> still an orphan.
    var teamOrphans = [], boxOrphans = [];
    // Mais de 6 no time (save editado/de outra versão): o excedente vai pra caixa em vez
    // de sumir sem aviso (lote D da força-tarefa, 2026-10-02).
    var semRepetido = function (l) { return l.filter(function (x, i) { return l.indexOf(x) === i; }); };
    var timeTodo = semRepetido(snamesToXs(save.team, teamOrphans));
    state.team = timeTodo.slice(0, 6);
    state.box = semRepetido(snamesToXs(save.box, boxOrphans).concat(timeTodo.slice(6))).filter(function (x) { return state.team.indexOf(x) === -1; });
    // Data do save carregado: gravações AUTOMÁTICAS (ajuste na abertura) a mantêm, pra não
    // passarem por "mais novas" e apagarem no sync o que foi feito no outro aparelho.
    dataDoSaveCarregado = typeof save.savedAt === "string" ? save.savedAt : null;
    state.orphans = { team: teamOrphans, box: boxOrphans };
    if (Array.isArray(save.savedTeams)) {
      state.savedTeams = save.savedTeams.filter(function (t) {
        return t && Array.isArray(t.team);
      }).slice(0, 3).map(function (t) {
        var slot = { name: String(t.name || ""), team: t.team.filter(function (s) { return typeof s === "string"; }) };
        // "depois" (2026-09-30): no backup "Antes de <chefão>", o time que o botão
        // "Montar time contra este chefão" montou - diz se o time atual é do botão.
        if (Array.isArray(t.depois)) slot.depois = t.depois.filter(function (s) { return typeof s === "string"; });
        return slot;
      });
    }
    if (save.settings && typeof save.settings === "object") {
      if (["easy", "ace", "elite"].indexOf(save.settings.difficulty) !== -1) state.settings.difficulty = save.settings.difficulty;
      if (LEVEL_CAP_MODES.indexOf(save.settings.levelCapMode) !== -1) state.settings.levelCapMode = save.settings.levelCapMode;
      else state.settings.levelCapMode = levelCapModeFromDifficulty(save.settings.difficulty);
      if (save.settings.megaMode === "permanente" || save.settings.megaMode === "temporaria") state.settings.megaMode = save.settings.megaMode;
      if (typeof save.settings.milestone === "number" && save.settings.milestone >= 0) state.settings.milestone = Math.floor(save.settings.milestone);
      // null também vale: é o "Novo jogo" feito no outro aparelho (antes ficava a data velha).
      state.settings.runConfirmedAt = typeof save.settings.runConfirmedAt === "string" ? save.settings.runConfirmedAt : null;
      // Fase 1 quality-of-life, 2026-09-09: remember sort order + type
      // filter between sessions - both used to silently reset on reload.
      // typeFilter is validated against USABLE_TYPES so a hand-edited or
      // stale save can't inject a name that isn't a real type.
      if (typeof save.settings.sort === "string") state.sort = save.settings.sort;
      if (Array.isArray(save.settings.typeFilter)) {
        state.typeFilter = new Set(save.settings.typeFilter.filter(function (t) {
          return USABLE_TYPES.indexOf(t) !== -1;
        }));
      }
    }
    // Bounds-check against this build's actual level-cap table: a save from
    // a build with more/fewer milestones could otherwise index past the end
    // of LEVELCAPS.rows wherever milestone is used to look up a row.
    if (LEVELCAPS && Array.isArray(LEVELCAPS.rows) && LEVELCAPS.rows.length) {
      var maxMilestone = LEVELCAPS.rows.length - 1;
      if (state.settings.milestone < 0) state.settings.milestone = 0;
      if (state.settings.milestone > maxMilestone) state.settings.milestone = maxMilestone;
    }
    // Defensive on import: only keep string values, so a hand-edited or
    // corrupted save can't inject something odd into a field that gets
    // rendered as plain text.
    state.notes = {};
    if (save.notes && typeof save.notes === "object") {
      Object.keys(save.notes).forEach(function (k) {
        if (typeof save.notes[k] === "string" && save.notes[k]) state.notes[k] = save.notes[k];
      });
    }
    state.autoLog = Array.isArray(save.autoLog) ? save.autoLog.filter(function (e) {
      return e && typeof e.at === "string" && typeof e.text === "string";
    }).slice(0, AUTO_LOG_MAX).map(function (e) { return { at: e.at, text: e.text }; }) : [];
    // Mesma disciplina defensiva das notas/builds acima: so aceita chave de
    // lider e id de buff que realmente existem no GYM_SKILLS carregado agora -
    // um save de uma versao futura/editada a mao nao injeta lixo aqui.
    state.gymSkillsCleared = {};
    if (save.gymSkillsCleared && typeof save.gymSkillsCleared === "object" && GYM_SKILLS) {
      Object.keys(save.gymSkillsCleared).forEach(function (leaderName) {
        var leaderData = GYM_SKILLS.leaders[leaderName];
        var validIds = leaderData && leaderData.buffs ? leaderData.buffs.map(function (b) { return b.id; }) : [];
        var arr = save.gymSkillsCleared[leaderName];
        if (leaderData && Array.isArray(arr)) {
          var kept = arr.filter(function (id) { return typeof id === "string" && validIds.indexOf(id) !== -1; });
          if (kept.length) state.gymSkillsCleared[leaderName] = kept;
        }
      });
    }
    if (typeof save.v === "number" && save.v > SCHEMA_VERSION) {
      logAutoAction("Este save é de uma versão mais nova do app (formato " + save.v + "; este app lê o " + SCHEMA_VERSION + ") - carregado mesmo assim, mas pode perder campos novos ao salvar.");
    }
    if (teamOrphans.length || boxOrphans.length) {
      logAutoAction((teamOrphans.length + boxOrphans.length) + " Pokémon do save não existem nesta versão dos dados (" + teamOrphans.concat(boxOrphans).join(", ") + ") - guardados no save sem aparecer, pra não serem apagados.");
    }
    state.autoEvolved = {};
    if (save.autoEvolved && typeof save.autoEvolved === "object") {
      Object.keys(save.autoEvolved).forEach(function (k) {
        var rec = save.autoEvolved[k];
        if (rec && typeof rec.from === "string" && typeof rec.lvl === "number" && getSpeciesBySname(k) && getSpeciesBySname(rec.from)) {
          state.autoEvolved[k] = { from: rec.from, lvl: rec.lvl };
        }
      });
    }
    // Same defensive-import discipline as notes above: only accept a build
    // that actually has the right shape, so a hand-edited or corrupted
    // save can't inject something odd into fields that get rendered as
    // plain text or fed into calcFinalStat.
    // UPDATE 2026-09-09: customBuilds[sname] used to be ONE build object;
    // now it's an ARRAY of up to 3 (manual and/or AI-generated variants),
    // so an old save (single object per species) needs wrapping into a
    // 1-item array here - this is the one and only place that has to know
    // both shapes exist, everything downstream only ever sees the array.
    state.customBuilds = {};
    if (save.customBuilds && typeof save.customBuilds === "object") {
      Object.keys(save.customBuilds).forEach(function (k) {
        var raw = save.customBuilds[k];
        var rawList = Array.isArray(raw) ? raw : (raw && typeof raw === "object" ? [raw] : []);
        var clean = rawList.slice(0, 3).map(function (b) {
          if (!b || typeof b !== "object") return null;
          var moves = Array.isArray(b.moves) ? b.moves.filter(function (m) { return typeof m === "string" && m; }).slice(0, 4) : [];
          var entrada = {
            ability: typeof b.ability === "string" ? b.ability : "",
            nature: typeof b.nature === "string" ? b.nature : "",
            item: typeof b.item === "string" ? b.item : "",
            moves: moves,
            ivs: Array.isArray(b.ivs) && b.ivs.length === 6 ? b.ivs.map(function (v) { return clampInt(v, 0, 31, 31); }) : [31, 31, 31, 31, 31, 31],
            evs: Array.isArray(b.evs) && b.evs.length === 6 ? b.evs.map(function (v) { return clampInt(v, 0, 252, 0); }) : [0, 0, 0, 0, 0, 0],
            source: BUILD_SOURCES.indexOf(b.source) !== -1 ? b.source : "manual",
            active: !!b.active,
            savedAt: typeof b.savedAt === "string" ? b.savedAt : new Date().toISOString(),
            rationale: typeof b.rationale === "string" ? b.rationale.slice(0, 360) : ""
          };
          // Campos de 2026-09-24 (build que acompanha o jogador). Só o formato é
          // conferido aqui; o que vale pra espécie é conferido por reconciliarBuild
          // logo abaixo e, de novo, na hora de derivar os golpes (golpesNoCap).
          var plano = planoSaneado(b.plano, moves);
          if (plano) entrada.plano = plano;
          var ant = anteriorSaneado(b.anterior, 0);
          if (ant) entrada.anterior = ant;
          if (b.revisar === "evolucao" || b.revisar === "plano") entrada.revisar = b.revisar;
          if (typeof b.revisadaDe === "string") entrada.revisadaDe = b.revisadaDe.slice(0, 40);
          if (typeof b.tentativasRevisao === "number") entrada.tentativasRevisao = clampInt(b.tentativasRevisao, 0, 9, 0);
          if (b.planoConsultado === true) entrada.planoConsultado = true;
          // Build que ficou de reserva quando a criatura evoluiu (2026-09-27): o
          // chip mostra "Antes de evoluir" em vez de "IA 2".
          if (typeof b.antesDeEvoluir === "string" && b.antesDeEvoluir) entrada.antesDeEvoluir = b.antesDeEvoluir.slice(0, 40);
          // Build feita pelo botão "Montar time contra este chefão" (2026-09-30):
          // pra qual chefão e level cap - clicar de novo não regera à toa.
          if (b.feitaPara && typeof b.feitaPara.chefao === "string" && typeof b.feitaPara.cap === "number") {
            entrada.feitaPara = { chefao: b.feitaPara.chefao.slice(0, 60), cap: clampInt(b.feitaPara.cap, 0, 100, 0) };
          }
          if (b.ponte === true) entrada.ponte = true;
          return entrada;
        }).filter(function (b) {
          if (!b) return false;
          var isEmpty = !b.ability && !b.nature && !b.item && !b.moves.length &&
            b.ivs.every(function (v) { return v === 31; }) && b.evs.every(function (v) { return v === 0; });
          return !isEmpty;
        });
        if (clean.length) {
          if (!clean.some(function (b) { return b.active; })) clean[0].active = true;
          state.customBuilds[k] = clean;
        }
      });
    }
    state.strategySets = sanitizarStrategySets(save.strategySets);
    // Favoritos do Modo Motor (TK-02b, 28/10/2026): só espécie conhecida, sem repetir. Save antigo sem o campo = vazio.
    state.motorFavoritos = Array.isArray(save.motorFavoritos) ? semRepetido(save.motorFavoritos.filter(function (s) { return typeof s === "string" && !!SPECIES_BY_SNAME[s]; })) : [];
    // Arquétipo do time (Fase 3b, 2026-09-12) - defensivo igual notes/
    // customBuilds acima: só aceita valor que já é uma das opções reais
    // (um save editado à mão ou de outra versão não pode injetar algo fora
    // da taxonomia conhecida).
    state.archetype = { pace: null, weather: null, monotype: null, tatica: null, reasoning: "" };
    if (save.archetype && typeof save.archetype === "object") {
      if (PACE_ARCHETYPES.indexOf(save.archetype.pace) !== -1) state.archetype.pace = save.archetype.pace;
      // "Snow" de save anterior a 2026-09-26 é o mesmo clima, agora "Hail".
      var climaSalvo = save.archetype.weather === "Snow" ? "Hail" : save.archetype.weather;
      if (WEATHER_ARCHETYPES.indexOf(climaSalvo) !== -1) state.archetype.weather = climaSalvo;
      if (TATICA_ARCHETYPES.indexOf(save.archetype.tatica) !== -1) state.archetype.tatica = save.archetype.tatica;
      if (MONOTYPE_ARCHETYPES.indexOf(save.archetype.monotype) !== -1) state.archetype.monotype = save.archetype.monotype;
      if (typeof save.archetype.reasoning === "string") state.archetype.reasoning = save.archetype.reasoning.slice(0, 500);
    }
    // Toda build salva precisa valer pra espécie em que está agora (achado do
    // usuário, 2026-09-24: Haxorus com "Moxie", habilidade só do Axew/Fraxure).
    // Conserta saves que já chegaram assim, tanto do próprio aparelho quanto de
    // outro (sincronização) - ver reconciliarBuildsDe().
    reconciliouAoAplicar = reconciliarBuildsSalvas();
  }

  // Versões anteriores de uma build (pilha da evolução em etapas - ver
  // reconciliarBuildsDe). Profundidade máxima 3: é o máximo de etapas de uma
  // linha evolutiva, e trava um save malformado que tente aninhar sem fim.
  function anteriorSaneado(a, profundidade) {
    if (profundidade >= 3 || !a || typeof a !== "object" || typeof a.sname !== "string" || !Array.isArray(a.moves)) return null;
    var out = {
      sname: a.sname.slice(0, 60),
      ability: typeof a.ability === "string" ? a.ability : "",
      moves: a.moves.filter(function (m) { return typeof m === "string" && m; }).slice(0, 4),
      rationale: typeof a.rationale === "string" ? a.rationale.slice(0, 280) : ""
    };
    var plano = planoSaneado(a.plano, out.moves);
    if (plano) out.plano = plano;
    var mais = anteriorSaneado(a.anterior, profundidade + 1);
    if (mais) out.anterior = mais;
    return out;
  }

  // Mesma disciplina defensiva das builds: só aceita set com o formato certo,
  // de espécie que existe nesta versão dos dados e gerado sobre ESTA versão
  // (um patch novo muda movepool/habilidades - aí o set é descartado e a
  // próxima visita gera de novo). Mantém só as STRATEGY_SETS_MAX mais novas.
  function sanitizarStrategySets(raw) {
    var out = {};
    if (!raw || typeof raw !== "object") return out;
    var versaoAtual = DATA.meta ? DATA.meta.version : null;
    var entradas = [];
    Object.keys(raw).forEach(function (sname) {
      var e = raw[sname];
      if (!e || typeof e !== "object" || !Array.isArray(e.sets) || !getSpeciesBySname(sname)) return;
      if (versaoAtual && e.dataVersion && e.dataVersion !== versaoAtual) return;
      var sets = e.sets.slice(0, 3).map(function (s) {
        if (!s || typeof s !== "object" || typeof s.name !== "string" || !Array.isArray(s.moves)) return null;
        var moves = s.moves.filter(function (m) { return typeof m === "string" && m; }).slice(0, 4);
        if (!moves.length) return null;
        return {
          name: s.name.slice(0, 40),
          ability: typeof s.ability === "string" ? s.ability : "",
          nature: typeof s.nature === "string" ? s.nature : "",
          item: typeof s.item === "string" ? s.item : "",
          moves: moves,
          evs: Array.isArray(s.evs) && s.evs.length === 6 ? s.evs.map(function (v) { return clampInt(v, 0, 252, 0); }) : [0, 0, 0, 0, 0, 0],
          rationale: typeof s.rationale === "string" ? s.rationale.slice(0, 400) : ""
        };
      }).filter(Boolean);
      if (!sets.length) return;
      entradas.push([sname, {
        sets: sets,
        cap: typeof e.cap === "number" ? e.cap : null,
        dataVersion: typeof e.dataVersion === "string" ? e.dataVersion : versaoAtual,
        geradoEm: typeof e.geradoEm === "string" ? e.geradoEm : ""
      }]);
    });
    entradas.sort(function (a, b) { return a[1].geradoEm < b[1].geradoEm ? 1 : a[1].geradoEm > b[1].geradoEm ? -1 : 0; });
    entradas.slice(0, STRATEGY_SETS_MAX).forEach(function (p) { out[p[0]] = p[1]; });
    return out;
  }

  // ---------------- soma de verificação (2026-10-01) ----------------
  // Mesma ideia do bit de paridade da memória: cada save leva uma soma do
  // próprio conteúdo, e quem lê confere antes de confiar. Um JSON truncado já
  // falha no JSON.parse (loadSave guarda a cópia e avisa); a soma pega o que
  // passa no parse mas não é o que foi gravado - texto mexido à mão, gravação
  // pela metade de outro aparelho, extensão de navegador. Como o bit de
  // paridade, só DETECTA: não tenta consertar.
  // O texto é canônico (chaves em ordem alfabética, mesmas regras do
  // JSON.stringify para undefined/função) porque o banco da sincronização pode
  // devolver as chaves em outra ordem - a soma não pode depender disso.
  function textoCanonicoDoSave(v) {
    if (v === null || typeof v !== "object") {
      var t = JSON.stringify(v);
      return t === undefined ? "null" : t;
    }
    if (Array.isArray(v)) {
      return "[" + v.map(function (x) {
        return x === undefined || typeof x === "function" ? "null" : textoCanonicoDoSave(x);
      }).join(",") + "]";
    }
    return "{" + Object.keys(v).sort().filter(function (k) {
      return k !== "soma" && v[k] !== undefined && typeof v[k] !== "function";
    }).map(function (k) { return JSON.stringify(k) + ":" + textoCanonicoDoSave(v[k]); }).join(",") + "}";
  }
  // FNV-1a de 32 bits sobre o texto canônico, em 8 dígitos hexadecimais.
  function somaDoSave(save) {
    var texto = textoCanonicoDoSave(save), h = 0x811c9dc5;
    for (var i = 0; i < texto.length; i++) {
      h ^= texto.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return ("0000000" + h.toString(16)).slice(-8);
  }
  // "ok" | "sem" (save de antes desta conferência existir - aceito como sempre
  // foi) | "errada" (o conteúdo não é o que foi gravado).
  function conferirSomaDoSave(save) {
    if (!save || typeof save !== "object") return "errada";
    if (typeof save.soma !== "string") return "sem";
    return save.soma === somaDoSave(save) ? "ok" : "errada";
  }

  // Decisão 2 do usuário (27/10/2026): save com soma errada nunca sobe para a nuvem.
  function saveEnviavel(save) { return !!save && conferirSomaDoSave(save) !== "errada"; }

  // opts.manterData: gravação automática (não é ação do jogador) - mantém a data do save.
  function buildSave(opts) {
    var save = montarSave(opts);
    save.soma = somaDoSave(save);
    return save;
  }
  function montarSave(opts) {
    var save = {
      v: SCHEMA_VERSION,
      dataVersion: DATA.meta ? DATA.meta.version : null,
      savedAt: opts && opts.manterData && dataDoSaveCarregado ? dataDoSaveCarregado : new Date().toISOString(),
      team: xsToSnames(state.team).concat(state.orphans.team),
      box: xsToSnames(state.box).concat(state.orphans.box),
      savedTeams: state.savedTeams,
      // sort/typeFilter merged in here (not stored directly on
      // state.settings) so every mutation site doesn't need to remember to
      // keep two copies in sync - state.sort/state.typeFilter stay the
      // single source of truth the rendering code already reads directly.
      settings: Object.assign({}, state.settings, {
        sort: state.sort,
        typeFilter: Array.from(state.typeFilter)
      }),
      notes: state.notes,
      autoEvolved: state.autoEvolved,
      autoLog: state.autoLog,
      gymSkillsCleared: state.gymSkillsCleared,
      customBuilds: state.customBuilds,
      strategySets: state.strategySets,
      archetype: state.archetype
    };
    // Só grava quando há favorito: sem ele o save fica idêntico ao de antes (mesma soma, sem diferença falsa no sync).
    if (state.motorFavoritos && state.motorFavoritos.length) save.motorFavoritos = state.motorFavoritos.slice();
    return save;
  }

  // Progresso da run (10/10/2026): o sync só olhava a data do último salvamento, e uma
  // run nova e zerada criada depois, no PC, apagou a run adiantada do celular. Progresso =
  // marco (settings.milestone) e, no mesmo marco, run confirmada (runConfirmedAt) vale mais
  // que "Novo jogo" ainda sem confirmar. Não olha Pokémon do time/caixa: soltar um Pokémon
  // de propósito não é perder a run. Duas runs no mesmo marco e as duas confirmadas não
  // entram - nenhuma tem como ser dita "menos" que a outra.
  function progressoDoSave(save) {
    var s = save && save.settings;
    var marco = s && typeof s.milestone === "number" && s.milestone > 0 ? s.milestone : 0;
    return marco * 2 + (s && typeof s.runConfirmedAt === "string" ? 1 : 0);
  }
  // true: o save que está chegando tem MENOS progresso que o do aparelho (e o aparelho tem save).
  function saveChegandoTemMenosProgresso(local, remoto) {
    if (!local || !remoto) return false;
    return progressoDoSave(remoto) < progressoDoSave(local);
  }

  // Campos que NÃO contam como "o conteúdo mudou": versão/datas mudam a cada
  // gravação, e o log "O que o app fez sozinho" registra ações locais (se só
  // ele difere, não há nada pra oferecer ao jogador). Todo o resto conta - a
  // união das chaves dos DOIS saves (2026-09-24: era uma lista fixa à parte,
  // que ficou sem gymSkillsCleared e autoEvolved, e o buff de ginásio marcado
  // em outro aparelho era ignorado; a união também pega campo que só o outro
  // aparelho, numa versão mais nova do app, já grava).
  // A soma muda junto com savedAt a cada gravação, então também não conta.
  var SYNC_IGNORADAS = ["v", "dataVersion", "savedAt", "autoLog", "soma"];
  function syncContentDiffers(a, b) {
    if (!a || !b) return true;
    var chaves = {};
    Object.keys(a).concat(Object.keys(b)).forEach(function (k) { if (SYNC_IGNORADAS.indexOf(k) === -1) chaves[k] = true; });
    // Ordenação e filtro de tipo da Dex são preferência de tela: mudar só eles não é
    // "o time mudou" (antes cada clique de filtro gravava na rede e avisava o outro aparelho).
    function semPreferenciaDeTela(k, v) {
      if (k !== "settings" || !v || typeof v !== "object") return v;
      var c = Object.assign({}, v); delete c.sort; delete c.typeFilter; return c;
    }
    // Texto canônico (igual ao da soma): o banco pode devolver as chaves em outra ordem.
    return Object.keys(chaves).some(function (k) { return textoCanonicoDoSave(semPreferenciaDeTela(k, a[k])) !== textoCanonicoDoSave(semPreferenciaDeTela(k, b[k])); });
  }
