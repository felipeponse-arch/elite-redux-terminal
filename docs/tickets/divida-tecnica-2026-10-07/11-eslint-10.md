# 11 — ESLint 10

Status: resolvido
Bloqueado por: nenhum

## O que entrega
As ferramentas de lint sobem para a versão principal nova (ESLint 10 e o pacote de regras dele), com a configuração ajustada.

## Critérios de aceite
- [x] npm run check passa.
- [x] Nenhuma regra de lint é desligada para fazer passar sem registrar o porquê.

## Comentários
Origem: levantamento de dívida técnica e revisão de arquitetura de 07/10 (prioridades na conversa).

Feito (08/10): eslint 10.12.0 e @eslint/js 10.0.1 (versões exatas). Nenhuma regra desligada. A regra nova `no-useless-assignment` (entrou no recommended do 10) acusou 2 casos em src/regras/duelo.js, ambos corrigidos no código: valor inicial de `planosQueValeram` nunca lido (virou `var planosQueValeram;`) e `x = f.match(...)` do Stakeout sem uso do resultado (virou `.test(f)`).
