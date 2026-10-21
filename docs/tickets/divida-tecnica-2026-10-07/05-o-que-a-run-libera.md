# 05 — Contexto da run: o que a run libera

Status: resolvido (branch divida-04-05, commits "liberadoNaRun" e "lista única do jogador"): função pura liberadoNaRun(etapa, levelCap, alvo) em src/regras/liberado_na_run.js e xsDoJogador(). Validação da IA (opção C, usuário 21/10): continua só avisando; o Modo Motor nunca usa item não liberado, aplicado na Fase C do time-pelo-motor com liberadoNaRun
Bloqueado por: 04

## O que entrega
Aviso de build, validação da build da IA e prompt da IA perguntam ao mesmo módulo se uma pedra mega, um item ou um golpe está liberado na Etapa e no Level cap da run, e por isso sempre concordam.

## Critérios de aceite
- [x] Etapa da pedra mega calculada num lugar só (etapaDaPedra).
- [x] Validação da build da IA: decisão 21/10, opção C (IA só avisa; Fase C aplica o filtro com liberadoNaRun).
- [x] Lista de Pokémon do jogador (time e caixa) vem de um lugar só.
- [x] Teste de concordância: o mesmo caso dá o mesmo veredito no aviso, na validação e no prompt.
- [ ] Respeita a ADR-004: o módulo lê o estado por dentro; nada de documento ou janela nas regras.

## Comentários
Origem: levantamento de dívida técnica e revisão de arquitetura de 07/10 (prioridades na conversa).
