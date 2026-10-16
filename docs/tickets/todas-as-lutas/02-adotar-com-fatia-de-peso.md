# 02 — Adotar todas as lutas no rank e no Meu Time, com fatia fixa de peso

Status: pronto-para-agente (DEPOIS do reset semanal de terça 21/10/2026, 23h)
Bloqueado por: desempenho-calculo/01 (cálculo mais rápido)
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
