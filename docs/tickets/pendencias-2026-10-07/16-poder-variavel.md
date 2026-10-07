# 16 — Golpes de poder variável

Status: resolvido
Bloqueado por: 06
Agentes: playtester-de-build, meta-pokemon

## O que entrega
Golpes com poder 1 no dado (o poder vem de outra coisa) deixam de valer quase zero no simulador: Heavy Slam e Heat
Crash (peso de quem usa ÷ peso do alvo), Low Kick e Grass Knot (peso do alvo), Gyro Ball e Electro Ball (razão de
velocidade), Seismic Toss e Night Shade (dano = nível), Super Fang, Nature's Madness e Ruination (metade do HP),
Final Gambit (dano = HP de quem usa, e desmaia), Counter e Mirror Coat (devolve o dobro). Fórmula de cada um pelo
código oficial (battle_util.c CalcMoveBasePower e efeitos); o que não tiver dado (peso) fica registrado.
~50 usos nos chefões.

## Como verificar
Teste por fórmula + sabotagem; um chefão com Heavy Slam passa a causar dano.

## Comentários

07/10: Low Kick, Grass Knot, Heavy Slam, Heat Crash, Splash, Gyro Ball, Electro Ball (com o bug do jogo), Seismic Toss e Night Shade pelo código. Super Fang, Final Gambit, Counter e Mirror Coat ficaram fora (escolha do usuário). Rank recalcula no 19.
