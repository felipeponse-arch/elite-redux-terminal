// Cenários que precisam de uma recarga de página no meio - até a fase 6 eram
// trechos pra colar à mão no console (partes B, C, D e E do antigo
// scripts/smoke_test_suite.js), e por isso não rodavam em lugar nenhum.
//
// Da parte E ficaram E1, E3, E4 e E7: E2, E5 e E6 são os cenários A, C e B de
// sincronizacao.spec.mjs (mesmo comportamento, já automatizados lá).
import { test, expect, abrirApp, abrirAba, ligarMockDb, adicionarAoTimePelaDex, saveLocal, recarregar } from "./apoio.mjs";

function gravarSave(page, save) {
  return page.evaluate((s) => localStorage.setItem("er_terminal_save", JSON.stringify(s)), save);
}

// ---- B: membros órfãos (espécie que não existe nesta versão dos dados) e
// marco fora do limite. O marco é limitado ao carregar, e os órfãos
// sobrevivem a uma gravação de verdade - nunca somem em silêncio. ----
test("B - save com espécies desconhecidas e marco absurdo", async ({ page }) => {
  await abrirApp(page);
  await gravarSave(page, {
    v: 2, dataVersion: "test", savedAt: new Date().toISOString(),
    team: ["SPECIES_CHARIZARD", "SPECIES_TOTALLY_MADE_UP_FUTURE_MON"],
    box: ["SPECIES_ANOTHER_FAKE_ONE"],
    savedTeams: [], settings: { difficulty: "ace", milestone: 999999 }
  });
  await recarregar(page);
  // O <select> do marco só ganha opções quando a aba Progresso abre.
  await abrirAba(page, "progress");
  const marco = page.locator("#settings-milestone");
  const ultimaOpcao = await marco.evaluate((el) => el.options.length - 1);
  expect(ultimaOpcao).toBeGreaterThan(0);
  await expect(marco, "marco limitado à última opção válida").toHaveValue(String(ultimaOpcao));
  // Força uma gravação real pela interface.
  await marco.dispatchEvent("change");
  const save = await saveLocal(page);
  expect(save.team, "órfão do time sobrevive à gravação").toContain("SPECIES_TOTALLY_MADE_UP_FUTURE_MON");
  expect(save.box, "órfão da caixa sobrevive à gravação").toContain("SPECIES_ANOTHER_FAKE_ONE");
});

// ---- C: o template cru (sem os dados) publicado por engano mostra a
// mensagem de build incompleto em vez de quebrar em silêncio (incidente de
// publicar o arquivo errado, 2026-09-09). ----
test("C - template sem build mostra o aviso de build incompleto", async ({ page, errosDaPagina }) => {
  await abrirApp(page, { arquivo: "artifact_template.html" });
  const corpo = page.locator("body");
  await expect(corpo).toContainText("Build incompleto publicado");
  await expect(corpo, "a mensagem diz qual arquivo era o certo").toContainText("artifact_final.html");
  await expect(corpo).toContainText("artifact_template.html");
  await expect(page.locator("#species-list .species-row"), "nada do app desenhado por cima do aviso").toHaveCount(0);
  // Aqui erro de página é esperado (o app para de propósito); só não pode
  // ser outro que não o da trava.
  errosDaPagina.splice(0, errosDaPagina.length);
});

// ---- D: ordenação e filtro de tipo da Dex sobrevivem à recarga. ----
test("D - ordenação e filtro de tipo da Dex persistem", async ({ page }) => {
  await abrirApp(page);
  await abrirAba(page, "dex");
  await page.locator("#sort-select").selectOption("rank");
  await page.locator("#type-filter-toggle").click();
  await page.locator(".type-check", { hasText: /^\s*Fire\s*$/ }).locator("input").check();
  const linhasFiltradas = await page.locator("#species-list .species-row").count();
  await recarregar(page);
  await abrirAba(page, "dex");
  await expect(page.locator("#sort-select")).toHaveValue("rank");
  await expect(page.locator(".type-check", { hasText: /^\s*Fire\s*$/ }).locator("input")).toBeChecked();
  const linhas = await page.locator("#species-list .species-row").count();
  expect(linhas, "a lista reflete o filtro restaurado").toBeGreaterThan(0);
  expect(linhas).toBe(linhasFiltradas);
});

// ---- E: sincronização na CARGA da página (a parte ao vivo está em
// sincronizacao.spec.mjs). Charizard porque não evolui - a auto-evolução por
// level cap não se mistura com o que a sincronização mudou. ----
test("E1 - instalação nova semeia o remoto com o save local, sem aviso", async ({ page }) => {
  await abrirApp(page, { mockDb: true });
  const local = await saveLocal(page);
  const remoto = await page.evaluate(() => (window.__fakeSyncDocs || {})["sync/save"]);
  expect(remoto, "remoto semeado com o local").toEqual(local);
  await expect(page.locator("#sync-banner")).toBeHidden();
});

test("E3 - remoto diferente e mais VELHO: o local vence e sobe, sem aviso", async ({ page }) => {
  await abrirApp(page);
  await adicionarAoTimePelaDex(page, "Charizard");
  const local = await saveLocal(page);
  const remoto = { ...local, team: ["SPECIES_VENUSAUR"], savedAt: new Date(Date.now() - 3_600_000).toISOString() };
  await ligarMockDb(page, remoto);
  await recarregar(page);
  expect((await saveLocal(page)).team).toEqual(["SPECIES_CHARIZARD"]);
  const remotoDepois = await page.evaluate(() => window.__fakeSyncDocs["sync/save"].team);
  expect(remotoDepois, "o local vencedor foi empurrado pro remoto").toEqual(["SPECIES_CHARIZARD"]);
  await expect(page.locator("#sync-banner")).toBeHidden();
});

// A regressão mais importante da sincronização: comparar CONTEÚDO, não data.
test("E4 - mesmo conteúdo, só a data difere: nenhuma escrita e nenhum aviso", async ({ page }) => {
  await abrirApp(page);
  await adicionarAoTimePelaDex(page, "Charizard");
  const local = await saveLocal(page);
  const dataSemeada = new Date(Date.now() - 3_600_000).toISOString();
  await ligarMockDb(page, { ...local, savedAt: dataSemeada });
  await recarregar(page);
  expect((await saveLocal(page)).savedAt, "o local mantém a própria data").not.toBe(dataSemeada);
  const dataRemota = await page.evaluate(() => window.__fakeSyncDocs["sync/save"].savedAt);
  expect(dataRemota, "nenhuma escrita no remoto").toBe(dataSemeada);
  await expect(page.locator("#sync-banner")).toBeHidden();
});

test("E7 - conexão perdida avisa e reconecta sozinha", async ({ page }) => {
  await abrirApp(page, { mockDb: true });
  const indicador = page.locator("#sync-status-indicator");
  await page.evaluate(() => window.__fakeSyncTriggerError("sync/save"));
  await expect(indicador, "avisa na hora que está reconectando").toContainText("reconectando");
  // Primeira nova tentativa em 5 s (espera crescente a partir daí).
  await expect(indicador, "volta sozinho, sem recarregar").toHaveText("sincronizado entre aparelhos", { timeout: 10_000 });
});
