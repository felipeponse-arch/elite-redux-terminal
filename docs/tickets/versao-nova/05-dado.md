# v05 — Dado da versão mais nova (d1a9a4c): PARCIAL

Status: **parcial** (branch `versao-05-dado`, empilhada em `versao-04-parser`, sem merge, sem PR). Entregue o que roda neste ambiente; a troca do dado em si está **bloqueada** (ver abaixo e `estado.md`).
Tamanho: G
Bloqueado por: v04
Autorização: Felipe, 15/10/2026 (fila v01–v05; `docs/tickets/dados-2654/01` com o limite da versão nova).

## Entregue
1. **Chefões contra o TrainerList `d1a9a4c`**: `scripts/conferir_chefoes_config.mjs --aplicar-tudo` (função `corrigirTimes`) troca no `bosses.json` o mon inteiro que a config diz diferente; mon igual não é tocado; o que não tem par no dado do app dá erro, não palpite. Rodado contra o `TrainerList` de `d1a9a4c`: as **6 diferenças** (Matt Mt Pyre Insane 6 e Matt Insane 6 viram Starmie com Starminite; Matt Padrão 6 leva Barbaracite; Drake Padrão 2 com Hustle; Drake Padrão 6 Modest com EVs de especial; Archie Mt Pyre Insane 6 com Rain Shroud) e depois **`diferenças: 0`**. Teste: `tests/unit/chefoes_pela_config_nova.test.mjs` (4 testes); 4 sabotagens `versao-chefao-*` em `bosses.json`.
2. `golpes_flags_config.json` e `itens_config.json`: **já estavam em `d1a9a4c`** (os geradores da calibração 01/02 rodaram contra o clone atual da `er-config`); regerados de novo agora, **0 diferenças**. Nada a trocar.
3. A comparação dos chefões passou a mirar a config mais nova (comentário do script), em vez do commit `7be1617`.

## NÃO entregue (e por quê)
- **Trocar o dado (`gameData_265beta.json` -> NextDex 2.65.4)**: os scripts que extraem o dado (`transform.ps1`, `extract_bosses.ps1`, `slim_dex.ps1`, `compute_*.ps1`: 23 scripts PowerShell, 3.061 linhas) usam `System.Web.Script.Serialization.JavaScriptSerializer`, que só existe no Windows PowerShell 5.1. Instalei o PowerShell 7.4.6 (Linux) aqui para tentar e `transform.ps1` falha (`0 species, 0 abilities`, "Cannot index into a null array"). Não há Windows neste ambiente. O branch `dados-2654` (dado baixado e caminhos) também não está no GitHub.
- Também medi que **808 índices de espécie mudam** (a partir do 1099, onde entram as espécies novas): tudo que guarda índice de espécie tem de ser regerado junto (bosses, dex_compact, builds, rank). Habilidades: 29 novas no fim (1034–1062) e 13 renomeadas no mesmo id; golpes: mesmos 1032; itens: 929.
- Eviolite (item 0), Arbok Mega fora, renomeações (Keen Edge -> Sharpness etc.), "onde achar itens": dependem da troca do dado.
- O portão de texto para a troca já existe (v04): `node scripts/medir_texto_novo.mjs <gameData novo>`.

## Para destravar (decisão da Construção/Felipe)
(a) rodar os `.ps1` no Windows e trazer o resultado, ou (b) portar os scripts de extração para Node (~3.000 linhas de PowerShell; o `build.mjs` já é Node), com teste de equivalência: gerar o `dex_compact.json` atual a partir do dado atual e exigir byte a byte antes de trocar o dado. Recomendação: (b), um ticket só para o porte. Ver `perguntas.md` P3 e `estado.md`.

## Rank
Não recalculado. O `build.ps1` completo chamaria `calcular_rank_duelo.mjs --gravar`; nenhum passo de rank foi rodado.
