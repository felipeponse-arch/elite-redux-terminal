// Interações com cliques e teclado de verdade (Playwright), onde a suíte de
// dentro da página não chega: tempo real entre digitar e clicar, tamanho de
// tela, foco.
import { test, expect, abrirApp, abrirAba, adicionarAoTimePelaDex } from "./apoio.mjs";
import { VERSAO_DEX } from "../../scripts/alarme_upstream.mjs";

// Bug achado na fase 6 (2026-09-24): no computador, digitar na busca com uma
// ficha aberta deixava a ficha congelada - "+ Time" continuava ativo depois
// de adicionar, porque o redesenho conferia uma classe que a busca tira.
test("ficha aberta continua atualizando depois de digitar na busca (computador)", async ({ page }) => {
  await abrirApp(page);
  await abrirAba(page, "dex");
  await page.locator("#search-input").fill("Charizard");
  await page.locator("#species-list .species-row", { hasText: "Charizard" }).first().click();
  await expect(page.locator("#species-detail h2")).toHaveText("Charizard");
  // Procura outro Pokémon sem fechar a ficha (no computador ela segue na tela).
  await page.locator("#search-input").fill("Pikachu");
  await expect(page.locator("#species-list .species-row").first()).toContainText("Pikachu");
  await expect(page.locator("#species-detail h2")).toBeVisible();
  await page.locator("#add-team-btn").click();
  await expect(page.locator("#add-team-btn"), "a ficha mostra que já está no time").toBeDisabled();
  await expect(page.locator("#add-team-btn")).toHaveText("No time");
});

// Fase 7 (2026-09-24): a busca dos Chefões ficou sem estilo nenhum porque a
// pele dos campos era repetida por id e ninguém repetiu pra ela; e nenhum
// campo herdava a fonte do app. Todo campo visível, em todas as abas, usa a
// classe .campo e a fonte do app.
test("todo campo de formulário usa a pele .campo e a fonte do app", async ({ page }) => {
  // Campos com visual próprio de propósito (e o motivo).
  const EXCECOES = {
    "mybuild-num": "grade compacta de IV/EV, raio menor",
    "stc-rename-input": "modo de edição do nome, borda de destaque",
  };
  await abrirApp(page);
  const fora = [];
  const conferir = async (onde) => {
    const achados = await page.evaluate((excecoes) => {
      const fonteDoApp = getComputedStyle(document.body).fontFamily;
      return [...document.querySelectorAll("input:not([type=checkbox]):not([type=radio]):not([type=range]), select, textarea")]
        .filter((el) => el.offsetParent !== null)
        .filter((el) => ![...el.classList].some((c) => c in excecoes) && !(el.id in excecoes))
        .filter((el) => !el.classList.contains("campo") || (!el.classList.contains("mono") && getComputedStyle(el).fontFamily !== fonteDoApp))
        .map((el) => el.id || el.className || el.outerHTML.slice(0, 60));
    }, EXCECOES);
    for (const a of achados) fora.push(`${onde}: ${a}`);
  };
  for (const aba of ["dex", "team", "box", "bosses", "progress", "types"]) {
    await abrirAba(page, aba);
    await conferir(aba);
  }
  await abrirAba(page, "dex");
  await page.locator("#species-list .species-row").first().click();
  await page.locator("#species-detail details").evaluateAll((ds) => ds.forEach((d) => { d.open = true; }));
  await conferir("ficha");
  await abrirAba(page, "bosses");
  await page.locator("#boss-list .species-row").first().click();
  await conferir("chefão");
  expect(fora, "campos sem .campo ou sem a fonte do app").toEqual([]);
});

// Primeira espécie com DUAS curadas no dado real (Lepastry, builds da
// comunidade de 24/09/2026): o card do time mostra a do estilo que o Ritmo
// pede, e troca quando o Ritmo muda.
test("espécie com duas curadas mostra a do estilo do Ritmo", async ({ page }) => {
  await abrirApp(page);
  await adicionarAoTimePelaDex(page, "Lepastry");
  await abrirAba(page, "team");
  const card = page.locator(".team-slot").first();
  await expect(card).toContainText("Gooey");
  // O arquétipo fica recolhido numa linha (redesenho 2026-09-24): abre e
  // continua aberto depois de cada escolha (a tela é redesenhada).
  await page.locator("details.arquetipo > summary").click();
  await page.locator('.arch-chip[data-axis="pace"][data-value="Hyper Offense"]').click();
  await expect(page.locator("details.arquetipo")).toHaveAttribute("open", "");
  await expect(page.locator("details.arquetipo > summary")).toContainText("Hyper Offense");
  await expect(card).toContainText("ofensivo", { ignoreCase: true });
  await expect(card).toContainText("Gladiator");
  await page.locator('.arch-chip[data-axis="pace"][data-value="Stall"]').click();
  await expect(card).toContainText("defensivo", { ignoreCase: true });
  await expect(card).toContainText("Gooey");
});

