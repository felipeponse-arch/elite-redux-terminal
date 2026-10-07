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
      out.push({ tipo: "mega", texto: "Esta Mega só a partir da " + rotuloEtapaDaMega(sp) + "; até lá a criatura luta como a forma base." });
    } else if (build.item && MEGA_FORMS[build.item] !== undefined) {
      var etapa = MEGA_PEDRAS_TARDIAS[build.item] || MEGA_UNLOCK_MILESTONE;
      if (state.settings.milestone < etapa) {
        out.push({ tipo: "item-tardio", texto: build.item + " só sai a partir da " + (ROTULO_ETAPA_MEGA[etapa] || "etapa " + etapa) + "." });
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
    "discord-movesets": { nivel: "relato", rotulo: "Discord" }
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
