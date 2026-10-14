# Especificação de Requisitos de Software — Elite Redux Terminal

Mantido pela equipe (Gerente + Arquiteta de Dados), formato conforme a disciplina de Engenharia de
Software (Capítulo 1, seção 1.4 — requisitos funcionais/não funcionais/regras de negócio; Capítulo 2,
seção 2.1 — elicitação e classificação). Documento vivo: toda funcionalidade nova ganha uma entrada
aqui antes de ser considerada "pronta", como parte do rito de publicação.

Convenção de escrita dos requisitos funcionais, conforme o material: `[Sistema] deve permitir que
[ator] [ação]`.

**Estado deste documento (2026-10-14, acréscimos RF115 a RF117, RNF29 e RN25 sobre a base de 2026-10-08):** descreve o app como está no `master` (commit `abf2b8a`), com os
dados do jogo na versão 2.65beta (dado de 28/03/2026). A versão 2.65.4 do NextDex ainda não entrou no
`master` e não é descrita aqui (decisão do usuário de 07/10, linha "Versão do jogo" em
`docs/decisoes_mecanicas.md`).

**Vocabulário:** os termos de `GLOSSARY.md` valem em todo o texto: Dificuldade, Variante do chefão, Etapa,
Insígnia, Level cap, Build, Build ativa, Build anterior, Origem da build, Confiança, Aviso de build, Rank,
Nota, Tier, Potencial, Viabilidade, Rank por tipo, Fora do rank e Marca. Nomes de campo e de arquivo do
código aparecem entre crases. Os requisitos antigos mantêm o texto da época; só o vocabulário foi ajustado
ao glossário quando isso não muda o sentido.

**Estado de cada requisito:** requisito que deixou de valer NÃO é apagado: fica no texto marcado
`[SUBSTITUÍDO por ...]` ou `[REVOGADO por ...]`; o que mudou só em parte leva `[REVISADO ...]`. A seção 0
lista todos.

**Mecânica do jogo:** este documento não define regra de golpe, habilidade, item nem batalha. Todo requisito
que depende de mecânica aponta para a linha correspondente de `docs/decisoes_mecanicas.md`, o registro único,
que manda sobre qualquer texto daqui. Decisão de arquitetura: `docs/decisoes_arquitetura.md`.

## 0. Requisitos substituídos, revogados ou revisados

| Requisito | Estado | Por quê / por quem | Desde |
|---|---|---|---|
| RF13 | Revogado | RF47 (desfazer removido a pedido do usuário) | 2026-09-12 |
| RF17 | Substituído em parte | Time inteiro em Showdown: RF48. Resumo para colar numa conversa: virou o botão "Montar time contra este chefão" (RF98) | 2026-09-12 / 2026-09-29 |
| RF14 | Revisado | 107 treinadores da run + 16 Treinadores opcionais = 123 (RF105) | 2026-10-07 |
| RF18, RF19, RN04 | Revisados | O Level cap é uma escolha própria (Easy/More/Elite), separada da Dificuldade (Easy/Ace/Elite); o Level cap vem dela e da Etapa | 2026-09-16 |
| RF36 | Substituído | RF52 e, depois, RF89 a RF92 | 2026-09-12 |
| RF44, RF45, RF46, RF56, RF57, RF58 | Revogados | Seção 1.18 (card "Leitura estratégica" removido) | 2026-09-18 |
| RF52 | Substituído | Nota por duelo simulado (2026-09-28) e, depois, Rank v2 (RF89 a RF92) | 2026-10-02 |
| RF62 | Substituído | RF93 (Rank por tipo sempre na ficha, não só em Monotype) | 2026-10-02 |
| RF65 | Revisado | RF101 (revanche sem buffs; chave Ativo/Já tirado) | 2026-10-04 |
| RF85 | Revisado | O RF não tem número próprio: os bônus de clima e de tipo valem os de `docs/decisoes_mecanicas.md` | 2026-10-08 |
| RF88, RN16 | Revisados | RF111 (cada pedra tardia na sua Insígnia, conferida nos scripts do jogo) | 2026-10-04 |
| RN17 | Revisado | Vale só para o card "Confronto" (por tipo); o simulador de duelo (RF97) calcula dano | 2026-09-28 |
| RNF06 | Revisado | RNF27 (animação reduzida e Home/End nas listas) | 2026-10-07 |
| RNF17 | Revisado | RNF25 (trava de verificação e de fronteira) | 2026-10-02 |
| RNF21 | Revisado | RNF23 (o alarme também valida o dado cru) | 2026-10-07 |

## 1. Requisitos funcionais

### 1.1 Dex (consulta de espécies)
- RF01 — O Terminal deve permitir que o jogador busque uma espécie por nome, entre as 1906 catalogadas.
- RF02 — O Terminal deve permitir que o jogador filtre a lista por tipo.
- RF03 — O Terminal deve permitir que o jogador ordene a lista por nome, número da Dex, qualquer stat
  base individual ou Nota.
- RF04 — O Terminal deve permitir que o jogador veja, para qualquer espécie: stats base, tipos,
  habilidades escolhíveis reais, innates sempre ativas, linha evolutiva completa, movepool por nível e
  golpes de tutor.
- RF05 — O Terminal deve permitir que o jogador compare os stats/tipo/Nota de duas espécies lado a lado.
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
- RF13 — **[REVOGADO por RF47]** O Terminal deve permitir que o jogador desfaça a última alteração de time/caixa, consultando um
  histórico das últimas 5 mudanças.

### 1.3 Chefões
- RF14 — O Terminal deve permitir que o jogador busque, entre os treinadores catalogados, um chefão
  por nome. **[REVISADO: eram 107 em 2026-09-10; em 2026-10-07 são 123, com os 16 Treinadores opcionais,
  RF105.]**
- RF15 — O Terminal deve permitir que o jogador veja o time de um chefão, incluindo as Variantes do
  chefão (Padrão/Insane/Hell) quando existirem.
- RF16 — O Terminal deve permitir que o jogador calcule os stats finais de cada membro do time do chefão
  para um nível escolhido, incluindo modificadores de item held quando aplicável.
- RF17 — **[SUBSTITUÍDO em parte por RF48 e RF98]** O Terminal deve permitir que o jogador exporte um resumo (chefão + time próprio + caixa) pronto
  para colar em uma conversa com o Claude, pedindo estratégia.

### 1.4 Progresso e Level cap
- RF18 — O Terminal deve permitir que o jogador registre a Dificuldade atual (Easy/Ace/Elite) e a última
  Insígnia conquistada (a Etapa da run). **[REVISADO: o Level cap deixou de depender da Dificuldade, RF19.]**
- RF19 — **[REVISADO 2026-09-16]** O Terminal deve calcular automaticamente o Level cap vigente a partir da
  Etapa e da escolha Level cap do Progresso (Easy/More/Elite), separada da Dificuldade (`levelCapMode` em
  `src/regras/level_cap.js`; tabela em `data/levelcaps.json`). A redação original derivava o Level cap da
  Dificuldade e da Insígnia.
- RF20 — O Terminal deve exibir um changelog em português das últimas funcionalidades entregues.

### 1.5 "Meu build" (montagem de Build)
- RF21 — O Terminal deve permitir que o jogador monte uma Build (habilidade, nature, item, até 4 golpes,
  IVs, EVs) para qualquer espécie, restrito às opções realmente existentes para aquela espécie no jogo.
- RF22 — O Terminal deve permitir que o jogador salve até 3 Builds distintas por espécie, alternando
  qual delas está ativa.
- RF23 — O Terminal deve exibir, para a Build ativa, os stats finais calculados e o poder de cada golpe
  (com STAB e Life Orb quando aplicável), sem calcular efetividade de tipo ou dano final.
- RF24 — O Terminal deve permitir que o jogador copie, para a Build de uma espécie, uma Build já vista em
  um chefão ou no histórico de Builds da própria espécie.
- RF25 — O Terminal deve permitir que o jogador peça uma Build gerada por IA para uma espécie, quando
  houver espaço sob o limite de 3.
- RF26 — Toda Build gerada por IA deve ser validada contra os dados reais da espécie antes de ser salva;
  uma resposta que não corresponda a uma habilidade/golpe/nature real da espécie deve ser rejeitada.
- RF27 — O Terminal deve exibir, em destaque visual, a justificativa que acompanha uma Build gerada por
  IA.
