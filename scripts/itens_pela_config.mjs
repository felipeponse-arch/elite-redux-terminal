// Parâmetros de item pelo código do jogo, não por números soltos no motor.
// Ticket calibracao-2026-10-15/02 (15/10/2026). O texto do item ("A hold item that raises the power of Fire-type
// moves") não traz número; o jogo lê o `hold_effect_strength` do item (battle_util.c:7005-7034:
// holdEffectModifier = 1 + strength/100) e o tipo em `hold_effect_type`. Tudo vem do items/*.textproto da er-config.
//
// Uso: node scripts/itens_pela_config.mjs <pasta items/ da er-config> [--commit=<hash da er-config>]
// Grava data/itens_config.json: { meta, itens: { "<nome>": { e: "TYPE_POWER", f: 30, t: "Fire" } } }
//   e = efeito do jogo (hold_effect; para CUSTOM vale o alias ou o nome do item, como ItemGenerator.kt:38-45 gera o enum)
//   f = hold_effect_strength (só quando existe), t = hold_effect_type em inglês (só quando existe)
// Só entram os itens com efeito de batalha; pedras mega, cristais Z e orbes primais ficam de fora (nenhuma regra lê o número).
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SEM_NUMERO = new Set(["MEGA_STONE", "Z_CRYSTAL", "PRIMAL_ORB", "MEMORY", "DRIVE", "REPEL", "NONE"]);

// Lê id, nome e os campos hold_effect* de cada bloco `item { ... }`; blocos aninhados são pulados por profundidade.
export function lerItensDaConfig(texto) {
  const itens = [];
  let atual = null, profundidade = 0;
  for (const bruta of texto.split(/\r?\n/)) {
    const l = bruta.trim();
    if (!atual) {
      if (l === "item {") { atual = {}; profundidade = 1; }
      continue;
    }
    if (l.endsWith("{")) { profundidade++; continue; }
    if (l === "}") {
      profundidade--;
      if (profundidade === 0) { itens.push(atual); atual = null; }
      continue;
    }
    if (profundidade !== 1) continue;
    const m = l.match(/^(\w+): (.*)$/);
    if (!m) continue;
    if (m[1] === "id") atual.id = m[2];
    else if (m[1] === "name") atual.nome = m[2].replace(/^"|"$/g, "").replace(/\\'/g, "'");
    else if (m[1] === "hold_effect") atual.efeito = m[2];
    else if (m[1] === "hold_effect_alias") atual.alias = m[2].replace(/^"|"$/g, "");
    else if (m[1] === "hold_effect_strength") atual.forca = parseInt(m[2], 10);
    else if (m[1] === "hold_effect_type") atual.tipo = m[2];
  }
  return itens;
}

const TIPO_EN = (t) => t.replace(/^TYPE_/, "").toLowerCase().replace(/^./, (c) => c.toUpperCase());

// Efeito de jogo do item, igual ao ItemGenerator.kt: CUSTOM vira o alias ou o nome do item (HOLD_EFFECT_<NOME>).
export function efeitoDoItem(it) {
  if (!it.efeito || it.efeito === "HOLD_EFFECT_NONE") return null;
  if (it.efeito === "HOLD_EFFECT_CUSTOM") return it.alias || (it.id || "").replace(/^ITEM_/, "");
  return it.efeito.replace(/^HOLD_EFFECT_/, "");
}

export function itensDeBatalha(lista) {
  const itens = {};
  for (const it of lista) {
    const e = efeitoDoItem(it);
    if (!e || !it.nome || SEM_NUMERO.has(e)) continue;
    const o = { e };
    if (it.forca) o.f = it.forca;
    if (it.tipo && it.tipo !== "TYPE_NONE") o.t = TIPO_EN(it.tipo);
    itens[it.nome] = o;
  }
  return itens;
}

if ((process.argv[1] || "").endsWith("itens_pela_config.mjs")) {
  const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
  const pasta = process.argv[2];
  if (!pasta) { console.error("uso: node scripts/itens_pela_config.mjs <pasta items/ da er-config> [--commit=<hash>]"); process.exit(2); }
  const commit = (process.argv.find((a) => a.startsWith("--commit=")) || "").slice(9) || "desconhecido";
  const lista = readdirSync(pasta).filter((f) => f.endsWith(".textproto")).sort().flatMap((f) => lerItensDaConfig(readFileSync(join(pasta, f), "utf8")));
  const itens = itensDeBatalha(lista);
  const meta = { fonte: "Elite-Redux/er-config items/*.textproto", commit, itensNaConfig: lista.length, itensComEfeito: Object.keys(itens).length };
  writeFileSync(join(RAIZ, "data", "itens_config.json"), JSON.stringify({ meta, itens }) + "\n");
  console.log("data/itens_config.json: " + meta.itensComEfeito + " itens com efeito (de " + meta.itensNaConfig + ") - er-config " + commit);
}
