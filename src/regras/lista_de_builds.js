  // ===== src/regras/lista_de_builds.js =====
  // As 4 mudanças na lista de builds salvas de uma espécie (state.customBuilds[sname],
  // até 3), SEM redesenhar nada: só mexem no state. Em src/ui/nucleo.js cada uma tem o
  // par de mesmo propósito embrulhado em acao() (setOrReplaceActiveBuild, addBuildVariant,
  // removeBuildIndex, abrirVagaPreservando), que grava e redesenha. Separadas no ticket 06
  // da dívida técnica (2026-10-08) para a regra de "o que gravar da resposta da IA"
  // (gravacao_build_ia.js) rodar e ser testada no Node sem a tela. Lógica idêntica à de antes.
  // Colado no <script> principal por scripts/build.mjs (marcador @regras lista_de_builds.js).

  // Troca a build ativa (ou cria, se a lista não está cheia). Cheia e sem ativa: troca a 1ª.
  function trocarBuildAtivaNaLista(sname, build, source) {
    var list = getBuildList(sname).slice();
    var activeIdx = -1;
    for (var i = 0; i < list.length; i++) { if (list[i].active) { activeIdx = i; break; } }
    var entry = entradaDeBuild(build, source, sname, activeIdx !== -1 ? list[activeIdx] : null);
    if (activeIdx !== -1) { list[activeIdx] = entry; }
    else if (list.length < 3) { list.forEach(function (b) { b.active = false; }); list.push(entry); }
    else { list.forEach(function (b, i) { b.active = (i === 0); }); list[0] = entry; }
    state.customBuilds[sname] = list;
    return true;
  }
  // Sempre acrescenta uma variante nova (a nova vira a ativa); recusa a partir de 3.
  function acrescentarVarianteNaLista(sname, build, source) {
    var list = getBuildList(sname).slice();
    if (list.length >= 3) return false;
    list.forEach(function (b) { b.active = false; });
    list.push(entradaDeBuild(build, source, sname, null));
    state.customBuilds[sname] = list;
    return true;
  }
  // Tira a build do índice; sem nenhuma ativa depois, a 1ª vira a ativa.
  function removerBuildDaLista(sname, idx) {
    var list = getBuildList(sname).slice();
    if (idx < 0 || idx >= list.length) return false;
    list.splice(idx, 1);
    if (list.length && !list.some(function (b) { return b.active; })) list[0].active = true;
    if (list.length) state.customBuilds[sname] = list; else delete state.customBuilds[sname];
    return true;
  }
  // Qual build sai para abrir vaga com a lista cheia (3): a mais antiga que não é a ativa
  // nem `preservar` (a de antes de evoluir). `protegerManuais`: build feita à mão pelo
  // jogador nunca sai. Devolve { b, i } ou null (lista com vaga, ou ninguém pode sair).
  function buildQueSaiParaAbrirVaga(sname, preservar, protegerManuais) {
    var lista = getBuildList(sname);
    if (lista.length < 3) return null;
    return lista.map(function (b, i) { return { b: b, i: i }; })
      .filter(function (o) { return o.b !== preservar && !o.b.active && !(protegerManuais && o.b.source === "manual"); })
      .sort(function (x, y) { return String(x.b.savedAt).localeCompare(String(y.b.savedAt)); })[0] || null;
  }
  // Abre a vaga de fato. Devolve a build que saiu (pro registro) ou null.
  function liberarVagaNaLista(sname, preservar, protegerManuais) {
    var velha = buildQueSaiParaAbrirVaga(sname, preservar, protegerManuais);
    if (!velha) return null;
    removerBuildDaLista(sname, velha.i);
    return velha.b;
  }
