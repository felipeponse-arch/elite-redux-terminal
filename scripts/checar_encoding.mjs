// Trava de codificação (fase 1 da refatoração, 2026-09-24). Origem: no mesmo dia
// uma troca em lote com PowerShell 5.1 (Get-Content sem -Encoding) corrompeu os
// acentos do template ("evolução" virou mojibake), e o levantamento achou texto
// assim já versionado (scripts/smoke_tests/99_runner.js) e 16 habilidades com nota
// errada no rank porque common.ps1 não tinha BOM (o PS 5.1 lê .ps1 sem BOM na
// codepage do Windows e o "ç" do regex virava outra coisa).
//
// Falha quando, em arquivo versionado de texto:
//   1. aparece texto corrompido (UTF-8 lido como cp1252: "Ã" + um byte de
//      continuação) ou o caractere de substituição U+FFFD. Linha que cita a
//      palavra "mojibake" é exemplo documentado de propósito e fica de fora;
//   2. um .ps1 tem caractere fora do ASCII e não começa com BOM UTF-8.
//
//   node scripts/checar_encoding.mjs
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const TEXTO = /\.(js|mjs|cjs|ps1|html|css|md|json|yml|yaml|txt)$/i;
// Gerado (artifact_final.html) e dump bruto do jogo, que vem de fora como está.
export const FORA = [/^artifact_final\.html$/, /^data\/gameData_[^/]+\.json$/, /^data\/raw\//];
// Montado por código de caractere (e não com os caracteres no fonte) pra este
// próprio arquivo não conter o padrão que ele procura.
const ch = (n) => String.fromCharCode(n);
const CORROMPIDO = new RegExp(ch(0xc3) + "[" + ch(0x80) + "-" + ch(0xbf) + "]|" + ch(0xfffd));

// Regra pura: problemas de um arquivo (caminho relativo + bytes). Lista vazia = ok.
export function problemasDeEncoding(caminho, bytes) {
  const problemas = [];
  const texto = bytes.toString("utf8");
  texto.split("\n").forEach((linha, i) => {
    if (CORROMPIDO.test(linha) && !/mojibake/i.test(linha)) problemas.push(`${caminho}:${i + 1}: texto corrompido -> ${linha.trim().slice(0, 100)}`);
  });
  const temBom = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
  if (/\.ps1$/i.test(caminho) && !temBom && /[^\x00-\x7F]/.test(texto)) {
    problemas.push(`${caminho}: .ps1 com acento e sem BOM UTF-8 - o PowerShell 5.1 lê na codepage do Windows e corrompe o acento`);
  }
  return problemas;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const arquivos = execSync("git ls-files", { encoding: "utf8" }).split("\n").map((f) => f.trim())
    .filter((f) => f && TEXTO.test(f) && !FORA.some((r) => r.test(f)));
  const problemas = arquivos.flatMap((f) => problemasDeEncoding(f, readFileSync(f)));
  if (problemas.length) {
    console.error(problemas.join("\n"));
    console.error(`\nchecar_encoding: ${problemas.length} problema(s). Edite com o Edit/editor (UTF-8), nunca com Get-Content sem -Encoding UTF8.`);
    process.exit(1);
  }
  console.log(`checar_encoding: OK (${arquivos.length} arquivos de texto versionados)`);
}
