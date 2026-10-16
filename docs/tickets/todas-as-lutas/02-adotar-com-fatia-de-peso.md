# 02 — Adotar todas as lutas no rank e no Meu Time, com fatia fixa de peso

Status: pronto-para-agente (DEPOIS do reset semanal de terça 21/10/2026, 23h)
Bloqueado por: nada (o desempenho-calculo/01 deixou de bloquear: o resultado por luta já está calculado)
Decisão do Felipe (16/10/2026), depois do [estudo](estudo.md): adotar com fatia de peso.

## O que entrega
1. Rank v2 guarda o resultado por luta (para trocar o peso sem refazer as 2h20 de simulação).
2. Peso em duas fatias: chefões e lutas comuns, cada fatia com o peso por ameaça já existente dentro dela.
3. Rodar 3 divisões (50/50, 60/40 e 70/30 chefões x comuns) e mostrar ao Felipe: quem sobe/cai, comunidade, top 30.
   Ele escolhe; a divisão escolhida vira o rank gravado.
4. Meu Time ("melhor no geral"): chefões + as 30 lutas comuns mais perigosas de cada etapa (pela ameaça medida no rank),
   na mesma divisão de peso, com tempo medido no navegador.
5. Conferir a etapa 4 vazia (rotas da época do Norman) no resolvedor de mapas.

## Critérios de aceite
- [ ] Rank gravado só depois da escolha do Felipe; teste que trava a divisão e a lista de lutas.
- [ ] Meu Time segue rápido (medido) e usa a mesma régua do rank.
- [ ] Changelog e publicação pela skill publicar-versao.

## Andamento (16/10/2026)
- Simulação completa feita (150 min) com `scripts/estudo/rodar_fatias_a_noite.ps1`: resultado por luta em
  `.claude/worktrees/fatias/por_luta.json` (fora do repositório; refazer com o mesmo comando se sumir).
- Comparação das divisões em `.claude/worktrees/fatias/comparacao.txt`. Elite, fortes da comunidade: só chefões 77,4; igual 80,4;
  50/50 79,9; 60/40 79,4; 70/30 79,1. Mudam de tier (Fácil/Elite): igual 18%/28%, 50/50 11%/17%, 60/40 10%/14%, 70/30 9%/12%.
- **Felipe escolheu 60/40 (chefões 60%, comuns 40%)** e aplicar TUDO junto depois do reset de terça 21/10 (rank + Meu Time,
  uma publicação).

## Falta (depois do reset)
1. `calcular_rank_v2.mjs --gravar` com a fatia 0,6 (mesmo cálculo de `scripts/estudo/fatias_de_peso.mjs`), sem refazer a
   simulação quando houver o arquivo por luta.
2. Meu Time: chefões + as lutas comuns mais perigosas de cada etapa, com o mesmo peso 60/40, tempo medido no navegador.
3. Testes (âncoras do rank, Pareto), changelog, publicar.