// Marcar o badge (2026-09-24, pedido do usuário: custava 3 cliques escondidos
// em "Mais"): no computador o Progresso fica na barra principal, no celular
// volta pro "Mais"; e clicar numa etapa da trilha marca o badge.
test("Progresso na barra principal no computador e no Mais no celular", async ({ page }) => {
  await abrirApp(page);
  await expect(page.locator('.tabs .tab-btn[data-tab="progress"]')).toBeVisible();
  // O cabeçalho continua numa linha só com a aba a mais (a partir de 1024 px).
  const topoAbas = await page.locator(".tabs-row").evaluate((el) => el.getBoundingClientRect().top);
  const topoMarca = await page.locator(".brand").evaluate((el) => el.getBoundingClientRect().top);
  expect(Math.abs(topoAbas - topoMarca)).toBeLessThan(20);
  await page.setViewportSize({ width: 390, height: 800 });
  await expect(page.locator('#tabs-more-panel .tab-btn[data-tab="progress"]')).toHaveCount(1);
  await expect(page.locator('.tabs .tab-btn[data-tab="progress"]')).toHaveCount(0);
});

// A ~900 px o subtítulo cortava até sobrar só "Dex …" e a versão do jogo sumia
// (2026-09-24). A versão nunca corta; o resto encolhe antes dela.
test("versão do jogo aparece inteira no subtítulo em tela estreita", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 700 });
  await abrirApp(page);
  const versao = page.locator(".brand-sub-versao");
  await expect(versao).toContainText(VERSAO_DEX);
  const cortada = await versao.evaluate((el) => el.scrollWidth > el.clientWidth + 1 || el.getBoundingClientRect().width < 20);
  expect(cortada, "a versão do jogo foi cortada").toBe(false);
});

// Janela flutuante do celular (2026-09-26): o rodapé quebrava em 2 linhas
// (51 px) e roubava espaço da lista. Uma linha só, com os 3 destinos.
test("rodapé ocupa uma linha só em janela pequena de celular", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 520 });
  await abrirApp(page);
  const rodape = page.locator(".footer");
  expect((await rodape.boundingBox()).height).toBeLessThan(32);
  await expect(page.locator(".footer .rodape a")).toHaveCount(3);
});

// Mono run (2026-09-26): escolher um Monotype mostra sozinho onde pegar
// Pokémon do tipo, e o nome leva pra ficha.
test("Monotype mostra onde pegar o tipo e o nome abre a ficha", async ({ page }) => {
  await abrirApp(page);
  await adicionarAoTimePelaDex(page, "Charmander");
  await abrirAba(page, "team");
  await expect(page.locator(".mono-run")).toHaveCount(0);
  await page.locator("details.arquetipo > summary").click();
  await page.locator('.arch-chip[data-axis="monotype"][data-value="Fire"]').click();
  const card = page.locator(".mono-run");
  await expect(card.locator("h3")).toHaveText("Mono Fire");
  // Revisão de front/CX (2026-09-27): o card fica ABAIXO do time e as listas
  // completas ficam recolhidas.
  const topoTime = await page.locator("#team-slots").evaluate((el) => el.getBoundingClientRect().top);
  const topoCard = await card.evaluate((el) => el.getBoundingClientRect().top);
  expect(topoCard).toBeGreaterThan(topoTime);
  await expect(card.locator("details.mono-tudo")).not.toHaveAttribute("open", "");
  await card.locator("details.mono-tudo > summary").click();
  await expect(card.locator(".mono-item", { hasText: "Charmander" })).toContainText("já tem");
  // Clima que combina (Fire -> Sun): um clique põe no arquétipo.
  await card.locator(".mono-usar-clima").click();
  await expect(page.locator("details.arquetipo > summary")).toContainText("Clima e campo: Sun");
  await expect(page.locator(".mono-run .mono-clima")).toContainText("é o clima do seu time");
  const primeiro = card.locator(".mono-nome").first();
  const nome = await primeiro.textContent();
  await primeiro.click();
  await expect(page.locator("#view-dex")).toBeVisible();
  await expect(page.locator("#species-detail h2")).toHaveText(nome);
});

test("clicar numa etapa da trilha marca o badge", async ({ page }) => {
  await abrirApp(page);
  await abrirAba(page, "progress");
  await page.locator('#progress-trail .trail-node[data-marco="3"]').click();
  await expect(page.locator("#settings-milestone")).toHaveValue("3");
  await expect(page.locator('#progress-trail .trail-node[data-marco="3"]')).toHaveAttribute("aria-current", "step");
  const salvo = await page.evaluate(() => JSON.parse(localStorage.getItem("er_terminal_save")).settings.milestone);
  expect(salvo).toBe(3);
});

