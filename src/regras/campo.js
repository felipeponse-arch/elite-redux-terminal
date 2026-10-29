  // ===== src/regras/campo.js =====
  // TK-16 (campo, fase 1): FONTE ÚNICA do vocabulário de clima, terreno, telas e hazards, e das durações de campo.
  // Antes cada consumidor (dados_base, duelo, condicoes_habilidade, time_pelo_motor_papeis, mono_run, prompts_ia) trazia
  // a sua lista. Colado no <script> principal por scripts/build.mjs (marcador @regras campo.js), ANTES de dados_base.js.
  // Só dado e funções puras: nada aqui lê ou desenha a página.

  // Durações em turnos: include/battle_util.h do jogo (er-repo, ramo upcoming), linhas 50-69. O texto da habilidade
  // ("lasts 3 turns") só confirma; o número que o motor usa vem daqui.
  var DURACAO_CAMPO = {
    clima: 8, // WEATHER_DURATION (:50)
    climaExtendido: 12, // WEATHER_DURATION_EXTENDED (:51), item de clima
    terreno: 8, // TERRAIN_DURATION (:52)
    gravidade: 5, // GRAVITY_DURATION (:54)
    sala: 5, // TRICK_ROOM_DURATION (:56); Trick Room de golpe
    salaCurta: 3, // TRICK_ROOM_DURATION_SHORT (:57); Trick Room de habilidade (abilities.cc:4463)
    inversa: 5, // INVERSE_ROOM_DURATION (:60)
    inversaCurta: 3, // INVERSE_ROOM_DURATION_SHORT (:61); habilidade (abilities.cc:6138)
    tela: 5, // SCREEN_DURATION (:63); com Light Clay
    telaLightClay: 8, // SCREEN_DURATION_EXTENDED (:64)
    telaCurta: 3, // SCREEN_DURATION_SHORT (:65); tela de habilidade sem Light Clay
    vento: 3 // TAILWIND_DURATION (:67)
  };

  // Climas do motor (id em português sem acento) e o rótulo que o jogador lê.
  var CLIMAS_DO_CAMPO = ["sol", "chuva", "areia", "granizo", "nevoa"];
  var ROTULO_CLIMA = { sol: "sol", chuva: "chuva", areia: "areia", granizo: "granizo", nevoa: "névoa" };
  // Terrenos do motor: id, tipo reforçado, texto do jogo -> id.
  var TERRENOS_DO_CAMPO = ["eletrico", "grama", "psiquico", "nevoento", "toxico"]; // "nevoento" (Misty), distinto do clima "nevoa" (Eerie Fog)
  var TERRENO_DO_TEXTO = { electric: "eletrico", grassy: "grama", psychic: "psiquico", misty: "nevoento", toxic: "toxico" };
  var TIPO_DO_TERRENO = { eletrico: "Electric", grama: "Grass", psiquico: "Psychic", nevoento: "Fairy", toxico: "Poison" };
  // Arquétipo "Clima e campo" do time (chave do select, em inglês porque é o nome do jogo) -> condição do motor.
  // Trick Room é sala, não condição de clima nem de terreno: fica fora do mapa, mas na lista (ordem do select).
  var ARQUETIPOS_DE_CAMPO = ["Sand", "Rain", "Sun", "Hail", "Eerie Fog", "Trick Room",
    "Electric Terrain", "Psychic Terrain", "Grassy Terrain", "Misty Terrain", "Toxic Terrain"];
  var CONDICAO_DO_ARQUETIPO_CAMPO = {
    "Rain": "chuva", "Sun": "sol", "Sand": "areia", "Hail": "granizo", "Eerie Fog": "nevoa",
    "Electric Terrain": "terreno eletrico", "Psychic Terrain": "terreno psiquico", "Grassy Terrain": "terreno de grama",
    "Misty Terrain": "terreno nevoento", "Toxic Terrain": "terreno toxico"
  };
  // O que a IA e a tela mostram do arquétipo (nunca a chave inglesa crua).
  var ROTULO_ARQUETIPO_CAMPO = {
    "Sand": "Areia", "Rain": "Chuva", "Sun": "Sol", "Hail": "Granizo", "Eerie Fog": "Névoa (Eerie Fog)", "Trick Room": "Trick Room",
    "Electric Terrain": "Terreno Elétrico", "Psychic Terrain": "Terreno Psíquico", "Grassy Terrain": "Terreno de Grama",
    "Misty Terrain": "Terreno Nebuloso", "Toxic Terrain": "Terreno Tóxico"
  };
  function rotuloDoArquetipoDeCampo(chave) { return ROTULO_ARQUETIPO_CAMPO[chave] || chave; }

  // Clima oficial (pacote 02/10/2026; battle_util.c): reforço sol/chuva, defesa Ice no granizo, Sp. Def Rock na areia, corte contra Ghost na névoa.
  var CLIMA_OFICIAL = { reforcoSolChuva: 1.5, duracaoTurnos: DURACAO_CAMPO.clima, defesaIceNoGranizo: 1.5, spdRockNaAreia: 1.5, ataqueContraGhostNaNevoa: 0.8 };

  // Telas (um nome só para o fenômeno "tela"): id do lado -> golpe do jogo. Light Screen = "luz", Aurora Veil = "veu".
  var TELAS_DO_LADO = { reflect: "Reflect", luz: "Light Screen", veu: "Aurora Veil" };

  // Hazards: UM caminho para golpe (Stealth Rock...) e habilidade (Toxic Debris...). id -> camadas máximas no lado.
  var CAMADAS_DE_HAZARD = { rocha: 1, espinho: 3, toxico: 2, teia: 1, espinhoVerde: 1 };
  var HAZARD_DO_GOLPE = { "Stealth Rock": "rocha", "Spikes": "espinho", "Toxic Spikes": "toxico", "Sticky Web": "teia" };
  function hazardCheioNoLado(lado, id) { var v = lado[id]; return v === true || (typeof v === "number" && v >= CAMADAS_DE_HAZARD[id]); }
  function poeHazardNoLado(lado, id) {
    var max = CAMADAS_DE_HAZARD[id];
    if (!max) return;
    lado[id] = max === 1 ? true : Math.min(max, (lado[id] || 0) + 1);
  }
