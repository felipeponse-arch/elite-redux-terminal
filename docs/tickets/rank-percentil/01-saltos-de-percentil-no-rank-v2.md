# 01 — Saltos de percentil no rank v2 (caso Orchestot)

Status: a-avaliar (usuário, 21/10/2026: publicar a v183 e investigar depois)
Tamanho: M.

## Sintoma
No recálculo do rank de 21/10 (a4aa061, motor da time-pelo-motor/01), o Orchestot foi de C49 para A82 (+33) com o valor
bruto do duelo quase igual (combinado 0,624 → 0,628). O set escolhido trocou de "tanque" para "especial rápido".

## Hipótese (pesquisador-de-mecanica, 21/10)
A nota por dificuldade vem de percentil por categoria (`scripts/calcular_rank_v2.mjs:209-217`). Uma troca de categoria com
valor bruto quase igual pode mover muito a nota. Musical Notes só liga `statusSom` (lido em `duelo.js:3509`, Soundproof);
Amplifier é igual nos dois motores; o set não tem tela, Tailwind nem lado.

## O que entrega
- Confirmar a causa rodando o rank v2 nos dois motores (0ece85e e a4aa061) só para as espécies que mais mudaram.
- Listar outras espécies com salto de nota > 15 e valor bruto quase igual.
- Propor a correção (ou explicar por que está certo) e levar ao usuário antes de mudar a regra do rank.

## Fora daqui
O rank 60/40 com lutas comuns (todas-as-lutas/02).
