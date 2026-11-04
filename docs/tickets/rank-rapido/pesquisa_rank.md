# Pesquisa: acelerar o rank sem mudar o resultado

Pesquisa feita em 04/11/2026 pelo pesquisador-web. Fontes acessadas nessa data. Sem medição no projeto: os números abaixo são de terceiros ou anedóticos.

## Conta a conferir antes de tudo
- Dados do pedido: ~1600 espécies x ~32 s por espécie×dificuldade em 1 núcleo, com 12 núcleos.
- 1600 x 32 s / 12 núcleos ≈ 71 min, não 2h50. Ou o número de tarefas é outro, ou o custo por tarefa é outro. Confirmar com o `--cpu-prof` antes de planejar.

## Ranking recomendado (ordem de ataque)
1. **Medir primeiro (risco zero).** `node --cpu-prof --cpu-prof-interval 200` (padrão 1000 µs). Fonte: https://nodejs.org/api/cli.html (acessado 04/11/2026). Mostra onde está o custo real.
2. **Fila LPT + pool fixa de workers (ganho alto, risco baixo).** Ordenar tarefas do custo maior para o menor e entregar à fila. Para LPT, a pior razão é 4/3 − 1/(3m) do ótimo, análise de Graham (1969): https://en.wikipedia.org/wiki/Longest-processing-time-first_scheduling. Node recomenda pool, porque criar workers custa: https://nodejs.org/api/worker_threads.html. Piscina usa fila FIFO por padrão e aceita fila própria (`taskQueue`), afirma até 6x com 100 mil tarefas (número do autor): https://github.com/piscinajs/piscina. Work stealing não foi encontrado pronto para Node.
   - Prova de igualdade: o resultado de cada espécie não depende da ordem; comparar saída com e sem paralelismo, bit a bit.
3. **Memoização de dano por contexto (ganho provável alto, risco médio).** Cache por (atacante, golpe, defensor, nível, clima/campo). Não há medição pública. O port .NET do calculador do Smogon recomenda reusar objetos de geração e de Pokémon: https://github.com/SlimSeb/Lusamine.DamageCalc (fonte de terceiros). O oficial `smogon/damage-calc` não fala de cache: https://github.com/smogon/damage-calc.
   - Risco: chave incompleta devolve valor velho. Ex. típico: chave sem o percentual. Lista de entradas ocultas (tempo, ambiente) que não podem ser memoizadas: https://docs.rs/sui-bytecode/latest/sui_bytecode/intern/memo/ (exemplo de outro domínio).
   - Prova: rodar com cache e sem cache sobre todas as espécies e comparar Float64 exato (Object.is). Divergência em uma = cache inválido.
4. **Cuidado com ponto flutuante (regra, não otimização).** A especificação ECMAScript diz que Math.sin, pow, exp etc. podem variar na última casa entre motores. Relatos de Node 22 e Chrome divergindo: https://tc39.es/ecma262/multipage/numbers-and-dates.html e https://github.com/openfrontio/OpenFrontIO/pull/5817 (relatos de PR, não medidos).
   - Implicação: não reordenar somas (float não é associativo); cache persistido precisa de hash com versão do Node.
5. **Micro-otimizações V8 (ganho pequeno a médio, risco baixo se o resultado for comparado).** Float64Array, formato de objeto fixo, sem alocação no laço quente. Números anedóticos (uma rodada): 35 ms vs 27 ms e 13 ms vs 23 ms, em fonte de blog: https://medium.com/@chadhamoksh/v8-hot-code-path-part-2-hidden-class-ae68015dfcda. Só depois do passo 1 mostrar o gargalo.
6. **Poda branch-and-bound / dominância (ganho potencial alto, risco alto).** Só é segura com limite superior admissível. Nau (1984) trata dominância como poda: https://www.cs.umd.edu/~nau/papers/nau1984general.pdf. Numa busca gulosa de 4 golpes, poda pode mudar a escolha. Só fazer se provar que nunca muda o golpe escolhido, em todas as espécies. Esforço alto.
7. **Cache persistente e checkpoint (ganho de retomada, não de velocidade).** Chave = hash de dados + motor + versão do Node. Fonte de chave estável entre processos: https://cocoindex.io/docs-v1/advanced_topics/memoization_keys (terceiro).
8. **Memória compartilhada (SharedArrayBuffer) em vez de clonar.** Node: SharedArrayBuffer fica acessível dos dois lados e não entra no transferList; ArrayBuffer copiado sem transferList: https://nodejs.org/api/worker_threads.html. Ganho não medido para este caso. Medir o custo de clone do payload antes.
9. **Amostragem estratificada.** Só para verificar, nunca como resultado.

## Não recomendado para este caso
- PvPoke: filtra espécies fracas (score < 70) para acelerar: https://pvpoke.com/rankings/all/1500/overall/ e https://github.com/pvpoke/pvpoke. Isso muda o resultado. Só serve de referência de conceito.

## Não encontrado
- Nenhuma fonte mede memoização de dano por contexto nem poda gulosa de moveset com equivalência provada.
- Nenhum projeto de moveset por simulação com busca: o mais próximo foi https://github.com/Enrique-Perez-H/pokemon-team-builder (usa beam search, sem prova de equivalência).
- Sem benchmark de clone vs SharedArrayBuffer para payload de ~2250 inimigos.

## Confiança
- Alta: fatos de Node (workers, cpu-prof, transferList), LPT (4/3 − 1/(3m)).
- Média: piscina (número do autor), memoização como ganho.
- Baixa: números de V8, relatos de divergência de Math entre motores.

## Próximo passo sugerido
1. Rodar `--cpu-prof` no `--amostra` e conferir a conta de 71 min x 2h50.
2. Se confirmar, LPT + pool antes de qualquer cache.
