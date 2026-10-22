  // ===== src/regras/time_pelo_motor.js =====
  // Modo Motor do Meu Time (ticket time-pelo-motor/01, Fase C, 21/10/2026): monta o time SEM IA, só pelo simulador.
  // Função pura de regra (ADR-004: nada de página, nada de tela): montarTimePeloMotor(ctx, pedido).
  //
  // O que decide (usuário, 20 e 21/10):
  //  - build de cada candidato = top-1 do pipeline contra o CAMPO (alvo { campo: true }); favorito com build salva usa a salva;
  //  - juiz = a luta completa (mesma montagem de avaliarTimePelaLutaCompleta, duelo.js); o `pontos` não muda;
  //  - filtros ANTES da busca: Pokémon do jogador (time + caixa), mono, trava de Mega (battleUnitsOf), golpes liberados pelo cap
  //    (dentro do pipeline) e item liberado na Etapa (liberadoNaRun) - item não liberado o Modo Motor nunca usa;
  //  - uma espécie por linha evolutiva; favoritos (1 a 6) travados: nunca saem, a vaga deles só escolhe a FORMA (base ou Mega);
  //  - busca gulosa incremental por membro, 2 passadas, sobre uma amostra FIXA de lutas; o time final é conferido nas 29 lutas.
  //
  // Limitação da busca gulosa (documentada, ticket §2.8): troca uma peça por vez com as outras fixas, então a sinergia que só
  // aparece quando DUAS peças entram juntas pode não ser achada. A lista curta de cada vaga sai do desempenho sozinho do candidato
  // (mais os melhores suportes de lado), então quem só vale em dupla com outro pode ficar fora da lista.
  // Limite da Fase C: `ctx.cap` entra na chave do cache e no liberadoNaRun, mas o pipeline (pipelineCandidatos) lê o level cap do
  // state; trocar `ctx.cap` sem trocar o state dá chave de cache nova com build do cap antigo. A Fase F faz o adaptador trocar os dois juntos.
  // Sem `Date` na decisão: só o orçamento de tempo (opcional) olha o relógio; sem orçamento o resultado é reproduzível.
  var MOTOR_VERSAO = 2; // sobe quando uma regra do simulador muda: entra na chave do cache
  var MOTOR_TAMANHO_DO_TIME = 6;
  var MOTOR_POR_VAGA = 4; // candidatos avaliados por vaga (6 x 4 x 2 passadas, ticket §2.8)
  var MOTOR_SUPORTES_POR_VAGA = 2; // além dos 4: os melhores com golpe de lado (tela, Tailwind, Trick Room, Defog)
  var MOTOR_CACHE_MAXIMO = 60000;
  // Amostra fixa de 10 lutas (relatório de preparo, 21/10): a mais pesada de cada etapa + Tate & Liza (Trick Room, dupla, invertida).
  var MOTOR_AMOSTRA_DE_LUTAS = ["Roxanne 1", "Brawly 1", "Wattson 1", "Flannery 1", "Norman 1", "Shelly Weather Institute",
    "Archie Mt Pyre", "Tate And Liza 1", "Archie", "Drake"];
  var MOTOR_AMOSTRA_MINIMA = 3;
  // Todas as lutas (todas-as-lutas/02, 21/10/2026): além dos 29 chefões o juiz pesa as lutas COMUNS mais perigosas de cada etapa
  // (data/lutas_comuns_run.json, pré-calculado pelo rank: ameaça medida, nada de simular as 538 lutas ao vivo), com a MESMA fatia do
  // rank v2 (chefões 60%, comuns 40%; a fatia vem do próprio arquivo). Na busca entram só as MOTOR_COMUNS_NA_AMOSTRA mais perigosas
  // de cada etapa que falta (espaçadas: a primeira, uma do meio e a última etapa que falta); a conferência final simula as
  // MOTOR_COMUNS_NA_CONFERENCIA mais perigosas de cada etapa. Medido: cada luta custa ~11 ms por time simulado, e a busca avalia ~40 times
  // por variante; 1 comum por etapa (7 lutas) e 10 na conferência levaram a montagem de 6,8 s para 15,8 s, acima dos 10 s do ticket.
  var MOTOR_COMUNS_NA_AMOSTRA = 3;
  var MOTOR_COMUNS_NA_CONFERENCIA = 3;
  var MOTOR_FATIA_PADRAO = 0.6;
  // Os objetivos de seleção. Todos leem os MESMOS números da luta completa (venceu, derrubados, total, vivos, pontos); só mudam
  // o que premiam. A régua comum (pontos médios, vitórias, cobertura) é a mesma nas variantes e vem em `metricas`.
  var MOTOR_OBJETIVOS = {
    // Progresso imediato: fração do time do chefão derrubada, média das lutas.
    ofensivo: { nome: "Mais ofensivo", descricao: "premia o progresso medido: quantos Pokémon do chefão caem, em média, em cada luta",
      valor: function (rs) { return motorMedia(rs.map(function (r) { return r.d / r.t; })); } },
    // Pior caso e sobrevivência: a mesma escala do Battle Rating do rank (vitória = 0,5 + metade dos que sobram; derrota = metade do que
    // tirou), meio a meio entre a média e o pior terço das lutas.
    seguro: { nome: "Mais seguro", descricao: "premia vencer com gente viva e segurar o pior caso: a média das lutas e o pior terço delas, pelo Battle Rating",
      valor: function (rs, n) {
        var f = rs.map(function (r) { return r.v ? 0.5 + 0.5 * r.vi / n : 0.5 * r.d / r.t; });
        var piores = f.slice().sort(function (x, y) { return x - y; }).slice(0, Math.max(1, Math.ceil(f.length / 3)));
        return 0.5 * motorMedia(f) + 0.5 * motorMedia(piores);
      } },
    // Sinergia (decisão do usuário, 21/10): "dois membros com benefício medido". Base = Battle Rating médio (a mesma escala do seguro) mais
    // um bônus (MOTOR_PROVA_SINERGIA_PESO) pela condição que um membro arma (clima, Tailwind, Trick Room, tela) e dois outros aproveitam,
    // com o benefício medido por duelo 1x1 (motorGanhoDaCondicao). Um beneficiário vale metade, dois valem o bônus cheio.
    sinergia: { nome: "Sinergia", descricao: "premia dois membros com benefício medido de uma condição que um terceiro arma (clima, Tailwind, Trick Room, tela), sem largar o Battle Rating",
      valor: function (rs, n, time, ctx) {
        var f = rs.map(function (r) { return r.v ? 0.5 + 0.5 * r.vi / n : 0.5 * r.d / r.t; });
        return motorMedia(f) + (time && ctx ? MOTOR_PROVA_SINERGIA_PESO * motorSinergia(ctx, time).score : 0);
      },
      extras: function (ctx, cands) { return motorExtrasDeSinergia(ctx, cands); } }
  };
  function motorMedia(v) { return v.length ? v.reduce(function (a, b) { return a + b; }, 0) / v.length : 0; }
  function motorArred(n, casas) { var f = Math.pow(10, casas); return Math.round(n * f) / f; }

  // ---- cache (parâmetro; limite simples: ao passar do máximo, esvazia) ----
  function criarCacheDoMotor() { return { sim: Object.create(null), unid: Object.create(null), build: Object.create(null), aux: Object.create(null), tam: 0, acertos: 0, falhas: 0 }; }
  function motorGuardar(cache, grupo, chave, valor) {
    if (cache.tam >= MOTOR_CACHE_MAXIMO) { cache.sim = Object.create(null); cache.unid = Object.create(null); cache.aux = Object.create(null); cache.tam = 0; }
    cache[grupo][chave] = valor; cache.tam++;
    return valor;
  }

  // ---- as lutas ----
  function motorNivelDaEtapa(etapa) {
    var l = LEVELCAPS && LEVELCAPS.rows[etapa];
    return (l && (l[levelCapMode()] || l.more)) || 100;
  }
  // Luta da run pronta para simular: mesma montagem do juiz (avaliarTimePelaLutaCompleta), com o nível do level cap da etapa da luta.
  // `climaForcado` (Fase D): refaz a luta com o clima do jogador ligado, só para medir o benefício de um armador (o clima do chefão, se houver, vale sempre).
  function motorMontarLuta(nome, etapa, climaForcado) {
    var b = BOSSES.filter(function (x) { return x.name === nome; })[0];
    if (!b) return null;
    var party = bossPartyPorDificuldade(b) || [], nivel = motorNivelDaEtapa(etapa), climaDoChefao = climaDoTimeDoChefao(party), clima = climaForcado || climaDoChefao, dupla = !!b.db;
    var buffs = buffsAtivosDoChefao(nome), campo = regraDeCampoDoChefao(nome);
    var foes = foesComRegraDeCampo(foesComBuffsDoGinasio(party.map(function (m) { return foeDeDuelo(m, nivel, clima); }).filter(Boolean), buffs, dupla ? 2 : 1), campo);
    if (!foes.length) return null;
    return { nome: nome, etapa: etapa, nivel: nivel, dupla: dupla, clima: climaDoChefao, foes: foes, inicio: buffs.length ? inicioDaLutaComBuffs(buffs) : null, buffs: buffs,
      chave: [nome, nivel, DIFF_TO_BOSSKEY[state.settings.difficulty] || "party", dupla ? "d" : "s", buffs.slice().sort().join(","), JSON.stringify(campo), clima].join("|") };
  }
  // Luta COMUM da run (dado pré-calculado do rank): mesma montagem do juiz, sem buff de ginásio nem regra de campo (treinador comum não tem).
  function motorMontarLutaComum(c, tier) {
    var tm = LUTAS_COMUNS_RUN.times[c.nome] || {}, party = (tier === "insane" && tm.insane && tm.insane.length ? tm.insane : tm.party) || [];
    var nivel = motorNivelDaEtapa(c.etapa), clima = climaDoTimeDoChefao(party), dupla = !!c.db;
    var foes = party.map(function (m) { return foeDeDuelo(m, nivel, clima); }).filter(Boolean);
    if (!foes.length) return null;
    return { nome: c.nome, etapa: c.etapa, nivel: nivel, dupla: dupla, clima: clima, foes: foes, inicio: null, buffs: [], comum: true, peso: c.peso,
      chave: [c.nome, nivel, tier, dupla ? "d" : "s", "", "null", clima].join("|") };
  }
  // Até `n` itens espaçados por igual (o primeiro, o último e os do meio), na ordem dada.
  function motorEspacadas(lista, n) {
    if (lista.length <= n) return lista;
    if (n === 1) return [lista[Math.floor((lista.length - 1) / 2)]];
    var out = [];
    for (var i = 0; i < n; i++) out.push(lista[Math.round(i * (lista.length - 1) / (n - 1))]);
    return out;
  }
  // As lutas comuns do contexto, na dificuldade da run: todas as selecionadas, as que ainda faltam e a amostra da busca (as mais perigosas de
  // cada etapa que falta). Sem o arquivo (ou sem lutas na dificuldade) a lista é vazia e a fatia vira 100% chefões.
  function motorLutasComunsDoContexto(etapa) {
    var tier = DIFF_TO_BOSSKEY[state.settings.difficulty] || "party";
    var dado = typeof LUTAS_COMUNS_RUN !== "undefined" && LUTAS_COMUNS_RUN ? LUTAS_COMUNS_RUN : null;
    var lista = dado && dado.lutas && dado.lutas[tier] ? dado.lutas[tier] : [];
    var todas = lista.map(function (c) { return motorMontarLutaComum(c, tier); }).filter(Boolean);
    var restantes = todas.filter(function (l) { return l.etapa >= etapa; }), vistas = {}, amostra = [], conferencia = [];
    var ordem = function (a, b) { return a.etapa - b.etapa || (a.nome < b.nome ? -1 : 1); };
    restantes.slice().sort(function (a, b) { return b.peso - a.peso || (a.nome < b.nome ? -1 : 1); }).forEach(function (l) {
      vistas[l.etapa] = (vistas[l.etapa] || 0) + 1;
      if (vistas[l.etapa] === 1) amostra.push(l); // a mais perigosa de cada etapa; abaixo, afinada para MOTOR_COMUNS_NA_AMOSTRA
      if (vistas[l.etapa] <= MOTOR_COMUNS_NA_CONFERENCIA) conferencia.push(l);
    });
    return { todas: todas, restantes: restantes, amostra: motorEspacadas(amostra.sort(ordem), MOTOR_COMUNS_NA_AMOSTRA), conferencia: conferencia.sort(ordem), fatia: dado && dado.fatia !== undefined ? dado.fatia : MOTOR_FATIA_PADRAO };
  }
  // As lutas do contexto: todas as 29 (conferência final) e a amostra fixa (busca), função só da etapa.
  function motorLutasDoContexto(etapa) {
    var todas = [], porNome = {};
    LUTAS_DA_RUN.forEach(function (par) { var l = motorMontarLuta(par[0], par[1]); if (l) { todas.push(l); porNome[l.nome] = l; } });
    var restantes = todas.filter(function (l) { return l.etapa >= etapa; });
    var amostra = MOTOR_AMOSTRA_DE_LUTAS.map(function (n) { return porNome[n]; }).filter(function (l) { return l && l.etapa >= etapa; });
    // Poucas lutas sobrando (fim da run): completa com as restantes, na ordem da run, até o mínimo.
    restantes.forEach(function (l) { if (amostra.length < MOTOR_AMOSTRA_MINIMA && amostra.indexOf(l) === -1) amostra.push(l); });
    if (!amostra.length) amostra = todas.slice(-MOTOR_AMOSTRA_MINIMA);
    return { todas: todas, restantes: restantes, amostra: amostra, comuns: motorLutasComunsDoContexto(etapa) };
  }
  // O valor do objetivo na régua do rank: fatia dos chefões (amostra fixa) + o resto nas comuns mais perigosas (amostra de comuns).
  // Sem comuns na amostra é só o valor dos chefões. O bônus de sinergia, que não depende das lutas, entra uma vez só (fatia + resto = 1).
  function motorValorDoObjetivo(ctx, obj, time) {
    var vB = obj.valor(motorAvaliar(ctx, time, ctx.lutas.amostra), time.length, time, ctx), c = ctx.lutas.comuns;
    if (!c || !c.amostra.length) return vB;
    return c.fatia * vB + (1 - c.fatia) * obj.valor(motorAvaliar(ctx, time, c.amostra), time.length, time, ctx);
  }
  // Contexto da run lido do state (adaptador): quem chama pode trocar qualquer campo.
  function contextoDoMotor(troca) {
    var etapa = state.settings.milestone;
    var ctx = { etapa: etapa, cap: capOuPadrao(), pool: xsDoJogador(), cache: null, orcamentoMs: null };
    ctx.lutas = motorLutasDoContexto(etapa);
    return Object.assign(ctx, troca || {});
  }

  // ---- candidatos ----
  var motorPaiDe = null;
  // Raiz da linha evolutiva da espécie que o jogador tem (evolução normal; Mega não conta).
  function motorRaizDaLinha(x) {
    if (!motorPaiDe) {
      motorPaiDe = Object.create(null);
      SPECIES.forEach(function (s) {
        (s.ev || []).forEach(function (e) {
          var kind = DATA.evoKinds[e[0]];
          if (kind === "EVO_MEGA_EVOLUTION" || kind === "EVO_PRIMAL_REVERSION" || kind === "EVO_MOVE_MEGA_EVOLUTION") return;
          if (motorPaiDe[e[2]] === undefined) motorPaiDe[e[2]] = s.x;
        });
      });
    }
    var r = x, vistos = {};
    while (motorPaiDe[r] !== undefined && !vistos[r]) { vistos[r] = true; r = motorPaiDe[r]; }
    return r;
  }
  function motorChaveDaBuild(b) { return [b.ability, (b.moves || []).join(","), b.item || "", b.nature || "", (b.evs || []).join(",")].join("|"); }
  // Build do candidato. Favorito com build salva (só na forma base, como a tela) usa a salva; senão o top-1 do pipeline contra o campo;
  // sem nenhum, o melhor set pelo motor (origem "fallback") - só para favorito, o resto sai da lista com aviso.
  function motorChaveDoContexto(ctx) { return [MOTOR_VERSAO, ctx.etapa, ctx.cap, levelCapMode(), state.settings.difficulty, megaMode()].join("|"); }
  function motorBuildDoCandidato(ctx, sp, base, travado, avisos) {
    var cache = ctx.cache, chaveCtx = motorChaveDoContexto(ctx);
    var salva = travado && sp.x === base.x ? getActiveBuild(sp.sname) : null;
    if (salva && salva.source === "sugestao") salva = null; // sugestão do próprio app não é build do jogador: recalcula (F5, 21/10)
    var origem, build;
    if (salva) { build = salva; origem = "build-salva"; }
    else {
      var ck = chaveCtx + "|" + sp.sname, c = cache.build[ck];
      if (c === undefined) {
        ctx.alvoCampo = ctx.alvoCampo || pipelineResolverAlvo({ campo: true });
        var r = pipelineCandidatos(sp, ctx.alvoCampo), top = r.candidatos[0] || null;
        c = motorGuardar(cache, "build", ck, top ? { build: top.build, aviso: top.avisos || [], todos: r.candidatos } : { build: null, aviso: [r.aviso || "sem build"], todos: [] });
      }
      if (c.build) { build = c.build; origem = "pipeline"; }
      else if (travado) {
        var foes = ctx.lutas.amostra.reduce(function (a, l) { return a.concat(l.foes); }, []);
        var m = melhorUnidadeContra(sp, foes, motorNivelDaEtapa(ctx.etapa), null);
        var u = m && m.unidade;
        if (!u) return null;
        build = { ability: (ABILITIES[u.abId] || [""])[0] || "", nature: u.receita.set.nature, evs: u.receita.set.evs, item: u.receita.item || "",
          moves: u.golpesDoSet.map(function (id) { return MOVES[id][0]; }) };
        origem = "fallback";
        avisos.push(sp.n + ": o pipeline não achou build; usei o melhor set do motor (origem \"fallback\").");
      } else { avisos.push(sp.n + " ficou fora da busca: " + (c.aviso[0] || "sem build válida") + "."); return null; }
    }
    // Item que a run ainda não libera: o Modo Motor nunca usa (usuário, 21/10).
    if (build.item && !liberadoNaRun(ctx.etapa, ctx.cap, { item: build.item })) {
      avisos.push(sp.n + ": o item " + build.item + " ainda não está liberado nesta Etapa; a build segue sem item.");
      build = Object.assign({}, build, { item: "" });
    }
    return { build: build, origem: origem };
  }
  // Lista de candidatos já filtrada e com build. `favoritos`: snames travados.
  // Gerador (Fase F): cede a vez (yield) depois de cada build calculada, para a tela respirar. As builds ficam no cache do ctx: rodar isto
  // antes (aquecer) deixa a montagem do time só com a busca. motorCandidatos (síncrono) é o mesmo caminho, drenado de uma vez.
  function motorSecar(gerador) { var r; while (!(r = gerador.next()).done); return r.value; }
  function* motorCandidatosEmPassos(ctx, favoritos, avisos) {
    var out = [], semFavorito = favoritos.slice();
    var xs = ctx.pool.filter(function (x, i, arr) { return arr.indexOf(x) === i; });
    for (var ix = 0; ix < xs.length; ix++) {
      var x = xs[ix], base = getSpeciesByX(x);
      if (!base) continue;
      var travado = favoritos.indexOf(base.sname) !== -1;
      var unidades = battleUnitsOf(base).filter(function (u) { return serveProMono(u.main); });
      if (!unidades.length) { if (travado) avisos.push(base.n + " é favorito mas não serve nesta run (Monotype ou forma indisponível)."); continue; }
      if (travado) semFavorito.splice(semFavorito.indexOf(base.sname), 1);
      for (var iu = 0; iu < unidades.length; iu++) {
        var sp = unidades[iu].main, b = motorBuildDoCandidato(ctx, sp, base, travado, avisos);
        yield "build";
        if (!b) continue;
        out.push({ sp: sp, x: x, base: base, sname: sp.sname, nome: sp.n, linha: motorRaizDaLinha(base.x), travado: travado, origem: b.origem, build: b.build,
          chaveBuild: sp.sname + "|" + motorChaveDaBuild(b.build), suporte: false });
      }
    }
    semFavorito.forEach(function (s) { avisos.push("Favorito " + s + " não está no time nem na caixa."); });
    out.sort(function (a, b) { return a.sname < b.sname ? -1 : a.sname > b.sname ? 1 : a.x - b.x; });
    return out;
  }
  function motorCandidatos(ctx, favoritos, avisos) { return motorSecar(motorCandidatosEmPassos(ctx, favoritos, avisos)); }
  // Aquecimento: calcula e guarda as builds top-1 do pool no cache, sem montar nada. Idempotente (o que já está no cache não recalcula).
  function* motorAquecerBuildsEmPassos(ctx) {
    if (!ctx.cache) ctx.cache = criarCacheDoMotor();
    yield* motorCandidatosEmPassos(ctx, [], []);
  }

  // ---- simulação com cache ----
  function motorUnidade(ctx, c, nivel) {
    var ck = c.chaveBuild + "@" + nivel + "|" + MOTOR_VERSAO;
    var u = ctx.cache.unid[ck];
    if (u === undefined) {
      u = unidadeDaBuild(c.sp, c.build, nivel, null);
      // Contrafactual da Fase D: a mesma build sem os golpes de um tipo (setup, tela, vento, sala...); a chave da build já muda.
      if (c.semTipos) u = Object.assign({}, u, { statusIds: (u.statusIds || []).filter(function (id) { var p = planoDoGolpeStatus(id); return !(p && c.semTipos.indexOf(p.tipo) !== -1); }) });
      motorGuardar(ctx.cache, "unid", ck, u);
    }
    return u;
  }
  // A luta completa do time (na ordem dada) contra uma luta da run; devolve o resumo medido.
  function motorSimular(ctx, time, luta) {
    var chave = MOTOR_VERSAO + "|" + state.settings.milestone + "|" + megaMode() + "|" + luta.chave + "|" + time.map(function (c) { return c.chaveBuild; }).join("#");
    var r = ctx.cache.sim[chave];
    if (r !== undefined) { ctx.cache.acertos++; return r; }
    ctx.cache.falhas++;
    var us = time.map(function (c) { var u = motorUnidade(ctx, c, luta.nivel); return luta.buffs.length ? meuComBuffsDoGinasio(u, luta.buffs) : u; });
    var s = (luta.dupla ? simularDuplaContraChefao : simularLutaContraChefao)(us, luta.foes, luta.nivel, luta.inicio);
    var kills = {};
    (s.log || []).forEach(function (l) {
      if (l.contra !== undefined && l.venceu === false) kills[l.contra] = (kills[l.contra] || 0) + 1; // 1x1: quem me derrubou
      else if (l.derruba !== undefined && l.quem !== undefined && !motorEhMeu(time, l.quem)) kills[l.quem] = (kills[l.quem] || 0) + 1; // dupla
    });
    var ameaca = null;
    Object.keys(kills).forEach(function (n) { if (!ameaca || kills[n] > kills[ameaca]) ameaca = n; });
    return motorGuardar(ctx.cache, "sim", chave, { p: s.pontos, v: s.venceu ? 1 : 0, d: s.derrubados, t: s.total, vi: s.vivos, ameaca: ameaca });
  }
  function motorEhMeu(time, nome) { return time.some(function (c) { return c.sp.n === nome; }); }
  function motorAvaliar(ctx, time, lutas) { return lutas.map(function (l) { return motorSimular(ctx, time, l); }); }

  // ---- métricas da régua comum ----
  function motorMetricas(rs, lutas) {
    var venceu = rs.filter(function (r) { return r.v; }).length;
    return { lutas: rs.length, vence: venceu, cobertura: rs.length ? motorArred(venceu / rs.length, 3) : 0,
      pontosMedios: motorArred(motorMedia(rs.map(function (r) { return r.p; })), 2),
      derrubadosMedios: motorArred(motorMedia(rs.map(function (r) { return r.d; })), 2),
      perdidas: lutas.filter(function (l, i) { return !rs[i].v; }).map(function (l) { return l.nome; }) };
  }

  // ---- a busca ----
  function motorTemGolpeDeLado(ctx, c) { return semGolpesDeLadoDuelo(motorUnidade(ctx, c, ctx.lutas.amostra[0].nivel)) !== null; }
  function motorBuscar(ctx, cands, favoritos, objetivo, agora) { return motorSecar(motorBuscarEmPassos(ctx, cands, favoritos, objetivo, agora)); }
  function* motorBuscarEmPassos(ctx, cands, favoritos, objetivo, agora) {
    var vagas = [], tamanho = Math.min(MOTOR_TAMANHO_DO_TIME, cands.length);
    var avaliacoes = 0, estouro = false;
    var valorDe = function (time) { avaliacoes++; return motorValorDoObjetivo(ctx, objetivo, time); };
    var excedeu = function () { if (ctx.orcamentoMs && agora() > ctx.orcamentoMs) estouro = true; return estouro; };
    // Peças extras do objetivo (sinergia: a build que arma a condição de uma espécie cuja build top-1 não a arma).
    var extras = objetivo.extras ? objetivo.extras(ctx, cands) : [];
    // Vagas dos favoritos (opções = as formas dele, e as builds extras dele) e vagas livres.
    favoritos.forEach(function (s) {
      var op = cands.concat(extras).filter(function (c, i, a) { return c.base.sname === s && a.indexOf(c) === i; });
      if (op.length) vagas.push({ trava: s, opcoes: op, atual: null });
    });
    var nLivres = Math.max(0, tamanho - vagas.length);
    for (var k = 0; k < nLivres; k++) vagas.push({ trava: null, opcoes: null, atual: null });
    // Lista curta das vagas livres: o desempenho sozinho (objetivo com 1 membro) + os melhores suportes de lado.
    var solo = [];
    for (var ic = 0; ic < cands.length; ic++) { solo.push({ c: cands[ic], v: valorDe([cands[ic]]) }); yield "solo"; }
    solo.sort(function (a, b) { return b.v - a.v || (a.c.sname < b.c.sname ? -1 : 1); });
    var curta = solo.slice(0, MOTOR_POR_VAGA).map(function (s) { return s.c; });
    solo.slice(MOTOR_POR_VAGA).filter(function (s) { return motorTemGolpeDeLado(ctx, s.c); }).slice(0, MOTOR_SUPORTES_POR_VAGA).forEach(function (s) { curta.push(s.c); });
    extras.forEach(function (c) { if (!c.travado && curta.indexOf(c) === -1) curta.push(c); });
    var soloDe = function (c) { return solo.filter(function (s) { return s.c === c; })[0].v; };
    var usadoPor = function (c, exceto) {
      return vagas.some(function (v, i) { return i !== exceto && v.atual && (v.atual.x === c.x || v.atual.linha === c.linha); });
    };
    var timeSem = function (i, c) { return vagas.map(function (v, j) { return j === i ? c : v.atual; }).filter(Boolean); };
    function* escolher(i, passada) {
      var v = vagas[i], base = v.opcoes || curta, opcoes = base.filter(function (c) { return !usadoPor(c, i); });
      if (v.atual && opcoes.indexOf(v.atual) === -1) opcoes.push(v.atual);
      if (!v.opcoes && passada === 1) {
        // completa com o melhor sozinho que ainda esteja livre, se a lista curta acabou (pool pequeno)
        solo.forEach(function (s) { if (opcoes.length < MOTOR_POR_VAGA && opcoes.indexOf(s.c) === -1 && !usadoPor(s.c, i)) opcoes.push(s.c); });
      }
      if (opcoes.length === 1 && !v.atual) { v.atual = opcoes[0]; return; }
      var melhor = v.atual, melhorV = v.atual ? valorDe(timeSem(i, v.atual)) : -Infinity;
      for (var io = 0; io < opcoes.length; io++) {
        var c = opcoes[io];
        if (c === v.atual || excedeu()) continue;
        var val = valorDe(timeSem(i, c));
        yield "vaga";
        if (val > melhorV + 1e-9) { melhor = c; melhorV = val; }
      }
      if (!melhor) melhor = opcoes[0];
      v.atual = melhor;
    }
    // Passada 1 (monta, favoritos primeiro) e passada 2 (refaz cada vaga com as outras fixas).
    for (var i = 0; i < vagas.length; i++) yield* escolher(i, 1);
    for (var j = 0; j < vagas.length && !excedeu(); j++) yield* escolher(j, 2);
    var time = vagas.map(function (v) { return v.atual; }).filter(Boolean);
    return { time: time, vagas: vagas, curta: curta, solo: solo, soloDe: soloDe, avaliacoes: avaliacoes, estouro: estouro };
  }

  // ---- plano B: só em vagas NÃO travadas, melhoria medida na luta mais difícil ----
  function motorPlanoB(ctx, busca, rsTodas) {
    var travadas = busca.vagas.filter(function (v) { return v.trava; }).length;
    var livres = busca.vagas.map(function (v, i) { return v.trava ? -1 : i; }).filter(function (i) { return i >= 0; });
    if (!livres.length) return { trocas: [], motivo: "todos os membros são favoritos: não há troca automática permitida" };
    var todas = ctx.lutas.restantes.length ? ctx.lutas.restantes : ctx.lutas.todas;
    var rs = todas.map(function (l) { return motorSimular(ctx, busca.time, l); });
    var pior = 0;
    rs.forEach(function (r, i) { var f = r.v * 10 + r.d / r.t, g = rs[pior].v * 10 + rs[pior].d / rs[pior].t; if (f < g - 1e-9) pior = i; });
    var luta = todas[pior], base = rs[pior];
    var candidatos = busca.curta.concat(busca.solo.slice(0, MOTOR_POR_VAGA + MOTOR_SUPORTES_POR_VAGA).map(function (s) { return s.c; }))
      .filter(function (c, k, a) { return a.indexOf(c) === k && busca.time.indexOf(c) === -1; });
    var achados = [];
    livres.forEach(function (i) {
      var atual = busca.vagas[i].atual;
      candidatos.forEach(function (c) {
        var novo = busca.vagas.map(function (v, j) { return j === i ? c : v.atual; }).filter(Boolean);
        var repetido = novo.some(function (m, a) { return novo.some(function (n, b) { return a < b && (m.x === n.x || m.linha === n.linha); }); });
        if (repetido) return;
        var r = motorSimular(ctx, novo, luta);
        var delta = motorArred(r.p - base.p, 2);
        if (delta > 0) achados.push({ vaga: i, sai: atual.nome, entra: c.nome, deltaPontos: delta, venceAgora: !!r.v, venciaAntes: !!base.v });
      });
    });
    achados.sort(function (a, b) { return b.deltaPontos - a.deltaPontos || (a.entra < b.entra ? -1 : 1); });
    var trocas = [];
    achados.forEach(function (a) { if (trocas.length < 2 && !trocas.some(function (t) { return t.vaga === a.vaga || t.entra === a.entra; })) trocas.push(a); });
    return { luta: luta.nome, ameaca: base.ameaca, pontosAntes: motorArred(base.p, 2), vencia: !!base.v, travadas: travadas, trocas: trocas,
      motivo: trocas.length ? null : "nenhuma troca em vaga livre melhora a luta mais difícil (" + luta.nome + ") na simulação" };
  }

  // ---- item fechado pelo motor (ticket motor-item/01, decisão A do usuário, 22/10/2026) ----
  // O pipeline entrega a build SEM item (de propósito: a referência é conservadora). Depois que a busca fechou o time, cada membro sem item
  // testa uma lista pequena de itens que o motor SIMULA e a Etapa LIBERA, na luta completa (o mesmo juiz da busca), e fica com o que mais
  // sobe a nota. Lista: o palpite do próprio motor (itemDoSetDuelo: o que a habilidade pede, Eviolite, Leftovers/Life Orb), Life Orb,
  // Leftovers, Assault Vest, Expert Belt, Sitrus Berry, Muscle Band (se há golpe físico), Wise Glasses (se há especial) e o item de tipo de
  // cada tipo de golpe de dano. Fora de propósito: Choice (a trava de golpe não é simulada: prometeria dano sem o custo) e Focus Sash,
  // gemas e bagas de gatilho (efeito só parcial no motor). Empate = o primeiro da lista (palpite do motor primeiro): estável.
  var MOTOR_ITENS_NA_FINAL = 2;
  var MOTOR_ITENS_FIXOS = ["Life Orb", "Leftovers", "Assault Vest", "Expert Belt", "Sitrus Berry"];
  function motorItensCandidatos(ctx, c) {
    var u = motorUnidade(ctx, c, ctx.lutas.amostra[0].nivel), r = u.receita, lista = [];
    var palpite = unidadeDeDuelo(c.sp, r.set, r.abId, r.nivel, r.golpes, null, undefined).item;
    var fis = false, esp = false, tipos = [];
    r.golpes.forEach(function (id) {
      var s = DATA.splits[MOVES[id][2]], t = DATA.types[MOVES[id][1]];
      if (s === "PHYSICAL") fis = true; else if (s === "SPECIAL") esp = true;
      if (t && tipos.indexOf(t) === -1) tipos.push(t);
    });
    var doTipo = tipos.map(function (t) {
      return Object.keys(ITENS_CONFIG.itens).filter(function (n) { var x = ITENS_CONFIG.itens[n]; return x.e === "TYPE_POWER" && x.t === t; }).sort()[0];
    });
    [palpite].concat(MOTOR_ITENS_FIXOS, fis ? ["Muscle Band"] : [], esp ? ["Wise Glasses"] : [], doTipo).forEach(function (n) {
      if (n && lista.indexOf(n) === -1 && ITEMS.indexOf(n) !== -1 && liberadoNaRun(ctx.etapa, ctx.cap, { item: n })) lista.push(n);
    });
    return lista;
  }
  function motorComItem(c, item) {
    var b = Object.assign({}, c.build, { item: item });
    return Object.assign({}, c, { build: b, chaveBuild: c.sname + "|" + motorChaveDaBuild(b) });
  }
  // Troca, no lugar, os membros sem item (origem pipeline/fallback: build salva do jogador nunca é mexida). Um membro por vez, os outros como
  // estão; devolve a escolha de cada um (para o teste e a explicação).
  function* motorFecharItens(ctx, obj, busca) {
    var escolhas = [];
    if (ctx.fecharItens === false) return escolhas; // opção explícita (testes que fixam o time sem item)
    for (var i = 0; i < busca.time.length; i++) {
      var c = busca.time[i];
      if (c.origem === "build-salva" || c.build.item) continue;
      var ck = MOTOR_VERSAO + "|" + motorChaveDoContexto(ctx) + "|" + c.chaveBuild + "|" + busca.time.map(function (m) { return m.chaveBuild; }).join("#"), cache = ctx.cache.aux["item|" + ck];
      if (cache === undefined) {
        var todos = motorItensCandidatos(ctx, c), melhor = null, melhorV = -Infinity;
        // Triagem barata: cada item sozinho (1 membro, no cache) fica com o palpite do motor + os MOTOR_ITENS_NA_FINAL melhores; só esses vão ao time inteiro.
        var solo = [];
        for (var kk = 0; kk < todos.length; kk++) { solo.push({ n: todos[kk], i: kk, v: motorValorDoObjetivo(ctx, obj, [motorComItem(c, todos[kk])]) }); yield "item"; }
        solo.sort(function (x, y) { return y.v - x.v || x.i - y.i; });
        var itens = todos.filter(function (n, kk) { return kk === 0 || solo.slice(0, MOTOR_ITENS_NA_FINAL).some(function (z) { return z.n === n; }); });
        for (var k = 0; k < itens.length; k++) {
          var cand = motorComItem(c, itens[k]);
          // Mesmo item no time: no máximo MAX_MESMO_ITEM_NO_TIME (a regra do app).
          if (busca.time.filter(function (m, j) { return j !== i && m.build.item === itens[k]; }).length >= MAX_MESMO_ITEM_NO_TIME) continue;
          var v = motorValorDoObjetivo(ctx, obj, busca.time.map(function (m, j) { return j === i ? cand : m; }));
          yield "item";
          if (v > melhorV + 1e-9) { melhorV = v; melhor = itens[k]; }
        }
        cache = motorGuardar(ctx.cache, "aux", "item|" + ck, { item: melhor || "" });
      }
      if (cache.item) {
        var novo = motorComItem(c, cache.item), antes = busca.time[i];
        busca.time[i] = novo;
        busca.vagas.forEach(function (v) { if (v.atual === antes) v.atual = novo; });
        escolhas.push({ sname: c.sname, item: cache.item });
      }
    }
    return escolhas;
  }

  // ---- a função pública ----
  // ctx: ver contextoDoMotor. pedido: { favoritos: [sname] (0 a 6, travados), variantes: ["ofensivo", "seguro"] (padrão: todas as definidas) }.
  // Devolve { variantes: [{ chave, objetivo, membros, metricas, planoB, melhorTentativa, explicacao, avisos, tempoMs }], avisos, tempoMs, cache }.
  function montarTimePeloMotor(ctx, pedido) { return motorSecar(montarTimePeloMotorEmPassos(ctx, pedido)); }
  // Mesma coisa em gerador (Fase F): quem chama (a tela) devolve a vez ao navegador a cada yield; o valor do yield é só o nome do passo.
  function* montarTimePeloMotorEmPassos(ctx, pedido) {
    ctx = ctx || contextoDoMotor();
    pedido = pedido || {};
    if (!ctx.cache) ctx.cache = criarCacheDoMotor();
    var relogio = function () { return Date.now(); }, t0 = relogio();
    var favoritos = (pedido.favoritos || []).filter(function (s, i, a) { return a.indexOf(s) === i; }).slice(0, MOTOR_TAMANHO_DO_TIME);
    var chaves = (pedido.variantes && pedido.variantes.length ? pedido.variantes : Object.keys(MOTOR_OBJETIVOS)).filter(function (k) { return MOTOR_OBJETIVOS[k]; });
    var avisos = [];
    var cands = yield* motorCandidatosEmPassos(ctx, favoritos, avisos);
    var tCands = relogio() - t0;
    var variantes = [];
    for (var ik = 0; ik < chaves.length; ik++) {
      var chave = chaves[ik], tv = relogio(), obj = MOTOR_OBJETIVOS[chave];
      var busca = yield* motorBuscarEmPassos(ctx, cands, favoritos, obj, function () { return relogio() - t0; });
      var ti = relogio();
      var itensFechados = yield* motorFecharItens(ctx, obj, busca), tItensMs = relogio() - ti;
      yield "conferencia";
      var rsAmostra = motorAvaliar(ctx, busca.time, ctx.lutas.amostra), rsTodas = motorAvaliar(ctx, busca.time, ctx.lutas.todas);
      var idxRest = ctx.lutas.todas.map(function (l, i) { return l.etapa >= ctx.etapa ? i : -1; }).filter(function (i) { return i >= 0; });
      var rsRest = idxRest.map(function (i) { return rsTodas[i]; }), lutasRest = idxRest.map(function (i) { return ctx.lutas.todas[i]; });
      var comuns = ctx.lutas.comuns, comunsRest = comuns ? comuns.conferencia : [];
      var metricas = { objetivo: motorArred(motorValorDoObjetivo(ctx, obj, busca.time), 4), amostra: motorMetricas(rsAmostra, ctx.lutas.amostra),
        completo: motorMetricas(rsTodas, ctx.lutas.todas), restantes: motorMetricas(rsRest, lutasRest) };
      // As comuns mais perigosas de cada etapa que falta (a conferência da fatia de 40%): quantas o time vence e quais perde.
      if (comunsRest.length) metricas.comuns = motorMetricas(motorAvaliar(ctx, busca.time, comunsRest), comunsRest);
      var v = { chave: chave, objetivo: { nome: obj.nome, descricao: obj.descricao },
        membros: busca.time.map(function (c) { return { sname: c.sname, nome: c.nome, x: c.x, base: c.base.sname, travado: c.travado, origem: c.origem, build: c.build, papeis: [], abstencao: null, contribuicoes: [] }; }),
        metricas: metricas, avisos: [], avaliacoes: busca.avaliacoes, itensFechados: itensFechados, tempoItensMs: tItensMs };
      v.melhorTentativa = metricas.restantes.lutas > 0 && metricas.restantes.vence < metricas.restantes.lutas / 2;
      // Favorito nunca some em silêncio: ou está em `membros` ou há um aviso dizendo por quê (linha evolutiva repetida, sem build...).
      favoritos.forEach(function (s) {
        if (v.membros.some(function (m) { return m.base === s; })) return;
        var sp = SPECIES.filter(function (x) { return x && x.sname === s; })[0], nome = sp ? sp.n : s;
        var rival = sp && v.membros.filter(function (m) { return motorRaizDaLinha(m.x) === motorRaizDaLinha(sp.x); })[0];
        v.avisos.push(rival ? nome + " é favorito mas divide a linha evolutiva com " + rival.nome + ", que entrou no lugar; só um por linha."
          : nome + " é favorito mas não entrou no time: " + (avisos.join(" ").indexOf(nome) !== -1 ? "veja os avisos gerais" : "sem build válida ou sem vaga") + ".");
      });
      if (busca.time.length < MOTOR_TAMANHO_DO_TIME) v.avisos.push("só há " + busca.time.length + " Pokémon possíveis nesta run: o time ficou com " + busca.time.length + ".");
      if (busca.estouro) v.avisos.push("o orçamento de tempo acabou antes da segunda passada: a busca parou no melhor time achado até ali.");
      yield "plano-b";
      v.planoB = motorPlanoB(ctx, busca, rsTodas);
      yield "papeis";
      // Fase D: papéis por build, contribuições, tags e estilo (paralelo ao papel legado da espécie, que não é tocado).
      var tc = relogio(), cl = motorClassificar(ctx, busca.time);
      v.membros.forEach(function (m, i) { m.papeis = cl.membros[i].papeis; m.abstencao = cl.membros[i].abstencao; m.contribuicoes = cl.membros[i].contribuicoes; });
      v.estilo = cl.estilo; v.estiloProva = cl.estiloProva; v.tags = cl.tags; v.condicaoDeVitoria = cl.condicaoDeVitoria; v.naoMedidos = cl.naoMedidos;
      v.tempoClassificacaoMs = relogio() - tc;
      v.explicacao = motorTextos(v);
      v.tempoMs = relogio() - tv;
      variantes.push(v);
      yield "variante";
    }
    // Objetivos diferentes podem chegar no mesmo time (elenco pequeno, busca gulosa): dizer, em vez de vender como se fossem opções.
    variantes.forEach(function (v, i) {
      var conj = function (x) { return x.membros.map(function (m) { return m.sname; }).sort().join(","); };
      for (var k = 0; k < i; k++) if (conj(variantes[k]) === conj(v)) { v.avisos.push("chegou nos mesmos Pokémon da variante \"" + variantes[k].objetivo.nome + "\": com este elenco os dois objetivos concordam."); break; }
    });
    return { variantes: variantes, avisos: avisos, candidatos: cands.length, tempoMs: relogio() - t0, tempoCandidatosMs: tCands,
      cache: { acertos: ctx.cache.acertos, falhas: ctx.cache.falhas, tamanho: ctx.cache.tam } };
  }
