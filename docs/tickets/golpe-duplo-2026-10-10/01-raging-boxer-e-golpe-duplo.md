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

### Calibração com a calculadora do jogo (10/10, prints do usuário)
Ledian nível 55 (Jolly, EVs 84/172/252, Life Orb) contra o Ninetales: jogo x motor (1º golpe, média da faixa).
- Mega Punch: 78%-93% (60%-72% sem Life Orb). Motor depois do ticket: 85,6%.
- Aerial Ace: 58%-69%. Motor: 62,4%.
- Insect Impact: 16%-19% (12%-15% sem Life Orb). Motor: 20,7% (~10% acima do teto). A tela do golpe no jogo confere com o dado (BP 80, precisão 100, 30% de baixar a Defesa, contato, Iron Fist boost), então não é o poder: causa ainda desconhecida, sem efeito grande.
- A hipótese de STAB do Aerilate (código do er-repo) NÃO fecha com o jogo (daria 98%+); o que fecha é x1,3 no golpe convertido ("empoderado"). Corrigido (antes x1,1).
- Efeito prático: Mega Punch inteiro (1º golpe 78%-93% + 2º golpe a 40%) = 109%-130% do Ninetales: derruba no mesmo turno, se o Ledian agir.

### Pendências
- Insect Impact: ~10% acima da calculadora; BP conferido (80). Investigar só se outro dado do jogo apontar o mesmo desvio em golpe de soco.
- Queenly Majesty no duelo 1x1: a calculadora do jogo já mostra "imune" a golpe de prioridade; o motor 1x1 não aplica (só a simulação em dupla).
- Fake Out do Shiftry (prioridade +3) faz o Ledian recuar antes de agir: o motor 1x1 não vê dupla.
