// Ticket 14 da dívida técnica (2026-10-08): teclado e toque.
// Tudo que se aperta e não é botão de verdade responde a Enter e Espaço; foco só
// aparece no teclado; toque sem atraso; teclado numérico no celular; alvo de toque
// da caixa de alto contraste do tamanho dos outros.
import { test, expect, abrirApp, abrirAba } from "./apoio.mjs";

const TECLAS = [["Enter", "Enter"], ["Espaço", "Space"]];

// Depois de ativar o atalho para uma espécie, a Dex abre a ficha dela.
async function esperarFichaDe(page, nome) {
  await expect(page.locator("#view-dex")).toBeVisible();
  await expect(page.locator("#species-detail h2")).toHaveText(nome);
}

test.describe("Enter e Espaço abrem a espécie", () => {
  for (const [rotulo, tecla] of TECLAS) {
    test(`a partir da linha evolutiva (${rotulo})`, async ({ page }) => {
      await abrirApp(page);
      await abrirAba(page, "dex");
      await page.locator("#search-input").fill("Charmander");
      await page.locator("#species-list .species-row", { hasText: "Charmander" }).first().click();
      await expect(page.locator("#species-detail h2")).toHaveText("Charmander");
      const proxima = page.locator("#species-detail .evo-chain .evo-node.goto-species", { hasText: "Charmeleon" }).first();
      await expect(proxima, "etapa da evolução alcançável pelo teclado").toHaveAttribute("tabindex", "0");
      await proxima.focus();
      await page.keyboard.press(tecla);
      await esperarFichaDe(page, "Charmeleon");
    });

    test(`a partir do card do chefão (${rotulo})`, async ({ page }) => {
      await abrirApp(page);
      await abrirAba(page, "bosses");
      await page.locator("#boss-list .species-row").first().click();
      const cabeca = page.locator("#boss-detail .bm-head.goto-species").first();
      await expect(cabeca).toHaveAttribute("tabindex", "0");
      const nome = (await cabeca.locator(".bm-name").innerText()).trim();
      await cabeca.focus();
      await page.keyboard.press(tecla);
      await expect(page.locator("#view-dex")).toBeVisible();
      // O card mostra o nome de exibição (forma mega inclusive); a ficha abre a espécie dele.
      expect((await page.locator("#species-detail h2").textContent()).trim()).toBe(nome);
    });

  }

  test("Espaço não rola a página quando abre a espécie", async ({ page }) => {
    await abrirApp(page);
    await abrirAba(page, "bosses");
    await page.locator("#boss-list .species-row").first().click();
    const cabeca = page.locator("#boss-detail .bm-head.goto-species").first();
    await cabeca.focus();
    let impedido = false;
    await page.exposeFunction("__marcarImpedido", () => { impedido = true; });
    await page.evaluate(() => document.addEventListener("keydown", (e) => { if (e.defaultPrevented) window.__marcarImpedido(); }, false));
    await page.keyboard.press("Space");
    await expect(page.locator("#view-dex")).toBeVisible();
    expect(impedido, "o atalho consumiu o Espaço (sem rolagem junto)").toBe(true);
  });

  test("todo atalho para espécie do app é alcançável pelo teclado (tabindex + papel de botão)", async ({ page }) => {
    await abrirApp(page);
    // Decisão do usuário (04/11/2026): <button> nativo já cumpre o papel de botão (docs/decisoes_mecanicas.md).
    // Percorre as telas que mostram atalhos e confere cada um que existe na tela.
    const falhas = [];
    const conferir = async (onde) => {
      const f = await page.evaluate(() => [...document.querySelectorAll(".goto-species")]
        .filter((el) => el.tabIndex !== 0 || !(el.tagName === "BUTTON" || el.getAttribute("role") === "button"))
        .map((el) => el.className));
      falhas.push(...f.map((c) => `${onde}: ${c}`));
    };
    await abrirAba(page, "dex");
    await page.locator("#species-list .species-row").nth(3).click();
    await conferir("dex");
    for (const aba of ["team", "box", "bosses"]) { await abrirAba(page, aba); await conferir(aba); }
    expect(falhas).toEqual([]);
  });
});

