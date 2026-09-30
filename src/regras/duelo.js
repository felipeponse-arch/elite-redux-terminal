  // ===== src/regras/duelo.js =====
  // Simulador de duelo 1x1 contra Pokémon reais de chefão - o motor do rank
  // (scripts/calcular_rank_duelo.mjs) e do botão "Montar time contra este
  // chefão" (aba Chefões). Colado no <script> principal por scripts/build.mjs
  // (marcador @regras duelo.js). Só lógica: nada aqui lê ou desenha a página.
  //
  // História: o rank antigo media só tipagem defensiva (Garchomp C). O duelo
  // nasceu como script do rank (2026-09-28) e veio pra cá no mesmo dia, quando
  // o usuário pediu um botão que monta o time contra um chefão sem copiar
  // prompt pra conversa - um motor só, rank e botão nunca discordam.
  //
  // Modelo (e simplificações, ditas às claras) - desde 2026-09-29 o motor lê as
  // habilidades em uso no jogo inteiras (pedido do usuário: "não quero que fique
  // nada de fora"); as poucas que o texto não quantifica ficam na auditoria.
  //  - Nível igual dos dois lados (o nível real do chefão não está no dado).
  //  - Três sets genéricos por espécie, vale o melhor: físico, especial e tanque,
  //    cada um com o item que combina (itemDoSetDuelo) - a build do jogador ou o
  //    item do chefão mandam quando existem.
  //  - Golpes de nível (até o nível pedido) + tutor; carga só quando não precisa
  //    carregar (sol, Accelerate, Power Herb); recarga só com Rampage.
  //  - Dano pela fórmula padrão, rolagem média, crítico, status por chance,
  //    estágios, campo (clima, terreno, salas), cura, recuo e item como VALOR
  //    ESPERADO ao longo da luta, não turno a turno. Onde a fonte oficial não dá
  //    o número (burn, paralisia, crítico, reforço de terreno, itens), vale o da série.
  //  - Golpes de status com regras simples: cada lado escolhe o plano que mais
  //    rende contra o outro (setup, status, cura que sustenta, tela, Taunt...).
  //  - Duelo: golpes necessários de cada lado; quem é mais rápido (ou tem
  //    prioridade) bate primeiro. Vitória = 1; derrota = metade da fração de HP
  //    que tirou antes de cair. A luta inteira contra o time do chefão (HP que
  //    passa de uma luta pra outra, nocaute, hazards, troca) e a dupla 2x2 usam
  //    o mesmo duelo como peça.

  var ROLAGEM_MEDIA_DUELO = 0.925;
  var SETS_DE_DUELO = [
    { nome: "fisico", evs: [4, 252, 0, 0, 0, 252], nature: "Adamant" },
    { nome: "especial", evs: [4, 0, 0, 252, 0, 252], nature: "Modest" },
    { nome: "tanque", evs: [252, 0, 128, 0, 128, 0], nature: "Hardy" }
  ];
  var CLIMA_DO_TEXTO_DUELO = { rain: "chuva", sun: "sol", sand: "areia", sandstorm: "areia", hail: "granizo", fog: "nevoa" };
  var TIPO_REFORCADO_PELO_CLIMA = { sol: "Fire", chuva: "Water" };

  function nomeHabDuelo(id) { return ABILITIES[id] ? ABILITIES[id][0] : ""; }
  function textoHabDuelo(id) { return descricaoDeHabilidadePorId(id); } // pelo número: nomes repetidos (As One)

  // ---------- golpes ----------
  function acertosDoGolpeDuelo(id) {
    var d = MOVE_PT[id] || "";
    if (/2 a 5 vezes|de 2 a 5/i.test(d) && !/turnos/i.test(d)) return 3;
    if (/10 vezes/i.test(d)) return 6;
    if (/tr[eê]s vezes|3 vezes/i.test(d)) return 3;
    if (/duas vezes|2 vezes/i.test(d)) return 2;
    return 1;
  }
  function golpeUtilNoDuelo(id) {
    var m = MOVES[id];
    if (!m || !(m[3] > 0) || DATA.splits[m[2]] === "STATUS") return false;
    return !/desmaia|descansa no turno/i.test(MOVE_PT[id] || "");
  }
  function categoriaNoDuelo(m, atk, spa) {
    var s = DATA.splits[m[2]];
    if (s === "PHYSICAL" || s === "HITS_DEF") return "F";
    if (s === "SPECIAL" || s === "HITS_SPDEF") return "E";
    return atk >= spa ? "F" : "E";
  }
  function temContatoDuelo(m) { return (m[8] || []).some(function (i) { return DATA.flags[i] === "Makes Contact"; }); }
  // Golpes que a espécie usa até o nível pedido (nivel null = todos) + tutor.
  // Golpes de recarga (Hyper Beam...) - só entram com Rampage/Qigong.
  function golpesDeRecargaAte(sp, nivel) {
    var lm = (sp.lm || []).filter(function (p) { return nivel === null || nivel === undefined || p[0] <= nivel; });
    return uniqueIds(lm.map(function (p) { return p[1]; }).concat(sp.tu || [])).filter(function (id) {
      var m = MOVES[id];
      return m && m[3] > 0 && DATA.splits[m[2]] !== "STATUS" && /descansa no turno/i.test(MOVE_PT[id] || "");
    });
  }
  function golpesDeDueloAte(sp, nivel) {
    var lm = (sp.lm || []).filter(function (p) { return nivel === null || nivel === undefined || p[0] <= nivel; });
    return uniqueIds(lm.map(function (p) { return p[1]; }).concat(sp.tu || [])).filter(golpeUtilNoDuelo);
  }
  // Golpes de status do movepool (2026-09-29, decisão do usuário: o simulador usa
  // golpe de status com regras simples) - só os que têm efeito conhecido.
  function golpesDeStatusAte(sp, nivel) {
    var lm = (sp.lm || []).filter(function (p) { return nivel === null || nivel === undefined || p[0] <= nivel; });
    return uniqueIds(lm.map(function (p) { return p[1]; }).concat(sp.tu || [])).filter(function (id) { return !!planoDoGolpeStatus(id); });
  }

  // ---------- habilidades (texto do jogo) ----------
  // Revisão completa de 2026-09-29 (usuário: "revise o entendimento de todas as
  // habilidades do jogo considerando que o pokémon que tem ela tanto usa ela no
  // ataque quanto na defesa contra outros Poke"). A auditoria das 1.034
  // descrições mostrou que o motor lia só 178; os padrões abaixo cobrem as que
  // mudam dano, velocidade, precisão ou tipo. A MESMA leitura vale pros dois
  // lados - o jogador e o chefão passam por aqui - e cada efeito é usado quando
  // o dono ataca (ofensivo) ou quando apanha (defensivo).
  // Ficam de fora, de propósito: chance de status ou de efeito; cura (por turno,
  // ao nocautear); armadilha, terreno, clima de outro; efeito de dupla/aliado;
  // crítico (o duelo não simula crítico); mudança de status ao apanhar ou ao
  // nocautear; efeito que depende de status/clima que o dono não garante;
  // categoria de golpe sem marcação no dado (soco, mordida, corte).
  var cacheEfeitoDuelo = {};
  var ABREV_TIPO_DUELO = { "Elec.": "Electric", "Elec": "Electric", "Fight.": "Fighting", "Fight": "Fighting" };
  function tipoDoTextoDuelo(palavra) {
    var p = ABREV_TIPO_DUELO[palavra] || palavra;
    return TYPES.indexOf(p) !== -1 ? p : null;
  }
  // Frase sem condição (se/quando/enquanto/clima/HP/1º turno...) - efeito fixo.
  function fraseFixaDuelo(f) {
    return !/\bif\b|\bwhen\b|\bwhile\b|\buntil\b|\bin (rain|sun|sand|hail|fog|a sandstorm|grassy|electric|misty|psychic|toxic)\b|below|under \d|at (full|max) hp|first turn|after|statused|poisoned|burned|suffering|terrain|tailwind/i.test(f);
  }
  var ESTAGIOS_DUELO = { one: 1, two: 2 };
  // Palavras do texto da habilidade -> categoria de golpe marcada no NextDex.
  var PALAVRAS_DE_CATEGORIA = [
    { nome: "soco", re: /punch|iron fist/i }, { nome: "mordida", re: /bit(?:e|ing)|fang|strong jaw/i },
    { nome: "corte", re: /slash|slicing|keen edge/i }, { nome: "pulso", re: /mega launcher|beam\/pump|cannon|pulse/i },
    { nome: "chifre", re: /horn|drill/i }, { nome: "chute", re: /kick/i },
    { nome: "flecha", re: /arrow/i }, { nome: "martelo", re: /hammer|slamm/i }
  ];
  function categoriasDoTextoDuelo(trecho) {
    return PALAVRAS_DE_CATEGORIA.filter(function (p) { return p.re.test(trecho); }).map(function (p) { return p.nome; });
  }
  function categoriasDoGolpeDuelo(id) {
    var e = typeof MOVE_CATEGORIAS !== "undefined" ? MOVE_CATEGORIAS[id] : null;
    return (e && e.c) || [];
  }
  // Sinergia habilidade x golpe da espécie: a do dado antigo (ABILITY_SYNERGY,
  // por marcação de golpe e tipo) + a por categoria do NextDex (soco, mordida,
  // corte... - 2026-09-29, antes um Pokémon com Iron Fist nunca era avisado de
  // que os socos dele rendem mais). Mesmo formato: { name, kind, categoria, golpes }.
  // ---------- status por chance (2026-09-29, grupo 1) ----------
  // Regras oficiais (FAQ e Full Changelog de eliteredux.net): Bleed = 1/16 do HP
  // por turno, Pedra e Fantasma imunes; Frostbite = 1/16 por turno e metade do
  // SpAtk; Fear = +50% de dano recebido; Infatuation = metade do dano (só gênero
  // oposto); Confusion = 33% do dano causado volta como recuo. Burn, paralisia e
  // veneno a fonte oficial não redefine: valem as da série (Burn 1/16 e metade do
  // Atk; paralisia 25% de perder o turno; veneno 1/8; o tóxico, que cresce, ~1/8
  // na média de uma luta curta). Sono (Sleep Clause) e Drench (sem regra oficial)
  // ficam de fora.
  var STATUS_DUELO = {
    queimar: { residuo: 1 / 16, corteF: 0.5, imunes: ["Fire"] },
    congelar: { residuo: 1 / 16, corteE: 0.5, imunes: ["Ice"] },
    paralisar: { corte: 0.25, imunes: ["Electric"] },
    envenenar: { residuo: 1 / 8, imunes: ["Poison", "Steel"] },
    envenenarForte: { residuo: 1 / 8, imunes: ["Poison", "Steel"] },
    sangrar: { residuo: 1 / 16, imunes: ["Rock", "Ghost"] },
    medo: { recebeMais: 0.5, imunes: [] },
    confundir: { recuo: 0.33, imunes: [] },
    paixao: { corte: 0.5, imunes: [] },
    recuar: { imunes: [] },
    // Leech Seed (Fungal Infection): 1/8 do HP por turno, tipo Grass imune (regra da série).
    semente: { residuo: 1 / 8, imunes: ["Grass"] },
    // Preso (Infestation do Itchy Defense): 1/8 do HP por turno (regra da série).
    preso: { residuo: 1 / 8, imunes: [] },
    // Maldição (Haunted Spirit): 1/4 do HP por turno (Curse da série).
    maldicao: { residuo: 1 / 4, imunes: [] },
    // Prisão do Grappler: 1/6 por turno (texto da habilidade).
    presoForte: { residuo: 1 / 6, imunes: [] },
    // Sono: 1 a 3 turnos sem agir (série; Sleep Clause: um de cada vez) - na luta curta, ~metade dos turnos.
    sono: { corte: 0.5, imunes: [] }
  };
  // Efeito extra do golpe no NextDex (effT) -> status do duelo.
  var STATUS_DO_EFEITO_DUELO = {
    "Burn Hit": ["queimar"], "Frostbite Hit": ["congelar"], "Paralyze Hit": ["paralisar"], "Bleed Hit": ["sangrar"],
    "Poison Hit": ["envenenar"], "Poison Fang": ["envenenarForte"], "Confuse Hit": ["confundir"], "Flinch Hit": ["recuar"],
    "Attract Hit": ["paixao"], "Tri Attack": ["queimar", "congelar", "paralisar"], "Trap": ["preso"]
  };
  // Fire Fang, Thunder Fang, Ice Fang: recua OU o status do tipo do golpe.
  var STATUS_DO_TIPO_DUELO = { Fire: "queimar", Electric: "paralisar", Ice: "congelar" };
  // Palavras do texto do jogo -> status. "badly poison" antes de "poison".
  var PALAVRAS_DE_STATUS_DUELO = [
    { st: "envenenarForte", re: /badly poison/i },
    { st: "queimar", re: /\bburn|\bBRN\b/i },
    { st: "congelar", re: /frost|\bFRZ\b/i },
    { st: "paralisar", re: /paraly|\bPARA\b|\bPRLZ\b/i },
    { st: "envenenar", re: /(?<!badly )poison|\bPSN\b/i },
    { st: "sangrar", re: /bleed|\bBLD\b/i },
    { st: "confundir", re: /confus/i },
    { st: "recuar", re: /flinch/i },
    { st: "medo", re: /\bfear/i },
    { st: "paixao", re: /infatuat|attract/i },
    { st: "sono", re: /sleep|\bSLP\b/i }
  ];
  function statusDoTrechoDuelo(trecho) {
    return PALAVRAS_DE_STATUS_DUELO.filter(function (p) { return p.re.test(trecho); }).map(function (p) { return p.st; });
  }
  // Presença média de um status que entra com chance p por golpe, numa luta de n
  // turnos: média de 1-(1-p)^t. aPartirDe 0 = conta o turno antes do 1º golpe
  // (corte no dano do outro, quando ele bate antes); 1 = já vale no fim do turno
  // do golpe (dano residual, e corte quando eu bato antes).
  function presencaDoStatus(p, n, aPartirDe) {
    if (p <= 0 || n <= 0) return 0;
    if (p >= 1) return aPartirDe ? 1 : (n - 1) / n;
    var soma = (1 - Math.pow(1 - p, n)) / p; // soma de (1-p)^t, t = 0..n-1
    return aPartirDe ? 1 - (1 - p) * soma / n : 1 - soma / n;
  }
  function todosOsStatusDuelo(alvo) { Object.keys(STATUS_DUELO).forEach(function (s) { alvo[s] = true; }); }
  // Uma frase do texto da habilidade: imunidade ("Immune to confusion", "Cannot be
  // poisoned", "No burns", "Blocks flinch") e chance de causar status - no
  // ataque ("Biting moves have a 50% chance to burn", "Also works on offense") e
  // na defesa ("30% chance to burn on contact, 20% non", "when hit").
  function lerStatusDaFraseDuelo(f, ef, t) {
    var x, re, lista;
    if (/Immune to status|status conditions?\b[^.]*immune|Immune to [^.]*status conditions|Casts Safeguard on entry/i.test(f)) todosOsStatusDuelo(ef.imuneStatus);
    re = /(?:Immune to|Blocks|Cannot (?:be|become|get|fall)|Can't (?:be|become|get)|\bNo) ([^.;]*)|(\w+)[- ]immune/gi;
    while ((x = re.exec(f))) {
      var trecho = x[1] || x[2];
      if (/moves?\b|-type|\btype\b|damage/i.test(trecho)) continue;
      statusDoTrechoDuelo(trecho).forEach(function (s) { ef.imuneStatus[s] = true; if (s === "envenenar") ef.imuneStatus.envenenarForte = true; });
    }
    // Só o dano por turno (Heatproof "Takes no burn damage", Toxic Boost): o resto do status vale.
    re = /Takes no (\w+) damage|Immune to (\w+) status damage/gi;
    while ((x = re.exec(f))) {
      statusDoTrechoDuelo(x[1] || x[2]).forEach(function (s) { ef.semResiduoDe[s] = true; if (s === "envenenar") ef.semResiduoDe.envenenarForte = true; });
    }
    if (/no effect chance/i.test(f)) ef.imuneEfeitoDeGolpe = true;
    if (!(x = f.match(/(\d+)% chance to ([^.;]*)/i))) return;
    var p = parseInt(x[1], 10) / 100, verbo = x[2];
    var outro = f.match(/(\d+)% (?:on )?non(?:-contact)?\b/i);
    var pOutro = outro ? parseInt(outro[1], 10) / 100 : null;
    // "burn when hit or paralyze when dealing damage" (Arc Flash): duas partes.
    var partes = /when hit or \w+ when dealing/i.test(verbo) ? verbo.split(/ or /) : [verbo];
    partes.forEach(function (parte) {
      var todos = statusDoTrechoDuelo(parte);
      lista = todos;
      if (!lista.length) return;
      var porTipo = /respective types/i.test(f);
      var cada = porTipo ? p : p / todos.length; // "Burn or Poison": a chance se divide
      var ignoraGenero = /ignoring gender/i.test(f);
      var filtro = {};
      if (/Biting moves/i.test(f)) filtro.cat = "mordida";
      else if (/Slashing moves|Keen Edge moves/i.test(f)) filtro.cat = "corte";
      else if (/with punches|punching moves/i.test(f)) filtro.cat = "soco";
      else if (/Sound(?:-based)? moves/i.test(f)) filtro.som = true;
      else if (/Contact moves|with contact moves/i.test(f)) filtro.contato = true;
      else if ((x = f.match(/^(\w+) moves have/i)) && tipoDoTextoDuelo(x[1])) filtro.tipo = tipoDoTextoDuelo(x[1]);
      if (/special attacks/i.test(f)) filtro.especial = true;
      var noContato = /on contact(?! moves)|if hit by a contact|makes contact|get \w+ on contact/i.test(parte + " " + f);
      var defesa = partes.length > 1 ? /when hit/i.test(parte) : (noContato || /when hit|if hit by/i.test(f));
      var ataque = partes.length > 1 ? /when dealing/i.test(parte) : (!defesa || /works on offense|or offense/i.test(t));
      var pc = cada, po = noContato ? (pOutro === null ? 0 : pOutro / (porTipo ? 1 : todos.length)) : cada;
      var entrada = { st: lista, pContato: pc, pOutro: po, filtro: filtro, porTipo: porTipo, ignoraGenero: ignoraGenero };
      if (defesa) ef.statusDefesa.push(entrada);
      if (ataque) ef.statusAtaque.push(entrada);
    });
  }
  // ---------- crítico (2026-09-29) ----------
  // A fonte oficial não redefine o crítico: vale o da série - chance por estágio
  // 1/24, 1/8, 1/2 e sempre (+3), dano 1,5x. O golpe traz "High Crit Rate" e
  // "Always Crits" nos flags do dado.
  var CHANCE_CRIT_DUELO = [1 / 24, 1 / 8, 1 / 2, 1];
  function chanceDoEstagioCrit(n) { return CHANCE_CRIT_DUELO[Math.max(0, Math.min(3, n))]; }
  function lerCriticoDaFraseDuelo(f, ef) {
    var x;
    if ((x = f.match(/Raises critical-hit ratio of own moves by \+(\d)|Ups crit level by \+(\d)/i))) ef.critEstagio += parseInt(x[1] || x[2], 10);
    if ((x = f.match(/Boosts each battler's crit rate by \+(\d)/i))) { ef.critEstagio += parseInt(x[1], 10); ef.critTodos += parseInt(x[1], 10); }
    if ((x = f.match(/Contact moves get \+(\d) Crit/i))) ef.critContato += parseInt(x[1], 10);
    if ((x = f.match(/Move BP < (\d+) BP: \+(\d) to crit/i))) ef.critBP = { limite: parseInt(x[1], 10), n: parseInt(x[2], 10) };
    if ((x = f.match(/^(\w+) moves get \+(\d) crit/i))) categoriasDoTextoDuelo(x[1]).forEach(function (c) { ef.critCategoria[c] = parseInt(x[2], 10); });
    if ((x = f.match(/^([A-Z][\w' -]+?) always crits\./))) ef.sempreCritGolpe[x[1]] = true;
    if (/Super-effective moves [^.]*always crit/i.test(f)) ef.critSuperEf = true;
    if (/Always crits [^.]*foes/i.test(f)) ef.critContraStatus = ["envenenar", "envenenarForte", "paralisar", "sangrar"];
    if (/Guaranteed critical hit on first turn/i.test(f)) ef.critPrimeiroTurno = true;
    if ((x = f.match(/Critical hits have a ([\d.]+)x dmg multiplier/i))) ef.critMult = Math.max(ef.critMult, parseFloat(x[1]));
    if ((x = f.match(/Critical hits get a ([\d.]+)x boost/i))) ef.critMult *= parseFloat(x[1]);
    if ((x = f.match(/Crits [^.]*do (\d+)x damage vs resists/i))) ef.critVsResistido = parseInt(x[1], 10);
    if (/Critical hits (?:also )?inflict bleeding|and inflict bleeding/i.test(f)) ef.critSangra = true;
    if (/immune to critical hits|Isn't affected by [^.]*crits|Foes can't crit/i.test(f)) ef.imuneCritico = true;
    if (/Takes 1\/4 damage from crits/i.test(f)) ef.critRecebido = 0.25;
  }
  // ---------- condições da luta (2026-09-29) ----------
  // Status no próprio Pokémon (Guts, Flare Boost...), ordem do turno (Analytic),
  // HP cheio (Tera Shell, Blitz Boxer), alvo abaixo da metade (Opportunist),
  // golpe extra (Thundercall), reviver (Shallow Grave) e cura do próprio status.
  var STAT_DO_TEXTO_DUELO = { atk: "atk", "sp. atk": "spa", "sp.atk": "spa", spatk: "spa", def: "def", spdef: "spd", "sp. def": "spd", speed: "spe" };
  var QUAIS_STATUS_DO_TEXTO = { burned: ["queimar"], poisoned: ["envenenar", "envenenarForte"], paralyzed: ["paralisar"], frostbitten: ["congelar"], bleeding: ["sangrar"] };
  function lerCondicaoDaFraseDuelo(f, ef, climaOk) {
    var x;
    if ((x = f.match(/Ups (Atk|Sp\. ?Atk|SpAtk|Def|SpDef|Sp\. ?Def|Speed) by ([\d.]+)x (?:if|when|while) (suffering from a status condition|statused|burned|poisoned|paralyzed|frostbitten|bleeding)/i))) {
      ef.statusProprio.push({ stat: STAT_DO_TEXTO_DUELO[x[1].toLowerCase()], mult: parseFloat(x[2]), quais: QUAIS_STATUS_DO_TEXTO[x[3].toLowerCase()] || null });
    }
    if ((x = f.match(/Gets a ([\d.]+)x boost while statused/i))) ef.statusProprio.push({ stat: "dano", mult: parseFloat(x[1]), quais: null });
    if ((x = f.match(/Attacks get a ([\d.]+)x power boost if it moves last/i))) ef.ultimoMult = Math.max(ef.ultimoMult, parseFloat(x[1]));
    if ((x = f.match(/\+(\d) crit rate when moving last/i))) ef.critUltimo = parseInt(x[1], 10);
    if ((x = f.match(/Takes (\d+)% less damage if it hasn't moved yet/i))) ef.antesReducao = parseInt(x[1], 10) / 100;
    if (/\+1 priority vs foes below 1\/2/i.test(f)) ef.prioNoFinal = true;
    if ((x = f.match(/At full HP, gives \+1 priority to this Pok\S+ (\w+) moves/i))) categoriasDoTextoDuelo(x[1]).forEach(function (c) { ef.prioCheioCategoria[c] = true; });
    if (/Sound moves get \+1 priority at full HP/i.test(f)) ef.prioCheioSom = true;
    if (/All hits will be not very effective while at full HP/i.test(f)) ef.teraShell = true;
    if (/Halves damage taken while at full HP/i.test(f)) ef.reducao.todos *= 0.75; // como Multiscale: metade da luta, em média
    if ((x = f.match(/Triggers ([A-Z][\w ]+?) at (\d+)% power when using an? (\w+) move/)) && tipoDoTextoDuelo(x[3]) && MOVE_ID_BY_NAME[x[1]] !== undefined) {
      ef.seguimento = { tipo: tipoDoTextoDuelo(x[3]), poder: MOVES[MOVE_ID_BY_NAME[x[1]]][3] * parseInt(x[2], 10) / 100 };
    }
    if ((x = f.match(/Revives at (\d+)% HP once after fainting in (fog|rain|sun|sand|hail)/i)) && climaOk(x[2])) ef.reviveHP = parseInt(x[1], 10) / 100;
    if ((x = f.match(/(\d+)% chance to heal (?:its|user or ally's) status/i))) ef.curaStatus = Math.max(ef.curaStatus, parseInt(x[1], 10) / 100);
    if ((x = f.match(/Cures own status at the end of every turn in (sun|rain|sand|hail|fog)/i)) && climaOk(x[1])) ef.curaStatus = 1;
  }
  // ---------- estágios de atributo (2026-09-29) ----------
  // Regra da série: estágio +n multiplica por (2+n)/2, -n por 2/(2+n), limite ±6.
  // No duelo vale o estágio MÉDIO ao longo da luta: o que entra na entrada vale
  // inteiro; o que muda a cada golpe (Stamina, Whiplash, Crunch...) acumula e
  // vale, em média, (n-1)/2 vezes numa luta de n turnos.
  var ESTAGIO_DO_TEXTO_DUELO = { attack: "atk", atk: "atk", defense: "def", def: "def", "sp. atk": "spa", spatk: "spa", "sp.atk": "spa",
    "special attack": "spa", "sp. def": "spd", spdef: "spd", "special defense": "spd", speed: "spe" };
  function estagioDoTexto(p) { return ESTAGIO_DO_TEXTO_DUELO[String(p).toLowerCase().replace(/\s+/g, " ").trim()] || null; }
  function multDoEstagio(n) { n = Math.max(-6, Math.min(6, n)); return n >= 0 ? (2 + n) / 2 : 2 / (2 - n); }
  var NUM_DO_TEXTO_DUELO = { one: 1, two: 2, three: 3 };
  function lerEstagioDaFraseDuelo(f, ef, climaOk, t) {
    var x, re, stat, tipos;
    // Entrada.
    if ((x = f.match(/On entry, raises (Attack|Defense|Sp\. Atk|SpAtk|Sp\. Def|SpDef|Speed) by (one|two) stages?/i)) && (stat = estagioDoTexto(x[1]))) ef.estagioEntrada[stat] = (ef.estagioEntrada[stat] || 0) + NUM_DO_TEXTO_DUELO[x[2].toLowerCase()];
    // Também "+1 Attack/Defense on Entry" (Embody Aspect do Ogerpon - achado pelo teste de
    // auditoria do motor, 2026-09-30: as formas de Ataque e Defesa não eram lidas).
    if ((x = f.match(/\+(\d) (SpDef|Spdef|Def|Atk|SpAtk|Speed|Attack|Defense|Sp\. Atk|Sp\. Def) on entry/i)) && (stat = estagioDoTexto(x[2]))) ef.estagioEntrada[stat] = (ef.estagioEntrada[stat] || 0) + parseInt(x[1], 10);
    if (/Raises Atk\/Sp\. Atk by one stage depending on opponent/i.test(f)) ef.download = true;
    // Ao ser atingido (no próprio Pokémon).
    if ((x = f.match(/Getting hit raises (Def|Atk|SpAtk)(?: by \+(\d))?/i))) ef.aoApanhar.push({ stat: estagioDoTexto(x[1]), n: x[2] ? parseInt(x[2], 10) : 1 });
    if ((x = f.match(/Boosts (SpDef|Def) \+(\d) when hit/i))) ef.aoApanhar.push({ stat: estagioDoTexto(x[1]), n: parseInt(x[2], 10) });
    if (/If hit by a contact attack: -1 Defense and \+2 Speed/i.test(f)) { ef.aoApanhar.push({ stat: "def", n: -1, contato: true }); ef.aoApanhar.push({ stat: "spe", n: 2, contato: true }); }
    if ((x = f.match(/If hit by ([\w, ]+?) move[^:]*: \+1 Speed/i))) {
      tipos = x[1].split(/,\s*|\s+or\s+/).map(tipoDoTextoDuelo).filter(Boolean);
      if (tipos.length) ef.aoApanhar.push({ stat: "spe", n: 1, tipos: tipos });
    }
    if ((x = f.match(/Maximizes Speed if hit by a (\w+)-type or (\w+)-type attack/i))) ef.aoApanhar.push({ stat: "spe", n: 6, tipos: [x[1], x[2]].map(tipoDoTextoDuelo).filter(Boolean) });
    if ((x = f.match(/Boosts Attack and Def when hit by (\w+) or (\w+)/i))) {
      tipos = [x[1], x[2]].map(tipoDoTextoDuelo).filter(Boolean);
      ef.aoApanhar.push({ stat: "atk", n: 1, tipos: tipos }); ef.aoApanhar.push({ stat: "def", n: 1, tipos: tipos });
    }
    if ((x = f.match(/Ups Def and Sp\. Def by one stage if hit by (\w+) or (\w+) moves/i))) {
      tipos = [x[1], x[2]].map(tipoDoTextoDuelo).filter(Boolean);
      ef.aoApanhar.push({ stat: "def", n: 1, tipos: tipos }); ef.aoApanhar.push({ stat: "spd", n: 1, tipos: tipos });
    }
    // Ao ser atingido (no atacante): Gooey, Tangling Hair, Cotton Down.
    if (/Lowers Speed of enemies that make contact/i.test(f)) ef.aoApanharAtacante.push({ stat: "spe", n: -1, contato: true });
    if (/Lowers the Speed of all foes by one stage when hit/i.test(f)) ef.aoApanharAtacante.push({ stat: "spe", n: -1 });
    // A cada turno.
    if (/Raises own Speed by one stage after every turn/i.test(f)) ef.porTurno.spe = 1;
    // Ao golpear (no alvo): Whiplash, Chainsaw, Denting Blows.
    if (/^Physical attacks lower defense/i.test(f)) ef.aoGolpear.push({ stat: "def", n: -1, cat: "F" });
    if ((x = f.match(/^(Keen edge|Hammer|Slicing|Biting|Punching) (?:attacks|moves) lower Defense(?: by -?(\d))?/i))) {
      categoriasDoTextoDuelo(/keen/i.test(x[1]) ? "slicing" : x[1]).forEach(function (c) { ef.aoGolpear.push({ stat: "def", n: -(x[2] ? parseInt(x[2], 10) : 1), categoria: c }); });
    }
    // Quando o rival reduz os atributos: Competitive, Defiant, Run Away.
    if ((x = f.match(/Raises (Sp\. Atk|Attack) by two stages if stats are lowered by an enemy/i))) ef.aoSerReduzido[estagioDoTexto(x[1])] = 2;
    if (/Raises Speed if stats lowered by an enemy/i.test(f)) ef.aoSerReduzido.spe = 1;
    // Imunidade a quedas (também barra Intimidate/Scare, como na série).
    if (/Immune to stat drops|Bounces back any stat drops/i.test(f)) { ["atk", "def", "spa", "spd", "spe"].forEach(function (s) { ef.imuneQuedas[s] = true; }); ef.imuneIntimida = true; ef.imuneAssusta = true; }
    if (/Enemies can't lower Atk\/SpAtk/i.test(f)) { ef.imuneQuedas.atk = true; ef.imuneQuedas.spa = true; ef.imuneIntimida = true; ef.imuneAssusta = true; }
    if (/Ignores foes' stat changes/i.test(f)) ef.ignoraEstagios = true;
    if (/Doubles all stat changes/i.test(f)) ef.estagioMult *= 2;
    if (/Stat raises turn into stat drops/i.test(f)) ef.estagioMult *= -1;
    re = /Lowers the (Attack|Defense|Special Attack|Special Defense) of other Pokemon by (\d+)%/gi;
    while ((x = re.exec(f))) ef.ruina[estagioDoTexto(x[1])] = 1 - parseInt(x[2], 10) / 100;
    if (/Boosts highest attack by \+1 when at 1\/2 of max HP/i.test(f)) ef.berserk = true;
    // Last Stand: cresce até o máximo conforme o HP cai - na média da luta, metade do caminho.
    if (/Def and SpDef increase as HP drops/i.test(f) && (x = t.match(/increase as HP drops\. Max ([\d.]+)x/i))) { ef.defMult *= (1 + parseFloat(x[1])) / 2; ef.spdMult *= (1 + parseFloat(x[1])) / 2; }
    if ((x = f.match(/Does (\d+)% more damage if the target has any lowered stat/i))) ef.bonusContraReduzido = 1 + parseInt(x[1], 10) / 100;
    if ((x = f.match(/Raises Atk by ([\d.]+)x in (sun|rain|sand|hail|fog)/i)) && climaOk(x[2])) ef.atkMult *= parseFloat(x[1]);
    // Primeiro golpe da categoria com prioridade (Coil Up, Cutthroat, Sidewinder): vale no 1º golpe.
    if ((x = f.match(/first ((?:Keen )?\w+) move[^.]*\+1 priority|\+1 priority once to the first (\w+) move/i))) categoriasDoTextoDuelo(x[1] || x[2]).forEach(function (c) { ef.prioCheioCategoria[c] = true; });
  }
  // ---------- golpes extras, bloqueio e entrada (2026-09-29) ----------
  function poderDoGolpeDuelo(nome) { var id = MOVE_ID_BY_NAME[nome]; return id === undefined ? 0 : MOVES[id][3]; }
  var CATEGORIA_DO_SEGUIMENTO = { "dance": "danca", "sound": "som", "mega launcher": "pulso", "damaging": "todos" };
  function lerExtrasDaFraseDuelo(f, ef, climaOk) {
    var x;
    if (/Doubles attack on first turn/i.test(f)) ef.primeiroTurnoMult = 2;
    if (/Moves that need a charge turn are now used instantly/i.test(f)) ef.cargaInstantanea = true;
    if (/Can't use attacking moves twice in a row/i.test(f)) ef.truant = true;
    if (/Protects once against an attack/i.test(f)) ef.bloqueiaUmGolpe = true;
    if ((x = f.match(/Counters contact with (\d+)\s?BP/i))) ef.contraAtaque = { poder: parseInt(x[1], 10) };
    // Golpe de graça na entrada (Cheap Tactics, Low Blow, Jumpscare).
    if ((x = f.match(/Attacks with (?:(\d+)\s?BP )?([A-Z][\w-]+(?: [A-Z][\w-]+)?) on (?:first )?switch-in/))) ef.ataqueNaEntrada = x[1] ? parseInt(x[1], 10) : poderDoGolpeDuelo(x[2]);
    // Seguimento por categoria (Two Step, Pyro Shells, Chunky Bass Line, Aftershock).
    if ((x = f.match(/Triggers (?:a )?(\d+)\s?BP [\w ]+? after using a (Dance|sound|Mega Launcher) move/i))) ef.seguimentoCategoria.push({ quais: CATEGORIA_DO_SEGUIMENTO[x[2].toLowerCase()], poder: parseInt(x[1], 10) });
    if (/Triggers Magnitude 4-7 after using a damaging move/i.test(f)) ef.seguimentoCategoria.push({ quais: "todos", poder: 40 }); // média de 10/30/50/70
    // Estágio ao usar golpe da categoria (Growing Tooth, Hardened Sheath).
    if ((x = f.match(/Raises Attack by one stage after using a (\w+) move|Ups Attack by \+1 when using (\w+) moves/i))) {
      categoriasDoTextoDuelo(x[1] || x[2]).forEach(function (c) { ef.aoUsar.push({ stat: "atk", n: 1, categoria: c }); });
    }
    // Moody: +2 num atributo e -1 noutro por turno, entre 5 - em média +0,2 em cada.
    if (/Sharply raises one stat and lowers another each turn/i.test(f)) ["atk", "def", "spa", "spd", "spe"].forEach(function (s) { ef.porTurno[s] = (ef.porTurno[s] || 0) + 0.2; });
    if (/Clears stat buffs (?:on entry|then)/i.test(f)) ef.limpaBuffsNaEntrada = true;
    if (/then lowers speed by one stage on entry/i.test(f)) ef.quedaNaEntrada.spe = -1;
    if (/On entry, raises highest calculated stat by one stage/i.test(f)) ef.maiorNaEntrada = 1;
    if ((x = f.match(/Ups highest stat by \+1 on entry (?:when it rains|when sunny|in fog|in sand|in hail)/i))) {
      var cl = /rain/i.test(x[0]) ? "rain" : /sun/i.test(x[0]) ? "sun" : /fog/i.test(x[0]) ? "fog" : /sand/i.test(x[0]) ? "sand" : "hail";
      if (climaOk(cl)) ef.maiorNaEntrada = 1;
    }
    if (/Sharply ups highest attacking stat[^.]*on entry/i.test(f)) ef.maiorAtaqueNaEntrada = 2;
    if (/Applies Shell Smash when reduced below 1\/2 HP/i.test(f)) ef.shellSmashNaMetade = true;
    if (/Inverts Intimidate effects/i.test(f)) { ef.inverteIntimida = true; ef.imuneIntimida = true; }
    if (/Doubles stat drop effects used by this pok/i.test(f)) ef.dobraQuedas = true;
    // "Sound moves cause bleeding" (Piercing Solo): status certo, sem chance.
    if ((x = f.match(/^(Sound|Contact|Biting|Slashing|Punching) moves cause (\w+)/i))) {
      var sts = statusDoTrechoDuelo(x[2]).filter(function (s) { return s !== "sono"; });
      var filtro = /sound/i.test(x[1]) ? { som: true } : /contact/i.test(x[1]) ? { contato: true } : { cat: categoriasDoTextoDuelo(x[1])[0] };
      if (sts.length) ef.statusAtaque.push({ st: sts, pContato: 1, pOutro: 1, filtro: filtro, porTipo: false, ignoraGenero: false });
    }
    // Status encadeado (Poison Puppeteer, Entrance).
    if ((x = f.match(/^(Poison|Confusion|Burn|Paralysis) also inflicts? (\w+)/i))) {
      var de = statusDoTrechoDuelo(x[1]), para = statusDoTrechoDuelo(x[2]);
      de.forEach(function (s) { if (para[0]) ef.encadeiaStatus[s] = para[0]; });
      if (ef.encadeiaStatus.envenenar) ef.encadeiaStatus.envenenarForte = ef.encadeiaStatus.envenenar;
    }
    // Leech Seed por contato (Fungal Infection): 1/8 do HP por turno, Grass imune.
    if (/Contact moves inflict Leech Seed/i.test(f)) ef.statusAtaque.push({ st: ["semente"], pContato: 1, pOutro: 0, filtro: { contato: true }, porTipo: false, ignoraGenero: false });
  }
  // ---------- cura, recuo e dano por contato (2026-09-29) ----------
  // Cura por turno (Self Sufficient, Ice Body no granizo...), dreno do dano
  // causado (Energy Tap, Nosferatu, golpes que drenam), dano no atacante que faz
  // contato (Rough Skin, Iron Barbs) e o recuo dos golpes (Rock Head anula,
  // Reckless reforça). O recuo e o dreno do golpe vêm do dado (move_categorias).
  function lerCuraDaFraseDuelo(f, ef, climaOk) {
    var x;
    if ((x = f.match(/Recovers 1\/(\d+) of max HP at the end of each turn/i))) ef.curaPorTurno += 1 / parseInt(x[1], 10);
    if ((x = f.match(/Heals 1\/(\d+) of max HP every turn (?:in|if|under) (hail|rain|fog|sun|sand)/i)) && climaOk(x[2])) ef.curaPorTurno += 1 / parseInt(x[1], 10);
    if ((x = f.match(/Restores 1\/(\d+) of max HP after each turn if poisoned/i))) {
      ef.curaEnvenenado = 1 / parseInt(x[1], 10); ef.semResiduoDe.envenenar = true; ef.semResiduoDe.envenenarForte = true;
    }
    if ((x = f.match(/Heals the user for 1\/(\d+) of the damage they deal/i))) ef.drenoPct += 1 / parseInt(x[1], 10);
    if ((x = f.match(/Contact moves do \+(\d+)% damage and heal 1\/(\d+) of damage dealt/i))) { ef.contatoMult *= 1 + parseInt(x[1], 10) / 100; ef.drenoContato = 1 / parseInt(x[2], 10); }
    if ((x = f.match(/Enemies lose 1\/(\d+) of max HP if they use a contact move|1\/(\d+) HP damage when touched/i))) ef.danoAoContato = Math.max(ef.danoAoContato, 1 / parseInt(x[1] || x[2], 10));
    if (/Immune to recoil damage/i.test(f)) ef.semRecuo = true;
    if ((x = f.match(/Moves causing recoil damage deal ([\d.]+)x more damage/i))) ef.recuoMult = parseFloat(x[1]);
    if ((x = f.match(/Does (\d+)% more damage but lose (\d+)% HP when attacking/i))) { ef.danoMult *= 1 + parseInt(x[1], 10) / 100; ef.custoPorAtaque = parseInt(x[2], 10) / 100; }
    if ((x = f.match(/(\w+)-type moves are boosted by (\d+)% with (\d+)% recoil/i)) && tipoDoTextoDuelo(x[1])) {
      ef.bonusTipo[tipoDoTextoDuelo(x[1])] = Math.max(ef.bonusTipo[tipoDoTextoDuelo(x[1])] || 1, 1 + parseInt(x[2], 10) / 100);
      ef.custoTipo[tipoDoTextoDuelo(x[1])] = parseInt(x[3], 10) / 100;
    }
    if ((x = f.match(/(\w+) and (\w+) deal ([\d.]+)x with (\d+)% recoil/i))) {
      [x[1], x[2]].map(tipoDoTextoDuelo).filter(Boolean).forEach(function (tp) {
        ef.bonusTipo[tp] = Math.max(ef.bonusTipo[tp] || 1, parseFloat(x[3])); ef.custoTipo[tp] = parseInt(x[4], 10) / 100;
      });
    }
    if (/Foes can't heal in any way/i.test(f)) ef.bloqueiaCura = true;
    if (/Draining causes harm to enemies/i.test(f)) ef.liquidOoze = true;
  }
  // ---------- diversos (2026-09-29): o resto que muda um duelo 1x1 ----------
  // Palavra do texto -> filtro de golpe: categoria (soco, chute...), som, contato,
  // golpe especial ou tipo.
  function filtroDoTextoDuelo(palavra) {
    if (/^sound/i.test(palavra)) return { som: true };
    if (/^contact/i.test(palavra)) return { contato: true };
    if (/^special/i.test(palavra)) return { especial: true };
    if (/^(every|all|moves|attacks)$/i.test(palavra)) return {};
    var tp = tipoDoTextoDuelo(palavra);
    if (tp) return { tipo: tp };
    var c = categoriasDoTextoDuelo(palavra);
    return c.length ? { cat: c[0] } : null;
  }
  function empurraStatusDuelo(ef, lista, sts, p, filtro, pOutro) {
    if (sts.length && filtro) lista.push({ st: sts, pContato: p / sts.length, pOutro: (pOutro === undefined ? p : pOutro) / sts.length, filtro: filtro, porTipo: false, ignoraGenero: false });
  }
  function lerDiversosDaFraseDuelo(f, ef, climaOk) {
    var x, fl;
    // Chance de status multiplicada (Pyromancy "burn 5x as often", Corrupted Mind).
    if ((x = f.match(/Moves inflict (\w+) (\d+)x as often/i))) statusDoTrechoDuelo(x[1]).forEach(function (s) { ef.multStatus[s] = parseInt(x[2], 10); });
    if ((x = f.match(/(\w+) moves ignore resists and get ([\d.]+)x effect chance/i)) && tipoDoTextoDuelo(x[1])) {
      ef.ignoraResist[tipoDoTextoDuelo(x[1])] = true; ef.multChanceTipo[tipoDoTextoDuelo(x[1])] = parseFloat(x[2]);
    }
    // Status por categoria/tipo, com ou sem "%" na frente.
    if ((x = f.match(/^(\w+) moves have an? (\d+)% (\w+) chance/i)) && (fl = filtroDoTextoDuelo(x[1]))) empurraStatusDuelo(ef, ef.statusAtaque, statusDoTrechoDuelo(x[3]), parseInt(x[2], 10) / 100, fl);
    if ((x = f.match(/^(\w+) moves have an? (\d+)% (?:chance )?to cause (\w+)/i)) && (fl = filtroDoTextoDuelo(x[1]))) empurraStatusDuelo(ef, ef.statusAtaque, statusDoTrechoDuelo(x[3]), parseInt(x[2], 10) / 100, fl);
    if ((x = f.match(/Every attack has an? (\d+)% (\w+) chance(?: and (\d+)% (\w+) chance)?/i))) {
      empurraStatusDuelo(ef, ef.statusAtaque, statusDoTrechoDuelo(x[2]), parseInt(x[1], 10) / 100, {});
      if (x[3]) empurraStatusDuelo(ef, ef.statusAtaque, statusDoTrechoDuelo(x[4]), parseInt(x[3], 10) / 100, {});
    }
    if ((x = f.match(/^(\w+) moves inflict (\w+)/i)) && (fl = filtroDoTextoDuelo(x[1]))) empurraStatusDuelo(ef, ef.statusAtaque, statusDoTrechoDuelo(x[2]), 1, fl);
    if ((x = f.match(/(\d+)% to inflict ([\w/]+) when hit by contact/i))) empurraStatusDuelo(ef, ef.statusDefesa, statusDoTrechoDuelo(x[2]), parseInt(x[1], 10) / 100, {}, 0);
    if ((x = f.match(/Inflicts (\w+) and lowers Speed on contact/i))) {
      empurraStatusDuelo(ef, ef.statusDefesa, statusDoTrechoDuelo(x[1]), 1, {}, 0);
      ef.aoApanharAtacante.push({ stat: "spe", n: -1, contato: true });
    }
    if ((x = f.match(/^(Burns|Poisons|Paralyzes|Frostbites) the foe on contact/i))) {
      empurraStatusDuelo(ef, ef.statusDefesa, statusDoTrechoDuelo(x[1]), 1, {}, 0);
      if (/works on offense/i.test(f)) empurraStatusDuelo(ef, ef.statusAtaque, statusDoTrechoDuelo(x[1]), 1, {}, 0);
    }
    if ((x = f.match(/Inflicting (\w+) also inflicts (\w+)/i))) {
      var para = statusDoTrechoDuelo(x[2]).filter(function (s) { return s !== "sono"; })[0];
      if (para) statusDoTrechoDuelo(x[1]).forEach(function (s) { ef.encadeiaStatus[s] = para; });
    }
    if ((x = f.match(/^(\w+) causes flinching/i))) statusDoTrechoDuelo(x[1]).forEach(function (s) { ef.encadeiaStatus[s] = "recuar"; });
    if (/Is always bleeding if not immune/i.test(f)) {
      ef.campoResiduo.push({ pct: 1 / 16, exceto: ["Rock", "Ghost"], soProprio: true });
      if (/Spreads on contact/i.test(f)) { empurraStatusDuelo(ef, ef.statusDefesa, ["sangrar"], 1, {}, 0); empurraStatusDuelo(ef, ef.statusAtaque, ["sangrar"], 1, { contato: true }); }
    }
    if (/Uses Teeter Dance on entry/i.test(f)) ef.statusNaEntrada.confundir = 1;
    // Evasão (Sand Veil, Snow Cloak, Rain Shroud, Olé!).
    if ((x = f.match(/Evasion is boosted by ([\d.]+)x (?:while a |under |in )(sandstorm|sand|hail|fog|rain)/i)) && climaOk(x[2] === "sandstorm" ? "sand" : x[2])) ef.evasao *= parseFloat(x[1]);
    if ((x = f.match(/Ups evasion by (\d+)% in (rain|sun|sand|hail|fog)/i)) && climaOk(x[2])) ef.evasao *= 1 + parseInt(x[1], 10) / 100;
    if ((x = f.match(/(\d+)% chance to evade single-target moves/i))) ef.evasao /= 1 - parseInt(x[1], 10) / 100;
    if ((x = f.match(/In (fog|rain|sun|sand|hail), deal (\d+)% more damage and never miss/i)) && climaOk(x[1])) { ef.danoMult *= 1 + parseInt(x[2], 10) / 100; ef.semErrar = true; }
    // Imunidade a golpes por marcação (Bulletproof, Soundproof).
    if (/Immune to projectile, ball, or bomb-based moves/i.test(f)) ef.imuneFlag["Bullet Move"] = true;
    if (/Immune to sound-based moves/i.test(f)) ef.imuneFlag["Sound Based"] = true;
    // Tabela de tipos alterada pelo atacante.
    function troca(atq, def, mult) { ef.contraTipo[atq] = ef.contraTipo[atq] || {}; ef.contraTipo[atq][def] = mult; }
    if (/^Hits Ghost-type Pok/i.test(f)) { troca("Normal", "Ghost", 1); troca("Fighting", "Ghost", 1); }
    if (/Ghost-type moves deal normal damage to Normal/i.test(f)) troca("Ghost", "Normal", 1);
    if (/Target Grounds aren't immune to Electric but resist it/i.test(f)) troca("Electric", "Ground", 0.5);
    if (/Its moves become Normal-type, get ([\d.]+)x boost, ignore resists/i.test(f)) {
      x = f.match(/get ([\d.]+)x boost/i);
      TYPES.forEach(function (tp) { if (tp && tp !== "Normal") ef.converte[tp] = { para: "Normal", mult: parseFloat(x[1]) }; });
      ef.bonusTipo.Normal = Math.max(ef.bonusTipo.Normal || 1, parseFloat(x[1]));
      ef.ignoraResist.Normal = true;
    }
    if ((x = f.match(/^(\w+) moves become (\w+)-type/i)) && tipoDoTextoDuelo(x[1]) && tipoDoTextoDuelo(x[2])) ef.converte[tipoDoTextoDuelo(x[1])] = { para: tipoDoTextoDuelo(x[2]), mult: 1 };
    if (/Bone moves ignore immunities and deal 2x on not very effective/i.test(f)) { ef.flagMult["Bone Based"] = { ignoraImune: true, nveX2: true }; }
    if (/Other battlers don't benefit from STAB/i.test(f)) ef.semStabOutros = true;
    // Bloqueios de golpe inteiro.
    if (/Dodges one Super-effective hit/i.test(f)) ef.bloqueiaSuperEf = true;
    if (/Is only hit by Super-effective attacks/i.test(f)) ef.soSuperEf = true;
    if ((x = f.match(/Gets no damage for (?:the )?first (two )?hits?/i))) ef.bloqueios = Math.max(ef.bloqueios, x[1] ? 2 : 1);
    if (/Sets up Protect on switch-in/i.test(f)) ef.bloqueios = Math.max(ef.bloqueios, 1);
    if (/Endures the? a single KO|Endures a single KO/i.test(f)) ef.aguenta = true;
    if (/Heal 1\/4 of max HP whenever below 1\/2/i.test(f)) ef.reviveHP = Math.max(ef.reviveHP, 0.25);
    if (/Changes type to a resist or an immunity before getting hit/i.test(f)) ef.sempreResiste = 1;
    if ((x = f.match(/Resists all attacks for (\w+) turns on first entry/i))) ef.sempreResiste = NUM_DO_TEXTO_DUELO[x[1].toLowerCase()] || 3;
    if (/Changes type depending on the move it's about to use|changes its type to the move's type/i.test(f)) ef.stabTodos = true;
    // Redução de dano geral.
    if ((x = f.match(/Takes (\d+)% reduced damage/i))) ef.reducao.todos *= 1 - parseInt(x[1], 10) / 100;
    if ((x = f.match(/Reduces damage taken by (\d+)%, but lowers speed by (\d+)%/i))) { ef.reducao.todos *= 1 - parseInt(x[1], 10) / 100; ef.speMult *= 1 - parseInt(x[2], 10) / 100; }
    if ((x = f.match(/Takes (\d+)% less damage from attacks, (\d+)% if resisted/i))) ef.reducao.todos *= 1 - parseInt(x[1], 10) / 100;
    if ((x = f.match(/Halves dmg taken by (\w+) moves/i)) && tipoDoTextoDuelo(x[1])) ef.resistTipo[tipoDoTextoDuelo(x[1])] = 0.5;
    if (/^Fire\/Sun hurts/i.test(f)) ef.resistTipo.Fire = 1.25; // Dry Skin: Fire 1,25x, como na série
    if (/Super-effective moves never miss and ignore abilities/i.test(f)) ef.seQuebra = true; // Deadly Precision
    if (/Inflicting poison also lowers Attack, SpAtk, and Speed/i.test(f)) ef.venenoReduz = true; // Neurotoxin
    if ((x = f.match(/Makes foe (\w+)-type on contact/i)) && tipoDoTextoDuelo(x[1])) ef.mudaTipoNoContato = tipoDoTextoDuelo(x[1]); // Damp, Magical Dust
    if ((x = f.match(/(\d+) turns Aurora Veil on entry/i))) ef.telaNaEntrada = parseInt(x[1], 10);
    if (/Uses Magnet Rise on entry/i.test(f)) ef.imuneTipoNaEntrada = "Ground";
    if (/gains \+2 Speed when when hit by rocks|gains \+2 Speed when hit by rocks/i.test(f)) ef.aoApanhar.push({ stat: "spe", n: 2, tipos: ["Rock"] });
    // Rivalry: gênero desconhecido - vale metade das vezes, nos dois sentidos.
    if (/^Deals 1\.25x to same gender/i.test(f)) ef.danoMult *= 1.125;
    if (/^Takes \.75x from opposite gender/i.test(f)) ef.reducao.todos *= 0.875;
    if (/Enemies inflicting status on this Pok\S+ get same status/i.test(f)) ef.sincroniza = true;
    if (/Enemies take all the damage they deal, same for this Pok/i.test(f)) ef.almaLigada = true;
    if ((x = f.match(/Heals for (\d+)% of the damage dealt by (\w+) moves/i))) categoriasDoTextoDuelo(x[2]).forEach(function (c) { ef.drenoCategoria[c] = parseInt(x[1], 10) / 100; });
    if (/Causes infestation when hit by a contact move/i.test(f)) empurraStatusDuelo(ef, ef.statusDefesa, ["preso"], 1, {}, 0);
    // Atributo emprestado (Slipstream, Terminal Velocity, Best Offense, Sleek Scales).
    if ((x = f.match(/^(Special |Physical )?[Mm]oves use (\d+)% of its (Speed|SpDef|Def) stat additionally/i))) {
      ef.ataqueExtra.push({ fonte: /speed/i.test(x[3]) ? "spe" : /spdef/i.test(x[3]) ? "spd" : "def", pct: parseInt(x[2], 10) / 100, cat: x[1] ? (/special/i.test(x[1]) ? "E" : "F") : undefined });
    }
    if ((x = f.match(/use (\d+)% of (spdef|def|speed) during moves/i))) ef.ataqueExtra.push({ fonte: /speed/i.test(x[2]) ? "spe" : /spdef/i.test(x[2]) ? "spd" : "def", pct: parseInt(x[1], 10) / 100 });
    if ((x = f.match(/uses \+(\d+)% of its Speed when defending/i))) ef.defesaExtraVel = parseInt(x[1], 10) / 100;
    if (/Boosts Atk or SpAtk to match the higher value/i.test(f)) ef.equinox = true;
    if (/Boosts highest stat in (Sun|Rain|Sand|Hail|Fog)/i.test(f) && climaOk(f.match(/in (Sun|Rain|Sand|Hail|Fog)/i)[1])) ef.maiorMult = 1.3;
    // Categoria de golpe ganha por tipo (Mixed Martial Arts, Brawling Wyvern, Chestnut Axe, Reverberate).
    if ((x = f.match(/^(\w+) moves are flagged as (\w+) \+ (\w+) moves/i)) && tipoDoTextoDuelo(x[1])) ef.categoriaPorTipo[tipoDoTextoDuelo(x[1])] = categoriasDoTextoDuelo(x[2] + " " + x[3]);
    if ((x = f.match(/(\w+) type moves become (\w+) moves/i)) && tipoDoTextoDuelo(x[1])) ef.categoriaPorTipo[tipoDoTextoDuelo(x[1])] = categoriasDoTextoDuelo(x[2]);
    if ((x = f.match(/(\w+) moves become Keen Edge boosted/i)) && tipoDoTextoDuelo(x[1])) ef.categoriaPorTipo[tipoDoTextoDuelo(x[1])] = ["corte"];
    if ((x = f.match(/^(\w+) moves are Sound moves/i)) && tipoDoTextoDuelo(x[1])) ef.somPorTipo[tipoDoTextoDuelo(x[1])] = true;
    if (/Punches and Kicks are both Punches and Kicks/i.test(f)) { ef.categoriaPorTipo["cat:soco"] = ["chute"]; ef.categoriaPorTipo["cat:chute"] = ["soco"]; }
    // Nunca erra / menor defesa por categoria.
    if ((x = f.match(/^(\w+)(?: & (\w+))? moves never miss/i))) [x[1], x[2]].filter(Boolean).forEach(function (w) { categoriasDoTextoDuelo(w).forEach(function (c) { ef.semErrarCategoria[c] = true; }); });
    if (/Kicks always hit/i.test(f)) ef.semErrarCategoria.chute = true;
    if (/Kicks always hit\. Damages foes' weaker defenses/i.test(f)) ef.menorDefesaCategoria.chute = true;
    if (/Targets lowest defense vs statused foes/i.test(f)) ef.menorDefesaSeStatus = true;
    if ((x = f.match(/^(\w+) moves hit SpDef and get a ([\d.]+)x power boost/i))) categoriasDoTextoDuelo(x[1]).forEach(function (c) { ef.categoriaNaSpDef[c] = true; ef.bonusCategoria[c] = Math.max(ef.bonusCategoria[c] || 1, parseFloat(x[2])); });
    if ((x = f.match(/^(\w+ ?\w*) moves hit twice for (\d+)% damage/i))) categoriasDoTextoDuelo(x[1]).forEach(function (c) { ef.categoriaExtra[c] = Math.max(ef.categoriaExtra[c] || 1, 2 * parseInt(x[2], 10) / 100); });
    if ((x = f.match(/^(Air-based|Wind) moves get a ([\d.]+)x boost/i))) ef.flagMult["Air/Wing Based"] = { mult: parseFloat(x[2]) };
    if ((x = f.match(/^(\w+) moves get \+1 Priority/i)) && tipoDoTextoDuelo(x[1])) ef.prioTipoSempre.push(tipoDoTextoDuelo(x[1]));
    if ((x = f.match(/^(\w+) moves \+(\d+)%; (\w+) moves siphon (\d+)% damage/i))) {
      if (tipoDoTextoDuelo(x[1])) ef.bonusTipo[tipoDoTextoDuelo(x[1])] = Math.max(ef.bonusTipo[tipoDoTextoDuelo(x[1])] || 1, 1 + parseInt(x[2], 10) / 100);
      if (tipoDoTextoDuelo(x[3])) ef.drenoTipo[tipoDoTextoDuelo(x[3])] = parseInt(x[4], 10) / 100;
    }
    if ((x = f.match(/Boosts own (\w+) moves by ([\d.]+)x/i)) && tipoDoTextoDuelo(x[1])) ef.bonusTipo[tipoDoTextoDuelo(x[1])] = Math.max(ef.bonusTipo[tipoDoTextoDuelo(x[1])] || 1, parseFloat(x[2]));
    // Seguimentos (golpe grátis depois do golpe).
    var sg = f.match(/(?:Triggers|follows? up with) (?:a )?(\d+)\s?BP [\w' -]+? after using (?:a |an )?(special move|attack|move|(\w+)(?: or (\w+))?-type move)/i) ||
      f.match(/After using (?:a |an )?(special move|attack|move), (?:launch|follow up with) (?:a )?(\d+)\s?BP/i);
    if (sg) {
      var inverso = /^After/i.test(sg[0]), qual = inverso ? sg[1] : sg[2], bp = parseInt(inverso ? sg[2] : sg[1], 10);
      var tiposSg = inverso ? [] : [sg[3], sg[4]].map(function (w) { return w && tipoDoTextoDuelo(w); }).filter(Boolean);
      ef.seguimentoCategoria.push({ quais: /special/i.test(qual) ? "especial" : tiposSg.length ? "tipos" : "todos", tipos: tiposSg, poder: bp });
    }
    if ((x = f.match(/Uses (\d+)BP [\w ]+? at the end of each 2nd turn/i))) ef.seguimentoCategoria.push({ quais: "todos", tipos: [], poder: parseInt(x[1], 10) / 2 });
    // Contra-ataque ao apanhar e golpe na entrada.
    if ((x = f.match(/Attacks with ([A-Z][\w ]+?) when hit by a contact move/)) && poderDoGolpeDuelo(x[1])) ef.contraAtaque = { poder: poderDoGolpeDuelo(x[1]) };
    if ((x = f.match(/Uses (\d+)BP ([A-Z][\w ]+?) when hit by contact/)) && MOVE_ID_BY_NAME[x[2]] !== undefined) ef.contraAtaque = { poder: parseInt(x[1], 10) * acertosDoGolpeDuelo(MOVE_ID_BY_NAME[x[2]]) };
    if ((x = f.match(/Uses (\d+)BP [\w ]+? when it takes damage/i))) ef.contraAtaque = { poder: parseInt(x[1], 10), qualquer: true };
    if ((x = f.match(/Attacks with ([A-Z][\w ]+?) on entry/)) && poderDoGolpeDuelo(x[1])) ef.ataqueNaEntrada = poderDoGolpeDuelo(x[1]);
    if ((x = f.match(/(\d+)\s?BP ([A-Z][\w ]+?) on entry/))) ef.ataqueNaEntrada = parseInt(x[1], 10);
    if ((x = f.match(/Uses ([A-Z][\w ]+?) on switch-in/)) && poderDoGolpeDuelo(x[1])) ef.ataqueNaEntrada = poderDoGolpeDuelo(x[1]);
    // Estágios de entrada e reação a queda.
    if (/Casts Defense Curl on entry/i.test(f)) ef.estagioEntrada.def = (ef.estagioEntrada.def || 0) + 1;
    if (/Maxes Def on entry/i.test(f)) ef.estagioEntrada.def = 6;
    if (/-1 Def when hit/i.test(f)) ef.aoApanhar.push({ stat: "def", n: -1 });
    if (/Lowers the foe's highest Attack and Defense stat/i.test(f)) ef.malicious = true;
    if ((x = f.match(/Lowering any stats on its side raises (Atk|SpAtk) and (Def|SpDef)/i))) { ef.aoSerReduzido[estagioDoTexto(x[1])] = 1; ef.aoSerReduzido[estagioDoTexto(x[2])] = 1; }
    if (/When a stat is lowered, sharply raise both offenses/i.test(f)) { ef.aoSerReduzido.atk = 2; ef.aoSerReduzido.spa = 2; }
    if (/\+1 Atk after using recoil move\. 1\/2 recoil damage/i.test(f)) { ef.aoUsar.push({ stat: "atk", n: 1, categoria: "recuo" }); ef.recuoFrac = 0.5; }
    if ((x = f.match(/Ups Special Attack by (\d+)% if suffering/i))) ef.statusProprio.push({ stat: "spa", mult: 1 + parseInt(x[1], 10) / 100, quais: null });
    if (/Halves Atk and Sp\. Atk stats if user is below 1\/3/i.test(f)) { ef.atkMult *= 1 - 0.5 / 3; ef.spaMult *= 1 - 0.5 / 3; } // último terço da luta
    if ((x = f.match(/Deals (\d+)% more damage for each repeated move use/i))) ef.ritmico = parseInt(x[1], 10) / 100;
    if (/Deals 2x damage vs confused/i.test(f)) ef.bonusVsStatus.confundir = 2;
    if ((x = f.match(/Drain moves recover \+(\d+)% HP & apply Leech Seed/i))) { ef.drenoMult = 1 + parseInt(x[1], 10) / 100; ef.sementeNoDreno = true; }
    if (/Charges up when getting hit/i.test(f)) ef.carregaAoApanhar = true;
    if (/Contact attacks make foes move last/i.test(f)) ef.forcaUltimo = true;
    // Dano de campo por turno (Toxic Spill, Flame Coat, Funeral Pyre, Winter Throne, Life Steal...).
    if ((x = f.match(/Non-(\w+)(?:-types?| and (\w+)-types) take 1\/(\d+) (?:dmg|damage) every turn/i))) {
      ef.campoResiduo.push({ pct: 1 / parseInt(x[3], 10), exceto: [x[1], x[2]].map(function (w) { return w && tipoDoTextoDuelo(w); }).filter(Boolean) });
    }
    if ((x = f.match(/1\/(\d+) Damage each turn to non-(\w+)/i)) && tipoDoTextoDuelo(x[2])) ef.campoResiduo.push({ pct: 1 / parseInt(x[1], 10), exceto: [tipoDoTextoDuelo(x[2])] });
    if ((x = f.match(/Heals (\w+) 1\/(\d+) each turn/i)) && tipoDoTextoDuelo(x[1])) ef.campoResiduo.push({ pct: -1 / parseInt(x[2], 10), so: [tipoDoTextoDuelo(x[1])] });
    if ((x = f.match(/Enemies take 1\/(\d+) damage when in (hail|rain|sun|sand|fog)/i)) && climaOk(x[2])) ef.campoResiduo.push({ pct: 1 / parseInt(x[1], 10), exceto: [], soInimigo: true });
    if ((x = f.match(/Deals 1\/(\d+) HP damage to non-(\w+)/i)) && tipoDoTextoDuelo(x[2])) ef.campoResiduo.push({ pct: 1 / parseInt(x[1], 10), exceto: [tipoDoTextoDuelo(x[2])], soInimigo: true });
    if ((x = f.match(/Steals 1\/(\d+) HP from foes each turn/i))) ef.campoResiduo.push({ pct: 1 / parseInt(x[1], 10), exceto: [], soInimigo: true, rouba: true });
    if ((x = f.match(/Drain (\d+)% HP from foes at the end of each turn in (fog|rain|sun|sand|hail)/i)) && climaOk(x[2])) ef.campoResiduo.push({ pct: parseInt(x[1], 10) / 100, exceto: [], soInimigo: true, rouba: true });
    if ((x = f.match(/Drops? opponent's attack/i))) ef.quedaNaEntrada.atk = -1;
  }
  // ---------- campo: terreno, salas, vento, gravidade (2026-09-29) ----------
  // Dado do NextDex: terreno dura 8 turnos e "fortalece" o tipo (Electric, Grassy,
  // Psychic, Misty/Fairy); Grassy cura, Psychic barra prioridade, Misty barra
  // status. O quanto fortalece o dado não diz: 1,3x, o valor atual da série. Misty
  // também corta Dragon pela metade em quem está no chão (série). Trick Room,
  // Tailwind e Inverse Room das habilidades duram o que o texto diz.
  var TERRENO_DO_TEXTO_DUELO = { electric: "eletrico", grassy: "grama", psychic: "psiquico", misty: "nevoa", toxic: "toxico" };
  var TIPO_DO_TERRENO_DUELO = { eletrico: "Electric", grama: "Grass", psiquico: "Psychic", nevoa: "Fairy", toxico: "Poison" };
  var REFORCO_DO_TERRENO_DUELO = 1.3;
  var CAMPO_DUELO = null; // contexto do duelo em andamento (resultadoDoDuelo liga e desliga)
  function lerCampoDaFraseDuelo(f, ef) {
    var x;
    if ((x = f.match(/Casts (Electric|Grassy|Psychic|Misty) Terrain on entry|When hit, sets? up (Electric|Grassy|Psychic|Misty) Terrain|Sets (Electric|Grassy|Psychic|Misty) Terrain when hit/i))) {
      ef.armaTerreno = TERRENO_DO_TEXTO_DUELO[(x[1] || x[2] || x[3]).toLowerCase()];
    }
    if (/^Field becomes Electric/i.test(f)) ef.armaTerreno = "eletrico";
    if (/sets Toxic Terrain on entry/i.test(f)) ef.armaTerreno = "toxico"; // Toxic Surge
    if ((x = f.match(/(\d+)% spdef boost under Toxic Terrain/i))) ef.noTerreno.push({ terreno: "toxico", stat: "spd", mult: 1 + parseInt(x[1], 10) / 100 }); // Biofilm
    if (/Removes terrain on switch-in|Destroys terrain|Eats terrain|Negates Weather, Rooms and Terrains/i.test(f)) ef.limpaTerreno = true;
    if (/Negates Weather, Rooms and Terrains/i.test(f)) ef.limpaSala = true;
    if ((x = f.match(/Sets up Trick Room on entry, lasts (\d+) turns/i))) ef.sala = parseInt(x[1], 10);
    if ((x = f.match(/Sets up Inverse Room on entry, lasts (\d+) turns/i))) ef.inversa = parseInt(x[1], 10);
    if ((x = f.match(/Casts a (\d+)-turn Tailwind on entry/i))) ef.vento = parseInt(x[1], 10);
    if (/Sets Gravity on entry/i.test(f)) ef.gravidade = true;
    if (/bypass Substitutes and damage reduction screens/i.test(f)) ef.infiltra = true;
    if (/Clears screens from both sides on entry/i.test(f)) ef.limpaTelas = true;
    if ((x = f.match(/(\d+)% more damage to (\w+)-types/i)) && tipoDoTextoDuelo(x[2])) ef.vsTipo[tipoDoTextoDuelo(x[2])] = 1 + parseInt(x[1], 10) / 100;
    if ((x = f.match(/deals ([\d.]+)x more damage to (\w+)-types/i)) && tipoDoTextoDuelo(x[2])) ef.vsTipo[tipoDoTextoDuelo(x[2])] = parseFloat(x[1]);
    // Habilidade que depende do terreno.
    var ter = function (w) { return TERRENO_DO_TEXTO_DUELO[w.toLowerCase()]; };
    if ((x = f.match(/(Defense|SpDef) gets a ([\d.]+)x boost in (Electric|Grassy|Psychic|Misty) Terrain/i))) ef.noTerreno.push({ terreno: ter(x[3]), stat: /sp/i.test(x[1]) ? "spd" : "def", mult: parseFloat(x[2]) });
    if ((x = f.match(/If (Electric|Grassy|Psychic|Misty) Terrain is active, gets a ([\d.]+)x Speed boost/i))) ef.noTerreno.push({ terreno: ter(x[1]), stat: "spe", mult: parseFloat(x[2]) });
    if ((x = f.match(/Boosts highest stat in (Electric|Grassy|Psychic|Misty) Terrain/i))) ef.noTerreno.push({ terreno: ter(x[1]), stat: "maior", mult: 1.3 });
    if ((x = f.match(/\+(\d+)% SpAtk in (Electric|Grassy|Psychic|Misty) Terrain/i))) ef.noTerreno.push({ terreno: ter(x[2]), stat: "spa", mult: 1 + parseInt(x[1], 10) / 100 });
    if ((x = f.match(/Recovers 1\/(\d+) of its health each turn under (Electric|Grassy|Psychic|Misty) Terrain/i))) ef.noTerreno.push({ terreno: ter(x[2]), stat: "cura", mult: 1 / parseInt(x[1], 10) });
    if ((x = f.match(/Revives at (\d+)% HP once after fainting in (Electric|Grassy|Psychic|Misty) Terrain/i))) ef.noTerreno.push({ terreno: ter(x[2]), stat: "revive", mult: parseInt(x[1], 10) / 100 });
    if (/Charges up once on entry/i.test(f)) ef.carregaNaEntrada = true; // Generator: 1º golpe Electric 2x
  }
  // No chão: não é Flying nem tem imunidade a Ground por habilidade (Levitate) - a
  // gravidade põe todo mundo no chão.
  function aterradoDuelo(u) {
    if (CAMPO_DUELO && CAMPO_DUELO.gravidade) return true;
    if ((u.tipos || []).indexOf("Flying") !== -1) return false;
    var r = abilityTypeModFor("Ground", [], u.ids || []);
    return !(r.raw !== 0 && r.mult === 0);
  }
  function noTerrenoDuelo(u, stat) {
    var t = CAMPO_DUELO && CAMPO_DUELO.terreno;
    if (!t) return stat === "cura" || stat === "revive" ? 0 : 1;
    return (u.ef.noTerreno || []).reduce(function (acc, e) {
      if (e.terreno !== t || e.stat !== stat) return acc;
      return stat === "cura" || stat === "revive" ? acc + e.mult : acc * e.mult;
    }, stat === "cura" || stat === "revive" ? 0 : 1);
  }
  // Campo da luta entre os dois: terreno (quem entra por último é "eu" - o
  // jogador contra o Pokémon do chefão), salas, gravidade.
  function campoDoDuelo(eu, foe) {
    var terreno = eu.ef.armaTerreno || (eu.ef.limpaTerreno ? null : foe.ef.armaTerreno);
    if (eu.ef.limpaTerreno && !eu.ef.armaTerreno) terreno = null;
    if (foe.ef.limpaTerreno && !eu.ef.armaTerreno) terreno = null;
    var limpaSala = eu.ef.limpaSala || foe.ef.limpaSala;
    return { terreno: terreno, sala: limpaSala ? 0 : Math.max(eu.ef.sala, foe.ef.sala), inversa: limpaSala ? 0 : Math.max(eu.ef.inversa, foe.ef.inversa),
      gravidade: !limpaSala && (eu.ef.gravidade || foe.ef.gravidade) };
  }
  // ---------- itens (2026-09-29) ----------
  // O texto do item no jogo não traz número ("Boosts the power of moves at the
  // cost of HP"): valem os da série - Life Orb 1,3x com 10% do HP por ataque,
  // Leftovers 1/16, item de tipo 1,2x, gema 1,3x uma vez, Expert Belt 1,2x no
  // super efetivo, Sitrus 1/4 com metade do HP, bagas "que podem confundir" 1/3
  // com 1/4 do HP, baga de resistência corta o 1º super efetivo pela metade,
  // baga de aperto +1 com 1/4 do HP. Atributo fixo (Choice, Assault Vest...)
  // já entra em calcFinalStat. Camada separada da habilidade (u.it) porque
  // Klutz, Frisk, Pickpocket e Unnerve desligam o item.
  var cacheItemDuelo = {};
  function itemDoDuelo(nome, sp) {
    var chave = (nome || "") + "|" + (sp ? sp.sname : "");
    if (cacheItemDuelo[chave]) return cacheItemDuelo[chave];
    var it = { nome: nome || "", danoMult: 1, fisicoMult: 1, especialMult: 1, seMult: 1, tipoMult: {}, categoriaMult: {}, gema: null,
      critEstagio: 0, precisaoMult: 1, evasao: 1, defMult: 1, spdMult: 1, speMult: 1, lento: false, curaTurno: 0, perdaTurno: 0,
      custoAtaque: 0, drenoPct: 0, drenoMult: 1, danoAoContato: 0, contraCatUmaVez: null, bagaHP: 0, bagaHPLimite: 0, bagaResiste: null,
      bagaAperto: null, curaStatusUmaVez: false, estagioUmaVez: [], recuar: 0, imuneEfeito: false, imuneQuedas: false, semEfeitoContato: false,
      balao: false, cargaUmaVez: false, dadoCarregado: false, metronomo: false, consumivel: false, baga: false };
    var t = (typeof ITEM_DESC !== "undefined" && ITEM_DESC[nome]) || "";
    var x, tp;
    if (!nome) { cacheItemDuelo[chave] = it; return it; }
    if (nome === "Life Orb") { it.danoMult = 1.3; it.custoAtaque = 0.1; }
    if (nome === "Expert Belt") it.seMult = 1.2;
    if (nome === "Muscle Band") it.fisicoMult = 1.1;
    if (nome === "Wise Glasses") it.especialMult = 1.1;
    if (nome === "Punching Glove") it.categoriaMult.soco = 1.1;
    if (nome === "Metronome") it.metronomo = true;
    if (nome === "Loaded Dice") it.dadoCarregado = true;
    if (nome === "Power Herb") { it.cargaUmaVez = true; it.consumivel = true; }
    if ((x = t.match(/(?:raises|boosts|ups) the power of (\w+)-type moves|boosts (\w+)-type moves|ups the power of (\w+)-type moves|Increases the power of (\w+) Type moves/i)) &&
      (tp = tipoDoTextoDuelo(x[1] || x[2] || x[3] || x[4]))) {
      if (/ Gem$/.test(nome)) { it.gema = tp; it.consumivel = true; } else it.tipoMult[tp] = 1.2;
    }
    if (nome === "Eviolite" && sp && (sp.ev || []).some(function (ev) { return !isMegaEvoKind(ev[0]); })) { it.defMult = 1.5; it.spdMult = 1.5; }
    if (nome === "Scope Lens" || nome === "Razor Claw") it.critEstagio = 1;
    if (nome === "King's Rock" || nome === "Razor Fang") it.recuar = 0.1;
    if (nome === "Bright Powder") it.evasao = 1.1;
    if (nome === "Wide Lens") it.precisaoMult = 1.1;
    if (nome === "Iron Ball") it.speMult = 0.5;
    if (nome === "Lagging Tail") it.lento = true;
    if (nome === "Covert Cloak") it.imuneEfeito = true;
    if (nome === "Clear Amulet") it.imuneQuedas = true;
    if (nome === "Protective Pads") it.semEfeitoContato = true;
    if (nome === "Air Balloon") { it.balao = true; it.consumivel = true; }
    if (nome === "Leftovers") it.curaTurno = 1 / 16;
    if (nome === "Black Sludge") { if (sp && speciesTypeNames(sp).indexOf("Poison") !== -1) it.curaTurno = 1 / 16; else it.perdaTurno = 1 / 8; }
    if (nome === "Sticky Barb") it.perdaTurno = 1 / 8;
    if (nome === "Shell Bell") it.drenoPct = 1 / 8;
    if (nome === "Big Root") it.drenoMult = 1.3;
    if (nome === "Rocky Helmet") it.danoAoContato = 1 / 6;
    if (nome === "Jaboca Berry") { it.contraCatUmaVez = { cat: "F", pct: 1 / 8 }; it.baga = true; it.consumivel = true; }
    if (nome === "Rowap Berry") { it.contraCatUmaVez = { cat: "E", pct: 1 / 8 }; it.baga = true; it.consumivel = true; }
    if (nome === "Sitrus Berry") { it.bagaHP = 1 / 4; it.bagaHPLimite = 1 / 2; it.baga = true; it.consumivel = true; }
    if (/restores HP but may confuse/i.test(t)) { it.bagaHP = 1 / 3; it.bagaHPLimite = 1 / 4; it.baga = true; it.consumivel = true; }
    if (nome === "Oran Berry") { it.bagaHP = 0.04; it.bagaHPLimite = 1 / 2; it.baga = true; it.consumivel = true; } // 10 HP ~ 4% no nível dos chefões
    if ((x = t.match(/weakens an? (\w+) move/i)) && (tp = tipoDoTextoDuelo(x[1]))) { it.bagaResiste = { tipo: tp, soSuperEf: /if weak/i.test(t) }; it.baga = true; it.consumivel = true; }
    if ((x = t.match(/raises (Attack|Speed|Sp\. Atk|Defense|Sp\. Def) in a pinch/i))) { it.bagaAperto = { stat: estagioDoTexto(x[1]), n: 1 }; it.baga = true; it.consumivel = true; }
    if (nome === "Starf Berry") { it.bagaAperto = { stat: "atk", n: 2 / 5 * 2 }; it.baga = true; it.consumivel = true; } // +2 num de 5 atributos
    if (nome === "Lum Berry") { it.curaStatusUmaVez = true; it.baga = true; it.consumivel = true; }
    if (nome === "Chesto Berry") { it.baga = true; it.consumivel = true; }
    if (nome === "Focus Sash") it.consumivel = true;
    // Subida de estágio uma vez, por gatilho.
    if (nome === "Weakness Policy") { it.estagioUmaVez.push({ quando: "superEfRecebido", stats: { atk: 2, spa: 2 } }); it.consumivel = true; }
    if (nome === "Throat Spray") { it.estagioUmaVez.push({ quando: "som", stats: { spa: 1 } }); it.consumivel = true; }
    if (nome === "Adrenaline Orb") { it.estagioUmaVez.push({ quando: "intimidado", stats: { spe: 1 } }); it.consumivel = true; }
    if ((x = t.match(/Raises (Sp\. Atk|Atk|Sp\. Def) if (?:the |its )?holder is hit by an? (\w+)-type move/i)) && (tp = tipoDoTextoDuelo(x[2]))) {
      var st = {}; st[estagioDoTexto(x[1])] = 1;
      it.estagioUmaVez.push({ quando: "tipoRecebido", tipo: tp, stats: st }); it.consumivel = true;
    }
    if (nome === "Kee Berry") { it.estagioUmaVez.push({ quando: "catRecebido", cat: "F", stats: { def: 1 } }); it.baga = true; it.consumivel = true; }
    if (nome === "Maranga Berry") { it.estagioUmaVez.push({ quando: "catRecebido", cat: "E", stats: { spd: 1 } }); it.baga = true; it.consumivel = true; }
    cacheItemDuelo[chave] = it;
    return it;
  }
  // Item que a habilidade pede (Guts com Flame Orb, Poison Heal com Toxic Orb,
  // Gluttony/Ripen/Harvest/Cud Chew/Unburden com Sitrus, Magic Guard com Life Orb)
  // ou o padrão do set: Life Orb pra quem bate, Leftovers (Black Sludge em Poison)
  // pro tanque, Eviolite pra quem ainda evolui.
  function itemDoSetDuelo(set, sp, ef) {
    if (ef.klutz) return "";
    var quer = ef.statusProprio.map(function (c) { return c.quais; });
    if (ef.curaEnvenenado || quer.some(function (q) { return q && q.indexOf("envenenar") !== -1; })) return "Toxic Orb";
    if (quer.length) return "Flame Orb";
    if (ef.gostaDeBaga || ef.unburden) return "Sitrus Berry";
    var evolui = (sp.ev || []).some(function (ev) { return !isMegaEvoKind(ev[0]); });
    if (set.nome === "tanque") return evolui ? "Eviolite" : speciesTypeNames(sp).indexOf("Poison") !== -1 ? "Black Sludge" : "Leftovers";
    if (evolui) return "Eviolite";
    return "Life Orb";
  }
  // Quanto do item fica ativo: Klutz desliga (menos pedra mega); Frisk e o
  // Supersweet Syrup do outro desligam 2 turnos (~metade da luta); Pickpocket
  // (contato) e Magician (sem contato) roubam no 1º golpe - Sticky Hold segura.
  function itemAtivoDuelo(u, outro, gOutroContato) {
    if (!u.it || !u.it.nome) return 0;
    if (u.ef.klutz) return 0;
    var f = 1;
    if (outro.ef.desligaItem) f *= 0.5;
    if (!u.ef.seguraItem && ((outro.ef.roubaContato && gOutroContato === true) || (outro.ef.roubaSemContato && gOutroContato === false))) f *= 0.5;
    return f;
  }
  function comItem(mult, ativo) { return 1 + (mult - 1) * ativo; }
  // ---------- sequência: nocaute, desmaio e hazards (2026-09-29) ----------
  function lerSequenciaDaFraseDuelo(f, ef) {
    var x;
    // Ao nocautear: estágio (Moxie, Beast Boost, Pretentious...), cura (Predator), devorar (Jaws of Carnage).
    if ((x = f.match(/(?:Dealing a KO|KOs(?: dealt anywhere on the field)?) raises? (Attack|Sp\. Atk|SpAtk|Speed|highest calculated stat|Crit)(?: and (Speed|Attack))? by one stage/i))) {
      [x[1], x[2]].filter(Boolean).forEach(function (w) {
        ef.aoNocautear.push({ stat: /highest/i.test(w) ? "maior" : /crit/i.test(w) ? "crit" : estagioDoTexto(w), n: 1 });
      });
    }
    if ((x = f.match(/Dealing a KO heals 1\/(\d+)/i)) || (x = f.match(/heals 1\/(\d+) HP when defeating an enemy/i))) ef.curaAoNocautear = 1 / parseInt(x[1], 10);
    if ((x = f.match(/Devours 1\/(\d+) of the foe when defeating it/i))) ef.devora = 1 / parseInt(x[1], 10);
    if ((x = f.match(/Fainted Pokemon increase your offenses and spdef by (\d+)%/i))) ef.porDesmaio = parseInt(x[1], 10) / 100;
    // Battle Bond: o texto diz só "transforma"; vale o da série (+1 Atk, SpAtk e Speed uma vez).
    if (/Transforms into Battle Bond form after dealing a KO/i.test(f)) { ["atk", "spa", "spe"].forEach(function (s) { ef.aoNocautear.push({ stat: s, n: 1, umaVez: true }); }); }
    // Ao desmaiar: golpe no último (Aftermath, Victory Bomb), dano de volta (Innards Out), maldição, queda, PP.
    if ((x = f.match(/(?:After fainting uses|Attacks with a) (\d+)\s?BP [\w -]+?(?:Explosion|Outburst)/i))) ef.aoDesmaiarGolpe = parseInt(x[1], 10);
    if (/If KO'd, deals as much damage as what the fatal attack dealt/i.test(f)) ef.aoDesmaiarDevolve = true;
    if (/When this Pok\S+ is KO'd, casts a Curse on the attacker/i.test(f)) ef.aoDesmaiarMaldicao = true;
    if (/Sharply lowers attacker's Attack and SpAtk when fainting/i.test(f)) ef.aoDesmaiarQueda = 2;
    if (/Deletes the PP of the move that faints this Pokemon/i.test(f)) ef.aoDesmaiarTiraGolpe = true;
    if (/If hit, casts Perish Song/i.test(f)) ef.perecer = 3;
    // Hazards (do lado do outro): Stealth Rock, Spikes, Toxic Spikes, Sticky Web.
    if (/Deploys Stealth Rocks when hit by contact/i.test(f)) ef.hazards.push({ tipo: "rocha", quando: "contato" });
    if (/Sets a layer of Spikes when hit|When hit, set up spikes/i.test(f)) ef.hazards.push({ tipo: "espinho", quando: /contact/i.test(f) ? "contato" : "hit" });
    if (/Sets a layer of Toxic Spikes when hit by contact/i.test(f)) ef.hazards.push({ tipo: "toxico", quando: "contato" });
    if ((x = f.match(/Spreads two layers of (Toxic )?Spikes on switch-in/i))) { ef.hazards.push({ tipo: x[1] ? "toxico" : "espinho", quando: "entrada" }); ef.hazards.push({ tipo: x[1] ? "toxico" : "espinho", quando: "entrada" }); }
    if (/Casts (?:an unremovable )?Sticky Web on entry/i.test(f)) ef.hazards.push({ tipo: "teia", quando: "entrada" });
    if (/Removes all hazards on entry|clear hazards/i.test(f)) ef.limpaHazards = true;
    if (/Regenerator|Heals 1\/3 of max HP upon switching out/i.test(f)) ef.regenera = 1 / 3;
    if (/Heals status condition upon switching out/i.test(f)) ef.curaAoSair = true;
  }
  function lerItemDaFraseDuelo(f, ef, climaOk) {
    var x;
    if (/Own held item has no effect/i.test(f)) ef.klutz = true;
    if (/Eats berries early/i.test(f)) { ef.gostaDeBaga = true; ef.bagaCedo = true; }
    if ((x = f.match(/Berries also restore 1\/(\d+) of max HP/i))) ef.bagaCuraMin = 1 / parseInt(x[1], 10);
    if (/Doubles resistance, healing and stat raises provided by Berries/i.test(f)) { ef.gostaDeBaga = true; ef.ripen = true; }
    if ((x = f.match(/(\d+)% chance to recycle a used Berry every turn(?:, 100% in (sun|rain))?/i))) {
      ef.gostaDeBaga = true; ef.colheita = x[2] && climaOk(x[2]) ? 1 : parseInt(x[1], 10) / 100;
    }
    if (/Eats berries again at the end of the next turn/i.test(f)) { ef.gostaDeBaga = true; ef.rumina = true; }
    if (/Eat a random berry at the end of the turn/i.test(f)) { ef.gostaDeBaga = true; ef.curaPorTurno += 1 / 16; } // Craving: baga aleatória ~ uma cura pequena por turno
    if (/Consuming its held item doubles Speed/i.test(f)) ef.unburden = true;
    if (/Checks foes' item and disables their items for two turns|Disables foe's item for 2 turns/i.test(f)) ef.desligaItem = true;
    if (/Steals the foe's held item on contact/i.test(f)) ef.roubaContato = true;
    if (/Steals the foe's held item after using a non-contact move/i.test(f)) ef.roubaSemContato = true;
    if (/Can't lose its item/i.test(f)) ef.seguraItem = true;
    if (/Foes can't use consumable items/i.test(f)) ef.nervoso = true;
  }
  // Egoist copia o que o outro sobe; Sharing Is Caring soma os dois lados; Heart Swap
  // troca as subidas de entrada.
  function ajustaEstagiosEntreOsDois(a, b, ea, eb) {
    var chaves = ["atk", "def", "spa", "spd", "spe"];
    var copiaA = {}, copiaB = {};
    chaves.forEach(function (k) { copiaA[k] = ea[k]; copiaB[k] = eb[k]; });
    if (a.ef.trocaEstagios || b.ef.trocaEstagios) chaves.forEach(function (k) {
      var ia = a.ef.estagioEntrada[k] || 0, ib = b.ef.estagioEntrada[k] || 0;
      ea[k] += ib - ia; eb[k] += ia - ib;
    });
    if (a.ef.egoista) chaves.forEach(function (k) { ea[k] += Math.max(0, copiaB[k]); });
    if (b.ef.egoista) chaves.forEach(function (k) { eb[k] += Math.max(0, copiaA[k]); });
    if (a.ef.compartilha || b.ef.compartilha) chaves.forEach(function (k) { ea[k] = copiaA[k] + copiaB[k]; eb[k] = copiaA[k] + copiaB[k]; });
  }
  // Mudança de estágio do efeito extra do golpe (dado do NextDex): no alvo ou no usuário.
  var ESTAGIO_DO_EFEITO_DUELO = {
    "Attack Down Hit": { alvo: { atk: -1 } }, "Defense Down Hit": { alvo: { def: -1 } }, "Special Attack Down Hit": { alvo: { spa: -1 } },
    "Special Defense Down Hit": { alvo: { spd: -1 } }, "Special Defense Down Hit 2": { alvo: { spd: -2 } }, "Speed Down Hit": { alvo: { spe: -1 } },
    "Attack Up Hit": { proprio: { atk: 1 } }, "Defense Up Hit": { proprio: { def: 1 } }, "Defense Up2 Hit": { proprio: { def: 2 } },
    "Sp Attack Up Hit": { proprio: { spa: 1 } }, "Special Attack Up Hit": { proprio: { spa: 1 } }, "Speed Up Hit": { proprio: { spe: 1 } },
    "All Stats Up Hit": { proprio: { atk: 1, def: 1, spa: 1, spd: 1, spe: 1 } },
    "Overheat": { proprio: { spa: -2 } }, "Close Combat": { proprio: { def: -1, spd: -1 } }
  };
  function estagiosDoGolpeDuelo(id, u) {
    var e = typeof MOVE_CATEGORIAS !== "undefined" ? MOVE_CATEGORIAS[id] : null;
    var regra = e && e.ch ? ESTAGIO_DO_EFEITO_DUELO[e.ef] : null;
    if (!regra) return null;
    if (regra.alvo && u.ef.semEfeitoExtra) return null; // Sheer Force troca o efeito no alvo por força
    return { alvo: regra.alvo || null, proprio: regra.proprio || null, p: Math.min(1, e.ch / 100 * (regra.alvo || e.ch < 100 ? u.ef.chanceMult : 1)) };
  }
  // Estágio médio de cada atributo de "u" na luta contra "outro" (n turnos).
  // Eerie Fog: subida s cai 1 por turno até 0 - média em n turnos (s, s-1, ..., 0).
  function subidaMediaNaNevoa(s, n) {
    var soma = 0;
    for (var t = 0; t < n; t++) soma += Math.max(0, s - t);
    return soma / n;
  }
  function estagiosMediosDuelo(u, outro, gU, gOutro, n) {
    var s = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }, acumula = Math.max(0, (n - 1) / 2);
    var mult = u.ef.estagioMult;
    function soma(stat, delta, doRival) {
      if (doRival && delta < 0 && (u.ef.imuneQuedas[stat] || (u.it && u.it.imuneQuedas))) return;
      if (doRival && delta < 0 && outro.ef.dobraQuedas) delta *= 2; // Subdue
      s[stat] += delta * mult;
      if (doRival && delta < 0) Object.keys(u.ef.aoSerReduzido).forEach(function (k) { s[k] += u.ef.aoSerReduzido[k] * Math.min(1, -delta) * mult; });
    }
    // Subidas na entrada - que o Pressure/Petrify do rival limpa.
    if (!outro.ef.limpaBuffsNaEntrada) {
      Object.keys(u.ef.estagioEntrada).forEach(function (k) { soma(k, u.ef.estagioEntrada[k], false); });
      if (u.ef.download && outro.stats) soma(outro.stats[2] < outro.stats[4] ? "atk" : "spa", 1, false);
      if (u.ef.maiorNaEntrada && u.stats) {
        var chaves = ["atk", "def", "spa", "spd", "spe"], maior = 0;
        for (var i = 1; i < 5; i++) if (u.stats[i + 1] > u.stats[maior + 1]) maior = i;
        soma(chaves[maior], u.ef.maiorNaEntrada, false);
      }
      if (u.ef.maiorAtaqueNaEntrada && u.stats) soma(u.stats[1] >= u.stats[3] ? "atk" : "spa", u.ef.maiorAtaqueNaEntrada, false);
    }
    Object.keys(outro.ef.quedaNaEntrada).forEach(function (k) { soma(k, outro.ef.quedaNaEntrada[k], true); });
    // Malicious: -1 no maior ataque e na maior defesa de quem enfrenta.
    if (outro.ef.malicious && u.stats) { soma(u.stats[1] >= u.stats[3] ? "atk" : "spa", -1, true); soma(u.stats[2] >= u.stats[4] ? "def" : "spd", -1, true); }
    Object.keys(outro.ef.quedaPorTurno).forEach(function (k) { soma(k, outro.ef.quedaPorTurno[k] * acumula, true); }); // Sap Trap, Serpent Bind
    if (u.ef.ultimaCartada) ["atk", "def", "spa", "spd", "spe"].forEach(function (k) { soma(k, 0.5, false); }); // No Turning Back: +1 na metade da luta
    if (u.ef.espiao && outro.stats) soma(outro.stats[1] >= outro.stats[3] ? "def" : "spd", 2, false); // Spyware: contra o ponto forte do rival
    if (u.ef.ventoAtaque && (u.ef.vento || (gOutro && (gOutro.flags || []).indexOf("Air/Wing Based") !== -1))) soma("atk", 1, false); // Wind Rider
    if (u.ef.firmeza && gOutro) (gOutro.status || []).forEach(function (st) { if (st.st === "recuar") soma("spe", st.p * acumula, false); }); // Steadfast
    // Home Run: cada crítico sobe os 3 atributos mais baixos.
    if (u.ef.homeRun && gU && gU.crit && u.stats) {
      var pc = gU.crit.sempre ? 1 : chanceDoEstagioCrit(gU.crit.estagio);
      ["atk", "def", "spa", "spd", "spe"].map(function (k, i) { return { k: k, v: u.stats[i + 1] }; }).sort(function (x, y) { return x.v - y.v; })
        .slice(0, 3).forEach(function (o) { soma(o.k, pc * acumula, false); });
    }
    // Anger Shell: Shell Smash abaixo da metade - metade da luta com +2/-1.
    if (u.ef.shellSmashNaMetade) { soma("atk", 1, false); soma("spa", 1, false); soma("spe", 1, false); soma("def", -0.5, false); soma("spd", -0.5, false); }
    // Guard Dog: o Intimidate do rival vira +1 de Ataque.
    if (u.ef.inverteIntimida && outro.ef.intimida) soma("atk", outro.ef.intimida, false);
    if (u.ef.berserk) soma(u.stats[1] >= u.stats[3] ? "atk" : "spa", 0.5, false); // metade da luta abaixo de 1/2 HP
    // Intimidate/Scare do rival disparam Competitive/Defiant (a queda em si já está no dano).
    if (outro.ef.intimida && !u.ef.imuneIntimida) Object.keys(u.ef.aoSerReduzido).forEach(function (k) { s[k] += u.ef.aoSerReduzido[k] * mult; });
    if (outro.ef.assusta && !u.ef.imuneAssusta) Object.keys(u.ef.aoSerReduzido).forEach(function (k) { s[k] += u.ef.aoSerReduzido[k] * mult; });
    if (gOutro) {
      u.ef.aoApanhar.forEach(function (a) {
        if (a.contato && !gOutro.contato) return;
        if (a.tipos && a.tipos.indexOf(gOutro.tipo) === -1) return;
        soma(a.stat, a.n * acumula, false);
      });
      outro.ef.aoGolpear.forEach(function (a) {
        if (a.cat && gOutro.cat !== a.cat) return;
        if (a.categoria && (gOutro.cats || []).indexOf(a.categoria) === -1) return;
        soma(a.stat, a.n * acumula, true);
      });
      if (gOutro.estagios && gOutro.estagios.alvo && !u.ef.imuneEfeitoDeGolpe) {
        Object.keys(gOutro.estagios.alvo).forEach(function (k) { soma(k, gOutro.estagios.alvo[k] * gOutro.estagios.p * acumula, true); });
      }
    }
    if (gU) {
      outro.ef.aoApanharAtacante.forEach(function (a) { if (!a.contato || gU.contato) soma(a.stat, a.n * acumula, true); });
      if (gU.estagios && gU.estagios.proprio) Object.keys(gU.estagios.proprio).forEach(function (k) { soma(k, gU.estagios.proprio[k] * gU.estagios.p * acumula, false); });
      u.ef.aoUsar.forEach(function (a) { if ((a.categoria === "recuo" ? gU.recuo > 0 : (gU.cats || []).indexOf(a.categoria) !== -1)) soma(a.stat, a.n * acumula, false); });
    }
    Object.keys(u.ef.porTurno).forEach(function (k) { soma(k, u.ef.porTurno[k] * acumula, false); });
    // Item: subida uma vez por gatilho (Weakness Policy, Throat Spray, Kee Berry...) e baga de aperto.
    var ativo = itemAtivoDuelo(u, outro, gOutro ? gOutro.contato : undefined);
    if (u.it && ativo > 0) {
      var depoisDo1o = n > 0 ? (n - 1) / n : 0;
      var dobro = u.ef.ripen ? 2 : 1, semBaga = outro.ef.nervoso;
      u.it.estagioUmaVez.forEach(function (e) {
        var vale = e.quando === "intimidado" ? !!outro.ef.intimida :
          e.quando === "som" ? !!(gU && gU.som) :
          e.quando === "superEfRecebido" ? !!(gOutro && efetividadeNoDuelo(outro, gOutro.tipo, u) >= 2) :
          e.quando === "tipoRecebido" ? !!(gOutro && gOutro.tipo === e.tipo) :
          e.quando === "catRecebido" ? !!(gOutro && gOutro.cat === e.cat) : false;
        if (!vale || (u.it.baga && semBaga)) return;
        var quanto = (e.quando === "intimidado" ? 1 : depoisDo1o) * ativo * (u.it.baga ? dobro : 1);
        Object.keys(e.stats).forEach(function (k) { soma(k, e.stats[k] * quanto, false); });
      });
      // Baga de aperto: vale no último quarto da luta (metade com Gluttony).
      if (u.it.bagaAperto && !semBaga) soma(u.it.bagaAperto.stat, u.it.bagaAperto.n * dobro * ativo * (u.ef.bagaCedo ? 0.5 : 0.25), false);
    }
    return s;
  }
  function temFlagDuelo(m, nome) { return (m[8] || []).some(function (i) { return DATA.flags[i] === nome; }); }
  // Estágio de crítico do golpe (sem o que depende do alvo) e se sempre crita.
  function criticoDoGolpeDuelo(m, g, cats, u) {
    var n = (temFlagDuelo(m, "High Crit Rate") ? 1 : 0) + u.ef.critEstagio;
    if (g.contato) n += u.ef.critContato;
    if (u.ef.critBP && m[3] < u.ef.critBP.limite) n += u.ef.critBP.n;
    n += cats.reduce(function (mx, c) { return Math.max(mx, u.ef.critCategoria[c] || 0); }, 0);
    return { estagio: n, sempre: temFlagDuelo(m, "Always Crits") || !!u.ef.sempreCritGolpe[m[0]] };
  }
  // Fator esperado do crítico num golpe contra "def" (e o fator com crítico certo).
  function fatorCriticoDuelo(atq, def, g, efTipo) {
    if (def.ef.imuneCritico && !atq.ef.quebraHabilidade) return { fator: 1, certo: 1 };
    var mult = atq.ef.critMult * (efTipo < 1 ? atq.ef.critVsResistido : 1) * (atq.ef.quebraHabilidade ? 1 : def.ef.critRecebido);
    var c = g.crit || { estagio: 0, sempre: false };
    var p = c.sempre || (atq.ef.critSuperEf && efTipo >= 2) ? 1 : chanceDoEstagioCrit(c.estagio + (def.ef.critTodos || 0) + (atq.it ? atq.it.critEstagio : 0));
    return { fator: 1 + p * (mult - 1), certo: mult };
  }
  // Status que um golpe causa, com a chance: o efeito extra do próprio golpe
  // (dado do NextDex; Serene Grace dobra, Sheer Force troca por força) + as
  // habilidades de ataque cujo filtro o golpe cumpre.
  function statusDoGolpeDuelo(id, g, cats, u) {
    var out = [];
    var e = typeof MOVE_CATEGORIAS !== "undefined" ? MOVE_CATEGORIAS[id] : null;
    if (e && e.ch && !u.ef.semEfeitoExtra) {
      var sts = STATUS_DO_EFEITO_DUELO[e.ef] || (e.ef === "Flinch Status" ? ["recuar", STATUS_DO_TIPO_DUELO[g.tipo]].filter(Boolean) : []);
      var dividir = e.ef === "Tri Attack" ? sts.length : 1;
      // Pyromancy/Cryomancy (status x5) e Corrupted Mind (chance x1,4 no tipo).
      var multTipo = u.ef.multChanceTipo[g.tipo] || 1;
      if (e.ef === "Trap" && u.ef.prisaoForte) sts = ["presoForte"]; // Grappler: prisão tira 1/6
      if (e.ef === "Trap" && u.ef.prisaoParalisa) sts = sts.concat(["paralisar"]); // Chokehold
      sts.forEach(function (s) { out.push({ st: s, p: Math.min(1, e.ch / 100 * u.ef.chanceMult * multTipo * (u.ef.multStatus[s] || 1) / dividir), doGolpe: true, ignoraGenero: false }); });
    }
    u.ef.statusAtaque.forEach(function (a) {
      var fl = a.filtro;
      if (fl.cat && cats.indexOf(fl.cat) === -1) return;
      if (fl.som && !g.som) return;
      if (fl.contato && !g.contato) return;
      if (fl.tipo && fl.tipo !== g.tipo) return;
      if (fl.especial && g.cat !== "E") return;
      a.st.forEach(function (s) {
        if (a.porTipo && STATUS_DO_TIPO_DUELO[g.tipo] !== s) return;
        out.push({ st: s, p: g.contato ? a.pContato : a.pOutro, doGolpe: false, ignoraGenero: a.ignoraGenero });
      });
    });
    return out.filter(function (s) { return s.p > 0; });
  }
  // Chance (por golpe) de cada status cair em "def" durante a luta: os do golpe de
  // "atq" + os da defesa de "atq" disparados pelo golpe de "def" (Flame Body,
  // Static...). Tipo e habilidade de "def" dão imunidade; Shield Dust barra só o
  // efeito extra do golpe.
  // Imunidade de tipo e de habilidade ao status.
  function podeSofrerStatusDuelo(u, s) {
    if (u.ef.imuneStatus[s]) return false;
    // Lum/Chesto Berry não entram aqui (revisão de 2026-09-30): são de uso único e
    // o Unnerve do rival barra - o sono por chance já desconta a Lum (itemAtivoDuelo
    // em "fica"), e o plano de sono usa podeDormirDuelo.
    if (s === "sono" && CAMPO_DUELO && CAMPO_DUELO.terreno === "eletrico" && aterradoDuelo(u)) return false;
    if (CAMPO_DUELO && CAMPO_DUELO.terreno === "nevoa" && s !== "recuar" && aterradoDuelo(u)) return false; // Misty Terrain
    return !(STATUS_DUELO[s].imunes || []).some(function (tp) { return u.tipos.indexOf(tp) !== -1; });
  }
  // Item que põe status no próprio portador (Guts, Flare Boost, Poison Heal...).
  var ORBE_DE_STATUS_DUELO = { "Flame Orb": "queimar", "Toxic Orb": "envenenarForte" };
  function chancesDeStatusNoDuelo(atq, def, gAtq, gDef) {
    var falta = {};
    function soma(s, p, ignoraGenero) {
      if (!podeSofrerStatusDuelo(def, s)) return;
      if (s === "paixao" && !ignoraGenero) p *= 0.5; // só gênero oposto: metade dos casos
      falta[s] = (falta[s] === undefined ? 1 : falta[s]) * (1 - Math.min(1, p));
    }
    // Status certo na entrada (Let's Dance: confunde o campo).
    Object.keys(atq.ef.statusNaEntrada || {}).forEach(function (s) { soma(s, atq.ef.statusNaEntrada[s], false); });
    var capa = def.ef.imuneEfeitoDeGolpe || (def.it && def.it.imuneEfeito); // Shield Dust, Covert Cloak
    if (gAtq) (gAtq.status || []).forEach(function (s) { if (!(s.doGolpe && capa)) soma(s.st, s.p, s.ignoraGenero); });
    if (gAtq && atq.it && atq.it.recuar && !capa) soma("recuar", atq.it.recuar * itemAtivoDuelo(atq, def, gDef ? gDef.contato : undefined), false); // King's Rock
    if (gDef) atq.ef.statusDefesa.forEach(function (a) {
      if (a.filtro.especial && gDef.cat !== "E") return;
      var contatoDeVerdade = gDef.contato && !(def.it && def.it.semEfeitoContato); // Protective Pads
      a.st.forEach(function (s) { soma(s, contatoDeVerdade ? a.pContato : a.pOutro, a.ignoraGenero); });
    });
    var out = {};
    Object.keys(falta).forEach(function (s) { if (falta[s] < 1) out[s] = 1 - falta[s]; });
    // Status encadeado (Poison Puppeteer: veneno também confunde; Entrance: confusão também apaixona).
    Object.keys(out).forEach(function (s) {
      var extra = atq.ef.encadeiaStatus[s];
      if (extra && podeSofrerStatusDuelo(def, extra)) out[extra] = 1 - (1 - (out[extra] || 0)) * (1 - out[s]);
    });
    return out;
  }
  var NOME_DA_CATEGORIA = { soco: "soco", mordida: "mordida", corte: "corte", pulso: "pulso/canhão", chifre: "chifre", chute: "chute", flecha: "flecha", martelo: "martelo" };
  function sinergiasDaEspecie(sp) {
    var lista = (ABILITY_SYNERGY[sp.sname] || []).slice();
    var inn = uniqueIds(sp.inn || []), esc = uniqueIds(sp.ab || []);
    var ids = uniqueIds(inn.concat(esc));
    var golpes = uniqueIds((sp.lm || []).map(function (p) { return p[1]; }).concat(sp.tu || []));
    ids.forEach(function (id) {
      var nome = nomeHabDuelo(id);
      var cats = categoriasDaHabilidade(id);
      cats.forEach(function (cat) {
        var comCat = golpes.filter(function (g) { return categoriasDoGolpeDuelo(g).indexOf(cat) !== -1 && MOVES[g][3] > 0; })
          .map(function (g) { return MOVES[g][0]; });
        if (!comCat.length) return;
        var ja = lista.filter(function (h) { return h.name === nome; })[0];
        if (ja) { ja.golpes = uniqueIds((ja.golpes || []).concat(comCat)); return; }
        lista.push({ name: nome, kind: inn.indexOf(id) !== -1 ? "inn" : "ab", categoria: NOME_DA_CATEGORIA[cat] || cat, golpes: comCat });
      });
      // Serene Grace (dobra a chance) e Sheer Force (troca o efeito por força):
      // rendem nos golpes que têm efeito extra por chance.
      var efH = efeitoDasHabilidadesNoDuelo([id], "CATEGORIAS_" + id, null);
      if (efH.chanceMult === 1 && !efH.semEfeitoExtra) return;
      var comEfeito = golpes.filter(function (g) {
        var e = typeof MOVE_CATEGORIAS !== "undefined" ? MOVE_CATEGORIAS[g] : null;
        if (!e || !e.ch || !(MOVES[g][3] > 0)) return false;
        return efH.semEfeitoExtra ? temEfeitoExtraDuelo(e) : e.ch < 100 && !!(STATUS_DO_EFEITO_DUELO[e.ef] || e.ef === "Flinch Status");
      }).map(function (g) { return MOVES[g][0]; });
      if (comEfeito.length && !lista.some(function (h) { return h.name === nome; })) {
        lista.push({ name: nome, kind: inn.indexOf(id) !== -1 ? "inn" : "ab", categoria: "efeito extra", golpes: comEfeito });
      }
    });
    return lista;
  }
  // Golpe cujo efeito extra o Sheer Force troca por força (não os que sobem os
  // atributos do próprio usuário).
  function temEfeitoExtraDuelo(e) { return !!e.ch && /Hit$|Fang$|Status$|Tri Attack/.test(e.ef) && !/ Up/.test(e.ef); }
  // Categorias que uma habilidade reforça, pelo texto (sem depender de espécie).
  function categoriasDaHabilidade(id) {
    var ef = efeitoDasHabilidadesNoDuelo([id], "CATEGORIAS_" + id, null);
    // + categorias que ganham status por chance (Solenoglyphs, Deep Cuts...).
    return Object.keys(ef.bonusCategoria).concat(Object.keys(ef.categoriaExtra))
      .concat(ef.statusAtaque.map(function (a) { return a.filtro.cat; }).filter(Boolean))
      .filter(function (c, i, a) { return a.indexOf(c) === i; });
  }
  // `climaDaLuta` (2026-09-29, usuário: "no time temos um Poke que seta sol e no
  // mesmo time um que usa Solar Beam, logo a estratégia do time é feita"): o
  // clima é do CAMPO - armado pelo próprio Pokémon, por alguém do time ou pelo
  // chefão, liga as habilidades condicionais de quem estiver em campo.
  function efeitoDasHabilidadesNoDuelo(ids, sname, climaDaLuta) {
    var chave = sname + "|" + ids.join(",") + "|" + (climaDaLuta || "");
    if (cacheEfeitoDuelo[chave]) return cacheEfeitoDuelo[chave];
    var ef = { ate: null, ateMult: 1, converte: {}, stabMult: 1.5, stabExtra: [], stabTodos: false, tipoExtra: [],
      atkMult: 1, spaMult: 1, speMult: 1, fisicoMult: 1, especialMult: 1, danoMult: 1,
      reducao: { F: 1, E: 1, todos: 1, superEf: 1, contato: 1 }, resistTipo: {}, vsTipo: {},
      intimida: 0, assusta: 0, imuneIntimida: false, imuneAssusta: false,
      prioridadeNoPrimeiro: false, prioTipoCheio: [], prioMult: 1,
      bonusTipo: {}, bonusGolpes: {}, golpeExtra: 1, seguimento: null, contraTipo: {},
      tecnico: null, resistidoX2: false, seBonus: 1, skillLink: false,
      precisaoMult: 1, semErrar: false, semErrarContraMim: false,
      quebraHabilidade: false, bloqueiaBonus: false, aguenta: false,
      somMult: 1, somVira: null, ataqueExtra: [], defesaPelaVelocidade: null,
      defMult: 1, spdMult: 1, chloroplast: false,
      bonusCategoria: {}, categoriaEspecial: {}, categoriaNaSpDef: {}, categoriaExtra: {},
      statusAtaque: [], statusDefesa: [], imuneStatus: {}, chanceMult: 1, semEfeitoExtra: 0,
      semResiduo: false, semResiduoDe: {}, imuneEfeitoDeGolpe: false,
      critEstagio: 0, critTodos: 0, critContato: 0, critBP: null, critCategoria: {}, sempreCritGolpe: {},
      critSuperEf: false, critContraStatus: [], critPrimeiroTurno: false, critMult: 1.5, critVsResistido: 1,
      critSangra: false, imuneCritico: false, critRecebido: 1,
      statusProprio: [], ultimoMult: 1, critUltimo: 0, antesReducao: 0, prioNoFinal: false,
      prioCheioCategoria: {}, prioCheioSom: false, teraShell: false, reviveHP: 0, curaStatus: 0,
      estagioEntrada: {}, download: false, aoApanhar: [], aoApanharAtacante: [], porTurno: {}, aoGolpear: [],
      aoSerReduzido: {}, imuneQuedas: {}, ignoraEstagios: false, estagioMult: 1, ruina: {}, berserk: false,
      bonusContraReduzido: 1,
      primeiroTurnoMult: 1, cargaInstantanea: false, truant: false, bloqueiaUmGolpe: false, contraAtaque: null,
      ataqueNaEntrada: 0, seguimentoCategoria: [], aoUsar: [], limpaBuffsNaEntrada: false, quedaNaEntrada: {},
      maiorNaEntrada: 0, maiorAtaqueNaEntrada: 0, shellSmashNaMetade: false, inverteIntimida: false, dobraQuedas: false,
      encadeiaStatus: {},
      curaPorTurno: 0, curaEnvenenado: 0, drenoPct: 0, drenoContato: 0, contatoMult: 1, danoAoContato: 0,
      semRecuo: false, recuoMult: 1, custoPorAtaque: 0, custoTipo: {}, bloqueiaCura: false, liquidOoze: false,
      multStatus: {}, multChanceTipo: {}, evasao: 1, imuneFlag: {}, ignoraResist: {}, bloqueiaSuperEf: false, soSuperEf: false,
      bloqueios: 0, sempreResiste: 0, defesaExtraVel: 0, categoriaPorTipo: {}, somPorTipo: {}, semErrarCategoria: {},
      menorDefesaCategoria: {}, menorDefesaSeStatus: false, flagMult: {}, prioTipoSempre: [], drenoTipo: {}, malicious: false,
      equinox: false, maiorMult: 0, ritmico: 0, bonusVsStatus: {}, drenoMult: 1, sementeNoDreno: false, carregaAoApanhar: false,
      campoResiduo: [], statusNaEntrada: {}, forcaUltimo: false, semStabOutros: false, recuoFrac: 1,
      seQuebra: false, venenoReduz: false, mudaTipoNoContato: null, telaNaEntrada: 0, imuneTipoNaEntrada: null,
      sincroniza: false, almaLigada: false, drenoCategoria: {},
      armaTerreno: null, limpaTerreno: false, sala: 0, inversa: 0, vento: 0, gravidade: false, limpaSala: false,
      infiltra: false, limpaTelas: false, noTerreno: [], carregaNaEntrada: false,
      klutz: false, gostaDeBaga: false, bagaCedo: false, bagaCuraMin: 0, ripen: false, colheita: 0, rumina: false, unburden: false,
      desligaItem: false, roubaContato: false, roubaSemContato: false, seguraItem: false, nervoso: false,
      aoNocautear: [], curaAoNocautear: 0, devora: 0, porDesmaio: 0, aoDesmaiarGolpe: 0, aoDesmaiarDevolve: false,
      aoDesmaiarMaldicao: false, aoDesmaiarQueda: 0, aoDesmaiarTiraGolpe: false, perecer: 0, hazards: [], limpaHazards: false,
      regenera: 0, curaAoSair: false,
      aliadoDano: {}, aliadoReducao: 1, plusMinus: false, bloqueiaPrioLado: false, telepatia: false, hospitalidade: 0, aliadoPrecisao: 0,
      aliadoEspecial: 0, aliadoMaior: 0, reiDosRatos: null, aliadoImuneSom: false, aliadoImuneStatus: {}, protegeGrass: false,
      porAliadoCaido: 0, vinganca: 0, lacaios: false, comandante: false, copiaAliado: false, copiaGolpe: null,
      refleteStatus: false, imuneGolpeStatus: false, pranksterStatus: false, imuneTaunt: false, acordaCedo: false, bonusVsSono: 0,
      pesadelo: 0, statusIgnoraImune: false, statusSom: false, precisaoGolpe: {}, triage: false, entradaSono: false,
      entradaDisable: false, entradaTorment: false, adicionaFantasma: false, quash: false, po: false,
      prende: null, ignoraDefesa: 0, prisaoForte: false, quedaPorTurno: {}, prisaoParalisa: false, recuoSePrimeiro: 0,
      primeiroGolpeRecebido: 1, expulsaAoApanhar: false, expulsaQuemEnrola: false, naoSaiForcado: false, fogeNaMetade: false,
      fogeAoCair: false, ultimaCartada: false, brasas: false, tocaia: 0, anulaClima: false, ventoForte: false,
      bloqueiaGolpeClima: false, catastrofe: false, aguaNoSol: false, disableAoContato: 0, disableSom: 0, disableComGelo: false,
      saque: 0, barraPrioridade: false, firmeza: false, contraMega: 1, apagao: false, resistSeTipo: null, arquimago: 0,
      espiao: false, pintaAlvo: null, golpeAlterado: {}, golpeTaunt: null, curaComLuta: false, sonoCura: 0,
      curaTimeNaEntrada: false, mimetismo: false, ventoAtaque: false, ventoCarga: false,
      forma: null, cuspe: false, critMetade: false,
      imposter: false, traca: false, gasNeutro: false, mumia: false, malodor: false, espirito: false, hemotoxina: false, quebraAura: false,
      egoista: false, compartilha: false, retribuicao: false, homeRun: false, trocaEstagios: false, pantano: false, alcatrao: false,
      atravessaProtecao: false, protegeNaEntrada: false, semRecarga: false, tudoDanca: false, dancaSom: false, curaAliadoEstagios: false,
      receptor: false, ladrao: false, recuperaItem: false };
    var nomes = ids.map(nomeHabDuelo);
    var climaProprio = {};
    ["chuva", "sol", "areia", "granizo", "nevoa"].forEach(function (c) {
      if (nomes.some(function (n) { return habilidadeArma(n, c); })) climaProprio[c] = true;
    });
    function climaOk(palavra) {
      var c = CLIMA_DO_TEXTO_DUELO[palavra.toLowerCase()];
      return climaProprio[c] || (!!climaDaLuta && c === climaDaLuta);
    }
    function maxEm(obj, k, v) { obj[k] = Math.max(obj[k] || 1, v); }
    ids.forEach(function (id) {
      var t = textoHabDuelo(id), x, m;
      // Frases: corta em ". " seguido de maiúscula, mas não em abreviação do
      // próprio texto do jogo ("Sp. Atk", "Phys. moves", "vs. Steel").
      var frases = t.split(/(?<!\b(?:Sp|Phys|vs|Elec|Fight)\.)(?<=[.!])\s+(?=[A-Z])|\n/).filter(Boolean);
      // --- ofensivo: tipo do golpe e STAB ---
      if ((x = t.match(/Normal(?:-type)? moves? becomes? (\w+)/i)) && tipoDoTextoDuelo(x[1])) { ef.ate = x[1]; ef.ateMult = 1.1; ef.converte.Normal = { para: x[1], mult: 1.1 }; }
      var reConv = /(\w+)-type moves become (\w+)(?: and get a ([\d.]+)x boost)?/gi;
      while ((m = reConv.exec(t))) { if (m[1] !== "Normal" && tipoDoTextoDuelo(m[1]) && tipoDoTextoDuelo(m[2])) ef.converte[m[1]] = { para: m[2], mult: m[3] ? parseFloat(m[3]) : 1 }; }
      if (/Increases STAB from 1\.5x to 2x/i.test(t)) ef.stabMult = 2;
      if (/All moves gain (?:the [\d.]+x power boost from )?STAB/i.test(t)) ef.stabTodos = true;
      var reAdd = /Adds (\w+)[- ]type/gi;
      while ((m = reAdd.exec(t))) { var ta = tipoDoTextoDuelo(m[1]); if (ta) { ef.tipoExtra.push(ta); ef.stabExtra.push(ta); } }
      var reStab = /(\w+)(?:-type)?(?: & (\w+))?(?: moves)? gains? STAB|gains? (\w+)-type STAB/gi;
      while ((m = reStab.exec(t))) { [m[1], m[2], m[3]].forEach(function (p) { var tp = p && tipoDoTextoDuelo(p); if (tp) ef.stabExtra.push(tp); }); }
      // --- ofensivo: atributos e dano ---
      frases.forEach(function (f) {
        if (!fraseFixaDuelo(f)) return;
        var y;
        if (/Doubles own Attack/i.test(f)) ef.atkMult *= 2;
        if (/Doubles own Sp\.?\s?Atk/i.test(f)) ef.spaMult *= 2;
        if ((y = f.match(/(?:Raises|Boosts|Ups) own (?:Atk|Attack) by ([\d.]+)x/i))) ef.atkMult *= parseFloat(y[1]);
        if ((y = f.match(/(?:Raises|Boosts|Ups) own (?:Sp\.? ?Atk|SpAtk|Special Attack) by ([\d.]+)x/i))) ef.spaMult *= parseFloat(y[1]);
        if ((y = f.match(/Ups (?:Special Attack|Sp\.? ?Atk|SpAtk) by (\d+)%/i))) ef.spaMult *= 1 + parseInt(y[1], 10) / 100;
        if ((y = f.match(/Ups (?:Attack|Atk) by (\d+)%/i))) ef.atkMult *= 1 + parseInt(y[1], 10) / 100;
        if ((y = f.match(/([\d.]+)x Attack boost/i))) ef.atkMult *= parseFloat(y[1]);
        if ((y = f.match(/Boosts damage by ([\d.]+)x/i))) ef.danoMult *= parseFloat(y[1]);
        if ((y = f.match(/Does (\d+)% more damage but/i))) ef.danoMult *= 1 + parseInt(y[1], 10) / 100;
        if ((y = f.match(/Physical moves get a ([\d.]+)x (?:bonus|boost)/i))) ef.fisicoMult *= parseFloat(y[1]);
        if ((y = f.match(/Special moves get a ([\d.]+)x (?:bonus|boost)/i))) ef.especialMult *= parseFloat(y[1]);
        if ((y = f.match(/Boosts Speed by ([\d.]+)x/i))) ef.speMult *= parseFloat(y[1]);
        if ((y = f.match(/Speed is ([\d.]+)x/i))) ef.speMult *= parseFloat(y[1]);
        if ((y = f.match(/decreases Speed by (\d+)%/i))) ef.speMult *= 1 - parseInt(y[1], 10) / 100;
        if ((y = f.match(/Boosts (\w+) moves by (\d+)%/i)) && tipoDoTextoDuelo(y[1])) maxEm(ef.bonusTipo, y[1], 1 + parseInt(y[2], 10) / 100);
        // --- defensivo: dano recebido ---
        if ((y = f.match(/Takes -(\d+)% (special|physical) damage/i))) ef.reducao[/^s/i.test(y[2]) ? "E" : "F"] *= 1 - parseInt(y[1], 10) / 100;
        if ((y = f.match(/Takes (\d+)% less (?:damage )?(?:from )?(Special|Physical|Phys\.)?(?! ?Super)[^.]*?(?:attacks|moves|damage)?/i)) && !/Super-?effective|sound/i.test(f)) {
          var qual = y[2] ? (/^s/i.test(y[2]) ? "E" : "F") : "todos";
          ef.reducao[qual] *= 1 - parseInt(y[1], 10) / 100;
        }
        if ((y = f.match(/Reduces (special|physical) damage taken by (\d+)%/i))) ef.reducao[/^s/i.test(y[1]) ? "E" : "F"] *= 1 - parseInt(y[2], 10) / 100;
        if ((y = f.match(/Takes ([\d.]+)x damage from (\w+?)s\b/i)) && tipoDoTextoDuelo(y[2])) ef.resistTipo[y[2]] = parseFloat(y[1]);
        if ((y = f.match(/Deals ([\d.]+)x damage to (\w+?)s\b/i)) && tipoDoTextoDuelo(y[2])) ef.vsTipo[y[2]] = parseFloat(y[1]);
      });
      if (/Quarters contact damage taken/i.test(t)) ef.reducao.contato *= 0.25;
      // --- bônus por tipo/categoria (o 1º número é o fixo; "ou 1.5x com HP baixo" fica de fora) ---
      var reTipo = /Boosts (?:the power of )?([A-Za-z.]+?)(?:-type)?(?: and [\w-]+)? moves by ([\d.]+)x|Ups own (\w+) moves by ([\d.]+)x|(\w+)-type moves deal ([\d.]+)x damage/gi, mt;
      while ((mt = reTipo.exec(t))) {
        var tipo = tipoDoTextoDuelo(mt[1] || mt[3] || mt[5]), mult = parseFloat(mt[2] || mt[4] || mt[6]);
        if (tipo) maxEm(ef.bonusTipo, tipo, mult);
      }
      if ((x = t.match(/(\w+)-type and (\w+)-type moves get a ([\d.]+)x power boost/i))) {
        [x[1], x[2]].forEach(function (p) { var tp = tipoDoTextoDuelo(p); if (tp) maxEm(ef.bonusTipo, tp, parseFloat(x[3])); });
      }
      if ((x = t.match(/Moves with (\d+) BP or less get a ([\d.]+)x boost/i))) ef.tecnico = { limite: parseInt(x[1], 10), mult: parseFloat(x[2]) };
      if ((x = t.match(/Priority moves get a ([\d.]+)x boost/i))) ef.prioMult = parseFloat(x[1]);
      if ((x = t.match(/Sound moves get a ([\d.]+)x boost and become (\w+) if Normal/i))) { ef.somMult *= parseFloat(x[1]); if (tipoDoTextoDuelo(x[2])) ef.somVira = x[2]; }
      if ((x = t.match(/Sound moves deal ([\d.]+)x more dmg/i))) ef.somMult *= parseFloat(x[1]);
      if ((x = t.match(/Ups sound moves by (\d+)%/i))) ef.somMult *= 1 + parseInt(x[1], 10) / 100;
      // --- categoria de golpe (soco, mordida, corte...), pela marcação do NextDex ---
      // (data/move_categorias.json; 2026-09-29: antes nenhuma destas era lida).
      // O texto do jogo tem "Beam/Pump/Cannon/Shot/ Gun/Pulse, etc. moves" (Mega
      // Launcher) e "horn and drill-based by 1.3x" (Mighty Horn, sem "moves").
      var reCat = /Boosts (?:the power of )?(.{1,60}?)(?: moves)? by ([\d.]+)x/gi, mc;
      while ((mc = reCat.exec(t))) {
        categoriasDoTextoDuelo(mc[1]).forEach(function (cat) { maxEm(ef.bonusCategoria, cat, parseFloat(mc[2])); });
      }
      frases.forEach(function (f) {
        var cats = categoriasDoTextoDuelo((f.match(/^(.*?) moves /i) || [])[1] || "");
        if (!cats.length) return;
        var y = f.match(/([\d.]+)x (?:boost|power)/i) || f.match(/(\d+)% more/i);
        var mult = y ? (/%/.test(y[0]) ? 1 + parseInt(y[1], 10) / 100 : parseFloat(y[1])) : 1;
        if (/moves (?:use (?:Special Attack|SpAtk)|become special)/i.test(f)) cats.forEach(function (c) { ef.categoriaEspecial[c] = true; maxEm(ef.bonusCategoria, c, mult); });
        if (/moves target Special Defense/i.test(f)) cats.forEach(function (c) { ef.categoriaNaSpDef[c] = true; maxEm(ef.bonusCategoria, c, mult); });
        var dois = f.match(/moves hit twice(?:\. 2nd hit does ([\d.]+)x damage| for (\d+)% damage)?/i);
        if (dois) {
          var total = dois[1] ? 1 + parseFloat(dois[1]) : dois[2] ? 2 * parseInt(dois[2], 10) / 100 : 2;
          cats.forEach(function (c) { maxEm(ef.categoriaExtra, c, total); });
        }
      });
      if ((x = t.match(/Biting moves hit twice\. 2nd hit does ([\d.]+)x damage/i))) maxEm(ef.categoriaExtra, "mordida", 1 + parseFloat(x[1]));
      // --- efetividade ---
      if (/(?:Attacks|Moves) deal double damage if resisted/i.test(t)) ef.resistidoX2 = true;
      if ((x = t.match(/additional ([\d.]+)x boost to Super-?effective/i))) ef.seBonus *= parseFloat(x[1]);
      if ((x = t.match(/Ups .?supereffective.? by (\d+)%/i))) ef.seBonus *= 1 + parseInt(x[1], 10) / 100;
      var reSe = /(\w+)(?:-type)? is super effective (?:against|vs\.?) (\w+)(?:-type)?/gi, ms;
      while ((ms = reSe.exec(t))) {
        if (TYPES.indexOf(ms[1]) !== -1 && TYPES.indexOf(ms[2]) !== -1) (ef.contraTipo[ms[1]] = ef.contraTipo[ms[1]] || {})[ms[2]] = 2;
      }
      if (/Normal\/Fighting can hit Ghosts/i.test(t)) { (ef.contraTipo.Normal = ef.contraTipo.Normal || {}).Ghost = 1; (ef.contraTipo.Fighting = ef.contraTipo.Fighting || {}).Ghost = 1; }
      if (/Hits Fairies with Dragon moves/i.test(t)) (ef.contraTipo.Dragon = ef.contraTipo.Dragon || {}).Fairy = 1;
      // --- acertos e precisão ---
      if ((x = t.match(/hit twice\. (?:1st hit at 100% power, )?2nd hit (?:at|does) (\d+)%/i)) || (x = t.match(/Second hit does (\d+)% damage/i))) {
        ef.golpeExtra = Math.max(ef.golpeExtra, 1 + parseInt(x[1], 10) / 100);
      }
      if (/Hits as many times, as it has heads/i.test(t)) ef.golpeExtra = Math.max(ef.golpeExtra, 1.5);
      if ((x = t.match(/After using a (\w+) move, follow up with a (\d+)\s?BP/i))) ef.seguimento = { tipo: x[1], poder: parseInt(x[2], 10) };
      if ((x = t.match(/Triggers (\d+) BP \w+ after using a (\w+)-type move/i)) && tipoDoTextoDuelo(x[2])) ef.seguimento = { tipo: x[2], poder: parseInt(x[1], 10) };
      if (/Multi-hit moves always hit the maximum/i.test(t)) ef.skillLink = true;
      if ((x = t.match(/Grants a ([\d.]+)x accuracy boost/i)) || (x = t.match(/(?:^|[.;] )([\d.]+)x accuracy/i))) ef.precisaoMult *= parseFloat(x[1]);
      if ((x = t.match(/\+(\d+)% accuracy/i))) ef.precisaoMult *= 1 + parseInt(x[1], 10) / 100;
      if (/Moves always hit/i.test(t)) ef.semErrar = true;
      if (/Attacks used by and on this Pok[eé]mon bypass accuracy/i.test(t)) { ef.semErrar = true; ef.semErrarContraMim = true; }
      // --- atributo usado no ataque / na defesa ---
      if ((x = t.match(/uses \+(\d+)% of its Defense or SpDef during moves/i))) ef.ataqueExtra.push({ fonte: "defesa", pct: parseInt(x[1], 10) / 100 });
      if ((x = t.match(/Contact moves add (\d+)% Def to attack/i))) ef.ataqueExtra.push({ fonte: "def", pct: parseInt(x[1], 10) / 100, contato: true });
      if ((x = t.match(/Contact moves use (\d+)% of its Speed stat additionally/i))) ef.ataqueExtra.push({ fonte: "spe", pct: parseInt(x[1], 10) / 100, contato: true });
      if (/Contact moves use the Speed stat for damage/i.test(t)) ef.ataqueExtra.push({ fonte: "spe", troca: true, contato: true });
      if (/Non-contact moves use the Speed stat for damage/i.test(t)) ef.ataqueExtra.push({ fonte: "spe", troca: true, contato: false });
      if (/Uses Def and Sp\. Def instead of Atk and Sp\. Atk when attacking/i.test(t)) ef.ataqueExtra.push({ fonte: "defesa", troca: true });
      if (/Uses Speed as defense stat when hit by non-contact/i.test(t)) ef.defesaPelaVelocidade = { contato: false };
      if (/Uses Speed as defense stat when hit by contact/i.test(t)) ef.defesaPelaVelocidade = { contato: true };
      // --- entrada em campo e interação entre habilidades ---
      if ((x = t.match(/Lowers foes'? Atk by (one|two) stages? on entry/i))) ef.intimida = Math.max(ef.intimida, ESTAGIOS_DUELO[x[1].toLowerCase()]);
      if ((x = t.match(/Lowers foes'? Sp\.? ?Atk by (one|two) stages? on entry/i))) ef.assusta = Math.max(ef.assusta, ESTAGIOS_DUELO[x[1].toLowerCase()]);
      if (/^Intimidate\b/.test(t)) ef.intimida = Math.max(ef.intimida, 1);
      if (/Immune to [^.]*Intimidate/i.test(t)) ef.imuneIntimida = true;
      if (/Immune to [^.]*Scare/i.test(t)) ef.imuneAssusta = true;
      if (/Moves hit through abilities/i.test(t)) ef.quebraHabilidade = true;
      if (/Blocks most damage boosting and multihit abilities/i.test(t)) ef.bloqueiaBonus = true;
      if (/At full HP, cannot be KO in one hit/i.test(t)) ef.aguenta = true;
      // --- prioridade ---
      if (/\+1 priority for the first turn/i.test(t)) ef.prioridadeNoPrimeiro = true;
      var rePrio = /(\w+)-type moves get \+1 priority at (?:max|full) HP|At full HP, gives \+1 priority to its (\w+)-type moves/gi;
      while ((m = rePrio.exec(t))) { var tpp = tipoDoTextoDuelo(m[1] || m[2]); if (tpp) ef.prioTipoCheio.push(tpp); }
      // --- clima que o próprio dono arma ---
      if ((x = t.match(/Ups highest attacking stat by ([\d.]+)x in (rain|sun|sand|hail|fog)/i)) && climaOk(x[2])) {
        ef.atkMult *= parseFloat(x[1]); ef.spaMult *= parseFloat(x[1]);
      }
      if ((x = t.match(/Speed gets a ([\d.]+)x boost (?:if|in) (?:a )?(rain|sun|sandstorm|hail|fog)/i)) && climaOk(x[2])) ef.speMult *= parseFloat(x[1]);
      // --- o que o clima do campo liga (do próprio, do time ou do chefão) ---
      if (/Solar Beam\/Blade[^.]*act as if used in sun/i.test(t)) ef.chloroplast = true;
      if ((x = t.match(/reduces (physical|special) damage by 1\/2 in (sun|sand|rain|hail|fog)/i)) && climaOk(x[2])) ef.reducao[/^s/i.test(x[1]) ? "E" : "F"] *= 0.5;
      if ((x = t.match(/Sand reduces damage by (\d+)%/i)) && climaOk("sand")) ef.reducao.todos *= 1 - parseInt(x[1], 10) / 100;
      if ((x = t.match(/Takes (\d+)% less damage if (\w+) is active/i)) && CLIMA_DO_TEXTO_DUELO[x[2].toLowerCase()] && climaOk(x[2])) ef.reducao.todos *= 1 - parseInt(x[1], 10) / 100;
      if ((x = t.match(/Ups (SpDef|Def) by ([\d.]+)x in (rain|sun|sand|hail|fog)/i)) && climaOk(x[3])) { if (/Sp/i.test(x[1])) ef.spdMult *= parseFloat(x[2]); else ef.defMult *= parseFloat(x[2]); }
      if ((x = t.match(/(\w+)-type moves hit twice in (rain|sun|sand|hail|fog)/i)) && climaOk(x[2]) && tipoDoTextoDuelo(x[1])) maxEm(ef.bonusTipo, x[1], 2);
      if ((x = t.match(/Ups speed by (\d+)% in (sun|rain|sand|hail|fog)(?: or (sun|rain|sand|hail|fog))?/i)) && (climaOk(x[2]) || (x[3] && climaOk(x[3])))) ef.speMult *= 1 + parseInt(x[1], 10) / 100;
      // --- defensivo com condição de HP cheio / super efetivo / contato ---
      if (!/\bif\b|\bwhen\b|\bwhile\b|\bin (rain|sun|sand|hail|fog)\b/i.test(t)) {
        if (/Halves damage taken by Physical/i.test(t)) ef.reducao.F *= 0.5;
        if (/Halves damage taken by Special/i.test(t)) ef.reducao.E *= 0.5;
        if ((x = t.match(/Takes (\d+)% less damage from Super-?effective/i))) ef.reducao.superEf *= 1 - parseInt(x[1], 10) / 100;
        if (/1\/2 dmg from contact/i.test(t)) ef.reducao.contato *= 0.5;
        if ((x = t.match(/Weakens incoming physical and special moves by (\d+)%/i))) ef.reducao.todos *= 1 - parseInt(x[1], 10) / 100;
        if (/deal min damage/i.test(t)) ef.reducao.todos *= 0.85 / ROLAGEM_MEDIA_DUELO;
      }
      if (/At full HP, halves damage/i.test(t)) ef.reducao.todos *= 0.75;
      // Primeiro turno (Violent Rush, Rapid Response): o duelo é curto e o 1º turno
      // decide quem bate primeiro - aproximação: vale o duelo todo.
      if ((x = t.match(/Boosts Speed by (\d+)% \+ (Attack|SpAtk|Sp\. ?Atk) by (\d+)% on first turn/i))) {
        ef.speMult *= 1 + parseInt(x[1], 10) / 100;
        if (/Attack/i.test(x[2]) && !/Sp/i.test(x[2])) ef.atkMult *= 1 + parseInt(x[3], 10) / 100; else ef.spaMult *= 1 + parseInt(x[3], 10) / 100;
      }
      // --- status por chance: quem causa (ataque/defesa) e quem é imune ---
      if (/Doubles chance of secondary effects/i.test(t)) ef.chanceMult = 2;
      if ((x = t.match(/Exchanges added effects on its moves for ([\d.]+)x/i))) ef.semEfeitoExtra = parseFloat(x[1]);
      if (/Only damaged by attacks/i.test(t)) ef.semResiduo = true;
      if (/Immune to added move effects/i.test(t)) ef.imuneEfeitoDeGolpe = true;
      frases.forEach(function (f) {
        lerStatusDaFraseDuelo(f, ef, t); lerCriticoDaFraseDuelo(f, ef); lerCondicaoDaFraseDuelo(f, ef, climaOk); lerEstagioDaFraseDuelo(f, ef, climaOk, t);
        lerExtrasDaFraseDuelo(f, ef, climaOk); lerCuraDaFraseDuelo(f, ef, climaOk); lerDiversosDaFraseDuelo(f, ef, climaOk);
        lerCampoDaFraseDuelo(f, ef); lerItemDaFraseDuelo(f, ef, climaOk); lerSequenciaDaFraseDuelo(f, ef); lerDuplaDaFraseDuelo(f, ef, climaOk); lerStatusGolpeDaFraseDuelo(f, ef); lerRestoDaFraseDuelo(f, ef, climaOk); lerFormaDaFraseDuelo(f, ef); lerSupressaoDaFraseDuelo(f, ef); lerLote4DaFraseDuelo(f, ef);
      });
    });
    ef.stabExtra = ef.stabExtra.filter(function (tp, i, a) { return a.indexOf(tp) === i; });
    ef.tipoExtra = ef.tipoExtra.filter(function (tp, i, a) { return a.indexOf(tp) === i; });
    (ABILITY_SYNERGY[sname] || []).forEach(function (h) {
      var id = ids.filter(function (i) { return nomeHabDuelo(i) === h.name; })[0];
      if (id === undefined) return;
      var t = textoHabDuelo(id);
      var x = t.match(/(\d+(?:\.\d+)?)x/) || t.match(/(\d+)%/);
      var mult = x ? (/%$/.test(x[0]) ? 1 + parseInt(x[1], 10) / 100 : parseFloat(x[1])) : 1.3;
      (h.golpes || []).forEach(function (g) { ef.bonusGolpes[g] = Math.max(ef.bonusGolpes[g] || 1, Math.min(mult, 2)); });
    });
    ef.climasProprios = Object.keys(climaProprio); // climas que as próprias habilidades armam
    cacheEfeitoDuelo[chave] = ef;
    return ef;
  }
  // Clima no campo entre os dois lados: o que cada um arma (habilidade) ou o do
  // time (u.clima). Se os dois armam climas diferentes, depende de quem entra por
  // último - fica sem clima (não dá pra saber no modelo por valor esperado).
  // Sem criar listas: roda em todo cálculo de dano, o ponto mais quente do motor
  // (medido na Fase 3, 2026-09-30: a versão com concat/filter deixava o botão do
  // chefão ~1 s mais lento).
  function climaNoCampoDuelo(a, b) {
    var achado = null, conflito = false;
    function ve(c) { if (!c || conflito) return; if (achado === null) achado = c; else if (achado !== c) conflito = true; }
    ve(a.clima); ve(b.clima);
    var pa = a.ef.climasProprios, pb = b.ef.climasProprios, i;
    if (pa) for (i = 0; i < pa.length; i++) ve(pa[i]);
    if (pb) for (i = 0; i < pb.length; i++) ve(pb[i]);
    return conflito ? null : achado;
  }

  // ---------- golpes prontos e dano ----------
  function temSomDuelo(m) { return (m[8] || []).some(function (i) { return DATA.flags[i] === "Sound Based"; }); }
  // Cada golpe guarda a força sem os bônus de habilidade (forcaBase) e com eles
  // (forca): Wonder Skin/Fort Knox do defensor anulam os bônus do atacante.
  function prepararGolpesDuelo(ids, u, clima) {
    var reforcado = TIPO_REFORCADO_PELO_CLIMA[clima];
    // Golpe de carga só entra se não precisa carregar: Solar Beam/Solar Blade no
    // sol ou com Chloroplast ("Solar Beam/Blade ... act as if used in sun").
    ids = ids.filter(function (id) {
      // False Swipe/Hold Back (120 de poder neste hack) deixam o alvo com 1 HP: numa
      // luta por nocaute não fecham nada (revisão de 2026-09-30 - o False Swipe
      // aparecia entre os golpes mais fortes do Garchomp).
      var cat = typeof MOVE_CATEGORIAS !== "undefined" ? MOVE_CATEGORIAS[id] : null;
      if (cat && cat.ef === "False Swipe") return false;
      if (!/no primeiro turno|turno seguinte/i.test(MOVE_PT[id] || "")) return true;
      if (u.ef.cargaInstantanea || (u.it && u.it.cargaUmaVez)) return true; // Accelerate, Power Herb
      return /^Solar (Beam|Blade)$/.test(MOVES[id][0]) && (clima === "sol" || u.ef.chloroplast);
    });
    var lista = ids.map(function (id) {
      var m = MOVES[id];
      var tipo = TYPES[m[1]], hab = 1;
      var conv = u.ef.converte[tipo];
      if (conv) { tipo = conv.para; hab *= conv.mult; }
      var som = temSomDuelo(m) || !!u.ef.somPorTipo[tipo]; // Reverberate: Normal vira som
      if (som) { if (tipo === "Normal" && u.ef.somVira) tipo = u.ef.somVira; hab *= u.ef.somMult; }
      var cat = categoriaNoDuelo(m, u.stats[1], u.stats[3]);
      var cats = categoriasDoGolpeDuelo(id);
      // Categoria ganha pela habilidade (Mixed Martial Arts, Brawling Wyvern, JunshiSanda...).
      cats = cats.concat(u.ef.categoriaPorTipo[tipo] || []);
      cats.slice().forEach(function (c) { cats = cats.concat(u.ef.categoriaPorTipo["cat:" + c] || []); });
      cats = cats.filter(function (c, i, a) { return a.indexOf(c) === i; });
      var flags = (m[8] || []).map(function (i) { return DATA.flags[i]; });
      if (u.ef.tudoDanca && flags.indexOf("Dance Move") === -1) flags = flags.concat(["Dance Move"]); // Taekkyeon
      if (u.ef.dancaSom) { if (som && flags.indexOf("Dance Move") === -1) flags = flags.concat(["Dance Move"]); if (flags.indexOf("Dance Move") !== -1) som = true; } // Festivities
      if (u.ef.flagMult["Air/Wing Based"] && flags.indexOf("Air/Wing Based") !== -1) hab *= u.ef.flagMult["Air/Wing Based"].mult;
      // Categoria que a habilidade torna especial (Mind Crunch, Magical Fists...)
      // ou que mira a Defesa Especial (Power Fists, Power Edge).
      if (cats.some(function (c) { return u.ef.categoriaEspecial[c]; })) cat = "E";
      var defEspecial = cats.some(function (c) { return u.ef.categoriaNaSpDef[c]; });
      var stabNatural = u.tipos.indexOf(tipo) !== -1;
      var stabHab = !stabNatural && (u.ef.stabTodos || u.ef.stabExtra.indexOf(tipo) !== -1);
      var base = stabNatural ? 1.5 : 1;
      if (stabNatural) hab *= u.ef.stabMult / 1.5;
      if (stabHab) hab *= u.ef.stabMult;
      hab *= u.ef.bonusTipo[tipo] || 1;
      // Bônus de categoria: a marcação do NextDex (bonusCategoria) e a sinergia com o
      // movepool (bonusGolpes, por marcação de golpe) podem apontar o MESMO bônus -
      // vale o maior, nunca os dois multiplicados.
      var porCategoria = cats.reduce(function (mx, c) { return Math.max(mx, u.ef.bonusCategoria[c] || 1); }, 1);
      hab *= Math.max(porCategoria, u.ef.bonusGolpes[m[0]] || 1);
      hab *= cats.reduce(function (mx, c) { return Math.max(mx, u.ef.categoriaExtra[c] || 1); }, 1);
      hab *= u.ef.golpeExtra;
      // Golpe alterado pela habilidade (Giant Shuriken, Wrestle Showman). Lido ANTES
      // do poder (revisão de 2026-09-30: lido depois, o poder novo nunca valia e a
      // Giant Shuriken deixava o Water Shuriken mais fraco - 1 acerto de 15).
      var alt = u.ef.golpeAlterado[m[0]];
      var poder = alt && alt.poder ? alt.poder : m[3] + (alt && alt.mais ? alt.mais : 0);
      if (u.ef.tecnico && poder <= u.ef.tecnico.limite) hab *= u.ef.tecnico.mult;
      if ((m[7] || 0) > 0) hab *= u.ef.prioMult;
      if (reforcado && tipo === reforcado) base *= CLIMA_OFICIAL.reforcoSolChuva; // oficial: +20% (Weather Rework), não o 1,5x da série
      // Série: Water no sol e Fire na chuva saem pela metade (Catastrophe: reforçam; Nika: Water normal no sol).
      var enfraquecido = { sol: "Water", chuva: "Fire" }[clima];
      if (enfraquecido && tipo === enfraquecido && !(clima === "sol" && u.ef.aguaNoSol)) base *= u.ef.catastrofe ? CLIMA_OFICIAL.reforcoSolChuva : 0.5; // Catastrophe: o mesmo reforço do clima
      if (u.ef.seguimento && u.ef.seguimento.tipo === tipo) hab *= (poder + u.ef.seguimento.poder) / poder;
      u.ef.seguimentoCategoria.forEach(function (sg) {
        var vale = sg.quais === "todos" || (sg.quais === "som" && som) || (sg.quais === "danca" && flags.indexOf("Dance Move") !== -1) || cats.indexOf(sg.quais) !== -1;
        if (vale && poder > 0) hab *= (poder + sg.poder) / poder;
      });
      var acertos = acertosDoGolpeDuelo(id);
      if (u.ef.skillLink && acertos === 3 && /2 a 5/i.test(MOVE_PT[id] || "")) acertos = 5;
      else if (u.it && u.it.dadoCarregado && acertos === 3 && /2 a 5/i.test(MOVE_PT[id] || "")) acertos = 4.5; // Loaded Dice: 4 ou 5
      if (alt && alt.acertos) acertos = alt.acertos;
      base *= poder * acertos;
      // Sheer Force: golpe com efeito extra perde o efeito e ganha força.
      var extra = typeof MOVE_CATEGORIAS !== "undefined" ? MOVE_CATEGORIAS[id] : null;
      if (u.ef.semEfeitoExtra && extra && temEfeitoExtraDuelo(extra)) hab *= u.ef.semEfeitoExtra;
      // Reckless: golpe com recuo rende mais. Nosferatu: golpe de contato rende mais.
      if (extra && extra.rc) hab *= u.ef.recuoMult;
      var contato = temContatoDuelo(m);
      if (contato) hab *= u.ef.contatoMult;
      // Golpe de recarga com Rampage: sem recarga quando nocauteia - na média, 3/4 do dano por turno.
      if (/descansa no turno/i.test(MOVE_PT[id] || "")) hab *= u.ef.semRecarga ? 0.75 : 0.5;
      var g = { nome: m[0], tipo: tipo, cat: cat, defEspecial: defEspecial, contato: temContatoDuelo(m), som: som, prio: m[7] || 0,
        prioCheio: u.ef.prioTipoCheio.indexOf(tipo) !== -1 || (som && u.ef.prioCheioSom) ||
          cats.some(function (c) { return u.ef.prioCheioCategoria[c]; }),
        precisao: Math.max(m[4] > 0 && m[4] <= 100 ? m[4] / 100 : 1, u.ef.precisaoGolpe[m[0]] || 0), forcaBase: base, forca: base * hab };
      g.area = extra && extra.al ? extra.al : null; // dupla: ambos/todos/aleatorio
      // -2 de Sp. Atk no próprio usuário a cada uso (grupo do Overheat no dado); Simple
      // dobra e Contrary inverte (estagioMult), como em qualquer mudança de estágio.
      if (extra && extra.ef === "Overheat") g.quedaPropriaSpa = 2 * (u.ef.estagioMult || 1);
      g.status = statusDoGolpeDuelo(id, g, cats, u);
      g.crit = criticoDoGolpeDuelo(m, g, cats, u);
      if (alt && alt.crit) g.crit.estagio += alt.crit;
      g.cats = cats;
      g.acertos = acertos;
      g.poder = poder;
      // Custo e retorno por golpe: recuo (fração do dano causado; Rock Head anula),
      // custo em HP (Blood Price, Infernal Rage) e dreno (golpe + habilidade).
      g.recuo = extra && extra.rc && !u.ef.semRecuo ? extra.rc / 100 : 0;
      g.custoHP = u.ef.custoPorAtaque + (u.ef.custoTipo[tipo] || 0);
      g.dreno = (extra && extra.dr ? extra.dr / 100 * u.ef.drenoMult : 0) + u.ef.drenoPct + (contato ? u.ef.drenoContato : 0) + (u.ef.drenoTipo[tipo] || 0) +
        cats.reduce(function (mx, c) { return Math.max(mx, u.ef.drenoCategoria[c] || 0); }, 0); // Vitality Strike
      g.recuo *= u.ef.recuoFrac; // Daredevil: metade do recuo
      if (u.ef.sementeNoDreno && extra && extra.dr) g.status.push({ st: "semente", p: 1, doGolpe: false, ignoraGenero: false }); // Absorbant
      if (u.ef.prioTipoSempre.indexOf(tipo) !== -1) g.prio = Math.max(g.prio, 1); // Galeforce Wings
      if (u.ef.triage && g.dreno > 0 && extra && extra.dr) g.prio = Math.max(g.prio, 3); // Triage: golpe que cura (dreno) com +3
      if (cats.some(function (c) { return u.ef.semErrarCategoria[c]; })) g.precisao = 1; // Deadeye, Roundhouse
      g.flags = flags;
      g.menorDefesa = cats.some(function (c) { return u.ef.menorDefesaCategoria[c]; });
      g.stab = stabNatural || stabHab;
      g.estagios = estagiosDoGolpeDuelo(id, u);
      // To The Bone, Razor Sharp: o crítico também faz sangrar.
      if (u.ef.critSangra) g.status.push({ st: "sangrar", p: g.crit.sempre ? 1 : chanceDoEstagioCrit(g.crit.estagio), doGolpe: false, ignoraGenero: false });
      return g;
    });
    // Poda: por (tipo, categoria, contato) fica só o mais forte - e o melhor de prioridade.
    var melhores = {}, prio = null;
    lista.forEach(function (g) {
      var k = g.tipo + g.cat + g.contato + g.prioCheio;
      if (!melhores[k] || melhores[k].forca * melhores[k].precisao < g.forca * g.precisao) melhores[k] = g;
      if (g.prio > 0 && (!prio || prio.forca < g.forca)) prio = g;
    });
    var out = Object.keys(melhores).map(function (k) { return melhores[k]; });
    if (prio && out.indexOf(prio) === -1) out.push(prio);
    return out;
  }
  // Efetividade do golpe: tabela de tipos + habilidades do DEFENSOR
  // (abilityTypeModFor, resistTipo) + habilidades do ATACANTE (contraTipo,
  // vsTipo). Mold Breaker e parecidas atravessam as habilidades do defensor.
  function efetividadeNoDuelo(atq, tipo, def) {
    var troca = atq.ef.contraTipo[tipo];
    // Gravidade: Ground acerta quem voa (sem o tipo Flying nem Levitate na conta).
    var gravidade = CAMPO_DUELO && CAMPO_DUELO.gravidade && tipo === "Ground";
    var inversa = CAMPO_DUELO && CAMPO_DUELO.inversaAtiva;
    // Trick-or-Treat na entrada (Monster Mash): o outro ganha o tipo Ghost.
    var tiposDef = atq.ef.adicionaFantasma && def.tipos.indexOf("Ghost") === -1 ? def.tipos.concat("Ghost") : def.tipos;
    var raw = tiposDef.reduce(function (m, t) {
      if (gravidade && t === "Flying") return m;
      var v = troca && troca[t] !== undefined ? troca[t] : typeMultiplier(tipo, [t]);
      if (inversa) v = v === 0 || v < 1 ? 2 : v > 1 ? 0.5 : 1; // Inverse Room: a tabela ao contrário
      if (t === "Flying" && v > 1 && (atq.ef.ventoForte || def.ef.ventoForte)) v = 1; // Delta Stream: Flying sem fraqueza
      return m * v;
    }, 1);
    var mult = raw;
    if (!atq.ef.quebraHabilidade && !(gravidade && abilityTypeModFor("Ground", [], def.ids || []).mult === 0)) {
      var r = abilityTypeModFor(tipo, def.tipos, def.ids);
      if (r.raw !== 0 && r.mult === 0) return 0; // imune por habilidade
      if (r.raw > 0) mult *= r.mult / r.raw;
      if (def.ef.resistTipo[tipo] !== undefined) mult *= def.ef.resistTipo[tipo];
      if (def.ef.resistSeTipo && def.ef.resistSeTipo.tipo === tipo && def.tipos.indexOf(def.ef.resistSeTipo.se) !== -1) mult *= 0.5; // Old Mariner
      if (atq.ef.alcatrao && tipo === "Fire") mult *= 2; // Tar Shot na entrada (Tar Toss)
    }
    def.tipos.forEach(function (t) { if (atq.ef.vsTipo[t]) mult *= atq.ef.vsTipo[t]; });
    return mult;
  }
  function ataqueNoDuelo(atq, g) {
    var fisico = g.cat === "F";
    var A = fisico ? atq.stats[1] : atq.stats[3];
    if (atq.ef.equinox) A = Math.max(atq.stats[1], atq.stats[3]); // Equinox: o menor sobe até o maior
    // Protosynthesis e parecidas: o maior atributo x1,3 (no clima).
    if (atq.ef.maiorMult && Math.max.apply(null, atq.stats.slice(1)) === (fisico ? atq.stats[1] : atq.stats[3])) A *= atq.ef.maiorMult;
    atq.ef.ataqueExtra.forEach(function (r) {
      if (r.contato !== undefined && r.contato !== g.contato) return;
      if (r.cat && r.cat !== g.cat) return;
      var fonte = r.fonte === "spe" ? atq.stats[5] : r.fonte === "def" ? atq.stats[2] : r.fonte === "spd" ? atq.stats[4] : (fisico ? atq.stats[2] : atq.stats[4]);
      A = r.troca ? fonte : A + fonte * r.pct;
    });
    return A;
  }
  function danoNoDuelo(atq, def, nivel) {
    var melhor = { dano: 0, prio: 0, golpe: null }, melhorPrio = { dano: 0 }, segundo = { dano: 0 };
    var semBonus = def.ef.bloqueiaBonus && !atq.ef.quebraHabilidade;
    var amuleto = atq.it && atq.it.imuneQuedas; // Clear Amulet
    var intim = def.ef.intimida && !atq.ef.imuneIntimida && !amuleto ? 2 / (2 + def.ef.intimida) : 1;
    var assus = def.ef.assusta && !atq.ef.imuneAssusta && !amuleto ? 2 / (2 + def.ef.assusta) : 1;
    // Quanto do item de cada lado vale nesta luta (Klutz, Frisk, Pickpocket...).
    var contatoDe = function (u) { return (u.golpesProntos || []).some(function (g) { return g.contato; }); };
    var itA = atq.it || itemDoDuelo("", null), itD = def.it || itemDoDuelo("", null);
    var ativoA = itemAtivoDuelo(atq, def, contatoDe(def)), ativoD = itemAtivoDuelo(def, atq, contatoDe(atq));
    var precisaoAtq = atq.ef.semErrar || def.ef.semErrarContraMim;
    var abreDef = !atq.ef.quebraHabilidade;
    // Clima no campo (Weather Rework oficial, 2026-09-30): Ice ganha Defesa no
    // granizo; Ghost/Psychic recebem menos dano na Eerie Fog.
    var climaCampo = climaNoCampoDuelo(atq, def);
    var defNoClima = climaCampo === "granizo" && def.tipos.indexOf("Ice") !== -1 ? CLIMA_OFICIAL.defesaIceNoGranizo : 1;
    var danoNoClima = climaCampo === "nevoa" && (def.tipos.indexOf("Ghost") !== -1 || def.tipos.indexOf("Psychic") !== -1) ? CLIMA_OFICIAL.danoGhostPsychicNaNevoa : 1;
    atq.golpesProntos.forEach(function (g) {
      var flags = g.flags || [];
      // Bulletproof, Soundproof: imune pela marcação do golpe.
      if (abreDef && flags.some(function (fl) { return def.ef.imuneFlag[fl]; })) return;
      if (abreDef && def.ef.imuneTipoNaEntrada === g.tipo) return; // Magnet Rise na entrada (5 turnos: a luta toda)
      if (abreDef && def.ef.bloqueiaGolpeClima && flags.indexOf("Weather Based") !== -1) return; // Weather Control
      var efTipo = efetividadeNoDuelo(atq, g.tipo, def);
      var osso = flags.indexOf("Bone Based") !== -1 && atq.ef.flagMult["Bone Based"]; // Bone Zone
      if (efTipo === 0 && osso) efTipo = 1;
      if (efTipo === 0) return;
      if (atq.ef.resistidoX2 && efTipo < 1) efTipo *= 2;
      if (osso && efTipo < 1) efTipo *= 2;
      if (atq.ef.ignoraResist[g.tipo] && efTipo < 1) efTipo = 1; // Normalize, Corrupted Mind
      if (abreDef && def.ef.soSuperEf && efTipo < 2) return; // Wonder Guard
      var quebraAqui = atq.ef.quebraHabilidade || (atq.ef.seQuebra && efTipo >= 2); // Deadly Precision
      var terreno = CAMPO_DUELO && CAMPO_DUELO.terreno, noCampo = 1, prioAqui = g.prio;
      if (terreno && TIPO_DO_TERRENO_DUELO[terreno] === g.tipo && terreno !== "nevoa" && aterradoDuelo(atq)) noCampo *= REFORCO_DO_TERRENO_DUELO;
      if (terreno === "nevoa" && g.tipo === "Fairy" && aterradoDuelo(atq)) noCampo *= REFORCO_DO_TERRENO_DUELO;
      if (terreno === "nevoa" && g.tipo === "Dragon" && aterradoDuelo(def)) noCampo *= 0.5;
      if (terreno === "psiquico" && prioAqui > 0 && aterradoDuelo(def)) prioAqui = 0; // Psychic Terrain barra prioridade
      if (def.ef.barraPrioridade && prioAqui > 0) prioAqui = 0; // Surprise! na névoa
      if (abreDef && def.ef.sempreResiste && efTipo > 0.5) efTipo = 0.5; // Color Change, Soothsayer
      var fisico = g.cat === "F";
      var A = ataqueNoDuelo(atq, g) * (fisico ? intim : assus);
      if (!fisico) A *= noTerrenoDuelo(atq, "spa");
      // Item de poder (tipo, Muscle Band, Punching Glove) entra no poder; o Life Orb, no dano final.
      A *= comItem((fisico ? itA.fisicoMult : itA.especialMult) * (itA.tipoMult[g.tipo] || 1) *
        (g.cats || []).reduce(function (mx, c) { return Math.max(mx, itA.categoriaMult[c] || 1); }, 1), ativoA);
      if (!semBonus) A *= (fisico ? atq.ef.atkMult * atq.ef.fisicoMult : atq.ef.spaMult * atq.ef.especialMult) * atq.ef.danoMult;
      // Relic Stone: quem enfrenta ele não ganha STAB.
      if (abreDef && def.ef.semStabOutros && g.stab) A /= 1.5;
      var dv = def.ef.defesaPelaVelocidade;
      var dFis = def.stats[2] * def.ef.defMult, dEsp = def.stats[4] * def.ef.spdMult;
      if (def.ef.maiorMult && Math.max.apply(null, def.stats.slice(1)) === def.stats[fisico && !g.defEspecial ? 2 : 4]) { if (fisico && !g.defEspecial) dFis *= def.ef.maiorMult; else dEsp *= def.ef.maiorMult; }
      var D = dv && dv.contato === g.contato && abreDef ? def.stats[5] * def.ef.speMult
        : g.menorDefesa ? Math.min(dFis, dEsp) : (fisico && !g.defEspecial ? dFis : dEsp);
      if (def.ef.defesaExtraVel && abreDef) D += def.stats[5] * def.ef.defesaExtraVel; // Sleek Scales
      D *= noTerrenoDuelo(def, fisico && !g.defEspecial ? "def" : "spd"); // Grass Pelt, Flower Necklace
      D *= comItem(fisico && !g.defEspecial ? itD.defMult : itD.spdMult, ativoD); // Eviolite
      if (fisico && !g.defEspecial) D *= defNoClima; // Ice no granizo: +50% de Defesa
      // Eternal Flower: as outras Megas perdem 20% dos atributos.
      if (atq.ef.contraMega < 1 && /Mega/.test(def.sp && def.sp.n || "")) D *= atq.ef.contraMega;
      if (def.ef.contraMega < 1 && /Mega/.test(atq.sp && atq.sp.n || "")) A *= def.ef.contraMega;
      var razaoMenorDef = D / Math.min(dFis, dEsp);
      var red = 1;
      if (!quebraAqui) {
        red = def.ef.reducao.todos * (fisico ? def.ef.reducao.F : def.ef.reducao.E);
        if (efTipo >= 2) red *= def.ef.reducao.superEf;
        if (g.contato) red *= def.ef.reducao.contato;
      }
      red *= danoNoClima; // Eerie Fog: Ghost/Psychic recebem 20% menos
      if (efTipo >= 2 && !semBonus) red *= atq.ef.seBonus;
      if (efTipo >= 2) red *= comItem(itA.seMult, ativoA); // Expert Belt
      // Tera Shell: com HP cheio todo golpe é pouco efetivo - vale no 1º de ~2 golpes.
      if (def.ef.teraShell && !atq.ef.quebraHabilidade && efTipo > 0.5) red *= (1 + 0.5 / efTipo) / 2;
      var precisao = precisaoAtq ? 1 : Math.min(1, g.precisao * (semBonus ? 1 : atq.ef.precisaoMult));
      if (!precisaoAtq && abreDef && def.ef.evasao !== 1) precisao /= def.ef.evasao; // Sand Veil, Olé!...
      if (!precisaoAtq) precisao = Math.min(1, precisao * comItem(itA.precisaoMult, ativoA) / comItem(itD.evasao, ativoD)); // Wide Lens, Bright Powder
      var forca = semBonus ? g.forcaBase : g.forca;
      if ((atq.ef.critSuperEf || atq.ef.seQuebra) && efTipo >= 2) precisao = 1; // Fatal/Deadly Precision: "never miss"
      var crit = fatorCriticoDuelo(atq, def, g, efTipo);
      var dano = ((((2 * nivel) / 5 + 2) * forca * A / D) / 50 + 2) * efTipo * red * ROLAGEM_MEDIA_DUELO * precisao * crit.fator * noCampo * comItem(itA.danoMult, ativoA);
      // Golpe que baixa o próprio Sp. Atk em 2 a cada uso (Overheat, Draco Meteor, Leaf
      // Storm...; revisão de 2026-09-30 - antes contava força cheia todo turno):
      // média do dano ao longo dos golpes que precisa pra derrubar.
      if (g.quedaPropriaSpa && dano > 0) {
        var usos = Math.min(6, golpesNecessariosDuelo(def.stats[0], dano)), somaMult = 0;
        for (var uso = 0; uso < usos; uso++) somaMult += multDoEstagio(-g.quedaPropriaSpa * uso); // multDoEstagio já limita a ±6
        dano *= somaMult / usos;
      }
      // Segundo melhor golpe (outro golpe): o que sobra com Disable/Torment.
      if (dano > melhor.dano) { if (melhor.golpe) segundo = { dano: melhor.dano }; } else if (dano > segundo.dano) segundo = { dano: dano };
      if (dano > melhor.dano) melhor = { dano: dano, prio: prioAqui, golpe: g, efTipo: efTipo, crit: crit, razaoMenorDef: razaoMenorDef };
      if (prioAqui > 0 && dano > melhorPrio.dano) melhorPrio = { dano: dano };
    });
    return { melhor: melhor, melhorPrio: melhorPrio, segundo: segundo };
  }
  function golpesNecessariosDuelo(hp, d) { return d > 0 ? Math.ceil(hp / d) : Infinity; }
  // Aguenta o primeiro golpe com HP cheio: Focus Sash (item: "If the holder has
  // full HP, it endures KO hits with 1 HP") ou Sturdy ("At full HP, cannot be
  // KO in one hit") - Mold Breaker do atacante atravessa a Sturdy.
  function aguentaUmGolpe(def, atq) {
    return def.item === "Focus Sash" || (def.ef.aguenta && !atq.ef.quebraHabilidade);
  }
  // Prioridade que vale no golpe que decide: golpe de prioridade real, ou
  // prioridade de habilidade no 1º golpe (On the Prowl, Gale Wings e parecidas).
  function temPrioridadeNoDuelo(u, dano, golpesParaVencer) {
    if (dano.melhor.prio > 0) return true;
    var g = dano.melhor.golpe;
    // Opportunist: o golpe que decide (2º em diante) acha o alvo abaixo da metade.
    if (u.ef.prioNoFinal && golpesParaVencer >= 2) return true;
    return golpesParaVencer === 1 && (u.ef.prioridadeNoPrimeiro || !!(g && g.prioCheio));
  }

  // Status por chance no dano de cada turno (valor esperado): o status que eu
  // causo nele soma dano residual e recuo de confusão ao meu dano, o medo nele
  // aumenta o meu dano, e o que ele sofre (queimadura, frostbite, paralisia,
  // paixão, recuar) corta o dano DELE. Simétrico: roda dos dois lados.
  var TURNOS_MAX_STATUS = 8;
  function danoComStatusNoDuelo(eu, foe, meu, dele, turnos, euAntes) {
    var sobreEle = chancesDeStatusNoDuelo(eu, foe, meu.melhor.golpe, dele.melhor.golpe);
    var sobreMim = chancesDeStatusNoDuelo(foe, eu, dele.melhor.golpe, meu.melhor.golpe);
    // Synchronize: quem põe queimadura/veneno/paralisia nele recebe o mesmo.
    function sincronizar(dono, deQuem, sofreu, devolve) {
      if (!dono.ef.sincroniza) return;
      ["queimar", "envenenar", "envenenarForte", "paralisar"].forEach(function (st) {
        if (sofreu[st] && podeSofrerStatusDuelo(deQuem, st)) devolve[st] = 1 - (1 - (devolve[st] || 0)) * (1 - sofreu[st]);
      });
    }
    sincronizar(foe, eu, sobreEle, sobreMim);
    sincronizar(eu, foe, sobreMim, sobreEle);
    // Status que já entra com ele (Toxic Spikes, maldição de uma luta anterior).
    function jaTem(u, sobre) { Object.keys(u.statusInicial || {}).forEach(function (st) { if (podeSofrerStatusDuelo(u, st)) sobre[st] = 1; }); }
    jaTem(foe, sobreEle); jaTem(eu, sobreMim);
    // Orbe do próprio Pokémon (Flame Orb, Toxic Orb): o status entra no fim do 1º
    // turno - vale (n-1)/n da luta. Cura do próprio status (Shed Skin, Leaf Guard
    // no sol...) encurta a presença.
    function efeitos(chances, alvo, golpeDoAlvo, danoDoAlvo, alvoAntes) {
      var r = { corte: 1, recebeMais: 1, residuo: 0, pres: {} };
      var orbe = alvo.ef.klutz ? null : ORBE_DE_STATUS_DUELO[alvo.item];
      var todos = Object.keys(chances);
      if (orbe && podeSofrerStatusDuelo(alvo, orbe) && todos.indexOf(orbe) === -1) todos.push(orbe);
      var fica = 1 - (alvo.ef.curaStatus || 0);
      if (alvo.ef.curaComLuta && golpeDoAlvo && golpeDoAlvo.tipo === "Fighting") fica = 0; // Vital Spirit
      // Lum Berry: cura o 1º status - na média, metade da presença (Unnerve do outro barra).
      var outroLado = alvo === eu ? foe : eu;
      if (alvo.it && alvo.it.curaStatusUmaVez && !outroLado.ef.nervoso) fica *= 1 - 0.5 * itemAtivoDuelo(alvo, outroLado);
      todos.forEach(function (s) {
        var regra = STATUS_DUELO[s], p = chances[s] || 0;
        if (s === "recuar") { r.corte *= 1 - (alvoAntes === null ? p / 2 : alvoAntes ? 0 : p); return; } // só recua quem bate depois
        var doOrbe = s === orbe && turnos > 0 ? (turnos - 1) / turnos : 0;
        var corte = regra.corte || (golpeDoAlvo && golpeDoAlvo.cat === "F" ? regra.corteF : regra.corteE) || 0;
        if (corte) r.corte *= 1 - corte * fica * Math.max(doOrbe, presencaDoStatus(p, turnos, alvoAntes ? 0 : 1));
        var pres = fica * Math.max(doOrbe, presencaDoStatus(p, turnos, 1));
        r.pres[s] = pres;
        if (regra.recebeMais) r.recebeMais *= 1 + regra.recebeMais * pres;
        if (regra.residuo && !alvo.ef.semResiduo && !alvo.ef.semResiduoDe[s]) r.residuo += regra.residuo * alvo.stats[0] * pres;
        if (regra.recuo && !alvo.ef.semResiduo) r.residuo += regra.recuo * danoDoAlvo * pres;
      });
      return r;
    }
    var nele = efeitos(sobreEle, foe, dele.melhor.golpe, dele.melhor.dano, euAntes === null ? null : !euAntes);
    var nMim = efeitos(sobreMim, eu, meu.melhor.golpe, meu.melhor.dano, euAntes);
    // Crítico que depende da luta: Merciless (alvo envenenado, paralisado ou
    // sangrando - pela presença média do status) e Ambush (1º turno garantido).
    function ajusteCrit(u, chancesNoAlvo, melhor, ultimo) {
      if (!melhor.crit || melhor.crit.certo <= 1) return 1;
      var f = melhor.crit.fator, novo = f;
      // Strategic Pause: +2 de estágio quando bate por último.
      var gc = melhor.golpe && melhor.golpe.crit;
      if (u.ef.critUltimo && ultimo && gc && !gc.sempre) novo = 1 + chanceDoEstagioCrit(gc.estagio + u.ef.critUltimo) * (melhor.crit.certo - 1);
      var pres = u.ef.critContraStatus.reduce(function (mx, s) { return Math.max(mx, presencaDoStatus(chancesNoAlvo[s] || 0, turnos, 1)); }, 0);
      novo = (1 - pres) * novo + pres * melhor.crit.certo;
      if (u.ef.critPrimeiroTurno && turnos > 0) novo = (melhor.crit.certo + (turnos - 1) * novo) / turnos;
      if (u.ef.critMetade) novo = (novo + melhor.crit.certo) / 2; // Ape Shift: abaixo da metade, sempre crítico
      return novo / f;
    }
    var euUltimo = euAntes === false, eleUltimo = euAntes === true;
    var critMeu = ajusteCrit(eu, sobreEle, meu.melhor, euUltimo), critDele = ajusteCrit(foe, sobreMim, dele.melhor, eleUltimo);
    // Status no próprio Pokémon (Guts, Flare Boost, Marvel Scale...): pela presença
    // média do status nele (orbe ou o que o outro causa).
    function comStatusProprio(u, presNele, golpeDele, golpeDoOutro) {
      var ataque = 1, defesa = 1;
      u.ef.statusProprio.forEach(function (c) {
        var pres = Object.keys(presNele).reduce(function (mx, s) {
          return s !== "recuar" && s !== "medo" && s !== "confundir" && s !== "paixao" && (!c.quais || c.quais.indexOf(s) !== -1) ? Math.max(mx, presNele[s]) : mx;
        }, 0);
        var f = 1 + pres * (c.mult - 1);
        if (c.stat === "dano" || (c.stat === "atk" && golpeDele && golpeDele.cat === "F") || (c.stat === "spa" && golpeDele && golpeDele.cat === "E")) ataque *= f;
        if ((c.stat === "def" && golpeDoOutro && golpeDoOutro.cat === "F") || (c.stat === "spd" && golpeDoOutro && golpeDoOutro.cat === "E")) defesa /= f;
      });
      return { ataque: ataque, defesa: defesa };
    }
    var spMeu = comStatusProprio(eu, nMim.pres, meu.melhor.golpe, dele.melhor.golpe);
    var spDele = comStatusProprio(foe, nele.pres, dele.melhor.golpe, meu.melhor.golpe);
    // Ordem do turno: Analytic (bate por último) e Haste Makes Waste (apanha antes de agir).
    function porOrdem(valor, ultimo, empate) { return empate ? 1 + (valor - 1) / 2 : ultimo ? valor : 1; }
    var empate = euAntes === null;
    var ordemMeu = porOrdem(eu.ef.ultimoMult, euUltimo, empate) * porOrdem(1 - foe.ef.antesReducao, eleUltimo, empate);
    var ordemDele = porOrdem(foe.ef.ultimoMult, eleUltimo, empate) * porOrdem(1 - eu.ef.antesReducao, euUltimo, empate);
    // Estágios médios (entrada, ao apanhar, ao golpear, queda por chance...), Ruin
    // e Pretty Princess.
    var estMeu = estagiosMediosDuelo(eu, foe, meu.melhor.golpe, dele.melhor.golpe, turnos);
    var estDele = estagiosMediosDuelo(foe, eu, dele.melhor.golpe, meu.melhor.golpe, turnos);
    ajustaEstagiosEntreOsDois(eu, foe, estMeu, estDele);
    // Regras oficiais das subidas (FAQ, 2026-09-30): Bleed "negates any stat boosts"
    // (na parte da luta em que sangra) e, na Eerie Fog, as subidas de quem não é
    // Ghost/Psychic caem 1 por turno até +0 (média ao longo dos turnos da luta).
    var climaDaLuta = climaNoCampoDuelo(eu, foe);
    function regrasDasSubidas(u, est, pres) {
      var nevoa = climaDaLuta === "nevoa" && u.tipos.indexOf("Ghost") === -1 && u.tipos.indexOf("Psychic") === -1;
      var sangra = pres.sangrar || 0;
      Object.keys(est).forEach(function (k) {
        if (est[k] <= 0) return;
        if (nevoa) est[k] = subidaMediaNaNevoa(est[k], Math.max(1, turnos));
        est[k] *= 1 - sangra;
      });
    }
    regrasDasSubidas(eu, estMeu, nMim.pres);
    regrasDasSubidas(foe, estDele, nele.pres);
    function porEstagio(atq, def, estAtq, estDef, g) {
      if (!g) return 1;
      var fisico = g.cat === "F", f = 1;
      if (!def.ef.ignoraEstagios) f *= multDoEstagio(estAtq[fisico ? "atk" : "spa"]);
      if (!atq.ef.ignoraEstagios) f /= multDoEstagio(estDef[fisico && !g.defEspecial ? "def" : "spd"] * (1 - (atq.ef.ignoraDefesa || 0)));
      var rDef = atq.ef.ruina[fisico && !g.defEspecial ? "def" : "spd"], rAtq = def.ef.ruina[fisico ? "atk" : "spa"];
      if (rDef) f /= rDef;
      if (rAtq) f *= rAtq;
      if (atq.ef.bonusContraReduzido > 1) {
        var caiu = Object.keys(estDef).reduce(function (sm, k) { return sm + Math.max(0, -estDef[k]); }, 0);
        if ((atq.ef.intimida && !def.ef.imuneIntimida) || (atq.ef.assusta && !def.ef.imuneAssusta)) caiu = 1;
        f *= 1 + (atq.ef.bonusContraReduzido - 1) * Math.min(1, caiu);
      }
      return f;
    }
    var estagioMeu = porEstagio(eu, foe, estMeu, estDele, meu.melhor.golpe), estagioDele = porEstagio(foe, eu, estDele, estMeu, dele.melhor.golpe);
    // Neurotoxin: envenenado também perde -1 nos ataques. Aurora Veil na entrada (North Wind): metade do dano nos turnos da tela.
    function envenenado(pres) { return Math.max(pres.envenenar || 0, pres.envenenarForte || 0); }
    if (eu.ef.venenoReduz) estagioDele *= 1 - envenenado(nele.pres) / 3;
    if (foe.ef.venenoReduz) estagioMeu *= 1 - envenenado(nMim.pres) / 3;
    var semTelas = eu.ef.limpaTelas || foe.ef.limpaTelas;
    function tela(u, atq) { return u.ef.telaNaEntrada && turnos > 0 && !semTelas && !atq.ef.infiltra ? 1 - 0.5 * Math.min(u.ef.telaNaEntrada, turnos) / turnos : 1; }
    estagioMeu *= tela(foe, eu); estagioDele *= tela(eu, foe);
    // Baga de resistência (Occa...): o 1º golpe do tipo (super efetivo) sai pela metade - um quarto com Ripen.
    function bagaResiste(def, atq, melhor) {
      var b = def.it && def.it.bagaResiste, g = melhor.golpe;
      if (!b || !g || g.tipo !== b.tipo || (b.soSuperEf && !(melhor.efTipo >= 2)) || atq.ef.nervoso || turnos <= 0) return 1;
      var primeiro = def.ef.ripen ? 0.25 : 0.5;
      return comItem((primeiro + turnos - 1) / turnos, itemAtivoDuelo(def, atq, g.contato));
    }
    estagioMeu *= bagaResiste(foe, eu, meu.melhor); estagioDele *= bagaResiste(eu, foe, dele.melhor);
    // Readied Action (dobra no 1º turno) e Truant (ataca um turno sim, outro não).
    function ritmo(u, g, presNoAlvo, melhor) {
      var f = 1;
      if (u.ef.ritmico && turnos > 0) f *= 1 + u.ef.ritmico * (turnos - 1) / 2; // Rhythmic: +10% por repetição
      var itU = u.it || itemDoDuelo("", null), outroU = u === eu ? foe : eu, atv = itemAtivoDuelo(u, outroU);
      if (itU.metronomo && turnos > 0) f *= comItem(Math.min(2, 1 + 0.2 * (turnos - 1) / 2), atv); // Metronome: +20% por repetição
      if (itU.gema && g && g.tipo === itU.gema && turnos > 0) f *= comItem((1.3 + turnos - 1) / turnos, atv); // gema: 1,3x uma vez
      if (u.ef.carregaAoApanhar && g && g.tipo === "Electric" && turnos > 0) f *= (2 * turnos - 1) / turnos; // Electromorphosis
      else if (u.ef.carregaNaEntrada && g && g.tipo === "Electric" && turnos > 0) f *= (turnos + 1) / turnos; // Generator: o 1º sai 2x
      // Power Outage: o 1º golpe Electric sai 2x, depois perde o tipo (e o STAB).
      if (u.ef.apagao && g && g.tipo === "Electric" && turnos > 0) f *= (2 + (turnos - 1) / (g.stab ? 1.5 : 1)) / turnos;
      if (u.ef.ventoCarga && g && g.tipo === "Electric" && turnos > 0 && outroU.golpesProntos && outroU.golpesProntos.some(function (x) { return (x.flags || []).indexOf("Air/Wing Based") !== -1; })) f *= (2 * turnos - 1) / turnos; // Wind Power
      Object.keys(u.ef.bonusVsStatus).forEach(function (s) { f *= 1 + (presNoAlvo[s] || 0) * (u.ef.bonusVsStatus[s] - 1); }); // Cosmic Daze
      // Exploit Weakness: contra alvo com status, bate na defesa mais fraca.
      if (u.ef.menorDefesaSeStatus && melhor && melhor.razaoMenorDef > 1) {
        var pres = Object.keys(presNoAlvo).reduce(function (mx, s) { return /recuar|medo|confundir|paixao/.test(s) ? mx : Math.max(mx, presNoAlvo[s]); }, 0);
        f *= 1 + pres * (melhor.razaoMenorDef - 1);
      }
      if (u.ef.primeiroTurnoMult !== 1 && turnos > 0) f *= (u.ef.primeiroTurnoMult + turnos - 1) / turnos;
      if (u.ef.truant) f *= 0.5;
      // Minion Control: um golpe a mais por membro saudável do time (sem número no texto: golpe inteiro; 5 fora da luta inteira).
      if (u.ef.lacaios) f *= 1 + (u.ef.lacaiosVivos === undefined ? 5 : u.ef.lacaiosVivos);
      return f;
    }
    // Dano extra por turno com o mesmo ataque do Pokémon, proporcional ao poder:
    // contra-ataque ao levar contato (Clap Trap) e golpe de graça na entrada
    // (Cheap Tactics, repartido pela luta).
    function extraPorTurno(u, d, g, gOutro) {
      if (!(d > 0) || !g || !(g.poder > 0)) return 0;
      var e = 0;
      if (u.ef.contraAtaque && gOutro && (gOutro.contato || u.ef.contraAtaque.qualquer)) e += d * u.ef.contraAtaque.poder / g.poder;
      if (u.ef.ataqueNaEntrada && turnos > 0) e += d * u.ef.ataqueNaEntrada / g.poder / turnos;
      var roubador = u === eu ? foe : eu;
      if (u.ef.ladrao && u.item && (roubador.ef.roubaContato || roubador.ef.roubaSemContato) && turnos > 0) e += d * 60 / g.poder / turnos; // Greedy: Thief (60)
      return e;
    }
    var ritmoMeu = ritmo(eu, meu.melhor.golpe, nele.pres, meu.melhor), ritmoDele = ritmo(foe, dele.melhor.golpe, nMim.pres, dele.melhor);
    var extraMeu = extraPorTurno(eu, meu.melhor.dano, meu.melhor.golpe, dele.melhor.golpe), extraDele = extraPorTurno(foe, dele.melhor.dano, dele.melhor.golpe, meu.melhor.golpe);
    function meuDano(d) { return d > 0 ? d * critMeu * spMeu.ataque * spDele.defesa * ordemMeu * estagioMeu * ritmoMeu * nele.recebeMais * nMim.corte + extraMeu + nele.residuo : nele.residuo; }
    function deleDano(d) { return d > 0 ? d * critDele * spDele.ataque * spMeu.defesa * ordemDele * estagioDele * ritmoDele * nMim.recebeMais * nele.corte + extraDele + nMim.residuo : nMim.residuo; }
    // Balanço de HP de cada lado por turno: o que ele mesmo perde (recuo, custo,
    // Rough Skin do outro ao fazer contato) entra como dano a mais contra ele; o
    // que ele recupera (cura por turno, dreno, Poison Heal) sai. Magic Guard anula
    // a perda indireta; Permanence do outro anula a cura; Liquid Ooze vira o dreno contra.
    function balanco(u, outro, g, ataque, presNele) {
      var hp = u.stats[0], perde = 0, ganha = 0;
      var it = u.it || itemDoDuelo("", null), itO = outro.it || itemDoDuelo("", null);
      var ativo = itemAtivoDuelo(u, outro, g ? g.contato : undefined), ativoO = itemAtivoDuelo(outro, u, g ? g.contato : undefined);
      var contato = g && g.contato && !it.semEfeitoContato; // Protective Pads
      // Dano que de fato entra (não passa do HP do alvo) e a parte dos golpes ANTES do
      // nocaute: recuo, Life Orb e custo do golpe que derruba não mudam o resultado.
      var golpesAteDerrubar = golpesNecessariosDuelo(outro.stats[0], ataque);
      var antesDoUltimo = golpesAteDerrubar === Infinity ? 1 : (golpesAteDerrubar - 1) / golpesAteDerrubar;
      var entra = Math.min(ataque, outro.stats[0] / Math.max(1, golpesAteDerrubar === Infinity ? 1 : golpesAteDerrubar));
      if (!u.ef.semResiduo) {
        if (g) perde += ((g.recuo || 0) * entra + (g.custoHP || 0) * hp) * antesDoUltimo;
        if (contato && outro.ef.danoAoContato) perde += outro.ef.danoAoContato * hp;
        // Item: Life Orb por ataque, Sticky Barb/Black Sludge fora de Poison, Rocky Helmet e Jaboca/Rowap do outro.
        if (g) perde += it.custoAtaque * hp * ativo * antesDoUltimo;
        perde += it.perdaTurno * hp * ativo;
        if (contato) perde += itO.danoAoContato * hp * ativoO;
        // Gulp Missile: com Surf/Dive, cospe a presa em quem bate (1/4 do HP), a cada dois turnos.
        if (g && outro.ef.cuspe && (outro.golpesProntos || []).some(function (x) { return x.nome === "Surf" || x.nome === "Dive"; })) perde += hp / 8;
        if (g && itO.contraCatUmaVez && itO.contraCatUmaVez.cat === g.cat && !u.ef.nervoso && turnos > 0) perde += itO.contraCatUmaVez.pct * hp * ativoO / turnos;
      }
      // Toxic Terrain: 1/16 por turno em quem está no chão e não é Poison.
      if (CAMPO_DUELO && CAMPO_DUELO.terreno === "toxico" && aterradoDuelo(u) && (u.tipos || []).indexOf("Poison") === -1 && !u.ef.semResiduo) perde += hp / 16;
      // Dano/cura de campo por turno (Toxic Spill, Funeral Pyre, Winter Throne, Life Steal...).
      [[u, true], [outro, false]].forEach(function (par) {
        (par[0].ef.campoResiduo || []).forEach(function (c) {
          if (par[1] ? c.soInimigo : c.soProprio) return;
          var tipos = u.tipos || [];
          if (c.so && !c.so.some(function (tp) { return tipos.indexOf(tp) !== -1; })) return;
          if (c.exceto && c.exceto.some(function (tp) { return tipos.indexOf(tp) !== -1; })) return;
          if (c.pct > 0 && u.ef.semResiduo) return;
          if (c.pct > 0) perde += c.pct * hp; else ganha += -c.pct * hp;
        });
      });
      (u.ef.campoResiduo || []).forEach(function (c) { if (c.rouba && !(outro.ef.semResiduo)) ganha += c.pct * outro.stats[0]; });
      var dreno = g ? ((g.dreno || 0) * comItem(it.drenoMult, ativo) + it.drenoPct * ativo) * entra : 0; // Big Root, Shell Bell - sobre o dano que entra
      if (outro.ef.liquidOoze) { if (!u.ef.semResiduo) perde += dreno; dreno = 0; }
      if (!outro.ef.bloqueiaCura) {
        ganha += u.ef.curaPorTurno * hp + dreno + noTerrenoDuelo(u, "cura") * hp + it.curaTurno * hp * ativo; // + Leftovers
        if (CAMPO_DUELO && CAMPO_DUELO.terreno === "grama" && aterradoDuelo(u)) ganha += hp / 16; // Grassy Terrain
        if (u.ef.curaEnvenenado) ganha += u.ef.curaEnvenenado * hp * Math.max(presNele.envenenar || 0, presNele.envenenarForte || 0);
      }
      // Bleed (FAQ oficial, 2026-09-30): "Prevents effects of healing" - vale na
      // parte da luta em que está sangrando.
      // Toda cura, inclusive a de campo por habilidade (revisão do mesmo dia).
      if (presNele.sangrar) ganha *= 1 - presNele.sangrar;
      return perde - ganha;
    }
    var atqMeu = meuDano(meu.melhor.dano) - nele.residuo - extraMeu, atqDele = deleDano(dele.melhor.dano) - nMim.residuo - extraDele;
    var saldoEle = balanco(foe, eu, dele.melhor.golpe, Math.max(0, atqDele), nele.pres);
    var saldoEu = balanco(eu, foe, meu.melhor.golpe, Math.max(0, atqMeu), nMim.pres);
    function comSaldo(d, saldo) { return Math.max(0, d + saldo); }
    // Soul Linker: cada lado também leva o dano que causa.
    if (eu.ef.almaLigada || foe.ef.almaLigada) { saldoEle += Math.max(0, atqDele); saldoEu += Math.max(0, atqMeu); }
    return { meu: comSaldo(meuDano(meu.melhor.dano), saldoEle), meuPrio: meu.melhorPrio.dano > 0 ? comSaldo(meuDano(meu.melhorPrio.dano), saldoEle) : 0,
      dele: comSaldo(deleDano(dele.melhor.dano), saldoEu), sobreEle: sobreEle, sobreMim: sobreMim };
  }

  // Velocidade no turno que decide: Quick Feet com o status do próprio orbe (entra
  // no fim do 1º turno, então vale quando a luta passa dele).
  // + estágio de Velocidade NO turno que decide (Speed Boost, Weak Armor, Gooey...):
  // estagiosMediosDuelo com 2n-1 turnos dá (n-1) acúmulos, o estado do n-ésimo.
  function velocidadeNoDuelo(u, turnos, outro, gU, gOutro) {
    var v = u.stats[5] * u.ef.speMult * noTerrenoDuelo(u, "spe"), orbe = ORBE_DE_STATUS_DUELO[u.item];
    if (u.it && outro) {
      var atv = itemAtivoDuelo(u, outro, gOutro ? gOutro.contato : undefined);
      v *= comItem(u.it.speMult, atv); // Iron Ball
      if (u.it.lento && atv > 0) v *= 0.001; // Lagging Tail: age por último
      if (u.ef.unburden && u.it.consumivel && turnos >= 2 && atv > 0) v *= 2; // Unburden: item gasto, velocidade dobrada
    }
    if (u.ef.vento && turnos <= u.ef.vento) v *= 2; // Tailwind (Air Blower): dobra enquanto dura
    if (outro && outro.ef.pantano && turnos <= 4) v *= 0.25; // Swamp Pledge (Swamp Thing)
    if (outro && turnos >= 1) v *= multDoEstagio(estagiosMediosDuelo(u, outro, gU, gOutro, 2 * turnos - 1).spe);
    if (orbe && turnos >= 2 && podeSofrerStatusDuelo(u, orbe)) {
      u.ef.statusProprio.forEach(function (c) { if (c.stat === "spe" && (!c.quais || c.quais.indexOf(orbe) !== -1)) v *= c.mult; });
    }
    return v;
  }
  function comTipoMudado(atq, def, danoAtq, danoDef, nivel) {
    var novo = def.ef.mudaTipoNoContato ? null : atq.ef.mudaTipoNoContato; // quem tem a habilidade muda o OUTRO
    var gA = danoAtq.melhor.golpe;
    // Paint Shot: golpe de pulso pinta o alvo com o tipo do golpe.
    if (!novo && atq.ef.pintaAlvo && gA && (gA.cats || []).indexOf(atq.ef.pintaAlvo) !== -1) novo = gA.tipo;
    else {
      if (!novo) return danoAtq;
      var houveContato = (gA && gA.contato) || (danoDef.melhor.golpe && danoDef.melhor.golpe.contato);
      if (!houveContato) return danoAtq;
    }
    var depois = danoNoDuelo(atq, Object.assign({}, def, { tipos: [novo] }), nivel);
    var n = Math.max(1, Math.min(TURNOS_MAX_STATUS, golpesNecessariosDuelo(def.stats[0], danoAtq.melhor.dano)));
    var misto = (danoAtq.melhor.dano + (n - 1) * depois.melhor.dano) / n;
    return { melhor: Object.assign({}, danoAtq.melhor, { dano: misto }), melhorPrio: danoAtq.melhorPrio, segundo: danoAtq.segundo };
  }
  // Cura de baga (Sitrus, Figy...) como HP a mais: Gluttony garante 1/3, Ripen
  // dobra, Harvest/Cud Chew comem de novo; Unnerve do outro barra.
  function curaDeBagaDuelo(u, outro) {
    var it = u.it;
    if (!it || !it.bagaHP || outro.ef.nervoso) return 0;
    var cura = Math.max(it.bagaHP, u.ef.bagaCuraMin || 0) * (u.ef.ripen ? 2 : 1);
    return cura * (1 + (u.ef.colheita || 0) + (u.ef.rumina ? 1 : 0)) * itemAtivoDuelo(u, outro);
  }
  // Depois do 1º contato (ou do veneno), a habilidade de um dos lados some ou troca:
  // o resto da luta usa as versões refeitas. Mistura como o Damp.
  function comHabilidadeTrocada(eu, foe, meu, dele, nivel) {
    var contatoEu = meu.melhor.golpe && meu.melhor.golpe.contato, contatoEle = dele.melhor.golpe && dele.melhor.golpe.contato;
    var eu2 = eu, foe2 = foe, parte = 1;
    function efeitoDe(dono, outro, contatoDoOutro, novoOutro) { return dono.ef && contatoDoOutro ? novoOutro : null; }
    // Mummy/Lingering Aroma: quem faz contato perde a escolhida; Malodor: perde todas.
    foe2 = efeitoDe(eu, foe, contatoEle, eu.ef.malodor ? comHabilidadesDuelo(foe, "nenhuma") : eu.ef.mumia ? comHabilidadesDuelo(foe, "semEscolhida") : null) || foe2;
    eu2 = efeitoDe(foe, eu, contatoEu, foe.ef.malodor ? comHabilidadesDuelo(eu, "nenhuma") : foe.ef.mumia ? comHabilidadesDuelo(eu, "semEscolhida") : null) || eu2;
    // Wandering Spirit: no contato, troca - eu fico com a escolhida dele, ele perde a dele.
    if (eu.ef.espirito && (contatoEu || contatoEle)) { eu2 = comHabilidadesDuelo(eu, "comExtra", foe.abId); foe2 = comHabilidadesDuelo(foe, "semEscolhida"); }
    if (foe.ef.espirito && (contatoEu || contatoEle)) { foe2 = comHabilidadesDuelo(foe, "comExtra", eu.abId); eu2 = comHabilidadesDuelo(eu, "semEscolhida"); }
    // Hemotoxin: envenenado perde as habilidades - pela chance do meu golpe envenenar.
    var pVeneno = function (g) { return (g && g.status || []).reduce(function (mx, st) { return /envenenar/.test(st.st) ? Math.max(mx, st.p) : mx; }, 0); };
    if (eu.ef.hemotoxina && pVeneno(meu.melhor.golpe) > 0) { foe2 = comHabilidadesDuelo(foe, "nenhuma"); parte = pVeneno(meu.melhor.golpe); }
    if (foe.ef.hemotoxina && pVeneno(dele.melhor.golpe) > 0) { eu2 = comHabilidadesDuelo(eu, "nenhuma"); parte = pVeneno(dele.melhor.golpe); }
    if (eu2 === eu && foe2 === foe) return { meu: meu, dele: dele };
    var meu2 = danoNoDuelo(eu2, foe2, nivel), dele2 = danoNoDuelo(foe2, eu2, nivel);
    var n = Math.max(1, Math.min(TURNOS_MAX_STATUS, golpesNecessariosDuelo(foe.stats[0], meu.melhor.dano)));
    var f = parte * (n - 1) / n; // o 1º golpe ainda é com as habilidades de antes
    function mistura(a, b) { return { melhor: Object.assign({}, a.melhor, { dano: a.melhor.dano * (1 - f) + b.melhor.dano * f }), melhorPrio: a.melhorPrio, segundo: a.segundo }; }
    return { meu: mistura(meu, meu2), dele: mistura(dele, dele2) };
  }
  // Golpes que não fazem nada: Disguise/Ice Face/Gallantry/Coward (1), Cheating
  // Death (2), Anticipation (1 super efetivo).
  function bloqueiosNoDuelo(def, atq, danoAtq) {
    if (atq.ef.quebraHabilidade) return 0;
    var balao = def.it && def.it.balao && !def.ef.klutz && danoAtq.melhor.golpe && danoAtq.melhor.golpe.tipo === "Ground" ? 1 : 0; // Air Balloon
    // Golpe de vários acertos gasta um bloqueio por acerto (Rock Blast quebra Disguise e Cheating Death de uma vez).
    var porGolpe = Math.max(1, Math.round((danoAtq.melhor.golpe && danoAtq.melhor.golpe.acertos) || 1));
    var protecaoFura = def.ef.protegeNaEntrada && atq.ef.atravessaProtecao && danoAtq.melhor.golpe && danoAtq.melhor.golpe.contato ? 1 : 0; // Unseen Fist
    var acertosBloqueados = (def.ef.bloqueiaUmGolpe ? 1 : 0) + Math.max(0, def.ef.bloqueios - protecaoFura);
    return Math.floor(acertosBloqueados / porGolpe) + (def.ef.bloqueiaSuperEf && danoAtq.melhor.efTipo >= 2 ? 1 : 0) + balao;
  }
  // Um duelo, do ponto de vista de "eu" (0..1), no campo que os dois montam.
  // ini (opcional, pra sequência de lutas): { fracEu, fracFoe } = HP de partida
  // (fração do máximo) e detalhe: true pra receber { nota, venceu, fracEu,
  // fracFoe, turnos } em vez da nota só.
  function resultadoDoDuelo(eu, foe, nivel, ini) {
    // Cloud Nine e parecidas: a luta corre sem clima (os dois refeitos sem ele).
    if ((eu.ef.anulaClima || foe.ef.anulaClima) && (eu.clima || foe.clima)) { eu = semClimaDuelo(eu); foe = semClimaDuelo(foe); }
    var antes = CAMPO_DUELO;
    CAMPO_DUELO = campoDoDuelo(eu, foe);
    try { return resultadoNoCampoDuelo(eu, foe, nivel, ini || {}); } finally { CAMPO_DUELO = antes; }
  }
  function semClimaDuelo(u) {
    if (!u.clima || !u.golpeIds) return u;
    u.porClima = u.porClima || {};
    if (!u.porClima.nenhum) {
      var ef = efeitoDasHabilidadesNoDuelo(u.ids, u.sp.sname, null);
      var u2 = Object.assign({}, u, { ef: ef, tipos: tiposNaBatalha(u.sp, ef), clima: null });
      u2.golpesProntos = prepararGolpesDuelo(u.golpeIds, u2, null);
      u.porClima.nenhum = u2;
    }
    return u.porClima.nenhum;
  }
  function resultadoNoCampoDuelo(eu, foe, nivel, ini) {
    // Mimicry: o tipo vira o do terreno em campo.
    var TIPO_MIMICRY = { eletrico: "Electric", grama: "Grass", psiquico: "Psychic", nevoa: "Fairy" };
    if (CAMPO_DUELO && CAMPO_DUELO.terreno) {
      if (eu.ef.mimetismo) eu = Object.assign({}, eu, { tipos: [TIPO_MIMICRY[CAMPO_DUELO.terreno]] });
      if (foe.ef.mimetismo) foe = Object.assign({}, foe, { tipos: [TIPO_MIMICRY[CAMPO_DUELO.terreno]] });
    }
    var fracEu = ini.fracEu === undefined ? 1 : ini.fracEu, fracFoe = ini.fracFoe === undefined ? 1 : ini.fracFoe;
    function fim(nota, venceu, restoEu, restoFoe, n) {
      if (!ini.detalhe) return nota;
      return { nota: nota, venceu: venceu, fracEu: Math.max(0, Math.min(1, restoEu / eu.stats[0])), fracFoe: Math.max(0, Math.min(1, restoFoe / foe.stats[0])), turnos: n };
    }
    // Imposter, Trace (entrada); Neutralizing Gas e Aura Break (o outro, a luta toda).
    var eu0 = eu;
    eu = naEntradaHabilidadesDuelo(eu, foe); foe = naEntradaHabilidadesDuelo(foe, eu0);
    if (eu.ef.gasNeutro) foe = comHabilidadesDuelo(foe, "nenhuma");
    else if (foe.ef.gasNeutro) eu = comHabilidadesDuelo(eu, "nenhuma");
    if (eu.ef.quebraAura) foe = comHabilidadesDuelo(foe, "auraQuebrada");
    if (foe.ef.quebraAura) eu = comHabilidadesDuelo(eu, "auraQuebrada");
    // Tactical Retreat: foge assim que o outro baixa um atributo (Intimidate/Scare na entrada) - empate, sem luta.
    var fogeJa = function (u, o) { return u.ef.fogeAoCair && ((o.ef.intimida && !u.ef.imuneIntimida) || (o.ef.assusta && !u.ef.imuneAssusta)); };
    if (fogeJa(eu, foe) || fogeJa(foe, eu)) return fim(0.5, null, eu.stats[0] * fracEu, foe.stats[0] * fracFoe, 0);
    // Emergency Exit/Wimp Out: sai com metade do HP - neste duelo só luta a metade de cima.
    if (eu.ef.fogeNaMetade) fracEu = Math.max(0.01, fracEu - 0.5);
    if (foe.ef.fogeNaMetade) fracFoe = Math.max(0.01, fracFoe - 0.5);
    var meu = danoNoDuelo(eu, foe, nivel);
    var dele = danoNoDuelo(foe, eu, nivel);
    // Shallow Grave e parecidas: volta uma vez com parte do HP.
    var hpEu = eu.stats[0] * (fracEu + (eu.ef.reviveHP || 0) + noTerrenoDuelo(eu, "revive") + curaDeBagaDuelo(eu, foe)),
      hpFoe = foe.stats[0] * (fracFoe + (foe.ef.reviveHP || 0) + noTerrenoDuelo(foe, "revive") + curaDeBagaDuelo(foe, eu));
    // Damp/Magical Dust: depois do 1º contato o outro vira do tipo - o resto da luta usa a tabela nova.
    meu = comTipoMudado(eu, foe, meu, dele, nivel);
    dele = comTipoMudado(foe, eu, dele, meu, nivel);
    var trocaHab = comHabilidadeTrocada(eu, foe, meu, dele, nivel);
    meu = trocaHab.meu; dele = trocaHab.dele;
    var turnos = Math.min(TURNOS_MAX_STATUS, golpesNecessariosDuelo(hpFoe, meu.melhor.dano), golpesNecessariosDuelo(hpEu, dele.melhor.dano));
    // Inverse Room: os turnos da sala usam a tabela invertida.
    if (CAMPO_DUELO.inversa && turnos > 0) {
      CAMPO_DUELO.inversaAtiva = true;
      var meuInv = danoNoDuelo(eu, foe, nivel), deleInv = danoNoDuelo(foe, eu, nivel);
      CAMPO_DUELO.inversaAtiva = false;
      var fr = Math.min(CAMPO_DUELO.inversa, turnos) / turnos;
      meu = { melhor: Object.assign({}, meuInv.melhor.dano > meu.melhor.dano ? meuInv.melhor : meu.melhor, { dano: meuInv.melhor.dano * fr + meu.melhor.dano * (1 - fr) }), melhorPrio: meu.melhorPrio, segundo: meu.segundo };
      dele = { melhor: Object.assign({}, deleInv.melhor.dano > dele.melhor.dano ? deleInv.melhor : dele.melhor, { dano: deleInv.melhor.dano * fr + dele.melhor.dano * (1 - fr) }), melhorPrio: dele.melhorPrio, segundo: dele.segundo };
    }
    var v1 = velocidadeNoDuelo(eu, turnos, foe, meu.melhor.golpe, dele.melhor.golpe), v2 = velocidadeNoDuelo(foe, turnos, eu, dele.melhor.golpe, meu.melhor.golpe);
    // Trick Room (Twist. Dimension): enquanto dura, o mais lento age primeiro.
    if (CAMPO_DUELO.sala && turnos <= CAMPO_DUELO.sala) { v1 = -v1; v2 = -v2; }
    // Know Your Place: depois do 1º contato, o rival age por último.
    if (turnos >= 2 && eu.ef.forcaUltimo && meu.melhor.golpe && meu.melhor.golpe.contato) v1 = Infinity;
    if (turnos >= 2 && foe.ef.forcaUltimo && dele.melhor.golpe && dele.melhor.golpe.contato) v2 = Infinity;
    var st = danoComStatusNoDuelo(eu, foe, meu, dele, turnos, v1 > v2 ? true : v1 < v2 ? false : null);
    if (ini.soPar) return { meu: meu, dele: dele, st: st, v1: v1, v2: v2, hpEu: hpEu, hpFoe: hpFoe, turnos: turnos };
    var euPreciso = golpesNecessariosDuelo(hpFoe, st.meu);
    var elePrecisa = golpesNecessariosDuelo(hpEu, st.dele);
    var comPrio = golpesNecessariosDuelo(hpFoe, st.meuPrio);
    // Focus Sash/Sturdy: só com HP cheio.
    if (fracFoe >= 1 && aguentaUmGolpe(foe, eu)) { if (euPreciso === 1) euPreciso = 2; if (comPrio === 1) comPrio = 2; }
    if (fracEu >= 1 && aguentaUmGolpe(eu, foe) && elePrecisa === 1) elePrecisa = 2;
    // Disguise/Ice Face: o primeiro golpe não faz nada.
    if (elePrecisa !== Infinity) elePrecisa += bloqueiosNoDuelo(eu, foe, dele);
    if (euPreciso !== Infinity) { var bq = bloqueiosNoDuelo(foe, eu, meu); euPreciso += bq; comPrio += bq; }
    var prioDele = temPrioridadeNoDuelo(foe, dele, elePrecisa);
    var nec = euPreciso, euPrimeiro;
    if (comPrio <= elePrecisa && !prioDele) { nec = Math.min(euPreciso, comPrio); euPrimeiro = true; }
    else if (temPrioridadeNoDuelo(eu, meu, euPreciso) && !prioDele) euPrimeiro = true;
    else if (prioDele && !(meu.melhor.prio > 0)) euPrimeiro = false;
    else euPrimeiro = v1 > v2 ? true : v1 < v2 ? false : null;
    var porPrioridade = (comPrio <= elePrecisa && !prioDele) || meu.melhor.prio > 0 || prioDele;
    // Corrida: turnos que cada lado precisa (com atraso de plano) - quem age antes leva um golpe a menos.
    function corridaCrua(nE, nD, primeiro, dM, dD, hpE, hpF, atrasoE) {
      if (nE === Infinity && nD === Infinity) return { nota: 0.5, venceu: null, restoEu: hpE, restoFoe: hpF, n: TURNOS_MAX_STATUS };
      if (nE < nD || (nE === nD && primeiro)) return { nota: 1, venceu: true, restoEu: hpE - (primeiro ? Math.ceil(nE) - 1 : Math.ceil(nE)) * dD, restoFoe: 0, n: nE };
      if (nE === nD && primeiro === null) return { nota: 0.5, venceu: null, restoEu: hpE - (nE - 0.5) * dD, restoFoe: hpF - (nE - 0.5) * dM, n: nE };
      var meus = Math.max(0, (primeiro ? nD : nD - 1) - (atrasoE || 0)); // turnos gastos no plano não batem
      return { nota: 0.5 * Math.min(1, (meus * dM) / hpF), venceu: false, restoEu: 0, restoFoe: hpF - meus * dM, n: nD };
    }
    function comFim(r) { var d = fim(r.nota, r.venceu, r.restoEu, r.restoFoe, r.n); if (ini.detalhe && d.planoEu === undefined) { d.planoEu = null; d.planoEle = null; } return d; }
    var semPlanos = corridaCrua(nec, elePrecisa, euPrimeiro, st.meu, st.dele, hpEu, hpFoe);
    // Quick Draw: com chance q, quem seria o segundo age primeiro - mistura os dois resultados.
    function comSaque(r, a, b) {
      var q = (euPrimeiro === false ? a.ef.saque : 0) - (euPrimeiro === true ? b.ef.saque : 0);
      if (!q || porPrioridade) return r;
      var outra = corridaCrua(nec, elePrecisa, q > 0, st.meu, st.dele, hpEu, hpFoe);
      var w = Math.abs(q);
      return { nota: (1 - w) * r.nota + w * outra.nota, venceu: r.venceu, restoEu: (1 - w) * r.restoEu + w * outra.restoEu, restoFoe: (1 - w) * r.restoFoe + w * outra.restoFoe, n: r.n };
    }
    var naEntrada = function (u) {
      return u.ef.entradaSono || u.ef.entradaDisable || u.ef.entradaTorment || u.ef.quash || u.ef.po || u.ef.disableAoContato || u.ef.disableSom ||
        u.ef.disableComGelo || u.ef.primeiroGolpeRecebido < 1;
    };
    var temPlanos = ((eu.statusIds && eu.statusIds.length) || (foe.statusIds && foe.statusIds.length) || naEntrada(eu) || naEntrada(foe)) && !ini.semPlanos;
    if (!temPlanos) return comFim(comSaque(semPlanos, eu, foe));
    // Golpes de status (regras simples): cada lado escolhe o plano que mais rende
    // contra o outro atacando direto; depois os dois planos correm juntos.
    function corridaCom(pe, pf) {
      // Taunt do mais rápido cancela o plano do outro; Haze zera o setup do outro.
      var euMaisRapido = v1 > v2;
      if (pe && pe.cancelaPlano && euMaisRapido && pf) pf = null;
      if (pf && pf.cancelaPlano && !euMaisRapido && pe) pe = null;
      // Flying Press com Taunt (Wrestle Showman): cancela o plano do outro.
      if (pf && eu.ef.golpeTaunt && meu.melhor.golpe && meu.melhor.golpe.nome === eu.ef.golpeTaunt && euMaisRapido) pf = null;
      if (pe && foe.ef.golpeTaunt && dele.melhor.golpe && dele.melhor.golpe.nome === foe.ef.golpeTaunt && !euMaisRapido) pe = null;
      // Restraining Order expulsa depois do 1º golpe (o setup se perde); Strikeout expulsa quem só se cura.
      if (pf && pf.tipo === "setup" && eu.ef.expulsaAoApanhar && !foe.ef.naoSaiForcado) pf = null;
      if (pe && pe.tipo === "setup" && foe.ef.expulsaAoApanhar && !eu.ef.naoSaiForcado) pe = null;
      if (pf && pf.sustenta && eu.ef.expulsaQuemEnrola && !foe.ef.naoSaiForcado) pf = null;
      if (pe && pe.sustenta && foe.ef.expulsaQuemEnrola && !eu.ef.naoSaiForcado) pe = null;
      var efE = pe, efF = pf;
      if (pe && pe.zeraSetup && pf && pf.tipo === "setup") efF = Object.assign({}, pf, { multX: 1, multY: 1, velX: 1 });
      if (pf && pf.zeraSetup && pe && pe.tipo === "setup") efE = Object.assign({}, pe, { multX: 1, multY: 1, velX: 1 });
      var dM = st.meu, dD = st.dele, hpE = hpEu, hpF = hpFoe, atE = 0, atF = 0, velE = 1, velF = 1, inverte = false;
      // Golpe de status que a habilidade usa ao entrar (sem gastar turno).
      function naEntradaDe(x, y, golpeY, danoY) {
        var r = { perdeY: 0, multY: 1, danoY: 0 };
        if (x.ef.entradaSono && !y.ef.imuneStatus.sono && statusPassaDuelo(x, y) && podeDormirDuelo(y, x) === true) r.perdeY += (y.ef.acordaCedo ? 1 : 2) * (1 - (y.ef.curaStatus || 0)); // Yawn: dorme 1-3 turnos
        if ((x.ef.entradaDisable || x.ef.entradaTorment) && golpeY && danoY && danoY.melhor.dano > 0 && statusPassaDuelo(x, y)) {
          var razao = danoY.segundo.dano / danoY.melhor.dano;
          r.multY *= x.ef.entradaDisable ? razao : (1 + razao) / 2; // Torment: alterna o melhor e o segundo
        }
        if (x.ef.quash) r.perdeY += 0.5; // Quash: o outro age por último no 1º turno
        if (x.ef.po && golpeY && golpeY.tipo === "Fire") { r.perdeY += 1; r.danoY = 0.25 * y.stats[0]; } // Powder: o golpe Fire explode
        return r;
      }
      var entE = naEntradaDe(eu, foe, dele.melhor.golpe, dele), entF = naEntradaDe(foe, eu, meu.melhor.golpe, meu);
      // Disable por chance (Cursed Body no contato, Radio Jam no som, Frostbind com o gelo): o outro fica com o 2º golpe.
      function disablePorChance(x, gx, y, gy, danoY) {
        if (!gy || !danoY || !(danoY.melhor.dano > 0)) return 1;
        var p = 0, razao = danoY.segundo.dano / danoY.melhor.dano;
        if (x.ef.disableAoContato && gy.contato) p = Math.max(p, x.ef.disableAoContato);
        if (x.ef.disableSom && gx && gx.som) p = Math.max(p, x.ef.disableSom);
        if (x.ef.disableComGelo && gx) (gx.status || []).forEach(function (st) { if (st.st === "congelar") p = Math.max(p, st.p); });
        return 1 - p * (1 - razao);
      }
      dD *= disablePorChance(eu, meu.melhor.golpe, foe, dele.melhor.golpe, dele);
      dM *= disablePorChance(foe, dele.melhor.golpe, eu, meu.melhor.golpe, meu);
      // Chuckster: o 1º golpe que leva sai pela metade.
      var n0 = Math.max(1, turnos);
      if (eu.ef.primeiroGolpeRecebido < 1) dD *= (eu.ef.primeiroGolpeRecebido + n0 - 1) / n0;
      if (foe.ef.primeiroGolpeRecebido < 1) dM *= (foe.ef.primeiroGolpeRecebido + n0 - 1) / n0;
      atF += entE.perdeY; dD *= entE.multY; hpF -= entE.danoY;
      atE += entF.perdeY; dM *= entF.multY; hpE -= entF.danoY;
      if (efE) { atE += efE.atraso; dM = dM * efE.multX + efE.residuoY; dD *= efE.multY; velE *= efE.velX; velF *= efE.velY; hpE -= efE.custo * eu.stats[0]; atF += efE.perdeY; inverte = inverte || !!efE.inverteOrdem; hpF -= efE.danoUmaVezY || 0; hpE += efE.curaX || 0; }
      if (efF) { atF += efF.atraso; dD = dD * efF.multX + efF.residuoY; dM *= efF.multY; velF *= efF.velX; velE *= efF.velY; hpF -= efF.custo * foe.stats[0]; atE += efF.perdeY; inverte = inverte || !!efF.inverteOrdem; hpE -= efF.danoUmaVezY || 0; hpF += efF.curaX || 0; }
      // Retribution Blow: se o outro sobe atributo, leva um Hyper Beam (150) na hora.
      if (efF && efF.tipo === "setup" && eu.ef.retribuicao && meu.melhor.golpe && meu.melhor.golpe.poder > 0) hpF -= meu.melhor.dano * 150 / meu.melhor.golpe.poder;
      if (efE && efE.tipo === "setup" && foe.ef.retribuicao && dele.melhor.golpe && dele.melhor.golpe.poder > 0) hpE -= dele.melhor.dano * 150 / dele.melhor.golpe.poder;
      if (hpE <= 0) return { nota: 0, venceu: false, restoEu: 0, restoFoe: hpF, n: 1 };
      var susE = efE && efE.sustenta && dM > 0, susF = efF && efF.sustenta && dD > 0;
      if (susE && !susF) return { nota: 1, venceu: true, restoEu: hpE * 0.5, restoFoe: 0, n: TURNOS_MAX_STATUS };
      if (susF && !susE) return { nota: 0.5 * Math.min(1, dM * TURNOS_MAX_STATUS / hpF) * 0.5, venceu: false, restoEu: 0, restoFoe: hpF * 0.5, n: TURNOS_MAX_STATUS };
      if (susE && susF) return { nota: 0.5, venceu: null, restoEu: hpE * 0.5, restoFoe: hpF * 0.5, n: TURNOS_MAX_STATUS };
      var primeiro = euPrimeiro;
      if (!porPrioridade) {
        var a = v1 * velE, b = v2 * velF;
        if (inverte) { a = -a; b = -b; }
        primeiro = a > b ? true : a < b ? false : null;
      }
      var nE = golpesNecessariosDuelo(hpF, dM), nD = golpesNecessariosDuelo(hpE, dD);
      if (nE !== Infinity) nE += nec - euPreciso + (euPreciso - golpesNecessariosDuelo(hpFoe, st.meu)); // Focus Sash, bloqueios
      if (nD !== Infinity) nD += elePrecisa - golpesNecessariosDuelo(hpEu, st.dele);
      return corridaCrua(nE + atE, nD + atF, primeiro, dM, dD, hpE, hpF, atE);
    }
    var baseEu = { dX: st.meu, dY: st.dele, hpX: hpEu, hpY: hpFoe, golpeX: meu.melhor.golpe, golpeY: dele.melhor.golpe, nX: nec,
      danoX1: meu.melhor.dano, danoY1: dele.melhor.dano, danoY2: dele.segundo ? dele.segundo.dano : dele.melhor.dano };
    var baseEle = { dX: st.dele, dY: st.meu, hpX: hpFoe, hpY: hpEu, golpeX: dele.melhor.golpe, golpeY: meu.melhor.golpe, nX: elePrecisa,
      danoX1: dele.melhor.dano, danoY1: meu.melhor.dano, danoY2: meu.segundo ? meu.segundo.dano : meu.melhor.dano };
    // Ordem: o plano dele contra o meu ataque direto; o meu respondendo ao dele
    // (Taunt/Haze só rendem assim); o dele de novo, respondendo ao meu.
    // Do lado dele, "rende mais" = a minha nota cai.
    var planoDele = function (meuPlano) { return melhorPlanoDuelo(foe, eu, baseEle, nivel, function (ef) { var r = corridaCom(meuPlano, ef); return { nota: 1 - r.nota, fracEu: r.restoFoe / foe.stats[0] }; }); };
    var planoEle = planoDele(null);
    // Só procura o meu plano quando pode mudar algo: sem o detalhe (rank), vitória
    // já é nota máxima; e se ele me nocauteia de um golpe antes de eu agir, nenhum plano ajuda.
    var semMeuPlano = corridaCom(null, planoEle);
    var vale = (ini.detalhe || semMeuPlano.nota < 1) && !(euPrimeiro === false && elePrecisa <= 1);
    var planoEu = vale ? melhorPlanoDuelo(eu, foe, baseEu, nivel, function (ef) { var r = corridaCom(ef, planoEle); return { nota: r.nota, fracEu: r.restoEu / eu.stats[0] }; }) : null;
    if (planoEu) planoEle = planoDele(planoEu);
    var final = planoEu || planoEle ? corridaCom(planoEu, planoEle) : semPlanos;
    final = comSaque(final, eu, foe);
    if (ini.detalhe) { var d = comFim(final); d.planoEu = planoEu ? planoEu.nome : null; d.planoEle = planoEle ? planoEle.nome : null; return d; }
    return comFim(final);
  }

  // ---------- os dois lados ----------
  // Tipos na batalha: os da espécie + os que a habilidade acrescenta (Phantom,
  // Half Drake...) - valem pro STAB e pras fraquezas.
  function tiposNaBatalha(sp, ef) {
    return speciesTypeNames(sp).concat(ef.tipoExtra).filter(function (t, i, a) { return a.indexOf(t) === i; });
  }
  // Pokémon de chefão (linha de bosses.json) no nível pedido.
  function foeDeDuelo(m, nivel, clima) {
    var megaSname = MEGA_FORMS[m.item];
    var sp = (megaSname && getSpeciesBySname(megaSname)) || getSpeciesByX(m.x);
    if (!sp) return null;
    var abiId = ABILITY_ID_BY_NAME[m.abi];
    var ids = uniqueIds((sp.inn || []).concat(abiId !== undefined && !megaSname ? [abiId] : []));
    var ev = m.evsRaw || [0, 0, 0, 0, 0, 0], iv = m.ivsRaw || [31, 31, 31, 31, 31, 31];
    var foe = { sp: sp, nome: m.n || sp.n, ids: ids, item: m.item || "", it: itemDoDuelo(m.item || "", sp),
      stats: [0, 1, 2, 3, 4, 5].map(function (i) { return calcFinalStat(sp.b[i], iv[i], ev[i], nivel, i, m.nat, m.item, sp.n); }) };
    foe.ef = efeitoDasHabilidadesNoDuelo(ids, sp.sname, clima);
    foe.tipos = tiposNaBatalha(sp, foe.ef);
    aplicarFormaDuelo(foe, function (alt) { return [0, 1, 2, 3, 4, 5].map(function (i) { return calcFinalStat(alt.b[i], iv[i], ev[i], nivel, i, m.nat, m.item, alt.n); }); }, clima);
    foe.clima = clima || null;
    foe.dormindoAtaca = (m.mv || []).indexOf("Sleep Talk") !== -1;
    foe.abId = abiId !== undefined && !megaSname ? abiId : null;
    foe.golpeIds = (m.mv || []).map(function (n) { return MOVE_ID_BY_NAME[n]; }).filter(function (id) { return id !== undefined && golpeUtilNoDuelo(id); });
    foe.statusIds = (m.mv || []).map(function (n) { return MOVE_ID_BY_NAME[n]; }).filter(function (id) { return id !== undefined && !!planoDoGolpeStatus(id); });
    foe.golpesProntos = prepararGolpesDuelo((m.mv || []).map(function (n) { return MOVE_ID_BY_NAME[n]; })
      .filter(function (id) { return id !== undefined && golpeUtilNoDuelo(id); }), foe, clima);
    return foe;
  }
  // Clima que o time do chefão arma (Drought, Drizzle... em qualquer Pokémon dele).
  function climaDoTimeDoChefao(party) {
    var clima = null;
    (party || []).forEach(function (m) {
      var sp = getSpeciesByX(m.x);
      if (!sp || clima) return;
      var nomes = uniqueIds((sp.inn || []).concat(ABILITY_ID_BY_NAME[m.abi] !== undefined ? [ABILITY_ID_BY_NAME[m.abi]] : [])).map(nomeHabDuelo);
      ["sol", "chuva"].forEach(function (c) { if (!clima && nomes.some(function (n) { return habilidadeArma(n, c); })) clima = c; });
    });
    return clima;
  }
  // item: o da build, quando há; sem ele, o que combina com o set e a habilidade (itemDoSetDuelo).
  function unidadeDeDuelo(sp, set, abId, nivel, golpeIds, clima, item) {
    var ids = uniqueIds((sp.inn || []).concat(abId === null || abId === undefined ? [] : [abId]));
    var ef = efeitoDasHabilidadesNoDuelo(ids, sp.sname, clima);
    if (ef.semRecarga) golpeIds = uniqueIds(golpeIds.concat(golpesDeRecargaAte(sp, nivel))); // Rampage: Hyper Beam e parecidos
    var nomeItem = item === undefined || item === null ? itemDoSetDuelo(set, sp, ef) : item;
    var u = { sp: sp, set: set.nome, ab: abId === null || abId === undefined ? "" : nomeHabDuelo(abId), abId: abId, ids: ids, item: nomeItem, it: itemDoDuelo(nomeItem, sp),
      stats: [0, 1, 2, 3, 4, 5].map(function (i) { return calcFinalStat(sp.b[i], 31, set.evs[i], nivel, i, set.nature, nomeItem, sp.n); }) };
    u.ef = ef;
    u.statusIds = planosUteisDuelo(golpesDeStatusAte(sp, nivel), u, golpeIds);
    u.clima = clima || null;
    u.golpeIds = golpeIds;
    u.tipos = tiposNaBatalha(sp, u.ef);
    aplicarFormaDuelo(u, function (alt) { return [0, 1, 2, 3, 4, 5].map(function (i) { return calcFinalStat(alt.b[i], 31, set.evs[i], nivel, i, set.nature, nomeItem, alt.n); }); }, clima);
    u.golpesProntos = prepararGolpesDuelo(golpeIds, u, clima);
    return u;
  }

  // Melhor set + habilidade escolhível desta espécie contra uma lista de foes.
  // Devolve { nota (soma 0..foes.length), set, ab, porFoe[], unidade }.
  // `abForcada`: quem arma o clima da estratégia do time entra com ESSA habilidade.
  function melhorUnidadeContra(sp, foes, nivel, clima, golpeIds, abForcada) {
    var escolhas = abForcada !== undefined ? [abForcada] : uniqueIds(sp.ab || []);
    if (!escolhas.length) escolhas = [null];
    var melhor = null;
    SETS_DE_DUELO.forEach(function (set) {
      escolhas.forEach(function (ab) {
        var u = unidadeDeDuelo(sp, set, ab, nivel, golpeIds, clima);
        var porFoe = foes.map(function (f) { return resultadoDoDuelo(u, f, nivel); });
        var nota = porFoe.reduce(function (a, v) { return a + v; }, 0);
        if (!melhor || nota > melhor.nota) melhor = { nota: nota, set: set.nome, ab: u.ab, porFoe: porFoe, unidade: u };
      });
    });
    return melhor;
  }

  // ---------- botão "Montar time contra este chefão" ----------
  // candidatos: [{ sp, owned }] (forma de batalha + criatura que o jogador tem).
  // Escolhe até 6 cobrindo o time do chefão: a cada passo entra quem mais
  // aumenta a cobertura (soma, por Pokémon do chefão, da melhor resposta do
  // time) - desempate pela nota total. Uma criatura entra uma vez só.
  //
  // Estratégia de time (2026-09-29, usuário: "no time temos um Poke que seta sol
  // e no mesmo time um que usa Solar Beam, logo a estratégia do time é feita").
  // Além do time "no clima que o chefão arma", tenta cada clima que alguém do
  // jogador arma AO ENTRAR: esse Pokémon entra no time com a habilidade que arma,
  // todo mundo (inclusive o chefão) é avaliado com o clima ligado, e fica a
  // estratégia que cobre melhor - só se ganhar com folga (GANHO_MINIMO), pra
  // não trocar um time bom por um truque marginal.
  var CLIMAS_DE_ESTRATEGIA = ["sol", "chuva", "areia", "granizo", "nevoa"];
  var GANHO_MINIMO_ESTRATEGIA = 0.5;
  function armadoresDeClima(candidatos) {
    var out = [];
    candidatos.forEach(function (c) {
      var inn = uniqueIds(c.sp.inn || []), esc = uniqueIds(c.sp.ab || []);
      inn.map(function (id) { return { id: id, innate: true }; }).concat(esc.map(function (id) { return { id: id, innate: false }; })).forEach(function (h) {
        var nome = nomeHabDuelo(h.id), texto = textoHabDuelo(h.id);
        if (!/on entry|until switched out/i.test(texto)) return; // só quem arma ao entrar (não "quando atingido")
        CLIMAS_DE_ESTRATEGIA.forEach(function (w) {
          if (habilidadeArma(nome, w)) out.push({ cand: c, clima: w, habilidade: nome, abForcada: h.innate ? undefined : h.id });
        });
      });
    });
    return out;
  }
  // ---------- golpes de status (2026-09-29, decisão do usuário: regras simples) ----------
  // Efeito do golpe no dado (move_categorias.se) -> plano. Valores da série.
  var SETUP_DUELO = {
    "Dragon Dance": { atk: 1, spe: 1 }, "Calm Mind": { spa: 1, spd: 1 }, "Bulk Up": { atk: 1, def: 1 }, "Quiver Dance": { spa: 1, spd: 1, spe: 1 },
    "Coil": { atk: 1, def: 1 }, "Cosmic Power": { def: 1, spd: 1 }, "Growth": { atk: 1, spa: 1 }, "Work Up": { atk: 1, spa: 1 }, "Howl": { atk: 1 },
    "Meditate": { atk: 1 }, "Sharpen": { atk: 1 }, "Belly Drum": { atk: 6, custo: 0.5 }, "Shell Smash": { atk: 2, spa: 2, spe: 2, def: -1, spd: -1 },
    "Shift Gear": { atk: 1, spe: 2 }, "Tail Glow": { spa: 3 }, "Charge": { spd: 1 }, "Stockpile": { def: 1, spd: 1 }, "Defense Curl": { def: 1 },
    "Barrier": { def: 2 }, "Acupressure": { atk: 0.4, def: 0.4, spa: 0.4, spd: 0.4, spe: 0.4 }, "Victory Dance": { atk: 1, def: 1, spe: 1 },
    "No Retreat": { atk: 1, def: 1, spa: 1, spd: 1, spe: 1 }, "Clangorous Soul": { atk: 1, def: 1, spa: 1, spd: 1, spe: 1, custo: 1 / 3 }
  };
  var QUEDA_DUELO = { "Tickle": { atk: -1, def: -1 }, "Noble Roar": { atk: -1, spa: -1 }, "Memento": { atk: -2, spa: -2, custo: 1 } };
  var STATUS_DO_GOLPE_DUELO = {
    "Will O Wisp": "queimar", "Toxic": "envenenarForte", "Poison": "envenenar", "Paralyze": "paralisar", "Paralyze Ignore Type": "paralisar",
    "Sleep": "sono", "Yawn": "sono", "Confuse": "confundir", "Teeter Dance": "confundir", "Swagger": "confundir", "Flatter": "confundir",
    "Attract": "paixao", "Leech Seed": "semente", "Scary Face": "medo"
  };
  var CURA_DUELO = { "Restore Hp": 0.5, "Softboiled": 0.5, "Roost": 0.5, "Morning Sun": 0.5, "Synthesis": 0.5, "Moonlight": 0.5, "Wish": 0.5, "Jungle Healing": 0.25, "Rest": 1 };
  var NOME_ESTAGIO_DUELO = { attack: "atk", defense: "def", "special attack": "spa", "sp attack": "spa", "special defense": "spd", speed: "spe", evasion: "eva", accuracy: "acc" };
  function planoDoGolpeStatus(id) {
    var e = typeof MOVE_CATEGORIAS !== "undefined" ? MOVE_CATEGORIAS[id] : null;
    var se = e && e.se, x, st;
    if (!se) return null;
    if (SETUP_DUELO[se]) return { tipo: "setup", estagios: SETUP_DUELO[se] };
    if ((x = se.match(/^(Attack|Defense|Special Attack|Sp Attack|Special Defense|Speed) Up(?: (\d))?$/i)) && (st = NOME_ESTAGIO_DUELO[x[1].toLowerCase()])) {
      var o = {}; o[st] = x[2] ? parseInt(x[2], 10) : 1; return { tipo: "setup", estagios: o };
    }
    if (QUEDA_DUELO[se]) return { tipo: "queda", estagios: QUEDA_DUELO[se] };
    if ((x = se.match(/^(Attack|Defense|Special Attack|Special Defense|Speed) Down(?: (\d))?$/i)) && (st = NOME_ESTAGIO_DUELO[x[1].toLowerCase()])) {
      var q = {}; q[st] = -(x[2] ? parseInt(x[2], 10) : 1); return { tipo: "queda", estagios: q };
    }
    if (STATUS_DO_GOLPE_DUELO[se]) return { tipo: "status", status: STATUS_DO_GOLPE_DUELO[se], adiado: se === "Yawn", ignoraTipo: /Ignore Type/.test(se), provoca: se === "Swagger" ? { atk: 2 } : se === "Flatter" ? { spa: 1 } : null };
    if (CURA_DUELO[se]) return { tipo: "cura", cura: CURA_DUELO[se], dorme: se === "Rest", peloClima: /^(Morning Sun|Synthesis|Moonlight)$/.test(se) };
    if (se === "Reflect") return { tipo: "tela", cat: "F" };
    if (se === "Light Screen") return { tipo: "tela", cat: "E" };
    if (/^Aurora Veil$/.test(se)) return { tipo: "tela", cat: "todos" };
    if (se === "Taunt") return { tipo: "taunt" };
    if (se === "Haze") return { tipo: "haze" };
    if (se === "Disable" || se === "Encore" || se === "Torment") return { tipo: "disable" };
    if (se === "Tailwind") return { tipo: "vento" };
    if (se === "Trick Room") return { tipo: "sala" };
    if (se === "Protect") return { tipo: "protege" };
    if (se === "Stealth Rock" || se === "Spikes" || se === "Toxic Spikes" || se === "Sticky Web") return { tipo: "hazard", hazard: { "Stealth Rock": "rocha", "Spikes": "espinho", "Toxic Spikes": "toxico", "Sticky Web": "teia" }[se] };
    if (se === "Substitute") return { tipo: "substituto" };
    var CLIMA_DO_GOLPE = { "Rain Dance": "chuva", "Sunny Day": "sol", "Sandstorm": "areia", "Hail": "granizo", "Snowscape": "granizo" };
    if (CLIMA_DO_GOLPE[se] || /Fog$/.test(se)) return { tipo: "clima", clima: CLIMA_DO_GOLPE[se] || "nevoa" };
    if (se === "Pain Split") return { tipo: "divide" };
    return null;
  }
  function lerStatusGolpeDaFraseDuelo(f, ef) {
    var x;
    if (/Bounces back the effect of status moves/i.test(f)) ef.refleteStatus = true;
    if (/Immune to all Status moves/i.test(f)) ef.imuneGolpeStatus = true;
    if (/Status moves have \+1 priority but fail on opposing Dark/i.test(f)) ef.pranksterStatus = true;
    if (/Immune to [^.]*Taunt/i.test(f)) ef.imuneTaunt = true;
    if (/Awakens twice as fast from sleep/i.test(f)) ef.acordaCedo = true;
    if (/Doubles damage if an opponent is sleeping/i.test(f)) ef.bonusVsSono = 2;
    if ((x = f.match(/Sleeping Pok\S+ lose 1\/(\d+) of max HP/i))) ef.pesadelo = 1 / parseInt(x[1], 10);
    if (/Status moves ignore immunities but go last/i.test(f)) ef.statusIgnoraImune = true;
    if (/Status moves become sound-based/i.test(f)) ef.statusSom = true;
    if ((x = f.match(/^(Hypnosis|Sing) accuracy is (\d+)%/i))) ef.precisaoGolpe[x[1]] = parseInt(x[2], 10) / 100;
    if (/Hypnosis never misses and also causes Confusion/i.test(f)) { ef.precisaoGolpe.Hypnosis = 1; ef.encadeiaStatus.sono = "confundir"; }
    // Aurora Borealis: "Moves always benefit from hail" - o changelog 2.65.3b confirma o
    // efeito: Blizzard e Sheer Cold com a precisão do granizo (não erram).
    if (/Moves always benefit from hail/i.test(f)) { ef.precisaoGolpe.Blizzard = 1; ef.precisaoGolpe["Sheer Cold"] = 1; }
    if (/Moves that have a healing effect gain \+3 priority/i.test(f)) ef.triage = true;
    // Golpe de status que a habilidade usa sozinha ao entrar.
    if (/Uses String Shot on switch-in/i.test(f)) ef.quedaNaEntrada.spe = (ef.quedaNaEntrada.spe || 0) - 2;
    if (/Uses Tickle on entry/i.test(f)) { ef.quedaNaEntrada.atk = (ef.quedaNaEntrada.atk || 0) - 1; ef.quedaNaEntrada.def = (ef.quedaNaEntrada.def || 0) - 1; }
    if (/Attacks with Sand Attack on switch-in|Sets Smokescreen for 3 turns on switch-in/i.test(f)) ef.evasao *= 4 / 3; // precisão do rival -1 (série: 3/4)
    if (/Uses Wish on switch-in/i.test(f)) ef.reviveHP = Math.max(ef.reviveHP, 0.5);
    if (/Uses Yawn on switch-in/i.test(f)) ef.entradaSono = true;
    if (/Uses Disable on switch-in/i.test(f)) ef.entradaDisable = true;
    if (/Casts Torment on entry/i.test(f)) ef.entradaTorment = true;
    if (/Uses Dragon Cheer on switch-in/i.test(f)) ef.critEstagio += 1;
    if (/Casts Trick-or-Treat on entry/i.test(f)) ef.adicionaFantasma = true;
    if (/Casts Telekinesis on entry/i.test(f)) ef.semErrar = true;
    if (/Applies Quash on switch-in/i.test(f)) ef.quash = true;
    if (/Casts Powder on entry/i.test(f)) ef.po = true;
  }
  // Um golpe por efeito (o de melhor precisão) - vários "Attack Up" fazem o mesmo -
  // e golpe de clima só quando o clima mexe nele (habilidade de clima ou golpe
  // Fire/Water): o rank avalia os planos em cada duelo, e isso pesa.
  function planosUteisDuelo(ids, u, golpeIds) {
    var porChave = {};
    var precisao = function (id) { var a = MOVES[id][4]; return a > 0 && a <= 100 ? a : 101; };
    var mexeNoClima = function (clima) {
      var e2 = efeitoDasHabilidadesNoDuelo(u.ids, u.sp.sname, clima);
      if (["speMult", "atkMult", "spaMult", "defMult", "spdMult", "danoMult", "curaPorTurno", "evasao"].some(function (k) { return e2[k] !== u.ef[k]; })) return true;
      return (golpeIds || []).some(function (g) { var t = TYPES[MOVES[g][1]]; return t === "Fire" || t === "Water"; });
    };
    ids.forEach(function (id) {
      var p = planoDoGolpeStatus(id);
      if (!p) return;
      if (p.tipo === "clima" && !mexeNoClima(p.clima)) return;
      var chave = p.tipo + ":" + JSON.stringify(p.estagios || p.status || p.cura || p.cat || p.clima || p.hazard || "") + (p.adiado ? "y" : "") + (p.dorme ? "r" : "");
      if (!porChave[chave] || precisao(id) > precisao(porChave[chave])) porChave[chave] = id;
    });
    return Object.keys(porChave).map(function (k) { return porChave[k]; });
  }
  // ---------- o resto (2026-09-29): prisão, troca, clima anulado, Disable, sorte ----------
  function lerRestoDaFraseDuelo(f, ef, climaOk) {
    var x;
    // Prisão: impede a minha troca na luta inteira (Shadow Tag, Arena Trap, Magnet Pull, Salt Circle...).
    if (/Opponents can't be switched out/i.test(f)) ef.prende = "todos";
    if (/^Enemies can't flee/i.test(f)) ef.prende = "chao"; // Arena Trap: só quem está no chão
    if (/Traps opposing Steel-types/i.test(f)) ef.prende = "aco";
    if (/Prevents opposing pokemon from fleeing on entry|Attacks trap/i.test(f)) ef.prende = "todos";
    if (/(\d+)% chance to trap(?: on contact)?/i.test(f)) ef.prende = ef.prende || "chance";
    if (/Then ignores Defense & accuracy checks/i.test(f)) { ef.semErrar = true; ef.ignoraDefesa = 0.5; } // Grip Pincer: depois de prender (50%)
    if (/Trapping deals 1\/6 HP/i.test(f)) ef.prisaoForte = true; // Grappler
    if (/Lowers foe's speed at the end of turns/i.test(f)) ef.quedaPorTurno = { spe: -1 }; // Sap Trap
    if (/then drop the their speed by -1 each turn/i.test(f)) ef.quedaPorTurno = { spe: -1 }; // Serpent Bind
    if (/Binding moves lower speed and paralyze/i.test(f)) ef.prisaoParalisa = true; // Chokehold
    if ((x = f.match(/(\d+)% flinch chance when moving first/i))) ef.recuoSePrimeiro = parseInt(x[1], 10) / 100; // From the Shadows
    // Troca forçada e saída.
    if (/Once per entry, take 1\/2 damage and force-switch the target/i.test(f)) ef.primeiroGolpeRecebido = 0.5; // Chuckster
    if (/Forces the attacker out when hit, once each switch-in/i.test(f)) ef.expulsaAoApanhar = true; // Restraining Order
    if (/Forces the foe out if they don't attack for 3 turns/i.test(f)) ef.expulsaQuemEnrola = true; // Strikeout
    if (/Cannot be forced to switch out/i.test(f)) ef.naoSaiForcado = true;
    if (/At 1\/2 of max HP or below, instantly switches out/i.test(f)) ef.fogeNaMetade = true; // Emergency Exit, Wimp Out
    if (/Flees when stats are lowered/i.test(f)) ef.fogeAoCair = true; // Tactical Retreat
    if (/Boosts all stats but can't retreat when below 1\/2 max HP/i.test(f)) ef.ultimaCartada = true; // No Turning Back
    if (/Sets a trap that burns the next foe that switches in/i.test(f)) ef.brasas = true; // Hot Coals
    if ((x = f.match(/Deals double damage to opponents being switched in/i))) ef.tocaia = 2; // Stakeout
    // Clima anulado ou virado.
    if (/Clears weather and prevents its effects|Negates Weather, Rooms and Terrains/i.test(f)) ef.anulaClima = true; // Cloud Nine
    if (/Strong Winds until switched out/i.test(f)) ef.ventoForte = true; // Delta Stream
    if (/Negates all weather based moves from enemies/i.test(f)) ef.bloqueiaGolpeClima = true; // Weather Control
    if (/Sun boosts Water\. Rain boosts Fire|^Sun boosts Water/i.test(f)) ef.catastrofe = true;
    if (/Water moves function normally under sun/i.test(f)) ef.aguaNoSol = true; // Nika
    if (/Protects its side from status and secondary effects in sand/i.test(f) && climaOk("sand")) { todosOsStatusDuelo(ef.imuneStatus); ef.imuneEfeitoDeGolpe = true; } // Desert Cloak
    // Disable por chance.
    if ((x = f.match(/(\d+)% chance to disable moves if enemy makes contact/i))) ef.disableAoContato = parseInt(x[1], 10) / 100; // Cursed Body
    if ((x = f.match(/Sound-based moves have a (\d+)% chance to inflict disable/i))) ef.disableSom = parseInt(x[1], 10) / 100; // Radio Jam
    if (/Inflicting Frostbite also inflicts Disable/i.test(f)) ef.disableComGelo = true; // Frostbind
    // Sorte na ordem.
    if ((x = f.match(/(\d+)% chance to move first/i))) ef.saque = parseInt(x[1], 10) / 100; // Quick Draw
    if (/Astonishes enemy priority users in fog/i.test(f) && climaOk("fog")) ef.barraPrioridade = true; // Surprise!
    // Recuo vira velocidade (Steadfast), dano a mais contra Mega (Eternal Flower), Power Outage.
    if (/Raises Speed by one stage if this Pok\S+ flinches/i.test(f)) ef.firmeza = true;
    if ((x = f.match(/Reduces the stats of other Megas by (\d+)%/i))) ef.contraMega = 1 - parseInt(x[1], 10) / 100;
    if (/Boosts first Electric attack by 2x then loses Electric type/i.test(f)) ef.apagao = true;
    if ((x = f.match(/Same-type attacks get a ([\d.]+)x boost/i))) ef.stabMult *= parseFloat(x[1]); // Color Spectrum
    if ((x = f.match(/Takes 1\/2 dmg from (\w+) if (\w+)/i)) && tipoDoTextoDuelo(x[1])) ef.resistSeTipo = { tipo: tipoDoTextoDuelo(x[1]), se: tipoDoTextoDuelo(x[2]) }; // Old Mariner
    if ((x = f.match(/(\w+) deals x2 dmg to (\w+)/i)) && tipoDoTextoDuelo(x[1]) && tipoDoTextoDuelo(x[2])) { ef.contraTipo[tipoDoTextoDuelo(x[1])] = ef.contraTipo[tipoDoTextoDuelo(x[1])] || {}; ef.contraTipo[tipoDoTextoDuelo(x[1])][tipoDoTextoDuelo(x[2])] = 2; }
    if (/30% chance of adding a type related effect to each move/i.test(f)) ef.arquimago = 0.3; // Archmage
    if (/Sharply raises a stat based on foe's strong point/i.test(f)) ef.espiao = true; // Spyware
    if (ef.arquimago) {
      var EFEITO_DO_TIPO = { Fire: "queimar", Electric: "paralisar", Ice: "congelar", Poison: "envenenar", Psychic: "confundir", Dark: "medo", Fairy: "paixao", Water: "recuar" };
      Object.keys(EFEITO_DO_TIPO).forEach(function (tp) { empurraStatusDuelo(ef, ef.statusAtaque, [EFEITO_DO_TIPO[tp]], ef.arquimago, { tipo: tp }); });
      ef.arquimago = 0;
    }
    if (ef.recuoSePrimeiro) { empurraStatusDuelo(ef, ef.statusAtaque, ["recuar"], ef.recuoSePrimeiro, {}); ef.recuoSePrimeiro = 0; }
    if (/Mega launcher moves change the target's type to the move used/i.test(f)) ef.pintaAlvo = "pulso"; // Paint Shot
    // Golpe específico alterado com regra no texto.
    if (/Water Shuriken hits once with (\d+)BP and \+1 crit/i.test(f)) ef.golpeAlterado["Water Shuriken"] = { poder: parseInt(f.match(/(\d+)BP/)[1], 10), acertos: 1, crit: 1 };
    if ((x = f.match(/Flying Press gains \+(\d+)BP and causes Taunt/i))) { ef.golpeAlterado["Flying Press"] = { mais: parseInt(x[1], 10) }; ef.golpeTaunt = "Flying Press"; }
    // Sono e cura de status.
    if (/Can't fall asleep/i.test(f)) ef.imuneStatus.sono = true;
    if (/Fighting-type moves heal status/i.test(f)) ef.curaComLuta = true;
    if ((x = f.match(/Heals 1\/(\d+) of max HP every turn if asleep/i))) ef.sonoCura = 1 / parseInt(x[1], 10);
    if (/Cures party status on entry/i.test(f)) ef.curaTimeNaEntrada = true;
    if (/Changes type depending on active Terrain/i.test(f)) ef.mimetismo = true;
    if (/Sets up Grassy or Psychic Terrain at random/i.test(f)) ef.armaTerreno = "grama"; // metade das vezes; conta a grama (os dois reforçam tipos de ataque)
    if (/Increases attack in tailwind or when hit by wind move/i.test(f)) ef.ventoAtaque = true;
    if (/Charges up when hit by wind moves or Tailwind starts/i.test(f)) ef.ventoCarga = true;
  }
  // ---------- lote 4 (2026-09-29) ----------
  function lerLote4DaFraseDuelo(f, ef) {
    if (/Raises its own stats when foes raise theirs/i.test(f)) ef.egoista = true;
    if (/Stat changes are shared between all battlers/i.test(f)) ef.compartilha = true;
    if (/Uses Hyper Beam if any foe uses an stat boosting move/i.test(f)) ef.retribuicao = true;
    if (/Landing a crit boosts your 3 lowest stats/i.test(f)) ef.homeRun = true;
    if (/Uses Heart Swap on switch-in/i.test(f)) ef.trocaEstagios = true;
    if (/Uses Chilly Reception at the end of your 2nd turn/i.test(f)) ef.fogeNaMetade = true; // sai no 2º turno: luta como quem sai na metade
    if (/Summons a sea of fire on entry/i.test(f)) ef.campoResiduo.push({ pct: 1 / 8, exceto: ["Fire"], soInimigo: true }); // Fire+Grass Pledge (série: 1/8, 4 turnos)
    if (/Sets the Swamp Pledge effect on entry/i.test(f)) ef.pantano = true; // Grass+Water Pledge: velocidade do outro 1/4
    if (/Summons the Rainbow Pledge effect on entry/i.test(f)) ef.chanceMult *= 2; // Fire+Water Pledge: chance de efeito dobrada
    if (/Uses Mist on entry/i.test(f)) { ["atk", "def", "spa", "spd", "spe"].forEach(function (k) { ef.imuneQuedas[k] = true; }); }
    if (/Sets Creeping Thorns when hit by contact/i.test(f)) ef.hazards.push({ tipo: "espinhoVerde", quando: "contato" });
    if (/Syrup Bomb effect on the foe for 3 turns/i.test(f)) ef.quedaPorTurno = { spe: -1 };
    if (/Uses Defog on entry/i.test(f)) { ef.limpaHazards = true; ef.limpaTelas = true; ef.limpaTerreno = true; }
    if (/Uses Tar Shot on switch-in/i.test(f)) { ef.quedaNaEntrada.spe = (ef.quedaNaEntrada.spe || 0) - 1; ef.alcatrao = true; }
    if (/Contact moves strike through protection/i.test(f)) ef.atravessaProtecao = true;
    if (/Sets up Protect on switch-in/i.test(f)) ef.protegeNaEntrada = true;
    if (/No recharge after a KO/i.test(f)) ef.semRecarga = true;
    if (/^Always hits/i.test(f)) ef.semErrar = true;
    if (/All attacks are dances/i.test(f)) ef.tudoDanca = true;
    if (/Sound moves become dance moves and vice versa/i.test(f)) ef.dancaSom = true;
    if (/Resets its ally's stat changes on entry/i.test(f)) ef.curaAliadoEstagios = true;
    if (/copies its fainting partner's ability/i.test(f)) ef.receptor = true;
    if (/Uses Thief when it loses an item/i.test(f)) ef.ladrao = true;
    if (/Retrieves item on switch-out/i.test(f)) ef.recuperaItem = true;
  }
  // ---------- cópia, troca e supressão de habilidade (2026-09-29) ----------
  function lerSupressaoDaFraseDuelo(f, ef) {
    if (/Transforms into the foe on entry/i.test(f)) ef.imposter = true;
    if (/Copies the foe's ability/i.test(f)) ef.traca = true;
    if (/All abilities are nullified/i.test(f)) ef.gasNeutro = true;
    if (/If hit, makes the attacker's ability/i.test(f)) ef.mumia = true; // Mummy, Lingering Aroma
    if (/Suppresses attacker's abilities on contact/i.test(f)) ef.malodor = true;
    if (/Trades ability with attacker on contact/i.test(f)) ef.espirito = true; // Wandering Spirit
    if (/Supresses abilities of the target when they're poisoned/i.test(f)) ef.hemotoxina = true;
    if (/Cancels aura abilities and makes them 25% weaker/i.test(f)) ef.quebraAura = true;
  }
  // A mesma unidade com outras habilidades (sem a escolhida, sem nenhuma, ou com
  // uma a mais): refeita uma vez e guardada nela.
  function comHabilidadesDuelo(u, modo, extraId) {
    if (!u.golpeIds) return u;
    u.porHabilidade = u.porHabilidade || {};
    var chave = modo + "|" + (extraId === undefined ? "" : extraId);
    if (u.porHabilidade[chave]) return u.porHabilidade[chave];
    var inn = uniqueIds(u.sp.inn || []);
    var ids = modo === "nenhuma" ? [] : modo === "semEscolhida" ? inn : uniqueIds(u.ids.concat(extraId === undefined || extraId === null ? [] : [extraId]));
    var ef = efeitoDasHabilidadesNoDuelo(ids, u.sp.sname, u.clima || null);
    if (modo === "auraQuebrada") {
      ef = Object.assign({}, u.ef, { bonusTipo: Object.assign({}, u.ef.bonusTipo) });
      ["Fairy", "Dark"].forEach(function (tp) { if ((ef.bonusTipo[tp] || 1) > 1) ef.bonusTipo[tp] = 0.75; });
    }
    var u2 = Object.assign({}, u, { ids: ids, ef: ef, tipos: tiposNaBatalha(u.sp, ef), porHabilidade: null });
    u2.golpesProntos = prepararGolpesDuelo(u.golpeIds, u2, u.clima || null);
    u.porHabilidade[chave] = u2;
    return u2;
  }
  // Na entrada: Imposter vira o outro (fica com o próprio HP), Trace copia a
  // habilidade escolhida do outro, Neutralizing Gas tira as do outro, Aura Break.
  function naEntradaHabilidadesDuelo(a, b) {
    if (a.ef.imposter) a = Object.assign({}, b, { sp: a.sp, stats: [a.stats[0]].concat(b.stats.slice(1)), item: a.item, it: a.it, porHabilidade: null });
    if (a.ef.traca && b.abId !== undefined && b.abId !== null) a = comHabilidadesDuelo(a, "comExtra", b.abId);
    return a;
  }
  // ---------- formas (2026-09-29) ----------
  // A forma é uma espécie própria no dado (Wishiwashi School, Zygarde Complete,
  // Aegislash Blade...). O duelo usa os atributos misturados pela parte da luta
  // em que cada forma vale: Schooling até 1/4 do HP (3/4 da luta), Shields Down
  // e Power Construct abaixo da metade (metade), Hunger Switch alterna (metade).
  function lerFormaDaFraseDuelo(f, ef) {
    var x;
    if ((x = f.match(/changes into (\w+) form until 1\/4 HP or less/i))) ef.forma = { nome: x[1], parte: 0.75 };
    if ((x = f.match(/At 1\/2 of max HP or below, transforms into (\w+) form/i))) ef.forma = { nome: x[1], parte: 0.5 };
    if (/Turns into Blade or Shield form depending on move used/i.test(f)) ef.forma = { nome: "Blade", estancia: true };
    if (/Changes between Full and Hangry forms after each turn/i.test(f)) ef.forma = { nome: "Hangry", parte: 0.5 };
    if (/Changes forms after switching out/i.test(f)) ef.forma = { nome: "Hero", parte: 1 }; // o jogador troca de entrada pra virar Hero
    if (/Changes form with the weather/i.test(f)) ef.forma = { porClima: true };
    if (/Gulps a prey after Dive\/Surf/i.test(f)) ef.cuspe = true;
    if (/Transforms below 50% HP, curing status and always critting/i.test(f)) { ef.critMetade = true; ef.curaStatus = Math.max(ef.curaStatus, 0.5); }
  }
  var FORMA_DO_CLIMA_DUELO = { sol: "Sunny", chuva: "Rainy", granizo: "Snowy", areia: "Sandy", nevoa: "Foggy" };
  // A espécie da forma: mesmo nome com a palavra da forma ("Aegislash Redux" -> "Aegislash Blade Redux").
  function especieDaFormaDuelo(sp, nome) {
    if (!nome || new RegExp("\\b" + nome + "\\b").test(sp.n)) return null;
    var partes = sp.n.split(" "), base = partes[0];
    var candidatas = [partes.slice(0, 1).concat([nome], partes.slice(1)).join(" "), base + " " + nome];
    for (var i = 0; i < candidatas.length; i++) {
      var achou = SPECIES.filter(function (x) { return x && x.n === candidatas[i]; })[0];
      if (achou) return achou;
    }
    return null;
  }
  // Atributos (e tipos) com a forma: statsDe(sp) calcula os atributos da espécie com o mesmo set.
  function aplicarFormaDuelo(u, statsDe, clima) {
    var fm = u.ef.forma;
    if (!fm) return;
    var nome = fm.porClima ? FORMA_DO_CLIMA_DUELO[clima] : fm.nome;
    var alt = especieDaFormaDuelo(u.sp, nome);
    if (!alt) return;
    var sa = statsDe(alt);
    if (fm.estancia) {
      // Stance Change: ataca na Blade, defende na Shield (a forma de agora).
      u.stats = [u.stats[0], sa[1], u.stats[2], sa[3], u.stats[4], u.stats[5]];
      return;
    }
    var p = fm.porClima ? 1 : fm.parte;
    u.stats = u.stats.map(function (v, i) { return Math.round(v * (1 - p) + sa[i] * p); });
    if (p >= 0.5) u.tipos = tiposNaBatalha(alt, u.ef);
  }
  // Dá pra fazer dormir? Electric Terrain impede quem está no chão, Misty Terrain já
  // barra pelo status. Lum/Chesto Berry acordam na hora, mas UMA vez só (revisão de
  // 2026-09-30: antes valia a luta inteira): devolve "baga" - a 1ª tentativa se perde.
  // Unnerve do outro lado ou Klutz de quem segura anulam a baga.
  function podeDormirDuelo(y, x) {
    if (CAMPO_DUELO && CAMPO_DUELO.terreno === "eletrico" && aterradoDuelo(y)) return false;
    if (!podeSofrerStatusDuelo(y, "sono")) return false;
    if (y.it && (y.it.nome === "Lum Berry" || y.it.nome === "Chesto Berry") && !x.ef.nervoso && !y.ef.klutz) return "baga";
    return true;
  }
  // Pode usar golpe de status contra o alvo? Magic Bounce devolve, Good As Gold
  // é imune; Prankster ganha prioridade mas falha em Dark.
  function statusPassaDuelo(x, y) {
    if (y.ef.refleteStatus || y.ef.imuneGolpeStatus) return false;
    if (x.ef.pranksterStatus && (y.tipos || []).indexOf("Dark") !== -1) return false;
    if (x.ef.statusSom && y.ef.imuneFlag["Sound Based"]) return false; // Musical Notes contra Soundproof
    return true;
  }
  // Um plano de "x" contra "y" -> o que muda na corrida. base: { dX, dY (por turno),
  // hpX, hpY, xPrimeiro }. Devolve { atraso, multX, multY, residuoY, perdeY, sustenta,
  // velX (multiplicador), custo (fração do HP de x), nome }.
  function efeitoDoPlanoDuelo(x, y, id, base, nivel) {
    var p = planoDoGolpeStatus(id);
    var nome = MOVES[id][0], acc = MOVES[id][4] > 0 && MOVES[id][4] <= 100 ? MOVES[id][4] / 100 : 1;
    if (!p) return null;
    if (x.ef.precisaoGolpe[nome] !== undefined) acc = Math.max(acc, x.ef.precisaoGolpe[nome]); // Hypnotist, Lullaby, Hypnotic Trance
    var r = { nome: nome, tipo: p.tipo, atraso: 1, multX: 1, multY: 1, residuoY: 0, perdeY: 0, sustenta: false, velX: 1, velY: 1, custo: 0 };
    var gX = base.golpeX, gY = base.golpeY;
    if (p.tipo === "setup") {
      var e = p.estagios, mult = x.ef.estagioMult || 1;
      var st = gX && gX.cat === "E" ? "spa" : "atk";
      r.multX = multDoEstagio((e[st] || 0) * mult);
      if (gY) r.multY = 1 / multDoEstagio((e[gY.cat === "F" ? "def" : "spd"] || 0) * mult);
      r.velX = multDoEstagio((e.spe || 0) * mult);
      r.custo = e.custo || 0;
      return r;
    }
    if (!statusPassaDuelo(x, y)) return null;
    if (p.tipo === "queda") {
      var q = p.estagios;
      if (y.ef.imuneQuedas && Object.keys(q).some(function (k) { return y.ef.imuneQuedas[k]; })) return null;
      if (gY) r.multY = multDoEstagio((q[gY.cat === "F" ? "atk" : "spa"] || 0) * acc);
      if (gX) r.multX = 1 / multDoEstagio((q[gX.cat === "F" ? "def" : "spd"] || 0) * acc);
      r.velY = multDoEstagio((q.spe || 0) * acc);
      r.custo = q.custo || 0;
      return r;
    }
    if (p.tipo === "status") {
      var s = p.status;
      if (s === "sono") {
        if (y.ef.imuneStatus.sono || y.ef.aliadoImuneStatus && y.ef.aliadoImuneStatus.sono) return null;
        var podeDormir = podeDormirDuelo(y, x);
        if (!podeDormir) return null;
        var turnosDormindo = (y.ef.acordaCedo ? 1 : 2) * acc; // série: 1 a 3 turnos (média 2); Early Bird acorda na metade
        turnosDormindo *= 1 - (y.ef.curaStatus || 0); // Shed Skin, Hydration...: acorda antes
        if (y.dormindoAtaca) turnosDormindo *= 0.5; // Sleep Talk: ataca dormindo (golpe ao acaso)
        r.perdeY = turnosDormindo;
        if (x.ef.bonusVsSono) r.multX *= 1 + (x.ef.bonusVsSono - 1) * Math.min(1, turnosDormindo / Math.max(1, base.nX || 1));
        if (x.ef.pesadelo) r.residuoY += x.ef.pesadelo * base.hpY * Math.min(1, turnosDormindo / Math.max(1, base.nX || 1));
        if (p.adiado) r.atraso = 1; // Yawn: dorme no fim do turno seguinte - o rival ainda age
        if (podeDormir === "baga") r.atraso = (r.atraso || 0) + 1; // a baga cura a 1ª tentativa: repete o golpe
        return r;
      }
      var regra = STATUS_DUELO[s];
      if (!regra || (!x.ef.statusIgnoraImune && !podeSofrerStatusDuelo(y, s))) return null; // Mycelium Might ignora imunidade
      if (s === "paralisar" && !p.ignoraTipo && efetividadeNoDuelo(x, "Electric", y) === 0) return null; // Thunder Wave não pega em Ground
      if (regra.residuo && !y.ef.semResiduo && !y.ef.semResiduoDe[s]) r.residuoY += regra.residuo * base.hpY * acc;
      if (regra.recuo) r.residuoY += regra.recuo * base.dY * acc;
      var corte = regra.corte || (gY && gY.cat === "F" ? regra.corteF : regra.corteE) || 0;
      r.multY *= 1 - corte * acc;
      if (regra.recebeMais) r.multX *= 1 + regra.recebeMais * acc;
      if (s === "paralisar") r.velY = 1 - 0.5 * acc; // série: velocidade pela metade
      if (p.provoca) { var stp = gY && gY.cat === "E" ? "spa" : "atk"; r.multY *= multDoEstagio(p.provoca[stp] || 0); }
      if (s === "paixao" && !(y.ef.imuneStatus.paixao)) r.multY = 1 - 0.25 * acc; // gênero: metade das vezes
      return r;
    }
    if (p.tipo === "cura") {
      // Sustenta quando cura mais do que o rival tira por turno (alternando cura e ataque).
      if (y.ef.bloqueiaCura) return null;
      var cura = p.cura * base.hpX;
      // Cura pelo clima (Morning Sun, Synthesis, Moonlight): 2/3 no sol, 1/4 nos outros
      // climas - a Eerie Fog também (FAQ: "halves weather-based recovery").
      if (p.peloClima) {
        var climaDaCura = climaNoCampoDuelo(x, y);
        if (climaDaCura === "sol") cura = base.hpX * 2 / 3;
        else if (climaDaCura) cura = base.hpX / 4;
      }
      // Alternando cura e ataque: leva 2 golpes por cura (Rest: cura tudo, mas dorme 2 turnos - 4 golpes por cura).
      r.sustenta = p.dorme ? base.dY * 4 < base.hpX * (1 + 3 * (x.ef.sonoCura || 0)) : base.dY * 2 < cura; // Sweet Dreams cura dormindo
      if (!r.sustenta) return null;
      return r;
    }
    if (p.tipo === "tela") {
      if (!gY) return null;
      if (p.cat === "todos" || p.cat === gY.cat) r.multY = x.ef.infiltra ? 1 : (y.ef.infiltra ? 1 : 0.5);
      if (r.multY === 1) return null;
      return r;
    }
    if (p.tipo === "clima") {
      // Refaz os dois no clima novo (habilidade de clima, golpe Fire/Water, velocidade) e compara.
      if (!x.golpeIds || !y.golpeIds) return null;
      var noClima = function (u) {
        var ef = efeitoDasHabilidadesNoDuelo(u.ids, u.sp.sname, p.clima);
        var u2 = Object.assign({}, u, { ef: ef, tipos: tiposNaBatalha(u.sp, ef) });
        u2.golpesProntos = prepararGolpesDuelo(u.golpeIds, u2, p.clima);
        return u2;
      };
      // Unidade refeita no clima: guardada na própria unidade (o rank reusa em todo duelo).
      var noClimaGuardado = function (u) { u.porClima = u.porClima || {}; return u.porClima[p.clima] || (u.porClima[p.clima] = noClima(u)); };
      var x2 = noClimaGuardado(x), y2 = noClimaGuardado(y);
      var dx1 = base.danoX1, dx2 = danoNoDuelo(x2, y2, nivel).melhor.dano;
      var dy1 = base.danoY1, dy2 = danoNoDuelo(y2, x2, nivel).melhor.dano;
      r.multX = dx1 > 0 ? dx2 / dx1 : 1; r.multY = dy1 > 0 ? dy2 / dy1 : 1;
      r.velX = x2.ef.speMult / x.ef.speMult; r.velY = y2.ef.speMult / y.ef.speMult;
      return r;
    }
    if (p.tipo === "vento") { r.velX = 2; return r; }
    if (p.tipo === "sala") { r.inverteOrdem = true; return r; }
    if (p.tipo === "taunt") { if (y.ef.imuneTaunt) return null; r.cancelaPlano = true; return r; }
    if (p.tipo === "haze") { r.zeraSetup = true; return r; }
    if (p.tipo === "disable") {
      if (!gY || !(base.danoY1 > 0)) return null;
      r.multY = base.danoY2 / base.danoY1;
      return r;
    }
    if (p.tipo === "substituto") {
      // Substitute: 1/4 do HP vira um escudo que absorve um golpe e barra status.
      if (base.dY >= base.hpX / 4) return null;
      r.custo = 0.25; r.perdeY = 1; return r;
    }
    if (p.tipo === "divide") {
      if (base.hpY <= base.hpX) return null;
      r.atraso = 1; r.curaX = (base.hpY - base.hpX) / 2; r.residuoY = 0; r.danoUmaVezY = (base.hpY - base.hpX) / 2;
      return r;
    }
    return null; // proteção e hazard: valem na luta inteira, não no 1x1
  }
  // O melhor plano de "x" (ou atacar direto, se nenhum rende mais).
  function melhorPlanoDuelo(x, y, base, nivel, corrida) {
    var ids = x.statusIds || [];
    // Assault Vest/Tactical Vest: sem golpe de status.
    if (!ids.length || x.item === "Assault Vest" || x.item === "Tactical Vest") return null;
    var semPlano = corrida(null);
    var melhor = null;
    ids.forEach(function (id) {
      var ef = efeitoDoPlanoDuelo(x, y, id, base, nivel);
      if (!ef) return;
      // Prankster: o golpe de status sai antes, mas ainda custa o turno.
      var r = corrida(ef);
      if (r.nota > (melhor ? melhor.r.nota : semPlano.nota) + 1e-9 || (melhor === null && r.nota === semPlano.nota && r.fracEu > semPlano.fracEu + 0.05)) melhor = { ef: ef, r: r };
    });
    return melhor ? melhor.ef : null;
  }
  // ---------- dupla (2026-09-29, decisão do usuário: duelo em dupla completo) ----------
  // 25 chefões são em dupla no dado (`db`). Golpe de área (dado: BOTH/FOES_AND_ALLY)
  // acerta os dois rivais a 0,75x (série); Earthquake/Surf acertam também o aliado.
  function lerDuplaDaFraseDuelo(f, ef, climaOk) {
    var x;
    if ((x = f.match(/Grants a ([\d.]+)x boost to ally's attacks/i))) ef.aliadoDano.todos = parseFloat(x[1]);
    if ((x = f.match(/Grants a ([\d.]+)x power boost to ally's Special attacks/i))) ef.aliadoDano.E = parseFloat(x[1]);
    if ((x = f.match(/Ally's attacks get a ([\d.]+)x boost\. ([\d.]+)x if attack causes recoil/i)) || (x = f.match(/Ally's attacks get a ([\d.]+)x boost/i))) {
      ef.aliadoDano.todos = parseFloat(x[1]); if (x[2]) ef.aliadoDano.recuo = parseFloat(x[2]);
    }
    if ((x = f.match(/Reduces damage that ally takes by (\d+)%/i))) ef.aliadoReducao = 1 - parseInt(x[1], 10) / 100;
    if (/Deals double damage if an ally Pok\S+ has Minus or Plus/i.test(f)) ef.plusMinus = true;
    if (/Protects itself and ally from priority moves/i.test(f)) ef.bloqueiaPrioLado = true;
    if (/Protects team from friendly fire/i.test(f)) ef.telepatia = true;
    if ((x = f.match(/Heals partner for (\d+)% of its max HP on switch-in/i))) ef.hospitalidade = parseInt(x[1], 10) / 100;
    if ((x = f.match(/Gives ([\d.]+)x accuracy boost to its own and its allies' moves/i))) { ef.precisaoMult *= parseFloat(x[1]); ef.aliadoPrecisao = parseFloat(x[1]); }
    if ((x = f.match(/Increases the party's SpAtk and SpDef by ([\d.]+)x in (Sun|Rain)/i)) && climaOk(x[2])) { ef.spaMult *= parseFloat(x[1]); ef.spdMult *= parseFloat(x[1]); ef.aliadoEspecial = parseFloat(x[1]); }
    if ((x = f.match(/Increases the party's highest stat by (\d+)%/i))) { ef.maiorMult = Math.max(ef.maiorMult, 1 + parseInt(x[1], 10) / 100); ef.aliadoMaior = 1 + parseInt(x[1], 10) / 100; }
    if ((x = f.match(/Allies with a BST below (\d+) get their stats boosted by (\d+)%/i))) ef.reiDosRatos = { bst: parseInt(x[1], 10), mult: 1 + parseInt(x[2], 10) / 100 };
    if (/Protects the party from sound-based moves/i.test(f)) { ef.imuneFlag["Sound Based"] = true; ef.aliadoImuneSom = true; }
    if (/Protects team from infatuation/i.test(f)) { ef.imuneStatus.paixao = true; ef.aliadoImuneStatus.paixao = true; }
    if (/Protects Grass-type allies from status and stat drops/i.test(f)) ef.protegeGrass = true;
    if (/This Pok\S+ and its ally are immune to sleep/i.test(f)) ef.aliadoImuneStatus.sono = true;
    if ((x = f.match(/Each fainted ally increases Attack and SpAtk by (\d+)%/i))) ef.porAliadoCaido = parseInt(x[1], 10) / 100;
    if ((x = f.match(/If a party Pok\S+ fainted last turn, next move gets ([\d.]+)x boost/i))) ef.vinganca = parseFloat(x[1]);
    if ((x = f.match(/boosts power by ([\d.]+)x until hit/i))) ef.primeiroTurnoMult = Math.max(ef.primeiroTurnoMult, parseFloat(x[1])); // Illusion
    if (/Moves hit an extra time for each healthy party member/i.test(f)) ef.lacaios = true;
    if (/Hops inside an allied Dondozo/i.test(f)) ef.comandante = true;
    if (/Copies its ally's stat changes on switch-in/i.test(f)) ef.copiaAliado = true;
    if (/Copies (dance|sound|lunar) moves used by others/i.test(f)) ef.copiaGolpe = (f.match(/Copies (dance|sound|lunar)/i)[1]).toLowerCase();
  }
  // Golpe que acerta mais de um: 0,75x em cada (série); "todos" pega o aliado também.
  var FATOR_AREA_DUELO = 0.75;
  function participanteDupla(u) { return participanteDuelo(u); }
  // Dano por turno de "a" em "b" (com o que a luta inteira já levou), e o golpe usado.
  function danoParDupla(a, b, nivel) {
    var ua = comoEstaDuelo(a), ub = comoEstaDuelo(b);
    var antes = CAMPO_DUELO;
    CAMPO_DUELO = campoDoDuelo(ua, ub);
    try {
      var p = resultadoNoCampoDuelo(ua, ub, nivel, { fracEu: a.frac, fracFoe: b.frac, soPar: true });
      return { dano: p.st.meu / ub.stats[0], golpe: p.meu.melhor.golpe, vel: p.v1, prio: p.meu.melhor.prio > 0 };
    } finally { CAMPO_DUELO = antes; }
  }
  // Modificadores de dupla sobre o dano de "a" em "b": parceiro de "a" (Power Spot,
  // Battery, Plus/Minus, Rat King), parceiro de "b" (Friend Guard, bloqueio de prioridade).
  function fatorDupla(a, parceiroA, b, parceiroB, golpe, prio) {
    var f = 1, ea = parceiroA && parceiroA.vivo ? parceiroA.u.ef : null, eb = parceiroB && parceiroB.vivo ? parceiroB.u.ef : null;
    if (ea) {
      f *= ea.aliadoDano.todos || 1;
      if (golpe && golpe.cat === "E") f *= ea.aliadoDano.E || 1;
      if (golpe && golpe.recuo > 0 && ea.aliadoDano.recuo) f *= ea.aliadoDano.recuo / (ea.aliadoDano.todos || 1);
      if (a.u.ef.plusMinus && ea.plusMinus) f *= 2;
      if (ea.reiDosRatos && (a.u.sp.b || []).reduce(function (s, v) { return s + v; }, 0) < ea.reiDosRatos.bst) f *= ea.reiDosRatos.mult;
      if (golpe && golpe.cat === "E" && ea.aliadoEspecial) f *= ea.aliadoEspecial;
      if (ea.aliadoMaior && golpe && Math.max.apply(null, a.u.stats.slice(1)) === a.u.stats[golpe.cat === "F" ? 1 : 3]) f *= ea.aliadoMaior; // Polarity
      if (ea.comandante && /Dondozo/.test(a.u.sp.n || "")) f *= 2; // Commander: Dondozo com +2
      if (ea.aliadoPrecisao && golpe && golpe.precisao < 1) f *= Math.min(1 / golpe.precisao, ea.aliadoPrecisao);
    }
    if (eb) {
      f *= eb.aliadoReducao || 1;
      if (eb.comandante && /Dondozo/.test(b.u.sp.n || "")) f *= 0.5; // Commander: Dondozo com +2 nas defesas
      if (prio && (eb.bloqueiaPrioLado || b.u.ef.bloqueiaPrioLado)) f *= 0.5; // metade dos golpes era a prioridade
      if (golpe && golpe.som && eb.aliadoImuneSom) f = 0;
    } else if (prio && b.u.ef.bloqueiaPrioLado) f *= 0.5;
    return f;
  }
  // Luta em dupla: 2 contra 2, turno a turno. Cada um mira o rival onde rende mais
  // (fração do HP que tira; golpe de área soma os dois e desconta o aliado), na
  // ordem da velocidade. Quem cai é trocado: o chefão manda o próximo; eu, o
  // melhor dos que sobram contra os dois de frente.
  function simularDuplaContraChefao(meus, foes, nivel) {
    var time = meus.map(participanteDupla), deles = foes.map(participanteDupla);
    var ladoMeu = novoLadoDuelo(), ladoDele = novoLadoDuelo();
    var log = [], voltas = 0;
    function vivos(l) { return l.filter(function (c) { return c.vivo; }); }
    var frenteDeles = deles.slice(0, 2), frenteMinha = [];
    frenteDeles.forEach(function (f) { entrarNoLadoDuelo(f, ladoDele); });
    function escolherMeu(excluir) {
      var livres = time.filter(function (c) { return c.vivo && frenteMinha.indexOf(c) === -1 && c !== excluir; });
      if (!livres.length) return null;
      var alvos = vivos(frenteDeles);
      return livres.map(function (c) {
        var v = alvos.reduce(function (s, f) { return s + Math.min(1, danoParDupla(c, f, nivel).dano / Math.max(0.01, f.frac)) - Math.min(1, danoParDupla(f, c, nivel).dano / Math.max(0.01, c.frac)); }, 0);
        return { c: c, v: v };
      }).sort(function (a, b) { return b.v - a.v; })[0].c;
    }
    function entraMeu(c) {
      if (!c) return;
      entrarNoLadoDuelo(c, ladoMeu);
      c.u.ef.hazards.forEach(function (h) { if (h.quando === "entrada") poeHazardDuelo(ladoDele, h.tipo); });
      var parceiro = frenteMinha.filter(function (x) { return x !== c && x.vivo; })[0];
      if (parceiro && c.u.ef.hospitalidade) parceiro.frac = Math.min(1, parceiro.frac + c.u.ef.hospitalidade);
      if (parceiro && c.u.ef.copiaAliado) Object.keys(parceiro.bonus.estagios).forEach(function (k) { c.bonus.estagios[k] = (c.bonus.estagios[k] || 0) + parceiro.bonus.estagios[k]; }); // Costar
      if (c.u.ef.vinganca && time.some(function (x) { return !x.vivo; })) c.bonus.primeiroGolpe = c.u.ef.vinganca; // Avenger
      // Curious Medicine: zera as quedas de atributo do parceiro.
      if (parceiro && c.u.ef.curaAliadoEstagios) Object.keys(parceiro.bonus.estagios).forEach(function (k) { if (parceiro.bonus.estagios[k] < 0) parceiro.bonus.estagios[k] = 0; });
      if (c.frac <= 0) { c.vivo = false; c.frac = 0; }
    }
    for (var k = 0; k < 2; k++) { var c0 = escolherMeu(); if (c0) { frenteMinha.push(c0); entraMeu(c0); } }
    // Proteção que um dá ao outro na frente (Aroma Veil, Sweet Veil, Flower Veil).
    function protecaoDoLado(frente) {
      frente.forEach(function (c) {
        var p = frente.filter(function (x) { return x !== c && x.vivo; })[0];
        c.bonus.imuneStatus = null;
        if (!p) return;
        var im = Object.assign({}, p.u.ef.aliadoImuneStatus);
        if (p.u.ef.protegeGrass && (c.u.tipos || []).indexOf("Grass") !== -1) { todosOsStatusDuelo(im); im.quedas = true; }
        if (Object.keys(im).length) c.bonus.imuneStatus = im;
      });
    }
    while (vivos(frenteDeles).length && vivos(frenteMinha).length && voltas++ < 80) {
      protecaoDoLado(frenteMinha); protecaoDoLado(frenteDeles);
      time.forEach(function (c) { c.vivosNoTime = vivos(time).length - 1; });
      // Quem age neste turno, e em quem.
      var acoes = [];
      [[frenteMinha, frenteDeles], [frenteDeles, frenteMinha]].forEach(function (lados) {
        var meusLado = vivos(lados[0]), outros = vivos(lados[1]);
        meusLado.forEach(function (a) {
          // Commander: dentro do Dondozo aliado, não age (o Dondozo ganha +2 em tudo).
          if (a.u.ef.comandante && meusLado.some(function (p) { return p !== a && /Dondozo/.test(p.u.sp.n || ""); })) return;
          var parceiro = meusLado.filter(function (p) { return p !== a; })[0];
          var melhor = null;
          outros.forEach(function (b) {
            var par = danoParDupla(a, b, nivel), outro = outros.filter(function (o) { return o !== b; })[0];
            var fb = fatorDupla(a, parceiro, b, outro, par.golpe, par.prio);
            var alvos = [{ c: b, dano: par.dano * fb }];
            var area = par.golpe && par.golpe.area && par.golpe.area !== "aleatorio";
            if (area) {
              alvos[0].dano *= FATOR_AREA_DUELO;
              if (outro) alvos.push({ c: outro, dano: danoParDupla(a, outro, nivel).dano * fatorDupla(a, parceiro, outro, b, par.golpe, par.prio) * FATOR_AREA_DUELO });
              if (par.golpe.area === "todos" && parceiro && !parceiro.u.ef.telepatia) {
                var fogoAmigo = danoNoDuelo(comoEstaDuelo(a), comoEstaDuelo(parceiro), nivel).melhor;
                if (fogoAmigo.golpe && fogoAmigo.golpe.nome === par.golpe.nome) alvos.push({ c: parceiro, dano: fogoAmigo.dano / parceiro.u.stats[0] * FATOR_AREA_DUELO, aliado: true });
              }
            }
            var valor = alvos.reduce(function (s, x) { return s + (x.aliado ? -1 : 1) * Math.min(1, x.dano / Math.max(0.01, x.c.frac)); }, 0);
            if (!melhor || valor > melhor.valor) melhor = { valor: valor, alvos: alvos, vel: par.vel, prio: par.prio, golpe: par.golpe };
          });
          if (melhor) acoes.push({ a: a, alvos: melhor.alvos, vel: melhor.vel, prio: melhor.prio, golpe: melhor.golpe });
        });
      });
      // Dancer, Parroting, Lunar Affinity: copiam golpe de dança/som/lua usado por outro em campo.
      var MARCA_COPIA = { dance: "Dance Move", sound: "Sound Based", lunar: "Lunar Move" };
      acoes.slice().forEach(function (ac) {
        var flags = ac.golpe && ac.golpe.flags || [];
        acoes.forEach(function (outra) {
          var cg = outra.a.u.ef.copiaGolpe;
          if (outra === ac || !cg || flags.indexOf(MARCA_COPIA[cg]) === -1 || outra.copiou) return;
          outra.copiou = true;
          acoes.push({ a: outra.a, alvos: outra.alvos, vel: outra.vel - 0.001, prio: false, golpe: outra.golpe });
        });
      });
      acoes.sort(function (x, y) { return (y.prio ? 1 : 0) - (x.prio ? 1 : 0) || y.vel - x.vel; });
      acoes.forEach(function (ac) {
        if (!ac.a.vivo) return;
        ac.alvos.forEach(function (al) {
          if (!al.c.vivo) return;
          al.c.frac -= al.dano;
          if (al.c.frac <= 0) {
            al.c.frac = 0; al.c.vivo = false;
            if (!al.aliado) nocauteNaDupla(ac.a, al.c, nivel);
            log.push({ quem: ac.a.u.sp.n, derruba: al.c.u.nome || al.c.u.sp.n, golpe: ac.golpe ? ac.golpe.nome : "" });
          }
        });
      });
      // Repõe quem caiu.
      frenteDeles = frenteDeles.map(function (f) {
        if (f.vivo) return f;
        // Mesma regra da luta simples (escolherProximoDoChefao) contra os meus em campo.
        var restantes = deles.filter(function (d) { return d.vivo && frenteDeles.indexOf(d) === -1; });
        var meusEmCampo = vivos(frenteMinha);
        var prox = meusEmCampo.length ? escolherProximoDoChefao(restantes, meusEmCampo, nivel) : restantes[0];
        if (prox) entrarNoLadoDuelo(prox, ladoDele);
        return prox || f;
      });
      // Receiver: quem fica herda a habilidade do parceiro que caiu.
      frenteMinha.forEach(function (c) {
        if (c.vivo) return;
        frenteMinha.forEach(function (o) { if (o !== c && o.vivo && o.u.ef.receptor && !o.herdou && c.u.abId !== undefined && c.u.abId !== null) { o.u = comHabilidadesDuelo(o.u, "comExtra", c.u.abId); o.herdou = true; } });
      });
      frenteMinha = frenteMinha.map(function (c) {
        if (c.vivo) return c;
        var prox = escolherMeu();
        if (prox) {
          // Supreme Overlord/Avenger: quem entra depois de um aliado cair.
          if (prox.u.ef.porAliadoCaido) prox.bonus.mult *= 1 + prox.u.ef.porAliadoCaido * time.filter(function (x) { return !x.vivo; }).length;
          entraMeu(prox);
        }
        return prox || c;
      });
    }
    var derrubados = deles.filter(function (f) { return !f.vivo; }).length, fica = vivos(time);
    var venceu = derrubados === deles.length;
    return { dupla: true, venceu: venceu, derrubados: derrubados, total: deles.length, vivos: fica.length,
      hpRestante: fica.reduce(function (s, c) { return s + c.frac; }, 0), log: log,
      pontos: derrubados + (venceu ? 6 + fica.length * 0.5 + fica.reduce(function (s, c) { return s + c.frac; }, 0) * 0.5 : 0) +
        deles.reduce(function (s, f) { return s + (f.vivo ? 1 - f.frac : 0); }, 0) * 0.5 };
  }
  // ---------- nota de dupla do rank (decisão do usuário: duas notas) ----------
  // Simular 2x2 completo pra ~2000 espécies x 25 chefões em dupla não cabe no
  // rank; o botão faz a simulação completa. No rank: o mesmo duelo 1x1 contra
  // os Pokémon dos chefões em dupla, com o golpe de área valendo 1,5x (0,75x em
  // dois alvos; o que pega o aliado vale 1,125x) e o que a habilidade faz pelo
  // parceiro somado à nota.
  function unidadeParaDupla(u) {
    var golpes = u.golpesProntos.map(function (g) {
      if (!g.area || g.area === "aleatorio") return g;
      var m = g.area === "ambos" ? 2 * FATOR_AREA_DUELO : 1.5 * FATOR_AREA_DUELO; // "todos": metade de um alvo perdida no aliado
      return Object.assign({}, g, { forca: g.forca * m, forcaBase: g.forcaBase * m });
    });
    return Object.assign({}, u, { golpesProntos: golpes });
  }
  // Valor pro parceiro, na escala da nota (fração de duelo): Power Spot/Battery/
  // Mosh Pit (dano do parceiro), Friend Guard, Intimidate/Scare no segundo rival,
  // bloqueio de prioridade, Hospitality, Telepathy, Victory Star, Flower Gift, Polarity.
  function suporteEmDupla(ef) {
    var v = 0;
    v += ((ef.aliadoDano.todos || 1) - 1) * 0.5 + ((ef.aliadoDano.E || 1) - 1) * 0.25;
    v += (1 - (ef.aliadoReducao || 1)) * 0.5;
    v += (ef.intimida || 0) * 0.1 + (ef.assusta || 0) * 0.08;
    if (ef.bloqueiaPrioLado) v += 0.05;
    v += (ef.hospitalidade || 0) * 0.3;
    if (ef.telepatia) v += 0.03;
    if (ef.aliadoPrecisao) v += (ef.aliadoPrecisao - 1) * 0.2;
    if (ef.aliadoEspecial) v += (ef.aliadoEspecial - 1) * 0.2;
    if (ef.aliadoMaior) v += (ef.aliadoMaior - 1) * 0.3;
    if (ef.plusMinus) v += 0.05;
    return Math.min(0.5, v);
  }
  // Nocaute na dupla: os mesmos bônus da luta inteira (Moxie, Predator...).
  function nocauteNaDupla(vence, cai, nivel) {
    var ef = vence.u.ef;
    ef.aoNocautear.forEach(function (a) {
      if (a.stat === "crit") vence.bonus.crit += a.n;
      else if (a.stat !== "maior") vence.bonus.estagios[a.stat] = (vence.bonus.estagios[a.stat] || 0) + a.n;
    });
    if (ef.porDesmaio) vence.bonus.mult *= 1 + ef.porDesmaio;
    vence.frac = Math.min(1, vence.frac + ef.curaAoNocautear + ef.devora * cai.u.stats[0] / vence.u.stats[0]);
    var d = cai.u.ef;
    if (d.aoDesmaiarQueda) { vence.bonus.estagios.atk = (vence.bonus.estagios.atk || 0) - d.aoDesmaiarQueda; vence.bonus.estagios.spa = (vence.bonus.estagios.spa || 0) - d.aoDesmaiarQueda; }
    if (d.aoDesmaiarMaldicao) vence.status.maldicao = 1;
    if (d.aoDesmaiarGolpe || d.aoDesmaiarDevolve) vence.frac -= danoNoDuelo(comoEstaDuelo(cai), comoEstaDuelo(vence), nivel).melhor.dano / vence.u.stats[0];
    if (vence.frac <= 0) { vence.frac = 0; vence.vivo = false; }
  }
  // ---------- a luta inteira contra o time do chefão (2026-09-29) ----------
  // Decisão do usuário: simular a luta toda. O chefão manda o time na ordem; eu
  // escolho quem entra (o melhor contra o Pokémon da vez, com o HP que sobrou) e
  // troco quando o de agora perde e outro vence mesmo levando um golpe na troca.
  // O HP passa de uma luta pra outra; nocaute dá bônus (Moxie, Predator...),
  // desmaio tem efeito (Aftermath, Guilt Trip...), hazards ferem quem entra.
  var HAZARD_ESPINHO_DUELO = [0, 1 / 8, 1 / 6, 1 / 4];
  function novoLadoDuelo() { return { rocha: false, espinho: 0, toxico: 0, teia: false }; }
  function poeHazardDuelo(lado, tipo) {
    if (tipo === "rocha") lado.rocha = true;
    else if (tipo === "espinho") lado.espinho = Math.min(3, lado.espinho + 1);
    else if (tipo === "toxico") lado.toxico = Math.min(2, lado.toxico + 1);
    else if (tipo === "teia") lado.teia = true;
    else if (tipo === "espinhoVerde") lado.espinhoVerde = true;
  }
  // Quem entra num lado com hazard: dano (Stealth Rock pela tabela de Rock, Spikes
  // em quem está no chão), veneno (Toxic Spikes; Poison no chão recolhe) e -1 de
  // Velocidade (Sticky Web). Heavy-Duty Boots e Magic Guard protegem do dano.
  function entrarNoLadoDuelo(c, lado) {
    var u = c.u;
    if (u.item === "Heavy-Duty Boots") return;
    var chao = aterradoDuelo(u);
    if (!u.ef.semResiduo) {
      if (lado.rocha) c.frac -= typeMultiplier("Rock", u.tipos) / 8;
      if (lado.espinhoVerde) c.frac -= typeMultiplier("Grass", u.tipos) / 8; // Creeping Thorns: efeito de Stealth Rock no dado, tipo Grass
      if (chao) c.frac -= HAZARD_ESPINHO_DUELO[lado.espinho];
    }
    if (lado.toxico && chao) {
      if (u.tipos.indexOf("Poison") !== -1) lado.toxico = 0;
      else c.status[lado.toxico >= 2 ? "envenenarForte" : "envenenar"] = 1;
    }
    if (lado.teia && chao) c.bonus.estagios.spe = (c.bonus.estagios.spe || 0) - 1;
  }
  // A unidade como está agora na luta: estágios ganhos, status que trouxe, golpe perdido.
  function comoEstaDuelo(c) {
    var b = c.bonus, u = c.u;
    // Item gasto numa luta anterior (Sitrus, gema, Focus Sash...) não volta - Harvest guarda a baga.
    if (c.itemGasto && u.it && u.it.consumivel && !(u.ef.colheita && u.it.baga)) u = Object.assign({}, u, { item: "", it: itemDoDuelo("", null) });
    if (u !== c.u && !Object.keys(b.estagios).length && !b.crit && b.mult === 1 && !b.semGolpe.length && !Object.keys(c.status).length) return u;
    var temBonus = Object.keys(b.estagios).length || b.crit || b.mult !== 1 || b.semGolpe.length || b.imuneStatus || b.primeiroGolpe || c.vivosNoTime !== undefined;
    if (!temBonus && !Object.keys(c.status).length) return u;
    var ef = Object.assign({}, u.ef, { estagioEntrada: Object.assign({}, u.ef.estagioEntrada), critEstagio: u.ef.critEstagio + b.crit,
      atkMult: u.ef.atkMult * b.mult, spaMult: u.ef.spaMult * b.mult, spdMult: u.ef.spdMult * b.mult });
    // Proteção de status que vem do aliado (Aroma Veil, Sweet Veil, Flower Veil em Grass).
    if (b.imuneStatus) { ef.imuneStatus = Object.assign({}, u.ef.imuneStatus, b.imuneStatus); if (b.imuneStatus.quedas) ef.imuneQuedas = { atk: true, def: true, spa: true, spd: true, spe: true }; }
    if (b.primeiroGolpe) ef.primeiroTurnoMult = Math.max(ef.primeiroTurnoMult, b.primeiroGolpe); // Avenger
    if (c.vivosNoTime !== undefined) ef.lacaiosVivos = c.vivosNoTime;
    Object.keys(b.estagios).forEach(function (k) { ef.estagioEntrada[k] = (ef.estagioEntrada[k] || 0) + b.estagios[k]; });
    var golpes = u.golpesProntos.filter(function (g) { return b.semGolpe.indexOf(g.nome) === -1; });
    return Object.assign({}, u, { ef: ef, statusInicial: c.status, golpesProntos: golpes.length ? golpes : u.golpesProntos });
  }
  // O outro prende quem está em campo? Ghost escapa; Arena Trap só pega quem está no chão; Magnet Pull, Steel.
  function prendeDuelo(quemPrende, preso) {
    var p = quemPrende.ef.prende;
    if (!p || (preso.tipos || []).indexOf("Ghost") !== -1) return false;
    if (p === "chao") return aterradoDuelo(preso);
    if (p === "aco") return (preso.tipos || []).indexOf("Steel") !== -1;
    return true;
  }
  // Qual Pokémon do chefão entra depois de um nocaute (regra do usuário, 2026-09-30,
  // pela run - Flannery): primeiro quem tem golpe super efetivo em algum dos meus em
  // campo (qualquer golpe de dano dele, não só o mais forte - revisão do mesmo dia);
  // sem isso, quem mais resiste aos meus (o melhor golpe de cada um meu contra ele).
  // Serve à luta simples e à dupla. `restantes` e `meus`: participantes vivos.
  function escolherProximoDoChefao(restantes, meus, nivel) {
    var escolhido = restantes[0] || null, melhor = null;
    restantes.forEach(function (c) {
      var dele = comoEstaDuelo(c);
      var vantagem = meus.some(function (m) {
        var meu = comoEstaDuelo(m);
        return (dele.golpesProntos || []).some(function (g) { return g.cat !== "S" && efetividadeNoDuelo(dele, g.tipo, meu) >= 2; });
      }) ? 1 : 0;
      var levaDosMeus = meus.reduce(function (s, m) { var ef = danoNoDuelo(comoEstaDuelo(m), dele, nivel).melhor.efTipo; return s + (ef === undefined ? 0 : ef); }, 0);
      var nota = [vantagem, -levaDosMeus];
      if (!melhor || nota[0] > melhor[0] || (nota[0] === melhor[0] && nota[1] > melhor[1])) { melhor = nota; escolhido = c; }
    });
    return escolhido;
  }
  function participanteDuelo(u) { return { u: u, frac: 1, vivo: true, status: {}, bonus: { estagios: {}, crit: 0, mult: 1, semGolpe: [] } }; }
  function simularLutaContraChefao(meus, foes, nivel) {
    var time = meus.map(participanteDuelo), deles = foes.map(participanteDuelo);
    var ladoMeu = novoLadoDuelo(), ladoDele = novoLadoDuelo();
    var log = [], atual = null, i = 0, voltas = 0;
    function luta(c, f) { return resultadoDoDuelo(comoEstaDuelo(c), comoEstaDuelo(f), nivel, { fracEu: c.frac, fracFoe: f.frac, detalhe: true }); }
    function entraMeu(c) {
      if (c.u.ef.curaTimeNaEntrada) time.forEach(function (x) { x.status = {}; }); // Soothing Aroma
      if (c.u.ef.brasas) ladoDele.brasas = true; // Hot Coals: queima o próximo que entrar do lado dele
      if (c.u.ef.limpaHazards) ladoMeu = novoLadoDuelo();
      entrarNoLadoDuelo(c, ladoMeu);
      c.u.ef.hazards.forEach(function (h) { if (h.quando === "entrada") poeHazardDuelo(ladoDele, h.tipo); });
      if (c.frac <= 0) { c.vivo = false; c.frac = 0; }
    }
    function entraDele(f) {
      if (ladoDele.brasas && podeSofrerStatusDuelo(f.u, "queimar")) { f.status.queimar = 1; ladoDele.brasas = false; }
      // Stakeout: quem já está em campo bate 2x no que acabou de entrar (1º golpe).
      if (atual && atual.vivo && atual.u.ef.tocaia) atual.bonus.primeiroGolpe = atual.u.ef.tocaia;
      if (f.u.ef.limpaHazards) ladoDele = novoLadoDuelo();
      entrarNoLadoDuelo(f, ladoDele);
      f.u.ef.hazards.forEach(function (h) { if (h.quando === "entrada") poeHazardDuelo(ladoMeu, h.tipo); });
      if (f.frac <= 0) { f.vivo = false; f.frac = 0; }
    }
    // Quem o chefão manda depois de um nocaute (2026-09-30, observação do usuário na
    // run: depois da Sunflora da Flannery vieram o Torkoal evoluído e o Ceruledge; e
    // jogadores no Discord oficial: a IA é a do Emerald e quase não troca por conta
    // própria). Regra do usuário: primeiro quem tem golpe super efetivo no meu
    // Pokémon em campo; se ninguém tem, quem mais resiste a ele. O 1º a entrar
    // continua o primeiro do time do dado.
    function proximoDoChefao(de) {
      if (!atual || !atual.vivo) return;
      var restantes = deles.slice(de).filter(function (d) { return d.vivo; });
      var escolhido = deles.indexOf(escolherProximoDoChefao(restantes, [atual], nivel));
      if (escolhido > de) { var t = deles[de]; deles[de] = deles[escolhido]; deles[escolhido] = t; }
    }
    // Quem vence ganha o bônus do nocaute; quem cai deixa o efeito do desmaio.
    function nocaute(vence, cai) {
      var ef = vence.u.ef;
      ef.aoNocautear.forEach(function (a) {
        if (a.umaVez && vence.bonus.usouUmaVez) return;
        if (a.stat === "crit") vence.bonus.crit += a.n;
        else {
          var st = a.stat === "maior" ? ["atk", "def", "spa", "spd", "spe"][[1, 2, 3, 4, 5].reduce(function (m, k) { return vence.u.stats[k] > vence.u.stats[m] ? k : m; }, 1) - 1] : a.stat;
          vence.bonus.estagios[st] = (vence.bonus.estagios[st] || 0) + a.n;
        }
      });
      if (ef.aoNocautear.some(function (a) { return a.umaVez; })) vence.bonus.usouUmaVez = true;
      if (ef.porDesmaio) vence.bonus.mult *= 1 + ef.porDesmaio;
      vence.frac = Math.min(1, vence.frac + ef.curaAoNocautear + ef.devora * cai.u.stats[0] / vence.u.stats[0]);
      var d = cai.u.ef;
      var golpeDele = danoNoDuelo(comoEstaDuelo(cai), comoEstaDuelo(vence), nivel).melhor;
      if (d.aoDesmaiarGolpe && golpeDele.golpe && golpeDele.golpe.poder > 0) vence.frac -= golpeDele.dano * d.aoDesmaiarGolpe / golpeDele.golpe.poder / vence.u.stats[0];
      if (d.aoDesmaiarDevolve) vence.frac -= danoNoDuelo(comoEstaDuelo(vence), comoEstaDuelo(cai), nivel).melhor.dano / vence.u.stats[0];
      if (d.aoDesmaiarMaldicao) vence.status.maldicao = 1;
      if (d.aoDesmaiarQueda) { vence.bonus.estagios.atk = (vence.bonus.estagios.atk || 0) - d.aoDesmaiarQueda; vence.bonus.estagios.spa = (vence.bonus.estagios.spa || 0) - d.aoDesmaiarQueda; }
      if (d.aoDesmaiarTiraGolpe) { var g = danoNoDuelo(comoEstaDuelo(vence), comoEstaDuelo(cai), nivel).melhor.golpe; if (g) vence.bonus.semGolpe.push(g.nome); }
      if (vence.frac <= 0) { vence.frac = 0; vence.vivo = false; }
    }
    // Hazard posto ao apanhar (Loose Rocks, Toxic Debris...): no lado de quem bateu.
    function hazardsAoApanhar(quemApanha, quemBate, ladoDoOutro) {
      var g = danoNoDuelo(comoEstaDuelo(quemBate), comoEstaDuelo(quemApanha), nivel).melhor.golpe;
      if (!g) return;
      quemApanha.u.ef.hazards.forEach(function (h) { if (h.quando === "hit" || (h.quando === "contato" && g.contato)) poeHazardDuelo(ladoDoOutro, h.tipo); });
    }
    // Hazard por golpe (Stealth Rock, Spikes...): quem vence mesmo gastando um turno põe no lado do outro.
    function poeHazardComGolpe(quem, contra, lado) {
      (quem.u.statusIds || []).forEach(function (id) {
        var p = planoDoGolpeStatus(id);
        if (!p || p.tipo !== "hazard") return;
        var jaTem = p.hazard === "rocha" ? lado.rocha : p.hazard === "teia" ? lado.teia : p.hazard === "espinho" ? lado.espinho >= 3 : lado.toxico >= 2;
        if (jaTem || deles.indexOf(contra) === -1 && time.indexOf(contra) === -1) return;
        var golpe = danoNoDuelo(comoEstaDuelo(contra), comoEstaDuelo(quem), nivel).melhor.dano / quem.u.stats[0];
        var copia = participanteDuelo(quem.u); copia.frac = quem.frac - golpe; copia.status = quem.status; copia.bonus = quem.bonus;
        var ok = copia.frac > 0 && resultadoDoDuelo(comoEstaDuelo(copia), comoEstaDuelo(contra), nivel, { fracEu: copia.frac, fracFoe: contra.frac, detalhe: true }).venceu === true;
        if (ok) { quem.frac = copia.frac; poeHazardDuelo(lado, p.hazard); }
      });
    }
    if (deles.length) entraDele(deles[0]);
    while (i < deles.length && time.some(function (c) { return c.vivo; }) && voltas++ < 60) {
      var f = deles[i];
      if (!f.vivo) { i++; if (i < deles.length) { proximoDoChefao(i); entraDele(deles[i]); } continue; }
      time.forEach(function (c) { c.vivosNoTime = time.filter(function (x) { return x.vivo; }).length - 1; }); // Minion Control
      if (!atual || !atual.vivo) {
        var caiuAgora = !!atual;
        var vivos = time.filter(function (c) { return c.vivo; });
        atual = vivos.map(function (c) { return { c: c, r: luta(c, f) }; }).sort(function (a, b) { return b.r.nota - a.r.nota || b.r.fracEu - a.r.fracEu; })[0].c;
        if (caiuAgora && atual.u.ef.vinganca) atual.bonus.primeiroGolpe = atual.u.ef.vinganca; // Avenger
        if (caiuAgora && atual.u.ef.porAliadoCaido) atual.bonus.mult *= 1 + atual.u.ef.porAliadoCaido; // Supreme Overlord
        entraMeu(atual);
        if (!atual.vivo) continue;
      }
      poeHazardComGolpe(atual, f, ladoDele);
      poeHazardComGolpe(f, atual, ladoMeu);
      if (!atual.vivo) continue;
      var r = luta(atual, f);
      // Prisão (Shadow Tag, Arena Trap, Magnet Pull...): não dá pra trocar. O Fear
      // também prende 2 turnos (FAQ), mas a troca aqui é decidida no começo do
      // confronto, antes de qualquer golpe - e nenhuma habilidade do jogo causa medo
      // na entrada; a trava fica pra quando houver (revisão de 2026-09-30).
      var preso = prendeDuelo(f.u, atual.u);
      if (r.venceu === false && !preso) {
        // Troca: outro vivo que vence mesmo levando um golpe na entrada.
        var troca = time.filter(function (c) { return c.vivo && c !== atual; }).map(function (c) {
          var levou = danoNoDuelo(comoEstaDuelo(f), comoEstaDuelo(c), nivel).melhor.dano / c.u.stats[0];
          var copia = participanteDuelo(c.u); copia.frac = c.frac - levou; copia.status = c.status; copia.bonus = c.bonus;
          return { c: c, levou: levou, r: copia.frac > 0 ? luta(copia, f) : { venceu: false } };
        }).filter(function (t) { return t.r.venceu === true; }).sort(function (a, b) { return b.r.fracEu - a.r.fracEu; })[0];
        if (troca) {
          atual.frac = Math.min(1, atual.frac + atual.u.ef.regenera); // Regenerator
          if (atual.u.ef.recuperaItem) atual.itemGasto = false; // Retriever: o item volta na troca
          if (atual.u.ef.curaAoSair) atual.status = {}; // Natural Cure
          log.push({ troca: true, sai: atual.u.sp.n, entra: troca.c.u.sp.n, contra: f.u.nome || f.u.sp.n });
          atual = troca.c;
          entraMeu(atual);
          atual.frac -= troca.levou;
          if (atual.frac <= 0) { atual.vivo = false; atual.frac = 0; continue; }
          r = luta(atual, f);
        }
      }
      // Perish Body: a canção derruba os dois depois de 3 turnos.
      var perece = Math.max(atual.u.ef.perecer, f.u.ef.perecer);
      hazardsAoApanhar(atual, f, ladoDele);
      hazardsAoApanhar(f, atual, ladoMeu);
      log.push({ meu: atual.u.sp.n, contra: f.u.nome || f.u.sp.n, venceu: r.venceu, fracEu: r.fracEu, fracFoe: r.fracFoe, turnos: r.turnos });
      atual.bonus.primeiroGolpe = 0; // Stakeout/Avenger: só o 1º golpe depois de entrar
      atual.itemGasto = true; f.itemGasto = true; // consumível usado nesta luta
      if (perece && r.turnos > perece + 1) { atual.vivo = false; atual.frac = 0; f.vivo = false; f.frac = 0; }
      else if (r.venceu === true) { atual.frac = r.fracEu; f.vivo = false; f.frac = 0; nocaute(atual, f); }
      else if (r.venceu === false) { f.frac = r.fracFoe; atual.vivo = false; atual.frac = 0; nocaute(f, atual); }
      // Empate de velocidade: conta como derrota (o lado seguro), o dele fica com o HP que sobrou.
      else { f.frac = r.fracFoe; atual.vivo = false; atual.frac = 0; }
    }
    var derrubados = deles.filter(function (f) { return !f.vivo; }).length;
    var vivosNoFim = time.filter(function (c) { return c.vivo; });
    var venceu = derrubados === deles.length;
    return { venceu: venceu, derrubados: derrubados, total: deles.length, vivos: vivosNoFim.length,
      hpRestante: vivosNoFim.reduce(function (s, c) { return s + c.frac; }, 0), log: log,
      // Pontos: cada nocaute vale 1; vencer vale +6 e o que sobra do time desempata.
      pontos: derrubados + (venceu ? 6 + vivosNoFim.length * 0.5 + vivosNoFim.reduce(function (s, c) { return s + c.frac; }, 0) * 0.5 : 0) +
        deles.reduce(function (s, f) { return s + (f.vivo ? 1 - f.frac : 0); }, 0) * 0.5 };
  }
  // Em passos (gerador, 2026-09-30): cada `yield` é um ponto em que o botão da aba
  // Chefões pode devolver a vez pra tela (antes a conta travava 1-3 s no desktop).
  // Quem quer tudo de uma vez (rank, testes) usa montarTimeContraChefao.
  function* montarTimeNoClimaEmPassos(candidatos, party, nivel, clima, armador, dupla) {
    var simular = dupla ? simularDuplaContraChefao : simularLutaContraChefao;
    var foes = party.map(function (m) { return foeDeDuelo(m, nivel, clima); }).filter(Boolean);
    var avaliados = [];
    for (var ci = 0; ci < candidatos.length; ci++) {
      var c = candidatos[ci];
      // Quem arma com habilidade escolhível entra com ela; se arma por innate, qualquer escolhível serve.
      var forcada = armador && c === armador.cand ? armador.abForcada : undefined;
      var rc = melhorUnidadeContra(c.sp, foes, nivel, clima, golpesDeDueloAte(c.sp, nivel), forcada);
      avaliados.push({ sp: c.sp, owned: c.owned, nota: rc.nota, set: rc.set, ab: rc.ab, porFoe: rc.porFoe, unidade: rc.unidade, cand: c });
      yield 1;
    }
    var escolhidos = [], cobertura = foes.map(function () { return 0; }), usados = [];
    if (armador) {
      var a0 = avaliados.filter(function (a) { return a.cand === armador.cand; })[0];
      escolhidos.push(a0);
      usados.push(a0.owned);
      a0.porFoe.forEach(function (v, i) { cobertura[i] = Math.max(cobertura[i], v); });
    }
    while (escolhidos.length < 6) {
      var melhor = null, melhorGanho = -1;
      avaliados.forEach(function (a) {
        if (usados.indexOf(a.owned) !== -1) return;
        var ganho = a.porFoe.reduce(function (s, v, i) { return s + Math.max(0, v - cobertura[i]); }, 0) + a.nota * 0.05;
        if (ganho > melhorGanho) { melhorGanho = ganho; melhor = a; }
      });
      if (!melhor) break;
      escolhidos.push(melhor);
      usados.push(melhor.owned);
      melhor.porFoe.forEach(function (v, i) { cobertura[i] = Math.max(cobertura[i], v); });
    }
    // Luta inteira: o time escolhido pelos duelos é conferido na sequência e
    // melhorado trocando um membro por um dos 8 melhores de fora, se a luta rende mais.
    var sim = simular(escolhidos.map(function (e) { return e.unidade; }), foes, nivel);
    var reserva = avaliados.filter(function (a) { return usados.indexOf(a.owned) === -1; })
      .sort(function (a, b) { return b.nota - a.nota; }).slice(0, 8);
    for (var idx = 0; idx < escolhidos.length; idx++) {
      if (armador && idx === 0) continue;
      for (var ri = 0; ri < reserva.length; ri++) {
        var rr = reserva[ri];
        if (!rr) continue;
        var teste = escolhidos.slice(); teste[idx] = rr;
        var s2 = simular(teste.map(function (x) { return x.unidade; }), foes, nivel);
        if (s2.pontos > sim.pontos + 1e-9) { reserva[ri] = escolhidos[idx]; escolhidos[idx] = rr; sim = s2; }
        yield 0;
      }
    }
    usados = escolhidos.map(function (e) { return e.owned; });
    cobertura = foes.map(function (f, i) { return escolhidos.reduce(function (mx, e) { return Math.max(mx, e.porFoe[i]); }, 0); });
    // Plano por Pokémon do chefão: quem do time resolve melhor e com que golpe.
    var plano = foes.map(function (f, i) {
      var resp = escolhidos.map(function (e) {
        var d = danoNoDuelo(e.unidade, f, nivel).melhor;
        return { sp: e.sp, nota: e.porFoe[i], golpe: d.golpe ? d.golpe.nome : "", efTipo: d.efTipo || 0 };
      }).sort(function (a, b) { return b.nota - a.nota; });
      return { foe: f, respostas: resp.slice(0, 2), coberto: cobertura[i] >= 0.75 };
    });
    // Valor do time: os pontos da luta inteira (a cobertura só desempata).
    var valor = sim.pontos + cobertura.reduce(function (s, v) { return s + v; }, 0) * 0.01;
    return { escolhidos: escolhidos, plano: plano, clima: clima, foes: foes, valor: valor, avaliados: avaliados, simulacao: sim };
  }
  // opcoes.dupla: a batalha é em dupla (chefão `db` no dado) - a luta é simulada 2 contra 2.
  function montarTimeContraChefao(candidatos, party, nivel, opcoes) {
    var passos = montarTimeContraChefaoEmPassos(candidatos, party, nivel, opcoes), r;
    while (!(r = passos.next()).done) { /* tudo de uma vez */ }
    return r.value;
  }
  // Quantos candidatos o simulador avalia (pro progresso "12 de 44" do botão).
  function totalDePassosContraChefao(candidatos) { return candidatos.length * (1 + armadoresDeClima(candidatos).length); }
  function* montarTimeContraChefaoEmPassos(candidatos, party, nivel, opcoes) {
    var dupla = !!(opcoes && opcoes.dupla);
    var climaChefao = climaDoTimeDoChefao(party);
    var melhor = yield* montarTimeNoClimaEmPassos(candidatos, party, nivel, climaChefao, null, dupla);
    var base = melhor;
    melhor.estrategia = null;
    var armadores = armadoresDeClima(candidatos);
    for (var ai = 0; ai < armadores.length; ai++) {
      var arm = armadores[ai];
      var r = yield* montarTimeNoClimaEmPassos(candidatos, party, nivel, arm.clima, arm, dupla);
      if (r.valor >= melhor.valor + (melhor === base ? GANHO_MINIMO_ESTRATEGIA : 0.001)) {
        // Quem ganha com o clima: nota no clima do time bem acima da nota sem ele.
        var notaBase = {};
        base.avaliados.forEach(function (a) { notaBase[a.owned] = a.nota; });
        r.estrategia = {
          clima: arm.clima, armador: arm.cand.sp.n, habilidade: arm.habilidade,
          aproveitam: r.escolhidos.filter(function (e) { return e.cand !== arm.cand && e.nota - (notaBase[e.owned] || 0) >= 0.5; })
            .map(function (e) { return e.sp.n; })
        };
        melhor = r;
      }
    }
    return melhor;
  }
