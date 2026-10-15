// Categorias de golpe (soco, mordida, corte...) pelas FLAGS do jogo, não pelo texto da NextDex.
// Ticket calibracao-2026-10-15/01 (15/10/2026). O texto curto da NextDex só cita "Iron Fist boost" e parecidos
// em parte dos golpes: Crunch, Stone Edge, Brick Break, Wood Hammer, Sludge Bomb e outros 90 ficavam sem
// categoria e as habilidades (Strong Jaw, Keen Edge, Iron Fist, Super Slammer, Mega Launcher...) não os reforçavam.
// O código do jogo lê a flag do golpe (abilities.cc DoesMoveMatchFlag e gBattleMoves[move].hammerBased,
// hornBased, arrowBased, throwingBased...), e a flag vem do MoveList.textproto da er-config.
//
// Uso: node scripts/categorias_pela_config.mjs <MoveList.textproto> [--commit=<hash da er-config>]
// Grava data/golpes_flags_config.json: { meta, golpes: { "<nome do golpe>": ["iron_fist", ...] }, recuos: { "<golpe>": 33 }, acertos: { "<golpe>": 2 } }
//   golpes = só golpes com flag; recuos = golpes cujo `effect` é EFFECT_RECOIL_25/33/50 (a descrição da NextDex pode dizer outro número:
//   Atomic Fire diz 50% e o jogo faz 33%); acertos = golpes com hit_count maior que 1 (ticket calibracao-03, B5).
// A tradução flag -> categoria fica aqui (FLAG_PARA_CATEGORIA) e é usada por extrair_categorias_golpes.mjs.
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Flag da MoveList -> categoria do motor (os nomes em português são os de data/move_categorias.json).
// `air` e `contact` NÃO entram: já vêm do dado do app (flags "Air/Wing Based" e "Makes Contact" do dex_compact).
// luz, lunar e broca não são lidas por nenhuma habilidade do dado 2.65beta; ficam gravadas para a versão atual.
export const FLAG_PARA_CATEGORIA = {
  iron_fist: "soco",
  strong_jaw: "mordida",
  keen_edge: "corte",
  mega_launcher: "pulso",
  horn: "chifre",
  striker: "chute",
  arrow: "flecha",
  hammer: "martelo",
  throwing: "arremesso",
  light: "luz",
  lunar: "lunar",
  drill: "broca"
};

// Lê só o que interessa do textproto: id, nome e as flags booleanas de cada bloco `moves { ... }`.
// Blocos aninhados (argument { ... }) são pulados por profundidade.
export function lerGolpesDaConfig(texto) {
  const golpes = [];
  let atual = null, profundidade = 0;
  for (const bruta of texto.split(/\r?\n/)) {
    const l = bruta.trim();
    if (!atual) {
      if (l === "moves {") { atual = { flags: [] }; profundidade = 1; }
      continue;
    }
    if (l.endsWith("{")) { profundidade++; continue; }
    if (l === "}") {
      profundidade--;
      if (profundidade === 0) { golpes.push(atual); atual = null; }
      continue;
    }
    if (profundidade !== 1) continue;
    const m = l.match(/^(\w+): (.*)$/);
    if (!m) continue;
    if (m[1] === "id") atual.id = m[2];
    else if (m[1] === "name") atual.nome = m[2].replace(/^"|"$/g, "").replace(/\\'/g, "'");
    else if (m[1] === "effect") atual.efeito = m[2];
    else if (m[1] === "hit_count") atual.acertos = parseInt(m[2], 10);
    else if (m[2] === "true" && FLAG_PARA_CATEGORIA[m[1]]) atual.flags.push(m[1]);
  }
  return golpes;
}

// Recuo em % do dano que o jogo faz pelo `effect` do golpe (EFFECT_RECOIL_33 -> 33); null se o efeito não é de recuo fixo.
export function recuoDoEfeito(efeito) {
  const m = /^EFFECT_RECOIL_(25|33|50)$/.exec(efeito || "");
  return m ? parseInt(m[1], 10) : null;
}

// Categorias do motor de um golpe, na ordem de FLAG_PARA_CATEGORIA.
export function categoriasDasFlags(flags) {
  const tem = new Set(flags || []);
  return Object.keys(FLAG_PARA_CATEGORIA).filter((f) => tem.has(f)).map((f) => FLAG_PARA_CATEGORIA[f]);
}

if ((process.argv[1] || "").endsWith("categorias_pela_config.mjs")) {
  const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
  const arq = process.argv[2];
  if (!arq) { console.error("uso: node scripts/categorias_pela_config.mjs <MoveList.textproto> [--commit=<hash>]"); process.exit(2); }
  const commit = (process.argv.find((a) => a.startsWith("--commit=")) || "").slice(9) || "desconhecido";
  const dex = JSON.parse(readFileSync(join(RAIZ, "data", "dex_compact.json"), "utf8"));
  const config = lerGolpesDaConfig(readFileSync(arq, "utf8"));
  const porNome = new Map(config.filter((g) => g.nome).map((g) => [g.nome, g]));
  // O par é por nome: dois golpes com o mesmo nome na config trocariam as flags em silêncio.
  if (porNome.size !== config.filter((g) => g.nome).length) { console.error("nome de golpe repetido na config: o par por nome deixou de valer"); process.exit(1); }
  const golpes = {}, recuos = {}, acertos = {}, semPar = [];
  for (const m of dex.moves) {
    if (!m) continue;
    const g = porNome.get(m[0]);
    if (!g) { semPar.push(m[0]); continue; }
    if (g.flags.length) golpes[m[0]] = g.flags;
    if (recuoDoEfeito(g.efeito)) recuos[m[0]] = recuoDoEfeito(g.efeito);
    if (g.acertos > 1) acertos[m[0]] = g.acertos;
  }
  if (semPar.length) { console.error("golpes do app sem par na config: " + semPar.join(", ")); process.exit(1); }
  const meta = { fonte: "Elite-Redux/er-config MoveList.textproto", commit, versaoDoDado: dex.meta && dex.meta.version, golpesDaConfig: config.length, golpesDoApp: dex.moves.filter(Boolean).length };
  writeFileSync(join(RAIZ, "data", "golpes_flags_config.json"), JSON.stringify({ meta, golpes, recuos, acertos }) + "\n");
  console.log("data/golpes_flags_config.json: " + Object.keys(golpes).length + " golpes com flag (de " + meta.golpesDoApp + ") - er-config " + commit);
}
