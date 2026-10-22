# 04 — Membro que só brilha com item pode não entrar no time

Status: a-avaliar
Tamanho: M. Dono: engenheira-do-motor.
Origem: revisão do motor-item/01 (supervisor r1, 22/10/2026), não bloqueante.

O item é fechado DEPOIS da busca de membros (motorFecharItens). A busca compara candidatos sem item, então um Pokémon
que só fica bom com um item específico (ex.: Life Orb, item de tipo) pode perder a vaga. Avaliar: fechar item na
triagem dos candidatos (custo de tempo, ver motor-item/03) ou aceitar como limite documentado.
