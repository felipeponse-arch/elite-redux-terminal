// Montagem do artifact_final.html em Node (fase 8 da refatoração, 2026-09-24).
// Roda em Windows, Linux e macOS - o CI deixa de depender do Windows.
//
// O que faz: valida os dados, cola src/regras, src/ui e src/css nos marcadores
// do template, embute os JSON de data/ e o atlas de sprites, grava a versão
// (commit) no cabeçalho e confere o tamanho final. Não mexe nos dados: a
// extração a partir do dado bruto do jogo (rede, rara) continua em
// scripts/build.ps1, que chama este script no fim.
//
// Uso: npm run build   (ou node scripts/build.mjs)
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { validarBuilds, validarInvariantes } from "./validar_dados.mjs";

const RAIZ = fileURLToPath(new URL("..", import.meta.url));
const DADOS = join(RAIZ, "data");
const SAIDA = join(RAIZ, "artifact_final.html");
const ler = (arquivo) => readFileSync(arquivo, "utf8").replace(/^\uFEFF/, "");
// Troca TODAS as ocorrências sem interpretar "$" no texto novo (o
// String.replace trataria "$&", "$1"... dentro dos dados como padrões).
const trocarTudo = (texto, de, para) => texto.split(de).join(para);
function falhar(msg) {
  console.error("\nBUILD ABORTADO: " + msg);
  process.exit(1);
}

// Placeholder do template -> arquivo de data/.
const ARQUIVOS_DE_DADOS = {
  __DEX_DATA_JSON__: "dex_compact.json",
  __BUILDS_JSON__: "builds.json",
  __BOSSES_JSON__: "bosses.json",
  __LEVELCAPS_JSON__: "levelcaps.json",
  __SAVEDTEAMS_JSON__: "saved_teams_seed.json",
  __ABILITY_PT_JSON__: "ability_translations_pt.json",
  __SPRITE_INDEX_JSON__: "sprite_index.json",
  __MOVE_PT_JSON__: "move_translations_pt.json",
  __BUILD_HISTORY_JSON__: "build_history.json",
  __BOSS_BUILDS_JSON__: "boss_reference_builds.json",
  __SPECIES_RANK_JSON__: "species_rank.json",
  __SPECIES_ROLE_JSON__: "species_role.json",
  __ABILITY_SYNERGY_JSON__: "species_ability_synergy.json",
  __CONDITION_MOVE_SYNERGY_JSON__: "condition_move_synergy.json",
  __MEGA_FORMS_JSON__: "mega_forms.json",
  __MOVE_ROLES_JSON__: "move_roles.json",
  __CHANGELOG_JSON__: "changelog.json",
  __HOW_TO_OBTAIN_JSON__: "how_to_obtain.json",
  __ITEM_DESC_JSON__: "item_descriptions.json",
  __ONDE_ACHAR_ITENS_JSON__: "onde_achar_itens.json",
  __ITEM_PT_JSON__: "item_translations_pt.json",
  __GYM_SKILLS_JSON__: "gym_skills.json",
  __MONO_DISP_JSON__: "mono_disponibilidade.json",
  __MOVE_CATEGORIAS_JSON__: "move_categorias.json",
};

for (const nome of Object.values(ARQUIVOS_DE_DADOS)) {
  if (!existsSync(join(DADOS, nome))) falhar(`falta o arquivo de dados data/${nome}`);
}
const atlas = join(DADOS, "sprite_atlas.png");
if (!existsSync(atlas)) falhar("falta data/sprite_atlas.png - gere com scripts/build_sprite_atlas.ps1 (baixa ~1900 sprites).");

// ---- travas de dado ----
console.log("--- validando dados ---");
for (const [nome, fn] of [["builds.json", validarBuilds], ["invariantes", validarInvariantes]]) {
  const r = fn();
  if (r.problemas.length) {
    for (const p of r.problemas.slice(0, 30)) console.error("  !! " + p);
    falhar(`${r.problemas.length} problema(s) em ${nome} - nenhuma build pode citar habilidade/golpe que a espécie não tem, e os dados derivados têm que bater com o dex.`);
  }
  console.log(`  ${nome}: OK (${r.resumo})`);
}

