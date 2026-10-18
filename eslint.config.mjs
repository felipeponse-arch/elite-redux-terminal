// ESLint (fase 1 da refatoração, 2026-09-24). Só regras de CORREÇÃO (variável
// indefinida, não usada, redeclarada, código inalcançável...), nada de estilo.
//
// Particularidades deste projeto, resolvidas aqui e não com listas à mão:
//  - src/regras/*.js são coladas dentro do <script> do template e compartilham
//    o escopo global com ele: os nomes que cada arquivo declara no topo (e os
//    que o template declara) viram globais conhecidas dos outros. A lista é
//    DERIVADA dos próprios arquivos a cada execução - não há segunda lista
//    pra desatualizar.
//  - o JS do app mora dentro do artifact_template.html: um processador extrai
//    o <script> principal e mantém o número de linha do template.
//  - scripts/smoke_tests/*.js são concatenados e rodam juntos na página: o
//    mesmo esquema de globais derivadas vale pra eles.
import js from "@eslint/js";
import globals from "globals";
import { readFileSync, readdirSync } from "node:fs";

// `function*` (gerador, 2026-09-30: simulador do chefão em passos) também conta.
const DECL = /^( {0,2})(?:async\s+)?function(?:\s*\*\s*|\s+)([A-Za-z_$][\w$]*)|^( {0,2})(?:var|let|const)\s+([A-Za-z_$][\w$]*)/;
function nomesDoTopo(texto, recuo) {
  const nomes = new Set();
  for (const linha of texto.split("\n")) {
    const m = linha.match(DECL);
    if (!m) continue;
    const ind = (m[1] ?? m[3] ?? "").length;
    if (ind === recuo) nomes.add(m[2] || m[4]);
  }
  return nomes;
}
const comoGlobais = (nomes, modo) => Object.fromEntries([...nomes].map((n) => [n, modo]));

// Nomes do topo das regras (recuo de 2 espaços, dentro do script do app) e do
// próprio script do template (mesmo recuo, dentro do IIFE).
const REGRAS = readdirSync("src/regras").filter((f) => f.endsWith(".js"));
const nomesRegras = new Set();
for (const f of REGRAS) for (const n of nomesDoTopo(readFileSync("src/regras/" + f, "utf8"), 2)) nomesRegras.add(n);
const template = readFileSync("artifact_template.html", "utf8");
const scriptPrincipal = (template.match(/<script>([\s\S]*?)<\/script>/) || ["", ""])[1];
const nomesTemplate = nomesDoTopo(scriptPrincipal, 2);
// Interface (src/ui, fase 5): colada no mesmo <script>, mesmo escopo.
const UI = readdirSync("src/ui").filter((f) => f.endsWith(".js"));
const nomesUi = new Set();
for (const f of UI) for (const n of nomesDoTopo(readFileSync("src/ui/" + f, "utf8"), 2)) nomesUi.add(n);
const SMOKE = readdirSync("scripts/smoke_tests").filter((f) => f.endsWith(".js"));
const nomesSmoke = new Set();
for (const f of SMOKE) for (const n of nomesDoTopo(readFileSync("scripts/smoke_tests/" + f, "utf8"), 0)) nomesSmoke.add(n);

// Processador: entrega ao ESLint só o <script> principal do template, com as
// linhas anteriores em branco (a linha do erro é a do template). As regras de
// src/regras, que o build cola nos marcadores /*@regras*/, entram no FIM do
// mesmo escopo (antes do fechamento do IIFE): assim o que só elas usam não
// aparece como "não usado", sem mexer no número de linha do template. Achado
// dentro da parte colada é descartado - cada regra é analisada no próprio arquivo.
let linhasDoTemplate = 0;
const processadorTemplate = {
  preprocess(texto) {
    const m = texto.match(/<script>([\s\S]*?)<\/script>/);
    if (!m) return [];
    const antes = texto.slice(0, m.index + "<script>".length).split("\n").length - 1;
    let js = "\n".repeat(antes) + m[1];
    linhasDoTemplate = texto.split("\n").length;
    const fim = js.lastIndexOf("})(");
    const regras = REGRAS.map((f) => readFileSync("src/regras/" + f, "utf8"))
      .concat(UI.map((f) => readFileSync("src/ui/" + f, "utf8"))).join("\n");
    if (fim !== -1) {
      // O trecho depois do fechamento vai pra depois das regras, numa linha só
      // (é só "})();" e espaço), pra nada do template mudar de linha.
      js = js.slice(0, fim) + "\n".repeat(Math.max(0, linhasDoTemplate - js.slice(0, fim).split("\n").length + 1)) + regras + "\n" + js.slice(fim).replace(/\n/g, " ");
    }
    return [{ text: js, filename: "app.js" }];
  },
  postprocess(mensagens) { return mensagens.flat().filter((msg) => msg.line <= linhasDoTemplate); },
  supportsAutofix: false,
};

