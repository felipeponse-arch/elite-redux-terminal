# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Jogadores de Elite Redux (o hack de Pokémon) no meio de uma run: o dono do projeto e outros jogadores. Consultam a Dex e montam o time contra os chefões enquanto jogam, muito no celular ao lado do jogo e também no computador. Uso rápido, em sessões curtas, às vezes com a atenção dividida com o jogo.

## Product Purpose
Dex completa do Elite Redux com um montador de times e builds que pergunta, pela Etapa da run em que o jogador está, qual time e qual build extraem o máximo de cada Pokémon contra os chefões. Sucesso: o jogador abre o site, vê o time sugerido para a próxima luta e entende por quê, sem precisar saber metagame.

## Positioning
Não é só uma lista de Pokémon: a Dex vem com times e builds calculados pelo simulador de duelo do próprio jogo, contra os chefões reais e no nível da Etapa da run (sem IA). Referência de qualidade: o rigor de um Smogon, com cara de produto feito por fã para fãs.

## Operating Context
Run de Elite Redux (versão 2.65.x). O jogador acompanha a Etapa (ginásio, level cap), o time (6) e a caixa, e consulta chefões, golpes, habilidades e mega. O progresso fica no navegador (no site público não há sincronização entre aparelhos; exportar e importar save por arquivo está planejado).

## Capabilities and Constraints
- Abas: Dex, Meu Time, PC Box, Chefões, Progresso, Mais (Tipos e outras).
- Modo Motor monta o time pelo simulador; estilo do time vem das tags de papel do rank (Pivô, Tanque, Wallbreaker, Sweeper).
- Tudo em um arquivo único (`artifact_final.html`, ~8 MB, sem servidor) gerado por `npm run build`; publicado no GitHub Pages.
- Texto da interface em português do Brasil; termos do `GLOSSARY.md` (Dificuldade, Etapa, Build ativa, Confiança, Nota, Tier).
- Sprites vêm do próprio jogo (atlas já embutido). Nenhuma arte oficial da Nintendo/Pokémon além do que o jogo já traz.
- Dados do jogo e regras do motor não mudam por causa do visual.

## Brand Commitments
Nome: Elite Redux Terminal. Feito por fã para fãs; o dono do projeto pediu "conteúdo triple A para fãs de Pokémon". Sem identidade visual anterior documentada além do que o app já implementa.

## Evidence on Hand
Dados reais: `data/` (dex, rank dos 1940, chefões, level caps, builds), sprites em `data/sprite_atlas.png`, baselines visuais em `tests/visual_baselines/`. Não há depoimentos, números de usuários nem material de imprensa: nada disso deve ser inventado.

## Product Principles
1. A resposta primeiro: o time ou a build para a luta que vem, antes de qualquer enfeite.
2. Explicável sem metagame: cada sugestão diz por quê, em linguagem de fã.
3. Rápido no celular, no meio do jogo: poucos toques, leitura de relance.
4. Rigor honesto: o que é estimado ou não medido aparece como tal.
5. Feito por fã: o visual celebra Pokémon sem copiar arte oficial.

## Accessibility & Inclusion
Contraste suficiente nos três temas existentes (claro e dois escuros), alvos de toque confortáveis no celular, movimento reduzido respeitado. Padrão: WCAG 2.2 AA e eMAG 3.1 (já usados pelo projeto).
