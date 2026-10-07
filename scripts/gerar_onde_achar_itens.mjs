// Gera data/onde_achar_itens.json: onde cada item se consegue na run e a partir de qual etapa (ticket 07,
// 07/10/2026). Fonte: código oficial do jogo (er-repo), lido pela primeira vez neste ticket:
//  - data/scripts/item_ball_scripts.inc: item no chão (finditem), mapa pelo nome do script;
//  - data/maps/*/map.json: item escondido (bg_events hidden_item);
//  - data/maps/*/scripts.pory: presente (giveitem/finditem), Pokémon de presente que vem segurando o item
//    (givecustommon: 3º argumento), listas de loja (.2byte ITEM_X) e troca por BP da Battle Frontier;
//    data/scripts/pkmn_center_nurse-with-z-power.inc NÃO entra: o jogo inclui pkmn_center_nurse.inc (event_scripts.s);
//  - data/scripts/general_mart.inc: lojas por insígnia (PokeMart_<Insígnia>_Badge = etapa da insígnia).
// Etapa: resolvedor único mapa -> etapa (scripts/etapa_do_mapa.mjs). Presente dentro de ginásio só sai
// depois da vitória: etapa = a insígnia daquele ginásio. É a etapa do MAPA: barreira dentro do mapa (Surf,
// Cut, flag de script) não entra - por isso a Confiança é "consenso", não "confirmado".
//
// Uso: node scripts/gerar_onde_achar_itens.mjs <er-repo>
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { criarEtapaDoMapa } from "./etapa_do_mapa.mjs";

const repo = process.argv[2];
if (!repo || !existsSync(repo)) { console.error("uso: node scripts/gerar_onde_achar_itens.mjs <er-repo>"); process.exit(2); }
const ler = (p) => readFileSync(p, "utf8");
const gd = JSON.parse(ler("data/gameData_265beta.json"));
const caps = JSON.parse(ler("data/levelcaps.json")).rows;
const etapaDoMapa = criarEtapaDoMapa(JSON.parse(ler("data/mono_disponibilidade.json")), JSON.parse(ler("data/disponibilidade_regras.json")), caps.length - 1);
const nomeDoItem = Object.fromEntries(gd.items.filter(Boolean).map((i) => [i.NAME, i.name]));

// Ordem oficial dos ginásios (a mesma de chefoes.js) e das insígnias das lojas gerais.
const GINASIO = { RUSTBOROCITY: 1, DEWFORDTOWN: 2, MAUVILLECITY: 3, LAVARIDGETOWN: 4, PETALBURGCITY: 5, FORTREECITY: 6, MOSSDEEPCITY: 7, SOOTOPOLISCITY: 8 };
const INSIGNIA = { Stone: 1, Knuckle: 2, Dynamo: 3, Heat: 4, Balance: 5, Feather: 6, Mind: 7, Rain: 8 };

const achados = {};
function anotar(itemConst, local, como, etapa) {
  const nome = nomeDoItem[itemConst];
  if (!nome || itemConst === "ITEM_NONE") return;
  (achados[nome] = achados[nome] || []).push({ etapa: etapa === undefined ? null : etapa, local, como });
}
const localLegivel = (pasta) => pasta.replace(/_/g, " ").replace(/([a-z])([A-Z0-9])/g, "$1 $2");
function etapaDaPasta(pasta) {
  const m = pasta.match(/^([A-Za-z]+)_Gym\b/);
  if (m && GINASIO[m[1].toUpperCase()]) return GINASIO[m[1].toUpperCase()];
  return etapaDoMapa(pasta);
}

// 1. Itens no chão.
let atual = null;
for (const l of ler(join(repo, "data/scripts/item_ball_scripts.inc")).split(/\r?\n/)) {
  const rot = l.match(/^([A-Za-z0-9]+(?:_[A-Za-z0-9]+)*?)_EventScript_/);
  if (rot) atual = rot[1];
  const f = l.match(/finditem (ITEM_\w+)/);
  if (f && atual) anotar(f[1], localLegivel(atual), "no chão", etapaDaPasta(atual));
}

// 2. Mapas: escondidos, presentes, Pokémon de presente segurando o item, lojas.
for (const pasta of readdirSync(join(repo, "data/maps"))) {
  const etapa = etapaDaPasta(pasta), local = localLegivel(pasta);
  const mapa = join(repo, "data/maps", pasta, "map.json");
  if (existsSync(mapa)) {
    for (const ev of (JSON.parse(ler(mapa)).bg_events || [])) if (ev.type === "hidden_item") anotar(ev.item, local, "escondido", etapa);
  }
  const scr = join(repo, "data/maps", pasta, "scripts.pory");
  if (!existsSync(scr)) continue;
  for (const l of ler(scr).split(/\r?\n/)) {
    let m;
    if ((m = l.match(/\b(?:giveitem|finditem)\(?\s*(ITEM_\w+)/))) anotar(m[1], local, "presente", etapa);
    else if ((m = l.match(/\bgivecustommon\(?\s*SPECIES_\w+\s*,\s*\d+\s*,\s*(ITEM_\w+)/))) anotar(m[1], local, "segurado por um Pokémon de presente", etapa);
    else if ((m = l.match(/^\s*\.2byte (ITEM_\w+)/))) anotar(m[1], local, "loja", etapa);
    else if (/ExchangeService/.test(pasta) && (m = l.match(/setvar VAR_0x8009, (ITEM_\w+)/))) anotar(m[1], local, "troca por BP", etapa);
  }
}

// 3. Lojas gerais por insígnia.
let lista = null;
for (const l of ler(join(repo, "data/scripts/general_mart.inc")).split(/\r?\n/)) {
  const rot = l.match(/^PokeMart_(?:Poke_Center_)?(\w+?)_Badge::/);
  if (rot) lista = INSIGNIA[rot[1]] !== undefined ? INSIGNIA[rot[1]] : null;
  else if (/^\w+::/.test(l)) lista = /No_Badges|Pokedex/.test(l) ? 0 : null;
  const m = l.match(/^\s*\.2byte (ITEM_\w+)/);
  if (m && lista !== null) anotar(m[1], "Poké Mart (a partir da " + lista + "ª insígnia)".replace("da 0ª insígnia", "o começo"), "loja", lista);
}

// Uma linha por (local, como), da etapa mais cedo para a mais tarde; no máximo 6 por item.
const saida = {};
for (const nome of Object.keys(achados).sort()) {
  const vistos = new Set();
  saida[nome] = achados[nome]
    .sort((a, b) => (a.etapa === null) - (b.etapa === null) || (a.etapa || 0) - (b.etapa || 0) || a.local.localeCompare(b.local))
    .filter((x) => { const k = x.local + "|" + x.como; if (vistos.has(k)) return false; vistos.add(k); return true; })
    .slice(0, 6);
}
writeFileSync("data/onde_achar_itens.json", JSON.stringify(saida));
const semEtapa = Object.entries(saida).filter(([, v]) => v.every((x) => x.etapa === null)).map(([k]) => k);
console.log("onde_achar_itens.json: " + Object.keys(saida).length + " itens; só sem etapa: " + semEtapa.length);
