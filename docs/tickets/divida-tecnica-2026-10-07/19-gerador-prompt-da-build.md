# 19 — Gerador de builds: revisar o prompt da build

Status: adiado (usuário, 21/10: até o veredito do Modo Motor, time-pelo-motor/01)
Bloqueado por: 05, 18

## O que entrega
Rodar a skill sentry-skills:prompt-optimizer no prompt da build: ordem do contexto (kit de habilidades, golpes, EVs, item, natureza, Mega), instruções ambíguas, exemplos e formato da resposta, para a IA entender melhor a espécie e errar menos.

## Critérios de aceite
- [ ] Medir antes e depois com um conjunto fixo de espécies (incluindo Mega e clima): taxa de build recusada na validação e Avisos de build.
- [ ] Juízes: agentes meta-pokemon e playtester-de-build avaliam uma amostra.
- [ ] Prompt não fica mais longo sem ganho medido.
- [ ] Absorve o ticket 16 se a revisão cobrir os blocos rasos (decidir com o usuário).

## Comentários
Origem: pedido de 07/10 de revisar o gerador de builds (kit de habilidades, golpes, EVs, item, natureza, Mega) com skills do repositório.
