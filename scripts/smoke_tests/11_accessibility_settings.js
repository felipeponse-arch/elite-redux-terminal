// Seção 11: acessibilidade (alto contraste + aumentar fonte), checklist
// eMAG 3.1, 2026-09-13. Diferente das seções 01-10 (extraídas do
// runLiveTests() monolítico original), esta seção é NOVA - cobre o card
// "Acessibilidade" (view Progresso) recém-implementado.
async function section11() {
  // Navega até a aba Progresso pelo dropdown "Mais" (mesmo caminho já
  // testado na seção 8, ver 03_dashboard_and_boss_calc.js) - é onde o
  // card "Acessibilidade" mora, junto com as outras configurações do jogador.
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  document.getElementById("tabs-more-toggle").click();
  const progressInPanel = document.getElementById("tabs-more-panel").querySelector('[data-tab="progress"]');
  progressInPanel.click();
  await wait(30);

  const hcCheckbox = document.getElementById("settings-high-contrast");
  const fontSelect = document.getElementById("settings-font-scale");
  check("controle de alto contraste existe", !!hcCheckbox);
  check("controle de tamanho de fonte existe", !!fontSelect);

  // Suíte roda com localStorage limpo (seed no início de section01), então
  // nada disso foi ligado ainda - estado inicial esperado é "desligado".
  check("alto contraste começa desligado", hcCheckbox.checked === false);
  check("--bg começa no valor normal do tema (não o #000000 do alto contraste)",
    getComputedStyle(document.documentElement).getPropertyValue("--bg").trim().toLowerCase() !== "#000000");

  hcCheckbox.checked = true;
  hcCheckbox.dispatchEvent(new Event("change", { bubbles: true }));
  await wait(30);
  check("ligar o checkbox aplica data-high-contrast=\"true\" no <html>",
    document.documentElement.getAttribute("data-high-contrast") === "true");
  // Achado real desta implementação (2026-09-13): um "*/" acidental dentro
  // de um comentário CSS fechava o comentário cedo demais e derrubava essa
  // regra inteira do stylesheet parseado, em silêncio - --bg nunca mudava
  // mesmo com o atributo certo no <html>. Este check é exatamente o que
  // teria pego aquele bug sem precisar inspecionar document.styleSheets à mão.
  check("ligar o alto contraste muda --bg para #000000 de verdade",
    getComputedStyle(document.documentElement).getPropertyValue("--bg").trim().toLowerCase() === "#000000");
  check("ligar o alto contraste muda --accent para o amarelo saturado (#ffcc00)",
    getComputedStyle(document.documentElement).getPropertyValue("--accent").trim().toLowerCase() === "#ffcc00");

  fontSelect.value = "1.3";
  fontSelect.dispatchEvent(new Event("change", { bubbles: true }));
  await wait(30);
  check("mudar o tamanho da fonte atualiza --user-font-scale no <html>",
    document.documentElement.style.getPropertyValue("--user-font-scale") === "1.3");
  check("--user-font-scale realmente chega no zoom computado do <body>",
    getComputedStyle(document.body).zoom === "1.3");

  // Persistência: saveA11yPrefs() grava em localStorage numa chave PRÓPRIA
  // (er_terminal_a11y), separada de propósito do save do jogo - é
  // preferência de exibição por aparelho, não dado de save/sincronização.
  // Um reload de verdade só é testável via Playwright (ver
  // tests/e2e/recarga.spec.mjs), então aqui confirma que o que foi
  // gravado bate com o que os controles mostram.
  const storedRaw = localStorage.getItem("er_terminal_a11y");
  const stored = storedRaw ? JSON.parse(storedRaw) : null;
  check("preferências de acessibilidade persistem em localStorage própria (er_terminal_a11y)",
    !!stored && stored.highContrast === true && stored.fontScale === 1.3);

  // Desliga tudo de novo pra não vazar estado pras seções seguintes -
  // nenhuma outra seção espera alto contraste/fonte grande ligados.
  hcCheckbox.checked = false;
  hcCheckbox.dispatchEvent(new Event("change", { bubbles: true }));
  fontSelect.value = "1";
  fontSelect.dispatchEvent(new Event("change", { bubbles: true }));
  await wait(30);
  check("desligar de novo volta --bg ao normal (limpeza pro resto da suíte)",
    getComputedStyle(document.documentElement).getPropertyValue("--bg").trim().toLowerCase() !== "#000000");

  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
}
