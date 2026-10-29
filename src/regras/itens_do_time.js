  // ===== src/regras/itens_do_time.js =====
  // UMA lista de itens para o set do duelo (itemDoSetDuelo), o Modo Motor (time_pelo_motor.js) e a IA (prompts_ia.js,
  // validacao_build_ia.js) - TK-14, decisão do usuário (28/10/2026). Antes eram três: o palpite do set, MOTOR_ITENS_FIXOS + o
  // item de tipo alfabético do ITENS_CONFIG (Psychic caía em Odd Incense, que a IA não oferecia) e a lista da IA.
  // Papéis diferentes (ordem de preferência, quais o Motor simula) ficam com quem chama; "quais itens existem" é só daqui.
  // Colado dentro do <script> principal por scripts/build.mjs (marcador @regras itens_do_time.js).

  // Lista curada e verificada à mão de itens de batalha COMPETITIVOS
  // comumente relevantes, 2026-09-10 (revisão da equipe: "o especialista
  // deve analisar a base completa de itens e pensar em qual seria melhor").
  // A lista real de itens (`ITEMS`) tem 926 entradas - quase todas
  // irrelevantes pra escolha de item de batalha (itens-chave, TMs como
  // item, berries de culinária/concurso, mega-pedras de OUTRAS espécies,
  // pedras de evolução etc.), e esse dataset não tem um campo de categoria
  // pra filtrar isso automaticamente. Em vez de jogar as 926 inteiras no
  // prompt (caro e majoritariamente ruído) ou chutar uma heurística de
  // categoria (arriscado), isso é um subconjunto pequeno e real, verificado
  // como existente, cobrindo os arquétipos competitivos comuns (ataque/
  // defesa/utilidade/status) - cada um confirmado no `items` de
  // `data/dex_compact.json` deste hack antes de entrar aqui, a mesma
  // disciplina de toda lista curada deste projeto. Não é teoria completa de
  // itens (este projeto não tem modelo mecânico por item além de
  // ITEM_STAT_MODS/ITEM_MOVE_POWER_MODS, em calc_stat.js) - é um menu real e limitado
  // pra escolher, exatamente o mesmo tratamento que golpes/habilidades já
  // recebem.
  // Por grupo (2026-09-26, pedido do usuário: "temos mais itens que podem ajudar
  // na construção de builds como gemas e demais"): o prompt apresenta cada grupo
  // com o papel dele, e AI_ITEM_POOL é a soma (o que a IA pode escolher). Todo
  // nome é conferido contra ITEMS - nome que não existe neste hack cai fora.
  function soExistentes(lista) {
    return lista.filter(function (n, i) { return ITEMS.indexOf(n) !== -1 && lista.indexOf(n) === i; });
  }
  var ITENS_IA_GERAIS = soExistentes([
    "Leftovers", "Life Orb", "Choice Band", "Choice Specs", "Choice Scarf",
    "Assault Vest", "Tactical Vest", "Black Sludge", "Rocky Helmet",
    "Heavy-Duty Boots", "Eviolite", "Focus Sash", "Weakness Policy",
    "Expert Belt", "Shell Bell",
    "Muscle Band", "Wise Glasses", "Metronome", "Wide Lens", "Air Balloon",
    "Safety Goggles", "Mental Herb", "White Herb", "Power Herb", "Toxic Orb", "Flame Orb",
    "Booster Energy", "Loaded Dice", "Clear Amulet", "Covert Cloak",
    "Punching Glove", "Throat Spray"
  ]);
  // Berries: a lista tinha só Sitrus/Lum/Custap, das 67 do jogo - e as builds
  // curadas da comunidade usam as de pânico. Leppa fica de fora: neste hack o PP
  // é sempre o máximo.
  var ITENS_IA_BERRIES = soExistentes([
    "Sitrus Berry", "Lum Berry", "Custap Berry",
    "Liechi Berry", "Salac Berry", "Petaya Berry", "Apicot Berry", "Ganlon Berry", "Starf Berry",
    "Occa Berry", "Passho Berry", "Wacan Berry", "Rindo Berry", "Yache Berry", "Chople Berry",
    "Kebia Berry", "Shuca Berry", "Coba Berry", "Payapa Berry", "Tanga Berry", "Charti Berry",
    "Kasib Berry", "Haban Berry", "Colbur Berry", "Babiri Berry", "Roseli Berry", "Chilan Berry",
    "Kee Berry", "Maranga Berry", "Jaboca Berry", "Rowap Berry"
  ]);
  // Reforço de tipo (+dano do tipo sempre) - o tipo vai junto no prompt.
  var ITENS_IA_TIPO = {
    "Charcoal": "Fire", "Mystic Water": "Water", "Miracle Seed": "Grass", "Magnet": "Electric",
    "Never-MeltIce": "Ice", "Black Belt": "Fighting", "Poison Barb": "Poison", "Soft Sand": "Ground",
    "Sharp Beak": "Flying", "Twisted Spoon": "Psychic", "Silver Powder": "Bug", "Hard Stone": "Rock",
    "Spell Tag": "Ghost", "Dragon Fang": "Dragon", "Black Glasses": "Dark", "Metal Coat": "Steel",
    "Silk Scarf": "Normal", "Fairy Feather": "Fairy"
  };
  // Gemas: dano do tipo reforçado UMA vez e o item se gasta.
  var ITENS_IA_GEMAS = ITEMS.filter(function (n) { return / Gem$/.test(n); });
  // Utilidade: efeito que a IA não deduz pelo nome - vai com a descrição do
  // próprio jogo (Swirly Glasses e Frost Orb são deste hack).
  var ITENS_IA_UTILIDADE = soExistentes([
    "Scope Lens", "Razor Claw", "King's Rock", "Razor Fang", "Zoom Lens", "Quick Claw", "Focus Band",
    "Big Root", "Binding Band", "Grip Claw", "Light Clay", "Terrain Extender",
    "Damp Rock", "Heat Rock", "Smooth Rock", "Icy Rock", "Utility Umbrella",
    "Shed Shell", "Protective Pads", "Ability Shield", "Mirror Herb", "Room Service", "Blunder Policy",
    "Eject Button", "Eject Pack", "Red Card", "Absorb Bulb", "Cell Battery", "Luminous Moss", "Snowball",
    "Bright Powder", "Frost Orb", "Swirly Glasses"
  ]);
  // Exclusivos de espécie (a descrição do jogo diz de quem): só entram no
  // prompt da espécie certa, e a validação descarta se vierem pra outra.
  var ITENS_DE_ESPECIE = {
    "Light Ball": ["Pikachu", "Raichu"], "Thick Club": ["Cubone", "Marowak"], "Leek": ["Farfetch'd", "Sirfetch'd"],
    "Lucky Punch": ["Chansey"], "Soul Dew": ["Latios", "Latias"], "DeepSeaTooth": ["Clamperl"],
    "DeepSeaScale": ["Clamperl"], "Metal Powder": ["Ditto"]
  };
  // Nome base: "Marowak Alolan" e "Raichu Mega X" contam como Marowak/Raichu.
  function itensDeEspeciePara(sp) {
    return Object.keys(ITENS_DE_ESPECIE).filter(function (item) {
      return ITEMS.indexOf(item) !== -1 && ITENS_DE_ESPECIE[item].some(function (base) {
        return sp.n === base || sp.n.indexOf(base + " ") === 0;
      });
    });
  }
  var AI_ITEM_POOL = soExistentes([].concat(ITENS_IA_GERAIS, ITENS_IA_BERRIES, Object.keys(ITENS_IA_TIPO),
    ITENS_IA_GEMAS, ITENS_IA_UTILIDADE));

  // Item válido para o time nesta Etapa: está no conjunto, a run já o libera (sem Etapa conhecida = travado) e o time ainda tem vaga
  // nele (donos = quem já o segura; itemEsgotadoNoTime, MAX_MESMO_ITEM_NO_TIME).
  function itemValidoNoTime(nome, etapa, levelCap, donos) {
    return AI_ITEM_POOL.indexOf(nome) !== -1 && liberadoNaRun(etapa, levelCap, { item: nome }) && !itemEsgotadoNoTime(donos);
  }
  // donosPorItem (opcional): { "Life Orb": ["Pikachu", ...] }.
  function itensDoTime(etapa, levelCap, donosPorItem) {
    return AI_ITEM_POOL.filter(function (n) { return itemValidoNoTime(n, etapa, levelCap, donosPorItem && donosPorItem[n]); });
  }
  // Item de reforço de tipo (o mesmo que a IA oferece, ITENS_IA_TIPO); null = o tipo não tem.
  function itemDeTipoDoTime(tipo) {
    return Object.keys(ITENS_IA_TIPO).filter(function (n) { return ITENS_IA_TIPO[n] === tipo && AI_ITEM_POOL.indexOf(n) !== -1; })[0] || null;
  }
