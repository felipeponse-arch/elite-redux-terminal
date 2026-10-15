  // ===== src/ui/quem_resolve.js =====
  // "Quem derruba este chefão" (ticket docs/tickets/pipeline-build-2026-10-14/04): o caso B do pipeline (especiesQueResolvem,
  // src/regras/pipeline_build.js) na aba Chefões. Só desenho: a regra (quem derruba, ordem, origem) é do módulo; o cartão de cada
  // Pokémon é o mesmo do ticket 02 (pipelineCandidatoHtml, em pipeline_tela.js). Semi-automático: o card nasce recolhido e cada
  // Pokémon do chefão só calcula quando o jogador o abre (custa alguns segundos por Pokémon), com cache.

  var DEMAIS_SIMULADOS_QUEM_RESOLVE = 24; // as melhores do rank que ainda não estão no time nem na caixa
  var MAX_DO_TIME_QUEM_RESOLVE = 6;
  var MAX_DOS_DEMAIS_QUEM_RESOLVE = 5;
  var quemResolveCache = {};
  // O que o jogador deixou aberto, por chefão: { card: bool, m: { indice: true } } (o redesenho do detalhe não fecha nada).
  var quemResolveAbertos = {};

  function quemResolveEstadoDe(nome) { return quemResolveAbertos[nome] || (quemResolveAbertos[nome] = { card: false, m: {} }); }

  // A lista do módulo lê o time, a caixa, o Monotype, a Etapa e os buffs de ginásio: tudo isso entra na chave.
  function quemResolveChave(boss, idx) {
    return [boss.name, idx, getCurrentCap(), JSON.stringify(state.settings), state.team.join(","), state.box.join(","),
      JSON.stringify(state.archetype), JSON.stringify(state.gymSkillsCleared)].join("|");
  }
  function quemResolveEmCache(boss, idx) { return quemResolveCache[quemResolveChave(boss, idx)] || null; }
  function quemResolveCalcular(boss, idx) {
    var chave = quemResolveChave(boss, idx);
    if (!quemResolveCache[chave]) {
      var chaves = Object.keys(quemResolveCache);
      if (chaves.length > 40) delete quemResolveCache[chaves[0]];
      try {
        quemResolveCache[chave] = { lista: especiesQueResolvem({ chefao: boss, indice: idx },
          { demais: DEMAIS_SIMULADOS_QUEM_RESOLVE, max: MAX_DO_TIME_QUEM_RESOLVE, maxDemais: MAX_DOS_DEMAIS_QUEM_RESOLVE }) };
      } catch (e) {
        return { lista: [], erro: "Não consegui calcular agora: " + (e && e.message ? e.message : e) };
      }
    }
    return quemResolveCache[chave];
  }

  function quemResolveOrigemHtml(e) {
    var texto = e.origem === "time" ? "No seu time" : e.origem === "caixa" ? "Na sua caixa"
      : "Fora da caixa" + ((rankDe(e.sp.sname) || {}).etapa !== undefined ? " - dá para pegar desde a Etapa " + rankDe(e.sp.sname).etapa : "");
    return '<span class="qr-origem ' + (e.origem === "outros" ? "fora" : "meu") + '">' + escapeHtml(texto) + '</span>';
  }

  function quemResolveItemHtml(e) {
    return '<section class="pipe-membro qr-item"><div class="pipe-membro-cab">' + spriteImgHtml(e.sp.x, e.sp.n, 40) +
      '<span class="pipe-membro-nome">' + escapeHtml(e.sp.n) + '</span>' + quemResolveOrigemHtml(e) +
      '<button class="text-action-btn goto-species pipe-ver" data-x="' + e.sp.x + '" tabindex="0" role="button" type="button" title="Abre a ficha de ' + escapeHtml(e.sp.n) + '">Abrir a ficha</button></div>' +
      pipelineCandidatoHtml(e.candidato, 0, true, false) + '</section>';
  }

  function quemResolveListaHtml(res, nomeDoAlvo) {
    if (res.erro) return '<p class="pipe-vazio">' + escapeHtml(res.erro) + '</p>';
    var meus = res.lista.filter(function (e) { return e.origem !== "outros"; });
    var fora = res.lista.filter(function (e) { return e.origem === "outros"; });
    if (!res.lista.length) {
      return '<p class="pipe-vazio">Ninguém do seu time, da sua caixa nem das ' + DEMAIS_SIMULADOS_QUEM_RESOLVE + ' melhores do rank já disponíveis derruba ' +
        escapeHtml(nomeDoAlvo) + ' em até 2 golpes. Veja os golpes de cobertura na aba Meu Time.</p>';
    }
    var html = "";
    if (meus.length) html += '<h4 class="qr-grupo">Do seu time e da sua caixa</h4>' + meus.map(quemResolveItemHtml).join("");
    else html += '<p class="pipe-vazio">Ninguém do seu time ou da sua caixa derruba ' + escapeHtml(nomeDoAlvo) + ' em até 2 golpes.</p>';
    if (fora.length) html += '<h4 class="qr-grupo">Fora da sua caixa (as melhores do rank na Etapa)</h4>' + fora.map(quemResolveItemHtml).join("");
    return html;
  }

  // Preenche o corpo de um Pokémon do chefão. Sem cache, mostra "Calculando" e deixa a tela pintar antes de calcular.
  function quemResolvePreencher(bossIdx, idx) {
    var boss = BOSSES[bossIdx];
    var corpo = document.getElementById("qr-corpo-" + idx);
    if (!boss || !corpo) return;
    var nome = (boss.party && boss.party[idx] && boss.party[idx].n) || "este Pokémon";
    var pronto = quemResolveEmCache(boss, idx);
    if (pronto) { corpo.innerHTML = quemResolveListaHtml(pronto, nome); return; }
    corpo.innerHTML = '<p class="pipe-vazio" role="status">Calculando contra ' + escapeHtml(nome) + '… leva alguns segundos.</p>';
    setTimeout(function () {
      if (bossState.selected !== bossIdx || !document.getElementById("qr-corpo-" + idx)) return; // o jogador saiu daqui
      var res = quemResolveCalcular(boss, idx);
      var vivo = document.getElementById("qr-corpo-" + idx);
      if (vivo) vivo.innerHTML = quemResolveListaHtml(res, nome);
    }, 30);
  }

  // O card inteiro, para o detalhe do chefão. `party`/`diffKey` são os que a tela mostra.
  function quemResolveCardHtml(boss, diffKey, party) {
    var tier = DIFF_TO_BOSSKEY[state.settings.difficulty] || "party";
    var chaveDoJogador = boss[tier] && boss[tier].length ? tier : "party";
    var est = quemResolveEstadoDe(boss.name);
    var corpo;
    if (diffKey !== chaveDoJogador) {
      corpo = '<p class="pipe-vazio">A conta usa o time que o chefão tem na sua Dificuldade (' + escapeHtml(DIFF_LABELS[chaveDoJogador] || chaveDoJogador) +
        '). Volte para essa variante acima para ver quem derruba cada Pokémon.</p>';
      return '<details class="card qr-card" id="boss-quem-resolve"><summary>Quem derruba este chefão</summary><div class="qr-corpo-card">' + corpo + '</div></details>';
    }
    corpo = '<p class="mybuild-hint">Para cada Pokémon dele: quem do seu time e da sua caixa o derruba em 1 ou 2 golpes, e depois as melhores do rank que você ainda não tem. ' +
      'Só calcula quando você abre o Pokémon. Mesma conta do botão "Ver sugestões do jogo" da ficha.</p>' +
      party.map(function (m, i) {
        return '<details class="qr-membro" data-idx="' + i + '"' + (est.m[i] ? " open" : "") + '><summary>' + spriteImgHtml(m.x, m.n, 32) +
          '<span class="qr-membro-nome">' + (i + 1) + '. ' + escapeHtml(m.n) + '</span></summary><div class="qr-corpo" id="qr-corpo-' + i + '"></div></details>';
      }).join("");
    return '<details class="card qr-card" id="boss-quem-resolve"' + (est.card ? " open" : "") + '><summary>Quem derruba este chefão</summary><div class="qr-corpo-card">' + corpo + '</div></details>';
  }

  // Depois de cada redesenho do detalhe: o que estava aberto volta a ser preenchido (do cache; o resto calcula).
  function quemResolveRestaurar() {
    var boss = BOSSES[bossState.selected];
    if (!boss) return;
    var est = quemResolveEstadoDe(boss.name);
    if (!est.card) return;
    Object.keys(est.m).forEach(function (i) { if (est.m[i]) quemResolvePreencher(bossState.selected, parseInt(i, 10)); });
  }

  // `toggle` não borbulha: ouvinte na captura, uma vez, no detalhe do chefão.
  (function () {
    var detalhe = document.getElementById("boss-detail");
    if (!detalhe) return;
    detalhe.addEventListener("toggle", function (e) {
      var el = e.target;
      var boss = BOSSES[bossState.selected];
      if (!boss || !el || !el.tagName || el.tagName !== "DETAILS") return;
      var est = quemResolveEstadoDe(boss.name);
      if (el.id === "boss-quem-resolve") {
        est.card = el.open;
        // Abrir o card já abre o primeiro Pokémon (o que o jogador enfrenta primeiro), sem outro clique.
        var primeiro = el.querySelector(".qr-membro");
        if (el.open && primeiro && !Object.keys(est.m).some(function (i) { return est.m[i]; })) primeiro.open = true;
      } else if (el.classList.contains("qr-membro")) {
        var idx = parseInt(el.dataset.idx, 10);
        est.m[idx] = el.open;
        if (el.open) quemResolvePreencher(bossState.selected, idx);
      }
    }, true);
  })();
