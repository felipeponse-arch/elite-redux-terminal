  // ===== src/regras/liberado_na_run.js =====
  // O que a run libera: UMA função pura (etapa, levelCap, alvo) -> boolean para pedra mega, item e
  // golpe (ticket divida-tecnica 05, 21/10/2026). Aviso de build, prompt da IA, pipeline e formas
  // mega perguntam aqui; a Fase C do time-pelo-motor monta o time com o mesmo filtro. Só lógica
  // pura (ADR-004): não lê state nem página - quem chama passa a Etapa e o Level cap.
  //
  // alvo (um dos três):
  //   { pedra: "Charizardite X" }  - pedra mega: etapa em MEGA_PEDRAS_TARDIAS, senão a 4ª insígnia;
  //   { item: "Eviolite" }         - qualquer item; pedra mega cai na regra da pedra; item sem local
  //                                  com etapa no código do jogo conta como liberado (o dado não
  //                                  basta pra afirmar que falta);
  //   { golpe: 36 }                - nível em que o golpe é aprendido; null = tutor/sem nível (livre);
  //                                  levelCap null/undefined = sem limite.

  // Etapa em que a pedra libera (4 por padrão; MEGA_PEDRAS_TARDIAS tem as tardias).
  function etapaDaPedra(nome) { return MEGA_PEDRAS_TARDIAS[nome] || MEGA_UNLOCK_MILESTONE; }
  // Etapa mais cedo em que o item existe pro jogador; null = sem etapa conhecida.
  function etapaDoItem(nome) {
    if (MEGA_FORMS[nome] !== undefined) return etapaDaPedra(nome);
    var lugar = primeiroLugarDoItem(nome);
    return lugar ? lugar.etapa : null;
  }
  function liberadoNaRun(etapa, levelCap, alvo) {
    if (!alvo) return true;
    if (alvo.pedra !== undefined) return etapa >= etapaDaPedra(alvo.pedra);
    if (alvo.item !== undefined) { var e = etapaDoItem(alvo.item); return e === null || etapa >= e; }
    if (alvo.golpe !== undefined) return alvo.golpe === null || levelCap === null || levelCap === undefined || alvo.golpe <= levelCap;
    return true;
  }
