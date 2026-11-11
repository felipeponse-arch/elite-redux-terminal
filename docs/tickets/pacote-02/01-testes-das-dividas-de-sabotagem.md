# Testes das dívidas de sabotagem (regra de jogo sem teste que falhe por asserção)

Status: resolvido (feito em pacote/02-a, publicado em 07/11, commit 68d74d8)
Pacote: 02 (mecânica, 2 dias). Prioridade: o veredito da luta primeiro.

Origem: `tests/sabotagem_conhecidas.json` (06/11/2026). Três ids tocam regra de jogo e hoje nenhum teste falha por asserção quando o código é sabotado:
1. `veredito-luta-vence-sem-vencer` (src/regras/chefoes.js): o veredito da luta declara vitória sem vencer. O teste que protegia saiu junto com a IA.
2. `duelo-sem-seguimento-de-categoria` (src/regras/duelo.js): Chunky Bass Line, Two Step e Aftershock deixam de somar o golpe de seguimento (a sabotagem quebra por TypeError).
3. `golpe-hammer-arm-sem-queda`: Hammer Arm não baixa a própria Velocidade.
Os outros 2 (`loteB-estrategia-sem-armador`, `gerador-ev-sem-formato`) são de caminhos que perderam o teste com o corte da IA; reavaliar se o caminho ainda existe.

Pronto quando: cada id tem um teste unitário rápido (<2 s) que FALHA com asserção quando a sabotagem é aplicada, e o id sai da lista de dívida.
