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
