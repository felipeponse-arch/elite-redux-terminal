# 04 - Quem resolve o chefão (caso B na aba Chefões)

Status: resolvido (no master: merge dc103a7; marcado em 21/10)
Bloqueado por: 01 (módulo) e 02 (cartão de candidato)
Desbloqueia: nada

## O que o usuário decidiu (15/10/2026)
O caso B do pipeline, `especiesQueResolvem(alvo, opts)`, aparece na aba Chefões: em cada chefão, para cada
Pokémon dele, a lista dos Pokémon que o derrubam, com motivo e selo (o mesmo cartão do ticket 02), priorizando
os do TIME e da CAIXA do jogador e depois os demais. Semi-automático, interação mínima: só calcula quando o
jogador abre a seção, com cache.

## Escolhas feitas aqui (o desenho não dizia; opção mais simples coerente com o que existe)
1. **Onde:** card "Quem derruba este chefão" no detalhe do chefão, logo abaixo de "Montar time contra este chefão".
   É um `<details>` recolhido (mesmo estilo do bloco do time do ticket 02). Abrir é o único clique.
2. **Um grupo por Pokémon do chefão**, cada um também recolhido (`<details>` aninhado). Calcula só quando o
   jogador abre aquele Pokémon (cada um custa alguns segundos: ~66 ms por espécie simulada). Sem abrir, nada roda.
   Ao abrir o card, o primeiro Pokémon já vem aberto (o "primeiro Pokémon" é o que o jogador enfrenta primeiro).
3. **"Os demais" não pode ser o dex inteiro** (1906 espécies x 66 ms = ~2 min por alvo). Regra nova no módulo,
   `opts.demais = N`: além do time e da caixa, simula as N melhores do rank (`rankDe(...).score`) que já dá para
   pegar na Etapa atual (`rank.etapa <= milestone`), respeitam o Monotype e não estão no time nem na caixa.
   A tela usa N = 24 e mostra até 5 dos demais que derrubam. Sem `demais`, o módulo se comporta como antes.
4. **Ordem:** time e caixa primeiro (dentro deles, os 3 níveis do usuário: 1 golpe e bate primeiro > 2 golpes e
   bate primeiro > resto; mais dano antes), depois os demais na mesma ordem. Cada resultado traz `origem`
   (`time`, `caixa`, `outros`, ou `informada` quando vem de `opts.especies`); a tela escreve "No seu time",
   "Na sua caixa" ou "Fora da caixa - disponível desde a Etapa N". `opts.max` vale por grupo (time+caixa, demais).
5. **Cartão:** reaproveita `pipelineCandidatoHtml` (veredito, golpes, habilidade, motivos, selo) sem o botão
   "Usar no editor"; cabeçalho com sprite, nome, origem e "Abrir a ficha".
6. **Qual time do chefão:** o módulo mede o time da Dificuldade do jogador (`bossPartyPorDificuldade`). Se o jogador
   estiver olhando outra variante (ex.: Hell enquanto joga Ace), o card não calcula e diz isso em uma linha.
7. **Cache:** por chefão + variante + índice + level cap + configurações da run + time + caixa (`especiesQueResolvem`
   é pura, mas lê o time e a caixa). Mudou algum, a chave muda.
8. **Vazio e erro:** nenhum Pokémon derruba = frase explicando ("Ninguém do time, da caixa ou das melhores do rank
   derruba em 2 golpes"). Exceção no módulo = mensagem curta, nunca quebra a aba.
9. Fora de escopo: IA, gravar build, dupla/Fake Out (o motor 1x1 já avisa), mudar o cálculo de dano.

## Critérios de aceite
- [x] `especiesQueResolvem(alvo, { demais: N })` soma as N melhores do rank disponíveis na Etapa, fora time e caixa; sem `demais` o resultado é o de antes; teste de unidade e sabotagem.
- [x] Cada resultado tem `origem`; time/caixa vêm antes dos demais.
- [x] No detalhe de um chefão, o card recolhido "Quem derruba este chefão" só calcula ao abrir; cada Pokémon do chefão tem seu grupo com cache.
- [x] Cartões com veredito, motivo e selo (mesmo texto do módulo, por `escapeHtml`).
- [x] Variante diferente da Dificuldade da run: aviso, sem calcular.
- [x] Desktop 1280 e 375, claro e escuro, sem rolagem horizontal; foco visível; alvo de toque >= 44 px no celular.
- [x] Seção de navegador com cliques reais.

## Comentários
- 15/10/2026: entregue. Módulo: opts.demais/maxDemais + origem (teste novo + 3 sabotagens pegas, 4/4 do grupo). Seção 30 da suíte de navegador (13 checagens) + seções 27 e 28 verdes. Capturas quem-resolve-*.png (1280 e 375, claro e escuro, sem rolagem horizontal). Revisão pelas Web Interface Guidelines feita à mão (o fetch das regras falhou): reticências "…" no estado de carga, role=status, foco global :focus-visible, alvos de 44 px no toque.
- Custo medido: ~66 ms por espécie simulada; um Pokémon do chefão = time+caixa+24 do rank, poucos segundos.
- Para decidir (produto): as 24 do rank e o máximo de 5 "fora da caixa" são números escolhidos aqui; mudar é uma constante em src/ui/quem_resolve.js.
