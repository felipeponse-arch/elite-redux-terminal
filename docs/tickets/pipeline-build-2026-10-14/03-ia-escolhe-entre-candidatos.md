# 03 - A IA escolhe entre os candidatos do pipeline

Status: pronto-para-revisao (branch `pipeline-ia-escolhe`, a partir de `pipeline-tela` 1fbc125; sem merge e sem publicação)
Bloqueado por: 01 (módulo), 02 (tela)
Desbloqueia: nenhum

## Decisão do usuário (15/10/2026)
O botão "Gerar builds do time com IA" (aba Chefões e time novo) e o "Gerar build com IA" da ficha (mesmo caminho, `generateBuildWithAI`) passam a fazer a IA ESCOLHER ENTRE os candidatos de `candidatosDeBuild` e explicar a escolha, em vez de criar a build do zero. É o passo 4 de `docs/pipeline_de_build.md`. O resultado passa por `fecharBuild(candidato, escolha)` e pela validação local (`validateAiBuild`). Prioridade: a IA nunca inventa build fora dos candidatos > economia de tokens > texto.

## O que entrega
`src/regras/escolha_ia_candidatos.js` (marcador no template, depois de `pipeline_build.js`), sem tela e sem chamada à IA:
- `montarPromptEscolhaDeBuild(sp, r, opts)` e `montarPromptEscolhaDoTime(itens, opts)`: mandam só os candidatos compactos (habilidade, inatas, golpes, veredito, motivos, avisos, rascunho do motor com natureza/EVs/item), a lista de itens e o contexto do time/arquétipo. NÃO mandam movepool, ordem de decisão, plano de golpes futuros nem fraquezas do time.
- Resposta pedida: `{"escolha":N,"nature","item","evs","rationale"}` (no lote, dentro de `{"builds":{CHAVE: ...}}`).
- `escolherCandidatoDaIa(sp, r, bruto, opts)`: confere a resposta e devolve `{ build, origem, indice, motivo }`, nunca lança:
  1. `escolha` fora de 1..n (ou texto, 0, 1.5, ausente), resposta que não é objeto, ou resposta que cita habilidade/golpes diferentes dos do candidato = recusa; cai no MELHOR candidato do motor (o 1º do ranking que passa na validação), `origem: "motor"`, SEM outra chamada.
  2. Escolha válida: habilidade e golpes vêm SEMPRE do candidato; natureza/item/EVs da IA passam por `fecharBuild` e, com chefão, pela validação estratégica dele (golpe-chave do simulador, armador do clima, buffs). `origem: "ia"`.
  3. Candidato certo mas natureza/item/EVs inválidos: mantém o candidato da IA com o rascunho do motor (`origem: "ia-escolha"`), sem outra chamada.
  4. Nenhum candidato passa na validação (ex.: a do chefão): `build: null`, quem chamou usa o caminho antigo.
- `candidatosParaAEscolhaDaIa(sp, opts)`: só vale no modo normal (sem `opts.modo`), com alvo e com candidato. No botão do chefão o alvo é o chefão; no resto, o próximo líder de ginásio. Chave geral `escolhaEntreCandidatosLigada` (reverte o recurso numa linha).

`src/ui/ia.js`: `generateBuildWithAI` e `gerarBuildsDoTimeComIA` usam o caminho acima. No lote, quem tem candidato vai numa consulta só de escolha; quem não tem segue a consulta antiga; quem a escolha não resolveu (chamada caiu, nenhum candidato válido, lista cheia) vai pelo caminho individual, como antes.

`src/regras/gravacao_build_ia.js`: com `opts.semPlano` a build sai marcada `pedirPlano` (em vez de `planoConsultado`), porque a IA da escolha não vê os golpes futuros; havendo golpe futuro, a revisão de plano que já existe cuida.

## Regras (do pedido)
- Prompt MENOR: medido (Courtney Meteor Falls, milestone 3, time Centiskorch/Ledian/Typhlosion/Scizor/Glalie/Raticate, todos com candidatos): lote de 6 de 70.751 para 19.176 caracteres (-73%); individual (Ledian) de 21.628 para 8.624 (-60%).
- Resposta fora dos candidatos: a validação recusa e cai no melhor candidato do motor, sem gastar outra chamada.
- Sem candidato (sem chefão adiante, sem alvo): comportamento antigo (prompt da build do zero). Revisão pós-evolução e ponte da curada também seguem como eram.
- Não mexe em mecânica nem no motor.

## Critérios de aceite
- [x] O botão da ficha faz uma chamada; o prompt traz os candidatos e não traz movepool nem ordem de decisão (unidade e seção 29).
- [x] A build salva é o candidato escolhido (habilidade e golpes dele) com natureza, item, EVs e explicação da IA.
- [x] Escolha fora, golpe ou habilidade inventados: cai no melhor do motor, 1 chamada só (unidade e seção 29).
- [x] Natureza/item/EVs inválidos: candidato da IA com rascunho do motor.
- [x] Lote: uma consulta para quem tem candidato; cada membro confere por conta; omitido ou errado cai no motor.
- [x] Sem alvo, revisão e ponte: caminho antigo, intacto (seções 10, 16 e 27 seguem verdes com a chave desligada).
- [x] Dado externo no prompt passa por `dadoExterno`.

## Testes
- `tests/unit/escolha_ia_candidatos.test.mjs` (14 testes, dado real da Meteor Falls).
- 13 sabotagens `escolha-ia-*` em `tests/unit/mutacoes.mjs`, todas pegas.
- Navegador: seção nova `scripts/smoke_tests/29_ia_escolhe_candidatos.js` (ficha com escolha válida, ficha com resposta fora, lote do time, sem chefão adiante). A IA é simulada por `window.claude`. As seções 10, 16 e 27 testam o caminho antigo e desligam a chave no começo (`definirEscolhaEntreCandidatos(false)`) e religam no fim.

## Rodada 1 do supervisor (15/10, REFAZER): o que mudou
1. Seções 10, 16 e 20 do navegador desligam a chave só dentro de try/finally (religa mesmo com return antecipado). Seções 17-29 rodam com a chave LIGADA (a 20 desliga localmente: testa as etapas do pipeline com o prompt do zero).
2. Lote que falha por inteiro: cada membro grava o MELHOR candidato do motor, sem pedir de novo ("Melhor candidato do jogo (a IA nao respondeu)"). Caminho individual só para quem não tem candidato válido. Lista cheia: não pede de novo, avisa o limite.
3. O plano de trocas voltou ao PRÓPRIO prompt de escolha, compacto e só na espécie com golpe futuro de dano/pivô (até 6). Sai o `semPlano`/`pedirPlano`: a gravação é a de antes.
4. Contexto do time de volta, curto: papel natural, itens em uso/esgotados, golpes já no time, papéis cobertos, fraquezas do time, guia de papel e, no chefão, a quem o Pokémon responde e o golpe-chave provado (individual e lote).
Respostas do usuário: origem segue "ia" com a explicação; sem chefão adiante a IA também escolhe entre os candidatos por sinergia (selo Estimado).

## Comentários / perguntas ao usuário
(Perguntas 1 a 3 respondidas pelo usuário em 15/10: ver acima.)
