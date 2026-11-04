// Importa a planilha oficial "Mono earliest locations" (índice oficial:
// https://eliteredux.net/full-documentation/) pra data/mono_disponibilidade.json
// (2026-09-26, pedido do usuário: "seria viável criar uma vertente pra mono
// run"). O app já sabia ONDE cada espécie aparece; não sabia QUANDO - é isso que
// a planilha dá: por tipo, o que dá pra pegar antes de cada líder.
//
// Uso: node scripts/importar_mono.mjs            (baixa as abas do Google Sheets)
//      node scripts/importar_mono.mjs <pasta>    (lê <gid>.csv já baixados)
// Rede só aqui, nunca no build: o JSON gerado é versionado como os outros dados.
//
// Cada nome é casado com uma espécie REAL do dex; o que não casar é listado e
// fica de fora (nunca inventar). Um erro de digitação pequeno da planilha
// ("Sylvally", "Iglybuff") casa por distância de edição 1-2, e sai no relatório.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PLANILHA = "1A6rHIXmMJ742nIo4Y1U0zBY0TwIk4SOWRsazbIDzvbw";
// Aba -> etapa do app (índice de data/levelcaps.json): a aba "Roxanne" lista o
// que dá pra pegar ANTES de vencer a Roxanne, ou seja, desde o início (0).
export const ABAS = [
  { gid: "1878325405", lider: "Roxanne", etapa: 0 },
  { gid: "1389814083", lider: "Brawley", etapa: 1 },
  { gid: "1792116932", lider: "Wattson", etapa: 2 },
  { gid: "1088779804", lider: "Flannery", etapa: 3 },
  { gid: "1004743707", lider: "Norman", etapa: 4 },
  { gid: "1143817657", lider: "Winona", etapa: 5 },
  { gid: "1691952942", lider: "Tate & Liza", etapa: 6 },
  { gid: "557767484", lider: "Juan", etapa: 7 },
  { gid: "960947035", lider: "Wallace", etapa: 8 },
  { gid: "851461460", lider: "Pós-jogo", etapa: 9 },
];
export const TIPOS = ["Normal", "Fighting", "Flying", "Poison", "Ground", "Rock", "Bug", "Ghost", "Steel",
  "Fire", "Water", "Grass", "Electric", "Psychic", "Ice", "Dragon", "Dark", "Fairy"];

// CSV com aspas (locais às vezes têm vírgula).
export function lerCsv(texto) {
  const linhas = []; let linha = []; let campo = ""; let aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === ",") { linha.push(campo); campo = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      linha.push(campo); linhas.push(linha); linha = []; campo = "";
    } else campo += c;
  }
  if (campo || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas;
}

