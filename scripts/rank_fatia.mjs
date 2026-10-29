// Rank com fatia fixa de peso (ticket todas-as-lutas/02, decisão do usuário em 16/10/2026): chefões 60% e lutas comuns 40%.
// Sem a fatia as 538 lutas comuns pesariam 95% da nota e os 29 chefões 5% (estudo.md §4). Cada fatia mantém o peso por ameaça
// (PvPoke, iterado) DENTRO dela. Funções puras: calcular_rank_v2.mjs e o estudo de fatias leem daqui, então não há dois cálculos.
export const COMUNS_POR_ETAPA = 30; // Meu Time: as mais perigosas de cada etapa (pela ameaça medida no rank)

// lutas: [{ comum: bool }]; validos: [sname]; lista(s) -> [[índice da luta, média do Battle Rating]] (só as lutas cobertas).
// fatia: número em (0,1) = fatia dos chefões, ou null = todas as lutas no mesmo saco (o cálculo de antes da fatia).
// Devolve { nota: {sname: n}, pesoLuta: [n por luta] }.
export function notasComFatia(lutas, validos, lista, fatia, iteracoes = 4) {
  let pesoEsp = Object.fromEntries(validos.map((s) => [s, 1]));
  let pesoLuta = new Array(lutas.length).fill(0), nota = {};
  for (let it = 0; it < iteracoes; it++) {
    const soma = new Array(lutas.length).fill(0), peso = new Array(lutas.length).fill(0);
    for (const s of validos) for (const [i, m] of lista(s)) { soma[i] += pesoEsp[s] * (1 - m); peso[i] += pesoEsp[s]; }
    pesoLuta = soma.map((v, i) => (peso[i] ? v / peso[i] : 0));
    for (const s of validos) {
      const media = (filtro) => {
        let num = 0, den = 0;
        for (const [i, m] of lista(s)) if (filtro(i)) { num += pesoLuta[i] * m; den += pesoLuta[i]; }
        return den ? num / den : null;
      };
      if (fatia === null || fatia === undefined) nota[s] = media(() => true) || 0;
      else {
        // Espécie que só enfrenta uma das fatias (chega tarde, p.ex. depois de todas as comuns) fica com a nota dessa fatia.
        const nb = media((i) => !lutas[i].comum), nc = media((i) => lutas[i].comum);
        nota[s] = nb === null ? (nc || 0) : nc === null ? nb : fatia * nb + (1 - fatia) * nc;
      }
    }
    const med = validos.reduce((a, s) => a + nota[s], 0) / validos.length;
    pesoEsp = Object.fromEntries(validos.map((s) => [s, 0.5 + nota[s] / (2 * med)]));
  }
  return { nota, pesoLuta };
}

// As `porEtapa` lutas comuns mais perigosas de cada etapa (maior peso de ameaça). Desempate pelo nome: resultado reproduzível.
export function comunsMaisPerigosas(lutas, pesoLuta, porEtapa = COMUNS_POR_ETAPA) {
  const grupos = {};
  lutas.forEach((l, i) => { if (l.comum) (grupos[l.etapa] = grupos[l.etapa] || []).push({ nome: l.nome, etapa: l.etapa, peso: pesoLuta[i] }); });
  return Object.keys(grupos).map(Number).sort((a, b) => a - b)
    .flatMap((e) => grupos[e].sort((a, b) => b.peso - a.peso || (a.nome < b.nome ? -1 : 1)).slice(0, porEtapa));
}
