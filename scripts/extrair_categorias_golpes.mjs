// Categorias de golpe, chance e efeito extra, direto do dado oficial do NextDex
// (2026-09-29). O dex_compact.json só guarda as 18 marcações de `flagsT`; as
// categorias que reforçam habilidades (soco, mordida, corte, canhão/pulso,
// chifre, chute, flecha, martelo) estão escritas na descrição LONGA de cada
// golpe ("... Iron Fist boost."), e a chance/tipo de efeito extra em `chance`
// e `eff`. Sem isso o motor não sabia quais golpes o Iron Fist, o Strong Jaw
// ou o Keen Edge reforçam, nem o que o Sheer Force troca.
//
// Fonte: https://eliteredux.net/full-documentation/ aponta o NextDex como o
// "master doc"; o arquivo bruto é o mesmo que scripts/check_upstream.ps1 vigia.
//
// Uso: node scripts/extrair_categorias_golpes.mjs [caminho/gameDataV<versão>.json]
// Sem caminho, baixa a versão do data/dex_compact.json. Grava
// data/move_categorias.json: { "<id do golpe>": { c: [categorias], ch: chance, ef: efeito,
// rc: % de recuo do dano causado, dr: % do dano causado que volta como HP,
// al: alvo em dupla - ambos/todos/aleatorio, se: efeito do golpe de status }.
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const dex = JSON.parse(readFileSync(join(RAIZ, "data", "dex_compact.json"), "utf8"));
const versao = dex.meta && dex.meta.version;

// Marcação na descrição longa -> categoria (com as grafias variantes do próprio dado).
const CATEGORIAS = [
  ["soco", /iron fist/i],
  ["mordida", /strong jaw/i],
  ["corte", /keen edge/i],
  ["pulso", /mega launcher/i],
  ["chifre", /might(?:y)? horn/i],
  ["chute", /striker|\bstrike boost/i],
  ["flecha", /archer|\barrow boost/i],
  ["martelo", /super slammer/i]
];

const caminho = process.argv[2];
const raw = caminho
  ? JSON.parse(readFileSync(caminho, "utf8"))
  : await (await fetch(`https://raw.githubusercontent.com/ForwardFeed/ER-nextdex/main/static/js/data/gameDataV${versao}.json`)).json();

if (raw.moves.length !== dex.moves.length) throw new Error(`golpes: ${raw.moves.length} no NextDex x ${dex.moves.length} no dex_compact - versões diferentes`);
const out = {};
let comCategoria = 0, comChance = 0, comRecuo = 0, comDreno = 0, comArea = 0, comStatus = 0;
raw.moves.forEach((m, id) => {
  if (!m) return;
  if (dex.moves[id][0] !== m.name) throw new Error(`golpe ${id}: "${m.name}" no NextDex x "${dex.moves[id][0]}" no dex_compact`);
  const texto = m.lDesc || "";
  const c = CATEGORIAS.filter(([, re]) => re.test(texto)).map(([nome]) => nome);
  const e = { };
  if (c.length) { e.c = c; comCategoria++; }
  if (m.chance > 0) { e.ch = m.chance; e.ef = raw.effT[m.eff] || ""; comChance++; }
  // Recuo ("33% recoil") e dreno ("drains 50%", "recovers 50% of the damage") da descrição longa;
  // efeito "Absorb" sem número vale 50% (padrão da série).
  const efeito = raw.effT[m.eff] || "";
  const rc = texto.match(/(\d+)% recoil/i) || efeito.match(/^Recoil (\d+)$/);
  if (rc && m.pwr > 0) { e.rc = parseInt(rc[1], 10); comRecuo++; }
  const dr = texto.match(/(?:drains|recovers|restores HP by) (\d+)%/i);
  if (m.pwr > 0 && (dr || efeito === "Absorb")) { e.dr = dr ? parseInt(dr[1], 10) : 50; comDreno++; }
  // Alvo em dupla (targetT): "ambos" = os dois rivais, "todos" = rivais e aliado
  // (Earthquake, Surf), "aleatorio" = um rival ao acaso.
  const alvo = { BOTH: "ambos", FOES_AND_ALLY: "todos", RANDOM: "aleatorio" }[raw.targetT[m.target]];
  if (alvo && m.pwr > 0) { e.al = alvo; comArea++; }
  // Golpe de status: o efeito do jogo (effT: "Attack Up 2", "Will O Wisp", "Restore Hp"...).
  if (!(m.pwr > 0) && efeito) { e.se = efeito; comStatus++; }
  if (Object.keys(e).length) out[id] = e;
});
writeFileSync(join(RAIZ, "data", "move_categorias.json"), JSON.stringify(out) + "\n");
console.log(`move_categorias.json: ${comCategoria} golpes com categoria, ${comChance} com efeito extra por chance, ${comRecuo} com recuo, ${comDreno} com dreno, ${comArea} de área, ${comStatus} de status (NextDex ${versao})`);
