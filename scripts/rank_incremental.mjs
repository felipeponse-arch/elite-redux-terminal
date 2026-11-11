// Rank incremental (06/11/2026, decisão do usuário: atualização recalcula SÓ O QUE MUDOU).
// Cada espécie tem uma impressão digital dos insumos dela; o cache guarda a medição e a digital em que foi feita.
// A digital GLOBAL cobre tudo que vale para todas as espécies (lutas dos chefões, level caps, itens, regra do rank).
// Funções puras: calcular_rank_v2.mjs só liga isto ao disco e aos núcleos.
import { createHash } from "node:crypto";

// Sobe à mão quando a regra do motor/rank muda DE PROPÓSITO (golpe, habilidade, item, fórmula da nota): força recalcular tudo.
export const RANK_REGRA_VERSAO = 1;

export const hash = (obj) => createHash("sha1").update(JSON.stringify(obj)).digest("hex").slice(0, 16);

// Insumos de UMA espécie: stats, tipos, habilidades e inatas (com o texto/dado de cada uma), golpes aprendidos/tutor (com o dado de
// cada golpe), formas e a Etapa em que ela aparece. Texto da Dex (d), evolução e encontros não entram: não mudam a nota.
// dados = { MOVES, ABILITIES } (indexados por id).
export function digitalDaEspecie(sp, etapa, dados) {
  const golpes = Array.from(new Set((sp.lm || []).map((p) => p[1]).concat(sp.tu || [])));
  const habs = Array.from(new Set((sp.ab || []).concat(sp.inn || [])));
  return hash({ b: sp.b, t: sp.t, ab: sp.ab, inn: sp.inn, lm: sp.lm, tu: sp.tu, frm: sp.frm, etapa,
    mv: golpes.map((id) => dados.MOVES[id]), hb: habs.map((id) => dados.ABILITIES[id]) });
}

// Insumos comuns: `partes` = { nome: qualquer JSON } (lutas dos chefões já montadas, level caps, arquivos de config...).
export function digitalGlobal(partes, regra = RANK_REGRA_VERSAO) {
  return hash({ regra, partes: Object.fromEntries(Object.keys(partes).sort().map((k) => [k, hash(partes[k])])) });
}

// cache = { global, especies: { sname: { digital, res } } } ou null.
// atuais = { sname: digital }. Devolve { recalcular, manter, motivo }.
// so (lista de snames, 11/11/2026): recalcula SÓ essas e mantém o resto do cache como está (estudo de um ajuste de regra; sem cache válido, erro).
export function decidir(cache, globalAtual, atuais, { tudo = false, so = null } = {}) {
  const snames = Object.keys(atuais);
  if (tudo) return { recalcular: snames, manter: [], motivo: "--tudo" };
  if (so) {
    if (!cache || !cache.especies || cache.global !== globalAtual) throw new Error("--so exige cache válido (digital global igual)");
    const alvo = new Set(so), fora = snames.filter((x) => !alvo.has(x)), estranhas = so.filter((x) => !(x in atuais));
    if (estranhas.length) throw new Error("--so: espécie desconhecida: " + estranhas.slice(0, 3).join(","));
    const semCache = fora.filter((x) => !cache.especies[x]);
    if (semCache.length) throw new Error("--so: sem medição no cache para " + semCache.slice(0, 3).join(","));
    return { recalcular: snames.filter((x) => alvo.has(x)), manter: fora, motivo: "--so" };
  }
  if (!cache || !cache.especies) return { recalcular: snames, manter: [], motivo: "sem cache" };
  if (cache.global !== globalAtual) return { recalcular: snames, manter: [], motivo: "digital global mudou" };
  const recalcular = [], manter = [];
  for (const s of snames) (cache.especies[s] && cache.especies[s].digital === atuais[s] ? manter : recalcular).push(s);
  return { recalcular, manter, motivo: recalcular.length ? "espécies novas ou mudadas" : "nada mudou" };
}

// Medição enxuta para o cache: o rank só usa a média do Battle Rating de cada luta (notasComFatia), então guardar a média
// (6 casas) por luta basta. Tanto o cálculo novo quanto o cache passam por aqui, para o incremental dar o mesmo que o completo.
const r6 = (v) => Math.round(v * 1e6) / 1e6;
export function reduzirMedicao(res, difs) {
  if (!res) return null;
  const out = { etapa: res.etapa };
  for (const d of difs) {
    const r = res[d];
    out[d] = r ? { set: r.set, ab: r.ab, golpes: r.golpes, eixos: Object.fromEntries(Object.entries(r.eixos).map(([eixo, lista]) =>
      [eixo, lista.map((e) => r6(e.brs.reduce((a, v) => a + v, 0) / e.brs.length))])) } : null;
  }
  return out;
}
// Volta ao formato que notas() lê: eixos[eixo] = [{ luta, brs: [média] }], nas lutas cobertas pela Etapa (a mesma regra do avaliar).
export function expandirMedicao(red, lutasPorDif) {
  if (!red) return null;
  const out = { etapa: red.etapa };
  for (const d of Object.keys(lutasPorDif)) {
    const r = red[d];
    if (!r) { out[d] = null; continue; }
    const cobertas = lutasPorDif[d].filter((l) => l.etapa >= red.etapa);
    out[d] = { set: r.set, ab: r.ab, golpes: r.golpes, eixos: Object.fromEntries(Object.entries(r.eixos).map(([eixo, ms]) =>
      [eixo, ms.map((m, i) => ({ luta: cobertas[i].nome, brs: [m] }))])) };
  }
  return out;
}
