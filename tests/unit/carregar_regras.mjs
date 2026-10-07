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

export function carregarRegras({ difficulty = "ace", levelCapMode = "more", milestone = 0, megaMode = "temporaria" } = {}) {
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
    ABILITY_PT: lerJson("ability_translations_pt.json"),
    ITEM_DESC: lerJson("item_descriptions.json"),
    ONDE_ACHAR_ITENS: lerJson("onde_achar_itens.json"),
    ITEM_PT: lerJson("item_translations_pt.json"),
    MOVE_ROLES: lerJson("move_roles.json"),
    BOSSES: lerJson("bosses.json"),
    GYM_SKILLS: lerJson("gym_skills.json"),
    MONO_DISP: lerJson("mono_disponibilidade.json"),
    MOVE_CATEGORIAS: lerJson("move_categorias.json"),
    // Mesmo formato do `state` inicial do template (var state = {...}): desde a
    // fase 3 da refatoração (2026-09-24) save, evolução, builds e chefões moram
    // em src/regras e leem o state inteiro.
    state: {
      query: "", typeFilter: new Set(), sort: "dex", selected: null, team: [], box: [],
      settings: { difficulty, levelCapMode, milestone, megaMode, runConfirmedAt: null },
      savedTeams: [], orphans: { team: [], box: [] }, notes: {}, autoEvolved: {}, autoLog: [],
      gymSkillsCleared: {}, customBuilds: {}, strategySets: {},
      archetype: { pace: null, weather: null, monotype: null, tatica: null, reasoning: "" },
    },
  };
  vm.createContext(contexto);
  const template = readFileSync(join(root, "artifact_template.html"), "utf8");
  const nomes = [...template.matchAll(/\/\*@regras ([A-Za-z0-9_.]+)\*\//g)].map((m) => m[1]);
  if (!nomes.length) throw new Error("nenhum marcador /*@regras NOME*/ no template");
  // Sabotagem controlada (tests/run_sabotage.mjs): MUTACAO_ARQUIVO/DE/PARA
  // trocam um trecho exato de um arquivo só nesta carga, nunca no disco.
  const mutacao = process.env.MUTACAO_ARQUIVO
    ? { arquivo: process.env.MUTACAO_ARQUIVO, de: process.env.MUTACAO_DE, para: process.env.MUTACAO_PARA || "" }
    : null;
  for (const nome of nomes) {
    // Quebra de linha sempre LF: com core.autocrlf o checkout do Windows vem em
    // CRLF, e os trechos das sabotagens (com "\n") deixavam de ser achados.
    let codigo = readFileSync(join(root, "src", "regras", nome), "utf8").replace(/\r\n/g, "\n");
    if (mutacao && mutacao.arquivo === nome) {
      if (codigo.split(mutacao.de).length !== 2) throw new Error("trecho da sabotagem não encontrado (ou repetido) em " + nome + ": " + mutacao.de);
      codigo = codigo.replace(mutacao.de, () => mutacao.para);
    }
    vm.runInContext(codigo, contexto, { filename: "src/regras/" + nome });
  }
  return contexto;
}
