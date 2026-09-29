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
  // Modelo (e simplificações, ditas às claras):
  //  - Nível igual dos dois lados (o nível real do chefão não está no dado).
  //  - Três sets genéricos por espécie, vale o melhor: físico, especial e tanque.
  //  - Golpes de nível (até o nível pedido) + tutor; sem carga/recarga/desmaio.
  //  - Dano pela fórmula padrão, rolagem média, sem crítico. Habilidades lidas
  //    do texto do jogo (compostas herdam as partes): imunidade/resistência de
  //    tipo (abilityTypeModFor), -ate, Adaptability, Huge/Pure Power, bônus a
  //    tipo e a categoria de golpe, golpe extra, redução de dano, Intimidate,
  //    prioridade no 1º turno e clima que o próprio Pokémon arma.
  //  - Clima da luta (quando o chefão arma sol ou chuva): golpe Fire (sol) ou
  //    Water (chuva) x1,5 dos dois lados - texto do Sunny Day/Rain Dance do jogo.
  //  - Focus Sash do chefão: o golpe que nocautearia de uma vez deixa com 1 HP.
  //  - Duelo: golpes necessários de cada lado; quem é mais rápido (ou tem
  //    prioridade) bate primeiro. Vitória = 1; derrota = metade da fração de HP
  //    que tirou antes de cair.

  var ROLAGEM_MEDIA_DUELO = 0.925;
  var SETS_DE_DUELO = [
    { nome: "fisico", evs: [4, 252, 0, 0, 0, 252], nature: "Adamant" },
    { nome: "especial", evs: [4, 0, 0, 252, 0, 252], nature: "Modest" },
    { nome: "tanque", evs: [252, 0, 128, 0, 128, 0], nature: "Hardy" }
  ];
  var ITEM_DANO_DUELO = { "Life Orb": 1.3, "Choice Band": 1.5, "Choice Specs": 1.5, "Expert Belt": 1.1 };
  var CLIMA_DO_TEXTO_DUELO = { rain: "chuva", sun: "sol", sand: "areia", sandstorm: "areia", hail: "granizo", fog: "nevoa" };
  var TIPO_REFORCADO_PELO_CLIMA = { sol: "Fire", chuva: "Water" };

  function nomeHabDuelo(id) { return ABILITIES[id] ? ABILITIES[id][0] : ""; }
  function textoHabDuelo(id) { return descricaoDeHabilidade(nomeHabDuelo(id)); }

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
  function golpesDeDueloAte(sp, nivel) {
    var lm = (sp.lm || []).filter(function (p) { return nivel === null || nivel === undefined || p[0] <= nivel; });
    return uniqueIds(lm.map(function (p) { return p[1]; }).concat(sp.tu || [])).filter(golpeUtilNoDuelo);
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
      defMult: 1, spdMult: 1, chloroplast: false };
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
    cacheEfeitoDuelo[chave] = ef;
    return ef;
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
      if (!/no primeiro turno|turno seguinte/i.test(MOVE_PT[id] || "")) return true;
      return /^Solar (Beam|Blade)$/.test(MOVES[id][0]) && (clima === "sol" || u.ef.chloroplast);
    });
    var lista = ids.map(function (id) {
      var m = MOVES[id];
      var tipo = TYPES[m[1]], hab = 1;
      var conv = u.ef.converte[tipo];
      if (conv) { tipo = conv.para; hab *= conv.mult; }
      var som = temSomDuelo(m);
      if (som) { if (tipo === "Normal" && u.ef.somVira) tipo = u.ef.somVira; hab *= u.ef.somMult; }
      var cat = categoriaNoDuelo(m, u.stats[1], u.stats[3]);
      var stabNatural = u.tipos.indexOf(tipo) !== -1;
      var stabHab = !stabNatural && (u.ef.stabTodos || u.ef.stabExtra.indexOf(tipo) !== -1);
      var base = stabNatural ? 1.5 : 1;
      if (stabNatural) hab *= u.ef.stabMult / 1.5;
      if (stabHab) hab *= u.ef.stabMult;
      hab *= u.ef.bonusTipo[tipo] || 1;
      hab *= u.ef.bonusGolpes[m[0]] || 1;
      hab *= u.ef.golpeExtra;
      var poder = m[3];
      if (u.ef.tecnico && poder <= u.ef.tecnico.limite) hab *= u.ef.tecnico.mult;
      if ((m[7] || 0) > 0) hab *= u.ef.prioMult;
      if (reforcado && tipo === reforcado) base *= 1.5;
      if (u.ef.seguimento && u.ef.seguimento.tipo === tipo) hab *= (poder + u.ef.seguimento.poder) / poder;
      var acertos = acertosDoGolpeDuelo(id);
      if (u.ef.skillLink && acertos === 3 && /2 a 5/i.test(MOVE_PT[id] || "")) acertos = 5;
      base *= poder * acertos * (u.itemMult || 1);
      return { nome: m[0], tipo: tipo, cat: cat, contato: temContatoDuelo(m), prio: m[7] || 0,
        prioCheio: u.ef.prioTipoCheio.indexOf(tipo) !== -1,
        precisao: m[4] > 0 && m[4] <= 100 ? m[4] / 100 : 1, forcaBase: base, forca: base * hab };
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
    var raw = def.tipos.reduce(function (m, t) {
      return m * (troca && troca[t] !== undefined ? troca[t] : typeMultiplier(tipo, [t]));
    }, 1);
    var mult = raw;
    if (!atq.ef.quebraHabilidade) {
      var r = abilityTypeModFor(tipo, def.tipos, def.ids);
      if (r.raw !== 0 && r.mult === 0) return 0; // imune por habilidade
      if (r.raw > 0) mult *= r.mult / r.raw;
      if (def.ef.resistTipo[tipo] !== undefined) mult *= def.ef.resistTipo[tipo];
    }
    def.tipos.forEach(function (t) { if (atq.ef.vsTipo[t]) mult *= atq.ef.vsTipo[t]; });
    return mult;
  }
  function ataqueNoDuelo(atq, g) {
    var fisico = g.cat === "F";
    var A = fisico ? atq.stats[1] : atq.stats[3];
    atq.ef.ataqueExtra.forEach(function (r) {
      if (r.contato !== undefined && r.contato !== g.contato) return;
      var fonte = r.fonte === "spe" ? atq.stats[5] : r.fonte === "def" ? atq.stats[2] : (fisico ? atq.stats[2] : atq.stats[4]);
      A = r.troca ? fonte : A + fonte * r.pct;
    });
    return A;
  }
  function danoNoDuelo(atq, def, nivel) {
    var melhor = { dano: 0, prio: 0, golpe: null }, melhorPrio = { dano: 0 };
    var semBonus = def.ef.bloqueiaBonus && !atq.ef.quebraHabilidade;
    var intim = def.ef.intimida && !atq.ef.imuneIntimida ? 2 / (2 + def.ef.intimida) : 1;
    var assus = def.ef.assusta && !atq.ef.imuneAssusta ? 2 / (2 + def.ef.assusta) : 1;
    var precisaoAtq = atq.ef.semErrar || def.ef.semErrarContraMim;
    atq.golpesProntos.forEach(function (g) {
      var efTipo = efetividadeNoDuelo(atq, g.tipo, def);
      if (efTipo === 0) return;
      if (atq.ef.resistidoX2 && efTipo < 1) efTipo *= 2;
      var fisico = g.cat === "F";
      var A = ataqueNoDuelo(atq, g) * (fisico ? intim : assus);
      if (!semBonus) A *= (fisico ? atq.ef.atkMult * atq.ef.fisicoMult : atq.ef.spaMult * atq.ef.especialMult) * atq.ef.danoMult;
      var dv = def.ef.defesaPelaVelocidade;
      var D = dv && dv.contato === g.contato && !atq.ef.quebraHabilidade ? def.stats[5] * def.ef.speMult
        : (fisico ? def.stats[2] * def.ef.defMult : def.stats[4] * def.ef.spdMult);
      var red = 1;
      if (!atq.ef.quebraHabilidade) {
        red = def.ef.reducao.todos * (fisico ? def.ef.reducao.F : def.ef.reducao.E);
        if (efTipo >= 2) red *= def.ef.reducao.superEf;
        if (g.contato) red *= def.ef.reducao.contato;
      }
      if (efTipo >= 2 && !semBonus) red *= atq.ef.seBonus;
      var precisao = precisaoAtq ? 1 : Math.min(1, g.precisao * (semBonus ? 1 : atq.ef.precisaoMult));
      var forca = semBonus ? g.forcaBase : g.forca;
      var dano = ((((2 * nivel) / 5 + 2) * forca * A / D) / 50 + 2) * efTipo * red * ROLAGEM_MEDIA_DUELO * precisao;
      if (dano > melhor.dano) melhor = { dano: dano, prio: g.prio, golpe: g, efTipo: efTipo };
      if (g.prio > 0 && dano > melhorPrio.dano) melhorPrio = { dano: dano };
    });
    return { melhor: melhor, melhorPrio: melhorPrio };
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
    return golpesParaVencer === 1 && (u.ef.prioridadeNoPrimeiro || !!(g && g.prioCheio));
  }

  // Um duelo, do ponto de vista de "eu" (0..1).
  function resultadoDoDuelo(eu, foe, nivel) {
    var meu = danoNoDuelo(eu, foe, nivel);
    var dele = danoNoDuelo(foe, eu, nivel);
    var euPreciso = golpesNecessariosDuelo(foe.stats[0], meu.melhor.dano);
    var elePrecisa = golpesNecessariosDuelo(eu.stats[0], dele.melhor.dano);
    if (euPreciso === Infinity && elePrecisa === Infinity) return 0.5;
    var comPrio = golpesNecessariosDuelo(foe.stats[0], meu.melhorPrio.dano);
    if (aguentaUmGolpe(foe, eu)) { if (euPreciso === 1) euPreciso = 2; if (comPrio === 1) comPrio = 2; }
    if (aguentaUmGolpe(eu, foe) && elePrecisa === 1) elePrecisa = 2;
    var prioDele = temPrioridadeNoDuelo(foe, dele, elePrecisa);
    var nec = euPreciso, euPrimeiro;
    if (comPrio <= elePrecisa && !prioDele) { nec = Math.min(euPreciso, comPrio); euPrimeiro = true; }
    else if (temPrioridadeNoDuelo(eu, meu, euPreciso) && !prioDele) euPrimeiro = true;
    else if (prioDele && !(meu.melhor.prio > 0)) euPrimeiro = false;
    else {
      var v1 = eu.stats[5] * eu.ef.speMult, v2 = foe.stats[5] * foe.ef.speMult;
      euPrimeiro = v1 > v2 ? true : v1 < v2 ? false : null;
    }
    if (nec < elePrecisa) return 1;
    if (nec === elePrecisa && euPrimeiro) return 1;
    if (nec === elePrecisa && euPrimeiro === null) return 0.5;
    var turnos = euPrimeiro ? elePrecisa : elePrecisa - 1;
    return 0.5 * Math.min(1, (turnos * meu.melhor.dano) / foe.stats[0]);
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
    var foe = { sp: sp, nome: m.n || sp.n, ids: ids, item: m.item || "", itemMult: ITEM_DANO_DUELO[m.item] || 1,
      stats: [0, 1, 2, 3, 4, 5].map(function (i) { return calcFinalStat(sp.b[i], iv[i], ev[i], nivel, i, m.nat, m.item, sp.n); }) };
    foe.ef = efeitoDasHabilidadesNoDuelo(ids, sp.sname, clima);
    foe.tipos = tiposNaBatalha(sp, foe.ef);
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
  function unidadeDeDuelo(sp, set, abId, nivel, golpeIds, clima) {
    var ids = uniqueIds((sp.inn || []).concat(abId === null || abId === undefined ? [] : [abId]));
    var u = { sp: sp, set: set.nome, ab: abId === null || abId === undefined ? "" : nomeHabDuelo(abId), ids: ids,
      stats: [0, 1, 2, 3, 4, 5].map(function (i) { return calcFinalStat(sp.b[i], 31, set.evs[i], nivel, i, set.nature, null, sp.n); }) };
    u.ef = efeitoDasHabilidadesNoDuelo(ids, sp.sname, clima);
    u.tipos = tiposNaBatalha(sp, u.ef);
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
  function montarTimeNoClima(candidatos, party, nivel, clima, armador) {
    var foes = party.map(function (m) { return foeDeDuelo(m, nivel, clima); }).filter(Boolean);
    var avaliados = candidatos.map(function (c) {
      // Quem arma com habilidade escolhível entra com ela; se arma por innate, qualquer escolhível serve.
      var forcada = armador && c === armador.cand ? armador.abForcada : undefined;
      var r = melhorUnidadeContra(c.sp, foes, nivel, clima, golpesDeDueloAte(c.sp, nivel), forcada);
      return { sp: c.sp, owned: c.owned, nota: r.nota, set: r.set, ab: r.ab, porFoe: r.porFoe, unidade: r.unidade, cand: c };
    });
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
    // Plano por Pokémon do chefão: quem do time resolve melhor e com que golpe.
    var plano = foes.map(function (f, i) {
      var resp = escolhidos.map(function (e) {
        var d = danoNoDuelo(e.unidade, f, nivel).melhor;
        return { sp: e.sp, nota: e.porFoe[i], golpe: d.golpe ? d.golpe.nome : "", efTipo: d.efTipo || 0 };
      }).sort(function (a, b) { return b.nota - a.nota; });
      return { foe: f, respostas: resp.slice(0, 2), coberto: cobertura[i] >= 0.75 };
    });
    var valor = cobertura.reduce(function (s, v) { return s + v; }, 0) +
      escolhidos.reduce(function (s, e) { return s + e.nota; }, 0) * 0.05;
    return { escolhidos: escolhidos, plano: plano, clima: clima, foes: foes, valor: valor, avaliados: avaliados };
  }
  function montarTimeContraChefao(candidatos, party, nivel) {
    var climaChefao = climaDoTimeDoChefao(party);
    var melhor = montarTimeNoClima(candidatos, party, nivel, climaChefao, null);
    var base = melhor;
    melhor.estrategia = null;
    armadoresDeClima(candidatos).forEach(function (arm) {
      var r = montarTimeNoClima(candidatos, party, nivel, arm.clima, arm);
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
    });
    return melhor;
  }
