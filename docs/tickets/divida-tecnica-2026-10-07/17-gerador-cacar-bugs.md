# 17 — Gerador de builds: caçar bugs no caminho

Status: resolvido
Bloqueado por: nenhum

## O que entrega
Rodar a skill sentry-skills:find-bugs só no caminho do gerador (prompt, chamada, validação, gravação) e transformar cada bug confirmado em teste que falha antes da correção.

## Critérios de aceite
- [ ] Lista de achados com veredito (confirmado, plausível, descartado).
- [ ] Casos mínimos conferidos: Mega antes da pedra, golpe acima do Level cap, EV inválido, habilidade da forma Mega, item que só sai depois.
- [ ] Cada bug confirmado vira teste + correção, ou ticket próprio se for grande.
- [ ] Nenhuma regra de mecânica reinterpretada (docs/decisoes_mecanicas.md).

## Comentários
Origem: pedido de 07/10 de revisar o gerador de builds (kit de habilidades, golpes, EVs, item, natureza, Mega) com skills do repositório.

### Achados (08/10, skill find-bugs no caminho do gerador; testes em tests/unit/gerador_cacar_bugs.test.mjs)
Confirmados e corrigidos (teste falhava antes):
1. Mesmo golpe em 2 slots passava na validação da IA.
2. Qualquer item dos 926 passava (pedra mega de outra espécie, item-chave), apesar do prompt dizer "nenhum fora destes grupos": agora cai pra "sem item" (pedra da própria Mega e item de espécie continuam valendo).
3. EV ausente/tamanho errado/texto virava [0,0,0,0,0,0] e a build era salva sem EV: agora rejeita com motivo (nova tentativa).
4. Texto do modelo ecoado sem limite no motivo da rejeição, que volta ao prompt da nova tentativa: limitado a 40 caracteres.
5. Curada no time novo ignorava a habilidade da forma (Arbok Mega traz Merciless, que é da base): cai pra IA.
6. EV da curada copiado sem limite (Lepastry do Discord soma 520): limite de 510 em time novo e golpe-ponte.
Descartados: nota entre parênteses em habilidade/item das curadas (nenhuma no dado); item herdado da base na Mega (já há nota na tela); corrida de level cap durante a espera (efeito mínimo).
Para o usuário decidir (não mexi): (a) gerar build de Mega ainda travada só avisa, não bloqueia; (b) item que só sai depois só vira aviso, a IA não é impedida/avisada no prompt; (c) golpe-ponte grava o item da curada sem conferir o limite de 2 iguais nem Choice com golpe de status; (d) Heal Block do ginásio não inclui Black Sludge na lista de cura; (e) curadas do Discord com habilidade de outra forma (Kleavor Redux Mega, Arbok Mega, Aggron Redux Mega) e EV com "or" (Grotom Kick) são dado a corrigir.

Rodada 2 (08/10, supervisor): a forma base continua segurando a pedra da própria Mega (modo temporário); itens que se gastam na luta (ITENS_GASTOS_NA_LUTA, qualquer Berry, Gem) não são filtrados, pra Unburden/Gluttony seguirem alcançáveis. Pergunta nova: a Leppa Berry está fora da lista do prompt ("PP é sempre o máximo neste hack") mas a regra de Gluttony/Ripen/Harvest aceita qualquer Berry; deixei passar o que o prompt já cita como válido, sem regra nova - o usuário quer que a IA possa escolhê-la?
