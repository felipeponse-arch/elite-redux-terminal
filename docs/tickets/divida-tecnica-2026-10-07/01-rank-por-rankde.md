# 01 — Rank lido por rankDe (ADR-003)

Status: pronto-para-agente
Bloqueado por: nenhum

## O que entrega
Ficha, lista da Dex, plano do chefão e prompt da IA mostram a Nota, o Tier, o Potencial, a Viabilidade e o Rank por tipo da Dificuldade da run, lidos por uma função só. O dado do Rank não é mais reescrito depois da carga.

## Critérios de aceite
- [x] Só o módulo do rank da run lê o dado do Rank diretamente (conferência da ADR-003).
- [x] Trocar a Dificuldade muda a Nota exibida sem recarregar o save.
- [x] Testes enxergam a Nota certa sem precisar carregar um save.
- [x] Sabotagem que volta a reescrever o dado na carga é pega.
- [x] ADR-003 marcada como implementada.

## Comentários
Origem: levantamento de dívida técnica e revisão de arquitetura de 07/10 (prioridades na conversa).
Feito (08/10): `rankDe(sname)` em rank_da_run.js lê a Dificuldade de `state.settings.difficulty` a cada chamada (cache por Dificuldade); SPECIES_RANK não é mais reescrito e `aplicarRankDaDificuldade` foi removida. Prova de rank idêntico: dump de `SPECIES_RANK` (1591 espécies x Fácil/Ace/Elite + fora do rank) no master pelo caminho antigo e de `rankDe` aqui têm o mesmo sha256 (9ad01a3d3c586e25), data/ sem diff. Rank NÃO foi recalculado.
