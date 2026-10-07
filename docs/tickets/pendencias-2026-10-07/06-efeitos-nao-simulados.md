# 06 — Golpes e habilidades que o motor ainda não simula

Status: resolvido
Bloqueado por: nenhum
Agentes: playtester-de-build, meta-pokemon

## O que entrega
Triagem dos 68 efeitos de golpe sem regra explícita e das habilidades da lista `project_habilidades_sem_regra` (Tag,
Spiteful, Symbiosis, Mental Pollution/Madness Enhancement...), mais Bad Luck (-5% de precisão) e Unown Revelation. Cada
um: modelar pelo código do jogo ou registrar "não modelado" com o porquê. O auditor (`auditoria_do_motor.test.mjs`)
passa a contar o campo `recuperaItem` do Retriever.

## Como verificar
Cada efeito modelado com teste + sabotagem; lista travada pelo teste do auditor atualizada.

## Comentários

07/10: triagem feita. O auditor lista 54 efeitos por nome, mas a maioria já é coberta por dado (recuo extra.rc, dreno, chance de status pela descrição) ou quase não é usada. Viraram tickets (escolha do usuário): 16 poder variável, 17 drench, 18 setup/troca forçada, 19 poder que cresce. Ficam NÃO modelados (motivo no auditor): hazard/Tailwind ao acertar (Stone Axe, Needle Arm, Bleakwind Storm), Defog, golpes de 0-3 usos, e as 9 habilidades de HABILIDADES_SEM_REGRA.
