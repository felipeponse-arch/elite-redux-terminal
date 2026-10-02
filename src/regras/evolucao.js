  // ===== src/regras/evolucao.js =====
  // Builds salvas por espécie, registro "O que o app fez sozinho" e o que acontece
  // com a build quando a criatura evolui ou regride (auto-evolução por level cap).
  // Colado dentro do <script> principal do app por scripts/build.mjs (marcador
  // @regras evolucao.js), no mesmo escopo do resto do código. Só lógica: nada aqui
  // lê ou desenha a página - testável no Node (tests/unit). Movido do template na
  // fase 3 da refatoração (2026-09-24), sem mudar o comportamento.

  // ---------------- custom build list helpers ----------------
  // state.customBuilds[sname] is always an array (0-3 entries) from this
  // point on - every read/write in the app goes through these, so "which
  // one is active", "add a new variant", "replace the shown one" and the
  // 3-build cap all live in exactly one place.
  function getBuildList(sname) { return state.customBuilds[sname] || []; }

  function getActiveBuild(sname) {
    var list = getBuildList(sname);
    for (var i = 0; i < list.length; i++) { if (list[i].active) return list[i]; }
    return list.length ? list[0] : null;
  }

  // Auto-evolução por level cap, 2026-09-10 (pedido do usuário, decisões
  // confirmadas por ele antes de construir): assume que todo Pokémon do
  // time/caixa já está no nível liberado pelo cap atual - qualquer evolução
  // por NÍVEL cujo requisito seja <= cap acontece sozinha, encadeando quantas
  // etapas o cap permitir de uma vez (ex: cap pula de 20 pra 40 e o Pokémon
  // evolui 2 vezes). Escopo deliberadamente restrito a `EVO_LEVEL` puro -
  // EXCLUI variantes por gênero (EVO_LEVEL_MALE/FEMALE, que também têm `rs`
  // numérico): o app não sabe o sexo real do Pokémon do usuário, e evoluir
  // errado é pior que não evoluir. Também exclui troca/pedra/amizade/mega de
  // propósito (mega já é seu próprio mecanismo de "mega permanente" em outro
  // lugar deste app - não confundir os dois).
  // Build/anotação salvas no nome antigo são carregadas pro novo nome (só se
  // o novo nome ainda não tiver uma build/anotação própria - nunca sobrescreve
  // algo que o usuário já configurou manualmente pra forma evoluída).
  // Evolui time e caixa sem criar duas cópias da mesma espécie (lote D, 2026-10-02: com
  // Charmander e Charmeleon no elenco, os dois viravam Charmeleon e "remover" sumia com um).
  // Se a forma evoluída já existe no elenco, este fica como está e o motivo vai pro log.
  // step(x, msgs) evolui/regride um Pokémon e anota em msgs.
  function evoluirElencoSemDuplicar(team, box, step) {
    // Começa com o elenco original inteiro: quem não evolui também ocupa a espécie.
    var usados = {}, messages = [];
    team.concat(box).forEach(function (x) { usados[x] = true; });
    function um(x) {
      var msgs = [];
      var antes = JSON.stringify(state.autoEvolved);
      var nx = step(x, msgs);
      if (nx !== x && usados[nx]) {
        state.autoEvolved = JSON.parse(antes); // desfaz o registro: o outro não foi evoluído pelo app
        var a = getSpeciesByX(x), b = getSpeciesByX(nx);
        messages.push((a ? a.n : x) + " não evoluiu: já há um " + (b ? b.n : nx) + " no elenco");
        nx = x;
      } else messages = messages.concat(msgs);
      usados[nx] = true;
      return nx;
    }
    return { team: team.map(um), box: box.map(um), messages: messages };
  }
  // Registro de auto-evolução de espécie que saiu do elenco é lixo: com ele, um Pokémon
  // adicionado depois já evoluído pela Dex "regredia" ao baixar a insígnia (lote D).
  function podarAutoEvolved(team, box) {
    var no = {};
    team.concat(box).forEach(function (x) { var s = getSpeciesByX(x); if (s) no[s.sname] = true; });
    Object.keys(state.autoEvolved).forEach(function (sn) { if (!no[sn]) delete state.autoEvolved[sn]; });
  }
  function evolveChainByX(x, cap, messages) {
    var steps = 0;
    while (steps < 10) { // trava de segurança contra dado malformado/ciclo
      var sp = getSpeciesByX(x);
      if (!sp || !sp.ev || !sp.ev.length) return x;
      var applicable = null;
      for (var i = 0; i < sp.ev.length; i++) {
        var ev = sp.ev[i];
        // O nível de evolução vem como STRING no dado bruto (ex: "16", não
        // 16 - confirmado direto em data/dex_compact.json), mesmo quando é
        // puramente numérico - por isso Number(...) em vez de checar
        // typeof === "number", que falharia silenciosamente sempre.
        var reqLevel = Number(ev[1]);
        if (EVOKINDS[ev[0]] === EVO_LEVEL && !isNaN(reqLevel) && reqLevel <= cap) { applicable = ev; break; }
      }
      if (!applicable) return x;
      var target = getSpeciesByX(applicable[2]);
      if (!target || target.x === x) return x;
      carryUserData(sp.sname, target.sname);
      state.autoEvolved[target.sname] = { from: sp.sname, lvl: reqLevel };
      messages.push(sp.n + " → " + target.n);
      x = target.x;
      steps++;
    }
    return x;
  }

  // Build/anotação acompanham a criatura quando ela muda de espécie (nos dois
  // sentidos) - nunca sobrescreve algo que o destino já tenha próprio.
  // Confere as builds salvas de UMA espécie contra os dados reais dela e ajusta o
  // que não vale (reconciliarBuild, src/regras). Nunca apaga a build: troca a
  // habilidade inexistente por uma escolhível real e tira só os golpes que a
  // espécie não aprende - e anota o que mudou no log "O que o app fez sozinho",
  // com o valor antigo, pra o jogador poder desfazer à mão se discordar.
  // `deSname` (opcional): a espécie de onde a build veio. Quando o ajuste muda
  // algo, a versão de antes fica guardada em `anterior` - se a criatura voltar
  // pra aquela espécie (cap desceu), carryUserData restaura a build inteira em
  // vez de ficar com os golpes cortados (defeito b da revisão da v136).
  function reconciliarBuildsDe(sname, contexto, deSname) {
    var sp = getSpeciesBySname(sname);
    var list = state.customBuilds[sname];
    if (!sp || !list) return false;
    var mudou = false;
    state.customBuilds[sname] = list.map(function (b) {
      var r = reconciliarBuild(b, sp);
      if (r.changes.length) {
        mudou = true;
        if (deSname) {
          // Pilha: evolução em 2 etapas numa subida só (Axew -> Fraxure ->
          // Haxorus) guarda as 2 versões, e a regressão desfaz uma de cada vez.
          r.build.anterior = { sname: deSname, ability: b.ability, moves: (b.moves || []).slice(), rationale: b.rationale || "" };
          if (b.plano) r.build.anterior.plano = b.plano;
          if (b.anterior) r.build.anterior.anterior = b.anterior;
        }
        logAutoAction("Build de " + sp.n + " ajustada" + (contexto ? " (" + contexto + ")" : "") + ": " +
          r.changes.map(function (c) { return c.campo + " " + c.de + " → " + c.para; }).join("; ") + ".");
      }
      return r.build;
    });
    return mudou;
  }

  // Build que volta pra espécie de onde veio recupera a versão guardada.
  function restaurarAnteriorPara(list, sname) {
    return list.map(function (b) {
      if (!b.anterior || b.anterior.sname !== sname) return b;
      var r = {};
      Object.keys(b).forEach(function (k) { if (k !== "anterior") r[k] = b[k]; });
      r.ability = b.anterior.ability;
      r.moves = b.anterior.moves.slice();
      r.rationale = b.anterior.rationale;
      if (b.anterior.plano) r.plano = b.anterior.plano; else delete r.plano;
      if (b.anterior.anterior) r.anterior = b.anterior.anterior;
      return r;
    });
  }

  function ehEvolucaoPraFrente(fromSname, toSname) {
    var de = getSpeciesBySname(fromSname), para = getSpeciesBySname(toSname);
    return !!(de && para && (de.ev || []).some(function (ev) { return ev[2] === para.x; }));
  }

  function reconciliarBuildsSalvas() {
    var mudou = false;
    Object.keys(state.customBuilds).forEach(function (sn) {
      if (reconciliarBuildsDe(sn, "conferida contra os dados do jogo")) mudou = true;
    });
    return mudou;
  }

  // A build que muda de espécie passa por reconciliarBuildsDe: a habilidade e os
  // golpes da espécie ANTERIOR podem não existir na nova (Fraxure -> Haxorus:
  // Moxie sumiu).
  // A build acompanha a criatura. Destino sem build própria: a lista inteira vai
  // e vira a do destino. Destino que já tem build (de outra criatura da mesma
  // espécie, ou montada pela Dex): as que chegam entram até o limite de 3, e a
  // ativa da criatura que evoluiu continua ATIVA (é a que ela estava usando); a
  // que já existia fica salva nos chips. O que não couber fica na origem - antes,
  // nesse caso, a build da origem era apagada sem ir pra lugar nenhum (defeito a
  // da revisão da v136). Mesma ideia pras anotações (só move se o destino não
  // tiver).
  function carryUserData(fromSname, toSname) {
    var origem = state.customBuilds[fromSname];
    if (origem && origem.length) {
      var de = getSpeciesBySname(fromSname), para = getSpeciesBySname(toSname);
      var contexto = de ? "passou de " + de.n + " pra " + (para || { n: toSname }).n : "";
      var destino = state.customBuilds[toSname] || [];
      var praFrente = ehEvolucaoPraFrente(fromSname, toSname);
      var cabem = Math.max(0, 3 - destino.length);
      // A ativa da origem vai primeiro, pra ser a que cabe quando falta espaço.
      var ordenada = origem.filter(function (b) { return b.active; }).concat(origem.filter(function (b) { return !b.active; }));
      var vao = restaurarAnteriorPara(ordenada.slice(0, cabem), toSname);
      if (!praFrente) {
        // Voltou de forma (cap desceu): nada de revisão pendente da evolução.
        vao.forEach(function (b) { delete b.revisar; delete b.revisadaDe; delete b.tentativasRevisao; });
      }
      if (vao.length) {
        var ativaChegou = vao.some(function (b) { return b.active; });
        if (destino.length && ativaChegou) {
          destino.forEach(function (b) { b.active = false; });
          logAutoAction("A build que " + (de ? de.n : fromSname) + " usava continua ativa em " + (para ? para.n : toSname) +
            "; a que já existia pra " + (para ? para.n : toSname) + " ficou salva nos chips da ficha.");
        }
        state.customBuilds[toSname] = destino.concat(vao);
        if (ordenada.length > cabem) state.customBuilds[fromSname] = ordenada.slice(cabem);
        else delete state.customBuilds[fromSname];
        reconciliarBuildsDe(toSname, contexto, fromSname);
        if (praFrente) marcarRevisaoPosEvolucao(toSname, fromSname);
      }
    }
    if (state.notes[fromSname] && !state.notes[toSname]) {
      state.notes[toSname] = state.notes[fromSname];
      delete state.notes[fromSname];
    }
  }

  // Desfaz, etapa por etapa, evoluções que ESTE app aplicou sozinho e que o
  // cap atual não libera mais (ex: cap voltou de 60 pra 55 -> Selenumbra
  // volta a ser Volcarona Redux). Só mexe no que está em state.autoEvolved:
  // um Pokémon que o jogador adicionou já evoluído pela Dex nunca é tocado.
  function devolveChainByX(x, cap, messages) {
    var steps = 0;
    while (steps < 10) {
      var sp = getSpeciesByX(x);
      var rec = sp ? state.autoEvolved[sp.sname] : null;
      if (!rec || rec.lvl <= cap) return x;
      var prev = getSpeciesBySname(rec.from);
      if (!prev) return x;
      carryUserData(sp.sname, prev.sname);
      delete state.autoEvolved[sp.sname];
      messages.push(sp.n + " voltou a " + prev.n + " (evolui no nível " + rec.lvl + ")");
      x = prev.x;
      steps++;
    }
    return x;
  }

  // Roda ao carregar o save e sempre que dificuldade/milestone mudam (na
  // hora, conforme pedido do usuário) - não em toda renderização, já que
  // percorre time+caixa inteiros. Retorna true se algo mudou, pra quem
  // chamou saber se precisa re-renderizar/persistir de novo.
  // Repetição da mesma mensagem seguida (ex: órfãos a cada abertura) não
  // empilha - só atualiza a data da entrada que já existe.
  function logAutoAction(text) {
    var now = new Date().toISOString();
    if (state.autoLog.length && state.autoLog[0].text === text) { state.autoLog[0].at = now; return; }
    state.autoLog.unshift({ at: now, text: text });
    if (state.autoLog.length > AUTO_LOG_MAX) state.autoLog.length = AUTO_LOG_MAX;
  }

  function marcarRevisaoPosEvolucao(toSname, fromSname) {
    var de = getSpeciesBySname(fromSname), para = getSpeciesBySname(toSname);
    if (!de || !para || !(de.ev || []).some(function (ev) { return ev[2] === para.x; })) return; // só evolução pra frente
    var ativa = getActiveBuild(toSname);
    // Curada também (2026-09-27, pedido do usuário: "zerar aquela build do level
    // 18 e sugerir uma build nova pro Pokémon que evoluiu") - a curada que veio
    // da pré-evolução foi pensada pra ELA, não pra forma nova.
    if (ativa) { ativa.revisar = "evolucao"; ativa.revisadaDe = de.n; ativa.tentativasRevisao = 0; }
  }

  // Há algo da run pra zerar? Habilita o botão "Novo jogo" (ver zerarRun no template).
  function runTemAlgoPraZerar() {
    return !!(state.team.length || state.box.length || state.archetype.pace || state.archetype.weather || state.archetype.monotype || state.archetype.tatica ||
      Object.keys(state.autoEvolved).length || Object.keys(state.gymSkillsCleared).length || state.settings.milestone > 0);
  }
