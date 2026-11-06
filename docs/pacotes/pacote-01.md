# Pacote 01 — Reestruturação e publicação (pesado: 3 a 4 dias)

Início: 06/11/2026 (sexta). **Fecha: terça 10/11/2026.** Estourou, fecha com o que estiver verde.

## Escopo (entra)
1. Corte da IA do app inteiro (branch `corte/sem-ia`).
2. Pipeline com no máximo 2 builds por Pokémon e estilo do time pela tag do rank (branch `corte/pipeline-2`).
3. Rank enxuto (29 chefões, uma nota por espécie) e incremental por impressão digital (branch `corte/rank-incremental`).
4. Testes rápidos/pesados, CI em dois jobs, sabotagem com cache versionado e orçamento (`ci/rapido`).
5. Junção no master, push para o repositório novo, GitHub Pages.
6. `dados-2654/10-fechamento-rank-e-publicacao` (a publicação em si).

## Fora do pacote (próximo pacote ou descarte, a conferir depois do corte)
- Provavelmente obsoletos com o corte: `motor-item/02` (prova de papel com item), `motor-item/03`, `motor-item/04`, `rank-percentil/01`, `rank-rapido/plano`, `pendencias-2026-10-07/08`, `divida-tecnica-2026-10-07/07-10` (registro de efeitos).
- Pacote 02 (mecânica, 2 dias): `mecanica-2026-10-22/04`, `oitavo-ginasio-dupla/01`, `dois-iguais/01`.
- `arquivos-grandes/01`: reavaliar depois do corte (o motor e o pipeline encolheram).
