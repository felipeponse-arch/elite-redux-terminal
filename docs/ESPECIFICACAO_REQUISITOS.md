# Especificação de Requisitos de Software — Elite Redux Terminal

Mantido pela equipe (Gerente + Arquiteta de Dados), formato conforme a disciplina de Engenharia de
Software (Capítulo 1, seção 1.4 — requisitos funcionais/não funcionais/regras de negócio; Capítulo 2,
seção 2.1 — elicitação e classificação). Documento vivo: toda funcionalidade nova ganha uma entrada
aqui antes de ser considerada "pronta", como parte do rito de publicação.

Convenção de escrita dos requisitos funcionais, conforme o material: `[Sistema] deve permitir que
[ator] [ação]`.

## 1. Requisitos funcionais

### 1.1 Dex (consulta de espécies)
- RF01 — O Terminal deve permitir que o jogador busque uma espécie por nome, entre as 1906 catalogadas.
- RF02 — O Terminal deve permitir que o jogador filtre a lista por tipo.
- RF03 — O Terminal deve permitir que o jogador ordene a lista por nome, número da Dex, qualquer stat
  base individual ou rank.
- RF04 — O Terminal deve permitir que o jogador veja, para qualquer espécie: stats base, tipos,
  habilidades escolhíveis reais, innates sempre ativas, linha evolutiva completa, movepool por nível e
  golpes de tutor.
- RF05 — O Terminal deve permitir que o jogador compare os stats/tipo/rank de duas espécies lado a lado.
- RF06 — O Terminal deve permitir que o jogador registre uma anotação de texto livre por espécie.
- RF07 — O Terminal deve permitir que o jogador navegue via teclado (setas, Enter, Esc, "/") entre os
  resultados da busca, sem depender do mouse.

### 1.2 Time e Caixa
- RF08 — O Terminal deve permitir que o jogador adicione até 6 espécies ao time.
- RF09 — O Terminal deve permitir que o jogador adicione qualquer número de espécies à caixa.
- RF10 — O Terminal deve permitir que o jogador troque um membro do time por um da caixa quando o time
  já estiver completo.
- RF11 — O Terminal deve permitir que o jogador veja a cobertura defensiva agregada do time atual
  (fraquezas/resistências por tipo, já considerando habilidades que alteram efetividade).
- RF12 — O Terminal deve permitir que o jogador salve até 3 configurações de time nomeadas, para
  carregar depois.
- RF13 — O Terminal deve permitir que o jogador desfaça a última alteração de time/caixa, consultando um
  histórico das últimas 5 mudanças.

### 1.3 Chefões
- RF14 — O Terminal deve permitir que o jogador busque, entre os 107 treinadores catalogados, um chefão
  por nome.
- RF15 — O Terminal deve permitir que o jogador veja o time de um chefão, incluindo variantes de
  dificuldade (Padrão/Insane/Hell) quando existirem.
- RF16 — O Terminal deve permitir que o jogador calcule os stats finais de cada membro do time do chefão
  para um nível escolhido, incluindo modificadores de item held quando aplicável.
- RF17 — O Terminal deve permitir que o jogador exporte um resumo (chefão + time próprio + caixa) pronto
  para colar em uma conversa com o Claude, pedindo estratégia.

### 1.4 Progresso e level cap
- RF18 — O Terminal deve permitir que o jogador registre a dificuldade atual (Easy/Ace/Elite) e o último
  badge conquistado.
- RF19 — O Terminal deve calcular automaticamente o level cap vigente a partir dessas duas escolhas.
- RF20 — O Terminal deve exibir um changelog em português das últimas funcionalidades entregues.

### 1.5 "Meu build" (montagem de set)
- RF21 — O Terminal deve permitir que o jogador monte um build (habilidade, nature, item, até 4 golpes,
  IVs, EVs) para qualquer espécie, restrito às opções realmente existentes para aquela espécie no jogo.
- RF22 — O Terminal deve permitir que o jogador salve até 3 builds distintas por espécie, alternando
  qual delas está ativa.
- RF23 — O Terminal deve exibir, para o build ativo, os stats finais calculados e o poder de cada golpe
  (com STAB e Life Orb quando aplicável), sem calcular efetividade de tipo ou dano final.
