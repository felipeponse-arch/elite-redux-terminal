  // ===== src/ui/arquivo_de_save.js =====
  // Card "Save em arquivo" da aba Progresso (pacote 08): Baixar save, Carregar save e Desfazer importação.
  // A lógica (formato, validação, aviso) mora em src/regras/arquivo_de_save.js.
  // Importar valida formato e soma ANTES de mexer, pede confirmação e guarda o save atual como backup
  // (chave própria do localStorage) para o "Desfazer importação".
  var BACKUP_IMPORTACAO_KEY = STORE_KEY + "_antes_da_importacao";
  (function arquivoDeSaveUi() {
    var statusEl = document.getElementById("save-arquivo-status");
    var btnDesfazer = document.getElementById("save-desfazer-btn");
    var entrada = document.getElementById("save-importar-input");

    function mostrar(linhas, erro) {
      statusEl.innerHTML = "";
      linhas.forEach(function (t) {
        var li = document.createElement("li");
        li.textContent = t;
        if (erro) li.className = "erro";
        statusEl.appendChild(li);
      });
    }
    function atualizarDesfazer() { btnDesfazer.hidden = !lsGet(BACKUP_IMPORTACAO_KEY); }
    atualizarDesfazer();

    // Os <select> da aba Progresso só leem o state quando abrem: depois de trocar o state por fora, acerta-os.
    function acertarAjustes() {
      var par = { "settings-difficulty": state.settings.difficulty, "settings-level-cap": levelCapMode(),
        "settings-mega-mode": state.settings.megaMode, "settings-milestone": String(state.settings.milestone) };
      Object.keys(par).forEach(function (id) { var el = document.getElementById(id); if (el) el.value = par[id]; });
    }
    function aplicarNoApp(save) {
      acao(TELAS_ORDEM.slice(), function () {
        applySave(save);
        capRegistrado = getCurrentCap();
        teamRecommendation = null; generatedTeamResult = null; teamSwapIdx = null; pcBoxSelectedX = null;
      });
      acertarAjustes();
    }

    document.getElementById("save-exportar-btn").addEventListener("click", function () {
      var versao = (document.getElementById("app-version") || {}).textContent || "";
      var texto = JSON.stringify(montarArquivoDeSave(versao), null, 2);
      var url = URL.createObjectURL(new Blob([texto], { type: "application/json" }));
      var a = document.createElement("a");
      a.href = url;
      a.download = "er-terminal-save-" + new Date().toISOString().slice(0, 10) + ".json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      mostrar(["Save baixado: " + a.download + "."]);
    });

    document.getElementById("save-importar-btn").addEventListener("click", function () { entrada.click(); });
    entrada.addEventListener("change", function () {
      var arquivo = entrada.files && entrada.files[0];
      if (!arquivo) return;
      var leitor = new FileReader();
      leitor.onerror = function () { mostrar(["Não consegui ler o arquivo."], true); };
      leitor.onload = function () {
        var lido = lerArquivoDeSave(String(leitor.result));
        if (!lido.ok) { mostrar([lido.erro], true); return; }
        var c = contarDoSave(lido.arquivo.save);
        openConfirmModal(
          "Substituir o save atual?",
          "O arquivo traz " + c.time + " no time, " + c.caixa + " na caixa, " + c.builds + " builds e " + c.anotacoes + " anotações" +
            (lido.arquivo.exportadoEm ? " (exportado em " + String(lido.arquivo.exportadoEm).slice(0, 10) + ")" : "") + ". " +
            "O save atual é guardado e dá para voltar em \"Desfazer importação\". Builds suas que o arquivo não tem viram variantes.",
          "Carregar save",
          function () { importar(lido.arquivo); }
        );
      };
      leitor.readAsText(arquivo);
      entrada.value = ""; // permite escolher o mesmo arquivo de novo
    });

    function importar(arq) {
      // Backup primeiro: se não der para guardar o save atual, não troca nada.
      if (!lsSet(BACKUP_IMPORTACAO_KEY, JSON.stringify(buildSave()))) {
        mostrar(["Não deu para guardar o backup (armazenamento cheio?). Nada foi trocado."], true);
        return;
      }
      var mescla = mesclarBuildsDoAtual(arq.save, state.customBuilds);
      aplicarNoApp(mescla.save);
      mostrar(["Save carregado."].concat(resumoDaImportacao(arq, mescla)));
      atualizarDesfazer();
      flashToast("Save carregado. Dá para desfazer na aba Progresso.");
    }

    btnDesfazer.addEventListener("click", function () {
      var antigo = null;
      try { antigo = JSON.parse(lsGet(BACKUP_IMPORTACAO_KEY)); } catch (e) { antigo = null; }
      if (!antigo || typeof antigo !== "object") { mostrar(["O backup não pôde ser lido; nada foi trocado."], true); return; }
      openConfirmModal(
        "Desfazer a importação?",
        "Volta o save que você tinha antes de carregar o arquivo (time, caixa, builds, anotações). O que mudou depois da importação se perde.",
        "Desfazer",
        function () {
          aplicarNoApp(antigo);
          try { localStorage.removeItem(BACKUP_IMPORTACAO_KEY); } catch (e) { /* sem armazenamento: o botão some no próximo carregamento */ }
          atualizarDesfazer();
          mostrar(["Importação desfeita: o save de antes voltou."]);
        }
      );
    });
  })();
