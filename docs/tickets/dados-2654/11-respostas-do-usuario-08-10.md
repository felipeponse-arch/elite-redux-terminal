# 11 — Respostas do usuário às perguntas acumuladas (08/10)

Status: resolvido
Bloqueado por: nenhum (não mexe no dado do jogo; pode ir antes do 01)

## O que entrega
O app e os documentos passam a seguir as 13 decisões que o usuário tomou em 08/10 sobre as dúvidas levantadas nos tickets 02, 08 (pendências) e 17 da dívida técnica.

## Decisões
Textos:
1. Especificação: o RF85 (areia) passa a só apontar para `docs/decisoes_mecanicas.md`, sem número próprio.
2. Glossário: Hell continua como Dificuldade do jogo, com nota "o app só consulta, não simula".
3. Glossário: Level cap é uma escolha própria do jogador no jogo, separada da Dificuldade.
App:
4. Build da IA promovida pelo playtester (`ia-curada-playtester`) tem Confiança **consenso**.
5. Build de Mega cuja pedra ainda não foi liberada na Etapa: **bloquear** a geração (hoje só avisa).
6. Item que só sai mais tarde: o prompt da IA passa a dizer quais itens ainda não estão disponíveis (ela evita, mas pode usar com motivo).
7. Golpe-ponte (curada aplicada ao time): conferir o limite de 2 itens iguais e Choice com golpe de status, como na build da IA; violação vira aviso.
8. Heal Block do ginásio × Black Sludge: pesquisar no código oficial; só incluir se o jogo bloquear (registrar em decisoes_mecanicas).
9. Curadas do Discord com dado errado (Kleavor Redux Mega, Aggron Redux Mega, Grotom Kick; Arbok Mega sai com a 2.65.4): corrigir para a habilidade da forma e um EV válido, com nota do que mudou em relação ao Discord.
10. Leppa Berry continua fora da lista de itens da IA.
11. Modelagem: tirar o setup do rival continua custando o turno do melhor golpe (registrar como decisão do usuário).
12. Modelagem: na Inverse Room o chefão usa o golpe que a IA escolheria na maior parte dos turnos (registrar como decisão do usuário).
13. Builds dos vídeos (Mega Redux Garchomp com Swords Dance + Last Respects; Wooly Worm com Assault Vest) entram como 2ª Build da espécie, ao lado da curada do Discord.

## Critérios de aceite
- [ ] Cada decisão com teste quando muda comportamento (4-7, 9, 13) e sabotagem.
- [ ] 8 decidido com fonte do código oficial.
- [ ] 11 e 12 registrados em decisoes_mecanicas.md como "decisão do usuário, 08/10".
- [ ] Rank NÃO recalculado (fica para o dados-2654 10). Sem publicar.

## Comentários
Fora daqui: o bug do Solid Rock/Primal Armor (redução dupla em fraqueza 4x) é tratado à parte.
