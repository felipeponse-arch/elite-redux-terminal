  // ===== src/regras/prompts_ia.js =====
  // Peças dos prompts de IA (o que vai pro modelo) e a tradução dos erros da IA pro
  // jogador. Só texto e dado: quem conversa com a plataforma é o cliente único
  // pedirIA(), no template (fase 4 da refatoração).
  // Colado dentro do <script> principal do app por scripts/build.mjs (marcador
  // @regras prompts_ia.js), no mesmo escopo do resto do código. Só lógica: nada aqui
  // lê ou desenha a página - testável no Node (tests/unit). Movido do template na
  // fase 4 da refatoração (2026-09-24).


  // ctx explícito das regras puras (TK-19): { archetype, team, settings, cap }. Nestes arquivos de IA (prompts_ia, validacao_build_ia,
  // escolha_ia_candidatos, pipeline_build) este é o ÚNICO ponto que lê o state (travado em regras_puras_ctx_explicito.test.mjs). Fora deles,
  // level_cap.js (availableMovesFor), builds.js (itensEmUsoComQuem) e chefoes.js (getRemainingBossEntries) ainda usam o state quando o
  // chamador não passa ctx (ferramentas_ia, mono_run, avisos_build, pipeline_tela): o ctx é opcional ali, de propósito.
  // Quem chama monta o ctx aqui e passa adiante. Sem ctx, as entradas públicas usam o do state (compatível com os testes).
  function ctxDoState() { return { archetype: state.archetype, team: state.team, box: state.box, settings: state.settings, cap: getCurrentCap() }; }
  function completarCtx(ctx) { return ctx && ctx.settings && ctx.archetype && ctx.team && ctx.cap !== undefined ? ctx : Object.assign(ctxDoState(), ctx || {}); }

  // Orientação real de build por Ritmo/Clima do time (achado do usuário,
  // 2026-09-13, com print do time montado via "Montar melhor time": a
  // build gerada por IA pra um membro do time nunca considerava o
  // arquétipo já escolhido - o mesmo Pokémon recebia um set genérico
  // independente de o time ser Hyper Offense ou Stall). Cada entrada é uma
  // implicação MECÂNICA real (EVs/nature/golpe/item), não só repetir o
  // nome do arquétipo - a IA já recebe as ferramentas reais (rank, papel,
  // sinergia) pra decidir os detalhes finos dentro dessa direção.
  var PACE_BUILD_GUIDANCE = {
    // Item por papel (2026-09-29): o exemplo único "Life Orb" puxava todo mundo
    // pro mesmo item - agora cada papel tem o seu, e o time não repete mais de 2.
    "Hyper Offense": "prioriza dano imediato - nature/EVs ofensivos (Atk ou SpA + Speed) e os 4 golpes reais de maior dano/utilidade ofensiva direta. " +
      "Varie o item pelo papel de cada um: o mais rapido/limpador de fim de jogo com Choice Scarf; o wallbreaker com Choice Band/Specs; " +
      "quem abre a luta com Focus Sash; STAB principal com o item de reforco de tipo ou uma gema (sem o custo de HP da Life Orb); " +
      "quem tem cobertura larga com Expert Belt; setup com Weakness Policy ou berry de panico; Life Orb so pra quem se beneficia de verdade.",
    "Balance": "não força um extremo - segue o papel real já calculado pra esta espécie (ofensivo, defensivo ou misto), misturando ataque com pelo menos uma opção de utilidade real (status/hazard/recuperação) quando o movepool permitir.",
    "Bulky Offense": "EVs/nature que aguentam pelo menos um hit relevante mas ainda batem forte - geralmente HP + a defesa relevante junto com o stat ofensivo principal, não Speed puro.",
    "Stall": "bulk máximo (EVs em HP + a defesa relevante) e golpes reais de recuperação/status/hazard quando o movepool tiver - evita golpe de setup ofensivo puro (Swords Dance etc.) a menos que não haja opção melhor no movepool real.",
    "Semi-Stall": "meio-termo entre Stall e Balance - bulk real ainda é prioridade, mas pode incluir um golpe ofensivo mais forte que um Stall puro usaria."
  };

  var WEATHER_BUILD_GUIDANCE = {
    "Sand": "se esta espécie tiver Sand Stream (ou outra habilidade real que ative areia) ou um golpe/tipo que se beneficia de areia real no movepool, prioriza isso - senão, mantém o papel calculado normalmente.",
    "Rain": "se esta espécie tiver Drizzle, Swift Swim ou um golpe de Água real que se beneficia de chuva, prioriza isso - senão, mantém o papel calculado normalmente.",
    "Sun": "se esta espécie tiver Drought, Chlorophyll ou um golpe de Fogo/Grama real que se beneficia de sol, prioriza isso - senão, mantém o papel calculado normalmente.",
    "Hail": "neste jogo o granizo vem de Snow Warning (\"Summons hail\") ou do golpe Hail, e tipo Ice ganha Defesa no granizo - se esta espécie arma o granizo ou tem golpe/habilidade real que se beneficia dele, prioriza isso - senão, mantém o papel calculado normalmente.",
    // Clima deste hack (2026-09-26): nomes das habilidades conferidos no dado.
    "Eerie Fog": "clima deste jogo - Low Visibility e Fog Machine armam a nevoa; varias habilidades so funcionam nela (Ectoplasm, Ethereal Rush, Rest in Peace, Soul Tap, Foggy Eye, Echolocation, Greater Spirit, Shallow Grave, Smokey Maneuvers). Se esta espécie tiver uma delas, prioriza; a nevoa DRENA aumentos de status, então evita depender de golpe de setup - senão, mantém o papel calculado normalmente.",
    "Trick Room": "Trick Room inverte a ordem de turno - prioriza Velocidade BAIXA de propósito (EVs 0 em Speed, considera uma nature que reduz Speed) junto com golpes ofensivos reais, já que quem for mais lento ataca primeiro. Com 0 EV em Speed e nature que reduz Speed, o app zera sozinho o IV de Velocidade (Iron Pill, do jogo: \"Sets Speed IVs to 0\").",
    // Terrenos (2026-09-26): habilidades que armam/aproveitam e o efeito, tudo
    // conferido no dado deste jogo (descrição do golpe de terreno) - efeito do
    // jogo original que a descrição não confirma fica de fora.
    "Electric Terrain": DURACAO_CAMPO.terreno + " turnos, impede o sono. Electro Surge arma o terreno; Surge Surfer, Quark Drive, Hadron Engine, Power Leak e Backup Power se beneficiam dele. Se esta espécie tiver uma dessas, prioriza - senão, mantém o papel calculado normalmente.",
    "Psychic Terrain": DURACAO_CAMPO.terreno + " turnos, bloqueia prioridade. Psychic Surge arma o terreno; Zen Garden e Brain Overload se beneficiam. Se esta espécie tiver uma dessas, prioriza - senão, mantém o papel calculado normalmente.",
    "Grassy Terrain": DURACAO_CAMPO.terreno + " turnos, restaura HP. Grassy Surge e Seed Sower armam o terreno; Grass Pelt, Harukaze, Flower Necklace e Jungle Fever se beneficiam. Se esta espécie tiver uma dessas, prioriza - senão, mantém o papel calculado normalmente.",
    "Misty Terrain": DURACAO_CAMPO.terreno + " turnos, bloqueia status. Misty Surge arma o terreno; Celestial Blessing se beneficia. Se esta espécie tiver uma dessas, prioriza - senão, mantém o papel calculado normalmente.",
    "Toxic Terrain": "terreno deste jogo: " + DURACAO_CAMPO.terreno + " turnos, fortalece golpes Poison e causa dano nos Pokemon a cada turno. Toxic Surge arma; Biofilm se beneficia. Se esta espécie tiver uma dessas ou golpes Poison fortes, prioriza - senão, mantém o papel calculado normalmente."
  };

  // Tática do time (2026-09-26): o que o time faz em campo, independente de
  // estilo e clima.
  var TATICA_BUILD_GUIDANCE = {
    "Telas": "o time joga com Reflect/Light Screen/Aurora Veil (neste jogo a Aurora Veil so funciona com granizo) - se o movepool real desta espécie tiver um desses, um set de suporte que arma telas (Light Clay estende) serve ao time; se for atacante, aproveita o turno protegido pra um golpe de setup real.",
    "Armadilhas e pivô": "o time espalha armadilhas e troca sem perder turno - prioriza golpes reais de armadilha (Stealth Rock, Spikes, Toxic Spikes, Sticky Web) e de pivô (U-turn, Volt Switch, Flip Turn, Parting Shot) quando o movepool tiver; Heavy-Duty Boots protege de armadilha inimiga."
  };

  // Rótulos que a IA lê (2026-09-26): "Estilo", "Clima e campo", "Tática".
  function archetypeBuildGuidance(ctx) {
    ctx = completarCtx(ctx);
    var parts = [];
    if (ctx.archetype.pace && PACE_BUILD_GUIDANCE[ctx.archetype.pace]) {
      parts.push("Estilo do time: " + ctx.archetype.pace + " - " + PACE_BUILD_GUIDANCE[ctx.archetype.pace]);
    }
    if (ctx.archetype.weather && WEATHER_BUILD_GUIDANCE[ctx.archetype.weather]) {
      parts.push("Clima e campo do time: " + rotuloDoArquetipoDeCampo(ctx.archetype.weather) + " - " + WEATHER_BUILD_GUIDANCE[ctx.archetype.weather]);
    }
    if (ctx.archetype.tatica && TATICA_BUILD_GUIDANCE[ctx.archetype.tatica]) {
      parts.push("Tatica do time: " + ctx.archetype.tatica + " - " + TATICA_BUILD_GUIDANCE[ctx.archetype.tatica]);
    }
    // Monotype (2026-09-26): antes só o gerador de time sabia; a build e as
    // Estratégias agora cobrem as fraquezas que o time inteiro divide.
    if (ctx.archetype.monotype) parts.push("Monotype do time: " + orientacaoMono(ctx.archetype.monotype));
    return parts;
  }

  function planoPromptBlock(sp, cap) {
    var futuros = golpesFuturosDe(sp, cap);
    if (!futuros.length) return "";
    return "PLANO DE GOLPES: o jogador sobe de nivel ao longo do jogo. Estes golpes esta forma ainda NAO aprende (liberam no nivel indicado). " + LEGENDA_GOLPE + "\n" +
      "<dados_do_jogo>\n" + futuros.map(function (f) { return "nivel " + f.nivel + ": " + movePromptLine(f.id); }).join("\n") + "\n</dados_do_jogo>\n" +
      "Para cada um dos 4 golpes escolhidos, se um destes golpes futuros for claramente melhor PARA O MESMO PAPEL deste slot, aponte a troca no campo " +
      "\"plano\" ({\"golpe de agora\": \"golpe futuro\"}). So aponte troca que voce faria de verdade; slot sem troca melhor fica fora do plano. " +
      "O app aplica a troca sozinho quando o level cap liberar o golpe.\n";
  }

  function contextoDoModoPrompt(sp, opts, cap) {
    if (opts.modo === "revisao" && opts.anterior) {
      var a = opts.anterior;
      // Build NOVA do zero (2026-09-27, pedido do usuário: "zerar aquela build do
      // level 18 e o sistema sugerir uma build nova"). Antes pedia pra manter o
      // papel e os golpes da antiga - saía uma adaptação da build da pré-evolução.
      return "BUILD NOVA DEPOIS DA EVOLUCAO: este Pokemon acabou de evoluir" + (opts.deNome ? " de " + opts.deNome : "") +
        ". Monte uma build NOVA do zero pra esta forma, seguindo a ordem de decisao abaixo como se fosse a primeira - NAO use a build antiga como base " +
        "(ela foi pensada pra forma anterior, com outro level cap; fica salva como secundaria). So pra referencia, ela era: habilidade " + dadoExterno(a.ability || "?") +
        ", golpes " + (a.moves || []).map(dadoExterno).join(", ") + ". O papel pode mudar se a forma nova pede outro.\n";
    }
    if (opts.modo === "ponte" && opts.alvo) {
      var trav = golpesTravadosNoCap(sp, opts.alvo.moves).filter(function (g) { return g.nivel !== null; });
      return "BUILD ALVO (curada pela comunidade, pensada pro fim do jogo): habilidade " + dadoExterno(opts.alvo.ability) + ", natureza " + dadoExterno(opts.alvo.nature) +
        ", golpes " + opts.alvo.moves.map(dadoExterno).join(", ") + ". No level cap " + cap + " ainda estao travados: " +
        trav.map(function (g) { return dadoExterno(g.nome) + " (nivel " + g.nivel + ")"; }).join(", ") +
        ". Monte a build de AGORA: mantenha todos os golpes da curada que ja estao liberados e, pra cada golpe travado, escolha um golpe-ponte " +
        "liberado agora que cumpra o mesmo papel. No campo \"plano\", aponte cada golpe-ponte para o golpe travado da curada que ele substitui.\n";
    }
    // Botão "Montar time contra este chefão" (2026-09-29): o time foi escolhido
    // pelo simulador de duelo (duelo.js) e cada membro tem Pokémon do chefão
    // pra responder - a build mira isso.
    if (opts.chefao) {
      var c = opts.chefao;
      return "OBJETIVO DESTA BUILD: vencer " + dadoExterno(c.boss.name) + " (time dele no CONTEXTO). O time foi escolhido pelo simulador de duelo do app" +
        (c.responde && c.responde.length ? " e este Pokemon e a resposta do time para: " + c.responde.map(dadoExterno).join(", ") +
          " - golpes, item e EVs precisam vencer ESSES duelos" : "") +
        (c.provado ? ". " + linhaProvadoIA(c.provado) : "") +
        (c.estrategia
          ? ". ESTRATEGIA DO TIME: " + dadoExterno(c.estrategia.armador) + " arma " + (NOME_DA_CONDICAO[c.estrategia.clima] || c.estrategia.clima) +
            " ao entrar (" + dadoExterno(c.estrategia.habilidade) + ")" +
            (c.estrategia.aproveitam.length ? " e " + c.estrategia.aproveitam.map(dadoExterno).join(", ") + " jogam nesse clima" : "") +
            " - aproveite habilidades e golpes que rendem nele"
          : (c.clima ? ". O chefao arma " + (c.clima === "sol" ? "sol (golpes Fire mais fortes)" : "chuva (golpes Water mais fortes)") + " - leve isso em conta" : "")) +
        ". Cite o chefao e os Pokemon dele na rationale.\n";
    }
    return "";
  }

  // Confere o plano devolvido pela IA e anexa o que vale à build validada.
  function anexarPlanoDaIa(sp, validated, rawPlano, cap, destinosPermitidos) {
    var bruto = rawPlano;
    if (destinosPermitidos && bruto && typeof bruto === "object") {
      bruto = {};
      Object.keys(rawPlano).forEach(function (de) { if (destinosPermitidos.indexOf(rawPlano[de]) !== -1) bruto[de] = rawPlano[de]; });
    }
    var r = validarPlano(sp, validated.moves, bruto, cap);
    if (Object.keys(r.plano).length) validated.plano = r.plano;
    return r;
  }

  // Achado na reunião de 2026-09-11 sobre o material de IHC (capítulo de
  // interação social/emocional, tabela "mensagens frustrantes x
  // construtivas"): este catch era o único lugar do app com uma mensagem
  // de erro genérica ("Erro ao gerar build - tente de novo.") que não diz
  // o que aconteceu nem se adianta alguma coisa tentar de novo - o mesmo
  // defeito do exemplo "Erro de sintaxe!" do livro. Toda outra mensagem do
  // app (banner de armazenamento cheio, avisos de IA indisponível) já
  // segue o padrão construtivo; esta só não tinha sido revisada porque o
  // catch nunca tinha sido dividido por código de erro. Códigos e
  // categorias conforme sample.d.ts (contrato 0.2.41): "sem sentido tentar
  // de novo sem mudar algo" vs. "transitório, tentar de novo pode resolver".
  function sampleErrorMessage(e) {
    switch (e && e.code) {
      case "not_granted":
        return "Geração por IA não disponível (permissão não concedida).";
      case "rate_limited":
        return "Muitos pedidos de uma vez - espere um pouco e tente de novo.";
      case "session_expired":
        return "Sua sessão expirou - atualize a página e tente de novo.";
      case "refused":
        return "A IA recusou esse pedido - tente novamente ou escolha outro Pokémon.";
      case "empty_completion":
      case "invalid_json":
        return "A resposta da IA veio incompleta ou num formato inesperado - tente de novo.";
      case "tempo_esgotado":
        // Não é código da plataforma: é o tempo-limite do próprio app (pedirIA),
        // que solta a fila única quando uma chamada não responde.
        return "A IA demorou demais para responder - tente de novo em instantes.";
      case "prompt_too_large":
        // Achado na auditoria de mensagens (2026-09-12): único código sem
        // nenhuma próxima ação sugerida - "tente de novo mais tarde" é
        // honesto (não há uma ação melhor aqui, o pedido não fica menor),
        // mas ainda dá ao jogador algo a fazer em vez de um beco sem saída.
        return "Esse Pokémon tem dados demais pra IA processar de uma vez - tente de novo mais tarde.";
      case "sampling_disabled":
      case "not_declared":
      case "capability_disabled":
      case "capability_removed":
      case "tools_unavailable":
        return "Geração por IA não disponível neste ambiente.";
      default:
        // upstream_error e qualquer código não previsto: falha transitória
        // do serviço, tentar de novo é uma ação real (sample.d.ts recomenda
        // tratar código desconhecido como upstream_error).
        return "Falha temporária ao consultar a IA - tente de novo em instantes.";
    }
  }

  // ---------------- blocos compartilhados dos prompts (fase 4) ----------------
  // Build (1 set) e Estratégias (2-3 sets) mandavam os mesmos dados com texto
  // copiado e já divergente (as Estratégias não recebiam o aviso de ler a
  // descrição do golpe, nem a regra completa de papel x golpe). Agora os dois
  // usam estes blocos; `plural` só muda a concordância ("escolha" / "cada set
  // escolhe").
  function versaoDosDados() { return DATA.meta ? DATA.meta.version : "?"; }
  function cabecalhoIA() {
    return "Você é o especialista em meta do Pokemon Elite Redux (ROM hack de Pokemon). " + PROMPT_DADOS_AVISO + " ";
  }
  // Habilidade com o efeito do jogo (2026-09-27, revisão do prompt de build):
  // antes só ia o NOME - e neste hack muitas habilidades são novas ou mudaram
  // (Garchomp: Overwhelm, Keen Edge, Hyper Aggressive, Speed Force). Sem a
  // descrição a IA escolhia habilidade e sinergia no escuro.
  function linhaHabilidadeIA(id) {
    var a = ABILITIES[id];
    return "- " + a[0] + ": " + dadoExterno(ABILITY_PT[String(id)] || a[1] || "sem descricao");
  }
  function blocoEspecieIA(sp, plural, ctx) {
    var abiIds = uniqueIds(sp.ab);
    var abiNames = abiIds.map(function (id) { return ABILITIES[id][0]; });
    return "Tipo: " + speciesTypeNames(sp).join("/") + "\n" +
      "Status base (HP/Atk/Def/SpA/SpD/Spe): " + sp.b.join("/") + "\n" +
      "Habilidades escolhiveis - " + (plural ? "cada set escolhe" : "escolha") + " exatamente UMA destas, escrita EXATAMENTE assim: " + abiNames.join(", ") + ". Efeito de cada uma NESTE jogo:\n" +
      "<dados_do_jogo>\n" + abiIds.map(linhaHabilidadeIA).join("\n") + "\n</dados_do_jogo>\n" +
      "Innates SEMPRE ativas (nao escolhiveis, mas contam na sinergia - a build deve aproveitar o maximo delas):\n" +
      "<dados_do_jogo>\n" + uniqueIds(sp.inn).map(function (id) {
        // Elite: a innate que o nível do cap ainda não liberou (level_cap.js) vai marcada.
        var travada = innatesTravadasNoNivel(sp, (ctx || ctxDoState()).cap || NIVEL_DE_CALCULO_SEM_CAP).indexOf(id) !== -1;
        return linhaHabilidadeIA(id) + (travada ? " [TRAVADA no Elite ate o Pokemon chegar ao nivel " + NIVEL_DA_INNATE_ELITE[(sp.inn || []).indexOf(id)] + " - nao conte com ela agora]" : "");
      }).join("\n") + "\n</dados_do_jogo>\n";
  }

  // Papel conduz a build (2026-09-27, pedido do usuário: "se um Pokémon é
  // tanque, ele não prioriza a velocidade, prioriza defesa ou HP; se é pivô,
  // prioriza as coisas de pivô; se é wallbreaker, as de wallbreaker"). Os 4
  // papéis são a taxonomia do app (SPECIES_ROLE / ROLE_LABEL_PT). A validação
  // confere os EVs contra o papel declarado (conferirPapelDaBuild).
  var PAPEIS_DA_BUILD = {
    "Tanque": "EVs em HP e na defesa do lado mais ameacador (nature defensiva); Velocidade no maximo 100 EVs (se uma habilidade ativa depende de Velocidade, o papel certo nao e Tanque); golpes: recuperacao, status, hazard e 1-2 de dano estaveis; item que aumente a resistencia (Leftovers, Rocky Helmet, Assault Vest, berry de resistencia).",
    "Pivô": "golpe de troca real e obrigatorio quando o movepool tiver (U-turn, Volt Switch, Flip Turn, Parting Shot...); bulk pra entrar em golpes que resiste; Velocidade moderada; item que ajude a entrar e sair (Heavy-Duty Boots, Rocky Helmet, Leftovers, Assault Vest).",
    "Wallbreaker": "ataque maximo (252 no atributo de ataque, nature que o aumenta); golpes mais fortes + cobertura contra quem resiste ao STAB; Velocidade so o necessario; item que aumente o dano (Choice Band/Specs, Life Orb, reforco de tipo, gema, Expert Belt).",
    "Sweeper": "ataque + Velocidade (252/252); golpe de setup quando tiver; prioridade pra fechar; item que ajude a varrer (Life Orb, Choice Scarf, berry de panico, Weakness Policy, Focus Sash)."
  };
  function nomePapel(r) { return ROLE_LABEL_PT[r] || r; }
  function blocoPapelIA(sp, plural, comTime, ctx) {
    ctx = completarCtx(ctx);
    var natural = SPECIES_ROLE[sp.sname];
    var golpes = availableMovesFor(sp, ctx).names;
    var prioridade = golpes.filter(ehPrioridadeDeDano);
    var pivos = golpes.filter(ehGolpeDePivo);
    var linhas = [];
    if (natural && natural.roles && natural.roles.length) {
      linhas.push("Papel natural desta especie (calculado pelos status reais): " + natural.roles.map(nomePapel).join(" / ") +
        ", ataque " + (natural.split || "?") + (natural.spePct !== undefined ? ", mais rapida que " + Math.round(natural.spePct) + "% das especies" : "") + ".");
    }
    linhas.push("PAPEL CONDUZ A BUILD - " + (plural ? "cada set declara" : "declare") + " um papel (Tanque, Pivô, Wallbreaker ou Sweeper) e faca TODAS as escolhas servirem a ele:");
    Object.keys(PAPEIS_DA_BUILD).forEach(function (p) { linhas.push("- " + p + ": " + PAPEIS_DA_BUILD[p]); });
    linhas.push(prioridade.length
      ? "Golpes de PRIORIDADE que esta forma usa agora: " + prioridade.join(", ") + ". Inclua um entre os 4 sempre que possivel (no 1x1 prioridade decide troca); se nao incluir, diga o motivo na rationale."
      : "Esta forma nao tem golpe de prioridade de dano no level cap atual.");
    if (pivos.length) linhas.push("Golpes de PIVÔ que esta forma usa agora: " + pivos.join(", ") + ".");
    // Achado no teste com o time real do usuário (2026-09-27): Kirlia ainda
    // evolui e a build usava Babiri Berry - a IA não pesava o Eviolite.
    if (evioliteFunciona(sp) && ITEMS.indexOf("Eviolite") !== -1) {
      linhas.push("Esta forma AINDA EVOLUI: Eviolite (aumenta Def e Def. Especial de quem ainda evolui) costuma ser o item defensivo mais forte aqui - considere.");
    }
    if (comTime) {
      var membros = ctx.team.map(getSpeciesByX).filter(function (m) { return m && m.x !== sp.x; });
      var riscos = computeSharedRisks(membros);
      if (riscos.length) linhas.push("Fraquezas que o resto do time divide: " + riscos.map(function (r) { return r.t + " (" + r.n + " membros)"; }).join(", ") + " - resistir/cobrir isso vale mais.");
    }
    return linhas.join("\n") + "\n";
  }
  // Movepool liberado no cap (mesma trava do editor manual - golpe de tutor
  // nunca trava), dentro de UM bloco <dados_do_jogo>.
  function blocoMovepoolIA(sp, plural, ctx) {
    var linhas = availableMovesFor(sp, ctx).ids.map(movePromptLine);
    return "Movepool real - " + (plural ? "cada set escolhe" : "escolha") + " exatamente 4 desta lista, nenhum golpe fora dela. Cada linha traz o que o golpe " +
      "FAZ NESTE HACK (tipo, categoria, poder, prioridade, papel e descricao do proprio jogo) - leia a descricao, " +
      "nao assuma pelo nome, golpes deste hack podem ser diferentes do jogo original. " + LEGENDA_GOLPE + "\n<dados_do_jogo>\n" + linhas.join("\n") + "\n</dados_do_jogo>\n";
  }
  function blocoRegrasDePapelIA() {
    return "COERENCIA PAPEL x GOLPE: cada um dos 4 golpes precisa servir ao papel escolhido. Build 100% ofensiva " +
      "(EVs em ataque e velocidade, nada em HP/Def/SpD) NAO leva golpe de papel 'cura' e leva pelo menos 2 golpes " +
      "de dano - uma build assim que ignore isso vai ser REJEITADA. Se quiser cura, invista em bulk e explique na rationale.\n" +
      "FORMATO 1x1: golpe de papel 'dupla' (Follow Me, Helping Hand, Ally Switch...) nao faz nada numa batalha de um contra um e e REJEITADO.\n";
  }
  function blocoMegaIA(sp, plural) {
    var bloco = megaPromptBlock(sp);
    var regraPedra = megaStoneRuleFor(sp);
    var out = "";
    if (bloco) {
      out += bloco + "\n";
      if (megaEvolutionUnlocked() || isMegaForm(sp)) {
        out += (plural ? "Cada set e" : "Esta build e") + " para a forma " + sp.n + " - habilidade e golpes SO desta forma, nunca misture com os de outra." + formFamilyPromptNote(sp) + "\n";
      }
    }
    if (regraPedra) out += regraPedra.prompt + "\n";
    return out;
  }
  var comDescricaoIA = function (n) { return "- " + n + ": " + dadoExterno(ITEM_DESC[n] || "sem descricao"); };
  // Parte do bloco de itens que é da espécie (item exclusivo e regra do item que
  // se gasta) - no lote de builds do time (2026-09-30) vai dentro de cada espécie.
  function blocoItensDaEspecieIA(sp) {
    var daEspecie = itensDeEspeciePara(sp);
    return (daEspecie.length ? "Exclusivo desta especie:\n<dados_do_jogo>\n" + daEspecie.map(comDescricaoIA).join("\n") + "\n</dados_do_jogo>\n" : "") +
      regraItemConsumivelPrompt(sp);
  }
  function blocoItensIA(sp, plural, ctx) {
    ctx = completarCtx(ctx);
    return blocoItensComunsIA(plural, blocoItensDaEspecieIA(sp), ctx);
  }
  // `meio`: o que entra entre a lista de utilidade e as travas (a parte da
  // espécie no prompt de 1 build; vazio no lote, onde ela vai em cada espécie).
  // Itens da lista que só saem DEPOIS da Etapa atual (decisão do usuário, 08/10): a IA evita,
  // mas pode usar com motivo claro. Vem de ONDE_ACHAR_ITENS (código oficial do jogo).
  function itensAindaIndisponiveisParaIA(ctx) {
    ctx = completarCtx(ctx);
    // Lista única do time (itens_do_time.js): o que não está liberado nesta Etapa é o que falta nela.
    var liberados = itensDoTime(ctx.settings.milestone, ctx.cap);
    return AI_ITEM_POOL.filter(function (n) { return liberados.indexOf(n) === -1; })
      .map(function (n) { return { n: n, p: primeiroLugarDoItem(n) }; })
      .filter(function (x) { return x.p; })
      .sort(function (a, b) { return a.p.etapa - b.p.etapa; });
  }
  function blocoItensAindaIndisponiveisIA(ctx) {
    ctx = completarCtx(ctx);
    var lista = itensAindaIndisponiveisParaIA(ctx);
    if (!lista.length) return "";
    return "AINDA NAO DISPONIVEIS nesta Etapa (o jogador ainda nao consegue obter; evite, e so use com motivo claro na rationale): " +
      lista.map(function (x) { return x.n + " (a partir da " + rotuloDaEtapaDoItem(x.p.etapa) + ")"; }).join(", ") + ".\n";
  }
  function blocoItensComunsIA(plural, meio, ctx) {
    ctx = completarCtx(ctx);
    var tipo = Object.keys(ITENS_IA_TIPO).filter(function (n) { return ITEMS.indexOf(n) !== -1; })
      .map(function (n) { return n + "=" + ITENS_IA_TIPO[n]; });
    var comDescricao = comDescricaoIA;
    return "Itens de batalha reais disponiveis - " + (plural ? "cada set escolhe UM (ou deixa vazio)" : "escolha UM (ou deixe vazio se nenhum fizer sentido)") +
      ", nenhum fora destes grupos:\n" +
      "Gerais: " + ITENS_IA_GERAIS.join(", ") + "\n" +
      "Reforco de tipo (+dano daquele tipo em todo golpe; use o do golpe de dano principal): " + tipo.join(", ") + "\n" +
      "Gemas (+dano forte do tipo UMA vez e a gema se gasta - bom pra um golpe decisivo, combina com Unburden e Acrobatics): " + ITENS_IA_GEMAS.join(", ") + "\n" +
      "Berries: " + ITENS_IA_BERRIES.join(", ") + ". As de panico (Liechi, Salac, Petaya, Apicot, Ganlon, Starf) sobem um status com HP baixo; as de resistencia (Occa=Fire, Passho=Water, " +
      "Wacan=Electric, Rindo=Grass, Yache=Ice, Chople=Fighting, Kebia=Poison, Shuca=Ground, Coba=Flying, Payapa=Psychic, Tanga=Bug, Charti=Rock, " +
      "Kasib=Ghost, Haban=Dragon, Colbur=Dark, Babiri=Steel, Roseli=Fairy, Chilan=Normal) enfraquecem um golpe super efetivo daquele tipo - use a " +
      "da fraqueza mais perigosa desta especie.\n" +
      // Com a descrição do jogo no próprio prompt. Tentamos só os nomes + a
      // ferramenta getItemInfo (2026-09-26, -2,4 mil caracteres) e o usuário
      // preferiu desfazer: sem consultar, a IA não sabe o que fazem os itens
      // deste hack (Swirly Glasses, Frost Orb) nem os que ele fortaleceu (Big
      // Root) - não reabrir esse corte.
      "Utilidade (efeito deste jogo - leia, nao assuma pelo nome; pedra de clima so se a especie arma aquele clima):\n<dados_do_jogo>\n" +
      ITENS_IA_UTILIDADE.map(comDescricao).join("\n") + "\n</dados_do_jogo>\n" +
      meio +
      blocoItensAindaIndisponiveisIA(ctx) +
      // Item que reforça + travas (2026-09-27; travas pela descrição do jogo,
      // conferidas em conflitoDeItem, validacao_build_ia.js).
      "ITEM x BUILD: o item precisa reforcar o papel, a habilidade ou os golpes escolhidos - diga na rationale o que ele reforca. " +
      "Escolha o item que MAIS ajuda este Pokemon; no time vale no MAXIMO " + MAX_MESMO_ITEM_NO_TIME + " membros com o mesmo item (a lista de itens ja em uso vem abaixo, quando houver). " +
      // Listas vindas de validacao_build_ia.js (mesma fonte do conflitoDeItem).
      "Sao REJEITADOS: " + ITENS_CHOICE.join("/") + " com golpe de status (exceto " + GOLPES_QUE_PASSAM_ITEM.join("/") + ", que passam o item); " +
      ITENS_VEST.join(" ou ") + " com golpe de status (o jogo impede usar); Eviolite numa forma que nao evolui mais.\n";
  }
  // O que o resto do time já usa (só a build de 1 membro recebe: as Estratégias
  // são leitura exploratória da espécie, não do time).
  function blocoTimeEmUsoIA(sp, ctx) {
    // Item pode repetir no time (2026-09-27, pedido do usuário: "cada Pokémon
    // pode ter um item e esse item pode ser repetido pelo time") - a lista de
    // itens em uso saiu do prompt; golpes e papéis continuam como preferência.
    var golpes = teamMovesInUse(sp.x), papeis = teamRolesInUse(sp.x);
    // Itens em uso de volta ao prompt (2026-09-29): sem isso a IA não sabia o que
    // os outros seguravam e todo Hyper Offense saía com Life Orb.
    var itens = itensEmUsoComQuem(sp.x, ctx);
    var nomesItens = Object.keys(itens);
    var esgotados = nomesItens.filter(function (i) { return itemEsgotadoNoTime(itens[i]); });
    return "" +
      (nomesItens.length ? ("Itens JA EM USO por outros membros do time: " + nomesItens.map(function (i) {
        return dadoExterno(i) + " (" + itens[i].map(dadoExterno).join(", ") + ")";
      }).join("; ") + "." +
        (esgotados.length ? " JA ESGOTADOS (" + MAX_MESMO_ITEM_NO_TIME + " no time, qualquer outro e REJEITADO): " + esgotados.map(dadoExterno).join(", ") + "." : "") +
        " Prefira um item que o time ainda nao usa quando ele servir igual ao papel.\n") : "") +
      (golpes.length ? ("Golpes JA EM USO por outros membros do time atual: " + golpes.join(", ") + ". Evite repetir estes golpes nesta build - o time fica mais forte e menos repetitivo quando cada membro cobre uma ameaca/papel diferente. So repita um destes se for claramente a melhor opcao sem alternativa real equivalente (ex: o STAB mais forte do movepool desta especie) - nesse caso, diga na rationale por que nao havia alternativa melhor.\n") : "") +
      (papeis.length ? ("Papeis JA COBERTOS por outros membros do time atual (perfil natural de cada especie, nao a build escolhida): " + papeis.map(function (r) { return ROLE_LABEL_PT[r] || r; }).join(", ") + ". Pese isso na hora de decidir o papel deste Pokemon - um time com varios atacantes puros e nenhuma bulk/suporte fica fragil contra qualquer coisa que sobreviva o primeiro golpe. Nao e proibido repetir papel (as vezes o time PRECISA de 2+ sweepers de proposito), mas se for repetir um papel ja bem coberto, diga na rationale por que faz sentido mesmo assim.\n") : "");
  }

  // Manual de build competitivo (reunião de 2026-09-28, usuário: "a sugestão de
  // builds não está extraindo o melhor dos pokes... associar isso aos moves,
  // ivs e evs, nature e itens além das habilidades"). Duas partes:
  //  - regras gerais curtas (nature, cobertura, Velocidade) - princípios básicos
  //    de build competitiva (guias de iniciante do Smogon), nada específico de
  //    um hack que precisasse de fonte do jogo;
  //  - combinações item/golpe x habilidade SÓ das habilidades que esta espécie
  //    tem, cada uma apoiada no texto do próprio jogo (descrição da habilidade
  //    ou do item, citada no comentário ao lado).
  var MANUAL_POR_HABILIDADE = {
    "Magic Guard": "Magic Guard (\"Only damaged by attacks\"): o custo de HP da Life Orb e o dano de clima nao o atingem - Life Orb vira bonus puro.", // Life Orb: "at the cost of HP"
    "Skill Link": "Skill Link: golpes de 2 a 5 acertos sempre acertam o maximo - prefira golpes de varios acertos do movepool; Loaded Dice fica redundante.",
    "Super Luck": "Super Luck (+1 no critico): Scope Lens (\"improves the critical-hit rate\") soma - golpes de critico alto rendem mais.",
    "Sniper": "Sniper (critico 2,25x): combine com Scope Lens e golpes de critico alto.",
    "Technician": "Technician (golpe de " + TECHNICIAN_LIMITE + " de poder ou menos x" + String(TECHNICIAN_MULT).replace(".", ",") + "): priorize os golpes fracos do movepool que ele transforma em fortes, inclusive os de varios acertos.",
    "Sheer Force": "Sheer Force (x" + String(SHEER_FORCE_MULT).replace(".", ",") + " em golpe com efeito extra, que perde o efeito): prefira golpes com efeito secundario.",
    "Serene Grace": "Serene Grace (" + (SERENE_GRACE_MULT === 2 ? "dobra" : "x" + SERENE_GRACE_MULT) + " a chance de efeito extra): prefira golpes com efeito secundario (flinch, status, queda de status).",
    "Contrary": "Contrary (queda de status vira aumento): golpes cuja descricao (no movepool acima) diz que baixam os status do proprio usuario viram setup - se houver, use.",
    "Simple": "Simple (dobra mudancas de status): um golpe de setup rende em dobro - inclua um se o movepool tiver.",
    "Speed Boost": "Speed Boost (+1 de Velocidade por turno): Protect ou um setup no primeiro turno e comum; EV de Velocidade pode ceder para bulk/ataque.",
    "Moxie": "Moxie (+1 de Ataque a cada nocaute): combina com golpes fortes e item de Velocidade (Choice Scarf) para varrer.",
    "Prankster": "Prankster (golpe de status com +1 de prioridade, falha contra Dark): golpes de status valem mais - setup, telas, status no oponente.",
    "Regenerator": "Regenerator (cura 1/3 ao sair): combina com papel de Pivô e golpe de troca.",
    "Tinted Lens": "Tinted Lens (dano dobrado quando resistido): a cobertura importa menos - pode concentrar em STAB e item de dano.",
    "Unburden": "Unburden: item que se gasta na luta (berry, gem, Focus Sash, White Herb) ativa a Velocidade dobrada."
  };
  function blocoManualIA(sp) {
    var habs = uniqueIds((sp.ab || []).concat(sp.inn || [])).map(function (id) { return ABILITIES[id] ? ABILITIES[id][0] : ""; });
    var combos = habs.filter(function (n) { return MANUAL_POR_HABILIDADE[n]; }).map(function (n) { return "- " + MANUAL_POR_HABILIDADE[n]; });
    var linhas = [
      "MANUAL DE BUILD (regras gerais):",
      "- Nature: sobe o atributo que o papel mais usa (ataque dos golpes de dano, ou a defesa do tanque) e reduz um atributo que a build NAO usa (Ataque se so ha golpes especiais, Ataque Especial se so fisicos). Nature que reduz o ataque que os golpes usam, ou a Velocidade de um Sweeper, e REJEITADA.",
      "- Golpes: dois STAB quando der; o resto e cobertura para os tipos que resistem aos STAB e para a proxima luta. Nao gaste dois slots no mesmo tipo de cobertura.",
      "- EVs: 252 onde o papel manda; o resto em HP ou Velocidade conforme os numeros de Velocidade do CONTEXTO. IV 31 em tudo, salvo Velocidade 0 em Trick Room (Iron Pill).",
      "- Poison: Black Sludge cura so tipo Poison e causa dano nos outros (texto do jogo) - em quem nao e Poison ela e REJEITADA."
    ];
    if (combos.length) linhas.push("COMBINACOES DAS HABILIDADES DESTA ESPECIE (texto do jogo) - use quando servirem ao papel:");
    return linhas.concat(combos).join("\n") + "\n";
  }

  // Contexto que antes a IA buscava por ferramenta, já no prompt (reunião de
  // 2026-09-28, usuário: "algumas chamadas para gerar build estão demorando e
  // às vezes dão o retorno que não gera nada"). Cada consulta a uma ferramenta
  // era mais uma ida e volta ao modelo, reenviando o prompt inteiro - e o
  // prompt mandava usar umas 6. Os mesmos dados das ferramentas (mesmas
  // funções: SPECIES_RANK, ABILITY_SYNERGY, computeSpeedTiers,
  // confrontoParaParty...) entram aqui e a build sai numa chamada só.
  function linhaVelocidadeIA(sp, ctx) {
    ctx = completarCtx(ctx);
    var st = computeSpeedTiers("");
    var idx = st.rows.findIndex(function (r) { return r.sp.sname === sp.sname; });
    if (idx === -1) return "";
    var row = st.rows[idx];
    var txt = "Velocidade no nivel " + st.level + " (base " + row.base + "): sem EV " + row.neutral +
      "; 252 EV + nature que sobe Velocidade " + row.invested + " (passa " + (st.rows.length - idx - 1) + " de " + st.rows.length +
      " especies tambem investidas); com Choice Scarf " + row.scarf + ".";
    if (ctx.archetype.weather === "Trick Room") {
      txt += " Minima pra Trick Room (0 EV, IV 0 com Iron Pill, nature que reduz Velocidade): " +
        calcFinalStat(row.base, 0, 0, st.level, 5, "Brave", null, sp.n) + ".";
    }
    return txt;
  }
  // `chefao` ({ boss, party }): luta escolhida pelo jogador no botão "Montar
  // time contra este chefão" (2026-09-29) - sem ele, a próxima luta que falta.
  function linhasProximaLutaIA(sp, chefao, ctx) {
    var boss = chefao ? chefao.boss : getRemainingBossEntries(ctx)[0];
    if (!boss) return [];
    var party = chefao ? chefao.party : bossPartyPorDificuldade(boss);
    var cx = confrontoParaParty(party, false);
    var linhas = [(chefao ? "Luta alvo desta build: " : "Proxima luta: ") + boss.name + (boss.db ? " (batalha em DUPLA)" : "") + ". Time dele (tipos, habilidade, item, golpes):"];
    confrontoFoesDe(party).forEach(function (f) {
      linhas.push("  " + f.name + " (" + speciesTypeNames(f.sp).join("/") + ") " + (f.ability || "habilidade desconhecida") +
        " @ " + (f.item || "sem item") + ": " + (f.moves || []).join(", "));
    });
    var campo = regraDeCampoDoChefao(boss.name);
    if (campo) linhas.push("  REGRA DE CAMPO desta luta: " + campo.texto + " - monte e escolha golpes/velocidade pensando nisso.");
    // Buffs do ginásio que o jogador ainda não tirou (2026-10-01): mudam a escolha
    // (status nos últimos do time, telas, Protect proibido, hazards...).
    var resumoBuffs = ehRevancheDeLider(boss.name) ? null : gymSkillsSummaryFor(gymLeaderBaseName(boss.name));
    var ativos = resumoBuffs && !resumoBuffs.gateOnly ? resumoBuffs.buffs.filter(function (b) { return !b.cleared; }) : [];
    if (ativos.length) {
      linhas.push("  Buffs do ginasio AINDA ATIVOS nessa luta (o jogador nao venceu os treinadores que tiram estes) - leve em conta:");
      ativos.forEach(function (b) { linhas.push("    - " + b.label + ": " + b.detail); });
    }
    if (cx) {
      var buracos = cx.c.buracos.map(function (f) { return f.name; });
      var ameacas = cx.c.ameacas.map(function (f) { return f.name; });
      if (buracos.length) linhas.push("  O time atual NAO acerta super efetivo: " + buracos.join(", ") + ".");
      if (ameacas.length) linhas.push("  Ameacam metade ou mais do time: " + ameacas.join(", ") + ".");
      var fecha = coberturaSugerida(cx.minhas, cx.c).map(function (s) {
        return cx.minhas[s.idx].main.n + " com " + s.move + " (fecha " + s.resolve.map(function (f) { return f.name; }).join(", ") + ")";
      });
      if (fecha.length) linhas.push("  Golpes do time que fechariam esses buracos: " + fecha.join("; ") + ".");
    }
    var cand = chefao || !sp ? null : bestBoxCandidateForBoss(boss); // sem sp: parte comum do lote
    if (cand && cand.sp.sname === sp.sname) {
      linhas.push("  O app sugere ESTA especie pra essa luta: " + (cand.reasonMult === 0 ? "imune a " : "resiste bem a ") + cand.reasonType + ".");
    }
    return linhas;
  }
  function blocoContextoIA(sp, chefao, ctx) {
    ctx = completarCtx(ctx);
    return envelopeContextoIA(linhasContextoDaEspecieIA(sp, ctx).concat(linhasContextoComumIA(sp, chefao, ctx)));
  }
  function envelopeContextoIA(linhas) {
    return "CONTEXTO JA CALCULADO PELO APP (dado real do jogo e do seu progresso - use direto; nesta consulta nao ha ferramentas):\n" +
      "<dados_do_jogo>\n" + linhas.join("\n") + "\n</dados_do_jogo>\n";
  }
  // Contexto em duas partes (2026-09-30, lote de builds do time): o que é da
  // espécie (rank, sinergia, velocidade) e o que é igual pro time todo (chefões
  // que faltam, time da próxima luta) - no lote, a parte comum vai uma vez só.
  function linhasContextoDaEspecieIA(sp, ctx) {
    ctx = completarCtx(ctx);
    var linhas = [];
    var rank = rankDe(sp.sname);
    if (rank) linhas.push("Rank desta especie neste hack: tier " + rank.tier + " (pontuacao " + rank.score + ").");
    var sin = sinergiasDaEspecie(sp);
    linhas.push(sin.length
      ? "Sinergia habilidade x golpe CONFIRMADA no movepool real: " + sin.map(function (h) {
        return h.name + (h.kind === "inn" ? " (innate)" : " (escolhivel)") + " reforca " + (h.categoria || "") + " por " + (h.motivos || []).join(" e ") + ": " + (h.golpes || []).join(", ");
      }).join("; ") + "."
      : "Sinergia habilidade x golpe confirmada: nenhuma.");
    var combos = typeof CONDITION_MOVE_SYNERGY !== "undefined" ? (CONDITION_MOVE_SYNERGY[sp.sname] || []) : [];
    if (combos.length) {
      linhas.push("Combos que a propria especie ativa sozinha: " + combos.map(function (c) {
        return c.habilidade + (c.kind === "inn" ? " (innate)" : " (escolhivel)") + " + " + c.golpes.join("/") +
          (c.tipo === "clima" ? " (arma o clima " + c.clima + ")" : " (recuo baixa o HP)");
      }).join("; ") + ".");
    }
    var vel = linhaVelocidadeIA(sp, ctx);
    if (vel) linhas.push(vel);
    return linhas;
  }
  // `sp` opcional: com ele, entra a linha "o app sugere ESTA espécie" da próxima luta.
  // Dificuldade Elite (código oficial): innates do jogador liberam pelo nível do Pokémon.
  function avisoInnatesEliteIA(ctx) {
    ctx = completarCtx(ctx);
    if (ctx.settings.difficulty !== "elite") return "";
    var cap = ctx.cap;
    return "INNATES NO ELITE: no jogador, a habilidade escolhida vale sempre; a 1a innate vale desde o nivel 1, a 2a so a partir do nivel 17 " +
      "e a 3a so a partir do nivel 24 do Pokemon" + (cap ? " (cap atual " + cap + ")" : "") + ". Nao conte com innate que o nivel ainda nao liberou.";
  }
  function linhasContextoComumIA(sp, chefao, ctx) {
    ctx = completarCtx(ctx);
    var linhas = avisoInnatesEliteIA(ctx) ? [avisoInnatesEliteIA(ctx)] : [];
    var faltam = getRemainingBossEntries(ctx);
    if (faltam.length) {
      var contagem = {};
      faltam.forEach(function (b) {
        b.party.forEach(function (m) {
          var f = getSpeciesByX(m.x);
          if (f) speciesTypeNames(f).forEach(function (t) { contagem[t] = (contagem[t] || 0) + 1; });
        });
      });
      linhas.push("Chefoes que faltam: " + faltam.map(function (b) { return b.name; }).join(", ") + ". Tipos mais comuns neles: " +
        Object.keys(contagem).sort(function (a, b) { return contagem[b] - contagem[a]; }).slice(0, 6).join(", ") + ".");
    }
    return linhas.concat(linhasProximaLutaIA(sp, chefao, ctx));
  }

  // Set que o simulador provou contra o chefão (lote B): a IA mantém a habilidade e os
  // golpes-chave, salvo motivo forte escrito na rationale - o app re-simula as builds reais.
  function linhaProvadoIA(p) {
    var chaves = Object.keys(p.chave || {}).map(function (f) { return dadoExterno(p.chave[f]) + " contra " + dadoExterno(f); });
    return "O SIMULADOR PROVOU ESTE POKEMON com habilidade " + dadoExterno(p.habilidade) + ", set " + p.set +
      " e os golpes " + p.golpes.map(dadoExterno).join(", ") + (chaves.length ? " (golpe-chave: " + chaves.join("; ") + ")" : "") +
      ". Mantenha a habilidade e os golpes-chave, salvo motivo forte escrito na rationale; o app simula de novo o time com as builds reais.";
  }
  // Formato JSON de uma build (o mesmo no prompt individual e no lote).
  var FORMATO_BUILD_IA = '{"papel":"Tanque|Pivô|Wallbreaker|Sweeper","ability":"...","nature":"...","item":"...","moves":["...","...","...","..."],"evs":[hp,atk,def,spa,spd,spe],"plano":{"golpe de agora":"golpe futuro"},"rationale":"..."}';
  // Prompt da build de UM membro (botão "Gerar com IA", revisão pós-evolução,
  // golpe-ponte da curada). Texto e dados só - quem pede é pedirIA().
  function montarPromptBuild(sp, opts) {
    opts = opts || {};
    var ctx = completarCtx(opts.ctx);
    var cap = ctx.cap;
    var archetypeParts = archetypeBuildGuidance(ctx);
    return cabecalhoIA() +
      "Monte um set competitivo, formato Pokemon Showdown, para o Pokemon " + sp.n +
      " (build " + versaoDosDados() + ").\n" +
      blocoEspecieIA(sp, false, ctx) +
      blocoMovepoolIA(sp, false, ctx) +
      blocoPapelIA(sp, false, true, ctx) +
      blocoCondicoesIA(sp) +
      blocoManualIA(sp) +
      blocoRegrasDePapelIA() +
      blocoMegaIA(sp, false) +
      blocoItensIA(sp, false, ctx) +
      blocoTimeEmUsoIA(sp, ctx) +
      (cap ? ("Level cap atual do jogador: " + cap + "\n") : "") +
      (archetypeParts.length ? (archetypeParts.join("\n") + "\n") : "") +
      blocoContextoIA(sp, opts.chefao, ctx) +
      contextoDoModoPrompt(sp, opts, cap) +
      planoPromptBlock(sp, cap) +
      textoOrdemDeDecisaoIA(archetypeParts) +
      "Responda SOMENTE com um objeto JSON neste formato exato, sem texto ao redor: " + FORMATO_BUILD_IA +
      textoRegrasDoFormatoIA(archetypeParts);
  }
  function textoRegrasDoFormatoIA(archetypeParts) {
    return ". nature precisa ser uma nature real de Pokemon (ex: Adamant, Modest, Jolly, Timid). " +
      "evs sao 6 numeros inteiros de 0 a 252, somando no maximo 510. " +
      "rationale e 1-2 frases curtas em portugues: o papel e como habilidade, golpes e item servem a ele, com base no time/rank/momento do jogo" +
      (archetypeParts.length ? "/Estilo, Clima e campo ou Tatica do time" : "") + ". " +
      "Nao invente golpes, habilidades ou items fora do que foi listado.";
  }
  // Ordem de decisão (2026-09-27, revisão do prompt: antes era uma lista de
  // "use também a ferramenta X" sem ordem; o papel só aparecia no fim).
  function textoOrdemDeDecisaoIA(archetypeParts) {
    return "ORDEM DE DECISAO - siga nesta ordem:\n" +
      "1. PAPEL: escolha o papel (Tanque, Pivô, Wallbreaker, Sweeper) pelo papel natural acima, pelo que o time precisa (fraquezas do time e rank desta especie acima) e pelos chefoes que faltam" +
      (archetypeParts.length ? " - SEMPRE alinhado ao Estilo/Clima e campo/Tatica/Monotype do time informado acima, isso pesa mais que qualquer outra consideracao" : "") + ".\n" +
      "2. HABILIDADE e SINERGIA: leia o efeito de cada habilidade e innate acima e escolha a habilidade que, somada as innates, mais reforca o papel; depois os golpes devem ATIVAR o maximo dessas habilidades (nao so uma). " +
      "A sinergia habilidade x golpe confirmada esta no CONTEXTO. REGRA OBRIGATORIA (pedido do usuario, 2026-09-15): se houver QUALQUER sinergia la, " +
      "a build PRECISA incluir pelo menos um desses golpes e a sinergia precisa estar ATIVA (innate, ou a habilidade escolhida ser a que ativa) - senao e REJEITADA. " +
      "Habilidade condicional so vale com a condicao garantida (lista HABILIDADES CONDICIONAIS acima); os combos que a propria especie ativa sozinha estao no CONTEXTO - inclua quando combinar com o papel e cite na rationale.\n" +
      "3. GOLPES: STAB mais forte do papel, golpes que ativam as habilidades, prioridade (veja acima), pivô se o papel for Pivô, cobertura pro que resiste ao STAB. " +
      "Proxima luta (CONTEXTO): quando um golpe responder a uma ameaca concreta dela, prefira e cite o chefao na rationale.\n" +
      "4. ITEM: o que mais reforca o papel/habilidade/golpes, respeitando as regras de item acima.\n" +
      "5. NATURE e EVs: seguem o papel (tabela acima). Decida EV de Velocidade pelos numeros de Velocidade do CONTEXTO - nao chute se 252 e rapido o bastante; se ja e rapida o suficiente, invista o resto em bulk/ataque.\n" +
      "6. TIME: confira que a build nao repete golpe/papel do time sem motivo (item pode repetir) e cobre alguma fraqueza dele.\n";
  }

  // Lote de builds do time (2026-09-30, decisão do usuário na reunião de
  // alinhamento: "sim, uma chamada pro time"). As 6 builds numa consulta só: o que
  // é igual pro time (regras, itens, chefões, ordem de decisão, formato) vai UMA
  // vez; cada espécie leva só o que é dela. Medido: ~20 mil caracteres por build
  // individual, ~8-10 mil deles iguais entre espécies.
  // opts: { chefao: { boss, party, clima, estrategia }, responde: { sname: [nomes] } }.
  function montarPromptBuildsDoTime(members, opts) {
    opts = opts || {};
    var ctx = completarCtx(opts.ctx);
    var cap = ctx.cap;
    var archetypeParts = archetypeBuildGuidance(ctx);
    var c = opts.chefao;
    var objetivo = c
      ? "OBJETIVO DESTE TIME: vencer " + dadoExterno(c.boss.name) + " (time dele no CONTEXTO). O time foi escolhido pelo simulador de duelo do app; " +
        "abaixo, em cada Pokemon, os Pokemon do chefao a que ele responde - golpes, item e EVs precisam vencer ESSES duelos" +
        (c.estrategia
          ? ". ESTRATEGIA DO TIME: " + dadoExterno(c.estrategia.armador) + " arma " + (NOME_DA_CONDICAO[c.estrategia.clima] || c.estrategia.clima) +
            " ao entrar (" + dadoExterno(c.estrategia.habilidade) + ")" +
            (c.estrategia.aproveitam.length ? " e " + c.estrategia.aproveitam.map(dadoExterno).join(", ") + " jogam nesse clima" : "") + " - aproveite habilidades e golpes que rendem nele"
          : (c.clima ? ". O chefao arma " + (c.clima === "sol" ? "sol (golpes Fire mais fortes)" : "chuva (golpes Water mais fortes)") + " - leve isso em conta" : "")) +
        ". Cite o chefao e os Pokemon dele na rationale.\n"
      : "";
    var especies = members.map(function (sp, i) {
      var resp = (opts.responde && opts.responde[sp.sname]) || [];
      return "=== POKEMON " + (i + 1) + " de " + members.length + ": " + sp.n + " (chave \"" + sp.sname + "\") ===\n" +
        blocoEspecieIA(sp, false, ctx) +
        blocoMovepoolIA(sp, false, ctx) +
        blocoPapelIA(sp, false, true, ctx) +
        blocoCondicoesIA(sp) +
        blocoManualIA(sp) +
        blocoMegaIA(sp, false) +
        blocoItensDaEspecieIA(sp) +
        envelopeContextoIA(linhasContextoDaEspecieIA(sp, ctx)) +
        (c && resp.length ? "Este Pokemon e a resposta do time para: " + resp.map(dadoExterno).join(", ") + ".\n" : "") +
        (opts.provado && opts.provado[sp.sname] ? linhaProvadoIA(opts.provado[sp.sname]) + "\n" : "") +
        planoPromptBlock(sp, cap);
    }).join("");
    return cabecalhoIA() +
      "Monte um set competitivo, formato Pokemon Showdown, para CADA um dos " + members.length + " Pokemon deste time (build " + versaoDosDados() + "). " +
      "Eles jogam JUNTOS: varie papeis e golpes entre eles, cubra as fraquezas uns dos outros e no MAXIMO " + MAX_MESMO_ITEM_NO_TIME +
      " do time com o mesmo item. Primeiro o que vale pro time todo; depois, os dados de cada Pokemon.\n" +
      blocoRegrasDePapelIA() +
      blocoItensComunsIA(false, "", ctx) +
      (cap ? ("Level cap atual do jogador: " + cap + "\n") : "") +
      (archetypeParts.length ? (archetypeParts.join("\n") + "\n") : "") +
      envelopeContextoIA(linhasContextoComumIA(null, c, ctx)) +
      objetivo +
      especies +
      textoOrdemDeDecisaoIA(archetypeParts) + "Faca isso para CADA Pokemon.\n" +
      "Responda SOMENTE com um objeto JSON neste formato exato, sem texto ao redor: " +
      '{"builds":{"CHAVE_DO_POKEMON":' + FORMATO_BUILD_IA + ', ...}} - uma entrada por Pokemon, usando a chave dada no titulo de cada um' +
      textoRegrasDoFormatoIA(archetypeParts);
  }

  // Prompt das Estratégias (2 a 3 sets de papéis diferentes da espécie).
  function montarPromptEstrategias(sp, ctx) {
    ctx = completarCtx(ctx);
    var cap = ctx.cap;
    // Achado em auditoria, 2026-09-18: "Estratégias" gerava sets sem NUNCA
    // olhar se já existe um build curado real (data/builds.json) pra esta
    // espécie - risco de redundância (ou pior, contradição) com um set que
    // já foi verificado por um jogador de verdade. Só avisa e pede
    // diferenciação - nunca bloqueia nem repete a regra "dura" de
    // validateAiBuild (a mesma assimetria de sempre: builds curadas têm
    // gente real respondendo por elas, "Estratégias" não pode se impor).
    var curados = curadasDe(sp.sname);
    var curadoPromptLine = curados.length
      ? ("Já existe" + (curados.length > 1 ? "m " + curados.length + " builds CURADOS" : " um build CURADO") + " real (verificado) pra " + sp.n + ": " +
         curados.map(function (c) {
           return "[" + (c.estilo || estiloDeEvs(c.evs)) + ", fonte " + c.fonte + "] habilidade " + c.ability + ", item " + (c.item || "nenhum") + ", golpes " + c.moves.join("/");
         }).join("; ") +
         ". Os sets que você montar aqui devem ser DIFERENTES desses - não repita a mesma combinação de papel.\n")
      : "";
    return cabecalhoIA() +
      "Monte de 2 a 3 sets competitivos DISTINTOS (formato Pokemon Showdown), estilo dex do Smogon, para o Pokemon " +
      sp.n + " (build " + versaoDosDados() + "). Cada set precisa ter um PAPEL real e diferente " +
      "dos outros (ex: wallbreaker especial, sweeper físico, suporte/tanque, setup...) - só inclua um papel se ele " +
      "genuinamente fizer sentido pra esta espécie neste hack; 2 sets bons valem mais que 3 forçados.\n" +
      blocoEspecieIA(sp, true, ctx) +
      blocoMovepoolIA(sp, true, ctx) +
      blocoPapelIA(sp, true, false, ctx) +
      blocoCondicoesIA(sp) +
      blocoManualIA(sp) +
      blocoRegrasDePapelIA() +
      blocoMegaIA(sp, true) +
      blocoItensIA(sp, true, ctx) +
      (cap ? ("Level cap atual do jogador: " + cap + "\n") : "") +
      curadoPromptLine +
      blocoContextoIA(sp, undefined, ctx) +
      "Fundamente os papeis no rank e na sinergia do CONTEXTO - " +
      "se houver sinergia habilidade x golpe confirmada, PELO MENOS UM dos sets precisa usar um golpe dela com " +
      "a habilidade que ativa a sinergia (innate conta sempre). Se o CONTEXTO trouxer um combo que a propria " +
      "especie ativa sozinha (habilidade condicional + golpe que satisfaz a condicao) e ele fizer sentido pro " +
      "papel de algum dos sets, use-o nesse set e cite na rationale; nao force em todos, alguns papeis nao " +
      "combinam com o golpe. Pelo menos um dos sets deve responder a uma ameaca concreta da proxima luta do " +
      "CONTEXTO (golpe ou resistencia contra o elenco real dela), citando o chefao na rationale. Se algum set " +
      "for um sweeper/atacante rapido, confira nos numeros de Velocidade do CONTEXTO que o EV escolhido " +
      "realmente ultrapassa uma fatia relevante do jogo - nao chute.\n" +
      "Responda SOMENTE com um objeto JSON neste formato exato, sem texto ao redor: " +
      '{"sets":[{"name":"...","papel":"Tanque|Pivô|Wallbreaker|Sweeper","ability":"...","nature":"...","item":"...","moves":["...","...","...","..."],"evs":[hp,atk,def,spa,spd,spe],"rationale":"..."}]}' +
      ". 'name' e um rotulo curto do papel (2-4 palavras, ex: 'Wallbreaker Especial'). nature precisa ser uma " +
      "nature real de Pokemon. evs sao 6 numeros de 0 a 252, somando no maximo 510. rationale e 1-2 frases curtas " +
      "em portugues explicando a escolha. Nao invente golpes, habilidades ou items fora do que foi listado.";
  }

  // Plano pra uma build que o jogador montou à mão: a IA não mexe em nada da
  // build, só aponta o golpe futuro de cada slot. "" = não há golpe por liberar
  // (nada a perguntar).
  function montarPromptPlano(sp, entry, cap) {
    var bloco = planoPromptBlock(sp, cap);
    if (!bloco) return "";
    return "Voce e o especialista em meta do Pokemon Elite Redux (ROM hack de Pokemon). " + PROMPT_DADOS_AVISO + "\n" +
      "O jogador montou esta build a mao para " + sp.n + " (tipo " + speciesTypeNames(sp).join("/") + ") e ela NAO deve mudar: habilidade " +
      dadoExterno(entry.ability || "?") + ", golpes " + entry.moves.map(dadoExterno).join(", ") + ". Level cap atual: " + cap + ".\n" + bloco +
      "Responda SOMENTE com um objeto JSON: {\"plano\":{\"golpe de agora\":\"golpe futuro\"}} - objeto vazio se nenhuma troca for claramente melhor.";
  }

  // Gerador de time por arquétipo: quem o jogador tem (time + caixa), já
  // filtrado - Mega conta como a base antes da 4ª insígnia, Monotype é REGRA
  // (filtra antes de ir pro prompt). Devolve { roster, validSnames }.
  function rosterParaTimeIA(monotype) {
    var rosterXs = xsDoJogador();
    var roster = rosterXs.map(getSpeciesByX).filter(Boolean);
    // Antes da 4ª insígnia uma forma Mega já no time/caixa conta como a base
    // dela (achado do usuário, 2026-09-24: "Altaria Mega" na caixa entrava na
    // sugestão de time sem o jogador ter acesso a Mega ainda) - sem duplicar a
    // mesma criatura se as duas formas estiverem no roster.
    var jaNoRoster = {};
    roster = roster.map(usableSpeciesFor).filter(function (sp) {
      if (jaNoRoster[sp.x]) return false;
      jaNoRoster[sp.x] = true;
      return true;
    });
    // Monotype é uma REGRA, não uma sugestão de estilo pra IA seguir por
    // conta própria (ao contrário de Ritmo/Clima) - o roster já sai
    // filtrado por tipo real antes de qualquer coisa ir pro prompt, então
    // é impossível a IA "esquecer" e sugerir um tipo fora disso.
    if (monotype) roster = roster.filter(function (sp) { return speciesTypeNames(sp).indexOf(monotype) !== -1; });
    // Formas mega de quem o jogador tem também valem - mas só depois da 4ª
    // insígnia (battleFamilyOf).
    var validSnames = [];
    roster.forEach(function (sp) {
      battleFamilyOf(sp).forEach(function (f) { if (validSnames.indexOf(f.sname) === -1) validSnames.push(f.sname); });
    });
    return { roster: roster, validSnames: validSnames };
  }
  // Mono run (2026-09-26): por candidato, as fraquezas do time que ele cobre e
  // se sai do tipo ao evoluir; e quem o jogador tem que ainda não é do tipo mas
  // vira (evolução ou Mega) - fica fora do time, mas a IA pode citar.
  function notaMonoDoCandidato(sp, tipo) {
    var cobre = cobreFraquezas(sp, fraquezasDoTipo(tipo));
    var muda = mudancaDeTipo(sp, tipo);
    return (cobre.length ? ", cobre fraqueza do time a " + cobre.join("/") : "") +
      (muda && muda.sai ? ", SAI do tipo " + tipo + " ao evoluir pra " + muda.sai.join("/") + " (nao evolua ou segure Everstone)" : "");
  }
  function viramDoTipoPrompt(tipo) {
    var vistos = {};
    var viram = xsDoJogador().map(getSpeciesByX).filter(function (sp) {
      if (!sp || vistos[sp.x]) return false;
      vistos[sp.x] = true;
      var m = mudancaDeTipo(sp, tipo);
      return !!(m && m.vira);
    }).map(function (sp) { return sp.n + (mudancaDeTipo(sp, tipo).vira === "M" ? " (so na Mega)" : " (ao evoluir)"); });
    return viram.length ? "O jogador tambem tem, ainda fora do tipo " + tipo + " mas que viram " + tipo + ": " + viram.join(", ") +
      " - NAO entram no time agora; se valer a pena esperar a evolucao, diga no reasoning.\n" : "";
  }
  function montarPromptTimeArquetipo(roster, pace, weather, monotype, ctx) {
    ctx = completarCtx(ctx);
    var rosterDesc = roster.map(function (sp) {
      var role = SPECIES_ROLE[sp.sname];
      var roleNames = (role && role.roles || []).map(function (r) { return ROLE_LABEL_PT[r] || r; });
      var r = rankDe(sp.sname);
      var build = effectiveBuild(sp);
      var innNames = sp.inn.map(function (id) { return ABILITIES[id][0]; });
      var abiNames = habilidadesEscolhiveis(sp);
      return sp.sname + " " + sp.n + " (" + speciesTypeNames(sp).join("/") + formFamilyPromptNote(sp) + "), Velocidade base " + sp.b[5] +
        (r ? ", rank " + r.tier : "") + (roleNames.length ? ", papel " + roleNames.join("/") : "") +
        ", innate: " + innNames.join(", ") +
        (build ? ", habilidade escolhida: " + build.ability : ", habilidades escolhíveis: " + abiNames.join(", ")) +
        (monotype ? notaMonoDoCandidato(sp, monotype) : "");
    }).join("\n");
    var focusDesc = [pace ? "Estilo: " + pace : "", weather ? "Clima e campo: " + rotuloDoArquetipoDeCampo(weather) : "", ctx.archetype.tatica ? "Tatica: " + ctx.archetype.tatica : "", monotype ? "Monotype: " + monotype : ""].filter(Boolean).join(" + ");
    return "Você é o especialista em meta do Pokemon Elite Redux (ROM hack), build " +
      versaoDosDados() + ". Monte o MELHOR time possível de até 6 Pokémon, usando " +
      "SOMENTE espécies desta lista real que o jogador já possui (time + caixa) - nunca invente nem sugira " +
      "algo fora dela:\n" + rosterDesc + "\n\n" +
      "Foco pedido: " + focusDesc + ".\n" +
      (megaEvolutionUnlocked() ? "" : "MEGA EVOLUCAO: AINDA NAO DISPONIVEL - o jogador so consegue Mega Evolucao depois da " + rotuloDaEtapaDaMegaLiberada() + ". NAO sugira nenhuma forma mega nem conte com mega no time; use so as formas base da lista.\n") +
      (avisoInnatesEliteIA(ctx) ? avisoInnatesEliteIA(ctx) + "\n" : "") +
      (monotype ? "A lista acima JÁ está filtrada só pro tipo " + monotype + " (Monotype) - todos servem, escolha pela sinergia entre eles.\n" +
        "Na " + orientacaoMono(monotype) + " Entre candidatos parecidos, prefira quem cobre mais dessas fraquezas.\n" +
        viramDoTipoPrompt(monotype) : "") +
      "Use as ferramentas disponíveis pra checar rank/papel/sinergia real de candidatos específicos antes de " +
      "decidir - não confie só no resumo acima. Evite concentrar o mesmo papel sem necessidade real (ex: 4 " +
      "tanques só faz sentido pra um time Stall de verdade) - a menos que o foco pedido exija isso. Use a " +
      "Velocidade base listada pra julgar times que dependem de controle de velocidade (Trick Room quer " +
      "Velocidade baixa e uniforme; Hyper Offense/Sand-Rain-Sun times ofensivos geralmente querem Velocidade " +
      "alta).\n" +
      "Responda SOMENTE com um objeto JSON neste formato exato, sem texto ao redor: " +
      '{"team":["sname1","sname2",...],"reasoning":"..."}' +
      ". team tem NO MÁXIMO 6 snames, todos da lista acima, sem repetir - se a lista tiver menos de 6 " +
      "espécies que façam sentido pro foco pedido, devolva menos, nunca invente pra completar 6. reasoning " +
      "é 2-4 frases curtas em português explicando as escolhas e, se relevante, o que foi deixado de fora e " +
      "por quê.";
  }
  // Snames da resposta que valem: só da lista real, sem repetir, até 6 (dedupe
  // aqui também, 2026-09-12: sname repetido mostrava o chip 2 vezes na proposta).
  function snamesValidosDoTime(raw, validSnames) {
    var seenSname = {};
    return Array.isArray(raw && raw.team)
      ? raw.team.filter(function (sn) {
          if (typeof sn !== "string" || validSnames.indexOf(sn) === -1 || seenSname[sn]) return false;
          seenSname[sn] = true;
          return true;
        }).slice(0, 6)
      : [];
  }

  // Guia de uso do time recém-montado (Gerador Inteligente de Times).
  function descricaoTimeParaGuia(members) {
    return members.map(function (sp) {
      var build = effectiveBuild(sp);
      var role = SPECIES_ROLE[sp.sname];
      var roleNames = (role && role.roles || []).map(function (r) { return ROLE_LABEL_PT[r] || r; });
      return sp.n + " (" + speciesTypeNames(sp).join("/") + formFamilyPromptNote(sp) + "), sname " + sp.sname +
        (roleNames.length ? ", papel " + roleNames.join("/") : "") + ", Velocidade base " + sp.b[5] +
        (build ? ", build ativa: habilidade " + build.ability + ", item " + (build.item || "nenhum") + ", golpes " + build.moves.join("/") : ", sem build salva ainda");
    }).join("\n");
  }
  function montarPromptGuia(members, focusDesc) {
    var teamList = descricaoTimeParaGuia(members);
    return "Você é o especialista em meta do Pokemon Elite Redux (ROM hack), build " +
      versaoDosDados() + ", formato 1x1.\n" +
      "Acabou de ser montado este time (foco: " + focusDesc + "):\n" + teamList + "\n\n" +
      "Escreva um guia PRÁTICO de como jogar ESTE time especificamente, usando as builds reais listadas " +
      "acima - nunca um texto genérico sobre o arquétipo. Use getTeamWeaknesses e, pra " +
      "membros específicos, getSpeciesRank/getPriorityMoveOptions antes de responder, em vez de chutar.\n" +
      "Responda SOMENTE com um objeto JSON neste formato exato, sem texto ao redor: " +
      '{"concept":"...","opening":"...","development":"...","winCondition":"...","threats":"...","threatMemberSname":"..."}' +
      ". Cada campo de texto é corrido em português, sem markdown, sem lista. concept: 1-2 frases, a proposta " +
      "do time e como ele costuma vencer. opening: 2-3 frases, quem tende a abrir a partida e o que observar " +
      "nos primeiros turnos. development: 2-3 frases, como posicionar, quando trocar, quando usar suporte, " +
      "como preservar recursos importantes. winCondition: 1-2 frases, qual Pokémon ou combinação costuma " +
      "fechar a partida e o que preservar pra isso. threats: 2-3 frases sobre as ameaças da run em geral para este time (Meu Time monta o melhor time no geral, sem focar em " +
      "nenhum chefão): os tipos, papéis ou estratégias de adversário que mais castigam o time (use getTeamWeaknesses), dizendo qual " +
      "integrante segura cada uma e por quê (tipo, golpe ou stat real dele, nunca chutado). Pode citar um chefão como exemplo, sem " +
      "focar nele. threatMemberSname: o sname EXATO (dos listados acima, ex: SPECIES_CHARIZARD) do integrante que mais segura essas " +
      "ameaças - vazio se nenhum segura. Não invente golpe/habilidade/item fora do que foi listado acima - se não tiver " +
      "certeza de algo, seja mais genérico em vez de arriscar.";
  }
  // Resposta do guia -> campos de texto limitados; threatMemberX só se o sname
  // for de um integrante REAL desta equipe (nunca confia no que a IA escreveu).
  function guiaDaResposta(raw, members) {
    if (!raw || typeof raw !== "object") return null;
    var snameParaX = {};
    members.forEach(function (sp) { snameParaX[sp.sname] = sp.x; });
    var pick = function (k) { return (typeof raw[k] === "string") ? raw[k].slice(0, 500) : ""; };
    return {
      concept: pick("concept"), opening: pick("opening"), development: pick("development"),
      winCondition: pick("winCondition"), threats: pick("threats"),
      threatMemberX: (typeof raw.threatMemberSname === "string" && snameParaX.hasOwnProperty(raw.threatMemberSname))
        ? snameParaX[raw.threatMemberSname] : null
    };
  }
