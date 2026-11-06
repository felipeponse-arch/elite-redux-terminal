  // ===== src/regras/validacao_build_ia.js =====
  // Validação da build sugerida pela IA contra o dado real.
  // Colado dentro do <script> principal do app por scripts/build.mjs (marcador
  // @regras validacao_build_ia.js), no mesmo escopo do resto do código - sem module,
  // sem wrapper. Só lógica pura: nada aqui lê a página (item D1 da pauta
  // técnica, 2026-09-16), o que permite carregar este arquivo no Node pros
  // testes unitários (tests/unit/).

  // ctx explícito das regras puras (TK-19): { archetype, team, settings, cap }. Este é o ÚNICO ponto das regras de build que lê o state.
  function ctxDoState() { return { archetype: state.archetype, team: state.team, box: state.box, settings: state.settings, cap: getCurrentCap() }; }
  function completarCtx(ctx) { return ctx && ctx.settings && ctx.archetype && ctx.team && ctx.cap !== undefined ? ctx : Object.assign(ctxDoState(), ctx || {}); }

  // No modo temporário, uma forma mega só existe na luta se estiver segurando
  // a pedra - o slot de item é dela. No permanente (ou pra forma base, que
  // pode lutar sem mega-evoluir) não há regra. Mega sem pedra conhecida
  // (Primal por orbe fora do mega_forms, Rayquaza por golpe) também fica sem
  // regra - nunca inventar item.
  function megaStoneRuleFor(sp) {
    if (megaMode() !== "temporaria" || !isMegaForm(sp)) return null;
    var stones = stonesOf(sp);
    if (!stones.length) return null;
    return {
      stones: stones,
      prompt: "ITEM OBRIGATORIO: no modo temporario esta forma so existe segurando a pedra - item tem que ser " + stones.join(" ou ") + "."
    };
  }
  // Habilidades que só funcionam gastando o item segurado (2026-09-26, pedido do
  // usuário: "as berry do jogo não são sugeridas nas build, pq?"). Medido: 36
  // espécies têm uma destas como INNATE (sempre ativa) e a IA quase não tinha
  // berry pra escolher - a habilidade ficava sem efeito nenhum. Descrições do
  // próprio jogo: Gluttony "Eats berries early", Ripen "Doubles ... provided by
  // Berries", Harvest "recycle a used Berry", Cud Chew "Eats berries again" -
  // precisam de BERRY; Unburden "Consuming its held item doubles Speed" - vale
  // qualquer item que se gasta em batalha. (Cheek Pouch: "This ability has no
  // effect" neste hack, fica de fora.)
  var HABILIDADES_DE_BERRY = ["Gluttony", "Ripen", "Harvest", "Cud Chew"];
  var ITENS_GASTOS_NA_LUTA = [
    "Focus Sash", "White Herb", "Mental Herb", "Power Herb", "Weakness Policy",
    "Blunder Policy", "Air Balloon", "Booster Energy", "Throat Spray", "Room Service",
    "Adrenaline Orb", "Eject Button", "Eject Pack", "Red Card", "Snowball",
    "Cell Battery", "Absorb Bulb", "Luminous Moss", "Electric Seed", "Psychic Seed",
    "Misty Seed", "Grassy Seed"
  ];
  function ehBerry(item) { return /Berry$/.test(item || ""); }
  function itemSeGastaNaLuta(item) {
    return ehBerry(item) || / Gem$/.test(item || "") || ITENS_GASTOS_NA_LUTA.indexOf(item) !== -1;
  }
  // Qual exigência vale pra esta build: innate manda sempre; habilidade
  // escolhível só se for a escolhida. Berry é mais restrita que "gasta na
  // luta", então ganha quando as duas valem. null = sem exigência.
  function regraItemConsumivelPara(sp, habilidadeEscolhida) {
    var innates = uniqueIds(sp.inn || []).map(function (id) { return ABILITIES[id] ? ABILITIES[id][0] : ""; });
    var ativas = innates.concat(habilidadeEscolhida ? [habilidadeEscolhida] : []);
    var deBerry = ativas.filter(function (n) { return HABILIDADES_DE_BERRY.indexOf(n) !== -1; })[0];
    if (deBerry) return { habilidade: deBerry, precisa: "berry" };
    if (ativas.indexOf("Unburden") !== -1) return { habilidade: "Unburden", precisa: "consumivel" };
    return null;
  }
  // ---- Papel e item (2026-09-27, revisão do prompt de build pedida pelo
  // usuário: "se um Pokémon é tanque ele não prioriza a velocidade, prioriza
  // defesa ou HP; se é pivô prioriza as coisas de pivô..."; "os itens que ele
  // usa também devem melhorar alguma coisa"). Só contradição CLARA reprova -
  // a IA decide os detalhes dentro do papel que ela mesma declarou.
  var PAPEIS_VALIDOS = { "tanque": "Tanque", "pivo": "Pivô", "pivô": "Pivô", "wallbreaker": "Wallbreaker", "sweeper": "Sweeper" };
  function papelNormalizado(p) {
    return typeof p === "string" ? (PAPEIS_VALIDOS[p.trim().toLowerCase()] || null) : null;
  }
  // evs = [hp, atk, def, spa, spd, spe]
  function conferirPapelDaBuild(papel, evs, moves, sp, ctx) {
    ctx = completarCtx(ctx);
    var bulk = evs[0] + evs[2] + evs[4];
    if (papel === "Tanque") {
      if (evs[5] > 100) return "A build foi declarada Tanque mas tem " + evs[5] + " EVs em Velocidade - tanque investe em HP e defesa, não em Velocidade. Tente gerar de novo.";
      if (bulk < 252) return "A build foi declarada Tanque com só " + bulk + " EVs em HP/Defesa/Def. Especial - tanque precisa de bulk. Tente gerar de novo.";
    }
    // Trick Room inverte a ordem: sweeper lento é o certo lá.
    if (papel === "Sweeper" && ctx.archetype.weather !== "Trick Room" && evs[5] < 180) {
      return "A build foi declarada Sweeper com só " + evs[5] + " EVs em Velocidade - sweeper precisa ser rápido. Tente gerar de novo.";
    }
    if (papel === "Wallbreaker" && Math.max(evs[1], evs[3]) < 200) {
      return "A build foi declarada Wallbreaker sem investir no ataque (máx. " + Math.max(evs[1], evs[3]) + " EVs) - wallbreaker maximiza dano. Tente gerar de novo.";
    }
    if (papel === "Pivô") {
      var disponiveis = availableMovesFor(sp, ctx).names.filter(ehGolpeDePivo);
      if (disponiveis.length && !moves.some(ehGolpeDePivo)) {
        return "A build foi declarada Pivô sem golpe de troca, mas esta forma tem " + disponiveis.join(", ") + ". Tente gerar de novo.";
      }
    }
    return null;
  }
  // Combinações que se anulam, pela descrição do próprio jogo: Choice "permits
  // only that move" (status trava o Pokémon num golpe sem dano - Trick e
  // Switcheroo passam o item e são a exceção clássica), Assault/Tactical Vest
  // "prevents the use of status moves", Eviolite só pra "Pokémon that can evolve".
  var ITENS_CHOICE = ["Choice Band", "Choice Specs", "Choice Scarf"];
  var ITENS_VEST = ["Assault Vest", "Tactical Vest"];
  var GOLPES_QUE_PASSAM_ITEM = ["Trick", "Switcheroo"];
  // Nature contra a própria build (manual competitivo, 2026-09-28): derrubar o
  // atributo de ataque que TODOS os golpes de dano usam, ou a Velocidade de um
  // Sweeper fora de Trick Room, é desperdício puro - regra básica de nature
  // (guias de iniciante do Smogon), aqui só a contradição clara reprova.
  var GOLPES_SEM_O_PROPRIO_ATAQUE = ["Body Press", "Foul Play"];
  function conflitoDeNature(nature, moves, papel, ctx) {
    ctx = completarCtx(ctx);
    var mods = NATURE_MODS[nature];
    if (!mods) return null;
    // Body Press ("maior for o Def do usuário") e Foul Play ("maior o Ataque do
    // oponente") são físicos mas não usam o Ataque do usuário (texto do jogo) -
    // um tanque de nature -Atk com Body Press é o set certo, não um conflito.
    var cats = moves.filter(function (m) { return moveRoleOf(m) === "dano" && GOLPES_SEM_O_PROPRIO_ATAQUE.indexOf(m) === -1; }).map(function (m) {
      var mv = MOVE_BY_NAME[m];
      return mv ? DATA.splits[mv[2]] : "";
    });
    var fisicos = cats.filter(function (c) { return c === "PHYSICAL"; }).length;
    var especiais = cats.filter(function (c) { return c === "SPECIAL"; }).length;
    if (fisicos && !especiais && mods[1] === 1) return "A nature " + nature + " reduz o Ataque, mas todos os golpes de dano da build são físicos. Tente gerar de novo.";
    if (especiais && !fisicos && mods[1] === 3) return "A nature " + nature + " reduz o Ataque Especial, mas todos os golpes de dano da build são especiais. Tente gerar de novo.";
    if (papel === "Sweeper" && mods[1] === 5 && ctx.archetype.weather !== "Trick Room") return "A nature " + nature + " reduz a Velocidade de um Sweeper. Tente gerar de novo.";
    return null;
  }
  function conflitoDeItem(item, moves, sp) {
    if (!item) return null;
    // Texto do jogo: "Gradually restores HP of Poison-types. Damages others."
    if (item === "Black Sludge" && speciesTypeNames(sp).indexOf("Poison") === -1) {
      return "Black Sludge causa dano em quem não é tipo Poison, e " + sp.n + " não é. Tente gerar de novo.";
    }
    var status = moves.filter(function (m) { var mv = MOVE_BY_NAME[m]; return mv && DATA.splits[mv[2]] === SPLIT_STATUS; });
    if (ITENS_CHOICE.indexOf(item) !== -1) {
      var travado = status.filter(function (m) { return GOLPES_QUE_PASSAM_ITEM.indexOf(m) === -1; })[0];
      if (travado) return item + " trava o Pokémon num golpe só, e a build tem " + travado + " (golpe de status) - com Choice ele ficaria preso sem causar dano. Tente gerar de novo.";
    }
    if (ITENS_VEST.indexOf(item) !== -1 && status.length) {
      return item + " impede golpe de status neste jogo, mas a build tem " + status.join(", ") + ". Tente gerar de novo.";
    }
    if (item === "Eviolite" && !evioliteFunciona(sp)) {
      return "Eviolite só funciona em quem ainda evolui, e " + sp.n + " não evolui mais. Tente gerar de novo.";
    }
    return null;
  }

  // Texto que o modelo escreveu, citado num motivo de rejeição. O motivo volta ao modelo na nova tentativa e
  // aparece na tela: sem limite, uma resposta enorme ou com quebras de linha entraria inteira no prompt.
  function citarDoModelo(v) {
    return String(v).replace(/\s+/g, " ").slice(0, 40);
  }
  // 6 valores, cada um número (ou número escrito entre aspas). Fora disso não é uma lista de EVs.
  function evsEmFormatoValido(evs) {
    return Array.isArray(evs) && evs.length === 6 && evs.every(function (v) {
      return (typeof v === "number" || typeof v === "string") && !isNaN(parseInt(String(v), 10));
    });
  }
  // Os limites do jogo: 0 a 252 por atributo e 510 no total (a soma acima disso é reduzida na mesma proporção,
  // em múltiplos de 4). Único lugar: a build da IA e os EVs copiados de uma build curada passam por aqui.
  function limitarEvsAoJogo(evs) {
    var out = evs.map(function (v) { return clampInt(v, 0, 252, 0); });
    var soma = out.reduce(function (a, v) { return a + v; }, 0);
    if (soma > 510) {
      var escala = 510 / soma;
      out = out.map(function (v) { return Math.floor((v * escala) / 4) * 4; });
    }
    return out;
  }

  // Checks an AI-suggested build against this species' REAL data before
  // it's ever allowed to become a saved build - 2026-09-09, the Meta
  // Pokémon specialist's own non-negotiable rule: an LLM call can propose
  // an ability/move this species doesn't actually have in this hack, and
  // that must be rejected, not silently trusted. Ability/moves/nature are
  // HARD requirements (reject the whole build if any is invalid) since
  // those are small, exact, checkable lists; item soft-falls-back to "no
  // item" if not recognized (a build without a held item is still a real,
  // usable build - unlike one with a fabricated move); EVs are clamped/
  // scaled to the real 510 cap rather than rejected outright for a minor
  // overage.
  // `motivo` é opcional: um objeto onde a validação escreve, em `motivo.txt`,
  // uma explicação específica pra mostrar ao usuário quando rejeita. Sem ele
  // o comportamento é o de antes (retorna null e quem chamou mostra a
  // mensagem genérica).
  // Contexto da validação estratégica a partir das opções da build (opts.chefao vem do
  // botão do chefão): buffs do ginásio ainda ativos e a habilidade que o armador do clima
  // precisa levar - só quando ela é das escolhíveis (armar por innate já vale sempre).
  function contextoDeValidacao(sp, opts) {
    var c = opts && opts.chefao;
    if (!c || !c.boss) return {};
    var ctx = { buffs: buffsAtivosDoChefao(c.boss.name) };
    var est = c.estrategia;
    var escolhiveis = habilidadesEscolhiveis(sp);
    if (est && est.armador === sp.n && escolhiveis.indexOf(est.habilidade) !== -1) ctx.habilidadeExigida = est.habilidade;
    // Golpes-chave que o simulador provou contra os Pokémon do chefão (resumoProvadoPeloSimulador): a build entra com eles.
    var chave = c.provado && c.provado.chave;
    if (chave) {
      // Os 4 golpes que o simulador provou vêm primeiro (quem responde 5+ alvos com golpes diferentes não perde a chave principal).
      var provados = c.provado.golpes || [];
      ctx.golpesChave = Object.keys(chave).map(function (f) { return chave[f]; }).filter(function (g, i, a) { return g && a.indexOf(g) === i; })
        .sort(function (a, b) { var ia = provados.indexOf(a), ib = provados.indexOf(b); return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib); });
    }
    return ctx;
  }
  function validateAiBuild(sp, raw, motivo, ctx) {
    ctx = completarCtx(ctx);
    if (!raw || typeof raw !== "object") return null;
    var validAbilities = habilidadesEscolhiveis(sp);
    // Motivo específico em cada rejeição (2026-09-16): a nova tentativa
    // automática (U3) repassa o motivo à IA - "golpe inválido" genérico a faz
    // corrigir às cegas; o nome exato do que falhou, não.
    // codigo: identificador estável da recusa (o pipeline decide por ele, não pelo texto - TK-18, 10.1).
    function rejeita(txt, codigo) { if (motivo) { motivo.txt = txt; motivo.codigo = codigo || "outro"; } return null; }
    if (typeof raw.ability !== "string" || validAbilities.indexOf(raw.ability) === -1) {
      return rejeita("A habilidade \"" + citarDoModelo(raw.ability) + "\" não é uma das escolhíveis do " + sp.n + " (" + validAbilities.join(", ") + ").", "habilidade-invalida");
    }
    if (typeof raw.nature !== "string" || ALL_NATURES.indexOf(raw.nature) === -1) {
      return rejeita("A natureza \"" + citarDoModelo(raw.nature) + "\" não existe.", "natureza-invalida");
    }
    // Trava por level cap (achado real, 2026-09-12: o editor manual de "Meu
    // build" já filtrava golpes de nível acima do cap desde 2026-09-10, mas
    // esta validação - a mesma usada pra build gerada por IA - nunca
    // recebeu o mesmo filtro, então uma build por IA sugerindo um golpe só
    // aprendido num nível acima do cap atual passava direto). Mesmo
    // critério de myBuildEditorHtml: golpe de tutor nunca trava por nível.
    var validMoves = availableMovesFor(sp, ctx).names;
    if (!Array.isArray(raw.moves) || raw.moves.length !== 4) return rejeita("A build precisa de exatamente 4 golpes.", "golpes-invalidos");
    for (var i = 0; i < 4; i++) {
      if (validMoves.indexOf(raw.moves[i]) === -1) {
        return rejeita("O golpe \"" + citarDoModelo(raw.moves[i]) + "\" não está no movepool do " + sp.n + " liberado até o level cap atual.", "golpe-invalido");
      }
      // Golpe repetido (ticket 17, 08/10): o jogo não deixa o mesmo golpe em dois slots, e a build ficava com 3 golpes úteis.
      if (raw.moves.indexOf(raw.moves[i]) !== i) {
        return rejeita("O golpe \"" + raw.moves[i] + "\" está repetido na build - os 4 golpes precisam ser diferentes.", "golpe-repetido");
      }
    }
    // ASSIMETRIA DELIBERADA (decisão do usuário, 2026-09-16) - esta regra é
    // DURA aqui, nas builds geradas por IA, e apenas INFORMATIVA nas builds
    // curadas de builds.json (lá ela vira o selo de buildSynergyHtml(), que
    // nunca bloqueia nada). O critério não é conveniência, é PROCEDÊNCIA: numa
    // build curada, um jogador real da comunidade já se responsabilizou por
    // ela na thread do Discord; numa gerada por IA, ninguém se responsabilizou.
    // A trava existe pra suprir a ausência de quem responda pela build, não
    // porque set sem sinergia seja necessariamente ruim - o Playtester de Build
    // mostrou o contrário com dado: das 17 builds curadas que não cumprem a
    // regra, 9 são sets defensivos/utilitários legítimos (Duelumber e Luxzero
    // Mega têm 4 golpes de status), e forçar a regra neles mataria build boa.
    //
    // Regra do Especialista em Meta, pedida pelo usuário em 2026-09-15: uma
    // build sugerida tem que APROVEITAR o que torna esta espécie especial
    // neste hack - pelo menos um dos 4 golpes precisa ser potencializado por
    // uma habilidade escolhível ou innate dela. Vale a mesma disciplina de
    // todo o resto daqui: o prompt já pede isso, mas pedir não é garantir -
    // a checagem é feita contra ABILITY_SYNERGY (o mesmo dado pré-calculado
    // que a ficha da espécie e a ferramenta getAbilityMovepoolSynergy usam),
    // nunca contra a palavra do modelo. A sinergia só conta se estiver ATIVA:
    // innate vale sempre; sinergia de habilidade escolhível só vale se for
    // justamente a habilidade escolhida nesta build. Espécie sem nenhuma
    // sinergia conhecida não é penalizada - a regra é inaplicável, não
    // violada.
    var synergyHitsAi = sinergiasDaEspecie(sp);
    // Golpe-chave provado (03/10, relato da Tate & Liza: o plano dizia Dragon Claw e a build da IA tinha Dragon Pulse): o app
    // não deixa a IA derrubar o golpe que o simulador provou. Falta algum? Troca o ÚLTIMO golpe que não é chave E cuja saída
    // não tira a sinergia de habilidade (regra do especialista, logo abaixo) e registra na rationale. A IA não é chamada de
    // novo (sem custo). Não muta o `raw` do chamador.
    function sinergiaOk(moves) {
      if (!synergyHitsAi || !synergyHitsAi.length) return true;
      return synergyHitsAi.filter(function (h) { return h.kind === "inn" || h.name === raw.ability; })
        .some(function (h) { return (h.golpes || []).some(function (g) { return moves.indexOf(g) !== -1; }); });
    }
    var chaveTrocada = [];
    if (ctx && ctx.golpesChave && ctx.golpesChave.length) {
      var chaves = ctx.golpesChave.filter(function (g) { return validMoves.indexOf(g) !== -1; }).slice(0, 4);
      var faltando = chaves.filter(function (g) { return raw.moves.indexOf(g) === -1; });
      if (faltando.length) {
        var movesNovos = raw.moves.slice();
        faltando.forEach(function (g) {
          for (var j = 3; j >= 0; j--) {
            if (chaves.indexOf(movesNovos[j]) !== -1) continue;
            var teste = movesNovos.slice(); teste[j] = g;
            if (!sinergiaOk(teste) && sinergiaOk(movesNovos)) continue; // essa saída quebraria a sinergia: tenta a anterior
            chaveTrocada.push(movesNovos[j] + " -> " + g); movesNovos = teste; break;
          }
        });
        if (chaveTrocada.length) raw = Object.assign({}, raw, { moves: movesNovos });
      }
    }
    if (synergyHitsAi && synergyHitsAi.length) {
      var ativas = synergyHitsAi.filter(function (h) {
        return h.kind === "inn" || h.name === raw.ability;
      });
      var temSinergia = ativas.some(function (h) {
        return (h.golpes || []).some(function (g) { return raw.moves.indexOf(g) !== -1; });
      });
      if (!temSinergia) {
        return rejeita("A build sugerida não usa nenhum golpe potencializado por uma habilidade ou innate do " +
          sp.n + " - pela regra do especialista, ela foi rejeitada. Tente gerar de novo.", "sem-sinergia");
      }
    }
    // Só vale item que o prompt oferece (ticket 17, 08/10): o prompt diz "nenhum fora destes grupos", mas a
    // checagem só olhava se o item existe no jogo (926) - passavam pedra mega de outra espécie, item-chave,
    // TM. Item exclusivo de outra espécie (Light Ball num Pokémon que não é Pikachu/Raichu...) também não faz
    // nada. Item fora da lista cai pra "sem item", o mesmo tratamento suave de item desconhecido. A pedra da
    // própria forma Mega vale (é ela que a regra da mega temporária impõe, logo abaixo).
    var stoneRule = megaStoneRuleFor(sp);
    // Pedras da própria família: a da forma Mega e, na forma base, as das Megas dela (no modo temporário a base
    // também pode segurar a pedra). Itens que se gastam na luta (Seeds, Adrenaline Orb, qualquer Berry, Gem...)
    // também passam: o prompt os cita como válidos pra Unburden/Gluttony/Ripen/Harvest (itemSeGastaNaLuta).
    var pedrasDaFamilia = isMegaForm(sp) ? stonesOf(sp) : megaFormsOf(sp).reduce(function (acc, m) { return acc.concat(stonesOf(m)); }, []);
    var itensDaBuild = AI_ITEM_POOL.concat(itensDeEspeciePara(sp), pedrasDaFamilia);
    var item = (typeof raw.item === "string" && ITEMS.indexOf(raw.item) !== -1 && (itensDaBuild.indexOf(raw.item) !== -1 || itemSeGastaNaLuta(raw.item))) ? raw.item : "";
    // Modo de mega temporária: build de forma mega PRECISA segurar a pedra
    // (ver megaStoneRuleFor). Com uma pedra só, corrige sozinho em vez de
    // rejeitar - mesmo espírito "soft" do resto do item.
    if (stoneRule && stoneRule.stones.indexOf(item) === -1) {
      if (stoneRule.stones.length === 1) {
        item = stoneRule.stones[0];
      } else {
        return rejeita("No modo de mega temporária a " + sp.n + " precisa segurar a pedra (" + stoneRule.stones.join(" ou ") + ") - a build sugerida usou outro item. Tente gerar de novo.", "pedra-obrigatoria");
      }
    }
    // Item que a run ainda não libera (decisão 10 do usuário, 28/10): a IA recusa como o Modo Motor (time_pelo_motor.js:196).
    // A pedra que a mega temporária impõe fica de fora: o slot já é dela.
    if (item && !stoneRule && !liberadoNaRun(ctx.settings.milestone, ctx.cap, { item: item })) {
      return rejeita(item + " ainda não está liberado nesta Etapa da run. Escolha outro item. Tente gerar de novo.", "item-nao-liberado");
    }
    // Habilidade que depende de gastar o item (ver regraItemConsumivelPara).
    // Dura, como a da sinergia: sem o item certo a habilidade não faz nada. A
    // pedra da mega temporária tem prioridade - o slot já é dela.
    var regraConsumivel = stoneRule ? null : regraItemConsumivelPara(sp, raw.ability);
    if (regraConsumivel) {
      var serve = regraConsumivel.precisa === "berry" ? ehBerry(item) : itemSeGastaNaLuta(item);
      if (!serve) {
        return rejeita("A habilidade " + regraConsumivel.habilidade + " do " + sp.n + " só funciona gastando o item, mas a build usou " +
          (item ? "\"" + item + "\"" : "nenhum item") + " - precisa de " +
          (regraConsumivel.precisa === "berry" ? "uma Berry" : "um item que se gasta na luta (Berry, Gem, Focus Sash, White Herb…)") + ". Tente gerar de novo.", "item-que-se-gasta");
      }
    }
    // No máximo 2 membros do time com o mesmo item (2026-09-29, decisão do
    // usuário depois de ver Hyper Offense com Life Orb em todo mundo). A pedra
    // da mega temporária não entra na conta - o slot é obrigatoriamente dela.
    // Só pra quem está NO time: build feita na Dex pra um Pokémon da caixa não é
    // barrada pelos itens do time (achado no teste da mega permanente).
    if (item && !stoneRule && ctx.team.indexOf(sp.x) !== -1) {
      var comEsteItem = itensEmUsoComQuem(sp.x, ctx)[item] || [];
      if (itemEsgotadoNoTime(comEsteItem)) {
        return rejeita(item + " já está com " + comEsteItem.join(" e ") + " - no time vale no máximo " + MAX_MESMO_ITEM_NO_TIME +
          " com o mesmo item. Escolha outro item que reforce o papel deste Pokémon. Tente gerar de novo.", "item-esgotado");
      }
    }
    // EV fora do formato (ticket 17, 08/10): ausente, tamanho errado ou texto virava [0,0,0,0,0,0] em silêncio e a
    // build era salva sem EV nenhum. Agora rejeita (a nova tentativa leva o motivo). Número fora da faixa
    // (negativo, acima de 252, soma acima de 510) continua só sendo ajustado.
    if (!evsEmFormatoValido(raw.evs)) {
      return rejeita("Os EVs precisam ser 6 números inteiros (HP, Atk, Def, SpA, SpD, Spe) - a resposta veio sem eles ou em outro formato.", "evs-invalidos");
    }
    var evs = limitarEvsAoJogo(raw.evs);
    // Coerência papel x golpe (pedido do usuário, 2026-09-16: "notei que está
    // sugerindo Roost em uma build super ofensiva"). Uma build com EVs 100%
    // ofensivos (ataque e velocidade maxados, nada em HP/Def/SpD) não aguenta
    // ficar em campo pra aproveitar cura - o slot vale mais como golpe de
    // dano. O papel do golpe vem do efeito real do jogo (MOVE_ROLES), não da
    // palavra do modelo. Só vale aqui, na build por IA - mesma assimetria da
    // regra de sinergia acima: build curada da comunidade que faça isso (ex:
    // Mega Talonflame com Roost) tem um jogador real respondendo por ela.
    // Formato 1x1 (item P3, 2026-09-16): golpe que só funciona em batalha
    // dupla é slot desperdiçado aqui. Dura na IA, informativa nas curadas
    // (buildContextNotesHtml) - mesma assimetria das outras regras.
    var golpeDupla = raw.moves.filter(function (m) { return moveRoleOf(m) === "dupla"; })[0];
    if (golpeDupla) {
      return rejeita("O golpe \"" + golpeDupla + "\" só tem efeito em batalha dupla - o app monta sets pra 1x1.", "golpe-de-dupla");
    }
    var fullOffense = Math.max(evs[1], evs[3]) >= 200 && evs[5] >= 200 && (evs[0] + evs[2] + evs[4]) <= 12;
    if (fullOffense) {
      var curaMove = raw.moves.filter(function (m) { return moveRoleOf(m) === "cura"; })[0];
      var danoCount = raw.moves.filter(function (m) { return moveRoleOf(m) === "dano"; }).length;
      if (curaMove || danoCount < 2) {
        {
          var txtOfensivo = curaMove
            ? "A build sugerida é 100% ofensiva (EVs em ataque e velocidade) mas gastou um slot com " + curaMove +
              ", que só cura - esse slot rende mais como golpe de dano. Rejeitada; tente gerar de novo."
            : "A build sugerida é 100% ofensiva mas tem menos de 2 golpes de dano. Rejeitada; tente gerar de novo.";
          return rejeita(txtOfensivo, "ofensiva-sem-dano");
        }
      }
    }
    var conflito = conflitoDeItem(item, raw.moves, sp);
    if (conflito) return rejeita(conflito, "conflito-item-golpe");
    // Habilidade condicional sem a condição garantida (2026-09-28, auditoria
    // das builds salvas: Goodra com Poison Heal e Choice Specs, Kingdra com
    // Swift Swim sem chuva no time) - ver condicaoDaBuild.
    var cond = condicaoDaBuild(sp, { ability: raw.ability, item: item, moves: raw.moves });
    if (cond && !cond.garantidaPor) {
      return rejeita("A habilidade " + cond.habilidade + " só funciona com " + cond.condicao + ", e nada na build nem no time garante isso" +
        (cond.comoGarantir.length ? " - para usá-la: " + cond.comoGarantir.join(" ou ") + "; ou" : " -") + " escolha outra habilidade. Tente gerar de novo.", "habilidade-sem-condicao");
    }
    // Papel declarado (2026-09-27): sem papel não há o que conferir (modos
    // antigos de revisão não pedem); com papel, contradição clara reprova.
    var papel = papelNormalizado(raw.papel);
    var problemaDoPapel = papel ? conferirPapelDaBuild(papel, evs, raw.moves, sp, ctx) : null;
    if (problemaDoPapel) return rejeita(problemaDoPapel, "papel-golpe");
    var problemaDaNature = conflitoDeNature(raw.nature, raw.moves, papel, ctx);
    if (problemaDaNature) return rejeita(problemaDaNature, "natureza-contra-build");
    // Justificativa, 2026-09-10 (revisão da equipe sobre "Gerar build com
    // IA"): uma frase livre, NÃO validada contra dados reais como tudo
    // acima - não há o que checar, é texto corrido, não uma referência de
    // dado do jogo. Cortada num tamanho razoável e escapada na hora de
    // renderizar (myBuildEditorHtml), igual qualquer outro texto exibido pro
    // usuário. A ausência dela não é motivo de rejeição - uma build
    // válida sem justificativa ainda assim é salva.
    // Validação ESTRATÉGICA (lote C da força-tarefa, 2026-10-02) - a de cima só
    // conferia legalidade. `ctx` (opcional) traz o contexto da luta alvo.
    // (a) Armador do clima escolhido pelo simulador: tem que levar a habilidade que
    // arma - senão a estratégia de time que o simulador provou deixa de existir.
    if (ctx.habilidadeExigida && raw.ability !== ctx.habilidadeExigida) {
      return rejeita("Este Pokémon é o armador do clima do time: a habilidade precisa ser " + ctx.habilidadeExigida + ".", "armador-do-clima");
    }
    // (b) Heal Block permanente ativo na luta alvo (buff do ginásio): cura não funciona.
    if ((ctx.buffs || []).indexOf("flannery_healblock") !== -1) {
      var curaInutil = raw.moves.filter(function (n) { return moveRoleOf(n) === "cura"; });
      if (curaInutil.length) return rejeita("A luta alvo tem Heal Block permanente (buff do ginásio ainda ativo): " + curaInutil.join(", ") + " não cura nada. Troque por outro golpe.", "heal-block");
      if (["Leftovers", "Black Sludge", "Sitrus Berry", "Shell Bell", "Big Root"].indexOf(item) !== -1) {
        return rejeita("A luta alvo tem Heal Block permanente: " + item + " não cura nada. Troque o item.", "heal-block");
      }
    }
    // (c) Atacante sem nenhum golpe com STAB (o próprio tipo, ou o que a habilidade
    // dá - Protean e parecidas): o set perde o maior multiplicador que tem.
    if (papel !== "Tanque") {
      var ofensivos = raw.moves.filter(function (n) { return moveRoleOf(n) === "dano"; });
      var efSet = efeitoDasHabilidadesNoDuelo(uniqueIds((sp.inn || []).concat([ABILITY_ID_BY_NAME[raw.ability]])), sp.sname, null);
      var tiposComStab = speciesTypeNames(sp).concat(efSet.stabExtra || [], efSet.tipoExtra || []);
      var temStab = efSet.stabTodos || ofensivos.some(function (n) {
        var m = MOVES[MOVE_ID_BY_NAME[n]];
        return tiposComStab.indexOf(TYPES[m[1]]) !== -1 || (m[9] >= 0 && tiposComStab.indexOf(TYPES[m[9]]) !== -1) || !!(efSet.converte && efSet.converte[TYPES[m[1]]]);
      });
      if (ofensivos.length >= 2 && !temStab) {
        return rejeita("Nenhum dos golpes de dano tem STAB (" + speciesTypeNames(sp).join("/") + "). Um atacante precisa de pelo menos um golpe do próprio tipo.", "sem-stab");
      }
    }
    var rationale = typeof raw.rationale === "string" ? raw.rationale.trim().slice(0, 360) : "";
    if (chaveTrocada.length) rationale = ("Golpe-chave do simulador mantido (" + chaveTrocada.join("; ") + "). " + rationale).trim().slice(0, 360);
    // O papel aparece pro jogador na própria justificativa (o save guarda uma
    // lista fixa de campos da build - campo novo se perderia no sync).
    if (papel && rationale.indexOf(papel) === -1) rationale = "Papel: " + papel + ". " + rationale;
    // Corte de EV desperdiçado, direto na build que a IA propõe (pedido do
    // usuário, 2026-09-18: "esse negócio do ev aí devia estar na calculadora
    // do montador de build", em vez de só um aviso depois em "Meu build").
    // trimAndReallocateEvs (src/regras/calc_stat.js) tira o EV que não muda
    // stat nenhum no nível/nature/item atual - mecânica vanilla desde o Gen
    // 3, ver hpEvEfficiencyNote/evBreakpointNote - e reinveste o que sobrar
    // no(s) stat(s) que a própria build já mais investiu, sempre dentro do
    // mesmo orçamento de 510. Roda por ÚLTIMO, DEPOIS de toda checagem de
    // coerência acima (achado real ao testar: reinvestir a sobra pode
    // empurrar HP+Def+SpD de <=12 pra >12, tirando a build da classificação
    // "100% ofensiva" e escapando da checagem de Roost-em-build-ofensiva -
    // a classificação tem que julgar a INTENÇÃO original da IA, só o número
    // final salvo é otimizado).
    evs = trimAndReallocateEvs(sp, evs, ctx.cap || NIVEL_DE_CALCULO_SEM_CAP, raw.nature, item);
    // Trick Room (2026-09-28): quem é mais lento age primeiro, então a build
    // lenta de propósito (0 EV em Velocidade, nature que reduz Velocidade)
    // também zera o IV - o jogo tem o item pra isso, Iron Pill: "Sets Speed
    // IVs to 0. Use again to set back to 31." (descrição do próprio jogo).
    var ivs = [31, 31, 31, 31, 31, 31];
    var mods = NATURE_MODS[raw.nature];
    if (ctx.archetype.weather === "Trick Room" && evs[5] === 0 && mods && mods[1] === 5) {
      ivs[5] = 0;
      rationale = ("IV de Velocidade 0 (use a Iron Pill). " + rationale).trim().slice(0, 360);
    }
    return { ability: raw.ability, nature: raw.nature, item: item, moves: raw.moves.slice(0, 4), ivs: ivs, evs: evs, rationale: rationale };
  }

