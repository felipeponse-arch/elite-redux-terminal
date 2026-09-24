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

### 1.13 Reposição e limpeza da aba Time (Fase 1, 2026-09-11/12)
- RF46 — A leitura estratégica do time (RF44) deve aparecer como o PRIMEIRO item da aba Time, acima da
  lista de membros — nunca como o último item da página.
- RF47 — O Terminal NÃO deve manter histórico de saves anteriores nem oferecer desfazer uma alteração de
  time/caixa. (Revoga RF13 da especificação original — o usuário considerou a feature sem utilidade real
  e pediu remoção completa, não apenas ocultação.)
- RF48 — O Terminal NÃO deve oferecer exportação do time inteiro em formato Showdown como um card
  próprio. (Revoga a parte de RF17 relativa a exportação de TIME inteiro — a exportação de um set
  individual por espécie, usada em "Meu build"/histórico/referência de chefão, continua existindo e não
  é afetada por esta revogação.)

### 1.14 PC Box (Fase 2, 2026-09-11/12)
- RF49 — O Terminal deve exibir a caixa como uma grade paginada de até 30 slots por página, com
  navegação anterior/próxima, no formato visual de um jogo Pokémon real (slots de tamanho fixo,
  independente da largura da tela do jogador — nunca esticando para preencher o espaço disponível).
- RF50 — O Terminal deve permitir buscar por nome dentro da caixa, saltando automaticamente para a
  página e o slot correspondentes ao resultado, sem que o campo de busca perca o foco a cada tecla
  digitada.
- RF51 — Ao selecionar um slot preenchido da caixa, o Terminal deve exibir um painel de detalhe com:
  nome, rank, tipos, as habilidades escolhíveis e as innates da espécie (a mesma informação já exibida
  no card de cada membro na aba Time), e as ações de mandar para o time (ou trocar, se o time já estiver
  completo) e remover da caixa.

### 1.15 Rank robusto por simulação (Fase 3a, 2026-09-12)
- RF52 — O rank geral e por estágio evolutivo de uma espécie deve ser calculado com a simulação de
  defesa real contra os times de todos os chefões catalogados (incluindo variantes Insane/Hell) como
  sinal PRINCIPAL (peso 0,70), e uma composição ponderada de BST/habilidade/movepool real/qualidade de
  tipagem como desempate (peso 0,30) — substituindo o cálculo anterior baseado em uso-em-chefões e
  velocidade isolada (RF36, revogado por este). O resultado final é normalizado por percentil antes de
  ser convertido em tier (SS/S/A/B/C/D), nunca em valor absoluto direto.
- RN12 — Toda simulação de defesa (RF52) deve considerar o multiplicador de tipo já ajustado por
  habilidades reais que alteram efetividade (ex: Levitate anulando fraqueza a Ground), nunca a tabela de
  tipos pura — um cálculo que ignore isso classifica espécies com defesa real baseada em habilidade
  (ex: Probopass) de forma incorreta, achado e corrigido antes de publicar nesta mesma passagem.

### 1.16 Arquétipo do time: montagem, não rotulagem (Fase 3b, redesenhada 2026-09-12)
- RF53 — O Terminal deve permitir que o jogador escolha um Ritmo (Hyper Offense/Balance/Bulky
  Offense/Stall/Semi-Stall) e/ou um Clima (Sand/Rain/Sun/Snow/Trick Room) como alvo — dois eixos
  independentes, um time pode ser classificado nos dois ao mesmo tempo.
