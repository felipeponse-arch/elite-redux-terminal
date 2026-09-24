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
  } finally {
    if (claudeAntes === undefined) delete window.claude; else window.claude = claudeAntes;
  }
}
