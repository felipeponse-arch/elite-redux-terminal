  // ===== src/ui/abas.js =====
  // Navegação entre abas (e o redesenho da aba que abre).
  // Interface: lê e desenha a página. Colado no <script> principal por
  // scripts/build.mjs (marcador @ui abas.js) no MESMO lugar de onde saiu do
  // template (fase 5 da refatoração, 2026-09-24) - a ordem de execução não mudou.

  // ---------------- tabs ----------------
  var moreToggle = document.getElementById("tabs-more-toggle");
  var morePanel = document.getElementById("tabs-more-panel");
  var MORE_TABS = ["progress", "types"];
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
      moreToggle.classList.toggle("active", MORE_TABS.indexOf(btn.dataset.tab) !== -1);
      closeMorePanel();
      if (btn.dataset.tab === "team") renderTeam();
      if (btn.dataset.tab === "box") renderBox();
      if (btn.dataset.tab === "bosses") {
        initBosses();
        if (chefaoDesatualizado && bossState.selected !== null) { renderBossDetail(); chefaoDesatualizado = false; }
      }
      if (btn.dataset.tab === "progress") initProgress();
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
