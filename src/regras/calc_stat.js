  // ===== src/regras/calc_stat.js =====
  // Fórmula de status final (base+IV+EV+nível+nature+item) e o que deriva
  // dela. Colado dentro do <script> principal do app por scripts/build.mjs
  // (marcador @regras calc_stat.js), no mesmo escopo do resto do código -
  // sem module, sem wrapper. Só lógica pura: nada aqui lê a página (item D1
  // da pauta técnica, 2026-09-16), o que permite carregar este arquivo no
  // Node pros testes unitários (tests/unit/).
  // Extraído de dentro do artifact_template.html em 2026-09-18 (estava perto
  // do código da calculadora de status de chefão, mas nunca dependeu de
  // nada de página) - motivo real: validateAiBuild() (validacao_build_ia.js)
  // precisava chamar calcFinalStat() pra cortar EV desperdiçado direto na
  // build gerada por IA, e só dá pra fazer isso rodando no Node também se a
  // fórmula morar aqui, não escondida no meio do arquivo principal.

  // Final-stat calculator for boss Pokemon - 2026-09-09 field research +
  // approved next step. Deliberately NOT a full damage calculator (that idea
  // was aborted the same day: no trainer in the raw data has a level field
  // anywhere, so a real damage calc would need a level from somewhere we
  // can't source with confidence). This sidesteps that exact problem: the
  // user TYPES the level in (they can read it off their own screen), the
  // tool never asserts one. The stat formula itself (base+IV+EV -> final
  // stat, nature +/-10%) is the same since Gen 3 and not something a
  // data-only ROM hack rewrites, so it's safe to hardcode - unlike level,
  // which is genuinely unknowable from this project's data.
  // UPDATE 2026-09-09 (same day, user asked directly): held-item stat
  // modifiers ARE now applied, for the items this data actually confirms
  // the identity of - Choice Band/Specs/Scarf and Assault Vest appear under
  // their exact, unmistakable franchise names (checked: `grep -o
  // '"item":"[^"]*"' data/bosses.json`, 13/12/33/75 occurrences
  // respectively) and their effect is textbook, unchanged-since-introduced
  // vanilla mechanics.
  // UPDATE 2026-09-09, later same day (user asked for a field-research pass
  // on every exclusive item, not just documenting the gap): found the
  // hack's actual source of truth - github.com/Elite-Redux/er-config (the
  // "er-config" git submodule of the public NextDex repo) ships
  // items/*.textproto with real name+description text per item, AND
  // github.com/Elite-Redux/pokemon-showdown-ER (this hack's own Showdown
  // fork) has the exact numeric battle-engine implementation in
  // data/items.ts. That resolved every item this project had previously
  // left as "can't verify":
  // - Tactical Vest: textproto says "Raises Def but prevents the use of
  //   status moves" with hold_effect_strength: 50 - the SAME shape as
  //   Assault Vest's own entry (also strength: 50), just aimed at Def
  //   instead of SpD. Not a reskin guess anymore, confirmed from the
  //   engine's own item table.
  // - Thick Club/Light Ball: textproto confirms they're still species-
  //   locked (Cubone/Marowak; Pikachu/Raichu), so the species that holds
  //   them in THIS data had to be checked, not assumed - Thick Club sits on
  //   "Marowak Alolan" (matches vanilla's own species lock, safe) but Light
  //   Ball sits on "Raichu Alolan" (vanilla Light Ball does NOT affect
  //   Raichu at all). Showdown's data/items.ts spells out the exact,
  //   hack-specific numbers: Pikachu gets x2 Atk/SpA (vanilla), Raichu gets
  //   a REDUCED x1.5 Atk/SpA (this hack's own balance choice, not
  //   something vanilla knowledge could have supplied). Hand-verified:
  //   Marowak Alolan (base Atk 80, Adamant, 252 Atk EV, Thick Club, "Phoebe
  //   4" boss) at level 50 -> 290 Atk; Raichu Alolan (base SpA 95, Modest,
  //   252 SpA EV, Light Ball, "Wattson 1" insane tier) at level 50 -> 241
  //   SpA. Both match this formula exactly.
  // Researched but NOT added here, because it doesn't fit a per-stat
  // multiplier at all (documented for the record, not silently dropped):
  // - Swirly Glasses (textproto: "Swaps the split of attacking moves") -
  //   a move-category swap, not a stat change.
  // UPDATE 2026-09-09, same day: Mega Stones and Primal orbs ARE now
  // handled, just not through this table - they don't modify a stat on the
  // SAME species, they turn the holder into a DIFFERENT species entirely
  // (own base stats/types), already modeled as its own dex entry (e.g.
  // "Miloticite" -> the separately-stated "Milotic Mega"). See MEGA_FORMS
  // and its use in renderBossDetail() - a structurally different mechanism
  // (species swap) from ITEM_STAT_MODS (same-species multiplier), covering
  // 234 of ~267 stone-shaped items (built from this hack's own Pokemon
  // Showdown fork's megaStone/megaEvolves fields, cross-validated against
  // an independent species-name matcher - 100% agreement on their ~65-item
  // overlap). The ~33 leftover items are genuinely ambiguous in the source
  // data (e.g. "Lucarionite" between "Lucario Mega X"/"Mega Z" with no
  // signal to pick one) - left unresolved rather than guessed, degrades
  // safely to showing the base (held) species' own stats.
  // Still no in-battle ability/stage modifiers (stat stages, weather, an
  // ability's damage-time effect) - this is "what does the stat screen
  // say", not an attempt to simulate a turn.
  // TK-08 (28/10/2026, decisão 4 do usuário: "iguais ao jogo"). FONTE ÚNICA dos itens que mexem num atributo da espécie
  // (calcFinalStat e o duelo leem só esta tabela). Fonte: er-repo f34fc2b, battle_util.c:7286-7321 (CalcAttackStat) e 7441-7450
  // (CalcDefenseStat), battle_main.c:4232 (velocidade). A calculadora do jogo é aplicada ao atributo de ataque/defesa, então
  // multiplicar o atributo final dá o mesmo dano. Light Ball e Thick Club olham a espécie-BASE (GET_BASE_SPECIES_ID =
  // gFormSpeciesIdTables[x][0], gerado de form_of na er-config SpeciesList.textproto): TODA forma de Pikachu, Raichu e Marowak
  // conta como a base. Por isso as linhas x1,6 do jogo (Partner, Belle, Cosplay, Libre, Pop Star, Rock Star, PhD, Partner Mega) são
  // código morto: a base dessas formas é Pikachu, que casa antes e dá x2,0. Raichu Alolan e Mega X/Y têm form_of Raichu: x1,5.
  // Campos da regra: statIdx (0 HP, 1 Atk, 2 Def, 3 SpA, 4 SpD, 5 Spe), mult, base (família de formas), exata (só a espécie
  // exata, sem formas), evolui (só espécie que ainda evolui), exceto, emDano (o duelo aplica no golpe, pois Klutz/Knock Off tiram o item).
  // Premissa de IV/EV (jogo pokemon.c:990-997): o inimigo e o jogador fora do Hell têm IV 31; EV ligado (enableEvs). Hell com
  // HELL_MODE_0_IVS_FLAG zera o IV do jogador (TK-10b, ainda não modelado aqui).
  var FORMAS_DA_BASE = {
    SPECIES_PIKACHU: ["SPECIES_PIKACHU_COSPLAY", "SPECIES_PIKACHU_ROCK_STAR", "SPECIES_PIKACHU_BELLE", "SPECIES_PIKACHU_POP_STAR", "SPECIES_PIKACHU_PH_D",
      "SPECIES_PIKACHU_LIBRE", "SPECIES_PIKACHU_ORIGINAL_CAP", "SPECIES_PIKACHU_HOENN_CAP", "SPECIES_PIKACHU_SINNOH_CAP", "SPECIES_PIKACHU_UNOVA_CAP",
      "SPECIES_PIKACHU_KALOS_CAP", "SPECIES_PIKACHU_ALOLA_CAP", "SPECIES_PIKACHU_PARTNER_CAP", "SPECIES_PIKACHU_WORLD_CAP", "SPECIES_PIKACHU_PARTNER",
      "SPECIES_PIKACHU_PARTNER_MEGA"],
    SPECIES_PICHU: ["SPECIES_PICHU_SPIKY_EARED"],
    SPECIES_RAICHU: ["SPECIES_RAICHU_ALOLAN", "SPECIES_RAICHU_MEGA_Y", "SPECIES_RAICHU_MEGA_X"],
    SPECIES_MAROWAK: ["SPECIES_MAROWAK_ALOLAN"]
  };
  var ITEM_STAT_MODS = {
    "Choice Band": [{ statIdx: 1, mult: 1.5 }],
    "Choice Specs": [{ statIdx: 3, mult: 1.5 }],
    "Choice Scarf": [{ statIdx: 5, mult: 1.5 }],
    "Assault Vest": [{ statIdx: 4, mult: 1.5 }],
    "Tactical Vest": [{ statIdx: 2, mult: 1.5 }],
    "Thick Club": [{ statIdx: 1, mult: 2, base: ["SPECIES_CUBONE", "SPECIES_MAROWAK"] }],
    "Light Ball": [
      { statIdx: 1, mult: 2, base: ["SPECIES_PIKACHU", "SPECIES_PICHU"] },
      { statIdx: 3, mult: 2, base: ["SPECIES_PIKACHU", "SPECIES_PICHU"] },
      { statIdx: 1, mult: 1.5, base: ["SPECIES_RAICHU"] },
      { statIdx: 3, mult: 1.5, base: ["SPECIES_RAICHU"] }
    ],
    "Deep Sea Tooth": [{ statIdx: 3, mult: 2, exata: ["SPECIES_CLAMPERL"] }],
    "Deep Sea Scale": [{ statIdx: 4, mult: 2, exata: ["SPECIES_CLAMPERL"] }],
    // Ditto com Transform/Imposter troca os atributos pelos do alvo no duelo (o x2 some junto, como no jogo: sem STATUS2_TRANSFORMED).
    "Metal Powder": [{ statIdx: 2, mult: 2, exata: ["SPECIES_DITTO"] }],
    "Quick Powder": [{ statIdx: 5, mult: 2, exata: ["SPECIES_DITTO"] }],
    "Eviolite": [{ statIdx: 2, mult: 1.5, evolui: true, exceto: ["SPECIES_NECROZMA"], emDano: true },
      { statIdx: 4, mult: 1.5, evolui: true, exceto: ["SPECIES_NECROZMA"], emDano: true }]
  };
  // Move-power multipliers, distinto de ITEM_STAT_MODS acima (aquele muda um
  // STAT, este muda o PODER de um golpe direto) - adicionado 2026-09-09 pro
  // preview de status de "Meu build" (ver myBuildStatusHtml). Só 1 entrada de
  // propósito: o 1.3x de Life Orb em todo golpe de dano é mecânica vanilla
  // textbook, universal desde sempre (mesma cautela já aplicada aos itens
  // Choice em ITEM_STAT_MODS acima), e confirmado em uso real no próprio dado
  // de chefão deste hack, sob o nome vanilla exato (76 ocorrências em
  // bosses.json). Modificadores por habilidade (Tough Claws, Technician...)
  // deliberadamente NÃO tentados aqui - precisaria de um dado curado por
  // habilidade que este projeto não tem, o mesmo motivo de TYPE_MOD_ABILITIES
  // cobrir só um punhado de habilidades em vez das ~1033.
  var ITEM_MOVE_POWER_MODS = { "Life Orb": 1.3 };
  // Espécie do dex pelo nome (calcFinalStat recebe o nome); índice montado na primeira chamada.
  var ESPECIE_POR_NOME = null;
  function especiePorNomeDoItem(nome) {
    if (!ESPECIE_POR_NOME) { ESPECIE_POR_NOME = Object.create(null); SPECIES.forEach(function (s) { if (!ESPECIE_POR_NOME[s.n]) ESPECIE_POR_NOME[s.n] = s; }); }
    return ESPECIE_POR_NOME[nome] || null;
  }
  function regraCasaComEspecie(r, sp) {
    if (!r.base && !r.exata && !r.evolui) return true;
    if (!sp) return false;
    var sn = sp.sname;
    if (r.exceto && r.exceto.indexOf(sn) !== -1) return false;
    if (r.evolui) return (sp.ev || []).some(function (ev) { return !isMegaEvoKind(ev[0]); });
    if (r.exata) return r.exata.indexOf(sn) !== -1;
    return r.base.some(function (b) { return b === sn || (FORMAS_DA_BASE[b] || []).indexOf(sn) !== -1; });
  }
  // Regra do item para o atributo statIdx de uma espécie (objeto do dex ou nome). incluirEmDano: o duelo pede também as regras emDano.
  function itemRuleFor(itemName, statIdx, especie, incluirEmDano) {
    var rules = ITEM_STAT_MODS[itemName];
    if (!rules) return null;
    var sp = (typeof especie === "string") ? especiePorNomeDoItem(especie) : especie;
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      if (r.statIdx !== statIdx || (r.emDano && !incluirEmDano)) continue;
      if (regraCasaComEspecie(r, sp)) return r;
    }
    return null;
  }
  function calcFinalStat(base, iv, ev, level, statIdx, natureName, itemName, speciesName) {
    iv = (typeof iv === "number") ? iv : 31;
    ev = (typeof ev === "number") ? ev : 0;
    level = level || 1;
    if (statIdx === 0) {
      // Shedinja e Shedinja Mega: maxHP fixo em 1 (pokemon.c:1000-1001), sem fórmula.
      if (speciesName === "Shedinja" || speciesName === "Shedinja Mega") return 1;
      return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level / 100) + level + 10);
    }
    var raw = Math.floor((2 * base + iv + Math.floor(ev / 4)) * level / 100) + 5;
    var mods = NATURE_MODS[natureName];
    var mult = 1;
    if (mods) {
      if (mods[0] === statIdx) mult = 1.1;
      else if (mods[1] === statIdx) mult = 0.9;
    }
    var withNature = Math.floor(raw * mult);
    // Held-item multiplier applies to the nature-adjusted stat, same order
    // the actual games compute it in (base formula -> nature -> item).
    // Some items (Light Ball) only apply to one of several species that can
    // hold them, at different multipliers each - itemRuleFor() checks both.
    var rule = itemRuleFor(itemName, statIdx, speciesName);
    if (rule) {
      return Math.floor(withNature * rule.mult);
    }
    return withNature;
  }

  // Breakpoints de EV (referência do Smogon: "A Beginner's Guide to
  // Understanding EVs" - "at level 50, EVs are worked with in multiples of
  // 8" em vez de 4 - quanto MENOR o nível, mais grosseiro o salto, e o Elite
  // Redux trava tudo por level cap, geralmente bem abaixo de 50). Extraído
  // pra cá em 2026-09-18: era só um laço dentro de evBreakpointNote() (usado
  // pra AVISAR o jogador em "Meu build"), agora também usado por
  // validateAiBuild() pra CORTAR o desperdício direto na build que a IA
  // propõe - a mesma matemática, dois consumidores.

  // Menor EV (múltiplo de 4, 0..evAtual) que já dá o MESMO stat final que
  // evAtual, nas mesmas condições (nature/item/nível/espécie) - o "EV
  // mínimo" que evBreakpointNote/hpEvEfficiencyNote-style features avisam.
  function minEvSameStat(base, iv, evAtual, level, statIdx, natureName, itemName, speciesName) {
    if (!evAtual) return 0;
    var alvo = calcFinalStat(base, iv, evAtual, level, statIdx, natureName, itemName, speciesName);
    for (var e = 0; e < evAtual; e += 4) {
      if (calcFinalStat(base, iv, e, level, statIdx, natureName, itemName, speciesName) === alvo) return e;
    }
    return evAtual;
  }
  // Menor EV (múltiplo de 4, > evAtual, <=252) que MUDA o stat final -
  // null se não existir nenhum (evAtual já no teto útil, 252 não muda mais).
  function nextEvBreakpoint(base, iv, evAtual, level, statIdx, natureName, itemName, speciesName) {
    var alvo = calcFinalStat(base, iv, evAtual, level, statIdx, natureName, itemName, speciesName);
    for (var e = evAtual + 4; e <= 252; e += 4) {
      if (calcFinalStat(base, iv, e, level, statIdx, natureName, itemName, speciesName) !== alvo) return e;
    }
    return null;
  }
  // Corrige os EVs de uma build (pensado pra build por IA, mas puro/genérico):
  // primeiro tira o que não muda stat nenhum (minEvSameStat em cada stat
  // investido), depois reinveste o total liberado no(s) stat(s) que a build
  // JÁ mais investiu, empurrando cada um até seu próximo breakpoint real, na
  // ordem, até acabar o saldo liberado ou não sobrar mais nenhum breakpoint
  // útil dentro do orçamento. "Reforçar o que já é forte, não inventar pra
  // onde mandar sobra" é a própria recomendação geral do artigo do Smogon
  // ("EVs are used to buff up stats that are already good rather than patch
  // up stats that are poor"), não uma regra nova inventada aqui. Nunca
  // estoura 252 por stat nem o total original (só redistribui o que já era
  // orçamento da própria build) - sempre assume IV 31 (mesma convenção de
  // toda build por IA neste app).
  // Extraída em função própria (achado em auditoria, 2026-09-18): antes era
  // uma expressão anônima dentro de trimAndReallocateEvs - impossível de
  // testar sozinha, então um teste de unidade que só olhasse o RESULTADO
  // final não pegava com confiança uma ordem de prioridade invertida (a
  // sobra às vezes acaba no mesmo lugar por coincidência de custo de
  // breakpoint). Maior EV original primeiro (empate: menor índice primeiro).
  function priorityOrderForEvs(evs) {
    return [0, 1, 2, 3, 4, 5].sort(function (a, b) { return evs[b] - evs[a] || a - b; });
  }
  function trimAndReallocateEvs(sp, evs, level, natureName, itemName) {
    var ajustado = evs.map(function (v, i) {
      return minEvSameStat(sp.b[i], 31, v, level, i, natureName, itemName, sp.n);
    });
    var liberado = evs.reduce(function (acc, v, i) { return acc + (v - ajustado[i]); }, 0);
    if (liberado <= 0) return ajustado;
    var ordem = priorityOrderForEvs(evs);
    for (var k = 0; k < ordem.length && liberado > 0; k++) {
      var i = ordem[k];
      while (liberado > 0) {
        var proximo = nextEvBreakpoint(sp.b[i], 31, ajustado[i], level, i, natureName, itemName, sp.n);
        if (proximo === null) break;
        var custo = proximo - ajustado[i];
        if (custo > liberado) break;
        ajustado[i] = proximo;
        liberado -= custo;
      }
    }
    return ajustado;
  }
