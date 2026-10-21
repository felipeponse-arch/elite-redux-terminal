# Ticket 01 — Modo Motor no Meu Time

Status: pronto-para-agente — **PRIORIDADE ALTA** (Felipe, 17/10/2026). Começar depois do reset semanal de terça 20/10, 23h.
Tamanho: G. Relaciona: todas-as-lutas/02 (mesma régua 60/40 de lutas), time-melhor-no-geral (v180).

**Objetivo:** montar equipes e explicar suas decisões sem consumir a conta de IA do jogador, mantendo efetividade comparável à
opção atual baseada em Claude.

Base desta revisão: especificação fornecida pelo responsável do projeto em 19/10/2026. Esta nota não afirma que o repositório
foi inspecionado; caminhos, símbolos e comportamentos descritos precisam ser confirmados pelo agente antes de editar.

## 1. Decisão arquitetural

O Modo Motor deve ser uma pipeline determinística e auditável:

1. **Contexto da run:** etapa atual, level cap, campo de lutas, regras mono, favoritos, trava de Mega, estilo desejado,
   clima/tática e buffs ativos do chefão.
2. **Filtro de viabilidade:** excluir espécies, formas, Megas e builds indisponíveis ou incompatíveis antes de começar a busca.
3. **Geração de candidatos:** reutilizar `pipeline_build.js` e os moldes de quatro golpes já existentes, sem inventar legalidade
   ou dados de moves.
4. **Simulação:** medir candidatos contra o campo correto usando `simularLutaContraChefao` e `pontos` (confirmar assinatura e
   semântica no código).
5. **Busca de equipe:** selecionar membros e sets conforme o objetivo do time, respeitando Pokémon favoritos bloqueados.
6. **Classificação por build:** atribuir papéis somente com evidência do simulador; permitir múltiplos papéis e abstenção.
7. **Classificação do time:** escolher estilo principal, tags comprovadas, condição de vitória e plano B.
8. **Explicação:** gerar texto por templates determinísticos a partir dos resultados medidos — nunca inventar evidências.
9. **Validação e fallback:** comparar contra o modo IA; manter IA como opção até o critério de efetividade ser aprovado.

## 2. Decisões recomendadas para remover ambiguidades

### 2.1 Seleção de builds

Para não misturar dois comportamentos nem deixar o agente decidir silenciosamente:

- **Modo Motor sem favoritos:** preservar o requisito original de usar o primeiro candidato (top-1) do pipeline de build para
  cada Pokémon escolhido, até que um ticket separado aprove uma busca de builds mais ampla.
- **Modo Motor com 1–6 favoritos:** favoritos travam a espécie, não a build. A busca por papel pode escolher uma build diferente
  para cada favorito. Para as vagas livres, recomendo usar a mesma busca por papel, porque manter os demais membros sempre no
  top-1 pode impedir sinergias e tornar a busca assimétrica. Registrar essa diferença no relatório de comparação.
- **Não sortear sets para simular "sem limite".** Novas recomendações surgem quando mudam contexto, função necessária, campo
  adversário ou restrições. Com entradas idênticas, a resposta deve ser reproduzível.
- Se o dono do projeto preferir que apenas favoritos recebam busca por papel, essa é uma decisão de produto que deve ser
  explicitamente registrada antes de codificar; o padrão técnico recomendado nesta nota é otimizar as builds dos seis membros
  quando a busca por papel é acionada.

### 2.2 Três variantes de time

"Mais ofensivo", "mais seguro" e "sinergia" precisam ser objetivos de seleção distintos — não apenas nomes diferentes ou ordens
de Pokémon.

- **Mais ofensivo:** priorizar progresso imediato medido, capacidade de eliminar ameaças e pressão de Speed/priority.
- **Mais seguro:** priorizar cobertura dos maiores riscos do campo, sobrevivência, respostas repetíveis e menor dependência de
  uma única janela.
- **Sinergia:** priorizar complementaridade, habilitação/abuso/proteção de uma condição de vitória, cobertura de lacunas e plano
  de jogo coerente.