test("no celular, digitar na busca volta pra lista e a ficha some", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await abrirApp(page);
  await abrirAba(page, "dex");
  await page.locator("#species-list .species-row", { hasText: "Charizard" }).first().click();
  await expect(page.locator("#species-detail")).toBeVisible();
  await expect(page.locator("#species-list")).toBeHidden();
  await page.locator("#search-input").fill("Pika");
  await expect(page.locator("#species-list")).toBeVisible();
  await expect(page.locator("#species-detail")).toBeHidden();
});

// Ticket 10 (07/10/2026): Home/End na lista (padrão de listbox do ARIA APG). Na Dex a lista vem em lotes:
// o End carrega o resto antes de ir à última linha; o Home volta à primeira.
test("lista da Dex: End vai à última espécie (carregando os lotes) e Home volta à primeira", async ({ page }) => {
  await abrirApp(page);
  await abrirAba(page, "dex");
  const linhas = page.locator("#species-list .species-row");
  await linhas.first().focus();
  await page.keyboard.press("End");
  const total = await page.evaluate(() => document.querySelectorAll("#species-list .species-row").length);
  expect(total, "o End carregou todos os lotes").toBeGreaterThan(1000);
  await expect(linhas.last()).toBeFocused();
  await page.keyboard.press("Home");
  await expect(linhas.first()).toBeFocused();
});

// Ticket 13 (07/10/2026): anterior/próximo da ficha segue a lista da tela (busca aplicada) e a ficha mostra
// o TOTAL dos stats e as faixas Fraco/Resiste/Imune.
test("ficha: próximo segue a lista filtrada; TOTAL e faixas de efetividade aparecem", async ({ page }) => {
  await abrirApp(page);
  await abrirAba(page, "dex");
  await page.locator("#search-input").fill("Charizard");
  await expect(page.locator("#species-list .species-row")).toHaveCount(4);
  await page.locator("#species-list .species-row").first().click();
  await expect(page.locator("#species-detail h2")).toHaveText("Charizard");
  await expect(page.locator(".ficha-nav-btn")).toHaveCount(1); // primeiro da lista: só "próxima"
  await expect(page.locator(".stats-total")).toHaveText("TOTAL 535");
  await expect(page.locator(".efe-imune + .efe-lista")).toContainText("Ground");
  await page.locator(".ficha-nav-btn").click();
  await expect(page.locator("#species-detail h2")).toHaveText("Charizard Mega X");
  await expect(page.locator(".ficha-nav-btn")).toHaveCount(2);
});

// Ticket 14 (07/10/2026): cada Pokémon do chefão tem "Exportar" (set no formato Showdown) e o cabeçalho da
// Equipe Aqua/Magma ganha a arte da equipe.
test("chefão: Exportar copia o set no formato Showdown; Aqua tem cabeçalho com arte", async ({ page }) => {
  await abrirApp(page);
  await abrirAba(page, "bosses");
  await page.locator("#boss-list .species-row", { hasText: "Archie Slateport" }).first().click();
  await expect(page.locator("#boss-detail .detail-head.chefao-aqua")).toHaveCount(1);
  await page.evaluate(() => { window.__copiado = null; navigator.clipboard.writeText = (t) => { window.__copiado = t; return Promise.resolve(); }; });
  await page.locator(".boss-export-btn").first().click();
  await expect.poll(() => page.evaluate(() => window.__copiado)).toContain("Crobat @ Black Sludge");
  const texto = await page.evaluate(() => window.__copiado);
  expect(texto).toMatch(/Ability: Tinted Lens/);
  expect(texto).toMatch(/- Dual Wingbeat/);
});

// Ticket 15 (07/10/2026): no celular as 4 abas cabem sem rolar a partir de 360 px (antes a aba Dex sumia
// para a esquerda com Chefões ativa) e a página não rola para o lado.
for (const largura of [360, 375]) {
  test("celular " + largura + " px: as abas cabem sem rolar", async ({ page }) => {
    await page.setViewportSize({ width: largura, height: 740 });
    await abrirApp(page);
    await page.locator('.tab-btn[data-tab="bosses"]').click();
    const m = await page.evaluate(() => { const t = document.querySelector(".tabs"); return { cabe: t.scrollWidth <= t.clientWidth, pagina: document.documentElement.scrollWidth }; });
    expect(m.cabe, "barra de abas sem rolagem").toBe(true);
    expect(m.pagina).toBeLessThanOrEqual(largura);
  });
}
