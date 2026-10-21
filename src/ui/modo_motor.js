  // ===== src/ui/modo_motor.js =====
  // Modo Motor no Meu Time (ticket time-pelo-motor/01, Fase F2, 21/10/2026). O Modo Motor é o PADRÃO (aprovação do usuário, 21/10):
  // monta o time só com o simulador de duelo do app, sem IA. A IA continua como alternativa selecionável (chip "IA").
  // Só desenho e orquestração: a regra está em src/regras/time_pelo_motor.js (montarTimePeloMotorEmPassos). Este arquivo NUNCA
  // chama claude.use nem pedirIA (tests/unit/modo_motor_sem_ia.test.mjs confere o fonte; a seção 31 do smoke confere a execução).
  //
  // Estado só de tela (não vai para o save): o modo escolhido, os favoritos e o último resultado. Favorito = um Pokémon do time
  // atual que o jogador pede para manter (a vaga dele só escolhe a forma); no máximo os que estão no time.
  var modoDeMontagem = "motor";
  var motorFavoritos = [];
  var motorTela = null;          // { res, chaveCtx, aplicada: chave da variante | null }
  var motorRodando = false;
  var motorCacheDaTela = null;   // o mesmo cache serve a montagem e o aquecimento
  var motorAquecidoPara = "";    // chave do contexto cujas builds já estão no cache
  var motorAquecendo = "";       // chave que está sendo aquecida agora
  var motorAquecimentoDesligado = false; // só a suíte de testes liga (window.__erTest.desligarAquecimentoDoMotor)
  var FATIA_DO_MOTOR_MS = 40;    // quanto o Motor trabalha antes de devolver a vez à tela
  var motorExplicacaoAberta = {};

  function modoMotorCache() { return motorCacheDaTela || (motorCacheDaTela = criarCacheDoMotor()); }
  // O que, se mudar, torna o resultado velho ou o aquecimento inútil: elenco, Etapa, cap, dificuldade, Mega e Monotype.
  function modoMotorChave() {
    return [state.settings.milestone, capOuPadrao(), state.settings.difficulty, levelCapMode(), megaMode(), state.archetype.monotype || "",
      xsDoJogador().slice().sort(function (a, b) { return a - b; }).join(",")].join("|");
  }
  // Favorito pode ser qualquer Pokémon capturado: do time OU da caixa (usuário, 21/10). Devolve os snames, sem repetir, time primeiro.
  function modoMotorCapturados() {
    var vistos = {};
    return xsDoJogador().map(function (x) { return { sp: getSpeciesByX(x), noTime: state.team.indexOf(x) !== -1 }; })
      .filter(function (c) { if (!c.sp || vistos[c.sp.sname]) return false; vistos[c.sp.sname] = true; return true; });
  }
  function modoMotorFavoritosValidos() {
    var meus = modoMotorCapturados().map(function (c) { return c.sp.sname; });
    return motorFavoritos.filter(function (s) { return meus.indexOf(s) !== -1; });
  }
  function modoMotorSegundos(ms) { return (Math.round(ms / 100) / 10).toFixed(1).replace(".", ",") + " s"; }
  function modoMotorEsperar() { return new Promise(function (ok) { setTimeout(ok, 0); }); }

  // ---- aquecimento: as builds top-1 do elenco calculadas com a tela livre, antes do clique (Fase F1) ----
  // Aborta sozinho se o contexto muda no meio (as builds do pipeline leem o level cap do state) ou se uma montagem começa.
  async function modoMotorAquecer() {
    if (motorAquecimentoDesligado || modoDeMontagem !== "motor" || motorRodando) return;
    var chave = modoMotorChave();
    if (motorAquecidoPara === chave || motorAquecendo === chave) return;
    motorAquecendo = chave;
    try {
      await modoMotorEsperar();
      var ctx = contextoDoMotor();
      ctx.cache = modoMotorCache();
      var passos = motorAquecerBuildsEmPassos(ctx), inicio = Date.now();
      while (!passos.next().done) {
        if (Date.now() - inicio >= FATIA_DO_MOTOR_MS) {
          await modoMotorEsperar();
          if (motorRodando || modoDeMontagem !== "motor" || modoMotorChave() !== chave) return;
          inicio = Date.now();
        }
      }
      motorAquecidoPara = chave;
    } catch (e) {
      if (typeof console !== "undefined") console.error(e);
    } finally {
      motorAquecendo = "";
    }
  }

  // ---- montagem em passos, com progresso na tela ----
  var MOTOR_ROTULO_DO_PASSO = { build: "calculando as builds", solo: "medindo cada Pokémon", vaga: "escolhendo os 6", conferencia: "conferindo nas lutas da run",
    "plano-b": "procurando o plano B", papeis: "medindo os papéis", variante: "variante pronta" };
  async function modoMotorMontar() {
    if (motorRodando) return;
    var status = function (t) { var el = document.getElementById("archetype-status"); if (el) el.textContent = t; };
    var monotype = state.archetype.monotype;
    var possiveis = xsDoJogador().filter(function (x) {
      var sp = getSpeciesByX(x);
      return sp && battleUnitsOf(sp).some(function (u) { return serveProMono(u.main); });
    });
    if (!possiveis.length) {
      status(monotype ? "Nenhum Pokémon do tipo " + monotype + " no seu time ou caixa ainda - pegue algum na Dex primeiro." : "Nenhum Pokémon no seu time ou caixa ainda - pegue algum na Dex primeiro.");
      return;
    }
    motorRodando = true;
    var botao = document.getElementById("motor-montar");
    if (botao) { botao.disabled = true; botao.setAttribute("aria-busy", "true"); }
    try {
      status("Montando o seu melhor time…");
      await modoMotorEsperar(); // deixa o texto aparecer antes da conta
      var chaveCtx = modoMotorChave(), ctx = contextoDoMotor(), favoritos = modoMotorFavoritosValidos(), t0 = Date.now();
      ctx.cache = modoMotorCache();
      var passos = montarTimePeloMotorEmPassos(ctx, { favoritos: favoritos }), r, inicio = Date.now(), nVariantes = 0;
      while (!(r = passos.next()).done) {
        if (r.value === "variante") nVariantes++;
        if (Date.now() - inicio >= FATIA_DO_MOTOR_MS) {
          status("Montando sem IA: " + (MOTOR_ROTULO_DO_PASSO[r.value] || "trabalhando") + ", variante " + Math.min(nVariantes + 1, 3) + " de 3… " + modoMotorSegundos(Date.now() - t0));
          await modoMotorEsperar();
          inicio = Date.now();
        }
      }
      motorAquecidoPara = chaveCtx; // a montagem calculou todas as builds do elenco
      var res = r.value;
      res.tempoTelaMs = Date.now() - t0;
      motorTela = { res: res, chaveCtx: chaveCtx, aplicada: null, favoritos: favoritos, confirmando: null, gravacao: "" };
      renderTeamStrategy(state.team.map(getSpeciesByX).filter(Boolean)); // redesenha o painel inteiro: o status vem depois
      status("Time montado em " + modoMotorSegundos(res.tempoTelaMs) + ", sem consultar a IA.");
      var card = document.getElementById("motor-resultado");
      if (card) { card.scrollIntoView({ block: "nearest" }); var h = card.querySelector("h3"); if (h) h.focus(); }
    } catch (e) {
      if (typeof console !== "undefined") console.error(e);
      status("Não consegui montar o time agora - tente de novo.");
    } finally {
      motorRodando = false;
      var b2 = document.getElementById("motor-montar");
      if (b2) { b2.disabled = false; b2.removeAttribute("aria-busy"); }
    }
  }

  // "Ficar com este time" (F5, 21/10): troca o time (a mesma regra de "Usar este time" da IA: o resto vai para a caixa) E grava as builds
  // desses Pokémon com a origem "Sugestão do app" (src/regras/sugestao_do_motor.js). Se a sugestão passaria por cima de uma build que o
  // jogador montou, pede confirmação na tela antes (modoMotorConfirmando); a build dele nunca é apagada: fica como variante.
  function modoMotorVarianteDe(chave) { return motorTela && motorTela.res.variantes.filter(function (x) { return x.chave === chave; })[0]; }
  function modoMotorFicarComVariante(chave, gravarBuilds) {
    var v = modoMotorVarianteDe(chave);
    if (!v) return;
    if (gravarBuilds === undefined) {
      var conflito = planoDeGravarSugestoes(v.membros).filter(function (p) { return p.confirmar; });
      if (conflito.length) {
        motorTela.confirmando = { chave: chave, nomes: conflito.map(function (p) { return p.nome; }) };
        renderTeamStrategy(state.team.map(getSpeciesByX).filter(Boolean));
        var titulo = document.getElementById("motor-confirma-titulo");
        if (titulo) titulo.focus();
        return;
      }
      gravarBuilds = true;
    }
    motorTela.confirmando = null;
    teamRecommendation = { snames: v.membros.map(function (m) { return m.sname; }), reasoning: "Montado pelo app (" + v.objetivo.nome + "), sem IA." };
    if (!applyRecommendedTeam()) { renderTeamStrategy(state.team.map(getSpeciesByX).filter(Boolean)); return; }
    var r = { gravadas: 0, semVaga: [] };
    if (gravarBuilds) {
      acao(["builds", "resumo", "time", "chefao"].concat(v.membros.map(function (m) { return "ficha:" + m.sname; })), function () {
        r = gravarSugestoesDoMotor(v.membros);
        return r.gravadas > 0;
      });
    }
    motorTela.aplicada = chave;
    motorTela.gravacao = !gravarBuilds ? "Só o time foi trocado; nenhuma build foi gravada."
      : r.gravadas + " build(s) gravada(s) como \"" + SUGESTAO_ROTULO + "\"." + (r.semVaga.length ? " Sem vaga (já têm 3 builds suas): " + r.semVaga.join(", ") + "." : "");
    renderTeamStrategy(state.team.map(getSpeciesByX).filter(Boolean));
    var botao = document.querySelector('[data-motor-usar="' + chave + '"]');
    if (botao) botao.focus();
  }

  // ---- desenho ----
  function modoMotorSeletorHtml() {
    var motor = modoDeMontagem === "motor";
    return '<div class="archetype-axis"><span class="archetype-axis-label" id="modo-montagem-rotulo">Como montar o time</span>' +
      '<div class="archetype-chips" role="group" aria-labelledby="modo-montagem-rotulo">' +
        '<button type="button" class="modo-chip' + (motor ? " active" : "") + '" id="modo-montagem-motor" data-modo="motor" aria-pressed="' + motor + '" title="Monta pelo simulador de duelo do app, sem gastar a sua conta de IA">Automático (sem IA)</button>' +
        '<button type="button" class="modo-chip' + (!motor ? " active" : "") + '" id="modo-montagem-ia" data-modo="ia" aria-pressed="' + !motor + '" title="Pede a composição, as builds e o guia ao Claude">IA (Claude)</button>' +
      '</div></div>';
  }
  function modoMotorFavoritosHtml() {
    var capturados = modoMotorCapturados();
    if (!capturados.length) return "";
    var fav = modoMotorFavoritosValidos();
    return '<div class="archetype-axis"><span class="archetype-axis-label" id="motor-fav-rotulo">Manter no time (opcional)</span>' +
      '<div class="archetype-chips" role="group" aria-labelledby="motor-fav-rotulo">' + capturados.map(function (c) {
        var on = fav.indexOf(c.sp.sname) !== -1, onde = c.noTime ? "no time" : "na caixa";
        return '<button type="button" class="modo-chip' + (on ? " active" : "") + '" data-motor-fav="' + escapeHtml(c.sp.sname) + '" aria-pressed="' + on + '" title="' + escapeHtml(c.sp.n) + ' está ' + onde + '">' +
          escapeHtml(c.sp.n) + (c.noTime ? "" : ' <span class="motor-fav-caixa">(caixa)</span>') + '</button>';
      }).join("") + '</div>' +
      '<p class="mybuild-hint motor-fav-dica">Vale para qualquer Pokémon que você capturou, do time ou da caixa. Quem você marca nunca sai; o app só escolhe a forma (base ou Mega) e completa as outras vagas.</p></div>';
  }
  function modoMotorBotaoHtml() {
    return '<button id="motor-montar" class="add-team-btn" type="button" title="Monta o melhor time pelo simulador de duelo do app, sem consultar a IA">Montar meu melhor time</button>';
  }

  var MOTOR_ORIGEM_ROTULO = { pipeline: "build sugerida pelo jogo", "build-salva": "sua build salva", fallback: "melhor set do simulador" };
  function modoMotorMembroHtml(m) {
    var papeis = m.papeis.length
      ? m.papeis.map(function (p) { return '<span class="plano-chip">' + escapeHtml(p.papel) + '</span>'; }).join(" ") +
        '<span class="motor-prova">' + m.papeis.map(function (p) { return escapeHtml(p.papel + ": " + MOTOR_FRASE_DA_PROVA[p.papel](p.prova)); }).join("; ") + '.</span>'
      : '<span class="motor-prova">Sem papel provado: ' + escapeHtml(m.abstencao || "") + '.</span>';
    var b = m.build || {};
    return '<li class="motor-membro">' + spriteImgHtml(m.x, m.nome, 32) +
      '<div class="motor-membro-corpo"><div class="motor-membro-nome"><span class="goto-species" tabindex="0" role="button" data-x="' + m.x + '">' + escapeHtml(m.nome) + '</span>' +
        (m.travado ? ' <span class="plano-chip">favorito</span>' : "") + '</div>' +
        '<div class="motor-build">' + escapeHtml([b.ability, b.item, (b.moves || []).join(", ")].filter(Boolean).join(" · ")) +
          ' <span class="motor-origem">(' + escapeHtml(MOTOR_ORIGEM_ROTULO[m.origem] || m.origem) + ')</span></div>' +
        '<div class="motor-papeis">' + papeis + '</div></div></li>';
  }
  function modoMotorRodapeHtml(v, aplicada) {
    var c = motorTela.confirmando;
    if (c && c.chave === v.chave) {
      return '<div class="motor-confirma" role="group" aria-labelledby="motor-confirma-titulo">' +
        '<h5 id="motor-confirma-titulo" tabindex="-1">Você já tem build própria: ' + c.nomes.map(escapeHtml).join(", ") + '</h5>' +
        '<p class="mybuild-hint">Se gravar, a sugestão do app vira a build ativa desses Pokémon. A sua build não é apagada: continua guardada como variante e dá para voltar a ela nos botões da build na ficha.</p>' +
        '<div class="plano-rodape"><button type="button" class="add-team-btn" data-motor-confirmar="gravar">Ficar com o time e gravar as builds</button>' +
        '<button type="button" class="add-team-btn" data-motor-confirmar="so-time">Ficar só com o time</button>' +
        '<button type="button" class="add-team-btn" data-motor-confirmar="cancelar">Cancelar</button></div></div>';
    }
    return '<div class="plano-rodape"><button type="button" class="add-team-btn" data-motor-usar="' + v.chave + '"' + (aplicada ? " disabled" : "") + '>' +
      (aplicada ? "Time em uso" : "Ficar com este time") + '</button>' +
      '<span class="mybuild-hint">' + (aplicada && motorTela.gravacao ? escapeHtml(motorTela.gravacao)
        : 'Troca o time e grava a build de cada um como "' + SUGESTAO_ROTULO + '"; a build que você montou nunca é apagada.') + '</span></div>';
  }
  function modoMotorVarianteHtml(v) {
    var rest = v.metricas.restantes, aplicada = motorTela.aplicada === v.chave;
    var tags = (v.tags || []).map(function (g) {
      return '<li>' + (g.armador
        ? 'Tag <b>' + escapeHtml(g.tag) + '</b>: ' + escapeHtml(g.armador) + ' arma (' + escapeHtml(g.via) + '); ' +
          g.beneficiarios.map(function (x) { return escapeHtml(x.nome) + ' (+' + x.ganhoPorDuelo + ' de nota por duelo)'; }).join(" e ") + ' ganham; o time faz +' + g.ganhoDoTime + ' pontos nas ' + g.lutasMedidas + ' lutas medidas.'
        : 'Tag <b>' + escapeHtml(g.tag) + '</b>: todos os membros têm o tipo da run.') + '</li>';
    }).join("");
    var b = v.planoB;
    var planoB = b.trocas && b.trocas.length
      ? 'Plano B (luta mais difícil: ' + escapeHtml(b.luta) + (b.ameaca ? ', ameaça: ' + escapeHtml(b.ameaca) : "") + '): ' + b.trocas.map(function (x) {
          return 'trocar ' + escapeHtml(x.sai) + ' por ' + escapeHtml(x.entra) + ' (+' + x.deltaPontos + ' pontos' + (x.venceAgora && !x.venciaAntes ? ', passa a vencer' : "") + ')'; }).join("; ") + '.'
      : 'Plano B: ' + escapeHtml(b.motivo || "sem troca que melhore") + '.';
    return '<section class="motor-variante" aria-labelledby="motor-v-' + v.chave + '">' +
      '<h4 id="motor-v-' + v.chave + '">' + escapeHtml(v.objetivo.nome) + '</h4>' +
      '<p class="mybuild-hint">' + escapeHtml(v.objetivo.descricao.charAt(0).toUpperCase() + v.objetivo.descricao.slice(1)) + '.</p>' +
      '<div class="motor-chips"><span class="plano-chip plano-chip-forte">Vence ' + rest.vence + ' de ' + rest.lutas + ' lutas daqui para frente</span>' +
        '<span class="plano-chip">Estilo: ' + escapeHtml(v.estilo || "sem prova suficiente") + '</span></div>' +
      (v.melhorTentativa ? '<p class="plano-faltou-build">Melhor tentativa com o que você tem: o time não vence metade das lutas que faltam.</p>' : "") +
      '<ol class="motor-membros">' + v.membros.map(modoMotorMembroHtml).join("") + '</ol>' +
      (tags ? '<ul class="motor-tags">' + tags + '</ul>' : '<p class="mybuild-hint">Sem tag de clima ou tática: nenhuma condição armada teve dois beneficiários medidos.</p>') +
      '<p class="mybuild-hint">' + planoB + '</p>' +
      (v.avisos.length ? '<ul class="motor-avisos">' + v.avisos.map(function (a) { return '<li>' + escapeHtml(a) + '</li>'; }).join("") + '</ul>' : "") +
      '<details class="motor-explicacao" data-chave="' + v.chave + '"' + (motorExplicacaoAberta[v.chave] ? " open" : "") + '><summary>Por que este time</summary><ul>' +
        v.explicacao.map(function (t) { return '<li>' + escapeHtml(t) + '</li>'; }).join("") + '</ul></details>' +
      modoMotorRodapeHtml(v, aplicada) +
    '</section>';
  }
  function modoMotorResultadoHtml() {
    if (!motorTela || motorTela.chaveCtx !== modoMotorChave()) return "";
    var res = motorTela.res;
    return '<div class="card ts-generated-team motor-resultado" id="motor-resultado"><h3 tabindex="-1">Seu melhor time <span class="plano-chip">sem IA</span></h3>' +
      '<p class="mybuild-hint">Montado pelo simulador de duelo do app (o mesmo do rank) em ' + modoMotorSegundos(res.tempoTelaMs) + '. A mesma entrada dá sempre o mesmo resultado. ' +
        'São três variantes com objetivos diferentes, medidas na mesma régua; escolha a que combina com a sua run.</p>' +
      (res.avisos.length ? '<ul class="motor-avisos">' + res.avisos.map(function (a) { return '<li>' + escapeHtml(a) + '</li>'; }).join("") + '</ul>' : "") +
      res.variantes.map(modoMotorVarianteHtml).join("") + '</div>';
  }

  // ---- eventos (delegação no painel, que é redesenhado) ----
  (function () {
    var painel = document.getElementById("team-strategy");
    function redesenhar() { renderTeamStrategy(state.team.map(getSpeciesByX).filter(Boolean)); }
    painel.addEventListener("toggle", function (e) {
      if (e.target.classList && e.target.classList.contains("motor-explicacao")) motorExplicacaoAberta[e.target.dataset.chave] = e.target.open;
    }, true);
    painel.addEventListener("click", function (e) {
      var alvo = e.target.closest("button");
      if (!alvo || !painel.contains(alvo)) return;
      if (alvo.id === "motor-montar") { modoMotorMontar(); return; }
      if (alvo.dataset.modo) {
        modoDeMontagem = alvo.dataset.modo;
        redesenhar();
        var novo = document.getElementById("modo-montagem-" + modoDeMontagem);
        if (novo) novo.focus();
        if (modoDeMontagem === "motor") modoMotorAquecer();
        return;
      }
      if (alvo.dataset.motorFav) {
        var s = alvo.dataset.motorFav, i = motorFavoritos.indexOf(s);
        if (i === -1) motorFavoritos.push(s); else motorFavoritos.splice(i, 1);
        redesenhar();
        var de = document.querySelector('[data-motor-fav="' + s + '"]');
        if (de) de.focus();
        return;
      }
      if (alvo.dataset.motorUsar) { modoMotorFicarComVariante(alvo.dataset.motorUsar); return; }
      if (alvo.dataset.motorConfirmar && motorTela && motorTela.confirmando) {
        var chave = motorTela.confirmando.chave, o = alvo.dataset.motorConfirmar;
        if (o === "cancelar") {
          motorTela.confirmando = null;
          redesenhar();
          var voltar = document.querySelector('[data-motor-usar="' + chave + '"]');
          if (voltar) voltar.focus();
        } else modoMotorFicarComVariante(chave, o === "gravar");
      }
    });
  })();
