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
      // Nunca já ter build própria (curada em BUILDS ou salva em
      // customBuilds) - senão o orquestrador pula a geração por IA pra essa
      // espécie de propósito (não gera build por cima de uma que já existe),
      // e o teste conta menos chamadas de IA do que o esperado.
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
              threats: "Times com resistência dupla ao ataque principal dificultam - troque de golpe/plano nesse caso."
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
  check("sem Ritmo/Clima/Monotype escolhido, avisa em vez de chamar a IA",
    estagios.length === 0 && document.getElementById("archetype-status").textContent.indexOf("Escolha") !== -1,
    document.getElementById("archetype-status").textContent);

  // ---- roda o pipeline completo, com Ritmo escolhido ----
  var paceSel = document.getElementById("archetype-pace");
  paceSel.value = "Hyper Offense";
  paceSel.dispatchEvent(new Event("change", { bubbles: true }));
  await wait(30);

  buildBtnCompleto.click();
  await pollUntil(function () { return estagios.length >= 4; }, 4000);
  await wait(150);

  check("o pipeline chama IA nas 3 etapas esperadas, na ordem certa (composição, build x2, guia)",
    estagios.length === 4 &&
    estagios[0].indexOf("Monte o MELHOR time possível") !== -1 &&
    estagios[1].indexOf("Monte um set competitivo") !== -1 &&
    estagios[2].indexOf("Monte um set competitivo") !== -1 &&
    estagios[3].indexOf("Escreva um guia PRÁTICO") !== -1,
    estagios.map(function (p) { return p.slice(0, 30); }));

  var saveDepois = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
  check("o time foi aplicado sozinho, sem precisar clicar em \"Usar este time\" à parte",
    saveDepois.team.length === 2 && saveDepois.team.indexOf(fx1.sp.sname) !== -1 && saveDepois.team.indexOf(fx2.sp.sname) !== -1,
    saveDepois.team);
  check("as builds dos dois membros foram geradas e salvas sozinhas (sem visitar a Dex)",
    !!(saveDepois.customBuilds && saveDepois.customBuilds[fx1.sp.sname] && saveDepois.customBuilds[fx2.sp.sname]),
    Object.keys(saveDepois.customBuilds || {}));

  var cardGerado = document.querySelector(".ts-generated-team");
  if (achou("card \"Time gerado\" aparece depois do pipeline", cardGerado)) {
    check("card mostra o foco escolhido (Ritmo) no título",
      cardGerado.querySelector("h3").textContent.indexOf("Hyper Offense") !== -1, cardGerado.querySelector("h3").textContent);
    check("guia de uso mostra as 5 seções pedidas (conceito/abertura/desenvolvimento/vitória/ameaças)",
      /Conceito:/.test(cardGerado.textContent) && /Abertura:/.test(cardGerado.textContent) &&
      /Desenvolvimento:/.test(cardGerado.textContent) && /Condição de vitória:/.test(cardGerado.textContent) &&
      /Ameaças e respostas:/.test(cardGerado.textContent));
    check("validação confirma que os 2 membros têm build - não afirma isso sem checar de verdade",
      /Todos os 2 membros têm build confirmada/.test(cardGerado.textContent), cardGerado.textContent);
  }

  // ---- P2: Monotype filtra o roster deterministicamente (não confia na IA) ----
  // O time já é só [fx1, fx2] a esta altura (resultado do pipeline acima) -
  // não precisa mexer no roster de novo, só trocar o eixo escolhido.
  var tipoAlvo = T.TYPES.filter(function (ty) { return T.USABLE_TYPES.indexOf(ty) !== -1; })
    .find(function (ty) { return speciesTemTipo(fx1.sp, ty) && !speciesTemTipo(fx2.sp, ty); });
  if (achou("um tipo que só a fixture 1 tem, pra testar o filtro de Monotype", tipoAlvo)) {
    estagios.length = 0;
    document.getElementById("archetype-pace").value = "";
    document.getElementById("archetype-pace").dispatchEvent(new Event("change", { bubbles: true }));
    await wait(30);
    var monoSel = document.getElementById("archetype-monotype");
    monoSel.value = tipoAlvo;
    monoSel.dispatchEvent(new Event("change", { bubbles: true }));
    await wait(30);
    document.getElementById("archetype-build").click(); // só a composição, mais rápido pra este teste específico
    await pollUntil(function () { return estagios.length >= 1; }, 2000);
    await wait(80);
    check("Monotype filtra o roster ANTES do prompt - a espécie do outro tipo nem aparece listada pra IA escolher",
      estagios.length === 1 && estagios[0].indexOf(fx1.sp.sname) !== -1 && estagios[0].indexOf(fx2.sp.sname) === -1,
      estagios[0] ? estagios[0].slice(0, 200) : "(sem prompt)");
  }

  delete window.claude;
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
}
