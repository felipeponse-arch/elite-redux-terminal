# 17 — Gerador de builds: caçar bugs no caminho

Status: pronto-para-agente
Bloqueado por: nenhum

## O que entrega
Rodar a skill sentry-skills:find-bugs só no caminho do gerador (prompt, chamada, validação, gravação) e transformar cada bug confirmado em teste que falha antes da correção.

## Critérios de aceite
- [ ] Lista de achados com veredito (confirmado, plausível, descartado).
- [ ] Casos mínimos conferidos: Mega antes da pedra, golpe acima do Level cap, EV inválido, habilidade da forma Mega, item que só sai depois.
- [ ] Cada bug confirmado vira teste + correção, ou ticket próprio se for grande.
- [ ] Nenhuma regra de mecânica reinterpretada (docs/decisoes_mecanicas.md).

## Comentários
Origem: pedido de 07/10 de revisar o gerador de builds (kit de habilidades, golpes, EVs, item, natureza, Mega) com skills do repositório.
