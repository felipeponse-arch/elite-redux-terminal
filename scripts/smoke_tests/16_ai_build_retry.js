// Seção 16 (2026-09-16, item U3 da pauta técnica): build por IA rejeitada
// pela validação ganha UMA nova tentativa automática, com o motivo da
// rejeição no prompt - antes o "tente de novo" ficava com o jogador.
// A IA é simulada (window.claude), a validação é a real. A fixture é achada
// no dado: espécie sem sinergia conhecida (isola a regra de sinergia), com 4
// golpes de dano liberados no cap atual e sem build salva.
async function section16() {
  var T = window.__erTest;
  if (!T) { check("ponte de teste disponível", false); return; }
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  var cap = T.getCurrentCap();
  var save = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
  var fx = null;
  T.SPECIES.some(function (sp) {
    if (!sp || !sp.ab || !sp.ab.length || T.formFamilyOf(sp).length > 1) return false;
    if ((T.ABILITY_SYNERGY[sp.sname] || []).length) return false;
    if (save.customBuilds && save.customBuilds[sp.sname]) return false;
    var lm = sp.lm.filter(function (p) { return cap === null || cap === undefined || p[0] <= cap; });
    var dano = T.uniqueIds(lm.map(function (p) { return p[1]; }).concat(sp.tu)).map(function (id) { return T.MOVES[id][0]; })
      .filter(function (m) { return T.moveRoleOf(m) === "dano"; });
    if (dano.length < 4) return false;
    fx = { sp: sp, moves: dano.slice(0, 4), abi: T.ABILITIES[T.uniqueIds(sp.ab)[0]][0] };
    return true;
  });
  if (!achou("espécie pra testar a nova tentativa da build por IA", fx)) return;

  var valida = { ability: fx.abi, nature: "Bold", item: "", moves: fx.moves, evs: [252, 0, 252, 0, 4, 0], rationale: "teste retry" };
  var invalida = Object.assign({}, valida, { moves: ["Golpe Que Nao Existe", fx.moves[1], fx.moves[2], fx.moves[3]] });

  async function gerarCom(respostas) {
    var prompts = [];
    window.claude = {
      use: async function (name) {
        if (name !== "sample") return null;
        return { json: async function (prompt) { prompts.push(prompt); return respostas[Math.min(prompts.length - 1, respostas.length - 1)]; } };
      }
    };
    setSearch(fx.sp.n);
    await wait(120);
    var row = document.querySelector('#species-list .species-row[data-x="' + fx.sp.x + '"]');
    if (!achou("linha de " + fx.sp.n + " na busca", row)) return prompts;
    row.click();
    await wait(60);
    var btn = document.getElementById("mybuild-ai-generate");
    if (!achou("botão Gerar build com IA", btn)) return prompts;
    btn.click();
    await pollUntil(function () { return prompts.length >= respostas.length; }, 1500);
    await wait(80);
    return prompts;
  }

  // 1) primeira resposta inválida, segunda válida -> salva sozinho.
  var p1 = await gerarCom([invalida, valida]);
  var salvo = (JSON.parse(localStorage.getItem("er_terminal_save") || "{}").customBuilds || {})[fx.sp.sname] || [];
  check("resposta rejeitada gera exatamente 1 nova tentativa automática", p1.length === 2, p1.length + " chamada(s)");
  check("a nova tentativa leva o motivo EXATO da rejeição pra IA (nomeia o golpe inválido)",
    p1.length === 2 && p1[1].indexOf("SUA RESPOSTA ANTERIOR FOI REJEITADA") !== -1 && p1[1].indexOf("Golpe Que Nao Existe") !== -1, (p1[1] || "").slice(-240));
  check("a build da segunda tentativa é salva sem o jogador pedir de novo",
    salvo.some(function (b) { return b.source === "ia" && b.rationale === "teste retry"; }), JSON.stringify(salvo).slice(0, 200));

  // 2) duas respostas inválidas -> para em 2 e explica.
  document.getElementById("back-to-list") && document.getElementById("back-to-list").click();
  await wait(30);
  var p2 = await gerarCom([invalida, invalida]);
  var status = (document.getElementById("mybuild-ai-status") || {}).textContent || "";
  check("duas rejeições seguidas: para em 2 chamadas (não fica em loop)", p2.length === 2, p2.length + " chamada(s)");
  check("duas rejeições seguidas: a mensagem diz que já tentou 2 vezes", status.indexOf("já tentei 2 vezes") !== -1, status);
  delete window.claude;
}
