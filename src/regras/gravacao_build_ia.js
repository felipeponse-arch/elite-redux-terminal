  // ===== src/regras/gravacao_build_ia.js =====
  // O caminho "resposta da IA -> build validada -> o que gravar", sem tela (ticket 06 da dívida
  // técnica, 2026-10-08; as regras saíram de src/ui/ia.js sem mudar de comportamento). A tela
  // (src/ui/ia.js) só faz o pedido (pedirIA), mostra o status e entrega a `saida` abaixo.
  // Testes: tests/unit/gravacao_build_ia.test.mjs.
  //
  // `saida` = como esta regra fala com a tela, em três funções (nos testes, vão para listas):
  //   agir(mudar)  roda `mudar` como UMA ação da tela: grava, e redesenha o card do time, a ficha
  //                da espécie, o confronto e o log. Devolve o que `mudar` devolveu.
  //   aviso(texto) status mostrado ao jogador.
  //   toast(texto) aviso rápido de sucesso.
  // Colado no <script> principal por scripts/build.mjs (marcador @regras gravacao_build_ia.js).

  // ---- antes de pedir ----
  // Decisão do usuário (08/10): build de Mega cuja pedra ainda não foi liberada na Etapa NÃO é
  // gerada (antes só avisava). Devolve o motivo (texto pro jogador) ou null se pode gerar.
  // Não chama a IA: quem bloqueia nem gasta a consulta.
  function motivoDeNaoGerarBuild(sp) {
    if (!sp || !isMegaForm(sp) || megaFormLiberada(sp)) return null;
    return "Não gerei a build de " + sp.n + ": esta Mega só a partir da " + rotuloEtapaDaMega(sp) + ". Até lá a criatura luta como a forma base.";
  }

  // ---- resposta -> build validada ----
  // Pedido de UMA build (generateBuildWithAI). `valor` é a build validada; `motivo` vai pro
  // modelo na nova tentativa, `motivoParaJogador` é o que o jogador vê se desistir.
  function validarRespostaDeBuildDaIa(sp, bruto, opts) {
    var m = {};
    var v = validateAiBuild(sp, bruto, m, contextoDeValidacao(sp, opts));
    return v ? { valor: v } : {
      motivo: m.txt || "a build citou habilidade, golpe, natureza ou formato fora do permitido para esta espécie.",
      motivoParaJogador: m.txt || "A resposta não bateu com os dados reais deste Pokémon."
    };
  }
  // Texto anexado ao pedido na nova tentativa, dizendo à IA por que a primeira foi rejeitada.
  function textoDaRetentativaDeBuild(motivo) {
    return "\n\nSUA RESPOSTA ANTERIOR FOI REJEITADA pela validacao automatica. Motivo: " + motivo + " Corrija isso e responda de novo, no mesmo formato JSON.";
  }
  // Pedido de várias builds numa consulta só (gerarBuildsDoTimeComIA): a resposta tem que
  // trazer o objeto `builds`.
  function validarRespostaDoLoteDeBuilds(bruto) {
    return bruto && bruto.builds && typeof bruto.builds === "object" ? { valor: bruto.builds } : { motivo: "a resposta não trouxe o campo builds." };
  }
  // A build de um membro dentro do lote: a resposta pode vir indexada pelo sname ou pelo nome.
  // Devolve { bruto, validada } (validada = null quando a IA não trouxe nada ou não passou).
  function buildDoLoteDeBuilds(sp, valorDoLote, opts) {
    var bruto = valorDoLote[sp.sname] || valorDoLote[sp.n];
    var validada = bruto ? validateAiBuild(sp, bruto, {}, contextoDeValidacao(sp, opts)) : null;
    return { bruto: bruto, validada: validada };
  }

  // ---- build validada -> gravar ----
  // A IA leva de segundos a minutos. Nos modos automáticos, se o mundo mudou nesse
  // meio-tempo (o jogador editou/criou a build, a criatura saiu do time ou voltou de forma),
  // a resposta é descartada - nunca passa por cima de uma escolha feita enquanto esperava.
  function respostaDaIaObsoleta(sp, opts) {
    if (opts.modo === "revisao" && (getActiveBuild(sp.sname) !== opts.anterior || state.team.indexOf(sp.x) === -1)) return true;
    if (opts.modo === "ponte" && (getActiveBuild(sp.sname) || state.team.indexOf(sp.x) === -1)) return true;
    if ((opts.chefao || opts.timeNovo) && state.team.indexOf(sp.x) === -1) return true; // saiu do time enquanto esperava
    return false;
  }
  function textoDeLimiteDeBuilds(sp, opts) {
    return (opts.chefao || opts.timeNovo)
      ? "Limite de 3 builds de " + sp.n + " com builds feitas por você - apague uma na ficha pra caber a nova."
      : "Limite de 3 builds atingido.";
  }
  // O que entra na lista da espécie (ordem das operações idêntica à de antes). Devolve false
  // se não salvou (lista cheia). Só mexe no state e no log: quem chama embrulha numa ação.
  function gravarBuildDaIaNaLista(sp, validated, opts, cap) {
    var salvou, saiu = null;
    // Build nova depois da evolução (2026-09-27, decisão do usuário: "guarda
    // como secundária"): a nova vira a ativa e a de antes fica de reserva,
    // marcada "Antes de evoluir" no chip - nunca é ela que sai pra abrir vaga.
    if (opts.modo === "revisao") saiu = liberarVagaNaLista(sp.sname, opts.anterior);
    // Build contra um chefão (2026-09-29, decisão do usuário: "gera uma nova pra
    // este chefão" e ela vira a ativa): abre vaga como a da evolução.
    // Time novo pelo "Montar time completo" (2026-09-29, decisão do usuário: a
    // build nova substitui a da tela e a antiga fica de variante): mesma regra.
    else if (opts.chefao || opts.timeNovo) saiu = liberarVagaNaLista(sp.sname, getActiveBuild(sp.sname), true);
    salvou = acrescentarVarianteNaLista(sp.sname, validated, opts.modo === "ponte" ? "curada" : "ia");
    // Último recurso: troca a ativa - mas nunca uma feita à mão no time novo/chefão.
    var ativaManual = (getActiveBuild(sp.sname) || {}).source === "manual";
    if (!salvou && (opts.modo === "revisao" || ((opts.chefao || opts.timeNovo) && !ativaManual))) salvou = trocarBuildAtivaNaLista(sp.sname, validated, "ia");
    if (salvou && opts.timeNovo) logAutoAction("Build nova de " + sp.n + " para o time gerado: " + validated.ability + "; " + validated.moves.join(", ") + (validated.item ? " @ " + validated.item : "") + ".");
    if (salvou && opts.chefao) logAutoAction("Build nova de " + sp.n + " para vencer " + opts.chefao.boss.name + ": " + validated.ability + "; " + validated.moves.join(", ") + (validated.item ? " @ " + validated.item : "") + ".");
    if (salvou && opts.modo === "revisao" && opts.anterior) {
      delete opts.anterior.revisar; delete opts.anterior.revisadaDe; delete opts.anterior.tentativasRevisao;
      opts.anterior.antesDeEvoluir = opts.deNome || "forma anterior";
    }
    if (saiu) logAutoAction("Pra caber a build nova de " + sp.n + ", saiu a variante mais antiga (" + (saiu.ability || "?") + "; " + (saiu.moves || []).join(", ") + ").");
    if (!salvou) return false;
    if (opts.modo === "revisao") {
      var a = opts.anterior;
      logAutoAction("Build nova de " + sp.n + " depois da evolução: " + validated.ability + "; " + validated.moves.join(", ") +
        (a ? ". A de antes (" + (a.ability || "?") + "; " + (a.moves || []).join(", ") + ") ficou salva no chip \"Antes de evoluir\" da ficha." : "."));
    } else if (opts.modo === "ponte") {
      logAutoAction("Build curada de " + sp.n + " adaptada ao level cap " + cap + ": " + validated.moves.join(", ") +
        (validated.plano ? " (troca pelos golpes da curada quando liberarem)" : "") + ".");
    }
    return true;
  }

  // Depois de validada: confere se a resposta ainda vale, ajusta, anexa o plano e grava.
  // Serve à build individual e ao lote de builds do time. Devolve true, false ou "obsoleta"
  // ("obsoleta" não conta como falha).
  function gravarRespostaValidadaDaIa(sp, validated, raw, opts, cap, saida) {
    if (respostaDaIaObsoleta(sp, opts)) return "obsoleta";
    ajustarBuildDaIa(sp, validated, opts, cap);
    var planoCheck = anexarPlanoDaIa(sp, validated, raw && raw.plano, cap,
      opts.modo === "ponte" && opts.alvo ? opts.alvo.moves : null);
    validated.planoConsultado = true; // o prompt já pediu o plano - não pedir de novo
    // Chefão + variante do time (Padrão/Insane/Hell têm times diferentes - revisão de
    // 2026-09-30): clicar de novo no MESMO time e cap não regera à toa.
    if (opts.chefao) validated.feitaPara = { chefao: opts.chefao.chave || opts.chefao.boss.name, cap: cap || 0 };
    var ok = saida.agir(function () { return gravarBuildDaIaNaLista(sp, validated, opts, cap); });
    if (!ok) {
      saida.aviso(textoDeLimiteDeBuilds(sp, opts));
      return false;
    }
    if (!opts.silencioso) {
      saida.toast("Build gerada por IA salva para " + sp.n +
        (validated.plano ? " - com " + Object.keys(validated.plano).length + " troca(s) planejada(s) para quando o cap subir" : ""));
    }
    if (planoCheck.descartados.length) {
      saida.aviso("Trocas do plano descartadas: " + planoCheck.descartados.map(function (d) { return d.motivo; }).join("; ") + ".");
    }
    return true;
  }

  // Plano para uma build que o jogador montou à mão (gerarPlanoParaBuild): a IA não mexe em
  // nada da build, só aponta o golpe futuro de cada slot. `movesPerguntados` = os golpes da
  // build no momento do pedido. Devolve true (gravado) ou "obsoleta" (a build saiu da lista
  // ou mudou de golpes enquanto a IA respondia). Plano inválido não é erro: validarPlano
  // tira o passo que não vale e o resto fica.
  function gravarPlanoDaIa(sp, entry, movesPerguntados, brutoDaResposta, cap, saida) {
    var r = validarPlano(sp, entry.moves, brutoDaResposta && brutoDaResposta.plano, cap);
    var alvo = getBuildList(sp.sname).indexOf(entry) !== -1 ? entry : null;
    if (!alvo || alvo.moves.join("|") !== movesPerguntados) return "obsoleta";
    saida.agir(function () {
      delete alvo.revisar;
      delete alvo.tentativasRevisao;
      alvo.planoConsultado = true;
      if (Object.keys(r.plano).length) {
        alvo.plano = r.plano;
        logAutoAction("Plano de golpes da build de " + sp.n + ": " + Object.keys(r.plano).map(function (de) {
          return de + " → " + r.plano[de] + " (nível " + nivelDoGolpe(sp, r.plano[de]) + ")";
        }).join(", ") + ".");
      }
    });
    return true;
  }
