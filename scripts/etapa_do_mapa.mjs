// Resolvedor único de mapa do jogo -> etapa da run (índice de levelcaps.json), compartilhado pelo rank de
// disponibilidade (gerar_rank_disponibilidade.mjs) e pelo "onde achar" dos itens (gerar_onde_achar_itens.mjs).
// Ordem: nome exato na planilha "Mono earliest locations" (data/mono_disponibilidade.json), depois o prefixo
// conhecido mais longo (ROUTE111SUNHOLLOWRUINS -> ROUTE111), depois a ordem da história
// (data/disponibilidade_regras.json, mapasPelaHistoria). undefined = sem etapa conhecida.

export const chaveDoMapa = (t) => String(t || "").replace(/\(.*?\)/g, "").replace(/^MAP_/, "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();

export function etapaDoLocalDaPlanilha(mono) {
  const etapaDoLocal = {};
  for (const lista of Object.values(mono.porTipo)) {
    for (const e of lista) {
      if (/dexnav/i.test(e.l)) continue; // DexNav é sempre a última etapa, não diz nada do mapa
      const k = chaveDoMapa(e.l);
      if (etapaDoLocal[k] === undefined || e.e < etapaDoLocal[k]) etapaDoLocal[k] = e.e;
    }
  }
  return etapaDoLocal;
}

export function criarEtapaDoMapa(mono, regras, posJogo) {
  const etapaDoLocal = etapaDoLocalDaPlanilha(mono);
  const historia = Object.fromEntries(Object.entries(regras.mapasPelaHistoria).filter(([k]) => k !== "nota")
    .map(([k, v]) => [k, v === "pos-jogo" ? posJogo : v]));
  return function etapaDoMapa(nome) {
    const k = chaveDoMapa(nome);
    if (etapaDoLocal[k] !== undefined) return etapaDoLocal[k];
    const pref = Object.keys(etapaDoLocal).filter((p) => p.length >= 6 && k.startsWith(p)).sort((a, b) => b.length - a.length)[0];
    if (pref) return etapaDoLocal[pref];
    const h = Object.keys(historia).find((p) => k.startsWith(p));
    return h ? historia[h] : undefined;
  };
}
