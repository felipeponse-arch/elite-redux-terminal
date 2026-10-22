# 02 — Prova de papel e tag com o item fechado pelo motor

Status: pronto-para-agente
Tamanho: P. Dono: engenheira-do-motor.
Origem: revisão do motor-item/01 (supervisor r1, 22/10/2026), não bloqueante.

Os 5 testes de papel em tests/unit/time_pelo_motor_papeis.test.mjs rodam com `ctx.fecharItens = false` (isolamento:
o item muda o time escolhido). Falta provar 1-2 casos de papel/tag (wallbreaker/tanque, sinergia de sol com Torkoal)
COM o item ligado, para garantir que o papel continua com prova no time real que o usuário vê.
