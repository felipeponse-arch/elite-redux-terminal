// Carrega src/regras/*.js no Node, sem navegador (item Q3 da pauta técnica,
// 2026-09-16). Faz o que o app faz na página: os mesmos JSON de data/ viram as
// mesmas variáveis globais que o <script> principal cria com JSON.parse, e os
// arquivos de regra rodam no mesmo escopo, na ORDEM dos marcadores
// /*@regras NOME*/ do template - não existe uma segunda lista pra desatualizar.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const lerJson = (nome) => JSON.parse(readFileSync(join(root, "data", nome), "utf8"));

export function carregarRegras({ difficulty = "ace", milestone = 0, megaMode = "temporaria" } = {}) {
  const contexto = {
    console,
    DATA: lerJson("dex_compact.json"),
    BUILDS: lerJson("builds.json"),
    SPECIES_RANK: lerJson("species_rank.json"),
    SPECIES_ROLE: lerJson("species_role.json"),
    ABILITY_SYNERGY: lerJson("species_ability_synergy.json"),
    MEGA_FORMS: lerJson("mega_forms.json"),
    LEVELCAPS: lerJson("levelcaps.json"),
    MOVE_PT: lerJson("move_translations_pt.json"),
    ITEM_DESC: lerJson("item_descriptions.json"),
    ITEM_PT: lerJson("item_translations_pt.json"),
    MOVE_ROLES: lerJson("move_roles.json"),
    state: { settings: { difficulty, milestone, megaMode }, customBuilds: {}, notes: {} },
  };
  vm.createContext(contexto);
  const template = readFileSync(join(root, "artifact_template.html"), "utf8");
  const nomes = [...template.matchAll(/\/\*@regras ([A-Za-z0-9_.]+)\*\//g)].map((m) => m[1]);
  if (!nomes.length) throw new Error("nenhum marcador /*@regras NOME*/ no template");
  for (const nome of nomes) {
    const codigo = readFileSync(join(root, "src", "regras", nome), "utf8");
    vm.runInContext(codigo, contexto, { filename: "src/regras/" + nome });
  }
  return contexto;
}
