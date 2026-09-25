// Alarme de versão nova do Elite Redux (2026-09-24, pedido do usuário: "faz o
// alarme"). Roda toda semana no GitHub Actions (.github/workflows/
// alarme_upstream.yml) e só FALHA quando algo mudou de verdade - execução
// agendada que falha gera o e-mail do GitHub; em dia, silêncio.
//
// Confere três coisas contra o que o app usa hoje:
//   1. a versão que o NextDex oficial abre por padrão (último item de
//      allVersions em static/js/data_version.js - o próprio site usa essa regra);
//   2. se o arquivo de dados dessa versão continua idêntico ao nosso snapshot
//      (data/gameData_265beta.json) - os devs às vezes corrigem dados sem trocar
//      o número da versão;
//   3. a "Latest Version" da página de download do site oficial.
//
// Resultado: 0 = em dia; 1 = mudou (ou a página mudou de formato e o alarme
// ficou cego - também é motivo pra olhar). Falha de rede depois de 3 tentativas
// só vira aviso: um e-mail por instabilidade de internet seria ruído.
//
// Versão local em PowerShell mais antiga: scripts/check_upstream.ps1 (só os
// itens 1 e 2). Quando o alarme tocar: baixar o gameData novo em data/, rodar
// scripts/build.ps1 SEM -SkipExtract e atualizar as constantes abaixo.
import { readFileSync, appendFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const VERSAO_DEX = "2.65beta";
export const VERSAO_JOGO = "2.65.3b";
const BASE_DEX = "https://raw.githubusercontent.com/ForwardFeed/ER-nextdex/main";
const PAGINA_DOWNLOAD = "https://eliteredux.net/download/";

// Último item de `allVersions = [...]`; null se o formato do arquivo mudou.
export function ultimaVersaoDoDex(js) {
  const lista = /allVersions\s*=\s*\[([\s\S]*?)\]/.exec(js);
  if (!lista) return null;
  const versoes = [...lista[1].matchAll(/["']([^"']+)["']/g)].map((m) => m[1]);
  return versoes.length ? versoes[versoes.length - 1] : null;
}

// "Latest Version v2.65.3b" (com ou sem o "v", entre tags HTML); null se sumiu.
export function versaoDaPaginaDeDownload(html) {
  const texto = html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ");
  const m = /Latest\s+Version\s*:?\s*v?(\d+(?:\.\d+)+[a-z]?)/i.exec(texto);
  return m ? m[1] : null;
}

// Hash ignorando \r: no Windows o checkout pode trazer CRLF, no Linux não.
export function hashDoConteudo(buf) {
  const semCR = Buffer.from(buf.toString("utf8").replace(/\r/g, ""), "utf8");
  return createHash("sha256").update(semCR).digest("hex");
}

async function baixar(url, comoBytes = false) {
  let ultimoErro;
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    try {
      const resp = await fetch(url, { headers: { "user-agent": "elite-redux-terminal-alarme" } });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return comoBytes ? Buffer.from(await resp.arrayBuffer()) : await resp.text();
    } catch (err) {
      ultimoErro = err;
      if (tentativa < 3) await new Promise((r) => setTimeout(r, 5000 * tentativa));
    }
  }
  throw new Error(`${url}: ${ultimoErro.message}`);
}

async function main() {
  const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
  const snapshot = readFileSync(path.join(raiz, "data", "gameData_265beta.json"));
  const linhas = []; // { item, esperado, encontrado, estado: "ok" | "mudou" | "sem-rede" }

  const conferir = async (item, esperado, obter) => {
    try {
      const encontrado = await obter();
      const estado = encontrado === null ? "mudou" : encontrado === esperado ? "ok" : "mudou";
      linhas.push({ item, esperado, encontrado: encontrado ?? "formato da página mudou", estado });
    } catch (err) {
      linhas.push({ item, esperado, encontrado: `sem resposta (${err.message})`, estado: "sem-rede" });
    }
  };

  await conferir("Versão padrão do NextDex", VERSAO_DEX,
    async () => ultimaVersaoDoDex(await baixar(`${BASE_DEX}/static/js/data_version.js`)));
  const hashLocal = hashDoConteudo(snapshot);
  await conferir(`Dados da ${VERSAO_DEX} (sha256)`, hashLocal.slice(0, 16),
    async () => hashDoConteudo(await baixar(`${BASE_DEX}/static/js/data/gameDataV${VERSAO_DEX}.json`, true)).slice(0, 16));
  await conferir("Latest Version do site oficial", VERSAO_JOGO,
    async () => versaoDaPaginaDeDownload(await baixar(PAGINA_DOWNLOAD)));

  const rotulo = { ok: "em dia", mudou: "MUDOU", "sem-rede": "sem resposta" };
  for (const l of linhas) console.log(`${rotulo[l.estado].padEnd(12)} ${l.item}: esperado ${l.esperado}, encontrado ${l.encontrado}`);

  const mudou = linhas.some((l) => l.estado === "mudou");
  const semRede = linhas.some((l) => l.estado === "sem-rede");

  // Resumo na página da execução do GitHub Actions.
  if (process.env.GITHUB_STEP_SUMMARY) {
    const tabela = [
      mudou ? "## Elite Redux: saiu coisa nova" : "## Elite Redux: tudo em dia",
      "",
      "| Item | Esperado | Encontrado | Situação |",
      "|---|---|---|---|",
      ...linhas.map((l) => `| ${l.item} | ${l.esperado} | ${l.encontrado} | ${rotulo[l.estado]} |`),
      "",
      mudou ? "Próximo passo: baixar o gameData novo em `data/`, rodar `scripts/build.ps1` sem `-SkipExtract` e atualizar as constantes de `scripts/alarme_upstream.mjs`." : "",
    ];
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, tabela.join("\n") + "\n");
  }

  if (mudou) {
    console.log("\nAlgo mudou na fonte oficial - veja a tabela acima.");
    process.exit(1);
  }
  if (semRede) console.log("::warning::Parte da checagem ficou sem resposta; tenta de novo na próxima semana.");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
