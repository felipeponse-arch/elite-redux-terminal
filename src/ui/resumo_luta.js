  // ===== src/ui/resumo_luta.js =====
  // Confronto e resumo da próxima luta (card do chefão, resumo do topo da Dex, card no fim do Time).
  // Interface: lê e desenha a página. Colado no <script> principal por
  // scripts/build.mjs (marcador @ui resumo_luta.js) no MESMO lugar de onde saiu do
  // template (fase 5 da refatoração, 2026-09-24) - a ordem de execução não mudou.

  var CONFRONTO_SIMBOLO = {
    vantagem: ["▲", "vantagem"], seguro: ["◆", "seguro"], neutro: ["●", "neutro"],
    arriscado: ["◐", "arriscado"], desvantagem: ["▼", "desvantagem"]
  };
  function confrontoMultTxt(mult, reducao) { return mult === 0 ? "imune" : "x" + mult + (mult >= 2 ? ", super efetivo" : "") + (reducao ? "; " + reducao : ""); }
  function confrontoNomesTxt(list) {
    return list.map(function (f) { return escapeHtml(f.name); }).join(", ");
  }
  function confrontoCelulaHtml(mineName, foe, d) {
    var s = CONFRONTO_SIMBOLO[d.veredito];
    var o = d.ofensa.best
      ? (d.ofensa.best.move || ("tipo " + d.ofensa.best.type + ", sem build")) + " (" + confrontoMultTxt(d.ofensa.best.mult, d.ofensa.best.reducao) + ")"
      : "sem golpe de dano";
    var a = d.ameaca.worst ? d.ameaca.worst.move + " (" + confrontoMultTxt(d.ameaca.worst.mult, d.ameaca.worst.reducao) + ")" : "nenhum golpe de dano";
    var txt = mineName + " contra " + foe.name + ": " + s[1] + ". Seu melhor golpe: " + o + ". Golpe mais perigoso dele: " + a + ".";
    return '<td class="cf-cell cf-v-' + d.veredito + '" title="' + escapeHtml(txt) + '"><span class="cf-sym" role="img" aria-label="' + escapeHtml(txt) + '">' + s[0] + '</span></td>';
  }
  // Frase única do resumo (usada na ficha do chefão e no resumo da Dex).
  function confrontoResumoTxt(cx) {
    var c = cx.c;
    var partes = [];
    if (c.abertura !== null) partes.push("melhor abertura: <b>" + escapeHtml(cx.minhas[c.abertura].main.n) + "</b>");
    partes.push(c.buracos.length
      ? "sem resposta super efetiva do seu time: " + confrontoNomesTxt(c.buracos)
      : "todo Pokémon dele tem resposta super efetiva no seu time");
    if (c.ameacas.length) partes.push("ameaçam metade ou mais do seu time: " + confrontoNomesTxt(c.ameacas));
    if (c.expostos.length) {
      partes.push("ficam expostos ao que ele ataca: " + c.expostos.map(function (i) { return escapeHtml(cx.minhas[i].main.n); }).join(", "));
    }
    return partes.join("; ") + ".";
  }
  // A troca pode melhorar as respostas sem fechar nenhum buraco (ex: 5 → 5): dizer
  // "buracos 5 → 5" parecia que a sugestão não servia pra nada.
  function trocaBuracosTxt(t) {
    return t.buracosAntes === t.buracosDepois ? "melhora as respostas do time, sem fechar buracos" : "buracos " + t.buracosAntes + " → " + t.buracosDepois;
  }
  // Texto do que fazer sobre os buracos e a troca da caixa (fase 3).
  function confrontoAjustesHtml(cx) {
    var partes = [];
    coberturaSugerida(cx.minhas, cx.c).forEach(function (s) {
      partes.push('<li>Ensine <b>' + escapeHtml(s.move) + '</b> (' + escapeHtml(s.type) + ') ao <b>' + escapeHtml(cx.minhas[s.idx].main.n) +
        '</b>: fecha ' + confrontoNomesTxt(s.resolve) + '. Troque por um dos 4 golpes atuais.</li>');
    });
    var t = cx.trocas;
    if (t && t.trocas.length) {
      var linhas = t.trocas.map(function (tr) {
        return '<li>' + (tr.sai
          ? 'Entra <b>' + escapeHtml(tr.entra.main.n) + '</b> no lugar de <b>' + escapeHtml(tr.sai.main.n) + '</b>'
          : 'Entra <b>' + escapeHtml(tr.entra.main.n) + '</b> na vaga livre do time') + '.</li>';
      }).join("");
      partes.push('<li>Melhor time da sua caixa para esta luta (' + trocaBuracosTxt(t) + '):<ul>' + linhas + '</ul>' +
        '<button type="button" class="text-action-btn cf-apply-swap" data-trocas="' + escapeHtml(t.trocas.map(function (tr) {
          return (tr.sai ? tr.sai.owned.x : "") + ">" + tr.entra.owned.x;
        }).join(",")) + '">Aplicar ' + (t.trocas.length === 1 ? "esta troca" : "estas " + t.trocas.length + " trocas") + '</button></li>');
    }
    return partes.length ? '<div class="cf-fix"><h4>Como melhorar este confronto</h4><ul>' + partes.join("") + '</ul></div>' : "";
  }
  // Plano de luta (fase 5): tudo derivado do quadro - quem abre, quem responde a
  // cada Pokémon do chefão e o que evitar. Habilidade e item dele saem do dado
  // real; a descrição do item vai no tooltip, na língua do jogador.
  function confrontoPlanoHtml(boss, cx) {
    var c = cx.c;
    var passos = [];
    if (boss.db) {
      var dupla = aberturaEmDupla(cx.minhas, cx.foes);
      if (dupla) passos.push('<li>Batalha em dupla: abra com <b>' + escapeHtml(cx.minhas[dupla.idx[0]].main.n) + '</b> e <b>' + escapeHtml(cx.minhas[dupla.idx[1]].main.n) +
        '</b> contra ' + escapeHtml(dupla.foes[0].name) + ' e ' + escapeHtml(dupla.foes[1].name) + ' (os dois primeiros do time dele)' +
        (dupla.ameacaAosDois ? '; atenção, um mesmo Pokémon dele ameaça os dois' : '') + '.</li>');
    } else if (c.abertura !== null) {
      passos.push('<li>Abra com <b>' + escapeHtml(cx.minhas[c.abertura].main.n) + '</b>.</li>');
    }
    c.linhas.forEach(function (l) {
      var m = l.melhor;
      var itemDesc = l.foe.item ? (ITEM_PT[l.foe.item] || ITEM_DESC[l.foe.item] || "") : "";
      var quem = escapeHtml(l.foe.name) + ' <span class="cf-plan-meta"' + (itemDesc ? ' title="' + escapeHtml(l.foe.item + ": " + itemDesc) + '"' : "") + '>(' +
        escapeHtml(l.foe.ability || "habilidade da forma nova") + (l.foe.item ? ", " + escapeHtml(l.foe.item) : "") + ')</span>';
      var resp;
      if (!m || m.pontos <= 0) resp = 'sem boa resposta no seu time - jogue com cuidado';
      else {
        var o = m.duelo.ofensa.best;
        resp = 'responda com <b>' + escapeHtml(cx.minhas[m.idx].main.n) + '</b>' + (o && o.move && m.duelo.ofensa.classe === "super" ? ' (' + escapeHtml(o.move) + ')' : '');
      }
      passos.push('<li>' + quem + ': ' + resp + '.</li>');
    });
    cuidadosDoChefao(c, cx.minhas, 4).forEach(function (a) {
      passos.push('<li class="cf-plan-warn">Cuidado: ' + escapeHtml(a.foe.name) + ' tem <b>' + escapeHtml(a.move) + '</b> (' + escapeHtml(a.type) + ', ' + confrontoMultTxt(a.mult) + ') contra ' + escapeHtml(cx.minhas[a.idx].main.n) + '.</li>');
    });
    return '<details class="cf-plan"><summary>Plano de luta</summary><ol>' + passos.join("") + '</ol></details>';
  }
  function bossConfrontoHtml(boss, party) {
    var cx = confrontoParaParty(party, true);
    if (!cx) return "";
    var c = cx.c;
    var head = '<tr><th class="cf-foe" scope="col">Chefão</th>' + cx.minhas.map(function (m) {
      return '<th scope="col" title="' + escapeHtml(m.main.n) + '">' + spriteImgHtml(m.main.x, m.main.n, 26) + '</th>';
    }).join("") + '<th class="cf-best" scope="col">Melhor resposta</th></tr>';
    var rows = c.linhas.map(function (l) {
      var foe = l.foe;
      var celulas = l.respostas.map(function (r) { return confrontoCelulaHtml(cx.minhas[r.idx].main.n, foe, r.duelo); }).join("");
      var m = l.melhor;
      var melhorTxt = "-";
      if (m) {
        var quem = cx.minhas[m.idx].main;
        var o = m.duelo.ofensa.best;
        melhorTxt = '<b>' + escapeHtml(quem.n) + '</b>' + (o && o.move && m.duelo.ofensa.classe === "super" ? " (" + escapeHtml(o.move) + ")" : "") +
          (m.pontos < 0 ? " - sem boa resposta" : "");
      }
      return '<tr><th scope="row" class="cf-foe"><span class="cf-foe-cell">' + spriteImgHtml(foe.sp.x, foe.name, 26) +
        '<span>' + escapeHtml(foe.name) + (foe.transformado ? ' <small>vira ' + escapeHtml(foe.sp.n) + '</small>' : "") + '</span></span></th>' +
        celulas + '<td class="cf-best">' + melhorTxt + '</td></tr>';
    }).join("");
    var legenda = Object.keys(CONFRONTO_SIMBOLO).map(function (k) {
      return '<span><span aria-hidden="true">' + CONFRONTO_SIMBOLO[k][0] + '</span> ' + CONFRONTO_SIMBOLO[k][1] + '</span>';
    }).join("");
    var semBuild = cx.minhas.filter(function (m) { return !m.moves; }).map(function (m) { return m.main.n; });
    var notas = [];
    if (semBuild.length) notas.push("Sem build salva para " + escapeHtml(semBuild.join(", ")) + ": assumi os tipos do próprio Pokémon como golpes. Salvar uma build deixa o resultado exato.");
    if (boss.db) notas.push("Batalha em dupla: este quadro trata a luta como 1x1, então o resultado é aproximado.");
    notas.push("Só tipo, habilidade, golpes e itens que o dado do jogo informa. Não calcula dano nem velocidade real (o nível do chefão não está nos dados) e habilidades de chefão que o app ainda não cataloga podem mudar o resultado.");
    return '<div class="card" id="boss-confronto"><h3>Confronto com o seu time</h3>' +
      '<p class="cf-verdict">' + confrontoResumoTxt(cx).replace(/^./, function (ch) { return ch.toUpperCase(); }) + '</p>' +
      '<div class="cf-scroll"><table class="cf-table"><thead>' + head + '</thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="cf-legend">' + legenda + '</div>' +
      confrontoAjustesHtml(cx) +
      confrontoPlanoHtml(boss, cx) +
      notas.map(function (n) { return '<p class="cf-note">' + n + '</p>'; }).join("") +
      '</div>';
  }
  function dashboardConfrontoHtml(nextBoss, cxPronto) {
    var cx = cxPronto || confrontoParaParty(bossPartyPorDificuldade(nextBoss), true);
    if (!cx) return "";
    var troca = "";
    if (cx.trocas && cx.trocas.trocas.length) {
      troca = ' Troca sugerida da caixa: ' + cx.trocas.trocas.map(function (tr) {
        return tr.sai ? escapeHtml(tr.entra.main.n) + ' no lugar de ' + escapeHtml(tr.sai.main.n) : escapeHtml(tr.entra.main.n) + ' entra na vaga livre';
      }).join('; ') + ' (' + trocaBuracosTxt(cx.trocas) + ').';
    }
    return '<div class="dash-item dash-confronto"><span class="dash-label">Confronto</span><span class="dash-value">' +
      escapeHtml(nextBoss.name) + ': ' + confrontoResumoTxt(cx) + troca +
      (cx.c.estimada ? ' <span class="dash-caveat">Parte estimada só pelos tipos (sem build salva).</span>' : '') + '</span></div>';
  }

  // Fase 4 do roadmap (2026-09-12) - "PC Box ganha sugestões gerais de
  // encaixe no time, não só a sugestão única do próximo chefão". Reusa
  // computeSharedRisks() (mesma conta de "Cobertura defensiva"/dashboard,
  // não uma nova fórmula) pra ver se este membro da caixa resolve alguma
  // fraqueza que o time JÁ tem, independente de qual for a próxima luta.
  function boxFitNote(owned, teamMembers) {
    if (!teamMembers.length) return null;
    var risks = computeSharedRisks(teamMembers);
    if (!risks.length) return null;
    var best = null;
    // Unidades de batalha da criatura (battleUnitsOf, conforme o modo de
    // mega) - a nota cita a forma que de fato resolve a fraqueza.
    battleUnitsOf(owned).forEach(function (unit) {
      risks.forEach(function (r) {
        var mult = unitTypeMult(unit, r.t);
        if (mult < 1 && (!best || mult < best.mult)) best = { sp: unit.main, owned: owned, t: r.t, mult: mult, n: r.n };
      });
    });
    if (!best) return null;
    var verb = best.mult === 0 ? "é imune a" : "resiste bem a";
    var who = best.sp.x === owned.x ? escapeHtml(owned.n) : escapeHtml(best.sp.n) + megaOfNote(best);
    return who + " " + verb + " " + best.t + " (fraqueza compartilhada por " + best.n + " do time atual)";
  }

  // Nota curta quando a sugestão é outra forma de quem está no roster -
  // texto muda com o modo de mega, porque a situação real é diferente.
  function megaOfNote(s) {
    if (!s.owned || s.owned.x === s.sp.x) return "";
    if (!isMegaForm(s.sp)) return " (seu " + escapeHtml(s.owned.n) + " na forma base)";
    return megaMode() === "permanente"
      ? " (seu " + escapeHtml(s.owned.n) + " mega-evoluído)"
      : " (seu " + escapeHtml(s.owned.n) + ", que entra na forma base e mega-evolui na luta)";
  }

  function renderDashboard() {
    var el = document.getElementById("dashboard");
    if (!el) return;
    var teamMembers = state.team.map(getSpeciesByX).filter(Boolean);
    if (!teamMembers.length) {
      el.innerHTML = '<div class="dashboard-card"><p style="color:var(--text-dim);font-size:var(--fs-texto);margin:0;">Monte seu time na Dex pra ver um resumo aqui.</p></div>';
      renderNextFightCard();
      return;
    }

    var items = '<div class="dash-item"><span class="dash-label">Time</span><span class="dash-value">' + teamMembers.length + '/6</span></div>';

    var risks = computeSharedRisks(teamMembers);
    items += risks.length
      ? '<div class="dash-item"><span class="dash-label">Maior risco</span><span class="dash-value">' + typePill(risks[0].t, true) + ' <span class="mono">' + risks[0].n + '/' + teamMembers.length + '</span> fracos</span></div>'
      : '<div class="dash-item"><span class="dash-label">Maior risco</span><span class="dash-value">nenhum tipo derruba 2+ ao mesmo tempo</span></div>';

    // Fase 1 do "leitor de caixa" (reunião 2026-09-11) - SÓ a próxima luta que
    // falta, nunca o jogo inteiro (trava explícita do usuário).
    var nextBoss = getRemainingBossEntries()[0];
    var cx = nextFightCx(nextBoss);
    if (nextBoss && cx) {
      var n = cx.c.buracos.length;
      items += '<div class="dash-item dash-next"><span class="dash-label">Próxima luta</span><span class="dash-value"><b>' + escapeHtml(nextBoss.name) + '</b>: ' +
        (n ? n + (n === 1 ? " Pokémon sem resposta super efetiva" : " Pokémon sem resposta super efetiva") : "todos com resposta super efetiva") +
        ' <button type="button" class="dash-more">detalhes</button></span></div>';
    }

    el.innerHTML = '<div class="dashboard-card">' + items + '</div>';
    renderNextFightCard(nextBoss, cx);
  }
  // Detalhe da próxima luta, no fim da aba Time (antes ficava todo no topo da Dex).
  function nextFightDetailHtml(teamMembers, boxMembers, nextBoss, cx) {
    var items = "";
    // Swap suggestion: biggest-scoring box member vs lowest-scoring team
    // member, only surfaced when the gap is real (>=15 of 100) - a 2-point
    // difference isn't worth interrupting the user over every session.
    if (boxMembers.length) {
      var worstTeam = null, bestBox = null;
      // Compara cada criatura pela melhor forma (base ou mega): um membro do
      // time com rank baixo na base mas alto como mega não é "o pior do time".
      teamMembers.forEach(function (sp) {
        var r = bestRankForm(sp);
        if (r && (!worstTeam || r.score < worstTeam.score)) worstTeam = r;
      });
      boxMembers.forEach(function (sp) {
        var r = bestRankForm(sp);
        if (r && (!bestBox || r.score > bestBox.score)) bestBox = r;
      });
      if (worstTeam && bestBox && bestBox.score - worstTeam.score >= 15) {
        items += '<div class="dash-item dash-suggestion"><span class="dash-label">Sugestão</span><span class="dash-value">' +
          '<span class="goto-species" tabindex="0" role="button" data-x="' + bestBox.sp.x + '">' + escapeHtml(bestBox.sp.n) + '</span>' + megaOfNote(bestBox) + ' (' + bestBox.tier + ') na caixa rende mais que ' +
          '<span class="goto-species" tabindex="0" role="button" data-x="' + worstTeam.sp.x + '">' + escapeHtml(worstTeam.sp.n) + '</span> (' + worstTeam.tier + ') no time</span></div>';
      }
    }
    if (nextBoss) {
      var boxSuggestion = bestBoxCandidateForBoss(nextBoss);
      if (boxSuggestion) {
        var reasonText = boxSuggestion.reasonMult === 0 ? "imune a " + boxSuggestion.reasonType : "resiste bem a " + boxSuggestion.reasonType;
        items += '<div class="dash-item dash-suggestion dash-suggestion-boss"><span class="dash-label">Próxima luta</span><span class="dash-value">' +
          escapeHtml(nextBoss.name) + ': <span class="goto-species" tabindex="0" role="button" data-x="' + boxSuggestion.sp.x + '">' + escapeHtml(boxSuggestion.sp.n) + '</span>' + megaOfNote(boxSuggestion) + ' na caixa ' + reasonText + '</span></div>';
      }
      var speed = bossSpeedSummary(nextBoss, teamMembers);
      if (speed) {
        items += '<div class="dash-item dash-speed"><span class="dash-label">Velocidade</span><span class="dash-value">' +
          '<span class="mono">' + speed.faster + '/' + speed.total + '</span> do time de ' + escapeHtml(nextBoss.name) + ' têm Velocidade base maior que ' +
          '<span class="goto-species" tabindex="0" role="button" data-x="' + speed.fastest.x + '">' + escapeHtml(speed.fastest.n) + '</span> (<span class="mono">' + speed.fastest.b[5] + '</span>), seu mais rápido' +
          (speed.tied ? ' (' + speed.tied + ' empatado' + (speed.tied > 1 ? 's' : '') + ')' : '') +
          '. <span class="dash-caveat">Só base: nível, EVs, nature, item e habilidade mudam a ordem.</span></span></div>';
      }
      items += dashboardConfrontoHtml(nextBoss, cx);
    }
    return items;
  }
  function renderNextFightCard(nextBoss, cx) {
    var el = document.getElementById("team-nextfight");
    if (!el) return;
    var teamMembers = state.team.map(getSpeciesByX).filter(Boolean);
    if (!teamMembers.length) { el.hidden = true; el.innerHTML = ""; return; }
    if (!arguments.length) { nextBoss = getRemainingBossEntries()[0]; cx = nextFightCx(nextBoss); }
    var boxMembers = state.box.map(getSpeciesByX).filter(Boolean);
    var items = nextFightDetailHtml(teamMembers, boxMembers, nextBoss, cx);
    el.hidden = !items;
    el.innerHTML = items ? '<h3>Resumo da próxima luta</h3><div class="dash-lines">' + items + '</div>' : "";
  }
  // "detalhes" no resumo da Dex: leva pro fim da aba Time, onde o detalhe mora.
  document.getElementById("dashboard").addEventListener("click", function (e) {
    if (!e.target.closest(".dash-more")) return;
    document.querySelector('.tab-btn[data-tab="team"]').click();
    var card = document.getElementById("team-nextfight");
    if (card && !card.hidden) card.scrollIntoView({ block: "start" });
  });
