// Travas dos tokens de CSS (fase 7 da refatoração, 2026-09-24). Roda no
// `npm run check`. O stylelint cuida da sintaxe; isto cuida do que só faz
// sentido neste app:
//
//  1. A paleta escura existe DUAS vezes em src/css/tokens.css - uma no
//     @media (prefers-color-scheme: dark) (tema do sistema) e outra em
//     :root[data-theme="dark"] (tema escolhido na plataforma). É o padrão
//     exigido pelos artifacts, mas nada garantia que as duas continuassem
//     iguais: mudar uma e esquecer a outra deixa o app com duas cores
//     diferentes pro "mesmo" escuro. Aqui têm que ser idênticas.
//  2. Claro, escuro e alto contraste definem o MESMO conjunto de cores - um
//     token que só existe no claro faria o escuro herdar a cor clara.
//  3. Todo var(--x) usado no CSS, no JS e no template está declarado.
import { readFileSync, readdirSync } from "node:fs";

const erros = [];
const tokensCss = readFileSync("src/css/tokens.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

// Corpo do bloco que começa em `abertura` (contando chaves).
function bloco(texto, abertura) {
  const i = texto.indexOf(abertura);
  if (i === -1) { erros.push(`tokens.css: bloco não encontrado: ${abertura}`); return ""; }
  let prof = 0;
  for (let j = texto.indexOf("{", i); j < texto.length; j++) {
    if (texto[j] === "{") prof++;
    else if (texto[j] === "}" && --prof === 0) return texto.slice(texto.indexOf("{", i) + 1, j);
  }
  return "";
}
function declaracoes(corpo) {
  const m = new Map();
  for (const [, nome, valor] of corpo.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) m.set(nome, valor.trim());
  return m;
}

const claro = declaracoes(bloco(tokensCss, ":root {"));
const escuroSistema = declaracoes(bloco(bloco(tokensCss, "@media (prefers-color-scheme: dark)"), ':root:not([data-theme="light"])'));
const escuroEscolhido = declaracoes(bloco(tokensCss, ':root[data-theme="dark"]'));
const altoContraste = declaracoes(bloco(tokensCss, ':root[data-high-contrast="true"]'));

// 1. as duas cópias da paleta escura
for (const [nome, valor] of escuroSistema) {
  if (!escuroEscolhido.has(nome)) erros.push(`escuro: ${nome} está no @media (tema do sistema) e falta em [data-theme="dark"]`);
  else if (escuroEscolhido.get(nome) !== valor) erros.push(`escuro: ${nome} = ${valor} no @media, mas ${escuroEscolhido.get(nome)} em [data-theme="dark"]`);
}
for (const nome of escuroEscolhido.keys()) {
  if (!escuroSistema.has(nome)) erros.push(`escuro: ${nome} está em [data-theme="dark"] e falta no @media (tema do sistema)`);
}

// 2. mesmo conjunto de cores nos três temas (a estrutura - raio etc. - só
// existe no :root claro, e é igual em todos)
const cores = [...escuroSistema.keys()];
for (const [tema, mapa] of [["claro", claro], ["alto contraste", altoContraste]]) {
  for (const nome of cores) if (!mapa.has(nome)) erros.push(`${tema}: falta ${nome} (o escuro define)`);
}
for (const nome of altoContraste.keys()) if (!escuroSistema.has(nome)) erros.push(`alto contraste: ${nome} não existe no escuro`);

// 3. todo var(--x) declarado em algum lugar
const declarados = new Set([...claro.keys(), ...escuroSistema.keys(), ...altoContraste.keys()]);
const fontes = [
  ...readdirSync("src/css").map((f) => "src/css/" + f),
  ...readdirSync("src/ui").map((f) => "src/ui/" + f),
  ...readdirSync("src/regras").map((f) => "src/regras/" + f),
  "artifact_template.html",
];
for (const arquivo of fontes) {
  const texto = readFileSync(arquivo, "utf8");
  for (const [, nome] of texto.matchAll(/var\((--[\w-]+)/g)) {
    // Tokens locais de componente, definidos no próprio elemento (inline ou
    // numa regra) - declarados onde são usados, não no :root.
    if (new RegExp(`${nome}\\s*:`).test(texto)) continue;
    if (!declarados.has(nome)) erros.push(`${arquivo}: var(${nome}) usado mas nunca declarado`);
  }
}

// 4. tamanho de fonte inline (HTML montado no JS e no template) também só por
// token da escala - o stylelint só enxerga os .css.
for (const arquivo of fontes.filter((f) => !f.endsWith(".css"))) {
  readFileSync(arquivo, "utf8").split("\n").forEach((linha, i) => {
    for (const [, valor] of linha.matchAll(/font-size:\s*([^;"']+)/g)) {
      if (!/^var\(--fs-[a-z]+\)$/.test(valor.trim())) erros.push(`${arquivo}:${i + 1}: font-size "${valor.trim()}" fora da escala (use var(--fs-...))`);
    }
  });
}

if (erros.length) {
  console.error(`checar_css: ${erros.length} problema(s)`);
  for (const e of [...new Set(erros)]) console.error("  - " + e);
  process.exit(1);
}
console.log(`checar_css: OK (${cores.length} cores iguais nos 3 temas, 2 cópias do escuro idênticas, ${declarados.size} tokens)`);
