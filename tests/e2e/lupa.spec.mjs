// Lupa (11/11/2026): balão com o texto de habilidade/inata/golpe no Time do Chefão e no Meu Time; desktop (hover/foco) e celular (toque).
import { test, expect, abrirApp, abrirAba, adicionarAoTimePelaDex } from "./apoio.mjs";

// Texto esperado calculado direto dos dados (não pela função da lupa): mesma regra da ficha da Dex.
const esperado = (page, tipo, id) => page.evaluate(([t, i]) => {
  const d = window.__erTest.textosCrus();
  return t === "golpe" ? (d.MOVE_PT[String(i)] || d.MOVES[i][6] || "Sem descrição.") : (d.ABILITY_PT[String(i)] || d.ABILITIES[i][1]);
}, [tipo, id]);

async function abrirChefao(page) {
  await abrirAba(page, "bosses");
  await page.locator("#boss-list .species-row").first().click();
  const sanfona = page.locator("#boss-detail details.sanfona-time");
  if (await sanfona.count() && !(await sanfona.evaluate((d) => d.open))) await sanfona.locator("> summary").click();
  return page.locator("#boss-detail .boss-mon-card").first();
}
async function abrirMeuTime(page) {
  await adicionarAoTimePelaDex(page, "Blastoise");
  await abrirAba(page, "team");
  return page.locator("#view-team .cartao-membro").first();
}
async function conferir(page, cartao, tipo, acao) {
  // celular: as sanfonas do cartão vêm fechadas
  await cartao.evaluate((c) => { for (let d = c; d; d = d.parentElement) if (d.tagName === "DETAILS") d.open = true; c.querySelectorAll("details").forEach((d) => { d.open = true; }); });
  const btn = cartao.locator(`.lupa-btn[data-lupa="${tipo}"]`).first();
  await expect(btn).toBeVisible();
  const id = await btn.getAttribute("data-id");
  await acao(btn);
  const balao = page.locator("#lupa-balao");
  await expect(balao).toBeVisible();
  expect(await balao.textContent()).toBe(await esperado(page, tipo, id));
  const cx = await balao.boundingBox(), vw = page.viewportSize().width;
  expect(cx.x).toBeGreaterThanOrEqual(0);
  expect(cx.x + cx.width).toBeLessThanOrEqual(vw);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  return btn;
}

for (const [nome, abrir] of [["Time do Chefão", abrirChefao], ["Meu Time", abrirMeuTime]]) {
  test.describe(nome + " desktop", () => {
    test.use({ viewport: { width: 1280, height: 900 } });
    test("hover abre habilidade e golpe com o texto da Dex; sair fecha; foco por teclado abre; Esc fecha", async ({ page }) => {
      await abrirApp(page);
      const cartao = await abrir(page);
      for (const tipo of ["hab", "golpe"]) {
        const btn = await conferir(page, cartao, tipo, (b) => b.hover());
        await page.mouse.move(0, 0);
        await expect(page.locator("#lupa-balao")).toBeHidden();
        await btn.focus();
        await expect(page.locator("#lupa-balao")).toBeVisible();
        await expect(btn).toHaveAttribute("aria-describedby", "lupa-balao");
        await page.keyboard.press("Escape");
        await expect(page.locator("#lupa-balao")).toBeHidden();
      }
    });
    test("imprimir a tela: print com o balão aberto", async ({ page }, testInfo) => {
      await abrirApp(page);
      const cartao = await abrir(page);
      await cartao.locator('.lupa-btn[data-lupa="golpe"]').first().hover();
      // O print vai para test-results/ (ignorado pelo git): o caminho antigo, fora do repositório, não existe no CI.
      await page.screenshot({ path: testInfo.outputPath(`${nome === "Meu Time" ? "meutime" : "chefao"}_1280.png`) });
    });
  });
  test.describe(nome + " celular", () => {
    test.use({ viewport: { width: 390, height: 844 } });
    test("tocar abre, tocar de novo fecha, tocar fora fecha; balão cabe em 90vw", async ({ page }, testInfo) => {
      await abrirApp(page);
      await (await page.context().newCDPSession(page)).send("Emulation.setCPUThrottlingRate", { rate: 6 });
      const cartao = await abrir(page);
      const btn = await conferir(page, cartao, "golpe", (b) => b.click());
      expect((await page.locator("#lupa-balao").boundingBox()).width).toBeLessThanOrEqual(390 * 0.9 + 1);
      await page.screenshot({ path: testInfo.outputPath(`${nome === "Meu Time" ? "meutime" : "chefao"}_390.png`) });
      // Evento de rolagem sem deslocar o botão (chega atrasado em máquina lenta) não fecha o balão; rolar de verdade fecha.
      await page.evaluate(() => window.dispatchEvent(new Event("scroll")));
      await expect(page.locator("#lupa-balao")).toBeVisible();
      await btn.click();
      await expect(page.locator("#lupa-balao")).toBeHidden();
      await btn.click();
      await expect(page.locator("#lupa-balao")).toBeVisible();
      await page.locator("h1, .topbar, body").first().click({ position: { x: 2, y: 2 } });
      await expect(page.locator("#lupa-balao")).toBeHidden();
      await conferir(page, cartao, "hab", (b) => b.click());
    });
  });
}
