# Pipeline de build com intenção (rascunho de 10/10/2026)

Origem: relato do usuário. O app sugeriu Fire Lash para um Pokémon que tem Coil Up, Flaming Jaws e Hyper Aggressive; o certo seria Fire Fang, porque a sinergia de habilidade com inata faz o golpe valer mais. Além disso, o usuário quer builds que **batem primeiro e derrubam o Pokémon do chefão** (prioridade ou mais velocidade, com hit-kill).

Este pipeline é o desenho do ticket `divida-tecnica-2026-10-07/20-gerador-kit-pre-calculado.md` (espécie → kit → candidatos → build validada). Os tickets 17, 18 e 19 continuam como estão.

## Decisões do usuário (10/10/2026)
- **Hit-kill, com ordem:** melhor = bate primeiro (golpe com prioridade ou Pokémon mais rápido) e **um golpe** derruba o Pokémon do chefão; segundo = bate primeiro e derruba em **2 golpes**. Quem mata em 1 sobe no ranking.
- **Alvo da simulação:** o **próximo chefão da Etapa** (primeiro Pokémon e o ás).
- Usar o kit completo: **uma das 3 habilidades + as inatas** (innates).
- Nunca mudar regra ou dado existente sem permissão. Nenhuma mecânica nova entra no motor sem pergunta.

## As fases
1. **Kit (código, sem IA).** Espécie com as 3 habilidades e as inatas, golpes e itens liberados na Etapa e no Level cap, Mega da Etapa. Já existe em `blocoEspecieIA` e `blocoMovepoolIA` (`src/regras/prompts_ia.js`).
2. **Sinergias (código, tabela).** Marca o que muda um golpe: prioridade condicional (Coil Up em mordida), efeito extra (Flaming Jaws: 50% de queimar em mordida), golpe duplo (Hyper Aggressive), bônus de tipo ou de golpe. Fonte: o registro de efeitos de habilidades do motor (`docs/tickets/divida-tecnica-2026-10-07/08-registro-de-efeitos-expandir.md`) e o código oficial do jogo (er-repo).
3. **Candidatos (código).** Monta de 3 a 5 conjuntos de 4 golpes, priorizando sinergia, prioridade e cobertura, e simula cada um no duelo contra o próximo chefão (`resultadoDoDuelo`, `confrontoDuelo`). Marca o hit-kill (1 golpe ou 2 golpes) e quem bate primeiro.
4. **Decisão (IA).** A IA só escolhe entre os candidatos e define EVs, item e natureza. É mais barato e erra menos que pedir a build do zero. Quando a chamada for a proposta inicial de build individual ou do lote, o host pode fornecer o modelo explícito `antigravity/gemini-3.1-pro-high` via uma ponte opcional do OmniRoute; sem ponte, usa `sample` como antes.
5. **Validação (código).** O que já existe: `validateAiBuild`, avisos de build, `gravacao`. A origem da proposta não muda a autoridade: habilidade, golpes, level cap, natureza, item, EVs, sinergia e papel são validados localmente.
6. **Juízes.** `meta-pokemon` e `playtester-de-build` avaliam uma amostra; `supervisor` fecha (Gauntlet Loop). Estratégia, revisão, plano manual e decisão final permanecem no caminho oficial do app/Claude.

### Fronteira do fornecedor (10/10/2026)
O Artifact não contém chave, segredo ou rota fixa para `localhost`. A integração alternativa só é reconhecida quando o host injeta `window.__ER_OMNIROUTE_BRIDGE__` com `modelo` exatamente igual a `antigravity/gemini-3.1-pro-high` e uma função `json(prompt, opcoes)`. Aliases `auto/*` e `COMBO-1` não são usados. Se a ponte falhar, o cliente `sample` é carregado sob demanda; qualquer resposta, de qualquer fornecedor, passa pela mesma validação e gravação. O runtime publicado não permite medir a ponte local com segurança; por isso a medição real fica bloqueada e não é simulada.

## Dois casos de prova (o pipeline tem que servir aos dois)
**Caso A, sinergia do kit: Centiskorch.** Coil Up (habilidade escolhida) + Flaming Jaws e Hyper Aggressive (inatas). A build deve sair com Fire Fang (aprendido no nível 1; é mordida), não com Fire Lash (nível 24, não é mordida). A Coil Up dá +1 de prioridade UMA vez, ao primeiro golpe de mordida depois de entrar.

**Caso B, matar um alvo no primeiro turno: o Ninetales (Fogo/Fantasma) da luta em dupla da Meteor Falls (você + May contra a dupla da Equipe Magma, Shiftry e Ninetales, nível 55).** Dado pelo usuário: Charcoal, Modest, HP 162, Atk 94, Def 104, SpA 171, SpD 132, Spe 166; habilidades Drought, Pyromancy, Flash Fire e Queenly Majesty. Pergunta: numa run mono Inseto, que build derruba esse Ninetales no turno 1?
Restrições que o pipeline precisa enxergar sozinho:
- **Queenly Majesty bloqueia golpe de prioridade**: a prioridade da Coil Up (e Fake Out) não vale contra ele. O "bater primeiro" tem que vir de velocidade (ele tem 166).
- **Drought (sol)** reforça o Fogo e enfraquece a Água; **Flash Fire** absorve Fogo.
- Fogo/Fantasma: golpe de Inseto causa 0,25x. O dano vem de cobertura (Pedra, Terra, Fantasma ou Sombrio, 2x).
- Em dupla, o parceiro pode ajudar (a tratar depois: o motor 1x1 não simula dupla com aliado).
Diferença entre os casos: no A a pergunta é "qual a melhor jogada deste Pokémon?"; no B é "qual Pokémon e golpe resolvem este alvo?". O passo 3 (candidatos + simulação) é comum; muda de onde parte (do Pokémon ou do alvo).