test.describe("golpe da tabela abre pelo teclado", () => {
  for (const [rotulo, tecla] of TECLAS) {
    test(`botão do nome do golpe (${rotulo})`, async ({ page }) => {
      await abrirApp(page);
      await abrirAba(page, "dex");
      await page.locator("#species-list .species-row").first().click();
      await page.locator("#species-detail details").evaluateAll((ds) => ds.forEach((d) => { d.open = true; }));
      const botao = page.locator("#species-detail .move-toggle").first();
      await expect(botao).toHaveAttribute("aria-expanded", "false");
      const detalhe = page.locator("#" + (await botao.getAttribute("aria-controls")));
      await expect(detalhe).toBeHidden();
      await botao.focus();
      await page.keyboard.press(tecla);
      await expect(detalhe).toBeVisible();
      await expect(botao).toHaveAttribute("aria-expanded", "true");
      await page.keyboard.press(tecla);
      await expect(detalhe).toBeHidden();
      await expect(botao).toHaveAttribute("aria-expanded", "false");
    });
  }

  test("clicar na linha inteira continua funcionando e acompanha o aria-expanded", async ({ page }) => {
    await abrirApp(page);
    await abrirAba(page, "dex");
    await page.locator("#species-list .species-row").first().click();
    await page.locator("#species-detail details").evaluateAll((ds) => ds.forEach((d) => { d.open = true; }));
    const linha = page.locator("#species-detail tr.move-row").first();
    await linha.locator("td").nth(3).click();
    await expect(linha.locator(".move-toggle")).toHaveAttribute("aria-expanded", "true");
    await linha.locator("td").nth(3).click();
    await expect(linha.locator(".move-toggle")).toHaveAttribute("aria-expanded", "false");
  });
});

