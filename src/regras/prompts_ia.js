  // ===== src/regras/prompts_ia.js =====
  // Peças dos prompts de IA (o que vai pro modelo) e a tradução dos erros da IA pro
  // jogador. Só texto e dado: quem conversa com a plataforma é o cliente único
  // pedirIA(), no template (fase 4 da refatoração).
  // Colado dentro do <script> principal do app por scripts/build.mjs (marcador
  // @regras prompts_ia.js), no mesmo escopo do resto do código. Só lógica: nada aqui
  // lê ou desenha a página - testável no Node (tests/unit). Movido do template na
  // fase 4 da refatoração (2026-09-24).

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
  // ITEM_STAT_MODS/ITEM_MOVE_POWER_MODS acima) - é um menu real e limitado
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

  // Orientação real de build por Ritmo/Clima do time (achado do usuário,
  // 2026-09-13, com print do time montado via "Montar melhor time": a
  // build gerada por IA pra um membro do time nunca considerava o
  // arquétipo já escolhido - o mesmo Pokémon recebia um set genérico
  // independente de o time ser Hyper Offense ou Stall). Cada entrada é uma
  // implicação MECÂNICA real (EVs/nature/golpe/item), não só repetir o
  // nome do arquétipo - a IA já recebe as ferramentas reais (rank, papel,
  // sinergia) pra decidir os detalhes finos dentro dessa direção.
  var PACE_BUILD_GUIDANCE = {
    "Hyper Offense": "prioriza dano imediato - nature/EVs ofensivos (Atk ou SpA + Speed), os 4 golpes reais de maior dano/utilidade ofensiva direta, item ofensivo quando fizer sentido (ex: Life Orb, Choice Band/Specs/Scarf).",
    "Balance": "não força um extremo - segue o papel real já calculado pra esta espécie (ofensivo, defensivo ou misto), misturando ataque com pelo menos uma opção de utilidade real (status/hazard/recuperação) quando o movepool permitir.",
    "Bulky Offense": "EVs/nature que aguentam pelo menos um hit relevante mas ainda batem forte - geralmente HP + a defesa relevante junto com o stat ofensivo principal, não Speed puro.",
    "Stall": "bulk máximo (EVs em HP + a defesa relevante) e golpes reais de recuperação/status/hazard quando o movepool tiver - evita golpe de setup ofensivo puro (Swords Dance etc.) a menos que não haja opção melhor no movepool real.",
    "Semi-Stall": "meio-termo entre Stall e Balance - bulk real ainda é prioridade, mas pode incluir um golpe ofensivo mais forte que um Stall puro usaria."
  };

  var WEATHER_BUILD_GUIDANCE = {
    "Sand": "se esta espécie tiver Sand Stream (ou outra habilidade real que ative areia) ou um golpe/tipo que se beneficia de areia real no movepool, prioriza isso - senão, mantém o papel calculado normalmente.",
    "Rain": "se esta espécie tiver Drizzle, Swift Swim ou um golpe de Água real que se beneficia de chuva, prioriza isso - senão, mantém o papel calculado normalmente.",
    "Sun": "se esta espécie tiver Drought, Chlorophyll ou um golpe de Fogo/Grama real que se beneficia de sol, prioriza isso - senão, mantém o papel calculado normalmente.",
    "Hail": "neste jogo o granizo vem de Snow Warning (\"Summons hail\") ou do golpe Hail, e tipo Ice ganha Defesa no granizo - se esta espécie arma o granizo ou tem golpe/habilidade real que se beneficia dele, prioriza isso - senão, mantém o papel calculado normalmente.",
    // Clima deste hack (2026-09-26): nomes das habilidades conferidos no dado.
    "Eerie Fog": "clima deste jogo - Low Visibility e Fog Machine armam a nevoa; varias habilidades so funcionam nela (Ectoplasm, Ethereal Rush, Rest in Peace, Soul Tap, Foggy Eye, Echolocation, Greater Spirit, Shallow Grave, Smokey Maneuvers). Se esta espécie tiver uma delas, prioriza; a nevoa DRENA aumentos de status, então evita depender de golpe de setup - senão, mantém o papel calculado normalmente.",
    "Trick Room": "Trick Room inverte a ordem de turno - prioriza Velocidade BAIXA de propósito (EVs 0 em Speed, considera uma nature que reduz Speed) junto com golpes ofensivos reais, já que quem for mais lento ataca primeiro.",
    // Terrenos (2026-09-26): habilidades que armam/aproveitam e o efeito, tudo
    // conferido no dado deste jogo (descrição do golpe de terreno) - efeito do
    // jogo original que a descrição não confirma fica de fora.
    "Electric Terrain": "8 turnos, impede o sono. Electro Surge arma o terreno; Surge Surfer, Quark Drive, Hadron Engine, Power Leak e Backup Power se beneficiam dele. Se esta espécie tiver uma dessas, prioriza - senão, mantém o papel calculado normalmente.",
    "Psychic Terrain": "8 turnos, bloqueia prioridade. Psychic Surge arma o terreno; Zen Garden e Brain Overload se beneficiam. Se esta espécie tiver uma dessas, prioriza - senão, mantém o papel calculado normalmente.",
    "Grassy Terrain": "8 turnos, restaura HP. Grassy Surge e Seed Sower armam o terreno; Grass Pelt, Harukaze, Flower Necklace e Jungle Fever se beneficiam. Se esta espécie tiver uma dessas, prioriza - senão, mantém o papel calculado normalmente.",
    "Misty Terrain": "8 turnos, bloqueia status. Misty Surge arma o terreno; Celestial Blessing se beneficia. Se esta espécie tiver uma dessas, prioriza - senão, mantém o papel calculado normalmente.",
    "Toxic Terrain": "terreno deste jogo: 8 turnos, fortalece golpes Poison e causa dano nos Pokemon a cada turno. Toxic Surge arma; Biofilm se beneficia. Se esta espécie tiver uma dessas ou golpes Poison fortes, prioriza - senão, mantém o papel calculado normalmente."
  };

  // Tática do time (2026-09-26): o que o time faz em campo, independente de
  // estilo e clima.
  var TATICA_BUILD_GUIDANCE = {
    "Telas": "o time joga com Reflect/Light Screen/Aurora Veil (neste jogo a Aurora Veil so funciona com granizo) - se o movepool real desta espécie tiver um desses, um set de suporte que arma telas (Light Clay estende) serve ao time; se for atacante, aproveita o turno protegido pra um golpe de setup real.",
    "Armadilhas e pivô": "o time espalha armadilhas e troca sem perder turno - prioriza golpes reais de armadilha (Stealth Rock, Spikes, Toxic Spikes, Sticky Web) e de pivô (U-turn, Volt Switch, Flip Turn, Parting Shot) quando o movepool tiver; Heavy-Duty Boots protege de armadilha inimiga."
  };

  // Rótulos que a IA lê (2026-09-26): "Estilo", "Clima e campo", "Tática".
  function archetypeBuildGuidance() {
    var parts = [];
    if (state.archetype.pace && PACE_BUILD_GUIDANCE[state.archetype.pace]) {
      parts.push("Estilo do time: " + state.archetype.pace + " - " + PACE_BUILD_GUIDANCE[state.archetype.pace]);
    }
    if (state.archetype.weather && WEATHER_BUILD_GUIDANCE[state.archetype.weather]) {
      parts.push("Clima e campo do time: " + state.archetype.weather + " - " + WEATHER_BUILD_GUIDANCE[state.archetype.weather]);
    }
    if (state.archetype.tatica && TATICA_BUILD_GUIDANCE[state.archetype.tatica]) {
      parts.push("Tatica do time: " + state.archetype.tatica + " - " + TATICA_BUILD_GUIDANCE[state.archetype.tatica]);
    }
    return parts;
  }

  function planoPromptBlock(sp, cap) {
    var futuros = golpesFuturosDe(sp, cap);
    if (!futuros.length) return "";
    return "PLANO DE GOLPES: o jogador sobe de nivel ao longo do jogo. Estes golpes esta forma ainda NAO aprende (liberam no nivel indicado):\n" +
      "<dados_do_jogo>\n" + futuros.map(function (f) { return "nivel " + f.nivel + ": " + movePromptLine(f.id); }).join("\n") + "\n</dados_do_jogo>\n" +
      "Para cada um dos 4 golpes escolhidos, se um destes golpes futuros for claramente melhor PARA O MESMO PAPEL deste slot, aponte a troca no campo " +
      "\"plano\" ({\"golpe de agora\": \"golpe futuro\"}). So aponte troca que voce faria de verdade; slot sem troca melhor fica fora do plano. " +
      "O app aplica a troca sozinho quando o level cap liberar o golpe.\n";
  }

  function contextoDoModoPrompt(sp, opts, cap) {
    if (opts.modo === "revisao" && opts.anterior) {
      var a = opts.anterior;
      return "REVISAO DEPOIS DA EVOLUCAO: este Pokemon acabou de evoluir" + (opts.deNome ? " de " + opts.deNome : "") +
        ". A build que ele usava era: habilidade " + dadoExterno(a.ability || "?") + ", golpes " + (a.moves || []).map(dadoExterno).join(", ") +
        ". Mantenha o mesmo PAPEL e os golpes que continuam bons; troque so o que a forma nova faz claramente melhor (habilidade, stats e movepool mudaram). " +
        "Na rationale, diga o que mudou e por que.\n";
    }
    if (opts.modo === "ponte" && opts.alvo) {
      var trav = golpesTravadosNoCap(sp, opts.alvo.moves).filter(function (g) { return g.nivel !== null; });
      return "BUILD ALVO (curada pela comunidade, pensada pro fim do jogo): habilidade " + dadoExterno(opts.alvo.ability) + ", natureza " + dadoExterno(opts.alvo.nature) +
        ", golpes " + opts.alvo.moves.map(dadoExterno).join(", ") + ". No level cap " + cap + " ainda estao travados: " +
        trav.map(function (g) { return dadoExterno(g.nome) + " (nivel " + g.nivel + ")"; }).join(", ") +
        ". Monte a build de AGORA: mantenha todos os golpes da curada que ja estao liberados e, pra cada golpe travado, escolha um golpe-ponte " +
        "liberado agora que cumpra o mesmo papel. No campo \"plano\", aponte cada golpe-ponte para o golpe travado da curada que ele substitui.\n";
    }
    return "";
  }

  // Confere o plano devolvido pela IA e anexa o que vale à build validada.
  function anexarPlanoDaIa(sp, validated, rawPlano, cap, destinosPermitidos) {
    var bruto = rawPlano;
    if (destinosPermitidos && bruto && typeof bruto === "object") {
      bruto = {};
      Object.keys(rawPlano).forEach(function (de) { if (destinosPermitidos.indexOf(rawPlano[de]) !== -1) bruto[de] = rawPlano[de]; });
    }
    var r = validarPlano(sp, validated.moves, bruto, cap);
    if (Object.keys(r.plano).length) validated.plano = r.plano;
    return r;
  }

  // Achado na reunião de 2026-09-11 sobre o material de IHC (capítulo de
  // interação social/emocional, tabela "mensagens frustrantes x
  // construtivas"): este catch era o único lugar do app com uma mensagem
  // de erro genérica ("Erro ao gerar build - tente de novo.") que não diz
  // o que aconteceu nem se adianta alguma coisa tentar de novo - o mesmo
  // defeito do exemplo "Erro de sintaxe!" do livro. Toda outra mensagem do
  // app (banner de armazenamento cheio, avisos de IA indisponível) já
  // segue o padrão construtivo; esta só não tinha sido revisada porque o
  // catch nunca tinha sido dividido por código de erro. Códigos e
  // categorias conforme sample.d.ts (contrato 0.2.41): "sem sentido tentar
  // de novo sem mudar algo" vs. "transitório, tentar de novo pode resolver".
  function sampleErrorMessage(e) {
    switch (e && e.code) {
      case "not_granted":
        return "Geração por IA não disponível (permissão não concedida).";
      case "rate_limited":
        return "Muitos pedidos de uma vez - espere um pouco e tente de novo.";
      case "session_expired":
        return "Sua sessão expirou - atualize a página e tente de novo.";
      case "refused":
        return "A IA recusou esse pedido - tente novamente ou escolha outro Pokémon.";
      case "empty_completion":
      case "invalid_json":
        return "A resposta da IA veio incompleta ou num formato inesperado - tente de novo.";
      case "prompt_too_large":
        // Achado na auditoria de mensagens (2026-09-12): único código sem
        // nenhuma próxima ação sugerida - "tente de novo mais tarde" é
        // honesto (não há uma ação melhor aqui, o pedido não fica menor),
        // mas ainda dá ao jogador algo a fazer em vez de um beco sem saída.
        return "Esse Pokémon tem dados demais pra IA processar de uma vez - tente de novo mais tarde.";
      case "sampling_disabled":
      case "not_declared":
      case "capability_disabled":
      case "capability_removed":
      case "tools_unavailable":
        return "Geração por IA não disponível neste ambiente.";
      default:
        // upstream_error e qualquer código não previsto: falha transitória
        // do serviço, tentar de novo é uma ação real (sample.d.ts recomenda
        // tratar código desconhecido como upstream_error).
        return "Falha temporária ao consultar a IA - tente de novo em instantes.";
    }
  }

  // ---------------- blocos compartilhados dos prompts (fase 4) ----------------
  // Build (1 set) e Estratégias (2-3 sets) mandavam os mesmos dados com texto
  // copiado e já divergente (as Estratégias não recebiam o aviso de ler a
  // descrição do golpe, nem a regra completa de papel x golpe). Agora os dois
  // usam estes blocos; `plural` só muda a concordância ("escolha" / "cada set
  // escolhe").
  function versaoDosDados() { return DATA.meta ? DATA.meta.version : "?"; }
  function cabecalhoIA() {
    return "Você é o especialista em meta do Pokemon Elite Redux (ROM hack de Pokemon). " + PROMPT_DADOS_AVISO + " ";
  }
  function blocoEspecieIA(sp, plural) {
    var abiNames = uniqueIds(sp.ab).map(function (id) { return ABILITIES[id][0]; });
    var innNames = sp.inn.map(function (id) { return ABILITIES[id][0]; });
    return "Tipo: " + speciesTypeNames(sp).join("/") + "\n" +
      "Status base (HP/Atk/Def/SpA/SpD/Spe): " + sp.b.join("/") + "\n" +
      "Habilidades escolhiveis - " + (plural ? "cada set escolhe" : "escolha") + " exatamente UMA destas, escrita EXATAMENTE assim: " + abiNames.join(", ") + "\n" +
      "Innates sempre ativas (nao escolhiveis, so contexto): " + innNames.join(", ") + "\n";
  }
  // Movepool liberado no cap (mesma trava do editor manual - golpe de tutor
  // nunca trava), dentro de UM bloco <dados_do_jogo>.
  function blocoMovepoolIA(sp, plural) {
    var linhas = availableMovesFor(sp).ids.map(movePromptLine);
    return "Movepool real - " + (plural ? "cada set escolhe" : "escolha") + " exatamente 4 desta lista, nenhum golpe fora dela. Cada linha traz o que o golpe " +
      "FAZ NESTE HACK (tipo, categoria, poder, prioridade, papel e descricao do proprio jogo) - leia a descricao, " +
      "nao assuma pelo nome, golpes deste hack podem ser diferentes do jogo original:\n<dados_do_jogo>\n" + linhas.join("\n") + "\n</dados_do_jogo>\n";
  }
  function blocoRegrasDePapelIA() {
    return "COERENCIA PAPEL x GOLPE: cada um dos 4 golpes precisa servir ao papel escolhido. Build 100% ofensiva " +
      "(EVs em ataque e velocidade, nada em HP/Def/SpD) NAO leva golpe de papel 'cura' e leva pelo menos 2 golpes " +
      "de dano - uma build assim que ignore isso vai ser REJEITADA. Se quiser cura, invista em bulk e explique na rationale.\n" +
      "FORMATO 1x1: golpe de papel 'dupla' (Follow Me, Helping Hand, Ally Switch...) nao faz nada numa batalha de um contra um e e REJEITADO.\n";
  }
  function blocoMegaIA(sp, plural) {
    var bloco = megaPromptBlock(sp);
    var regraPedra = megaStoneRuleFor(sp);
    var out = "";
    if (bloco) {
      out += bloco + "\n";
      if (megaEvolutionUnlocked() || isMegaForm(sp)) {
        out += (plural ? "Cada set e" : "Esta build e") + " para a forma " + sp.n + " - habilidade e golpes SO desta forma, nunca misture com os de outra." + formFamilyPromptNote(sp) + "\n";
      }
    }
    if (regraPedra) out += regraPedra.prompt + "\n";
    return out;
  }
  function blocoItensIA(sp, plural) {
    var tipo = Object.keys(ITENS_IA_TIPO).filter(function (n) { return ITEMS.indexOf(n) !== -1; })
      .map(function (n) { return n + "=" + ITENS_IA_TIPO[n]; });
    var comDescricao = function (n) { return "- " + n + ": " + dadoExterno(ITEM_DESC[n] || "sem descricao"); };
    var daEspecie = itensDeEspeciePara(sp);
    return "Itens de batalha reais disponiveis - " + (plural ? "cada set escolhe UM (ou deixa vazio)" : "escolha UM (ou deixe vazio se nenhum fizer sentido)") +
      ", nenhum fora destes grupos:\n" +
      "Gerais: " + ITENS_IA_GERAIS.join(", ") + "\n" +
      "Reforco de tipo (+dano daquele tipo em todo golpe; use o do golpe de dano principal): " + tipo.join(", ") + "\n" +
      "Gemas (+dano forte do tipo UMA vez e a gema se gasta - bom pra um golpe decisivo, combina com Unburden e Acrobatics): " + ITENS_IA_GEMAS.join(", ") + "\n" +
      "Berries: " + ITENS_IA_BERRIES.join(", ") + ". As de panico (Liechi, Salac, Petaya, Apicot, Ganlon, Starf) sobem um status com HP baixo; as de resistencia (Occa=Fire, Passho=Water, " +
      "Wacan=Electric, Rindo=Grass, Yache=Ice, Chople=Fighting, Kebia=Poison, Shuca=Ground, Coba=Flying, Payapa=Psychic, Tanga=Bug, Charti=Rock, " +
      "Kasib=Ghost, Haban=Dragon, Colbur=Dark, Babiri=Steel, Roseli=Fairy, Chilan=Normal) enfraquecem um golpe super efetivo daquele tipo - use a " +
      "da fraqueza mais perigosa desta especie.\n" +
      "Utilidade (efeito deste jogo - leia, nao assuma pelo nome; pedra de clima so se a especie arma aquele clima):\n<dados_do_jogo>\n" +
      ITENS_IA_UTILIDADE.map(comDescricao).join("\n") + "\n</dados_do_jogo>\n" +
      (daEspecie.length ? "Exclusivo desta especie:\n<dados_do_jogo>\n" + daEspecie.map(comDescricao).join("\n") + "\n</dados_do_jogo>\n" : "") +
      regraItemConsumivelPrompt(sp);
  }
  // O que o resto do time já usa (só a build de 1 membro recebe: as Estratégias
  // são leitura exploratória da espécie, não do time).
  function blocoTimeEmUsoIA(sp) {
    var itens = teamItemsInUse(sp.x), golpes = teamMovesInUse(sp.x), papeis = teamRolesInUse(sp.x);
    return (itens.length ? ("Itens JA EM USO por outros membros do time atual - NUNCA repita nenhum destes, escolha outro item ou deixe vazio: " + itens.join(", ") + "\n") : "") +
      (golpes.length ? ("Golpes JA EM USO por outros membros do time atual: " + golpes.join(", ") + ". Evite repetir estes golpes nesta build - o time fica mais forte e menos repetitivo quando cada membro cobre uma ameaca/papel diferente. So repita um destes se for claramente a melhor opcao sem alternativa real equivalente (ex: o STAB mais forte do movepool desta especie) - nesse caso, diga na rationale por que nao havia alternativa melhor.\n") : "") +
      (papeis.length ? ("Papeis JA COBERTOS por outros membros do time atual (perfil natural de cada especie, nao a build escolhida): " + papeis.map(function (r) { return ROLE_LABEL_PT[r] || r; }).join(", ") + ". Pese isso na hora de decidir o papel deste Pokemon - um time com varios atacantes puros e nenhuma bulk/suporte fica fragil contra qualquer coisa que sobreviva o primeiro golpe. Nao e proibido repetir papel (as vezes o time PRECISA de 2+ sweepers de proposito), mas se for repetir um papel ja bem coberto, diga na rationale por que faz sentido mesmo assim.\n") : "");
  }

  // Prompt da build de UM membro (botão "Gerar com IA", revisão pós-evolução,
  // golpe-ponte da curada). Texto e dados só - quem pede é pedirIA().
  function montarPromptBuild(sp, opts) {
    opts = opts || {};
    var cap = getCurrentCap();
    var archetypeParts = archetypeBuildGuidance();
    return cabecalhoIA() +
      "Monte um set competitivo, formato Pokemon Showdown, para o Pokemon " + sp.n +
      " (build " + versaoDosDados() + ").\n" +
      blocoEspecieIA(sp, false) +
      blocoMovepoolIA(sp, false) +
      blocoRegrasDePapelIA() +
      blocoMegaIA(sp, false) +
      blocoItensIA(sp, false) +
      blocoTimeEmUsoIA(sp) +
      (cap ? ("Level cap atual do jogador: " + cap + "\n") : "") +
      (archetypeParts.length ? (archetypeParts.join("\n") + "\n") : "") +
      contextoDoModoPrompt(sp, opts, cap) +
      planoPromptBlock(sp, cap) +
      "Antes de responder, use as ferramentas disponiveis pra ver as fraquezas reais do time atual " +
      "do jogador, o rank real desta especie, e quais chefoes/lideres de ginasio ainda faltam ate o " +
      "final do jogo a partir de onde o jogador esta agora - use tudo isso pra decidir o PAPEL que " +
      "este Pokemon deve cumprir dai pra frente" +
      (archetypeParts.length ? " - SEMPRE alinhado ao Estilo/Clima e campo/Tatica do time informado acima, isso pesa mais que qualquer outra consideracao de papel" : "") +
      " (ofensivo, defensivo, suporte, resposta a uma fraqueza " +
      "especifica do time, ou resposta a uma ameaca recorrente nos chefoes que ainda vem pela frente), " +
      "nao so um set generico isolado pro momento atual. Use tambem getPriorityMoveOptions pra ver se " +
      "esta especie tem acesso a algum golpe de prioridade real e avalie se vale a pena incluir um " +
      "dos 4 golpes - o formato aqui e 1x1, entao golpe de prioridade pode decidir uma troca sozinho, " +
      "mas so inclua se fizer sentido pro papel escolhido (ex: um wallbreaker lento se beneficia mais " +
      "de prioridade do que um sweeper que ja e mais rapido que a maioria).\n" +
      "Antes de decidir EV de Velocidade, use getSpeedBenchmark pra ver a posicao REAL desta especie no " +
      "ranking de Velocidade - nao chute se 252 EV 'e rapido o bastante', confira quantas especies ela " +
      "ultrapassa investindo. Se ela ja e rapida o bastante sem EV total (ou quase), considere investir " +
      "menos em Velocidade e mais em bulk/ataque, e explique isso na rationale.\n" +
      "Use tambem getAbilityMovepoolSynergy pra ver se alguma das habilidades desta especie (escolhivel " +
      "ou innate) aumenta de verdade o poder de golpes que ela REALMENTE aprende (ex: Mighty Horn com um " +
      "golpe de chifre/broca real no movepool).\n" +
      "REGRA OBRIGATORIA (pedido do usuario, 2026-09-15): se getAbilityMovepoolSynergy retornar QUALQUER " +
      "sinergia real pra esta especie, a build PRECISA incluir pelo menos um desses golpes entre os 4, e a " +
      "sinergia precisa estar ATIVA - ou seja, ou ela vem de uma innate (sempre ativa), ou a habilidade " +
      "escolhivel que voce escolher tem que ser exatamente a que ativa essa sinergia. Uma build que ignore " +
      "isso vai ser REJEITADA pela validacao e o usuario tera que pedir de novo, entao confira antes de " +
      "responder. Lista vazia = nenhuma sinergia real confirmada, escolha normalmente.\n" +
      "Use tambem getConditionMoveSynergy pra ver se esta especie tem algum combo autossuficiente real entre " +
      "uma habilidade condicional (clima ou HP baixo) e um golpe que ela mesma aprende pra satisfazer essa " +
      "condicao sozinha, sem apoio de outro membro do time. Nao e obrigatorio incluir - varios destes golpes " +
      "sao de clima/status e podem nao caber no papel escolhido (ex: nao force Hail num set 100% ofensivo que " +
      "so quer dano) - mas quando o golpe combina com o papel, prefira incluir e escolher a habilidade que " +
      "ativa o combo, e cite isso na rationale.\n" +
      "Use tambem getNextBossRoster: ele traz o elenco real da proxima luta e os buracos do time atual. Nao e " +
      "obrigatorio, mas quando um dos 4 golpes ou o papel deste Pokemon puder responder a uma ameaca concreta " +
      "dessa luta (ex: um golpe que acerta um chefao que ninguem do time acerta super efetivo, ou resistir ao " +
      "golpe mais perigoso dele), prefira isso a um set generico - e cite o chefao na rationale.\n" +
      "Use tambem getBoxCandidatesForBoss - se ela sugerir ESTA MESMA especie como o melhor candidato da " +
      "caixa pra proxima luta que falta, pode citar isso na rationale (ex: 'bom encaixe pra proxima luta, " +
      "contra X'), mas so se for esta especie mesmo, senao ignore.\n" +
      "Responda SOMENTE com um objeto JSON neste formato exato, sem texto ao redor: " +
      '{"ability":"...","nature":"...","item":"...","moves":["...","...","...","..."],"evs":[hp,atk,def,spa,spd,spe],"plano":{"golpe de agora":"golpe futuro"},"rationale":"..."}' +
      ". nature precisa ser uma nature real de Pokemon (ex: Adamant, Modest, Jolly, Timid). " +
      "evs sao 6 numeros inteiros de 0 a 252, somando no maximo 510. " +
      "rationale e uma frase curta em portugues explicando a escolha com base no time/rank/momento do jogo" +
      (archetypeParts.length ? "/Estilo, Clima e campo ou Tatica do time" : "") + ". " +
      "Nao invente golpes, habilidades ou items fora do que foi listado.";
  }

  // Prompt das Estratégias (2 a 3 sets de papéis diferentes da espécie).
  function montarPromptEstrategias(sp) {
    var cap = getCurrentCap();
    // Achado em auditoria, 2026-09-18: "Estratégias" gerava sets sem NUNCA
    // olhar se já existe um build curado real (data/builds.json) pra esta
    // espécie - risco de redundância (ou pior, contradição) com um set que
    // já foi verificado por um jogador de verdade. Só avisa e pede
    // diferenciação - nunca bloqueia nem repete a regra "dura" de
    // validateAiBuild (a mesma assimetria de sempre: builds curadas têm
    // gente real respondendo por elas, "Estratégias" não pode se impor).
    var curados = curadasDe(sp.sname);
    var curadoPromptLine = curados.length
      ? ("Já existe" + (curados.length > 1 ? "m " + curados.length + " builds CURADOS" : " um build CURADO") + " real (verificado) pra " + sp.n + ": " +
         curados.map(function (c) {
           return "[" + (c.estilo || estiloDeEvs(c.evs)) + ", fonte " + c.fonte + "] habilidade " + c.ability + ", item " + (c.item || "nenhum") + ", golpes " + c.moves.join("/");
         }).join("; ") +
         ". Os sets que você montar aqui devem ser DIFERENTES desses - não repita a mesma combinação de papel.\n")
      : "";
    return cabecalhoIA() +
      "Monte de 2 a 3 sets competitivos DISTINTOS (formato Pokemon Showdown), estilo dex do Smogon, para o Pokemon " +
      sp.n + " (build " + versaoDosDados() + "). Cada set precisa ter um PAPEL real e diferente " +
      "dos outros (ex: wallbreaker especial, sweeper físico, suporte/tanque, setup...) - só inclua um papel se ele " +
      "genuinamente fizer sentido pra esta espécie neste hack; 2 sets bons valem mais que 3 forçados.\n" +
      blocoEspecieIA(sp, true) +
      blocoMovepoolIA(sp, true) +
      blocoRegrasDePapelIA() +
      blocoMegaIA(sp, true) +
      blocoItensIA(sp, true) +
      (cap ? ("Level cap atual do jogador: " + cap + "\n") : "") +
      curadoPromptLine +
      "Antes de responder, use getSpeciesRank e getAbilityMovepoolSynergy pra fundamentar os papeis escolhidos - " +
      "se getAbilityMovepoolSynergy retornar sinergia real, PELO MENOS UM dos sets precisa usar um golpe dela com " +
      "a habilidade que ativa a sinergia (innate conta sempre). Use tambem getConditionMoveSynergy - se ela " +
      "retornar um combo autossuficiente real (habilidade condicional + golpe que a propria especie usa pra " +
      "satisfazer a condicao) e ele fizer sentido pro papel de algum dos sets, use-o nesse set e cite na " +
      "rationale; nao force em todos, alguns papeis nao combinam com o golpe. Use tambem getNextBossRoster: pelo " +
      "menos um dos sets deve responder a uma ameaca concreta da proxima luta (golpe ou resistencia contra o " +
      "elenco real dela), citando o chefao na rationale. Se algum set for um sweeper/atacante rapido, " +
      "use getSpeedBenchmark pra confirmar que o EV de Velocidade escolhido realmente ultrapassa uma fatia " +
      "relevante do jogo - nao chute.\n" +
      "Responda SOMENTE com um objeto JSON neste formato exato, sem texto ao redor: " +
      '{"sets":[{"name":"...","ability":"...","nature":"...","item":"...","moves":["...","...","...","..."],"evs":[hp,atk,def,spa,spd,spe],"rationale":"..."}]}' +
      ". 'name' e um rotulo curto do papel (2-4 palavras, ex: 'Wallbreaker Especial'). nature precisa ser uma " +
      "nature real de Pokemon. evs sao 6 numeros de 0 a 252, somando no maximo 510. rationale e 1-2 frases curtas " +
      "em portugues explicando a escolha. Nao invente golpes, habilidades ou items fora do que foi listado.";
  }

  // Plano pra uma build que o jogador montou à mão: a IA não mexe em nada da
  // build, só aponta o golpe futuro de cada slot. "" = não há golpe por liberar
  // (nada a perguntar).
  function montarPromptPlano(sp, entry, cap) {
    var bloco = planoPromptBlock(sp, cap);
    if (!bloco) return "";
    return "Voce e o especialista em meta do Pokemon Elite Redux (ROM hack de Pokemon). " + PROMPT_DADOS_AVISO + "\n" +
      "O jogador montou esta build a mao para " + sp.n + " (tipo " + speciesTypeNames(sp).join("/") + ") e ela NAO deve mudar: habilidade " +
      dadoExterno(entry.ability || "?") + ", golpes " + entry.moves.map(dadoExterno).join(", ") + ". Level cap atual: " + cap + ".\n" + bloco +
      "Responda SOMENTE com um objeto JSON: {\"plano\":{\"golpe de agora\":\"golpe futuro\"}} - objeto vazio se nenhuma troca for claramente melhor.";
  }

  // Gerador de time por arquétipo: quem o jogador tem (time + caixa), já
  // filtrado - Mega conta como a base antes da 4ª insígnia, Monotype é REGRA
  // (filtra antes de ir pro prompt). Devolve { roster, validSnames }.
  function rosterParaTimeIA(monotype) {
    var rosterXs = state.team.concat(state.box).filter(function (x, i, arr) { return arr.indexOf(x) === i; });
    var roster = rosterXs.map(getSpeciesByX).filter(Boolean);
    // Antes da 4ª insígnia uma forma Mega já no time/caixa conta como a base
    // dela (achado do usuário, 2026-09-24: "Altaria Mega" na caixa entrava na
    // sugestão de time sem o jogador ter acesso a Mega ainda) - sem duplicar a
    // mesma criatura se as duas formas estiverem no roster.
    var jaNoRoster = {};
    roster = roster.map(usableSpeciesFor).filter(function (sp) {
      if (jaNoRoster[sp.x]) return false;
      jaNoRoster[sp.x] = true;
      return true;
    });
    // Monotype é uma REGRA, não uma sugestão de estilo pra IA seguir por
    // conta própria (ao contrário de Ritmo/Clima) - o roster já sai
    // filtrado por tipo real antes de qualquer coisa ir pro prompt, então
    // é impossível a IA "esquecer" e sugerir um tipo fora disso.
    if (monotype) roster = roster.filter(function (sp) { return speciesTypeNames(sp).indexOf(monotype) !== -1; });
    // Formas mega de quem o jogador tem também valem - mas só depois da 4ª
    // insígnia (battleFamilyOf).
    var validSnames = [];
    roster.forEach(function (sp) {
      battleFamilyOf(sp).forEach(function (f) { if (validSnames.indexOf(f.sname) === -1) validSnames.push(f.sname); });
    });
    return { roster: roster, validSnames: validSnames };
  }
  function montarPromptTimeArquetipo(roster, pace, weather, monotype) {
    var rosterDesc = roster.map(function (sp) {
      var role = SPECIES_ROLE[sp.sname];
      var roleNames = (role && role.roles || []).map(function (r) { return ROLE_LABEL_PT[r] || r; });
      var r = SPECIES_RANK[sp.sname];
      var build = effectiveBuild(sp);
      var innNames = sp.inn.map(function (id) { return ABILITIES[id][0]; });
      var abiNames = uniqueIds(sp.ab).map(function (id) { return ABILITIES[id][0]; });
      return sp.sname + " " + sp.n + " (" + speciesTypeNames(sp).join("/") + formFamilyPromptNote(sp) + "), Velocidade base " + sp.b[5] +
        (r ? ", rank " + r.tier : "") + (roleNames.length ? ", papel " + roleNames.join("/") : "") +
        ", innate: " + innNames.join(", ") +
        (build ? ", habilidade escolhida: " + build.ability : ", habilidades escolhíveis: " + abiNames.join(", "));
    }).join("\n");
    var focusDesc = [pace ? "Estilo: " + pace : "", weather ? "Clima e campo: " + weather : "", state.archetype.tatica ? "Tatica: " + state.archetype.tatica : "", monotype ? "Monotype: " + monotype : ""].filter(Boolean).join(" + ");
    return "Você é o especialista em meta do Pokemon Elite Redux (ROM hack), build " +
      versaoDosDados() + ". Monte o MELHOR time possível de até 6 Pokémon, usando " +
      "SOMENTE espécies desta lista real que o jogador já possui (time + caixa) - nunca invente nem sugira " +
      "algo fora dela:\n" + rosterDesc + "\n\n" +
      "Foco pedido: " + focusDesc + ".\n" +
      (megaEvolutionUnlocked() ? "" : "MEGA EVOLUCAO: AINDA NAO DISPONIVEL - o jogador so consegue Mega Evolucao depois da 4a insignia (Flannery). NAO sugira nenhuma forma mega nem conte com mega no time; use so as formas base da lista.\n") +
      (monotype ? "A lista acima JÁ está filtrada só pro tipo " + monotype + " (Monotype) - todos servem, escolha pela sinergia entre eles.\n" : "") +
      "Use as ferramentas disponíveis pra checar rank/papel/sinergia real de candidatos específicos antes de " +
      "decidir - não confie só no resumo acima. Evite concentrar o mesmo papel sem necessidade real (ex: 4 " +
      "tanques só faz sentido pra um time Stall de verdade) - a menos que o foco pedido exija isso. Use a " +
      "Velocidade base listada pra julgar times que dependem de controle de velocidade (Trick Room quer " +
      "Velocidade baixa e uniforme; Hyper Offense/Sand-Rain-Sun times ofensivos geralmente querem Velocidade " +
      "alta).\n" +
      "Responda SOMENTE com um objeto JSON neste formato exato, sem texto ao redor: " +
      '{"team":["sname1","sname2",...],"reasoning":"..."}' +
      ". team tem NO MÁXIMO 6 snames, todos da lista acima, sem repetir - se a lista tiver menos de 6 " +
      "espécies que façam sentido pro foco pedido, devolva menos, nunca invente pra completar 6. reasoning " +
      "é 2-4 frases curtas em português explicando as escolhas e, se relevante, o que foi deixado de fora e " +
      "por quê.";
  }
  // Snames da resposta que valem: só da lista real, sem repetir, até 6 (dedupe
  // aqui também, 2026-09-12: sname repetido mostrava o chip 2 vezes na proposta).
  function snamesValidosDoTime(raw, validSnames) {
    var seenSname = {};
    return Array.isArray(raw && raw.team)
      ? raw.team.filter(function (sn) {
          if (typeof sn !== "string" || validSnames.indexOf(sn) === -1 || seenSname[sn]) return false;
          seenSname[sn] = true;
          return true;
        }).slice(0, 6)
      : [];
  }

  // Guia de uso do time recém-montado (Gerador Inteligente de Times).
  function descricaoTimeParaGuia(members) {
    return members.map(function (sp) {
      var build = effectiveBuild(sp);
      var role = SPECIES_ROLE[sp.sname];
      var roleNames = (role && role.roles || []).map(function (r) { return ROLE_LABEL_PT[r] || r; });
      return sp.n + " (" + speciesTypeNames(sp).join("/") + formFamilyPromptNote(sp) + "), sname " + sp.sname +
        (roleNames.length ? ", papel " + roleNames.join("/") : "") + ", Velocidade base " + sp.b[5] +
        (build ? ", build ativa: habilidade " + build.ability + ", item " + (build.item || "nenhum") + ", golpes " + build.moves.join("/") : ", sem build salva ainda");
    }).join("\n");
  }
  function montarPromptGuia(members, focusDesc) {
    var teamList = descricaoTimeParaGuia(members);
    return "Você é o especialista em meta do Pokemon Elite Redux (ROM hack), build " +
      versaoDosDados() + ", formato 1x1.\n" +
      "Acabou de ser montado este time (foco: " + focusDesc + "):\n" + teamList + "\n\n" +
      "Escreva um guia PRÁTICO de como jogar ESTE time especificamente, usando as builds reais listadas " +
      "acima - nunca um texto genérico sobre o arquétipo. Use getTeamWeaknesses, getRemainingBosses e, pra " +
      "membros específicos, getSpeciesRank/getPriorityMoveOptions antes de responder, em vez de chutar.\n" +
      "Responda SOMENTE com um objeto JSON neste formato exato, sem texto ao redor: " +
      '{"concept":"...","opening":"...","development":"...","winCondition":"...","threats":"...","threatMemberSname":"..."}' +
      ". Cada campo de texto é corrido em português, sem markdown, sem lista. concept: 1-2 frases, a proposta " +
      "do time e como ele costuma vencer. opening: 2-3 frases, quem tende a abrir a partida e o que observar " +
      "nos primeiros turnos. development: 2-3 frases, como posicionar, quando trocar, quando usar suporte, " +
      "como preservar recursos importantes. winCondition: 1-2 frases, qual Pokémon ou combinação costuma " +
      "fechar a partida e o que preservar pra isso. threats: 2-3 frases - cite PELO MENOS UM chefão ou líder " +
      "de ginásio REAL que ainda falta enfrentar (nome exato de getRemainingBosses) que é particularmente " +
      "perigoso pra este time, dizendo qual integrante segura ele e por quê (tipo, golpe ou stat real dele, " +
      "nunca chutado) - nomeie o adversário de verdade, não fique só em 'ameaças do tipo X' genérico. " +
      "threatMemberSname: o sname EXATO (dos listados acima, ex: SPECIES_CHARIZARD) do integrante que você citou " +
      "em threats como quem segura a ameaça - vazio se threats não citar nenhum chefão real. Se getRemainingBosses " +
      "vier vazio (nada mais falta no jogo), aí sim fale em termos gerais de tipo/estratégia em threats e deixe " +
      "threatMemberSname vazio. Não invente golpe/habilidade/item fora do que foi listado acima - se não tiver " +
      "certeza de algo, seja mais genérico em vez de arriscar.";
  }
  // Nova tentativa só do campo "threats" quando ele não citou nenhum chefão real
  // (auditoria de 2026-09-18: o prompt exigia, mas nunca era conferido).
  function montarPromptAmeacas(members, remainingNames) {
    var teamList = descricaoTimeParaGuia(members);
    return "Você escreveu um guia de uso pra este time do Pokemon Elite Redux, mas o campo 'threats' não citou " +
            "nenhum chefão/líder real da lista abaixo, e a regra que você recebeu exigia isso.\n" +
            "Chefões/líderes que ainda faltam enfrentar: " + remainingNames.join(", ") + "\n" +
            "Time:\n" + teamList + "\n" +
            "Reescreva SÓ os campos threats e threatMemberSname (threats: 2-3 frases em português, cite pelo " +
            "menos um desses nomes exatos e diga qual integrante do time segura ele e por quê - tipo, golpe ou " +
            "stat real dele; threatMemberSname: o sname EXATO desse integrante). " +
            "Responda SOMENTE com {\"threats\":\"...\",\"threatMemberSname\":\"...\"}, sem texto ao redor.";
  }
  // Resposta do guia -> campos de texto limitados; threatMemberX só se o sname
  // for de um integrante REAL desta equipe (nunca confia no que a IA escreveu).
  function guiaDaResposta(raw, members) {
    if (!raw || typeof raw !== "object") return null;
    var snameParaX = {};
    members.forEach(function (sp) { snameParaX[sp.sname] = sp.x; });
    var pick = function (k) { return (typeof raw[k] === "string") ? raw[k].slice(0, 500) : ""; };
    return {
      concept: pick("concept"), opening: pick("opening"), development: pick("development"),
      winCondition: pick("winCondition"), threats: pick("threats"),
      threatMemberX: (typeof raw.threatMemberSname === "string" && snameParaX.hasOwnProperty(raw.threatMemberSname))
        ? snameParaX[raw.threatMemberSname] : null
    };
  }
  function guiaCitaChefaoReal(guia, remainingNames) {
    return !remainingNames.length || remainingNames.some(function (n) { return guia.threats.indexOf(n) !== -1; });
  }
