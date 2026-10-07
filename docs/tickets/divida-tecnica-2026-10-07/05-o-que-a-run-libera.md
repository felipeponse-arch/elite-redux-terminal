# 05 — Contexto da run: o que a run libera

Status: pronto-para-agente
Bloqueado por: 04

## O que entrega
Aviso de build, validação da build da IA e prompt da IA perguntam ao mesmo módulo se uma pedra mega, um item ou um golpe está liberado na Etapa e no Level cap da run, e por isso sempre concordam.

## Critérios de aceite
- [ ] Etapa da pedra mega calculada num lugar só.
- [ ] Validação da build da IA passa a conferir a Etapa do item.
- [ ] Lista de Pokémon do jogador (time e caixa) vem de um lugar só.
- [ ] Teste de concordância: o mesmo caso dá o mesmo veredito no aviso, na validação e no prompt.
- [ ] Respeita a ADR-004: o módulo lê o estado por dentro; nada de documento ou janela nas regras.

## Comentários
Origem: levantamento de dívida técnica e revisão de arquitetura de 07/10 (prioridades na conversa).
