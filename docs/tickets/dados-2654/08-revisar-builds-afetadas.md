# 08 — Revisão das builds afetadas

Status: pronto-para-agente
Bloqueado por: 02, 03, 04, 05, 06, 07

## O que entrega
As builds curadas que dependem de algo cujo efeito mudou (status base, golpe, habilidade, item, sono/paralisia) são revisadas, e o jogador não recebe build que piorou sem aviso.

## Contexto
Decisão do usuário (07/10): revisar SÓ as builds tocadas por mudança de efeito; não as 158 que o diff marca (a maioria é só movepool por nível ou texto). Mostrar a lista ao usuário antes de mexer.
Exemplos prováveis: sets com Protect/Detect/King's Shield (5 PP), Blizzard/Fire Blast (20%), Friend Guard, Arbok, Roserade, Serperior Mega.

## Critérios de aceite
- [ ] Lista das builds afetadas, com o motivo de cada uma, aprovada pelo usuário antes das mudanças.
- [ ] Cada build revisada pelo playtester-de-build; material passa pelo supervisor (Gauntlet).
- [ ] `npm run verificar` limpo.
- [ ] Rank NÃO recalculado. Sem publicar.

## Comentários