- RF24 — O Terminal deve permitir que o jogador copie, para o build de uma espécie, um set já visto em
  um chefão ou no histórico de builds da própria espécie.
- RF25 — O Terminal deve permitir que o jogador peça uma build gerada por IA para uma espécie, quando
  houver espaço sob o limite de 3.
- RF26 — Toda build gerada por IA deve ser validada contra os dados reais da espécie antes de ser salva;
  uma resposta que não corresponda a uma habilidade/golpe/nature real da espécie deve ser rejeitada.
- RF27 — O Terminal deve exibir, em destaque visual, a justificativa que acompanha uma build gerada por
  IA.
- RF28 — Ao gerar uma build por IA, o Terminal deve fornecer à IA o contexto de progressão restante do
  jogo (quais líderes de ginásio, membros do Alto Comando e o Campeão ainda faltam ser enfrentados),
  derivado exclusivamente do milestone/dificuldade já configurados pelo jogador na aba Progresso — sem
  introduzir nenhuma pergunta, campo ou interação nova para obter essa informação.
- RF29 — O nível usado para os cálculos de "Meu build" deve ser preenchido automaticamente a partir do
  level cap vigente, continuando editável para simulação manual.
- RF30 — O seletor de golpes de "Meu build" deve ocultar golpes de nível ainda não liberados pelo level
  cap vigente.

### 1.6 Auto-evolução
- RF31 — O Terminal deve evoluir automaticamente qualquer espécie do time ou da caixa cuja evolução por
  nível já esteja liberada pelo level cap vigente, encadeando quantas etapas o cap permitir de uma vez.
- RF32 — Ao evoluir automaticamente, o Terminal deve transferir a build e a anotação salvas para o novo
  nome da espécie.

### 1.7 Sincronização e persistência
- RF33 — O Terminal deve persistir todo o estado do jogador (time, caixa, builds, notas, configurações)
  localmente, sem exigir conexão.
- RF34 — Quando disponível, o Terminal deve sincronizar esse estado entre os dispositivos do mesmo
  jogador, avisando quando encontrar uma versão mais recente salva em outro aparelho.

### 1.8 Papel/arquétipo e velocidade (extensão do rank, 2026-09-11)
- RF35 — O Terminal deve calcular e exibir, para qualquer espécie, um ou mais papéis/arquétipos
  (Pivô/Tanque/Wallbreaker/Sweeper) e a divisão física/especial/mista do seu ataque, como sinal SEPARADO
  do rank geral (nunca fundido na mesma letra SS/S/A/B/C/D).
- RF36 — O rank geral e por estágio evolutivo deve incluir a velocidade base da espécie como um dos
  componentes ponderados do cálculo, refletindo o formato 1x1 do hack (quem ataca primeiro com mais
  força tende a vencer a troca).
- RF37 — Ao gerar uma build por IA, o Terminal deve fornecer à IA os golpes de prioridade que a espécie
  realmente aprende (nível ou tutor), para que ela avalie se vale a pena incluir um deles entre os 4
  golpes escolhidos.

### 1.9 "Como conseguir" e Dex sem sobrecarga visual (Fase 2, 2026-09-11)
- RF38 — Quando a espécie tiver ao menos um encontro roteirizado real (`SEnc` do dado bruto — inicial,
  lendário, fóssil, presente de NPC ou recompensa exclusiva do hack), o Terminal deve exibir na ficha da
  espécie uma frase curta e objetiva de "como conseguir" (ex: "Presente de NPC em Rota 101"), priorizando
  a forma mais específica quando existir mais de uma entrada. Espécies sem `SEnc` (captura selvagem comum)
  não exibem a frase.
- RF39 — A ficha de detalhe de uma espécie na Dex deve ser organizada em blocos recolhíveis (nativo
  `<details>`/`<summary>`), reduzindo a quantidade de informação visível de uma vez sem remover nenhum
  dado hoje exibido. "Auto Build" começa aberto por padrão (ação central do app); "Golpes", "Anotações
  e builds de referência" e "Comparar com outro Pokémon" começam fechados (consulta sob demanda),
  preservando totalmente a navegação por teclado. Correção 2026-09-11 (pedido do usuário): "Conhecer a
  espécie" deixou de ser um bloco recolhível — todo o seu conteúdo (stats base, habilidades/innates,
  linha evolutiva) fica sempre visível, sem opção de esconder.

