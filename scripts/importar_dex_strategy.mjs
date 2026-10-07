// Importa para data/builds.json as estratégias oficiais por espécie do arquivo src/data/dex-strategy.md do código do jogo
// (repositório Elite-Redux/eliteredux-source; o projeto nunca tinha lido esse arquivo - achado da pesquisa profunda de 06/10).
// O arquivo mistura formatos (SPECIES_X ou "Nome", ".campo =" ou "campo =", itens/golpes/naturezas com "A / B", EVs em
// chaves ou soltos, ability por número + comentário). Cada set só entra se passar na MESMA conferência do validar_dados.mjs:
//   - a espécie existe no dex (cabeçalho ou .species);
//   - a habilidade é uma das ESCOLHÍVEIS da espécie (a innate não se escolhe);
//   - os 4 golpes são aprendidos pela espécie (lm + tu do dex_compact.json), sem repetir;
//   - o item existe no jogo; EVs com no máximo 252 por atributo e 510 no total; natureza real;
//   - sets só de dupla, "Troll" e "Showdown" ficam de fora (o app é 1x1 e as outras fontes não os usam);
//   - no máximo 3 builds por espécie, uma por estilo (ofensivo/equilibrado/defensivo), sem repetir uma que já existe.
// Onde o autor deu opções ("Life Orb / Shell Bell", "Quick Attack / Fake Out"), fica a primeira que a espécie realmente tem,
// como nas builds do Discord. Uso: node scripts/importar_dex_strategy.mjs <er-repo> [--gravar]
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { pathToFileURL } from "node:url";

const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const NATUREZAS = ["Hardy", "Lonely", "Brave", "Adamant", "Naughty", "Bold", "Docile", "Relaxed", "Impish", "Lax", "Timid", "Hasty", "Serious", "Jolly", "Naive", "Modest", "Mild", "Quiet", "Bashful", "Rash", "Calm", "Gentle", "Sassy", "Careful", "Quirky"];
const ROTULO_EV = ["HP", "Atk", "Def", "SpA", "SpD", "Spe"];

// ---------- 1. leitura do arquivo ----------
export function lerBlocos(texto) {
  const linhas = String(texto).split(/\r?\n/);
  const blocos = [];
  for (let i = 0; i < linhas.length; i++) {
    if (linhas[i].trim() !== "{") continue;
    let j = i - 1;
    while (j >= 0 && !linhas[j].trim()) j--;
    const cab = j >= 0 ? linhas[j].trim() : "";
    const campos = {};
    let k = i + 1;
    for (; k < linhas.length; k++) {
      const l = linhas[k];
      if (l.trim().startsWith("}")) break;
      const m = l.match(/^\s*\.?(name|lvl|species|heldItem|item|ability|ivs|evs|nature|moves|tags|comment)\s*=\s*(.*)$/i);
      if (m) campos[m[1].toLowerCase() === "helditem" ? "item" : m[1].toLowerCase()] = m[2].trim();
    }
    blocos.push({ cab, campos });
    i = k;
  }
  return blocos;
}

// ---------- 2. resolução de nomes ----------
export function montarIndice(dex, gameData) {
  const especies = new Map();
  for (const s of dex.species) {
    if (!s || !s.sname) continue;
    especies.set(norm(s.sname.replace(/^SPECIES_/, "")), s);
    if (s.n) especies.set(norm(s.n), s);
  }
  const habilidades = new Map(); // norm(nome) -> nome
  for (const a of dex.abilities) if (a && a[0]) habilidades.set(norm(a[0]), a[0]);
  const itens = new Map();
  for (const n of dex.items) if (n) itens.set(norm(n), n);
  const golpes = new Map();
  for (const m of dex.moves) if (m && m[0] && m[0] !== "-") golpes.set(norm(m[0]), m[0]);
  const nomeHab = (id) => (dex.abilities[id] && dex.abilities[id][0]) || null;
  const nomeMov = (id) => (dex.moves[id] && dex.moves[id][0]) || null;
  const aprendidos = new Map();
  for (const s of dex.species) {
    if (!s || !s.sname) continue;
    const set = new Set();
    for (const par of s.lm || []) { const n = nomeMov(par[1]); if (n) set.add(n); }
    for (const id of s.tu || []) { const n = nomeMov(id); if (n) set.add(n); }
    aprendidos.set(s.sname, set);
  }
  return { especies, habilidades, itens, golpes, nomeHab, aprendidos, gameData };
}

