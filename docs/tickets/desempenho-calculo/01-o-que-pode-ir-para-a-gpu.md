# 01 — Estudo: o que do projeto pode rodar na GPU (ou ficar mais leve no processador)

Status: a-avaliar (estudo; nada muda no app)
Pedido: Felipe, 16/10/2026 — "ver dentro do projeto o que pode ser rodado dentro da GPU pra não comer tanto o processador".

## Contexto
- Máquina: AMD Ryzen 5 5600GT (6 núcleos / 12 threads) + NVIDIA GeForce RTX 4060 Ti.
- Os cálculos pesados rodam em Node, em todos os núcleos (worker_threads), e deixam o PC lento:
  - `scripts/calcular_rank_duelo.mjs` (~26 min na versão nova);
  - `scripts/calcular_rank_v2.mjs` (~12 min só com chefões; ~2h30 no estudo com as 538 lutas comuns, ticket todas-as-lutas/01);
  - a suíte de testes e as sabotagens do portão (2 a 10 min).
- O motor de duelo (`src/regras/duelo.js`) é lógica com muitos desvios (habilidade, item, clima, status, prioridade): o tipo de
  conta que a GPU NÃO acelera bem. Reescrever o motor para a GPU (CUDA/WebGPU) duplicaria milhares de linhas de regra, e as duas
  versões teriam de dar sempre o mesmo resultado.

## O que o estudo responde
1. **Mapa do custo:** medir (profiler do Node, `--cpu-prof`) onde o tempo dos 2 ranks vai: dano, escolha de golpe, status, montagem
   da unidade. Quais trechos são conta numérica pura e repetida (candidatos a GPU) e quais são regra.
2. **Candidatos a GPU, com teste real:** por exemplo, a tabela de dano bruto (atacante x adversário x golpe, rolagem média) calculada
   em lote. Protótipo pequeno (WebGPU no Node ou `gpu.js`), medido contra o Node no mesmo lote, com resultado conferido número
   a número contra o motor (tolerância zero onde o jogo arredonda).
3. **Ganhos sem GPU, provavelmente maiores:** deduplicar adversários iguais (3348 sets distintos em 3726 Pokémon de treinador),
   cache de resultados por (espécie, set, adversário, nível), não simular lutas que o peso por ameaça zera, deixar um núcleo livre
   e baixar a prioridade do processo (`os.setPriority`) para o PC não travar enquanto roda.
4. **Recomendação:** o que vale fazer, quanto tempo economiza (medido) e quanto custa manter.

## Critérios de aceite
- [ ] Relatório curto em `docs/tickets/desempenho-calculo/estudo.md` com números medidos, não estimados.
- [ ] Qualquer protótipo fica fora de `src/` e de `data/`; o app e o rank publicados não mudam.
- [ ] Felipe decide o que adotar depois de ler.
