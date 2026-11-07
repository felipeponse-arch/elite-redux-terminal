// Ticket 15 da dívida técnica (2026-10-08): cor do tema na barra do navegador,
// "Pular para o conteúdo" e bordas seguras do celular (entalhe, barra de gestos).
import { test, expect, abrirApp } from "./apoio.mjs";

const corDoMeta = (page) => page.evaluate(() => document.querySelector('meta[name="theme-color"]').getAttribute("content"));
const fundo = (page) => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--bg").trim());

// Entalhe simulado pelo próprio Chromium (mesma coisa que o modo celular do
// DevTools): faz env(safe-area-inset-*) valer de verdade, sem trocar o CSS.
async function simularEntalhe(page, insets) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setSafeAreaInsetsOverride", { insets });
}

test.describe("meta theme-color segue o tema", () => {
  test("tema claro: cor do fundo claro", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await abrirApp(page);
    expect(await fundo(page)).toBe("#f6f4ec");
    expect(await corDoMeta(page)).toBe("#f6f4ec");
  });

  test("tema padrão é o aço azul-noite (mesmo com o sistema claro) e o claro vale só com data-theme", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await abrirApp(page);
    await page.evaluate(() => document.documentElement.removeAttribute("data-theme"));
    await expect.poll(() => corDoMeta(page)).toBe("#0a1220");
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
    await expect.poll(() => corDoMeta(page)).toBe("#f6f4ec");
  });

  test("tema escolhido na plataforma (data-theme) vale por cima do sistema", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await abrirApp(page);
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
    await expect.poll(() => corDoMeta(page)).toBe("#0a1220");
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
    await expect.poll(() => corDoMeta(page)).toBe("#f6f4ec");
  });

  test("alto contraste (Progresso) vira preto puro, e desligar volta", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await abrirApp(page);
    await page.evaluate(() => document.documentElement.setAttribute("data-high-contrast", "true"));
    await expect.poll(() => corDoMeta(page)).toBe("#000000");
    await page.evaluate(() => document.documentElement.setAttribute("data-high-contrast", "false"));
    await expect.poll(() => corDoMeta(page)).toBe("#f6f4ec");
  });

  test("a cor do meta é sempre a do --bg (nenhuma cor repetida à mão)", async ({ page }) => {
    for (const tema of ["light", "dark"]) {
      await page.emulateMedia({ colorScheme: tema });
      await abrirApp(page);
      expect(await corDoMeta(page)).toBe(await fundo(page));
    }
  });
});

test.describe("pular para o conteúdo", () => {
  test("é o primeiro Tab, fica escondido sem foco e aparece com foco", async ({ page }) => {
    await abrirApp(page);
    const link = page.locator(".pular-conteudo");
    await expect(link).toHaveText("Pular para o conteúdo");
    // Escondido não deixa nem a sombra vazar pro topo da tela (mancha na foto do entalhe).
    expect(await link.evaluate((el) => getComputedStyle(el).boxShadow), "sem foco: sem sombra").toBe("none");
    // Sem foco: fora da tela (acima do topo).
    expect((await link.boundingBox()).y + (await link.boundingBox()).height).toBeLessThanOrEqual(0);
    await page.keyboard.press("Tab");
    await expect(link).toBeFocused();
    expect(await link.evaluate((el) => getComputedStyle(el).boxShadow), "com foco: sombra volta").not.toBe("none");
    const caixa = await link.boundingBox();
    expect(caixa.y, "visível: dentro da tela").toBeGreaterThanOrEqual(0);
    expect(caixa.height).toBeGreaterThanOrEqual(24);
    await expect(link).toBeVisible();
  });

  test("Enter leva o foco para o <main> sem navegar e sem anel em volta da tela", async ({ page }) => {
    await abrirApp(page);
    const urlAntes = page.url();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(page.locator("main#conteudo-principal")).toBeFocused();
    expect(page.url(), "não pode mudar o endereço (iframe do artifact)").toBe(urlAntes);
    expect(await page.evaluate(() => getComputedStyle(document.getElementById("conteudo-principal")).outlineStyle)).toBe("none");
    // O próximo Tab já cai em controle do conteúdo, não de volta no cabeçalho.
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.getElementById("conteudo-principal").contains(document.activeElement))).toBe(true);
  });

  for (const [rotulo, tema, altoContraste] of [["claro", "light", false], ["escuro", "dark", false], ["alto contraste", "light", true]]) {
    test(`texto legível com foco (${rotulo}): contraste de pelo menos 7:1`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: tema });
      await abrirApp(page);
      if (altoContraste) await page.evaluate(() => document.documentElement.setAttribute("data-high-contrast", "true"));
      await page.keyboard.press("Tab");
      const razao = await page.evaluate(() => {
        const el = document.querySelector(".pular-conteudo");
        const cs = getComputedStyle(el);
        const lum = (css) => {
          const c = document.createElement("canvas").getContext("2d");
          c.fillStyle = css; c.fillRect(0, 0, 1, 1);
          const [r, g, b] = c.getImageData(0, 0, 1, 1).data.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        const a = lum(cs.color), b = lum(cs.backgroundColor);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      });
      expect(razao).toBeGreaterThanOrEqual(7);
    });
  }
});

