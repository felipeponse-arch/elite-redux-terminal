  // ===== src/ui/abas.js =====
  // Navegação entre abas (e o redesenho da aba que abre).
  // Interface: lê e desenha a página. Colado no <script> principal por
  // scripts/build.mjs (marcador @ui abas.js) no MESMO lugar de onde saiu do
  // template (fase 5 da refatoração, 2026-09-24) - a ordem de execução não mudou.

  // ---------------- tabs ----------------
  var moreToggle = document.getElementById("tabs-more-toggle");
  var morePanel = document.getElementById("tabs-more-panel");
  // Progresso na barra principal quando cabe (2026-09-24, pedido do usuário:
  // marcar o badge escondido em "Mais" custava 3 cliques). Um botão só, que
  // muda de lugar conforme a largura - no celular a barra não comporta mais
  // uma aba e ele volta pro "Mais".
  var navAbas = document.querySelector(".tabs");
  // Onde estiver: o script #posicionar-progresso do template pode já tê-lo
  // levado pra barra antes deste código rodar.
  var btnProgresso = document.querySelector('.tab-btn[data-tab="progress"]');
  // 1024 px: abaixo disso a barra com Progresso não cabe na linha do logo e o
  // cabeçalho viraria duas linhas. Mesmo limite do script #posicionar-progresso
  // do template, que já o põe no lugar antes da primeira pintura.
  var telaLarga = window.matchMedia("(min-width: 1024px)");
  function posicionarProgresso() {
    if (!btnProgresso) return;
    if (telaLarga.matches) navAbas.appendChild(btnProgresso);
    else morePanel.insertBefore(btnProgresso, morePanel.firstChild);
    // "Mais" aceso só se a aba ativa estiver dentro dele.
    var ativa = document.querySelector(".tab-btn.active[data-tab]");
    moreToggle.classList.toggle("active", !!ativa && morePanel.contains(ativa));
  }
  posicionarProgresso();
  if (telaLarga.addEventListener) telaLarga.addEventListener("change", posicionarProgresso);
  function closeMorePanel() {
    morePanel.hidden = true;
    moreToggle.setAttribute("aria-expanded", "false");
  }
  document.querySelectorAll(".tab-btn").forEach(function (btn) {
    // #tabs-more-toggle shares the .tab-btn class for matching visual sizing
    // (see .tabs-more-toggle CSS) but isn't a real tab - it has no data-tab
    // and is wired separately below.
    if (!btn.dataset.tab) return;
    btn.addEventListener("click", function () {
      document.querySelectorAll(".tab-btn").forEach(function (b) {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      document.querySelectorAll(".view").forEach(function (v) { v.classList.remove("active"); });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      document.getElementById("view-" + btn.dataset.tab).classList.add("active");
      moreToggle.classList.toggle("active", morePanel.contains(btn));
      closeMorePanel();
      if (btn.dataset.tab === "team") renderTeam();
      if (btn.dataset.tab === "box") renderBox();
      if (btn.dataset.tab === "bosses") {
        initBosses();
        if (chefaoDesatualizado && bossState.selected !== null) { renderBossDetail(); chefaoDesatualizado = false; }
      }
      if (btn.dataset.tab === "progress") { initProgress(); renderProgressTrail(); } // trilha mede posições: só dá com a aba visível
      if (btn.dataset.tab === "types") { renderTypeMatrix(); wireSpeedTiersOnce(); renderSpeedTiers(); }
      // dashboardDirty (auditoria de performance, 2026-09-11): o dashboard só
      // recalcula de verdade quando o jogador volta pra Dex depois de mexer
      // no time/caixa noutra aba - ver scheduleDashboardRefresh().
      if (btn.dataset.tab === "dex" && dashboardDirty) { renderDashboard(); dashboardDirty = false; }
    });
  });
  moreToggle.addEventListener("click", function (e) {
    e.stopPropagation();
    var willOpen = morePanel.hidden;
    morePanel.hidden = !willOpen;
    moreToggle.setAttribute("aria-expanded", String(willOpen));
  });
  document.addEventListener("click", function (e) {
    if (!morePanel.hidden && !e.target.closest(".tabs-more")) closeMorePanel();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !morePanel.hidden) closeMorePanel();
  });