- Avaliar as três variantes com a mesma régua externa (pontos/Battle Rating e cobertura de ameaças) para que os números sejam
  comparáveis.
- Inspecionar o significado real de `ordem` em `montarTimeContraChefao` antes de usá-lo. Se `ordem` apenas mudar a ordem de
  avaliação, isso não prova que cria três objetivos diferentes; implementar ou reutilizar perfis de objetivo explícitos, se
  necessário, sem duplicar simuladores.

### 2.3 Build como unidade de classificação

- O papel passa a pertencer à build no contexto da run/campo, não à espécie em abstrato.
- A classificação é multirrótulo: papel primário e secundários só aparecem quando cada um tem evidência própria.
- Abstenção é comportamento correto: se os requisitos não forem demonstrados, não atribuir o papel.
- Não remover `species_role.json` nem trocar todos os consumidores no mesmo passo. Manter o legado como fallback até que ficha,
  builds e prompt da IA tenham migração coberta por testes.
- A taxonomia deve seguir o escopo aprovado (por exemplo, wallbreaker, pivô, sweeper, revenge killer, tanque, armador e
  suporte). Não adicionar categorias explicitamente fora do ticket.

### 2.4 Provas mínimas dos papéis

Os critérios exatos devem ser ajustados após inspeção do simulador, mas cada papel precisa de uma prova observável e
reprodutível:

- **Wallbreaker:** causa KOs ou dano decisivo contra os Pokémon bulky relevantes do campo; não basta Attack alto.
- **Pivô:** tem um move de troca válido e demonstra condições para executar a troca sem falhar no contexto medido; a explicação
  deve registrar a prova de sobrevivência/posicionamento usada.
- **Sweeper:** consegue executar setup e converter a vantagem em KOs subsequentes dentro do campo avaliado.
- **Revenge killer:** alcança a ordem de ação por Speed ou prioridade e consegue derrubar o alvo medido.
- **Tanque:** absorve ataques relevantes e continua contribuindo com dano, utilidade ou recuperação; HP/defesas sozinhos não
  bastam.
- **Armador:** instala clima, terreno, hazards, telas ou controle de Speed e produz benefício mensurável depois da instalação.
- **Suporte:** deve contribuir para a performance da equipe mesmo quando sua contribuição não é dano direto. Esse é um teste
  obrigatório do protótipo do juiz.

Para cada papel, guardar dados de prova, como alvo, número de KOs, dano, turnos, sobrevivência, mudança na pontuação e
limitações. Não usar texto gerado para substituir medição.

### 2.5 Tags do time e contribuição dos membros

Cada integrante pode ter uma ou várias contribuições:

- **Habilita:** estabelece a condição usada pelo plano (clima, terreno, telas, hazards ou controle de Speed).
- **Abusa:** obtém benefício medido da condição — dano, Speed, bulk, facilidade de setup ou resultado de batalha.
- **Protege:** cobre a ameaça medida que interromperia a condição de vitória ou o plano principal.
- **Fecha:** converte a vantagem em KOs/resultado final mensurável.

"Setter presente" não é prova suficiente para a tag de clima/tática. Exigir pelo menos dois membros com benefício mensurado da
condição. A regra precisa evitar que moves ou abilities apenas presentes na build sejam tratados como sinergia real.

- Estilo principal limitado, neste ticket, às categorias aprovadas: Hyper Offense, Bulky Offense, Balance e Stall.
- Tags permitidas conforme o escopo: clima, terreno, mono e táticas realmente implementadas e medidas.
- Não introduzir Fat Balance, Semi-Stall, Doubles/VGC, tags de ladder ou datasets rotulados manualmente nesta entrega.

### 2.6 Juiz comum e contribuições de suporte

Usar a simulação completa contra o campo do chefão, incluindo `buffsAtivosDoChefao` via `opcoes.buffs`, como juiz principal. Sem
chefe selecionado, usar a média das lutas da etapa, seguindo a mesma régua definida para todas-as-lutas/02 quando esse ticket
estiver disponível.

