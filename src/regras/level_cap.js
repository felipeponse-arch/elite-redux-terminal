  // ===== src/regras/level_cap.js =====
  // Level cap atual e golpes liberados por ele.
  // Colado dentro do <script> principal do app por scripts/build.ps1 (marcador
  // @regras level_cap.js), no mesmo escopo do resto do código - sem module,
  // sem wrapper. Só lógica pura: nada aqui lê a página (item D1 da pauta
  // técnica, 2026-09-16), o que permite carregar este arquivo no Node pros
  // testes unitários (tests/unit/).

  // Level Cap e Dificuldade são opções SEPARADAS no setup do jogo (item U1
  // da pauta, 2026-09-16, conferido nas fotos da tela de setup e na página
  // oficial de level caps): Level Cap = Easy/More/Elite e define o nível
  // máximo; Dificuldade = Easy/Ace/Elite e define os times dos chefões. O
  // app usava a dificuldade pra escolher a coluna do cap - só batia por
  // coincidência na combinação Ace + More.
  var LEVEL_CAP_MODES = ["easy", "more", "elite"];
  function levelCapMode() {
    var m = state.settings.levelCapMode;
    return LEVEL_CAP_MODES.indexOf(m) !== -1 ? m : "more";
  }
  // Save antigo (sem levelCapMode): herda da dificuldade, que era o que o
  // app usava pro cap - o jogador continua vendo o mesmo cap de antes.
  function levelCapModeFromDifficulty(d) {
    return d === "easy" ? "easy" : d === "elite" ? "elite" : "more";
  }

  function getCurrentCap() {
    if (!LEVELCAPS || !LEVELCAPS.rows[state.settings.milestone]) return null;
    return LEVELCAPS.rows[state.settings.milestone][levelCapMode()];
  }

  // Golpes que o jogador pode usar AGORA (item D3 da pauta técnica,
  // 2026-09-16): nível até o level cap atual + todo golpe de tutor (tutor não
  // tem trava de nível no jogo). Sem cap (Campeão) libera tudo. Antes este
  // filtro estava copiado em 4 lugares - editor "Meu build", validação da
  // build por IA, golpes de prioridade e prompt da IA - e já tinha divergido
  // uma vez (2026-09-12: a validação ficou sem o filtro que o editor tinha).
  function availableMovesFor(sp) {
    var cap = getCurrentCap();
    var semCap = cap === null || cap === undefined;
    var allowedLm = sp.lm.filter(function (pair) { return semCap || pair[0] <= cap; });
    var ids = uniqueIds(allowedLm.map(function (pair) { return pair[1]; }).concat(sp.tu));
    return {
      cap: cap,
      ids: ids,
      names: ids.map(function (id) { return MOVES[id][0]; }),
      lockedCount: sp.lm.length - allowedLm.length
    };
  }