test.describe("foco, toque e teclado numérico", () => {
  test("busca da Dex: anel de foco só pelo teclado (:focus-visible)", async ({ page }) => {
    await abrirApp(page);
    const busca = page.locator("#search-input");
    await busca.focus();
    expect(await busca.evaluate((el) => el.matches(":focus-visible")), "campo de texto sempre mostra o foco").toBe(true);
    expect(await busca.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe("solid");
    expect(await busca.evaluate((el) => parseFloat(getComputedStyle(el).outlineWidth))).toBeGreaterThanOrEqual(2);
    // A regra do campo de busca é :focus-visible, não :focus puro (que ringaria até o clique de mouse em outros navegadores).
    const regrasFocoPuro = await page.evaluate(() => [...document.styleSheets].flatMap((sh) => { try { return [...sh.cssRules]; } catch (e) { return []; } })
      .filter((r) => r.selectorText && /.campo-busca:focus(?!-visible)/.test(r.selectorText)).map((r) => r.selectorText));
    expect(regrasFocoPuro).toEqual([]);
  });

  test("botões não mostram anel ao clique do mouse, só ao teclado", async ({ page }) => {
    await abrirApp(page);
    const aba = page.locator('.tabs .tab-btn[data-tab="team"]');
    await aba.click();
    expect(await aba.evaluate((el) => getComputedStyle(el).outlineStyle), "clique de mouse: sem anel").toBe("none");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    expect(await page.evaluate(() => document.activeElement.matches(":focus-visible")), "teclado: anel").toBe(true);
  });

  test("botões e atalhos têm touch-action e destaque de toque definidos", async ({ page }) => {
    await abrirApp(page);
    await abrirAba(page, "dex");
    await page.locator("#species-list .species-row").first().click();
    const lidos = await page.evaluate(() => {
      const pega = (sel) => {
        const el = document.querySelector(sel);
        const cs = el && getComputedStyle(el);
        return el ? { sel, toque: cs.touchAction, destaque: cs.getPropertyValue("-webkit-tap-highlight-color") } : { sel, ausente: true };
      };
      return ["button.tab-btn", "#add-team-btn", ".evo-node.goto-species, .goto-species", ".species-row", "summary"].map(pega);
    });
    for (const l of lidos) {
      if (l.ausente) continue;
      expect(l.toque, `${l.sel}: touch-action`).toBe("manipulation");
      expect(l.destaque, `${l.sel}: destaque de toque`).not.toMatch(/^rgba?\(\s*0,\s*0,\s*0,\s*0\.?\d*\)$|^$/);
    }
    expect(lidos.filter((l) => !l.ausente).length).toBeGreaterThanOrEqual(4);
  });

  test("campos de nível pedem teclado numérico", async ({ page }) => {
    await abrirApp(page);
    await abrirAba(page, "bosses");
    await page.locator("#boss-list .species-row").first().click();
    await expect(page.locator("#boss-level-input")).toHaveAttribute("inputmode", "numeric");
    await abrirAba(page, "dex");
    await page.locator("#species-list .species-row").first().click();
    await page.locator("#species-detail details").evaluateAll((ds) => ds.forEach((d) => { d.open = true; }));
    const nivel = page.locator("#mybuild-level");
    if (await nivel.count()) await expect(nivel).toHaveAttribute("inputmode", "numeric");
  });
});

test.describe("alto contraste: alvo de toque da caixa", () => {
  async function ligarAltoContraste(page) {
    await abrirAba(page, "progress");
    await page.locator("#settings-high-contrast").check();
    await expect(page.locator("html")).toHaveAttribute("data-high-contrast", "true");
  }

  test("no mouse: alvo de pelo menos 24 px, e clicar no texto liga a caixa", async ({ page }) => {
    await abrirApp(page);
    await abrirAba(page, "progress");
    const rotulo = page.locator("label.opcao-caixa", { hasText: "Alto contraste" });
    expect((await rotulo.boundingBox()).height).toBeGreaterThanOrEqual(24);
    await rotulo.getByText("Alto contraste").click();
    await expect(page.locator("html")).toHaveAttribute("data-high-contrast", "true");
  });

  test.describe("no celular", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

    test("alvo de 44 px (o mesmo dos outros controles)", async ({ page }) => {
      await abrirApp(page);
      await ligarAltoContraste(page);
      const medidas = await page.evaluate(() => {
        const alvoMin = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--alvo-min"));
        const r = document.querySelector("label.opcao-caixa").getBoundingClientRect();
        const caixa = document.getElementById("settings-high-contrast").getBoundingClientRect();
        const aba = document.querySelector(".tabs .tab-btn").getBoundingClientRect();
        return { alvoMin, rotuloAlt: r.height, caixaAlt: caixa.height, abaAlt: aba.height };
      });
      expect(medidas.alvoMin).toBe(44);
      expect(medidas.rotuloAlt).toBeGreaterThanOrEqual(medidas.alvoMin);
      expect(medidas.rotuloAlt).toBeGreaterThanOrEqual(medidas.abaAlt - 1);
      expect(medidas.caixaAlt, "a caixa em si também cresceu").toBeGreaterThanOrEqual(20);
    });

    test("alto contraste ligado: atalho de espécie com anel de foco branco visível", async ({ page }) => {
      await abrirApp(page);
      await ligarAltoContraste(page);
      await abrirAba(page, "bosses");
      await page.locator("#boss-list .species-row").first().click();
      const cabeca = page.locator("#boss-detail .bm-head.goto-species").first();
      await cabeca.focus();
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Tab");
      const anel = await cabeca.evaluate((el) => {
        const cs = getComputedStyle(el);
        return { estilo: cs.outlineStyle, largura: parseFloat(cs.outlineWidth), cor: cs.outlineColor, focoVisivel: el.matches(":focus-visible") };
      });
      expect(anel.focoVisivel).toBe(true);
      expect(anel.estilo).toBe("solid");
      expect(anel.largura).toBeGreaterThanOrEqual(2);
      expect(anel.cor, "foco branco no alto contraste").toBe("rgb(255, 255, 255)");
    });
  });
});
