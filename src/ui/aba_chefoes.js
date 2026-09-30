  // ===== src/ui/aba_chefoes.js =====
  // Aba Chefões: lista, time do chefão por dificuldade, buffs de ginásio e exportação.
  // Interface: lê e desenha a página. Colado no <script> principal por
  // scripts/build.mjs (marcador @ui aba_chefoes.js) no MESMO lugar de onde saiu do
  // template (fase 5 da refatoração, 2026-09-24) - a ordem de execução não mudou.

  // ---------------- bosses view ----------------
  var bossInited = false;
  // level: null until first shown, then defaults once to the current level
  // cap (getCurrentCap()) as a starting point - NOT reset every time a
  // different boss is opened, so browsing several bosses at "the level I'm
  // actually at" doesn't mean re-typing it each time.
  var bossState = { query: "", cat: "", selected: null, diff: "party", level: null };

  // "Meu build"'s own level, separate from bossState.level - a single value
  // reused across every species the user edits (same "sticky, not reset per
  // switch" idiom as the boss calculator's level), defaulted the same way:
  // the current level cap if one is set, else 50.
  var myBuildLevel = null;
  // Sem isto, "sticky" virava "travado errado pra sempre": se o jogador
  // abrisse "Meu build" ANTES de configurar o level cap em Progresso (cap
  // null -> cai no fallback 50), myBuildLevel ficava preso em 50 mesmo
  // depois do cap ser configurado de verdade - só um settings change que
  // muda de VALOR (não idempotente) reseta myBuildLevel=null lá embaixo, e
  // por acaso nenhum aconteceu depois. Achado ao escrever o teste de
  // evBreakpointNote (2026-09-18): a nota citava um nível diferente do que
  // a varredura real esperava. Com a flag, o valor só fica "travado" depois
  // que o JOGADOR digita algo no campo - sem isso, toda vez que "Meu build"
  // abre ele repuxa o cap atual de verdade, exatamente como o texto de
  // ajuda da tela já promete ("volta a seguir o cap sempre que ele mudar").
  var myBuildLevelIsCustom = false;

  function initBosses() {
    document.getElementById("boss-count-badge").textContent = BOSSES.length;
    if (bossInited) return;
    bossInited = true;

    var cats = [];
    BOSSES.forEach(function (b) { if (cats.indexOf(b.cat) === -1) cats.push(b.cat); });
    var catSelect = document.getElementById("boss-cat-select");
    cats.forEach(function (c) {
      var opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      catSelect.appendChild(opt);
    });
    catSelect.addEventListener("change", function () {
      bossState.cat = catSelect.value;
      renderBossList();
    });
    document.getElementById("boss-search-input").addEventListener("input", function (e) {
      bossState.query = e.target.value.trim().toLowerCase();
      document.getElementById("boss-shell").classList.remove("show-detail");
      renderBossList();
    });

    document.getElementById("boss-detail").addEventListener("click", function (e) {
      var btnDetalhe = e.target.closest && e.target.closest("button");
      if (btnDetalhe && btnDetalhe.id === "boss-back-to-list") {
        document.getElementById("boss-shell").classList.remove("show-detail");
        return;
      }
      if (btnDetalhe && btnDetalhe.dataset.diff) {
        bossState.diff = btnDetalhe.dataset.diff; // estado de tela (variante mostrada)
        renderBossDetail();
        return;
      }
      // Aplica a troca sugerida da caixa (fase 3) - a única ação do card de
      // confronto, porque é a única que muda algo de verdade. Lote: todas as
      // trocas, uma gravação e um redesenho no fim (rosterMove é ação).
      if (btnDetalhe && btnDetalhe.classList.contains("cf-apply-swap")) {
        var bossTroca = BOSSES[bossState.selected];
        var feitas = 0;
        acao([], function () {
          btnDetalhe.dataset.trocas.split(",").forEach(function (par) {
            var p = par.split(">");
            if (rosterMove(parseInt(p[1], 10), p[0] === "" ? null : parseInt(p[0], 10))) feitas++;
          });
          return feitas > 0;
        });
        if (feitas && bossTroca) flashToast(feitas + (feitas === 1 ? " troca aplicada" : " trocas aplicadas") + " para " + bossTroca.name + ".");
        return;
      }
      if (e.target && e.target.id === "boss-montar-time") { montarTimeContraEsteChefao(); return; }
      var buildBtn = e.target && e.target.closest && e.target.closest(".use-boss-build-btn");
      if (buildBtn) {
        var boss = BOSSES[bossState.selected];
        var party = boss && boss[bossState.diff || "party"];
        var m = party && party[parseInt(buildBtn.dataset.idx, 10)];
        var sp = m && getSpeciesByX(m.x);
        if (!sp) return;
        setOrReplaceActiveBuild(sp.sname, {
          ability: m.abi || "",
          nature: m.nat || "",
          item: m.item || "",
          moves: (m.mv || []).slice(0, 4),
          ivs: m.ivsRaw.slice(),
          evs: m.evsRaw.slice()
        }, "manual"); // ação: grava e redesenha o que mostra build
        flashToast("Build do " + m.n + " copiado pro seu \"Meu build\" - vá na Dex pra ver/ajustar");
      }
    });
    document.getElementById("boss-detail").addEventListener("change", function (e) {
      // "change" (fires on blur/Enter), not "input" (fires every keystroke) -
      // renderBossDetail() replaces the whole card via innerHTML, which would
      // yank focus off this very input after the first digit if it re-rendered
      // on every keystroke, making a 2-digit level impossible to type.
      if (e.target.id === "boss-level-input") {
        var v = parseInt(e.target.value, 10);
        if (isNaN(v) || v < 1) v = 1;
        bossState.level = Math.min(100, v);
        renderBossDetail();
        return;
      }
      var cb = e.target.closest && e.target.closest("[data-gymskill]");
      var gymCard = cb && cb.closest("[data-gym-leader]");
      if (cb && gymCard) {
        var leaderName = gymCard.dataset.gymLeader;
        var id = cb.dataset.gymskill;
        var marcado = cb.checked;
        acao(["chefao", "contadores"], function () {
          var cleared = state.gymSkillsCleared[leaderName] || [];
          if (marcado) { if (cleared.indexOf(id) === -1) cleared = cleared.concat([id]); }
          else { cleared = cleared.filter(function (x) { return x !== id; }); }
          if (cleared.length) state.gymSkillsCleared[leaderName] = cleared;
          else delete state.gymSkillsCleared[leaderName];
        });
      }
    });
    document.getElementById("boss-list").addEventListener("click", function (e) {
      var li = e.target.closest(".species-row[data-i]");
      if (li) selectBoss(parseInt(li.dataset.i, 10));
    });

    renderBossList();
  }

  function getFilteredBosses() {
    return BOSSES.map(function (b, i) { return { b: b, i: i }; }).filter(function (row) {
      if (bossState.cat && row.b.cat !== bossState.cat) return false;
      if (bossState.query && row.b.name.toLowerCase().indexOf(bossState.query) === -1) return false;
      return true;
    });
  }

  // Cor por categoria de treinador (achado de auditoria visual, 2026-09-18:
  // "Chefões" era uma lista de texto puro, sem nenhuma pista visual do que
  // cada treinador É - Equipe Aqua/Magma, Líder de Ginásio, Alto Comando...
  // Categorias reais de data/bosses.json (BOSSES[].cat), nunca inventadas.
  var BOSS_CAT_COLOR = {
    "Equipe Aqua": "var(--cat-aqua)",
    "Equipe Aqua (Admin)": "var(--cat-aqua)",
    "Equipe Magma": "var(--cat-magma)",
    "Equipe Magma (Admin)": "var(--cat-magma)",
    "Frontier Brain": "var(--cat-frontier)",
    "Lider de Ginasio": "var(--accent-2)",
    "Alto Comando": "var(--cat-elite)",
    "Campeao": "var(--accent)",
    "Superchefao": "var(--cat-super)",
    "Superchefao (Monotype)": "var(--cat-super)"
  };
  function bossCatColor(cat) { return BOSS_CAT_COLOR[cat] || "var(--text-dim)"; }

  function renderBossList() {
    var ul = document.getElementById("boss-list");
    var rows = getFilteredBosses();
    if (!rows.length) {
      ul.innerHTML = '<li class="no-results">Nenhum treinador encontrado.</li>';
      return;
    }
    // Same listbox/roving-tabindex treatment as the Dex's #species-list -
    // see the accessibility-pass comment there, 2026-09-10.
    var hasSelectedBossRow = rows.some(function (row) { return row.i === bossState.selected; });
    ul.innerHTML = rows.map(function (row, idx) {
      var isSel = bossState.selected === row.i;
      var sel = isSel ? " selected" : "";
      var isTabStop = isSel || (!hasSelectedBossRow && idx === 0);
      var catColor = bossCatColor(row.b.cat);
      return '<li class="species-row' + sel + '" data-i="' + row.i + '" role="option" aria-selected="' + isSel + '" tabindex="' + (isTabStop ? "0" : "-1") + '">' +
        '<span class="sname">' + escapeHtml(row.b.name) + (row.b.db ? " (dupla)" : "") + '</span>' +
        '<span class="boss-cat-tag" style="color:' + catColor + ';background:color-mix(in srgb, ' + catColor + ' 16%, var(--surface-2));">' + escapeHtml(row.b.cat) + '</span></li>';
    }).join("");
    // Clique numa linha: ouvinte único em #boss-list (initBosses).
  }

  var DIFF_LABELS = { party: "Padrão", insane: "Insane", hell: "Hell" };


  // ---- "Montar time contra este chefão" (2026-09-29) ----
  // Pedido do usuário: no lugar do texto que ele copiava e colava na conversa,
  // um botão que já monta o time, com build e item, na tela Meu time.
  // Decisões dele: troca o time na hora guardando o antigo; gera build nova
  // mirando este chefão pra todos (vira a ativa, a antiga fica de variante).
  //  1. escolha dos 6 SEM IA: o simulador de duelo (duelo.js, o mesmo do rank)
  //     testa cada criatura do jogador (time + caixa, Monotype e level cap
  //     respeitados, mega só se já liberada) contra o time real do chefão;
  //  2. o time antigo vai pra "Times salvos" ("Antes de <chefão>");
  //  3. builds pela IA, uma por membro, em fila, mirando este chefão;
  //  4. o plano da luta (quem responde a quem) sai do mesmo simulador.
  var montagemContraChefaoRodando = false;
  function candidatosDoJogador() {
    var owned = state.team.concat(state.box).filter(function (x, i, a) { return a.indexOf(x) === i; });
    var out = [];
    owned.forEach(function (x) {
      var sp = getSpeciesByX(x);
      if (!sp) return;
      battleUnitsOf(sp).forEach(function (u) { if (serveProMono(u.main)) out.push({ sp: u.main, owned: x }); });
    });
    return out;
  }
  // Guarda o time atual em "Times salvos" (3 vagas): usa uma vaga livre ou a de
  // um "Antes de ..." anterior; nunca apaga um time que o jogador salvou.
  // `novo`: snames do time que o botão vai aplicar (fica em slot.depois).
  var mesmoConjunto = function (a, b) { return !!a && !!b && a.slice().sort().join(",") === b.slice().sort().join(","); };
  function guardarTimeAnterior(bossName, novo) {
    var snames = xsToSnames(state.team);
    // Primeiro reaproveita a vaga de um "Antes de ..." anterior (achado no teste
    // visual: clicar duas vezes criava dois "Antes de Flannery 1" e gastava as
    // 3 vagas); só então usa uma vaga livre.
    var idx = -1;
    state.savedTeams.forEach(function (t, i) { if (idx === -1 && /^Antes de /.test(t.name || "")) idx = i; });
    // O time atual é o que o próprio botão montou antes (outro chefão ou o mesmo
    // de novo): o backup do time do JOGADOR fica como está (revisão de 2026-09-30:
    // antes ele era sobrescrito pelo time do botão e o time original se perdia).
    if (idx !== -1 && mesmoConjunto(state.savedTeams[idx].depois, snames)) {
      acao(["timesSalvos"], function () { state.savedTeams[idx].depois = novo.slice(); });
      return { salvo: true, snames: state.savedTeams[idx].team.slice() };
    }
    // Sem vaga no save, o time de antes só existe na tela: se o atual é o do
    // botão, o "anterior" continua sendo o de antes dele.
    var naTela = generatedTeamResult && generatedTeamResult.anterior && generatedTeamResult.chefao &&
      generatedTeamResult.forTeamKey === teamKeyFor(state.team.map(getSpeciesByX).filter(Boolean));
    if (naTela && !generatedTeamResult.anterior.salvo) return generatedTeamResult.anterior;
    if (!state.team.length) return { salvo: false, snames: [] };
    if (idx === -1 && state.savedTeams.length < 3) idx = state.savedTeams.length;
    if (idx === -1) return { salvo: false, snames: snames };
    acao(["timesSalvos"], function () { state.savedTeams[idx] = { name: "Antes de " + bossName, team: snames, depois: novo.slice() }; });
    return { salvo: true, snames: snames };
  }
  // Plano da luta em texto curto, por Pokémon do chefão, na ordem em que ele entra.
  function planoDaLuta(r) {
    return r.plano.map(function (p) {
      return {
        foe: p.foe.nome,
        tipos: p.foe.tipos,
        coberto: p.coberto,
        respostas: p.respostas.filter(function (a) { return a.nota >= 0.5; }).map(function (a) {
          return { nome: a.sp.n, x: a.sp.x, golpe: a.golpe, efTipo: a.efTipo };
        })
      };
    });
  }
  // A luta inteira simulada (HP passando de uma luta pra outra), em frases curtas.
  function resumoDaLuta(sim) {
    if (!sim) return null;
    return { venceu: sim.venceu, derrubados: sim.derrubados, total: sim.total, vivos: sim.vivos, dupla: !!sim.dupla,
      passos: sim.log.map(function (l) {
        if (l.derruba) return l.quem + " derruba " + l.derruba + (l.golpe ? " (" + l.golpe + ")" : "");
        if (l.troca) return "troque " + l.sai + " por " + l.entra + " contra " + l.contra;
        var hp = Math.round((l.fracEu || 0) * 100);
        return l.meu + " contra " + l.contra + ": " + (l.venceu === true ? "vence, fica com " + hp + "% de HP" : "cai");
      }) };
  }
  async function montarTimeContraEsteChefao() {
    var boss = BOSSES[bossState.selected];
    if (!boss || montagemContraChefaoRodando) return;
    var diffKey = bossState.diff || "party";
    var party = boss[diffKey] && boss[diffKey].length ? boss[diffKey] : boss.party;
    var statusChefao = function (t) { var el = document.getElementById("boss-team-status"); if (el) el.textContent = t; };
    var cands = candidatosDoJogador();
    if (!cands.length) {
      statusChefao(monotypeAtivo()
        ? "Nenhum Pokémon do tipo " + monotypeAtivo() + " no seu time ou caixa ainda - pegue algum na Dex primeiro."
        : "Nenhum Pokémon no seu time ou caixa ainda - pegue algum na Dex primeiro.");
      return;
    }
    montagemContraChefaoRodando = true;
    try {
      statusChefao("Simulando os duelos contra " + boss.name + "...");
      await new Promise(function (ok) { setTimeout(ok, 0); }); // deixa o texto aparecer antes da conta
      var nivel = getCurrentCap() || 100;
      // Chefão em dupla (db no dado): a luta é simulada 2 contra 2.
      var r = montarTimeContraChefao(cands, party, nivel, { dupla: !!boss.db });
      if (!r.escolhidos.length) { statusChefao("Não consegui montar um time com os Pokémon que você tem."); return; }
      // guardarTimeAnterior reconhece o time que o próprio botão montou (slot.depois)
      // e nunca troca o backup do time do jogador por ele.
      var anterior = guardarTimeAnterior(boss.name, r.escolhidos.map(function (e) { return e.sp.sname; }));
      teamRecommendation = { snames: r.escolhidos.map(function (e) { return e.sp.sname; }), reasoning: "Montado pelo simulador de duelo contra " + boss.name + "." };
      if (!applyRecommendedTeam()) { statusChefao("Não consegui aplicar o time - tente de novo."); return; }
      statusChefao("");
      var members = state.team.map(getSpeciesByX).filter(Boolean);
      var plano = planoDaLuta(r);
      // Quem responde a quem: cada Pokémon do chefão aponta a melhor resposta.
      var responde = {};
      r.plano.forEach(function (p) {
        var a = p.respostas[0];
        if (a && a.nota >= 0.5) (responde[a.sp.sname] = responde[a.sp.sname] || []).push(p.foe.nome);
      });
      generatedTeamResult = {
        archetypeLabel: "contra " + boss.name, chefao: boss.name, plano: plano, clima: r.clima, estrategia: r.estrategia, luta: resumoDaLuta(r.simulacao),
        progresso: "Gerando as builds...", anterior: anterior, forTeamKey: teamKeyFor(members)
      };
      var aba = document.querySelector('.tab-btn[data-tab="team"]');
      if (aba) aba.click();
      TELAS.time();
      // Economia de IA (2026-09-30): quem já tem build ativa feita pra ESTE chefão
      // neste level cap fica com ela - clicar de novo não pede as mesmas builds.
      var capAgora = getCurrentCap() || 0;
      var jaFeitas = members.filter(function (sp) {
        var b = getActiveBuild(sp.sname);
        return !!b && !!b.feitaPara && b.feitaPara.chefao === boss.name && b.feitaPara.cap === capAgora;
      });
      members = members.filter(function (sp) { return jaFeitas.indexOf(sp) === -1; });
      comecarLoteDeBuilds(members.map(function (m) { return m.x; })); // encerrado no finally
      // As builds numa consulta só (lote, 2026-09-30); quem falhar é pedido sozinho.
      var chefaoDaBuild = { boss: boss, party: party, clima: r.clima, estrategia: r.estrategia };
      var feitas = await gerarBuildsDoTimeComIA(members, "chefao-build-status",
        function (sp) { return { silencioso: true, chefao: Object.assign({ responde: responde[sp.sname] || [] }, chefaoDaBuild) }; },
        { chefao: chefaoDaBuild, responde: responde },
        function (texto) {
          if (!generatedTeamResult || generatedTeamResult.chefao !== boss.name) return; // outra montagem começou por cima
          generatedTeamResult.progresso = texto;
          TELAS.time();
        });
      var ultimoMotivo = feitas.ultimoMotivo || "";
      if (generatedTeamResult && generatedTeamResult.chefao === boss.name) {
        var faltou = computeTeamGenerationValidation(state.team.map(getSpeciesByX).filter(Boolean)).withoutBuild;
        generatedTeamResult.progresso = (faltou.length
          ? "Faltou build pra: " + faltou.join(", ") + (ultimoMotivo ? " (" + ultimoMotivo.replace(/\.$/, "") + ")" : "") +
            " - use \"Gerar build com IA\" no card de cada um."
          : "") +
          (jaFeitas.length ? (faltou.length ? " " : "") + "Mantidas as builds que já eram contra " + boss.name + " neste level cap: " +
            jaFeitas.map(function (sp) { return sp.n; }).join(", ") + "." : "");
        TELAS.time();
      }
      flashToast("Time contra " + boss.name + " montado" + (anterior.salvo ? " - o anterior ficou em Times salvos." : "."));
    } catch (e) {
      if (typeof console !== "undefined") console.error(e);
      statusChefao("Não consegui montar o time - tente de novo.");
    } finally {
      montagemContraChefaoRodando = false;
      encerrarLoteDeBuilds();
    }
  }

  function selectBoss(i) {
    bossState.selected = i;
    bossState.diff = varianteDoChefao(BOSSES[i]);
    document.querySelectorAll("#boss-list .species-row").forEach(function (r) {
      var isThis = parseInt(r.dataset.i, 10) === i;
      r.classList.toggle("selected", isThis);
      r.setAttribute("aria-selected", String(isThis));
      r.tabIndex = isThis ? 0 : -1;
    });
    document.getElementById("boss-shell").classList.add("show-detail");
    renderBossDetail();
  }


  // Card "Buffs do ginásio" (item pedido pelo usuário, 2026-09-17): só
  // aparece pra chefões que são líderes de ginásio (boss.cat), e só quando
  // GYM_SKILLS tem dado pra esse líder - nunca inventa lista vazia como se
  // fosse "0 buffs confirmados". A interface não pergunta QUAL treinador,
  // só se aquele efeito já saiu ou não (pedido explícito do usuário).
  function renderGymSkillsCardHtml(boss) {
    if (!boss || boss.cat !== "Lider de Ginasio") return "";
    var leaderName = gymLeaderBaseName(boss.name);
    var summary = gymSkillsSummaryFor(leaderName);
    if (!summary) return "";
    if (summary.gateOnly) {
      return '<div class="card" data-gym-leader="' + escapeHtml(leaderName) + '"><h3>Buffs do ginásio</h3>' +
        '<p class="hint" style="margin:0;">' + escapeHtml(summary.gateNote) + '</p></div>';
    }
    var itemsHtml = summary.buffs.map(function (b) {
      return '<li><label><input type="checkbox" data-gymskill="' + escapeHtml(b.id) + '"' + (b.cleared ? " checked" : "") + '>' +
        '<span><b>' + escapeHtml(b.label) + '</b><span class="gs-detail"> — ' + escapeHtml(b.detail) + '</span></span></label></li>';
    }).join("");
    return '<div class="card" data-gym-leader="' + escapeHtml(leaderName) + '"><h3>Buffs do ginásio</h3>' +
      '<p class="hint" style="margin:0 0 10px;">Cada treinador de apoio deste ginásio tira um desses buffs de ' + escapeHtml(leaderName) + ' quando você o vence, antes de desafiá-la(o). Marque os que você já tirou — não precisa dizer qual treinador, só o efeito.</p>' +
      (summary.note ? '<p class="hint" style="margin:0 0 10px;">' + escapeHtml(summary.note) + '</p>' : "") +
      '<ul class="gym-skill-list">' + itemsHtml + '</ul>' +
      '<div class="gym-skill-summary mono" style="margin-top:10px;font-size:var(--fs-texto);">Restam ' + summary.remaining + ' de ' + summary.total + ' buff' + (summary.total === 1 ? "" : "s") + ' ativo' + (summary.remaining === 1 ? "" : "s") + ' antes da luta.</div>' +
    '</div>';
  }

  // Card de um Pokémon do time do chefão (tirado de dentro de renderBossDetail na
  // fase 5 da refatoração). Status finais no nível digitado (bossState.level).
  function bossMonCardHtml(m, idx) {
    var sp = getSpeciesByX(m.x);
    // Mega Evolution / Primal Reversion, 2026-09-09 (user's follow-up
    // question on the held-item pass): a Mega Stone or Primal orb doesn't
    // change a stat, it turns the holder into an entirely different
    // species (own stats/types/abilities), already modeled as its own
    // dex entry (e.g. "Miloticite" -> "Milotic Mega"). MEGA_FORMS maps
    // item name -> that species' sname, built from this hack's own
    // Pokemon Showdown fork (megaStone/megaEvolves fields) cross-checked
    // against a species-name matcher run on the real game data - not
    // guessed. Deliberately does NOT try to model which of the Mega
    // form's OWN choosable abilities activates (its 3 choosable slots
    // are a completely different id pool from the base form's - checked
    // directly on Milotic vs Milotic Mega, zero overlap - so nothing in
    // this data says which one a given boss "picked"), and does NOT
    // touch weather/terrain/Trick-Room persistence across the
    // transformation - that needs real turn-order + multi-Pokemon battle
    // state, the same category of simulation this calculator has always
    // stayed out of (see the level-cap caveat below).
    var megaSname = MEGA_FORMS[m.item];
    var megaSp = megaSname ? getSpeciesBySname(megaSname) : null;
    var effectiveSp = megaSp || sp;
    var displayX = megaSp ? megaSp.x : m.x;
    var displayName = megaSp ? megaSp.n : m.n;
    var typesHtml = effectiveSp ? speciesTypeNames(effectiveSp).map(function (n) { return typePill(n, true); }).join("") : "";
    var transformNote = megaSp
      ? '<div class="bm-row bm-transform">Entra como <b>' + escapeHtml(m.n) + '</b>, muda pra isso com ' + escapeHtml(m.item) + '</div>'
      : "";
    // Final stats at the level typed in above - only computable at all
    // when the species resolves (need base stats) and the boss data has
    // real EV/IV arrays (should always be true post-2026-09-09, but a
    // species that fails to resolve degrades safely to no stats shown
    // rather than a crash or a fabricated number).
    var statsHtml = "";
    if (effectiveSp && m.evsRaw && m.ivsRaw) {
      var vals = effectiveSp.b.map(function (base, i) {
        return calcFinalStat(base, m.ivsRaw[i], m.evsRaw[i], bossState.level, i, m.nat, m.item, m.n);
      });
      statsHtml = '<div class="bm-stats">' + vals.map(function (v, i) {
        // Flag which stat(s) the held item actually changed - same "*" +
        // tooltip pattern already used for ability-adjusted type
        // multipliers (Meu Time's coverage table), not a new convention.
        // A species-gated item (Light Ball) can flag more than one stat,
        // each possibly at a different multiplier - re-check per stat
        // rather than reusing one item-wide flag like the simpler items.
        // Mega/Primal items are never in ITEM_STAT_MODS, so this simply
        // stays unflagged for them - the whole stat block already
        // reflects the transformation, no single stat to point at.
        var rule = itemRuleFor(m.item, i, m.n);
        var flag = rule
          ? '<span class="cov-flag" title="' + escapeHtml(m.item) + ' (x' + rule.mult + ')">*</span>' : "";
        return '<span class="bm-stat"><span class="bm-stat-label">' + STAT_LABELS_SHORT[i] + '</span><span class="mono">' + v + '</span>' + flag + '</span>';
      }).join("") + '</div>';
    }
    var abiHtml;
    if (megaSp) {
      var megaInnNames = (megaSp.inn || []).map(function (id) { return ABILITIES[id] ? ABILITIES[id][0] : null; }).filter(Boolean);
      abiHtml = '<div class="bm-row"><b>Entra com:</b> ' + escapeHtml(m.abi || "?") + '</div>' +
        '<div class="bm-row"><b>Após transformar:</b> ' +
        (megaInnNames.length ? escapeHtml(megaInnNames.join(", ")) + ' (inata' + (megaInnNames.length > 1 ? "s" : "") + ')' + (megaSp.ab && megaSp.ab.length ? " + " : "") : "") +
        (megaSp.ab && megaSp.ab.length ? '1 escolhível própria da forma (não sabemos qual das ' + megaSp.ab.length + ')' : "") +
        '</div>';
    } else {
      abiHtml = '<div class="bm-row"><b>Habilidade:</b> ' + escapeHtml(m.abi || "?") + '</div>';
    }
    return '<div class="boss-mon-card">' +
      '<div class="bm-head goto-species" tabindex="0" role="button" data-x="' + displayX + '" title="Ver na Dex">' + spriteImgHtml(displayX, displayName, 36) +
      '<div><div class="bm-name">' + escapeHtml(displayName) + '</div>' +
      '<div class="bm-types">' + typesHtml + '</div></div></div>' +
      transformNote +
      abiHtml +
      '<div class="bm-row"><b>Item:</b> ' + escapeHtml(m.item || "nenhum") + '</div>' +
      '<div class="bm-row"><b>Nature:</b> ' + escapeHtml(m.nat || "?") + '</div>' +
      (m.evs ? '<div class="bm-row"><b>EVs:</b> ' + escapeHtml(m.evs) + '</div>' : "") +
      '<div class="bm-row"><b>Golpes:</b> ' + escapeHtml(m.mv.join(" / ")) + '</div>' +
      statsHtml +
      // Copies this boss party member's build straight into "Meu build"
      // for the same species - 2026-09-09, user feedback: the only way to
      // act on a boss's set was to export text and paste it into a chat.
      // Saved under the BASE (held) species' sname, even when Mega/Primal
      // transformed - the held item IS the mega stone/orb itself, so a
      // player's own copy of that Pokemon holding the same item would
      // transform the same way. Only offered when the base species and
      // its raw EV/IV arrays actually resolve (same guard as statsHtml).
      (sp && m.evsRaw && m.ivsRaw
        ? '<button class="text-action-btn use-boss-build-btn" data-idx="' + idx + '" type="button" style="margin-top:8px;">+ Usar como meu build (' + escapeHtml(m.n) + ')</button>'
        : "") +
    '</div>';
  }

  var STAT_LABELS_SHORT = ROTULOS_EV; // mesma lista das regras (plano_build.js)
  function renderBossDetail() {
    var boss = BOSSES[bossState.selected];
    if (!boss) return;
    var diffKey = bossState.diff || "party";
    var party = boss[diffKey];
    if (!party || !party.length) { diffKey = "party"; party = boss.party; bossState.diff = "party"; }

    if (bossState.level === null) bossState.level = getCurrentCap() || 50;

    var availableDiffs = ["party", "insane", "hell"].filter(function (k) { return boss[k] && boss[k].length; });
    var diffBtns = availableDiffs.length > 1 ? availableDiffs.map(function (k) {
      var active = k === diffKey ? " active" : "";
      return '<button class="chip-btn' + active + '" data-diff="' + k + '" type="button" style="margin-right:6px;">' + DIFF_LABELS[k] + '</button>';
    }).join("") : "";

    var monsHtml = party.map(function (m, idx) { return bossMonCardHtml(m, idx); }).join("");

    // Botão que substituiu o "Enviar para o Claude" (texto pra copiar e colar na
    // conversa) em 2026-09-29 - agora o app monta o time sozinho.
    var montarHtml = '<div class="card boss-montar-card"><h3>Montar time contra este chefão</h3>' +
      '<p class="mybuild-hint">Testa cada Pokémon seu (time e caixa' + (monotypeAtivo() ? ", só do tipo " + escapeHtml(monotypeAtivo()) : "") +
        ') contra o time dele e troca o seu time pelos 6 que mais vencem. Depois gera, com a IA, a build com item de cada um pensando nesta luta. ' +
        'O time de agora fica guardado em Times salvos.</p>' +
      '<button id="boss-montar-time" class="add-team-btn" type="button">Montar time contra ' + escapeHtml(boss.name) + '</button>' +
      '<div id="boss-team-status" class="notes-status" role="status" aria-live="polite"></div>' +
    '</div>';

    document.getElementById("boss-detail").innerHTML =
      '<button class="back-btn" id="boss-back-to-list">&larr; Voltar para a lista</button>' +
      '<div class="detail-head"><div class="detail-titles">' +
        '<h2>' + escapeHtml(boss.name) + '</h2>' +
        '<div class="detail-dexno mono">' + escapeHtml(boss.cat) + (boss.db ? " · batalha em dupla" : "") + '</div>' +
      '</div></div>' +
      (diffBtns ? '<div style="margin-bottom:14px;">' + diffBtns + '<p style="color:var(--text-dim);font-size:var(--fs-legenda);margin:6px 0 0;max-width:65ch;">Nomes crus dos dados do jogo — não temos 100% de certeza que "Insane"/"Hell" batem exatamente com os modos "Ace"/"Elite" do menu do jogo atual. Confira sua dificuldade no Centro Pokémon se quiser ter certeza.</p></div>' : "") +
      bossConfrontoHtml(boss, party) +
      montarHtml +
      '<div class="card"><h3>Time do chefão' + (diffKey !== "party" ? " — " + DIFF_LABELS[diffKey] : "") + '</h3>' +
        '<div class="boss-level-row"><label for="boss-level-input">Status final calculados pro nível</label>' +
          '<input type="number" id="boss-level-input" class="campo campo-numero" min="1" max="100" value="' + bossState.level + '"></div>' +
        '<p style="color:var(--text-dim);font-size:var(--fs-legenda);margin:4px 0 12px;max-width:65ch;">Você digita o nível — não temos como saber o nível real de um treinador nos dados do jogo (por isso não existe uma calculadora de dano completa aqui, só isso). EVs/IVs são reais, extraídos do jogo. Considera o item quando é Choice Band/Specs/Scarf, Assault Vest, Tactical Vest, Thick Club ou Light Ball (marcado com *). Quando é Mega Stone ou orbe de reversão primal, os status já são calculados na forma transformada (types e stats reais dessa forma) — mas não sabemos qual das habilidades escolhíveis DA FORMA MEGA fica ativa (os dados não dizem), e não simulamos clima/campo/Trick Room já ativos antes da transformação (isso exigiria simular a ordem dos turnos, que este cálculo não faz). Efeito de habilidade em geral e itens ainda não identificados também não entram na conta.</p>' +
        '<div class="boss-mon-grid">' + monsHtml + '</div></div>' +
      renderGymSkillsCardHtml(boss);

    // Cliques e mudanças do detalhe: ouvintes únicos em #boss-detail (initBosses).
  }
