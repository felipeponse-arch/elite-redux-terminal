// Carrega src/regras/*.js no Node, sem navegador (item Q3 da pauta técnica,
// 2026-09-16). Faz o que o app faz na página: os mesmos JSON de data/ viram as
// mesmas variáveis globais que o <script> principal cria com JSON.parse, e os
// arquivos de regra rodam no mesmo escopo, na ORDEM dos marcadores
// /*@regras NOME*/ do template - não existe uma segunda lista pra desatualizar.
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
// Sabotagem controlada também nos JSON de data/ (15/10/2026): MUTACAO_ARQUIVO igual ao nome do arquivo troca o trecho só nesta carga.
// Sem isso, sabotagens de dado (dex_compact.json, move_roles.json, mega_forms.json...) sobreviviam em testes que só usam carregarRegras.
const lerJson = (nome) => JSON.parse(aplicarTrecho(readFileSync(join(root, "data", nome), "utf8").replace(/\r\n/g, "\n"), nome));

// Mesma reindexação por sname que o artifact_template.html faz ao carregar (CONDITION_MOVE_SYNERGY):
// (índice usado pelas regras de dados).
function indexarCondicaoGolpe(bruto) {
  const porSname = {};
  const add = (sname, entrada) => { (porSname[sname] = porSname[sname] || []).push(entrada); };
  (bruto.comboClimaAutossuficiente || []).forEach((c) => add(c.sname, { habilidade: c.habilidade, kind: c.kind, tipo: "clima", clima: c.clima, golpes: [c.golpe] }));
  (bruto.comboHpBaixoComRecuo || []).forEach((c) => add(c.sname, { habilidade: c.habilidade, kind: c.kind, tipo: "hp_baixo", golpes: c.golpesRecuo || [] }));
  return porSname;
}

// Carregador ÚNICO da sabotagem de arquivos fora do vm (TK-29, 27/10/2026): as seis cópias que cada teste
// trazia (rank_escolha, categorias, chefões, itens, multiplicadores, respostas 08/10) agora chamam isto.
// Troca um trecho EXATO (uma única ocorrência) só na memória, quando MUTACAO_ARQUIVO é o nome do alvo.
export function aplicarTrecho(texto, nome, env = process.env) {
  if (env.MUTACAO_ARQUIVO !== nome) return texto;
  const de = env.MUTACAO_DE;
  if (texto.split(de).length !== 2) throw new Error("trecho da sabotagem não encontrado (ou repetido) em " + nome + ": " + de);
  return texto.replace(de, () => env.MUTACAO_PARA || "");
}
// `caminho` relativo à raiz do app. LF sempre (autocrlf no Windows).
export function lerComMutacao(caminho, nome, env = process.env) {
  return aplicarTrecho(readFileSync(join(root, caminho), "utf8").replace(/\r\n/g, "\n"), nome, env);
}
// Onde mora o alvo de uma sabotagem pelo nome curto do catálogo; null = não existe (ou "@comportamento").
export function caminhoDoAlvo(nome) {
  for (const dir of ["src/regras", "src/ui", "src/css", "scripts", "data"]) {
    if (existsSync(join(root, dir, nome))) return dir + "/" + nome;
  }
  return null;
}

export function carregarRegras({ difficulty = "ace", levelCapMode = "more", milestone = 0, megaMode = "temporaria" } = {}) {
  const contexto = {
    console,
    DATA: lerJson("dex_compact.json"),
    BUILDS: lerJson("builds.json"),
    SPECIES_RANK: lerJson("species_rank.json"),
    SPECIES_ROLE: lerJson("species_role.json"),
    ABILITY_SYNERGY: lerJson("species_ability_synergy.json"),
    MEGA_FORMS: lerJson("mega_forms.json"),
    PEDRAS_ETAPA: lerJson("pedras_etapa.json"),
    LEVELCAPS: lerJson("levelcaps.json"),
    MOVE_PT: lerJson("move_translations_pt.json"),
    ABILITY_PT: lerJson("ability_translations_pt.json"),
    ITEM_DESC: lerJson("item_descriptions.json"),
    ONDE_ACHAR_ITENS: lerJson("onde_achar_itens.json"),
    PODER_VARIAVEL: lerJson("poder_variavel.json"),
    ITEM_PT: lerJson("item_translations_pt.json"),
    MOVE_ROLES: lerJson("move_roles.json"),
    BOSSES: lerJson("bosses.json"),
    GYM_SKILLS: lerJson("gym_skills.json"),
    MONO_DISP: lerJson("mono_disponibilidade.json"),
    MOVE_CATEGORIAS: lerJson("move_categorias.json"),
    ITENS_CONFIG: lerJson("itens_config.json"),
    CONDITION_MOVE_SYNERGY: indexarCondicaoGolpe(lerJson("condition_move_synergy.json")),
    // Mesmo formato do `state` inicial do template (var state = {...}): desde a
    // fase 3 da refatoração (2026-09-24) save, evolução, builds e chefões moram
    // em src/regras e leem o state inteiro.
    state: {
      query: "", typeFilter: new Set(), sort: "dex", selected: null, team: [], box: [],
      settings: { difficulty, levelCapMode, milestone, megaMode, runConfirmedAt: null },
      savedTeams: [], orphans: { team: [], box: [] }, notes: {}, autoEvolved: {}, autoLog: [],
      gymSkillsCleared: {}, customBuilds: {}, strategySets: {}, motorFavoritos: [],
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
  // Sabotagem por COMPORTAMENTO (ticket 07 da dívida técnica, 08/10/2026): arquivo "@comportamento" não
  // troca texto; depois de carregar tudo, reembrulha a função `de` com o corpo `para` (JS que enxerga
  // `original`, `args` e `this`). Sobrevive a refatoração do miolo da função: só depende do nome dela.
  const mutacaoPorComportamento = !!mutacao && mutacao.arquivo === "@comportamento";
  for (const nome of nomes) {
    // Quebra de linha sempre LF: com core.autocrlf o checkout do Windows vem em
    // CRLF, e os trechos das sabotagens (com "\n") deixavam de ser achados.
    let codigo = readFileSync(join(root, "src", "regras", nome), "utf8").replace(/\r\n/g, "\n");
    if (mutacao && !mutacaoPorComportamento && mutacao.arquivo === nome) {
      if (codigo.split(mutacao.de).length !== 2) throw new Error("trecho da sabotagem não encontrado (ou repetido) em " + nome + ": " + mutacao.de);
      codigo = codigo.replace(mutacao.de, () => mutacao.para);
    }
    vm.runInContext(codigo, contexto, { filename: "src/regras/" + nome });
  }
  if (mutacaoPorComportamento) {
    if (vm.runInContext("typeof " + mutacao.de, contexto) !== "function") throw new Error("trecho da sabotagem não encontrado (função inexistente): " + mutacao.de);
    vm.runInContext("(function () { var original = " + mutacao.de + "; " + mutacao.de + " = function () { var args = arguments; " + mutacao.para + " }; })();", contexto);
  }
  return contexto;
}
