  // ===== src/regras/level_cap.js =====
  // Level cap atual e golpes liberados por ele.
  // Colado dentro do <script> principal do app por scripts/build.ps1 (marcador
  // @regras level_cap.js), no mesmo escopo do resto do código - sem module,
  // sem wrapper. Só lógica pura: nada aqui lê a página (item D1 da pauta
  // técnica, 2026-09-16), o que permite carregar este arquivo no Node pros
  // testes unitários (tests/unit/).

  function getCurrentCap() {
    if (!LEVELCAPS || !LEVELCAPS.rows[state.settings.milestone]) return null;
    return LEVELCAPS.rows[state.settings.milestone][state.settings.difficulty];
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
