  // ===== src/regras/liberado_na_run.js =====
  // O que a run libera: UMA função pura (etapa, levelCap, alvo) -> boolean para pedra mega, item e
  // golpe (ticket divida-tecnica 05, 21/10/2026). Aviso de build, prompt da IA, pipeline e formas
  // mega perguntam aqui; a Fase C do time-pelo-motor monta o time com o mesmo filtro. Só lógica
  // pura (ADR-004): não lê state nem página - quem chama passa a Etapa e o Level cap.
  //
  // alvo (um dos três):
  //   { pedra: "Charizardite X" }  - pedra mega: a maior entre a Etapa do lugar (data/pedras_etapa.json) e a 4ª insígnia (keystone);
  //   { item: "Eviolite" }         - qualquer item; pedra mega cai na regra da pedra; item sem Etapa conhecida fica
  //                                  TRAVADO em toda Etapa (decisão 8 do usuário, 28/10);
  //   { golpe: 36 }                - nível em que o golpe é aprendido; null = tutor/sem nível (livre);
  //                                  levelCap null/undefined = sem limite.

  // Etapa em que a pedra libera = a maior entre QUANDO VALE (keystone, MEGA_UNLOCK_MILESTONE) e ONDE SE PEGA (MEGA_PEDRAS_TARDIAS,
  // do registro data/pedras_etapa.json). Sem lugar registrado, só vale o quandoVale (4ª insígnia).
  function etapaDaPedra(nome) { return Math.max(MEGA_UNLOCK_MILESTONE, MEGA_PEDRAS_TARDIAS[nome] || 0); }
  // Etapa mais cedo em que o item existe pro jogador; null = sem etapa conhecida.
  function etapaDoItem(nome) {
    if (MEGA_FORMS[nome] !== undefined) return etapaDaPedra(nome);
    var lugar = primeiroLugarDoItem(nome);
    return lugar ? lugar.etapa : null;
  }
  function liberadoNaRun(etapa, levelCap, alvo) {
    if (!alvo) return true;
    if (alvo.pedra !== undefined) return etapa >= etapaDaPedra(alvo.pedra);
    if (alvo.item !== undefined) { var e = etapaDoItem(alvo.item); return e !== null && etapa >= e; }
    if (alvo.golpe !== undefined) return alvo.golpe === null || levelCap === null || levelCap === undefined || alvo.golpe <= levelCap;
    return true;
  }

  // Pokémon do jogador num lugar só (ticket 05, 21/10/2026). Lê o state por dentro (ADR-004); devolve xs.
  // entradasDoJogador: cada entrada real do time e da caixa, time primeiro, SEM tirar repetidos (decisão do
  // usuário: dois iguais só aparecem se ele de fato tem dois).
  function entradasDoJogador() { return state.team.concat(state.box); }
  // xsDoJogador: o mesmo, sem contar duas vezes o MESMO x. O app guarda cada espécie uma vez só (builds por
  // sname; o dex barra adicionar quem já está no time ou na caixa), então x repetido é a mesma entrada, não
  // uma segunda captura - essa é a única proteção mantida (era o filtro de prompts_ia e aba_chefoes).
  function xsDoJogador() {
    return entradasDoJogador().filter(function (x, i, arr) { return arr.indexOf(x) === i; });
  }
