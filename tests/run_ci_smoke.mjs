// Driver de CI pra scripts/smoke_test_suite.js (Parte A) - roda o MESMO
// runLiveTests() que esta sessão sempre rodou manualmente colando no
// javascript_tool do navegador interativo, só que headless, sem humano.
// Não reescreve nem duplica a suíte - carrega o arquivo de verdade do
// servidor e usa exatamente o mesmo padrão fetch+slice+eval já
// estabelecido (ver o próprio smoke_test_suite.js, comentário do topo).
//
// Assume que scripts/dev_server.ps1 já está rodando em
// http://localhost:8100 (servindo artifact_final.html já buildado) -
// isso é responsabilidade do workflow do GitHub Actions, não deste
// script. Só espera o servidor responder antes de navegar.
import { chromium } from "playwright";

const BASE_URL = process.env.CI_SMOKE_BASE_URL || "http://localhost:8100";
const PART_B_MARKER = "============================== PART B";
const SERVER_WAIT_TIMEOUT_MS = 30000;
const SERVER_WAIT_INTERVAL_MS = 500;

async function waitForServer(url) {
  const start = Date.now();
  while (Date.now() - start < SERVER_WAIT_TIMEOUT_MS) {
    try {
      const resp = await fetch(url);
      if (resp.ok) return;
    } catch (e) {
      // servidor ainda não subiu - tenta de novo
    }
    await new Promise((r) => setTimeout(r, SERVER_WAIT_INTERVAL_MS));
  }
  throw new Error(`Servidor não respondeu em ${url} depois de ${SERVER_WAIT_TIMEOUT_MS}ms`);
}

async function main() {
  console.log(`Esperando o dev server em ${BASE_URL}...`);
  await waitForServer(`${BASE_URL}/artifact_final.html`);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on("pageerror", (err) => {
    console.error("[pageerror]", err.message);
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") console.error("[console.error]", msg.text());
  });

  try {
    await page.goto(`${BASE_URL}/artifact_final.html?mock_db=1`, { waitUntil: "load" });

    const results = await page.evaluate(async (marker) => {
      const resp = await fetch("/scripts/smoke_test_suite.js");
      const text = await resp.text();
      const idx = text.indexOf(marker);
      if (idx === -1) throw new Error(`Marcador "${marker}" não encontrado em smoke_test_suite.js`);
      const partA = text.slice(0, idx) + "\nwindow.__ciRunLiveTests = runLiveTests;\n";
      // eslint-disable-next-line no-eval
      (0, eval)(partA);
      return await window.__ciRunLiveTests();
    }, PART_B_MARKER);

    const fails = results.filter((r) => !r.pass);
    console.log(`\n=== smoke_test_suite Parte A: ${results.length - fails.length}/${results.length} passaram ===\n`);

    if (fails.length) {
      console.error(`${fails.length} checagem(ões) falharam:\n`);
      for (const f of fails) {
        console.error(`  - ${f.name}`);
        if (f.detail) console.error(`    detalhe: ${JSON.stringify(f.detail)}`);
      }
      process.exitCode = 1;
    } else {
      console.log("Tudo passou.");
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("Falha ao rodar a suíte:", err);
  process.exitCode = 1;
});
