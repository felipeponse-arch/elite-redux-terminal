  // ===== src/regras/validacao_build_ia.js =====
  // Validação da build sugerida pela IA contra o dado real.
  // Colado dentro do <script> principal do app por scripts/build.mjs (marcador
  // @regras validacao_build_ia.js), no mesmo escopo do resto do código - sem module,
  // sem wrapper. Só lógica pura: nada aqui lê a página (item D1 da pauta
  // técnica, 2026-09-16), o que permite carregar este arquivo no Node pros
  // testes unitários (tests/unit/).

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
  // Linha pro prompt, antes da IA escolher a habilidade: a exigência da innate
  // e, pras escolhíveis, a condição "se escolher X".
  function regraItemConsumivelPrompt(sp) {
    if (megaStoneRuleFor(sp)) return ""; // a pedra ocupa o slot de item
    var textoDe = function (r) {
      return r.precisa === "berry" ? "o item TEM que ser uma Berry" : "o item TEM que ser um que se gasta na luta (Berry, Gem, Focus Sash, White Herb, Weakness Policy...)";
    };
    var daInnate = regraItemConsumivelPara(sp, null);
    if (daInnate) return "ITEM OBRIGATORIO: a innate " + daInnate.habilidade + " so funciona consumindo o item - " + textoDe(daInnate) + ".\n";
    var linhas = uniqueIds(sp.ab || []).map(function (id) { return ABILITIES[id] ? ABILITIES[id][0] : ""; })
      .map(function (n) { var r = regraItemConsumivelPara(sp, n); return r ? "se escolher " + n + ", " + textoDe(r) : ""; })
      .filter(Boolean);
    return linhas.length ? "ITEM x HABILIDADE: " + linhas.join("; ") + ".\n" : "";
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
  function conferirPapelDaBuild(papel, evs, moves, sp) {
    var bulk = evs[0] + evs[2] + evs[4];
    if (papel === "Tanque") {
      if (evs[5] > 100) return "A build foi declarada Tanque mas tem " + evs[5] + " EVs em Velocidade - tanque investe em HP e defesa, não em Velocidade. Tente gerar de novo.";
      if (bulk < 252) return "A build foi declarada Tanque com só " + bulk + " EVs em HP/Defesa/Def. Especial - tanque precisa de bulk. Tente gerar de novo.";
    }
    // Trick Room inverte a ordem: sweeper lento é o certo lá.
    if (papel === "Sweeper" && state.archetype.weather !== "Trick Room" && evs[5] < 180) {
      return "A build foi declarada Sweeper com só " + evs[5] + " EVs em Velocidade - sweeper precisa ser rápido. Tente gerar de novo.";
    }
    if (papel === "Wallbreaker" && Math.max(evs[1], evs[3]) < 200) {
      return "A build foi declarada Wallbreaker sem investir no ataque (máx. " + Math.max(evs[1], evs[3]) + " EVs) - wallbreaker maximiza dano. Tente gerar de novo.";
    }
    if (papel === "Pivô") {
      var disponiveis = availableMovesFor(sp).names.filter(ehGolpeDePivo);
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
  function evoluiAinda(sp) {
    return (sp.ev || []).some(function (e) {
      var k = DATA.evoKinds[e[0]];
      return k !== "EVO_MEGA_EVOLUTION" && k !== "EVO_PRIMAL_REVERSION" && k !== "EVO_MOVE_MEGA_EVOLUTION";
    });
  }
  function conflitoDeItem(item, moves, sp) {
    if (!item) return null;
    var status = moves.filter(function (m) { var mv = MOVE_BY_NAME[m]; return mv && DATA.splits[mv[2]] === SPLIT_STATUS; });
    if (ITENS_CHOICE.indexOf(item) !== -1) {
      var travado = status.filter(function (m) { return GOLPES_QUE_PASSAM_ITEM.indexOf(m) === -1; })[0];
      if (travado) return item + " trava o Pokémon num golpe só, e a build tem " + travado + " (golpe de status) - com Choice ele ficaria preso sem causar dano. Tente gerar de novo.";
    }
    if (ITENS_VEST.indexOf(item) !== -1 && status.length) {
      return item + " impede golpe de status neste jogo, mas a build tem " + status.join(", ") + ". Tente gerar de novo.";
    }
    if (item === "Eviolite" && !evoluiAinda(sp)) {
      return "Eviolite só funciona em quem ainda evolui, e " + sp.n + " não evolui mais. Tente gerar de novo.";
    }
    return null;
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
  function validateAiBuild(sp, raw, motivo) {
    if (!raw || typeof raw !== "object") return null;
    var validAbilities = uniqueIds(sp.ab).map(function (id) { return ABILITIES[id][0]; });
    // Motivo específico em cada rejeição (2026-09-16): a nova tentativa
    // automática (U3) repassa o motivo à IA - "golpe inválido" genérico a faz
    // corrigir às cegas; o nome exato do que falhou, não.
    function rejeita(txt) { if (motivo) motivo.txt = txt; return null; }
    if (typeof raw.ability !== "string" || validAbilities.indexOf(raw.ability) === -1) {
      return rejeita("A habilidade \"" + raw.ability + "\" não é uma das escolhíveis do " + sp.n + " (" + validAbilities.join(", ") + ").");
    }
    if (typeof raw.nature !== "string" || ALL_NATURES.indexOf(raw.nature) === -1) {
      return rejeita("A natureza \"" + raw.nature + "\" não existe.");
    }
    // Trava por level cap (achado real, 2026-09-12: o editor manual de "Meu
    // build" já filtrava golpes de nível acima do cap desde 2026-09-10, mas
    // esta validação - a mesma usada pra build gerada por IA - nunca
    // recebeu o mesmo filtro, então uma build por IA sugerindo um golpe só
    // aprendido num nível acima do cap atual passava direto). Mesmo
    // critério de myBuildEditorHtml: golpe de tutor nunca trava por nível.
    var validMoves = availableMovesFor(sp).names;
    if (!Array.isArray(raw.moves) || raw.moves.length !== 4) return rejeita("A build precisa de exatamente 4 golpes.");
    for (var i = 0; i < 4; i++) {
      if (validMoves.indexOf(raw.moves[i]) === -1) {
        return rejeita("O golpe \"" + raw.moves[i] + "\" não está no movepool do " + sp.n + " liberado até o level cap atual.");
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
    var synergyHitsAi = ABILITY_SYNERGY[sp.sname];
    if (synergyHitsAi && synergyHitsAi.length) {
      var ativas = synergyHitsAi.filter(function (h) {
        return h.kind === "inn" || h.name === raw.ability;
      });
      var temSinergia = ativas.some(function (h) {
        return (h.golpes || []).some(function (g) { return raw.moves.indexOf(g) !== -1; });
      });
      if (!temSinergia) {
        if (motivo) {
          motivo.txt = "A build sugerida não usa nenhum golpe potencializado por uma habilidade ou innate do " +
            sp.n + " - pela regra do especialista, ela foi rejeitada. Tente gerar de novo.";
        }
        return null;
      }
    }
    var item = (typeof raw.item === "string" && ITEMS.indexOf(raw.item) !== -1) ? raw.item : "";
    // Item exclusivo de outra espécie (Light Ball num Pokémon que não é
    // Pikachu/Raichu...) não faz nada: cai pra "sem item", o mesmo tratamento
    // suave de item desconhecido (ITENS_DE_ESPECIE em prompts_ia.js).
    if (item && ITENS_DE_ESPECIE[item] && itensDeEspeciePara(sp).indexOf(item) === -1) item = "";
    // Modo de mega temporária: build de forma mega PRECISA segurar a pedra
    // (ver megaStoneRuleFor). Com uma pedra só, corrige sozinho em vez de
    // rejeitar - mesmo espírito "soft" do resto do item.
    var stoneRule = megaStoneRuleFor(sp);
    if (stoneRule && stoneRule.stones.indexOf(item) === -1) {
      if (stoneRule.stones.length === 1) {
        item = stoneRule.stones[0];
      } else {
        if (motivo) motivo.txt = "No modo de mega temporária a " + sp.n + " precisa segurar a pedra (" + stoneRule.stones.join(" ou ") + ") - a build sugerida usou outro item. Tente gerar de novo.";
        return null;
      }
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
          (regraConsumivel.precisa === "berry" ? "uma Berry" : "um item que se gasta na luta (Berry, Gem, Focus Sash, White Herb...)") + ". Tente gerar de novo.");
      }
    }
    var evs = Array.isArray(raw.evs) && raw.evs.length === 6 ? raw.evs.map(function (v) { return clampInt(v, 0, 252, 0); }) : [0, 0, 0, 0, 0, 0];
    var evSum = evs.reduce(function (a, v) { return a + v; }, 0);
    if (evSum > 510) {
      var scale = 510 / evSum;
      evs = evs.map(function (v) { return Math.floor((v * scale) / 4) * 4; });
    }
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
      return rejeita("O golpe \"" + golpeDupla + "\" só tem efeito em batalha dupla - o app monta sets pra 1x1.");
    }
    var fullOffense = Math.max(evs[1], evs[3]) >= 200 && evs[5] >= 200 && (evs[0] + evs[2] + evs[4]) <= 12;
    if (fullOffense) {
      var curaMove = raw.moves.filter(function (m) { return moveRoleOf(m) === "cura"; })[0];
      var danoCount = raw.moves.filter(function (m) { return moveRoleOf(m) === "dano"; }).length;
      if (curaMove || danoCount < 2) {
        if (motivo) {
          motivo.txt = curaMove
            ? "A build sugerida é 100% ofensiva (EVs em ataque e velocidade) mas gastou um slot com " + curaMove +
              ", que só cura - esse slot rende mais como golpe de dano. Rejeitada; tente gerar de novo."
            : "A build sugerida é 100% ofensiva mas tem menos de 2 golpes de dano. Rejeitada; tente gerar de novo.";
        }
        return null;
      }
    }
    var conflito = conflitoDeItem(item, raw.moves, sp);
    if (conflito) return rejeita(conflito);
    // Habilidade condicional sem a condição garantida (2026-09-28, auditoria
    // das builds salvas: Goodra com Poison Heal e Choice Specs, Kingdra com
    // Swift Swim sem chuva no time) - ver condicaoDaBuild.
    var cond = condicaoDaBuild(sp, { ability: raw.ability, item: item, moves: raw.moves });
    if (cond && !cond.garantidaPor) {
      return rejeita("A habilidade " + cond.habilidade + " só funciona com " + cond.condicao + ", e nada na build nem no time garante isso" +
        (cond.comoGarantir.length ? " - para usá-la: " + cond.comoGarantir.join(" ou ") + "; ou" : " -") + " escolha outra habilidade. Tente gerar de novo.");
    }
    // Papel declarado (2026-09-27): sem papel não há o que conferir (modos
    // antigos de revisão não pedem); com papel, contradição clara reprova.
    var papel = papelNormalizado(raw.papel);
    var problemaDoPapel = papel ? conferirPapelDaBuild(papel, evs, raw.moves, sp) : null;
    if (problemaDoPapel) return rejeita(problemaDoPapel);
    // Justificativa, 2026-09-10 (revisão da equipe sobre "Gerar build com
    // IA"): uma frase livre, NÃO validada contra dados reais como tudo
    // acima - não há o que checar, é texto corrido, não uma referência de
    // dado do jogo. Cortada num tamanho razoável e escapada na hora de
    // renderizar (myBuildEditorHtml), igual qualquer outro texto exibido pro
    // usuário. A ausência dela não é motivo de rejeição - uma build
    // válida sem justificativa ainda assim é salva.
    var rationale = typeof raw.rationale === "string" ? raw.rationale.trim().slice(0, 360) : "";
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
    evs = trimAndReallocateEvs(sp, evs, getCurrentCap() || 50, raw.nature, item);
    // Trick Room (2026-09-28): quem é mais lento age primeiro, então a build
    // lenta de propósito (0 EV em Velocidade, nature que reduz Velocidade)
    // também zera o IV - o jogo tem o item pra isso, Iron Pill: "Sets Speed
    // IVs to 0. Use again to set back to 31." (descrição do próprio jogo).
    var ivs = [31, 31, 31, 31, 31, 31];
    var mods = NATURE_MODS[raw.nature];
    if (state.archetype.weather === "Trick Room" && evs[5] === 0 && mods && mods[1] === 5) {
      ivs[5] = 0;
      rationale = ("IV de Velocidade 0 (use a Iron Pill). " + rationale).trim().slice(0, 360);
    }
    return { ability: raw.ability, nature: raw.nature, item: item, moves: raw.moves.slice(0, 4), ivs: ivs, evs: evs, rationale: rationale };
  }

  // Resposta das Estratégias ({"sets":[...]}) -> só os sets que passam na MESMA
  // validação da build (validateAiBuild) e têm nome. Set ruim entre sets bons
  // não derruba os outros. Movido do template na fase 4 (2026-09-24).
  function setsValidosDaResposta(sp, bruto) {
    var candidatos = (bruto && Array.isArray(bruto.sets)) ? bruto.sets : [];
    var out = [];
    candidatos.forEach(function (c) {
      var v = validateAiBuild(sp, c);
      if (v && typeof c.name === "string" && c.name.trim()) {
        v.name = c.name.trim().slice(0, 40);
        out.push(v);
      }
    });
    return out;
  }