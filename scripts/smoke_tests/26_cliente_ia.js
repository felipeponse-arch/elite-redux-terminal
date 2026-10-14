// Seção 26 - cliente único de IA (fase 4 da refatoração, 2026-09-24). Todo
// pedido ao modelo passa por pedirIA(): disponibilidade, nova tentativa com o
// motivo da rejeição, ferramentas e tradução de erro. A IA é simulada
// (window.claude); o cliente é o de verdade.
async function section26() {
  const TE = window.__erTest;
  const claudeAntes = window.claude;
  const simular = (respostas, extra) => {
    const chamadas = [];
    window.claude = {
      use: async (n) => (n !== "sample" ? null : {
        json: async (prompt, opts) => {
          chamadas.push({ prompt, opts });
          const r = respostas[Math.min(chamadas.length - 1, respostas.length - 1)];
          if (r instanceof Error) throw r;
          return r;
        }
      }),
      ...(extra || {})
    };
    return chamadas;
  };
  TE.definirPausasIA([0, 0]);
  try {
    delete window.claude;
    let r = await TE.pedirIA({ prompt: "x" });
    check("sem plataforma de IA: não quebra, explica que não está disponível", !r.ok && /não disponível neste ambiente/.test(r.mensagem), r.mensagem);
    window.claude = { use: async () => null };
    r = await TE.pedirIA({ prompt: "x", oQue: "Montagem" });
    check("IA não concedida: mensagem própria, com o nome da ação", !r.ok && r.mensagem === "Montagem por IA não disponível (recurso não concedido).", r.mensagem);

    // rejeita a 1ª, aceita a 2ª: 2 chamadas, a 2ª leva o motivo
    let avisos = [];
    let chamadas = simular([{ n: 1 }, { n: 2 }]);
    r = await TE.pedirIA({
      prompt: "PEDIDO",
      validar: (b) => (b.n === 2 ? { valor: "ok2" } : { motivo: "faltou X" }),
      retentativa: (m) => " | MOTIVO: " + m,
      aoTentarDeNovo: (m) => avisos.push(m)
    });
    check("resposta rejeitada gera 1 nova tentativa, que leva o motivo", r.ok && r.valor === "ok2" && chamadas.length === 2 &&
      chamadas[1].prompt === "PEDIDO | MOTIVO: faltou X" && avisos.join() === "faltou X", { n: chamadas.length, p: chamadas[1] && chamadas[1].prompt });
    check("por padrão o pedido leva as ferramentas do app", !!(chamadas[0].opts && chamadas[0].opts.tools && chamadas[0].opts.tools.length));

    chamadas = simular([{ n: 1 }]);
    r = await TE.pedirIA({ prompt: "P", validar: () => ({ motivo: "sempre ruim" }) });
    check("2 rejeições: para em 2 chamadas e devolve o motivo", !r.ok && r.rejeitada && r.mensagem === "sempre ruim" && chamadas.length === 2, chamadas.length);

    chamadas = simular([{ n: 1 }]);
    r = await TE.pedirIA({
      prompt: "P", retentativa: (m) => " / " + m,
      validar: () => ({ motivo: "motivo técnico pro modelo", motivoParaJogador: "texto pro jogador" })
    });
    check("motivo técnico vai pro modelo; o jogador vê o texto dele",
      chamadas[1].prompt === "P / motivo técnico pro modelo" && r.mensagem === "texto pro jogador", { p: chamadas[1] && chamadas[1].prompt, m: r.mensagem });

    chamadas = simular([{ n: 1 }]);
    r = await TE.pedirIA({ prompt: "P", tentativas: 1, ferramentas: false, validar: () => ({ motivo: "ruim" }) });
    check("tentativas: 1 e sem ferramentas: uma chamada só, sem tools", chamadas.length === 1 && chamadas[0].opts === undefined && !r.ok);

    const erro = new Error("limite"); erro.code = "rate_limited";
    simular([erro]);
    r = await TE.pedirIA({ prompt: "P" });
    check("erro da plataforma vira a mensagem construtiva de sampleErrorMessage (limite de uso)",
      !r.ok && !r.rejeitada && r.mensagem === TE.sampleErrorMessage(erro), r.mensagem);

    // Reunião de 2026-09-28: falha passageira tenta de novo sozinha; falha
    // definitiva não; e um pedido por vez (fila única).
    chamadas = simular([erro, erro, erro]);
    r = await TE.pedirIA({ prompt: "P" });
    check("falha passageira persistente: 3 chamadas (1 + 2 novas tentativas) antes do erro", chamadas.length === 3 && !r.ok, chamadas.length);
    const upstream = new Error("caiu"); upstream.code = "upstream_error";
    chamadas = simular([upstream, { n: 7 }]);
    avisos = [];
    r = await TE.pedirIA({ prompt: "P", aviso: (t) => avisos.push(t) });
    check("falha passageira seguida de resposta: pede de novo sozinho e dá certo", r.ok && r.valor.n === 7 && chamadas.length === 2, chamadas.length);
    check("o jogador vê que a IA estava ocupada e que está tentando de novo", avisos.some((t) => /ocupada - tentando de novo/.test(t)), avisos);
    const recusa = new Error("não"); recusa.code = "refused";
    chamadas = simular([recusa, { n: 1 }]);
    r = await TE.pedirIA({ prompt: "P" });
    check("falha definitiva (refused) não tenta de novo", chamadas.length === 1 && !r.ok, chamadas.length);
    let ativos = 0, pico = 0;
    window.claude = { use: async () => ({ json: async () => { ativos++; pico = Math.max(pico, ativos); await new Promise((ok) => setTimeout(ok, 30)); ativos--; return { n: 1 }; } }) };
    avisos = [];
    const [r1, r2] = await Promise.all([TE.pedirIA({ prompt: "A" }), TE.pedirIA({ prompt: "B", aviso: (t) => avisos.push(t) })]);
    check("dois pedidos ao mesmo tempo: um por vez (fila única)", r1.ok && r2.ok && pico === 1, pico);
    check("o segundo pedido avisa que está na fila", /Na fila/.test(avisos[0] || ""), avisos[0]);

    // Revisão de código de 2026-09-28: chamada que nunca responde não pode
    // prender a fila única; erro sem code (bug do app) não é "passageiro".
    TE.definirTempoLimiteIA(50);
    window.claude = { use: async () => ({ json: () => new Promise(() => {}) }) };
    r = await TE.pedirIA({ prompt: "P", tentativas: 1 });
    check("chamada que nunca responde esgota o tempo-limite com mensagem própria", !r.ok && /demorou demais/.test(r.mensagem), r.mensagem);
    chamadas = simular([{ n: 9 }]);
    r = await TE.pedirIA({ prompt: "P", tentativas: 1 });
    check("depois do tempo esgotado a fila anda: o pedido seguinte é atendido", r.ok && r.valor.n === 9, r);
    TE.definirTempoLimiteIA(180000);
    chamadas = simular([new TypeError("bug do app"), { n: 1 }]);
    r = await TE.pedirIA({ prompt: "P" });
    check("erro sem code (bug do app) não é tratado como passageiro: 1 chamada só", chamadas.length === 1 && !r.ok, chamadas.length);

    // OmniRoute é uma ponte opcional do host: não expõe segredo no Artifact,
    // exige o modelo explícito e só entra quando o pedido marca o fornecedor.
    let omniChamadas = 0;
    let sampleChamadas = 0;
    window.claude = { use: async () => ({ json: async () => { sampleChamadas++; return { n: "claude" }; } }) };
    let omniOpcoes = "nunca chamado";
    window.__ER_OMNIROUTE_BRIDGE__ = {
      modelo: "antigravity/gemini-3.1-pro-high",
      json: async function (prompt, opcoes) { omniChamadas++; omniOpcoes = opcoes; return { n: prompt === "OMNI" ? "omni" : "erro" }; }
    };
    r = await TE.pedirIA({ provedor: "omniroute", prompt: "OMNI", tentativas: 1 });
    check("bridge OmniRoute usa o modelo explícito sem consumir sample", r.ok && r.valor.n === "omni" && omniChamadas === 1 && sampleChamadas === 0,
      { r: r, omniChamadas: omniChamadas, sampleChamadas: sampleChamadas });
    // Revisão de segurança (13/10): as ferramentas do app leem o estado e só vão ao cliente oficial; o bridge recebe só o prompt.
    check("bridge OmniRoute não recebe as ferramentas do app (só o prompt)", omniOpcoes === undefined, omniOpcoes);

    const bridgeFalha = new Error("bridge indisponível");
    window.__ER_OMNIROUTE_BRIDGE__.json = async function () { omniChamadas++; throw bridgeFalha; };
    r = await TE.pedirIA({ provedor: "omniroute", prompt: "FALLBACK", tentativas: 1 });
    check("falha do bridge carrega sample sob demanda e faz fallback", r.ok && r.valor.n === "claude" && sampleChamadas === 1,
      { r: r, omniChamadas: omniChamadas, sampleChamadas: sampleChamadas });

    window.__ER_OMNIROUTE_BRIDGE__.modelo = "auto/qualquer";
    r = await TE.pedirIA({ provedor: "omniroute", prompt: "MODELO INVALIDO", tentativas: 1 });
    check("modelo não explícito não ativa o bridge", r.ok && r.valor.n === "claude" && sampleChamadas === 2, r);
    // Um bridge com `modelo` em getter que muda a cada leitura: o pedido lê o bridge uma vez só e não cai no meio.
    let leituras = 0;
    window.__ER_OMNIROUTE_BRIDGE__ = {
      get modelo() { leituras++; return leituras === 1 ? "antigravity/gemini-3.1-pro-high" : "outro"; },
      json: async function () { omniChamadas++; return { n: "omni" }; }
    };
    const omniAntes = omniChamadas;
    r = await TE.pedirIA({ provedor: "omniroute", prompt: "OMNI", tentativas: 1 });
    check("bridge lido uma vez por pedido: getter que muda de resposta não derruba a chamada", r.ok && r.valor.n === "omni" && omniChamadas === omniAntes + 1 && leituras === 1,
      { r: r, leituras: leituras, omniChamadas: omniChamadas });
    delete window.__ER_OMNIROUTE_BRIDGE__;
  } finally {
    TE.definirPausasIA([4000, 10000]);
    if (claudeAntes === undefined) delete window.claude; else window.claude = claudeAntes;
    delete window.__ER_OMNIROUTE_BRIDGE__;
  }
}
