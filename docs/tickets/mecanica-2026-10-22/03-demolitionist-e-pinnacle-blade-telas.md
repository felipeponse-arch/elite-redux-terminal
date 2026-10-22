# 03 — Demolitionist e Pinnacle Blade: quebrar telas, substituto e Protect

Status: pronto-para-agente
Tamanho: M (cada). Pode ficar para depois do rank.
Evidência: relatorios/evidencia_simples_2026-10-22.md (pesquisador-de-mecanica, 22/10/2026). Regra: código do jogo (er-repo upcoming 217dd0f) vence.

- Demolitionist (abilities.cc:7745-7760): Readied Action na entrada (dobra statBase, battle_util.c:7156), ignora Protect
  (battle_util.c:6620), golpe não-status que acerta quebra telas. Motor: nada (duelo.js:2465 só comentário).
- Pinnacle Blade (abilities.cc:8661-8692): golpe Keen Edge quebra telas, zera substituto, feint se protegido
  (battle_util.c:6622). Reaproveitar a quebra de telas do Brick Break (duelo.js:4401).
