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
    // Justificativa, 2026-09-10 (revisão da equipe sobre "Gerar build com
    // IA"): uma frase livre, NÃO validada contra dados reais como tudo
    // acima - não há o que checar, é texto corrido, não uma referência de
    // dado do jogo. Cortada num tamanho razoável e escapada na hora de
    // renderizar (myBuildEditorHtml), igual qualquer outro texto exibido pro
    // usuário. A ausência dela não é motivo de rejeição - uma build
    // válida sem justificativa ainda assim é salva.
    var rationale = typeof raw.rationale === "string" ? raw.rationale.trim().slice(0, 280) : "";
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
    return { ability: raw.ability, nature: raw.nature, item: item, moves: raw.moves.slice(0, 4), ivs: [31, 31, 31, 31, 31, 31], evs: evs, rationale: rationale };
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