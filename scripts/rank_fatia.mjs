// Nota do rank por espécie (ticket todas-as-lutas/02). Desde 06/11/2026 só as 29 lutas de chefão entram, todas no mesmo saco:
// a fatia 60/40 e as lutas comuns saíram. Cada luta pesa pela ameaça (PvPoke, iterado), e cada espécie pesa pela própria nota.
// Função pura: calcular_rank_v2.mjs lê daqui, então não há dois cálculos.

// nLutas: quantidade de lutas; validos: [sname]; lista(s) -> [[índice da luta, média do Battle Rating]] (só as lutas cobertas).
// Devolve { nota: {sname: n}, pesoLuta: [n por luta] }.
export function notasComFatia(nLutas, validos, lista, iteracoes = 4) {
  let pesoEsp = Object.fromEntries(validos.map((s) => [s, 1]));
  let pesoLuta = new Array(nLutas).fill(0), nota = {};
  for (let it = 0; it < iteracoes; it++) {
    const soma = new Array(nLutas).fill(0), peso = new Array(nLutas).fill(0);
    for (const s of validos) for (const [i, m] of lista(s)) { soma[i] += pesoEsp[s] * (1 - m); peso[i] += pesoEsp[s]; }
    pesoLuta = soma.map((v, i) => (peso[i] ? v / peso[i] : 0));
    for (const s of validos) {
      let num = 0, den = 0;
      for (const [i, m] of lista(s)) { num += pesoLuta[i] * m; den += pesoLuta[i]; }
      nota[s] = den ? num / den : 0;
    }
    const med = validos.reduce((a, s) => a + nota[s], 0) / validos.length;
    pesoEsp = Object.fromEntries(validos.map((s) => [s, 0.5 + nota[s] / (2 * med)]));
  }
  return { nota, pesoLuta };
}