- RF28 — Ao gerar uma Build por IA, o Terminal deve fornecer à IA o contexto de progressão restante do
  jogo (quais líderes de ginásio, membros do Alto Comando e o Campeão ainda faltam ser enfrentados),
  derivado exclusivamente da Etapa e da Dificuldade já configuradas pelo jogador na aba Progresso — sem
  introduzir nenhuma pergunta, campo ou interação nova para obter essa informação.
- RF29 — O nível usado para os cálculos de "Meu build" deve ser preenchido automaticamente a partir do
  Level cap vigente, continuando editável para simulação manual.
- RF30 — O seletor de golpes de "Meu build" deve ocultar golpes de nível ainda não liberados pelo level
  cap vigente.

### 1.6 Auto-evolução
- RF31 — O Terminal deve evoluir automaticamente qualquer espécie do time ou da caixa cuja evolução por
  nível já esteja liberada pelo Level cap vigente, encadeando quantas etapas o cap permitir de uma vez.
- RF32 — Ao evoluir automaticamente, o Terminal deve transferir a Build e a anotação salvas para o novo
  nome da espécie.

### 1.7 Sincronização e persistência
- RF33 — O Terminal deve persistir todo o estado do jogador (time, caixa, Builds, notas, configurações)
  localmente, sem exigir conexão.
- RF34 — Quando disponível, o Terminal deve sincronizar esse estado entre os dispositivos do mesmo
  jogador, avisando quando encontrar uma versão mais recente salva em outro aparelho.

### 1.8 Papel/arquétipo e velocidade (extensão do Rank, 2026-09-11)
- RF35 — O Terminal deve calcular e exibir, para qualquer espécie, um ou mais papéis/arquétipos
  (Pivô/Tanque/Wallbreaker/Sweeper) e a divisão física/especial/mista do seu ataque, como sinal SEPARADO
  da Nota geral (nunca fundido no mesmo Tier SS/S/A/B/C/D).
- RF36 — **[SUBSTITUÍDO por RF52 e, depois, RF89 a RF92]** A Nota geral e por estágio evolutivo deve incluir a velocidade base da espécie como um dos
  componentes ponderados do cálculo, refletindo o formato 1x1 do hack (quem ataca primeiro com mais
  força tende a vencer a troca).
- RF37 — Ao gerar uma Build por IA, o Terminal deve fornecer à IA os golpes de prioridade que a espécie
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
  e Builds de referência" e "Comparar com outro Pokémon" começam fechados (consulta sob demanda),
  preservando totalmente a navegação por teclado. Correção 2026-09-11 (pedido do usuário): "Conhecer a
  espécie" deixou de ser um bloco recolhível — todo o seu conteúdo (stats base, habilidades/innates,
  linha evolutiva) fica sempre visível, sem opção de esconder.

### 1.10 Sinergia habilidade x movepool real (Fase 3, 2026-09-11)
- RF40 — Ao gerar uma Build por IA, o Terminal deve fornecer à IA quais habilidades (escolhível ou
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
  Dex, não só como contexto da geração de Build por IA: cada card de habilidade (escolhível ou innate)
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
  Comando ou Campeão, a partir da Etapa já configurada em Progresso, `milestone` no código) e, quando a caixa tiver um
  Pokémon genuinamente mais seguro contra o movepool real do time desse chefão do que o melhor
  Pokémon já presente no time, exibir uma sugestão de troca em uma única linha no resumo do topo da
  Dex — nunca uma tela nova, nunca uma sugestão por cada um dos chefões restantes.
