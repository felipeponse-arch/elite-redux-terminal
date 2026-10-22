# 01 — Commit de nível 0 (ER_WIP) não pode esperar a vaga pesada

Status: resolvido (master cd8183f, 22/10/2026)
Prioridade: ALTA (usuário, 22/10/2026)
Tamanho: P.
Dono sugerido: qa-processo.

## Sintoma
Em 22/10, um `ER_WIP=1 git commit` no branch builds-2654 (nível 0: só `npm run check`) ficou na fila
"Aguardando vaga pesada: na fila atrás de pid 10376" por mais de 270 s, atrás das sabotagens de outro worktree
(lacunas-sem-codigo). O commit de doc no master também estourou a fila (1200 s).
Isso contradiz a regra de economia de 22/10 (memória feedback_economia_portao_e_agentes): o executor commita barato
com ER_WIP e o portão pesado roda uma vez, pelo verificador, antes da junção.

## Causa
`scripts/verificar.mjs:72` chama `await segurarVaga("pesada")` sempre, antes de olhar o nível
(o nível é calculado na linha 57).

## O que fazer
- Pedir a vaga pesada só quando o nível tiver etapa pesada (sabotagem, build ou navegador). Nível 0 (e nível 1 sem
  sabotagem) roda sem vaga.
- Master continua sempre nível 3 e com vaga (não muda).
- Teste unitário: nível 0 não chama segurarVaga; nível 2/3 chama. Sabotagem correspondente se a lista pedir.

## Critério de aceite
- Com outro processo segurando a vaga, `ER_WIP=1 git commit` de um arquivo em src/ fora do master termina sem esperar.
- Commit no master ainda espera a vaga e roda o portão completo.
