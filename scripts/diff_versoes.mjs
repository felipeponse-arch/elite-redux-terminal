// Diff entre duas versões do gameData do NextDex, com análise de impacto
// (lote 2 das pesquisas, 2026-10-06). Quando o alarme semanal toca, o alarme só
// diz "mudou"; este script diz O QUÊ mudou e quais builds/chefões/rank do app
// citam o que mudou - assim a revisão pós-patch olha só o necessário.
//
// Uso:
//   node scripts/diff_versoes.mjs <antigo.json[.gz]> <novo.json[.gz]> [--saida relatorio.md]
//   node scripts/diff_versoes.mjs --arquivar <gameData.json> <rotulo>
//       guarda uma cópia compacta em data/raw/snapshots/gameData_<rotulo>.json.gz
//       (fazer ANTES de sobrescrever data/gameData_*.json com a versão nova).
//
// Só roda no desenvolvimento: não entra no build nem toca o HTML do app.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { gzipSync, gunzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import path from "node:path";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function lerGameData(arquivo) {
  const buf = readFileSync(arquivo);
  return JSON.parse((arquivo.endsWith(".gz") ? gunzipSync(buf) : buf).toString("utf8"));
}

const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Compara duas listas de objetos casadas por `chave(x)`; `campos` = [rótulo, extrator].
function compararLista(antigas, novas, chave, campos) {
  const mapaAnt = new Map(antigas.map((x) => [chave(x), x]));
  const mapaNov = new Map(novas.map((x) => [chave(x), x]));
  const adicionados = [], removidos = [], removidosChave = [], alterados = [];
  for (const [k, n] of mapaNov) {
    const a = mapaAnt.get(k);
    if (!a) { adicionados.push(n.name ?? k); continue; }
    const campos_ = campos.filter(([, f]) => !igual(f(a), f(n))).map(([r]) => r);
    if (campos_.length) alterados.push({ chave: k, campos: campos_, antes: a, depois: n });
  }
  for (const [k, a] of mapaAnt) if (!mapaNov.has(k)) { removidos.push(a.name ?? k); removidosChave.push(k); }
  return { adicionados, removidos, removidosChave, alterados };
}

const CAMPOS_GOLPE = ["eff", "pwr", "types", "acc", "pp", "chance", "target", "prio", "split", "flags", "arg", "desc", "lDesc"]
  .map((c) => [c, (x) => x[c]]);
const CAMPOS_ESPECIE = [
  ["stats base", (x) => x.stats?.base], ["tipos", (x) => x.stats?.types],
  ["habilidades", (x) => x.stats?.abis], ["inatas", (x) => x.stats?.inns],
  ["evoluções", (x) => x.evolutions], ["golpes por nível", (x) => x.levelUpMoves],
  ["TM/HM", (x) => x.TMHMMoves], ["tutor", (x) => x.tutor], ["egg moves", (x) => x.eggMoves],
  ["formas", (x) => x.forms], ["flags", (x) => x.stats?.flags],
];

// Devolve { golpes, habilidades, especies, itens, chefes, totais } sem formatar nada.
export function compararVersoes(ant, nov) {
  return {
    golpes: compararLista(ant.moves, nov.moves, (m) => m.id, CAMPOS_GOLPE),
    habilidades: compararLista(ant.abilities, nov.abilities, (a) => a.id, [["desc", (x) => x.desc], ["nome", (x) => x.name]]),
    especies: compararLista(ant.species, nov.species, (s) => s.NAME, CAMPOS_ESPECIE),
    itens: compararLista(ant.items, nov.items, (i) => i.id, [["nome", (x) => x.name]]),
    treinadores: compararLista(ant.trainers, nov.trainers, (t) => t.name, [
      ["time", (x) => x.party], ["insane", (x) => x.insane], ["hell", (x) => x.hell], ["map", (x) => x.map],
    ]),
  };
}

