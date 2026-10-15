  // ===== src/ui/ia.js =====
  // IA: cliente único pedirIA e os geradores de build/Estratégias (o pedido e o status na tela).
  // Interface: lê e desenha a página. Colado no <script> principal por
  // scripts/build.mjs (marcador @ui ia.js) no MESMO lugar de onde saiu do
  // template (fase 5 da refatoração, 2026-09-24) - a ordem de execução não mudou.

  // ---------------- AI tools & build generation ----------------


  // As ferramentas que o modelo consulta (aiTool_*, buildStandardAiTools) moram em
  // src/regras/ferramentas_ia.js, e o caminho "resposta da IA -> build validada -> o que
  // gravar" em src/regras/gravacao_build_ia.js (ticket 06 da dívida técnica, 2026-10-08).
  // Aqui ficam o pedido ao modelo e o status na tela.

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
  // O Artifact não pode receber a chave do OmniRoute nem presumir acesso ao
  // localhost do aparelho. Um host de desenvolvimento pode injetar este bridge
  // sem segredo no HTML; ele deve expor apenas json(prompt, opcoes) e o modelo
  // explícito. Sem bridge, o caminho oficial `sample` continua sendo usado.
  var MODELO_OMNIROUTE_BUILD = "antigravity/gemini-3.1-pro-high";
  function bridgeOmniRouteParaBuild() {
    if (typeof window === "undefined") return null;
    var bridge = window.__ER_OMNIROUTE_BRIDGE__;
    if (!bridge || bridge.modelo !== MODELO_OMNIROUTE_BUILD || typeof bridge.json !== "function") return null;
    return bridge;
  }
  // O bridge é lido UMA vez por pedido (revisão de segurança, 13/10): reler a cada passo deixaria um getter
  // malicioso mudar de resposta no meio do pedido.
  function clienteDeIA(bridge, sample) {
    return bridge ? { cliente: bridge, nome: "OmniRoute/" + MODELO_OMNIROUTE_BUILD } : { cliente: sample, nome: "Claude" };
  }
  // As ferramentas do app (que leem o estado) só vão ao cliente oficial; o bridge recebe só o prompt.
  function opcoesDaIA(o, cliente, sample) {
    return o.ferramentas === false || cliente !== sample ? undefined : { tools: buildStandardAiTools() };
  }
  async function obterClienteSample() {
    if (typeof claude === "undefined" || !claude.use) return null;
    return await claude.use("sample");
  }
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
  async function chamarModelo(cliente, prompt, opts, o, rotulo) {
    var aviso = o.aviso || function () {};
    var pausas = o.pausasMs || PAUSAS_IA_MS;
    for (var i = 0; ; i++) {
      var inicio = Date.now();
      var base = i === 0 ? rotulo : rotulo.replace(/(…|\.\.\.)$/, "") + " - tentativa " + (i + 1) + " de " + (pausas.length + 1) + "…";
      aviso(base);
      var relogio = setInterval(function () { aviso(base + " " + Math.round((Date.now() - inicio) / 1000) + " s"); }, 1000);
      try {
        return await comTempoLimite(cliente.json(prompt, opts));
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
    var bridge = o && o.provedor === "omniroute" ? bridgeOmniRouteParaBuild() : null;
    var sample = null;
    if (!bridge && (typeof claude === "undefined" || !claude.use)) return { ok: false, mensagem: oQue + " por IA não disponível neste ambiente." };
    if (!bridge) sample = await obterClienteSample();
    if (!bridge && !sample) return { ok: false, mensagem: oQue + " por IA não disponível (recurso não concedido)." };
    var escolha = clienteDeIA(bridge, sample);
    var cliente = escolha.cliente;
    var tentativas = o.tentativas || 2;
    var prompt = o.prompt;
    var ultimo = null;
    try {
      for (var t = 1; t <= tentativas; t++) {
        var bruto;
        try {
          bruto = await chamarModelo(cliente, prompt, opcoesDaIA(o, cliente, sample), o,
            t === 1 ? "Consultando " + escolha.nome + "…" : "A primeira sugestão não passou na validação - pedindo outra…");
        } catch (e) {
          // O bridge alternativo é opcional: se cair, a chamada oficial assume
          // o pedido inteiro, preservando a validação e a fila existentes.
          if (cliente !== sample && o.fallback !== false) {
            if (!sample) sample = await obterClienteSample();
            if (!sample) throw e;
            cliente = sample;
            escolha = { cliente: sample, nome: "Claude" };
            bruto = await chamarModelo(cliente, prompt, opcoesDaIA(o, cliente, sample), o,
              "OmniRoute indisponível - consultando o Claude…");
          } else throw e;
        }
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

  // Depois de validada: a regra (gravarRespostaValidadaDaIa) confere se a resposta ainda vale, ajusta,
  // anexa o plano e grava; a tela só entrega como agir (uma ação: gravar, limpar a marca de revisão,
  // registrar no log - um redesenho no fim: card do time, ficha aberta desta espécie, confronto),
  // o status e o aviso rápido. Serve também ao lote de builds do time. Devolve true, false ou "obsoleta".
  function gravarBuildValidadaDaIa(sp, validated, raw, opts, cap, aviso) {
    return gravarRespostaValidadaDaIa(sp, validated, raw, opts, cap, {
      agir: function (mudar) { return acao(telasDeBuild(sp.sname).concat(["log"]), mudar); },
      aviso: aviso,
      toast: flashToast
    });
  }

  // Curada no lugar da IA no time novo (2026-09-30, decisão do usuário: "só quando
  // não houver Clima/Tática"). Entra se: há curada do estilo do time, todos os
  // golpes dela já estão liberados no level cap, o item não passa de 2 no time e há
  // vaga sem tirar build feita à mão. Devolve true se aplicou (sem chamada de IA).
  function aplicarCuradaNoTimeNovo(sp, pace) {
    var cur = curadaParaEstilo(sp.sname, estiloDoRitmo(pace), true);
    var entrada = entradaDaCuradaParaTimeNovo(sp, cur);
    if (!entrada) return false;
    var lista = getBuildList(sp.sname);
    if (lista.length >= 3 && lista.every(function (b) { return b.source === "manual"; })) return false;
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
    // Mega ainda travada na Etapa: não gera (decisão do usuário, 08/10); quem chamou vê o motivo.
    members = members.filter(function (sp) {
      var motivo = motivoDeNaoGerarBuild(sp);
      if (!motivo) return true;
      resultado[sp.sname] = false;
      resultado.ultimoMotivo = motivo;
      concluirBuildDoLote(sp.x);
      return false;
    });
    var faltam = [];
    var falhouNaEscolha = [];
    // A IA escolhe entre os candidatos do pipeline (ticket 03): quem tem candidato vai numa consulta só, bem menor; quem não tem
    // (sem alvo adiante, sem candidato) segue o caminho antigo logo abaixo. Escolha inválida cai no melhor do motor, sem outra chamada.
    var comCand = [];
    var semCand = [];
    members.forEach(function (sp) {
      var r = candidatosParaAEscolhaDaIa(sp, optsDe(sp));
      if (r) comCand.push({ sp: sp, r: r }); else semCand.push(sp);
    });
    if (comCand.length) {
      progresso("Escolhendo as " + comCand.length + " builds entre os candidatos do jogo…");
      var respC = await pedirIA({
        prompt: montarPromptEscolhaDoTime(comCand, optsLote),
        ferramentas: false,
        provedor: "omniroute",
        tentativas: 1,
        oQue: "Builds do time",
        aviso: aviso,
        validar: validarRespostaDoLoteDeBuilds
      });
      aviso("");
      comCand.forEach(function (it) {
        var sp = it.sp;
        var esc = respC.ok ? escolherCandidatoDaIa(sp, it.r, respC.valor[sp.sname] || respC.valor[sp.n], optsDe(sp)) : { build: null };
        var r = esc.build ? gravarBuildValidadaDaIa(sp, esc.build, null, Object.assign({}, optsDe(sp), { semPlano: true }), cap, aviso) : false;
        if (r === false) falhouNaEscolha.push(sp); // pedido sozinho, pelo caminho individual
        else { resultado[sp.sname] = r; concluirBuildDoLote(sp.x); }
      });
    }
    // O caminho antigo (uma consulta do zero) só para quem não tem candidato.
    faltam = semCand.slice();
    if (semCand.length > 1) {
      progresso("Gerando as " + semCand.length + " builds numa consulta só…");
      var resp = await pedirIA({
        prompt: montarPromptBuildsDoTime(semCand, optsLote),
        ferramentas: false,
        provedor: "omniroute",
        tentativas: 1, // quem falhar vai pelo caminho individual (com a nova tentativa dele)
        oQue: "Builds do time",
        aviso: aviso,
        validar: validarRespostaDoLoteDeBuilds
      });
      aviso("");
      if (resp.ok) {
        faltam = [];
        semCand.forEach(function (sp) {
          var daIa = buildDoLoteDeBuilds(sp, resp.valor, optsDe(sp));
          var r = daIa.validada ? gravarBuildValidadaDaIa(sp, daIa.validada, daIa.bruto, optsDe(sp), cap, aviso) : false;
          // Só sai do lote quem ganhou build: quem vai ser pedido de novo continua
          // fora da conta de itens em uso (a build velha dele ainda vai sair).
          if (r === false) faltam.push(sp); else { resultado[sp.sname] = r; concluirBuildDoLote(sp.x); }
        });
      }
    }
    faltam = faltam.concat(falhouNaEscolha);
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
      var travada = motivoDeNaoGerarBuild(sp);
      if (travada) { aviso(travada); return false; }
      var cap = getCurrentCap();
      // A IA escolhe ENTRE os candidatos do pipeline (ticket 03): prompt menor, e a resposta fora dos candidatos
      // cai no melhor do motor sem outra chamada. Sem alvo/candidato (ou nos modos revisão/ponte) segue o caminho antigo.
      var cands = candidatosParaAEscolhaDaIa(sp, opts);
      if (cands) {
        aviso("Consultando o Claude…");
        var optsEscolha = Object.assign({}, opts, { semPlano: true });
        var respE = await pedirIA({
          prompt: montarPromptEscolhaDeBuild(sp, cands, opts),
          provedor: "omniroute",
          ferramentas: false,
          tentativas: 1, // a escolha inválida não gasta outra chamada: o motor decide
          oQue: "Build",
          aviso: aviso,
          validar: function (bruto) { return { valor: escolherCandidatoDaIa(sp, cands, bruto, opts) }; }
        });
        if (!respE.ok) { aviso(respE.mensagem); return false; }
        if (respE.valor.build) {
          aviso("");
          return gravarBuildValidadaDaIa(sp, respE.valor.build, null, optsEscolha, cap, aviso);
        }
        // Nenhum candidato passou na validação (ex.: a do chefão): caminho antigo.
      }
      aviso("Consultando o Claude…");
      // Uma nova tentativa automática, já dizendo à IA por que a primeira foi
      // rejeitada (item U3 da pauta técnica, 2026-09-16) - antes o trabalho de
      // "tente de novo" ficava com o jogador. Só UMA: cada chamada custa, e se a
      // segunda também falha o problema provavelmente não é azar.
      var resp = await pedirIA({
        prompt: montarPromptBuild(sp, opts),
        provedor: "omniroute",
        ferramentas: false, // contexto já vai no prompt (blocoContextoIA): uma chamada só
        // Motivo técnico vai pro modelo na nova tentativa; o jogador vê a versão dele.
        validar: function (bruto) { return validarRespostaDeBuildDaIa(sp, bruto, opts); },
        retentativa: textoDaRetentativaDeBuild,
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
      // "obsoleta": a build mudou ou saiu da lista enquanto a IA respondia.
      return gravarPlanoDaIa(sp, entry, movesPerguntados, resp.bruto, cap, {
        agir: function (mudar) { return acao(telasDeBuild(sp.sname).concat(["log"]), mudar); }
      });
    } catch (e) {
      // Erro no app (não da IA - esses o pedirIA já trata) ao aplicar a resposta.
      if (typeof console !== "undefined") console.error(e);
      return false;
    }
  }
