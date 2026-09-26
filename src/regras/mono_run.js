  // ===== src/regras/mono_run.js =====
  // Mono run: o que dá pra pegar do seu tipo até a etapa atual (2026-09-26,
  // pedido do usuário: "seria viável criar uma vertente para mono run"). O app
  // já sabia ONDE cada espécie aparece; o QUANDO vem da planilha da comunidade
  // "Mono earliest locations" (índice oficial), importada por
  // scripts/importar_mono.mjs pra data/mono_disponibilidade.json.
  // Colado dentro do <script> principal por scripts/build.mjs (marcador
  // @regras mono_run.js). Só lógica: nada aqui lê ou desenha a página.

  // Marcas da planilha, em palavras de jogador.
  var MONO_MARCAS = {
    "#": "vira do tipo ao evoluir",
    "*": "sai do tipo ao evoluir",
    "%": "precisa de evolução ou forma especial",
    "M": "só é do tipo na forma Mega"
  };

  // A espécie e tudo que ela vira por evolução normal (Mega fica de fora: é
  // forma de luta, não outra captura).
  function linhaEvolutivaDe(sp) {
    var linha = [sp], visto = {};
    visto[sp.x] = true;
    for (var i = 0; i < linha.length; i++) {
      (linha[i].ev || []).forEach(function (e) {
        var kind = DATA.evoKinds[e[0]];
        if (kind === "EVO_MEGA_EVOLUTION" || kind === "EVO_PRIMAL_REVERSION" || kind === "EVO_MOVE_MEGA_EVOLUTION") return;
        var filho = getSpeciesByX(e[2]);
        if (filho && !visto[filho.x]) { visto[filho.x] = true; linha.push(filho); }
      });
    }
    return linha;
  }

  // possuidos: lista de x (time + caixa). Já tem = tem a espécie OU algo que
  // ela vira (quem tem Charmeleon não precisa correr atrás de Charmander).
  function monoDisponibilidade(tipo, etapa, possuidos) {
    var lista = (MONO_DISP && MONO_DISP.porTipo && MONO_DISP.porTipo[tipo]) || [];
    var tem = {};
    (possuidos || []).forEach(function (x) { tem[x] = true; });
    var lideres = (MONO_DISP && MONO_DISP.lideres) || [];
    var itens = lista.map(function (e) {
      var sp = getSpeciesBySname(e.s);
      if (!sp) return null;
      var rank = SPECIES_RANK[e.s];
      var mono = rank && rank.monoRanks && rank.monoRanks[tipo];
      return {
        sp: sp, local: e.l, etapa: e.e,
        marcas: (e.m || "").split("").filter(function (m) { return MONO_MARCAS[m]; }),
        tier: mono ? mono.tier : null, score: mono ? mono.score : -1,
        jaTem: linhaEvolutivaDe(sp).some(function (s) { return tem[s.x]; })
      };
    }).filter(Boolean);
    // Melhores do tipo primeiro (rank Monotype, a mesma nota da ficha).
    itens.sort(function (a, b) { return b.score - a.score || a.sp.n.localeCompare(b.sp.n); });
    return {
      tipo: tipo, etapa: etapa,
      proximoLider: lideres[etapa] || null,
      liderAnterior: etapa > 0 ? lideres[etapa - 1] || null : null,
      novos: itens.filter(function (i) { return i.etapa === etapa; }),
      antes: itens.filter(function (i) { return i.etapa < etapa; }),
      proxima: itens.filter(function (i) { return i.etapa === etapa + 1; })
    };
  }
