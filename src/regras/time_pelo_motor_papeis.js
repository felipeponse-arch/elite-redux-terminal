  // ===== src/regras/time_pelo_motor_papeis.js =====
  // Modo Motor do Meu Time, Fase D (papéis por build, tags, sinergia e explicação). Carrega depois de time_pelo_motor.js (mesmo escopo).
  // Limiares da sinergia (proposta a confirmar; ver docs/decisoes_mecanicas.md).
  var MOTOR_PROVA_BENEFICIO = 0.05; // ganho médio de nota por duelo 1x1 (HP cheio) que conta como benefício de uma condição
  var MOTOR_PROVA_SINERGIA_PESO = 0.15; // quanto a sinergia vale no objetivo da 3ª variante (a base é o Battle Rating médio, 0 a 1)
  var MOTOR_ROTULO_CLIMA = ROTULO_CLIMA; // rótulos únicos em campo.js (TK-16)
  function motorUnidadeNaLuta(ctx, c, luta) { var u = motorUnidade(ctx, c, luta.nivel); return luta.buffs.length ? meuComBuffsDoGinasio(u, luta.buffs) : u; }
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

  // ---- papéis, tags e estilo (corte 06/11/2026): sem prova por simulação ----
  // O papel de cada Pokémon é o do rank (SPECIES_ROLE: Pivô, Tanque, Wallbreaker, Sweeper), lido da espécie base da build.
  // O estilo do time é só a contagem desses papéis. A tag de clima/tática vem da sinergia (motorSinergia): quem arma + dois que ganham.
  function motorPapeisDaEspecie(c) {
    var r = SPECIES_ROLE[c.base.sname];
    return (r && r.roles ? r.roles : []).map(function (x) { return ROLE_LABEL_PT[x] || x; });
  }
  function motorClassificar(ctx, time) {
    var membros = time.map(function (c) { return { sname: c.sname, nome: c.nome, papeis: motorPapeisDaEspecie(c) }; });
    var tags = [];
    motorSinergia(ctx, time).itens.forEach(function (it) {
      if (it.beneficiarios.length < 2) return; // armador sem dois beneficiários NÃO ganha a tag
      tags.push({ tag: (it.cond.tipo === "clima" ? "clima: " : "tática: ") + it.cond.rotulo, armador: it.armador.nome, via: it.cond.via,
        beneficiarios: it.beneficiarios.map(function (x) { return { nome: x.b.nome, ganhoPorDuelo: motorArred(x.ganho, 3) }; }) });
    });
    if (state.archetype && state.archetype.monotype && time.every(function (c) { return serveProMono(c.sp); }))
      tags.push({ tag: "mono " + state.archetype.monotype, armador: null, via: "regra da run", beneficiarios: [] });
    var conta = function (rs) { return membros.filter(function (m) { return m.papeis.some(function (p) { return rs.indexOf(p) !== -1; }); }).length; };
    var ofens = conta(["Wallbreaker", "Sweeper"]), tanques = conta(["Tanque"]), apoio = conta(["Pivô"]);
    var estilo = null;
    if (ofens + tanques + apoio > 0) {
      if (ofens >= 4 && tanques === 0) estilo = "Hyper Offense";
      else if (ofens >= 3 && tanques >= 1) estilo = "Bulky Offense";
      else if (ofens <= 1 && tanques + apoio >= 3) estilo = "Stall";
      else estilo = "Balance";
    }
    return { membros: membros, estilo: estilo, estiloProva: { ofensivos: ofens, tanques: tanques, apoio: apoio, membros: time.length }, tags: tags };
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
  function motorTextosDaClassificacao(v) {
    var t = [];
    if (v.estilo) t.push("Estilo: " + v.estilo + " (" + v.estiloProva.ofensivos + " ofensivo(s), " + v.estiloProva.tanques + " tanque(s) e " + v.estiloProva.apoio + " pivô(s), pelo papel de cada espécie no rank, de " + v.estiloProva.membros + ").");
    else t.push("Estilo: nenhum membro tem papel no rank para classificar.");
    if (v.tags.length) v.tags.forEach(function (g) {
      t.push(g.armador ? "Tag " + g.tag + ": " + g.armador + " arma (" + g.via + "); " + g.beneficiarios.map(function (b) { return b.nome + " (+" + b.ganhoPorDuelo + " de nota por duelo)"; }).join(" e ") + " ganham."
        : "Tag " + g.tag + ": todos os membros têm o tipo da run.");
    });
    else t.push("Sem tag de clima ou tática: nenhuma condição armada teve dois beneficiários medidos.");
    v.membros.forEach(function (m) { t.push(m.nome + ": " + (m.papeis.length ? m.papeis.join(", ") : "sem papel definido no rank") + "."); });
    return t;
  }