## Achados de 10/10 que mudam o pipeline
1. **Passo novo, fixo: calibrar contra a calculadora do jogo.** O motor errava (Raging Boxer valia x2,8; Aerilate x1,1 em vez de x1,3). Hoje a calculadora do jogo (formato Smogon, EVs reais, Life Orb, clima, faixa 85%-100%, só o 1º golpe) é a referência: `tests/unit/calibracao_calculadora_do_jogo.test.mjs`. Todo golpe/habilidade novo que o pipeline passar a usar se confere contra um número do jogo antes de confiar em "mata no turno 1".
2. **Caso B resolvido no motor (Ninetales da Meteor Falls):** o Ledian (Mega Punch: Aerilate + Iron Fist + Raging Boxer) dá 109%-130% do HP dele num golpe, velocidade 189 contra 166. Não depende de prioridade (a Queenly Majesty bloqueia; agora o 1x1 também aplica). O que o impede na luta real é o Fake Out do Shiftry (prioridade +3), que o motor 1x1 não enxerga: a dupla é limite conhecido.
3. **Motor protótipo do passo 3 já existe e é rápido:** 54 espécies de Inseto x todos os golpes x 5 itens em 7 segundos (script de 10/10 no scratchpad; reaproveitar como base do protótipo do ticket 20).
4. **Erro meu a não repetir:** Mach Punch (Lutador) "imune" ao Ninetales era imunidade de tipo (Fantasma), não da Queenly Majesty. Antes de atribuir uma imunidade a habilidade, descartar o tipo.
5. **Pendente no motor:** Insect Impact ~10% acima da calculadora (BP 80 e Iron Fist conferem); Sand Guard e Sun Basking ("bloqueia prioridade" no clima) sem medida.

## Lacuna de dados achada
A luta em dupla da Meteor Falls não está no app como o usuário a vê: `bosses.json` tem só "Courtney Meteor Falls" (Ninetales, Alakazam, Charizard), com o mesmo Ninetales (Drought, Charcoal, Modest, 4 HP/252 SpA/252 Spe, Dazzling Gleam, Heat Wave, Ominous Wind, Flame Burst). O Shiftry e a May não aparecem em nenhum lugar de `bosses.json`. Incluir a luta em dupla seria dado novo: perguntar antes.

## O que falta decidir (perguntar ao usuário antes de implementar)
- Como a tabela de sinergias é mantida (a mão, ou lida do registro de efeitos).
- Se a simulação do passo 3 roda no clique ou fica pré-calculada.
- Custo: a medir no protótipo (ticket 20).

## Skills que apoiam
`grilling` (sabatina), `codebase-design` e `prototype` (desenho e protótipo descartável), `tdd` (implementação), `sentry-skills:find-bugs` (17), `claude-api` (18), `sentry-skills:prompt-optimizer` (19), `importar-builds-discord` (builds da comunidade para comparar).

## Desenho escolhido (14/10/2026, Design It Twice com 3 desenhos; supervisor aprovou na rodada 2)
Híbrido do desenho 3 (chamador comum: uma linha no botão) com a pergunta invertida do desenho 1 (caso B), sem o registro de intenções do desenho 2 (framework para só 2 intenções; extrair quando a 3ª for pedida). Módulo novo `src/regras/pipeline_build.js` (escopo global, ES5, sem window/document):
1. `candidatosDeBuild(sp, opts)`: do Pokémon para a build (caso A, botão e lote). Só `sp` é obrigatório; o cap vem de `getCurrentCap()`; `opts.alvo` opcional ({chefao, indice} | {foe}).
2. `especiesQueResolvem(alvo, opts)`: do alvo para os Pokémon (caso B).
3. `fecharBuild(candidato, escolha)`: fina; a IA devolve {indice, evs, item, natureza}, a função monta a build com os golpes e a habilidade do candidato e entrega ao `validarRespostaDeBuildDaIa` (validação e gravação que já existem).
Ranking (decisão do usuário): mata em 1 golpe e bate primeiro > mata em 2 golpes e bate primeiro > resto por dano e sinergia. Prioridade não conta contra Queenly Majesty/Dazzling/Armor Tail. O rótulo "mata no turno 1" só sai com número conferido na calculadora do jogo; senão sai "estimado".
Decisões do usuário (14/10): (a) alvo padrão = o PRÓXIMO LÍDER DE GINÁSIO da Etapa (mapa GYM_LEADER_MILESTONE em chefoes.js), com opção de escolher qualquer outro chefão (ex.: Courtney da Meteor Falls); (b) a tela mostra o motivo curto de cada build e o selo calibrada/estimada (muda a tela).
Limites conhecidos: o Fake Out do Shiftry e a dupla não são simulados (o módulo avisa); não existe hoje "próximo chefão da Etapa" para lutas fora de ginásio; o selo perde valor se a tabela de calibração for esparsa (crescer com números da calculadora do jogo que o usuário trouxer).
Ordem de entrega: (a) módulo + testes dos casos A e B pela interface, sem tocar a tela; (b) ligar o botão e o lote; (c) motivo e selo na tela; (d) a dívida 05 (o que a run libera) entra quando for fechada, sem bloquear.
Custo no clique: medir no protótipo antes de decidir entre calcular na hora e pré-calcular. Tabela de sinergias: continua derivada do motor; o registro de efeitos (ticket 08) fica para depois.