**Gate obrigatório antes da busca ampla:** provar que o juiz não favorece apenas builds atacantes. Criar casos em que telas,
clima, hazards, cura, pivô ou Trick Room/Tailwind melhoram o resultado da equipe. Se o score não reconhece essa melhoria, não
começar a otimização de papéis não-atacantes até corrigir a função de avaliação.

### 2.7 Efeitos persistentes no lado do time

Corrigir a simulação antes de confiar nos resultados do gerador. Telas, Trick Room e Tailwind precisam ser modelados como estado
do lado, com turnos restantes, não como benefício restrito ao Pokémon que usou o move.

Codificar as regras fornecidas no ticket e confirmar cada uma contra o código oficial já disponível no contexto do projeto:

- **Reflect/Light Screen:** turno do uso + 5; Light Clay aumenta a duração conforme a mecânica documentada; dano x0,5 em singles,
  com exceções relevantes.
- **Aurora Veil:** proteção física e especial, sujeita ao clima/condição exigida pelo jogo.
- **Tailwind:** turno do uso + 3; Speed x2.
- **Trick Room:** turno do uso + 5; novo uso desliga a condição; tratar o timer permanente do chefão como caso especial.
- Abilities de entrada que aplicam a condição usam duração curta de 3 turnos, conforme os dados fornecidos.
- O turno de uso não é decrementado como um turno posterior.
- Troca/desmaio não removem automaticamente o estado; os turnos avançam conforme as ações simuladas.

**Fontes (código oficial, `ferramentas/er-repo`, ramo `upcoming` 96af067 de 19/10/2026; o diff de 16/09 a 19/10 não mexe
nessas regras):**

| Regra | Arquivo:linha |
| --- | --- |
| Durações: Trick Room 5 (curta 3), telas 5 (Light Clay 8, curta 3), Tailwind 3 | `include/battle_util.h:56-67` |
| Reflect: fica no lado (`gSideStatuses[side]`), Light Clay estende | `src/battle_script_commands.c:9344` |
| Light Screen: igual ao Reflect | `src/battle_script_commands.c:10277` |
| Aurora Veil: só no granizo ou com Aurora Borealis | `src/battle_script_commands.c:7775` |
| Tailwind: fica no lado, 3 turnos | `src/battle_script_commands.c:10986` |
| Trick Room: usar de novo desliga (`HandleRoomMove`); timer > 10 = permanente | `src/battle_script_commands.c:11891-11913` |
| Fim de turno: o turno do uso não conta (`started`) | `src/battle_util.c:1799` (Reflect), `1930` (Tailwind), `2053` (Trick Room) |
| `started` zerado no começo do turno seguinte | `src/battle_main.c:4603-4605` |
| Dano x0,5 em 1x1 (x0,66 em dupla); não vale em crítico nem com Infiltrator | `src/battle_util.c:7649` |
| Speed x2 com Tailwind | `src/battle_main.c:4213` |
| Habilidades de entrada com duração curta | `src/abilities.cc:1367, 4437, 4464, 10085` |
| Defog e Brick Break removem as telas | `src/battle_script_commands.c:6534-6537` (Defog), `12422-12431` (Brick Break) |
| Screen Cleaner deixa pôr a tela de novo mesmo ativa (remoção pela habilidade NÃO conferida) | `src/battle_script_commands.c:9345` |

Hoje o simulador (`src/regras/duelo.js`) leva hazards (`ladoMeu`, `novoLadoDuelo` em `duelo.js:3329`) e clima
(`climaRestante`) de um membro para o próximo, mas tela/Trick Room/Tailwind usados como golpe valem só no 1x1 de quem usou.

Adicionar os fatos confirmados a `docs/decisoes_mecanicas.md`. Testar timers e persistência isoladamente antes de rodar a busca de
equipes. Não copiar números do ticket sem verificá-los na implementação e nos testes existentes.

### 2.8 Busca e custo computacional

