# 01 — Raging Boxer contada duas vezes e revisão das habilidades de golpe duplo

Status: feito (aguardando juntar no master)
Bloqueado por: nenhum

## O que entrega
O motor lê o golpe duplo de cada habilidade como o texto do jogo diz. A Raging Boxer valia x1,4 em todos os golpes e mais x2 nos socos (x2,8 no soco); agora vale x1,4 só nos socos. A Raging Moth, que o motor ignorava, passa a valer x1,4 nos golpes de Fogo.

## Critérios de aceite
- [x] Raging Boxer: soco x1,4 (1º golpe 100%, 2º 40%), nenhum outro golpe muda.
- [x] Varredura de todas as habilidades com "hit twice" no texto: Parental Bond, Hyper Aggressive, Primal Maw, Dual Wield, Jackhammer e Ice Cold Hunter já estavam certas; Raging Moth estava ignorada.
- [x] Teste que reproduz o caso do usuário (Ledian) e 3 sabotagens.

## Comentários
Origem: o usuário testou no jogo (10/10/2026) o Mega Punch do Ledian (Raging Boxer, Iron Fist, Aerilate; Life Orb, Jolly, 154/150/99/73/143/189) contra o Ninetales de nível 55 da Meteor Falls: a calculadora do jogo mostra 78% a 93% do HP no 1º golpe; o motor dava 201% no golpe inteiro.
Fonte do jogo (er-repo, abilities.cc): Raging Boxer = 2º golpe a 0,4 nos golpes que o Iron Fist reforça; Iron Fist x1,3; o bônus da Aerilate (ateBoost) é x1,1.
Depois da correção o motor dá 101% no golpe inteiro (72% no 1º golpe) com a Life Orb.

### Ponto em aberto (regra do motor, NÃO mexida: perguntar ao usuário)
No código do jogo, a Aerilate (e as outras habilidades "ate": Pixilate, Refrigerate, Galvanize...) dão **STAB** ao golpe convertido (`ATE_ABILITY`: `.onStab = moveType == type`), mesmo que o Pokémon não seja do tipo. O motor não aplica esse STAB (`stabExtra` vazio). Com STAB e sem Life Orb, o 1º golpe do Ledian daria ~75% a 89%, bem perto dos 78% a 93% que o jogo mostrou. A confirmar com o usuário: a calculadora do jogo inclui a Life Orb?
