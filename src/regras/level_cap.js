  // ===== src/regras/level_cap.js =====
  // Level cap atual e golpes liberados por ele.
  // Colado dentro do <script> principal do app por scripts/build.mjs (marcador
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

  // Dificuldade Elite: as innates do JOGADOR liberam pelo nível do Pokémon
  // (código oficial do jogo, include/constants/pokemon_config.h:
  // INNATE_1_LEVEL_ELITE 1, INNATE_2 17, INNATE_3 24; pokemon.c:4968 só vale
  // pro jogador). A habilidade escolhida vale sempre. O Full Features resume
  // como "depois dos 2 primeiros ginásios" - é o mesmo efeito nos caps "More".
  // Correção de 2026-10-02: a v158 travava TUDO até a 2ª insígnia (errado; o
  // vídeo Mono Fairy mostra habilidades antes do 1º ginásio).
  var NIVEL_DA_INNATE_ELITE = [1, 17, 24];
  function innatesAtivasNoNivel(sp, nivel) {
    var inn = (sp && sp.inn) || [];
    if (state.settings.difficulty !== "elite") return inn.slice();
    return inn.filter(function (id, i) { return (nivel || 0) >= (NIVEL_DA_INNATE_ELITE[i] || 1); });
  }
  // Nível em que a habilidade `nome` (da espécie `sp`) passa a valer no Elite: 1 se é escolhida ou a 1ª innate.
  function nivelDaHabilidadeNoElite(sp, nome) {
    var i = nomesDeHabilidades(sp.inn).indexOf(nome);
    return i === -1 ? 1 : (NIVEL_DA_INNATE_ELITE[i] || 1);
  }
  function innatesTravadasNoNivel(sp, nivel) {
    var ativas = innatesAtivasNoNivel(sp, nivel);
    return ((sp && sp.inn) || []).filter(function (id) { return ativas.indexOf(id) === -1; });
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

  // Golpes de uma build que o Pokémon ainda não aprende no cap atual, com o
  // nível em que liberam (pedido do usuário, 2026-09-24: a build curada é de
  // fim de jogo - no cap 18, 124 das 138 curadas têm golpe travado, e o card do
  // time mostrava tudo como se já desse pra usar). Tutor nunca trava. Golpe
  // que a espécie não aprende de jeito nenhum volta com nivel null.
  function golpesTravadosNoCap(sp, moves) {
    var cap = getCurrentCap();
    if (cap === null || cap === undefined || !sp || !Array.isArray(moves)) return [];
    var out = [];
    moves.forEach(function (nome) {
      var id = MOVE_ID_BY_NAME[nome];
      if (id === undefined || sp.tu.indexOf(id) !== -1) return;
      var menor = null;
      sp.lm.forEach(function (p) { if (p[1] === id && (menor === null || p[0] < menor)) menor = p[0]; });
      if (menor === null || menor > cap) out.push({ nome: nome, nivel: menor });
    });
    return out;
  }
