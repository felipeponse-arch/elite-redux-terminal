# Decisões de arquitetura (ADR)

Registro único das decisões de arquitetura do Elite Redux Terminal: estrutura de
módulos, fluxo de dados e build, testes e infraestrutura. A mecânica do jogo tem
o registro dela em `docs/decisoes_mecanicas.md`. Cada decisão diz o contexto, o
que foi decidido, o que foi descartado e como saber se está sendo cumprida.
Decisão nova entra no fim com o próximo número; decisão trocada não é apagada,
ganha "Substituída por ADR-N".

---

## ADR-001 - Uma worktree por sessão de implementação, e trava na verificação

**Data:** 2026-10-02 · **Estado:** aceita, em vigor

**Contexto.** Em 02/10 duas sessões do Claude trabalharam na mesma pasta ao mesmo
tempo. O `prepare_publish` recusou 3 vezes com erros que não eram do código
(`ENOENT` nos traces do Playwright, `ERR_CONNECTION_REFUSED`): cada execução da
suíte apaga o `test-results/` da outra. Na mesma pasta, as duas sessões dividem
ainda as edições não commitadas e o `artifact_final.html`, então uma publicação pode
levar mudança da outra. E a porta 8101 dos testes é da máquina: com
`reuseExistingServer`, uma sessão pode testar o build servido pela outra.

**Decisão.**
1. Sessão que vai editar código trabalha numa worktree própria do git
   (`.claude/worktrees/<nome>`, já ignorada pelo git). Para não reinstalar tudo,
   o `node_modules` da worktree pode ser uma junção para o da pasta principal
   (`New-Item -ItemType Junction -Path node_modules -Target ..\..\..\node_modules`).
   O commit sai da worktree e vai para a `main` por push (rebase se a `main` andou).
2. `scripts/verificar.mjs` (hook de pre-commit e `prepare_publish`) pega uma trava da
   máquina (`<tmp>/elite-redux-verificar.lock`, com pid, pasta e horário). Se outra
   verificação estiver viva, para na hora e diz qual é; se o dono morreu (queda de
   energia, Ctrl+C), assume a trava. Vale também entre worktrees, por causa da porta.

**Descartado.** Só a trava: as sessões seguiriam dividindo edições e build. Só a
worktree: uma sessão aberta fora dela traria o problema de volta sem aviso. Porta e
pasta de saída por sessão: resolve o atropelo da suíte, mas não o das edições.

**Como conferir.** `git worktree list` mostra uma worktree por sessão ativa; uma
segunda verificação simultânea termina em menos de 1 s com "Outra sessão já está
verificando".

**Atualização 2026-10-07.** Esta ADR só entrou no master em 07/10 (ticket 01). Nesse meio
tempo, em 06/10, cinco sessões na mesma pasta repetiram o problema: commits por índice
separado e hook falhando à toa. A partir de 07/10 a unidade de trabalho é o **ticket**
(`docs/tickets/`): um worktree por ticket (`.claude/worktrees/ticket-NN`, branch `ticket/NN`),
merge `--ff-only` no master e limpeza com a junção apagada ANTES do `git worktree remove`.
O passo a passo está em `docs/agents/issue-tracker.md`.

---

## ADR-002 - Dado derivado: no script quando compara espécies, no app quando depende da run

**Data:** 2026-10-02 · **Estado:** aceita (registra a regra que o código já segue)

**Contexto.** As marcas do rank v2 ficaram em lugares diferentes: a "Concorrência no
tipo" (Pareto) é calculada por `scripts/calcular_rank_v2.mjs` e gravada em
`data/species_rank.json`; o "Precisa de setter" é calculado pelo app
(`precisaDeSetter` em `src/regras/condicoes_habilidade.js`) ao abrir a ficha. Faltava
uma regra escrita para a próxima marca não cair no lugar errado.

**Decisão.**
- **Script → JSON em `data/`** quando o dado compara espécies entre si (rank,
  percentil, Pareto, papéis por percentil) ou custa mais que ~1 s para calcular. O
  app só lê.
