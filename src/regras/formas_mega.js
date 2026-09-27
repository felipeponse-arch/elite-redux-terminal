  // ===== src/regras/formas_mega.js =====
  // Família de formas (base <-> mega), modo de Mega Evolução, pedras e unidades de batalha.
  // Colado dentro do <script> principal do app por scripts/build.mjs (marcador
  // @regras formas_mega.js), no mesmo escopo do resto do código - sem module,
  // sem wrapper. Só lógica pura: nada aqui lê a página (item D1 da pauta
  // técnica, 2026-09-16), o que permite carregar este arquivo no Node pros
  // testes unitários (tests/unit/).

  // Família de formas (2026-09-16, pedido do usuário: "quando o Poke entra no
  // time ou na box deve considerar que ele pode tanto ter a forma normal
  // quanto a forma mega - isso também deve se estender a todos os raciocínios
  // que usam as duas bases como referência"). Mega/Primal é a MESMA criatura
  // que o jogador já tem, não uma captura nova - então qualquer leitura de
  // time/caixa precisa enxergar as duas. Liga nos dois sentidos: da base
  // chega nas megas (evoluções EVO_*MEGA*/PRIMAL do dado), e de uma mega
  // colocada direto no roster chega de volta na base.
  // Nunca mistura dado ENTRE formas (habilidade de uma com golpe de outra) -
  // foi exatamente isso que gerou 29 builds inválidas em 2026-09-16. Cada
  // forma continua sendo avaliada com o próprio dado; a família só diz
  // "estas são as opções desta criatura".
  var MEGA_BASE_BY_X = Object.create(null);
  function isMegaEvoKind(kindIdx) {
    var k = EVOKINDS[kindIdx];
    return EVO_MEGA_KINDS.indexOf(k) !== -1 || k === EVO_PRIMAL;
  }
  SPECIES.forEach(function (s) {
    (s.ev || []).forEach(function (ev) {
      if (isMegaEvoKind(ev[0]) && SPECIES_BY_X[ev[2]]) MEGA_BASE_BY_X[ev[2]] = s.x;
    });
  });
  function megaFormsOf(sp) {
    if (!sp) return [];
    return (sp.ev || []).filter(function (ev) { return isMegaEvoKind(ev[0]); })
      .map(function (ev) { return getSpeciesByX(ev[2]); })
      .filter(function (m) { return m && m.x !== sp.x; });
  }
  // Trecho de prompt: ", outras formas: Mega Charizard X (SPECIES_..., Fire/Dragon, Vel 100, innates ...)".
  // Cada forma com o próprio dado, nunca misturado.
  function formFamilyPromptNote(sp) {
    var others = battleFamilyOf(sp).filter(function (f) { return f.x !== sp.x; });
    if (!others.length) return "";
    return ", outras formas desta MESMA criatura (cada uma com dado proprio, nunca misture): " + others.map(function (f) {
      var r = SPECIES_RANK[f.sname];
      var stones = stonesOf(f);
      return f.n + " [sname " + f.sname + ", " + speciesTypeNames(f).join("/") + ", status base " + f.b.join("/") +
        (r ? ", rank " + r.tier : "") +
        ", habilidades escolhiveis: " + uniqueIds(f.ab).map(function (id) { return ABILITIES[id][0]; }).join(", ") +
        ", innate: " + f.inn.map(function (id) { return ABILITIES[id][0]; }).join(", ") +
        (stones.length ? ", pedra: " + stones.join(" ou ") : "") + "]";
    }).join("; ");
  }
  // Regra do modo de mega pra qualquer prompt que raciocine sobre time/caixa.
  function megaModePromptLine() {
    return megaMode() === "permanente"
      ? "MODO DE MEGA EVOLUCAO: PERMANENTE - o Pokemon fica na forma mega depois da batalha, ate o jogador trocar a forma manualmente fora da batalha. Base e mega sao escolhas separadas e trocaveis entre lutas; a pedra so e necessaria na primeira mega (depois o slot de item fica livre)."
      : "MODO DE MEGA EVOLUCAO: TEMPORARIA (padrao) - o Pokemon volta a forma base ao fim de CADA batalha. Toda luta comeca na forma base (habilidades de entrada, tipos e status da base valem ao entrar) e so depois vira mega; a pedra mega ocupa o slot de item o tempo todo. Avalie a criatura pelas DUAS formas juntas.";
  }
  function formFamilyOf(sp) {
    if (!sp) return [];
    var baseX = MEGA_BASE_BY_X[sp.x];
    var base = baseX !== undefined ? getSpeciesByX(baseX) : sp;
    return [base].concat(megaFormsOf(base));
  }
  function isMegaForm(sp) { return !!sp && MEGA_BASE_BY_X[sp.x] !== undefined; }

  // Modo de Mega Evolução (regra de jogo passada pelo usuário, 2026-09-16) -
  // o jogo tem DOIS modos e eles mudam o raciocínio:
  //   - Temporária (padrão): o Pokémon volta à forma base ao fim de cada
  //     batalha. Toda luta começa na base e vira mega no meio - então a
  //     criatura precisa ser avaliada pelas DUAS formas juntas, e a pedra
  //     ocupa o slot de item o tempo todo.
  //   - Permanente: fica mega até o jogador trocar a forma manualmente fora
  //     da batalha. Cada forma é uma escolha separada (e trocável), e a pedra
  //     só é necessária na primeira mega - o slot fica livre depois.
  function megaMode() { return state.settings.megaMode === "permanente" ? "permanente" : "temporaria"; }

  // Trava de progresso (regra de jogo passada pelo usuário, 2026-09-20: "as
  // [pedras mega] só são obtidas após a quarta insígnia" - achado real: o
  // app estava sugerindo mega no time/caixa mesmo ANTES da primeira
  // insígnia). Mesmo índice de milestone já usado em GYM_LEADER_MILESTONE.Flannery
  // (artifact_template.html) - Flannery é o 4º líder, cuja vitória concede
  // "Heat Badge (4o ginasio)" (LEVELCAPS.rows[4]); bate com a própria
  // data/how_to_obtain.json ("Depois de vencer Flannery (4o ginasio)... Mystery
  // Gift"), mesmo gatilho de progresso usado pra outros desbloqueios do hack.
  // Só afeta o que conta como "disponível pra lutar agora" (battleUnitsOf) -
  // a Dex continua mostrando a evolução mega normalmente, é só informação.
  var MEGA_UNLOCK_MILESTONE = 4;
  function megaEvolutionUnlocked() { return state.settings.milestone >= MEGA_UNLOCK_MILESTONE; }

  // Pedras que só aparecem mais tarde (2026-09-27, pedido do usuário: "tem
  // algumas mega evoluções que só são liberadas quando a gente ganha da Tate e
  // da Liza"). Não está no dado do NextDex nem nas páginas oficiais; vem do
  // Discord oficial (comunidade, versão 2.65): a Haxorusite é a luta contra o
  // Totem Haxorus no Meteor Falls, liberada depois do 7º ginásio (Nash Gold,
  // 27/04/2026); Dragoninite Y e Gyaradosite Y foram incluídas por decisão do
  // usuário (citadas junto por quem tinha acabado de vencer a Tate & Liza, sem
  // confirmação). Valor = etapa (índice de levelcaps.json) em que a pedra libera.
  var MEGA_PEDRAS_TARDIAS = { "Haxorusite": 7, "Dragoninite Y": 7, "Gyaradosite Y": 7 };
  var ROTULO_ETAPA_MEGA = { 4: "4ª insígnia (Flannery)", 7: "7ª insígnia (Tate & Liza)" };
  // Etapa em que esta forma Mega fica disponível: a da pedra, se for tardia.
  function etapaDaMega(megaSp) {
    return stonesOf(megaSp).reduce(function (et, pedra) {
      return Math.max(et, MEGA_PEDRAS_TARDIAS[pedra] || MEGA_UNLOCK_MILESTONE);
    }, MEGA_UNLOCK_MILESTONE);
  }
  function megaFormLiberada(f) { return !isMegaForm(f) || state.settings.milestone >= etapaDaMega(f); }
  function rotuloEtapaDaMega(megaSp) {
    var et = etapaDaMega(megaSp);
    return ROTULO_ETAPA_MEGA[et] || (LEVELCAPS && LEVELCAPS.rows[et] ? LEVELCAPS.rows[et].milestone : "etapa " + et);
  }

  // Achado do usuário (print, 2026-09-24): com a insígnia em "Knuckle Badge (2o
  // ginásio)", a caixa tinha "Altaria Mega" (SS) e a sugestão de time a tratava
  // como opção real. A trava de battleUnitsOf só cobria a avaliação de duelo;
  // a sugestão de time por IA, os prompts de build e o roster ainda enxergavam
  // as formas mega. Toda leitura do que o jogador PODE USAR agora passa por
  // estas três funções, nunca por formFamilyOf() direto.
  //   battleFamilyOf   - as formas utilizáveis (antes da 4ª insígnia, só a base);
  //   usableSpeciesFor - a criatura que vale de fato: uma forma Mega que já está
  //                      no time/caixa antes de liberar conta como a base dela;
  //   megaPromptBlock  - o trecho de prompt sobre Mega (ou o aviso de que ainda
  //                      não existe pro jogador).
  // Cada forma Mega conta só depois da etapa da pedra dela (megaFormLiberada) -
  // a maioria na 4ª insígnia, as de MEGA_PEDRAS_TARDIAS depois.
  function battleFamilyOf(sp) {
    return formFamilyOf(sp).filter(function (f, i) { return i === 0 || megaFormLiberada(f); });
  }
  function usableSpeciesFor(sp) {
    if (!sp) return sp;
    return (isMegaForm(sp) && !megaFormLiberada(sp)) ? formFamilyOf(sp)[0] : sp;
  }
  function megaPromptBlock(sp) {
    var megas = megaFormsOf(sp);
    if (!megas.length && !isMegaForm(sp)) return "";
    if (!megaEvolutionUnlocked() && !isMegaForm(sp)) {
      return "MEGA EVOLUCAO: AINDA NAO DISPONIVEL - o jogador so consegue Mega Evolucao depois da 4a insignia (Flannery) e agora NAO tem essa opcao. " +
        "NAO considere, cite nem recomende nenhuma forma mega nem pedra mega nesta resposta; avalie so a forma base.";
    }
    var travadas = isMegaForm(sp) ? [] : megas.filter(function (m) { return !megaFormLiberada(m); });
    if (travadas.length && travadas.length === megas.length) {
      return "MEGA EVOLUCAO DESTA ESPECIE: AINDA NAO DISPONIVEL - a pedra so aparece depois da " + rotuloEtapaDaMega(travadas[0]) +
        ". NAO considere, cite nem recomende a forma mega nem a pedra nesta resposta; avalie so a forma base.";
    }
    return megaModePromptLine() + (travadas.length
      ? " Ainda travada(s) pro jogador (pedra so depois de uma insignia futura): " + travadas.map(function (m) { return m.n + " (" + rotuloEtapaDaMega(m) + ")"; }).join(", ") + " - nao recomende."
      : "");
  }

  // Pedras de cada forma mega, a partir de data/mega_forms.json (pedra ->
  // forma, cruzado com o fork de Showdown do próprio jogo). Não usa o código
  // de item da evolução no dado bruto: em 19 megas ele não bate com o nome do
  // item (ex: ITEM_VENUSAURITE vs "Venusaurite X"/"Venusaurite Y").
  var STONES_BY_MEGA_SNAME = Object.create(null);
  Object.keys(MEGA_FORMS).forEach(function (stone) {
    if (ITEMS.indexOf(stone) === -1) return;
    var sn = MEGA_FORMS[stone];
    (STONES_BY_MEGA_SNAME[sn] = STONES_BY_MEGA_SNAME[sn] || []).push(stone);
  });
  function stonesOf(megaSp) { return (megaSp && STONES_BY_MEGA_SNAME[megaSp.sname]) || []; }

  // Como a criatura realmente LUTA, conforme o modo. Cada "unidade" tem as
  // formas que ela ocupa numa mesma batalha (`forms`) e a forma principal
  // (`main`, a que dá nome e rank):
  //   - permanente: uma unidade por forma (base OU mega - o jogador escolhe);
  //   - temporária: a base sozinha (sem mega-evoluir) e, pra cada mega,
  //     base+mega juntas (entra base, termina mega).
  // Cada forma continua avaliada com o próprio dado - a unidade só diz quais
  // formas contam juntas.
  function battleUnitsOf(owned) {
    // Antes da 4ª insígnia, mega evolução não existe pro jogador de verdade -
    // nenhuma unidade de batalha considera a(s) forma(s) mega (ver
    // megaEvolutionUnlocked acima): battleFamilyOf reduz a família só à base,
    // exatamente como uma criatura sem nenhuma linha de mega.
    var fam = battleFamilyOf(owned);
    if (!fam.length) return [];
    var base = fam[0];
    var megas = fam.slice(1);
    if (megaMode() === "permanente") return fam.map(function (f) { return { forms: [f], main: f, owned: owned }; });
    return [{ forms: [base], main: base, owned: owned }].concat(megas.map(function (m) {
      return { forms: [base, m], main: m, owned: owned };
    }));
  }
  // Multiplicador de um tipo de ataque contra a unidade: o PIOR entre as
  // formas dela - no modo temporário a criatura passa parte da luta em cada.
  function unitTypeMult(unit, atk) {
    var worst = null;
    unit.forms.forEach(function (f) {
      var m = abilityTypeMod(atk, f).mult;
      if (worst === null || m > worst) worst = m;
    });
    return worst;
  }
