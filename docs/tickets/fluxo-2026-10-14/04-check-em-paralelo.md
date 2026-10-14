# 04 — `npm run check` em paralelo

Status: feito
Bloqueado por: nada

## O que entrega
- `scripts/checar_paralelo.mjs`: roda as 7 etapas do antigo `check` ao mesmo tempo (sem shell, `node` + bin direto, funciona no Windows) e mostra os resultados na ordem antiga. Toda falha aparece (inclusive falha dupla) antes do código 1; etapa que não inicia ou morre por sinal conta como falha. Ctrl+C/SIGTERM mata os filhos. Exporta `executarChecagens(etapas, opcoes)` (função pura, lista e resolvedor injetáveis) e `ETAPAS`.
- `package.json`: `check` chama o script; `check:serie` guarda a cadeia antiga com && (comparação e fallback); `check:fronteira` como atalho.
- `tests/unit/checar_paralelo.test.mjs`: etapas falsas (sucesso, falha única, falha dupla, ordem, paralelismo, stderr, executável inexistente, sinal) e a lista real IGUAL à cadeia antiga.

## Medição (6 núcleos, `npm run check --silent`, 3 execuções cada)
- Série (master): 12,50 s / 12,34 s / 12,28 s.
- Paralelo: 7,06 s / 7,19 s / 7,10 s.
- Ganho: cerca de 5,2 s por execução (42%).

## Critérios de aceite
- [x] As 7 etapas, mesmos comandos e argumentos (teste compara com a cadeia antiga).
- [x] Falha em qualquer etapa sai com código 1; falha dupla mostra as duas (verificado também com CSS e JS quebrados de verdade).
- [x] Ganho maior que 15%.

## Comentários
- Risco residual: com várias etapas pesadas juntas a máquina fica ocupada por ~7 s (o `pesado` do gancho não se aplica ao `check`).
- Diferença de comportamento: a série parava na primeira falha; o paralelo mostra todas.
