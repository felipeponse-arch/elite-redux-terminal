// Guarda de publicação (todas-as-lutas/02): data/lutas_comuns_run.json só pode ir para o app se vier do rank COMPLETO.
// O arquivo de amostra (calcular_rank_v2.mjs --amostra=N) tem `amostra` diferente de 1; commit normal passa, publicar não.
export function problemaDasLutasComuns(dado) {
  if (!dado || dado.amostra !== 1) return `data/lutas_comuns_run.json é provisório (amostra ${dado ? dado.amostra : "ausente"}): rode node scripts/calcular_rank_v2.mjs --gravar antes de publicar.`;
  return null;
}
