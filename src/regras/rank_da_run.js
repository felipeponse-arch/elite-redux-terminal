  // Rank v2 (2026-10-02, modelo aprovado pelo usuário - scripts/calcular_rank_v2.mjs):
  // cada espécie tem uma nota por dificuldade (time "party" dos chefões em Fácil/Ace,
  // time "insane" em Elite), cada uma com dois eixos (potencial e viabilidade) e o
  // rank por tipo. Este módulo é a única costura: troca tier/score/monoRanks de
  // SPECIES_RANK pela dificuldade da run, e quem já lê SPECIES_RANK não muda.
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
  function chaveDoRankDaDificuldade(dif) { return dif === "elite" ? "insane" : "party"; }
  function aplicarRankDaDificuldade(dif) {
    var k = chaveDoRankDaDificuldade(dif);
    Object.keys(SPECIES_RANK).forEach(function (s) {
      var r = SPECIES_RANK[s], d = r.porDificuldade && r.porDificuldade[k];
      if (!d) return;
      r.tier = d.tier; r.score = d.score;
      r.potencial = d.potencial; r.viabilidade = d.viabilidade;
      r.monoRanks = d.monoRanks;
      r.rankDaDificuldade = k;
    });
  }
  // Sem chamada na carga: aqui o state do app ainda não existe (o template o declara depois
  // das regras). O JSON já vem com a nota de Fácil/Ace (padrão); applySave e a troca de
  // dificuldade em Progresso chamam aplicarRankDaDificuldade.

  // Marca "Concorrência no tipo" do rank v2 (ponto 6, 2026-10-02): marca sem nota. Para
  // cada tipo da espécie, quantas do MESMO tipo a dominam (Pareto): potencial e
  // viabilidade maiores ou iguais, disponível na mesma etapa ou antes, e estritamente
  // melhor em pelo menos um dos três (senão duas formas idênticas se "dominariam").
  // Calculada por scripts/calcular_rank_v2.mjs no --gravar (porDificuldade.<dif>.dominadoPor);
  // aqui só a função pura, pra o script e os testes usarem a mesma.
  // lista: [{ s, tipos: [...], pot, via, etapa }] -> { s: { tipo: n } }
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
          return b !== a && b.pot >= a.pot && b.via >= a.via && b.etapa <= a.etapa &&
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
