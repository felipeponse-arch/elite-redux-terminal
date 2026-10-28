  // Rank v2 (2026-10-02, modelo aprovado pelo usuário - scripts/calcular_rank_v2.mjs):
  // cada espécie tem uma nota por dificuldade (time "party" dos chefões em Fácil/Ace,
  // time "insane" em Elite), cada uma com dois eixos (potencial e viabilidade) e o
  // rank por tipo. Este módulo é a única costura: rankDe mostra tier/score/monoRanks de
  // SPECIES_RANK pela dificuldade da run, e quem lê o rank usa rankDe.
  //
  // Espécies fora do rank (só no pós-jogo, só no DexNav, sem fonte - data/rank_disponibilidade.json)
  // saem de SPECIES_RANK e ficam em FORA_DO_RANK com o motivo: o resto do app já trata
  // "sem rank" e a ficha mostra "não obtível".
  var FORA_DO_RANK = Object.create(null);
  Object.keys(SPECIES_RANK).forEach(function (s) {
    if (SPECIES_RANK[s] && SPECIES_RANK[s].foraDoRank) {
      FORA_DO_RANK[s] = SPECIES_RANK[s].foraDoRank;
      delete SPECIES_RANK[s];
    }
  });
  var MOTIVO_FORA_DO_RANK_PT = {
    "pos-jogo": "só dá pra pegar depois da Liga",
    dexnav: "só aparece no DexNav (liberado no fim do jogo)",
    "sem-fonte": "não achamos como pegar na run (forma só de batalha, de teste ou sem fonte)"
  };
  // Mapa próprio do rank (só existem as visões party e insane): Hell usa a insane, a mais difícil calculada. A tabela única mora em chefoes.js (TIER_DA_DIFICULDADE).
  function chaveDoRankDaDificuldade(dif) { return (TIER_DA_DIFICULDADE[dif] || TIER_DA_DIFICULDADE.easy).rank; }
  // ADR-003: o JSON de SPECIES_RANK não muda depois da carga. rankDe(sname) devolve a visão da Dificuldade da run
  // (state.settings.difficulty: tier, score, eixos, rank por tipo) por cima da entrada, lida a cada chamada: trocar a
  // Dificuldade ou carregar um save não precisa avisar ninguém, e teste que monta o state já enxerga a Nota certa.
  // É a ÚNICA leitura direta de SPECIES_RANK[...] do app (confere tests/unit/rank_so_por_rankde.test.mjs).
  var VISAO_DO_RANK = { party: Object.create(null), insane: Object.create(null) };
  function rankDe(sname) {
    var dif = typeof state !== "undefined" && state && state.settings ? state.settings.difficulty : "ace";
    var chave = chaveDoRankDaDificuldade(dif);
    var v = VISAO_DO_RANK[chave][sname];
    if (v) return v;
    var r = SPECIES_RANK[sname], d = r && r.porDificuldade && r.porDificuldade[chave];
    if (!r || !d) return r;
    v = Object.assign({}, r, { tier: d.tier, score: d.score, potencial: d.potencial, viabilidade: d.viabilidade,
      monoRanks: d.monoRanks, rankDaDificuldade: chave });
    VISAO_DO_RANK[chave][sname] = v;
    return v;
  }

  // Marca "Concorrência no tipo" do rank v2 (ponto 6, 2026-10-02): marca sem nota. Para
  // cada tipo da espécie, quantas do MESMO tipo a dominam (Pareto): potencial e
  // viabilidade maiores ou iguais, disponível na mesma etapa ou antes, e estritamente
  // melhor em pelo menos um dos três (senão duas formas idênticas se "dominariam").
  // Calculada por scripts/calcular_rank_v2.mjs no --gravar (porDificuldade.<dif>.dominadoPor);
  // aqui só a função pura, pra o script e os testes usarem a mesma.
  // lista: [{ s, tipos: [...], pot, via, etapa, familia }] -> { s: { tipo: n } }
  // `familia` (auditoria de 02/10): a própria Mega/Primal/forma da MESMA espécie não conta como
  // concorrente (ex.: Kingdra "dominado por 1 Dragon" que era só a Mega dela).
  function dominantesNoTipo(lista) {
    var porTipo = {}, out = {};
    lista.forEach(function (e) {
      out[e.s] = {};
      e.tipos.forEach(function (t) { (porTipo[t] = porTipo[t] || []).push(e); });
    });
    Object.keys(porTipo).forEach(function (t) {
      var grupo = porTipo[t];
      grupo.forEach(function (a) {
        out[a.s][t] = grupo.filter(function (b) {
          return b !== a && !(a.familia && b.familia === a.familia) && b.pot >= a.pot && b.via >= a.via && b.etapa <= a.etapa &&
            (b.pot > a.pot || b.via > a.via || b.etapa < a.etapa);
        }).length;
      });
    });
    return out;
  }
  // Dado da dificuldade da run (set, habilidade, dominadoPor) de uma entrada de SPECIES_RANK.
  function rankDaDificuldadeDe(r) {
    return (r && r.porDificuldade && r.porDificuldade[r.rankDaDificuldade || "party"]) || null;
  }
