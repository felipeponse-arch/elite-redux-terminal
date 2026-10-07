# 01 — Rank lido por rankDe (ADR-003)

Status: pronto-para-agente
Bloqueado por: nenhum

## O que entrega
Ficha, lista da Dex, plano do chefão e prompt da IA mostram a Nota, o Tier, o Potencial, a Viabilidade e o Rank por tipo da Dificuldade da run, lidos por uma função só. O dado do Rank não é mais reescrito depois da carga.

## Critérios de aceite
- [ ] Só o módulo do rank da run lê o dado do Rank diretamente (conferência da ADR-003).
- [ ] Trocar a Dificuldade muda a Nota exibida sem recarregar o save.
- [ ] Testes enxergam a Nota certa sem precisar carregar um save.
- [ ] Sabotagem que volta a reescrever o dado na carga é pega.
- [ ] ADR-003 marcada como implementada.

## Comentários
Origem: levantamento de dívida técnica e revisão de arquitetura de 07/10 (prioridades na conversa).