- RF54 — Com um alvo escolhido (RF53), o Terminal deve permitir gerar, sob demanda, uma proposta de até
  6 espécies — usando SOMENTE espécies que o jogador já possui (time + caixa combinados) — que formem o
  melhor time possível para aquele alvo, com justificativa em português. (Revoga a versão anterior desta
  feature, que apenas classificava o arquétipo do time JÁ montado sem sugerir uma composição melhor —
  considerada pelo usuário como não-acionável: "ele falar que eu tenho X do mesmo papel não me ajuda de
  forma objetiva".)
- RF55 — O Terminal deve permitir aplicar a proposta (RF54) com uma única ação, substituindo o time
  atual pela composição sugerida — quem sai do time volta para a caixa, nunca é descartado.
- RN13 — Toda espécie de uma proposta de time (RF54) deve ser revalidada contra o time/caixa REAIS do
  jogador tanto no momento em que a IA responde quanto no momento em que o jogador aplica a proposta
  (não apenas uma vez) — uma espécie sugerida que não exista mais no time/caixa do jogador nesse
  intervalo é descartada da proposta, nunca aplicada.

### 1.17 Leitura estratégica: caixa inteira e troca acionável (Fase 4, 2026-09-12)
- RF56 — Ao gerar a leitura estratégica do time (RF44), o Terminal deve fornecer à IA tanto o candidato
  determinístico para a próxima luta (RF43) quanto a visão da caixa inteira (cada membro com rank/papel/
  tipo reais), permitindo que ela proponha uma troca de encaixe geral para o time — não apenas para a
  próxima luta específica.
- RF57 — Quando a leitura estratégica (RF44) incluir uma troca sugerida, o Terminal deve exibir um botão
  que aplica essa troca diretamente — sujeito à mesma regra de revalidação no momento do clique descrita
  em RN13, aplicada aqui à sugestão de troca (não apenas à proposta de time inteiro).
- RF58 — Ao selecionar um Pokémon da caixa, o Terminal deve exibir, quando aplicável, uma nota indicando
  se aquele Pokémon resolve uma fraqueza de tipo que o time atual já compartilha — independente de qual
  seja a próxima luta.

### 1.18 Leitura estratégica de time — revogação (2026-09-18)
- RF44, RF45, RF46, RF56, RF57 e RF58 (seção 1.17, "Leitura estratégica: caixa inteira e troca
  acionável") são **revogados**. O card "Leitura estratégica" e o botão avulso "Montar melhor time"
  foram removidos do código no commit `e0b53f0` (2026-09-18), a pedido explícito do usuário: "nao
  temos mais que ter esses botoes eles nao fazem mais sentido" — "Gerar time completo" (RF54) já
  cobre composição de time + guia de uso numa ação só, tornando a leitura sob-demanda separada
  redundante. Esta revogação foi identificada como dívida documental pendente pela auditoria
  completa de 2026-09-23 (o requisito continuou descrevendo uma funcionalidade inexistente por 5
  dias sem nenhuma marca de revogação, diferente do padrão já usado em RF13/RF17/RF36).

### 1.19 Consolidação pós-12/09 — rank, Dex e build por IA (2026-09-18 a 2026-09-23)
Funcionalidades reais entregues depois da última atualização desta especificação (12/09), registradas
retroativamente pela auditoria de 2026-09-23 para fechar a lacuna. Convenção de escrita idêntica ao
resto do documento.
- RF59 — O Terminal deve permitir que o jogador veja a Velocidade real (sem EV, com 252 EV+nature e
  com Choice Scarf) de qualquer espécie e sua posição no ranking de Velocidade investida entre todas
  as espécies do jogo ("Speed Tiers"), destacando as linhas do tipo do arquétipo Monotype ativo.
- RF60 — O Terminal deve exibir um glossário de papéis (Pivô/Tanque/Wallbreaker/Sweeper) com exemplos
  reais de espécies para cada um, destacando os exemplos que combinam com o arquétipo ativo do time.
- RF61 — O editor "Meu build" deve exibir uma barra visual do orçamento de EVs (total já usado dos
  510 disponíveis) e avisos de eficiência de EV de HP para itens de recuperação por turno (Leftovers/
  Black Sludge) e de breakpoints de EV por nível, quando aplicável.
- RF62 — O Terminal deve calcular e exibir, para qualquer espécie, um rank relativo às demais espécies
  do(s) mesmo(s) tipo(s) dela ("Rank Monotype"), visível apenas quando o jogador tiver um arquétipo
  Monotype ativo — mesmo princípio do rank por estágio evolutivo (RF52), eixo de comparação diferente
  (tipo, não estágio).
- RF63 — Ao gerar uma build por IA para um membro do time, o Terminal deve informar quais itens,
  golpes e papéis já estão em uso por outros membros do time atual, para reduzir repetição
  desnecessária — item é regra dura (nunca repete), golpe e papel são preferência forte (pode repetir
  quando genuinamente a melhor opção, com justificativa na rationale).
- RF64 — O Terminal deve calcular e expor (na ficha da Dex e como ferramenta do gerador de build por
  IA) combos autossuficientes reais entre uma habilidade condicional (clima específico ou HP baixo) e
  um golpe que a própria espécie aprende para satisfazer essa condição sozinha, sem depender de outro
  membro do time.
- RF65 — O Terminal deve exibir, na aba Chefões, os buffs de líder de ginásio ainda ativos na luta
  atual ("Gym Skills"), permitindo ao jogador marcar quais já foram retirados vencendo os treinadores
  de apoio correspondentes.
- RN16 — Mega Evolução (temporária ou permanente) só conta como disponível para uso em batalha a
  partir da 4ª insígnia (Flannery) — antes disso, mesmo com a pedra/forma cadastrada, o Terminal não
  deve contar a forma Mega como opção de combate real.

### 1.20 Motor de confronto com o chefão (2026-09-24)
Origem: pedido do usuário de cobrir de forma abrangente "estratégias e sugestão de times e builds",
para o jogador ter vantagem contra qualquer chefão conforme o time e o momento do jogo, com o
**menor número possível de interações humanas** (sistema semi-automático).
- RF66 — O Terminal deve calcular, para qualquer chefão e o time atual do jogador, quem acerta quem:
  para cada par (Pokémon do time × Pokémon do chefão), o melhor golpe do jogador (multiplicador de
  tipo já ajustado pela habilidade e innates REAIS do Pokémon do chefão) e o golpe mais perigoso do
  chefão contra o jogador, classificando o duelo em vantagem / seguro / neutro / arriscado /
  desvantagem. Sem build salva o Terminal usa os tipos do próprio Pokémon como golpe presumido e
  marca o resultado como estimado. Pokémon de chefão que se transforma em Mega/Primal vale na forma
  nova (habilidade escolhível da forma nova é desconhecida no dado e não é inventada).
- RF67 — O resultado do confronto (RF66) deve aparecer **sem nenhuma ação do jogador**: como card
  "Confronto com o seu time" na ficha de qualquer chefão (quadro chefão × time, melhor resposta por
  Pokémon do chefão, buracos de cobertura, melhor abertura, ameaças) e como uma linha "Confronto" no
  resumo do topo da Dex para a próxima luta que falta (RN11 continua valendo: sem projetar lutas
  futuras). Batalha em dupla é tratada como 1x1 e o quadro avisa que o resultado é aproximado.
- RF68 — Quando o quadro de confronto (RF66) tem buracos (Pokémon do chefão que nenhum membro do time
  acerta super efetivo), o Terminal deve sugerir, sem ação do jogador, qual golpe que um membro do
  time já pode usar agora (level cap atual + tutor) fecha mais buracos (escolha gulosa), ignorando
  golpe já na build, de status, de poder < 50, de prioridade negativa, de precisão < 70 ou anulado
  pela habilidade do chefão.
- RF69 — O Terminal deve calcular o melhor time possível da caixa para o chefão (até 2 trocas, ou
  entrada em vaga livre), só sugerindo quando o ganho for real (limiar de 2 pontos, nunca troca
  lateral), e mostrar a troca na ficha do chefão e no resumo da Dex. A única ação do jogador é
  "Aplicar" (usa rosterMove: quem sai vai pra caixa, ninguém é apagado).
- RF70 — A ficha do chefão deve trazer, sem clique, um "Plano de luta": abertura (ou dupla de abertura
  contra os dois primeiros do chefão em batalha em dupla), a melhor resposta a cada Pokémon dele com a
  habilidade e o item reais (descrição do item no tooltip) e os golpes que mais ameaçam o time.
- RF71 — A ferramenta de IA `getNextBossRoster` deve dar ao gerador de build e ao de estratégias o
  elenco real da próxima luta (tipos, habilidade, item e golpes), os buracos do time e os golpes que
  os fechariam; os prompts pedem (preferência, não obrigação) que a build responda a uma ameaça concreta.
- RF72 — Ao avançar a insígnia no Progresso, o Terminal deve registrar sozinho no log "O que o app fez
  sozinho" que a luta anterior foi assumida como vencida, com o que o confronto via antes dela
  (nº de Pokémon sem resposta e de ameaças). Derrota não deixa rastro observável, então não existe
  registro de derrota; o bloco "Como melhorar este confronto" já responde a ela sem o jogador pedir.
- RF73 — O card "Prontidão do seu time" da ficha do chefão (só tipo, 2026-09-18) foi **fundido** no
  card "Confronto com o seu time": o lado defensivo virou a frase "ficam expostos ao que ele ataca"
  (membros em perigo contra metade ou mais do time do chefão, `confrontoTime().expostos`) e o lado
  ofensivo é o próprio quadro. A ficha não pode ter os dois cards.
- RF74 — "Novo jogo" **zera a run inteira**: time, caixa, arquétipo, registro de auto-evolução, buffs
  de ginásio já resgatados e a insígnia (volta ao início). Dificuldade, level cap e modo de Mega ficam
  (são opções de setup do jogo), mas a confirmação da run é pedida de novo (banner "Confira sua
  run"). Builds, anotações e times salvos continuam guardados. O botão só fica habilitado quando
  há algo da run pra zerar. Registra a ação no log "O que o app fez sozinho". (Revisa a versão de
  2026-09-13, que zerava só time e caixa e deixava o resto da run contaminar a nova.)
- RNF10 — **Lista da Dex em lotes**: a lista principal renderiza um lote (150 linhas) e o resto entra
  com a rolagem ou a seta pra baixo; busca, filtro e ordenação valem pra lista INTEIRA. Medido:
  reconstruir 1906 linhas custava ~30ms (o custo é o número de nós, não o conteúdo), um lote custa
  ~1,5ms.
- RF75 — O resumo do topo da Dex deve ser **compacto** (Time, Maior risco e uma linha da próxima luta com
  o botão "detalhes"), para nunca empurrar a busca pra fora da tela do celular. O detalhe (sugestão de
  troca por rank, melhor candidato da caixa, velocidade e o confronto inteiro) mora num card "Resumo da
  próxima luta" no FIM da aba Time (`#team-nextfight`). Origem: print do usuário, 2026-09-24.
- RN18 — **Trava de Mega nas sugestões**: antes da 4ª insígnia (Flannery) toda leitura do que o jogador
  PODE USAR passa por `battleFamilyOf`/`usableSpeciesFor`/`megaPromptBlock`: uma forma Mega já no
  time/caixa conta como a base dela, a sugestão de time por IA só recebe e só aceita formas base, os
  prompts de build/estratégia avisam que Mega ainda não existe e não listam "outras formas" mega, e a
  criatura Mega ganha a etiqueta "Mega só na 4ª insígnia". Depois de liberar, a família inteira vale.
  Origem: print do usuário (insígnia no 2º ginásio, "Altaria Mega" SS na caixa entrando na sugestão).
- RN19 — **Build salva sempre vale pra espécie atual**: quando uma build muda de espécie (auto-evolução ou
  regressão por level cap, RF32) e quando um save é carregado ou sincronizado, cada build é conferida
  contra os dados reais da espécie (`reconciliarBuild`): habilidade que a espécie não tem vira uma
  escolhível real (a de sinergia ativa com os golpes, senão a primeira), golpe que ela nunca aprende sai
  (golpe acima do level cap continua válido), a justificativa da IA que citava a habilidade antiga sai.
  A build nunca é apagada; cada ajuste vai pro log "O que o app fez sozinho" com o valor antigo. Origem:
  print do usuário (Haxorus com "Moxie", habilidade só do Axew/Fraxure). Medido: 583 dos 729 pares de
  evolução por nível deste hack mudam o conjunto de habilidades escolhíveis.
- RN17 — O motor de confronto não calcula dano nem compara Velocidade real: o nível do chefão não
  existe nos dados. Habilidades de chefão fora de `TYPE_MOD_ABILITIES` podem alterar o resultado e a
  interface declara essa limitação em vez de fingir certeza.
- RNF09 — **Semi-automático**: toda análise nova deve derivar do estado que o Terminal já conhece
  (time, builds, progresso, modo de Mega, dificuldade) e aparecer sozinha; ação do jogador só onde
  há efeito real a aplicar (ex.: trocar um membro) ou consentimento necessário (geração por IA).

- RNF11 — **Camada de ações** (refatoração fase 2, 2026-09-24): toda mudança de estado feita pelo
  jogador passa por `acao(telas, mudar)`, que grava o save UMA vez e redesenha cada tela afetada UMA
  vez (`TELAS`, em ordem fixa). Ações aninhadas viram lote (uma gravação no fim); `mudar()` que
  devolve `false` não grava nada; erro dentro dela não trava a camada. Tela escondida não é desenhada
  (a aba redesenha ao abrir; Chefões usa marcação de desatualizado). A ficha só é redesenhada quando a
  mudança é do Pokémon aberto (`"ficha:SNAME"`) e mantém a rolagem - redesenhar outra apagaria o que o
  jogador estiver digitando. Funções de desenho não têm efeito colateral: contadores, resumo da Dex e
  revisão automática de builds são disparados pela ação. Exceções deliberadas (gravam direto): carregar
  o save e aplicar o save de outro aparelho.

- RNF12 — **Regras fora da página** (refatoração fase 3, 2026-09-24): lógica que não lê nem desenha a
  página mora em `src/regras` e é testada no Node - save (`save.js`), builds salvas e evolução
  (`evolucao.js`), build mostrada (`builds.js`), chefões e confronto (`chefoes.js`), prompts e
  leitura das respostas da IA (`prompts_ia.js`). As regras dependem só de dados e constantes
  (`types/app-globais.d.ts` lista o que vem do template); a checagem de tipos acusa qualquer
  dependência nova.
- RNF13 — **Cliente único de IA** (refatoração fase 4, 2026-09-24): todo pedido ao modelo passa por
  `pedirIA()`: disponibilidade, nova tentativa com o motivo técnico da rejeição (o jogador vê o texto
  dele), ferramentas do app e tradução de erro (`sampleErrorMessage`). Os prompts são montados em
  `prompts_ia.js` a partir dos mesmos blocos (espécie, movepool, regras de papel, Mega, itens, time
  em uso) - build e Estratégias recebem as mesmas orientações. Erro do app ao aplicar a resposta é
  capturado em cada gerador; na revisão automática conta como tentativa (teto de 2).
- RNF14 — **Interface por área** (refatoração fase 5, 2026-09-24): o código de tela mora em `src/ui`,
  um arquivo por área (Dex, ficha, editor de build, time, caixa, chefões, progresso, IA etc.),
  encaixado no template pelo build. Cada área tem um ouvinte de eventos único no seu contêiner,
  ligado uma vez (delegação) - nenhum desenho religa ouvintes. Funções que montam telas grandes
  (ficha, card do chefão, geração de build por IA) são divididas em partes nomeadas. Testes nunca
  clicam num nó já substituído por um redesenho: buscam o elemento de novo, como o jogador faria.
- RNF15 — **Testes de navegador num runner só** (refatoração fase 6, 2026-09-24): todo teste que
  precisa do app aberto roda no `@playwright/test` (`playwright.config.mjs`, `tests/e2e/`), que
  sobe sozinho o servidor de testes (`scripts/servidor_estatico.mjs`). Cada seção da suíte roda
  sozinha em navegador limpo, mais a sequência completa numa página; cenários que precisam de
  recarga (save órfão, template sem build, filtros da Dex, sincronização na carga) são testes
  automáticos, não trechos pra colar à mão. Erro não tratado na página reprova o teste. Falha
  guarda print e trace; o relatório HTML sai em `playwright-report/`. `npm run test:e2e` bloqueia
  commit e CI; `npm run test:visual` compara com `tests/visual_baselines/` (informativo no CI).
- RNF16 — **CSS por área e com travas** (refatoração fase 7, 2026-09-24): o CSS mora em `src/css`
  (tokens, base, campos e um arquivo por área), colado pelo build no `<style>` na ordem original da
  cascata. Cores, raios e sombras só por token (`tokens.css`); `npm run check` roda o stylelint
  (sintaxe - um comentário quebrado não descarta mais uma regra em silêncio) e `checar_css.mjs`
  (as duas cópias da paleta escura idênticas, os três temas com o mesmo conjunto de cores, todo
  `var(--x)` declarado). Campo de formulário usa a classe `.campo` + um tamanho (`campo-busca`,
  `-texto`, `-ajuste`, `-filtro`, `-numero`) e a fonte do app - um teste percorre as abas e reprova
  campo fora disso. A regressão visual cobre claro, escuro, alto contraste e celular; com
  `VISUAL_EXATO=1` exige zero pixel diferente (prova de refatoração sem mudança visual).
- RNF17 — **Build e verificação independentes de sistema** (refatoração fase 8, 2026-09-24):
  `npm run build` (`scripts/build.mjs`) valida os dados (`scripts/validar_dados.mjs`) e monta o
  `artifact_final.html`; `npm run verificar` (`scripts/verificar.mjs`) roda travas, unitários,
  sabotagem, build e testes de navegador - é o que o hook de pre-commit e o `prepare_publish`
  chamam. Tudo em Node: o CI roda em Linux. Só a extração do dado bruto do jogo (rede, rara)
  continua em PowerShell (`scripts/build.ps1`), que termina chamando o mesmo `build.mjs`.
- RNF18 — **Primeira pintura sem depender de rede externa** (refatoração fase 8, 2026-09-24): a
  folha do Google Fonts não bloqueia a renderização (carrega com `media="print"` e é ligada ao
  terminar; `display=swap`). Medido: com as fontes levando 1,5 s, a primeira pintura caiu de
  1.728 ms para 108 ms. `tests/e2e/desempenho.spec.mjs` atrasa as fontes em 3 s e reprova se a
  primeira pintura esperar por elas.

### Build que acompanha o jogador e banco de builds (2026-09-24)

Pedidos do usuário: "montamos uma build no cap 18; no próximo cap ele pode aprender golpes melhores pra
build que já montamos - o jogo pode atualizar a build"; "ao evoluir o kit muda"; "toda build gerada por
IA pode ser considerada curada... o Playtester faz a curadoria... pra economizar chamadas de IA"; até 3
builds curadas por espécie, uma por papel, só dos papéis que o jogador já pediu. Medido nas 138 curadas
(sem Mega): a cada degrau de cap entre 18 e 70, 17% a 46% das espécies destravam um golpe do set ideal.

- RF76 — **Plano de golpes**: toda build pode ter um `plano` { golpe de agora → golpe que entra depois }.
  Quem escolhe a troca é quem montou a build (a IA ou a curadoria) - nunca uma regra fixa ("golpe mais
  forte" errou 19 de 24 trocas no estudo). O app só calcula QUANDO o golpe libera (`golpesNoCap`,
  `src/regras/plano_build.js`) e deriva os golpes na hora de mostrar (`effectiveBuild`). O que está
  salvo nunca é regravado: se o cap descer, a troca volta sozinha. O card mostra "Já liberado" e
  "Próximas trocas"; toda troca que entra ou volta com a mudança de cap vai pro log "O que o app fez
  sozinho" (só membros do time).
- RN20 — **Plano válido**: o destino precisa ser um golpe de NÍVEL que esta forma aprende acima do cap
  atual e antes do nível em que ela evolui sozinha (680 de 729 pré-evoluções têm golpe assim); golpe
  de tutor ou já liberado não entra (devia estar na build agora); um destino por golpe. Passo inválido
  sai com o motivo, a build nunca é rejeitada por causa do plano (`validarPlano`).
- RF77 — **Geração por IA com plano**: o prompt de build recebe os golpes futuros da forma com o nível
  e pede o campo `plano`. Build à mão (ou set de Estratégias escolhido) sem plano e com golpe por
  liberar pede só o plano, numa chamada curta sem ferramentas; editar a build mantém o plano dos golpes
  que continuam nela.
- RF78 — **Revisão automática** (sem clique): na evolução pra frente a build ativa é marcada; com a
  curada da forma nova no estilo do time e sem golpe travado, troca pela curada sem IA; senão a IA
  revisa mantendo o papel (a build anterior vai no prompt). Membro do time sem build própria cuja curada
  tem golpe travado ganha uma "build-ponte" (a curada com golpes liberados agora e plano até os dela).
  Custo limitado: só membros do time, uma chamada por vez, no máximo 3 por abertura, 2 tentativas por
  build, e só roda se a IA já estiver liberada pelo jogador (nunca abre o pedido de consentimento sem
  clique). O card mostra "revisão pendente"/"atualizando…".
- RN21 — **Mega usa a build da base**: a Mega é a mesma criatura, com os mesmos golpes (293 de 303 Megas
  têm movepool idêntico à base). Sem build própria, a Mega herda a build da base ajustando só o que
  não existe nela (a habilidade, na maioria) - sem IA.
- RN22 — **Estilo da build**: ofensivo / equilibrado / defensivo, calculado pelos EVs (ataque+SpA+Spe
  ≥ 400 ofensivo; HP+Def+SpD ≥ 400 defensivo; senão equilibrado - nas 189 curadas: 105/51/33). O
  estilo que o time pede vem do Ritmo do arquétipo (Hyper/Bulky Offense → ofensivo; Stall/Semi-Stall →
  defensivo; resto → equilibrado). A curada mostrada é a do estilo do time; sem ela, a primeira.
- RF79 — **Banco de builds curadas**: `data/builds.json` aceita até 3 builds por espécie (lista), no
  máximo uma por estilo (`scripts/validar_dados.mjs` trava no build). Uma build de IA NÃO vira curada sozinha - ela é
  montada pro contexto daquele momento e a validação do app só confere se é legal, não se é boa. O
  Playtester roda `node scripts/playtester_curadoria.mjs <save.json>` sobre o save sincronizado:
  checklist mecânico (mesma `validateAiBuild` do app sem cap, plano aprendível, estilo ainda não coberto,
  não repete uma curada) e, depois do julgamento dele, `--promover SNAME#n` grava com fonte
  `ia-curada-playtester`, estilo e plano. A justificativa da IA é copiada como nota, nunca interpretada.
- RF80 — **Sets de Estratégias guardados**: vão pro save (e pro sync) com cap, versão dos dados e data;
  recarregar não paga outra chamada. Versão dos dados diferente descarta; teto de 60 espécies.
- RN23 — **Build acompanha a criatura sem perder nada**: destino sem build recebe a lista inteira;
  destino com build recebe as que chegam como variantes extras (sem trocar a ativa) até 3, o resto fica
  na origem. Quando o ajuste da evolução muda algo, a versão anterior fica guardada (`anterior`) e volta
  inteira se a criatura regredir (cap desceu). Ajuste feito num save vindo de outro aparelho é gravado e
  devolvido pro sync.

**Nota da auditoria de 2026-09-23**: a numeração de Regras de Negócio pula de RN13 (seção 3) direto
para RN15 — não existe RN14 em nenhuma versão deste documento. Não confirmado se é uma regra perdida
numa edição anterior ou renumeração deliberada; fica registrado aqui para quem for investigar depois.

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
- RN15 — Uma mesma espécie nunca está no time E na caixa ao mesmo tempo — adicionar ao time remove da
  caixa (e vice-versa) sempre pela mesma rotina de mutação (`rosterMove`), nunca por uma escrita direta
  que ignore esse invariante. Achado real em revisão de código, 2026-09-12: o botão "Adicionar à caixa"
  da ficha da Dex só verificava se a espécie já estava na caixa, nunca se já estava no time — corrigido.

---

*Histórico: documento criado em 2026-09-10, retroativo — descreve o sistema como ele já existe hoje,
consolidando o que estava disperso em código e em memória de sessões anteriores. A partir de agora,
toda funcionalidade nova ganha sua entrada aqui como parte do rito de publicação, não depois.*
