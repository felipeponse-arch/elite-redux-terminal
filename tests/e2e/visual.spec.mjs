// Regressão visual: compara prints das telas principais com as imagens de
// referência em tests/visual_baselines/ (comparador do próprio Playwright,
// tolerância de 0,5% dos pixels e limiar de cor 0,15 - a fonte renderiza um
// pouco diferente de máquina pra máquina).
//
// VISUAL_EXATO=1 zera a tolerância: usado pra provar que uma refatoração de
// CSS não mudou nenhum pixel (fase 7, 2026-09-24).
//
// Mudança visual de propósito: `npm run test:visual -- --update-snapshots=all`
// regrava as referências - conferir as imagens novas antes de versionar. (Sem
// "=all" só são regravadas as que falham, e uma referência velha dentro da
// tolerância fica - foi o que aconteceu com team-tab-seeded.png.)
import { test, expect, abrirApp, abrirAba } from "./apoio.mjs";

const TOLERANCIA = process.env.VISUAL_EXATO
  ? { maxDiffPixels: 0, threshold: 0 }
  : { maxDiffPixelRatio: 0.005, threshold: 0.15 };

// A versão no cabeçalho muda a cada commit - fica coberta nos prints.
function print(page, nome) {
  return expect(page).toHaveScreenshot(nome, { ...TOLERANCIA, mask: [page.locator("#app-version")] });
}

async function preparar(page, { tema = "light", altoContraste = false } = {}) {
  await page.emulateMedia({ colorScheme: tema });
  await abrirApp(page);
  // O aviso de configurar a run aparece numa instalação nova e empurraria a
  // tela - não é o que estes prints conferem.
  await page.evaluate((ac) => {
    const b = document.getElementById("run-setup-banner");
    if (b) b.hidden = true;
    if (ac) document.documentElement.setAttribute("data-high-contrast", "true");
  }, altoContraste);
}

async function abrirFicha(page, nome) {
  await abrirAba(page, "dex");
  await page.locator("#search-input").fill(nome);
  await expect(page.locator("#species-list .species-row").first()).toContainText(nome);
  await page.locator("#species-list .species-row").first().click();
  await expect(page.locator("#species-detail h2")).toHaveText(nome);
}

async function timeComUm(page, nome) {
  await abrirFicha(page, nome);
  await page.locator("#add-team-btn").click();
  await abrirAba(page, "team");
}

async function primeiroChefao(page) {
  await abrirAba(page, "bosses");
  await page.locator("#boss-list .species-row").first().click();
  await expect(page.locator("#boss-detail h2").first()).toBeVisible();
}

// ---- tema claro, 900x700 (referências originais) ----
test.describe("claro", () => {
  test.beforeEach(({ page }) => preparar(page));

  test("ficha do Charizard na Dex", async ({ page }) => {
    await abrirFicha(page, "Charizard");
    await print(page, "dex-charizard-detail.png");
  });

  test("aba Meu Time com um membro", async ({ page }) => {
    await timeComUm(page, "Pikachu");
    await print(page, "team-tab-seeded.png");
  });

  test("aba PC Box com um Pokémon", async ({ page }) => {
    await abrirFicha(page, "Eevee");
    await page.locator("#add-box-btn").click();
    await abrirAba(page, "box");
    await print(page, "pcbox-tab-seeded.png");
  });

  test("lista de chefões", async ({ page }) => {
    await abrirAba(page, "bosses");
    await print(page, "bosses-tab-list.png");
  });

  test("detalhe de chefão", async ({ page }) => {
    await primeiroChefao(page);
    await print(page, "claro-chefao-detalhe.png");
  });

  test("aba Progresso", async ({ page }) => {
    await abrirAba(page, "progress");
    await print(page, "claro-progresso.png");
  });

  test("aba Tipos", async ({ page }) => {
    await abrirAba(page, "types");
    await print(page, "claro-tipos.png");
  });
});

// Ficha inteira numa janela alta: editor de build, Estratégias e comparação
// aparecem sem rolar (o painel da ficha rola por dentro, não a página).
test("claro - ficha completa (janela alta)", async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 3200 });
  await preparar(page);
  await abrirFicha(page, "Garchomp");
  await print(page, "claro-ficha-completa.png");
});

// ---- tema escuro ----
test.describe("escuro", () => {
  test.beforeEach(({ page }) => preparar(page, { tema: "dark" }));

  test("ficha", async ({ page }) => {
    await abrirFicha(page, "Charizard");
    await print(page, "escuro-ficha.png");
  });

  test("Meu Time", async ({ page }) => {
    await timeComUm(page, "Pikachu");
    await print(page, "escuro-time.png");
  });

  test("detalhe de chefão", async ({ page }) => {
    await primeiroChefao(page);
    await print(page, "escuro-chefao-detalhe.png");
  });
});

// ---- alto contraste (por cima de qualquer tema) ----
test("alto contraste - ficha", async ({ page }) => {
  await preparar(page, { altoContraste: true });
  await abrirFicha(page, "Charizard");
  await print(page, "alto-contraste-ficha.png");
});

// ---- celular ----
test.describe("celular", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test.beforeEach(({ page }) => preparar(page));

  test("lista da Dex", async ({ page }) => {
    await abrirAba(page, "dex");
    await print(page, "celular-dex-lista.png");
  });

  test("ficha", async ({ page }) => {
    await abrirFicha(page, "Charizard");
    await print(page, "celular-ficha.png");
  });
});

// ---- celular nos 3 temas + entalhe (ticket 15 da dívida, 2026-10-08) ----
// As referências "celular-*" acima são do tema claro; aqui entram o escuro e o
// alto contraste, mais um celular com entalhe e barra de gestos simulados
// (Emulation.setSafeAreaInsetsOverride) e o "Pular para o conteúdo" com foco.
for (const [rotulo, opcoes] of [["escuro", { tema: "dark" }], ["alto-contraste", { altoContraste: true }]]) {
  test.describe(`celular ${rotulo}`, () => {
    test.use({ viewport: { width: 390, height: 844 } });
    test.beforeEach(({ page }) => preparar(page, opcoes));

    test("lista da Dex", async ({ page }) => {
      await abrirAba(page, "dex");
      await print(page, `celular-${rotulo}-dex-lista.png`);
    });

    test("ficha", async ({ page }) => {
      await abrirFicha(page, "Charizard");
      await print(page, `celular-${rotulo}-ficha.png`);
    });
  });
}

test.describe("celular com entalhe", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("lista da Dex (entalhe de 47 px em cima, barra de gestos de 34 px embaixo)", async ({ page }) => {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setSafeAreaInsetsOverride", { insets: { top: 47, bottom: 34, left: 0, right: 0 } });
    await preparar(page);
    await abrirAba(page, "dex");
    await print(page, "celular-entalhe-dex-lista.png");
  });

  test("Pular para o conteúdo com foco (escuro)", async ({ page }) => {
    await preparar(page, { tema: "dark" });
    await page.keyboard.press("Tab");
    await expect(page.locator(".pular-conteudo")).toBeFocused();
    await print(page, "celular-escuro-pular-conteudo.png");
  });
});
