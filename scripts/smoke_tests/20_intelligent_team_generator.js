// Seção 20 (2026-09-17): Gerador Inteligente de Times, pedido do usuário -
// uma única ação ("Gerar time completo") que encadeia Arquétipo (composição)
// + Builds (uma por membro) + Guia de uso + Validação, sem o jogador
// precisar visitar cada Pokémon manualmente. A IA é simulada por completo
// (window.claude); toda validação/filtro de Monotype/persistência é real.
async function section20() {
  await prepararRunPadrao();
  var T = window.__erTest;
  if (!T) { check("ponte de teste disponível", false); return; }

  var cap = T.getCurrentCap();
  // Evita colidir com quem prepararRunPadrao() já colocou no time/caixa -
  // addByName de algo que o jogador já possui não deveria duplicar, mas não
  // é o que este teste quer verificar, então fica de fora por segurança.
  var NOMES_JA_NO_ROSTER = TIME_PADRAO.concat(["Eelektross"]);
  function achaFixture(exigeTipoAusenteDe, evitar) {
    var fx = null;
    T.SPECIES.some(function (sp) {
      if (!sp || !sp.ab || !sp.ab.length || T.formFamilyOf(sp).length > 1) return false;
      if (NOMES_JA_NO_ROSTER.indexOf(sp.n) !== -1) return false;
      if (evitar && evitar.indexOf(sp.sname) !== -1) return false;
      // Sem build curada (BUILDS): a fixture começa sem build nenhuma, e a
      // checagem de "time novo substitui a build" mais abaixo parte de 1 build.
      if (T.BUILDS[sp.sname]) return false;
      // Pelo menos um tipo que a OUTRA fixture não tem - garante que existe
      // um "tipoAlvo" de verdade pra testar o filtro de Monotype depois,
      // em vez de confiar na sorte da ordem de iteração de T.SPECIES.
      if (exigeTipoAusenteDe && !sp.t.some(function (id) { return !speciesTemTipo(exigeTipoAusenteDe, T.TYPES[id]); })) return false;
      var lm = sp.lm.filter(function (p) { return cap === null || cap === undefined || p[0] <= cap; });
      var dano = T.uniqueIds(lm.map(function (p) { return p[1]; }).concat(sp.tu)).map(function (id) { return T.MOVES[id][0]; })
        .filter(function (m) { return T.moveRoleOf(m) === "dano"; });
      if (dano.length < 4) return false;
      fx = { sp: sp, moves: dano.slice(0, 4), abi: T.ABILITIES[T.uniqueIds(sp.ab)[0]][0] };
      return true;
    });
    return fx;
  }
  function speciesTemTipo(sp, tipo) {
    return sp.t.some(function (id) { return T.TYPES[id] === tipo; });
  }
  function buildValidaPara(fx) {
    return { ability: fx.abi, nature: "Jolly", item: "", moves: fx.moves, evs: [4, 252, 0, 0, 0, 252], rationale: "teste gerador inteligente" };
  }

  // Não precisa esvaziar time/caixa antes: o mock só devolve os snames das
  // duas fixtures, então o time final fica só com elas de qualquer forma -
  // e o card "Arquétipo do time" só existe quando o time ATUAL já tem pelo
  // menos 1 membro (renderTeamStrategy), então mexer no time padrão de
  // prepararRunPadrao() antes de o gerador rodar faria o card sumir.
  // fx1 procurado DEPOIS e com a exigência de ter um tipo que fx2 não tem -
  // garante que exista um "tipoAlvo" de verdade pro teste de Monotype mais
  // abaixo, sem depender da sorte da ordem de iteração de T.SPECIES.
  var fx2 = achaFixture(null, []);
  var fx1 = fx2 && achaFixture(fx2.sp, [fx2.sp.sname]);
  if (!achou("2 espécies distintas com 4 golpes de dano reais pra fixture do gerador", fx1 && fx2)) return;

  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  await addByName(fx1.sp.n, true); // vai pra caixa - o gerador usa time+caixa
  await addByName(fx2.sp.n, true);

  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);

  var estagios = []; // guarda cada prompt recebido, na ordem
  window.claude = {
    use: async function (name) {
      if (name !== "sample") return null;
      return {
        json: async function (prompt, opts) {
          estagios.push(prompt);
          if (opts && Array.isArray(opts.tools)) {
            for (const tdef of opts.tools) {
              if (!tdef.inputSchema) { try { await tdef.execute({}); } catch (e) { } }
            }
          }
          if (prompt.indexOf("Monte o MELHOR time possível") !== -1) {
            return { team: [fx1.sp.sname, fx2.sp.sname], reasoning: "Mock: dupla de teste automatizado." };
          }
          if (prompt.indexOf("Monte um set competitivo") !== -1) {
            var alvo = prompt.indexOf("para o Pokemon " + fx1.sp.n + " ") !== -1 ? fx1 : fx2;
            return buildValidaPara(alvo);
          }
          if (prompt.indexOf("Escreva um guia PRÁTICO") !== -1) {
            return {
              concept: "Time mock de teste automatizado, foco em pressão ofensiva coordenada.",
              opening: "Abra com o mais rápido dos dois pra ler o time adversário.",
              development: "Troque pro outro membro quando o tipo dele resistir ao que está em campo.",
              winCondition: "Feche a partida com quem sobrar de HP mais alto.",
              threats: "Times com resistência dupla ao ataque principal dificultam - " + fx1.sp.n + " segura essa matchup.",
              threatMemberSname: fx1.sp.sname
            };
          }
          return {};
        }
      };
    }
  };

  var buildBtnCompleto = document.getElementById("archetype-build-complete");
  if (!achou("botão \"Gerar time completo\"", buildBtnCompleto)) return;

  // ---- P1: sem nenhum foco escolhido, o botão avisa em vez de gastar chamada ----
  buildBtnCompleto.click();
  await wait(50);
  check("sem Estilo/Clima e campo/Tática/Monotype escolhido, avisa em vez de chamar a IA",
    estagios.length === 0 && document.getElementById("archetype-status").textContent.indexOf("Escolha") !== -1,
    document.getElementById("archetype-status").textContent);

  // ---- roda o pipeline completo, com Estilo escolhido ----
  selecionarArquetipo("pace", "Hyper Offense");
  await wait(30);

  // O card foi redesenhado ao escolher o Estilo: busca o botão de novo (o
  // ouvinte é delegado ao painel, um nó desanexado não recebe mais o clique).
  document.getElementById("archetype-build-complete").click();
  await pollUntil(function () { return estagios.length >= 4; }, 4000);
  await wait(150);

  check("o pipeline chama IA nas 3 etapas esperadas, na ordem certa (composição, build x2, guia)",
    estagios.length === 4 &&
    estagios[0].indexOf("Monte o MELHOR time possível") !== -1 &&
    estagios[1].indexOf("Monte um set competitivo") !== -1 &&
    estagios[2].indexOf("Monte um set competitivo") !== -1 &&
    estagios[3].indexOf("Escreva um guia PRÁTICO") !== -1,
    estagios.map(function (p) { return p.slice(0, 30); }));

  // ---- referência do Smogon (thread de sample teams, 2026-09-18): o
  // "threats" do guia agora exige citar um CHEFÃO REAL (getRemainingBosses),
  // não só "tipo X genérico" - mesma lição da descrição de time de lá
  // (nomeia a ameaça de verdade, não uma categoria vaga). ----
  check("o prompt do guia de uso agora exige citar um chefão/líder REAL (getRemainingBosses), não só 'tipo genérico'",
    estagios[3].indexOf("chefão ou líder de ginásio REAL") !== -1 && estagios[3].indexOf("getRemainingBosses") !== -1,
    estagios[3].slice(0, 400));

  var saveDepois = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
  check("o time foi aplicado sozinho, sem precisar clicar em \"Usar este time\" à parte",
    saveDepois.team.length === 2 && saveDepois.team.indexOf(fx1.sp.sname) !== -1 && saveDepois.team.indexOf(fx2.sp.sname) !== -1,
    saveDepois.team);
  check("as builds dos dois membros foram geradas e salvas sozinhas (sem visitar a Dex)",
    !!(saveDepois.customBuilds && saveDepois.customBuilds[fx1.sp.sname] && saveDepois.customBuilds[fx2.sp.sname]),
    Object.keys(saveDepois.customBuilds || {}));

  var cardGerado = document.querySelector(".ts-generated-team");
  if (achou("card \"Time gerado\" aparece depois do pipeline", cardGerado)) {
    check("card mostra o foco escolhido (Estilo) no título",
      cardGerado.querySelector("h3").textContent.indexOf("Hyper Offense") !== -1, cardGerado.querySelector("h3").textContent);
    check("guia de uso mostra as 5 seções pedidas (conceito/abertura/desenvolvimento/vitória/ameaças)",
      /Conceito:/.test(cardGerado.textContent) && /Abertura:/.test(cardGerado.textContent) &&
      /Desenvolvimento:/.test(cardGerado.textContent) && /Condição de vitória:/.test(cardGerado.textContent) &&
      /Ameaças e respostas:/.test(cardGerado.textContent));
    check("validação confirma que os 2 membros têm build - não afirma isso sem checar de verdade",
      /Todos os 2 membros têm build confirmada/.test(cardGerado.textContent), cardGerado.textContent);

    // ---- "Ver Estratégias" na ameaça citada (achado em auditoria,
    // 2026-09-18, item 16): threatMemberSname vindo da IA (aqui mockado
    // como fx1) precisa virar um link/botão de verdade pro membro CERTO,
    // que ao ser ativado abre a Dex dele já com Estratégias expandida. ----
    var linkEstrategias = cardGerado.querySelector(".goto-species-strategies");
    if (achou("link \"Ver Estratégias\" aparece quando threatMemberSname veio válido", linkEstrategias)) {
      check("o link aponta pro membro CERTO (o citado pela IA como threatMemberSname), não um genérico",
        parseInt(linkEstrategias.dataset.x, 10) === fx1.sp.x, linkEstrategias.dataset.x + " vs esperado " + fx1.sp.x);
      linkEstrategias.click();
      await wait(80);
      var detAberto = [...document.querySelectorAll(".detail-group")].find(function (d) {
        return d.querySelector("summary") && d.querySelector("summary").textContent.indexOf("Estratégias") === 0;
      });
      check("clicar no link navega pra Dex do membro certo com a seção Estratégias já aberta",
        document.querySelector(".detail-titles h2") && document.querySelector(".detail-titles h2").textContent === fx1.sp.n &&
        !!detAberto && detAberto.open,
        { especieAberta: (document.querySelector(".detail-titles h2") || {}).textContent, estrategiasAberta: detAberto && detAberto.open });
    }
  }

  // ---- Time novo substitui a build da tela (pedido do usuário, 2026-09-29):
  // gerar de novo com os mesmos membros, que JÁ têm build, gera build nova pra
  // cada um - ela vira a ativa e a de antes fica de variante (nada se perde). ----
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);
  var antesDoNovo = [fx1, fx2].map(function (fx) { return T.getBuildList(fx.sp.sname).length; });
  estagios.length = 0;
  document.getElementById("archetype-build-complete").click();
  await pollUntil(function () { return estagios.length >= 4; }, 4000);
  await wait(150);
  check("gerar o time de novo pede build nova até pra quem já tinha build (2 pedidos de build)",
    estagios.filter(function (p) { return p.indexOf("Monte um set competitivo") !== -1; }).length === 2,
    estagios.map(function (p) { return p.slice(0, 30); }));
  var listas = [fx1, fx2].map(function (fx) { return T.getBuildList(fx.sp.sname); });
  check("a build nova vira a ativa (a da tela) e a antiga fica de variante",
    listas.every(function (l, i) { return l.length === antesDoNovo[i] + 1 && l[l.length - 1].active && l.filter(function (b) { return b.active; }).length === 1; }),
    listas.map(function (l) { return l.map(function (b) { return b.active; }); }));

  // ---- Build feita à mão nunca some (revisão de 2026-09-30): com as 3 vagas
  // ocupadas por builds do jogador, o time novo não apaga nenhuma - recusa a nova
  // e diz por quê. ----
  var manual = function (nat) { return { ability: fx1.abi, nature: nat, item: "", moves: fx1.moves.slice(), evs: [0, 0, 0, 0, 0, 0], ivs: [31, 31, 31, 31, 31, 31], source: "manual", active: false, savedAt: "2026-09-0" + nat.length, rationale: "" }; };
  T.state.customBuilds[fx1.sp.sname] = [manual("Adamant"), manual("Jolly"), manual("Modest")];
  T.state.customBuilds[fx1.sp.sname][0].active = true;
  estagios.length = 0;
  document.getElementById("archetype-build-complete").click();
  await pollUntil(function () { return estagios.length >= 4; }, 4000);
  await wait(150);
  var listaManual = T.getBuildList(fx1.sp.sname);
  check("time novo não apaga build feita à mão (3 manuais continuam, a da IA é recusada)",
    listaManual.length === 3 && listaManual.every(function (b) { return b.source === "manual"; }),
    listaManual.map(function (b) { return b.source + "/" + b.nature; }));

  // ---- P2: Monotype filtra o roster deterministicamente (não confia na IA) ----
  // O time já é só [fx1, fx2] a esta altura (resultado do pipeline acima) -
  // não precisa mexer no roster de novo, só trocar o eixo escolhido.
  var tipoAlvo = T.TYPES.filter(function (ty) { return T.USABLE_TYPES.indexOf(ty) !== -1; })
    .find(function (ty) { return speciesTemTipo(fx1.sp, ty) && !speciesTemTipo(fx2.sp, ty); });
  if (achou("um tipo que só a fixture 1 tem, pra testar o filtro de Monotype", tipoAlvo)) {
    estagios.length = 0;
    selecionarArquetipo("pace", "");
    await wait(30);
    selecionarArquetipo("monotype", tipoAlvo);
    await wait(30);
    // O botão avulso "Montar melhor time" foi removido (2026-09-18, junto
    // com a Leitura estratégica) - generateTeamForArchetype agora só roda
    // por dentro de "Gerar time completo", mas continua exposto pela ponte
    // de teste pra exercitar só a composição (mais rápido pra este teste).
    T.generateTeamForArchetype(); // só a composição, mais rápido pra este teste específico
    await pollUntil(function () { return estagios.length >= 1; }, 2000);
    await wait(80);
    check("Monotype filtra o roster ANTES do prompt - a espécie do outro tipo nem aparece listada pra IA escolher",
      estagios.length === 1 && estagios[0].indexOf(fx1.sp.sname) !== -1 && estagios[0].indexOf(fx2.sp.sname) === -1,
      estagios[0] ? estagios[0].slice(0, 200) : "(sem prompt)");
  }

  // ---- Trava de Mega na sugestão de time (print do usuário, 2026-09-24:
  // "Altaria Mega" na caixa, insígnia no 2º ginásio, e a sugestão contava a
  // Mega). Antes da 4ª insígnia a Mega vira a base no roster e o prompt avisa
  // que Mega não existe ainda; depois, a Mega entra normal. ----
  var megaFx = T.getSpeciesBySname("SPECIES_ALTARIA_MEGA");
  if (achou("Altaria Mega no dado (fixture da trava de Mega)", megaFx)) {
    var boxAntesMega = T.state.box.slice();
    var milestoneAntesMega = T.state.settings.milestone;
    var archetypeAntesMega = { pace: T.state.archetype.pace, weather: T.state.archetype.weather, monotype: T.state.archetype.monotype };
    T.state.archetype.pace = "Hyper Offense";
    T.state.archetype.monotype = null;
    if (T.state.box.indexOf(megaFx.x) === -1) T.state.box.push(megaFx.x);
    T.state.settings.milestone = 1;
    estagios.length = 0;
    T.generateTeamForArchetype();
    await pollUntil(function () { return estagios.length >= 1; }, 2000);
    await wait(60);
    var promptTrancado = estagios[0] || "";
    check("antes da 4ª insígnia o prompt do time avisa que Mega ainda não existe",
      promptTrancado.indexOf("MEGA EVOLUCAO: AINDA NAO DISPONIVEL") !== -1, promptTrancado.slice(0, 300));
    check("antes da 4ª insígnia a Mega da caixa vira a base no roster (nem aparece a forma Mega)",
      promptTrancado.indexOf("SPECIES_ALTARIA ") !== -1 && promptTrancado.indexOf("SPECIES_ALTARIA_MEGA") === -1,
      promptTrancado.slice(0, 500));
    T.state.settings.milestone = 4;
    estagios.length = 0;
    T.generateTeamForArchetype();
    await pollUntil(function () { return estagios.length >= 1; }, 2000);
    await wait(60);
    var promptLiberado = estagios[0] || "";
    check("depois da 4ª insígnia a Mega entra no roster normalmente e não há o aviso de trava",
      promptLiberado.indexOf("SPECIES_ALTARIA_MEGA") !== -1 && promptLiberado.indexOf("AINDA NAO DISPONIVEL") === -1,
      promptLiberado.slice(0, 500));
    T.state.box = boxAntesMega;
    T.state.settings.milestone = milestoneAntesMega;
    T.state.archetype.pace = archetypeAntesMega.pace;
    T.state.archetype.weather = archetypeAntesMega.weather;
    T.state.archetype.monotype = archetypeAntesMega.monotype;
  }

  delete window.claude;
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
}