export function resolverEspecie(bloco, ind) {
  const dir = bloco.campos.species && bloco.campos.species.match(/SPECIES_[A-Z0-9_]+/);
  const tentativas = [];
  if (dir) tentativas.push(norm(dir[0].replace(/^SPECIES_/, "")));
  const cab = bloco.cab.replace(/^SPECIES_/, "");
  const palavras = cab.toLowerCase().split(/[\s_-]+/).filter(Boolean);
  tentativas.push(norm(cab));
  // "Mega Swalot" -> swalotmega; "charizard mega x" já fica charizardmegax
  if (palavras[0] === "mega" && palavras.length > 1) tentativas.push(norm(palavras.slice(1).join("") + "mega"));
  for (const t of tentativas) if (ind.especies.has(t)) return ind.especies.get(t);
  return null;
}

// ---------- 3. conversão de um bloco em build ----------
const primeiroDe = (txt) => String(txt).split("/")[0].trim();

export function converter(bloco, ind) {
  const c = bloco.campos;
  const rej = (motivo) => ({ ok: false, motivo, cab: bloco.cab, nome: c.name });
  const tags = String(c.tags || "").toLowerCase().split(/[,\s]+/).filter(Boolean);
  if (tags.includes("troll")) return rej("set de brincadeira (Troll)");
  if (tags.includes("showdown")) return rej("set marcado Showdown");
  if ((tags.includes("doubles") || tags.includes("double")) && !tags.includes("singles") && !tags.includes("single")) return rej("só de dupla");
  const sp = resolverEspecie(bloco, ind);
  if (!sp) return rej("espécie '" + bloco.cab + "' não encontrada no dex");
  // habilidade: número + comentário com as ABILITY_X da espécie, ou nome em texto
  let habNome = null;
  const rawAb = String(c.ability || "");
  const num = rawAb.match(/^\s*(\d)\s*[,;]?\s*(?:\/\/(.*))?$/);
  if (num) {
    const lista = ((num[2] || rawAb.split("//")[1] || "").match(/ABILITY_[A-Z0-9_]+/g) || []).map((x) => x.replace(/^ABILITY_/, ""));
    const alvo = lista[Number(num[1])];
    if (alvo) habNome = ind.habilidades.get(norm(alvo)) || null;
    if (!habNome && Number(num[1]) === 0) habNome = null;
  } else {
    habNome = ind.habilidades.get(norm(primeiroDe(rawAb.split("//")[0]))) || null;
  }
  if (!habNome) return rej("habilidade não reconhecida (" + rawAb.slice(0, 40) + ")");
  const escolhiveis = new Set((sp.ab || []).map((id) => ind.nomeHab(id)).filter(Boolean));
  if (!escolhiveis.has(habNome)) return rej("habilidade '" + habNome + "' não é escolhível em " + sp.sname);
  // item
  const opcoesItem = String(c.item || "").replace(/ITEM_/g, "").split(/\s*\/\s*/).map((x) => x.replace(/\/\/.*$/, "").replace(/[,;]+$/, "").trim()).filter(Boolean);
  let item = null;
  for (const o of opcoesItem) { const n = ind.itens.get(norm(o)); if (n) { item = n; break; } }
  if (!item) return rej("item não reconhecido (" + String(c.item || "").slice(0, 40) + ")");
  // natureza
  const nat = NATUREZAS.find((n) => norm(n) === norm(primeiroDe(String(c.nature || "").replace(/NATURE_/g, "")).split(/[,;]/)[0]));
  if (!nat) return rej("natureza não reconhecida (" + String(c.nature || "").slice(0, 30) + ")");
  // EVs
  const evNums = (String(c.evs || "").match(/\d+/g) || []).map(Number);
  if (evNums.length !== 6) return rej("EVs fora do formato de 6 números");
  if (evNums.some((n) => n > 252) || evNums.reduce((a, b) => a + b, 0) > 510) return rej("EVs acima do limite (252 por atributo, 510 no total)");
  const evs = evNums.map((n, i) => (n ? n + " " + ROTULO_EV[i] : "")).filter(Boolean).join(" / ");
  // golpes: vírgula separa os slots, "/" as opções; um pedaço que começa com "/" continua o slot anterior
  const pedacos = String(c.moves || "").replace(/MOVE_/g, "").split(",").map((x) => x.trim()).filter(Boolean);
  const slots = [];
  for (const p of pedacos) { if (p.startsWith("/") && slots.length) slots[slots.length - 1] += " " + p; else slots.push(p); }
  if (slots.length !== 4) return rej(slots.length + " slots de golpe em vez de 4");
  const ap = ind.aprendidos.get(sp.sname) || new Set();
  const golpes = [];
  const alternativas = [];
  for (const slot of slots) {
    const ops = slot.split("/").map((x) => x.trim()).filter(Boolean).map((o) => ind.golpes.get(norm(o)) || null);
    const bom = ops.find((n) => n && ap.has(n) && !golpes.includes(n));
    if (!bom) return rej("nenhum golpe do slot '" + slot.slice(0, 40) + "' é aprendido por " + sp.sname);
    golpes.push(bom);
    ops.filter((n) => n && n !== bom).forEach((n) => alternativas.push(n));
  }
  const estiloPref = tags.includes("defensive") ? "defensivo" : tags.includes("offensive") ? "ofensivo" : "equilibrado";
  const alt = [];
  if (opcoesItem.length > 1) alt.push("item " + opcoesItem.slice(1).join(" / "));
  if (alternativas.length) alt.push("golpe " + [...new Set(alternativas)].join(" / "));
  const nome = String(c.name || "").replace(/^[\s.]*|[\s.,]*$/g, "").replace(/\s+/g, " ");
  const note = "Set oficial do arquivo src/data/dex-strategy.md do código do jogo" + (nome ? " (\"" + nome + "\")" : "") +
    ", escrito pela comunidade/equipe e pode ser de uma versão anterior à 2.65; habilidade, golpes e item conferidos contra os dados 2.65beta." +
    (alt.length ? " Opções do autor que ficaram de fora: " + alt.join("; ") + "." : "");
  return { ok: true, sname: sp.sname, estiloPref, build: { ability: habNome, nature: nat, evs, item, moves: golpes, note, fonte: "dex-strategy-do-jogo", versao: "2.65beta" } };
}