- **App (`src/regras`)** quando o dado depende só da espécie e do estado da run
  (time, dificuldade, insígnias, modo de mega). Assim ele acompanha a run sem
  regravar dado, e pode passar a olhar o time (ex.: o setter considerar quem arma o
  clima no time).
- O dado gravado traz a dificuldade dentro (`porDificuldade.<dif>`); o app escolhe
  qual ler, não recalcula.

**Descartado.** Tudo no script: o app perderia o que depende do time da run. Tudo no
app: o rank leva ~4 min e não cabe na carga da página.

**Como conferir.** Função nova em `src/regras` que percorre todas as espécies para
comparar é sinal de dado que devia estar no script.

---

## ADR-003 - Rank lido por uma função só, sem reescrever SPECIES_RANK

**Data:** 2026-10-02 · **Estado:** aceita, A IMPLEMENTAR (sessão de implementação)

**Contexto.** `src/regras/rank_da_run.js` reescreve `tier`, `score`, `potencial`,
`viabilidade` e `monoRanks` de cada entrada de `SPECIES_RANK` quando o save carrega e
quando a dificuldade muda. Outros oito arquivos leem esses campos direto (`r.tier` 14 vezes,
`r.score` 11) sem saber que eles mudam. Quem guardar um valor antes do `applySave` fica
com a nota errada, e os testes precisam chamar `applySave` para enxergar a nota certa.

**Decisão.** O JSON carregado não muda depois da carga. Uma função de leitura,
`rankDe(sname)`, devolve a visão da dificuldade da run (tier, score, eixos, rank por
tipo, marcas) a partir de `porDificuldade`. `rankDaDificuldadeDe` (rank_da_run.js) é o
começo dela. Os leitores (`chefoes.js`, `formas_mega.js`, `mono_run.js`,
`prompts_ia.js`, `dex_ficha.js`, `dex_lista.js`, `ia.js`, `tipos.js` e o próprio
`rank_da_run.js`) passam a usar `rankDe`; `aplicarRankDaDificuldade` só guarda qual
dificuldade vale.

**Descartado.** Manter e só documentar: a dependência escondida continua e o próximo
leitor repete o risco.

**Como conferir.** `grep "SPECIES_RANK\[" src` só acha leitura dentro de
`rank_da_run.js`. Uma sabotagem que volte a reescrever o campo tem que ser pega.

---

## ADR-004 - Bundle em escopo único, com trava de fronteira entre regras e tela

**Data:** 2026-10-02 · **Estado:** aceita, em vigor

**Contexto.** `scripts/build.mjs` cola os 19 arquivos de `src/regras` e os 17 de `src/ui`
num só `<script>` do `artifact_template.html` (36 marcadores), no mesmo escopo. Isso é
de propósito: o artifact é um HTML único de ~8 MB que funciona offline, e os testes
carregam as regras sem navegador (`tests/unit/carregar_regras.mjs`, via `vm`). A
fronteira "regras não leem nem desenham a página" era só convenção: hoje vale (zero
`document`/`window` em `src/regras`), mas nada impedia que deixasse de valer. As regras
leem o `state` global 116 vezes. Essa é a entrada escondida que sobra, e fica
registrada aqui.

**Decisão.** Não migrar para módulos ES. `scripts/checar_fronteira.mjs`, dentro do
`npm run check`, falha quando um arquivo de `src/regras` usa `document`/`window` ou chama
uma função declarada só em `src/ui` (comentários e textos entre aspas não contam).

**Descartado.** Módulos ES com import/export: obriga um bundler e não traz ganho para
um HTML único. Passar o estado da run como parâmetro em vez de ler o `state` global:
fica como evolução futura. É a mudança maior e não foi pedida agora.

**Como conferir.** `npm run check` imprime "checar_fronteira: OK". Uma regra com
`document.` ou com chamada a uma função da UI quebra o check. Isso foi testado nos dois
casos em 02/10.
