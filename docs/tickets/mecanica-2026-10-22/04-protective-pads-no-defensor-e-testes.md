# 04 — Protective Pads no defensor (lógica a mais) e testes de Pads/Klutz

Status: resolvido (feito em pacote/02-b, publicado em 07/11, commit 68d74d8)
Tamanho: P. Dono: engenheira-do-motor.
Origem: revisão do mecanica-2026-10-22/02 (supervisor, 22/10/2026), não bloqueante.

- `src/regras/duelo.js` (~1370 e ~2539) checa `def.it.semEfeitoContato` / `it.semEfeitoContato` do item do DEFENSOR. No jogo
  o Protective Pads só vale no ATACANTE (IsMoveMakingContact, battle_util.c:6579-6592). Provavelmente redundante (o
  atacante com Pads já sai com g.contato falso), mas pode estar dando efeito errado ao defensor: conferir e corrigir.
- Faltam testes: Protective Pads no atacante (sem reação de contato e sem Tough Claws, com Juggernaut mantido pelo
  contato cru) e Klutz anulando Punching Glove/Pads.
