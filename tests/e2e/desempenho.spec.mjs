// Desempenho da carga (fase 8 da refatoração, 2026-09-24). Em 05/11/2026 as fontes passaram a vir embutidas
// (antes o Google Fonts travava a primeira pintura); o teste de atraso da rede virou o teste de fontes embutidas.
//
// Medido antes da correção: a folha do Google Fonts travava a primeira pintura
// - a tela esperava a resposta do Google (232 ms com rede boa, 1.728 ms com a
// resposta levando 1,5 s). O JS da carga custa pouco (JSON.parse de todos os
// dados ~45 ms com CPU 4x mais lenta); o gargalo era a rede das fontes.
import { test, expect } from "./apoio.mjs";

test("as fontes são embutidas: nenhuma requisição ao Google e todas disponíveis", async ({ page }) => {
  const externas = [];
  page.on("request", (r) => { if (/fonts.(googleapis|gstatic).com/.test(r.url())) externas.push(r.url()); });
  await page.goto("/artifact_final.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__fontesProntas === true, null, { timeout: 10_000 });
  expect(externas).toEqual([]);
  await page.evaluate(() => Promise.all(['500 15px "Bricolage Grotesque"', '400 15px "Figtree"', '400 13px "IBM Plex Mono"'].map((f) => document.fonts.load(f))));
  for (const f of ['15px "Figtree"', '15px "Bricolage Grotesque"', '13px "IBM Plex Mono"']) {
    expect(await page.evaluate((x) => document.fonts.check(x), f), f).toBe(true);
  }
});

// As duas causas do deslocamento, testadas direto (sem depender de o script
// rodar antes ou depois da primeira pintura, que varia com a máquina):
//  1. a forma do cabeçalho não depende do tamanho do subtítulo;
//  2. o resumo vazio já ocupa a altura do resumo preenchido (uma linha).
for (const largura of [1440, 1280, 1024, 900]) {
  test(`cabeçalho com o mesmo formato pra subtítulo curto e longo (${largura}px)`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: 800 });
    await page.goto("/artifact_final.html", { waitUntil: "load" });
    await page.waitForFunction(() => window.__fontesProntas === true);
    const medir = (texto) => page.evaluate((t) => {
      document.getElementById("sync-status-indicator").textContent = t;
      const abas = document.querySelector(".tabs-row").getBoundingClientRect();
      return { topoAbas: Math.round(abas.top), alturaCabecalho: Math.round(document.querySelector(".topbar").getBoundingClientRect().height) };
    }, texto);
    const curto = await medir("");
    const longo = await medir("só neste aparelho (não foi possível reconectar - recarregue a página)");
    expect(longo, "o subtítulo longo não pode mudar as abas de linha").toEqual(curto);
  });
}

test("o resumo vazio já reserva a altura de uma linha", async ({ page }) => {
  await page.goto("/artifact_final.html", { waitUntil: "load" });
  await page.waitForFunction(() => window.__fontesProntas === true);
  const alturas = await page.evaluate(() => {
    const d = document.getElementById("dashboard");
    const cheio = d.offsetHeight;
    const conteudo = d.innerHTML;
    d.innerHTML = "";
    const vazio = d.offsetHeight;
    d.innerHTML = conteudo;
    return { cheio, vazio };
  });
  expect(alturas.vazio).toBe(alturas.cheio);
});

// O cabeçalho não pode mudar de forma quando o script preenche o subtítulo
// (opção A, 2026-09-24). Antes: CLS ~0,53 no computador - as abas pulavam
// pra linha de baixo e a tela inteira descia. Mede no uso típico: run já
// confirmada (o aviso de configurar a run só aparece na primeira vez).
for (const largura of [1280, 1024, 900, 390]) {
  test(`a tela não se desloca ao carregar (${largura}px, run confirmada)`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: 800 });
    await page.goto("/artifact_final.html", { waitUntil: "load" });
    await page.evaluate(() => {
      document.querySelector('.tab-btn[data-tab="progress"]').click();
      document.getElementById("settings-run-confirm").click();
    });
    await page.addInitScript(() => {
      window.__cls = 0;
      new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls += e.value; }))
        .observe({ type: "layout-shift", buffered: true });
    });
    await page.reload({ waitUntil: "load" });
    await page.waitForFunction(() => window.__fontesProntas === true);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(600);
    const cls = await page.evaluate(() => window.__cls);
    // 0,1 é o limite de "bom" do Core Web Vitals.
    expect(cls, `CLS ${cls.toFixed(4)} em ${largura}px`).toBeLessThan(0.1);
  });
}