// Impacto: o que do app cita as entidades alteradas/removidas.
// `dados` = { builds, bosses, rank } (os JSONs de data/). Casa por nome, como o app.
export function impacto(dif, nov, ant, dados) {
  const golpes = new Set(dif.golpes.alterados.map((g) => g.antes.name).concat(dif.golpes.removidos));
  const habs = new Set(dif.habilidades.alterados.map((h) => h.antes.name).concat(
    dif.habilidades.removidos));
  const especies = new Set(dif.especies.alterados.map((s) => s.chave).concat(dif.especies.removidosChave));
  const especiePorId = new Map(ant.species.map((s) => [s.id, s.NAME]));

  const buildsAfetadas = [];
  for (const [esp, lista] of Object.entries(dados.builds ?? {})) {
    // valor = build, lista de builds, ou {estilo: build|lista}
    const todas = Array.isArray(lista) ? lista : lista?.moves ? [lista] : Object.values(lista).flat();
    const motivos = new Set();
    if (especies.has(esp)) motivos.add("espécie alterada");
    for (const b of todas) {
      for (const m of b?.moves ?? []) if (golpes.has(m)) motivos.add(`golpe ${m}`);
      if (b && habs.has(b.ability)) motivos.add(`habilidade ${b.ability}`);
    }
    if (motivos.size) buildsAfetadas.push({ especie: esp, motivos: [...motivos] });
  }

  const chefesAfetados = [];
  const treinadoresMudaram = new Set(dif.treinadores.alterados.map((t) => t.chave));
  for (const chefe of dados.bosses ?? []) {
    const motivos = new Set();
    if (treinadoresMudaram.has(chefe.name)) motivos.add("time mudou no jogo");
    for (const p of chefe.party ?? []) {
      const NAME = especiePorId.get(p.x);
      if (NAME && especies.has(NAME)) motivos.add(`espécie ${p.n}`);
      if (habs.has(p.abi)) motivos.add(`habilidade ${p.abi}`);
      for (const m of p.mv ?? []) if (golpes.has(m)) motivos.add(`golpe ${m}`);
    }
    if (motivos.size) chefesAfetados.push({ chefe: chefe.name, motivos: [...motivos] });
  }

  const rankAfetado = Object.keys(dados.rank ?? {}).filter((k) => especies.has(k));
  return { buildsAfetadas, chefesAfetados, rankAfetado };
}

const LIMITE = 25;
function lista(titulo, itens) {
  if (!itens.length) return "";
  const corte = itens.slice(0, LIMITE).map((x) => `- ${x}`);
  if (itens.length > LIMITE) corte.push(`- ... e mais ${itens.length - LIMITE}`);
  return `\n### ${titulo} (${itens.length})\n${corte.join("\n")}\n`;
}

export function formatarRelatorio(dif, imp, rotulos = {}) {
  const sec = (nome, d, rot) =>
    `\n## ${nome}: +${d.adicionados.length} novos, -${d.removidos.length} removidos, ~${d.alterados.length} alterados\n` +
    lista("Novos", d.adicionados) + lista("Removidos", d.removidos) +
    lista("Alterados", d.alterados.map((a) => `${rot(a)}: ${a.campos.join(", ")}`));
  const nome = (a) => a.depois.name ?? a.chave;
  let md = `# Diff de versões do gameData${rotulos.de ? ` (${rotulos.de} → ${rotulos.para})` : ""}\n`;
  md += sec("Espécies", dif.especies, nome) + sec("Golpes", dif.golpes, nome) +
    sec("Habilidades", dif.habilidades, nome) + sec("Itens", dif.itens, nome) + sec("Treinadores", dif.treinadores, nome);
  md += "\n# Impacto no app\n";
  md += lista("Builds a revisar", imp.buildsAfetadas.map((b) => `${b.especie}: ${b.motivos.join("; ")}`));
  md += lista("Chefões a revisar", imp.chefesAfetados.map((c) => `${c.chefe}: ${c.motivos.join("; ")}`));
  md += lista("Espécies com rank a recalcular", imp.rankAfetado);
  if (!imp.buildsAfetadas.length && !imp.chefesAfetados.length && !imp.rankAfetado.length) md += "\nNada do app cita o que mudou.\n";
  return md;
}

function arquivar(arquivo, rotulo) {
  if (!rotulo || !/^[\w.-]+$/.test(rotulo)) throw new Error("rótulo inválido (use letras, números, . _ -)");
  const pasta = path.join(RAIZ, "data", "raw", "snapshots");
  mkdirSync(pasta, { recursive: true });
  const destino = path.join(pasta, `gameData_${rotulo}.json.gz`);
  writeFileSync(destino, gzipSync(readFileSync(arquivo), { level: 9 }));
  return destino;
}

function lerDadosDoApp() {
  const ler = (n) => { const p = path.join(RAIZ, "data", n); return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : undefined; };
  return { builds: ler("builds.json"), bosses: ler("bosses.json"), rank: ler("species_rank.json") };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args[0] === "--arquivar") {
    console.log("snapshot gravado:", arquivar(args[1], args[2]));
  } else {
    const i = args.indexOf("--saida");
    const saida = i >= 0 ? args.splice(i, 2)[1] : null;
    const [a, n] = args;
    if (!a || !n) { console.error("uso: diff_versoes.mjs <antigo> <novo> [--saida arq.md]"); process.exit(2); }
    const ant = lerGameData(a), nov = lerGameData(n);
    const dif = compararVersoes(ant, nov);
    const md = formatarRelatorio(dif, impacto(dif, nov, ant, lerDadosDoApp()), { de: path.basename(a), para: path.basename(n) });
    if (saida) { writeFileSync(saida, md); console.log("relatório gravado:", saida); } else console.log(md);
  }
}