### 1.10 Sinergia habilidade x movepool real (Fase 3, 2026-09-11)
- RF40 — Ao gerar uma build por IA, o Terminal deve fornecer à IA quais habilidades (escolhível ou
  innate) desta espécie realmente aumentam o poder de uma categoria de golpe (flag) ou de um tipo, E
  a espécie de fato aprende (nível ou tutor) pelo menos um golpe real dessa categoria/tipo — o "combo
  verdadeiro" entre habilidade e movepool, nunca uma associação genérica ("esta habilidade é boa")
  sem checar se o golpe correspondente existe de verdade no movepool da espécie.
- RN10 — Uma habilidade só entra na verificação de sinergia (RF40) quando a categoria de golpe que ela
  cita no texto real tem uma flag correspondente nos dados desta hack (`flagsT`) ou é um tipo de golpe
  real (`typeT`). Categorias citadas em texto de habilidade sem flag correspondente nesta hack (ex:
  "golpes de soco", "mordida/presa", "golpes cortantes" — Punch/Bite/Slicing não existem em `flagsT`
  aqui) ficam de fora da verificação e são reportadas como tal, nunca tratadas como combo confirmado
  por falta de dado pra verificar.
- RF41 — A mesma sinergia habilidade x movepool (RF40) deve aparecer visível na ficha da espécie na
  Dex, não só como contexto da geração de build por IA: cada card de habilidade (escolhível ou innate)
  com combo real confirmado mostra os golpes reais que se beneficiam, direto ao lado da descrição.

### 1.11 "Onde encontrar" — captura selvagem comum (2026-09-11)
- RF42 — Quando a espécie tiver pelo menos um encontro selvagem comum real (`locations.maps` do dado
  bruto — terra/água/pesca/rocha/oculto/árvore de mel, por mapa), o Terminal deve exibir na ficha da
  espécie uma frase curta com os mapas onde ela pode ser encontrada, priorizando os 3 primeiros mapas
  distintos e indicando quantos outros locais existem além desses. Esta informação é independente do
  "como conseguir" (RF38, baseado em `SEnc` — encontros roteirizados) e as duas frases coexistem
  quando a espécie tiver ambos os tipos de dado real.

### 1.12 Leitor de caixa para a próxima luta (2026-09-11)
- RF43 — O Terminal deve identificar a próxima luta de progressão que falta (líder de ginásio, Alto
  Comando ou Campeão, a partir do `milestone` já configurado em Progresso) e, quando a caixa tiver um
  Pokémon genuinamente mais seguro contra o movepool real do time desse chefão do que o melhor
  Pokémon já presente no time, exibir uma sugestão de troca em uma única linha no resumo do topo da
  Dex — nunca uma tela nova, nunca uma sugestão por cada um dos chefões restantes.
