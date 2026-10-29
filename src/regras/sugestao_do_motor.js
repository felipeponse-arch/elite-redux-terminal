  // ===== src/regras/sugestao_do_motor.js =====
  // "Ficar com este time" do Meu Time (ticket time-pelo-motor/01, F5, 21/10/2026): além de trocar o time, grava as builds do
  // time montado como build ATIVA de cada Pokémon, com a origem nova "sugestao" (na tela: "Sugestão do app").
  // Só lógica, no state (a tela embrulha em acao() para gravar e redesenhar). Regras de conflito, as mesmas do app (curada, IA):
  //  - build do jogador (manual ou IA) NUNCA é apagada nem trocada: a sugestão entra como VARIANTE (a lista guarda até 3);
  //  - lista cheia: só sai a mais antiga que não é a ativa nem manual (liberarVagaNaLista); sem quem saia = "sem-vaga", não grava;
  //  - já existe uma "Sugestão do app" do mesmo Pokémon: ela é trocada, a lista não cresce;
  //  - build idêntica já guardada: só vira a ativa (não duplica);
  //  - quem já tem build própria ATIVA e a sugestão passaria por cima dela: a tela pede confirmação (campo `confirmar`).
  // Build que o Motor tirou da build salva do jogador (origem "build-salva") não é regravada: já é dele.
  var SUGESTAO_ROTULO = "Sugestão do app";

  function sugestaoDoMembro(m) {
    var b = m.build || {};
    return {
      ability: b.ability || "", nature: b.nature || "", item: b.item || "", moves: (b.moves || []).slice(0, 4),
      ivs: Array.isArray(b.ivs) && b.ivs.length === 6 ? b.ivs.slice() : [31, 31, 31, 31, 31, 31],
      evs: Array.isArray(b.evs) && b.evs.length === 6 ? b.evs.slice() : [0, 0, 0, 0, 0, 0],
      rationale: SUGESTAO_ROTULO + " (simulador de duelo do app, sem IA).",
      // Sem isto a build nova pediria o plano de golpes à IA em segundo plano (revisão automática): o Motor nunca consulta a IA.
      planoConsultado: true
    };
  }
  function sugestaoMesmaBuild(entrada, b) {
    return entrada.ability === b.ability && entrada.nature === b.nature && (entrada.item || "") === (b.item || "") &&
      (entrada.moves || []).slice().sort().join("|") === b.moves.slice().sort().join("|") && (entrada.evs || []).join(",") === b.evs.join(",");
  }
  function ehBuildDoJogador(b) { return !!b && (b.source === "manual" || b.source === "ia"); }

  // Lista cheia (3): só sai build do app (curada ou sugestão antiga) que não é a ativa, a mais antiga. Manual e IA (as do jogador) nunca saem.
  function indiceQueSaiParaSugestao(lista) {
    var c = lista.map(function (e, i) { return { e: e, i: i }; }).filter(function (o) { return !o.e.active && !ehBuildDoJogador(o.e); })
      .sort(function (x, y) { return String(x.e.savedAt).localeCompare(String(y.e.savedAt)); })[0];
    return c ? c.i : -1;
  }

  // O que acontecerá com cada Pokémon do time montado. Não muda nada.
  // acao: "nova" | "ja-igual" | "trocar" (a sugestão antiga) | "variante" | "sem-vaga".
  function planoDeGravarSugestoes(membros) {
    return membros.filter(function (m) { return m.origem !== "build-salva"; }).map(function (m) {
      var build = sugestaoDoMembro(m), lista = getBuildList(m.sname), ativa = getActiveBuild(m.sname), acao, indice = -1;
      var igual = lista.map(function (e, i) { return sugestaoMesmaBuild(e, build) ? i : -1; }).filter(function (i) { return i >= 0; })[0];
      if (igual !== undefined) { acao = "ja-igual"; indice = igual; }
      else if (!lista.length) acao = "nova";
      else {
        var antiga = lista.map(function (e, i) { return e.source === "sugestao" ? i : -1; }).filter(function (i) { return i >= 0; });
        if (antiga.length) {
          var ativas = antiga.filter(function (i) { return lista[i].active; });
          acao = "trocar"; indice = ativas.length ? ativas[0] : antiga[0];
        }
        else if (lista.length < 3 || indiceQueSaiParaSugestao(lista) !== -1) acao = "variante";
        else acao = "sem-vaga";
      }
      var jaAtiva = indice >= 0 && lista[indice] === ativa;
      return { sname: m.sname, nome: m.nome, build: build, acao: acao, indice: indice,
        confirmar: ehBuildDoJogador(ativa) && acao !== "sem-vaga" && !jaAtiva };
    });
  }

  // Grava o plano (recalculado agora, porque o estado pode ter mudado entre o clique e a confirmação). Devolve { gravadas, semVaga: [nomes] }.
  function gravarSugestoesDoMotor(membros) {
    var gravadas = 0, semVaga = [];
    planoDeGravarSugestoes(membros).forEach(function (p) {
      var lista = getBuildList(p.sname).slice();
      if (p.acao === "sem-vaga") { semVaga.push(p.nome); return; }
      if (p.acao === "ja-igual") { lista.forEach(function (e, i) { e.active = (i === p.indice); }); state.customBuilds[p.sname] = lista; gravadas++; return; }
      if (p.acao === "trocar") {
        var nova = entradaDeBuild(p.build, "sugestao", p.sname, lista[p.indice]);
        lista.forEach(function (e) { e.active = false; });
        lista[p.indice] = nova;
        state.customBuilds[p.sname] = lista; gravadas++; return;
      }
      if (lista.length >= 3) removerBuildDaLista(p.sname, indiceQueSaiParaSugestao(lista));
      if (acrescentarVarianteNaLista(p.sname, p.build, "sugestao")) gravadas++; else semVaga.push(p.nome);
    });
    return { gravadas: gravadas, semVaga: semVaga };
  }
