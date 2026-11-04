# Pesquisa: acelerar o teste de sabotagem sem perder qualidade

Data da pesquisa: 04/11/2026. Pesquisador-web. Regra de qualidade: mutante só conta como "pego" com falha de asserção.

## Ranking recomendado

1. **Mapa mutação→arquivo de teste (cobertura) + rodar só os testes que cobrem a linha.** Ganho: a documentação do Stryker diz que é a principal alavanca (`coverageAnalysis: perTest`, padrão atual); fontes secundárias citam ~10x, não verificado. Pesquisa de 2022 (Vercammen et al., arXiv 2210.17215, Tabela 5): seleção por cobertura + schemata deu 2,07x a 30,52x em C++. Custo aqui: baixo-médio, ~150 linhas (cobertura por arquivo de teste, cacheada). Risco: granularidade por arquivo ganha menos que por caso de teste (o próprio artigo avisa). Qualidade: mantém 100% dos testes que cobrem a linha.
2. **Paralelismo (pool de workers).** PIT, 2016 (Frankel): 1 thread 14m14s → 4 threads 7m30s (~50% menos). Stryker: concorrência padrão = núcleos-1 acima de 4 núcleos. Custo: baixo, ~40 linhas. Risco: memória e disputa de arquivo temporário. Qualidade: nenhuma perda.
3. **Cache incremental por hash (fonte + teste).** PIT, 2016: 2ª execução com histórico 17,8s (contra ~7 min). Stryker: `--incremental` desde 6.2, mas NÃO detecta mudanças fora dos arquivos mutados e de teste (dados JSON, config). Custo baixo. Risco: esses arquivos precisam entrar no hash. Qualidade: sem perda se o hash cobrir tudo.
4. **Parar no primeiro AssertionError do mutante (bail).** Padrão do Stryker (`disableBail: false`). Ganho medido pelo Stryker: 2m33s com bail contra 2m45s sem (~7%). Custo: nenhum. Regra: parar só em falha de asserção, nunca em crash ou timeout, senão conta mutante que não foi pego.
5. **Mutant schemata / mutation switching (compilar uma vez).** Stryker4s (2018): ganho ilustrativo, sem medição. Vercammen 2022: 2x-30x, mas com `if` aninhado chega a 0,81x (pior) e timeout chega a 93% do tempo. Custo: alto para JS (transformação de AST, cuidado com `const`). Em JS o ganho maior vem de evitar o boot do Node por mutante. Não recomendo agora; primeiro medir quanto do tempo é boot.
6. **Amostragem de mutantes.** Zhang et al. (ASE 2013): 5% amostrado ainda preciso, segundo fonte secundária. Wong & Mathur (1995): -90% de mutantes com perda de 0,16 pontos (fonte secundária). Papadakis & Malevris: amostra de 10%-60% reduz detecção de falhas de 26% para 6% (medida de falha, não de escore). Custo: nulo. Risco: alto, perde a garantia de "pego" em mutante específico. Usar só em rodada rápida local; a completa fica antes do commit.
7. **Flags do node:test.** `--experimental-test-isolation=none` (o nome `--test-isolation` não foi confirmado): ganho não medido. Risco: com mutação por troca de texto em memória, o cache de módulo do Node pode carregar a fonte antiga; é inferência, não verificada. `--test-bail`: não encontrei documentação confirmada. Não recomendo sem teste.

## Não encontrado
- Fail-fast por mutante isolado (parar no 1º teste que falha) medido em estudo: não achei. O Stryker é a única fonte prática.
- Número confirmado do "10x" do perTest: só fonte secundária.
- Pesquisa de 2022 sobre TIA com PIT: o número 3% de mutantes perdidos apareceu em snippet sem URL confirmada; não usei.
- Stack Overflow, Reddit e Hacker News: a busca não trouxe threads úteis.

## Fontes
- Stryker, incremental: https://stryker-mutator.io/docs/stryker-js/incremental/ (lida em 04/11/2026)
- Stryker, configuração (coverageAnalysis, disableBail, concurrency, ignoreStatic): https://stryker-mutator.io/docs/stryker-js/configuration/ (lida em 04/11/2026)
- Stryker blog, announcing incremental mode: https://stryker-mutator.io/blog/announcing-incremental-mode/
- Stryker4s, mutation switching (2018-10-06): https://stryker-mutator.io/blog/mutation-switching/
- Fränkel, Faster Mutation Testing (2016-06-19): https://blog.frankel.ch/faster-mutation-testing/
- Vercammen et al., Mutation Testing Optimisations using the Clang Front-end (arXiv 2210.17215, 2022): https://ar5iv.labs.arxiv.org/html/2210.17215
- Zhang et al., ISSTA 2013 (seleção de testes alcançáveis): https://personal.utdallas.edu/~lxz144130/publications/issta2013a.pdf
- Zhang et al., ICSE 2010 (seleção de mutantes): https://personal.utdallas.edu/~lxz144130/cs6301-readings/zhang-icse10.pdf
- Stryker FAQ (command runner sem perTest): https://stryker-mutator.io/docs/General/faq/

## Confiança
- Alta: perTest e bail são os padrões do Stryker; incremental não vê mudança fora dos mutados e testes; PIT 14m→7m30s com 4 threads (blog, uma medição).
- Média: ganhos de schemata (medidos em C++, não em JS); ranking 1-4.
- Baixa: flags do node:test, sampling para este caso, 10x do perTest.

## Próximo passo sugerido
Medir antes de escolher: quanto do tempo é boot do Node por mutante. Se for a maior parte, o ganho está nos itens 2 e 3 (paralelo e cache), sem mexer na qualidade.
