  // ===== src/ui/revisao_automatica.js =====
  // Revisão automática das builds do time (evolução, com a curada da forma nova, sem IA) e as trocas do plano ao mudar o cap.
  // Interface: lê e desenha a página. Colado no <script> principal por
  // scripts/build.mjs (marcador @ui revisao_automatica.js) no MESMO lugar de onde saiu do
  // template (fase 5 da refatoração, 2026-09-24) - a ordem de execução não mudou.

  // ---------------- revisão automática de builds (sem clique) ----------------
  // Pedido do usuário (2026-09-24): a build acompanha o Pokémon sozinha - no cap (plano) e na evolução, com a curada da
  // forma nova no estilo do time. Só membros do TIME, uma por vez. O app não usa IA (decisão do usuário, 06/11/2026):
  // build que não tem curada para a forma nova fica como está, e o jogador gera outra no editor ou pelo Modo Motor.
  var revisaoRodando = false;
  var revisaoFalhouNestaAbertura = {};
  function tarefaDeRevisao(sp) {
    if (revisaoFalhouNestaAbertura[sp.sname]) return null;
    var ativa = getActiveBuild(sp.sname);
    if (ativa && ativa.revisar && (ativa.tentativasRevisao || 0) < 2) return { sp: sp, tipo: ativa.revisar, entry: ativa };
    return null;
  }
  // Só a suíte de testes desliga (window.__erTest.desligarRevisaoAutomatica):
  // lá o estado é montado à mão e uma rodada em segundo plano mexeria nele no
  // meio de outra verificação. Os testes da fila chamam as funções direto.
  var revisaoAutomaticaDesligada = false;
  async function processarRevisoes() {
    if (revisaoRodando || revisaoAutomaticaDesligada) return;
    revisaoRodando = true;
    try {
      while (true) {
        var tarefa = null;
        var membros = state.team.map(getSpeciesByX).filter(Boolean);
        for (var i = 0; i < membros.length && !tarefa; i++) tarefa = tarefaDeRevisao(membros[i]);
        if (!tarefa) break;
        var sp = tarefa.sp;
        // Evolução com curada da forma nova no estilo do time.
        if (tarefa.tipo === "evolucao") {
          var cur = curadaParaEstilo(sp.sname, estiloDoRitmo(state.archetype.pace), true);
          if (cur && !golpesTravadosNoCap(sp, cur.moves).some(function (g) { return g.nivel !== null; })) {
            var curEntrada = { ability: cur.ability, nature: cur.nature, item: cur.item, moves: cur.moves.slice(), planoConsultado: true,
              ivs: [31, 31, 31, 31, 31, 31], evs: evsTextoParaArray(cur.evs), rationale: "Build curada de " + sp.n + " (" + (cur.fonte || "curadoria") + ")." };
            if (cur.plano) curEntrada.plano = cur.plano;
            acao(telasDeBuild(sp.sname).concat(["log"]), function () {
              // A de antes fica de reserva, marcada "Antes de evoluir" (2026-09-27).
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
        // Plano pedido numa build salva antes de 06/11/2026: o app não pergunta mais a IA, então a marca sai da fila.
        if (tarefa.tipo === "plano") {
          acao(["time"], function () { delete tarefa.entry.revisar; delete tarefa.entry.tentativasRevisao; });
          continue;
        }
        // Sem curada para a forma nova (ou plano por pedir): o app não consulta IA, então a build fica como está.
        revisaoFalhouNestaAbertura[sp.sname] = true;
      }
    } finally {
      revisaoRodando = false;
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
