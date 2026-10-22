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

## Andamento (21/10/2026, engenheira do motor)
- **Rank:** `scripts/calcular_rank_v2.mjs` agora inclui as lutas comuns por padrão, com a fatia 60/40 (`scripts/rank_fatia.mjs`, a conta
  única; `--so-chefoes` é o rank antigo, `--fatia=` troca). A conta refatorada reproduz byte a byte o `fatia_0.6.json` de 16/10 (1598 espécies,
  0 diferenças). Teste com a composição real (29 chefões + comuns): quem gabarita só os chefões tira 0,6; sem a fatia, menos de 0,15.
- **Etapa 4 vazia (resolvida):** a planilha põe a cidade de Petalburg na etapa 0, mas o ginásio de lá é do Norman (etapa 4 em LUTAS_DA_RUN).
  Os 7 treinadores do ginásio ("Mary" e "Johanna" estão entre os mais perigosos) iam para a etapa 0. Correção só nas comuns
  (`ETAPA_DO_MAPA_DE_TREINADOR` em `scripts/estudo/lutas_comuns.mjs`; a disponibilidade de espécie/item não mudou). Mt Chimney (8 treinadores,
  sem etapa) vai para a 3, como Tabitha/Maxie Mt Chimney. SS Tidal (8) continua fora: nenhuma fonte diz quando o navio abre.
  Agora: 545 comuns, etapa 4 com 7.
- **Meu Time:** `data/lutas_comuns_run.json` (as 30 comuns mais perigosas de cada etapa, por dificuldade, com a ameaça medida e o time) é gravado
  pelo rank (`--gravar`, ou `--gravar-lutas=arq` com amostra). O Modo Motor lê dele: valor do juiz = 0,6 x chefões + 0,4 x comuns. Na busca entram 3
  comuns espaçadas (a mais perigosa de uma etapa do começo, do meio e do fim que faltam); a conferência mostra o resultado nas 3 mais perigosas de
  cada etapa. O arquivo que está no repositório é PROVISÓRIO (rank de amostra 1/80, 19 espécies): o recálculo final o sobrescreve.
- **Tempo no navegador** (Chromium, `montarTimePeloMotor`, máquina com ~80% de carga por outras sessões): 10 Pokémon, sem as comuns 2,9 a 4,0 s,
  com elas 7,8 a 8,0 s; 20 Pokémon, 10,0 s sem e 10,3 s com (o 20 Pokémon medido no idle em 21/10 foi 4,9 s). As builds continuam pelo campo de
  29 chefões (`alvo.campo` do pipeline não mudou).

## Falta (depois do reset)
1. `calcular_rank_v2.mjs --gravar` com a fatia 0,6 (mesmo cálculo de `scripts/estudo/fatias_de_peso.mjs`), sem refazer a
   simulação quando houver o arquivo por luta.
2. Meu Time: chefões + as lutas comuns mais perigosas de cada etapa, com o mesmo peso 60/40, tempo medido no navegador.
3. Testes (âncoras do rank, Pareto), changelog, publicar.
