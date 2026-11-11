# 15 — Sincronizar com a er-config 30f0f5a (Ninetales Rework e tipos da config)

Status: descartado (11/11/2026: superado; dados já estão na NextDex 2.65.5 e os critérios de aceite estavam marcados)
Bloqueado por: nenhum (o TK-47 já está junto neste branch)

## O que entrega
Dado do jogo na er-config 30f0f5a: Ninetales Rework (Fire puro; Flaming Soul, Spectralize, Set Ablaze; inatas Drought, Magic Guard, Cursed Body), Butterfree Bug/Flying, texto novo de Speed Force, Momentum, Impulse, Blur e Elude, sinergia, traduções PT e changelog. Testes que usavam o Ninetales antigo migrados.

## Contexto
Fonte: er-config 30f0f5a, SpeciesList.textproto:5736 (SPECIES_NINETALES). Os testes de mecânica e a calibração S1-S15 do simulador 2.65.3b usam o Ninetales antigo congelado em `tests/unit/fixture_ninetales_2653b.mjs` (fonte er-config b58ea4d); o dado atual é testado em `config_v10.test.mjs` e `pipeline_kit_legal.test.mjs`.

## Critérios de aceite
- [x] Dado e tipos da config sincronizados (commits f0d2a7b, 8345a31).
- [x] Testes do Ninetales antigo migrados (fixture congelada; kit legal pelo dado atual).
- [x] `chefao_pela_interface` #18: decisão do usuário (05/11): manter o Garchomp (Speed Force) e ajustar o cenário; ele ficou sem EVs e Friend Guard volta a se distinguir de Solid Rock. Sem congelar a descrição.
- [x] `pipeline_build` #25: decisão do usuário (05/11): Ninetales tirado da AMOSTRA (a amostra cobre espécies com 3+ candidatos), motivo no comentário do teste.
- [x] Testes de mecânica (Queenly Majesty, Flash Fire): DECIDIDO pelo usuário em 05/11/2026: manter a fixture congelada do Ninetales antigo; refazer com espécie atual fica para ticket à parte.
- [ ] Supervisor e gerente.

## Migrações e correções (05/11/2026)
- juiz_do_time.test.mjs (8345a31): Tabitha Mt Chimney -> Sidney 2 (Whimsicott com Taunt, er-config TrainerList.textproto:79686 e :79696) e Courtney Meteor Falls -> Phoebe (o líder da Courtney é o Ninetales, Fire puro: TrainerList.textproto:9460 e SpeciesList.textproto:5736). Fontes agora no comentário do teste.
- texto_versao_nova.js: Blur e Elude saem da tabela (69 -> 67 no texto_novo_das_habilidades.test.mjs); o dado já traz o texto da 30f0f5a (AbilityList.textproto :4848 e :4854).
- Rodada do verificador (25e60a0): velocidade_por_categoria injeta os textos antigos (b58ea4d); prompt_build.semSinergia exige build base válida (Ninetales sem sinergia); rank_da_run ignora tiposMudaram (Butterfree); a tabela de texto acima.

## Aprovação do usuário (05/11/2026)
Aprovou as 3 mudanças visíveis: (a) texto novo de Blur/Elude na interface; (b) 2 linhas no changelog; (c) cenários do juiz com Ninetales Fire puro (Sidney 2 e Phoebe). Escolheu a opção agressiva: revisar o changelog inteiro da 2.65.5 contra a er-config 30f0f5a.

## Revisão do changelog 2.65.5 (data/changelog.json, entradas 2026-11-03 e 2026-11-04) contra a er-config 30f0f5a
Nenhuma correção aplicada: tudo o que tem fonte bate.
- Confere: Butterfree Bug/Flying (SpeciesList.textproto:1589, type e type2) e Ninetales Fire (SpeciesList.textproto:5736 em diante); Speed Force :2131, Momentum :2233, Impulse :3305, Blur :4848, Elude :4854 (AbilityList.textproto); as 10 espécies novas existem (SpeciesList.textproto:185126, 200127, 200264, 200416, 200584, 200732, 200881, 201030, 201198, 201580); Granbull Mega e Infernape Redux B não existem mais na config; Meteoropath Ball (MoveList.textproto:17809); Sparkling Blast precisão 90 (MoveList.textproto:17783) e effect_chance 30 (:17784).
- Sem fonte na er-config (não mexi): as 5 builds curadas refeitas (dado do app, não da config); a contagem de 9 habilidades novas e 12 espécies com tipo mudado (vieram da NextDex 2.65.5); a Arcanite H só como presente na Route 123 (a config só mostra o item em SpeciesList.textproto:190171 e TrainerList.textproto:17139; o texto do Adoption Center não está nela).
- Dúvida de redação (listada, não aplicada): a linha do Ninetales diz que ele "ganhou" Spectralize e Set Ablaze, mas também perdeu Vengeance e Drought como habilidade e as inatas antigas; fica sem dizer o que saiu.

## Linhas do changelog alteradas (opção agressiva, 05/11/2026)
- 2026-11-04, Ninetales: "...como habilidades e Drought, Magic Guard e Cursed Body como inatas" -> acrescentado "; saíram Vengeance e o Drought como habilidade e as inatas Pyromancy, Flash Fire e Queenly Majesty". Fonte: er-config 30f0f5a SpeciesList.textproto:5758-5763 (agora) contra b58ea4d SpeciesList.textproto:5759-5764 (antes).
- Demais linhas com ganho de habilidade conferidas, sem mudança: Kecleon Prankster (SpeciesList.textproto:55586), Sawsbuck Grass Pelt (:91714), Greninja Mega Versatile (:182471), Duraludon Mega Mega Launcher (:189045, no SPECIES_DURALUDON_PARTNER_MEGA). Garchomp Mega Redux troca um golpe (Swords Dance), não habilidade. O "no lugar da Klutz/Skill Link/Protean/Draco Morale" é escolha da build, não perda da espécie, e a config não diz nada sobre isso: não escrevi nada.
- Sem fonte, só listado: "9 habilidades novas" (03/11) não nomeia habilidade de espécie.

## Junção e histórico
Branch tem mensagens com "(WIP)"; o histórico não foi reescrito. A junção no master será por squash/merge com mensagem limpa. O master do GitHub (5 commits de CI: ci.yml, pesado.yml, docs/pesado_no_github.md, package-lock.json) foi trazido por merge sem conflito.

## Pendências honestas
- Butterfree, Ninetales e as outras 18 de tiposMudaram seguem sem rank até o fechamento (rank_pendente_ate_10.json). O rank NÃO foi regenerado.
- Sabotagem completa NÃO rodada (vai ao GitHub).
- rank_da_run pula as 20 espécies pendentes.
- config_v10 "tipo x dex" passa em silêncio sem a er-config à mão.
- texto_novo_das_habilidades: 69 passou a 67 (Blur e Elude saíram da tabela).
- Status continua em andamento até o gerente validar.

## Comentários
- 05/11/2026: causas dos 2 vermelhos isoladas trocando o dado antigo pelo novo (só leitura).
