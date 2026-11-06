  // ===== src/ui/dex_ficha.js =====
  // Dex: ficha do Pokémon (stats, habilidades, golpes, rank, evolução) e o agendamento do resumo do topo.
  // Interface: lê e desenha a página. Colado no <script> principal por
  // scripts/build.mjs (marcador @ui dex_ficha.js) no MESMO lugar de onde saiu do
  // template (fase 5 da refatoração, 2026-09-24) - a ordem de execução não mudou.

  // ---------------- detail rendering ----------------
  // synergyHits (2026-09-11, pedido do usuário: sinergia habilidade x
  // movepool visível na Dex, não só como ferramenta de IA - Fase 3 já
  // calculava isso, só não mostrava) - lista de ABILITY_SYNERGY[sp.sname]
  // (pode ser undefined/vazia). Mostra a nota SÓ quando existe combo real
  // confirmado (id bate E a espécie tem golpe de verdade da categoria/tipo
  // certo) - nunca uma associação genérica "esta habilidade é boa".
  function abilityCard(id, kindLabel, kindClass, synergyHits) {
    var a = ABILITIES[id];
    if (!a) return "";
    var desc = ABILITY_PT[String(id)] || a[1];
    var synergyHtml = "";
    var hits = synergyHits || [];
    for (var i = 0; i < hits.length; i++) {
      if (hits[i].id !== id) continue;
      var golpes = hits[i].golpes || [];
      var golpesText = golpes.length <= 3 ? golpes.join(", ") : golpes.slice(0, 3).join(", ") + " e mais " + (golpes.length - 3);
      synergyHtml = '<div class="abi-synergy" title="Combo real confirmado: esta espécie tem golpe verdadeiro da categoria ' + escapeHtml(hits[i].categoria) + '">' +
        '&#9889; Combo real: potencializa ' + escapeHtml(golpesText) + '</div>';
      break;
    }
    return '<div class="abi-card"><span class="abi-kind ' + kindClass + '">' + kindLabel + '</span>' +
      '<div class="abi-name">' + escapeHtml(a[0]) + '</div>' +
      '<div class="abi-desc">' + escapeHtml(desc) + '</div>' + synergyHtml + '</div>';
  }

  // Selo de sinergia ATIVA de uma build concreta - 2026-09-16, ideia do
  // Playtester de Build. Diferente de abilityCard() acima (que mostra o
  // potencial da ESPÉCIE, habilidade por habilidade), este olha a build que
  // está na tela: cruza os 4 golpes escolhidos com a habilidade escolhida +
  // as innates, e só fala quando a combinação de fato acontece.
  // Decisão de UX (mesma passagem): quando não há sinergia, não mostra NADA -
  // nunca um aviso de ausência. Das 189 builds curadas, 99 pertencem a
  // espécies sem nenhuma sinergia possível, então um aviso ali leria como
  // defeito onde não existe defeito. Silêncio é neutro; o selo é só ganho.
  function buildSynergyHtml(sp, build) {
    if (!sp || !build || !build.moves) return "";
    var hits = sinergiasDaEspecie(sp);
    if (!hits || !hits.length) return "";
    for (var i = 0; i < hits.length; i++) {
      var h = hits[i];
      // innate está sempre ativa; habilidade escolhível só conta se for
      // justamente a que esta build escolheu (mesmo critério da regra dura
      // aplicada às builds de IA em validateAiBuild).
      if (h.kind !== "inn" && h.name !== build.ability) continue;
      var casados = (h.golpes || []).filter(function (g) { return build.moves.indexOf(g) !== -1; });
      if (!casados.length) continue;
      var texto = casados.length <= 2 ? casados.join(" e ") : casados.slice(0, 2).join(", ") + " e mais " + (casados.length - 2);
      var via = h.kind === "inn" ? "innate " + h.name : h.name;
      return '<div class="abi-synergy" title="Combo real confirmado nesta build: ' + escapeHtml(h.categoria) + '">' +
        '&#9889; ' + escapeHtml(via) + ' potencializa ' + escapeHtml(texto) + '</div>';
    }
    return "";
  }

  // Nota da ESPÉCIE (não de uma build específica) sobre combo autossuficiente
  // habilidade-condicional x golpe - pedido do usuário, 2026-09-23: "com tudo
  // que aprendemos, temos oportunidade de colocar algo de novo no que já
  // temos hoje". Mesmo padrão visual de buildNoteHtml, mas mora no card
  // "Habilidades & Innates" (é conhecimento sobre a espécie, não sobre um set
  // escolhido) - diferente de buildSynergyHtml acima, que só acende quando os
  // 4 golpes da build ATUAL batem. Aqui é sempre visível quando existe, pra
  // avisar o jogador do potencial ANTES dele montar a build.
  function conditionMoveSynergyNoteHtml(sp) {
    if (!sp) return "";
    var hits = CONDITION_MOVE_SYNERGY[sp.sname];
    if (!hits || !hits.length) return "";
    return hits.map(function (h) {
      var via = h.kind === "inn" ? "innate " + h.habilidade : h.habilidade;
      if (h.tipo === "clima") {
        return buildNoteHtml('Combo autossuficiente: ' + escapeHtml(via) + ' + ' + escapeHtml(h.golpes[0]) +
          ' — ' + escapeHtml(sp.n) + ' aprende um golpe que invoca ' + escapeHtml(h.clima) +
          ' sozinha, então essa habilidade entra em ação sem precisar de outro membro do time preparando o clima antes.');
      }
      var texto = h.golpes.length <= 2 ? h.golpes.map(escapeHtml).join(" e ") :
        h.golpes.slice(0, 2).map(escapeHtml).join(", ") + " e mais " + (h.golpes.length - 2);
      return buildNoteHtml('Combo autossuficiente: ' + escapeHtml(via) + ' + ' + texto +
        ' — o próprio recuo do golpe já baixa o HP da ' + escapeHtml(sp.n) + ' o bastante pra ativar essa habilidade, sem precisar de dano vindo de fora.');
    }).join("");
  }

  function evoConditionText(ev) {
    var kind = EVOKINDS[ev[0]] || "";
    var rs = ev[1];
    if (EVO_MEGA_KINDS.indexOf(kind) !== -1) return "Mega Evolução &middot; " + prettify(rs);
    if (kind === EVO_PRIMAL) return "Reversão Primal &middot; " + prettify(rs);
    // Bug real, achado e corrigido em 2026-09-10 construindo a auto-evolução
    // por level cap: o nível de evolução vem como STRING no dado bruto (ex:
    // "16", não 16 - confirmado direto em data/dex_compact.json), então
    // "typeof rs === 'number'" nunca era verdadeiro - essa condição sempre
    // caía no fallback prettify(rs) abaixo, mostrando só o número solto
    // ("16") em vez de "Nível 16" na linha evolutiva da Dex. Mesmo problema
    // de tipo já corrigido em evolveChainByX() com Number(rs).
    var numRs = Number(rs);
    if (rs !== "" && rs !== null && rs !== undefined && !isNaN(numRs)) {
      // Comparação exata: "EVO_LEVEL_FEMALE" contém "MALE", e o indexOf antigo
      // marcava evolução só de fêmea com ♂ (Snorunt -> Froslass, Combee ->
      // Vespiquen e mais 13).
      var suffix = kind === EVO_LEVEL_MALE ? " (♂)" : kind === EVO_LEVEL_FEMALE ? " (♀)" : "";
      return "Nível " + numRs + suffix;
    }
    return prettify(rs);
  }

  function renderMovesTable(pairs, title, emptyMsg) {
    if (!pairs.length) return '<div class="card"><h3>' + title + '</h3><p style="color:var(--text-dim);font-size:var(--fs-texto);">' + emptyMsg + '</p></div>';
    var cap = title.indexOf("Nível") !== -1 ? getCurrentCap() : null;
    var rows = pairs.map(function (row, idx) {
      var lv = row[0], moveId = row[1];
      var mv = MOVES[moveId];
      if (!mv) return "";
      var typeName = TYPES[mv[1]];
      var meta = TYPE_META[typeName] || { hex: "#777777" };
      var id = "mv_" + title.replace(/\s/g, "") + "_" + idx;
      var aboveCap = cap !== null && cap !== undefined && lv > cap;
      // Whole-row type tint, not just the pill - field research, 2026-09-09
      // (the official NextDex for this same game does this and it's
      // genuinely faster to scan a long movepool by). Low alpha (9%) so it
      // stays a background hint, not competing with the text - a much
      // bigger shift than that isn't needed to be visible, and this project
      // learned the hard way (rank badges, same day) not to touch a colored
      // background without checking what it does to text contrast: at 9%
      // the row barely moves off --surface, so --text's already-huge margin
      // there (12:1+, verified in that same pass) has no realistic way to
      // drop under the 4.5:1 AA minimum.
      var main = '<tr class="move-row' + (aboveCap ? " above-cap" : "") + '" data-target="' + id + '" style="background:color-mix(in srgb, ' + meta.hex + ' 9%, transparent);">' +
        '<td class="mono">' + (lv !== undefined && lv !== null && title.indexOf("Nível") !== -1 ? lv + (aboveCap ? ' <span class="cap-tag" title="Acima do level cap atual (' + cap + ')">acima</span>' : "") : "&mdash;") + '</td>' +
        '<td><button type="button" class="move-toggle" aria-expanded="false" aria-controls="' + id + '">' + escapeHtml(mv[0]) + '</button></td>' +
        '<td><span class="move-type-tag" style="background:' + meta.hex + ';color:' + tintaDoTipo(meta.hex) + '">' + typeName + '</span></td>' +
        '<td class="mono">' + (mv[3] || "&mdash;") + '</td>' +
        '<td class="mono">' + (mv[4] ? mv[4] + "%" : "&mdash;") + '</td>' +
        '<td class="mono">' + (mv[5] || "&mdash;") + '</td></tr>';
      var mvDesc = MOVE_PT[String(moveId)] || mv[6] || "Sem descrição.";
      var detail = '<tr class="move-detail-row hidden" id="' + id + '"><td colspan="6">' + escapeHtml(mvDesc) + '</td></tr>';
      return main + detail;
    }).join("");
    var showLv = title.indexOf("Nível") !== -1;
    return '<div class="card"><h3>' + title + '</h3><div class="scroll-x"><table class="moves-table"><thead><tr>' +
      '<th>' + (showLv ? "Nv." : "&nbsp;") + '</th><th>Golpe</th><th>Tipo</th><th>Pwr</th><th>Acc</th><th>PP</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }

  // Jump to a species' Dex detail from anywhere it's shown as a name/sprite
  // in the app - evolution chain, team slot, box chip, saved-team sprite,
  // boss party member. One function so "click a Pokemon" behaves the same
  // everywhere, wired via the single delegated ".goto-species" listener
  // right below it.
  var RANK_TIER_CLASS = { SS: "tier-SS", S: "tier-S", A: "tier-A", B: "tier-B", C: "tier-C", D: "tier-D" };
  // Shown next to a species' name everywhere it appears (Dex list/detail,
  // team slot, box chip) - the tooltip spells out the three inputs AND the
  // limitation (no moveset/synergy judgment) every time, not just once in a
  // help page nobody reads.
  // Fórmula reescrita na vigésima-quarta passagem (2026-09-12, reunião da
  // equipe depois do usuário reportar "algo no rank não faz sentido"): o
  // sinal PRINCIPAL agora é uma simulação real de defesa contra os 107
  // chefões do jogo (data/bosses.json), não mais um punhado de atributos
  // estáticos - ver o comentário completo no topo de
  // scripts/compute_species_rank.ps1. "Uso em chefão" (frequência) e
  // "velocidade" saíram do rank (a primeira virou redundante com a
  // simulação de defesa real; a segunda vai virar contextual ao arquétipo
  // do time numa fase futura do roadmap, ainda não implementada).
  var ROTULO_DO_RANK_DA_DIFICULDADE = { party: "Fácil/Ace", insane: "Elite" };
  function rankBadgeHtml(sname) {
    var r = rankDe(sname);
    if (!r && FORA_DO_RANK[sname]) {
      return '<span class="rank-badge rank-fora" title="' + escapeHtml("Fora do rank: " + (MOTIVO_FORA_DO_RANK_PT[FORA_DO_RANK[sname]] || FORA_DO_RANK[sname]) + ".") + '">—</span>';
    }
    if (!r) return "";
    // Rank v2 (2026-10-02, scripts/calcular_rank_v2.mjs): nota da dificuldade da run.
    if (r.porDificuldade) {
      var titulo = "Rank " + r.tier + " de SS (melhor) a D (pior) em " + (ROTULO_DO_RANK_DA_DIFICULDADE[r.rankDaDificuldade] || "Fácil/Ace") +
        " — score " + r.score + "/100. Duelo simulado contra os Pokémon dos chefões da run, só nas lutas a partir de quando dá pra pegá-lo" +
        " (etapa " + r.etapa + "), no level cap de cada luta, com um set fixo de 4 golpes; chefão mais difícil pesa mais. " +
        "Potencial " + r.potencial.tier + " (com golpe de status/setup) e viabilidade " + r.viabilidade.tier + " (só os 4 golpes de dano).";
      return '<span class="rank-badge ' + (RANK_TIER_CLASS[r.tier] || "tier-C") + '" title="' + escapeHtml(titulo) + '">' + r.tier + '</span>';
    }
    // Rank por duelo simulado desde 2026-09-28 (rank antigo, nível 50; hoje scripts/calcular_rank_v2.mjs):
    // o método antigo media só a tipagem defensiva e deixava Garchomp em C.
    var title = r.duelo
      ? "Rank " + r.tier + " de SS (melhor) a D (pior) — score " + r.score + "/100. Duelo simulado 1x1 contra cada Pokémon " +
        "real dos chefões do jogo (golpes, habilidade, item e EVs do jogo): venceu " + r.duelo.vitorias + "% dos duelos com o " +
        "melhor set genérico (" + (ROTULO_DO_SET_DE_DUELO[r.duelo.set] || r.duelo.set) + (r.duelo.habilidade ? ", " + r.duelo.habilidade : "") + (r.duelo.item ? ", " + r.duelo.item : "") + "). Conta dano dos dois " +
        "lados, velocidade, prioridade, item, status, crítico, campo e as habilidades (inclusive clima que ele mesmo arma). Não conta o resto do time."
      : "Rank " + r.tier + " de SS (melhor) a D (pior) — score " + r.score + "/100.";
    return '<span class="rank-badge ' + (RANK_TIER_CLASS[r.tier] || "tier-C") + '" title="' + escapeHtml(title) + '">' + r.tier + '</span>';
  }

  // Dex DETAIL only (never the list, never Team/Box - see rankInfoLineHtml
  // below): answers "is this a good example of a Pokemon at ITS stage"
  // (useful when deciding whether an early-game catch is worth grinding),
  // a different question from the plain rank badge's "how strong is this
  // right now". A species with no real evolution line (standalones, and
  // Mega/Primal-only lineages like most box legendaries - see
  // compute_species_rank.ps1) has no stageTier and renders nothing, same
  // safe-degrade as everywhere else.
  var STAGE_LABEL = { 1: "1º estágio", 2: "2º estágio", 3: "3º estágio", 4: "4º estágio" };
  function rankStageBadgeHtml(sname) {
    var r = rankDe(sname);
    if (!r || r.stageTier === null || r.stageTier === undefined) return "";
    var label = STAGE_LABEL[r.stage] || (r.stage + "º estágio");
    var title = "Rank " + r.stageTier + " entre outros Pokémon de " + label + " (score " + r.stageScore + "/100) — " +
      "mesma fórmula do rank normal, mas comparado só com quem está no mesmo estágio evolutivo, não com o jogo todo.";
    return '<span class="rank-badge-stage ' + (RANK_TIER_CLASS[r.stageTier] || "tier-C") + '" title="' + escapeHtml(title) + '">' + r.stageTier + '</span>';
  }

  // Rank por tipo: desde o rank v2 (02/10) sai SEMPRE na ficha, um selo por tipo da espécie
  // (rankInfoLineHtml abaixo) - não só na run Monotype.

  function roleTagsHtml(sname) {
    var role = SPECIES_ROLE[sname];
    if (!role) return "";
    var parts = (role.roles || []).map(function (r) { return ROLE_LABEL_PT[r] || r; });
    if (role.split) parts.push(SPLIT_LABEL_PT[role.split] || role.split);
    if (!parts.length) return "";
    var title = "Calculado a partir de ataque (percentil " + role.offensePct + "), bulk (percentil " + role.bulkPct +
      ") e velocidade (percentil " + role.spePct + "), mais o movepool real de golpe de pivô/recuperação/setup. " +
      "Não avalia sinergia com o resto do time.";
    return '<span class="rank-info-item"><span class="rank-info-label">Papel</span>' +
      '<span title="' + escapeHtml(title) + '">' + escapeHtml(parts.join(" · ")) + '</span></span>';
  }

  // "Como conseguir" (RF novo, Fase 2 - 2026-09-11): frase curta, não um
  // card novo (decisão da equipe: UX apontou que isso é uma linha, não uma
  // seção). Dedup por MAPA único (Sandslash tem 3 entradas no mesmo mapa
  // com "how" diferente - pro jogador, o que importa é ONDE, não as 3
  // variações mecânicas do mesmo encontro). O verbo usado ("Presente"/
  // "Encontro especial"/"Encontro selvagem especial") reflete o "how" mais
  // definitivo entre todas as entradas da espécie, não por mapa individual.
  var SENC_HOW_PRIORITY = { 3: 3, 2: 3, 1: 2, 0: 1 }; // given/given custom moves empatam no topo
  function howToObtainText(sp) {
    var senc = sp.senc;
    if (!senc || !senc.length) return "";
    var seenMap = {};
    var mapNames = [];
    var bestPriority = 0;
    senc.forEach(function (e) {
      var how = e[0], mapIdx = e[1];
      var pri = SENC_HOW_PRIORITY[how] || 0;
      if (pri > bestPriority) bestPriority = pri;
      var mapName = MAPS[mapIdx];
      if (mapName && !seenMap[mapName]) { seenMap[mapName] = true; mapNames.push(mapName); }
    });
    if (!mapNames.length) return "";
    var verb = bestPriority >= 3 ? "Presente" : bestPriority === 2 ? "Encontro especial" : "Encontro selvagem especial";
    var locText = mapNames.length <= 3 ? mapNames.join(" ou ") : mapNames.slice(0, 3).join(", ") + " e outros locais";
    return verb + ": " + locText + ".";
  }

  // "Onde encontrar" (2026-09-11, feature nova pedida pelo usuário) - dado
  // real de captura selvagem comum (data.locations.maps, 176 mapas, 3114
  // combinações espécie/mapa/método reais), achado na varredura completa do
  // jogo mas nunca extraído até agora - complementa howToObtainText() acima
  // (que só cobre SEnc: iniciais/lendários/presentes de NPC). As duas coisas
  // são fatos DIFERENTES e podem coexistir pra uma mesma espécie (ex: uma
  // espécie comum que também é dada de presente em algum ponto do jogo), por
  // isso são duas linhas independentes, não uma substitui a outra. Mesma
  // decisão de simplicidade de howToObtainText(): dedup só por MAPA (não
  // por método - terra/água/pesca/etc - nem por faixa de nível), porque o
  // que importa pro jogador é ONDE ir, não o mecanismo exato.
  function whereToFindText(sp) {
    var wenc = sp.wenc;
    if (!wenc || !wenc.length) return "";
    var seenMap = {};
    var mapNames = [];
    wenc.forEach(function (mapIdx) {
      var mapName = MAPS[mapIdx];
      if (mapName && !seenMap[mapName]) { seenMap[mapName] = true; mapNames.push(mapName); }
    });
    if (!mapNames.length) return "";
    var locText = mapNames.length <= 3
      ? mapNames.join(", ")
      : mapNames.slice(0, 3).join(", ") + " e mais " + (mapNames.length - 3) + " " + (mapNames.length - 3 === 1 ? "local" : "locais");
    return "Encontro selvagem em: " + locText + ".";
  }

  // Nome do set do simulador pro jogador (fisicoRapido etc. são nomes internos).
  var ROTULO_DO_SET_DE_DUELO = { fisico: "físico, Adamant", especial: "especial, Modest", tanque: "tanque, Hardy", fisicoRapido: "físico rápido, Jolly", especialRapido: "especial rápido, Timid" };
  function badgeDeTierHtml(classe, tier, titulo) {
    return '<span class="' + classe + ' ' + (RANK_TIER_CLASS[tier] || "tier-C") + '" title="' + escapeHtml(titulo) + '">' + tier + '</span>';
  }
  // Marcas sem nota do rank v2 (ponto 6, 02/10): não mexem no score, só avisam.
  function marcasDoRankHtml(sp, r) {
    var d = rankDaDificuldadeDe(r), out = "";
    precisaDeSetter(sp, d && d.habilidade).forEach(function (m) {
      // Elite: a innate só libera no nível dela (1/17/24) - a marca diz a partir de quando o setter faz falta.
      var nivelElite = state.settings.difficulty === "elite" ? Math.max.apply(null, m.habilidades.map(function (h) { return nivelDaHabilidadeNoElite(sp, h); })) : 1;
      var aviso = nivelElite > 1 ? " (Elite: só vale a partir do nível " + nivelElite + ")" : "";
      var title = "Sem nota: " + m.habilidades.join(", ") + " só funciona com " + m.nome + ", e a habilidade do set do rank (nem as innates) não arma isso" + aviso + ". " +
        (m.golpes.length ? "Ela mesma só arma usando " + m.golpes.join(" ou ") + " (gasta turno e espaço de golpe)." : "Precisa de alguém no time que arme.");
      out += '<span class="rank-info-item"><span class="rank-info-label">Precisa de setter</span>' +
        '<span title="' + escapeHtml(title) + '">' + escapeHtml(m.nome + " (" + m.habilidades.join(", ") + ")" + aviso) + '</span></span>';
    });
    var dom = d && d.dominadoPor;
    if (dom && Object.keys(dom).length) {
      var tipos = Object.keys(dom), com = tipos.filter(function (t) { return dom[t]; }), sem = tipos.filter(function (t) { return !dom[t]; });
      var partes = (com.length ? ["dominado por " + com.map(function (t) { return dom[t] + " " + t; }).join(", ")] : [])
        .concat(sem.length ? ["ninguém domina entre " + sem.join(" e ")] : []);
      out += '<span class="rank-info-item"><span class="rank-info-label">Concorrência</span><span title="' +
        escapeHtml("Sem nota: quantas espécies do mesmo tipo são iguais ou melhores em potencial E viabilidade e já estão disponíveis na mesma etapa ou antes.") +
        '">' + escapeHtml(partes.join(" · ")) + '</span></span>';
    }
    return out;
  }
  function rankInfoLineHtml(sp) {
    var r = rankDe(sp.sname);
    if (!r && FORA_DO_RANK[sp.sname]) {
      return '<div class="rank-info-line"><span class="rank-info-item"><span class="rank-info-label">Fora do rank</span>' + rankBadgeHtml(sp.sname) +
        '</span><span class="rank-info-scale">' + escapeHtml(MOTIVO_FORA_DO_RANK_PT[FORA_DO_RANK[sp.sname]] || "") + '</span></div>';
    }
    if (!r) return "";
    // Lote 2 do redesenho (04/10): o rank geral é o destaque (selo maior); as outras notas vão numa grade de 2 colunas (rótulo | selo).
    var geral = '<span class="rank-info-geral"><span class="rank-info-label">Geral</span>' + rankBadgeHtml(sp.sname) + '</span>';
    var items = "";
    if (r.stageTier !== null && r.stageTier !== undefined) {
      var label = STAGE_LABEL[r.stage] || (r.stage + "º estágio");
      items += '<span class="rank-info-item"><span class="rank-info-label">Estágio (' + label.replace(" estágio","") + ')</span>' + rankStageBadgeHtml(sp.sname) + '</span>';
    }
    // Rank v2: os dois eixos lado a lado e o rank por tipo SEMPRE (decisão do usuário, 02/10).
    if (r.potencial && r.viabilidade) {
      items += '<span class="rank-info-item"><span class="rank-info-label">Potencial</span>' +
        badgeDeTierHtml("rank-badge-stage", r.potencial.tier, "Com golpe de status/setup no 4º espaço (score " + r.potencial.score + "/100).") + '</span>';
      items += '<span class="rank-info-item"><span class="rank-info-label">Viabilidade</span>' +
        badgeDeTierHtml("rank-badge-stage", r.viabilidade.tier, "Só os 4 golpes de dano, sem setup (score " + r.viabilidade.score + "/100).") + '</span>';
    }
    Object.keys(r.monoRanks || {}).forEach(function (t) {
      var mr = r.monoRanks[t];
      items += '<span class="rank-info-item"><span class="rank-info-label">Rank entre ' + escapeHtml(t) + '</span>' +
        badgeDeTierHtml("rank-badge-mono", mr.tier, "Rank " + mr.tier + " comparado só com quem tem o tipo " + t + " (score " + mr.score + "/100).") + '</span>';
    });
    // The letters alone don't say which end is good without a hover -
    // user feedback, 2026-09-09 ("falta indicar qual seria o rank mais
    // valioso"). Spelled out in plain text every time, not just on hover,
    // plus you can now sort the whole Dex list by rank (search controls).
    var legenda = '<span class="rank-info-scale">SS (melhor) &rarr; D (pior)</span>';
    // Dois grupos (usuário, 02/10): as notas em letra numa linha e as marcas sem nota
    // em outra, em texto pequeno - antes as marcas ficavam no meio das letras e com
    // fonte maior que a da própria nota. "Papéis cumpridos" (ponto 6) é o "Papel"
    // (species_role.json): não repete.
    var marcas = marcasDoRankHtml(sp, r) + roleTagsHtml(sp.sname);
    return '<div class="rank-info-line">' +
      '<div class="rank-info-notas"><div class="rank-info-topo"><span class="rank-info-titulo">Notas</span>' + geral + legenda + '</div>' +
        (items ? '<div class="rank-info-grade">' + items + '</div><p class="rank-info-legenda">Geral: força contra os chefões da run. Estágio: nota só entre os Pokémon do mesmo estágio evolutivo.</p>' : "") + '</div>' +
      (marcas ? '<div class="rank-info-grupo rank-info-marcas"><span class="rank-info-titulo" title="' +
        escapeHtml("Avisos que não mexem na nota.") + '">Marcas</span>' + marcas + '</div>' : "") +
      '</div>';
  }

  function goToDexSpecies(x) {
    document.querySelector('.tab-btn[data-tab="dex"]').click();
    selectSpecies(x);
  }
  document.addEventListener("click", function (e) {
    var el = e.target.closest && e.target.closest(".goto-species");
    if (!el) return;
    var x = parseInt(el.dataset.x, 10);
    if (!isNaN(x)) goToDexSpecies(x);
  });
  // Teclado (achado real em auditoria, 2026-09-18): .goto-species sempre foi
  // só clicável - agora leva tabindex="0" role="button" em todo lugar onde
  // aparece (mesma classe, ~15 pontos diferentes), e este listener cobre
  // todos eles de uma vez, do mesmo jeito que o de clique já cobre.
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var el = e.target.closest && e.target.closest(".goto-species");
    if (!el) return;
    e.preventDefault();
    var x = parseInt(el.dataset.x, 10);
    if (!isNaN(x)) goToDexSpecies(x);
  });

  // Ficha: barras dos stats base.
  function fichaStatsHtml(sp) {
  var statLabels = ["HP", "Ataque", "Defesa", "Sp. Atq", "Sp. Def", "Velocidade"];
  var statsHtml = sp.b.map(function (v, i) {
    return '<div class="stat-row"><span class="stat-label">' + statLabels[i] + '</span><span class="stat-val mono">' + v + '</span>' +
      '<div class="stat-bar-track"><div class="stat-bar-fill ' + statTier(v) + '" style="width:' + statPct(v) + '%"></div></div></div>';
  }).join("");
    return statsHtml;
  }

  // Ficha (ticket 13): Fraco/Resiste/Imune, já com as innates (perfilDefensivoDaEspecie em src/regras/tipos.js).
  function fichaEfetividadeHtml(sp) {
    var p = perfilDefensivoDaEspecie(sp);
    var fmt = function (m) { return m === 0.25 ? "¼x" : m === 0.5 ? "½x" : (Math.round(m * 100) / 100) + "x"; };
    var faixa = function (lista, classe, rotulo) {
      if (!lista.length) return "";
      return '<div class="efe-faixa"><b class="efe-rotulo ' + classe + '">' + rotulo + '</b><ul class="efe-lista" aria-label="' + rotulo + '">' +
        lista.map(function (x) { return '<li class="efe-tipo">' + escapeHtml(x.tipo) + ' <span class="mono">' + fmt(x.mult) + '</span>' + (x.reducoes && x.reducoes.length ? ' <small class="efe-reducao">' + escapeHtml(x.reducoes.join(', ')) + '</small>' : '') + '</li>'; }).join("") + '</ul></div>';
    };
    return '<div class="card"><h3>Efetividade de tipos</h3>' + faixa(p.fraco, "efe-fraco", "Fraco a") + faixa(p.resiste, "efe-resiste", "Resiste a") + faixa(p.imune, "efe-imune", "Imune a") +
      '<p class="efe-nota">Conta o tipo e as innates; a habilidade escolhida pode mudar isso.</p></div>';
  }
  // Ficha (ticket 13): anterior/próximo na ordem da lista que está na tela (com busca e filtros aplicados).
  function fichaNavHtml(sp) {
    var i = listaAtual.indexOf(sp);
    if (i === -1) return '<nav class="ficha-nav" aria-label="Espécie anterior e próxima"></nav>';
    var btn = function (alvo, rotulo, seta) {
      return alvo ? '<button class="ficha-nav-btn" type="button" data-x="' + alvo.x + '" aria-label="' + rotulo + ': ' + escapeHtml(alvo.n) + '">' + seta + '</button>' : "";
    };
    return '<nav class="ficha-nav" aria-label="Espécie anterior e próxima">' + btn(listaAtual[i - 1], "Anterior", "&larr; " + escapeHtml((listaAtual[i - 1] || {}).n || "")) +
      btn(listaAtual[i + 1], "Próxima", escapeHtml((listaAtual[i + 1] || {}).n || "") + " &rarr;") + '</nav>';
  }

  // Ficha: linha evolutiva (cada etapa leva à ficha dela).
  function fichaEvolucaoHtml(sp) {
  var evoHtml = "";
  if (sp.ev.length) {
    // Waypoint da trilha (redesign 2026-09-18) - mesma linguagem visual do
    // Progresso: nó atual com anel de destaque, conector tracejado com
    // seta no lugar da flechinha de texto solta.
    var nodes = ['<div class="evo-node evo-node-current goto-species" tabindex="0" role="button" data-x="' + sp.x + '">' + spriteImgHtml(sp.x, sp.n, 26) + escapeHtml(sp.n) + '</div>'];
    sp.ev.forEach(function (ev) {
      var target = getSpeciesByX(ev[2]);
      nodes.push('<span class="evo-arrow"><span class="evo-arrow-line"></span><small>' + evoConditionText(ev) + '</small></span>');
      nodes.push('<div class="evo-node' + (target ? ' goto-species" tabindex="0" role="button" data-x="' + target.x : '') + '">' + (target ? spriteImgHtml(target.x, target.n, 26) : "") + escapeHtml(target ? target.n : "?") + '</div>');
    });
    evoHtml = '<div class="card"><h3>Linha evolutiva</h3><div class="evo-chain">' + nodes.join("") + '</div></div>';
  }
    return evoHtml;
  }

  // Ficha: formas alternativas da espécie.
  function fichaFormasHtml(sp) {
  // Formas alternativas (sp.frm), 2026-09-11 - achado na varredura completa
  // do jogo pedida pelo usuário (dado real, nunca extraído até agora: 41
  // espécies têm isto populado - Deoxys, Rotom, Burmy/Wormadam, Shellos/
  // Gastrodon, Darmanitan, Basculin, Deerling/Sawsbuck, Tornadus/Thundurus/
  // Landorus, Shaymin, Pichu). Cada forma já é sua própria entrada completa
  // na dex (mesmo padrão das variantes Mega/Regional/Redux) - isto é só
  // navegação direta entre elas, reaproveitando a mesma classe .evo-node
  // (peso visual já estabelecido) e o mesmo goToDexSpecies() da linha
  // evolutiva, sem CSS novo.
  var frmHtml = "";
  if (sp.frm && sp.frm.length) {
    var frmNodes = sp.frm.map(function (fx) {
      var f = getSpeciesByX(fx);
      return f ? '<div class="evo-node goto-species" tabindex="0" role="button" data-x="' + f.x + '">' + spriteImgHtml(f.x, f.n, 26) + escapeHtml(f.n) + '</div>' : "";
    }).join("");
    if (frmNodes) frmHtml = '<div class="card"><h3>Formas alternativas</h3><div class="evo-chain">' + frmNodes + '</div></div>';
  }
    return frmHtml;
  }

  // Ficha: como obter espécies exclusivas (presente, loja, evento).
  function fichaComoObterHtml(sp) {
  // "Como obter" - só aparece pras poucas espécies exclusivas curadas em
  // data/how_to_obtain.json (presente de NPC, compra em loja, evento
  // estático - nunca rota de encontro selvagem comum, ver comentário de
  // HOW_TO_OBTAIN acima). Ausência de card aqui não significa "não
  // documentado", só que ainda não foi curado - mesma semântica de builds.json.
  var howToObtainHtml = "";
  var htoEntry = HOW_TO_OBTAIN[sp.sname];
  if (htoEntry) {
    howToObtainHtml = '<div class="card"><h3>Como obter</h3>' +
      '<p style="margin:0 0 6px;"><b>' + escapeHtml(htoEntry.method) + '</b></p>' +
      '<p style="color:var(--text-dim);font-size:var(--fs-texto);margin:0;">' + escapeHtml(htoEntry.note) + '</p>' +
      '</div>';
  }
    return howToObtainHtml;
  }

  // Ficha: cabeçalho (sprite, nome, botões de time/caixa, tipos, onde obter).
  function fichaCabecalhoHtml(sp) {
    var x = sp.x;
    var inTeam = state.team.indexOf(x) !== -1;
    var teamFull = state.team.length >= 6;
    var inBox = state.box.indexOf(x) !== -1;
    var names = speciesTypeNames(sp);
    return '<div class="ficha-topo"><button class="back-btn" id="back-to-list">&larr; Voltar para a lista</button>' + fichaNavHtml(sp) + '</div>' +
      // 96 = o dobro exato da célula de 48 do atlas (redesenho 2026-09-24: o
      // Pokémon é o protagonista da ficha, e com image-rendering: pixelated o
      // dobro exato fica nítido). O identificador interno (SPECIES_...) saiu da
      // tela - era ruído técnico pro jogador.
      '<div class="detail-head"><div class="ts-head">' + spriteImgHtml(sp.x, sp.n, 96) + '<div class="detail-titles">' +
        '<h2>' + escapeHtml(sp.n) + '</h2>' +
        '<div class="detail-dexno mono">#' + String(sp.i || 0).padStart(3, "0") + '</div>' + avisoSemSpriteHtml(sp.x, SPRITE_INDEX) +
      '</div></div><div class="detail-acoes">' +
        // Texto curto + title/aria-label com a frase completa (mesmo padrão
        // já usado no botão equivalente da PC Box) - achado real do usuário,
        // 2026-09-12: "⇄ Trocar com o time" + "+ Adicionar à caixa" juntos
        // eram longos o bastante pra empilhar em vez de ficar lado a lado
        // numa largura de painel comum, virando duas barras enormes acima
        // de qualquer informação real da espécie.
        '<button class="add-team-btn" id="add-team-btn" ' + (inTeam ? "disabled" : "") +
          ' title="' + (inTeam ? "Já está no time" : teamFull ? "Trocar por um do time" : "Adicionar ao time") + '"' +
          ' aria-label="' + (inTeam ? "Já está no time" : teamFull ? "Trocar por um do time" : "Adicionar ao time") + '">' +
          (inTeam ? "No time" : teamFull ? "⇄ Trocar" : "+ Time") + '</button>' +
        // Achado real em revisão de código, 2026-09-12: este botão só
        // desabilitava por `inBox`, nunca por `inTeam` - dava pra clicar
        // "Adicionar à caixa" com o Pokémon JÁ no time, deixando o mesmo x
        // presente nos dois arrays ao mesmo tempo (quebra a regra de sempre
        // "nunca no time E na caixa simultaneamente" que rosterMove() já
        // garante em todo outro ponto de entrada). Desabilita também quando
        // já está no time - "já está no time" é motivo suficiente pra não
        // oferecer "adicionar à caixa" (não faria sentido ter os dois).
        '<button class="add-team-btn" id="add-box-btn" style="background:var(--surface-3);color:var(--text);" ' + ((inBox || inTeam) ? "disabled" : "") +
          ' title="' + (inBox ? "Já está na caixa" : inTeam ? "Já está no time" : "Adicionar à caixa") + '"' +
          ' aria-label="' + (inBox ? "Já está na caixa" : inTeam ? "Já está no time" : "Adicionar à caixa") + '">' +
          // Com o Pokémon no time, fica "+ Caixa" desativado (o motivo vai no
          // title) - antes os dois botões diziam "No time" lado a lado.
          (inBox ? "Na caixa" : "+ Caixa") + '</button>' +
        // Only relevant once the Pokemon IS on the team: on mobile the species
        // list is hidden while a detail is open (.dex-shell.show-detail), so
        // without this the only way to see the team update is back -> scroll
        // -> switch tab by hand. See AUDITORIA-DOSSIE.md UX 4.
        (inTeam ? '<button class="back-btn" id="goto-team-link" type="button" style="margin:0;">Ir para Meu Time &rarr;</button>' : "") +
      '</div></div>' +
      '<div class="detail-types">' + names.map(function (n) { return typePill(n); }).join("") + '</div>' +
      rankInfoLineHtml(sp) +
      (function () { var t = descricaoDaEspecie(sp); return t ? '<p class="flavor">' + escapeHtml(t) + '</p>' : ""; })() +
      (function () { var t = howToObtainText(sp); return t ? '<p class="obtain-hint">' + escapeHtml(t) + '</p>' : ""; })() +
      (function () { var t = compraDeInicialTexto(sp); return t ? '<p class="obtain-hint">' + escapeHtml(t) + '</p>' : ""; })() +
      (function () { var t = whereToFindText(sp); return t ? '<p class="obtain-hint">' + escapeHtml(t) + '</p>' : ""; })();
  }

  // Ficha: bloco "Conhecer a espécie" (stats, habilidades, evolução, formas).
  function fichaConhecerHtml(sp) {
    var statsHtml = fichaStatsHtml(sp);
    var synergyHits = sinergiasDaEspecie(sp);
    var abiHtml = uniqueIds(sp.ab).map(function (id) { return abilityCard(id, "Escolhível", "choosable", synergyHits); }).join("");
    var innHtml = sp.inn.map(function (id) { return abilityCard(id, "Innate", "innate", synergyHits); }).join("");
    var evoHtml = fichaEvolucaoHtml(sp);
    var frmHtml = fichaFormasHtml(sp);
    var howToObtainHtml = fichaComoObterHtml(sp);
    return '<div class="detail-group"><h3 class="detail-group-heading">Conhecer a espécie</h3>' +
      '<div class="card"><h3 class="stats-titulo">Stats base <span class="stats-total mono" aria-label="Total dos stats base: ' + bst(sp) + '">TOTAL ' + bst(sp) + '</span></h3>' + statsHtml + '</div>' +
      fichaEfetividadeHtml(sp) +
      '<div class="card"><h3>Habilidades &amp; Innates</h3><div class="abi-grid">' + abiHtml + innHtml + '</div>' +
        '<p style="color:var(--text-dim);font-size:var(--fs-pequeno);margin-top:10px;">1 habilidade escolhível fica ativa por vez, como na série principal. As innates ficam sempre ativas, além da habilidade escolhida.</p>' +
        conditionMoveSynergyNoteHtml(sp) + '</div>' +
      evoHtml +
      frmHtml +
      howToObtainHtml +
    '</div>';
  }

  // Ficha: golpes por nível e os liberados desde o início (o FAQ oficial: não
  // existem mais TM/HM/tutor; o campo `tu` do dado guarda esses). Bloco fechado.
  function fichaGolpesHtml(sp) {
    var lm = sp.lm.slice().sort(function (a, b) { return a[0] - b[0]; });
    var lmHtml = renderMovesTable(lm, "Golpes por Nível", "Sem golpes por nível registrados.");
    var tuPairs = sp.tu.map(function (id) { return [null, id]; });
    var tuHtml = tuPairs.length ? renderMovesTable(tuPairs, "Golpes liberados desde o início", "Sem golpes liberados desde o início registrados.") : "";
    return '<details class="detail-group"><summary>Golpes (' + (lm.length + tuPairs.length) + ')</summary>' +
      lmHtml + tuHtml +
    '</details>';
  }

  // Ficha: anotações e builds de referência (só aparece se houver algo).
  function fichaNotasHtml(sp) {
    var notes = notesCardHtml(sp);
    var refs = buildHistoryHtml(sp) + bossReferenceHtml(sp);
    var refsBlock = refs ? '<div class="card"><h3>Builds de referência</h3>' + refs + '</div>' : "";
    if (!notes && !refsBlock) return "";
    return '<details class="detail-group"><summary>Anotações e builds de referência</summary>' + notes + refsBlock + '</details>';
  }

  function selectSpecies(x) {
    // Only reset scroll when the species actually CHANGES - selectSpecies()
    // is also called to refresh the currently-open species in place (e.g.
    // after "Salvar build"/"Limpar" in Meu build), and yanking the user
    // back to the top after they clicked a button deep in the page would be
    // its own real regression. Paired with the #app height fix just above
    // (min-height -> height, the actual root cause of "a dex fica travada"
    // - the whole page was scrolling instead of this panel internally) -
    // without that fix this reset would have had nothing to reset, since
    // .species-detail's own scrollTop never moved at all before.
    var isSameSpecies = state.selected === x;
    state.selected = x;
    var sp = getSpeciesByX(x);
    if (!sp) return;
    document.getElementById("dex-shell").classList.add("show-detail");
    document.querySelectorAll(".species-row").forEach(function (r) {
      var isThis = parseInt(r.dataset.x, 10) === x;
      r.classList.toggle("selected", isThis);
      // Keep listbox semantics/roving tabindex in sync with a mouse click too,
      // not just the initial render - see the accessibility-pass comment
      // in renderList().
      r.setAttribute("aria-selected", String(isThis));
      r.tabIndex = isThis ? 0 : -1;
    });

    // Reorganização em blocos colapsáveis, Fase 2 - 2026-09-11 (reunião:
    // "a tela do Poke na dex tá meio pesada de informação"). <details>
    // nativo em vez de JS customizado - foco/teclado/leitor de tela vêm de
    // graça (skill artifact-design, princípio já seguido no resto do
    // app). Critério de aberto/fechado por padrão (time, mesma reunião):
    // o que é fato rápido de consultar (stats, habilidades, evolução)
    // fica ABERTO; o que é denso (tabelas de golpe, inteiras) ou usado
    // ocasionalmente (notas/histórico/comparar) fica FECHADO - mas nunca
    // escondido de verdade, um clique sempre abre, e o <summary> sempre
    // diz o que tem dentro (inclusive contagem, pra não precisar abrir só
    // pra saber se há algo lá). "Auto Build" fica ABERTO apesar de denso:
    // é a ação central do app (RF21-30), esconder por padrão atrapalharia
    // o fluxo principal mais do que ajudaria a limpar a tela.
    //
    // ATUALIZAÇÃO, mesmo dia (pedido do usuário): "Conhecer a espécie"
    // deixou de ser colapsável - "quero que tudo que está ali fique
    // visível". Virou um <div> comum (não <details>) com um cabeçalho
    // estático (.detail-group-heading) no lugar do <summary> - mesmo
    // peso visual, sem a semântica de abrir/fechar.
    document.getElementById("species-detail").innerHTML =
      fichaCabecalhoHtml(sp) +
      fichaConhecerHtml(sp) +
      fichaGolpesHtml(sp) +
      '<details class="detail-group" open><summary>Auto Build</summary>' +
        myBuildEditorHtml(sp) +
      '</details>' +
      fichaNotasHtml(sp) +
      '<details class="detail-group"><summary>Comparar com outro Pokémon</summary>' +
        compareCardHtml(sp) +
      '</details>';

    if (!isSameSpecies) {
      var detailPanel = document.querySelector(".species-detail");
      if (detailPanel) detailPanel.scrollTop = 0;
    }

    // Botões fixos da ficha: ouvinte único em #species-detail (logo abaixo).
    // O editor só preenche os campos (os ouvintes dele também são únicos).
    wireMyBuildEditor(sp);
  }

  // Um ouvinte só pros botões fixos da ficha (fase 5 da refatoração,
  // 2026-09-24): voltar, + Time, + Caixa, ir pro time, salvar anotação e abrir o
  // detalhe de um golpe - antes religados a cada abertura de ficha.
  (function () {
    var painel = document.getElementById("species-detail");
    painel.addEventListener("click", function (e) {
      var x = state.selected;
      var sp = x !== null && x !== undefined ? getSpeciesByX(x) : null;
      var alvo = e.target.closest("button, .move-row");
      // Golpe da tabela: o botão do nome (teclado e leitor de tela) e a linha inteira (mouse/toque)
      // abrem e fecham a descrição; aria-expanded acompanha.
      if (alvo && alvo.classList.contains("move-toggle")) alvo = alvo.closest(".move-row");
      if (!alvo || !painel.contains(alvo) || !sp) return;
      if (alvo.classList.contains("ficha-nav-btn")) {
        selectSpecies(parseInt(alvo.getAttribute("data-x"), 10));
      } else if (alvo.id === "back-to-list") {
        document.getElementById("dex-shell").classList.remove("show-detail");
      } else if (alvo.id === "add-team-btn") {
        if (alvo.disabled || state.team.indexOf(x) !== -1) return;
        if (state.team.length >= 6) { openSwapModal(x); return; }
        if (rosterMove(x, null)) flashToast(sp.n + " entrou no time (" + state.team.length + "/6)");
      } else if (alvo.id === "add-box-btn") {
        // Defesa em profundidade: o botão já vem desabilitado no time/caixa,
        // mas a regra é conferida de novo aqui (mesmo x nunca nos dois).
        acao(telasDeElenco(x), function () {
          if (state.team.indexOf(x) !== -1 || state.box.indexOf(x) !== -1) return false;
          state.box.push(x);
        });
      } else if (alvo.id === "goto-team-link") {
        document.querySelector('.tab-btn[data-tab="team"]').click();
      } else if (alvo.id === "species-notes-save") {
        var text = document.getElementById("species-notes-input").value.trim();
        acao([], function () { if (text) state.notes[sp.sname] = text; else delete state.notes[sp.sname]; });
        var status = document.getElementById("species-notes-status");
        if (status) status.textContent = "Salvo.";
      } else if (alvo.classList.contains("move-row")) {
        var detalhe = document.getElementById(alvo.dataset.target);
        if (detalhe) {
          var aberto = detalhe.classList.toggle("hidden") === false;
          var botaoGolpe = alvo.querySelector(".move-toggle");
          if (botaoGolpe) botaoGolpe.setAttribute("aria-expanded", aberto ? "true" : "false");
        }
      }
    });
  })();

  // Auditoria de performance, 2026-09-11 (pedido do usuário: "focar em
  // performance e velocidade"): os contadores do time/caixa (hoje a tela
  // "resumo" da camada de ações) chamavam
  // renderDashboard() sem condição - inclusive o cálculo novo do "leitor de
  // caixa" (bestBoxCandidateForBoss, itera a caixa inteira), mesmo quando o
  // jogador está numa aba completamente diferente (Caixa, Chefões...) e não
  // vai ver o dashboard até trocar de aba. Medido ao vivo: ~5ms a mais por
  // clique de remover-da-caixa numa caixa de ~590, só de recalcular uma
  // tela que nem está visível. dashboardDirty adia o recálculo pra quando a
  // aba Dex realmente é exibida - se o jogador JÁ está na Dex, continua
  // instantâneo como antes (nenhuma perda de atualização ao vivo).
  var dashboardDirty = true;
  function scheduleDashboardRefresh() {
    var dexTabActive = document.querySelector('.tab-btn[data-tab="dex"]').classList.contains("active");
    if (dexTabActive) {
      renderDashboard();
      dashboardDirty = false;
    } else {
      dashboardDirty = true;
    }
  }

  // (Contadores do time/caixa: TELAS.contadores, na camada de ações.)

  // "Novo jogo" (2026-09-13) - desabilitado quando não há nada pra resetar,
  // mesmo critério já usado em save-team-btn/etc.
  function updateResetTeamBoxBtn() {
    var btn = document.getElementById("reset-team-box-btn");
    if (btn) btn.disabled = !runTemAlgoPraZerar();
  }
