  // ===== src/ui/revisao_automatica.js =====
  // Revisão automática das builds do time (evolução, plano, golpe-ponte) e as trocas do plano ao mudar o cap.
  // Interface: lê e desenha a página. Colado no <script> principal por
  // scripts/build.mjs (marcador @ui revisao_automatica.js) no MESMO lugar de onde saiu do
  // template (fase 5 da refatoração, 2026-09-24) - a ordem de execução não mudou.

  // ---------------- revisão automática de builds (sem clique) ----------------
  // Pedido do usuário (2026-09-24): a build acompanha o Pokémon sozinha - no
  // cap (plano, sem IA), na evolução e na curada com golpe ainda travado (com
  // IA, uma vez). Regras de custo: só membros do TIME, uma chamada por vez, no
  // máximo REVISOES_POR_ABERTURA por abertura da página, 2 tentativas por build,
  // e só roda sozinha se a IA já estiver liberada pelo jogador (nunca abre o
  // pedido de consentimento sem ele ter clicado em nada). Antes da IA, a curada
  // da forma nova no estilo do time resolve de graça.
  var REVISOES_POR_ABERTURA = 3;
  var revisoesFeitas = 0, revisandoAgora = null, revisaoRodando = false;
  var revisaoFalhouNestaAbertura = {};
  // Falhas da build-ponte por espécie: não há build salva onde anotar a
  // tentativa, então ficam no próprio aparelho (conveniência local - no pior
  // caso, cada aparelho tenta 2 vezes).
  var PONTE_FALHAS_KEY = "er_terminal_ponte_falhas";
  function ponteFalhas() { try { return JSON.parse(lsGet(PONTE_FALHAS_KEY) || "{}") || {}; } catch (e) { return {}; } }
  function registrarFalhaPonte(sname) { var f = ponteFalhas(); f[sname] = (f[sname] || 0) + 1; lsSet(PONTE_FALHAS_KEY, JSON.stringify(f)); return f[sname]; }
  function tarefaDeRevisao(sp) {
    if (revisaoFalhouNestaAbertura[sp.sname]) return null;
    var ativa = getActiveBuild(sp.sname);
    if (ativa && ativa.revisar && (ativa.tentativasRevisao || 0) < 2) return { sp: sp, tipo: ativa.revisar, entry: ativa };
    if (!ativa) {
      // Mega que herda a build da base (RN21) não precisa de build própria.
      if (isMegaForm(sp)) {
        var base = getSpeciesByX(MEGA_BASE_BY_X[sp.x]);
        if (base && getActiveBuild(base.sname)) return null;
      }
      if ((ponteFalhas()[sp.sname] || 0) >= 2) return null;
      var cur = curadaParaEstilo(sp.sname, estiloDoRitmo(state.archetype.pace), false);
      if (cur && golpesTravadosNoCap(sp, cur.moves).some(function (g) { return g.nivel !== null; })) {
        return { sp: sp, tipo: "ponte", alvo: cur };
      }
    }
    return null;
  }
  // A revisão automática já está gerando a build desta espécie agora?
  function revisaoEmAndamento(sname) { return revisandoAgora === sname; }
  function revisaoStatusHtml(sname) {
    if (revisandoAgora === sname) return ' <span class="mega-lock-tag" role="status">atualizando…</span>';
    var ativa = getActiveBuild(sname);
    // Evoluiu (2026-09-27, decisão do usuário: "botão no card"): a build ainda é
    // a da forma anterior. Um clique gera a nova agora - o clique também libera
    // a IA; sem ele, a nova sai sozinha quando a IA já estiver liberada.
    if (ativa && ativa.revisar === "evolucao") {
      var sp = getSpeciesBySname(sname);
      return ' <button type="button" class="ts-evo-gerar" data-x="' + (sp ? sp.x : "") + '" title="Esta build ainda é a de ' +
        escapeHtml(ativa.revisadaDe || "antes de evoluir") + '. Gera uma build nova pra forma atual; a antiga fica salva na ficha.">Gerar build nova (evoluiu)</button>' +
        '<span id="ts-evo-status-' + (sp ? sp.x : "") + '" class="notes-status" role="status" aria-live="polite"></span>';
    }
    if (ativa && ativa.revisar && (ativa.tentativasRevisao || 0) < 2) {
      return ' <span class="mega-lock-tag" title="O app revisa esta build sozinho com IA assim que a IA estiver liberada nesta página.">revisão pendente</span>';
    }
    return "";
  }
  async function iaLiberadaSemPerguntar() {
    if (typeof claude === "undefined" || !claude.use) return false;
    try {
      var perm = await claude.use("permissions");
      return !!perm && (await perm.state("sample")) === "granted";
    } catch (e) { return false; }
  }
  // Só a suíte de testes desliga (window.__erTest.desligarRevisaoAutomatica):
  // lá o estado é montado à mão e uma rodada em segundo plano mexeria nele no
  // meio de outra verificação. Os testes da fila chamam as funções direto.
  var revisaoAutomaticaDesligada = false;
  async function processarRevisoes() {
    if (revisaoRodando || revisaoAutomaticaDesligada) return;
    revisaoRodando = true;
    try {
      while (revisoesFeitas < REVISOES_POR_ABERTURA) {
        var tarefa = null;
        var membros = state.team.map(getSpeciesByX).filter(Boolean);
        for (var i = 0; i < membros.length && !tarefa; i++) tarefa = tarefaDeRevisao(membros[i]);
        if (!tarefa) break;
        var sp = tarefa.sp;
        // Evolução com curada da forma nova no estilo do time: sem IA.
        if (tarefa.tipo === "evolucao") {
          var cur = curadaParaEstilo(sp.sname, estiloDoRitmo(state.archetype.pace), true);
          if (cur && !golpesTravadosNoCap(sp, cur.moves).some(function (g) { return g.nivel !== null; })) {
            var curEntrada = { ability: cur.ability, nature: cur.nature, item: cur.item, moves: cur.moves.slice(), planoConsultado: true,
              ivs: [31, 31, 31, 31, 31, 31], evs: evsTextoParaArray(cur.evs), rationale: "Build curada de " + sp.n + " (" + (cur.fonte || "curadoria") + ")." };
            if (cur.plano) curEntrada.plano = cur.plano;
            acao(telasDeBuild(sp.sname).concat(["log"]), function () {
              // Mesma regra da build nova por IA (2026-09-27): a de antes fica de
              // reserva, marcada "Antes de evoluir".
              var deNome = tarefa.entry.revisadaDe || "forma anterior";
              var saiu = abrirVagaPreservando(sp.sname, tarefa.entry);
              if (!addBuildVariant(sp.sname, curEntrada, "curada")) setOrReplaceActiveBuild(sp.sname, curEntrada, "curada");
              delete tarefa.entry.revisar; delete tarefa.entry.revisadaDe; delete tarefa.entry.tentativasRevisao;
              tarefa.entry.antesDeEvoluir = deNome;
              logAutoAction("Build de " + sp.n + " trocada pela curada depois da evolução. A de antes (" + (tarefa.entry.ability || "?") + "; " + tarefa.entry.moves.join(", ") +
                ") ficou salva no chip \"Antes de evoluir\" da ficha." + (saiu ? " Pra caber, saiu a variante mais antiga." : ""));
            });
            continue;
          }
        }
        // Plano pedido quando já não há golpe por liberar (o cap passou de tudo):
        // não há o que perguntar - sai da fila sem gastar vaga nem tentativa.
        if (tarefa.tipo === "plano" && !golpesFuturosDe(sp, getCurrentCap()).length) {
          acao(["time"], function () { delete tarefa.entry.revisar; delete tarefa.entry.tentativasRevisao; });
          continue;
        }
        if (!(await iaLiberadaSemPerguntar())) break;
        revisandoAgora = sp.sname;
        TELAS.time(); // etiqueta "atualizando…" no card (estado de tela, não do save)
        var ok = false;
        try {
          if (tarefa.tipo === "plano") ok = await gerarPlanoParaBuild(sp, tarefa.entry);
          else if (tarefa.tipo === "evolucao") ok = await generateBuildWithAI(sp, "sem-status", { modo: "revisao", anterior: tarefa.entry, deNome: tarefa.entry.revisadaDe, silencioso: true });
          else ok = await generateBuildWithAI(sp, "sem-status", { modo: "ponte", alvo: tarefa.alvo, silencioso: true });
        } catch (e) {
          ok = false; // conta como tentativa (teto de 2) - nunca repete a chamada paga sem limite
        }
        revisoesFeitas++;
        revisandoAgora = null;
        if (ok === "obsoleta") {
          // O mundo mudou enquanto a IA respondia: a resposta foi descartada e a
          // próxima rodada decide de novo a partir do estado atual.
        } else if (!ok) {
          revisaoFalhouNestaAbertura[sp.sname] = true;
          if (tarefa.tipo === "ponte") {
            if (registrarFalhaPonte(sp.sname) >= 2) logAutoAction("Não consegui adaptar a build curada de " + sp.n + " ao level cap com IA (2 tentativas). Ela continua aparecendo como está.");
          } else if (tarefa.entry && getBuildList(sp.sname).indexOf(tarefa.entry) !== -1) {
            acao(["time", "log"], function () {
              tarefa.entry.tentativasRevisao = (tarefa.entry.tentativasRevisao || 0) + 1;
              if (tarefa.entry.tentativasRevisao >= 2) logAutoAction("Não consegui revisar a build de " + sp.n + " com IA (2 tentativas). Ela continua valendo como está.");
            });
          }
        }
        TELAS.time(); // tira a etiqueta "atualizando…"
      }
    } finally {
      revisaoRodando = false;
      revisandoAgora = null;
    }
  }
  // Disparo: ao abrir (depois da primeira pintura) e sempre que o time ou o
  // cap mudam - com um respiro pra juntar mudanças seguidas numa rodada só.
  // Troca de golpe pelo plano quando o cap muda: nada é regravado (os golpes
  // são derivados em effectiveBuild), mas o jogador vê no registro "O que o app
  // fez sozinho" o que entrou - ou voltou, se o cap desceu. Só membros do time.
  var capRegistrado = getCurrentCap();
  function registrarTrocasDoPlano(capAntes, capDepois) {
    if (capAntes === capDepois) return false;
    var houve = false;
    state.team.map(getSpeciesByX).filter(Boolean).forEach(function (sp) {
      var b = getActiveBuild(sp.sname);
      if (!b || !b.plano) return;
      var t = trocasEntreCaps(sp, b.moves, b.plano, capAntes, capDepois);
      if (t.entraram.length) {
        houve = true;
        logAutoAction("Build de " + sp.n + " (level cap " + capDepois + "): " + t.entraram.map(function (x) { return x.para + " entrou no lugar de " + x.de; }).join(", ") + ".");
      }
      if (t.voltaram.length) {
        houve = true;
        logAutoAction("Build de " + sp.n + " (level cap " + capDepois + "): " + t.voltaram.map(function (x) { return x.de + " voltou (" + x.para + " só no nível " + x.nivel + ")"; }).join(", ") + ".");
      }
    });
    if (houve) renderAutoLog();
    return houve;
  }
  var timerRevisoes = null;
  function agendarRevisoes() {
    clearTimeout(timerRevisoes);
    timerRevisoes = setTimeout(processarRevisoes, 1500);
  }
  agendarRevisoes();

  // Sets de "Estratégias" ficam em state.strategySets (vão pro save desde
  // 2026-09-24) - { [sname]: { sets: [...], cap, dataVersion, geradoEm } }.
  // "Estratégias" - até 3 sets nomeados e distintos por espécie, cada um
  // com o mesmo formato e a MESMA validação (validateAiBuild) de "Gerar
  // build com IA", só que em lote. Pedido do usuário citando o dex do
  // Smogon como referência de conteúdo (2026-09-18) - lá cada espécie tem
  // vários sets nomeados ("Aurora Veil", "Choice Scarf"...) com análise.
  async function generateStrategySets(sp, statusElId) {
    try {
      var statusEl = document.getElementById(statusElId || "strategy-sets-status");
      var aviso = function (texto) { if (statusEl) statusEl.textContent = texto; };
      aviso("Consultando o Claude…");
      var cap = getCurrentCap();
      // Mesmo espírito do retry único da build - só que aqui o critério pra
      // tentar de novo é "nenhum set aproveitável", não "algum set com defeito"
      // (um set ruim entre 2 bons não derruba os outros 2).
      var resp = await pedirIA({
        prompt: montarPromptEstrategias(sp),
        ferramentas: false, // contexto já vai no prompt (blocoContextoIA)
        validar: function (bruto) {
          var sets = setsValidosDaResposta(sp, bruto);
          return sets.length ? { valor: sets } : { motivo: "Não consegui montar nenhum set válido dessa vez (já tentei 2 vezes) - tente de novo." };
        },
        retentativa: function () {
          return "\n\nSUA RESPOSTA ANTERIOR NAO TROUXE NENHUM SET VALIDO (golpe/habilidade/natureza fora do que foi listado). Tente de novo, com mais cuidado.";
        },
        aviso: aviso
      });
      if (!resp.ok) { aviso(resp.mensagem); return false; }
      // Grava (a próxima visita mostra estes sets sem nova chamada) e redesenha a
      // ficha só se ela ainda for desta espécie.
      acao(["ficha:" + sp.sname], function () {
        state.strategySets[sp.sname] = {
          sets: resp.valor, cap: cap, dataVersion: DATA.meta ? DATA.meta.version : null, geradoEm: new Date().toISOString()
        };
        state.strategySets = sanitizarStrategySets(state.strategySets); // teto: a mais antiga sai
      });
      aviso("");
      return true;
    } catch (e) {
      // Erro no app (não da IA - esses o pedirIA já trata) ao aplicar a resposta.
      if (typeof console !== "undefined") console.error(e);
      var elErro = document.getElementById(statusElId || "strategy-sets-status");
      if (elErro) elErro.textContent = "Não consegui aplicar a resposta da IA - tente de novo.";
      return false;
    }
  }
