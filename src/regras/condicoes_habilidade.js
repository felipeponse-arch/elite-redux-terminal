  // ===== src/regras/condicoes_habilidade.js =====
  // Habilidade que só funciona numa condição do PRÓPRIO Pokémon (status,
  // clima ou terreno) e o que garante essa condição.
  // Colado dentro do <script> principal do app por scripts/build.mjs (marcador
  // @regras condicoes_habilidade.js), no mesmo escopo do resto do código. Só
  // lógica: nada aqui lê ou desenha a página.
  //
  // Reunião de 2026-09-28 (usuário: "a sugestão de builds não está extraindo o
  // melhor dos pokes"). A auditoria das 38 builds de IA salvas achou o
  // desperdício que nenhuma regra pegava: Goodra com Poison Heal e Choice
  // Specs (a habilidade só cura envenenado, e nada envenena) e Kingdra com
  // Swift Swim sem ninguém armando chuva. Cada condição abaixo vem do texto do
  // próprio jogo (descrição da habilidade), ex.: Poison Heal "Restores 1/8 of
  // max HP after each turn if poisoned", Swift Swim "Speed gets a 1.5x boost
  // if rain is active", Guts "Ups Atk by 1.5x if suffering from a status
  // condition". Ficam de fora as que só perdem PARTE do efeito sem a condição
  // (Harvest, Dry Skin, Ice Face, Generator).
  var CONDICAO_DE_HABILIDADE = {
    // status do próprio Pokémon
    "Guts": ["status"], "Marvel Scale": ["status"], "Quick Feet": ["status"], "Rage Point": ["status"],
    "Poison Heal": ["veneno"], "Toxic Boost": ["veneno"], "Flare Boost": ["queimadura"], "Sweet Dreams": ["sono"],
    // clima
    "Swift Swim": ["chuva"], "Rain Dish": ["chuva"], "Hydration": ["chuva"], "Raging Storm": ["chuva"],
    "Rain Shroud": ["chuva"], "Sea Guardian": ["chuva"],
    "Chlorophyll": ["sol"], "Solar Power": ["sol"], "Leaf Guard": ["sol"], "Flower Gift": ["sol"],
    "Sun Worship": ["sol"], "Sun Basking": ["sol"], "Protosynthesis": ["sol", "Booster Energy"],
    "Thermal Slide": ["sol", "granizo"],
    "Sand Veil": ["areia"], "Sand Rush": ["areia"], "Sand Force": ["areia"], "Sand Guard": ["areia"],
    "Dune Terror": ["areia"], "Desert Cloak": ["areia"], "Sand Fiend": ["areia"],
    "Snow Cloak": ["granizo"], "Ice Body": ["granizo"], "Slush Rush": ["granizo"], "Whiteout": ["granizo"],
    "Christmas Spirit": ["granizo"], "Ice Cold Hunter": ["granizo"], "Abominable Monster": ["granizo"],
    "Glacial Ghost": ["granizo"],
    "Ectoplasm": ["nevoa"], "Greater Spirit": ["nevoa"], "Ethereal Rush": ["nevoa"], "Shallow Grave": ["nevoa"],
    "Rest in Peace": ["nevoa"], "Smokey Maneuvers": ["nevoa"], "Madness Enhancement": ["nevoa"],
    "Soul Tap": ["nevoa"], "Echolocation": ["nevoa"], "Foggy Eye": ["nevoa"], "Surprise!": ["nevoa"],
    // terreno
    "Surge Surfer": ["terreno eletrico"], "Backup Power": ["terreno eletrico"],
    "Quark Drive": ["terreno eletrico", "Booster Energy"],
    "Jungle Fever": ["terreno de grama"], "Grass Pelt": ["terreno de grama"], "Flower Necklace": ["terreno de grama"],
    "Flourish": ["terreno de grama"], "Celestial Blessing": ["terreno nevoento"], "Biofilm": ["terreno toxico"]
  };
  var NOME_DA_CONDICAO = {
    "status": "estar com um status (envenenado, queimado...)", "veneno": "estar envenenado",
    "queimadura": "estar queimado", "sono": "estar dormindo", "chuva": "chuva", "sol": "sol",
    "areia": "tempestade de areia", "granizo": "granizo", "nevoa": "Eerie Fog (névoa)",
    "terreno eletrico": "Electric Terrain", "terreno de grama": "Grassy Terrain",
    "terreno nevoento": "Misty Terrain", "terreno toxico": "Toxic Terrain"
  };
  // Golpe que arma o clima/terreno (descrição do jogo: Sandstorm "Invoca uma
  // tempestade de areia", Hail e Chilly Reception "Invoca granizo", Grassy
  // Terrain "Ativa o Grassy Terrain"...). Rest "O usuário dorme".
  var GOLPES_QUE_ARMAM = {
    "chuva": ["Rain Dance"], "sol": ["Sunny Day"], "areia": ["Sandstorm"], "granizo": ["Hail", "Chilly Reception"],
    "nevoa": ["Eerie Fog"], "terreno eletrico": ["Electric Terrain"], "terreno de grama": ["Grassy Terrain"],
    "terreno nevoento": ["Misty Terrain"], "terreno toxico": ["Toxic Terrain"], "sono": ["Rest"], "status": ["Rest"]
  };
  // Habilidade que arma o clima/terreno, lida do texto do jogo ("Summons rain
  // on entry", "Casts Electric Terrain on entry", "Summons a sandstorm when
  // hit"...). Habilidade composta ("Sand Bender: Sand Stream + Sand Force")
  // herda o texto das partes.
  var ARMA_POR_TEXTO = {
    "chuva": /summons? rain|heavy rain/i,
    "sol": /summons? sun|intense sun/i,
    "areia": /summons? (a )?sand/i,
    "granizo": /summons? hail|triggers hail/i,
    "nevoa": /eerie fog on entry|set up eerie fog/i,
    "terreno eletrico": /electric terrain on entry|set up electric terrain|field becomes electric/i,
    "terreno de grama": /grassy terrain on entry|sets grassy terrain/i,
    "terreno nevoento": /misty terrain on entry/i,
    "terreno toxico": /toxic terrain on entry/i
  };
  // Clima e campo do arquétipo -> condição que o time inteiro joga.
  var CONDICAO_DO_ARQUETIPO = {
    "Rain": "chuva", "Sun": "sol", "Sand": "areia", "Hail": "granizo", "Eerie Fog": "nevoa",
    "Electric Terrain": "terreno eletrico", "Grassy Terrain": "terreno de grama",
    "Misty Terrain": "terreno nevoento", "Toxic Terrain": "terreno toxico"
  };
  // Orbe que causa o status no próprio Pokémon (texto do jogo: Toxic Orb
  // "badly poisons the holder", Flame Orb "inflicts a burn on holder").
  var ORBES_DE_STATUS = { "veneno": "Toxic Orb", "queimadura": "Flame Orb" };
  // Texto de habilidade que impede o status em si mesmo.
  var BLOQUEIA_STATUS = {
    "veneno": /cannot be poisoned|immune to status/i,
    "queimadura": /burn-immune|no burns|immune to burn|immune to status/i,
    "sono": /fall asleep|immune to sleep|rest fails|immune to status/i
  };

  var descricaoDeHabilidadeCache = {};
  function descricaoDeHabilidade(nome) {
    if (descricaoDeHabilidadeCache[nome] !== undefined) return descricaoDeHabilidadeCache[nome];
    var a = ABILITIES.filter(function (x) { return x && x[0] === nome; })[0];
    var txt = expandirTextoDeHabilidade(a ? (a[1] || "") : "", nome, 0);
    descricaoDeHabilidadeCache[nome] = txt;
    return txt;
  }
  // Pelo número (2026-09-30): há habilidades com o MESMO nome e textos diferentes
  // ("As One: Unnerve + Chilling Neigh" e "As One: Unnerve + Grim Neigh") - pelo
  // nome, as duas recebiam o texto da primeira.
  var descricaoPorIdCache = {};
  function descricaoDeHabilidadePorId(id) {
    if (descricaoPorIdCache[id] !== undefined) return descricaoPorIdCache[id];
    var a = ABILITIES[id];
    return (descricaoPorIdCache[id] = a ? expandirTextoDeHabilidade(a[1] || "", a[0], 0) : "");
  }
  // "Snow Warning + Cryomancy": junta o texto das partes. Revisão de 2026-09-30:
  // o nome da parte vai só até "." ou ";" ("Intimidate + Scare; 10% chance..."
  // perdia o Scare) e a expansão desce até 3 níveis ("Atlantic Ruler: Aquatic
  // Dweller + Swift Swim", e Aquatic Dweller é "Aquatic + ...").
  function expandirTextoDeHabilidade(txt, nome, nivel) {
    var extra = "";
    if (nivel >= 3 || txt.indexOf("+") === -1) return txt;
    txt.split("+").forEach(function (parte) {
      var p = parte.split(/[.;]/)[0].trim();
      var sub = p && p !== nome ? ABILITIES.filter(function (x) { return x && x[0] === p; })[0] : null;
      if (sub) extra += " " + expandirTextoDeHabilidade(sub[1] || "", p, nivel + 1);
    });
    return txt + extra;
  }
  function habilidadeArma(nome, cond) {
    return !!ARMA_POR_TEXTO[cond] && ARMA_POR_TEXTO[cond].test(descricaoDeHabilidade(nome));
  }
  function nomesDeHabilidades(ids) {
    return uniqueIds(ids || []).map(function (id) { return ABILITIES[id] ? ABILITIES[id][0] : ""; }).filter(Boolean);
  }
  // Pode ficar com este status? Tipo Poison/Steel não é envenenado (o próprio
  // jogo confirma a regra ao descrever Corrosion como exceção: "Can poison any
  // type"); habilidade que bloqueia o status também impede.
  function podeTerStatus(sp, cond, habilidades) {
    var tipos = speciesTypeNames(sp);
    if (cond === "veneno" && (tipos.indexOf("Poison") !== -1 || tipos.indexOf("Steel") !== -1)) return false;
    var bloqueio = BLOQUEIA_STATUS[cond];
    return !bloqueio || !habilidades.some(function (n) { return bloqueio.test(descricaoDeHabilidade(n)); });
  }
  // Quem já garante a condição hoje, fora do próprio Pokémon: o time (build
  // ativa de cada membro + innates) e o Clima e campo do arquétipo.
  function garantiaDoTime(sp, cond) {
    if (CONDICAO_DO_ARQUETIPO[state.archetype.weather] === cond) return "o Clima e campo do time (" + state.archetype.weather + ")";
    var membros = state.team.map(getSpeciesByX).filter(function (m) { return m && m.x !== sp.x; });
    for (var i = 0; i < membros.length; i++) {
      var m = membros[i], b = getActiveBuild(m.sname);
      var habs = nomesDeHabilidades(m.inn).concat(b && b.ability ? [b.ability] : []);
      var hab = habs.filter(function (n) { return habilidadeArma(n, cond); })[0];
      if (hab) return m.n + " (" + hab + ")";
      var golpe = ((b && b.moves) || []).filter(function (g) { return (GOLPES_QUE_ARMAM[cond] || []).indexOf(g) !== -1; })[0];
      if (golpe) return m.n + " (" + golpe + ")";
    }
    return null;
  }
  // Uma condição, nesta build: quem garante (texto) ou null.
  function garantiaDaCondicao(sp, cond, build, habilidadesAtivas) {
    if (ITEMS.indexOf(cond) !== -1) return build.item === cond ? "o item " + cond : null; // Booster Energy
    var item = build.item || "", moves = build.moves || [];
    var status = cond === "status" ? ["veneno", "queimadura"] : (ORBES_DE_STATUS[cond] ? [cond] : []);
    for (var i = 0; i < status.length; i++) {
      if (item === ORBES_DE_STATUS[status[i]] && podeTerStatus(sp, status[i], habilidadesAtivas)) return "o item " + item;
    }
    if (item === "Frost Orb" && cond === "status") return "o item Frost Orb";
    if (cond === "sono" && habilidadesAtivas.indexOf("Comatose") !== -1) return "Comatose";
    var golpe = moves.filter(function (g) { return (GOLPES_QUE_ARMAM[cond] || []).indexOf(g) !== -1; })[0];
    if (golpe && (cond !== "sono" && cond !== "status" || podeTerStatus(sp, "sono", habilidadesAtivas))) return "o golpe " + golpe;
    var hab = habilidadesAtivas.filter(function (n) { return habilidadeArma(n, cond); })[0];
    if (hab) return "a habilidade " + hab;
    return ORBES_DE_STATUS[cond] || cond === "status" || cond === "sono" ? null : garantiaDoTime(sp, cond);
  }
  // O que o jogador/IA pode fazer pra garantir (movepool liberado + itens).
  function comoGarantir(sp, conds, habilidadesAtivas) {
    var golpes = availableMovesFor(sp).names;
    // Mega no modo temporário: o slot de item é da pedra - orbe não cabe.
    var itemLivre = !megaStoneRuleFor(sp);
    var out = [];
    conds.forEach(function (cond) {
      if (ITEMS.indexOf(cond) !== -1) { if (itemLivre) out.push("segurar " + cond); return; }
      var status = cond === "status" ? ["veneno", "queimadura"] : (ORBES_DE_STATUS[cond] ? [cond] : []);
      status.forEach(function (s) {
        if (itemLivre && ITEMS.indexOf(ORBES_DE_STATUS[s]) !== -1 && podeTerStatus(sp, s, habilidadesAtivas)) out.push("segurar " + ORBES_DE_STATUS[s]);
      });
      (GOLPES_QUE_ARMAM[cond] || []).forEach(function (g) {
        if (golpes.indexOf(g) !== -1 && (g !== "Rest" || podeTerStatus(sp, "sono", habilidadesAtivas))) out.push("usar " + g);
      });
    });
    return out.filter(function (x, i) { return out.indexOf(x) === i; });
  }
  // Habilidade condicional da build (a escolhida). null = não é condicional.
  // { habilidade, condicao (texto), garantidaPor (texto ou null), comoGarantir [] }
  function condicaoDaBuild(sp, build) {
    var conds = CONDICAO_DE_HABILIDADE[build.ability];
    if (!conds) return null;
    var ativas = nomesDeHabilidades(sp.inn).concat([build.ability]);
    var garantia = null;
    for (var i = 0; i < conds.length && !garantia; i++) garantia = garantiaDaCondicao(sp, conds[i], build, ativas);
    return {
      habilidade: build.ability,
      condicao: conds.map(function (c) { return NOME_DA_CONDICAO[c] || c; }).join(" ou "),
      garantidaPor: garantia,
      comoGarantir: comoGarantir(sp, conds, ativas)
    };
  }
  // Linhas pro prompt, ANTES da IA escolher: cada habilidade condicional da
  // espécie (escolhível ou innate), o que a garante hoje e como garantir.
  function blocoCondicoesIA(sp) {
    var escolhiveis = nomesDeHabilidades(sp.ab), innates = nomesDeHabilidades(sp.inn);
    var linhas = [];
    escolhiveis.concat(innates).forEach(function (nome) {
      var conds = CONDICAO_DE_HABILIDADE[nome];
      if (!conds) return;
      var ehInnate = innates.indexOf(nome) !== -1;
      var ativas = innates.concat(ehInnate ? [] : [nome]);
      var doTime = conds.map(function (c) { return GOLPES_QUE_ARMAM[c] && !ORBES_DE_STATUS[c] && c !== "status" && c !== "sono" ? garantiaDoTime(sp, c) : null; }).filter(Boolean)[0];
      var daEspecie = conds.map(function (c) { return innates.filter(function (n) { return habilidadeArma(n, c); })[0]; }).filter(Boolean)[0];
      var como = comoGarantir(sp, conds, ativas);
      // Innate condicional: uma escolhível desta espécie que arma a condição
      // (ex.: Drizzle pra uma innate Swift Swim) também garante.
      if (ehInnate) {
        escolhiveis.filter(function (n) { return conds.some(function (c) { return habilidadeArma(n, c); }); })
          .forEach(function (n) { como.push("escolher a habilidade " + n); });
      }
      linhas.push("- " + nome + (ehInnate ? " (innate)" : " (escolhivel)") + ": so funciona com " +
        conds.map(function (c) { return NOME_DA_CONDICAO[c] || c; }).join(" ou ") + ". " +
        (daEspecie ? "Ja garantida pela innate " + daEspecie + "." : doTime ? "Ja garantida por " + doTime + "." :
          "NAO garantida hoje - " + (como.length ? "para usar: " + como.join(" ou ") : "esta especie nao tem como garantir sozinha") + "."));
    });
    if (!linhas.length) return "";
    return "HABILIDADES CONDICIONAIS (efeito do jogo) - escolher uma sem garantir a condicao na build (item, golpe) ou no time e REJEITADO:\n" +
      linhas.join("\n") + "\n";
  }
