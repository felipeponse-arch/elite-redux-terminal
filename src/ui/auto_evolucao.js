  // ===== src/ui/auto_evolucao.js =====
  // Registro "O que o app fez sozinho" na tela e a auto-evolução do time/caixa pelo level cap.
  // Interface: lê e desenha a página. Colado no <script> principal por
  // scripts/build.mjs (marcador @ui auto_evolucao.js) no MESMO lugar de onde saiu do
  // template (fase 5 da refatoração, 2026-09-24) - a ordem de execução não mudou.

  // ---------------- level cap & auto-evolution ----------------

  function renderAutoLog() {
    var out = document.getElementById("auto-log-list");
    if (!out) return;
    if (!state.autoLog.length) { out.innerHTML = '<li class="hint" style="margin:0;">Nada até agora.</li>'; return; }
    out.innerHTML = state.autoLog.map(function (e) {
      var d = new Date(e.at);
      var quando = isNaN(d.getTime()) ? "" : d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
      return '<li><time datetime="' + escapeHtml(e.at) + '">' + escapeHtml(quando) + '</time>' + escapeHtml(e.text) + '</li>';
    }).join("");
  }

  function autoEvolveRoster(announce) {
    var cap = getCurrentCap();
    if (cap === null || cap === undefined) return false;
    var messages = [];
    var step = function (x) { return evolveChainByX(devolveChainByX(x, cap, messages), cap, messages); };
    var newTeam = state.team.map(step);
    var newBox = state.box.map(step);
    if (!messages.length) return false;
    state.team = newTeam;
    state.box = newBox;
    logAutoAction(messages.join("; ") + " (level cap " + cap + ")");
    renderAutoLog();
    if (announce) flashToast(messages.join("; ") + " (level cap " + cap + ")");
    return true;
  }
