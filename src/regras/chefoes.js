  // ===== src/regras/chefoes.js =====
  // Chefões e a próxima luta: o que falta vencer, variante por dificuldade,
  // ameaças do chefão ao time, melhor candidato da caixa e o confronto (adaptador
  // do app pro motor puro de confronto.js).
  // Colado dentro do <script> principal do app por scripts/build.mjs (marcador
  // @regras chefoes.js), no mesmo escopo do resto do código. Só lógica: nada aqui
  // lê ou desenha a página - testável no Node (tests/unit). Movido do template na
  // fase 3 da refatoração (2026-09-24), sem mudar o comportamento.

  // Bug achado em 2026-09-17, conferido linha a linha contra o codigo-fonte
  // oficial (src/battle_main.c da eliteredux-source): o jogo usa o campo
  // "party" (mesmo time) pra Easy E Ace - a diferenca entre elas e so EVs
  // habilitados, nao o time - e so troca de time em Elite ("insane"/
  // partyInsane) e Hell ("hell"/partyHell), que o app nem modela como
  // dificuldade selecionavel. Antes disto Ace mostrava o time de Elite
  // (insane) e Elite mostrava o de Hell - o seletor manual de chips
  // (Padrao/Insane/Hell) continua disponivel pra quem quiser conferir os
  // outros tiers na mesma tela.
  var DIFF_TO_BOSSKEY = { easy: "party", ace: "party", elite: "insane" };

  // "Estou no 2º badge, o que faz sentido daqui até o final?" - pedido do
  // usuário, 2026-09-10: sem NENHUMA pergunta nova pro jogador - usa só o
  // milestone que ele já configura em Progresso (state.settings.milestone),
  // interpretado internamente.
  //
  // Descoberta real que viabiliza isso (verificada contra os 107 chefões
  // reais, não assumida): os líderes de ginásio deste hack têm exatamente os
  // mesmos nomes e a mesma ordem do Pokémon Emerald original (Roxanne ->
  // Brawly -> Wattson -> Flannery -> Norman -> Winona -> Tate And Liza ->
  // Juan/Wallace), na mesma sequência dos 10 milestones já usados em
  // LEVELCAPS - Elite Redux rebalanceia stats/times, não a posição dos
  // líderes no mapa. "Juan" e "Wallace" aparecem como entradas separadas em
  // bosses.json mas compartilham o mesmo `map` (501) no dado bruto,
  // confirmando serem o mesmo 8º ginásio - tratados como equivalentes aqui.
  // Índice = milestone que a vitória CONCEDE (mesmos índices de
  // LEVELCAPS.rows, 1 = Stone Badge ... 8 = Rain Badge).
  var GYM_LEADER_MILESTONE = {
    "Roxanne": 1, "Brawly": 2, "Wattson": 3, "Flannery": 4,
    "Norman": 5, "Winona": 6, "Tate And Liza": 7, "Juan": 8, "Wallace": 8
  };

  // "Roxanne 1"/"Roxanne 2"... -> "Roxanne". Mesmo corte usado no dedup de
  // rebatalha abaixo e na chave de GYM_SKILLS.leaders - promovido a funcao
  // pra nao divergir entre os dois lugares que precisam dele.
  function gymLeaderBaseName(name) { return String(name || "").replace(/\s+\d+$/, "").trim(); }

  // Cada líder aparece várias vezes em bosses.json (Wattson 1, 2, 3...) -
  // são rebatalhas em pontos diferentes do jogo, não dificuldades; só a
  // PRIMEIRA ocorrência de cada nome-base é o encontro real que concede o
  // badge, então só ela entra na lista de "o que falta".
  function getRemainingBossEntries() {
    var curMilestone = state.settings.milestone;
    var seenLeader = {};
    var seenEliteFour = {};
    var champIncluded = false;
    var remaining = [];
    BOSSES.forEach(function (b) {
      // Só líderes de ginásio e Alto Comando têm variantes puramente
      // numéricas (nome-base + " N", ex: "Wattson 1"/"2"/"3" = rebatalhas).
      // O Campeão tem variantes de NOME (Steven/Wallace, cada um em modo
      // normal/Doubles/Legends/Doubles Legends - achado ao testar isso ao
      // vivo: sem esse tratamento à parte, as 8 variações apareciam como 8
      // entradas "restantes" distintas, quando na prática representam o
      // mesmo desafio final) - por isso o Campeão usa uma regra própria em
      // vez do mesmo dedup por nome-base.
      if (b.cat === "Lider de Ginasio") {
        var baseName = gymLeaderBaseName(b.name);
        var milestone = GYM_LEADER_MILESTONE[baseName];
        if (milestone === undefined || milestone <= curMilestone) return;
        // Dedup pelo BADGE, não pelo nome: Juan e Wallace são o mesmo 8º
        // ginásio e apareciam como duas lutas restantes (achado 2026-09-16).
        if (seenLeader[milestone]) return;
        seenLeader[milestone] = true;
        remaining.push(b);
      } else if (b.cat === "Alto Comando") {
        if (curMilestone >= 9) return; // 9 = "Champion / Alto Comando", já não falta mais nada
        var efName = b.name.replace(/\s+\d+$/, "").trim();
        if (seenEliteFour[efName]) return;
        seenEliteFour[efName] = true;
        remaining.push(b);
      } else if (b.cat === "Campeao") {
        if (curMilestone >= 9) return;
        if (champIncluded) return; // uma única entrada representa "o Campeão", não cada variante de nome
        champIncluded = true;
        remaining.push(b);
      }
      // Equipe Aqua/Magma, Frontier Brain etc. ficam fora de propósito -
      // não são pontos fixos e ordenados da progressão de badges.
    });
    // Bug real achado em 2026-09-16 (item P4): bosses.json lista o Alto
    // Comando ANTES dos líderes, e "próxima luta" é remaining[0] - no
    // começo do jogo o dashboard apontava Sidney em vez de Roxanne. Ordena
    // pela progressão real: ginásios pelo badge, depois Alto Comando na
    // ordem do arquivo, depois o Campeão.
    var ordem = function (b, idx) {
      if (b.cat === "Lider de Ginasio") return GYM_LEADER_MILESTONE[b.name.replace(/\s+\d+$/, "").trim()] * 1000 + idx;
      if (b.cat === "Alto Comando") return 9000 + idx;
      return 99000 + idx;
    };
    return remaining.map(function (b, idx) { return { b: b, k: ordem(b, idx) }; })
      .sort(function (a, c) { return a.k - c.k; })
      .map(function (e) { return e.b; });
  }

  // ---------------- team coverage & dashboard risk ----------------
  // Shared by renderTeamAnalysis (the full table) and renderDashboard (the
  // one-line "biggest shared weakness" summary) - factored out so the two
  // can never quietly disagree about what the team's worst shared risk is.
  function computeSharedRisks(members) {
    var riskCount = {};
    USABLE_TYPES.forEach(function (atk) {
      members.forEach(function (sp) {
        if (abilityTypeMod(atk, sp).real >= 2) riskCount[atk] = (riskCount[atk] || 0) + 1;
      });
    });
    return Object.keys(riskCount).map(function (t) { return { t: t, n: riskCount[t] }; })
      .filter(function (r) { return r.n >= 2; })
      .sort(function (a, b) { return b.n - a.n; });
  }

  // Leitor de caixa pra próxima luta (Fase 1, reunião 2026-09-11) - trava
  // explícita do usuário: pensa SÓ na próxima luta que falta, nunca no jogo
  // inteiro daqui pra frente. Resolve os tipos de ataque reais do chefão a
  // partir do movepool real do time dele (bosses.json), no mesmo tier que
  // o resto do app já usa pra essa dificuldade (DIFF_TO_BOSSKEY, igual
  // selectBoss()). Golpes de status não contam - não causam dano de tipo.
  // Velocidade base do seu mais rápido contra o time da próxima luta (item
  // P4 da pauta, 2026-09-16). Mesma trava do resto do dashboard: só a
  // próxima luta. Compara só Velocidade BASE - nível, EVs/IVs, nature, item
  // (Choice Scarf), habilidade e clima mudam a ordem real, e o texto diz isso.
  // Usa cada Pokémon na forma em que está salvo no time.
  function bossSpeedSummary(boss, teamMembers) {
    var tier = DIFF_TO_BOSSKEY[state.settings.difficulty] || "party";
    var party = (boss[tier] && boss[tier].length) ? boss[tier] : boss.party;
    var fastest = null;
    teamMembers.forEach(function (sp) { if (!fastest || sp.b[5] > fastest.b[5]) fastest = sp; });
    var foes = (party || []).map(function (m) { return getSpeciesByX(m.x); }).filter(Boolean);
    if (!fastest || !foes.length) return null;
    return {
      fastest: fastest,
      total: foes.length,
      faster: foes.filter(function (f) { return f.b[5] > fastest.b[5]; }).length,
      tied: foes.filter(function (f) { return f.b[5] === fastest.b[5]; }).length
    };
  }

  function computeBossAttackTypes(boss) {
    var tier = DIFF_TO_BOSSKEY[state.settings.difficulty] || "party";
    var party = (boss[tier] && boss[tier].length) ? boss[tier] : boss.party;
    var types = {};
    (party || []).forEach(function (m) {
      (m.mv || []).forEach(function (moveName) {
        var mv = MOVE_BY_NAME[moveName];
        if (!mv) return;
        // Bug real achado em 2026-09-16: comparava com "Status", mas o dado
        // escreve "STATUS" - a condição nunca batia e golpe de status do
        // chefão (Roost, Toxic...) contava como tipo de ataque na sugestão.
        if (moveRoleOf(moveName) !== "dano") return;
        types[TYPES[mv[1]]] = true;
      });
    });
    return Object.keys(types);
  }

  // Score simples e explicável (mesmo espírito de computeSharedRisks() -
  // contagem, não simulação de batalha): quantos dos tipos de ataque reais
  // do chefão o candidato resiste/é imune, menos quantos ele é fraco.
  // Nunca sugere uma troca lateral ou pior - só quando a caixa tem alguém
  // genuinamente mais seguro que o melhor que já está no time.
  // Aceita uma espécie ou uma unidade de batalha (battleUnitsOf).
  function bossSafetyScore(spOrUnit, atkTypes) {
    var unit = spOrUnit.forms ? spOrUnit : { forms: [spOrUnit] };
    var score = 0;
    atkTypes.forEach(function (t) {
      var mult = unitTypeMult(unit, t);
      if (mult === 0) score -= 2;
      else if (mult < 1) score -= 1;
      else if (mult >= 2) score += 1;
    });
    return score;
  }

  function bestBoxCandidateForBoss(boss) {
    var atkTypes = computeBossAttackTypes(boss);
    if (!atkTypes.length) return null;
    var teamMembers = state.team.map(getSpeciesByX).filter(Boolean);
    var boxMembers = state.box.map(getSpeciesByX).filter(Boolean).filter(serveProMono); // Monotype vale aqui também
    if (!teamMembers.length || !boxMembers.length) return null;

    // Cada membro (time e caixa) é avaliado pelas unidades de batalha dele
    // (battleUnitsOf, conforme o modo de mega): um Charizard na caixa que
    // resiste mal ao chefão na base pode ser a resposta como Mega Charizard Y.
    // No modo temporário a unidade mega inclui a base (toda luta começa nela).
    // Do lado do time vale o mesmo, senão a comparação sugeriria trocar um
    // membro que já resolve a luta mega-evoluindo.
    var teamBestScore = null;
    teamMembers.forEach(function (owned) {
      battleUnitsOf(owned).forEach(function (unit) {
        var s = bossSafetyScore(unit, atkTypes);
        if (teamBestScore === null || s < teamBestScore) teamBestScore = s;
      });
    });

    var boxBest = null;
    boxMembers.forEach(function (owned) {
      battleUnitsOf(owned).forEach(function (unit) {
        var s = bossSafetyScore(unit, atkTypes);
        var r = rankDe(unit.main.sname);
        var rankScore = r ? r.score : 0;
        if (!boxBest || s < boxBest.score || (s === boxBest.score && rankScore > boxBest.rankScore)) {
          boxBest = { unit: unit, sp: unit.main, owned: owned, score: s, rankScore: rankScore };
        }
      });
    });
    if (!boxBest || boxBest.score >= teamBestScore) return null;

    var reason = null;
    atkTypes.forEach(function (t) {
      var mult = unitTypeMult(boxBest.unit, t);
      if (!reason || mult < reason.mult) reason = { t: t, mult: mult };
    });
    return { sp: boxBest.sp, owned: boxBest.owned, reasonType: reason.t, reasonMult: reason.mult };
  }

  // ---------------- confronto com o chefão ----------------
  // Adaptador entre a página e o motor puro (src/regras/confronto.js), pauta de
  // 2026-09-24 ("estratégia e sugestão de times e builds", com a regra do
  // usuário de ser semi-automático: nada aqui pede clique nem pergunta
  // nada - aparece sozinho pra qualquer chefão que estiver aberto e pra
  // próxima luta no resumo da Dex). Todas as decisões de estado (time,
  // builds, modo de mega, forma Mega/Primal do chefão) ficam aqui; as regras
  // ficam no motor, onde os testes unitários e de sabotagem as protegem.
  function confrontoUnitOf(unit) {
    var forms = unit.forms.map(function (f) {
      var ids = alwaysActiveAbilities(f).slice();
      var b = effectiveBuild(f);
      if (b && b.ability && ABILITY_ID_BY_NAME[b.ability] !== undefined) ids.push(ABILITY_ID_BY_NAME[b.ability]);
      return { types: speciesTypeNames(f), abilityIds: ids };
    });
    // Golpes da build da forma principal; sem ela, da primeira outra forma da
    // unidade que tenha build. Nunca mistura golpes de formas diferentes.
    var moves = null;
    [unit.main].concat(unit.forms).forEach(function (f) {
      if (moves) return;
      var b = effectiveBuild(f);
      if (b && b.moves && b.moves.length) moves = b.moves;
    });
    return {
      main: unit.main, owned: unit.owned, mainTypes: speciesTypeNames(unit.main), moves: moves, forms: forms,
      // Golpes que ele pode ter na build AGORA (level cap + tutor) - base das
      // sugestões de "que golpe fecha este buraco".
      aprendiveis: availableMovesFor(unit.main).names
    };
  }

  // Pokémon de chefão -> formato do motor, já na forma Mega/Primal quando o
  // item que ele segura o transforma (mesmo mapa MEGA_FORMS da calculadora).
  function confrontoFoesDe(party) {
    return (party || []).map(function (m) {
      var megaSname = MEGA_FORMS[m.item];
      return foeFromBossMember(m, megaSname ? getSpeciesBySname(megaSname) : null);
    }).filter(Boolean);
  }

  // Uma unidade por membro do time: a forma de batalha (base, ou base+mega no
  // modo temporário, ou cada forma no permanente) que mais pontua contra ESTE
  // chefão - o jogador escolhe a melhor forma na hora, o app não deve
  // penalizar quem tem uma mega útil.
  function confrontoMelhorUnidade(owned, foes) {
    var melhor = null;
    battleUnitsOf(owned).forEach(function (u) {
      var cu = confrontoUnitOf(u);
      var pts = confrontoTime([cu], foes).pontosPorMembro[0];
      if (!melhor || pts > melhor.pts) melhor = { cu: cu, pts: pts };
    });
    return melhor && melhor.cu;
  }

  function confrontoMinhasUnidades(foes) {
    return state.team.map(getSpeciesByX).filter(Boolean).map(function (owned) {
      return confrontoMelhorUnidade(owned, foes);
    }).filter(Boolean);
  }

  // Caixa inteira na mesma régua (nunca quem já está no time). Só é calculada
  // quando a tela precisa de trocas - a caixa pode ter centenas de criaturas.
  // Numa run Monotype, só quem é do tipo (serveProMono, mono_run.js) - a troca
  // tem botão Aplicar, e sugerir outro tipo quebraria a run (2026-09-26).
  function confrontoUnidadesDaCaixa(foes) {
    return state.box.filter(function (x) { return state.team.indexOf(x) === -1; })
      .map(getSpeciesByX).filter(Boolean).filter(serveProMono).map(function (owned) {
        return confrontoMelhorUnidade(owned, foes);
      }).filter(Boolean);
  }

  // `comTrocas` liga o cálculo da melhor troca da caixa (fase 3): a ficha do
  // chefão e o resumo da Dex pedem; as outras chamadas não pagam por isso.
  function confrontoParaParty(party, comTrocas) {
    var foes = confrontoFoesDe(party);
    var minhas = confrontoMinhasUnidades(foes);
    if (!foes.length || !minhas.length) return null;
    var cx = { foes: foes, minhas: minhas, c: confrontoTime(minhas, foes), trocas: null };
    if (comTrocas) {
      var caixa = confrontoUnidadesDaCaixa(foes);
      if (caixa.length) cx.trocas = melhoresTrocas(minhas, caixa, foes, 2);
    }
    return cx;
  }

  // Lutas da run e a etapa (índice de levelcaps.json) em que acontecem: a régua do rank v2 (scripts/calcular_rank_v2.mjs lê daqui)
  // e do "melhor time no geral" da tela do time (pipeline com alvo { campo: true }, 16/10/2026). Ginásios: ordem do Emerald
  // confirmada no dado. Equipes: ordem da história do Emerald. "Courtney Sunhollow" (região nova) fica de fora: sem etapa.
  // Revanches, Frontier, Cynthia/Leaf e o campeão monotype ficam de fora (pós-jogo/opcional).
  var LUTAS_DA_RUN = [
    ["Roxanne 1", 0], ["Brawly 1", 1], ["Archie Slateport", 2], ["Wattson 1", 2],
    ["Courtney Meteor Falls", 3], ["Tabitha Mt Chimney", 3], ["Maxie Mt Chimney", 3], ["Flannery 1", 3],
    ["Norman 1", 4], ["Shelly Weather Institute", 5], ["Winona 1", 5],
    ["Matt Mt Pyre", 6], ["Archie Mt Pyre", 6], ["Tabitha Magma Hideout", 6], ["Courtney Magma Hideout", 6], ["Maxie Magma Hideout", 6],
    ["Tabitha Mossdeep", 6], ["Courtney Mossdeep", 6], ["Maxie Mossdeep", 6], ["Tate And Liza 1", 6],
    ["Matt", 7], ["Shelly Seafloor Cavern", 7], ["Archie", 7], ["Juan 1", 7],
    ["Sidney", 8], ["Phoebe", 8], ["Glacia", 8], ["Drake", 8], ["Steven", 8]
  ];

  // Linha do resumo da Dex: só a próxima luta que falta (trava do usuário,
  // RN11), usando o time que o jogador tem agora.
  // Time que o chefão usa na dificuldade escolhida (mesma regra do resto do app).
  function bossPartyPorDificuldade(boss) {
    var tier = DIFF_TO_BOSSKEY[state.settings.difficulty] || "party";
    return (boss[tier] && boss[tier].length) ? boss[tier] : boss.party;
  }

  // Melhor rank entre as unidades de batalha da criatura.
  function bestRankForm(owned) {
    var best = null;
    battleUnitsOf(owned).forEach(function (unit) {
      var r = rankDe(unit.main.sname);
      if (r && (!best || r.score > best.score)) best = { sp: unit.main, owned: owned, score: r.score, tier: r.tier };
    });
    return best;
  }

  // Dashboard summary at the top of the Dex - design proposal B, 2026-09-09.
  // Deliberately reuses computeSharedRisks() (also used by the full team
  // analysis table) rather than a separate calculation, so this can't
  // quietly disagree with what "Cobertura defensiva" says the same risk is.
  // 2026-09-24 (print do usuário no celular: o resumo tinha crescido até empurrar a
  // busca da Dex pra fora da tela - "como o usuário adiciona um Poke no time
  // desse jeito"): o topo da Dex fica COMPACTO (Time, Maior risco e uma linha da
  // próxima luta) e o detalhe - sugestão de troca, caixa, velocidade e o confronto
  // inteiro - mora no fim da aba Time (#team-nextfight, renderNextFightCard).
  function nextFightCx(nextBoss) {
    if (!nextBoss) return null;
    return confrontoParaParty(bossPartyPorDificuldade(nextBoss), true);
  }

  // Variante do time do chefão pra dificuldade atual (cai no time padrão quando
  // o chefão não tem aquela variante).
  function varianteDoChefao(boss) {
    var preferida = DIFF_TO_BOSSKEY[state.settings.difficulty] || "party";
    return (boss && boss[preferida] && boss[preferida].length) ? preferida : "party";
  }

  // Resumo puro (nao mexe no DOM) de quantos buffs de Gym Skill ainda
  // restam pro lider `leaderName` - usado no render do card e exposto na
  // ponte de teste. Retorna null quando o lider nao esta em GYM_SKILLS
  // (ainda nao e um chefao que o app reconhece como lider de ginasio).
  function gymSkillsSummaryFor(leaderName) {
    if (!GYM_SKILLS || !GYM_SKILLS.leaders) return null;
    var leaderData = GYM_SKILLS.leaders[leaderName];
    if (!leaderData) return null;
    if (leaderData.gateOnly) return { gateOnly: true, gateNote: leaderData.gateNote };
    var clearedIds = state.gymSkillsCleared[leaderName] || [];
    var buffs = leaderData.buffs.map(function (b) {
      return { id: b.id, label: b.label, detail: b.detail, cleared: clearedIds.indexOf(b.id) !== -1 };
    });
    var remaining = buffs.filter(function (b) { return !b.cleared; }).length;
    return { gateOnly: false, note: leaderData.note || null, buffs: buffs, remaining: remaining, total: buffs.length };
  }

  // Regra de campo de lutas específicas, do código oficial do jogo (scripts dos mapas):
  // a 1ª Tate&Liza tem Trick Room permanente + batalha invertida; as revanches dela, só
  // Trick Room (o atalho de revanche pula o setflag da inversa); as duplas do Steven,
  // Gravity. O campeão monotype (BATTLE_FIELD_EFFECT_MONOCHAMP, src/battle_main.c HandleMonoChampSpecialEffects +
  // textos de anúncio em src/battle_message.c) tem um efeito por tipo; o simulador ainda NÃO conta nenhum deles
  // (naoSimulado), mas a tela e o pedido à IA mostram o texto.
  var REGRA_DE_CAMPO_DO_CHEFAO = {
    "Tate And Liza 1": { sala: true, inversa: true, texto: "Trick Room permanente e batalha INVERTIDA (tabela de tipos ao contrario) a luta inteira" },
    "Tate And Liza 2": { sala: true, texto: "Trick Room permanente a luta inteira" },
    "Tate And Liza 3": { sala: true, texto: "Trick Room permanente a luta inteira" },
    "Steven Doubles": { gravidade: true, texto: "Gravity a luta inteira (Ground acerta voadores, sem Levitate)" },
    "Steven Doubles Legends": { gravidade: true, texto: "Gravity a luta inteira (Ground acerta voadores, sem Levitate)" }
  };
  var EFEITO_DO_CAMPEAO_MONOTYPE = {
    Normal: "Trick Room e Wonder Room se alternam a cada turno até o fim da luta.",
    Fighting: "Golpes super efetivos causam dano neutro. Golpes Fighting são reforçados, golpes de status ficam desativados e não dá para trocar.",
    Flying: "Uma corrente de ar protege os Flying e aumenta a Speed do time do campeão. Trick Room não tem efeito.",
    Poison: "O campo fica cheio de resíduo tóxico: o time do campeão recebe menos dano.",
    Ground: "Os voadores não conseguem ficar no ar. O time do campeão recebe menos dano de golpes super efetivos.",
    Rock: "O time do campeão é imune a golpes Rock, causa dano super efetivo em tipo Rock, e o seu time fica sob Salt Cure.",
    Bug: "Há uma infestação permanente no seu lado do campo.",
    Ghost: "Todo o seu time fica amaldiçoado.",
    Steel: "O time do campeão quebra o molde (ignora habilidades defensivas) e os dois lados recebem menos dano.",
    Fire: "A luz do sol fica extremamente forte (sol primal).",
    Water: "Chuva extremamente forte (chuva primal) e o seu time fica atolado no pântano (Swamp).",
    Grass: "Grassy Terrain permanente: o time do campeão recebe menos dano.",
    Electric: "Electric Terrain permanente: o time do campeão recebe menos dano.",
    Psychic: "Psychic Terrain permanente: o time do campeão recebe menos dano.",
    Ice: "Granizo permanente; o time do campeão ganha Speed e ataca com ela.",
    Dragon: "O time do campeão intimida todo o seu time e passa por cima das suas imunidades.",
    Dark: "Todo o seu time começa dormindo.",
    Fairy: "Misty Terrain permanente: os golpes Fairy do time do campeão acertam Poison e Steel com super efetividade."
  };
  Object.keys(EFEITO_DO_CAMPEAO_MONOTYPE).forEach(function (tipo) {
    REGRA_DE_CAMPO_DO_CHEFAO["Monochamp " + tipo] = { texto: EFEITO_DO_CAMPEAO_MONOTYPE[tipo], naoSimulado: true };
  });
  function regraDeCampoDoChefao(nome) { return REGRA_DE_CAMPO_DO_CHEFAO[nome] || null; }

  // Jeito de lutar da IA por treinador (ticket 03, 07/10): flags da config oficial (er-config TrainerList 7be1617:
  // prefer_status, prefer_stall, risky; o gerador tools/codegen TrainerPartyGenerator.kt vira AI_FLAG_*) e o que
  // cada uma soma na pontuação do golpe (battle_ai_main.c). Todo treinador já tem a IA base (tenta nocautear,
  // evita golpe inútil, troca "esperta"); isto é o extra. Só aviso na tela: o simulador não conta.
  var IA_ARRISCADA = "Arriscada: dá preferência a golpe de crítico alto e, em metade das vezes, a golpes de risco (sono, Explosion, nocaute direto, confusão, Counter, Destiny Bond, Belly Drum, Focus Punch).";
  var IA_STATUS = "Prefere golpes de status: todo golpe de status ganha um ponto a mais na escolha.";
  var COMPORTAMENTO_DA_IA_DO_CHEFAO = {
    "Roxanne 1": [
      "Prefere golpes de status: todo golpe de status ganha um ponto a mais na escolha.",
      "Joga na defesa (stall): golpes que sobem Defesa ou Defesa Especial ganham um ponto a mais."
    ],
    "Winona 2": [IA_ARRISCADA], "Winona 3": [IA_ARRISCADA], "Winona 4": [IA_ARRISCADA], "Winona 5": [IA_ARRISCADA],
    // Revanches do Calvin (treinadores opcionais desde o ticket 04).
    "Calvin 1": [IA_STATUS], "Calvin 2": [IA_STATUS], "Calvin 3": [IA_STATUS], "Calvin 4": [IA_STATUS]
  };
  function comportamentoDaIADoChefao(nome) { return COMPORTAMENTO_DA_IA_DO_CHEFAO[nome] || []; }

  // Modo Hell (revisão dos ginásios de 04/10, código oficial er-repo 217dd0f): o jogo escolhe o time pela dificuldade - Easy e Ace usam
  // `party`, Elite usa `partyInsane` e Hell usa `partyHell` (src/battle_main.c) -, e SÓ no Hell registra os eventos de treinador
  // (RegisterTrainerBattleEvents, src/data/hell_trainer_skills.h) e soma HELL_MODE_EXTRA_LEVELS (5) a todo treinador depois da 3ª
  // insígnia (FLAG_BADGE03_GET, include/constants/pokemon_config.h). A tabela de habilidades extras do código público só cobre
  // até o Wattson; os líderes seguintes, a Elite 4 e o campeão não estão nela (seus `hellSkills` ficam nos dados de treinador,
  // que o repositório público não traz) - por isso o app só mostra o que o código confirma.
  var HELL_NIVEIS_EXTRAS = 5, HELL_NIVEIS_EXTRAS_A_PARTIR_DA_INSIGNIA = 3;
  var HELL_HABILIDADES_EXTRAS_DO_CHEFAO = {
    "Roxanne 1": ["Pressure", "Shed Skin", "Self Sufficient"],
    "Wattson 1": ["Surge Surfer"]
  };
  function habilidadesExtrasDoHell(nome) { return HELL_HABILIDADES_EXTRAS_DO_CHEFAO[nome] || []; }
  function regrasDoHell(nome) { return { niveisExtras: HELL_NIVEIS_EXTRAS, aPartirDaInsignia: HELL_NIVEIS_EXTRAS_A_PARTIR_DA_INSIGNIA, habilidades: habilidadesExtrasDoHell(nome) }; }

  // Pro card do plano (relato de 02/10: o jogador marcou os 6 buffs achando que marcado = ativo, o
  // simulador rodou sem nenhum e ninguém avisou): quantos buffs o chefão tem e quais estão ATIVOS na conta.
  // Revanche de líder (Roxanne 2 a 5, Flannery 2 a 5, Wallace 2 a 5...): com o jogo zerado o script do líder (FLAG_SYS_GAME_CLEAR)
  // vai direto pro RematchScript e NUNCA passa pelo CheckTrainers, onde ficam todos os registerbattleevent (revisão dos ginásios
  // de 04/10, os 8 scripts). Só o 1º encontro de cada líder tem os buffs do ginásio.
  function ehRevancheDeLider(nome) {
    var b = BOSSES.filter(function (x) { return x.name === nome; })[0];
    if (!b || b.cat !== "Lider de Ginasio") return false;
    var base = gymLeaderBaseName(nome);
    var primeiro = BOSSES.filter(function (x) { return x.cat === "Lider de Ginasio" && gymLeaderBaseName(x.name) === base; })[0];
    return primeiro !== b;
  }
  // Buffs do ginásio (ou parte deles) que o simulador de duelo NÃO calcula - dependem de turno exato em campo (Foresight, Leech Seed,
  // Magnet Rise, Embargo) ou de estágio de precisão/herança de estágios. Vão pro aviso do plano, pra ele não parecer mais completo do
  // que é (revisão dos ginásios de 04/10). Cada texto diz a parte que fica de fora.
  var BUFFS_FORA_DA_CONTA = {
    brawly_foresight: "Foresight no seu ativo",
    wattson_magnetrise_spdef: "Magnet Rise (imune a Terra após 2 turnos)",
    flannery_accuracy: "Precisão sobe aos poucos",
    flannery_copystats: "Herda status ao entrar",
    norman_accuracy_laststand: "Precisão sobe aos poucos",
    norman_leechseed: "Leech Seed no seu ativo",
    winona_embargo: "Embargo (4 turnos sem item)"
  };
  function buffsParaMostrarDoChefao(leaderName) {
    if (ehRevancheDeLider(leaderName)) return null;
    var r = gymSkillsSummaryFor(gymLeaderBaseName(leaderName));
    if (!r || r.gateOnly) return null;
    var ativos = r.buffs.filter(function (b) { return !b.cleared; });
    return { total: r.total, ativos: ativos.map(function (b) { return b.label; }), foraDaConta: ativos.filter(function (b) { return BUFFS_FORA_DA_CONTA[b.id]; }).map(function (b) { return BUFFS_FORA_DA_CONTA[b.id]; }) };
  }
  // Ids dos buffs do ginásio que o jogador ainda NÃO tirou (vão pro simulador do
  // chefão e pro prompt da IA). Vazio pra quem não é líder com buffs.
  function buffsAtivosDoChefao(leaderName) {
    if (ehRevancheDeLider(leaderName)) return [];
    var r = gymSkillsSummaryFor(gymLeaderBaseName(leaderName));
    if (!r || r.gateOnly) return [];
    return r.buffs.filter(function (b) { return !b.cleared; }).map(function (b) { return b.id; });
  }

  // ---------------- Speed tiers ----------------
  // Timid/Jolly dão o MESMO +10% em Velocidade (só muda qual outro stat cai
  // 10%, irrelevante pra este cálculo) - Jolly é só o rótulo escolhido pra
  // representar "qualquer natureza +Velocidade" na coluna "Investido".
  var SPEEDTIER_NATURE = "Jolly";

  function computeSpeedTiers(query) {
    var level = getCurrentCap() || 50;
    var q = (query || "").trim().toLowerCase();
    var rows = SPECIES.filter(function (sp) {
      return !q || sp.n.toLowerCase().indexOf(q) !== -1;
    }).map(function (sp) {
      var base = sp.b[5];
      return {
        sp: sp,
        base: base,
        neutral: calcFinalStat(base, 31, 0, level, 5, null, null, sp.n),
        invested: calcFinalStat(base, 31, 252, level, 5, SPEEDTIER_NATURE, null, sp.n),
        scarf: calcFinalStat(base, 31, 252, level, 5, SPEEDTIER_NATURE, "Choice Scarf", sp.n)
      };
    });
    rows.sort(function (a, b) { return b.invested - a.invested || b.base - a.base; });
    return { level: level, rows: rows };
  }
