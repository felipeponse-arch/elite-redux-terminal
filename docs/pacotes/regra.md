# Regra dos pacotes (usuário, 06/11/2026)

Lema: **eficiente, rápido, baixo custo. Depois, qualidade.**

- **Pacote** = lote de tickets que sai junto numa publicação. Teto de **2 dias**; pacote pesado, **3 a 4 dias**. Acabou o prazo, fecha.
- **O que não cabe sai do pacote** (vai para o próximo ou é descartado). O prazo nunca estica; o escopo encolhe.
- Um pacote por vez. Cada ticket tem dono, prazo e critério de pronto. Sem ticket "para sempre em andamento".
- Qualidade premium (AAA) dentro dos loops do projeto: supervisor e gerente validam antes de o usuário ver. Não chegou lá no loop: devolve ao usuário com o que travou, não insiste.
- Cada rodada de teste ≤ 60 min, com `timeout`. Estourou: para, salva o que fez, avisa.
- Só se recalcula o que mudou (rank por impressão digital da espécie; sabotagem `--mudados`/`--desde`). Paralelismo só no que for grande.
- Publicar é o fim do pacote: `master` verde, push, Pages. Nada fica "quase pronto" de um pacote para o outro.
