// Alarme de versão nova do Elite Redux (2026-09-24, pedido do usuário: "faz o
// alarme"). Roda toda semana no GitHub Actions (.github/workflows/
// alarme_upstream.yml) e só FALHA quando algo mudou de verdade - execução
// agendada que falha gera o e-mail do GitHub; em dia, silêncio.
//
// Confere três coisas contra o que o app usa hoje:
//   1. a versão que o NextDex oficial abre por padrão (último item de
//      allVersions em static/js/data_version.js - o próprio site usa essa regra);
//   2. se o arquivo de dados dessa versão continua idêntico ao nosso snapshot
//      (data/gameData.json) - os devs às vezes corrigem dados sem trocar
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
import { validarDadoCru } from "./validar_dado_cru.mjs";

import { conferirProvisorias, PRECISA_REVISAR } from "./extracao/provisorias.mjs";
const URL_SPECIES_LIST = "https://raw.githubusercontent.com/Elite-Redux/er-config/upcoming/SpeciesList.textproto";
export const VERSAO_DEX = "2.65.5"; // NextDex 2.65.5 (03/11/2026), versão mais nova (decisão do Felipe de 15/10); VERSAO_JOGO segue a página oficial de download
export const VERSAO_JOGO = "2.65.4.1b";
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

export async function baixar(url, comoBytes = false) {
  let ultimoErro;
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    try {
      const resp = await fetch(url, { headers: { "user-agent": "elite-redux-terminal-alarme" } });
      // 4xx = o endereço sumiu ou mudou (repositório renomeado, versão nova com outro nome):
      // isso é MUDANÇA, não falta de rede - antes um 404 deixava o alarme cego em silêncio.
      if (resp.status >= 400 && resp.status < 500) { const e = new Error(`HTTP ${resp.status}`); e.enderecoSumiu = true; throw e; }
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return comoBytes ? Buffer.from(await resp.arrayBuffer()) : await resp.text();
    } catch (err) {
      ultimoErro = err;
      if (err.enderecoSumiu) break;
      if (tentativa < 3) await new Promise((r) => setTimeout(r, 5000 * tentativa));
    }
  }
  const e = new Error(`${url}: ${ultimoErro.message}`);
  e.enderecoSumiu = !!ultimoErro.enderecoSumiu;
  throw e;
}

async function main() {
  const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
  const snapshot = readFileSync(path.join(raiz, "data", "gameData.json"));
  const linhas = []; // { item, esperado, encontrado, estado: "ok" | "mudou" | "sem-rede" }

  const conferir = async (item, esperado, obter) => {
    try {
      const encontrado = await obter();
      const estado = encontrado === null ? "mudou" : encontrado === esperado ? "ok" : "mudou";
      linhas.push({ item, esperado, encontrado: encontrado ?? "formato da página mudou", estado });
    } catch (err) {
      if (err.enderecoSumiu) linhas.push({ item, esperado, encontrado: `endereço sumiu (${err.message})`, estado: "mudou" });
      else linhas.push({ item, esperado, encontrado: `sem resposta (${err.message})`, estado: "sem-rede" });
    }
  };

  await conferir("Versão padrão do NextDex", VERSAO_DEX,
    async () => ultimaVersaoDoDex(await baixar(`${BASE_DEX}/static/js/data_version.js`)));
  const hashLocal = hashDoConteudo(snapshot);
  let dadoBaixado = null; // reaproveitado pela validação de formato logo abaixo
  await conferir(`Dados da ${VERSAO_DEX} (sha256)`, hashLocal.slice(0, 16), async () => {
    dadoBaixado = await baixar(`${BASE_DEX}/static/js/data/gameDataV${VERSAO_DEX}.json`, true);
    return hashDoConteudo(dadoBaixado).slice(0, 16);
  });
  // Dado novo com o mesmo hash já foi validado no commit; só vale olhar o que mudou.
  if (dadoBaixado && hashDoConteudo(dadoBaixado).slice(0, 16) !== hashLocal.slice(0, 16)) {
    let problemas;
    try { problemas = validarDadoCru(JSON.parse(dadoBaixado.toString("utf8"))); } catch (err) { problemas = [`JSON ilegível: ${err.message}`]; }
    linhas.push({ item: "Formato do dado novo (validar_dado_cru)", esperado: "sem problemas", encontrado: problemas.length ? problemas.slice(0, 3).join("; ") : "sem problemas", estado: problemas.length ? "mudou" : "ok" });
  }
  // Espécies provisórias (Mega Bruxish e Jellicent, sem números reais na config): avisa quando a config d1a9a4c/upcoming passar a ter os atributos.
  await conferir("Espécies provisórias x SpeciesList da config", "config ainda incompleta", async () => {
    const dex = JSON.parse(readFileSync(path.join(raiz, "data", "dex_compact.json"), "utf8"));
    const revisar = conferirProvisorias(dex, await baixar(URL_SPECIES_LIST)).filter((e) => PRECISA_REVISAR.has(e.estado));
    return revisar.length ? revisar.map((e) => e.sname + ": " + e.estado).join("; ") : "config ainda incompleta";
  });
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
