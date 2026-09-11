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
- RN05 — Só evoluções cujo requisito seja estritamente "por nível" (`EVO_LEVEL`) evoluem automaticamente
  pelo level cap; evoluções por gênero, troca, pedra, amizade ou mega ficam de fora dessa regra.
- RN06 — Uma build gerada por IA que não corresponda exatamente às opções reais da espécie (habilidade,
  golpe, nature) é descartada, nunca salva parcialmente incorreta.
- RN07 — Uma entrada de build já curada manualmente (`data/builds.json`) nunca é sobrescrita
  automaticamente por uma sugestão da IA ou do Especialista em Meta Pokémon.
- RN08 — O mapeamento de cada líder de ginásio para o milestone de badge que sua derrota concede segue a
  estrutura geográfica real desta hack (qual líder ocupa qual ginásio), verificada contra o campo `map`
  dos próprios dados de treinador — nunca assumida a partir do conhecimento genérico do Pokémon Emerald
  vanilla, mesmo quando os nomes coincidem.

---

*Histórico: documento criado em 2026-09-10, retroativo — descreve o sistema como ele já existe hoje,
consolidando o que estava disperso em código e em memória de sessões anteriores. A partir de agora,
toda funcionalidade nova ganha sua entrada aqui como parte do rito de publicação, não depois.*
