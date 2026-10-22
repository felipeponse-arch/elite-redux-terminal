# 02 — Long Reach e Punching Glove tiram o contato também das reações

Status: pronto-para-agente
Tamanho: M. Antes do rank final se der tempo.
Evidência: relatorios/evidencia_simples_2026-10-22.md (pesquisador-de-mecanica, 22/10/2026). Regra: código do jogo (er-repo upcoming 217dd0f) vence.

O jogo usa IsMoveMakingContact para tudo (battle_util.c:6579-6592; reações em 6186, 6263). O motor seta
`g.contato = temContatoDuelo(m)` (duelo.js:1924) só pela flag; Long Reach (629-631) e Punching Glove (1920-1921) tiram
só o bônus. Protective Pads já está certo (1367, 2532). Corrigir no ponto único (1924) e testar as reações: Rough Skin/
Iron Barbs, Rocky Helmet, Gooey, Static/Flame Body/Poison Point, Leech Seed, Perish Body, roubo de item, Mummy.
