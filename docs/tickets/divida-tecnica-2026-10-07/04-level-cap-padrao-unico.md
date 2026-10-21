# 04 — Contexto da run: Level cap com padrão único

Status: resolvido (branch divida-04-05, commit "level cap: padrão único"): decisão do usuário 21/10: sem cap = 0 (sem limite) em capOuPadrao(); nivelDeCalculo() converte 0 em 100 (Champion passa de 50 para 100 em velocidade, editor e EVs)
Bloqueado por: 01

## O que entrega
Toda tela e toda regra usam o mesmo valor quando o Level cap não está definido, vindo de um só lugar (começo do módulo de contexto da run).

## Critérios de aceite
- [x] Levantar o efeito de cada valor usado hoje (50, 100, 0) e perguntar ao usuário qual vale.
- [x] Nenhum chamador escolhe o próprio padrão.
- [x] Teste que falha se algum chamador voltar a ter padrão próprio.
- [x] Ficha, editor de build, tela do chefão, validação e prompt concordam no mesmo cenário sem save.

## Comentários
Origem: levantamento de dívida técnica e revisão de arquitetura de 07/10 (prioridades na conversa).

- 08/10 (usuário): o Level cap continua como sempre foi: três tipos (Easy, More, Elite), cada um com o valor que está no código do jogo. Nada muda de valor.
