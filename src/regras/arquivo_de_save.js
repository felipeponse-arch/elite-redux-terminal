  // ===== src/regras/arquivo_de_save.js =====
  // Exportar/importar o save por arquivo .json (pacote 08, 11/11/2026). Só lógica: a página
  // (botões, download, leitura do arquivo) mora em src/ui/arquivo_de_save.js.
  // Formato: { schema: 1, dataVersion, versaoApp, exportadoEm, save: <o que buildSave() grava, com a soma> }.
  // Importar nunca descarta em silêncio: o que não coube vira linha de aviso (resumoDaImportacao).
  var ARQUIVO_SCHEMA = 1;
  // Campos que este app conhece num save; qualquer outro é ignorado pelo applySave e entra no aviso.
  var CAMPOS_DO_SAVE = ["v", "dataVersion", "savedAt", "team", "box", "savedTeams", "settings", "motorFavoritos", "notes",
    "autoEvolved", "autoLog", "gymSkillsCleared", "customBuilds", "archetype", "soma"];

  function montarArquivoDeSave(versaoApp) {
    var save = buildSave();
    return { schema: ARQUIVO_SCHEMA, dataVersion: save.dataVersion, versaoApp: String(versaoApp || ""), exportadoEm: new Date().toISOString(), save: save };
  }

  function listaDeBuilds(raw) {
    return Array.isArray(raw) ? raw : (raw && typeof raw === "object" ? [raw] : []);
  }
  function totalDeBuilds(customBuilds) {
    if (!customBuilds || typeof customBuilds !== "object") return 0;
    return Object.keys(customBuilds).reduce(function (n, k) { return n + listaDeBuilds(customBuilds[k]).length; }, 0);
  }
  // Contagens do que o arquivo traz (cru, antes do applySave sanear).
  function contarDoSave(save) {
    var tam = function (l) { return Array.isArray(l) ? l.length : 0; };
    return {
      time: tam(save.team), caixa: tam(save.box), builds: totalDeBuilds(save.customBuilds),
      anotacoes: save.notes && typeof save.notes === "object" ? Object.keys(save.notes).length : 0,
      timesSalvos: tam(save.savedTeams)
    };
  }

  // texto -> { ok:true, arquivo } | { ok:false, erro }. Valida formato e soma ANTES de qualquer mudança.
  function lerArquivoDeSave(texto) {
    var arq;
    try { arq = JSON.parse(texto); } catch (e) { return { ok: false, erro: "O arquivo não é um JSON válido (está cortado ou não é um save do app)." }; }
    if (!arq || typeof arq !== "object" || Array.isArray(arq) || typeof arq.schema !== "number") {
      return { ok: false, erro: "Este arquivo não é um save exportado pelo app." };
    }
    if (arq.schema !== ARQUIVO_SCHEMA) {
      return { ok: false, erro: "Formato de arquivo " + arq.schema + " que este app não lê (ele lê o " + ARQUIVO_SCHEMA + "). Atualize o app e tente de novo." };
    }
    if (!arq.save || typeof arq.save !== "object" || Array.isArray(arq.save)) {
      return { ok: false, erro: "O arquivo não traz o save." };
    }
    if (conferirSomaDoSave(arq.save) !== "ok") {
      return { ok: false, erro: "A soma de verificação não bate: o conteúdo mudou depois de exportado. Nada foi trocado." };
    }
    return { ok: true, arquivo: arq };
  }

  // Constrói a cópia do save a importar com as builds do aparelho preservadas: build que o arquivo não
  // tem vira VARIANTE (máx. 3 por espécie, como a regra de variantes); o que não couber é contado.
  function mesclarBuildsDoAtual(importado, atuais) {
    var chave = function (b) { return JSON.stringify([b.ability || "", b.nature || "", b.item || "", b.moves || [], b.ivs || null, b.evs || null]); };
    var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
    var save = clone(importado);
    var cb = save.customBuilds && typeof save.customBuilds === "object" && !Array.isArray(save.customBuilds) ? save.customBuilds : {};
    var preservadas = 0, naoCouberam = 0;
    Object.keys(atuais || {}).forEach(function (sn) {
      var lista = listaDeBuilds(cb[sn]).filter(function (b) { return b && typeof b === "object"; });
      var jaTem = lista.map(chave);
      listaDeBuilds(atuais[sn]).forEach(function (b) {
        if (jaTem.indexOf(chave(b)) !== -1) return;
        if (lista.length >= 3) { naoCouberam++; return; }
        var c = clone(b); c.active = false;
        lista.push(c); jaTem.push(chave(b)); preservadas++;
      });
      if (lista.length) cb[sn] = lista;
    });
    save.customBuilds = cb;
    return { save: save, preservadas: preservadas, naoCouberam: naoCouberam };
  }

  // Linhas do aviso (depois do applySave): o que foi mantido e o que foi ignorado, com números.
  function resumoDaImportacao(arq, mescla) {
    var cru = contarDoSave(mescla.save);
    var linhas = [];
    var desconhecidos = [];
    ["team", "box", "motorFavoritos"].forEach(function (c) {
      (Array.isArray(arq.save[c]) ? arq.save[c] : []).forEach(function (sn) {
        if (typeof sn === "string" && !SPECIES_BY_SNAME[sn] && desconhecidos.indexOf(sn) === -1) desconhecidos.push(sn);
      });
    });
    linhas.push("Mantido: " + (state.team.length + state.orphans.team.length) + " no time, " + (state.box.length + state.orphans.box.length) +
      " na caixa, " + totalDeBuilds(state.customBuilds) + " builds, " + Object.keys(state.notes).length + " anotações.");
    var meus = DATA.meta ? DATA.meta.version : null;
    if (arq.dataVersion !== meus) {
      linhas.push("Dados do arquivo: " + (arq.dataVersion || "?") + "; deste app: " + (meus || "?") + ".");
    }
    if (desconhecidos.length) {
      linhas.push(desconhecidos.length + " Pokémon que esta versão dos dados não conhece ficaram guardados e voltam quando o app os conhecer: " + desconhecidos.join(", ") + ".");
    }
    var ignBuilds = cru.builds - totalDeBuilds(state.customBuilds);
    if (ignBuilds > 0) linhas.push("Ignoradas: " + ignBuilds + " builds do arquivo (vazias, inválidas ou acima de 3 por espécie).");
    var ignNotas = cru.anotacoes - Object.keys(state.notes).length;
    if (ignNotas > 0) linhas.push("Ignoradas: " + ignNotas + " anotações vazias ou inválidas.");
    var ignTimes = cru.timesSalvos - state.savedTeams.length;
    if (ignTimes > 0) linhas.push("Ignorados: " + ignTimes + " times salvos (inválidos ou além de 3).");
    var extras = Object.keys(arq.save).filter(function (k) { return CAMPOS_DO_SAVE.indexOf(k) === -1; });
    if (extras.length) linhas.push("Campos que este app não conhece foram ignorados: " + extras.join(", ") + ".");
    if (mescla.preservadas) linhas.push(mescla.preservadas + " builds suas deste aparelho viraram variantes (não foram apagadas).");
    if (mescla.naoCouberam) linhas.push(mescla.naoCouberam + " builds suas não couberam (limite de 3 por espécie): estão no backup, em \"Desfazer importação\".");
    return linhas;
  }
