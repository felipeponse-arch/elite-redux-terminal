  // ===== src/regras/plano_build.js =====
  // Build que acompanha o jogador: plano de golpes por slot, estilo da build e
  // escolha da build curada. Colado dentro do <script> principal do app por
  // scripts/build.ps1 (marcador @regras plano_build.js), no mesmo escopo do resto
  // do código - sem module, sem wrapper. Só lógica pura: nada aqui lê a página.
  //
  // Pedido do usuário (2026-09-24): "montamos uma build no cap 18; no próximo cap
  // ele pode aprender golpes melhores pra build que já montamos - o jogo pode
  // atualizar a build com esse golpe novo". Medido nas 138 curadas: a cada degrau
  // de cap entre 18 e 70, 17% a 46% das espécies destravam um golpe do set ideal.
  //
  // Como funciona: a build guarda os golpes de AGORA (`moves`) e um `plano`
  // { golpeDeAgora: golpeQueEntraDepois } escolhido por quem montou a build (a IA
  // ou a curadoria). O app nunca decide sozinho qual golpe é "melhor" (uma regra
  // fixa errou 19 de 24 trocas no estudo); ele só faz a conta exata de QUANDO o
  // golpe planejado libera e deriva os golpes pelo cap na hora de mostrar. Nada é
  // regravado: se o cap voltar, a troca volta junto; o sync só vê o plano.

  var ESTILOS_BUILD = ["ofensivo", "equilibrado", "defensivo"];
  var ESTILO_ROTULO = { ofensivo: "Ofensivo", equilibrado: "Equilibrado", defensivo: "Defensivo" };
  var ROTULOS_EV = ["HP", "Atk", "Def", "SpA", "SpD", "Spe"];

  // "252 Atk / 4 SpD / 252 Spe" (formato das curadas) -> [0,252,0,0,4,252].
  function evsTextoParaArray(texto) {
    var out = [0, 0, 0, 0, 0, 0];
    String(texto || "").split("/").forEach(function (parte) {
      var m = parte.trim().match(/^(\d+)\s+(\S+)$/);
      if (!m) return;
      var i = ROTULOS_EV.indexOf(m[2]);
      if (i !== -1) out[i] = parseInt(m[1], 10);
    });
    return out;
  }

  // Estilo pelos EVs (conferido nas 189 curadas: 105 ofensivas, 51 equilibradas -
  // quase todas HP + um ataque -, 33 defensivas). Aceita array ou texto.
  function estiloDeEvs(evs) {
    var v = Array.isArray(evs) ? evs : evsTextoParaArray(evs);
    var ofensa = (v[1] || 0) + (v[3] || 0) + (v[5] || 0);
    var defesa = (v[0] || 0) + (v[2] || 0) + (v[4] || 0);
    if (ofensa >= 400) return "ofensivo";
    if (defesa >= 400) return "defensivo";
    return "equilibrado";
  }

  // Estilo que o time pede, pelo Ritmo do arquétipo (mesma taxonomia de
  // PACE_BUILD_GUIDANCE). Sem ritmo escolhido = equilibrado.
  function estiloDoRitmo(ritmo) {
    if (ritmo === "Hyper Offense" || ritmo === "Bulky Offense") return "ofensivo";
    if (ritmo === "Stall" || ritmo === "Semi-Stall") return "defensivo";
    return "equilibrado";
  }

  // Menor nível em que a espécie aprende o golpe; 0 = tutor (sempre liberado);
  // null = esta forma não aprende o golpe de jeito nenhum.
  function nivelDoGolpe(sp, nome) {
    var id = MOVE_ID_BY_NAME[nome];
    if (!sp || id === undefined) return null;
    if (sp.tu.indexOf(id) !== -1) return 0;
    var menor = null;
    sp.lm.forEach(function (p) { if (p[1] === id && (menor === null || p[0] < menor)) menor = p[0]; });
    return menor;
  }

  // Nível em que esta forma evolui sozinha por nível (a mesma evolução que
  // evolveChainByX aplica: EVO_LEVEL puro, a primeira da lista). Golpe acima dele
  // nunca é aprendido NESTA forma - 680 de 729 pré-evoluções têm golpe assim.
  function nivelDeEvolucaoDaForma(sp) {
    if (!sp || !sp.ev) return null;
    for (var i = 0; i < sp.ev.length; i++) {
      var n = Number(sp.ev[i][1]);
      if (EVOKINDS[sp.ev[i][0]] === EVO_LEVEL && !isNaN(n)) return n;
    }
    return null;
  }

  // Confere um plano vindo da IA (ou de um save) contra os dados reais. Nunca
  // rejeita a build por causa do plano: o passo inválido sai e o motivo volta em
  // `descartados`. `cap` null = sem cap (Campeão).
  function validarPlano(sp, moves, planoBruto, cap) {
    var plano = {}, descartados = [];
    if (!sp || !Array.isArray(moves) || !planoBruto || typeof planoBruto !== "object") return { plano: plano, descartados: descartados };
    var limite = nivelDeEvolucaoDaForma(sp);
    var destinos = {};
    Object.keys(planoBruto).forEach(function (de) {
      var para = planoBruto[de];
      var motivo = null;
      if (typeof para !== "string" || !para) motivo = "sem golpe de destino";
      else if (moves.indexOf(de) === -1) motivo = de + " não está na build";
      else if (para === de || moves.indexOf(para) !== -1) motivo = para + " já está na build";
      else if (destinos[para]) motivo = para + " já é destino de outro golpe";
      else {
        var nivel = nivelDoGolpe(sp, para);
        if (nivel === null) motivo = sp.n + " não aprende " + para;
        else if (nivel === 0 || cap === null || cap === undefined || nivel <= cap) motivo = para + " já está liberado - devia estar na build agora";
        else if (limite !== null && nivel > limite) motivo = sp.n + " evolui no nível " + limite + ", antes de aprender " + para + " (nível " + nivel + ")";
      }
      if (motivo) { descartados.push({ de: de, para: String(para), motivo: motivo }); return; }
      plano[de] = para;
      destinos[para] = true;
    });
    return { plano: plano, descartados: descartados };
  }

  // Formato do plano vindo de um save (do próprio aparelho ou de outro): só pares
  // texto -> texto, com o golpe de agora dentro da build. null = sem plano.
  function planoSaneado(bruto, moves) {
    if (!bruto || typeof bruto !== "object" || Array.isArray(bruto)) return null;
    var out = {}, n = 0;
    Object.keys(bruto).forEach(function (de) {
      var para = bruto[de];
      if (n >= 4 || typeof para !== "string" || !para || para.length > 40 || moves.indexOf(de) === -1) return;
      out[de] = para;
      n++;
    });
    return n ? out : null;
  }

  // Golpes da build no cap atual: cada golpe com plano troca pelo destino quando o
  // destino libera. Devolve { moves, trocas: [{de,para,nivel}] já aplicadas,
  // pendentes: [{de,para,nivel}] ainda por vir }. Passo que não vale pra esta
  // forma (ex.: plano de outra espécie depois de evoluir) é ignorado.
  function golpesNoCap(sp, moves, plano, cap) {
    var out = { moves: (moves || []).slice(), trocas: [], pendentes: [] };
    if (!sp || !plano) return out;
    var semCap = cap === null || cap === undefined;
    out.moves = out.moves.map(function (de) {
      var para = plano[de];
      if (!para || out.moves.indexOf(para) !== -1) return de;
      var nivel = nivelDoGolpe(sp, para);
      if (nivel === null || nivel === 0) return de;
      if (semCap || nivel <= cap) { out.trocas.push({ de: de, para: para, nivel: nivel }); return para; }
      out.pendentes.push({ de: de, para: para, nivel: nivel });
      return de;
    });
    return out;
  }

  // Trocas que um cap novo aplica em relação ao antigo (pro registro "O que o app
  // fez sozinho"). Subida de cap = trocas novas; descida = trocas desfeitas.
  function trocasEntreCaps(sp, moves, plano, capAntes, capDepois) {
    var a = golpesNoCap(sp, moves, plano, capAntes).trocas.map(function (t) { return t.de; });
    var b = golpesNoCap(sp, moves, plano, capDepois);
    return {
      entraram: b.trocas.filter(function (t) { return a.indexOf(t.de) === -1; }),
      voltaram: b.pendentes.filter(function (t) { return a.indexOf(t.de) !== -1; })
    };
  }

  // Builds curadas de uma forma, sempre como lista: data/builds.json guarda um
  // objeto por espécie, e a promoção do Playtester pode transformar o valor numa
  // lista (até 3, uma por estilo). Único lugar que conhece os dois formatos.
  function curadasDe(sname) {
    var v = BUILDS[sname];
    if (!v) return [];
    return (Array.isArray(v) ? v : [v]).filter(function (b) { return b && Array.isArray(b.moves); });
  }
  // Curada do estilo pedido; `exato` false aceita a primeira quando nenhuma é do
  // estilo (é o que o card do time mostra quando o jogador não tem build).
  function curadaParaEstilo(sname, estilo, exato) {
    var lista = curadasDe(sname);
    for (var i = 0; i < lista.length; i++) {
      if ((lista[i].estilo || estiloDeEvs(lista[i].evs)) === estilo) return lista[i];
    }
    return exato ? null : (lista[0] || null);
  }
