  // ===== src/regras/tipos.js =====
  // Tabela de efetividade de tipos, habilidades que alteram dano recebido por tipo e tipagem de espécie.
  // Colado dentro do <script> principal do app por scripts/build.mjs (marcador
  // @regras tipos.js), no mesmo escopo do resto do código - sem module,
  // sem wrapper. Só lógica pura: nada aqui lê a página. Movido do template em
  // 2026-09-24 (motor de confronto, src/regras/confronto.js): o motor precisa
  // da tabela REAL nos testes unitários, não de uma cópia falsa.

  var TYPE_CHART = {
    Normal:   { Rock:0.5, Ghost:0, Steel:0.5 },
    Fighting: { Normal:2, Ice:2, Poison:0.5, Flying:0.5, Psychic:0.5, Bug:0.5, Rock:2, Ghost:0, Dark:2, Steel:2, Fairy:0.5 },
    Fire:     { Fire:0.5, Water:0.5, Grass:2, Ice:2, Bug:2, Rock:0.5, Dragon:0.5, Steel:2 },
    Water:    { Fire:2, Water:0.5, Grass:0.5, Ground:2, Rock:2, Dragon:0.5 },
    Electric: { Water:2, Electric:0.5, Grass:0.5, Ground:0, Flying:2, Dragon:0.5 },
    Grass:    { Fire:0.5, Water:2, Grass:0.5, Poison:0.5, Ground:2, Flying:0.5, Bug:0.5, Rock:2, Dragon:0.5, Steel:0.5 },
    Ice:      { Fire:0.5, Water:0.5, Grass:2, Ice:0.5, Ground:2, Flying:2, Dragon:2, Steel:0.5 },
    Poison:   { Grass:2, Poison:0.5, Ground:0.5, Rock:0.5, Ghost:0.5, Steel:0, Fairy:2 },
    Ground:   { Fire:2, Electric:2, Grass:0.5, Poison:2, Flying:0, Bug:0.5, Rock:2, Steel:2 },
    Flying:   { Electric:0.5, Grass:2, Fighting:2, Bug:2, Rock:0.5, Steel:0.5 },
    Psychic:  { Fighting:2, Poison:2, Psychic:0.5, Dark:0, Steel:0.5 },
    Bug:      { Fire:0.5, Grass:2, Fighting:0.5, Poison:0.5, Flying:0.5, Psychic:2, Ghost:0.5, Dark:2, Steel:0.5, Fairy:0.5 },
    Rock:     { Fire:2, Ice:2, Fighting:0.5, Ground:0.5, Flying:2, Bug:2, Steel:0.5 },
    Ghost:    { Normal:0, Psychic:2, Ghost:2, Dark:0.5 },
    Dragon:   { Dragon:2, Steel:0.5, Fairy:0 },
    Dark:     { Fighting:0.5, Psychic:2, Ghost:2, Dark:0.5, Fairy:0.5 },
    Steel:    { Fire:0.5, Water:0.5, Electric:0.5, Ice:2, Rock:2, Steel:0.5, Fairy:2 },
    Fairy:    { Fire:0.5, Fighting:2, Poison:0.5, Dragon:2, Dark:2, Steel:0.5 }
  };

  // Curated, NOT auto-generated: type-effectiveness modifiers para habilidades
  // verificadas contra o texto real (traduzido) de cada uma - nunca assumidas
  // do comportamento vanilla, já que este hack renomeia e rebalanceia
  // habilidades livremente (ver AUDITORIA-DOSSIE.md 9.4).
  // 2026-09-11 (pedido do usuário: acurácia dos dados heurísticos entre
  // 90-95%): até aqui a tabela só cobria as 6 habilidades vistas no time do
  // usuário - o suficiente pro quadro de fraquezas do time, mas o "leitor de
  // caixa" (bestBoxCandidateForBoss) reusa abilityTypeMod() pra QUALQUER
  // espécie da caixa, não só o time, então uma tabela de 6 entradas deixava
  // a maioria das sugestões silenciosamente erradas (voltando pro type chart
  // cru sempre que a espécie da caixa tivesse uma habilidade defensiva real
  // fora dessas 6). Ampliada via varredura sistemática (não automática) das
  // 1033 descrições traduzidas: toda sentença mencionando um dos 18 tipos de
  // dano real foi extraída (359 sentenças), filtrada por palavras-chave de
  // dano (79 sobraram) e CADA UMA lida à mão contra o texto completo em PT e
  // EN antes de virar entrada aqui - mesma disciplina de "nunca confiar em
  // regex sozinho" já usada em Score-AbilityText (common.ps1).
  // Escopo deliberadamente restrito ao que abilityTypeMod() modela (um
  // multiplicador fixo por tipo de ataque recebido, no próprio portador).
  // Ficou de fora, por não caber nesse modelo (não é erro/esquecimento):
  //   - imunidade a status (veneno/queimadura/paralisia/sono) - não é dano
  //     de golpe;
  //   - dano de campo por turno tipo Toxic Spill/Funeral Pyre/Flame Coat
  //     (afeta quem NÃO é de um tipo, todo turno - não é resposta a um
  //     golpe recebido);
  //   - redução plana contra TODO ataque (Shell Armor -20%, Multiscale
  //     -50% com HP cheio) - não é por tipo, mecanismo diferente do que
  //     seDamper já modela (que é só sobre golpes super efetivos);
  //   - habilidades só ofensivas (aumentam o dano que o PRÓPRIO golpe
  //     causa) - abilityTypeMod() é só sobre o lado defensivo;
  //   - efeitos condicionados a clima/terreno (ex: Foggy Eye só sob
  //     neblina) - mesma razão que o dashboard só olha pro PRÓXIMO chefão:
  //     não dá pra assumir a condição ativa numa sugestão estática;
  //   - mudança de tipo dinâmica no meio da batalha (Color Change, Protean)
  //     - não modelável sem simular o turno.
  // Ids batem com os índices de ABILITIES / dex_compact.json "abilities".
  // Combos (ids que juntam 2+ habilidades, ex Aerialist = Levitate + Flock)
  // ganham sua PRÓPRIA entrada aqui quando um componente relevante existe -
  // abilityTypeMod() não decompõe o texto do combo em tempo real, então sem
  // isso uma espécie com só o id do combo (não o id "puro" do componente)
  // ficaria sem o efeito mesmo tendo a habilidade de verdade.
  var TYPE_MOD_ABILITIES = {
    26:  { immune: ["Ground"] },                          // Levitate
    444: { immune: ["Water"] },                           // Evaporate
    450: { immune: ["Ground"], healPct: 25 },             // Earth Eater
    314: { immune: ["Rock"] },                             // Mountaineer
    116: { seDamper: 0.65 },                               // Solid Rock: -35% em golpes SE
    318: { seDamper: 0.5 },                                // Primal Armor: -50% em golpes SE
    // Fossilized: "Reduz pela metade o dano recebido de golpes Rock" -
    // RESISTE a Rock (0.5x = menos dano), não "dano extra" como um
    // comentário antigo aqui dizia por engano (o valor sempre esteve
    // certo, só o comentário estava invertido).
    303: { resist: { Rock: 0.5 } },                        // Fossilized
    17:  { resist: { Poison: 0.5 } },                      // Immunity
    40:  { resist: { Water: 0.7, Ice: 0.7 } },              // Magma Armor
    47:  { resist: { Fire: 0.5, Ice: 0.5 } },               // Thick Fat
    85:  { resist: { Fire: 0.5 } },                         // Heatproof
    134: { resist: { Ghost: 0.5, Dark: 0.5 } },             // Heavy Metal
    195: { resist: { Water: 0.5 } },                        // Water Compaction
    199: { resist: { Fire: 0.5 } },                         // Water Bubble
    218: { resist: { Fire: 2 } },                           // Fluffy (FRAQUEZA a Fire, não resistência)
    678: { resist: { Fire: 2 } },                           // Fluffiest (código = Fluffy: fogo x2, não x4)
    306: { resist: { Dark: 0.75, Fairy: 0.75 } },           // Nocturnal
    311: { resist: { Water: 2 } },                          // Liquified (fraqueza a Water)
    337: { resist: { Grass: 0.5 } },                        // Raw Wood
    // Seaweed: texto diz "se for do tipo Grass" - verificado nos dados reais
    // que TODOS os 8 portadores atuais (Tangela, Lotad/Lombre/Ludicolo,
    // Lileep/Cradily, Tangrowth, Dhelmise) já são Grass, então a condição é
    // sempre satisfeita na prática; sem gate condicional extra no código.
    342: { resist: { Fire: 0.5 } },                         // Seaweed
    442: { resist: { Fairy: 0.5 } },                        // Fae Hunter
    445: { resist: { Grass: 0.5 } },                        // Lumberjack
    526: { resist: { Dark: 0.5 } },                         // Monster Hunter
    547: { resist: { Ghost: 0.5 } },                        // Purifying Salt
    754: { resist: { Fire: 2 } },                           // Puffy (fraqueza a Fire)
    764: { resist: { Fire: 0.5 } },                         // Deep Freeze
    804: { resist: { Fire: 0.5 } },                         // Firefighter
    889: { resist: { Fire: 0.25, Ice: 0.25 } },             // Thick Blubber
    855: { resist: { Poison: 0.5 } },                       // Hyper Cleanse (abilities.cc:10317-10323: Poison x0,5; o resto do texto é imunidade a status)
    904: { resist: { Water: 0.5, Ground: 0.5 } },           // Strong Foundation
    995: { resist: { Fire: 0.5, Electric: 0.5, Water: 0.5 } },      // Elemental Aegis
    996: { resist: { Dark: 0.5, Ghost: 0.5, Psychic: 0.5 } },       // Aegis Ward
    // Combos que embutem um componente já mapeado acima:
    606: { immune: ["Ground"] },                           // Aerialist (Levitate + Flock)
    688: { immune: ["Ground"] },                           // Imposing Wings (Giant Wings + Levitate)
    664: { resist: { Fire: 0.5 } },                         // Flame Bubble (Water Bubble + Flaming Soul)
    682: { resist: { Fire: 0.5 } },                         // Iron Giant (Heatproof + Juggernaut)
    936: { resist: { Fire: 0.5, Ice: 0.5 } },               // Sumo Guard (Juggernaut + Thick Fat)
    946: { resist: { Fire: 2 } },                           // Massive Pelt (Tangling Hair + Fluffy, fraqueza)
    1010:{ resist: { Fire: 0.5 } },                         // Thermal Entropy (Thermal Exchange + Heatproof)
    1015:{ resist: { Fire: 0.5 } },                         // Droideka (Heatproof + Shell Armor)
    // Imunidades escritas como "absorve"/"redireciona"/"em vez de ser atingido"
    // (2026-09-28, achado ao montar o time contra a Flannery 1: o Azumarill
    // com Sap Sipper aparecia perdendo para o Extreme Speed Grass do Arcanine
    // Redux, e o Alcremie com Well Baked Body apanhando de Fire). A varredura
    // de 2026-09-12 só pegou "Imune a golpes do tipo X". "Cura 25% ao ser
    // atingido por golpe X" segue o precedente do Earth Eater (450) acima.
    // Flash Fire (18) e Dry Skin (87): o texto curto não diz "imune", mas o código do jogo absorve (abilities.cc:696-706 e 1471-1472,
    // `onAbsorb`; a er-config traz "complete immunity to Fire-type moves"). Entram em 15/10/2026 (ticket calibracao-04).
    10:  { immune: ["Electric"], healPct: 25 },            // Volt Absorb
    18:  { immune: ["Fire"] },                           // Flash Fire (o x1,5 depois da absorção está em duelo.js)
    87:  { immune: ["Water"], healPct: 25 },               // Dry Skin (Fire x1,25 e a cura do clima ficam no texto)
    11:  { immune: ["Water"], healPct: 25 },               // Water Absorb
    31:  { immune: ["Electric"] },                         // Lightning Rod ("Redireciona golpes Electric. Absorve-os")
    78:  { immune: ["Electric"] },                         // Motor Drive ("Velocidade em vez de ser atingido")
    114: { immune: ["Water"] },                            // Storm Drain
    154: { immune: ["Dark"] },                             // Justified ("Ataque em vez de ser atingido por Dark")
    157: { immune: ["Grass"] },                            // Sap Sipper
    282: { immune: ["Flying"] },                           // Aerodynamics ("Velocidade em vez de ser atingido por Flying")
    344: { immune: ["Poison"], healPct: 25 },              // Poison Absorb
    379: { immune: ["Ice"] },                              // Ice Dew
    446: { immune: ["Fire"] },                             // Well Baked Body
    665: { immune: ["Water", "Fire"], healPct: 25 },       // Elemental Vortex (Flash Fire + Water Absorb)
    746: { immune: ["Ground"], healPct: 25 },              // Desolate Sun (Desolate Land + Earth Eater)
    749: { immune: ["Water"] },                            // Reservoir (Water Absorb + Storm Drain)
    865: { immune: ["Fire"] },                             // Heat Sink
    868: { immune: ["Electric"] },                         // Lightning Aspect
    869: { immune: ["Fire"] },                             // Fire Aspect
    872: { immune: ["Rock"] },                             // Molten Core (Furnace + absorve Rock)
    // Packed Ice (1057, ticket versao-nova/07; abilities.cc:12781-12790, onAbsorb: golpe Ice vira +2 de Defesa em vez de dano). O +2 não está no motor.
    1057: { immune: ["Ice"] }
  };

  // Which of a species' abilities are safe to treat as ALWAYS active without
  // knowing which build the player picked: innates (always on, by the game's
  // own rule) plus any choosable slot that isn't really a choice - when all 3
  // listed choosable ids are identical there's no alternative to pick, so
  // it's effectively locked (e.g. Coalossal Mega's 3 slots are all Earth
  // Eater). A choosable ability with real alternatives (e.g. Terrakion's
  // Justified/Avenger/Rockhard Will) is deliberately left out here - which one
  // is active depends on the build, and guessing wrong would be worse than
  // showing the unmodified type chart.
  function alwaysActiveAbilities(sp) {
    var ids = sp.inn.slice();
    if (sp.ab.length && sp.ab.every(function (id) { return id === sp.ab[0]; })) ids.push(sp.ab[0]);
    return ids;
  }

  // Applies TYPE_MOD_ABILITIES on top of the flat type chart for one species'
  // real ability kit. Returns the adjusted multiplier plus which ability(ies)
  // caused a change, so the UI can show its work instead of a bare number.
  function abilityTypeMod(atk, sp) {
    return abilityTypeModFor(atk, speciesTypeNames(sp), alwaysActiveAbilities(sp));
  }
  // Perfil defensivo da espécie para a ficha (ticket 13): cada tipo atacante com o multiplicador final, já com
  // as innates (sempre ativas; a habilidade escolhível depende da build e fica de fora). Fraco = > 1,
  // resiste = entre 0 e 1, imune = 0. Ordem: o mais perigoso primeiro / a resistência maior primeiro.
  function perfilDefensivoDaEspecie(sp) {
    var r = { fraco: [], resiste: [], imune: [] };
    USABLE_TYPES.forEach(function (atk) {
      var m = abilityTypeMod(atk, sp);
      var mult = m.real; // efetividade real (sem o amortecedor Solid Rock/Filter...), igual às outras telas; o corte vai em reducoes
      if (mult === 0) r.imune.push({ tipo: atk, mult: 0, reducoes: [] });
      else if (mult > 1) r.fraco.push({ tipo: atk, mult: mult, reducoes: m.reducoes });
      else if (mult < 1) r.resiste.push({ tipo: atk, mult: mult, reducoes: m.reducoes });
    });
    r.fraco.sort(function (a, b) { return b.mult - a.mult; });
    r.resiste.sort(function (a, b) { return a.mult - b.mult; });
    return r;
  }
  // Mesmo cálculo, mas com os ids de habilidade ATIVOS informados por quem
  // chama - o motor de confronto (confronto.js) conhece a habilidade real de
  // um Pokémon de chefão (bosses.json), então não precisa adivinhar como
  // alwaysActiveAbilities() faz pra uma espécie solta.
  function abilityTypeModFor(atk, defTypes, ids) {
    var raw = typeMultiplier(atk, defTypes);

    // Immunity always wins and is checked across ALL active abilities first:
    // otherwise, if a damage-dampening ability (Solid Rock) happens to be
    // listed before an immunity one (Evaporate) in sp.inn's order, the
    // dampener's now-moot reason ("amortece...") would show alongside the
    // real answer ("imune"), which is confusing even though the final
    // number is still correct either way.
    var immuneId = ids.filter(function (id) {
      var mod = TYPE_MOD_ABILITIES[id];
      return mod && mod.immune && mod.immune.indexOf(atk) !== -1;
    })[0];
    if (immuneId !== undefined) {
      var mod = TYPE_MOD_ABILITIES[immuneId];
      var name = (ABILITIES[immuneId] && ABILITIES[immuneId][0]) || "?";
      return { raw: raw, mult: 0, real: 0, reducoes: [], reasons: [name + (mod.healPct ? " (imune, cura " + mod.healPct + "%)" : " (imune)")] };
    }

    var mult = raw;
    // real: a efetividade sem o amortecedor de golpe super efetivo (Solid Rock, Filter...). O duelo usa ela,
    // porque o corte já entra uma única vez pelo texto da habilidade (reducao.superEf); as telas também (mult fica só como o valor já amortecido).
    var real = raw;
    var reasons = [];
    var reducoes = [];
    ids.forEach(function (id) {
      var m = TYPE_MOD_ABILITIES[id];
      if (!m) return;
      var nm = (ABILITIES[id] && ABILITIES[id][0]) || "?";
      if (m.resist && m.resist[atk] !== undefined) {
        mult *= m.resist[atk];
        real *= m.resist[atk];
        // "resist" guarda o multiplicador cru, que pode ser > 1 (ex:
        // Fluffy causa FRAQUEZA a Fire, não resistência) - texto errado
        // aqui seria pior que não mostrar nada, então o rótulo segue o
        // valor real em vez de assumir sempre "resistência".
        reasons.push(nm + (m.resist[atk] < 1 ? " (resistência extra)" : " (fraqueza extra)"));
      } else if (m.seDamper && raw > 1) {
        mult *= m.seDamper;
        // Telas: mostram real (efetividade cheia) e citam o corte da habilidade, igual ao duelo.
        var corte = nm + " reduz " + Math.round((1 - m.seDamper) * 100) + "%";
        reducoes.push(corte);
        reasons.push(corte + " (super efetivo)");
      }
    });
    return { raw: raw, mult: mult, real: real, reasons: reasons, reducoes: reducoes };
  }

  function typeMultiplier(atk, defTypes) {
    var m = 1;
    for (var i = 0; i < defTypes.length; i++) {
      var row = TYPE_CHART[atk];
      var v = row && (defTypes[i] in row) ? row[defTypes[i]] : 1;
      m *= v;
    }
    return m;
  }

  function speciesTypeNames(sp) {
    var names = sp.t.map(function (i) { return TYPES[i]; });
    if (names.length === 2 && names[0] === names[1]) names = [names[0]];
    return names;
  }
