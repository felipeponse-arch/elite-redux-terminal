// Pacote 08 (11/11/2026): exportar o save para .json, limpar o navegador e importar de volta;
// time e builds voltam iguais. Arquivo mexido é recusado e "Desfazer importação" devolve o save de antes.
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { carregarRegras } from "../unit/carregar_regras.mjs";
import { test, expect, abrirApp, abrirAba, saveLocal, recarregar } from "./apoio.mjs";

const build = {
  ability: "Tough Claws", nature: "Adamant", item: "Charcoal", moves: ["Flare Blitz"], ivs: [31, 31, 31, 31, 31, 31],
  evs: [0, 252, 0, 0, 0, 0], source: "manual", active: true, savedAt: "2026-01-01T00:00:00.000Z", rationale: "",
};
const semente = {
  v: 2, dataVersion: "2.65.5", savedAt: "2026-11-01T00:00:00.000Z",
  team: ["SPECIES_CHARIZARD", "SPECIES_BLASTOISE"], box: ["SPECIES_VENUSAUR"], savedTeams: [],
  settings: { difficulty: "ace", milestone: 2 }, notes: { SPECIES_CHARIZARD: "voa alto" },
  customBuilds: { SPECIES_CHARIZARD: [build] },
};
const guardar = (page, s) => page.evaluate((x) => localStorage.setItem("er_terminal_save", JSON.stringify(x)), s);
const essencia = (s) => ({ team: s.team, box: s.box, notes: s.notes, builds: s.customBuilds, marco: s.settings.milestone });

test("exportar, limpar e importar devolve time e builds; arquivo mexido é recusado; desfazer volta", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await abrirApp(page);
  await guardar(page, semente);
  await recarregar(page);
  await abrirAba(page, "progress");
  const antes = essencia(await saveLocal(page));
  expect(antes.team).toEqual(["SPECIES_CHARIZARD", "SPECIES_BLASTOISE"]);

  // Botões grandes para o dedo.
  for (const id of ["#save-exportar-btn", "#save-importar-btn"]) {
    expect((await page.locator(id).boundingBox()).height, id).toBeGreaterThanOrEqual(44);
  }

  const [download] = await Promise.all([page.waitForEvent("download"), page.locator("#save-exportar-btn").click()]);
  expect(download.suggestedFilename()).toMatch(/^er-terminal-save-\d{4}-\d\d-\d\d\.json$/);
  const pasta = mkdtempSync(join(tmpdir(), "er-save-"));
  const arquivo = join(pasta, "save.json");
  await download.saveAs(arquivo);
  const conteudo = JSON.parse(readFileSync(arquivo, "utf8"));
  expect(conteudo.schema).toBe(1);
  expect(conteudo.versaoApp).not.toBe("");
  expect(typeof conteudo.save.soma).toBe("string");

  // Limpa o navegador e importa.
  await page.evaluate(() => localStorage.clear());
  await recarregar(page);
  expect((await saveLocal(page)).team).toEqual([]);
  await abrirAba(page, "progress");
  await expect(page.locator("#save-desfazer-btn")).toBeHidden();
  await page.locator("#save-importar-input").setInputFiles(arquivo);
  await page.locator("#confirm-modal-ok").click();
  await expect(page.locator("#save-arquivo-status")).toContainText("Save carregado");
  const depois = essencia(await saveLocal(page));
  expect(depois).toEqual(antes);
  await expect(page.locator("#settings-milestone")).toHaveValue("2");

  // Arquivo mexido à mão: recusa com mensagem e não troca nada.
  conteudo.save.team = ["SPECIES_VENUSAUR"];
  const mexido = join(pasta, "mexido.json");
  writeFileSync(mexido, JSON.stringify(conteudo));
  await page.locator("#save-importar-input").setInputFiles(mexido);
  await expect(page.locator("#save-arquivo-status")).toContainText("soma de verificação");
  await expect(page.locator("#confirm-modal")).not.toHaveAttribute("open", "");
  expect(essencia(await saveLocal(page))).toEqual(antes);

  // Desfazer: volta o save que existia antes da importação (o vazio do navegador limpo).
  await expect(page.locator("#save-desfazer-btn")).toBeVisible();
  await page.locator("#save-desfazer-btn").click();
  await page.locator("#confirm-modal-ok").click();
  await expect(page.locator("#save-arquivo-status")).toContainText("Importação desfeita");
  expect((await saveLocal(page)).team).toEqual([]);
  await expect(page.locator("#save-desfazer-btn")).toBeHidden();
});

test("duas importações seguidas guardam os dois backups; arquivo de mais de 2 MB é recusado sem escrever nada", async ({ page }) => {
  await abrirApp(page);
  await guardar(page, semente);
  await recarregar(page);
  await abrirAba(page, "progress");
  const pasta = mkdtempSync(join(tmpdir(), "er-save-"));
  const [dl] = await Promise.all([page.waitForEvent("download"), page.locator("#save-exportar-btn").click()]);
  const arqA = join(pasta, "a.json");
  await dl.saveAs(arqA);
  const b = JSON.parse(readFileSync(arqA, "utf8"));
  b.save.team = ["SPECIES_VENUSAUR"]; b.save.box = [];
  delete b.save.soma;
  b.save.soma = carregarRegras().somaDoSave(b.save);
  const arqB = join(pasta, "b.json");
  writeFileSync(arqB, JSON.stringify(b));
  const importar = async (arq) => {
    await page.locator("#save-importar-input").setInputFiles(arq);
    await page.locator("#confirm-modal-ok").click();
    await expect(page.locator("#save-arquivo-status")).toContainText("Save carregado");
  };
  await importar(arqA); // 1ª: backup = save original (Charizard + Blastoise)
  await importar(arqB); // 2ª: backup anterior NÃO é sobrescrito
  await expect(page.locator("#save-arquivo-status")).toContainText("Já havia um backup");
  await expect(page.locator("#save-backups-info")).toContainText("Backups guardados: 2");
  expect((await saveLocal(page)).team).toEqual(["SPECIES_VENUSAUR"]);
  for (let i = 0; i < 2; i++) { // desfazer duas vezes chega ao save original
    await page.locator("#save-desfazer-btn").click();
    await page.locator("#confirm-modal-ok").click();
    await expect(page.locator("#save-arquivo-status")).toContainText("Importação desfeita");
  }
  expect((await saveLocal(page)).team).toEqual(["SPECIES_CHARIZARD", "SPECIES_BLASTOISE"]);
  await expect(page.locator("#save-desfazer-btn")).toBeHidden();

  // Grande demais: recusa pelo tamanho, sem diálogo e sem backup.
  const grande = join(pasta, "grande.json");
  writeFileSync(grande, " ".repeat(2 * 1024 * 1024 + 10));
  await page.locator("#save-importar-input").setInputFiles(grande);
  await expect(page.locator("#save-arquivo-status")).toContainText("2 MB");
  await expect(page.locator("#save-desfazer-btn")).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem("er_terminal_save_antes_da_importacao"))).toBeNull();
});
