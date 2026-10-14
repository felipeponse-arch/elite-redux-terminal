# Elite Redux Terminal

Ferramenta de apoio a uma run de Pokémon Elite Redux 2.65: Dex do hack, montagem de time e builds, plano contra cada chefão e rank das espécies.

## Versões

**Versão do jogo**:
O número da versão que o jogador instala, como anunciado pelos desenvolvedores (ex.: 2.65.4.1b).
_Avoid_: versão (sozinha), patch

**Dado do jogo**:
A cópia dos dados do jogo (espécies, golpes, habilidades, treinadores) que o app usa, identificada pelo rótulo da fonte e pela data do corte (ex.: NextDex 2.65.4, 07/10). Pode não coincidir com nenhuma Versão do jogo.
_Avoid_: versão (sozinha), dex

## Progressão da run

**Dificuldade**:
A escolha do jogador no jogo (Easy, Ace, Elite, Hell); ela define o time que cada chefão usa ao longo de toda a run. Hell é uma Dificuldade do jogo: o app só a consulta, não a simula.
_Avoid_: modo, nível de dificuldade

**Variante do chefão**:
O time que um chefão usa, determinado pela Dificuldade: Padrão (Easy e Ace), Insane (Elite) ou Hell (Hell).
_Avoid_: party, time party, nível de time

**Etapa**:
O ponto da run medido em insígnias: 0 = sem insígnia, n = depois da n-ésima insígnia, 9 = Champion/Alto Comando.
_Avoid_: milestone, fase, stage

**Insígnia**:
O objeto ganho ao vencer um líder de ginásio; marca a passagem de uma Etapa para a seguinte.
_Avoid_: badge

**Level cap**:
O nível máximo dos Pokémon do jogador numa Etapa. É uma escolha própria do jogador no jogo, separada da Dificuldade.
_Avoid_: cap, teto, nível limite

## Build

**Build**:
O set completo de uma espécie: habilidade, item, natureza, EVs e quatro golpes.
_Avoid_: set, moveset (para o conjunto inteiro)

**Build ativa**:
A Build que a espécie está usando no time do jogador.

**Build anterior**:
Uma Build guardada quando outra a substituiu, para o jogador poder voltar a ela.
_Avoid_: variante de build

**Origem da build**:
De onde a Build veio: curada do Discord, gerada pela IA, comunidade (vídeo, Reddit) ou feita pelo jogador.

**Confiança**:
O quanto uma informação é sustentada: confirmado, consenso ou relato; a mesma escala vale para Builds e para decisões de mecânica.

**Aviso de build**:
Alerta de que a Build não serve na Etapa atual, como golpe depois do Level cap, Mega antes da pedra, clima sem setter ou item que só sai depois.
_Avoid_: trap build

## Rank

**Rank**:
O sistema que avalia cada espécie em duelos simulados contra as Variantes do chefão da Dificuldade da run.
_Avoid_: tier list, classificação

**Nota**:
O resultado de uma espécie no Rank, de 0 a 100, relativo às outras espécies.
_Avoid_: score, pontuação, rank (para o resultado)

**Tier**:
A Nota em letra: SS, S, A, B, C, D (do melhor ao pior).
_Avoid_: rank (para a letra)

**Potencial**:
A Nota calculada permitindo golpe de status ou setup entre os quatro golpes.

**Viabilidade**:
A Nota calculada só com quatro golpes de dano, sem planos de status ou setup.

**Rank por tipo**:
A Nota de uma espécie comparada só com as espécies que têm o mesmo tipo.
_Avoid_: rank Monotype

**Fora do rank**:
Espécie que não se pode obter durante a run, com o motivo: pós-jogo, só DexNav ou sem fonte.
_Avoid_: inobtível, sem rank

**Marca**:
Aviso sobre uma espécie que não altera a Nota, como "precisa de setter" ou "concorrência no tipo".

## Duelo e builds com intenção

**Hit-kill**:
Golpe ou sequência de golpes que derruba o Pokémon do chefão antes de ele agir. Tem dois níveis: "1 golpe" (um só golpe derruba; é o melhor) e "2 golpes" (dois golpes derrubam; é o segundo). Só conta junto com Bate primeiro. No duelo 1x1 do app; dupla não é simulada.
_Avoid_: OHKO, one-shot, mata no turno 1 (sem número conferido)

**Bate primeiro**:
O Pokémon da Build age antes do Pokémon do chefão: por golpe de prioridade ou por ter mais Velocidade. A prioridade não vale contra quem a bloqueia (Queenly Majesty, Dazzling, Armor Tail).
_Avoid_: first strike, speed tie

**Candidato de build**:
Um conjunto de quatro golpes e a habilidade, montado por código para uma espécie, com o motivo curto que o justifica (sinergia, prioridade, cobertura) e o resultado do Hit-kill contra o alvo. A IA só escolhe entre Candidatos; ainda não aparece na tela.
_Avoid_: opção de build, sugestão

**Calibração**:
Conferir o dano do motor do app contra a calculadora de dano do próprio jogo (EVs reais, Life Orb, clima, faixa de 85% a 100%, só o 1º golpe). Um dado calibrado tem número do jogo que o confirma; sem ele é estimado.
_Avoid_: ajuste, tuning
