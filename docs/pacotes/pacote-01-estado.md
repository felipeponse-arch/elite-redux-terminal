# Pacote 01 — estado em 06/11/2026 (fim do dia)

Branch de integração: `corte/integra` (worktree `.claude/worktrees/integra`). **Ainda NÃO está no master e NADA foi enviado ao GitHub.**
Motivo: o critério combinado (travas, rápidos, e2e, pesado e sabotagem sem falha real) não fechou na sabotagem.

## Verde (medido com a máquina livre)
- travas 20 s, rápidos 24 s (1235/1235), build 1 s, e2e 101 s (106/106), pesado 138 s (144/144).

## Aberto (sabotagem e cache)
- Cache `tests/.sabotagem_cache.json`: 561 entradas (54 marcadas `?pesado` = só os testes pesados pegam; a rodada semanal com `--com-pesados` confirma).
- **128 sabotagens ainda não rodadas** (orçamento acabou). Rodar de novo: `ER_SEM_TS=1 node tests/run_sabotage.mjs --orcamento=15` (retoma de onde parou; ~2 passadas).
- 3 entradas de `tests/unit/mutacoes.mjs` quebradas (ERRO: o trecho sabotado mudou): `habilidades-hyper-cleanse-fora-da-tabela` (o trecho sumiu de tipos.js), `versao-packed-ice-sem-imunidade`, `versao-lumberjack-volta-pelo-golpe`. Atualizar o trecho ou remover.
- 2 sem asserção: `duelo-sem-seguimento-de-categoria`, `gerador-ev-sem-formato` (este é de validacao_build_ia.js, o IA já saiu: provável remoção).
- Dívida conhecida (já antiga): `tests/sabotagem_conhecidas.json`.

## Depois que a sabotagem fechar (ordem)
1. Tirar a sabotagem do job `rapido` em `.github/workflows/ci.yml` (fica no workflow Pesado semanal).
2. `git -C ../publicar merge --ff-only corte/integra` (master).
3. Push só de `master` (o histórico já está com e-mail anônimo; conferir antes) e ativar o Pages (Settings → Pages → Source = GitHub Actions).
4. Rank oficial: `node scripts/calcular_rank_v2.mjs --gravar` (~22 min, uma vez) para criar `data/rank_medicao.json` e regravar `species_rank.json`. Só com OK do usuário.
