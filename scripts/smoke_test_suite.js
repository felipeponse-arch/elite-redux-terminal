// Suíte de comportamento do artifact_final.html - uso MANUAL, no console.
//
// Desde a fase 6 da refatoração (2026-09-24) quem roda a suíte de verdade é o
// Playwright (`npm run test:e2e`, tests/e2e/suite.spec.mjs): cada seção de
// scripts/smoke_tests/ roda sozinha num navegador limpo, mais a sequência
// completa numa página só. Os cenários que precisavam de recarga no meio (as
// antigas partes B, C, D e E deste arquivo, que eram coladas à mão e por isso
// não rodavam em lugar nenhum) viraram tests/e2e/recarga.spec.mjs e
// tests/e2e/sincronizacao.spec.mjs.
//
// Este arquivo fica só pra depurar à mão: com o app aberto (dev server local,
// preview), cole a função no console e rode `await runLiveTests()` - devolve o
// mesmo array de checagens {name, pass, detail} da suíte.
async function runLiveTests() {
  const base = "/scripts/smoke_tests/";
  const manifest = await (await fetch(base + "manifest.json")).json();
  let combined = "";
  for (const file of manifest) {
    combined += (await (await fetch(base + file)).text()) + "\n";
  }
  combined += "\nwindow.__smokeTestsRunAllSections = runAllSections;\n";
  // eslint-disable-next-line no-eval -- carregador da suíte: roda os arquivos de scripts/smoke_tests na página
  (0, eval)(combined);
  return await window.__smokeTestsRunAllSections();
}
