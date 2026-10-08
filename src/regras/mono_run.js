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

  // Lojas de iniciais (página oficial "How to Get Every Gen 1 to 9 Starter",
  // eliteredux.net, lida em 2026-10-01): depois de vencer a Flannery, cada
  // inicial de Grama/Água/Fogo das gerações 1 a 9 sai por 15 BP numa loja por
  // tipo. Os 45 iniciais extras por tipo NÃO estão nessas lojas.
  var LOJAS_DE_INICIAIS = [
    { onde: "na floricultura da Rota 104 (depois do Petalburg Woods)",
      bases: ["BULBASAUR", "CHIKORITA", "TREECKO", "TURTWIG", "SNIVY", "CHESPIN", "ROWLET", "GROOKEY", "SPRIGATITO"] },
    { onde: "no mercado de Slateport",
      bases: ["SQUIRTLE", "TOTODILE", "MUDKIP", "PIPLUP", "OSHAWOTT", "FROAKIE", "POPPLIO", "SOBBLE", "QUAXLY"] },
    { onde: "na primeira casa à direita do ginásio de Lavaridge",
      bases: ["CHARMANDER", "CYNDAQUIL", "TORCHIC", "CHIMCHAR", "TEPIG", "FENNEKIN", "LITTEN", "SCORBUNNY", "FUECOCO"] }
  ];
  var compraDeInicialCache = null;
  // Frase do "Como conseguir" pra um inicial (ou evolução dele); "" pros demais.
  function compraDeInicialTexto(sp) {
    if (!compraDeInicialCache) {
      compraDeInicialCache = Object.create(null);
      LOJAS_DE_INICIAIS.forEach(function (loja) {
        loja.bases.forEach(function (b) {
          var base = getSpeciesBySname("SPECIES_" + b);
          if (!base) return;
          linhaEvolutivaDe(base).forEach(function (membro) {
            if (!compraDeInicialCache[membro.sname]) compraDeInicialCache[membro.sname] = { base: base, onde: loja.onde };
          });
        });
      });
    }
    var c = sp && compraDeInicialCache[sp.sname];
    if (!c) return "";
    var quando = "depois de vencer a Flannery, por 15 BP " + c.onde;
    return c.base.sname === sp.sname
      ? "Loja de iniciais: " + quando + "."
      : "Evolução de inicial: compre o " + c.base.n + " " + quando + " e evolua.";
  }

  // ---- Monotype valendo em tudo (2026-09-26, pedido do usuário: "tem algo
  // que pode ajudar nas mono runs?"). Antes só o gerador de time respeitava o
  // Monotype; a melhor troca da caixa (com botão Aplicar) sugeria Pokémon de
  // outro tipo e quebrava a run. ----
  function monotypeAtivo() { return state.archetype.monotype || null; }
  // Pode lutar numa run Monotype: já tem o tipo (sem Monotype, todo mundo pode).
  function serveProMono(sp) {
    var tipo = monotypeAtivo();
    return !tipo || speciesTypeNames(sp).indexOf(tipo) !== -1;
  }

  // Fraquezas que o time inteiro divide (o tipo sozinho) e quem resiste ao tipo.
  function fraquezasDoTipo(tipo) {
    return USABLE_TYPES.filter(function (atk) { return typeMultiplier(atk, [tipo]) > 1; });
  }
  function resistemAoTipo(tipo) {
    return USABLE_TYPES.filter(function (def) { return typeMultiplier(tipo, [def]) < 1; });
  }
  // Quais dessas fraquezas a espécie cobre (resiste ou é imune), pelo tipo
  // secundário ou por habilidade sempre ativa.
  function cobreFraquezas(sp, fraquezas) {
    return fraquezas.filter(function (atk) { return abilityTypeMod(atk, sp).mult < 1; });
  }

  // Muda de tipo com a evolução? Pra quem NÃO tem o tipo: "#" se uma evolução
  // normal tem, "M" se só uma Mega da linha tem. Pra quem TEM: as evoluções
  // que perdem o tipo (o jogador pode segurar a evolução).
  function mudancaDeTipo(sp, tipo) {
    var tem = function (s) { return speciesTypeNames(s).indexOf(tipo) !== -1; };
    var linha = linhaEvolutivaDe(sp).slice(1);
    if (!tem(sp)) {
      if (linha.some(tem)) return { vira: "#" };
      var megas = [sp].concat(linha).reduce(function (acc, s) {
        return acc.concat(formFamilyOf(s).filter(function (f) { return isMegaForm(f) && acc.indexOf(f) === -1; }));
      }, []);
      return megas.some(tem) ? { vira: "M" } : null;
    }
    var perdem = linha.filter(function (s) { return !tem(s); });
    return perdem.length ? { sai: perdem.map(function (s) { return s.n; }) } : null;
  }

  // Berry de resistência de cada tipo (as mesmas do prompt de itens).
  var BERRY_DE_RESISTENCIA = {
    Fire: "Occa Berry", Water: "Passho Berry", Electric: "Wacan Berry", Grass: "Rindo Berry", Ice: "Yache Berry",
    Fighting: "Chople Berry", Poison: "Kebia Berry", Ground: "Shuca Berry", Flying: "Coba Berry", Psychic: "Payapa Berry",
    Bug: "Tanga Berry", Rock: "Charti Berry", Ghost: "Kasib Berry", Dragon: "Haban Berry", Dark: "Colbur Berry",
    Steel: "Babiri Berry", Fairy: "Roseli Berry", Normal: "Chilan Berry"
  };

  // Clima que combina com o tipo (2026-09-26, pedido do usuário) - SÓ bônus
  // confirmado em fonte oficial: "Weather Rework" da página Full Features
  // (eliteredux.net/full-features: "Damage bonus reduced to 20% for Sun/Rain",
  // "Ice-types get 50% defense boost in Hail") e o FAQ (Eerie Fog: "Ghost- and
  // Psychic-types get a 20% damage reduction from moves", e os aumentos de
  // status de quem NÃO é Ghost/Psychic caem 1 por turno). Areia pra Rock é do
  // jogo original e não aparece nas páginas oficiais deste hack - fica de fora.
  // Números oficiais num lugar só (2026-09-30): o motor do duelo (duelo.js) usa
  // estes mesmos - antes ele dava +50% no sol/chuva enquanto este texto dizia +20%.
  // Clima (decisão do usuário em 2026-10-02, depois da auditoria): segue o NextDex 2.65beta
  // (Drought/Drizzle/Sand Stream/Snow Warning "Lasts 8 turns") e o código oficial do jogo
  // (battle_util.c: clima de habilidade ou golpe dura 8 turnos e reforça 1,5x; o 1,2x é só
  // do clima permanente de mapa). O Full Features (+20%, infinito) ficou desatualizado.
  // A duração (duracaoTurnos) entra na luta inteira junto com "o armador precisa entrar".
  var CLIMA_OFICIAL = { reforcoSolChuva: 1.5, duracaoTurnos: 8, defesaIceNoGranizo: 1.5, spdRockNaAreia: 1.5, danoGhostPsychicNaNevoa: 0.8 };
  var pctClima = function (mult) { return Math.round(Math.abs(mult - 1) * 100) + "%"; };
  var CLIMA_QUE_COMBINA = {
    Fire: { clima: "Sun", curto: "+" + pctClima(CLIMA_OFICIAL.reforcoSolChuva) + " em golpes Fire", porque: "golpes Fire causam " + pctClima(CLIMA_OFICIAL.reforcoSolChuva) + " a mais no sol" },
    Water: { clima: "Rain", curto: "+" + pctClima(CLIMA_OFICIAL.reforcoSolChuva) + " em golpes Water", porque: "golpes Water causam " + pctClima(CLIMA_OFICIAL.reforcoSolChuva) + " a mais na chuva" },
    Ice: { clima: "Hail", curto: "+" + pctClima(CLIMA_OFICIAL.defesaIceNoGranizo) + " de Defesa pra Ice", porque: "tipo Ice ganha " + pctClima(CLIMA_OFICIAL.defesaIceNoGranizo) + " de Defesa no granizo" },
    Ghost: { clima: "Eerie Fog", curto: "-" + pctClima(CLIMA_OFICIAL.danoGhostPsychicNaNevoa) + " de dano recebido", porque: "Ghost recebe " + pctClima(CLIMA_OFICIAL.danoGhostPsychicNaNevoa) + " menos dano e seus aumentos de status não caem na névoa" },
    Psychic: { clima: "Eerie Fog", curto: "-" + pctClima(CLIMA_OFICIAL.danoGhostPsychicNaNevoa) + " de dano recebido", porque: "Psychic recebe " + pctClima(CLIMA_OFICIAL.danoGhostPsychicNaNevoa) + " menos dano e seus aumentos de status não caem na névoa" }
  };
  function climaQueCombina(tipo) { return CLIMA_QUE_COMBINA[tipo] || null; }

  // Texto pra IA (build, Estratégias e time): o que um time mono precisa cobrir.
  function orientacaoMono(tipo) {
    var fracas = fraquezasDoTipo(tipo);
    var berries = fracas.map(function (t) { return BERRY_DE_RESISTENCIA[t]; }).filter(function (b) { return b && ITEMS.indexOf(b) !== -1; });
    var clima = climaQueCombina(tipo);
    return "run Monotype " + tipo + ": o time INTEIRO e " + tipo + " e divide as mesmas fraquezas (" + fracas.join(", ") + "). " +
      "Priorize o que cobre isso - tipo secundario ou habilidade que resista/anule essas fraquezas" +
      (berries.length ? ", berry de resistencia da fraqueza mais perigosa (" + berries.join(", ") + ")" : "") +
      " - e golpe de cobertura contra quem resiste a " + tipo + " (" + resistemAoTipo(tipo).join(", ") + ")." +
      (clima ? " Clima que combina com " + tipo + " (bonus confirmado neste jogo): " + clima.clima + " - " + clima.porque +
        "; quem arma esse clima (habilidade ou golpe real) vale mais neste time." : "");
  }

  // Próximo líder x seu tipo: quantos membros têm golpe de dano super efetivo
  // no tipo (o time mono inteiro sente isso junto).
  function avisoProximoLider(tipo) {
    var boss = getRemainingBossEntries()[0];
    if (!boss) return null;
    var party = bossPartyPorDificuldade(boss) || [];
    var fortes = party.filter(function (m) {
      return (m.mv || []).some(function (nome) {
        var mv = MOVE_BY_NAME[nome];
        return mv && moveRoleOf(nome) === "dano" && typeMultiplier(TYPES[mv[1]], [tipo]) > 1;
      });
    });
    return {
      lider: gymLeaderBaseName(boss.name), total: party.length, // "Wattson 1" -> "Wattson"
      batemForte: fortes.map(function (m) { var s = getSpeciesByX(m.x); return s ? s.n : "?"; })
    };
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
      var rank = rankDe(e.s);
      var mono = rank && rank.monoRanks && rank.monoRanks[tipo];
      return {
        sp: sp, local: e.l, etapa: e.e,
        marcas: (e.m || "").split("").filter(function (m) { return MONO_MARCAS[m]; }),
        tier: mono ? mono.tier : null, score: mono ? mono.score : -1,
        cobre: cobreFraquezas(sp, fraquezasDoTipo(tipo)),
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