// "Zigzagoon (Galarian) #*" -> { nome: "Zigzagoon Galarian", marcas: "#*" }.
// Marcas da planilha: # = uma evolução ganha o tipo; * = evolui PRA FORA do
// tipo; % = precisa de evolução/forma especial pra ter o tipo.
export function lerNome(bruto) {
  let s = (bruto || "").trim();
  let marcas = "";
  s = s.replace(/\(\s*([#*%]+)\s*\)/g, (_, m) => { marcas += m; return ""; });
  s = s.replace(/[#*%]+/g, (m) => { marcas += m; return ""; });
  s = s.replace(/\(([^)]+)\)/g, " $1").replace(/\s+/g, " ").trim();
  return { nome: s, marcas: [...new Set(marcas)].sort().join("") };
}

const chave = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
function distancia(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  return d[a.length][b.length];
}
// Nomes que a planilha escreve de um jeito que nenhuma regra acha.
const APELIDOS = {
  "Tauros Combat Paldean": "Tauros Paldean Combat Breed",
  "Tauros Blaze Paldean": "Tauros Paldean Blaze Breed",
  "Tauros Aqua Paldean": "Tauros Paldean Aqua Breed",
};
// "Galarian Zigzagoon" e "Zigzagoon Galarian" são a mesma coisa. Por último,
// o nome sem a região: "Sneasler (Hisuian)" é o Sneasler, que só existe numa
// forma - sem isso o casamento aproximado o trocava pelo Sneasel Hisuian.
const REGIOES = ["Alolan", "Galarian", "Hisuian", "Paldean"];
function variantes(nome) {
  const v = [APELIDOS[nome] || nome];
  for (const r of REGIOES) {
    if (nome.startsWith(r + " ")) v.push(nome.slice(r.length + 1) + " " + r);
    if (nome.endsWith(" " + r)) v.push(r + " " + nome.slice(0, -r.length - 1));
  }
  for (const r of REGIOES) {
    if (nome.endsWith(" " + r)) v.push(nome.slice(0, -r.length - 1));
    if (nome.startsWith(r + " ")) v.push(nome.slice(r.length + 1));
  }
  return v;
}

export function casarNomes(especies) {
  const porChave = new Map();
  for (const sp of especies) if (!porChave.has(chave(sp.n))) porChave.set(chave(sp.n), sp);
  const chaves = [...porChave.keys()];
  return function casar(nome) {
    for (const v of variantes(nome)) { const sp = porChave.get(chave(v)); if (sp) return { sp, aproximado: false }; }
    const k = chave(nome);
    if (k.length < 5) return null;
    let melhor = null, dMelhor = 3;
    for (const c of chaves) {
      if (Math.abs(c.length - k.length) > 2) continue;
      const d = distancia(k, c);
      if (d < dMelhor) { dMelhor = d; melhor = c; }
    }
    return melhor && dMelhor <= 2 ? { sp: porChave.get(melhor), aproximado: true } : null;
  };
}

// Uma aba -> [{tipo, nome, local, marcas}] (só as 18 colunas de tipo; as de
// região, depois de Fairy, ficam de fora).
export function lerAba(texto) {
  const t = lerCsv(texto);
  const cab = t.findIndex((l) => l[1] === "Pokemon" && l[2] === "Location");
  if (cab < 0) throw new Error("aba sem a linha 'Pokemon,Location' - formato da planilha mudou");
  const tiposDaLinha = t[0];
  const saida = [];
  for (let c = 1; c < tiposDaLinha.length; c += 3) {
    const tipo = (tiposDaLinha[c] || "").trim();
    if (!TIPOS.includes(tipo)) continue;
    for (let r = cab + 1; r < t.length; r++) {
      const bruto = (t[r][c] || "").trim();
      if (!bruto) continue;
      const { nome, marcas } = lerNome(bruto);
      saida.push({ tipo, nome, local: (t[r][c + 1] || "").trim(), marcas });
    }
  }
  return saida;
}

// Cruza a lista com o tipo do dex (decisão do usuário, TK-38: vale o tipo do dex; dupla tipagem aparece em cada run mono):
//  - entrada sem marca #/%/M cujo tipo a espécie não tem sai (tipo errado da planilha, feita pra 2.5);
//  - espécie que aparece em alguma lista entra em TODOS os tipos dela, com a etapa/local da entrada mais cedo (sem marca: o tipo é dela).
// Marcas e demais campos (inclusive eApp) das entradas que ficam não são tocados. Devolve { porTipo, removidas, acrescentadas }.
export function cruzarComDex(porTipo, dex) {
  const porSname = new Map(dex.species.filter(Boolean).map((s) => [s.sname, s]));
  const tiposDe = (s) => ((porSname.get(s) || {}).t || []).map((i) => dex.types[i]);
  const removidas = [], acrescentadas = [], saida = {};
  for (const [tipo, lista] of Object.entries(porTipo)) {
    saida[tipo] = lista.filter((x) => {
      const ok = /[#%M]/.test(x.m || "") || !porSname.has(x.s) || tiposDe(x.s).includes(tipo);
      if (!ok) removidas.push(tipo + ":" + x.s);
      return ok;
    });
  }
  const fonte = new Map(); // sname -> entrada mais cedo, mesmo a removida (a planilha diz onde pegar; o tipo é que estava errado). Primeira vence o empate.
  for (const lista of Object.values(porTipo)) for (const x of lista) if (!fonte.has(x.s) || x.e < fonte.get(x.s).e) fonte.set(x.s, x);
  for (const [s, x] of fonte) for (const tipo of tiposDe(s)) {
    if (!saida[tipo] || saida[tipo].some((y) => y.s === s)) continue;
    const nova = { s, e: x.e, l: x.l };
    if (x.eApp !== undefined) nova.eApp = x.eApp;
    saida[tipo].push(nova);
    acrescentadas.push(tipo + ":" + s);
  }
  return { porTipo: saida, removidas, acrescentadas };
}

// eApp (Etapa do rank_disponibilidade, escrita por gerar_rank_disponibilidade.mjs) não vem da planilha: reaproveita do arquivo anterior,
// por (tipo, espécie) e, na falta, pela espécie (a Etapa por espécie é uma só).
export function preservarEApp(novo, antigo) {
  const porTipoEsp = new Map(), porEsp = new Map();
  for (const [tipo, lista] of Object.entries((antigo && antigo.porTipo) || {})) for (const x of lista) if (x.eApp !== undefined) { porTipoEsp.set(tipo + ":" + x.s, x.eApp); porEsp.set(x.s, x.eApp); }
  for (const [tipo, lista] of Object.entries(novo)) for (const x of lista) {
    const v = porTipoEsp.has(tipo + ":" + x.s) ? porTipoEsp.get(tipo + ":" + x.s) : porEsp.get(x.s);
    if (v !== undefined && x.eApp === undefined) x.eApp = v;
  }
  return novo;
}

async function main() {
  const pasta = process.argv[2];
  const dex = JSON.parse(readFileSync(path.join(RAIZ, "data", "dex_compact.json"), "utf8"));
  const especies = dex.species.filter(Boolean);
  const casar = casarNomes(especies);
  const nomeDoTipo = (i) => dex.types[i];
  // Evoluções normais (sem Mega/Primal): índice do tipo de evolução em evoKinds.
  const EVO_FORMA_ESPECIAL = new Set(["EVO_MEGA_EVOLUTION", "EVO_PRIMAL_REVERSION", "EVO_MOVE_MEGA_EVOLUTION"]);
  // "#" = uma evolução normal tem o tipo; "M" = só a forma Mega (dela ou de uma
  // evolução) tem. A marca # da planilha conta Mega junto - no 2.65 o Flygon é
  // Ground/Bug e o Dragon só vem na Mega -, então aqui as duas se separam.
  function evolucaoGanhaTipo(sp, tipo, visto = new Set()) {
    let viaMega = false;
    for (const [kind, , alvo] of sp.ev || []) {
      if (visto.has(alvo)) continue;
      visto.add(alvo);
      const filho = dex.species[alvo];
      if (!filho) continue;
      const temTipo = (filho.t || []).map(nomeDoTipo).includes(tipo);
      if (EVO_FORMA_ESPECIAL.has(dex.evoKinds[kind])) { if (temTipo) viaMega = true; continue; }
      if (temTipo) return "#";
      const r = evolucaoGanhaTipo(filho, tipo, visto);
      if (r === "#") return "#";
      if (r === "M") viaMega = true;
    }
    return viaMega ? "M" : null;
  }

  const porTipo = Object.fromEntries(TIPOS.map((t) => [t, []]));
  const semCasar = new Set(), aproximados = new Map(), tipoDivergente = [];
  for (const aba of ABAS) {
    const texto = pasta
      ? readFileSync(path.join(pasta, aba.gid + ".csv"), "utf8")
      : await (await fetch(`https://docs.google.com/spreadsheets/d/${PLANILHA}/export?format=csv&gid=${aba.gid}`)).text();
    for (const e of lerAba(texto)) {
      const achado = casar(e.nome);
      if (!achado) { semCasar.add(e.nome); continue; }
      const sp = achado.sp;
      if (achado.aproximado) aproximados.set(e.nome, sp.n);
      // Primeira etapa em que aparece vence (a mesma espécie pode repetir em
      // abas posteriores com outro local).
      if (porTipo[e.tipo].some((x) => x.s === sp.sname)) continue;
      const tiposReais = (sp.t || []).map(nomeDoTipo);
      // Sem marca, a espécie tem que ter o tipo JÁ no dado 2.65; com #/%, o tipo
      // vem depois (evolução/forma). Se uma evolução (não Mega) dela tem o tipo
      // no dado atual, vale com # mesmo que a planilha não tenha marcado.
      // Divergência de verdade = a planilha (feita pra 2.5) e o jogo atual
      // discordam - fica de fora e vai pro relatório.
      // A marca # da planilha também é conferida (ela é da 2.5: o Igglybuff
      // vinha com # em Fighting e nenhuma evolução dele é Fighting na 2.65).
      // Só % passa sem conferência: forma/evolução especial não está nas
      // evoluções normais do dado.
      let marcas = e.marcas;
      if (!marcas.includes("%") && !tiposReais.includes(e.tipo)) {
        const via = evolucaoGanhaTipo(sp, e.tipo);
        if (!via) { tipoDivergente.push(`${e.nome} em ${e.tipo} (no jogo: ${tiposReais.join("/")})`); continue; }
        marcas = [...new Set(marcas.replace("#", "") + via)].sort().join("");
      }
      porTipo[e.tipo].push({ s: sp.sname, e: aba.etapa, l: e.local, m: marcas || undefined });
    }
  }
  const cruz = cruzarComDex(porTipo, dex);
  let antigo = null;
  try { antigo = JSON.parse(readFileSync(path.join(RAIZ, "data", "mono_disponibilidade.json"), "utf8")); } catch { /* primeira importação */ }
  preservarEApp(cruz.porTipo, antigo);
  const saida = {
    fonte: `https://docs.google.com/spreadsheets/d/${PLANILHA}`,
    nota: "Planilha da comunidade 'Mono earliest locations' (listada no índice oficial eliteredux.net/full-documentation). Feita pra 2.5 e atualizada com o NextDex; cada nome foi casado com o dado 2.65 do app e o que divergiu ficou de fora. e = etapa do app (índice de levelcaps.json) desde quando dá pra pegar; m: # uma evolução ganha o tipo, * evolui pra fora do tipo, % precisa de evolução/forma especial.",
    importadoEm: new Date().toISOString().slice(0, 10),
    lideres: ABAS.map((a) => a.lider),
    porTipo: cruz.porTipo,
  };
  writeFileSync(path.join(RAIZ, "data", "mono_disponibilidade.json"), JSON.stringify(saida) + "\n", "utf8");
  console.log(`cruzado com o dex: ${cruz.removidas.length} removidas (${cruz.removidas.join(", ")}), ${cruz.acrescentadas.length} acrescentadas (${cruz.acrescentadas.join(", ")})`);
  const total = Object.values(cruz.porTipo).reduce((a, l) => a + l.length, 0);
  console.log(`importado: ${total} entradas em ${TIPOS.length} tipos`);
  console.log("por tipo (até a 1ª insígnia / total):", TIPOS.map((t) => `${t} ${cruz.porTipo[t].filter((x) => x.e === 0).length}/${cruz.porTipo[t].length}`).join(", "));
  console.log(`\ncasados por aproximação (${aproximados.size}):`, [...aproximados].map(([a, b]) => `${a} -> ${b}`).join("; "));
  console.log(`\nsem espécie no dado (${semCasar.size}):`, [...semCasar].join("; "));
  console.log(`\ntipo diferente no jogo atual (${tipoDivergente.length}):`, tipoDivergente.join("; "));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
