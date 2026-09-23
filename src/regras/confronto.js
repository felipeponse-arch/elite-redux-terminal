  // ===== src/regras/confronto.js =====
  // Motor de confronto: dado o time do jogador e o time de um chefão, diz quem
  // acerta quem, quem ameaça quem e onde o time tem buraco.
  // Colado dentro do <script> principal do app por scripts/build.ps1 (marcador
  // @regras confronto.js), no mesmo escopo do resto do código - sem module,
  // sem wrapper. Só lógica pura: nada aqui lê a página, o que permite carregar
  // este arquivo no Node pros testes unitários (tests/unit/).
  //
  // Escopo deliberado (pauta de 2026-09-24, "estratégia e sugestão de times e
  // builds"): tipo, habilidade, golpes e item que o dado REALMENTE tem. Não faz
  // cálculo de dano nem compara Velocidade em pontos reais - o nível do chefão
  // não existe nos dados (o jogo escala em tempo real) e já foi um beco sem
  // saída medido. Onde a habilidade de um chefão pode mudar o resultado e ela
  // não está em TYPE_MOD_ABILITIES, o motor não sabe - a interface avisa isso,
  // em vez de o motor fingir certeza.

  var ABILITY_ID_BY_NAME = Object.create(null);
  ABILITIES.forEach(function (a, id) {
    if (a && a[0] && ABILITY_ID_BY_NAME[a[0]] === undefined) ABILITY_ID_BY_NAME[a[0]] = id;
  });

  // Rótulos das classes de resultado. Toda comparação passa por aqui, nunca por
  // texto digitado solto (mesma disciplina de dataLabel(), ver dados_base.js).
  var CONFRONTO_OFENSA = { SUPER: "super", NEUTRO: "neutro", RESISTIDO: "resistido", IMUNE: "imune", SEM_DANO: "sem_dano" };
  var CONFRONTO_AMEACA = { PERIGO: "perigo", NEUTRO: "neutro", SEGURO: "seguro" };
  var CONFRONTO_VEREDITO = { VANTAGEM: "vantagem", SEGURO: "seguro", NEUTRO: "neutro", ARRISCADO: "arriscado", DESVANTAGEM: "desvantagem" };
  var CONFRONTO_PONTOS = { vantagem: 2, seguro: 1, neutro: 0, arriscado: -1, desvantagem: -2 };

  function confrontoDamagingMoves(names) {
    return (names || []).filter(function (n) { return MOVE_BY_NAME[n] && moveRoleOf(n) === "dano"; });
  }
  function confrontoMoveType(name) { return TYPES[MOVE_BY_NAME[name][1]]; }

  // Ids de habilidade ativos de um Pokémon de chefão: as innates da espécie
  // (sempre ligadas) mais a habilidade escolhível que o dado do chefão informa.
  function foeAbilityIds(foeSp, abilityName) {
    var ids = (foeSp.inn || []).slice();
    var id = ABILITY_ID_BY_NAME[abilityName];
    if (id !== undefined) ids.push(id);
    return ids;
  }

  // Pokémon de chefão (linha de bosses.json) no formato que o motor usa.
  // `spOverride` é a forma Mega/Primal em que ele se transforma segurando o
  // item: passa a valer o tipo e as innates dela. A habilidade escolhível
  // que ele "escolheu" NA FORMA TRANSFORMADA é desconhecida no dado (os ids
  // de escolhível da base e da mega não se sobrepõem), então fica vazia em
  // vez de inventar uma.
  function foeFromBossMember(m, spOverride) {
    var sp = spOverride || getSpeciesByX(m.x);
    if (!sp) return null;
    return { sp: sp, name: m.n || sp.n, ability: spOverride ? "" : (m.abi || ""), item: m.item || "", moves: m.mv || [], base: m, transformado: !!spOverride };
  }

  // Ataque do jogador contra UM Pokémon de chefão. `moves` é a lista de nomes
  // da build; sem build (null) usa os tipos do próprio Pokémon como golpe
  // presumido e devolve estimada:true - o resultado continua útil, mas é uma
  // estimativa e a interface precisa dizer isso.
  function ofensaContra(mine, foe) {
    var defTypes = speciesTypeNames(foe.sp);
    var ids = foeAbilityIds(foe.sp, foe.ability);
    var estimada = !mine.moves;
    var candidatos;
    if (estimada) {
      candidatos = mine.mainTypes.map(function (t) { return { move: null, type: t, power: 0 }; });
    } else {
      candidatos = confrontoDamagingMoves(mine.moves).map(function (n) {
        return { move: n, type: confrontoMoveType(n), power: MOVE_BY_NAME[n][3] || 0 };
      });
    }
    if (!candidatos.length) return { classe: CONFRONTO_OFENSA.SEM_DANO, best: null, se: [], estimada: estimada };
    var avaliados = candidatos.map(function (c) {
      return { move: c.move, type: c.type, power: c.power, mult: abilityTypeModFor(c.type, defTypes, ids).mult };
    });
    avaliados.sort(function (a, b) { return b.mult - a.mult || b.power - a.power; });
    var best = avaliados[0];
    var classe = best.mult >= 2 ? CONFRONTO_OFENSA.SUPER
      : best.mult === 0 ? CONFRONTO_OFENSA.IMUNE
      : best.mult < 1 ? CONFRONTO_OFENSA.RESISTIDO
      : CONFRONTO_OFENSA.NEUTRO;
    return {
      classe: classe, best: best, estimada: estimada,
      se: avaliados.filter(function (a) { return a.mult >= 2; })
    };
  }

  // Ameaça de UM Pokémon de chefão contra uma unidade do jogador. Só os golpes
  // de dano que o dado do chefão realmente lista. Pior caso entre as formas da
  // unidade (no modo temporário a criatura passa parte da luta em cada).
  function ameacaDe(foe, mine) {
    var golpes = confrontoDamagingMoves(foe.moves);
    if (!golpes.length) return { classe: CONFRONTO_AMEACA.SEGURO, worst: null, threats: [] };
    var avaliados = golpes.map(function (n) {
      var type = confrontoMoveType(n);
      var worst = null;
      mine.forms.forEach(function (f) {
        var m = abilityTypeModFor(type, f.types, f.abilityIds).mult;
        if (worst === null || m > worst) worst = m;
      });
      return { move: n, type: type, mult: worst, power: MOVE_BY_NAME[n][3] || 0 };
    });
    avaliados.sort(function (a, b) { return b.mult - a.mult || b.power - a.power; });
    var pior = avaliados[0];
    var classe = pior.mult >= 2 ? CONFRONTO_AMEACA.PERIGO
      : avaliados.every(function (a) { return a.mult < 1; }) ? CONFRONTO_AMEACA.SEGURO
      : CONFRONTO_AMEACA.NEUTRO;
    return {
      classe: classe, worst: pior,
      threats: avaliados.filter(function (a) { return a.mult >= 2; })
    };
  }

  function velocidadeBase(mine, foe) {
    var a = mine.main.b[5], b = foe.sp.b[5];
    return a > b ? "maior" : a < b ? "menor" : "igual";
  }

  // Resultado de um duelo unidade x Pokémon de chefão, com a regra explícita:
  //   vantagem     - acerta super efetivo e não é ameaçado (ou é mais rápido);
  //   arriscado    - acerta super efetivo, mas é ameaçado e mais lento;
  //   seguro       - não tem golpe super efetivo, mas resiste a tudo que ele usa;
  //   desvantagem  - é ameaçado e não tem golpe super efetivo;
  //   neutro       - o resto.
  // Velocidade só desempata a vantagem (é só a base, ver o topo do arquivo).
  function confrontoDuelo(mine, foe) {
    var o = ofensaContra(mine, foe);
    var a = ameacaDe(foe, mine);
    var veloz = velocidadeBase(mine, foe);
    var v;
    if (o.classe === CONFRONTO_OFENSA.SUPER) {
      v = (a.classe === CONFRONTO_AMEACA.PERIGO && veloz !== "maior") ? CONFRONTO_VEREDITO.ARRISCADO : CONFRONTO_VEREDITO.VANTAGEM;
    } else if (a.classe === CONFRONTO_AMEACA.PERIGO) {
      v = CONFRONTO_VEREDITO.DESVANTAGEM;
    } else if (a.classe === CONFRONTO_AMEACA.SEGURO) {
      v = CONFRONTO_VEREDITO.SEGURO;
    } else {
      v = CONFRONTO_VEREDITO.NEUTRO;
    }
    return { ofensa: o, ameaca: a, veloz: veloz, veredito: v };
  }

  // Time do jogador (lista de unidades) contra o time de um chefão (lista de
  // Pokémon de chefão já em foeFromBossMember). Devolve os números que toda
  // tela precisa, calculados uma vez só: a tela só escolhe como mostrar.
  function confrontoTime(minhas, foes) {
    var linhas = foes.map(function (foe) {
      var respostas = minhas.map(function (mine, idx) {
        var d = confrontoDuelo(mine, foe);
        return { idx: idx, duelo: d, pontos: CONFRONTO_PONTOS[d.veredito] };
      });
      var melhor = null;
      respostas.forEach(function (r) {
        if (!melhor || r.pontos > melhor.pontos ||
            (r.pontos === melhor.pontos && r.duelo.veloz === "maior" && melhor.duelo.veloz !== "maior")) melhor = r;
      });
      var comSuper = respostas.filter(function (r) { return r.duelo.ofensa.classe === CONFRONTO_OFENSA.SUPER; });
      var ameacando = respostas.filter(function (r) { return r.duelo.ameaca.classe === CONFRONTO_AMEACA.PERIGO; });
      return { foe: foe, respostas: respostas, melhor: melhor, buraco: comSuper.length === 0, ameacando: ameacando.length };
    });
    var pontosPorMembro = minhas.map(function (m, idx) {
      var soma = 0;
      linhas.forEach(function (l) { soma += l.respostas[idx].pontos; });
      return soma;
    });
    var abertura = null;
    pontosPorMembro.forEach(function (p, idx) { if (abertura === null || p > pontosPorMembro[abertura]) abertura = idx; });
    return {
      linhas: linhas,
      buracos: linhas.filter(function (l) { return l.buraco; }).map(function (l) { return l.foe; }),
      ameacas: linhas.filter(function (l) { return minhas.length && l.ameacando * 2 >= minhas.length; }).map(function (l) { return l.foe; }),
      pontosPorMembro: pontosPorMembro,
      abertura: abertura,
      estimada: minhas.some(function (m) { return !m.moves; })
    };
  }

  // ---- Fechar buracos: qual golpe que o Pokémon JÁ pode usar agora resolve ----
  // `mine.aprendiveis` (fornecido pelo adaptador, vem de availableMovesFor: level
  // cap atual + tutor) é a lista de golpes que aquele Pokémon pode ter na build
  // hoje. Escolha gulosa de cobertura: a cada passo o golpe que fecha mais
  // buracos ainda abertos (empate: mais poder, depois STAB). Golpe fraco
  // (poder < COBERTURA_PODER_MINIMO) não entra: acertar super efetivo com 20 de
  // poder não é uma resposta de verdade.
  var COBERTURA_PODER_MINIMO = 50;
  var COBERTURA_PRECISAO_MINIMA = 70;
  function coberturaSugerida(minhas, cx) {
    var abertos = cx.linhas.filter(function (l) { return l.buraco; }).map(function (l) { return l.foe; });
    var candidatos = [];
    minhas.forEach(function (mine, idx) {
      (mine.aprendiveis || []).forEach(function (mv) {
        if (mine.moves && mine.moves.indexOf(mv) !== -1) return;
        if (!MOVE_BY_NAME[mv] || moveRoleOf(mv) !== "dano") return;
        var power = MOVE_BY_NAME[mv][3] || 0;
        if (power < COBERTURA_PODER_MINIMO) return;
        // Golpe que atrasa o turno (prioridade negativa: Focus Punch, Counter...)
        // ou erra demais (precisão abaixo de 70) não é uma resposta confiável.
        if ((MOVE_BY_NAME[mv][7] || 0) < 0) return;
        var acc = MOVE_BY_NAME[mv][4];
        if (acc > 0 && acc < COBERTURA_PRECISAO_MINIMA) return;
        var type = confrontoMoveType(mv);
        var resolve = abertos.filter(function (foe) {
          return abilityTypeModFor(type, speciesTypeNames(foe.sp), foeAbilityIds(foe.sp, foe.ability)).mult >= 2;
        });
        if (resolve.length) candidatos.push({ idx: idx, move: mv, type: type, power: power, stab: mine.mainTypes.indexOf(type) !== -1, resolve: resolve });
      });
    });
    var escolhidos = [];
    var restantes = abertos.slice();
    while (restantes.length && escolhidos.length < 3) {
      var melhor = null, melhorN = 0;
      candidatos.forEach(function (c) {
        var n = c.resolve.filter(function (f) { return restantes.indexOf(f) !== -1; }).length;
        if (!n) return;
        if (!melhor || n > melhorN || (n === melhorN && (c.power > melhor.power || (c.power === melhor.power && c.stab && !melhor.stab)))) {
          melhor = c; melhorN = n;
        }
      });
      if (!melhor) break;
      var cobre = melhor.resolve.filter(function (f) { return restantes.indexOf(f) !== -1; });
      escolhidos.push({ idx: melhor.idx, move: melhor.move, type: melhor.type, power: melhor.power, resolve: cobre });
      restantes = restantes.filter(function (f) { return cobre.indexOf(f) === -1; });
    }
    return escolhidos;
  }

  // ---- Melhor time possível pra ESTA luta ----
  // Valor de um time contra o chefão: por Pokémon dele, os pontos da melhor
  // resposta do time (sem resposta = -2), mais um bônus de +1 quando alguém o
  // acerta super efetivo e uma penalidade de -3 quando ninguém acerta (o buraco
  // pesa mais que uma resposta boa a mais). Cada duelo é calculado UMA vez por
  // Pokémon (caixa de centenas de criaturas): o resto é só olhar a tabela.
  var LIMIAR_TROCA = 2;
  function confrontoDuelosDe(unit, foes) {
    return foes.map(function (foe) {
      var d = confrontoDuelo(unit, foe);
      return { pontos: CONFRONTO_PONTOS[d.veredito], super: d.ofensa.classe === CONFRONTO_OFENSA.SUPER };
    });
  }
  function valorDoTime(duelosDoTime, nFoes) {
    var valor = 0, buracos = 0;
    for (var f = 0; f < nFoes; f++) {
      var melhorPts = -2, temSuper = false;
      duelosDoTime.forEach(function (duelos) {
        if (duelos[f].pontos > melhorPts) melhorPts = duelos[f].pontos;
        if (duelos[f].super) temSuper = true;
      });
      valor += melhorPts + (temSuper ? 1 : -3);
      if (!temSuper) buracos++;
    }
    return { valor: valor, buracos: buracos };
  }
  // Até `max` trocas (ou entradas, se o time tem vaga), sempre a que mais sobe o
  // valor, e só se a subida for de pelo menos LIMIAR_TROCA - nunca troca lateral
  // nem por diferença mínima. `atuais` e `caixa` são unidades do motor.
  function melhoresTrocas(atuais, caixa, foes, max) {
    var time = atuais.map(function (u) { return { u: u, d: confrontoDuelosDe(u, foes) }; });
    var pool = caixa.map(function (u) { return { u: u, d: confrontoDuelosDe(u, foes) }; });
    var base = valorDoTime(time.map(function (t) { return t.d; }), foes.length);
    var inicial = base;
    var trocas = [];
    for (var n = 0; n < max; n++) {
      var melhor = null;
      var tentar = function (novoTime, info) {
        var v = valorDoTime(novoTime.map(function (t) { return t.d; }), foes.length);
        if (v.valor - base.valor >= LIMIAR_TROCA && (!melhor || v.valor > melhor.v.valor)) melhor = { v: v, info: info, time: novoTime };
      };
      if (time.length < 6) {
        pool.forEach(function (c, pi) { tentar(time.concat([c]), { sai: null, pi: pi }); });
      }
      time.forEach(function (t, ti) {
        pool.forEach(function (c, pi) {
          var novo = time.slice(); novo[ti] = c;
          tentar(novo, { sai: ti, pi: pi });
        });
      });
      if (!melhor) break;
      var saiu = melhor.info.sai === null ? null : time[melhor.info.sai];
      var entrou = pool[melhor.info.pi];
      trocas.push({ sai: saiu && saiu.u, entra: entrou.u, ganho: melhor.v.valor - base.valor, buracosDepois: melhor.v.buracos });
      pool = pool.filter(function (_, pi) { return pi !== melhor.info.pi; });
      if (saiu) pool.push(saiu);
      time = melhor.time;
      base = melhor.v;
    }
    return { trocas: trocas, buracosAntes: inicial.buracos, buracosDepois: base.buracos, valorAntes: inicial.valor, valorDepois: base.valor };
  }

  // ---- Plano de luta ----
  // Os golpes que mais ameaçam o seu time neste chefão: por Pokémon dele, o
  // golpe de maior multiplicador contra cada membro seu que fica em perigo,
  // do mais grave pro menos, até `max`.
  function cuidadosDoChefao(cx, minhas, max) {
    var lista = [];
    cx.linhas.forEach(function (l) {
      l.respostas.forEach(function (r) {
        var a = r.duelo.ameaca;
        if (a.classe !== CONFRONTO_AMEACA.PERIGO || !a.worst) return;
        lista.push({ foe: l.foe, idx: r.idx, move: a.worst.move, type: a.worst.type, mult: a.worst.mult, power: a.worst.power });
      });
    });
    lista.sort(function (a, b) { return b.mult - a.mult || b.power - a.power; });
    return lista.slice(0, max || 5);
  }

  // Batalha em dupla: os dois primeiros do time do chefão entram juntos. A dupla
  // do jogador que mais pontua contra os dois, com penalidade quando um mesmo
  // Pokémon dele ameaça os dois (não dá pra proteger um com o outro). Só faz
  // sentido com 2+ membros seus e 2+ do chefão; senão devolve null.
  function aberturaEmDupla(minhas, foes) {
    if (minhas.length < 2 || foes.length < 2) return null;
    var dois = foes.slice(0, 2);
    var melhor = null;
    for (var i = 0; i < minhas.length; i++) {
      for (var j = i + 1; j < minhas.length; j++) {
        var pts = 0, ameacaAosDois = 0;
        dois.forEach(function (foe) {
          var di = confrontoDuelo(minhas[i], foe), dj = confrontoDuelo(minhas[j], foe);
          pts += CONFRONTO_PONTOS[di.veredito] + CONFRONTO_PONTOS[dj.veredito];
          if (di.ameaca.classe === CONFRONTO_AMEACA.PERIGO && dj.ameaca.classe === CONFRONTO_AMEACA.PERIGO) ameacaAosDois++;
        });
        var valor = pts - 2 * ameacaAosDois;
        if (!melhor || valor > melhor.valor) melhor = { idx: [i, j], valor: valor, ameacaAosDois: ameacaAosDois, foes: dois };
      }
    }
    return melhor;
  }
