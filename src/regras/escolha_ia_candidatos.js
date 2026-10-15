  // ===== src/regras/escolha_ia_candidatos.js =====
  // A IA ESCOLHE ENTRE os candidatos do pipeline de build (passo 4 de docs/pipeline_de_build.md; ticket 03 de
  // docs/tickets/pipeline-build-2026-10-14/). Sem tela e sem chamada à IA: só (a) o texto do prompt, bem menor que o da build
  // do zero, e (b) a conferência da resposta. Quem faz o pedido é src/ui/ia.js (pedirIA).
  // Regra de ouro: a IA nunca inventa build fora dos candidatos. Ela devolve o número do candidato + natureza, item e EVs; habilidade
  // e golpes vêm SEMPRE do candidato (que o motor simulou e `validateAiBuild` aceitou). Se a resposta sai dos candidatos, ou
  // não passa em fecharBuild/validação, cai no melhor candidato do motor, SEM outra chamada.
  // Testes: tests/unit/escolha_ia_candidatos.test.mjs. Escopo global, ES5, sem window/document (ADR-004).

  var ORIGEM_ESCOLHA_IA = "ia";               // escolha e ajustes da IA, tudo conferido
  var ORIGEM_ESCOLHA_IA_RASCUNHO = "ia-escolha"; // o candidato é o que a IA escolheu; natureza, item e EVs são os do rascunho do motor
  var MOTIVO_SEM_RESPOSTA = "a IA nao respondeu";
  var ORIGEM_ESCOLHA_MOTOR = "motor";         // a resposta da IA não valeu: melhor candidato do motor
  // Chave geral (a suíte de navegador desliga para testar o caminho antigo; também reverte o recurso numa linha).
  var escolhaEntreCandidatosLigada = true;
  var MAX_CANDIDATOS_NO_PROMPT = 5;
  var MAX_MOTIVOS_NO_PROMPT = 3;

  // Texto de uma linha de candidato. Tudo que vem de dado passa por dadoExterno (nunca instrução).
  function textoDeCandidatoParaIA(c, i) {
    var q = c.hitKill === 1 ? "derruba em 1 golpe" : c.hitKill === 2 ? "derruba em 2 golpes" : "nao derruba o alvo";
    var vez = c.baterPrimeiro ? ", bate primeiro" + (c.porQue === "prioridade" ? " (prioridade)" : c.porQue === "velocidade" ? " (velocidade)" : "") : "";
    var b = c.build || {};
    return (i + 1) + ") habilidade " + dadoExterno(c.habilidade) +
      (c.inatas && c.inatas.length ? " | inatas " + c.inatas.map(dadoExterno).join(", ") : "") +
      " | golpes " + c.golpes.map(dadoExterno).join(", ") +
      " | " + q + vez + " (dano " + c.dano.min + "-" + c.dano.max + "%)" +
      (c.rotulo === "estimada" ? " [estimado]" : "") +
      (c.motivos && c.motivos.length ? " | " + c.motivos.slice(0, MAX_MOTIVOS_NO_PROMPT).map(function (m) { return dadoExterno(m).slice(0, 200); }).join(" ; ") : "") +
      (c.avisos && c.avisos.length ? " | AVISO: " + c.avisos.map(function (m) { return dadoExterno(m).slice(0, 200); }).join(" ; ") : "") +
      " | rascunho do motor: " + dadoExterno(b.nature) + ", EVs " + (b.evs || []).join("/") + ", " + (b.item ? dadoExterno(b.item) : "sem item");
  }
  function blocoDeCandidatosParaIA(sp, r) {
    var lista = r.candidatos.slice(0, MAX_CANDIDATOS_NO_PROMPT);
    return "Tipo: " + speciesTypeNames(sp).join("/") + " | status base (HP/Atk/Def/SpA/SpD/Spe): " + sp.b.join("/") + "\n" +
      "CANDIDATOS (do melhor para o pior, " + (r.alvo ? "calculados pelo app contra " + dadoExterno((r.alvo.pokemon || []).join(" e ")) : "so por sinergia: nao ha chefao adiante e nada foi simulado") + "):\n" +
      "<dados_do_jogo>\n" + lista.map(function (c, i) { return textoDeCandidatoParaIA(c, i); }).join("\n") + "\n</dados_do_jogo>\n";
  }
  var FORMATO_ESCOLHA_IA = '{"escolha":N,"nature":"Nome","item":"Nome","evs":[hp,atk,def,spa,spd,spe],"rationale":"texto"}';
  function regrasDaEscolhaIA() {
    return "REGRAS: escolha UM candidato pelo numero (escolha) - habilidade e golpes sao os dele, nao escreva outros. Voce so decide natureza (real: Adamant, Modest, Jolly, Timid etc.), " +
      "item (UM dos listados, ou \"\" para nenhum) e EVs (6 inteiros de 0 a 252, soma ate 510). Prefira quem derruba o alvo e bate primeiro; use o rascunho do motor como base e mude so com motivo. " +
      "rationale: 1-2 frases em portugues dizendo por que este candidato e esta natureza/item/EVs (cite o alvo). ";
  }
  // Contexto CURTO do time (item 4 da rodada 1 do supervisor): o essencial de blocoTimeEmUsoIA/blocoPapelIA sem os parágrafos.
  var GUIA_DE_PAPEL_CURTO = "Papel guia natureza e EVs: Tanque = HP e defesa, pouca Spe; Pivo = bulk + Spe moderada; Wallbreaker = 252 no ataque; Sweeper = 252 ataque + 252 Spe (natureza que nao reduz Spe).";
  function linhaDePapelNaturalIA(sp) {
    var n = SPECIES_ROLE[sp.sname];
    return n && n.roles && n.roles.length ? "Papel natural: " + n.roles.map(nomePapel).join(" / ") + ", ataque " + (n.split || "?") + ".\n" : "";
  }
  function linhaDeFraquezasDoTimeIA(membros) {
    var riscos = membros.length ? computeSharedRisks(membros) : [];
    return riscos.length ? "Fraquezas que o time divide: " + riscos.map(function (r) { return r.t + " (" + r.n + ")"; }).join(", ") + " - resistir/cobrir isso vale mais.\n" : "";
  }
  function blocoTimeCurtoIA(sp) {
    var itens = itensEmUsoComQuem(sp.x), nomes = Object.keys(itens);
    var esg = nomes.filter(function (i) { return itens[i].length >= MAX_MESMO_ITEM_NO_TIME; });
    var golpes = teamMovesInUse(sp.x), papeis = teamRolesInUse(sp.x);
    var membros = state.team.map(getSpeciesByX).filter(function (m) { return m && m.x !== sp.x; });
    return linhaDePapelNaturalIA(sp) +
      (nomes.length ? "Itens em uso no time: " + nomes.map(function (i) { return dadoExterno(i) + " (" + itens[i].map(dadoExterno).join(", ") + ")"; }).join("; ") + "." +
        (esg.length ? " ESGOTADOS (qualquer outro igual e REJEITADO): " + esg.map(dadoExterno).join(", ") + "." : "") + "\n" : "") +
      (golpes.length ? "Golpes ja no time (evite repetir sem motivo): " + golpes.join(", ") + ".\n" : "") +
      (papeis.length ? "Papeis ja cobertos: " + papeis.map(nomePapel).join(", ") + ".\n" : "") +
      linhaDeFraquezasDoTimeIA(membros);
  }
  // O que o chefão pede a ESTE Pokémon (quem ele responde e o golpe-chave que o simulador provou).
  function linhaDoChefaoPorEspecieIA(sp, resp, provado) {
    return (resp && resp.length ? "Este Pokemon responde a: " + resp.map(dadoExterno).join(", ") + ".\n" : "") + (provado ? linhaProvadoIA(provado) + "\n" : "");
  }
  // Plano de trocas (item 3): compacto e SÓ para a espécie que tem golpe futuro relevante (de dano ou pivô).
  function blocoPlanoCurtoIA(sp) {
    var futuros = golpesFuturosDe(sp, getCurrentCap()).filter(function (f) { var p = moveRoleOf(f.nome); return p === "dano" || p === "pivo"; }).slice(0, 6);
    if (!futuros.length) return "";
    return "PLANO (opcional) - golpes que so liberam depois: " + futuros.map(function (f) {
      var mv = MOVES[f.id];
      return "nivel " + f.nivel + " " + dadoExterno(f.nome) + " [" + (TYPES[mv[1]] || "?") + " " + (SIGLA_CATEGORIA[DATA.splits[mv[2]]] || "") + (mv[3] ? " " + mv[3] : "") + "]";
    }).join("; ") + ". Se um deles for claramente melhor que um golpe do candidato PARA O MESMO PAPEL, aponte em \"plano\" {\"golpe de agora\":\"golpe futuro\"}; senao omita o campo.\n";
  }
  function objetivoDaEscolhaIA(opts) {
    var c = opts && opts.chefao;
    return c && c.boss ? "OBJETIVO: vencer " + dadoExterno(c.boss.name) + (c.estrategia ? " (o time arma " + dadoExterno(NOME_DA_CONDICAO[c.estrategia.clima] || c.estrategia.clima) + " com " + dadoExterno(c.estrategia.armador) + ")" : "") + ".\n" : "";
  }

  // Prompt da build de UM membro. `r` = candidatosDeBuild(sp, ...) (com candidatos).
  function montarPromptEscolhaDeBuild(sp, r, opts) {
    opts = opts || {};
    var cap = getCurrentCap();
    var arq = archetypeBuildGuidance();
    return cabecalhoIA() +
      "ESCOLHA a build do Pokemon " + sp.n + " (build " + versaoDosDados() + ") ENTRE os candidatos abaixo, que o app ja calculou e validou.\n" +
      blocoDeCandidatosParaIA(sp, r) +
      blocoItensIA(sp, false) +
      (cap ? ("Level cap atual do jogador: " + cap + "\n") : "") +
      (arq.length ? arq.join("\n") + "\n" : "") +
      blocoTimeCurtoIA(sp) + GUIA_DE_PAPEL_CURTO + "\n" +
      objetivoDaEscolhaIA(opts) +
      (opts.chefao ? linhaDoChefaoPorEspecieIA(sp, opts.chefao.responde, opts.chefao.provado) : "") +
      blocoPlanoCurtoIA(sp) +
      "Responda SOMENTE com um objeto JSON neste formato exato, sem texto ao redor: " + FORMATO_ESCOLHA_IA + ". " + regrasDaEscolhaIA();
  }
  // Prompt do lote: `itens` = [{ sp, r }] (só quem tem candidatos). O que vale pro time todo vai UMA vez.
  function montarPromptEscolhaDoTime(itens, opts) {
    opts = opts || {};
    var cap = getCurrentCap();
    var arq = archetypeBuildGuidance();
    var pokes = itens.map(function (it, i) {
      return "=== POKEMON " + (i + 1) + " de " + itens.length + ": " + it.sp.n + " (chave \"" + it.sp.sname + "\") ===\n" +
        blocoDeCandidatosParaIA(it.sp, it.r) + linhaDePapelNaturalIA(it.sp) + blocoItensDaEspecieIA(it.sp) +
        linhaDoChefaoPorEspecieIA(it.sp, opts.responde && opts.responde[it.sp.sname], opts.provado && opts.provado[it.sp.sname]) + blocoPlanoCurtoIA(it.sp);
    }).join("");
    return cabecalhoIA() +
      "ESCOLHA a build de CADA um dos " + itens.length + " Pokemon deste time (build " + versaoDosDados() + ") ENTRE os candidatos de cada um, que o app ja calculou e validou. " +
      "Eles jogam JUNTOS: varie papeis, e no MAXIMO " + MAX_MESMO_ITEM_NO_TIME + " do time com o mesmo item.\n" +
      blocoItensComunsIA(true, "") +
      (cap ? ("Level cap atual do jogador: " + cap + "\n") : "") +
      (arq.length ? arq.join("\n") + "\n" : "") +
      linhaDeFraquezasDoTimeIA(state.team.map(getSpeciesByX).filter(Boolean)) + GUIA_DE_PAPEL_CURTO + "\n" +
      objetivoDaEscolhaIA(opts) +
      pokes +
      "Responda SOMENTE com um objeto JSON neste formato exato, sem texto ao redor: " +
      '{"builds":{"CHAVE_DO_POKEMON":' + FORMATO_ESCOLHA_IA + '}} - uma entrada por Pokemon, cada uma com a chave dada no titulo. ' + regrasDaEscolhaIA();
  }

  // Número do candidato (1 a n). Aceita 2 ou "2"; qualquer outra coisa (texto, 0, 9, 1.5) volta null.
  function indiceDaEscolhaIA(bruto, n) {
    var v = bruto && bruto.escolha;
    if (typeof v === "string" && /^\s*\d+\s*$/.test(v)) v = parseInt(v, 10);
    return typeof v === "number" && v % 1 === 0 && v >= 1 && v <= n ? v - 1 : null;
  }
  // A resposta cita habilidade ou golpes que não são os do candidato? Então a IA tentou inventar build: recusa.
  function respostaForaDoCandidato(bruto, c) {
    if (bruto.ability !== undefined && bruto.ability !== c.habilidade) return "citou a habilidade " + dadoExterno(bruto.ability) + ", que nao e a do candidato " + dadoExterno(c.habilidade);
    if (bruto.moves !== undefined) {
      var m = Array.isArray(bruto.moves) ? bruto.moves : [];
      if (m.length !== c.golpes.length || m.some(function (g) { return c.golpes.indexOf(g) === -1; })) return "citou golpes que nao sao os do candidato";
    }
    return null;
  }
  // Fecha o candidato `c` com a natureza/item/EVs dados, pela fecharBuild e, quando há chefão, pela validação estratégica dele
  // (golpe-chave do simulador, armador do clima, buffs). { build } ou { motivo }.
  function fecharCandidatoDaEscolha(sp, c, escolha, opts) {
    var f = fecharBuild(c, escolha);
    if (!f.ok) return { motivo: f.erros.join(" ") };
    var b = f.build;
    var v = validarRespostaDeBuildDaIa(sp, { ability: b.ability, moves: b.moves, nature: b.nature, item: b.item, evs: b.evs, rationale: b.rationale }, opts || {});
    if (!v.valor) return { motivo: v.motivo };
    return { build: v.valor };
  }
  function textoDaRazaoDaEscolha(bruto, c, origem, motivo) {
    var txt = bruto && typeof bruto.rationale === "string" ? bruto.rationale.trim() : "";
    if (origem === ORIGEM_ESCOLHA_IA) return txt;
    var porque = origem === ORIGEM_ESCOLHA_MOTOR
      ? "Melhor candidato do jogo (" + (motivo === MOTIVO_SEM_RESPOSTA ? motivo : "a resposta da IA nao valeu: " + motivo) + ")."
      : "Candidato escolhido pela IA; natureza, item e EVs do rascunho do jogo (" + motivo + ").";
    return (porque + " " + txt + (txt ? " " : "") + (c.motivos && c.motivos[0] ? dadoExterno(c.motivos[0]) : "")).trim();
  }
  function juntarRazaoNaBuild(build, razao) {
    var antes = build.rationale || "";
    build.rationale = ((antes ? antes + " " : "") + razao).trim().slice(0, 360);
    return build;
  }
  // Confere a resposta da IA contra os candidatos `r` de `sp` e devolve:
  //   { build, origem, indice, motivo }  build = pronta para gravar (validada), origem = "ia" | "ia-escolha" | "motor";
  //   { build: null, motivo }            nenhum candidato serve (ex.: a validação do chefão recusou todos): quem chamou usa o caminho antigo.
  // Nunca lança. `opts` = as opções da build (chefao/timeNovo), para a validação estratégica.
  // `semResposta` = a chamada à IA falhou (o lote inteiro): vai direto ao melhor do motor, dizendo isso na explicação.
  function escolherCandidatoDaIa(sp, r, bruto, opts, semResposta) {
    var cands = (r && r.candidatos || []).slice(0, MAX_CANDIDATOS_NO_PROMPT);
    if (!cands.length) return { build: null, indice: null, origem: null, motivo: "sem candidatos" };
    var motivo = null, idx = null;
    try {
      if (semResposta) motivo = MOTIVO_SEM_RESPOSTA;
      else if (!bruto || typeof bruto !== "object") motivo = "a resposta nao veio como objeto";
      else {
        idx = indiceDaEscolhaIA(bruto, cands.length);
        if (idx === null) motivo = "a escolha nao e um dos " + cands.length + " candidatos";
        else motivo = respostaForaDoCandidato(bruto, cands[idx]);
      }
      if (!motivo) {
        var c = cands[idx];
        var ok = fecharCandidatoDaEscolha(sp, c, { evs: bruto.evs, item: bruto.item, natureza: bruto.nature }, opts);
        if (ok.build) return { build: juntarRazaoNaBuild(ok.build, textoDaRazaoDaEscolha(bruto, c, ORIGEM_ESCOLHA_IA)), indice: idx, origem: ORIGEM_ESCOLHA_IA, motivo: null };
        motivo = ok.motivo;
        // O candidato foi o da IA; natureza, item e EVs dela não valeram: usa os do rascunho do motor.
        var rasc = fecharCandidatoDaEscolha(sp, c, { evs: c.build.evs, item: c.build.item, natureza: c.build.nature }, opts);
        if (rasc.build) return { build: juntarRazaoNaBuild(rasc.build, textoDaRazaoDaEscolha(bruto, c, ORIGEM_ESCOLHA_IA_RASCUNHO, motivo)), indice: idx, origem: ORIGEM_ESCOLHA_IA_RASCUNHO, motivo: motivo };
      }
      // Melhor candidato do motor que passa na validação (ordem do ranking do pipeline).
      for (var i = 0; i < cands.length; i++) {
        var m = fecharCandidatoDaEscolha(sp, cands[i], { evs: cands[i].build.evs, item: cands[i].build.item, natureza: cands[i].build.nature }, opts);
        if (m.build) return { build: juntarRazaoNaBuild(m.build, textoDaRazaoDaEscolha(bruto, cands[i], ORIGEM_ESCOLHA_MOTOR, motivo)), indice: i, origem: ORIGEM_ESCOLHA_MOTOR, motivo: motivo };
      }
      return { build: null, indice: null, origem: null, motivo: motivo || "nenhum candidato passou na validacao" };
    } catch (e) {
      return { build: null, indice: null, origem: null, motivo: "erro ao conferir a escolha: " + (e && e.message ? e.message : e) };
    }
  }
  // Quem usa o caminho de escolha: só o modo normal e o dos botões de lote (chefão/time novo). Revisão pós-evolução e ponte da curada
  // seguem como eram. Devolve o resultado do pipeline (com `alvo` e candidatos) ou null (caminho antigo: sem alvo ou sem candidato).
  function candidatosParaAEscolhaDaIa(sp, opts) {
    opts = opts || {};
    if (!escolhaEntreCandidatosLigada) return null;
    if (opts.modo) return null;
    var alvo = opts.chefao && opts.chefao.boss ? { chefao: opts.chefao.boss } : undefined;
    var r = candidatosDeBuild(sp, alvo ? { alvo: alvo } : {});
    // Sem chefão adiante o pipeline ainda traz candidatos só por sinergia (selo Estimado): a IA escolhe entre eles também (decisão do usuário, 15/10).
    return r && r.candidatos && r.candidatos.length ? r : null;
  }
