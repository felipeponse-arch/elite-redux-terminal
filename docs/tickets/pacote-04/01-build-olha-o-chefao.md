# Ticket 01 — A build focada olha o chefão da Etapa

Status: resolvido (11/11, branch pacote/09-build-chefao)
Tamanho: M. Relaciona: time-pelo-motor/01, pipeline-build-2026-10-14.

**Objetivo:** `buildFocadaDoMotor` (`src/regras/pipeline_build.js`, ~linha 731) escolher a melhor build da espécie para o foco do chip
levando em conta o chefão da Etapa atual (time, campo, clima e buffs dele), e não só o foco genérico.

**Contexto:** hoje o `foco` do chip (pipeline_build.js ~635) só escolhe 1 build; a medição não parte do chefão da Etapa.
O ponto de partida pode já existir em `opts.alvo`/`opts.ctx` (confirmar no código antes de editar).

**A confirmar antes de começar:**
- O que `opts.alvo` aceita hoje e se já recebe o chefão.
- Se o `build.ps1` (extract_bosses) é parte do pedido ou só o uso do chefão que `data/bosses.json` já traz (a nota de 04/11 falava do pipeline de dados; este ticket é só o lado do motor).

**Critérios de aceite (rascunho):**
- Teste com espécie, golpes e chefão reais de uma Etapa: a build escolhida muda (ou se mantém) pelo motivo medido contra o chefão.
- Sabotagem em `tests/unit/mutacoes.mjs` que pega a volta ao comportamento genérico.
- Sem mudar regra existente do motor; rank intacto.

## Avaliação e entrega (11/11)
- Achado: sem opts.alvo o foco já mirava o PRÓXIMO LÍDER (pipelineResolverAlvo); na Etapa 8 (Alto Comando) não havia alvo ("sem chefão adiante"). A régua era hit-kill 1x1, não o duelo.
- Entrega mínima: `buildFocadaDoMotor(sp, foco, { luta })` mira o alvo na luta, duela (motor de verdade, 1 Pokémon) a build mirada contra a do alvo de hoje e fica com a de mais pontos; devolve `contraChefao { luta, resultado, hpRestante, motivo }`. Sem luta: idêntico (teste). Chip mostra o motivo contra o próximo chefão (.bs-chefao).
- Caso real: Machamp Físico, Etapa 8: sem luta Upper Hand,Dizzy Punch,Submission,Fire Punch; com Sidney Submission,Meteor Mash,Dizzy Punch,Fire Punch ("derruba 0 de 6 de Sidney; perde para Scrafster").
- Limite: só 2 candidatos medidos no duelo (mirada x de hoje); 1 Pokémon sozinho contra a luta inteira.
