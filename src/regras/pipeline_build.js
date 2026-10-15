  // ===== src/regras/pipeline_build.js =====
  // Pipeline de build com intenção (ticket 20 da dívida, desenho de 14/10/2026; docs/pipeline_de_build.md).
  // Do Pokémon para a build: o código monta de 3 a 5 candidatos (uma das 3 habilidades + as inatas + 4 golpes),
  // simula cada um contra o alvo com o motor do duelo e marca o hit-kill e quem bate primeiro. A IA do app só
  // escolhe entre os candidatos e fecha EVs, item e natureza (fecharBuild); a validação é a de sempre.
  // Três funções públicas: candidatosDeBuild (caso A, do Pokémon), especiesQueResolvem (caso B, do alvo) e fecharBuild.
  // Testes: tests/unit/pipeline_build.test.mjs. Escopo global, ES5, sem window/document (ADR-004).
  // Função pura: não muda `state` nem grava nada; o único efeito é o cache interno do motor (benigno).

  // Casos em que o motor foi CONFERIDO contra a calculadora do próprio jogo (tests/unit/calibracao_calculadora_do_jogo.test.mjs,
  // prints do usuário de 10/10/2026): o Ledian (habilidade Aerodynamics, nível 55) com Mega Punch (78%-93%) e com Aerial Ace
  // (58%-69%) contra o Ninetales da luta Courtney Meteor Falls, com Life Orb. Só o hit-kill sustentado por um caso desta lista
  // sai "calibrada"; outro atacante, outra habilidade que mude o dano ou outro alvo é "estimada" (a conferência de um golpe
  // não vale para quem não foi conferido). AMPLIAR A LISTA É DECISÃO DO USUÁRIO, com número novo da calculadora do jogo.
  var CASOS_CALIBRADOS = [
    { atacante: "SPECIES_LEDIAN", habilidade: "Aerodynamics", golpe: "Mega Punch", alvo: "SPECIES_NINETALES" },
    { atacante: "SPECIES_LEDIAN", habilidade: "Aerodynamics", golpe: "Aerial Ace", alvo: "SPECIES_NINETALES" }
  ];
  // Decisão do usuário (P1, 14/10/2026): a prioridade EFETIVA do golpe do alvo entra na definição de "bate primeiro" (quem dá o KO
  // primeiro na ordem real de turnos), então `baterPrimeiro` e o ranking já refletem a ordem real; `alvoAgeAntes` fica como motivo
  // (aviso "O alvo age antes") e um golpe de prioridade do alvo que o atacante não supera tira o selo "calibrada".
  // Reverter numa linha (false): a prioridade do alvo sai de tudo (definição antiga: só prioridade do golpe ou Velocidade).
  var CONSIDERA_PRIORIDADE_DO_ALVO = true;

  var AVISO_SIMULACAO_1X1 = "Simulação 1x1: luta em dupla e Fake Out não são simulados.";
  var MAX_CANDIDATOS_PIPELINE = 5;
  var MIN_CANDIDATOS_PIPELINE = 3;
  // Referência de simulação: EVs de ataque + 252 Spe, SEM item (conservador: nunca prometer o que só vale com Life Orb).
  // O item e os EVs finais são da IA; a natureza é a que mais ajuda o candidato (as quatro são testadas).
  var NATUREZAS_DO_PIPELINE = [
    { nome: "Adamant", evs: [0, 252, 0, 0, 0, 252] }, { nome: "Jolly", evs: [0, 252, 0, 0, 0, 252] },
    { nome: "Modest", evs: [0, 0, 0, 252, 0, 252] }, { nome: "Timid", evs: [0, 0, 0, 252, 0, 252] }
  ];
  // Três jeitos de completar os 3 golpes que faltam depois da âncora: equilibrado, atrás de sinergia, atrás de cobertura.
  var MODOS_DE_PREENCHER_PIPELINE = [
    { pesoSin: 4, bonusTipo: 6, penaTipo: -25 }, { pesoSin: 12, bonusTipo: 6, penaTipo: -25 }, { pesoSin: 1, bonusTipo: 25, penaTipo: -60 }
  ];
  // Golpes cujo poder depende do item que o Pokémon segura: a referência de simulação é SEM item e o motor lê o poder
  // do dado (Fling 90), então eles ficam fora do kit em vez de prometer dano que não existe.
  // (Aspas simples de propósito: tests/unit/auditoria_do_motor.test.mjs procura o nome entre aspas duplas para saber
  // se o MOTOR trata o efeito, e esta lista não é regra do motor.)
  var GOLPES_QUE_DEPENDEM_DE_ITEM = ['Fling', 'Natural Gift'];
  // Golpes que falham se o atacante leva dano antes de agir (Focus Punch, prioridade -3): o motor lê só o poder e a
  // simulação não os modela, então ficam fora do kit em vez de prometer dano que o alvo impede.
  var GOLPES_QUE_FALHAM_SE_LEVAR_DANO = ['Focus Punch'];
  // A rolagem média do motor é 0,925 (ROLAGEM_MEDIA_DUELO); a faixa do jogo vai de 85% a 100%.
  var FAIXA_DE_ROLAGEM_PIPELINE = { media: 0.925, min: 0.85, max: 1 };

  function pipelineEspecie(x) {
    if (!x) return null;
    if (typeof x === "string") return getSpeciesBySname(x);
    return x && x.sname ? x : null;
  }

  // ---- alvo ----
  // Devolve { info, foes, clima, nivel } ou { info: null, foes: [] } (com o motivo em `aviso`).
  // `foes` são os Pokémon medidos: o que foi pedido, ou o primeiro e o ás (o último) do chefão.
  function pipelineResolverAlvo(alvo) {
    var nivel = getCurrentCap() || 100;
    var saida = { info: null, foes: [], clima: null, nivel: nivel, aviso: null };
    if (alvo && alvo.foe) {
      saida.foes = [alvo.foe];
      saida.clima = alvo.foe.clima || null;
      saida.info = { chefao: null, indice: null, pokemon: [alvo.foe.nome], origem: "informado" };
      return saida;
    }
    var boss = null, indice = null, origem = "informado";
    if (alvo && alvo.chefao) {
      boss = typeof alvo.chefao === "string" ? BOSSES.filter(function (b) { return b.name === alvo.chefao; })[0] : alvo.chefao;
      indice = typeof alvo.indice === "number" ? alvo.indice : null;
      if (!boss) { saida.invalido = true; saida.aviso = "chefão não encontrado: " + (typeof alvo.chefao === "string" ? alvo.chefao : "sem nome"); return saida; }
    } else if (!alvo) {
      // Decisão do usuário (14/10): sem alvo, o próximo LÍDER DE GINÁSIO da Etapa (mapa GYM_LEADER_MILESTONE).
      boss = getRemainingBossEntries().filter(function (b) { return b.cat === "Lider de Ginasio"; })[0] || null;
      origem = "proximo-lider";
      if (!boss) { saida.aviso = "sem chefão adiante"; return saida; }
    } else { saida.invalido = true; saida.aviso = "alvo inválido: use { foe } ou { chefao, indice }"; return saida; }
    var party = bossPartyPorDificuldade(boss) || [];
    var clima = climaDoTimeDoChefao(party);
    // Mesma montagem do botão "Montar time contra este chefão": buffs do ginásio e regra de campo.
    var validos = [];
    party.forEach(function (m, i) { var f = foeDeDuelo(m, nivel, clima); if (f) validos.push({ i: i, f: f }); });
    var foes = foesComRegraDeCampo(foesComBuffsDoGinasio(validos.map(function (v) { return v.f; }), buffsAtivosDoChefao(boss.name), boss.db ? 2 : 1), regraDeCampoDoChefao(boss.name));
    var escolhidos;
    if (indice !== null) escolhidos = validos.map(function (v, k) { return { i: v.i, f: foes[k] }; }).filter(function (v) { return v.i === indice; });
    else {
      var todos = validos.map(function (v, k) { return { i: v.i, f: foes[k] }; });
      escolhidos = todos.length > 1 ? [todos[0], todos[todos.length - 1]] : todos;
    }
    if (!escolhidos.length) { saida.invalido = true; saida.aviso = "o chefão " + boss.name + " não tem esse Pokémon no dado"; return saida; }
    saida.foes = escolhidos.map(function (e) { return e.f; });
    saida.clima = clima;
    saida.info = { chefao: boss.name, indice: indice, pokemon: saida.foes.map(function (f) { return f.nome; }), origem: origem };
    return saida;
  }

  // ---- o que cada golpe faz contra o alvo ----
  // Prioridade condicional (Coil Up no primeiro golpe de mordida, On the Prowl...) e o bloqueio dela (Queenly Majesty, Dazzling,
  // Armor Tail, Psychic Terrain, Surprise!) vêm do motor: temPrioridadeNoCampoDuelo recebe o alvo e o campo (decisão de 14/10/2026, P2).
  // Golpes de prioridade do ALVO que o atacante-referência não bloqueia (ele não tem Queenly Majesty & cia.): { nome, prio, fracEu }.
  // fracEu = parte do HP do atacante que o golpe tira (média da rolagem), pela mesma simulação do duelo com o alvo no papel de atacante.
  // Espelha a leitura de prioridade de duelo.js (danoNoDuelo: prioAqui = g.prio; golpe.prioCheio = +1 no primeiro golpe).
  function pipelineAmeacasDePrioridade(unit, foe, nivel) {
    if (!CONSIDERA_PRIORIDADE_DO_ALVO) return [];
    if (prioBloqueadaPelaHabilidadeDuelo(unit, foe)) return [];
    var lista = [];
    (foe.golpesProntos || []).forEach(function (gp) {
      if (!(gp.prio > 0) && !gp.prioCheio) return;
      var atacando = Object.assign({}, foe, { golpesProntos: [gp] });
      var r = pipelineDuelo(atacando, unit, nivel).r;
      if (!r) return;
      var dano = r.meu.melhor.golpe ? r.meu.melhor.dano : 0;
      // Prioridade EFETIVA, a que o motor calcula (r.meu.melhor.prio): Psychic Terrain (Indeedee, Tapu Lele) e Surprise! (névoa)
      // zeram a do dado (duelo.js, danoNoDuelo: prioAqui). A condicional (prioCheio) só entra em golpe sem prioridade no dado.
      var prio = r.meu.melhor.prio > 0 ? r.meu.melhor.prio : (!(gp.prio > 0) && gp.prioCheio ? 1 : 0);
      if (dano > 0 && prio > 0) {
        // Quantos golpes DESTE golpe de prioridade o alvo precisa para derrubar o atacante (no módulo o atacante tem `item: ""`, então só vale o Sturdy, habilidade que aguenta um golpe; o item não entra na simulação. Caso real: Glalie, Sturdy inato, x Ninetales da Meteor Falls.)
        var k = golpesNecessariosDuelo(r.hpFoe, dano);
        if (k === 1 && aguentaUmGolpe(unit, foe)) k = 2;
        
        lista.push({ nome: gp.nome, prio: prio, fracEu: r.hpFoe > 0 ? dano / r.hpFoe : 0, golpes: k });
      }
    });
    return lista;
  }
  // Quando um lado foge do Intimidate (Tactical Retreat; fogeJa em resultadoNoCampoDuelo) o motor devolve só a nota (0,5, empate), sem
  // { meu, dele }. Aí o módulo mede o dano como se ninguém fugisse (cópias sem a fuga; o motor não muda) e marca `foge`:
  // o candidato sai "estimada" com aviso.
  function pipelineSemFuga(u) { return Object.assign({}, u, { ef: Object.assign({}, u.ef, { fogeAoCair: false }) }); }
  function pipelineDuelo(eu, foe, nivel) {
    var r = resultadoDoDuelo(eu, foe, nivel, { soPar: true }), foge = false;
    if (!r || typeof r !== "object" || !r.meu) {
      foge = true;
      r = resultadoDoDuelo(pipelineSemFuga(eu), pipelineSemFuga(foe), nivel, { soPar: true });
      if (!r || typeof r !== "object" || !r.meu) r = null;
    }
    return { r: r, foge: foge };
  }
  // Uma linha da tabela: o golpe `g` (único golpe da unidade) contra um alvo.
  function pipelineLinhaDoGolpe(u1, g, foe, nivel, ameacas) {
    var duelo = pipelineDuelo(u1, foe, nivel), r = duelo.r;
    if (!r) return { nome: g.nome, dano: 0, hp: foe.stats[0], frac: 0, n: Infinity, extra: 0, primeiro: false, porQue: null, velEu: 0, velFoe: 0, sash: false, alvoPrio: null, foe: foe.nome, foeSname: foe.sp ? foe.sp.sname : "", foge: true };
    var melhor = r.meu.melhor, golpe = melhor.golpe, dano = golpe ? melhor.dano : 0, hp = r.hpFoe;
    // Multiscale, Brain Mass, Shadow Shield (ticket calibracao-05): o 1º golpe contra o alvo com HP cheio sai pela metade, os outros inteiros
    // (o Mold Breaker do atacante atravessa). Antes era x0,75 em todo golpe.
    var primeiroMult = foe.ef.golpeCheio < 1 && !u1.ef.quebraHabilidade ? foe.ef.golpeCheio : 1;
    var n = dano > 0 ? golpesNecessariosComPrimeiroDuelo(hp, dano, primeiroMult) : Infinity;
    var base = n, sash = false;
    if (n === 1 && aguentaUmGolpe(foe, u1)) { n = 2; sash = true; } // Focus Sash/Sturdy: o primeiro golpe não derruba
    if (n !== Infinity) n += bloqueiosNoDuelo(foe, u1, r.meu); // Disguise, Ice Face...
    var prioReal = !!golpe && melhor.prio > 0;
    // Prioridade condicional (Coil Up, Gale Wings...): reusa o motor (temPrioridadeNoCampoDuelo monta o campo do confronto;
    // o Psychic Terrain precisa dele fora de resultadoDoDuelo), só para o golpe que derruba de uma vez. Queenly Majesty, Armor Tail,
    // Surprise! e Psychic Terrain barram a condicional como barram a prioridade de base.
    var prioCondicional = !!golpe && !prioReal && n === 1 && temPrioridadeNoCampoDuelo(u1, foe, r.meu, 1, foe);
    // "Bate primeiro" (decisão do usuário, 14/10): golpe de prioridade que o alvo não bloqueia OU mais Velocidade que
    // o alvo. Golpe de prioridade NEGATIVA (Focus Punch -3...) age por último: nunca "bate primeiro por velocidade".
    var usaPrio = prioReal || prioCondicional;
    var prioNegativa = !!golpe && golpe.prio < 0;
    var primeiro = usaPrio || (!prioNegativa && r.v1 > r.v2);
    var porQue = usaPrio ? "prioridade" : (primeiro ? "velocidade" : null);
    var minha = usaPrio ? (prioReal ? melhor.prio : 1) : 0;
    // Decisão do usuário (P1, 14/10): "bate primeiro" = dá o KO primeiro na ORDEM REAL de turnos. O melhor golpe de prioridade do alvo
    // que DERRUBA o atacante dentro dos n golpes que ele precisa (a.golpes <= n) entra: o atacante só bate primeiro com prioridade maior; com prioridades iguais decide a
    // Velocidade; com a do alvo maior o alvo age antes. Golpe de prioridade do alvo que não derruba não muda quem dá o KO.
    var ameacas1 = ameacas || []; // vazia quando CONSIDERA_PRIORIDADE_DO_ALVO é false (pipelineAmeacasDePrioridade)
    // "Derruba" = em até `n` golpes (os que o atacante precisa): o alvo age primeiro a cada turno, então com k <= n ele derruba antes do último golpe do atacante.
    var prioDoKo = ameacas1.filter(function (a) { return n !== Infinity && a.golpes <= n; }).reduce(function (m, a) { return Math.max(m, a.prio); }, 0);
    if (prioDoKo > 0) {
      if (minha > prioDoKo) { primeiro = true; porQue = "prioridade"; }
      else if (minha === prioDoKo && !prioNegativa && r.v1 > r.v2) { primeiro = true; porQue = "velocidade"; }
      else { primeiro = false; porQue = null; }
    }
    // O aviso e o rótulo olham todo golpe de prioridade do alvo que o atacante não supera (derrube ou não).
    var alvoPrio = ameacas1.filter(function (a) { return a.prio > minha; }).sort(function (a, b) { return b.fracEu - a.fracEu || (a.nome < b.nome ? -1 : 1); })[0] || null;
    return { nome: g.nome, dano: dano, hp: hp, frac: hp > 0 ? dano / hp : 0, primeiroMult: primeiroMult, n: n, extra: n === Infinity ? 0 : n - base, primeiro: primeiro, porQue: porQue,
      velEu: r.v1, velFoe: r.v2, sash: sash, alvoPrio: alvoPrio, foe: foe.nome, foeSname: foe.sp ? foe.sp.sname : "", foge: duelo.foge };
  }
  function pipelineTierDaLinha(l) {
    if (l.n === 1 && l.primeiro) return 3;
    if (l.n === 2 && l.primeiro) return 2;
    return 1;
  }
  function pipelineChaveDaLinha(l) { return pipelineTierDaLinha(l) * 1000 + Math.min(l.frac, 1.3) * 100; }

  // ---- sinergias ativas ----
  // Entram só as que valem nesta build (a regra de validateAiBuild): inata sempre; habilidade escolhível só a escolhida.
  // Peso: a que o motor sabe explicar (motivos) vale mais que a marcação solta do dado.
  function pipelineSinergiasAtivas(sp, hab) {
    return sinergiasDaEspecie(sp).filter(function (h) { return h.kind === "inn" || h.name === hab; }).map(function (h) {
      return { nome: h.name, kind: h.kind, motivos: h.motivos || [], golpes: h.golpes || [], peso: (h.motivos && h.motivos.length) ? 5 : 2 };
    });
  }
  function pipelinePesoDoGolpe(sinergias, golpe, jaTocadas) {
    return sinergias.reduce(function (s, h) { return h.golpes.indexOf(golpe) !== -1 && !(jaTocadas && jaTocadas[h.nome]) ? s + h.peso : s; }, 0);
  }
  function pipelinePesoDoConjunto(sinergias, golpes) {
    return sinergias.reduce(function (s, h) { return h.golpes.some(function (g) { return golpes.indexOf(g) !== -1; }) ? s + h.peso : s; }, 0);
  }

  // ---- tabela e conjuntos ----
  // Para cada golpe do kit, uma linha por alvo medido (ou o valor relativo, sem alvo).
  function pipelineTabela(sp, hab, nat, kit, alvo) {
    var unit = unidadeDaBuild(sp, { ability: hab, nature: nat.nome, evs: nat.evs, item: "", moves: kit }, alvo.nivel, alvo.clima);
    var tabela = {}, tipos = unit.tipos || [], maiorProxy = 0;
    var ameacas = alvo.foes.map(function (foe) { return pipelineAmeacasDePrioridade(unit, foe, alvo.nivel); });
    (unit.golpesProntos || []).forEach(function (g) {
      if (tabela[g.nome]) return;
      var u1 = Object.assign({}, unit, { golpesProntos: [g] });
      var entrada = { g: g, tipo: g.tipo, linhas: [], proxy: 0 };
      if (alvo.foes.length) entrada.linhas = alvo.foes.map(function (foe, i) { return pipelineLinhaDoGolpe(u1, g, foe, alvo.nivel, ameacas[i]); });
      else {
        // Sem alvo: só ordena os golpes pelo que o kit rende (força com habilidade, STAB, precisão, atributo de ataque).
        entrada.proxy = g.forca * (tipos.indexOf(g.tipo) !== -1 ? 1.5 : 1) * g.precisao * (g.cat === "F" ? unit.stats[1] : unit.stats[3]);
        maiorProxy = Math.max(maiorProxy, entrada.proxy);
      }
      tabela[g.nome] = entrada;
    });
    Object.keys(tabela).forEach(function (nome) {
      var e = tabela[nome];
      if (!alvo.foes.length) { e.relativo = maiorProxy > 0 ? e.proxy / maiorProxy : 0; }
      e.fracMin = alvo.foes.length ? Math.min.apply(null, e.linhas.map(function (l) { return l.frac; })) : e.relativo;
      e.fracMax = alvo.foes.length ? Math.max.apply(null, e.linhas.map(function (l) { return l.frac; })) : e.relativo; // bate em pelo menos um alvo
      e.tierMin = alvo.foes.length ? Math.min.apply(null, e.linhas.map(pipelineTierDaLinha)) : 1;
    });
    return tabela;
  }
  function pipelineValorDoGolpe(e, sinergias, jaTocadas) {
    return e.tierMin * 1000 + Math.min(e.fracMin, 1.3) * 100 + 1.5 * pipelinePesoDoGolpe(sinergias, e.g.nome, jaTocadas);
  }

  // Avalia um conjunto de golpes contra o alvo: por alvo vale o melhor golpe do conjunto; o conjunto vale o pior alvo.
  function pipelineAvaliarConjunto(tabela, golpes, sinergias, alvo) {
    var res = { garantido: false, alvoPrio: null, golpes: golpes.slice(), hitKill: 0, baterPrimeiro: false, porQue: null, fracMin: 0, fracMax: 0, linhas: [], tier: 1, pior: null };
    if (alvo.foes.length) {
      var linhas = alvo.foes.map(function (foe, i) {
        var melhor = null;
        golpes.forEach(function (nome) {
          var e = tabela[nome];
          if (!e || !e.linhas[i]) return;
          if (!melhor || pipelineChaveDaLinha(e.linhas[i]) > pipelineChaveDaLinha(melhor)) melhor = e.linhas[i];
        });
        return melhor;
      });
      if (linhas.some(function (l) { return !l; })) return null;
      var piorFrac = linhas[0];
      linhas.forEach(function (l) { if (l.frac < piorFrac.frac) piorFrac = l; });
      var piorN = Math.max.apply(null, linhas.map(function (l) { return l.n; }));
      res.hitKill = piorN === 1 ? 1 : piorN === 2 ? 2 : 0;
      res.baterPrimeiro = linhas.every(function (l) { return l.primeiro; });
      res.porQue = res.baterPrimeiro ? (linhas.some(function (l) { return l.porQue === "prioridade"; }) ? "prioridade" : "velocidade") : null;
      res.fracMin = piorFrac.frac / FAIXA_DE_ROLAGEM_PIPELINE.media * FAIXA_DE_ROLAGEM_PIPELINE.min;
      res.fracMax = piorFrac.frac / FAIXA_DE_ROLAGEM_PIPELINE.media * FAIXA_DE_ROLAGEM_PIPELINE.max;
      res.linhas = linhas;
      res.pior = piorFrac;
      res.tier = res.hitKill === 1 && res.baterPrimeiro ? 3 : res.hitKill === 2 && res.baterPrimeiro ? 2 : 1;
      res.fracMedia = piorFrac.frac;
      // Garantido = mesmo na rolagem mínima (85%) o alvo cai no número de golpes anunciado. O ranking segue pela média.
      res.garantido = res.hitKill > 0 && linhas.every(function (l) {
        var minimo = l.frac / FAIXA_DE_ROLAGEM_PIPELINE.media * FAIXA_DE_ROLAGEM_PIPELINE.min;
        return minimo > 0 && golpesNecessariosComPrimeiroDuelo(1 - 1e-9, minimo, l.primeiroMult || 1) + l.extra <= res.hitKill;
      });
      res.alvoPrio = linhas.filter(function (l) { return l.alvoPrio; }).sort(function (a, b) { return b.alvoPrio.fracEu - a.alvoPrio.fracEu; })[0] || null;
    } else {
      res.fracMedia = Math.max.apply(null, golpes.map(function (nome) { return tabela[nome] ? tabela[nome].relativo : 0; }));
    }
    var outros = golpes.map(function (nome) { return tabela[nome] ? Math.min(tabela[nome].fracMin, 1.3) * 100 : 0; });
    var somaOutros = outros.reduce(function (a, b) { return a + b; }, 0) - Math.max.apply(null, outros);
    res.pesoSin = pipelinePesoDoConjunto(sinergias, golpes);
    res.score = res.tier * 1000 + Math.min(res.fracMedia, 1.3) * 100 + 1.5 * res.pesoSin + 0.1 * somaOutros;
    return res;
  }

  // Monta um conjunto de 4 a partir de um golpe-âncora: o resto entra por dano, sinergia nova e tipo diferente.
  function pipelineMontarConjunto(ancora, tabela, sinergias, modo, movepool, tiposStab) {
    var escolhidos = [ancora];
    var tocadas = {};
    function marcar(nome) { sinergias.forEach(function (h) { if (h.golpes.indexOf(nome) !== -1) tocadas[h.nome] = true; }); }
    marcar(ancora);
    var nomes = Object.keys(tabela).sort();
    while (escolhidos.length < 4) {
      var melhor = null;
      nomes.forEach(function (nome) {
        if (escolhidos.indexOf(nome) !== -1 || tabela[nome].fracMin <= 0) return;
        var tiposUsados = escolhidos.map(function (n) { return tabela[n].tipo; });
        var v = Math.min(tabela[nome].fracMin, 1.3) * 100 + modo.pesoSin * pipelinePesoDoGolpe(sinergias, nome, tocadas) + (tiposUsados.indexOf(tabela[nome].tipo) === -1 ? modo.bonusTipo : modo.penaTipo);
        if (!melhor || v > melhor.v + 1e-9) melhor = { nome: nome, v: v };
      });
      if (!melhor) break;
      escolhidos.push(melhor.nome); marcar(melhor.nome);
    }
    // A regra do especialista (validateAiBuild): pelo menos um golpe com sinergia ativa, se a espécie tem alguma.
    if (sinergias.length && pipelinePesoDoConjunto(sinergias, escolhidos) === 0) {
      var comSin = nomes.filter(function (n) { return escolhidos.indexOf(n) === -1 && pipelinePesoDoGolpe(sinergias, n) > 0 && tabela[n].fracMax > 0; })
        .sort(function (a, b) { return pipelineValorDoGolpe(tabela[b], sinergias) - pipelineValorDoGolpe(tabela[a], sinergias) || (a < b ? -1 : 1); })[0];
      // Sem golpe de dano com sinergia que bata no alvo: a sinergia pode estar num golpe de status do movepool (Pinsir Mega:
      // Aerodynamics + Tailwind), que a regra do especialista também aceita.
      if (!comSin) {
        var deStatus = [];
        sinergias.forEach(function (h) { h.golpes.forEach(function (n) { if (movepool.indexOf(n) !== -1 && escolhidos.indexOf(n) === -1 && moveRoleOf(n) !== "dupla" && deStatus.indexOf(n) === -1) deStatus.push(n); }); });
        comSin = deStatus.sort()[0];
      }
      if (comSin) escolhidos[escolhidos.length < 4 ? escolhidos.length : 3] = comSin;
    }
    // A regra do STAB (validateAiBuild): atacante com 2+ golpes de dano precisa de um golpe do próprio tipo (ou do que a
    // habilidade dá). Troca o último golpe que não é a âncora nem a única sinergia do conjunto.
    var temStab = function (lista) { return lista.some(function (n) { return tabela[n] && tiposStab.indexOf(tabela[n].tipo) !== -1; }); };
    if (escolhidos.length >= 2 && !temStab(escolhidos)) {
      var comStab = nomes.filter(function (n) { return escolhidos.indexOf(n) === -1 && tiposStab.indexOf(tabela[n].tipo) !== -1; })
        .sort(function (a, b) { return tabela[b].fracMin - tabela[a].fracMin || (a < b ? -1 : 1); })[0];
      if (comStab) {
        for (var k = escolhidos.length - 1; k >= 1; k--) {
          var teste = escolhidos.slice(); teste[k] = comStab;
          if (!sinergias.length || pipelinePesoDoConjunto(sinergias, teste) > 0) { escolhidos = teste; break; }
        }
      }
    }
    // Faltou golpe de dano: completa com o resto do movepool liberado (sempre 4 golpes diferentes).
    if (escolhidos.length < 4) {
      var resto = movepool.filter(function (n) { return escolhidos.indexOf(n) === -1 && moveRoleOf(n) !== "dupla"; })
        .sort(function (a, b) { return (moveRoleOf(a) === "dano" ? 0 : 1) - (moveRoleOf(b) === "dano" ? 0 : 1) || (a < b ? -1 : 1); });
      while (escolhidos.length < 4 && resto.length) escolhidos.push(resto.shift());
    }
    return escolhidos.length === 4 ? escolhidos : null;
  }

  // O caso (atacante + habilidade + golpe + alvo) está na lista conferida na calculadora do jogo?
  function pipelineCasoConferido(sname, habilidade, linha) {
    return CASOS_CALIBRADOS.some(function (c) { return !linha.foge && c.atacante === sname && c.habilidade === habilidade && c.golpe === linha.nome && c.alvo === linha.foeSname; });
  }
  function pipelineTierDoCandidato(c) { return c.hitKill === 1 && c.baterPrimeiro ? 3 : c.hitKill === 2 && c.baterPrimeiro ? 2 : 1; }

  // ---- frases ----
  function pipelineVelocidade(l) {
    if (!isFinite(l.velEu) || !isFinite(l.velFoe)) return "";
    // Trick Room: o motor inverte o sinal das duas Velocidades (quem tem MENOS age primeiro).
    var sala = l.velEu < 0 && l.velFoe < 0 ? "Trick Room, o mais lento age primeiro: " : "";
    return " (" + sala + Math.round(Math.abs(l.velEu)) + " de Velocidade contra " + Math.round(Math.abs(l.velFoe)) + ")";
  }
  function pipelineMotivos(av, sinergias, habilidade, calibrada, alvo) {
    var garante = calibrada && av.garantido; // só caso conferido E mínimo da rolagem já derruba
    var motivos = [];
    sinergias.forEach(function (h) {
      var nossos = h.golpes.filter(function (g) { return av.golpes.indexOf(g) !== -1; });
      if (!nossos.length) return;
      var tipo = h.kind === "inn" ? "inata" : "habilidade escolhida";
      motivos.push(h.nome + " (" + tipo + ")" + (h.motivos.length ? ": " + h.motivos.join(" e ") : " reforça") + " em " + nossos.join(", "));
    });
    if (!alvo.foes.length) return motivos;
    var medidos = alvo.foes.length > 1 ? " Medido contra o primeiro (" + alvo.foes[0].nome + ") e o ás (" + alvo.foes[alvo.foes.length - 1].nome + "); vale o pior." : "";
    var p = av.pior;
    var cheio = p.primeiroMult < 1 ? " O 1º golpe contra o " + p.foe + " vale metade (HP cheio: Multiscale e parecidas)." : "";
    if (av.hitKill === 0) {
      motivos.push("Não derruba o " + p.foe + " nem em 2 golpes: o melhor golpe (" + p.nome + ") tira " + Math.round(av.fracMin * 100) + "% a " + Math.round(av.fracMax * 100) + "% do HP dele." + cheio + medidos);
      return motivos;
    }
    var como = av.baterPrimeiro ? (av.porQue === "prioridade" ? "bate primeiro por prioridade" : "bate primeiro por velocidade" + pipelineVelocidade(av.linhas.filter(function (l) { return l.porQue === "velocidade"; })[0] || p)) : (av.alvoPrio ? "o alvo age antes (" + av.alvoPrio.alvoPrio.nome + ", +" + av.alvoPrio.alvoPrio.prio + " de prioridade)" : "o alvo age antes");
    var golpesDoKill = av.linhas.map(function (l) { return l.nome; }).filter(function (n, i, a) { return a.indexOf(n) === i; }).join(" e ");
    var faixa = " Tira " + Math.round(av.fracMin * 100) + "% a " + Math.round(av.fracMax * 100) + "% do HP dele por golpe." + cheio;
    if (av.hitKill === 1) motivos.push(garante ? golpesDoKill + " derruba no turno 1 o " + p.foe + "; " + como + "." + medidos
      : "Provável derrubar o " + p.foe + " em 1 golpe (" + golpesDoKill + "); " + como + "." + faixa + medidos);
    else motivos.push((garante ? "Derruba" : "Provável derrubar") + " o " + p.foe + " em 2 golpes (" + golpesDoKill + "); " + como + "." + (garante ? cheio : faixa) + medidos);
    return motivos;
  }

  // Tipos que dão STAB além dos do próprio Pokémon (Protean, Aerilate...): o mesmo cálculo de validateAiBuild.
  function pipelineTiposExtraDeStab(sp, hab) {
    var ef = efeitoDasHabilidadesNoDuelo(uniqueIds((sp.inn || []).concat([ABILITY_ID_BY_NAME[hab]])), sp.sname, null);
    var extra = (ef.stabExtra || []).concat(ef.tipoExtra || []);
    Object.keys(ef.converte || {}).forEach(function (t) { extra.push(t); });
    return extra;
  }
  // Rascunho de build que a IA vai fechar: sem item (a referência da simulação). Habilidade que só funciona gastando o
  // item (Gluttony, Ripen...) é recusada sem item, então o rascunho leva uma Berry - e o candidato avisa.
  var ITEM_DE_RASCUNHO_PIPELINE = "Sitrus Berry";
  // Mega no modo de mega temporária só existe segurando a pedra (megaStoneRuleFor): sem item a validação recusa, então o rascunho
  // leva a pedra (a primeira, quando há duas) e o candidato avisa.
  function pipelineValidarRascunho(sp, g) {
    var bruto = { ability: g.hab, nature: g.nat.nome, item: "", evs: g.nat.evs.slice(), moves: g.av.golpes.slice() };
    var recusa = {}, v = validateAiBuild(sp, bruto, recusa, {});
    if (v) return { v: v, itemDeRascunho: null };
    var item = null, tipo = null, regra = megaStoneRuleFor(sp);
    if (/só funciona gastando o item/.test(recusa.txt || "") && ITEMS.indexOf(ITEM_DE_RASCUNHO_PIPELINE) !== -1) { item = ITEM_DE_RASCUNHO_PIPELINE; tipo = "gasta"; }
    else if (/precisa segurar a pedra/.test(recusa.txt || "") && regra && regra.stones.length) { item = regra.stones[0]; tipo = "pedra"; }
    if (!item) return { v: null, motivo: recusa.txt };
    bruto.item = item;
    var recusa2 = {};
    v = validateAiBuild(sp, bruto, recusa2, {});
    if (!v) return { v: null, motivo: recusa2.txt };
    return { v: v, itemDeRascunho: v.item === item ? item : null, tipoDoItem: tipo, pedras: regra ? regra.stones.slice() : [] };
  }

  // ---- 1. do Pokémon para a build (caso A) ----
  // Devolve { alvo, candidatos, aviso, avisos }. `aviso` é o aviso principal (ou null); `avisos` traz todos.
  function candidatosDeBuild(sp, opts) {
    var alvo = pipelineResolverAlvo(opts && opts.alvo);
    return pipelineCandidatos(sp, alvo);
  }
  function pipelineCandidatos(spEntrada, alvo) {
    var saida = { alvo: alvo.info, candidatos: [], aviso: alvo.aviso || null, avisos: [] };
    if (alvo.aviso) saida.avisos.push(alvo.aviso);
    if (alvo.invalido) return saida; // pediram um alvo que não existe: nada de candidatos às cegas
    if (alvo.info) saida.avisos.push(AVISO_SIMULACAO_1X1);
    var sp = pipelineEspecie(spEntrada);
    if (!sp) { saida.aviso = saida.aviso || "espécie não encontrada"; saida.avisos.push("espécie não encontrada"); return saida; }
    try {
      var cap = getCurrentCap();
      var liberados = availableMovesFor(sp).names;
      var kit = golpesDeDueloAte(sp, cap).map(function (id) { return MOVES[id][0]; })
        .filter(function (n, i, a) { return a.indexOf(n) === i && liberados.indexOf(n) !== -1 && moveRoleOf(n) !== "dupla" && GOLPES_QUE_DEPENDEM_DE_ITEM.indexOf(n) === -1 && GOLPES_QUE_FALHAM_SE_LEVAR_DANO.indexOf(n) === -1; });
      if (!kit.length) { saida.aviso = saida.aviso || sp.n + " não tem golpe de dano liberado nesta Etapa"; saida.avisos.push(sp.n + " não tem golpe de dano liberado nesta Etapa"); return saida; }
      var habilidades = uniqueIds(sp.ab || []).map(nomeHabDuelo).filter(Boolean);
      var geradas = {};
      habilidades.forEach(function (hab) {
        var sinergias = pipelineSinergiasAtivas(sp, hab);
        NATUREZAS_DO_PIPELINE.forEach(function (nat) {
          var tabela = pipelineTabela(sp, hab, nat, kit, alvo);
          var tiposStab = speciesTypeNames(sp).concat(pipelineTiposExtraDeStab(sp, hab));
          var nomes = Object.keys(tabela).sort();
          // Âncoras: os golpes de maior valor e os de maior sinergia (a pergunta do caso A: Fire Fang, não Fire Lash).
          var porValor = nomes.filter(function (n) { return tabela[n].fracMin > 0; }).sort(function (a, b) { return pipelineValorDoGolpe(tabela[b], sinergias) - pipelineValorDoGolpe(tabela[a], sinergias) || (a < b ? -1 : 1); });
          var porSin = nomes.filter(function (n) { return pipelinePesoDoGolpe(sinergias, n) > 0 && tabela[n].fracMax > 0; })
            .sort(function (a, b) { return pipelineValorDoGolpe(tabela[b], sinergias) - pipelineValorDoGolpe(tabela[a], sinergias) || (a < b ? -1 : 1); }).slice(0, 3);
          var ancoras = porValor.slice(0, 8).concat(porSin).filter(function (n, i, a) { return a.indexOf(n) === i; });
          ancoras.forEach(function (ancora) {
            MODOS_DE_PREENCHER_PIPELINE.forEach(function (modo) {
            var conjunto = pipelineMontarConjunto(ancora, tabela, sinergias, modo, liberados, tiposStab);
            if (!conjunto) return;
            var chave = conjunto.slice().sort().join(","); // sem conjunto de golpes repetido (fica a melhor habilidade/natureza)
            var av = pipelineAvaliarConjunto(tabela, conjunto, sinergias, alvo);
            if (!av) return;
            (geradas[chave] = geradas[chave] || []).push({ hab: hab, nat: nat, av: av, sinergias: sinergias, chave: chave });
            });
          });
        });
      });
      // Por conjunto de golpes vale a melhor variante (habilidade + natureza) que passa na validação; a ordem é a do score.
      var ordenadas = Object.keys(geradas).map(function (k) {
        return geradas[k].slice().sort(function (a, b) { return b.av.score - a.av.score || (a.hab + a.nat.nome < b.hab + b.nat.nome ? -1 : 1); });
      }).sort(function (a, b) { return b[0].av.score - a[0].av.score || (a[0].chave < b[0].chave ? -1 : a[0].chave > b[0].chave ? 1 : 0); });
      var validos = [], motivosDescartados = [];
      ordenadas.forEach(function (variantes) {
        for (var vi = 0; vi < variantes.length; vi++) {
          var g = variantes[vi];
          var r = pipelineValidarRascunho(sp, g);
          if (r.v) { validos.push({ g: g, v: r.v, itemDeRascunho: r.itemDeRascunho, tipoDoItem: r.tipoDoItem, pedras: r.pedras }); return; }
          if (r.motivo && motivosDescartados.indexOf(r.motivo) === -1) motivosDescartados.push(r.motivo);
        }
      });
      // Diversidade: o candidato novo precisa diferir de cada um já aceito em pelo menos 2 golpes;
      // se sobrar menos que o mínimo, completa com os melhores restantes.
      var aceitos = [], sobras = [];
      validos.forEach(function (c) {
        var parecido = aceitos.some(function (a) {
          return a.g.av.golpes.filter(function (n) { return c.g.av.golpes.indexOf(n) !== -1; }).length >= 3;
        });
        (parecido ? sobras : aceitos).push(c);
      });
      while (aceitos.length < MIN_CANDIDATOS_PIPELINE && sobras.length) aceitos.push(sobras.shift());
      aceitos = aceitos.sort(function (a, b) { return validos.indexOf(a) - validos.indexOf(b); }).slice(0, MAX_CANDIDATOS_PIPELINE); // volta à ordem do ranking
      var innNomes = innatesAtivasNoNivel(sp, alvo.nivel).map(nomeHabDuelo);
      aceitos.forEach(function (c) {
        var av = c.g.av;
        var calibrada = av.hitKill > 0 && av.linhas.length > 0 && !av.alvoPrio && av.linhas.every(function (l) { return pipelineCasoConferido(sp.sname, c.g.hab, l); });
        var avisos = [];
        if (c.itemDeRascunho && c.tipoDoItem === "pedra") avisos.push("No modo de mega temporária " + sp.n + " precisa segurar a pedra: o rascunho leva " + c.itemDeRascunho + (c.pedras.length > 1 ? " (a IA escolhe entre " + c.pedras.join(" e ") + ")" : "") + "; a simulação não conta o item.");
        else if (c.itemDeRascunho) avisos.push("A habilidade escolhida só funciona gastando o item: o rascunho leva " + c.itemDeRascunho + " (a IA pode trocar); a simulação não conta o item.");
        if (av.linhas.some(function (l) { return l.foge; })) avisos.push("Um dos lados foge no Intimidate (Tactical Retreat): o motor trata a luta como empate; o dano aqui é o de quem ficasse em campo, só uma estimativa.");
        if (av.hitKill > 0 && !calibrada) avisos.push("Número do motor, ainda não conferido na calculadora do jogo: trate como estimativa.");
        if (av.alvoPrio) {
          var ap = av.alvoPrio.alvoPrio;
          avisos.push("O alvo age antes com " + ap.nome + " (+" + ap.prio + " de prioridade) e " + (ap.fracEu >= 1 ? "derruba " + sp.n + " antes de ele agir" : "tira " + Math.round(ap.fracEu * 100) + "% do HP de " + sp.n) + ".");
        }
        if (av.linhas.some(function (l) { return l.sash; })) avisos.push("O alvo aguenta o primeiro golpe (Focus Sash ou Sturdy): o hit-kill de 1 golpe virou 2.");
        saida.candidatos.push({
          sname: sp.sname,
          golpes: c.v.moves.slice(), habilidade: c.v.ability, inatas: innNomes.slice(),
          motivos: pipelineMotivos(av, c.g.sinergias, c.g.hab, calibrada, alvo),
          hitKill: av.hitKill, garantido: !!av.garantido, baterPrimeiro: !!av.baterPrimeiro, porQue: av.porQue, alvoAgeAntes: !!av.alvoPrio,
          dano: { min: Math.round(av.fracMin * 1000) / 10, max: Math.round(av.fracMax * 1000) / 10 },
          rotulo: calibrada ? "calibrada" : "estimada", avisos: avisos,
          build: { ability: c.v.ability, moves: c.v.moves.slice(), item: c.v.item, nature: c.v.nature, evs: c.v.evs.slice() }
        });
      });
      if (!saida.candidatos.length) { var semBuild = "nenhuma build válida para " + sp.n + " nesta Etapa" + (motivosDescartados.length ? " (" + motivosDescartados[0] + ")" : ""); saida.aviso = saida.aviso || semBuild; saida.avisos.push(semBuild); motivosDescartados.slice(1, 4).forEach(function (m) { saida.avisos.push("descartada: " + m); }); }
    } catch (e) {
      // Falta de dado nunca derruba a tela: devolve vazio com o motivo.
      saida.candidatos = [];
      saida.aviso = "não consegui montar os candidatos de " + sp.n + ": " + (e && e.message ? e.message : e);
      saida.avisos.push(saida.aviso);
    }
    return saida;
  }

  // ---- 2. do alvo para os Pokémon (caso B) ----
  // Quem do jogador resolve o alvo (hitKill > 0), do melhor para o pior: 1 golpe antes de 2, quem bate primeiro antes,
  // mais dano antes. Padrão: time e caixa (as mesmas formas de batalha do botão do chefão); opts.especies troca a lista.
  function especiesQueResolvem(alvoPedido, opts) {
    opts = opts || {};
    var alvo = pipelineResolverAlvo(alvoPedido);
    if (!alvo.foes.length) return [];
    var lista = [];
    if (opts.especies && opts.especies.length) lista = opts.especies.map(pipelineEspecie).filter(Boolean);
    else {
      state.team.concat(state.box).filter(function (x, i, a) { return a.indexOf(x) === i; }).forEach(function (x) {
        var dona = getSpeciesByX(x);
        if (!dona) return;
        battleUnitsOf(dona).forEach(function (u) { if (serveProMono(u.main)) lista.push(u.main); });
      });
    }
    var vistos = {};
    lista = lista.filter(function (s) { if (vistos[s.sname]) return false; vistos[s.sname] = true; return true; });
    var achados = [];
    lista.forEach(function (s) {
      var r = pipelineCandidatos(s, alvo);
      var melhor = r.candidatos.filter(function (c) { return c.hitKill > 0; })[0];
      if (melhor) achados.push({ sp: s, candidato: melhor });
    });
    achados.sort(function (a, b) {
      // Os 3 níveis do usuário: 1 golpe e bate primeiro > 2 golpes e bate primeiro > o resto; dentro do nível, mais dano antes.
      return pipelineTierDoCandidato(b.candidato) - pipelineTierDoCandidato(a.candidato) || a.candidato.hitKill - b.candidato.hitKill ||
        b.candidato.dano.max - a.candidato.dano.max || (a.sp.sname < b.sp.sname ? -1 : a.sp.sname > b.sp.sname ? 1 : 0);
    });
    var max = typeof opts.max === "number" && opts.max > 0 ? opts.max : 10;
    return achados.slice(0, max);
  }

  // ---- 3. fechar a build (a IA escolhe EVs, item e natureza) ----
  // `escolha` = { evs, item, natureza }. Monta a build com os golpes e a habilidade do candidato e passa pela
  // validação de sempre. Nunca lança: dado ruim vira { ok: false, erros }.
  function fecharBuild(candidato, escolha) {
    var erros = [];
    try {
      var sp = candidato && candidato.sname ? getSpeciesBySname(candidato.sname) : null;
      if (!sp || !candidato.build || !Array.isArray(candidato.build.moves)) return { ok: false, build: null, erros: ["candidato inválido: faltam a espécie, os golpes ou a habilidade"] };
      escolha = escolha || {};
      var evs = escolha.evs;
      if (!Array.isArray(evs) || evs.length !== 6 || evs.some(function (v) { return typeof v !== "number" || v % 1 !== 0 || v < 0 || v > 252; })) {
        erros.push("Os EVs precisam ser 6 números inteiros de 0 a 252 (HP, Atk, Def, SpA, SpD, Spe).");
      } else if (evs.reduce(function (a, b) { return a + b; }, 0) > 510) erros.push("A soma dos EVs passa de 510.");
      var item = escolha.item === undefined || escolha.item === null ? "" : escolha.item;
      if (typeof item !== "string") erros.push("O item precisa ser um texto (vazio = sem item).");
      if (typeof escolha.natureza !== "string" || ALL_NATURES.indexOf(escolha.natureza) === -1) erros.push("A natureza \"" + String(escolha.natureza).slice(0, 40) + "\" não existe.");
      if (erros.length) return { ok: false, build: null, erros: erros };
      var bruto = { ability: candidato.habilidade, moves: candidato.build.moves.slice(), nature: escolha.natureza, item: item, evs: evs.slice() };
      var r = validarRespostaDeBuildDaIa(sp, bruto, {});
      if (!r.valor) return { ok: false, build: null, erros: [r.motivo] };
      // Item fora da lista cai para "sem item" na validação; aqui isso é erro (só a pedra da Mega temporária corrige sozinha).
      if (item && r.valor.item !== item && !megaStoneRuleFor(sp)) return { ok: false, build: null, erros: ["O item \"" + item + "\" não é permitido para " + sp.n + " nesta build."] };
      return { ok: true, build: r.valor, erros: [] };
    } catch (e) {
      return { ok: false, build: null, erros: ["não consegui fechar a build: " + (e && e.message ? e.message : e)] };
    }
  }
