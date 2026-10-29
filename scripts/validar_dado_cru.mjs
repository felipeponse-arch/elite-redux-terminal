// Validação do dado CRU do NextDex (lote 2, 2026-10-06). Roda ANTES do
// transform: se o upstream mudar de formato ou vier truncado, falha aqui, em vez
// de o transform derivar lixo que só aparece como conselho errado na tela.
// (validar_dados.mjs cobre o dado DERIVADO; este cobre o que chega de fora.)
//
// Uso: node scripts/validar_dado_cru.mjs [arquivo.json[.gz]]   (padrão: data/gameData.json)
//      npm run validar:cru
// Referências no gameData: habilidades/golpes por `id`; espécies e itens dos times
// por POSIÇÃO no array (species[i], items[i]). in:-1 em evolução = megapedra sem
// alvo, existe no dado oficial e é aceito.
import { fileURLToPath } from "node:url";
import path from "node:path";
import { lerGameData } from "./diff_versoes.mjs";

// Piso de contagens da 2.65beta (~10% de folga): upstream que encolhe além disso veio truncado.
export const MINIMOS = { abilities: 930, moves: 930, species: 1700, items: 830, trainers: 800, mapsT: 500, typeT: 21 };
const LISTAS = ["abilities", "moves", "species", "items", "trainers", "typeT", "effT", "mapsT"];

const unicos = (arr, chave) => arr.length - new Set(arr.map((x) => x[chave])).size;

export function validarDadoCru(g, minimos = MINIMOS) {
  const erros = [];
  const e = (m) => erros.length < 40 && erros.push(m);
  if (!g || typeof g !== "object") return ["arquivo não é um objeto JSON"];
  for (const k of LISTAS) if (!Array.isArray(g[k])) e(`campo "${k}" sumiu ou deixou de ser lista`);
  if (erros.length) return erros; // sem as listas, o resto não faz sentido
  for (const [k, min] of Object.entries(minimos)) if (g[k].length < min) e(`${k}: ${g[k].length} itens, abaixo do piso ${min} (dado truncado?)`);

  for (const [k, campo] of [["abilities", "id"], ["moves", "id"], ["species", "id"], ["species", "NAME"], ["items", "id"]]) {
    const d = unicos(g[k], campo);
    if (d) e(`${k}: ${d} ${campo} duplicado(s)`);
  }
  const ab = new Set(g.abilities.map((a) => a.id)), mv = new Set(g.moves.map((m) => m.id));
  const nEsp = g.species.length, nItem = g.items.length, nTipo = g.typeT.length;
  const ok = (v, n) => Number.isInteger(v) && v >= 0 && v < n;
  const cont = {};
  const falha = (tipo, msg) => { cont[tipo] = (cont[tipo] ?? 0) + 1; if (cont[tipo] <= 3) e(msg); };

  for (const m of g.moves) {
    if (typeof m.name !== "string" || !m.name) falha("golpe sem nome", `golpe id ${m.id} sem nome`);
    if (!Number.isFinite(m.pwr) || m.pwr < 0 || m.pwr > 400) falha("pwr", `golpe ${m.name}: pwr ${m.pwr} fora de 0-400`);
    for (const t of m.types ?? []) if (!ok(t, nTipo)) falha("tipo de golpe", `golpe ${m.name}: tipo ${t} inexistente`);
  }
  for (const a of g.abilities) if (typeof a.name !== "string" || !a.name) falha("hab sem nome", `habilidade id ${a.id} sem nome`);
  for (const s of g.species) {
    const st = s.stats;
    if (!st || !Array.isArray(st.base) || st.base.length !== 6 || st.base.some((v) => !Number.isFinite(v) || v < 0 || v > 255))
      { falha("stats", `${s.NAME}: stats base inválidos`); continue; }
    for (const t of st.types) if (!ok(t, nTipo)) falha("tipo de espécie", `${s.NAME}: tipo ${t} inexistente`);
    for (const a of [...st.abis, ...st.inns]) if (a && !ab.has(a)) falha("habilidade fantasma", `${s.NAME}: habilidade id ${a} não existe`);
    for (const m of s.levelUpMoves ?? []) if (!mv.has(m.id)) falha("golpe fantasma", `${s.NAME}: golpe id ${m.id} não existe`);
    for (const ev of s.evolutions ?? []) if (ev.in !== -1 && !ok(ev.in, nEsp)) falha("evolução", `${s.NAME}: evolui para posição ${ev.in} inexistente`);
  }
  for (const t of g.trainers) {
    for (const p of [...t.party, ...t.insane, ...t.hell, ...t.rem]) {
      if (!ok(p.spc, nEsp)) falha("time-espécie", `${t.name}: espécie ${p.spc} inexistente`);
      if (p.item && !ok(p.item, nItem)) falha("time-item", `${t.name}: item ${p.item} inexistente`);
      for (const m of p.moves ?? []) if (m && !mv.has(m)) falha("time-golpe", `${t.name}: golpe id ${m} não existe`);
    }
  }
  for (const [tipo, n] of Object.entries(cont)) if (n > 3) e(`... ${tipo}: ${n} ocorrências no total`);
  return erros;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const arq = process.argv[2] ?? path.join(raiz, "data", "gameData.json");
  const erros = validarDadoCru(lerGameData(arq));
  if (erros.length) { console.error(`validar_dado_cru: ${erros.length} problema(s) em ${arq}:\n- ${erros.join("\n- ")}`); process.exit(1); }
  console.log(`validar_dado_cru: OK (${arq})`);
}
