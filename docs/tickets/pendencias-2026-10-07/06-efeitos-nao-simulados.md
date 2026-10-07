# 06 — Golpes e habilidades que o motor ainda não simula

Status: a-avaliar (grande: dividir em tickets menores depois da triagem)
Bloqueado por: nenhum
Agentes: playtester-de-build, meta-pokemon

## O que entrega
Triagem dos 68 efeitos de golpe sem regra explícita e das habilidades da lista `project_habilidades_sem_regra` (Tag,
Spiteful, Symbiosis, Mental Pollution/Madness Enhancement...), mais Bad Luck (-5% de precisão) e Unown Revelation. Cada
um: modelar pelo código do jogo ou registrar "não modelado" com o porquê. O auditor (`auditoria_do_motor.test.mjs`)
passa a contar o campo `recuperaItem` do Retriever.

## Como verificar
Cada efeito modelado com teste + sabotagem; lista travada pelo teste do auditor atualizada.
