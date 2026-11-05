# Sabotagem e rank fora do PC (TK-54)

Workflow: `.github/workflows/pesado.yml`. Só roda na mão; não gasta nada no PC.

## Como disparar
GitHub > Actions > "Pesado (sabotagem e rank)" > Run workflow (depois do push do arquivo). Ou pela linha de comando:
- `gh workflow run pesado.yml -f tipo=sabotagem -f fatias=8` (opcional `-f filtro="versao pipeline"`)
- `gh workflow run pesado.yml -f tipo=rank -f amostra=1`

## Entradas
- `tipo`: `sabotagem` ou `rank`.
- `fatias` (sabotagem): 1 a 20, padrão 8. As mutações vão em rodízio para as fatias, cada uma num runner próprio (limite de 6 h).
- `filtro` (sabotagem): prefixos de id separados por espaço; vazio = todas.
- `amostra` (rank): 1 espécie a cada N; 1 = rank completo.

## Resultado
Artefatos: `sabotagem-fatia-N` (log) e `sabotagem-logs` (junção); `rank-resultado` (`rank_v2_saida.json`, `rank_v2_relatorio.json`, `rank.log`).
O job final de sabotagem falha se qualquer fatia falhou. O rank não grava `data/species_rank.json`: baixe o artefato e confira antes de commitar.

## Limites
- Rank é um job só: a nota usa o peso de TODAS as espécies (iterado), então dividir por espécie mudaria o resultado.
- `ER_SEM_TS=1`: testes que dependem de TypeScript 5.9 ficam de fora no runner.
- Retenção curta (7/14 dias) por causa da cota de artefatos.
