// Peças do rank v2 que precisam de teste e de um lugar só (TK-21, 28/10/2026).
// Percentil e corte de tier moravam copiados em dois scripts (um deles, o rank antigo de nível 50, saiu do caminho).

// Percentil ordinal (posição / total, em %, 2 casas) de { chave: nota }; empate segue a ordem estável do sort.
export function percentis(obj) {
  const ks = Object.keys(obj).sort((a, b) => obj[a] - obj[b]), n = ks.length, p = {};
  ks.forEach((k, i) => { p[k] = Math.round(((i + 1) / n) * 10000) / 100; });
  return p;
}

// Cortes de tier por percentil.
export const tierDe = (p) => (p >= 97 ? "SS" : p >= 90 ? "S" : p >= 75 ? "A" : p >= 50 ? "B" : p >= 20 ? "C" : "D");

// Item do set só vale se existe pro jogador na Etapa da luta (decisão 8, mesma fonte única do Modo Motor: liberadoNaRun).
// `montar(item)` refaz a unidade com o item dado; item não liberado = sem item (""). Sem item no set, devolve a unidade como veio.
export function unidadeComItemLiberado(R, u, etapa, cap, montar) {
  if (!u.item || R.liberadoNaRun(etapa, cap, { item: u.item })) return u;
  return montar("");
}

// Campos que a nova nota herda da linha anterior de species_rank.json: estágio (vem de compute_species_rank.ps1). A nota em dupla saiu
// (decisão do usuário, 28/10/2026). Nenhum campo bst/duelo/habilidade do rank antigo passa para o rank v2.
export function camposHerdados(antigo) {
  const a = antigo || {}, out = {};
  for (const k of ["stage", "stageTier", "stageScore"]) if (a[k] !== undefined) out[k] = a[k];
  return out;
}
