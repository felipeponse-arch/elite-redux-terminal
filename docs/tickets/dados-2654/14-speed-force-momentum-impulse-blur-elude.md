# 14 — Speed Force, Momentum, Impulse, Blur e Elude por categoria de golpe

Status: resolvido
Bloqueado por: nenhum (o TK-46 e o TK-48 dependem deste)

## O que entrega
O motor de duelo (`src/regras/duelo.js`) passa a tratar as cinco habilidades pela categoria do golpe, como o texto novo da er-config 30f0f5a diz, sem perder o texto antigo (por contato):
- Speed Force e Momentum: golpes físicos usam a Speed.
- Impulse: golpes especiais usam a Speed.
- Blur e Elude: a defesa usa a Speed contra golpe físico (Blur) ou especial (Elude).

## Contexto
Fonte: er-config 30f0f5a, AbilityList.textproto (Speed Force :2131, Momentum :2233, Impulse :3305, Blur :4848, Elude :4854). O er-repo ainda guarda contato por flag (abilities.cc:4559 e vizinhos); a regra nova vem só do texto da config e só vale quando o dado 2.65.5 entrar. Registro da mudança e da fonte: `docs/decisoes_mecanicas.md`. Commit: 01858e2 (branch ticket/47).

## Critérios de aceite
- [x] As cinco habilidades valem por categoria (duelo.js:1588-1598); Speed Force novo passa pelo regex genérico já existente (duelo.js:691-693).
- [x] Texto antigo mantido: Impulse "Non-contact" vale `contato:false`, "Contact" vale `contato:true`; teste para cada habilidade nos dois textos (Blur e Elude também).
- [x] Testes medem dano (sobe ou fica igual por categoria e contato), não só existência.
- [x] 6 sabotagens tk47 pegas (6/6 em 860 s, 05/11/2026).
- [x] Decisão e fonte registradas em `docs/decisoes_mecanicas.md`.
- [x] Nenhuma regra existente mudou (Terminal Velocity, Slipstream e Sleek Scales ficaram como estavam).
- [x] Supervisor: código, fonte e testes conferidos em 05/11 (rodada 1; o único ponto era este arquivo do ticket).
- [x] Gerente: VALIDADO em 05/11/2026 (ticket, código, er-config e decisoes_mecanicas conferidos; ressalva sem bloqueio: a âncora `^` de Momentum/Impulse em src/regras/duelo.js:1589 só casa descrição de frase única, como são os dados atuais).

## Comentários
- 05/11/2026: supervisor devolveu REFAZER só por falta deste arquivo; criado.
