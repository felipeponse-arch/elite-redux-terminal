// Trava de fronteira do bundle (ADR-004 em docs/decisoes_arquitetura.md, 2026-10-02).
// O build cola src/regras e src/ui num <script> só, no mesmo escopo: nada impede
// que uma regra mexa na página ou chame a tela. Esta trava transforma a convenção
// ("src/regras: só lógica, nada aqui lê ou desenha a página") em regra:
//   1. src/regras não usa document nem window;
//   2. src/regras não chama função declarada só em src/ui.
// Comentários e textos entre aspas não contam (só código).
// Uso: node scripts/checar_fronteira.mjs (roda dentro do npm run check)
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (pasta) => readdirSync(join(RAIZ, pasta)).filter((f) => f.endsWith(".js"))
  .map((f) => ({ arquivo: pasta + "/" + f, texto: readFileSync(join(RAIZ, pasta, f), "utf8") }));
const soCodigo = (t) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")
  .replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g, '""');
const funcoes = (lista) => new Set(lista.flatMap((a) => [...a.texto.matchAll(/^\s*function\s+([A-Za-z_$][\w$]*)\s*\(/gm)].map((m) => m[1])));

const regras = ler("src/regras"), ui = ler("src/ui");
const daRegra = funcoes(regras);
const soDaUi = [...funcoes(ui)].filter((n) => !daRegra.has(n));
const erros = [];
for (const { arquivo, texto } of regras) {
  const codigo = soCodigo(texto);
  codigo.split("\n").forEach((linha, i) => {
    if (/\b(document|window)\s*\./.test(linha)) erros.push(arquivo + ":" + (i + 1) + " usa document/window");
    for (const n of soDaUi) if (new RegExp("(^|[^\\w$.])" + n.replace(/\$/g, "\\$") + "\\s*\\(").test(linha)) erros.push(arquivo + ":" + (i + 1) + " chama " + n + " (função de src/ui)");
  });
}
if (erros.length) {
  console.error("checar_fronteira: src/regras não pode depender da página nem da tela (ADR-004):\n  " + erros.join("\n  "));
  process.exit(1);
}
console.log("checar_fronteira: OK (" + regras.length + " arquivos de regras, " + soDaUi.length + " funções só da UI)");