- RN11 — A sugestão de troca (RF43) é calculada SOMENTE em relação à próxima luta que falta, nunca
  projetando risco de lutas futuras além dela — decisão explícita do usuário ("a sugestão do time é
  sempre pensando no Boss seguinte e não no que pode acontecer antes dele"). O critério de segurança é
  determinístico (tipos de ataque reais do movepool do chefão vs. multiplicador defensivo real do
  candidato, incluindo habilidades já verificadas) — nunca simula dano nem uma batalha completa.
- RF44 — **[REVOGADO, seção 1.18]** O Terminal deve permitir gerar, sob demanda (nunca automaticamente), uma leitura estratégica
  por IA para o time atual de até 6 Pokémon — papel de cada membro, ordem de entrada sugerida e o que
  fazer se o membro mais fraco cair — reaproveitando as mesmas ferramentas reais (Nota, papel,
  sinergia, golpe de prioridade, chefões restantes) já usadas na geração de Build por IA. A leitura só
  é recalculada quando a composição do time muda; até lá, o resultado já gerado é reaproveitado.
- RF45 — **[REVOGADO, seção 1.18]** A ferramenta determinística de sugestão de troca (RF43) deve estar disponível tanto para a
  geração de Build por IA (RF21-30) quanto para a leitura estratégica de time (RF44), como a mesma
  fonte de verdade — nunca duas implementações que possam divergir.

### 1.13 Reposição e limpeza da aba Time (Fase 1, 2026-09-11/12)
- RF46 — **[REVOGADO, seção 1.18]** A leitura estratégica do time (RF44) deve aparecer como o PRIMEIRO item da aba Time, acima da
  lista de membros — nunca como o último item da página.
- RF47 — O Terminal NÃO deve manter histórico de saves anteriores nem oferecer desfazer uma alteração de
  time/caixa. (Revoga RF13 da especificação original — o usuário considerou a feature sem utilidade real
  e pediu remoção completa, não apenas ocultação.)
- RF48 — O Terminal NÃO deve oferecer exportação do time inteiro em formato Showdown como um card
  próprio. (Revoga a parte de RF17 relativa a exportação de TIME inteiro — a exportação de uma Build
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
  nome, Nota, tipos, as habilidades escolhíveis e as innates da espécie (a mesma informação já exibida
  no card de cada membro na aba Time), e as ações de mandar para o time (ou trocar, se o time já estiver
  completo) e remover da caixa.

### 1.15 Rank robusto por simulação (Fase 3a, 2026-09-12)
- RF52 — **[SUBSTITUÍDO por RF89 a RF92; entre os dois houve a Nota por duelo simulado de 2026-09-28]** A
  Nota geral e por estágio evolutivo de uma espécie deve ser calculada com a simulação de
  defesa real contra os times de todos os chefões catalogados (incluindo as Variantes do chefão Insane e Hell) como
  sinal PRINCIPAL (peso 0,70), e uma composição ponderada de BST/habilidade/movepool real/qualidade de
  tipagem como desempate (peso 0,30) — substituindo o cálculo anterior baseado em uso-em-chefões e
  velocidade isolada (RF36, revogado por este). O resultado final é normalizado por percentil antes de
  ser convertido em Tier (SS/S/A/B/C/D), nunca em valor absoluto direto.
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
- RF56 — **[REVOGADO, seção 1.18]** Ao gerar a leitura estratégica do time (RF44), o Terminal deve fornecer à IA tanto o candidato
  determinístico para a próxima luta (RF43) quanto a visão da caixa inteira (cada membro com Nota/papel/
  tipo reais), permitindo que ela proponha uma troca de encaixe geral para o time — não apenas para a
  próxima luta específica.
- RF57 — **[REVOGADO, seção 1.18]** Quando a leitura estratégica (RF44) incluir uma troca sugerida, o Terminal deve exibir um botão
  que aplica essa troca diretamente — sujeito à mesma regra de revalidação no momento do clique descrita
  em RN13, aplicada aqui à sugestão de troca (não apenas à proposta de time inteiro).
- RF58 — **[REVOGADO, seção 1.18]** Ao selecionar um Pokémon da caixa, o Terminal deve exibir, quando aplicável, uma nota indicando
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

### 1.19 Consolidação pós-12/09 — rank, Dex e Build por IA (2026-09-18 a 2026-09-23)
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
- RF62 — **[SUBSTITUÍDO por RF93: a ficha mostra o Rank por tipo sempre]** O Terminal deve calcular e exibir,
  para qualquer espécie, uma Nota relativa às demais espécies do(s) mesmo(s) tipo(s) dela (o Rank por tipo),
  visível apenas quando o jogador tiver um arquétipo Monotype ativo — mesmo princípio da Nota por estágio
  evolutivo (RF52), eixo de comparação diferente (tipo, não estágio).
- RF63 — Ao gerar uma Build por IA para um membro do time, o Terminal deve informar quais golpes
  e papéis já estão em uso por outros membros do time atual, para reduzir repetição desnecessária —
  preferência forte (pode repetir quando genuinamente a melhor opção, com justificativa na
  rationale). **Revisado em 2026-09-27 (pedido do usuário):** item deixou de ser regra dura - cada
  Pokémon usa o item que mais o ajuda, e o mesmo item pode repetir no time.
- RF64 — O Terminal deve calcular e expor (na ficha da Dex e como ferramenta do gerador de Build por
  IA) combos autossuficientes reais entre uma habilidade condicional (clima específico ou HP baixo) e
  um golpe que a própria espécie aprende para satisfazer essa condição sozinha, sem depender de outro
  membro do time.
- RF65 — **[REVISADO por RF101]** O Terminal deve exibir, na aba Chefões, os buffs de líder de ginásio ainda ativos na luta
  atual ("Gym Skills"), permitindo ao jogador marcar quais já foram retirados vencendo os treinadores
  de apoio correspondentes.
- RN16 — **[REVISADO por RF111: algumas pedras só valem depois]** Mega Evolução (temporária ou permanente) só conta como disponível para uso em batalha a
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
  desvantagem. Sem Build salva o Terminal usa os tipos do próprio Pokémon como golpe presumido e
  marca o resultado como estimado. Pokémon de chefão que se transforma em Mega/Primal vale na forma
  nova (habilidade escolhível da forma nova é desconhecida no dado e não é inventada).
- RF67 — O resultado do confronto (RF66) deve aparecer **sem nenhuma ação do jogador**: como card
  "Confronto com o seu time" na ficha de qualquer chefão (quadro chefão × time, melhor resposta por
  Pokémon do chefão, buracos de cobertura, melhor abertura, ameaças) e como uma linha "Confronto" no
  resumo do topo da Dex para a próxima luta que falta (RN11 continua valendo: sem projetar lutas
  futuras). Batalha em dupla é tratada como 1x1 e o quadro avisa que o resultado é aproximado.
- RF68 — Quando o quadro de confronto (RF66) tem buracos (Pokémon do chefão que nenhum membro do time
  acerta super efetivo), o Terminal deve sugerir, sem ação do jogador, qual golpe que um membro do
  time já pode usar agora (Level cap atual + tutor) fecha mais buracos (escolha gulosa), ignorando
  golpe já na Build, de status, de poder < 50, de prioridade negativa, de precisão < 70 ou anulado
  pela habilidade do chefão.
- RF69 — O Terminal deve calcular o melhor time possível da caixa para o chefão (até 2 trocas, ou
  entrada em vaga livre), só sugerindo quando o ganho for real (limiar de 2 pontos, nunca troca
  lateral), e mostrar a troca na ficha do chefão e no resumo da Dex. A única ação do jogador é
  "Aplicar" (usa rosterMove: quem sai vai pra caixa, ninguém é apagado).
- RF70 — A ficha do chefão deve trazer, sem clique, um "Plano de luta": abertura (ou dupla de abertura
  contra os dois primeiros do chefão em batalha em dupla), a melhor resposta a cada Pokémon dele com a
  habilidade e o item reais (descrição do item no tooltip) e os golpes que mais ameaçam o time.
- RF71 — A ferramenta de IA `getNextBossRoster` deve dar ao gerador de Build e ao de estratégias o
  elenco real da próxima luta (tipos, habilidade, item e golpes), os buracos do time e os golpes que
  os fechariam; os prompts pedem (preferência, não obrigação) que a Build responda a uma ameaça concreta.
- RF72 — Ao avançar a insígnia no Progresso, o Terminal deve registrar sozinho no log "O que o app fez
  sozinho" que a luta anterior foi assumida como vencida, com o que o confronto via antes dela
  (nº de Pokémon sem resposta e de ameaças). Derrota não deixa rastro observável, então não existe
  registro de derrota; o bloco "Como melhorar este confronto" já responde a ela sem o jogador pedir.
- RF73 — O card "Prontidão do seu time" da ficha do chefão (só tipo, 2026-09-18) foi **fundido** no
  card "Confronto com o seu time": o lado defensivo virou a frase "ficam expostos ao que ele ataca"
  (membros em perigo contra metade ou mais do time do chefão, `confrontoTime().expostos`) e o lado
  ofensivo é o próprio quadro. A ficha não pode ter os dois cards.
- RF74 — "Novo jogo" **zera a run inteira**: time, caixa, arquétipo, registro de auto-evolução, buffs
  de ginásio já resgatados e a insígnia (volta ao início). Dificuldade, Level cap e modo de Mega ficam
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
  prompts de Build/estratégia avisam que Mega ainda não existe e não listam "outras formas" mega, e a
  criatura Mega ganha a etiqueta "Mega só na 4ª insígnia". Depois de liberar, a família inteira vale.
  Origem: print do usuário (insígnia no 2º ginásio, "Altaria Mega" SS na caixa entrando na sugestão).
- RN19 — **Build salva sempre vale pra espécie atual**: quando uma Build muda de espécie (auto-evolução ou
  regressão por Level cap, RF32) e quando um save é carregado ou sincronizado, cada Build é conferida
  contra os dados reais da espécie (`reconciliarBuild`): habilidade que a espécie não tem vira uma
  escolhível real (a de sinergia ativa com os golpes, senão a primeira), golpe que ela nunca aprende sai
  (golpe acima do Level cap continua válido), a justificativa da IA que citava a habilidade antiga sai.
  A Build nunca é apagada; cada ajuste vai pro log "O que o app fez sozinho" com o valor antigo. Origem:
  print do usuário (Haxorus com "Moxie", habilidade só do Axew/Fraxure). Medido: 583 dos 729 pares de
  evolução por nível deste hack mudam o conjunto de habilidades escolhíveis.
- RN17 — **[REVISADO: vale para o card "Confronto" (por tipo); o simulador de duelo, RF97, calcula dano]** O motor de confronto não calcula dano nem compara Velocidade real: o nível do chefão não
  existe nos dados. Habilidades de chefão fora de `TYPE_MOD_ABILITIES` podem alterar o resultado e a
  interface declara essa limitação em vez de fingir certeza.
- RNF09 — **Semi-automático**: toda análise nova deve derivar do estado que o Terminal já conhece
  (time, Builds, progresso, modo de Mega, Dificuldade) e aparecer sozinha; ação do jogador só onde
  há efeito real a aplicar (ex.: trocar um membro) ou consentimento necessário (geração por IA).

- RNF11 — **Camada de ações** (refatoração fase 2, 2026-09-24): toda mudança de estado feita pelo
  jogador passa por `acao(telas, mudar)`, que grava o save UMA vez e redesenha cada tela afetada UMA
  vez (`TELAS`, em ordem fixa). Ações aninhadas viram lote (uma gravação no fim); `mudar()` que
  devolve `false` não grava nada; erro dentro dela não trava a camada. Tela escondida não é desenhada
  (a aba redesenha ao abrir; Chefões usa marcação de desatualizado). A ficha só é redesenhada quando a
  mudança é do Pokémon aberto (`"ficha:SNAME"`) e mantém a rolagem - redesenhar outra apagaria o que o
  jogador estiver digitando. Funções de desenho não têm efeito colateral: contadores, resumo da Dex e
  revisão automática de Builds são disparados pela ação. Exceções deliberadas (gravam direto): carregar
  o save e aplicar o save de outro aparelho.

- RNF12 — **Regras fora da página** (refatoração fase 3, 2026-09-24): lógica que não lê nem desenha a
  página mora em `src/regras` e é testada no Node - save (`save.js`), Builds salvas e evolução
  (`evolucao.js`), Build mostrada (`builds.js`), chefões e confronto (`chefoes.js`), prompts e
  leitura das respostas da IA (`prompts_ia.js`), ferramentas que a IA consulta (`ferramentas_ia.js`) e o que
  gravar da resposta validada (`gravacao_build_ia.js`, `lista_de_builds.js`). As regras dependem só de dados e constantes
  (`types/app-globais.d.ts` lista o que vem do template); a checagem de tipos acusa qualquer
  dependência nova.
- RNF13 — **Cliente único de IA** (refatoração fase 4, 2026-09-24): todo pedido ao modelo passa por
  `pedirIA()`: disponibilidade, nova tentativa com o motivo técnico da rejeição (o jogador vê o texto
  dele), ferramentas do app e tradução de erro (`sampleErrorMessage`). Os prompts são montados em
  `prompts_ia.js` a partir dos mesmos blocos (espécie, movepool, regras de papel, Mega, itens, time
  em uso) - Build e Estratégias recebem as mesmas orientações. Erro do app ao aplicar a resposta é
  capturado em cada gerador; na revisão automática conta como tentativa (teto de 2).
- RNF14 — **Interface por área** (refatoração fase 5, 2026-09-24): o código de tela mora em `src/ui`,
  um arquivo por área (Dex, ficha, editor de Build, time, caixa, chefões, progresso, IA etc.),
  encaixado no template pelo build. Cada área tem um ouvinte de eventos único no seu contêiner,
  ligado uma vez (delegação) - nenhum desenho religa ouvintes. Funções que montam telas grandes
  (ficha, card do chefão, geração de Build por IA) são divididas em partes nomeadas. Testes nunca
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
- RNF17 — **[REVISADO por RNF25]** **Build e verificação independentes de sistema** (refatoração fase 8, 2026-09-24):
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
- RNF19 — **Escala de texto e tela estável** (2026-09-24, pedido do usuário): todo tamanho de fonte
  usa um dos 9 tokens `--fs-*` de `tokens.css` (10, 11, 12, 13, 14, 15, 16, 20 e 26 px - antes 19
  tamanhos soltos); stylelint e `checar_css.mjs` reprovam valor solto, no CSS e inline. A tela não
  se desloca ao carregar: o cabeçalho tem a mesma forma com qualquer texto no subtítulo (a
  informação fixa corta com "…" primeiro, o status da sincronização por último, texto inteiro no
  `title`) e o resumo da Dex reserva a altura de uma linha enquanto vazio. Medido antes: CLS ~0,53
  no computador; `desempenho.spec.mjs` confere a forma do cabeçalho e a reserva do resumo direto, e
  o CLS < 0,1 em quatro larguras.
- RNF20 — **O Pokémon é o protagonista da tela** (redesenho visual, 2026-09-24, pedido do usuário:
  "ainda sinto que ele não está bonito"): na aba Time o time aparece antes de qualquer ajuste - o
  arquétipo fica recolhido numa linha com as escolhas atuais no resumo e lembra se ficou aberto; os
  cards ocupam 3 colunas no notebook (sem card sozinho na última linha) e o texto da Build nunca é
  cortado. Sprites em múltiplo exato da célula do atlas (96 px na ficha, 64 px no time), pra pixel
  art continuar nítida. A cor de destaque forte fica só no botão principal; escolha "nenhum" é
  neutra; identificadores internos (`SPECIES_…`) não aparecem pro jogador. No computador (a partir
  de 1024 px) o Progresso fica na barra de abas, posicionado antes da primeira pintura (movê-lo
  depois deslocava o cabeçalho: CLS 0,376 medido); no celular volta pro "Mais". Clicar numa etapa
  da trilha "Sua jornada" marca a insígnia. `interacao.spec.mjs` confere a posição do Progresso, o
  clique na trilha e o arquétipo recolhido; as referências visuais foram revistas e regravadas.
- RNF21 — **[REVISADO por RNF23]** **Alarme de versão nova** (2026-09-24, pedido do usuário): toda segunda às 9h (Brasília)
  o GitHub Actions (`.github/workflows/alarme_upstream.yml`) roda `scripts/alarme_upstream.mjs`, que
  confere a versão padrão do NextDex oficial, se o arquivo de dados dessa versão continua idêntico
  ao snapshot (`data/gameData_265beta.json`, hash ignorando fim de linha) e a "Latest Version" da
  página de download do eliteredux.net. Só falha - e o GitHub avisa o jogador por e-mail - quando
  algo mudou ou uma página mudou de formato (alarme cego também pede atenção); falha de rede depois
  de 3 tentativas vira só aviso. Em dia: nenhuma notificação. A leitura das páginas tem teste de
  unidade sem rede (`tests/unit/alarme_upstream.test.mjs`). Quando tocar: extrair o dado novo
  (`scripts/build.ps1` sem `-SkipExtract`) e atualizar as versões esperadas no script.

### Build que acompanha o jogador e banco de Builds (2026-09-24)

Pedidos do usuário: "montamos uma build no cap 18; no próximo cap ele pode aprender golpes melhores pra
build que já montamos - o jogo pode atualizar a build"; "ao evoluir o kit muda"; "toda build gerada por
IA pode ser considerada curada... o Playtester faz a curadoria... pra economizar chamadas de IA"; até 3
Builds curadas por espécie, uma por papel, só dos papéis que o jogador já pediu. Medido nas 138 curadas
(sem Mega): a cada degrau de cap entre 18 e 70, 17% a 46% das espécies destravam um golpe da Build ideal.

- RF76 — **Plano de golpes**: toda Build pode ter um `plano` { golpe de agora → golpe que entra depois }.
  Quem escolhe a troca é quem montou a Build (a IA ou a curadoria) - nunca uma regra fixa ("golpe mais
  forte" errou 19 de 24 trocas no estudo). O app só calcula QUANDO o golpe libera (`golpesNoCap`,
  `src/regras/plano_build.js`) e deriva os golpes na hora de mostrar (`effectiveBuild`). O que está
  salvo nunca é regravado: se o cap descer, a troca volta sozinha. O card mostra "Já liberado" e
  "Próximas trocas"; toda troca que entra ou volta com a mudança de cap vai pro log "O que o app fez
  sozinho" (só membros do time).
- RN20 — **Plano válido**: o destino precisa ser um golpe de NÍVEL que esta forma aprende acima do cap
  atual e antes do nível em que ela evolui sozinha (680 de 729 pré-evoluções têm golpe assim); golpe
  de tutor ou já liberado não entra (devia estar na Build agora); um destino por golpe. Passo inválido
  sai com o motivo, a Build nunca é rejeitada por causa do plano (`validarPlano`).
- RF77 — **Geração por IA com plano**: o prompt de Build recebe os golpes futuros da forma com o nível
  e pede o campo `plano`. Build à mão (ou Build de Estratégias escolhida) sem plano e com golpe por
  liberar pede só o plano, numa chamada curta sem ferramentas; editar a Build mantém o plano dos golpes
  que continuam nela.
- RF78 — **Revisão automática** (sem clique): na evolução pra frente a Build ativa é marcada; com a
  curada da forma nova no estilo do time e sem golpe travado, troca pela curada sem IA; senão a IA
  revisa mantendo o papel (a Build anterior vai no prompt). Membro do time sem build própria cuja curada
  tem golpe travado ganha uma "build-ponte" (a curada com golpes liberados agora e plano até os dela).
  Custo limitado: só membros do time, uma chamada por vez, no máximo 3 por abertura, 2 tentativas por
  Build, e só roda se a IA já estiver liberada pelo jogador (nunca abre o pedido de consentimento sem
  clique). O card mostra "revisão pendente"/"atualizando…".
- RN21 — **Mega usa a Build da base**: a Mega é a mesma criatura, com os mesmos golpes (293 de 303 Megas
  têm movepool idêntico à base). Sem Build própria, a Mega herda a Build da base ajustando só o que
  não existe nela (a habilidade, na maioria) - sem IA.
- RN22 — **Estilo da Build**: ofensivo / equilibrado / defensivo, calculado pelos EVs (ataque+SpA+Spe
  ≥ 400 ofensivo; HP+Def+SpD ≥ 400 defensivo; senão equilibrado - nas 189 curadas: 105/51/33). O
  estilo que o time pede vem do Ritmo do arquétipo (Hyper/Bulky Offense → ofensivo; Stall/Semi-Stall →
  defensivo; resto → equilibrado). A curada mostrada é a do estilo do time; sem ela, a primeira.
- RF79 — **Banco de Builds curadas**: `data/builds.json` aceita até 3 Builds por espécie (lista), no
  máximo uma por estilo (`scripts/validar_dados.mjs` trava no build). Uma Build de IA NÃO vira curada sozinha - ela é
  montada pro contexto daquele momento e a validação do app só confere se é legal, não se é boa. O
  Playtester roda `node scripts/playtester_curadoria.mjs <save.json>` sobre o save sincronizado:
  checklist mecânico (mesma `validateAiBuild` do app sem cap, plano aprendível, estilo ainda não coberto,
  não repete uma curada) e, depois do julgamento dele, `--promover SNAME#n` grava com fonte
  `ia-curada-playtester`, estilo e plano. A justificativa da IA é copiada como nota, nunca interpretada.
- RF80 — **Builds de Estratégias guardadas**: vão pro save (e pro sync) com cap, versão dos dados e data;
  recarregar não paga outra chamada. Versão dos dados diferente descarta; teto de 60 espécies.
- RN23 — **Build acompanha a criatura sem perder nada**: destino sem build recebe a lista inteira;
  destino com Build recebe as que chegam como Builds extras (sem trocar a ativa) até 3, o resto fica
  na origem. Quando o ajuste da evolução muda algo, a versão anterior fica guardada (`anterior`) e volta
  inteira se a criatura regredir (cap desceu). Ajuste feito num save vindo de outro aparelho é gravado e
  devolvido pro sync.

### Berries na IA e mono run (2026-09-26)

- RF81 — **Item que ativa a habilidade**: a lista de itens da IA inclui as berries de pânico, as de
  resistência (uma por tipo, com o tipo dito no prompt) e as que reagem a golpe. Gluttony, Ripen,
  Harvest e Cud Chew ativos (innate sempre; escolhível só se for a escolhida) exigem Berry; Unburden
  exige item que se gasta na luta. O prompt avisa antes e a validação rejeita com o motivo; a pedra da
  mega temporária tem prioridade. Leppa fica de fora (PP sempre no máximo neste hack). A IA recebe os
  itens por grupo com o papel de cada um: gerais, reforço de tipo (com o tipo), gemas (dano forte uma
  vez), berries, utilidade (com a descrição do próprio jogo - Swirly Glasses e Frost Orb são deste hack)
  e os exclusivos da espécie (Light Ball, Thick Club...), que só aparecem pra ela; vindo pra outra, a
  validação troca por "sem item".
- RF82 — **Mono run: onde pegar**: com um Monotype escolhido, a aba Time mostra sozinha, pro tipo,
  o que dá pra pegar até a insígnia atual (novos desta etapa + os de antes), o que libera depois do
  próximo líder, o local de cada um e quem o jogador já tem (a espécie ou uma evolução dela), os
  melhores do tipo primeiro (Rank por tipo). Nome abre a ficha. Dado: planilha da comunidade "Mono
  earliest locations" (índice oficial), importada por `scripts/importar_mono.mjs`; cada nome é casado
  com o dado 2.65 e o que diverge fica de fora (a planilha é da 2.5). Marca "só é do tipo na forma
  Mega" separada de "vira do tipo ao evoluir".
  Revisão de front/CX (2026-09-27, "a tela está muito carregada"): o card fica ABAIXO do time
  (antes, no celular, empurrava o time pra fora da primeira tela), mostra à vista só o resumo
  (fraco a, próximo líder, clima, pegar agora) e as listas completas ficam em "Tudo o que dá pra
  pegar", recolhido (lembra se ficou aberto). Notebook: card 373 -> 204 px; celular: 727 -> 225 px.
- RF83 — **Arquétipo com os nomes e opções certos**: os eixos são Estilo (Hyper Offense, Balance,
  Bulky Offense, Semi-Stall, Stall - o termo da comunidade é playstyle), Clima e campo (Sand, Rain,
  Sun, Hail, Eerie Fog, Trick Room e os 5 terrenos, incluindo o Toxic Terrain deste jogo), Tática
  (Telas; Armadilhas e pivô) e Monotype. "Snow" virou "Hail" (neste jogo o Snow Warning invoca
  granizo; save antigo é convertido). Cada valor leva à IA uma orientação de Build com as
  habilidades que armam/aproveitam, conferidas no dado; efeito que a descrição do jogo não confirma
  não entra.
- RF84 — **Monotype vale em tudo**: com um Monotype escolhido, nenhuma sugestão automática propõe
  Pokémon de outro tipo (melhor troca da caixa - que tem "Aplicar" -, candidato da caixa pro chefão,
  gerador de time). A IA de Build, Estratégias e time recebe as fraquezas que o time inteiro divide,
  a berry de resistência delas e os tipos que resistem ao do time; o gerador de time vê, por
  candidato, que fraqueza ele cobre e se sai do tipo ao evoluir (Everstone), e quem o jogador tem
  que ainda vai virar do tipo. O card de mono run mostra essas fraquezas, quantos membros do
  próximo líder têm golpe super efetivo no tipo e até 3 capturas disponíveis que as cobrem.
- RF85 — **[REVISADO 2026-10-08: o RF não carrega número de bônus; os valores de clima e de tipo estão só em `docs/decisoes_mecanicas.md` (linhas "Clima sol/chuva", "Tempestade de areia: Rock" e demais)]** **Clima que combina com o tipo**: numa run Monotype o card sugere o clima com bônus confirmado em fonte oficial (Full Features "Weather Rework" e FAQ): Fire→Sun, Water→Rain, Ice→Hail, Ghost/Psychic→Eerie Fog (a areia para Rock ainda não é citada pela sugestão). Um clique põe no "Clima e campo"; a IA recebe a mesma sugestão. Tipo sem bônus confirmado não recebe sugestão.
- RF86 — **Build por IA conduzida pelo papel** (2026-09-27, revisão do prompt pedida pelo usuário:
  viabilidade, sinergia habilidade x golpes, prioridade, Velocidade, encaixe no time): o prompt leva o
  efeito de cada habilidade escolhível e innate (antes só o nome), o papel natural da espécie, a
  tabela papel -> prioridades (Tanque, Pivô, Wallbreaker, Sweeper), os golpes de prioridade e de pivô
  disponíveis e uma ordem de decisão (papel, habilidade/sinergia, golpes, item, EVs, time). A IA
  declara o papel e a validação reprova contradição clara (tanque com mais de 100 EVs em Velocidade
  ou menos de 252 em bulk, sweeper lento fora de Trick Room, wallbreaker sem ataque, pivô sem golpe
  de troca quando a forma tem um) e item que se anula pela descrição do jogo (Choice com golpe de
  status exceto Trick/Switcheroo, Assault/Tactical Vest com status, Eviolite em quem não evolui).
  O papel aparece na justificativa. Vale também pras Estratégias.
- RF87 — **Build nova depois da evolução** (2026-09-27, pedido do usuário: "zerar a build do level 18
  e sugerir uma nova pro Pokémon que evoluiu"): na evolução pra frente a Build ativa (inclusive curada)
  fica marcada; a IA monta uma Build NOVA do zero pra forma nova (a antiga vai só como referência) e a
  de antes fica de reserva, com o chip "Antes de evoluir" na ficha - com 3 Builds, sai a Build mais
  antiga, nunca ela. Curada da forma nova no estilo do time entra sem IA. Se a IA não estiver liberada,
  o card do time mostra "Gerar build nova (evoluiu)" (o clique libera a IA); com ela liberada, a
  revisão automática faz sozinha.
- RF88 — **[REVISADO por RF111]** **Megas de pedra tardia** (2026-09-27, pedido do usuário): Haxorusite, Dragoninite Y e
  Gyaradosite Y só contam como disponíveis a partir da 7ª insígnia (Tate & Liza); as outras Megas
  seguem liberando na 4ª (Flannery). Vale pra toda sugestão (unidades de batalha, time por IA,
  prompts de Build) e pra etiqueta "Mega só na 7ª insígnia". Fonte: Discord oficial (comunidade,
  2.65 - a Haxorusite é a luta contra o Totem Haxorus no Meteor Falls, liberada depois do 7º
  ginásio); Dragoninite Y e Gyaradosite Y por decisão do usuário, sem confirmação. Lista em
  MEGA_PEDRAS_TARDIAS (formas_mega.js).

### Rank v2: Nota por Dificuldade (2026-10-02, atualizado em 2026-10-07)

Origem: pedido do usuário de um Rank robusto contra os chefões reais; modelo de 7 pontos aprovado em 02/10.
Substitui o cálculo de RF52. Mecânica: linhas "Rank v2" e "Rank: escolha do set (ticket 08)" de
`docs/decisoes_mecanicas.md`. A Nota vem pronta de `data/species_rank.json` (ADR-002), calculada fora do app
por `scripts/calcular_rank_v2.mjs`.
- RF89 — **Nota por Dificuldade**: o Terminal deve dar a cada espécie uma Nota (0 a 100) e um Tier (SS a D)
  calculados em duelos simulados contra a Variante do chefão da Dificuldade da run: a Variante Padrão vale
  para Easy e Ace; a Insane, para Elite (o app não oferece a Hell como Dificuldade da run, RF102). Trocar a Dificuldade em
  Progresso troca a Nota na hora (`rankDe` lê a Dificuldade a cada chamada, `src/regras/rank_da_run.js`); a ficha diz de
  qual Dificuldade é a Nota. Antes do Rank v2 os três níveis de time eram somados numa Nota só.
- RF90 — **Só as lutas da run, no Level cap de cada uma**: o duelo conta as 29 lutas da run (primeiro
  encontro de cada ginásio, chefões Aqua/Magma do caminho, Alto Comando e Campeão), no Level cap da Etapa de
  cada luta, e só as lutas a partir da Etapa em que a espécie pode ser obtida (RF91). Revanches, Frontier, o
  campeão monotype e os Treinadores opcionais (RF105) ficam de fora. Cada espécie luta com quatro golpes
  fixos; a luta mais ameaçadora pesa mais (peso medido pelo próprio simulador).
- RF91 — **Disponibilidade**: a Etapa mais cedo em que a espécie é obtível vem de
  `data/rank_disponibilidade.json`, gerado por `scripts/gerar_rank_disponibilidade.mjs` (planilha "Mono
  earliest locations" + código do jogo; regras com fonte em `data/disponibilidade_regras.json`). Regras de
  equipamento (varas, Surf, Rock Smash) e de presente: linhas "Rank v2: disponibilidade" e "Rank v2:
  equipamento" de `docs/decisoes_mecanicas.md`.
- RF92 — **Dois eixos**: a ficha mostra lado a lado o Potencial (o 4º golpe pode ser de status) e a
  Viabilidade (quatro golpes de dano, sem planos); a Nota é a média geométrica dos dois. A configuração de
  simulação de cada espécie (físico, especial, tanque, físico rápido ou especial rápido, com habilidade,
  item e golpes) é a de maior média geométrica entre as três melhores candidatas pela soma rápida
  (`scripts/rank_escolha.mjs`, ticket 08).
- RF93 — **Rank por tipo sempre visível**: a ficha mostra, para cada tipo da espécie, a Nota comparada só
  com as espécies desse tipo ("Rank entre <tipo>"), mesmo sem run Monotype. A mono run (RF82) ordena por
  ele. [substitui RF62]
- RF94 — **Fora do rank**: a espécie que não se pode obter durante a run (só pós-jogo, só DexNav ou sem
  fonte) sai das Notas (`FORA_DO_RANK`); a ficha mostra o selo "Fora do rank" com o motivo em vez de Tier, e
  o resto do app a trata como sem Nota. Em 2026-10-08 são 315 das 1906 espécies.
- RF95 — **Marcas** (avisam, não alteram a Nota): "Precisa de setter" (habilidade ativa cuja condição é só de
  clima ou terreno e nenhuma habilidade da espécie arma; calculada no app por `precisaDeSetter`),
  "Concorrência" (quantas espécies do mesmo tipo são iguais ou melhores em Potencial, Viabilidade e
  disponibilidade; calculada pelo script, `dominadoPor`, sem contar a própria família de formas) e o Papel
  (`species_role.json`). A ficha separa em dois grupos: as Notas, em letra, e as Marcas, em texto pequeno.
  Na Dificuldade Elite a Marca de setter diz o nível em que a innate libera (1, 17 ou 24). Regras: linhas
  "Rank v2: marcas sem nota" e "Elite: innates do jogador".
- RF96 — **Outras Notas na ficha**: o Rank geral é o destaque; ao lado ficam o Rank no estágio evolutivo
  (entre espécies do mesmo estágio) e o Rank em dupla (duelo contra os chefões em batalha em dupla,
  2026-09-29), cada um com o Tier e a explicação no `title`.

### Simulador de duelo e luta contra o chefão (2026-09-28 a 2026-10-07)

Origem: o Rank anterior tirava 70% da Nota só da tipagem defensiva (Garchomp em C); o usuário pediu a Nota
pelo que acontece de verdade no duelo. Toda a mecânica vive em `docs/decisoes_mecanicas.md`; nenhuma regra
nova entra no motor sem consultar e registrar lá.
- RF97 — **Simulador de duelo**: o motor `src/regras/duelo.js` simula duelos 1x1 e a luta inteira contra o
  chefão (também em dupla) com golpes, habilidade, item, natureza, EVs e IVs reais, e é o mesmo do Rank e do
  botão do chefão. O que ele não simula fica listado, com o motivo, em
  `tests/unit/auditoria_do_motor.test.mjs` (item ou habilidade nova que passa a ser lida faz o teste falhar).
  A interface declara as limitações do motor em vez de fingir certeza (RN17).
- RF98 — **Montar time contra este chefão** [substitui o resumo para colar numa conversa de RF17]: a ficha do
  chefão tem um botão que escolhe até 6 espécies entre o time e a caixa (respeitando Monotype, Level cap,
  Mega liberada e no máximo 2 membros com o mesmo item), testa estratégias de clima, guarda o time anterior
  em "Times salvos" (nunca apaga) e gera as Builds por IA numa consulta só. "Voltar ao time anterior"
  restaura. A Build ativa já feita para aquele chefão, Variante e Level cap é reaproveitada; Build feita à
  mão nunca é apagada. Depois de gerar, o time é simulado de novo com as Builds reais e o card avisa se o
  plano piorou ou se os buffs mudaram. A conta roda em passos, com progresso visível ("12 de 44"), sem
  travar a tela.
- RF99 — **Card "Time gerado contra <chefe>"**: veredito em foco (Vence / Derruba N de M), resposta a cada
  Pokémon do chefão, luta simulada recolhível e a lista do que o simulador não calcula (RF101, RF100).
- RF100 — **Regra de campo e efeitos do chefão à vista**: a tela do chefe e o card do plano mostram a regra
  de campo da luta (Trick Room e batalha invertida na Tate & Liza 1; Trick Room nas revanches deles; Gravity nas
  duplas do Steven) e os 18 efeitos do campeão monotype, estes marcados "o simulador ainda não conta este
  efeito". Linhas "Regra de campo", "Batalha invertida confirmada em jogo", "Campeão monotype: 18 efeitos" e
  "Campeão monotype: eventos extras".
- RF101 — **Buffs do ginásio** [revisa RF65]: o card "Buffs do ginásio" mostra "N de M ativos" e, em cada
  buff, a chave "Ativo" / "Já tirado" (marcado = já tirado). Os ativos entram no simulador e no pedido à IA.
  Só o primeiro encontro do líder tem buffs: as revanches não. O card do plano lista os buffs ativos que o
  simulador não calcula. Linhas "Buffs do ginásio", "Números dos buffs do ginásio", "Sem Protect (Tate &
  Liza)", "Revanche de líder sem buffs" e "Buffs fora da conta do simulador".
- RF102 — **Variantes do chefão e Hell**: a ficha do chefão mostra por padrão a Variante da Dificuldade da
  run (Easy e Ace: Padrão; Elite: Insane) e deixa conferir as outras com os chips Padrão, Insane e Hell. A
  Hell NÃO é opção de Dificuldade do app (fontes em conflito, decisão do usuário pendente); na Variante Hell
  a tela mostra os +5 níveis depois da 3ª Insígnia e as habilidades extras que o código do jogo confirma.
  Linhas "Dificuldades do jogo e Hell" e "Hell Mode: status oficial".
- RF103 — **Chefões conferidos pela config oficial** (ticket 02): os 107 chefões da run foram comparados com
  a config oficial do jogo (versão do dado 2.65beta): 0 diferenças depois de devolver 11 Eviolites que o
  NextDex perdeu. Linha "Times dos chefões conferidos pela config oficial (ticket 02)".
- RF104 — **IA do chefão** (ticket 03): o chefão escolhe o golpe de dano pela pontuação da IA do jogo, não
  pelo maior dano, e quem entra depois de um nocaute segue a regra oficial; troca voluntária e uso de itens
  NÃO são modelados (os treinadores não têm bolsa). A ficha mostra "Como a IA deste treinador luta" para
  quem tem flag extra. Linhas "IA do chefão: ..." e "IA do chefão: troca voluntária e itens".
- RF105 — **Treinadores opcionais** (ticket 04): 16 treinadores (Dragonitenite Sage, Steven na Granite
  Cave e na Route 118, Calvin, Mega Fidough, Blunder e os das pedras; o Steven de Mossdeep é parceiro e fica
  de fora) entram como chefões da categoria "Treinador
  opcional", com a etiqueta "Luta opcional" e FORA do Rank. Total de treinadores catalogados: 123. Linha
  "Treinadores opcionais no app (ticket 04)".
- RF106 — **Setup continua entre duelos** (ticket 05): na luta inteira contra o chefão, o vencedor leva os
  estágios de atributo ao duelo seguinte, nos dois lados; quem entra em campo começa sem (a luta em dupla não mudou). Se o Rank passa a
  usar isso é a "DECISÃO ABERTA" registrada em `docs/decisoes_mecanicas.md`, que este documento não decide. Linha "Setup continua entre duelos (ticket 05)".
- RF107 — **Efeitos de golpe e de habilidade lidos do código do jogo** (tickets 06 a 19 e correções do
  motor): poder variável (Low Kick, Heavy Slam, Gyro Ball...), drench, golpes que tiram ou roubam setup,
  poder que cresce (Last Respects, Rage Fist) e Electro Shot, Foul Play e Body Press com o atributo certo,
  Thunder e Hurricane no clima, Axe Kick, Thousand Arrows, golpes de dois tipos e acertos pelo efeito
  oficial. Cada um tem a sua linha em `docs/decisoes_mecanicas.md`; o que o motor ainda não simula está no
  auditor do RF97 e em `HABILIDADES_SEM_REGRA`.

### Builds: Avisos, Confiança, fontes e itens (2026-09-28 a 2026-10-07)

- RF108 — **Aviso de build**: o editor "Meu build" mostra o bloco "Não serve agora" quando a Build não serve
  na Etapa atual: golpe só depois do Level cap, Mega ou pedra antes da Insígnia, item que só aparece depois,
  habilidade que depende de clima ou terreno sem setter no time e Build de batalha dupla numa luta 1x1
  (`avisosDaBuild`, `src/regras/avisos_build.js`). Só informa: não bloqueia salvar, não muda a Nota e não faz
  pergunta ao jogador (RNF09).
- RF109 — **Confiança da Build**: toda Build com Origem externa mostra um selo ao lado do rótulo, no card do
  Time, no editor e nas Estratégias: Confirmado (código do jogo ou curadoria do projeto), Consenso (Discord
  Build Workshop, conferido contra o dado do jogo) ou Relato (IA, Discord antigo e qualquer outra fonte). A
  Build gerada por IA é sempre Relato; a feita pelo jogador e a herdada da base não têm selo. O selo não
  altera nenhuma Nota (`seloDaBuild`). O glossário aplica a mesma escala às decisões de mecânica; o registro
  `docs/decisoes_mecanicas.md` guarda a fonte de cada uma, não o selo.
- RF110 — **Banco de Builds curadas** [estende RF79]: `data/builds.json` tem 242 Builds de 229 espécies em
  2026-10-08, cada uma com uma fonte aceita por `scripts/validar_dados.mjs`. As "Estratégias oficiais do
  jogo" (`dex-strategy.md` do código do jogo) entram por `scripts/importar_dex_strategy.mjs` só se passarem
  na mesma conferência de habilidade escolhível, golpes do movepool, item, EVs e natureza (41 entraram). Linha
  "Estratégias oficiais do jogo (dex-strategy.md)".
- RF111 — **Pedras Mega tardias** [revisa RF88 e RN16]: a Mega só conta a partir da 4ª Insígnia, exceto as
  pedras de `MEGA_PEDRAS_TARDIAS` (`src/regras/formas_mega.js`), que valem da 5ª, 6ª ou 7ª Insígnia ou só no
  pós-jogo, conforme os scripts do jogo; o Aviso de build (RF108) e a etiqueta "Mega só na Nª insígnia"
  seguem a mesma tabela. `data/mega_forms.json` é gerado por `scripts/gerar_mega_forms.mjs` e testado contra
  o dado do jogo. Sem fonte nos scripts e pendentes: Floettite e Dragoninite Y. Linhas "Pedras mega tardias"
  e "mega_forms.json completo".
- RF112 — **Onde achar o item** (ticket 07): a descrição de cada item na Build mostra até 2 lugares (local,
  como e a partir de qual Insígnia), de `data/onde_achar_itens.json` (450 itens), lidos do código do jogo.
  Item que só aparece depois da Etapa atual gera o Aviso de build; item sem local com Etapa não gera aviso.
  Linha "Onde achar cada item (ticket 07)".
- RF113 — **Como conseguir ampliado**: a tabela oficial de presentes (Mystery Gift) passou a valer (17
  espécies a mais, incluindo a Floette Eternal Flower); o card de mono run (RF82) diz que o inicial do
  tipo sai por 15 BP depois da Flannery, e a ficha mostra "Golpes liberados desde o início" no lugar de
  "tutor". Linha "Presentes (Mystery Gift)".
- RF114 — **Build por IA mais confiável** [estende RF21 a RF30 e RF86]: um pedido de IA por vez (fila única
  com tempo-limite de 3 minutos); falha passageira tenta de novo sozinha; Build e Estratégias saem numa
  chamada com o contexto da run no prompt; as Builds do time (e do botão do chefão) saem numa consulta só,
  cada uma validada e gravada na hora. A validação rejeita, com o motivo: habilidade condicional sem a
  condição garantida, nature que reduz o atributo usado por todos os golpes, Black Sludge fora de Poison,
  atacante sem STAB e cura com Heal Block ativo; ela mantém o golpe-chave que o simulador provou. Item
  repetido: no máximo 2 membros do time com o mesmo item (RF63, decisão de 2026-09-29).
- RF115 — **Sync não apaga run adiantada** [estende RF33 e RF34 e RNF22] (**implementado e publicado, v176**,
  ticket `sync-2026-10-10/01`, commit 15231e2): o Terminal deve impedir que um save que chega de outro
  aparelho com MENOS progresso troque o do aparelho sozinho. Progresso = a Etapa da run; na mesma Etapa, a
  run confirmada vale mais que o Novo jogo sem confirmar (`saveChegandoTemMenosProgresso`, `src/regras/save.js`).
  Nesse caso o Terminal mostra um aviso (`src/ui/sync.js`, na carga inicial e na atualização ao vivo) com
  "Manter este aparelho" (grava o local de novo) ou "Usar o que chegou" (aplica o remoto). Limite: duas runs
  na mesma Etapa e as duas confirmadas não entram na regra; soltar Pokémon não conta como perda. Origem: o
  save adiantado do celular foi trocado por uma run zerada do PC. Teste: `tests/unit/sync_progresso.test.mjs`.
- RNF29 — **Fidelidade do motor à calculadora de dano do jogo** [estende RNF08 e RF107] (**implementado;
  publicado até a v177**, tickets `golpe-duplo-2026-10-10/01`; commits bc492eb, e2c0045, 56fc7ba): o dano do
  duelo 1x1 deve cair dentro da faixa da calculadora do próprio jogo (formato Smogon, EVs reais, Life Orb,
  clima, faixa de 85% a 100%, só o 1º golpe), que é a referência de calibração. Correções que saíram dela:
  Raging Boxer x1,4 só nos socos (valia x2,8) e Raging Moth passa a valer; golpe convertido por Aerilate e
  parecidas vale x1,3 (era x1,1). Teste: `tests/unit/calibracao_calculadora_do_jogo.test.mjs`. Todo golpe ou
  habilidade novo que o duelo passe a usar deve ser conferido contra um número do jogo antes de confiar nele.
  Desvio conhecido: Insect Impact ~10% acima da calculadora (causa desconhecida, sem efeito grande).
- RF116 — **Pipeline de build com intenção** [estende RF21 a RF30 e RF114] (**planejado/decidido; fases 1 e 2
  já existem no motor, ainda sem tela**; desenho em `docs/pipeline_de_build.md`): o Terminal deve montar, por
  código e antes da IA, de 3 a 5 Candidatos de build (4 golpes e a habilidade) com o motivo de cada um,
  simulá-los no duelo e marcar o hit-kill em 2 níveis: derruba em 1 golpe e bate primeiro é o melhor; derruba
  em 2 golpes e bate primeiro é o segundo. "Bate primeiro" = golpe de prioridade ou mais Velocidade; a
  prioridade não vale contra Queenly Majesty, Dazzling e Armor Tail. O alvo padrão é o próximo líder de
  ginásio da Etapa, com a opção de escolher outro chefão. A tela mostra o motivo curto de cada Build e o
  selo "calibrada" ou "estimada" (o rótulo "mata no turno 1" só sai com número conferido na calculadora do
  jogo, RNF29). A IA só escolhe entre os candidatos e define EVs, item e natureza; a validação e a gravação
  continuam as de RF114. Já existe no master: `sinergiasDaEspecie` (`src/regras/duelo.js`) devolve as
  sinergias da espécie com `motivos`, usado nos prompts e na reconciliação da Build. Não existe ainda:
  `src/regras/pipeline_build.js`, a ligação do botão e do lote e o motivo e o selo na tela. Decisões do
  usuário de 10/10 e 14/10.
- RF117 — **Proposta inicial por ponte OmniRoute opcional** [estende RF114 e RNF13] (**implementado, no
  master, ainda não publicado; inerte sem host**, commits 842d6bd e 753f0cb): o cliente de IA só usa uma
  ponte alternativa quando o host injeta `window.__ER_OMNIROUTE_BRIDGE__` com o modelo exatamente
  `antigravity/gemini-3.1-pro-high` (`src/ui/ia.js`); o Artifact não contém chave, segredo nem rota fixa; se
  a ponte falhar, usa `sample` como antes; a resposta de qualquer fornecedor passa pela mesma validação e
  gravação local. O desenho do construtor em cascata (`docs/agents/construtor-de-builds-cascata.md`) ainda
  não está no master.
- RN25 — **Limite honesto do duelo** [estende RF107]: o duelo do Terminal é 1x1. Luta em dupla, o parceiro e
  o Fake Out do adversário (prioridade +3, que faz o atacante recuar antes de agir) não são simulados; um
  "derruba no turno 1" é válido só no 1x1 e o app não deve apresentá-lo como certeza numa luta em dupla
  (caso da Meteor Falls: o Ledian derruba o Ninetales no 1x1, mas o Fake Out do Shiftry o impede na luta
  real). A luta em dupla da Meteor Falls nem está em `data/bosses.json`; incluí-la seria dado novo (perguntar).
- RN24 — **Auto-evolução sem duplicata** [estende RN15]: a auto-evolução nunca cria duas cópias da mesma
  espécie no elenco; a segunda fica sem evoluir, com o motivo no log "O que o app fez sozinho".

### Dados, processo e interface (2026-10-01 a 2026-10-07)

- RNF22 — **Save com soma de verificação** (2026-10-01): cada save grava uma soma FNV-1a do próprio
  conteúdo. Soma errada no carregamento local guarda a cópia crua, avisa no banner persistente, aproveita o
  que der e regrava; save de outro aparelho com soma errada não é aplicado e o local sobe por cima. Save
  antigo sem soma continua aceito. Complementa RF33 e RF34. No mesmo lote (2026-10-02), o save carregado com mais de 6 no time manda o
  excedente para a caixa em vez de perdê-lo (RN01) e a Dificuldade só aceita easy, ace ou elite.
- RNF23 — **Pipeline de dados e versão** (2026-10-07): `npm run validar:cru` confere esquema e contagens do
  dado cru antes do transform; `npm run diff:versoes` lista o impacto entre dois dados do jogo (espécies,
  golpes, habilidades, itens, chefões e Builds a revisar), com o snapshot de cada versão em
  `data/raw/snapshots/`; o alarme semanal (RNF21) usa a validação do dado cru. O app segue na 2.65beta até
  a versão nova sair oficialmente em eliteredux.net: linha "Versão do jogo" de `docs/decisoes_mecanicas.md`.
- RNF24 — **Dado derivado e leitura do Rank** (ADR-002 e ADR-003): dado que compara espécies é calculado em
  script e gravado em `data/`; dado que depende da run é calculado no app. A ADR-003 (ler o Rank por uma
  função só, `rankDe`) está implementada (ticket 01 da dívida técnica): nenhum leitor acessa `SPECIES_RANK`
  direto, e o save não reescreve mais os campos dele.
- RNF25 — **Processo de implementação** [revisa RNF17]: cada ticket de `docs/tickets/` é feito num worktree
  próprio; o hook de pré-commit roda `scripts/verificar.mjs` (travas, unitários, sabotagem, build e testes
  de navegador) e pega uma trava da máquina que impede duas verificações ao mesmo tempo; `npm run check`
  inclui `scripts/checar_fronteira.mjs`, que reprova regra em `src/regras` que leia ou desenhe a página
  (ADR-001 e ADR-004).
- RNF26 — **Paleta B Shiny** (tickets 09 a 15, 2026-10-07): a interface usa a paleta preto, ouro e rubi nos
  tokens de `src/css/tokens.css`, sem alternador de paleta, com contraste AA nos pares de texto; a fonte de
  destaque (`--fonte-display`, Potta One, com reserva) só nos títulos de 14 px ou mais; a ficha tem o card de
  stats com TOTAL, o card "Efetividade de tipos" (Fraco, Resiste, Imune, com as innates) e os botões
  anterior/próximo na ordem da lista; a Dex vazia e o topo usam a arte do Rayquaza shiny; a tela do chefão
  tem a arte da Equipe Aqua ou Magma e o card do Pokémon do chefão com o botão "Exportar" (a Build daquele
  Pokémon em formato Showdown, que RF48 não revoga); as 4 abas do celular cabem sem rolar a partir de 360 px.
  A arte oficial só serve porque o app é privado (ticket 09).
- RNF27 — **Acessibilidade** [revisa RNF06] (ticket 10): `prefers-reduced-motion` vale no CSS e na rolagem
  feita pelo código; as listas da Dex e dos Chefões são listbox com Home e End; o contorno de foco usa
  `--focus`.
- RNF28 — **Desempenho do simulador**: o botão do chefão devolve a vez à tela a cada ~40 ms (maior trava
  medida: 143 ms com 22 candidatos); o Rank e os testes usam a versão direta, com o mesmo resultado.

### Tickets de 07/10 e onde foram parar

Os tickets 01 a 19 de `docs/tickets/pendencias-2026-10-07/` estão resolvidos ou feitos, menos o 08.
01: RNF25. 02: RF103. 03: RF104. 04: RF105. 05: RF106. 06: RF107 (os efeitos não modelados viraram os tickets
16 a 19). 07: RF112. 09 a 15: RNF26. 10: RNF27. 16 a 19: RF107. 08 (Rank × comunidade): o Rank foi recalculado
com os tickets 02 a 19 e com a escolha de configuração corrigida (RF92); continuam em aberto a comparação
com os físicos fortes da comunidade, a nota de cobertura e suporte, o Zarude, a Floettite e a Dragoninite Y e
as Builds dos vídeos.

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
- RNF06 — **[REVISADO por RNF27]** **Acessibilidade**: toda funcionalidade de navegação (Dex, Chefões) deve ser operável via
  teclado, com foco visível e semântica reconhecível por leitor de tela (padrão ARIA de listbox).
- RNF07 — **Integridade de dado**: o Terminal deve recusar-se a carregar (com mensagem clara de erro) se
  os dados do jogo não tiverem sido embutidos corretamente na publicação.
- RNF08 — **Fidelidade de dado**: nenhuma informação de jogo (stat, habilidade, golpe, item) exibida ou
  usada em cálculo pode ser inventada — toda ela deve vir do dado real extraído do NextDex oficial.

## 3. Regras de negócio (específicas do domínio Elite Redux)

- RN01 — O time do jogador tem no máximo 6 membros.
- RN02 — Cada espécie pode ter no máximo 3 Builds salvas simultaneamente; exatamente uma delas é a
  "ativa" a qualquer momento.
- RN03 — A soma dos EVs de uma Build não pode ultrapassar 510, nem 252 por stat individual.
- RN04 — **[REVISADO 2026-09-16]** O Level cap vigente é determinado pela combinação da escolha Level cap do
  setup do jogo (Easy/More/Elite, separada da Dificuldade) e da Etapa, conforme a tabela oficial do hack
  (`data/levelcaps.json`) — não é um valor livre. A redação original combinava a Dificuldade (Easy/Ace/Elite)
  com a Insígnia; só coincidia com a atual na combinação Ace + More.
- RN05 — Só evoluções cujo requisito seja estritamente "por nível" (`EVO_LEVEL`/`EVO_LEVEL_MALE`/
  `EVO_LEVEL_FEMALE`) evoluem automaticamente pelo Level cap; evolução Mega/Primal fica de fora dessa
  regra. Correção 2026-09-11: verificado nos dados brutos (`evoKindT`/`evolutions[].kd`, todas as 1906
  espécies) que este hack **não tem nenhuma evolução por troca, pedra ou amizade** — as únicas condições
  reais são nível (com ou sem trava de gênero) e Mega/Primal. A exclusão de troca/pedra/amizade citada em
  versões anteriores desta regra descrevia uma categoria vazia neste hack, não um caso real observado.
- RN06 — Uma Build gerada por IA que não corresponda exatamente às opções reais da espécie (habilidade,
  golpe, nature) é descartada, nunca salva parcialmente incorreta.
- RN07 — Uma entrada de Build já curada manualmente (`data/builds.json`) nunca é sobrescrita
  automaticamente por uma sugestão da IA ou do Especialista em Meta Pokémon.
- RN08 — O mapeamento de cada líder de ginásio para a Etapa (Insígnia) que sua derrota concede segue a
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
