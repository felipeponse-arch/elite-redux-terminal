  // ===== src/regras/time_pelo_motor_papeis.js =====
  // Modo Motor do Meu Time, Fase D (papéis por build, tags, sinergia e explicação). Carrega depois de time_pelo_motor.js (mesmo escopo).
  // Fase D: limiares das provas (proposta a confirmar; ver docs/decisoes_mecanicas.md) e tipos de golpe de status.
  var MOTOR_PROVA_PONTOS = 1; // diferença de pontos da luta completa que conta como efeito de verdade (1 = o valor de um nocaute)
  var MOTOR_PROVA_BENEFICIO = 0.05; // ganho médio de nota por duelo 1x1 (HP cheio) que conta como benefício de uma condição
  var MOTOR_PROVA_SINERGIA_PESO = 0.15; // quanto a sinergia vale no objetivo da 3ª variante (a base é o Battle Rating médio, 0 a 1)
  var MOTOR_PROVA_MIN_EVENTOS = 2; // wallbreaker, revenge killer, tanque, protege e fecha: pelo menos dois eventos medidos (armador e suporte: uma luta com o efeito)
  // Tipos de golpe de status do simulador (planoDoGolpeStatus): armar o campo, utilidade, e setup (que é do sweeper, não do suporte).
  var MOTOR_TIPOS_DE_ARMAR = ["tela", "vento", "sala", "defog", "hazard"];
  var MOTOR_TIPOS_DE_UTILIDADE = ["status", "queda", "taunt", "disable", "haze", "protege", "substituto", "divide"];
  var MOTOR_ROTULO_CLIMA = ROTULO_CLIMA; // rótulos únicos em campo.js (TK-16)
  // ===================================================================================================================
  // Fase D (ticket time-pelo-motor/01, 21/10/2026): papéis POR BUILD, contribuição dos membros, tags e estilo do time.
  // Regra de ouro (ticket §2.4, §3 riscos 4 e 8): nada sai de stat nem de "tem o golpe". Cada rótulo carrega a PROVA medida no
  // simulador, nas lutas da amostra fixa (o campo avaliado), e a abstenção é o resultado normal quando a prova não fecha.
  // Esta classificação é PARALELA ao papel legado da espécie (SPECIES_ROLE / species_role.json): não lê, não escreve, não troca.
  // Limites conhecidos (ticket §2.8, honestos): (1) o simulador não executa golpe de troca (U-turn, Volt Switch e parecidos), então o PIVÔ
  // nunca é provado e fica sempre como "não medido"; (2) as lutas em dupla (Tate & Liza) entram nas contagens de contribuição da luta
  // completa, mas não nas provas por nocaute (o registro da dupla é outro) nem nos ganhos de lado/clima (o 1x1 não os modela na dupla);
  // (3) o terreno e os hazards como tag não foram implementados; (4) a velocidade do revenge killer é a base (stat) mais prioridade de
  // golpe, sem boosts de fim de turno.
  function motorMediana(v) { var s = v.slice().sort(function (a, b) { return a - b; }); return s.length ? s[Math.floor((s.length - 1) / 2)] : 0; }
  function motorUnidadeNaLuta(ctx, c, luta) { var u = motorUnidade(ctx, c, luta.nivel); return luta.buffs.length ? meuComBuffsDoGinasio(u, luta.buffs) : u; }
  function motorSemTipos(c, tipos) { return Object.assign({}, c, { semTipos: tipos, chaveBuild: c.chaveBuild + "~sem:" + tipos.join("+") }); }
  function motorSemEsse(time, c, novo) { return time.map(function (x) { return x === c ? novo : x; }); }
  function motorAux(ctx, chave, faz) { var v = ctx.cache.aux[chave]; return v !== undefined ? v : motorGuardar(ctx.cache, "aux", chave, faz()); }
  function motorLutasDeProva(ctx) { return ctx.lutas.amostra; }
  function motorAssinaturaDasLutas(ctx) { return motorLutasDeProva(ctx).map(function (l) { return l.chave; }).join(";"); }

  // ---- condições que uma build ARMA (clima por habilidade, tela/Tailwind/Trick Room por golpe) ----
  // Só o que o simulador realmente modela: clima por habilidade de entrada (armadoresDeClima, a mesma regra da estratégia de clima) e os
  // golpes de lado da Fase B1. Rain Dance & cia. por golpe não entram: o motor da luta não os usa.
  function motorCondicoes(ctx, c) {
    return motorAux(ctx, "cond|" + c.chaveBuild, function () {
      var out = [], u = motorUnidade(ctx, c, ctx.lutas.amostra[0].nivel);
      armadoresDeClima([c]).forEach(function (a) {
        if (a.abForcada !== undefined && ABILITY_ID_BY_NAME[c.build.ability] !== a.abForcada) return; // a build não leva a habilidade que arma
        if (out.some(function (o) { return o.id === "clima:" + a.clima; })) return;
        out.push({ id: "clima:" + a.clima, tipo: "clima", clima: a.clima, rotulo: MOTOR_ROTULO_CLIMA[a.clima] || a.clima, via: a.habilidade });
      });
      (u.statusIds || []).forEach(function (id) {
        var p = planoDoGolpeStatus(id);
        if (!p || ["tela", "vento", "sala"].indexOf(p.tipo) === -1) return;
        var idc = p.tipo + (p.cat || "");
        if (out.some(function (o) { return o.id === idc; })) return;
        out.push({ id: idc, tipo: p.tipo, cat: p.cat || null, rotulo: MOVES[id][0], via: MOVES[id][0] });
      });
      return out;
    });
  }
  // ---- benefício medido de uma condição para uma build (duelos 1x1 de HP cheio contra o time de cada luta da amostra) ----
  // clima: nota(eu e o rival no clima) - nota(os dois sem clima); lado: nota(com o lado armado) - nota(sem). Média por duelo.
  function motorLutaComClima(ctx, luta, w) {
    return motorAux(ctx, "lc|" + luta.chave + "|" + w, function () { return motorMontarLuta(luta.nome, luta.etapa, w); });
  }
  function motorGanhoDaCondicao(ctx, b, cond) {
    return motorAux(ctx, "ganho|" + b.chaveBuild + "|" + cond.id + "|" + motorAssinaturaDasLutas(ctx), function () {
      var soma = 0, n = 0;
      motorLutasDeProva(ctx).forEach(function (l) {
        if (l.dupla) return;
        var u = motorUnidadeNaLuta(ctx, b, l);
        if (cond.tipo === "clima") {
          if (l.clima) return; // o chefão já tem clima: a luta não mede o do jogador
          var lc = motorLutaComClima(ctx, l, cond.clima);
          if (!lc) return;
          var uc = unidadeDaBuild(b.sp, b.build, l.nivel, cond.clima);
          if (l.buffs.length) uc = meuComBuffsDoGinasio(uc, l.buffs);
          l.foes.forEach(function (f, i) { soma += resultadoDoDuelo(uc, lc.foes[i], l.nivel) - resultadoDoDuelo(u, f, l.nivel); n++; });
        } else {
          var lado = novoLadoDuelo(), sala = 0;
          if (cond.tipo === "vento") lado.vento = DURACAO_LADO_DUELO.vento;
          else if (cond.tipo === "sala") sala = DURACAO_LADO_DUELO.sala;
          else lado[cond.cat === "F" ? "reflect" : cond.cat === "E" ? "luz" : "veu"] = DURACAO_LADO_DUELO.tela;
          l.foes.forEach(function (f) {
            soma += resultadoDoDuelo(u, f, l.nivel, { lados: { eu: lado, foe: novoLadoDuelo() }, sala: sala }) -
              resultadoDoDuelo(u, f, l.nivel, { lados: { eu: novoLadoDuelo(), foe: novoLadoDuelo() }, sala: 0 });
            n++;
          });
        }
      });
      return n ? soma / n : 0;
    });
  }
  // Sinergia do time: para cada condição armada por um membro, os OUTROS membros com benefício medido (>= MOTOR_PROVA_BENEFICIO).
  // score: 0 a 1; cada condição vale min(2, beneficiários) / 2 (dois beneficiários = nota cheia, um = metade); soma limitada a 1.
  function motorSinergia(ctx, time) {
    var itens = [], score = 0;
    time.forEach(function (s) {
      motorCondicoes(ctx, s).forEach(function (cond) {
        var bens = time.filter(function (b) { return b !== s; }).map(function (b) { return { b: b, ganho: motorGanhoDaCondicao(ctx, b, cond) }; })
          .filter(function (x) { return x.ganho >= MOTOR_PROVA_BENEFICIO; }).sort(function (x, y) { return y.ganho - x.ganho || (x.b.sname < y.b.sname ? -1 : 1); });
        if (!bens.length) return;
        score += Math.min(2, bens.length) / 2;
        itens.push({ armador: s, cond: cond, beneficiarios: bens });
      });
    });
    return { score: Math.min(1, score), itens: itens };
  }
  // Peças que a variante "sinergia" põe na lista curta: quem arma algo e os 3 que mais ganham com isso (uma por linha evolutiva).
  // Builds do pipeline (além da top-1) que armam uma condição: o top-1 de Pelipper pode ser Air Blower, e a Drizzle dele é outra build.
  function motorAlternativasArmadoras(ctx, c) {
    if (c.origem === "build-salva") return []; // a build salva do favorito vale como está
    return motorAux(ctx, "alt|" + motorChaveDoContexto(ctx) + "|" + c.sname + "|" + c.chaveBuild + "|" + c.travado, function () {
      var e = ctx.cache.build[motorChaveDoContexto(ctx) + "|" + c.sname], vistos = {}, out = [];
      motorCondicoes(ctx, c).forEach(function (o) { vistos[o.id] = true; });
      ((e && e.todos) || []).forEach(function (t) {
        var b = t.build;
        if (b.item && !liberadoNaRun(ctx.etapa, ctx.cap, { item: b.item })) b = Object.assign({}, b, { item: "" });
        var alt = Object.assign({}, c, { build: b, origem: "pipeline-armador", chaveBuild: c.sname + "|" + motorChaveDaBuild(b) });
        if (alt.chaveBuild === c.chaveBuild) return;
        var novas = motorCondicoes(ctx, alt).filter(function (o) { return !vistos[o.id]; });
        if (!novas.length) return;
        novas.forEach(function (o) { vistos[o.id] = true; });
        out.push(alt);
      });
      return out;
    });
  }
  function motorExtrasDeSinergia(ctx, cands) {
    var out = [];
    var armadores = cands.slice();
    cands.forEach(function (c) { motorAlternativasArmadoras(ctx, c).forEach(function (a) { armadores.push(a); }); });
    armadores.filter(function (c) { return motorCondicoes(ctx, c).length; }).slice(0, 12).forEach(function (s) {
      motorCondicoes(ctx, s).forEach(function (cond) {
        var bens = cands.filter(function (b) { return b.linha !== s.linha; }).map(function (b) { return { b: b, g: motorGanhoDaCondicao(ctx, b, cond) }; })
          .filter(function (x) { return x.g >= MOTOR_PROVA_BENEFICIO; }).sort(function (x, y) { return y.g - x.g || (x.b.sname < y.b.sname ? -1 : 1); }).slice(0, 3);
        if (!bens.length) return;
        out.push(s);
        bens.forEach(function (x) { out.push(x.b); });
      });
    });
    return out.filter(function (c, i, a) { return a.indexOf(c) === i; });
  }

  // ---- registro detalhado de uma luta 1x1 (só do time final; sem cache de propósito: guarda o log, que é grande) ----
  function motorLutaDetalhada(ctx, time, luta) {
    var us = time.map(function (c) { return motorUnidadeNaLuta(ctx, c, luta); });
    var s = simularLutaContraChefao(us, luta.foes, luta.nivel, luta.inicio);
    return { venceu: !!s.venceu, pontos: s.pontos, log: (s.log || []).filter(function (l) { return !l.troca; }).map(function (l) {
      return { meu: l.meu, contra: l.contra, venceu: l.venceu, fracEu: l.fracEu, turnos: l.turnos }; }) };
  }
  // Mesma luta com o clima do jogador ligado (a lógica de montarTimeNoClimaEmPassos, passo a passo).
  function motorSimularComClima(ctx, time, luta, w, idx) {
    var lc = motorLutaComClima(ctx, luta, w);
    if (!lc || luta.clima || luta.dupla) return null;
    var cb = function (u) { return luta.buffs.length ? meuComBuffsDoGinasio(u, luta.buffs) : u; };
    var meus = time.map(function (c) { return unidadeDaBuild(c.sp, c.build, luta.nivel, w); });
    var ini = Object.assign({ lado: novoLadoDuelo(), statusNoFim: [], ultimo: null }, luta.inicio || {}, {
      clima: { duracao: CLIMA_OFICIAL.duracaoTurnos, armadorIdx: idx, meusSem: meus.map(function (u) { return cb(unidadeSemClima(u)); }), foesSem: luta.foes } });
    var s = simularLutaContraChefao(meus.map(cb), lc.foes, luta.nivel, ini), nome = time[idx].sp.n;
    return { pontos: s.pontos, venceu: !!s.venceu, armadorEntrou: (s.log || []).some(function (l) { return l.meu === nome || l.entra === nome; }) };
  }

  // ---- os papéis ----
  function motorFoePorNome(luta, nome) { return luta.foes.filter(function (f) { return (f.nome || f.sp.n) === nome; })[0] || null; }
  // Provas por membro nas lutas da amostra. `det[i]` é o registro da luta i (null na dupla); `rs[i]` o resumo cacheado.
  function motorProvasDosMembros(ctx, time, lutas, det, rs) {
    var bulks = [];
    lutas.forEach(function (l) { if (!l.dupla) l.foes.forEach(function (f) { bulks.push(f.stats[0] * (f.stats[2] + f.stats[4])); }); });
    var corteRobusto = motorMediana(bulks);
    var ehRobusto = function (f) { return f.stats[0] * (f.stats[2] + f.stats[4]) >= corteRobusto; };
    return time.map(function (c) {
      var nome = c.sp.n, p = { nome: nome, lutas: lutas.length, nocautes: 0, robustos: [], sequencias: [], revanches: [], absorveu: [], fecha: [], protege: [] };
      lutas.forEach(function (l, i) {
        var d = det[i];
        if (!d) return;
        d.log.forEach(function (e, k) {
          if (e.meu !== nome) return;
          var ant = k > 0 ? d.log[k - 1] : null, foe = motorFoePorNome(l, e.contra);
          if (e.venceu === true) {
            p.nocautes++;
            if (foe && ehRobusto(foe)) p.robustos.push({ luta: l.nome, alvo: e.contra, turnos: e.turnos });
            if (ant && ant.meu === nome && ant.venceu === true) p.sequencias.push({ luta: l.nome, alvo: e.contra });
            if (ant && ant.meu !== nome && ant.venceu === false && e.turnos <= 2 && foe) {
              var u = motorUnidade(ctx, c, l.nivel), dano = danoNoDuelo(u, foe, l.nivel).melhor;
              var antes = u.stats[5] > foe.stats[5], prio = dano && dano.prio > 0;
              if (antes || prio) p.revanches.push({ luta: l.nome, alvo: e.contra, turnos: e.turnos, por: prio && !antes ? "prioridade" : "velocidade" });
            }
            if (e.turnos >= 3 && e.fracEu >= 0.4) p.absorveu.push({ luta: l.nome, alvo: e.contra, turnos: e.turnos, hpFinal: motorArred(e.fracEu, 2) });
          }
        });
        // fecha: deu o último nocaute de uma luta vencida
        var ult = null;
        d.log.forEach(function (e) { if (e.venceu === true) ult = e; });
        if (d.venceu && ult && ult.meu === nome) p.fecha.push({ luta: l.nome, alvo: ult.contra });
        // protege: derrubou a ameaça da luta (o rival que mais derrubou o time)
        var ameaca = rs[i].ameaca;
        if (ameaca && d.log.some(function (e) { return e.meu === nome && e.contra === ameaca && e.venceu === true; })) p.protege.push({ luta: l.nome, ameaca: ameaca });
      });
      return p;
    });
  }
  // Contrafactuais da luta completa (com e sem o membro / sem os golpes dele de um tipo).
  function motorDeltaSemMembro(ctx, time, c, luta) {
    var cheio = motorSimular(ctx, time, luta), sem = motorSimular(ctx, time.filter(function (x) { return x !== c; }), luta);
    return motorArred(cheio.p - sem.p, 2);
  }
  function motorDeltaSemTipos(ctx, time, c, luta, tipos) {
    var cheio = motorSimular(ctx, time, luta), sem = motorSimular(ctx, motorSemEsse(time, c, motorSemTipos(c, tipos)), luta);
    return motorArred(cheio.p - sem.p, 2);
  }
  function motorTemTipo(ctx, c, tipos) {
    return (motorUnidade(ctx, c, ctx.lutas.amostra[0].nivel).statusIds || []).some(function (id) { var p = planoDoGolpeStatus(id); return p && tipos.indexOf(p.tipo) !== -1; });
  }

  // Classifica o time inteiro. Devolve { membros: [{ papeis, contribuicoes, abstencao }], estilo, tags, condicaoDeVitoria, naoMedidos, tempoMs }.
  function motorClassificar(ctx, time) {
    var t0 = Date.now();
    var lutas = motorLutasDeProva(ctx), det = lutas.map(function (l) { return l.dupla ? null : motorLutaDetalhada(ctx, time, l); });
    var rs = motorAvaliar(ctx, time, lutas), provas = motorProvasDosMembros(ctx, time, lutas, det, rs);
    var membros = time.map(function (c, k) {
      var p = provas[k], papeis = [];
      // wallbreaker: derrubou pelo menos dois dos rivais mais robustos do campo (acima da mediana de HP x (Def+SpD)) e eles são metade ou mais dos nocautes dele
      if (p.robustos.length >= MOTOR_PROVA_MIN_EVENTOS && p.robustos.length * 2 >= p.nocautes)
        papeis.push({ papel: "wallbreaker", prova: { nocautesEmRobustos: p.robustos.length, nocautes: p.nocautes, alvos: p.robustos.slice(0, 4) } });
      // sweeper: tem golpe de setup, encadeou nocautes e, SEM o setup, o time faz pelo menos MOTOR_PROVA_PONTOS a menos na mesma luta
      if (motorTemTipo(ctx, c, ["setup"]) && p.sequencias.length) {
        var seq = null;
        p.sequencias.forEach(function (s) {
          if (seq) return;
          var l = lutas.filter(function (x) { return x.nome === s.luta; })[0], d = motorDeltaSemTipos(ctx, time, c, l, ["setup"]);
          if (d >= MOTOR_PROVA_PONTOS) seq = { luta: s.luta, nocautesSeguidos: p.sequencias.filter(function (x) { return x.luta === s.luta; }).length + 1, pontosGanhosPeloSetup: d };
        });
        if (seq) papeis.push({ papel: "sweeper", prova: seq });
      }
      // revenge killer: entrou depois de um colega cair, agiu antes (velocidade ou prioridade) e derrubou rápido, pelo menos duas vezes
      if (p.revanches.length >= MOTOR_PROVA_MIN_EVENTOS) papeis.push({ papel: "revenge killer", prova: { vezes: p.revanches.length, exemplos: p.revanches.slice(0, 3) } });
      // tanque: aguentou pelo menos dois confrontos longos (3+ turnos) com HP sobrando e ainda derrubou o rival
      if (p.absorveu.length >= MOTOR_PROVA_MIN_EVENTOS) papeis.push({ papel: "tanque", prova: { confrontos: p.absorveu.length, exemplos: p.absorveu.slice(0, 3) } });
      // armador: o efeito isolado dos golpes de armar o campo (tela, Tailwind, Trick Room, Defog, hazard) vale pelo menos MOTOR_PROVA_PONTOS na luta completa
      if (motorTemTipo(ctx, c, MOTOR_TIPOS_DE_ARMAR)) {
        var melhorLado = null;
        lutas.forEach(function (l) {
          var d = motorDeltaSemTipos(ctx, time, c, l, MOTOR_TIPOS_DE_ARMAR);
          if (d >= MOTOR_PROVA_PONTOS && (!melhorLado || d > melhorLado.pontos)) melhorLado = { luta: l.nome, pontos: d };
        });
        if (melhorLado) papeis.push({ papel: "armador", prova: { luta: melhorLado.luta, pontosDoEfeito: melhorLado.pontos } });
      }
      // suporte: os golpes de utilidade dele (status, cura, Taunt, Protect...: o que NÃO é dano nem setup nem armar o campo) valem pelo menos
      // MOTOR_PROVA_PONTOS na luta completa, em pelo menos uma luta. O dano de passagem (pontos parciais) não conta: tira-se só a utilidade.
      var contribui = [];
      if (motorTemTipo(ctx, c, MOTOR_TIPOS_DE_UTILIDADE)) lutas.forEach(function (l) {
        var d = motorDeltaSemTipos(ctx, time, c, l, MOTOR_TIPOS_DE_UTILIDADE);
        if (d >= MOTOR_PROVA_PONTOS) contribui.push({ luta: l.nome, pontos: d });
      });
      if (contribui.length) papeis.push({ papel: "suporte", prova: { lutas: contribui.length, exemplos: contribui.slice(0, 3) } });
      return { sname: c.sname, nome: c.nome, papeis: papeis, abstencao: papeis.length ? null : "nenhuma prova fechou nas " + lutas.length + " lutas da amostra (o rótulo só sai com prova medida)" };
    });
    // ---- tags do time: condição armada + DOIS beneficiários medidos + o time inteiro ganha com ela ----
    var tags = [], sin = motorSinergia(ctx, time);
    sin.itens.forEach(function (it) {
      if (it.beneficiarios.length < 2) return; // armador sem dois beneficiários NÃO ganha a tag
      var idx = time.indexOf(it.armador), pontosCom = 0, pontosSem = 0, entrou = false, usadas = 0;
      lutas.forEach(function (l, i) {
        if (it.cond.tipo === "clima") {
          var r = motorSimularComClima(ctx, time, l, it.cond.clima, idx);
          if (!r) return;
          usadas++; pontosCom += r.pontos; pontosSem += rs[i].p; entrou = entrou || r.armadorEntrou;
        } else {
          usadas++; pontosCom += rs[i].p;
          pontosSem += motorSimular(ctx, motorSemEsse(time, it.armador, motorSemTipos(it.armador, [it.cond.tipo])), l).p;
          entrou = true;
        }
      });
      var delta = motorArred(pontosCom - pontosSem, 2);
      if (!usadas || !entrou || delta <= 0) return; // o time como um todo precisa ganhar com a condição na luta simulada
      tags.push({ tag: (it.cond.tipo === "clima" ? "clima: " : "tática: ") + it.cond.rotulo, armador: it.armador.nome, via: it.cond.via, ganhoDoTime: delta, lutasMedidas: usadas,
        beneficiarios: it.beneficiarios.map(function (x) { return { nome: x.b.nome, ganhoPorDuelo: motorArred(x.ganho, 3) }; }) });
    });
    if (state.archetype && state.archetype.monotype && time.every(function (c) { return serveProMono(c.sp); }))
      tags.push({ tag: "mono " + state.archetype.monotype, armador: null, via: "regra da run", ganhoDoTime: null, lutasMedidas: 0, beneficiarios: [] });
    // ---- contribuição por membro: habilita / abusa / protege / fecha ----
    var vitorias = rs.filter(function (r) { return r.v; }).length;
    membros.forEach(function (m, k) {
      var p = provas[k], con = [];
      tags.filter(function (t) { return t.armador === m.nome; }).forEach(function (t) { con.push({ tipo: "habilita", tag: t.tag, ganhoDoTime: t.ganhoDoTime, beneficiarios: t.beneficiarios.length }); });
      tags.forEach(function (t) { t.beneficiarios.filter(function (b) { return b.nome === m.nome; }).forEach(function (b) { con.push({ tipo: "abusa", tag: t.tag, ganhoPorDuelo: b.ganhoPorDuelo, armador: t.armador }); }); });
      if (p.protege.length >= MOTOR_PROVA_MIN_EVENTOS) con.push({ tipo: "protege", ameacasDerrubadas: p.protege.length, exemplos: p.protege.slice(0, 3) });
      if (p.fecha.length >= MOTOR_PROVA_MIN_EVENTOS) con.push({ tipo: "fecha", vitoriasFechadas: p.fecha.length, de: vitorias });
      m.contribuicoes = con;
    });
    // ---- estilo (Hyper Offense, Bulky Offense, Balance, Stall), pelos papéis PROVADOS ----
    var tem = function (m, r) { return m.papeis.some(function (x) { return x.papel === r; }); };
    var ofens = membros.filter(function (m) { return tem(m, "wallbreaker") || tem(m, "sweeper") || tem(m, "revenge killer"); }).length;
    var tanques = membros.filter(function (m) { return tem(m, "tanque"); }).length;
    var apoio = membros.filter(function (m) { return tem(m, "suporte") || tem(m, "armador"); }).length;
    var estilo = null;
    if (ofens + tanques + apoio > 0) {
      if (ofens >= 4 && tanques === 0) estilo = "Hyper Offense";
      else if (ofens >= 3 && tanques >= 1) estilo = "Bulky Offense";
      else if (ofens <= 1 && tanques + apoio >= 3) estilo = "Stall";
      else estilo = "Balance";
    }
    // ---- condição de vitória: quem fecha as lutas e a ameaça que mais derruba ----
    var fecham = membros.map(function (m, k) { return { nome: m.nome, n: provas[k].fecha.length }; }).filter(function (x) { return x.n > 0; }).sort(function (a, b) { return b.n - a.n || (a.nome < b.nome ? -1 : 1); });
    var ameacas = {};
    rs.forEach(function (r) { if (r.ameaca) ameacas[r.ameaca] = (ameacas[r.ameaca] || 0) + 1; });
    var principal = Object.keys(ameacas).sort(function (a, b) { return ameacas[b] - ameacas[a] || (a < b ? -1 : 1); })[0] || null;
    return { membros: membros, estilo: estilo, estiloProva: { ofensivos: ofens, tanques: tanques, apoio: apoio, membros: time.length }, tags: tags,
      condicaoDeVitoria: { vitoriasNaAmostra: vitorias, lutas: lutas.length, fecham: fecham.slice(0, 3), ameacaPrincipal: principal ? { nome: principal, lutas: ameacas[principal] } : null },
      naoMedidos: ["pivô: o simulador não executa golpe de troca (U-turn, Volt Switch e parecidos), então não há prova medida para esse papel", "terreno e hazards como tag: ainda não implementados"],
      tempoMs: Date.now() - t0 };
  }

  // ---- texto: templates determinísticos sobre os números medidos (nada inventado) ----
  function motorTextos(v) {
    var m = v.metricas, rest = m.restantes, t = [];
    t.push(v.objetivo.nome + " (" + v.objetivo.descricao + ").");
    t.push("Na amostra de " + m.amostra.lutas + " lutas o time vence " + m.amostra.vence + " (pontos médios " + m.amostra.pontosMedios + "); nas " + m.completo.lutas +
      " lutas da run vence " + m.completo.vence + "; daqui para frente (" + rest.lutas + " lutas) vence " + rest.vence + ", derrubando em média " + rest.derrubadosMedios + " Pokémon por luta.");
    if (rest.perdidas.length) t.push("Não vence: " + rest.perdidas.slice(0, 5).join(", ") + (rest.perdidas.length > 5 ? " e mais " + (rest.perdidas.length - 5) : "") + ".");
    if (v.melhorTentativa) t.push("Melhor tentativa com o que há no time e na caixa: vence " + rest.vence + " de " + rest.lutas + " lutas simuladas.");
    var b = v.planoB;
    if (b.trocas && b.trocas.length) t.push("Plano B (luta mais difícil: " + b.luta + (b.ameaca ? ", ameaça: " + b.ameaca : "") + "): " + b.trocas.map(function (x) {
      return "trocar " + x.sai + " por " + x.entra + " (+" + x.deltaPontos + " pontos" + (x.venceAgora && !x.venciaAntes ? ", passa a vencer" : "") + ")"; }).join("; ") + ".");
    else if (b.motivo) t.push("Plano B: " + b.motivo + ".");
    return t.concat(motorTextosDaClassificacao(v));
  }

  // Fase D: estilo, tags, papéis e condição de vitória. Só números que o motorClassificar mediu; sem prova, o texto diz que não há.
  var MOTOR_FRASE_DA_PROVA = {
    wallbreaker: function (p) { return p.nocautesEmRobustos + " dos " + p.nocautes + " nocautes foram em rivais robustos"; },
    sweeper: function (p) { return p.nocautesSeguidos + " nocautes seguidos em " + p.luta + "; sem o setup o time faz " + p.pontosGanhosPeloSetup + " pontos a menos"; },
    "revenge killer": function (p) { return p.vezes + " vezes entrou depois de um colega cair, agiu antes e derrubou em até 2 turnos"; },
    tanque: function (p) { return p.confrontos + " confrontos de 3+ turnos vencidos com pelo menos 40% do HP"; },
    armador: function (p) { return "os golpes de campo dele valem " + p.pontosDoEfeito + " pontos em " + p.luta; },
    suporte: function (p) { return "os golpes de utilidade dele valem " + p.exemplos.map(function (e) { return e.pontos + " pontos em " + e.luta; }).join(", "); }
  };
  function motorTextosDaClassificacao(v) {
    var t = [];
    if (v.estilo) t.push("Estilo: " + v.estilo + " (" + v.estiloProva.ofensivos + " membros ofensivos provados, " + v.estiloProva.tanques + " tanque(s) e " + v.estiloProva.apoio + " de apoio, de " + v.estiloProva.membros + ").");
    else t.push("Estilo: sem prova suficiente para classificar.");
    if (v.tags.length) v.tags.forEach(function (g) {
      t.push(g.armador ? "Tag " + g.tag + ": " + g.armador + " arma (" + g.via + "); " + g.beneficiarios.map(function (b) { return b.nome + " (+" + b.ganhoPorDuelo + " de nota por duelo)"; }).join(" e ") +
        " ganham; o time faz +" + g.ganhoDoTime + " pontos nas " + g.lutasMedidas + " lutas medidas." : "Tag " + g.tag + ": todos os membros têm o tipo da run.");
    });
    else t.push("Sem tag de clima ou tática: nenhuma condição armada teve dois beneficiários medidos e ganho do time.");
    v.membros.forEach(function (m) {
      t.push(m.nome + ": " + (m.papeis.length ? m.papeis.map(function (p) { return p.papel + " (" + MOTOR_FRASE_DA_PROVA[p.papel](p.prova) + ")"; }).join("; ") : "sem papel provado (" + m.abstencao + ")") + ".");
    });
    var cv = v.condicaoDeVitoria;
    t.push("Condição de vitória: o time vence " + cv.vitoriasNaAmostra + " das " + cv.lutas + " lutas da amostra" +
      (cv.fecham.length ? "; quem dá o último nocaute: " + cv.fecham.map(function (x) { return x.nome + " (" + x.n + ")"; }).join(", ") : "") +
      (cv.ameacaPrincipal ? "; a ameaça que mais derruba o time é " + cv.ameacaPrincipal.nome + " (em " + cv.ameacaPrincipal.lutas + (cv.ameacaPrincipal.lutas === 1 ? " luta)" : " lutas)") : "") + ".");
    t.push("Não medido: " + v.naoMedidos.join("; ") + ".");
    return t;
  }
