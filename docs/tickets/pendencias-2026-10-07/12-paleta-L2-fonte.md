# 12 — Paleta L2: fonte de destaque

Status: resolvido
Bloqueado por: 11
Agentes: engenheira-frontend

## O que entrega
`--fonte-display` Potta One (Google Fonts, carregada sem travar a primeira pintura como as outras) só em títulos ≥14px:
título do app, nome da espécie na ficha e nome do chefão. `base.css`, `topo.css`, `dex.css` e o link no
`artifact_template.html`. Baselines: escuro-ficha, claro-ficha-completa, celular-ficha, dex-charizard-detail, *-chefao-detalhe.

## Como verificar
Fonte cai para a reserva sem quebrar o layout se o Google Fonts não responder; baselines regravados.

## Comentários

07/10: --fonte-display (Potta One, reserva Bricolage) no nome do app e no título da ficha (espécie e chefão). Achado: a Potta One vem em pedaços por alfabeto; a espera de fontes dos testes visuais passou a pedir com texto de exemplo, senão o print saía com a reserva. As 14 imagens regravadas com --update-snapshots=all (a troca de fonte ficava dentro da tolerância e não regravava sozinha).
