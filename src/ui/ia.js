  // ===== src/ui/ia.js =====
  // IA: ferramentas que o modelo consulta, cliente único pedirIA e os geradores de build/Estratégias.
  // Interface: lê e desenha a página. Colado no <script> principal por
  // scripts/build.mjs (marcador @ui ia.js) no MESMO lugar de onde saiu do
  // template (fase 5 da refatoração, 2026-09-24) - a ordem de execução não mudou.

  // ---------------- AI tools & build generation ----------------


  // Contexto real, já calculado em outro lugar, exposto como ferramentas do
  // sample() em vez de inventado/alucinado - revisão da equipe, 2026-09-10:
  // "ele tem que analisar o conjunto do Poke e definir a melhor forma de
  // usar ele naquele momento do jogo". Nenhuma das duas funções faz cálculo
  // novo - ambas só chamam a MESMA lógica que o painel/análise da aba Time
  // já usa (computeSharedRisks, SPECIES_RANK), então a visão da IA sobre "o
  // que esse time precisa" nunca pode discordar do que o usuário vê na tela.
  function aiTool_getTeamWeaknesses() {
    var teamMembers = state.team.map(getSpeciesByX).filter(Boolean);
    var risks = computeSharedRisks(teamMembers);
    return {
      teamSize: teamMembers.length,
      teamSpecies: teamMembers.map(function (sp) { return sp.n; }),
      sharedWeaknesses: risks.map(function (r) { return { type: r.t, weakCount: r.n }; })
    };
  }
  function aiTool_getSpeciesRank(input) {
    var sname = input && input.sname;
    var r = sname ? SPECIES_RANK[sname] : null;
    // roles/split vem de SPECIES_ROLE (sinal separado, 2026-09-11) - juntado
    // aqui na resposta da ferramenta porque o prompt já pede que a IA decida
    // "o papel que este Pokemon deve cumprir": em vez de deixar isso a
    // cargo da IA adivinhar, ela recebe o papel já calculado a partir do
    // stat/movepool real desta espécie.
    var role = sname ? SPECIES_ROLE[sname] : null;
    return {
      tier: r ? r.tier : null,
      score: r ? r.score : null,
      roles: role ? role.roles.map(function (x) { return ROLE_LABEL_PT[x] || x; }) : [],
      split: role ? (SPLIT_LABEL_PT[role.split] || role.split) : null
    };
  }

  // Golpes de prioridade REALMENTE aprendíveis por esta espécie (2026-09-11,
  // pedido do usuário: "o especialista deve sempre avaliar se é viável
  // incluir um golpe de prioridade"). Restrito ao mesmo movepool que
  // validateAiBuild() aceita (nível + tutor - TM/HM fica de fora, mesmo
  // escopo já usado pro resto da build por IA) para nunca sugerir um golpe
  // que a validação depois rejeitaria. `prio` vem direto do dado real do
  // jogo (MOVES[id][7], ver transform.ps1) - nunca uma lista fixa "os golpes
  // de prioridade são X, Y, Z" chutada de memória, porque prioridade PODE
  // mudar por golpe neste hack (achado ao extrair o campo: Quick Attack aqui
  // tem prio=2, igual Extreme Speed, diferente do +1 da série oficial).
  function aiTool_getPriorityMoveOptions(input) {
    var sname = input && input.sname;
    var sp = sname ? getSpeciesBySname(sname) : null;
    if (!sp) return { priorityMoves: [] };
    // Mesma trava por level cap de validateAiBuild/generateBuildWithAI
    // (achado real, 2026-09-12) - sem isso, esta ferramenta podia sugerir
    // pra IA um golpe de prioridade real mas ainda fora do nível atual.
    var ids = availableMovesFor(sp).ids;
    var priorityMoves = [];
    ids.forEach(function (id) {
      var m = MOVES[id];
      if (m && typeof m[7] === "number" && m[7] > 0) {
        priorityMoves.push({ name: m[0], power: m[3] || 0, priority: m[7] });
      }
    });
    return { priorityMoves: priorityMoves };
  }

  // Fase 3 do roadmap de sinergia (reunião 2026-09-11: "os dados dos golpes
  // podem combinar com habilidades... extraindo o verdadeiro potencial
  // dele"). Só repassa o que scripts/compute_ability_movepool_synergy.ps1 já
  // verificou contra o movepool real (nível+tutor) desta espécie - nunca
  // recalcula nem infere nada aqui, mesmo princípio das outras ferramentas
  // desta seção (dado pronto, não alucinado dentro da chamada de IA).
  function aiTool_getAbilityMovepoolSynergy(input) {
    var sname = input && input.sname;
    var spSin = sname ? getSpeciesBySname(sname) : null;
    var hits = spSin ? sinergiasDaEspecie(spSin) : null;
    if (!hits) return { synergies: [] };
    return {
      synergies: hits.map(function (h) {
        return {
          ability: h.name,
          kind: h.kind === "inn" ? "innate (sempre ativa)" : "escolhivel",
          categoria: h.categoria,
          golpesReaisQueSeBeneficiam: h.golpes
        };
      })
    };
  }

  // Mesmo espirito de aiTool_getAbilityMovepoolSynergy acima, mas pra
  // sinergia CONDICIONAL (clima/HP baixo) em vez de categoria/tipo de golpe -
  // ver CONDITION_MOVE_SYNERGY (reindexado no load a partir de
  // scripts/compute_condition_move_synergy.ps1). Combo autossuficiente real:
  // a propria especie aprende o golpe que satisfaz a condicao da habilidade,
  // sem depender de outro membro do time nem de dano externo.
  function aiTool_getConditionMoveSynergy(input) {
    var sname = input && input.sname;
    var hits = sname ? CONDITION_MOVE_SYNERGY[sname] : null;
    if (!hits) return { combos: [] };
    return {
      combos: hits.map(function (h) {
        return {
          ability: h.habilidade,
          kind: h.kind === "inn" ? "innate (sempre ativa)" : "escolhivel",
          condicao: h.tipo === "clima" ? ("clima: " + h.clima) : "HP baixo (via recuo do proprio golpe)",
          golpesReaisQueAtivamSozinho: h.golpes
        };
      })
    };
  }

  // Fase 4 do plano "estratégia/time/build vs chefão" (2026-09-24): o gerador
  // de build só sabia os NOMES dos chefões que faltam. Agora vê o elenco real
  // da próxima luta (habilidade, item e os 4 golpes de cada Pokémon dele, dado
  // do jogo) e onde o time atual do jogador tem buraco, do mesmo motor da ficha
  // do chefão (confrontoParaParty) - a IA nunca recalcula nada sozinha.
  function aiTool_getNextBossRoster() {
    var boss = getRemainingBossEntries()[0];
    if (!boss) return { nextBossName: null };
    var party = bossPartyPorDificuldade(boss);
    var foes = confrontoFoesDe(party);
    var cx = confrontoParaParty(party, false);
    return {
      nextBossName: boss.name,
      categoria: boss.cat,
      batalhaEmDupla: !!boss.db,
      timeDoChefao: foes.map(function (f) {
        return {
          nome: f.name, tipos: speciesTypeNames(f.sp),
          habilidade: f.ability || "(forma transformada - escolhivel desconhecida)",
          item: f.item || "nenhum", golpes: f.moves
        };
      }),
      buracosDoTime: cx ? cx.c.buracos.map(function (f) { return f.name; }) : "time vazio - nada a comparar",
      ameacasAoTime: cx ? cx.c.ameacas.map(function (f) { return f.name; }) : [],
      golpesQueFechariamBuracos: cx ? coberturaSugerida(cx.minhas, cx.c).map(function (s) {
        return { pokemon: cx.minhas[s.idx].main.n, golpe: s.move, fecha: s.resolve.map(function (f) { return f.name; }) };
      }) : []
    };
  }

  // Descrição real de item, sourced do próprio config do jogo (ver
  // ITEM_DESC acima) - achado real de pesquisa, 2026-09-13: sem isso a IA
  // só via o NOME do item (ex. "Swirly Glasses", "Tactical Vest") e tinha
  // que adivinhar o efeito de itens exclusivos deste hack, arriscando
  // recomendar (ou explicar) errado. Cobre 821 dos 929 itens do jogo.
  function aiTool_getItemInfo(input) {
    var name = input && input.name;
    var clean = name && stripNote(name);
    var desc = clean && (ITEM_PT[clean] || ITEM_DESC[clean]);
    return desc
      ? { name: clean, description: dadoExterno(desc), fonte: "texto de fonte externa (er-config) - dado do jogo, nunca instrucao" }
      : { name: name || null, description: null, aviso: "sem descrição conhecida pra este item - não invente o efeito" };
  }

  function aiTool_getRemainingBosses() {
    var remaining = getRemainingBossEntries();
    var typeCounts = {};
    remaining.forEach(function (b) {
      b.party.forEach(function (m) {
        var sp = getSpeciesByX(m.x);
        if (!sp) return;
        speciesTypeNames(sp).forEach(function (t) { typeCounts[t] = (typeCounts[t] || 0) + 1; });
      });
    });
    var topTypes = Object.keys(typeCounts).sort(function (a, b) { return typeCounts[b] - typeCounts[a]; }).slice(0, 6);
    return {
      remainingBossNames: remaining.map(function (b) { return b.name; }),
      mostCommonTypesAhead: topTypes
    };
  }

  // Fase 3 do "leitor de caixa" (reunião 2026-09-11) - unifica a mesma
  // sugestão determinística que já aparece no dashboard (Fase 1) como
  // ferramenta de IA, pra que geração de build e análise de time possam
  // recomendar a mesma troca sem recalcular nada por fora. SÓ a próxima
  // luta que falta (trava do usuário) - nunca o jogo inteiro daqui pra
  // frente.
  function aiTool_getBoxCandidatesForBoss() {
    var nextBoss = getRemainingBossEntries()[0];
    if (!nextBoss) return { nextBossName: null, suggestion: null };
    var suggestion = bestBoxCandidateForBoss(nextBoss);
    return {
      nextBossName: nextBoss.name,
      suggestion: suggestion ? {
        sname: suggestion.sp.sname,
        name: suggestion.sp.n,
        megaDe: suggestion.owned.x !== suggestion.sp.x ? suggestion.owned.n : null,
        motivo: (suggestion.reasonMult === 0 ? "imune a " : "resiste bem a ") + suggestion.reasonType
      } : null
    };
  }

  // Ferramenta pra IA (achado em auditoria, 2026-09-18, item 14): a tabela
  // de Speed Tiers (computeSpeedTiers, feature desta mesma sessão) nunca
  // tinha chegado até o gerador de build por IA - ela decidia investimento
  // de Velocidade só olhando o stat base no prompt, sem saber se 252 EV
  // realmente ultrapassa alguma ameaça de verdade do jogo. Mesmo padrão das
  // outras ferramentas: devolve um dado já calculado pelo app (mesmo
  // computeSpeedTiers da tela de Tipos), a IA nunca recalcula sozinha.
  function aiTool_getSpeedBenchmark(input) {
    var sname = input && input.sname;
    var sp = sname ? getSpeciesBySname(sname) : null;
    if (!sp) return { erro: "sname nao encontrado" };
    var st = computeSpeedTiers("");
    var idx = st.rows.findIndex(function (r) { return r.sp.sname === sname; });
    if (idx === -1) return { erro: "especie sem entrada na tabela de Speed Tiers" };
    var row = st.rows[idx];
    return {
      nivel: st.level,
      velocidadeBase: row.base,
      velocidadeSemInvestimento: row.neutral,
      velocidadeComInvestimento: row.invested,
      velocidadeComChoiceScarf: row.scarf,
      posicaoNoRankingInvestido: idx + 1,
      totalDeEspecies: st.rows.length,
      especiesQueUltrapassaInvestindo: st.rows.length - idx - 1
    };
  }

  // "Gerar build com IA" - 2026-09-09, user's own rule: check for a saved
  // build first (that's the normal render path, already handled by
  // myBuildEditorHtml/effectiveBuild); when there's room for another (cap
  // 3), a single explicit click here calls Claude directly from the
  // published page via the `sample` capability instead of requiring the
  // user to leave the app and paste an export into a separate chat.
  // Requires `capabilities: {sample: {}}` at publish time - degrades to a
  // status message, not a silent failure, when unavailable (viewer denied
  // it, or running somewhere `window.claude` doesn't exist at all, like
  // this project's own local dev-server tests).
  // Reforçado, 2026-09-10 (reunião da equipe sobre onde o Especialista em
  // Meta Pokémon entra nesse processo): antes só mandava os dados isolados
  // desse Pokémon. Agora também dá pro Claude, via `opts.tools`, acesso à
  // MESMA análise de fraquezas do time e ao MESMO rank real que o resto do
  // app já usa (aiTool_getTeamWeaknesses/aiTool_getSpeciesRank acima) - o
  // especialista não tem acesso à internet dentro dessa chamada (a
  // capability `sample` não navega, não tem ferramenta de busca, não tem
  // memória entre chamadas - ver skill artifact-capabilities), então isso
  // é o que dá pra fazer de real: raciocinar sobre o time e o momento do
  // jogo de verdade, em vez de inventar contexto que não existe.
  // Fábrica única das ferramentas de IA compartilhadas entre os pontos que
  // chamam sample.json() com `tools` - achado real em revisão de código,
  // 2026-09-12: cada chamador colava os mesmos objetos à mão, e as
  // descrições já tinham divergido entre pontos de chamada. Cada chamador
  // ainda soma o que for específico dele por cima desta base.
  function buildStandardAiTools() {
    return [
      {
        name: "getTeamWeaknesses",
        description: "Retorna o tamanho do time atual do jogador e quais tipos derrubam 2 ou mais membros ao mesmo tempo (fraqueza compartilhada real, ja calculada pelo app).",
        execute: function () { return aiTool_getTeamWeaknesses(); }
      },
      {
        name: "getSpeciesRank",
        description: "Retorna o tier (SS/S/A/B/C/D) e a pontuacao real deste hack pra uma especie, dado o sname interno (ex: SPECIES_CHARIZARD), mais o(s) papel(is) ja calculado(s) (Pivo/Tanque/Wallbreaker/Sweeper) e a divisao fisico/especial/misto do ataque.",
        inputSchema: { type: "object", properties: { sname: { type: "string" } }, required: ["sname"] },
        execute: function (input) { return aiTool_getSpeciesRank(input); }
      },
      {
        name: "getRemainingBosses",
        description: "Retorna os nomes dos lideres de ginasio/Alto Comando/Campeao que o jogador AINDA NAO enfrentou a partir do progresso atual dele, mais os tipos mais comuns nos times deles - usa o progresso ja configurado pelo jogador, nao pergunta nada.",
        execute: function () { return aiTool_getRemainingBosses(); }
      },
      {
        name: "getPriorityMoveOptions",
        description: "Retorna os golpes de prioridade (prio > 0) que esta especie realmente aprende (por nivel ou liberado desde o inicio - mesmo conjunto permitido nos 4 golpes da build), com nome/poder/prioridade reais. Lista vazia = esta especie nao tem golpe de prioridade viavel.",
        inputSchema: { type: "object", properties: { sname: { type: "string" } }, required: ["sname"] },
        execute: function (input) { return aiTool_getPriorityMoveOptions(input); }
      },
      {
        name: "getAbilityMovepoolSynergy",
        description: "Retorna, pro sname informado, quais habilidades (escolhivel ou innate) desta especie realmente aumentam o poder de uma categoria de golpe ou tipo E a especie de fato aprende (por nivel ou liberado desde o inicio) pelo menos um golpe real dessa categoria - com os nomes dos golpes reais que se beneficiam. Lista vazia = nenhuma sinergia confirmada pro movepool real desta especie.",
        inputSchema: { type: "object", properties: { sname: { type: "string" } }, required: ["sname"] },
        execute: function (input) { return aiTool_getAbilityMovepoolSynergy(input); }
      },
      {
        name: "getConditionMoveSynergy",
        description: "Retorna, pro sname informado, combos autossuficientes reais entre uma habilidade condicional (ativa com clima especifico ou com HP baixo) e um golpe que esta MESMA especie aprende (por nivel ou liberado desde o inicio) e que satisfaz essa condicao sozinha - sem depender de outro membro do time preparar o clima, nem de dano externo pra baixar o HP. Lista vazia = nenhum combo confirmado pra esta especie.",
        inputSchema: { type: "object", properties: { sname: { type: "string" } }, required: ["sname"] },
        execute: function (input) { return aiTool_getConditionMoveSynergy(input); }
      },
      {
        name: "getNextBossRoster",
        description: "Retorna o elenco REAL da proxima luta que falta (cada Pokemon do chefao com tipos, habilidade, item e os 4 golpes - dado do jogo), se a luta e em dupla, quais Pokemon dele o time atual do jogador NAO acerta super efetivo (buracosDoTime), quais ameacam metade ou mais do time, e quais golpes que os membros do time ja podem usar fechariam esses buracos. Use pra montar uma build que responda a uma ameaca concreta desta luta.",
        execute: function () { return aiTool_getNextBossRoster(); }
      },
      {
        name: "getBoxCandidatesForBoss",
        description: "Retorna o nome da proxima luta que falta (a partir do progresso atual do jogador) e, se existir, uma sugestao real de troca da caixa pra essa luta especifica (nunca alem dela), ja calculada pelo app (tipos de ataque reais do chefao x defesa real do candidato).",
        execute: function () { return aiTool_getBoxCandidatesForBoss(); }
      },
      {
        name: "getItemInfo",
        description: "Retorna a descricao real (em ingles, texto original do jogo) do efeito de um item pelo nome exato (ex: 'Swirly Glasses', 'Tactical Vest', 'Iron Pill'). Use SEMPRE antes de recomendar ou explicar um item que nao seja obviamente vanilla/conhecido - nao adivinhe o efeito de item exclusivo deste hack. Retorna description=null quando nao ha descricao conhecida (nesse caso, nao invente o efeito).",
        inputSchema: { type: "object", properties: { name: { type: "string" } }, required: ["name"] },
        execute: function (input) { return aiTool_getItemInfo(input); }
      },
      {
        name: "getSpeedBenchmark",
        description: "Retorna, pro sname informado, a Velocidade real (no level cap atual) sem EV, com 252 EV + nature +Velocidade, e com Choice Scarf em cima - mais a posicao real desta especie no ranking de Velocidade investida entre as " + SPECIES.length + " especies do jogo e quantas ela ultrapassa investindo. Use antes de decidir EV de Velocidade - em vez de chutar se 252 EV 'e rapido o bastante', confira a posicao real.",
        inputSchema: { type: "object", properties: { sname: { type: "string" } }, required: ["sname"] },
        execute: function (input) { return aiTool_getSpeedBenchmark(input); }
      }
    ];
  }






  // ---------------- cliente único de IA (fase 4 da refatoração, 2026-09-24) ----------------
  // Todo pedido ao modelo passa por aqui. Antes cada um dos 5 geradores repetia
  // a checagem de disponibilidade, o sample.json, a nova tentativa com o motivo
  // da rejeição e o tratamento de erro - e já tinham divergido (um tentava 2
  // vezes, outro 1, mensagens diferentes pro mesmo erro).
  //   o.prompt        texto do pedido
  //   o.validar(raw)  -> { valor } quando serve, { motivo } quando não serve
  //                      (+ motivoParaJogador opcional: o texto da tela, quando
  //                      o motivo técnico pro modelo for diferente)
  //   o.tentativas    total de chamadas (padrão 2: a 2ª leva o motivo da 1ª)
  //   o.retentativa(motivo) -> texto anexado ao prompt na nova tentativa
  //   o.aoTentarDeNovo(motivo) -> aviso pro jogador enquanto pede de novo
  //   o.ferramentas   false = sem as ferramentas do app (pedido curto)
  //   o.oQue          "Geração" / "Montagem" - só pra mensagem de indisponível
  // Devolve { ok: true, valor, bruto } ou { ok: false, mensagem } (mensagem já
  // pronta pro jogador; `rejeitada` true quando o modelo respondeu mas nenhuma
  // resposta passou na validação).
  //   o.aviso(texto)  status pro jogador: fila, tempo decorrido, nova tentativa
  //   o.pausasMs      espera antes de cada nova tentativa por falha passageira
  //                   (padrão PAUSAS_IA_MS; os testes passam [0, 0])
  //
  // Reunião de 2026-09-28 (usuário: "algumas chamadas demoram e às vezes dão
  // o retorno que não gera nada, como se a IA estivesse ocupada"). Três
  // defesas, todas aqui pra valer em todo pedido:
  //  - FILA ÚNICA: um pedido por vez. A revisão automática (até 3 ao abrir a
  //    página) e o clique do jogador disputavam o serviço ao mesmo tempo, o
  //    que provoca justamente o "muitos pedidos"/serviço ocupado.
  //  - FALHA PASSAGEIRA tenta de novo sozinha, com espera crescente, antes de
  //    mostrar erro. Os códigos seguem sample.d.ts (código desconhecido conta
  //    como upstream_error, passageiro).
  //  - TEMPO VISÍVEL: "Consultando o Claude… 14 s" em vez de texto parado.
  var PAUSAS_IA_MS = [4000, 10000];
  var ERROS_IA_PASSAGEIROS = ["upstream_error", "rate_limited", "empty_completion", "invalid_json"];
  var ERROS_IA_DEFINITIVOS = ["not_granted", "session_expired", "refused", "prompt_too_large", "sampling_disabled",
    "not_declared", "capability_disabled", "capability_removed", "tools_unavailable"];
  // Só erro DA PLATAFORMA (com code) pode ser passageiro; erro sem code é bug do
  // app (TypeError numa ferramenta...) e não passa sozinho - mostra na hora.
  function erroIAPassageiro(e) {
    var code = e && e.code;
    if (typeof code !== "string") return false;
    return ERROS_IA_PASSAGEIROS.indexOf(code) !== -1 || ERROS_IA_DEFINITIVOS.indexOf(code) === -1;
  }
  // Tempo-limite de uma chamada: sem ele, uma chamada que nunca responde
  // prenderia a fila única e todo pedido seguinte ficaria "Na fila" até
  // recarregar a página. A chamada em si continua lá; a fila é que anda.
  var TEMPO_LIMITE_IA_MS = 180000;
  function comTempoLimite(promessa) {
    var timer;
    var limite = new Promise(function (_, falha) {
      timer = setTimeout(function () { var e = new Error("tempo esgotado"); e.code = "tempo_esgotado"; falha(e); }, TEMPO_LIMITE_IA_MS);
    });
    return Promise.race([promessa, limite]).finally(function () { clearTimeout(timer); });
  }
  var filaIA = Promise.resolve();
  var pedidosIAPendentes = 0;
  function esperarMs(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }
  function pedirIA(o) {
    var aviso = o.aviso || function () {};
    if (pedidosIAPendentes > 0) aviso("Na fila - esperando outra consulta à IA terminar…");
    pedidosIAPendentes++;
    var vez = filaIA.then(function () { return pedirIAAgora(o); });
    // A fila anda mesmo se este pedido falhar.
    filaIA = vez.catch(function () {}).then(function () { pedidosIAPendentes--; });
    return vez;
  }
  // Uma chamada ao modelo, com as novas tentativas de falha passageira.
  async function chamarModelo(sample, prompt, opts, o, rotulo) {
    var aviso = o.aviso || function () {};
    var pausas = o.pausasMs || PAUSAS_IA_MS;
    for (var i = 0; ; i++) {
      var inicio = Date.now();
      var base = i === 0 ? rotulo : rotulo.replace(/(…|\.\.\.)$/, "") + " - tentativa " + (i + 1) + " de " + (pausas.length + 1) + "…";
      aviso(base);
      var relogio = setInterval(function () { aviso(base + " " + Math.round((Date.now() - inicio) / 1000) + " s"); }, 1000);
      try {
        return await comTempoLimite(sample.json(prompt, opts));
      } catch (e) {
        if (i >= pausas.length || !erroIAPassageiro(e)) throw e;
        aviso("A IA está ocupada - tentando de novo em " + Math.round(pausas[i] / 1000) + " s…");
        await esperarMs(pausas[i]);
      } finally {
        clearInterval(relogio);
      }
    }
  }
  async function pedirIAAgora(o) {
    var oQue = o.oQue || "Geração";
    if (typeof claude === "undefined" || !claude.use) return { ok: false, mensagem: oQue + " por IA não disponível neste ambiente." };
    var sample = await claude.use("sample");
    if (!sample) return { ok: false, mensagem: oQue + " por IA não disponível (recurso não concedido)." };
    var tentativas = o.tentativas || 2;
    var prompt = o.prompt;
    var ultimo = null;
    try {
      for (var t = 1; t <= tentativas; t++) {
        var bruto = await chamarModelo(sample, prompt, o.ferramentas === false ? undefined : { tools: buildStandardAiTools() }, o,
          t === 1 ? "Consultando o Claude…" : "A primeira sugestão não passou na validação - pedindo outra…");
        var r = o.validar ? o.validar(bruto) : { valor: bruto };
        if (r && !r.motivo) return { ok: true, valor: r.valor, bruto: bruto };
        // `motivo` vai pro modelo na nova tentativa; `motivoParaJogador` (se
        // houver) é o que aparece na tela quando desiste.
        ultimo = { motivo: (r && r.motivo) || "a resposta não veio no formato pedido.", paraJogador: r && r.motivoParaJogador };
        if (t < tentativas) {
          if (o.aoTentarDeNovo) o.aoTentarDeNovo(ultimo.motivo);
          prompt = o.prompt + (o.retentativa ? o.retentativa(ultimo.motivo) : "");
        }
      }
      return { ok: false, rejeitada: true, mensagem: ultimo.paraJogador || ultimo.motivo };
    } catch (e) {
      return { ok: false, mensagem: sampleErrorMessage(e) };
    }
  }

  // Acertos na build validada antes de gravar (tirados de generateBuildWithAI na
  // fase 5 da refatoração). Item repetido no time é permitido desde 2026-09-27
  // (pedido do usuário: "cada Pokémon pode ter um item e esse item pode ser
  // repetido pelo time") - antes o item já em uso por outro membro era apagado.
  function ajustarBuildDaIa(sp, validated, opts, cap) {
    if (opts.modo === "ponte" && opts.alvo) {
      // A build de agora é a curada com golpes-ponte: habilidade, natureza,
      // item e EVs continuam os da curada (quando valem pra esta forma).
      var alvoAb = uniqueIds(sp.ab).map(function (id) { return ABILITIES[id][0]; });
      if (alvoAb.indexOf(opts.alvo.ability) !== -1) validated.ability = opts.alvo.ability;
      if (opts.alvo.nature) validated.nature = opts.alvo.nature;
      validated.item = opts.alvo.item || "";
      validated.evs = evsTextoParaArray(opts.alvo.evs);
      validated.rationale = "Build curada adaptada ao level cap " + cap + ": golpes-ponte até liberar os da curada.";
    }
  }

  // Uma ação só: gravar a build, limpar a marca de revisão e registrar no
  // log - uma gravação e um redesenho no fim (card do time, ficha aberta
  // desta espécie, confronto). Devolve false se não salvou (lista cheia).
  function salvarBuildDaIa(sp, validated, opts, cap) {
    return acao(telasDeBuild(sp.sname).concat(["log"]), function () {
      var salvou, saiu = null;
      // Build nova depois da evolução (2026-09-27, decisão do usuário: "guarda
      // como secundária"): a nova vira a ativa e a de antes fica de reserva,
      // marcada "Antes de evoluir" no chip - nunca é ela que sai pra abrir vaga.
      if (opts.modo === "revisao") saiu = abrirVagaPreservando(sp.sname, opts.anterior);
      // Build contra um chefão (2026-09-29, decisão do usuário: "gera uma nova pra
      // este chefão" e ela vira a ativa): abre vaga como a da evolução.
      // Time novo pelo "Montar time completo" (2026-09-29, decisão do usuário: a
      // build nova substitui a da tela e a antiga fica de variante): mesma regra.
      else if (opts.chefao || opts.timeNovo) saiu = abrirVagaPreservando(sp.sname, getActiveBuild(sp.sname), true);
      salvou = addBuildVariant(sp.sname, validated, opts.modo === "ponte" ? "curada" : "ia");
      // Último recurso: troca a ativa - mas nunca uma feita à mão no time novo/chefão.
      var ativaManual = (getActiveBuild(sp.sname) || {}).source === "manual";
      if (!salvou && (opts.modo === "revisao" || ((opts.chefao || opts.timeNovo) && !ativaManual))) salvou = setOrReplaceActiveBuild(sp.sname, validated, "ia");
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
    });
  }

  // Depois de validada: confere se a resposta ainda vale, ajusta, anexa o plano e
  // grava. Tirada de generateBuildWithAI (2026-09-30) pra servir também ao lote de
  // builds do time. Devolve true, false ou "obsoleta".
  function gravarBuildValidadaDaIa(sp, validated, raw, opts, cap, aviso) {
    // A IA leva de segundos a minutos. Nos modos automáticos, se o mundo mudou
    // nesse meio-tempo (o jogador editou/criou a build, a criatura saiu do time
    // ou voltou de forma), a resposta é descartada - nunca passa por cima de
    // uma escolha feita enquanto esperava. "obsoleta" não conta como falha.
    if (opts.modo === "revisao" && (getActiveBuild(sp.sname) !== opts.anterior || state.team.indexOf(sp.x) === -1)) return "obsoleta";
    if (opts.modo === "ponte" && (getActiveBuild(sp.sname) || state.team.indexOf(sp.x) === -1)) return "obsoleta";
    if ((opts.chefao || opts.timeNovo) && state.team.indexOf(sp.x) === -1) return "obsoleta"; // saiu do time enquanto esperava
    ajustarBuildDaIa(sp, validated, opts, cap);
    var planoCheck = anexarPlanoDaIa(sp, validated, raw && raw.plano, cap,
      opts.modo === "ponte" && opts.alvo ? opts.alvo.moves : null);
    validated.planoConsultado = true; // o prompt já pediu o plano - não pedir de novo
    // Chefão + variante do time (Padrão/Insane/Hell têm times diferentes - revisão de
    // 2026-09-30): clicar de novo no MESMO time e cap não regera à toa.
    if (opts.chefao) validated.feitaPara = { chefao: opts.chefao.chave || opts.chefao.boss.name, cap: cap || 0 };
    var ok = salvarBuildDaIa(sp, validated, opts, cap);
    if (!ok) {
      aviso((opts.chefao || opts.timeNovo)
        ? "Limite de 3 builds de " + sp.n + " com builds feitas por você - apague uma na ficha pra caber a nova."
        : "Limite de 3 builds atingido.");
      return false;
    }
    if (!opts.silencioso) {
      flashToast("Build gerada por IA salva para " + sp.n +
        (validated.plano ? " - com " + Object.keys(validated.plano).length + " troca(s) planejada(s) para quando o cap subir" : ""));
    }
    if (planoCheck.descartados.length) {
      aviso("Trocas do plano descartadas: " + planoCheck.descartados.map(function (d) { return d.motivo; }).join("; ") + ".");
    }
    // A ação acima já redesenhou a ficha (só se for desta espécie - nunca
    // puxa o jogador de volta pra ela, bug de 2026-09-11) e o card do time.
    return true;
  }

  // Curada no lugar da IA no time novo (2026-09-30, decisão do usuário: "só quando
  // não houver Clima/Tática"). Entra se: há curada do estilo do time, todos os
  // golpes dela já estão liberados no level cap, o item não passa de 2 no time e há
  // vaga sem tirar build feita à mão. Devolve true se aplicou (sem chamada de IA).
  function aplicarCuradaNoTimeNovo(sp, pace) {
    var cur = curadaParaEstilo(sp.sname, estiloDoRitmo(pace), true);
    if (!cur || golpesTravadosNoCap(sp, cur.moves).some(function (g) { return g.nivel !== null; })) return false;
    var item = stripNote(cur.item);
    if (item && (itensEmUsoComQuem(sp.x)[item] || []).length >= MAX_MESMO_ITEM_NO_TIME) return false;
    var lista = getBuildList(sp.sname);
    if (lista.length >= 3 && lista.every(function (b) { return b.source === "manual"; })) return false;
    var entrada = { ability: cur.ability, nature: cur.nature, item: cur.item, moves: cur.moves.slice(), planoConsultado: true,
      ivs: [31, 31, 31, 31, 31, 31], evs: evsTextoParaArray(cur.evs), rationale: "Build curada de " + sp.n + " (" + (cur.fonte || "curadoria") + "), no estilo do time." };
    if (cur.plano) entrada.plano = cur.plano;
    return acao(telasDeBuild(sp.sname).concat(["log"]), function () {
      abrirVagaPreservando(sp.sname, getActiveBuild(sp.sname), true);
      var ok = addBuildVariant(sp.sname, entrada, "curada");
      if (!ok && (getActiveBuild(sp.sname) || {}).source !== "manual") ok = setOrReplaceActiveBuild(sp.sname, entrada, "curada");
      if (ok) logAutoAction("Build curada de " + sp.n + " usada no time novo (sem consultar a IA): " + entrada.moves.join(", ") + ".");
      return !!ok;
    });
  }

  // Lote de builds do time (2026-09-30, decisão do usuário: "sim, uma chamada pro
  // time"): UMA consulta pras builds de todos os membros (montarPromptBuildsDoTime,
  // ~37% menos texto que 6 consultas e um pedido só). Cada build da resposta passa
  // pela MESMA validação da build individual e é gravada na hora (a trava de 2
  // itens iguais já enxerga as gravadas); só quem ficou sem build válida é pedido
  // de novo, sozinho, pelo caminho individual (generateBuildWithAI).
  // `opts`: o de cada membro vem de optsDe(sp) (chefão: quem ele responde).
  // Devolve { [sname]: true | false | "obsoleta" }.
  async function gerarBuildsDoTimeComIA(members, statusElId, optsDe, optsLote, aoProgresso) {
    var resultado = {};
    var cap = getCurrentCap();
    var aviso = function (texto) { var el = document.getElementById(statusElId); if (el) el.textContent = texto; };
    var progresso = aoProgresso || function () {};
    var faltam = members.slice();
    if (members.length > 1) {
      progresso("Gerando as " + members.length + " builds numa consulta só…");
      var resp = await pedirIA({
        prompt: montarPromptBuildsDoTime(members, optsLote),
        ferramentas: false,
        tentativas: 1, // quem falhar vai pelo caminho individual (com a nova tentativa dele)
        oQue: "Builds do time",
        aviso: aviso,
        validar: function (bruto) {
          return bruto && bruto.builds && typeof bruto.builds === "object" ? { valor: bruto.builds } : { motivo: "a resposta não trouxe o campo builds." };
        }
      });
      aviso("");
      if (resp.ok) {
        faltam = [];
        members.forEach(function (sp) {
          var bruto = resp.valor[sp.sname] || resp.valor[sp.n];
          var v = bruto ? validateAiBuild(sp, bruto, {}, contextoDeValidacao(sp, optsDe(sp))) : null;
          var r = v ? gravarBuildValidadaDaIa(sp, v, bruto, optsDe(sp), cap, aviso) : false;
          // Só sai do lote quem ganhou build: quem vai ser pedido de novo continua
          // fora da conta de itens em uso (a build velha dele ainda vai sair).
          if (r === false) faltam.push(sp); else { resultado[sp.sname] = r; concluirBuildDoLote(sp.x); }
        });
      }
    }
    // Sem vaga (3 builds, todas feitas pelo jogador): pedir de novo só gastaria
    // outra chamada - a build nova não teria onde ficar.
    var semVaga = function (s) { var l = getBuildList(s.sname); return l.length >= 3 && l.every(function (b) { return b.source === "manual"; }); };
    faltam = faltam.filter(function (s) {
      if (!semVaga(s)) return true;
      resultado[s.sname] = false;
      resultado.ultimoMotivo = "Limite de 3 builds de " + s.n + " com builds feitas por você - apague uma na ficha pra caber a nova.";
      concluirBuildDoLote(s.x);
      return false;
    });
    for (var i = 0; i < faltam.length; i++) {
      var sp = faltam[i];
      progresso("Build " + (members.length - faltam.length + i + 1) + "/" + members.length + ": " + sp.n + " (sozinha)…");
      resultado[sp.sname] = await generateBuildWithAI(sp, statusElId, optsDe(sp));
      concluirBuildDoLote(sp.x);
      // O motivo da falha fica no status só até o próximo redesenho - guarda pra
      // quem chamou mostrar no fim (sem isso o jogador só via "faltou build").
      var elMotivo = document.getElementById(statusElId);
      if (resultado[sp.sname] === false && elMotivo && elMotivo.textContent) resultado.ultimoMotivo = elMotivo.textContent;
    }
    return resultado;
  }

  // Modos (opts.modo): normal (botão "Gerar com IA": sempre uma build NOVA, nunca
  // uma do banco - é o que o jogador pediu); "revisao" (a criatura acabou de
  // evoluir; opts.anterior = build da forma anterior, a nova substitui a ativa);
  // "ponte" (opts.alvo = build curada com golpe ainda travado; a IA escolhe os
  // golpes de agora e o plano leva até a curada). Devolve true se salvou.
  async function generateBuildWithAI(sp, statusElId, opts) {
    try {
      opts = opts || {};
      var statusEl = document.getElementById(statusElId || "mybuild-ai-status");
      // Procura o elemento a cada aviso: no "Montar time contra este chefão" o
      // cartão é redesenhado a cada build, e o elemento do início sai da tela.
      var aviso = function (texto) {
        var el = document.getElementById(statusElId || "mybuild-ai-status") || statusEl;
        if (el) el.textContent = texto;
      };
      aviso("Consultando o Claude…");
      var cap = getCurrentCap();
      // Uma nova tentativa automática, já dizendo à IA por que a primeira foi
      // rejeitada (item U3 da pauta técnica, 2026-09-16) - antes o trabalho de
      // "tente de novo" ficava com o jogador. Só UMA: cada chamada custa, e se a
      // segunda também falha o problema provavelmente não é azar.
      var resp = await pedirIA({
        prompt: montarPromptBuild(sp, opts),
        ferramentas: false, // contexto já vai no prompt (blocoContextoIA): uma chamada só
        validar: function (bruto) {
          var m = {};
          var v = validateAiBuild(sp, bruto, m, contextoDeValidacao(sp, opts));
          // Motivo técnico vai pro modelo na nova tentativa; o jogador vê a
          // versão dele (os dois textos de antes da fase 4).
          return v ? { valor: v } : {
            motivo: m.txt || "a build citou habilidade, golpe, natureza ou formato fora do permitido para esta espécie.",
            motivoParaJogador: m.txt || "A resposta não bateu com os dados reais deste Pokémon."
          };
        },
        retentativa: function (motivo) {
          return "\n\nSUA RESPOSTA ANTERIOR FOI REJEITADA pela validacao automatica. Motivo: " + motivo + " Corrija isso e responda de novo, no mesmo formato JSON.";
        },
        aviso: aviso
      });
      if (!resp.ok) {
        aviso(resp.rejeitada ? resp.mensagem + " (já tentei 2 vezes)" : resp.mensagem);
        return false;
      }
      aviso(""); // o relógio "Consultando o Claude… N s" não fica na tela depois de salvar
      return gravarBuildValidadaDaIa(sp, resp.valor, resp.bruto, opts, cap, aviso);
    } catch (e) {
      // Erro no app (não da IA - esses o pedirIA já trata) ao aplicar a resposta.
      if (typeof console !== "undefined") console.error(e);
      var elErro = document.getElementById(statusElId || "mybuild-ai-status");
      if (elErro) elErro.textContent = "Não consegui aplicar a resposta da IA - tente de novo.";
      return false;
    }
  }

  // Plano pra uma build que o jogador montou à mão: a IA não mexe em nada da
  // build, só aponta, slot a slot, o golpe futuro que entra quando liberar.
  // Chamada curta, sem ferramentas. Devolve true se o plano foi gravado.
  async function gerarPlanoParaBuild(sp, entry) {
    try {
      var cap = getCurrentCap();
      var prompt = montarPromptPlano(sp, entry, cap);
      if (!prompt) return false;
      var movesPerguntados = entry.moves.join("|");
      // Pedido curto: 1 tentativa, sem ferramentas. Plano inválido não é erro -
      // validarPlano tira o passo que não vale e o resto fica.
      var resp = await pedirIA({ prompt: prompt, tentativas: 1, ferramentas: false });
      if (!resp.ok) return false;
      var r = validarPlano(sp, entry.moves, resp.bruto && resp.bruto.plano, cap);
      var alvo = getBuildList(sp.sname).indexOf(entry) !== -1 ? entry : null;
      if (!alvo || alvo.moves.join("|") !== movesPerguntados) return "obsoleta"; // a build mudou enquanto a IA respondia
      acao(telasDeBuild(sp.sname).concat(["log"]), function () {
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
    } catch (e) {
      // Erro no app (não da IA - esses o pedirIA já trata) ao aplicar a resposta.
      if (typeof console !== "undefined") console.error(e);
      return false;
    }
  }
