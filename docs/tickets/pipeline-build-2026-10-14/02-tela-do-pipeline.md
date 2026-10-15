# 02 - Pipeline de build na tela (botão da ficha e lote do time)

Status: pronto-para-revisao (branch `pipeline-tela`, sem merge e sem publicação)
Bloqueado por: 01 (módulo, já no master)
Desbloqueia: 03 (a decidir: IA escolhe entre os candidatos, `fecharBuild`)

## O que o usuário aprovou (14/10 e 15/10/2026)
O módulo `src/regras/pipeline_build.js` (`candidatosDeBuild`) passa a aparecer na tela:
(a) um BOTÃO na ficha/build da espécie; (b) no LOTE de builds do time. Cada candidato mostra o MOTIVO
(`motivos`: hit-kill de 1 ou 2 golpes, quem bate primeiro e por quê, sinergias) e o SELO (`selo`:
"Calculado pelo código do jogo"; "Estimado: <motivo>" só com habilidade sem regra no motor, fuga no
Intimidate ou consulta sem alvo). Alvo padrão = o próximo líder de ginásio.

## Escolhas feitas aqui (o desenho não dizia; opção mais simples coerente com o que existe)
1. **Ficha, onde:** no editor "Meu build", na mesma linha do "Gerar build com IA": botão "Ver sugestões do jogo". Abre um painel logo abaixo, no mesmo estilo dos sets de "Estratégias" (bloco `--surface-2`, sem sombra nova). Clicar de novo fecha.
2. **Sem IA, sem custo:** o botão só chama `candidatosDeBuild` (~50 ms; sem chamada ao modelo). Não grava nada sozinho.
3. **Usar um candidato:** botão "Usar golpes e habilidade no editor" preenche a habilidade e os 4 golpes nos campos do editor; natureza, item e EVs ficam como estão (a IA ou o jogador fecham; é o `fecharBuild` do ticket 03). Quem grava é o "Salvar build" de sempre. Evita gravar um rascunho com item de referência (Sitrus Berry) sem o jogador ver.
4. **Alvo:** padrão = próximo líder de ginásio (mostrado no cabeçalho do painel: "Contra: Roxanne - Nosepass e o ás"). Um seletor "Contra" lista os chefões que faltam (`getRemainingBossEntries`) e recalcula; sem chefão adiante, mostra o aviso do módulo e candidatos só por sinergia.
5. **Lote:** na aba Meu Time, um bloco recolhível "Sugestões do jogo para o time" (logo abaixo dos cards do time). Ao abrir (único clique), calcula na hora o melhor candidato de cada membro contra o alvo padrão e mostra, por membro, golpes, habilidade, selo e o motivo principal, com link para a ficha ("ver todas"). Não calcula enquanto fechado (6 membros x ~50 ms só sob demanda). O "Gerar builds do time com IA" (aba Chefões / time novo) não muda neste ticket.
6. **Cache:** por espécie + level cap + marco + alvo; o motor é puro, então basta.
7. **Selo na tela:** "Calculado pelo código do jogo" usa a borda de `selo-confirmado`; "Estimado" usa a tracejada de `selo-relato` (classes que já existem), com o texto do módulo no `title` e escrito por extenso (não depende de cor).
8. Fora de escopo: a IA escolher entre candidatos (passo 4 do desenho), a dívida 05 e o caso B (`especiesQueResolvem`) na tela.

## Critérios de aceite
- [x] Na ficha de uma espécie, o botão "Ver sugestões do jogo" mostra de 3 a 5 candidatos (quando houver) com: golpes, habilidade e inatas, veredito (derruba em 1 ou 2 golpes / não derruba), motivos, avisos e selo.
- [x] O selo mostra exatamente `candidato.selo`; "Estimado" aparece quando o módulo diz `rotulo: "estimada"`.
- [x] Alvo padrão = próximo líder de ginásio; o seletor troca o alvo e o painel recalcula; sem alvo, aparece o aviso do módulo.
- [x] "Usar golpes e habilidade no editor" preenche habilidade e 4 golpes e atualiza o preview; nada é gravado até "Salvar build".
- [x] Na aba Meu Time, o bloco "Sugestões do jogo para o time" lista cada membro com o melhor candidato; fechado não calcula; vazio/erro mostra o motivo do módulo.
- [x] Texto vindo do módulo passa por `escapeHtml`; nenhuma regra nova em `src/ui` (só desenho; a fronteira ADR-004 segue).
- [x] Desktop e 375 px, claro e escuro, sem rolagem horizontal; foco visível; alvos de toque >= 24 px (44 px no celular).
- [x] Teste de navegador cobre o botão da ficha, o seletor de alvo, "Usar no editor" e o bloco do time.

## Comentários
- 15/10/2026: entregue. Seção 28 da suíte de navegador (22 checagens) + suíte funcional inteira verde (109 testes, sequência completa 626/626). Conferido por captura em 1280 px e 375 px, claro e escuro (sem rolagem horizontal). Revisão pelas Web Interface Guidelines: selo com glifo `aria-hidden` (o texto já diz tudo), hover no resumo do bloco do time.
- Escolhas extras: (a) o botão fica na mesma linha do "Gerar build com IA", com o mesmo estilo de botão; (b) a faixa de dano não vai no topo do candidato (o motivo do módulo já a traz e o número agregado de 2 golpes passa de 100%, o que confunde); (c) o veredito só diz "Derruba" sem "Provável" quando o módulo garante, calibrada e sem o alvo agir antes (igual ao texto do motivo); (d) o alvo lembrado volta ao padrão se o chefão deixar de faltar.
- Para decidir (produto): o "Gerar builds do time com IA" (aba Chefões e time novo) ainda não usa os candidatos (passo 4 do desenho, ticket 03). Quer que a IA do lote escolha entre eles?
