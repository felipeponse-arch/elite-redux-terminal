---
version: 1
slug: "artifact-template-html"
primary_target: "artifact_template.html"
related_targets: []
---

# Surface brief — Elite Redux Terminal (app inteiro, modo Operate com momentos de Experience)

Escopo e modo: o app inteiro (Dex, Meu Time, PC Box, Chefões, Progresso, Mais). Modo Operate: o jogador completa uma tarefa (ver a ficha, montar o time, entender a luta que vem). Experience só na ficha do Pokémon e na tela do chefão, onde o artefato lidera.

Público, tarefa e prova: jogador de Elite Redux no meio de uma run, no celular ou no computador. Prova real: dados de `data/` (1940 espécies, 29 chefões, rank, level caps) e os sprites do jogo. Nada de depoimento ou número inventado. Restrição dura do dono: manter a densidade de informação.

Direção escolhida (travada pelo usuário em 07/11/2026): **A) Carteira de Treinador**.

## Direction contract

**WORLD.** O cartão de treinador e a caixa de insígnias da run. Material: aço azul-noite e papel de cartão plastificado; as 8 insígnias são esmalte metálico desenhado por nós em SVG (formas próprias, sem arte oficial da Nintendo). A cor de cada Etapa vem da sua insígnia; a cor de cada Pokémon vem do seu tipo (chip, barra, halo do sprite). Tipografia com ponto de vista: display largo e condensado para nomes e números de cartão, sans de interface compacta para dado, numerais tabulares para stats e notas. Cantos de cartão (raio pequeno, chanfro discreto), filetes de 1px, sem sombra difusa.

**FIRST VIEWPORT.** No topo, a fileira de 8 insígnias, acesas até a Etapa atual e com a próxima pulsando de leve; ao lado o nome da Etapa e o level cap. Abaixo, a Dex densa (lista à esquerda, ficha à direita). A ficha é um cartão: sprite grande sobre o halo da cor do tipo, nome em display, chips de tipo, as 6 barras de atributos com número tabular, a nota/tier como selo de cartão, e habilidades e golpes em módulos compactos. No celular, a fileira de insígnias encolhe para um indicador de Etapa e a ficha ocupa a tela, com as abas na base.

**VISITOR PATH.** Abre o app → vê em que Etapa está (insígnias) → busca ou toca um Pokémon → lê o cartão de relance (tipo, atributos, nota, papel) → "+ Time" → em Meu Time vê os 6 como cartões lado a lado, com estilo do time e papéis visíveis → em Chefões escolhe a luta que vem e vê o time dele contra o seu time sugerido e o veredito.

**SIGNATURE INTERACTION.** Tocar numa insígnia reconfigura o app inteiro para aquela Etapa (level cap, o que está liberado, o rank da Etapa), com o encaixe da insígnia (sobe e trava, 220 ms) e o resto do app mudando de estado sem recarregar. Com movimento reduzido, a troca é instantânea.

**CROSS-SURFACE REACH.** A mesma gramática em tudo: cartão para espécie, para membro do time e para chefão; chip de tipo e barra de atributo iguais em todo lugar; o selo de nota/tier é o mesmo componente; a insígnia da Etapa aparece como carimbo no canto de cada cartão que depende da Etapa; o aviso "estimado/não medido" usa sempre o mesmo carimbo.

**HONEST RISK.** Parecer "gamificado" demais e perder densidade; mitigação: cartões compactos, a fileira de insígnias é uma faixa baixa e a ficha mantém a quantidade de dado de hoje. Segundo risco: insígnia desenhada por nós pode ficar genérica; mitigação: 8 silhuetas distintas com a cor do tipo do ginásio.

seed: 6c29cfdb4a7ba6dc99a232b3897f52ce (direction, operate, índice 4 da lista própria)

Decisões em aberto: tipografia exata (precisa de fonte embutida em base64 no arquivo único); os 3 temas atuais (claro e dois escuros) continuam ou viram um tema escuro principal + claro; insígnias dos 8 ginásios (nomes e tipos a confirmar no dado dos chefões).
