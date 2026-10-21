# 05 — Contexto da run: o que a run libera

Status: parcial (branch divida-04-05, commit "função pura liberadoNaRun"): feita a função pura src/regras/liberado_na_run.js `liberadoNaRun(etapa, levelCap, alvo)` com aviso, prompt, pipeline, formas mega e golpes usando; faltam a validação da IA conferir a Etapa do item (conflita com a decisão de 08/10 "pode usar com motivo claro", perguntar) e a lista de Pokémon do jogador num lugar só
Bloqueado por: 04

## O que entrega
Aviso de build, validação da build da IA e prompt da IA perguntam ao mesmo módulo se uma pedra mega, um item ou um golpe está liberado na Etapa e no Level cap da run, e por isso sempre concordam.

## Critérios de aceite
- [x] Etapa da pedra mega calculada num lugar só (etapaDaPedra).
- [ ] Validação da build da IA passa a conferir a Etapa do item.
- [ ] Lista de Pokémon do jogador (time e caixa) vem de um lugar só.
- [x] Teste de concordância: o mesmo caso dá o mesmo veredito no aviso, na validação e no prompt.
- [ ] Respeita a ADR-004: o módulo lê o estado por dentro; nada de documento ou janela nas regras.

## Comentários
Origem: levantamento de dívida técnica e revisão de arquitetura de 07/10 (prioridades na conversa).
