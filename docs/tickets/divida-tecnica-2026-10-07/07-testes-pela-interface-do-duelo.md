# 07 — Testes e sabotagens pela interface do duelo

Status: pronto-para-agente
Bloqueado por: nenhum

## O que entrega
Cenários de duelo (espécie, habilidade, golpe → veredito e dano) testados pela entrada pública do duelo e da luta contra o chefão, para que uma refatoração interna não quebre a suíte.

## Critérios de aceite
- [ ] Os testes que hoje chamam funções internas do duelo e cobrem comportamento de efeito ganham cenário equivalente pela interface pública.
- [ ] Sabotagens do duelo ganham versão que não depende do texto exato do código, onde der.
- [ ] Testes internos ficam só para fórmulas.
- [ ] Nenhuma regra de mecânica muda.

## Comentários
Origem: levantamento de dívida técnica e revisão de arquitetura de 07/10 (prioridades na conversa).
