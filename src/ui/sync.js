  // ===== src/ui/sync.js =====
  // Sincronização entre aparelhos (capability db) e os avisos de sync.
  // Interface: lê e desenha a página. Colado no <script> principal por
  // scripts/build.mjs (marcador @ui sync.js) no MESMO lugar de onde saiu do
  // template (fase 5 da refatoração, 2026-09-24) - a ordem de execução não mudou.

  // ---------------- cross-device sync (db capability) ----------------
  // 2026-09-09, user asked for automatic sync between PC and phone instead
  // of the manual copy/paste or file-download transfer card - confirmed
  // working on real devices the same day, so that card (and the
  // now-unused `downloads` capability it was the only user of) was
  // removed right after, same day, to keep the page lighter. One SHARED
  // document (not the `user` capability's per-viewer data/users/ subtree)
  // is deliberate: this artifact is private/unshared (sharing: owner), so
  // only the owner can ever open it regardless of who else is technically
  // in the org - a plain shared doc is simpler than per-viewer scoping for
  // a single-person tool, and avoids depending on a capability this
  // control plane doesn't list as declarable.
  // Never blocks first paint (see artifact-capabilities guidance): this
  // runs AFTER the synchronous loadSave() above already rendered from
  // localStorage, entirely in the background. A newer save found elsewhere
  // is written to localStorage immediately but NOT live-patched into the
  // already-rendered UI (surgically re-rendering every view correctly is
  // real risk for real benefit here) - instead a dismissible banner offers
  // a reload, so a build the user is mid-editing is never silently
  // overwritten by a remote change arriving in the background.
  // UPDATE 2026-09-09, same day: the banner was showing up "toda hora" even
  // with nothing actually changed anywhere (user report). Root cause: this
  // compared `savedAt` timestamps, but `savedAt` ticks forward on every
  // persist() call - including a call that re-saves byte-identical content
  // (e.g. this same reconciliation code unconditionally re-pushing local
  // up on every single page load, even when local already matched remote
  // exactly). A changed TIMESTAMP isn't the same thing as changed DATA.
  // Switched to comparing the actual save CONTENT (team/box/savedTeams/
  // settings/notes/customBuilds), ignoring savedAt/dataVersion entirely -
  // the banner (and any store write at all) now only fires when something
  // real actually differs.
  var syncRef = null;
  // (O que conta como "mudou" no sync: syncContentDiffers, src/regras/save.js.)
  // Save vindo de outro aparelho. Se a conferência das builds (applySave ->
  // reconciliarBuildsSalvas) precisou ajustar algo, grava o ajuste e devolve pro
  // sync - antes o ajuste ficava só na memória e sumia na próxima leitura
  // (defeito c da revisão da v136). O outro aparelho recebe já ajustado e a
  // conferência dele não muda mais nada, então não há vai-e-volta.
  function aplicarSaveRemoto(remote) {
    applySave(remote);
    lsSet(STORE_KEY, JSON.stringify(remote));
    // O marco pode ter mudado no outro aparelho: a referência das trocas do plano
    // (registrarTrocasDoPlano) passa a ser o cap que chegou.
    capRegistrado = getCurrentCap();
    if (reconciliouAoAplicar) {
      reconciliouAoAplicar = false;
      persist();
    }
  }
  // Save de outro aparelho com a soma de verificação errada (save.js): não é
  // aplicado. O save local, que confere, sobe por cima e conserta a cópia do
  // banco - como a memória com redundância, que recupera a palavra pela cópia
  // boa. Sem save local, só avisa.
  function remotoComSomaErrada(remote, local) {
    if (conferirSomaDoSave(remote) !== "errada") return false;
    if (local) syncRef.set(local).catch(function () {});
    showStorageBanner("O save que veio de outro aparelho não bate com a soma de verificação e foi ignorado. " +
      "O save deste aparelho continua valendo" + (local ? " e foi enviado no lugar dele." : "."));
    return true;
  }
  function pushToSync(save) {
    if (!syncRef) return;
    // persist() only ever runs from a genuine content-changing action (every
    // call site checked directly - all gated behind a click/change event,
    // none on mere navigation/render), so every push here is real; no need
    // to content-diff before writing, unlike the read side below where an
    // incoming write's REASON isn't known and has to be checked.
    syncRef.set(save).catch(function () { /* offline/transient - localStorage already has it; the next persist() retries */ });
  }
  function showSyncBanner(text) {
    document.getElementById("sync-banner-text").textContent = text;
    document.getElementById("sync-banner").hidden = false;
  }
  // Compensa o espaco que os banners fixos (.sync-banner - run-setup/sync/
  // storage) tomam no topo da tela - achado real de auditoria, 2026-09-23:
  // nenhum deles empurra o conteudo abaixo (position:fixed), entao o
  // .topbar (nome/logo do app) fica escondido atras do banner sempre que
  // ele aparece, inclusive em TODO save novo (o banner de confirmacao de
  // run comeca visivel por padrao ali). Um observer so (nao um call site em
  // cada um dos 6 lugares que mostram/escondem algum dos 3 banners - mesmo
  // principio de "um lugar so decide" ja usado no resto do app) reage a
  // qualquer toggle e a mudanca de largura (a altura do banner varia
  // conforme o texto quebra linha em tela estreita).
  function syncBannerOffset() {
    var banners = document.querySelectorAll(".sync-banner");
    var altura = 0;
    for (var i = 0; i < banners.length; i++) {
      if (!banners[i].hidden) altura = Math.max(altura, banners[i].offsetHeight);
    }
    document.documentElement.style.setProperty("--banner-offset", altura + "px");
  }
  document.querySelectorAll(".sync-banner").forEach(function (b) {
    new MutationObserver(syncBannerOffset).observe(b, { attributes: true, attributeFilter: ["hidden"] });
  });
  window.addEventListener("resize", debounce(syncBannerOffset, 100));
  // Indicador de status de sincronização (achado real do usuário,
  // 2026-09-13: dois aparelhos com times diferentes, e nada na tela avisava
  // que um deles nem estava sincronizando de verdade - violava RNF03
  // ("degradação graciosa... nunca falhar silenciosamente"), que já valia
  // pra geração por IA mas nunca foi aplicado a este outro capability).
  // O subtítulo do cabeçalho fica numa linha só, cortado com "…" quando não
  // cabe (opção A, 2026-09-24) - o texto inteiro vai no title, pra ler ao
  // passar o mouse. Chamada sempre que o texto dele muda.
  function atualizarTituloDoSubtitulo() {
    var sub = document.querySelector(".brand-sub");
    if (sub) sub.title = sub.textContent.replace(/\s+/g, " ").trim();
  }
  function setSyncStatusIndicator(text, warn) {
    var el = document.getElementById("sync-status-indicator");
    if (!el) return;
    el.textContent = text;
    atualizarTituloDoSubtitulo();
    el.style.color = warn ? "var(--sem-weak)" : "";
  }
  setSyncStatusIndicator("sincronização: verificando...");
  // Reconexão automática (achado real do usuário, 2026-09-13: viu "conexão
  // de sincronização perdida" na tela e perguntou o que significava - o
  // indicador já avisava certo, mas depois de avisar não fazia mais nada, o
  // jogador tinha que lembrar de recarregar a página na mão toda vez que uma
  // queda transitória de rede (comum em celular) derrubasse o listener ao
  // vivo). Backoff exponencial (5s, 7.5s, 11s... até 30s), até 8 tentativas -
  // depois disso, desiste e pede reload explícito em vez de tentar pra
  // sempre numa aba esquecida em segundo plano.
  var syncRetryCount = 0;
  var syncRetryTimer = null;
  function scheduleSyncRetry() {
    if (syncRetryCount >= 8) {
      setSyncStatusIndicator("só neste aparelho (não foi possível reconectar - recarregue a página)", true);
      return;
    }
    syncRetryCount++;
    var delay = Math.min(5000 * Math.pow(1.5, syncRetryCount - 1), 30000);
    setSyncStatusIndicator("reconectando sincronização...", true);
    if (syncRetryTimer) clearTimeout(syncRetryTimer);
    syncRetryTimer = setTimeout(connectSync, delay);
  }
  async function connectSync() {
    if (typeof claude === "undefined" || !claude.use) { setSyncStatusIndicator("só neste aparelho (ambiente sem plataforma)", true); return; }
    var db = await claude.use("db");
    if (!db) { setSyncStatusIndicator("só neste aparelho (sincronização não concedida)", true); return; } // not served/granted/loaded in this view
    syncRef = db.doc("sync/save");
    syncRetryCount = 0; // conexão real de novo - zera o backoff pra próxima queda
    setSyncStatusIndicator("sincronizado entre aparelhos");
    try {
      var snap = await syncRef.get();
      if (snap.exists) {
        var remote = snap.data();
        var localRaw = lsGet(STORE_KEY);
        var local = localRaw ? JSON.parse(localRaw) : null;
        if (syncContentDiffers(local, remote) && !remotoComSomaErrada(remote, local)) {
          if (!local || (remote.savedAt && (!local.savedAt || remote.savedAt > local.savedAt))) {
            // Remote has real differences and is the newer (or only) copy.
            // Bug real, achado em auditoria (2026-09-11): isto só gravava o
            // remoto no localStorage, nunca atualizava `state` em memória -
            // qualquer persist() disparado por uma ação normal do jogador
            // ANTES de clicar "recarregar" (buildSave() lê só de `state.*`)
            // regravava o valor antigo por cima do remoto recém-chegado, e
            // ainda empurrava esse dado desatualizado de volta pro banco,
            // revertendo silenciosamente a mudança do outro aparelho.
            // applySave() corrige o `state` imediatamente - o banner/reload
            // continua existindo pra atualizar a TELA, mas persist() agora
            // nunca mais sobrescreve o remoto com dado velho enquanto isso
            // não acontece.
            aplicarSaveRemoto(remote);
            showSyncBanner("Encontramos um save mais novo de outro aparelho.");
          } else {
            // Local has real differences and isn't older - push it up.
            syncRef.set(local).catch(function () {});
          }
        }
        // else: content already matches - nothing to write, nothing to show.
      } else {
        var localRaw2 = lsGet(STORE_KEY);
        var seed = localRaw2 ? JSON.parse(localRaw2) : buildSave();
        syncRef.set(seed).catch(function () {});
      }
    } catch (e) { /* get() failed - stay local-only for this load; persist() keeps trying to push */ }

    syncRef.onSnapshot(function (snap) {
      if (!snap.exists || snap.metadata.hasPendingWrites) return;
      var remote = snap.data();
      var localRaw3 = lsGet(STORE_KEY);
      var local3 = null;
      try { local3 = localRaw3 ? JSON.parse(localRaw3) : null; } catch (e) {
        // Achado em auditoria (2026-09-13): ao contrário das outras 2 leituras
        // deste mesmo fluxo (get() inicial e o "sem save local" acima), esta
        // não tinha try/catch - um localStorage corrompido faria o remoto
        // legítimo ser perdido em silêncio (exceção não tratada dentro do
        // callback do onSnapshot). local3 = null cai no mesmo caminho já
        // existente pra "sem local válido" logo abaixo - aplica o remoto.
      }
      if (!syncContentDiffers(local3, remote)) return;
      if (remotoComSomaErrada(remote, local3)) return;
      // Achado real, 2026-09-13 (usuário reportou times divergentes entre
      // celular e navegador): ao contrário da reconciliação de carga inicial
      // acima (que só aceita o remoto quando ele é MAIS NOVO por savedAt),
      // este handler aceitava QUALQUER remoto diferente, sem checar data -
      // dois aparelhos editando quase ao mesmo tempo podiam fazer um deles
      // receber de volta um remoto MAIS VELHO que o que ele próprio acabou
      // de escrever (a escrita do outro aparelho chegando por último no
      // servidor, sem relação com qual edição é realmente mais recente).
      // Mesmo critério de "quem é mais novo" agora nos dois lugares.
      if (local3 && local3.savedAt && remote.savedAt && remote.savedAt <= local3.savedAt) {
        syncRef.set(local3).catch(function () {});
        return;
      }
      aplicarSaveRemoto(remote);
      showSyncBanner("Seu time foi atualizado em outro aparelho agora.");
    }, function () {
      syncRef = null;
      setSyncStatusIndicator("só neste aparelho (conexão de sincronização perdida)", true);
      scheduleSyncRetry();
    });
  }
  connectSync();
  document.getElementById("sync-banner-reload").addEventListener("click", function () { location.reload(); });
  document.getElementById("sync-banner-dismiss").addEventListener("click", function () {
    document.getElementById("sync-banner").hidden = true;
  });
  document.getElementById("storage-banner-dismiss").addEventListener("click", function () {
    document.getElementById("storage-banner").hidden = true;
  });
