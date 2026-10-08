// "Apagar esta" no editor "Meu build" com Desfazer (ticket 12 da dívida, 2026-10-08):
// apagar → desfazer → conferir que a MESMA build voltou, ativa, no mesmo lugar; tudo
// pelo teclado; aviso anunciado por leitor de tela; nenhum diálogo nativo (confirm()).
import { test, expect, abrirApp, abrirAba, saveLocal } from "./apoio.mjs";

// Abre a ficha do Charizard e salva duas builds (a segunda como variante, ativa).
async function prepararDuasBuilds(page) {
  await abrirApp(page);
  await abrirAba(page, "dex");
  await page.locator("#search-input").fill("Charizard");
  await page.locator("#species-list .species-row", { hasText: "Charizard" }).first().click();
  await expect(page.locator("#species-detail h2")).toHaveText("Charizard");
  await page.locator("#species-detail details").evaluateAll((ds) => ds.forEach((d) => { d.open = true; }));
  await page.locator("#mybuild-ability").selectOption("Tough Claws");
  await page.locator("#mybuild-nature").selectOption("Adamant");
  await page.locator("#mybuild-item").fill("Life Orb");
  await page.locator("#mybuild-move-0").selectOption("Fire Fang");
  await page.locator("#mybuild-save").click();
  await expect.poll(async () => ((await saveLocal(page)).customBuilds || {}).SPECIES_CHARIZARD?.length).toBe(1);
  // A segunda build (diferente da primeira) entra como variante e fica ativa.
  await page.locator("#mybuild-nature").selectOption("Jolly");
  await page.locator("#mybuild-move-1").selectOption("Slash");
  await page.locator("#mybuild-save-variant").click();
  await expect.poll(async () => ((await saveLocal(page)).customBuilds || {}).SPECIES_CHARIZARD?.length).toBe(2);
  const lista = (await saveLocal(page)).customBuilds.SPECIES_CHARIZARD;
  expect(lista.map((b) => b.active)).toEqual([false, true]);
  return lista;
}

const buildsDoCharizard = async (page) => ((await saveLocal(page)).customBuilds || {}).SPECIES_CHARIZARD;

test("apagar → desfazer devolve a mesma build, ativa, no mesmo lugar (só teclado, sem diálogo nativo)", async ({ page }) => {
  const dialogos = [];
  page.on("dialog", (d) => { dialogos.push(d.type()); d.dismiss(); });
  const antes = await prepararDuasBuilds(page);

  // Teclado: foca "Apagar esta" e aperta Enter.
  await page.locator("#mybuild-clear").focus();
  await page.keyboard.press("Enter");

  // Apagou na hora; sobrou só a primeira, que passou a ser a ativa.
  await expect.poll(async () => (await buildsDoCharizard(page))?.length).toBe(1);
  expect((await buildsDoCharizard(page))[0].active).toBe(true);

  // O aviso é uma região anunciada pelo leitor de tela e o foco já está no Desfazer.
  const aviso = page.locator("#toast");
  await expect(aviso).toHaveAttribute("role", "status");
  await expect(aviso).toHaveAttribute("aria-live", "polite");
  await expect(aviso).toContainText("Build apagada: Charizard");
  await expect(aviso.getByRole("button", { name: "Desfazer" })).toBeFocused();

  // Enter no Desfazer: a mesma build volta, ativa, na posição 1; a outra deixa de ser ativa.
  await page.keyboard.press("Enter");
  await expect.poll(async () => (await buildsDoCharizard(page))?.length).toBe(2);
  expect(await buildsDoCharizard(page)).toEqual(antes);
  await expect(aviso).toContainText("Build restaurada: Charizard");
  await expect(page.locator(".mybuild-chip.active")).toHaveCount(1);
  await expect(page.locator("#mybuild-nature")).toHaveValue("Jolly");
  // O foco volta pro editor (o botão antigo foi redesenhado), não some na página.
  await expect(page.locator("#mybuild-clear")).toBeFocused();
  expect(dialogos, "nenhum alert/confirm/prompt nativo").toEqual([]);
});

test("apagar a única build e desfazer pelo mouse devolve a build (a lista nasce de novo)", async ({ page }) => {
  await abrirApp(page);
  await abrirAba(page, "dex");
  await page.locator("#search-input").fill("Charizard");
  await page.locator("#species-list .species-row", { hasText: "Charizard" }).first().click();
  await page.locator("#species-detail details").evaluateAll((ds) => ds.forEach((d) => { d.open = true; }));
  await page.locator("#mybuild-ability").selectOption("Tough Claws");
  await page.locator("#mybuild-move-0").selectOption("Fire Fang");
  await page.locator("#mybuild-save").click();
  await expect.poll(async () => (await buildsDoCharizard(page))?.length).toBe(1);
  const antes = await buildsDoCharizard(page);

  await page.locator("#mybuild-clear").click();
  await expect.poll(async () => await buildsDoCharizard(page)).toBeUndefined();
  await expect(page.locator("#mybuild-ability")).toHaveValue("");
  await page.locator("#toast").getByRole("button", { name: "Desfazer" }).click();
  await expect.poll(async () => (await buildsDoCharizard(page))?.length).toBe(1);
  expect(await buildsDoCharizard(page)).toEqual(antes);
  await expect(page.locator("#mybuild-ability")).toHaveValue("Tough Claws");
});

test("Esc dispensa o aviso, devolve o foco ao editor e a build continua apagada", async ({ page }) => {
  await prepararDuasBuilds(page);
  await page.locator("#mybuild-clear").click();
  await expect(page.locator("#toast").getByRole("button", { name: "Desfazer" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#toast")).not.toHaveClass(/show/);
  await expect(page.locator("#mybuild-save")).toBeFocused();
  expect((await buildsDoCharizard(page)).length).toBe(1);
  // Escondido, o botão não fica na ordem do Tab.
  await expect(page.locator("#toast button")).toBeDisabled();
});

test("o aviso espera enquanto o foco está no Desfazer e some sozinho depois", async ({ page }) => {
  test.setTimeout(60_000);
  await prepararDuasBuilds(page);
  await page.locator("#mybuild-clear").click();
  const aviso = page.locator("#toast");
  await expect(aviso).toHaveClass(/show/);
  // Passados mais de 8 s com o foco nele, continua lá (o tempo está parado enquanto o foco fica).
  await page.waitForTimeout(8500);
  await expect(aviso).toHaveClass(/show/);
  // Foco sai (clicando fora): volta a contar e some.
  await page.locator("#species-detail h2").click();
  await expect(aviso).not.toHaveClass(/show/, { timeout: 12_000 });
  expect((await buildsDoCharizard(page)).length).toBe(1);
});

test("um aviso novo tira o Desfazer velho (não sobra botão apontando pra build antiga)", async ({ page }) => {
  await prepararDuasBuilds(page);
  await page.locator("#mybuild-clear").click();
  await expect(page.locator("#toast").getByRole("button", { name: "Desfazer" })).toBeFocused();
  // Outra ação com aviso (salvar uma variante nova) substitui o aviso do Desfazer.
  await page.locator("#mybuild-nature").selectOption("Timid");
  await page.locator("#mybuild-save-variant").click();
  await expect.poll(async () => (await buildsDoCharizard(page))?.length).toBe(2);
  await expect(page.locator("#toast")).toContainText("Nova variante salva");
  await expect(page.locator("#toast button")).toHaveCount(0);
});