- RN11 — A sugestão de troca (RF43) é calculada SOMENTE em relação à próxima luta que falta, nunca
  projetando risco de lutas futuras além dela — decisão explícita do usuário ("a sugestão do time é
  sempre pensando no Boss seguinte e não no que pode acontecer antes dele"). O critério de segurança é
  determinístico (tipos de ataque reais do movepool do chefão vs. multiplicador defensivo real do
  candidato, incluindo habilidades já verificadas) — nunca simula dano nem uma batalha completa.
- RF44 — O Terminal deve permitir gerar, sob demanda (nunca automaticamente), uma leitura estratégica
  por IA para o time atual de até 6 Pokémon — papel de cada membro, ordem de entrada sugerida e o que
  fazer se o membro mais fraco cair — reaproveitando as mesmas ferramentas reais (rank, papel,
  sinergia, golpe de prioridade, chefões restantes) já usadas na geração de build por IA. A leitura só
  é recalculada quando a composição do time muda; até lá, o resultado já gerado é reaproveitado.
- RF45 — A ferramenta determinística de sugestão de troca (RF43) deve estar disponível tanto para a
  geração de build por IA (RF21-30) quanto para a leitura estratégica de time (RF44), como a mesma
  fonte de verdade — nunca duas implementações que possam divergir.

## 2. Requisitos não funcionais

- RNF01 — **Portabilidade**: o Terminal deve funcionar como um único arquivo HTML autocontido (Claude
  Artifact), sem dependências de servidor próprio.
- RNF02 — **Disponibilidade offline**: toda funcionalidade da seção 1.1 a 1.4 e 1.6 deve funcionar sem
  qualquer conexão externa — os dados do jogo vêm embutidos no arquivo.
- RNF03 — **Degradação graciosa**: funcionalidades que dependem de uma capability da plataforma (geração
  por IA, sincronização) devem informar claramente quando indisponíveis, nunca falhar silenciosamente.
- RNF04 — **Idioma**: toda a interface e as mensagens do sistema devem estar em português do Brasil.
- RNF05 — **Tema**: a interface deve se adaptar automaticamente a tema claro ou escuro do sistema do
  jogador.
- RNF06 — **Acessibilidade**: toda funcionalidade de navegação (Dex, Chefões) deve ser operável via
  teclado, com foco visível e semântica reconhecível por leitor de tela (padrão ARIA de listbox).
- RNF07 — **Integridade de dado**: o Terminal deve recusar-se a carregar (com mensagem clara de erro) se
  os dados do jogo não tiverem sido embutidos corretamente na publicação.
- RNF08 — **Fidelidade de dado**: nenhuma informação de jogo (stat, habilidade, golpe, item) exibida ou
  usada em cálculo pode ser inventada — toda ela deve vir do dado real extraído do NextDex oficial.

## 3. Regras de negócio (específicas do domínio Elite Redux)

- RN01 — O time do jogador tem no máximo 6 membros.
- RN02 — Cada espécie pode ter no máximo 3 builds salvas simultaneamente; exatamente uma delas é a
  "ativa" a qualquer momento.
- RN03 — A soma dos EVs de um build não pode ultrapassar 510, nem 252 por stat individual.
- RN04 — O level cap vigente é determinado pela combinação de dificuldade (Easy/Ace/Elite) e milestone
  de badge, conforme a tabela oficial do hack — não é um valor livre.
- RN05 — Só evoluções cujo requisito seja estritamente "por nível" (`EVO_LEVEL`/`EVO_LEVEL_MALE`/
  `EVO_LEVEL_FEMALE`) evoluem automaticamente pelo level cap; evolução Mega/Primal fica de fora dessa
  regra. Correção 2026-09-11: verificado nos dados brutos (`evoKindT`/`evolutions[].kd`, todas as 1906
  espécies) que este hack **não tem nenhuma evolução por troca, pedra ou amizade** — as únicas condições
  reais são nível (com ou sem trava de gênero) e Mega/Primal. A exclusão de troca/pedra/amizade citada em
  versões anteriores desta regra descrevia uma categoria vazia neste hack, não um caso real observado.
- RN06 — Uma build gerada por IA que não corresponda exatamente às opções reais da espécie (habilidade,
  golpe, nature) é descartada, nunca salva parcialmente incorreta.
- RN07 — Uma entrada de build já curada manualmente (`data/builds.json`) nunca é sobrescrita
  automaticamente por uma sugestão da IA ou do Especialista em Meta Pokémon.
- RN08 — O mapeamento de cada líder de ginásio para o milestone de badge que sua derrota concede segue a
  estrutura geográfica real desta hack (qual líder ocupa qual ginásio), verificada contra o campo `map`
  dos próprios dados de treinador — nunca assumida a partir do conhecimento genérico do Pokémon Emerald
  vanilla, mesmo quando os nomes coincidem.
- RN09 — A classificação de papel/arquétipo (RF35) usa definições de teoria competitiva pesquisadas
  (não inventadas) combinadas com dado 100% real desta hack (stats base, movepool de nível/tutor
  verificado golpe a golpe) — nunca uma lista de "papéis conhecidos" aplicada de memória. Todo corte
  numérico (percentil de bulk/ataque/velocidade) deve ser calibrado contra espécies reconhecíveis antes
  de confiar no resultado amplo, e um corte que falhe num caso conhecido (ex: Rotom-Wash não bater como
  Pivô) é motivo de ajuste, não de aceitar o resultado calado.

---

*Histórico: documento criado em 2026-09-10, retroativo — descreve o sistema como ele já existe hoje,
consolidando o que estava disperso em código e em memória de sessões anteriores. A partir de agora,
toda funcionalidade nova ganha sua entrada aqui como parte do rito de publicação, não depois.*