- Implementar a busca incremental por membro com duas passadas, mantendo os demais membros fixos durante a avaliação local, como
  descrito no ticket.
- Tratar 6 × 4 × 2 ≈ 48 como estimativa de avaliações, não como prova de performance nem de ótima global.
- Documentar a limitação de busca gulosa: sinergias entre duas peças podem não aparecer quando apenas uma peça muda por vez.
- Medir com `performance.now()` no navegador, por variante e ponta a ponta. Alvo: menos de 10 s por time, não necessariamente
  para as três variantes juntas.
- Se necessário, priorizar cache de simulações com chave completa e estável (contexto da run, campo, buffs, set, ordem/estado
  relevante). Não reutilizar resultado quando algum componente que altera a batalha mudar.

### 2.9 Favoritos e plano B

- De 1 a 6 favoritos são espécies travadas e nunca podem ser retiradas automaticamente.
- As vagas restantes devem reparar lacunas mensuradas: cobertura, resposta a ameaças, habilitação/abuso do plano e condição de
  vitória.
- Se nenhuma opção funciona bem, exibir a melhor tentativa, a métrica alcançada e uma descrição factual (por exemplo, "vence 4 de
  6 confrontos simulados"), sem ocultar o resultado ruim e sem sugerir a remoção de favorito.
- O plano B deve identificar a ameaça do chefão que mais desmonta o plano e apresentar uma ou duas trocas somente em vagas não
  bloqueadas, com a melhoria medida na simulação completa. Se todos os seis forem favoritos, dizer que não há troca automática
  permitida; não violar o bloqueio.

## 3. Pontos de alto risco a testar primeiro

1. **Juiz cego para suporte:** um atacante ganha sempre de uma build de suporte no critério mesmo quando o suporte aumenta a
   vitória da equipe.
2. **Estado de campo incorreto:** screens/TR/Tailwind não persistem ou os timers descontam o turno errado.
3. **Variantes nominais:** as três equipes usam o mesmo objetivo e só mudam a ordem de avaliação.
4. **Sinergia não identificada:** o rótulo Rain/tática aparece com setter mas sem dois benefícios comprovados.
5. **Favoritos alterados:** um favorito é removido, transformado indevidamente ou ignorado no plano B.
6. **Disponibilidade tardia:** recomendação usa espécie/forma/Mega indisponível na etapa atual.
7. **Buffers/buffs esquecidos:** a avaliação ignora buffs ativos do líder.
8. **Papéis falsos:** rótulo vem de stat ou presença de move, sem prova da build no campo avaliado.
9. **Regressão do legado:** ficha, builds e prompt antigo perdem o papel da espécie antes de o novo classificador estar pronto.
10. **Tempo excedido:** as 48 avaliações ou as três variantes passam do limite no navegador real.

## 4. Plano de execução sugerido

### Fase A — Auditoria somente leitura

- Inspecionar `duelo.js`, `pipeline_build.js`, `src/ui/ia.js`, `src/ui/tipos.js`, `scripts/compute_species_role.ps1`,
  `data/species_role.json`, `src/regras/chefoes.js` e consumidores relevantes.
- Confirmar semântica e assinatura de `montarTimeContraChefao`, `simularLutaContraChefao`, `comQuatroGolpes`,
  `buffsAtivosDoChefao`, `opcoes.buffs` e `ordem`.
- Descobrir testes, convenções de fixture, versionamento e fluxo de publicação existentes.
- Produzir mapa de chamadas, riscos, plano de testes e estimativa medida; não editar arquivos nessa fase.

### Fase B — Corrigir e provar o simulador

- Escrever testes unitários de duração, persistência e remoção dos efeitos de lado.
- Conferir buffers ativos do líder.
- Construir casos de juiz com atacante e suporte, para testar se `pontos` mede contribuição real à luta completa.
- Registrar as regras confirmadas em `docs/decisoes_mecanicas.md`.
- Não avançar se a régua não distinguir suporte inútil de suporte que melhora o resultado da equipe.

### Fase C — Protótipo do Modo Motor

- Criar função pura/orquestrador testável para montar uma equipe sem `claude.use`.
- Encaixar filtros de etapa, mono, Mega e favoritos antes da busca.
- Executar as três políticas (ofensiva, segura, sinergia) e registrar as métricas.
- Adicionar medição de tempo e cache apenas com chave completa.

### Fase D — Papéis, tags e explicações

- Implementar saída de papel por build com evidências e abstenção.
- Manter compatibilidade com o formato legado até migrar os consumidores.
- Implementar contribuição habilita/abusa/protege/fecha por membro, com números medidos.
- Exigir dois benefícios comprovados por tag de clima/tática.
- Implementar plano B respeitando favoritos.

### Fase E — Comparação Motor × IA

- Usar o mesmo conjunto de Pokémon disponíveis, a mesma caixa, a mesma etapa, os mesmos buffs e o mesmo juiz.
- Cobrir várias etapas, os quatro estilos aprovados e runs mono.
- Comparar vitórias/resultado por luta (pontos/Battle Rating médio), cobertura de ameaças, qualidade do plano B,
  reprodutibilidade e tempo.
- Guardar resultados em `docs/tickets/time-pelo-motor/comparacao.md`, incluindo amostra, casos, médias, dispersão/ruído observado
  e falhas conhecidas.
- Só tornar o Motor o padrão depois de empatar ou superar a IA dentro do ruído medido e de aprovação explícita do responsável.

### Fase F — Integração e release

- Garantir por teste que o modo Motor não chama `claude.use`.
- Manter IA como alternativa selecionável.
- Rodar portão nível 3, testes de regressão e verificações de performance.
- Atualizar changelog para a versão correta; revisar a data do reset no ticket (20/10/2026 é terça; 21/10/2026 é quarta).
- Publicar somente pelo procedimento/skill de release já existente no projeto.

## 5. Matriz mínima de testes adversariais (Gauntlet Loop)

| Caso | Condição | Resultado exigido |
| --- | --- | --- |
| Motor offline | Executar no ambiente sem Claude | Monta equipe sem chamar `claude.use` |
| Entrada repetida | Mesma run/caixa/opções | Resultado determinístico e reproduzível |
| Mega bloqueada | Antes da etapa permitida | Mega não entra no conjunto de candidatos |
| Mono | Restrição de tipo ativa | Todos os escolhidos respeitam a restrição definida |
| Favoritos | 1, 3 e 6 favoritos | Todos permanecem; vagas livres são otimizadas |
| Nenhuma build ideal | Todos os candidatos pontuam mal | Exibe melhor tentativa e score sem esconder a limitação |
| Papel wallbreaker | Chefão com alvos bulky | Papel apenas se a prova de dano/KO for satisfeita |
| Papel pivot | Troca com risco relevante | Papel só com move e evidência de execução/posicionamento |
| Papel sweeper | Setup seguido de KOs | Papel apenas se completar a sequência medida |
| Revenge killer | Alvo rápido | Speed/priority e KO demonstrados na simulação |
| Suporte | Telas/clima/TR/Tailwind melhoram time | Juiz reconhece melhora na batalha completa |
| Timer de tela | Reflect/Light Screen, com e sem Clay | Duração, mitigação e fim de efeito corretos |
| Timer de Tailwind | Tailwind do lado do jogador | x2 Speed e duração correta, inclusive após troca |
| Trick Room do chefão | Timer permanente documentado | Não expira indevidamente no simulador |
| Tag Rain sem abusers | Setter sem benefício de equipe | Tag Rain não é atribuída |
| Tag com benefício | Pelo menos dois membros beneficiados | Tag exibida com evidências por membro |
| Buff do chefe | Buff ativo no desafio | A simulação usa `buffsAtivosDoChefao` / `opcoes.buffs` |
| Plano B | Ameaça interrompe o plano | Até duas trocas não favoritas melhoram score medido |
| Três variantes | Ofensiva, segura, sinergia | Objetivos distintos, métricas comuns e explicação da diferença |
| Performance | Navegador real | Menos de 10 s por time, medido no caminho real |
| Migração | Novos papéis ainda incompletos | UI e builds legadas continuam funcionando |

## 6. Prompt de implementação para Claude Code

**Modo de trabalho obrigatório:** comece em auditoria somente leitura. Não edite arquivos, não rode publicação, não altere o
changelog e não faça reset/rebase. Preserve o working tree e as mudanças do usuário. Primeiro confira `git status` e leia as
instruções existentes (`CLAUDE.md`, docs e scripts pertinentes).

Você vai implementar o ticket "Modo Motor no Meu Time" como uma pipeline determinística de construção de times de Pokémon Elite
Redux, sem consumo da conta Claude do jogador no modo Motor. Use o simulador do jogo como juiz e não importe tiers/uso do Smogon
ou VGC.

**Passo 1 — mapear antes de codificar:** confirme os símbolos e caminhos citados no ticket; desenhe o fluxo atual do botão Meu
Time, do pipeline de builds, do `montarTimeContraChefao`, da simulação da luta, dos papéis legados e da passagem de buffs.
Descubra testes/fixtures e semântica real do parâmetro `ordem`. Entregue mapa de chamadas, riscos e plano de implementação sem
alterar arquivos.

**Passo 2 — provar a régua do simulador:** antes da busca por equipes, teste a persistência no lado do jogador e os timers de
Reflect/Light Screen, Aurora Veil, Tailwind e Trick Room. Passe buffs ativos do chefão. Demonstre com fixtures que suporte
(telas, clima, hazard ou controle de Speed) pode aumentar o score da equipe, mesmo sem causar mais dano direto. Se `pontos` não
distinguir essa contribuição, pare a otimização e proponha a correção do juiz primeiro.

**Passo 3 — construir o Motor:** filtre disponibilidade por etapa, level cap quando aplicável, mono e trava de Mega antes de
avaliar candidatos. Respeite favoritos bloqueados. Faça as variantes ofensiva, segura e sinergia usarem objetivos de seleção
distintos, mas uma régua de avaliação comum. Meça o tempo no navegador com `performance.now()` e mire menos de 10 segundos por
time.

**Passo 4 — builds e papéis:** sem favoritos, preserve o comportamento especificado de escolher o primeiro candidato do pipeline.
Quando a busca por papel estiver ativa para um time com favoritos, trate os favoritos como espécies fixas e escolha suas builds
pelo papel; use a mesma busca nas vagas livres para não deixar a otimização assimétrica. Se a implementação existente impedir
isso, documente a alternativa antes de alterar o escopo. Classifique a build, não a espécie; permita papéis primários/secundários
e abstenha-se sem prova medida. Preserve os papéis legados até a migração de ficha, builds e prompt estar coberta por testes.

**Passo 5 — rótulos explicáveis:** para cada membro, exiba contribuição habilita/abusa/protege/fecha e a evidência numérica. Só
aplique tag de clima/tática se pelo menos dois membros tiverem benefício medido. Exiba o estilo principal entre Hyper Offense,
Bulky Offense, Balance e Stall. Monte guia e plano B com templates determinísticos derivados das métricas; nenhuma justificativa
pode inventar dado.

**Passo 6 — validação:** teste disponibilidade, mono, Mega, favoritos, condições de falha, tags sem evidência, buffs do líder,
persistência dos efeitos de campo, fallback do papel legado e ausência de `claude.use` no modo Motor. Compare Motor e IA nos
mesmos cenários reais, usando a mesma régua e documentando o ruído observado. Não torne Motor padrão até que o critério de
efetividade seja atendido.

**Regras de execução:** trabalhe em etapas pequenas; antes de cada edição mostre o propósito e os arquivos afetados; não reescreva
módulos inteiros se uma mudança localizada bastar; rode os testes relevantes após cada fase; não esconda testes falhos; não
considere uma tarefa concluída sem apontar comandos executados, resultados, limitações e caminhos exatos das evidências. Não
publique sem o critério de efetividade aprovado e sem usar o fluxo de publicação já estabelecido no projeto.

## 7. Critério de pronto

O ticket só deve ser considerado pronto quando:

- [ ] o Motor não chama `claude.use` em nenhum caminho executado;
- [ ] disponibilidade, Mega, mono, favoritos e buffs são respeitados;
- [ ] timers/efeitos de campo são testados e corretos;
- [ ] o juiz mede contribuição de suporte na batalha completa;
- [ ] papéis são da build, baseados em evidência, multirrótulo e com abstenção;
- [ ] estilo, tags e contribuição dos membros têm provas mensuradas;
- [ ] as três variantes têm objetivos reais e usam a mesma régua de avaliação;
- [ ] plano B não remove favoritos e mostra melhora medida;
- [ ] Motor × IA foi comparado e os números estão documentados;
- [ ] alvo de performance foi medido no navegador;
- [ ] papéis legados continuam funcionando até a migração completa;
- [ ] portão nível 3, changelog e publicação seguem o fluxo existente;
- [ ] o responsável do projeto aprovou o Motor como padrão.

## 8. Decisões do usuário (20/10/2026, depois da Fase A)

- **Juiz:** juiz novo do time, ao lado do `pontos` (luta completa com e sem o membro). O `pontos` fica como está: rank e testes atuais não mudam.
- **Golpes sem favoritos:** top-1 do pipeline de build (a build que aparece na ficha), não a cobertura do `comQuatroGolpes`.
- **Tempo do campo inteiro:** cache de simulações + amostra fixa de lutas na busca; o time final é conferido nas 29 lutas.
- Fase A: `fase-a-auditoria.md`; evidência da Fase B: `fase-b-evidencia.md` (aprovadas pelo supervisor, rodada 1).
- **Decisões de 21/10 (depois do preparo da Fase C, `teste/relatorios/time_pelo_motor_faseC_preparo_2026-10-21.md`):** build de
  cada candidato = top-1 do pipeline **contra o campo** (`candidatosDeBuild(sp,{alvo:{campo:true}})`), não a da ficha (que mira o
  próximo líder); **uma espécie por linha evolutiva**; favorito sem build salva usa o top-1 do pipeline.
- **Light Wield (21/10):** fica como está (3 turnos pela descrição); anotar em `decisoes_mecanicas.md` que não há código no
  er-repo `upcoming` 217dd0f e reconferir quando sair.
- **Fase B fechada (21/10):** B1 f0d116c, B2 55f154e, B3 fff533e (calibracao-simulador/01: 80 casos dentro de 4%), B4 e8c7ebe
  (suporte só quando a luta não é vencida sem ele; Flash Fire/Elemental Vortex só pelo gatilho). Dívida 04/05 juntada (6ab9e05):
  usar `liberadoNaRun`, `xsDoJogador`/`entradasDoJogador`, `capOuPadrao`/`nivelDeCalculo`.
- **Dois iguais (21/10):** o usuário quer dois Pokémon iguais quando de fato capturou dois, mas o app guarda uma por espécie; virou o
  ticket `dois-iguais/01` (para depois). O Modo Motor nasce com uma espécie por linha evolutiva.
- **Dívida 20 juntada (21/10):** o caso Fire Fang de `docs/pipeline_de_build.md` vira teste de aceite da Fase C.
- **Fase C aprovada (21/10, rodada 2):** 9521265 + eeb6a22, `src/regras/time_pelo_motor.js` (15 testes). Duas variantes (ofensivo e
  seguro). Decisões do usuário: a 3ª variante (sinergia) vai para a Fase D, com o objetivo "dois membros com benefício medido";
  quando ofensivo e seguro chegam nos mesmos Pokémon (elenco pequeno), aceitar com o aviso. Tempo: pool de 12 = 8,5 s, pool de 20 =
  16,8 s (12,2 s nas builds top-1); o alvo < 10 s fica para a Fase F (builds pré-aquecidas). O adaptador da Fase F troca `ctx.cap` e
  o state juntos.
