# v03 — Selo do pipeline: "calculado pelo código do jogo"

Status: pronto-para-revisao (branch `versao-03-selo`, empilhada em `versao-02-decisoes`, sem merge, sem PR)
Tamanho: M
Bloqueado por: v02
Autorização: Felipe, 15/10/2026 (decisão 5 da fila v01–v05): o motor é "calibrado pelo código do jogo"; toda build sai com esse selo; só fica "estimada" o que o motor não simula (habilidade sem regra). Nada depende de medida do Felipe.

## O que entrega
- `pipeline_build.js`: todo candidato sai `rotulo: "calibrada"` e `selo: "Calculado pelo código do jogo"`. Sai `"estimada"` com `selo: "Estimado: <motivo>"` só quando:
  1. há habilidade em jogo sem regra no motor, do atacante (a escolhida e as inatas ativas no nível) ou de qualquer alvo medido (aviso: "O motor não simula Temporal Rupture (inata): o número é uma estimativa.");
  2. um lado foge no Intimidate (Tactical Retreat; o motor devolve empate): já era "estimada", segue;
  3. a consulta é sem alvo (caso A de alvo qualquer): nada foi simulado, o selo não afirma número.
- `duelo.js`: função nova `habilidadeSemRegraNoDuelo(id)`, a mesma conta que a auditoria permanente fazia dentro do teste (efeito igual ao de nenhuma habilidade, fora da tabela de tipos, fora da sinergia por golpe, sem armar clima). A auditoria (`auditoria_do_motor.test.mjs`) passou a chamá-la: o selo e a lista `HABILIDADES_SEM_REGRA` nunca discordam.
- `CASOS_CALIBRADOS` e `pipelineCasoConferido` saíram. O aviso "Número do motor, ainda não conferido na calculadora do jogo" também. Documentado em `docs/tickets/pipeline-build-2026-10-14/01-modulo-pipeline-build.md` (critério revisto + seção "Selo revisto em 15/10/2026"), `docs/pipeline_de_build.md` e `docs/decisoes_mecanicas.md`.
- A prioridade do alvo (decisão P1 de 14/10) continua definindo "bate primeiro" e o aviso "O alvo age antes com ...", mas **não rebaixa mais o selo**. "Derruba no turno 1" só aparece quando o dano mínimo já derruba E o alvo não age antes (antes bastava "calibrada", que já excluía o alvo que age antes).

## Por que a lista de casos saiu
Depois do M9 do v02 (STAB do código), o motor não reproduz mais a calculadora do jogo daquele caso (Mega Punch do Ledian: 98% contra 78%-93%), então "conferido na calculadora" deixou de ser verdade. O critério agora é o que o motor lê, não o que alguém mediu.

## Critérios de aceite
- [x] Toda build de Ledian, Scyther Mega, Typhlosion, Accelgor, Fearow e Vanilluxe Mega, contra três alvos, sai `calibrada` com o selo.
- [x] Runerigus (Spiteful inata) sai `estimada` com aviso que nomeia a habilidade; alvo com Symbiosis também.
- [x] Fuga no Intimidate e consulta sem alvo seguem `estimada`.
- [x] Prioridade do alvo: aviso fica, selo não cai.
- [x] Registro em `docs/decisoes_mecanicas.md`.

## Testes
- Novo: `tests/unit/selo_do_pipeline.test.mjs` (8 testes, dado real).
- `pipeline_build.test.mjs`: 6 testes dos casos conferidos saíram (lista de calibrados, "mesmo atacante/habilidade/golpe/alvo", todo alvo medido, um alvo conferido e outro não, e o helper do Ledian) ou foram reescritos (caso B, Seismic Fist, Typhlosion, "turno 1" só com dano mínimo, "estimada" só com motivo).
- Sabotagens: as 2 antigas de `CASOS_CALIBRADOS` saíram, a de "sempre calibrada" foi reapontada, 11 novas (`pipeline-selo-*`, `pipeline-turno-1-com-alvo-agindo-antes`, `semregra-*`).

## O que ficou de fora
- A tela que mostra o selo (ticket 03 do pipeline) não começou; o campo `selo` já traz o texto pronto.
- O selo olha habilidade, não golpe: golpes com efeito sem regra (lista `EFEITOS_DE_GOLPE_SEM_REGRA_EXPLICITA` da auditoria) não rebaixam. Se o Felipe quiser, vira ticket próprio.
- **Rank não recalculado.**