const CORRECAO = {
  ...js.configs.recommended.rules,
  // Estilo/ruído, não correção:
  "no-empty": ["error", { allowEmptyCatch: true }],
  "no-useless-escape": "off",
  "no-prototype-builtins": "off",
  "no-cond-assign": ["error", "except-parens"],
  // Segurança: eval só onde é deliberado (o carregador da suíte) e marcado.
  "no-eval": "error",
  "no-implied-eval": "error",
  "no-unused-vars": ["error", { args: "none", caughtErrors: "none", varsIgnorePattern: "^_" }],
};

export default [
  { ignores: ["artifact_final.html", "node_modules/**", "tests/visual_*/**", "data/**", ".git/**", "test-results*/**", "playwright-report*/**", ".claude/**"] },
  {
    files: ["src/regras/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022, sourceType: "script",
      globals: { ...globals.browser, ...comoGlobais(nomesRegras, "writable"), ...comoGlobais(nomesTemplate, "writable"), ...comoGlobais(nomesUi, "writable") },
    },
    rules: {
      ...CORRECAO,
      // Cada função do topo de uma regra é usada por OUTRO arquivo (template ou
      // outra regra) - "não usada" dentro do arquivo não quer dizer morta.
      "no-unused-vars": ["error", { args: "none", caughtErrors: "none", vars: "local" }],
      // O nome declarado aqui também aparece na lista de globais derivada.
      "no-redeclare": ["error", { builtinGlobals: false }],
      // Variável lida antes da declaração (2026-09-30): o `var alt` do duelo era
      // lido antes de receber valor e a Giant Shuriken enfraquecia o golpe, sem
      // nenhum teste perceber. Funções podem (içamento de função é intencional).
      "no-use-before-define": ["error", { functions: false, classes: false, variables: true }],
    },
  },
  {
    // Interface: enxerga os nomes do template, das regras e dos outros arquivos
    // de interface. "Não usada" só vale dentro de função (o que é do topo é
    // usado por outro arquivo) - mesma regra das regras.
    files: ["src/ui/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022, sourceType: "script",
      globals: { ...globals.browser, ...comoGlobais(nomesRegras, "writable"), ...comoGlobais(nomesTemplate, "writable"), ...comoGlobais(nomesUi, "writable"), claude: "readonly" },
    },
    rules: {
      ...CORRECAO,
      "no-unused-vars": ["error", { args: "none", caughtErrors: "none", vars: "local" }],
      "no-redeclare": ["error", { builtinGlobals: false }],
    },
  },
  {
    files: ["artifact_template.html"],
    plugins: { app: { processors: { template: processadorTemplate } } },
    processor: "app/template",
  },
  {
    // O ESLint nomeia o bloco extraído como "artifact_template.html/0_app.js".
    files: ["artifact_template.html/*.js"],
    languageOptions: {
      ecmaVersion: 2022, sourceType: "script",
      globals: { ...globals.browser, claude: "readonly" },
    },
    rules: { ...CORRECAO, "no-redeclare": ["error", { builtinGlobals: false }] },
  },
  {
    files: ["scripts/smoke_tests/**/*.js", "scripts/smoke_test_suite.js"],
    languageOptions: {
      ecmaVersion: 2022, sourceType: "script",
      globals: { ...globals.browser, ...comoGlobais(nomesSmoke, "writable") },
    },
    rules: {
      ...CORRECAO,
      "no-unused-vars": ["error", { args: "none", caughtErrors: "none", vars: "local" }],
      "no-redeclare": ["error", { builtinGlobals: false }],
    },
  },
  {
    files: ["**/*.mjs"],
    languageOptions: { ecmaVersion: 2022, sourceType: "module", globals: { ...globals.node } },
    rules: CORRECAO,
  },
  {
    // Testes Playwright: o corpo de page.evaluate()/addInitScript roda na
    // página, onde window/document existem.
    files: ["tests/e2e/**/*.mjs"],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  {
    // Tamanho de arquivo (setup do vibe-coding-toolkit, 17/10/2026): referência de 350 linhas, como AVISO. Na adoção eram 14
    // arquivos acima (duelo.js 4455); o plano de redução está em docs/tickets/arquivos-grandes/01. Não vira erro antes do plano.
    files: ["src/**/*.js"],
    rules: { "max-lines": ["warn", { max: 350 }] },
  },
];
