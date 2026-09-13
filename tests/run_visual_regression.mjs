// Regressão visual via diff de screenshot - gap real que a QA já tinha
// identificado ("worth knowing for when Fase-3 CI lands": visual regression
// via screenshot diffing). Agora que o Playwright já está instalado de
// verdade (CI real, 2026-09-13), isto ficou viável sem precisar trocar pro
// runner @playwright/test inteiro - só pixelmatch/pngjs (pacotes pequenos,
// focados só em comparar 2 PNGs), mantendo o mesmo driver Playwright cru já
// usado em run_ci_smoke.mjs/run_fuzz_save_shapes.mjs.
//
// Primeira vez rodando: não existe baseline nenhuma ainda - cada cenário
// SALVA sua própria imagem em tests/visual_baselines/ e passa (nada a
// comparar). Da segunda vez em diante, compara contra a baseline salva e
// falha se a diferença passar do limiar. Pra aceitar uma mudança visual de
// propósito, apague a baseline antiga (ou rode com UPDATE_BASELINES=1) e
// rode de novo pra gerar uma nova.
import { chromium } from "playwright";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.CI_SMOKE_BASE_URL || "http://localhost:8100";
const BASELINE_DIR = path.join(__dirname, "visual_baselines");
const DIFF_DIR = path.join(__dirname, "visual_diffs");
const UPDATE_BASELINES = process.env.UPDATE_BASELINES === "1";
// Tolerância generosa de propósito - primeira vez que isto roda, sem
// histórico calibrado ainda; melhor um limiar frouxo que aceite variação
// legítima de fonte/renderização entre máquinas do que um limiar apertado
// que vire ruído constante de falso positivo.
const DIFF_THRESHOLD_PCT = 0.5;

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function waitForServer(url) {
  const start = Date.now();
  while (Date.now() - start < 30000) {
    try {
      const resp = await fetch(url);
      if (resp.ok) return;
    } catch (e) {}
    await wait(500);
  }
  throw new Error(`Servidor não respondeu em ${url}`);
}

const SCENARIOS = [
  {
    name: "dex-charizard-detail",
    async setup(page) {
      await page.evaluate(() => localStorage.clear());
      await page.reload({ waitUntil: "load" });
      await page.click('.tab-btn[data-tab="dex"]');
      await wait(200);
      await page.fill("#search-input", "Charizard");
      await wait(200);
      await page.click("#species-list .species-row");
      await wait(200);
    },
  },
  {
    name: "team-tab-seeded",
    async setup(page) {
      await page.evaluate(() => localStorage.clear());
      await page.reload({ waitUntil: "load" });
      await page.click('.tab-btn[data-tab="dex"]');
      await wait(200);
      await page.fill("#search-input", "Pikachu");
      await wait(200);
      await page.click("#species-list .species-row");
      await wait(150);
      await page.click("#add-team-btn");
      await wait(150);
      await page.click('.tab-btn[data-tab="team"]');
      await wait(250);
    },
  },
  {
    name: "pcbox-tab-seeded",
    async setup(page) {
      await page.evaluate(() => localStorage.clear());
      await page.reload({ waitUntil: "load" });
      await page.click('.tab-btn[data-tab="dex"]');
      await wait(200);
      await page.fill("#search-input", "Eevee");
      await wait(200);
      await page.click("#species-list .species-row");
      await wait(150);
      await page.click("#add-box-btn");
      await wait(150);
      await page.click('.tab-btn[data-tab="box"]');
      await wait(250);
    },
  },
  {
    name: "bosses-tab-list",
    async setup(page) {
      await page.evaluate(() => localStorage.clear());
      await page.reload({ waitUntil: "load" });
      await page.click('.tab-btn[data-tab="bosses"]');
      await wait(250);
    },
  },
];

function comparePng(baselinePath, currentPng) {
  const baseline = PNG.sync.read(readFileSync(baselinePath));
  if (baseline.width !== currentPng.width || baseline.height !== currentPng.height) {
    return { match: false, diffPct: 100, reason: "dimensões diferentes" };
  }
  const { width, height } = baseline;
  const diff = new PNG({ width, height });
  const diffPixels = pixelmatch(baseline.data, currentPng.data, diff.data, width, height, { threshold: 0.15 });
  const diffPct = (diffPixels / (width * height)) * 100;
  return { match: diffPct <= DIFF_THRESHOLD_PCT, diffPct, diff };
}

async function main() {
  console.log(`Esperando o dev server em ${BASE_URL}...`);
  await waitForServer(`${BASE_URL}/artifact_final.html`);

  if (!existsSync(BASELINE_DIR)) mkdirSync(BASELINE_DIR, { recursive: true });
  if (!existsSync(DIFF_DIR)) mkdirSync(DIFF_DIR, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  await page.goto(`${BASE_URL}/artifact_final.html`, { waitUntil: "load" });

  const results = [];
  for (const scenario of SCENARIOS) {
    await scenario.setup(page);
    const screenshotBuffer = await page.screenshot();
    const currentPng = PNG.sync.read(screenshotBuffer);
    const baselinePath = path.join(BASELINE_DIR, `${scenario.name}.png`);

    if (!existsSync(baselinePath) || UPDATE_BASELINES) {
      writeFileSync(baselinePath, screenshotBuffer);
      results.push({ name: scenario.name, status: "baseline criada" });
      continue;
    }

    const { match, diffPct, diff, reason } = comparePng(baselinePath, currentPng);
    if (!match) {
      if (diff) writeFileSync(path.join(DIFF_DIR, `${scenario.name}.diff.png`), PNG.sync.write(diff));
      writeFileSync(path.join(DIFF_DIR, `${scenario.name}.current.png`), screenshotBuffer);
      results.push({ name: scenario.name, status: "MUDOU", diffPct: diffPct.toFixed(2), reason });
    } else {
      results.push({ name: scenario.name, status: "igual", diffPct: diffPct.toFixed(2) });
    }
  }

  await browser.close();

  console.log("\n=== regressão visual ===\n");
  let anyFail = false;
  for (const r of results) {
    console.log(`  ${r.name}: ${r.status}${r.diffPct !== undefined ? " (" + r.diffPct + "% diferente)" : ""}${r.reason ? " - " + r.reason : ""}`);
    if (r.status === "MUDOU") anyFail = true;
  }
  if (anyFail) {
    console.error(`\nAlgum cenário mudou visualmente - veja tests/visual_diffs/ (imagem .diff.png mostra o que mudou, .current.png é o estado atual). Se a mudança for esperada, apague a baseline antiga em tests/visual_baselines/ e rode de novo (ou rode com UPDATE_BASELINES=1).`);
    process.exitCode = 1;
  } else {
    console.log("\nNenhuma mudança visual inesperada.");
  }
}

main().catch((err) => {
  console.error("Falha ao rodar a regressão visual:", err);
  process.exitCode = 1;
});