// ---------- 4. junta com o builds.json ----------
const assinatura = (b) => [b.ability, b.item, [...b.moves].sort().join(",")].join("|");
export function juntar(buildsAtuais, convertidos) {
  const out = JSON.parse(JSON.stringify(buildsAtuais));
  const aceitos = [], recusados = [];
  for (const r of convertidos) {
    if (!r.ok) { recusados.push(r); continue; }
    const atual = out[r.sname] === undefined ? [] : Array.isArray(out[r.sname]) ? out[r.sname] : [out[r.sname]];
    if (atual.some((b) => assinatura(b) === assinatura(r.build))) { recusados.push({ ok: false, motivo: "já existe build igual", cab: r.sname }); continue; }
    if (atual.length >= 3) { recusados.push({ ok: false, motivo: "espécie já tem 3 builds", cab: r.sname }); continue; }
    const usados = new Set(atual.map((b) => b.estilo).filter(Boolean));
    const ordem = [r.estiloPref, "ofensivo", "equilibrado", "defensivo"];
    const estilo = ordem.find((e) => !usados.has(e));
    if (!estilo) { recusados.push({ ok: false, motivo: "sem estilo livre", cab: r.sname }); continue; }
    const nova = Object.assign({ estilo }, r.build);
    out[r.sname] = atual.length ? atual.concat([nova]) : nova;
    aceitos.push({ sname: r.sname, estilo });
  }
  return { builds: out, aceitos, recusados };
}

// ---------- 5. linha de comando ----------
async function main() {
  const repo = process.argv[2];
  if (!repo || !existsSync(repo + "/src/data/dex-strategy.md")) { console.error("uso: node scripts/importar_dex_strategy.mjs <er-repo> [--gravar]"); process.exit(2); }
  const dex = JSON.parse(readFileSync("data/dex_compact.json", "utf8"));
  const builds = JSON.parse(readFileSync("data/builds.json", "utf8"));
  const blocos = lerBlocos(readFileSync(repo + "/src/data/dex-strategy.md", "utf8"));
  const ind = montarIndice(dex, null);
  const conv = blocos.map((b) => converter(b, ind));
  const { builds: novas, aceitos, recusados } = juntar(builds, conv);
  const motivos = {};
  recusados.forEach((r) => { const m = r.motivo.replace(/'[^']*'/g, "'…'").replace(/\(.*\)/, "").replace(/\d+ slots/, "N slots").replace(/em SPECIES_[A-Z0-9_]+/, "em X").replace(/de SPECIES_[A-Z0-9_]+/, "de X"); motivos[m] = (motivos[m] || 0) + 1; });
  console.log("blocos lidos:", blocos.length, "| entram:", aceitos.length, "| recusados:", recusados.length);
  console.log("motivos:", JSON.stringify(motivos, null, 1));
  console.log("entram:", aceitos.map((a) => a.sname.replace("SPECIES_", "") + "(" + a.estilo[0] + ")").join(" "));
  if (process.argv.includes("--gravar")) { writeFileSync("data/builds.json", JSON.stringify(novas, null, 2)); console.log("gravado: data/builds.json"); }
}
if (import.meta.url === pathToFileURL(process.argv[1] || "").href) main();