// ---- código: src/regras, src/ui, src/css nos marcadores /*@tipo NOME*/ ----
// Cada arquivo entra no lugar exato de onde saiu do template (ordem de
// execução do script e da cascata do CSS preservadas). Todo arquivo precisa
// de marcador e todo marcador de arquivo.
console.log("--- colando o código ---");
let final = ler(join(RAIZ, "artifact_template.html"));
for (const [tipo, extensao] of [["regras", ".js"], ["ui", ".js"], ["css", ".css"]]) {
  const pasta = join(RAIZ, "src", tipo);
  const usados = new Set();
  for (const m of final.matchAll(new RegExp(`/\\*@${tipo} ([A-Za-z0-9_.]+)\\*/`, "g"))) {
    const nome = m[1];
    if (usados.has(nome)) falhar(`marcador /*@${tipo} ${nome}*/ aparece mais de uma vez no template.`);
    if (!existsSync(join(pasta, nome))) falhar(`marcador /*@${tipo} ${nome}*/ sem arquivo em src/${tipo}.`);
    usados.add(nome);
  }
  for (const nome of usados) final = trocarTudo(final, `/*@${tipo} ${nome}*/`, ler(join(pasta, nome)).trimEnd());
  for (const f of readdirSync(pasta)) {
    if (f.endsWith(extensao) && !usados.has(f)) falhar(`src/${tipo}/${f} não tem marcador /*@${tipo} ${f}*/ no template - nunca chegaria no app.`);
  }
  if (final.includes(`/*@${tipo} `)) falhar(`sobrou marcador /*@${tipo} ...*/ depois da colagem.`);
  console.log(`  ${tipo}: ${usados.size} arquivo(s)`);
}

// ---- dados ----
console.log("--- embutindo os dados ---");
for (const [placeholder, nome] of Object.entries(ARQUIVOS_DE_DADOS)) {
  const json = ler(join(DADOS, nome));
  try {
    JSON.parse(json);
  } catch (e) {
    falhar(`data/${nome} não é JSON válido: ${e.message}`);
  }
  if (!final.includes(placeholder)) falhar(`placeholder ${placeholder} não está no template.`);
  // Revisão de segurança (2026-09-13): o navegador fecha </script> em
  // qualquer combinação de maiúsculas; um texto da fonte externa (NextDex)
  // com "</SCRIPT" sairia do <script type="application/json">. A barra
  // invertida neutraliza o fechamento sem mudar o JSON.
  const seguro = json.replace(/<\/script/gi, "<\\/script");
  if (/<\/script/i.test(seguro)) falhar(`escaping de </script falhou em data/${nome}.`);
  final = trocarTudo(final, placeholder, seguro);
}
if (!final.includes("__SPRITE_ATLAS_DATAURI__")) falhar("placeholder __SPRITE_ATLAS_DATAURI__ não está no template.");
final = trocarTudo(final, "__SPRITE_ATLAS_DATAURI__", "data:image/png;base64," + readFileSync(atlas).toString("base64"));
// Artes da paleta Shiny (tickets 13-15): data/arte/*.webp viram data URI no CSS (__ARTE_<NOME>_DATAURI__).
for (const [marca, arq] of [["__ARTE_RAYQUAZA_DATAURI__", "arte/rayquaza_shiny.webp"], ["__ARTE_AQUA_DATAURI__", "arte/equipe_aqua.webp"], ["__ARTE_MAGMA_DATAURI__", "arte/equipe_magma.webp"]]) {
  if (!existsSync(join(DADOS, arq))) falhar("falta a arte data/" + arq);
  final = trocarTudo(final, marca, "data:image/webp;base64," + readFileSync(join(DADOS, arq)).toString("base64"));
}
for (const placeholder of [...Object.keys(ARQUIVOS_DE_DADOS), "__SPRITE_ATLAS_DATAURI__"]) {
  if (final.includes(placeholder)) falhar(`placeholder ${placeholder} continua no arquivo depois da colagem.`);
}

// ---- versão no cabeçalho: o commit; "-modificado" com mudança não commitada
// (um build assim nunca devia ser publicado - prepare_publish recusa) ----
let versao = "local";
try {
  const git = (...args) => execFileSync("git", ["-C", RAIZ, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  versao = git("rev-parse", "--short", "HEAD");
  if (git("status", "--porcelain")) versao += "-modificado";
} catch {
  // sem git (ex: pasta copiada) - fica "local"
}
if (!final.includes("__APP_VERSION__")) falhar("placeholder __APP_VERSION__ não está no template.");
final = trocarTudo(final, "__APP_VERSION__", versao);

writeFileSync(SAIDA, final, "utf8");
const bytes = statSync(SAIDA).size;
if (bytes < 500_000) falhar(`arquivo final pequeno demais (${bytes} bytes) - algo falhou em silêncio.`);
// Limite do artifact: 16 MB. Avisa bem antes.
if (bytes > 14_000_000) falhar(`arquivo final com ${bytes} bytes, perto demais do limite de 16 MB.`);
console.log(`--- pronto: artifact_final.html, ${(bytes / 1048576).toFixed(2)} MB, versão ${versao} ---`);
