  // ===== src/ui/pipeline_tela.js =====
  // Pipeline de build na tela (ticket docs/tickets/pipeline-build-2026-10-14/02): só desenho. As regras (candidatos, hit-kill,
  // selo, motivos) são de src/regras/pipeline_build.js (candidatosDeBuild); aqui nada é calculado além de montar texto e HTML.
  // Dois lugares: (a) botão "Ver sugestões do jogo" no editor "Meu build" da ficha; (b) bloco "Sugestões do jogo para o time"
  // na aba Meu Time. Sem IA e sem gravar nada: "Usar no editor" só preenche os campos, quem grava é o "Salvar build" de sempre.

  var pipelineCache = {};
  // Ficha: qual espécie tem o painel aberto e contra qual alvo ("" = o padrão, o próximo líder de ginásio).
  var pipelineFicha = { sname: null, alvo: "" };
  var pipelineTimeAlvo = "";

  // Resultado de candidatosDeBuild com cache: o módulo é puro, então a chave é tudo o que ele lê do estado que muda
  // (espécie, level cap, configurações da run e alvo). Se mudar, a chave muda.
  function pipelineResultado(sp, alvoNome) {
    alvoNome = pipelineAlvoValido(alvoNome);
    var chave = sp.sname + "|" + getCurrentCap() + "|" + JSON.stringify(state.settings) + "|" + alvoNome;
    if (!pipelineCache[chave]) {
      var chaves = Object.keys(pipelineCache);
      if (chaves.length > 60) delete pipelineCache[chaves[0]];
      pipelineCache[chave] = candidatosDeBuild(sp, alvoNome ? { alvo: { chefao: alvoNome } } : {});
    }
    return pipelineCache[chave];
  }

  // O alvo lembrado some se o chefão já não falta na Etapa (o jogador avançou): volta ao padrão.
  function pipelineAlvoValido(nome) {
    if (!nome) return "";
    return getRemainingBossEntries().some(function (b) { return b.name === nome; }) ? nome : "";
  }

  // Seletor "Contra": o padrão (próximo líder de ginásio) e os chefões que ainda faltam na Etapa.
  function pipelineSeletorDeAlvoHtml(id, atual) {
    atual = pipelineAlvoValido(atual);
    var vistos = {};
    var opcoes = '<option value=""' + (atual === "" ? " selected" : "") + '>Próximo líder de ginásio (padrão)</option>';
    getRemainingBossEntries().forEach(function (b) {
      if (vistos[b.name]) return;
      vistos[b.name] = true;
      opcoes += '<option value="' + escapeHtml(b.name) + '"' + (atual === b.name ? " selected" : "") + '>' + escapeHtml(b.name) + '</option>';
    });
    return '<label class="pipe-alvo-campo" for="' + id + '">Contra</label>' +
      '<select id="' + id + '" class="campo campo-ajuste pipe-alvo-select">' + opcoes + '</select>';
  }

  // "Roxanne 1: Geodude e o ás Nosepass" (o módulo mede o primeiro Pokémon e o ás; vale o pior dos dois).
  function pipelineResumoDoAlvo(res) {
    if (!res.alvo) return res.aviso ? res.aviso.charAt(0).toUpperCase() + res.aviso.slice(1) : "Sem chefão adiante";
    var p = res.alvo.pokemon || [];
    var quem = p.length > 1 ? p[0] + " e o ás " + p[p.length - 1] : (p[0] || "");
    return (res.alvo.chefao || "Alvo informado") + (quem ? ": " + quem : "");
  }

  function pipelineVereditoDe(c, temAlvo) {
    if (!temAlvo) return { classe: "k0", texto: "Só por sinergia (sem alvo para medir)", ordem: "" };
    var ordem = c.hitKill > 0
      ? (c.baterPrimeiro ? "bate primeiro por " + (c.porQue === "prioridade" ? "prioridade" : "velocidade") : "o alvo age antes")
      : "";
    if (c.hitKill === 1) return { classe: "k1", texto: (c.garantido && !c.alvoAgeAntes && c.rotulo === "calibrada" ? "Derruba em 1 golpe" : "Provável derrubar em 1 golpe"), ordem: ordem };
    if (c.hitKill === 2) return { classe: "k2", texto: (c.garantido && !c.alvoAgeAntes && c.rotulo === "calibrada" ? "Derruba em 2 golpes" : "Provável derrubar em 2 golpes"), ordem: ordem };
    return { classe: "k0", texto: "Não derruba em 2 golpes", ordem: "" };
  }

  function pipelineSeloHtml(c) {
    var calc = c.rotulo === "calibrada";
    return '<span class="pipe-selo ' + (calc ? "calc" : "est") + '" title="' + escapeHtml(calc
      ? "O número vem do mesmo cálculo do jogo (motor do duelo do app)."
      : "O motor do app não cobre tudo nesta conta; trate o número como estimativa.") + '">' +
      (calc ? '<span aria-hidden="true">&#10003; </span>' : '<span aria-hidden="true">~ </span>') + escapeHtml(c.selo) + '</span>';
  }

  function pipelineGolpeHtml(nome) {
    var mv = MOVE_BY_NAME[nome];
    return '<span class="pipe-golpe">' + (mv && TYPES[mv[1]] ? typePip(TYPES[mv[1]]) : "") + escapeHtml(nome) + '</span>';
  }

  // Um candidato. `comBotao`: na ficha ganha o "Usar golpes e habilidade no editor"; no time não (o time só informa).
  // `golpesCartao`: golpes no formato do cartão do Meu Time (cor do tipo e ícone de categoria), usado em "Quem derruba".
  function pipelineCandidatoHtml(c, idx, temAlvo, comBotao, golpesCartao) {
    var v = pipelineVereditoDe(c, temAlvo);
    var inatas = (c.inatas || []).length ? ' &middot; <b>Inatas:</b> ' + escapeHtml(c.inatas.join(", ")) : "";
    var motivos = (c.motivos || []).length
      ? '<ul class="pipe-motivos">' + c.motivos.map(function (m) { return '<li>' + escapeHtml(m) + '</li>'; }).join("") + '</ul>' : "";
    var avisos = (c.avisos || []).length
      ? '<div class="aviso-build"><ul>' + c.avisos.map(function (a) { return '<li>' + escapeHtml(a) + '</li>'; }).join("") + '</ul></div>' : "";
    return '<article class="pipe-cand ' + v.classe + '" aria-label="Sugestão ' + (idx + 1) + '">' +
      '<div class="pipe-cand-topo"><span class="pipe-veredito">' + escapeHtml(v.texto) + '</span>' +
        (v.ordem ? '<span class="pipe-ordem">' + escapeHtml(v.ordem) + '</span>' : "") + '</div>' +
      (golpesCartao ? golpesBuildHtml({ moves: c.golpes }) : '<div class="pipe-golpes">' + c.golpes.map(pipelineGolpeHtml).join("") + '</div>') +
      '<div class="pipe-hab"><b>Habilidade:</b> ' + escapeHtml(c.habilidade) + inatas + '</div>' +
      motivos + avisos +
      '<div class="pipe-rodape">' + pipelineSeloHtml(c) +
        (comBotao ? '<button class="text-action-btn pipe-usar" data-idx="' + idx + '" type="button">Usar golpes e habilidade no editor</button>' : "") +
      '</div></article>';
  }

  // ---------------- (a) ficha ----------------
  function pipelinePainelDaFichaHtml(sp) {
    var res = pipelineResultado(sp, pipelineFicha.alvo);
    var temAlvo = !!res.alvo;
    var cab = '<div class="pipe-alvo">' + pipelineSeletorDeAlvoHtml("mybuild-pipeline-alvo", pipelineFicha.alvo) +
      '<span class="pipe-alvo-resumo">' + escapeHtml(pipelineResumoDoAlvo(res)) + '</span></div>';
    var corpo;
    if (!res.candidatos.length) {
      corpo = '<p class="pipe-vazio">' + escapeHtml(res.aviso || "Nenhuma sugestão para esta espécie nesta Etapa.") + '</p>';
    } else {
      corpo = (!temAlvo && res.aviso ? '<p class="pipe-nota">' + escapeHtml(res.aviso.charAt(0).toUpperCase() + res.aviso.slice(1)) + '. As sugestões abaixo valem só por sinergia.</p>' : "") +
        res.candidatos.map(function (c, i) { return pipelineCandidatoHtml(c, i, temAlvo, true); }).join("");
    }
    return cab + corpo +
      '<p class="mybuild-hint pipe-rodape-nota">Calculado pelo código do app, sem IA. Natureza, item e EVs ficam para você ou para "Gerar build com IA"; nada é salvo até "Salvar build".</p>';
  }

  // Desenha (ou esvazia) o painel da ficha. Chamado ao clicar, ao trocar o alvo e a cada redesenho do editor.
  function pipelineDesenharFicha(sp) {
    var botao = document.getElementById("mybuild-pipeline-ver");
    var painel = document.getElementById("mybuild-pipeline-painel");
    if (!botao || !painel) return;
    var aberto = pipelineFicha.sname === sp.sname;
    botao.setAttribute("aria-expanded", aberto ? "true" : "false");
    botao.textContent = aberto ? "Esconder sugestões do jogo" : "Ver sugestões do jogo";
    painel.hidden = !aberto;
    painel.innerHTML = aberto ? pipelinePainelDaFichaHtml(sp) : "";
  }

  // ---------------- (b) lote: aba Meu Time ----------------
  function pipelineDesenharTime() {
    var det = document.getElementById("team-pipeline");
    var corpo = document.getElementById("team-pipeline-corpo");
    if (!det || !corpo || !det.open) return; // fechado não calcula nada
    var membros = state.team.map(getSpeciesByX).filter(Boolean);
    if (!membros.length) { corpo.innerHTML = '<p class="pipe-vazio">Monte o time para ver as sugestões de cada membro.</p>'; return; }
    var primeiro = pipelineResultado(membros[0], pipelineTimeAlvo);
    var html = '<div class="pipe-alvo">' + pipelineSeletorDeAlvoHtml("team-pipeline-alvo", pipelineTimeAlvo) +
      '<span class="pipe-alvo-resumo">' + escapeHtml(pipelineResumoDoAlvo(primeiro)) + '</span></div>';
    membros.forEach(function (sp) {
      var res = pipelineResultado(sp, pipelineTimeAlvo);
      var topo = res.candidatos[0];
      html += '<section class="pipe-membro"><div class="pipe-membro-cab">' + spriteImgHtml(sp.x, sp.n, 40) +
        '<span class="pipe-membro-nome">' + escapeHtml(sp.n) + '</span>' +
        '<button class="text-action-btn goto-species pipe-ver" data-x="' + sp.x + '" tabindex="0" role="button" type="button" title="Abre a ficha de ' + escapeHtml(sp.n) + '">' +
          (res.candidatos.length > 1 ? "Ver as " + res.candidatos.length + " na ficha" : "Abrir a ficha") + '</button></div>' +
        (topo ? pipelineCandidatoHtml(topo, 0, !!res.alvo, false)
              : '<p class="pipe-vazio">' + escapeHtml(res.aviso || "Nenhuma sugestão para esta espécie nesta Etapa.") + '</p>') +
        '</section>';
    });
    corpo.innerHTML = html;
  }

  // ---------------- ouvintes ----------------
  (function () {
    var painelFicha = document.getElementById("species-detail");
    function especieAberta() { return state.selected !== null && state.selected !== undefined ? getSpeciesByX(state.selected) : null; }
    painelFicha.addEventListener("click", function (e) {
      var botao = e.target.closest("button");
      var sp = especieAberta();
      if (!botao || !painelFicha.contains(botao) || !sp) return;
      if (botao.id === "mybuild-pipeline-ver") {
        pipelineFicha = pipelineFicha.sname === sp.sname ? { sname: null, alvo: pipelineFicha.alvo } : { sname: sp.sname, alvo: pipelineFicha.alvo };
        pipelineDesenharFicha(sp);
      } else if (botao.classList.contains("pipe-usar")) {
        var res = pipelineResultado(sp, pipelineFicha.alvo);
        var c = res.candidatos[parseInt(botao.dataset.idx, 10)];
        if (!c) return;
        var hab = document.getElementById("mybuild-ability");
        if (hab) hab.value = c.habilidade;
        for (var i = 0; i < 4; i++) {
          var mv = document.getElementById("mybuild-move-" + i);
          if (mv) mv.value = c.golpes[i] || "";
        }
        updateMyBuildStatus(sp);
        flashToast("Golpes e habilidade de " + sp.n + " no editor. Falta salvar.");
        var salvar = document.getElementById("mybuild-save");
        if (salvar) salvar.focus();
      }
    });
    painelFicha.addEventListener("change", function (e) {
      var sp = especieAberta();
      if (sp && e.target.id === "mybuild-pipeline-alvo") { pipelineFicha.alvo = e.target.value; pipelineDesenharFicha(sp); var sel = document.getElementById("mybuild-pipeline-alvo"); if (sel) sel.focus(); }
    });
    var det = document.getElementById("team-pipeline");
    if (det) {
      det.addEventListener("toggle", pipelineDesenharTime);
      det.addEventListener("change", function (e) {
        if (e.target.id !== "team-pipeline-alvo") return;
        pipelineTimeAlvo = e.target.value;
        pipelineDesenharTime();
        var sel = document.getElementById("team-pipeline-alvo"); if (sel) sel.focus();
      });
    }
  })();
