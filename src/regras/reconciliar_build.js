  // ===== src/regras/reconciliar_build.js =====
  // Uma build salva precisa continuar valendo pra espécie em que ela está AGORA.
  // Colado dentro do <script> principal do app por scripts/build.mjs (marcador
  // @regras reconciliar_build.js), no mesmo escopo do resto do código - sem
  // module, sem wrapper. Só lógica pura: nada aqui lê a página.
  //
  // Achado do usuário (print, 2026-09-24): o Haxorus do time mostrava "Build gerada
  // por IA" com Ability: Moxie, que ele não tem. Causa: Axew e Fraxure TÊM Moxie
  // entre as habilidades escolhíveis; a build gerada pra eles foi levada pro
  // Haxorus pela auto-evolução (carryUserData) sem ser conferida contra a nova
  // espécie. A build nunca é apagada: o que não vale na espécie nova é ajustado, e
  // quem chama registra o que mudou (log "O que o app fez sozinho").

  // Todo golpe que a espécie aprende de alguma forma (qualquer nível ou tutor).
  // Aqui a pergunta é "existe pra esta espécie?", não "o level cap já libera?" -
  // um golpe acima do cap continua sendo um golpe válido da espécie.
  function movepoolCompletoDe(sp) {
    var nomes = {};
    sp.lm.forEach(function (p) { if (MOVES[p[1]]) nomes[MOVES[p[1]][0]] = true; });
    sp.tu.forEach(function (id) { if (MOVES[id]) nomes[MOVES[id][0]] = true; });
    return nomes;
  }
  // Habilidade escolhível que substitui uma inválida: a que tem sinergia real e
  // ATIVA com os golpes que ficaram (mesmos dados de ABILITY_SYNERGY que a
  // validação da IA usa); sem sinergia, a primeira escolhível da espécie.
  function habilidadeSubstitutaPara(sp, moves) {
    var escolhiveis = uniqueIds(sp.ab).map(function (id) { return ABILITIES[id][0]; });
    var hits = sinergiasDaEspecie(sp);
    for (var i = 0; i < hits.length; i++) {
      var h = hits[i];
      if (h.kind === "inn" || escolhiveis.indexOf(h.name) === -1) continue;
      if ((h.golpes || []).some(function (g) { return moves.indexOf(g) !== -1; })) return h.name;
    }
    return escolhiveis[0] || "";
  }
  // Devolve { build, changes }: `build` é uma cópia ajustada (a original nunca é
  // mexida) e `changes` diz o que mudou ({campo, de, para}); vazio = a build já
  // valia e volta idêntica.
  function reconciliarBuild(build, sp) {
    var out = {};
    Object.keys(build).forEach(function (k) { out[k] = build[k]; });
    out.moves = (build.moves || []).slice();
    var changes = [];
    var pool = movepoolCompletoDe(sp);
    var invalidos = out.moves.filter(function (m) { return !pool[m]; });
    if (invalidos.length) {
      out.moves = out.moves.filter(function (m) { return pool[m]; });
      changes.push({ campo: "golpes", de: invalidos.join(", "), para: "removido" });
    }
    // Plano de golpes (src/regras/plano_build.js): passo cujo golpe de agora saiu
    // da build, ou cujo destino esta espécie não aprende, deixa de valer.
    if (build.plano && typeof build.plano === "object") {
      var plano = {}, fora = [];
      Object.keys(build.plano).forEach(function (de) {
        var para = build.plano[de];
        if (out.moves.indexOf(de) !== -1 && typeof para === "string" && pool[para]) plano[de] = para;
        else fora.push(de + " → " + para);
      });
      out.plano = plano;
      if (fora.length) changes.push({ campo: "plano", de: fora.join(", "), para: "removido" });
    }
    var escolhiveis = uniqueIds(sp.ab).map(function (id) { return ABILITIES[id][0]; });
    if (out.ability && escolhiveis.indexOf(out.ability) === -1) {
      var nova = habilidadeSubstitutaPara(sp, out.moves);
      changes.push({ campo: "habilidade", de: out.ability, para: nova || "(nenhuma)" });
      out.ability = nova;
      // A justificativa da IA citava a habilidade antiga; deixá-la ali seria
      // mostrar um raciocínio sobre uma build que já não existe.
      out.rationale = "";
    }
    return { build: out, changes: changes };
  }
