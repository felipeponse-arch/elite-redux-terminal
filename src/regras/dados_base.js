  // ===== src/regras/dados_base.js =====
  // Tabelas derivadas dos dados do jogo (tipos, golpes, espécies, rótulos conferidos, naturezas) e utilitários puros.
  // Colado dentro do <script> principal do app por scripts/build.mjs (marcador
  // @regras dados_base.js), no mesmo escopo do resto do código - sem module,
  // sem wrapper. Só lógica pura: nada aqui lê a página (item D1 da pauta
  // técnica, 2026-09-16), o que permite carregar este arquivo no Node pros
  // testes unitários (tests/unit/).

  var TYPES = DATA.types;
  var ABILITIES = DATA.abilities;
  var MOVES = DATA.moves;
  var ITEMS = DATA.items || [];
  var EVOKINDS = DATA.evoKinds;

  // Rótulos dos dados usados em comparação (item D2 da pauta técnica,
  // 2026-09-16). Toda comparação com um rótulo do jogo passa por aqui, nunca
  // por texto digitado solto no meio do código: o bug "Status" x "STATUS"
  // (golpe de status contando como ataque em 91 times de chefão) e o
  // indexOf("MALE") que também casava com "FEMALE" (evolução só de fêmea
  // mostrada com ♂ em 15 espécies) eram a mesma classe de erro. dataLabel()
  // confere o rótulo contra o próprio dado ao carregar - um nome errado falha
  // na hora, nos testes, em vez de nunca bater em silêncio.
  function dataLabel(list, name, listName) {
    if (!list || list.indexOf(name) === -1) {
      throw new Error("Rótulo \"" + name + "\" não existe em " + listName + " - o dado mudou ou o nome está errado.");
    }
    return name;
  }
  var SPLIT_STATUS = dataLabel(DATA.splits, "STATUS", "splits");
  var EVO_LEVEL = dataLabel(EVOKINDS, "EVO_LEVEL", "evoKinds");
  var EVO_LEVEL_MALE = dataLabel(EVOKINDS, "EVO_LEVEL_MALE", "evoKinds");
  var EVO_LEVEL_FEMALE = dataLabel(EVOKINDS, "EVO_LEVEL_FEMALE", "evoKinds");
  var EVO_PRIMAL = dataLabel(EVOKINDS, "EVO_PRIMAL_REVERSION", "evoKinds");
  var EVO_MEGA_KINDS = [
    dataLabel(EVOKINDS, "EVO_MEGA_EVOLUTION", "evoKinds"),
    dataLabel(EVOKINDS, "EVO_MOVE_MEGA_EVOLUTION", "evoKinds")
  ];
  // Flags reais de golpe (Faz Contato, Baseado em Som, Baseado em Chifre...
  // 18 categorias, ver scripts/transform.ps1) - MOVES[id][8] é um array de
  // índices aqui. Pré-requisito da Fase 3 (cruzar habilidade x movepool
  // real); por enquanto só disponibilizado, sem UI própria ainda.
  var FLAGS = DATA.flags || [];
  // "Como conseguir" (SEnc) - 2026-09-11, achado na varredura completa do
  // jogo: sp.senc é uma lista de [how, mapIdx] (ver scripts/transform.ps1),
  // how resolve em SENC_HOW (0=scripted wild, 1=scripted not wild,
  // 2=given with custom moves, 3=given), mapIdx resolve em MAPS (569 mapas
  // reais). Nunca extraído/exibido até agora.
  var SENC_HOW = DATA.sencHow || [];
  var MAPS = DATA.maps || [];
  var SPECIES = DATA.species.filter(function (s) { return s; });

  // ---------------- species lookup & type/ability calculation ----------------
  // Banners de navegação, 2026-09-13 (Fase 1 do refactor de estrutura,
  // achado real: 6063 linhas cresceram bastante desde que o sistema de
  // banners `// ---------------- nome ----------------` foi criado, e boa
  // parte das seções mais NOVAS - ferramentas de IA, geração de build,
  // estratégia de time, notas, histórico - nunca ganhou um marcador
  // próprio, deixando um trecho de quase 1600 linhas sem nenhum banner
  // guiando. Preenche só os buracos reais no MESMO padrão já existente -
  // nenhuma função mudou de lugar, nenhuma lógica mudou.
  // Two identifiers, on purpose:
  //   x     - the species' index in this build's data array. Fast, but it is
  //           NOT stable across game versions (comparing two builds, 1661 of
  //           1665 positions pointed at different species), so it may only
  //           ever live in memory.
  //   sname - "SPECIES_AERODACTYL_MEGA". Unique across all 1906 species and
  //           stable across versions, so everything persisted or authored by
  //           hand (localStorage, builds.json, the saved-team seed) uses it.
  var SPECIES_BY_X = Object.create(null);
  var SPECIES_BY_SNAME = Object.create(null);
  SPECIES.forEach(function (s) {
    SPECIES_BY_X[s.x] = s;
    SPECIES_BY_SNAME[s.sname] = s;
  });

  function getSpeciesByX(x) { return SPECIES_BY_X[x] || null; }
  function getSpeciesBySname(sn) { return SPECIES_BY_SNAME[sn] || null; }
  function snameOf(x) { var s = SPECIES_BY_X[x]; return s ? s.sname : null; }

  // Move lookup by name, not id - "Meu build"'s move <select> options are
  // keyed by name (same as the rest of a saved build), so the status
  // preview (2026-09-09) needs the reverse direction of what MOVES[id]
  // already gives everywhere else.
  var MOVE_BY_NAME = Object.create(null);
  var MOVE_ID_BY_NAME = Object.create(null);
  MOVES.forEach(function (m, id) { if (m && m[0]) { MOVE_BY_NAME[m[0]] = m; MOVE_ID_BY_NAME[m[0]] = id; } });

  var NATURE_MODS = {
    Lonely: [1, 2], Brave: [1, 5], Adamant: [1, 3], Naughty: [1, 4],
    Bold: [2, 1], Relaxed: [2, 5], Impish: [2, 3], Lax: [2, 4],
    Timid: [5, 1], Hasty: [5, 2], Jolly: [5, 3], Naive: [5, 4],
    Modest: [3, 1], Mild: [3, 2], Quiet: [3, 5], Rash: [3, 4],
    Calm: [4, 1], Gentle: [4, 2], Sassy: [4, 5], Careful: [4, 3]
    // Hardy/Docile/Serious/Bashful/Quirky are neutral - no entry, falls
    // through to the no-modifier case below.
  };
  // Full 25-nature list for the "Meu build" picker (Object.keys(NATURE_MODS)
  // is only the 20 that actually change a stat).
  var ALL_NATURES = Object.keys(NATURE_MODS).concat(["Hardy", "Docile", "Serious", "Bashful", "Quirky"]).sort();

  function clampInt(v, min, max, fallback) {
    var n = parseInt(v, 10);
    if (isNaN(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  // Real data quirk, not a bug: 149 of 1906 species have all 3 choosable-
  // ability slots pointing at the identical id in the raw game data (e.g.
  // Tyranitar Mega Redux's own "abis":[444,444,444] - checked directly,
  // this is upstream, not a splicing mistake). alwaysActiveAbilities()
  // already treats that case as "no real choice" for the weakness table;
  // this dedupes the same ids before they reach a card list, so a species
  // like that shows ONE Evaporate card instead of three identical ones -
  // found by actually opening the Dex on the user's own team member, not
  // by reading the data cold.
  function uniqueIds(ids) {
    var seen = {}, out = [];
    for (var i = 0; i < ids.length; i++) {
      if (!seen[ids[i]]) { seen[ids[i]] = true; out.push(ids[i]); }
    }
    return out;
  }

  // ---- Taxonomia de tipos e arquétipos (movida do template na fase 3 da
  // refatoração, 2026-09-24: o save, as sugestões e os prompts dependem dela) ----
  var USABLE_TYPES = TYPES.filter(function (t) { return t !== "Mystery" && t !== "None" && t !== "Stellar"; });
  // Arquétipo de time (Fase 3b, 2026-09-12) - taxonomia REAL trazida pelo
  // usuário (fonte: r/VGC no Reddit, registrada na memória do projeto), dois
  // eixos independentes - um time pode ser "Sand" (clima) E "Balance"
  // (ritmo) ao mesmo tempo. Vazio ("") = não definido, sempre a primeira
  // opção dos dois <select> - nunca chuta um valor padrão.
  // 2026-09-26 (pedido do usuário, conferido na Smogon e nos dados do jogo): o
  // eixo "pace" aparece como "Estilo" (o termo da comunidade é playstyle; "Ritmo"
  // confundia com velocidade) e o "weather" como "Clima e campo" (Trick Room e
  // terrenos não são clima). "Snow" virou "Hail": neste jogo o Snow Warning
  // "Summons hail" e o golpe é Hail (não existe Snowscape) - save antigo é
  // convertido em save.js. Eerie Fog é clima deste hack (Low Visibility/Fog
  // Machine armam; várias habilidades ativam "in fog"); Toxic Terrain também
  // (Toxic Surge).
  var PACE_ARCHETYPES = ["Hyper Offense", "Balance", "Bulky Offense", "Stall", "Semi-Stall"];
  var WEATHER_ARCHETYPES = ["Sand", "Rain", "Sun", "Hail", "Eerie Fog", "Trick Room",
    "Electric Terrain", "Psychic Terrain", "Grassy Terrain", "Misty Terrain", "Toxic Terrain"];
  // Quarto eixo, "Tática" (2026-09-26): o que o time faz em campo, combinável
  // com estilo e clima (ex.: Rain + Armadilhas e pivô).
  var TATICA_ARCHETYPES = ["Telas", "Armadilhas e pivô"];
  // Terceiro eixo, independente dos outros dois (Gerador Inteligente de
  // Times, 2026-09-17, pedido do usuário): Monotype restringe o time a UM
  // tipo só. Ao contrário de Ritmo/Clima (guia de estilo, a IA decide os
  // membros livremente), Monotype é uma REGRA - o roster é filtrado por
  // tipo real ANTES de mostrar pra IA (determinístico, não confia na IA
  // pra respeitar isso sozinha).
  var MONOTYPE_ARCHETYPES = USABLE_TYPES;

  // Rótulos em português dos papéis (movidos do template na fase 4 - os prompts de IA e a
  // ficha usam os mesmos).
  // The Dex detail used to show both badges bare, side by side, right next
  // to the species name - "S" filled next to "A" outlined with zero label,
  // which read as confusing/contradictory rather than as two different
  // questions being answered (user feedback, 2026-09-09). Now a labeled
  // line of its own, in plain words, so no tooltip is required to understand
  // it. The list row and Team/Box cards keep just the bare rankBadgeHtml()
  // chip - that's fine there, it's a single glanceable "how good is this"
  // signal, not a place to also explain a second, different ranking.
  // Papel/arquétipo (Pivô/Tanque/Wallbreaker/Sweeper) + divisão física/
  // especial - sinal SEPARADO do rank (ver SPECIES_ROLE acima). Renderiza
  // como texto simples, não como badge de letra única, porque não é uma
  // nota de "quão forte" - é "que tipo de forte", e uma espécie pode
  // acumular mais de um papel real ao mesmo tempo.
  //
  // As chaves em SPECIES_ROLE são ASCII sem acento (Pivo/Fisico) de
  // propósito - achado real ao gerar o dado: compute_species_role.ps1 é lido
  // pelo PowerShell 5.1 na codepage padrão do sistema (sem BOM no arquivo),
  // então um literal acentuado no fonte do script virava mojibame no JSON.
  // O rótulo final acentuado, em português, é responsabilidade desta
  // camada (igual RANK_TIER_CLASS já faz pra tier, embora tier nunca tenha
  // tido acento pra começo de conversa).
  var ROLE_LABEL_PT = { Pivo: "Pivô", Tanque: "Tanque", Wallbreaker: "Wallbreaker", Sweeper: "Sweeper" };
  var SPLIT_LABEL_PT = { Fisico: "Físico", Especial: "Especial", Misto: "Misto" };
