  // Lote 5 das pesquisas de 06/10 (ideias do GPT, seções 3.2/17/26/42): Avisos de build e selo de
  // origem. Nada aqui cria regra nova - cada aviso lê a conta que já existe (golpesTravadosNoCap,
  // megaFormLiberada/etapaDaMega, precisaDeSetter + garantiaDaCondicao, moveRoleOf) e junta tudo
  // num bloco só, pra o jogador ver de uma vez por que a build não serve neste ponto da run.

  // Build que não serve AGORA. Devolve [{ tipo, texto }]; vazio = serve. Só estado já conhecido
  // (level cap, insígnia, time, clima do time) - ninguém precisa responder nada.
  function avisosDaBuild(sp, build) {
    var out = [];
    if (!sp || !build || !Array.isArray(build.moves)) return out;
    // 1. Golpe só depois do level cap. Golpe que a forma não aprende (nivel null) fica com o reconciliarBuild.
    var cap = getCurrentCap();
    var acima = golpesTravadosNoCap(sp, build.moves).filter(function (g) { return g.nivel !== null; });
    if (acima.length) out.push({ tipo: "golpe-cap", texto: "Golpe só depois do seu level cap (" + cap + "): " +
      acima.map(function (g) { return g.nome + " (nível " + g.nivel + ")"; }).join(", ") + "." });
    // 2. Mega antes da hora: a forma (pedra tardia incluída) ou a pedra segurada ainda não existe pro jogador.
    if (isMegaForm(sp) && !megaFormLiberada(sp)) {
      out.push({ tipo: "mega", texto: "Esta Mega " + quandoMega(sp) + "; até lá a criatura luta como a forma base." });
    } else if (build.item && MEGA_FORMS[build.item] !== undefined) {
      if (!liberadoNaRun(state.settings.milestone, cap, { pedra: build.item })) {
        var etapa = etapaDaPedra(build.item);
        out.push({ tipo: "item-tardio", texto: build.item + " só sai a partir da " + (ROTULO_ETAPA_MEGA[etapa] || "etapa " + etapa) + "." });
      }
    } else if (build.item) {
      // Qualquer outro item (ticket 07): a etapa mais cedo em que o código do jogo o entrega. Sem local
      // conhecido na run (só Battle Frontier, Pickup, troca...) não avisa: o dado não basta para afirmar.
      var achar = primeiroLugarDoItem(build.item);
      if (achar && !liberadoNaRun(state.settings.milestone, cap, { item: build.item })) {
        out.push({ tipo: "item-tardio", texto: build.item + " só aparece a partir da " + rotuloDaEtapaDoItem(achar.etapa) + " (" + achar.local + ", " + achar.como + ")." });
      }
    }
    // 2b. Golpe-ponte (curada aplicada ao time; decisão do usuário, 08/10, "só o pedido"): o item vem da
    // curada sem passar pela validação da IA, então avisa só Choice com golpe de status e o item repetido
    // além do limite do time. Outras builds não recebem esses avisos.
    var itemAv = build.ponte ? stripNote(build.item || "") : "";
    if (itemAv) {
      var conflito = ITENS_CHOICE.indexOf(itemAv) !== -1 ? conflitoDeItem(itemAv, build.moves, sp) : null;
      if (conflito) out.push({ tipo: "item-conflito", texto: conflito.replace(/ Tente gerar de novo.$/, "") });
      var stoneAv = megaStoneRuleFor(sp);
      if (!stoneAv && state.team.indexOf(sp.x) !== -1) {
        var comItem = itensEmUsoComQuem(sp.x)[itemAv] || [];
        if (comItem.length >= MAX_MESMO_ITEM_NO_TIME) {
          out.push({ tipo: "item-repetido", texto: itemAv + " já está com " + comItem.join(" e ") + " - no time vale no máximo " + MAX_MESMO_ITEM_NO_TIME + " com o mesmo item." });
        }
      }
    }
    // 3. Habilidade que depende de clima/terreno que nem a criatura, nem a build, nem o time arma.
    var ativas = nomesDeHabilidades(sp.inn).concat(build.ability ? [build.ability] : []);
    precisaDeSetter(sp, build.ability).forEach(function (m) {
      var coberta = m.condicao.split("|").some(function (c) { return garantiaDaCondicao(sp, c, build, ativas); });
      if (!coberta) out.push({ tipo: "setter", texto: m.habilidades.join(", ") + " só funciona com " + m.nome + ", e nada neste time arma isso." });
    });
    // 4. Build de dupla numa luta 1x1 (o app trata todas as lutas como 1x1).
    var dupla = build.moves.filter(function (m) { return moveRoleOf(m) === "dupla"; });
    if (build.formato === "dupla") out.push({ tipo: "dupla", texto: "A fonte descreve esta build como pensada pra batalha dupla; as lutas aqui são 1x1." });
    if (dupla.length) out.push({ tipo: "dupla", texto: "Só funciona em batalha dupla: " + dupla.join(", ") + "." });
    return out;
  }

  // Selo de origem/confiança. Não mexe em nota nenhuma: só diz de onde a build veio.
  //   confirmado = está no código do jogo ou foi conferida pelo projeto contra os dados do jogo;
  //   consenso   = post da comunidade validado contra os dados (um autor, mas revisado pelos dados);
  //   relato     = gerada por IA ou fonte da comunidade sem checagem própria.
  // "Meu build", build herdada da base e formato Showdown não têm selo (não é fonte externa).
  var SELOS_POR_FONTE = {
    "dex-strategy-do-jogo": { nivel: "confirmado", rotulo: "oficial do jogo" },
    "curadoria-do-projeto": { nivel: "confirmado", rotulo: "curadoria do projeto" },
    "discord-build-workshop-2.65": { nivel: "consenso", rotulo: "Discord Build Workshop" },
    "discord-movesets": { nivel: "relato", rotulo: "Discord" },
    // Decisão do usuário (08/10): build da IA promovida pelo playtester é consenso.
    "ia-curada-playtester": { nivel: "consenso", rotulo: "IA curada pelo playtester" },
    // Ticket 08: vídeo do canal MegaFidough - só o que o vídeo diz; natureza/EVs do padrão do app.
    "video-megafidough": { nivel: "relato", rotulo: "vídeo MegaFidough" }
  };
  var SELO_SIMBOLO = { confirmado: "✔", consenso: "≈", relato: "?" };
  var SELO_NOME = { confirmado: "Confirmado", consenso: "Consenso", relato: "Relato" };
  var SELO_EXPLICA = {
    confirmado: "Vem do código do jogo ou foi conferida pelo projeto contra os dados reais do jogo.",
    consenso: "Post da comunidade; habilidade, golpes e forma foram conferidos contra os dados do jogo, mas a build é a escolha de um autor.",
    relato: "Sem checagem própria: gerada por IA ou relato da comunidade."
  };
  function seloDaBuild(build) {
    if (!build) return null;
    var s = null;
    if (build.origem === "ia") s = { nivel: "relato", rotulo: "gerada por IA" };
    else if (build.origem === "manual" || build.origem === "base") return null;
    else if (build.fonte) s = SELOS_POR_FONTE[build.fonte] || { nivel: "relato", rotulo: "fonte " + build.fonte };
    if (!s) return null;
    return { nivel: s.nivel, rotulo: s.rotulo, simbolo: SELO_SIMBOLO[s.nivel], nome: SELO_NOME[s.nivel], explica: SELO_EXPLICA[s.nivel] };
  }

  // Onde achar um item na run (ticket 07; data/onde_achar_itens.json, gerado do código oficial do jogo).
  // primeiroLugarDoItem: o lugar de etapa mais cedo (ignora os sem etapa); null = sem lugar com etapa.
  function primeiroLugarDoItem(nome) {
    var lista = (typeof ONDE_ACHAR_ITENS !== "undefined" && ONDE_ACHAR_ITENS[nome]) || [];
    return lista.filter(function (x) { return x.etapa !== null; })[0] || null;
  }
  function rotuloDaEtapaDoItem(e) { return e === 0 ? "saída (antes da 1ª insígnia)" : e + "ª insígnia"; }
  // Texto curto para a descrição do item na build: até 2 lugares, do mais cedo ao mais tarde.
  function ondeAcharItemTexto(nome) {
    var lista = ((typeof ONDE_ACHAR_ITENS !== "undefined" && ONDE_ACHAR_ITENS[nome]) || []).slice(0, 2);
    if (!lista.length) return "";
    return lista.map(function (x) { return x.local + " (" + x.como + (x.etapa === null ? ", fora da run" : ", a partir da " + rotuloDaEtapaDoItem(x.etapa)) + ")"; }).join("; ");
  }