test.describe("bordas seguras (celular com entalhe)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("sem entalhe nada muda: preenchimento original do cabeçalho e do rodapé", async ({ page }) => {
    await abrirApp(page);
    await page.evaluate(() => { const b = document.getElementById("run-setup-banner"); if (b) b.hidden = true; });
    const p = await page.evaluate(() => {
      const t = getComputedStyle(document.querySelector(".topbar")), r = getComputedStyle(document.querySelector(".footer"));
      return { topo: [t.paddingTop, t.paddingRight, t.paddingBottom, t.paddingLeft], rodape: [r.paddingTop, r.paddingRight, r.paddingBottom, r.paddingLeft] };
    });
    expect(p.topo).toEqual(["8px", "10px", "8px", "10px"]);
    expect(p.rodape).toEqual(["0px", "14px", "0px", "14px"]);
  });

  test("cabeçalho e rodapé crescem o tanto do entalhe e da barra de gestos", async ({ page }) => {
    await simularEntalhe(page, { top: 47, bottom: 34, left: 0, right: 0 });
    await abrirApp(page);
    await page.evaluate(() => { const b = document.getElementById("run-setup-banner"); if (b) b.hidden = true; });
    const p = await page.evaluate(() => {
      const t = getComputedStyle(document.querySelector(".topbar")), r = getComputedStyle(document.querySelector(".footer"));
      return { topo: t.paddingTop, rodape: r.paddingBottom, rodapeTopo: r.paddingTop };
    });
    expect(p.topo).toBe("55px"); // 8 + 47
    expect(p.rodape).toBe("34px"); // 0 + 34
    expect(p.rodapeTopo).toBe("0px");
    // O conteúdo do cabeçalho (marca) começa abaixo do entalhe, e o rodapé termina acima da barra de gestos.
    expect((await page.locator(".brand-mark").boundingBox()).y).toBeGreaterThanOrEqual(47);
    const rodape = await page.locator(".footer .rodape").boundingBox();
    expect(rodape.y + rodape.height).toBeLessThanOrEqual(844 - 34);
  });

  test("celular deitado: entalhe nas laterais afasta marca e rodapé da borda", async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await simularEntalhe(page, { top: 0, bottom: 21, left: 47, right: 47 });
    await abrirApp(page);
    await page.evaluate(() => { const b = document.getElementById("run-setup-banner"); if (b) b.hidden = true; });
    expect((await page.locator(".brand-mark").boundingBox()).x).toBeGreaterThanOrEqual(47);
    expect((await page.locator(".footer .rodape").boundingBox()).x).toBeGreaterThanOrEqual(47);
  });

  test("com aviso fixo no topo o entalhe é coberto pelo aviso, sem somar duas vezes no cabeçalho", async ({ page }) => {
    await simularEntalhe(page, { top: 47, bottom: 0, left: 0, right: 0 });
    await abrirApp(page);
    const banner = page.locator("#run-setup-banner");
    await expect(banner).toBeVisible();
    const m = await page.evaluate(() => {
      const b = document.getElementById("run-setup-banner").getBoundingClientRect();
      const t = document.querySelector(".topbar");
      return { alturaAviso: b.height, paddingAviso: getComputedStyle(document.getElementById("run-setup-banner")).paddingTop, topoCabecalho: t.getBoundingClientRect().top, paddingCabecalho: getComputedStyle(t).paddingTop };
    });
    expect(m.paddingAviso).toBe("51px");
    expect(m.paddingCabecalho, "o aviso já cobre o entalhe").toBe("8px");
    expect(m.topoCabecalho, "cabeçalho começa logo abaixo do aviso").toBeGreaterThanOrEqual(m.alturaAviso - 1);
    // Fechar o aviso devolve a borda segura ao cabeçalho.
    await page.evaluate(() => { document.getElementById("run-setup-banner").hidden = true; });
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.querySelector(".topbar")).paddingTop)).toBe("55px");
  });
});
