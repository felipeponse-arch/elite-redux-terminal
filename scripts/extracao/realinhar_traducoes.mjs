// Realinha data/ability_translations_pt.json ao dex novo POR NOME da habilidade (nunca por id): quando a versão do jogo
// desloca ids (ex.: Mighty Horn 391 -> 390), o texto PT tem que acompanhar a habilidade, não o número.
// Regra do projeto: a fonte é o dado do jogo; a tradução PT é só enfeite e cai no inglês quando falta.
// Uso: node scripts/extracao/realinhar_traducoes.mjs <dex_antigo.json> <pt_antigo.json> [dex_novo.json] [pt_saida.json]
// Depois rode scripts/extracao/expandir_compostas.mjs para refazer as habilidades compostas ("A + B").
import { readFileSync, writeFileSync } from "node:fs";

// Habilidades cujo EFEITO mudou na versão nova (conferido à mão contra a descrição inglesa antiga x nova, 15/10/2026):
// a tradução antiga mostraria um efeito errado, então ficam SEM entrada e o app cai no inglês, que é o dado certo.
export const EFEITO_MUDOU = new Set([
  "Oblivious", "Illuminate", "Aftermath", "Friend Guard", "Heavy Metal", "Justified", "Perish Body", "Lead Coat",
  "Poison Absorb", "Weather Control", "Pyro Shells", "Parry", "Jaws of Carnage", "Chrome Coat", "Sharp Edges",
  "Lawnmower", "Low Visibility", "JunshiSanda", "Corrupted Mind", "Madness Enhancement", "Toxic Surge", "Chokehold",
  "Purple Haze", "Hyper Cleanse", "Chuckster", "Soul Harvest", "Drop Blocks", "Zen Garden", "Break it Down",
  "Drakelp Head", "Feathercoat", "Growing Tooth", "Hardened Sheath", "Cryo Architect", "Best Offense", "Magus Blades",
]);

// Devolve { pt, novas, renomeadas, descartadas } — pt é o mapa id -> texto PT já alinhado ao dex novo.
// porNome: { nome inglês -> texto PT } vindo de data/traducoes_novas_por_nome.json e data/traducoes_v07_por_nome.json;
// vale para todo id com esse nome e tem precedência sobre o texto antigo (cobre as de efeito mudado e as novas).
export function realinhar(dexAntigo, ptAntigo, dexNovo, ptAtual = {}, porNome = {}) {
  const ocorrencias = new Map(); // nome -> [ids antigos, em ordem]
  dexAntigo.abilities.forEach((a, i) => { if (!ocorrencias.has(a[0])) ocorrencias.set(a[0], []); ocorrencias.get(a[0]).push(i); });
  const nomesNovos = new Set(dexNovo.abilities.map((a) => a[0]));
  const vistos = new Map();
  const pt = {}, novas = [], renomeadas = [], descartadas = [];
  dexNovo.abilities.forEach((a, i) => {
    if (i === 0) return;
    const n = a[0];
    if (porNome[n]) { pt[String(i)] = porNome[n]; vistos.set(n, (vistos.get(n) || 0) + 1); return; }
    const k = vistos.get(n) || 0; vistos.set(n, k + 1);
    let antigo = (ocorrencias.get(n) || [])[k];
    if (antigo === undefined) {
      // renomeada: mesmo id, o nome antigo sumiu da versão nova e a descrição inglesa é a mesma
      const o = dexAntigo.abilities[i];
      if (o && !nomesNovos.has(o[0]) && o[1] === a[1]) { antigo = i; renomeadas.push(o[0] + " -> " + n); }
    }
    if (antigo === undefined) {
      novas.push(i + ":" + n);
      if (i >= dexAntigo.abilities.length && ptAtual[String(i)]) pt[String(i)] = ptAtual[String(i)]; // composta nova, o expansor refaz
      return;
    }
    if (EFEITO_MUDOU.has(n)) { descartadas.push(i + ":" + n); return; }
    if (ptAntigo[String(antigo)]) pt[String(i)] = ptAntigo[String(antigo)];
  });
  return { pt, novas, renomeadas, descartadas };
}

if ((process.argv[1] || "").endsWith("realinhar_traducoes.mjs")) {
  const [antD, antP, novD = "data/dex_compact.json", saida = "data/ability_translations_pt.json"] = process.argv.slice(2);
  if (!antD || !antP) { console.error("uso: node scripts/extracao/realinhar_traducoes.mjs <dex_antigo> <pt_antigo> [dex_novo] [pt_saida]"); process.exit(1); }
  const ler = (f) => JSON.parse(readFileSync(f, "utf8"));
  let atual = {}; try { atual = ler(saida); } catch { /* sem arquivo atual */ }
  const porNome = {};
  for (const f of ["data/traducoes_v07_por_nome.json", "data/traducoes_novas_por_nome.json"]) { try { Object.assign(porNome, ler(f)); } catch { /* sem arquivo */ } }
  const r = realinhar(ler(antD), ler(antP), ler(novD), atual, porNome);
  writeFileSync(saida, JSON.stringify(r.pt));
  console.log("realinhar_traducoes.mjs: " + Object.keys(r.pt).length + " traduções; novas sem tradução " + r.novas.length + "; renomeadas " + r.renomeadas.length + "; descartadas por efeito mudado " + r.descartadas.length);
}
