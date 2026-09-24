// Runner único dos testes de navegador (fase 6 da refatoração, 2026-09-24).
// Substitui os 6 scripts soltos de tests/run_*.mjs: cada um tinha a própria
// espera de servidor, o próprio relatório e nenhum rastro de falha. Aqui:
// servidor sobe sozinho, testes em paralelo, cada falha isolada no seu teste,
// trace + print guardados quando algo falha e relatório HTML em
// playwright-report/ (abrir com `npx playwright show-report`).
//
// Projetos:
//   funcional - seções da suíte (cada uma sozinha + a sequência completa),
//               cenários com recarga, fuzz de saves e sincronização. Bloqueia
//               commit e CI.
//   visual    - comparação de imagem com tests/visual_baselines/. Separado
//               porque a fonte renderiza diferente no runner do GitHub (no CI
//               é informativo).
import { defineConfig, devices } from "@playwright/test";

const PORTA = Number(process.env.PORTA_TESTES || 8101);
const noCI = !!process.env.CI;
// O visual roda num comando separado (no CI, depois do funcional): pastas
// próprias pro relatório e pras falhas, senão apagaria as do funcional.
const soVisual = process.argv.includes("--project=visual");
const sufixo = soVisual ? "-visual" : "";
const html = ["html", { open: "never", outputFolder: "playwright-report" + sufixo }];

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "**/*.spec.mjs",
  // A página tem 6 MB e demora ~2 s pra montar; seções longas do smoke passam
  // de 30 s quando vários workers dividem a CPU.
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: noCI,
  // No CI uma segunda chance - e o relatório marca o teste como "instável"
  // (flaky) em vez de esconder. Local, falhou é falhou.
  retries: noCI ? 1 : 0,
  workers: noCI ? 2 : "50%",
  reporter: noCI ? [["list"], html, ["github"]] : [["list"], html],
  outputDir: "test-results" + sufixo,
  snapshotPathTemplate: "tests/visual_baselines/{arg}{ext}",
  use: {
    baseURL: `http://127.0.0.1:${PORTA}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
  },
  projects: [
    { name: "funcional", testIgnore: "**/visual.spec.mjs" },
    {
      name: "visual",
      testMatch: "**/visual.spec.mjs",
      use: { viewport: { width: 900, height: 700 } },
    },
  ],
  webServer: {
    command: `node scripts/servidor_estatico.mjs ${PORTA}`,
    url: `http://127.0.0.1:${PORTA}/artifact_final.html`,
    reuseExistingServer: !noCI,
    timeout: 30_000,
  },
});
