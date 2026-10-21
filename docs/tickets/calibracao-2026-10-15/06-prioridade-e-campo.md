# 06 — Prioridade e campo pelo código

Status: resolvido (no master: 470d17f a 3e000e5, merge cf65535; marcado em 21/10)
Tamanho: M
Bloqueado por: 05
Divergências: M3, M4, M7, N4 (detalhe em `docs/calibracao/divergencias.json`)
Autorização: regra do usuário de 15/10/2026 (o código do jogo manda). Registrar em `docs/decisoes_mecanicas.md`.

## O que entrega
- **M3 Grassy Glide**: +1 de prioridade no Grassy Terrain.
- **M4 Misty Terrain**: **remover** o x0,5 em Dragon (`duelo.js:1728`); o código só dá o x1,3 do tipo do terreno.
- **M7 Neblina**: x0,8 só quando o **alvo é Ghost**, aplicado no Atk do atacante; tirar Psychic (substitui a decisão da linha 26).
- **N4 Sand Guard, Sun Basking**: com o clima ativo, o dono é imune a golpe de prioridade > 0 do outro lado (mesma regra da Queenly Majesty, decisão 110); Utility Umbrella desliga o efeito no sol.

## Fonte (código do jogo)
`battle_main.c:4276-4278` (Grassy Glide), `battle_util.c:7088-7112` (terrenos), `battle_util.c:7275-7277` (neblina), `abilities.cc:6238-6241`, `7437-7440` e `2957-2967` (Sand Guard, Sun Basking, Queenly Majesty), `battle_util.c:8674-8683` (clima e Utility Umbrella).

## Critérios de aceite
- [x] Grassy Glide sai com prioridade 1 em Grassy Surge.
- [x] Dragon contra alvo no chão em Misty Terrain sem corte.
- [x] Psychic em neblina sem x0,8; Ghost com x0,8 no ataque.
- [x] Golpe com prioridade falha contra Sand Guard em areia e Sun Basking no sol.


## O que mudou (15/10/2026, branch `calibracao-06`)
- **M3** `duelo.js` (`danoNoDuelo`): o Grassy Glide soma +1 à prioridade no Grassy Terrain quando o atacante está no chão. O dado traz o golpe com prioridade 0.
- **M4** `duelo.js`: saiu a linha que cortava Dragon x0,5 no Misty Terrain; sobra o x1,3 do Fairy.
- **M7** `duelo.js` e `mono_run.js`: a névoa corta x0,8 o Atk de quem ataca um alvo **Ghost**, aplicado no ataque; Psychic saiu. `CLIMA_OFICIAL.danoGhostPsychicNaNevoa` virou `ataqueContraGhostNaNevoa`. Os textos de dica do mono run (Ghost e Psychic na Eerie Fog) foram reescritos: Ghost "-20% no ataque contra Ghost"; Psychic só "aumentos de status não caem".
- **N4** `duelo.js` e `pipeline_build.js` (no master `0765bec` o pipeline não tem mais `pipelinePrioridadeBloqueada`: o bloqueio da prioridade condicional vem do motor, por `prioCondicionalBarradaDuelo`; só a ameaça do alvo, `pipelineAmeacasDePrioridade`, usa o helper): o texto "Blocks priority and reduces ... damage by 1/2 in sand|sun" arma `ef.bloqueiaPrioClima` sob o clima certo; a função nova `prioBloqueadaPelaHabilidadeDuelo(def, atq)` junta a Queenly Majesty e família com Sand Guard e Sun Basking e é usada no filtro do `danoNoDuelo`, em `prioCondicionalBarradaDuelo`, `prioFalhaDuelo` e no pipeline de build. Mold Breaker atravessa; o Utility Umbrella do dono (sem Klutz) desliga o do sol.
- Os testes antigos que codificavam a regra de 30/09 da névoa foram invertidos: `clima_oficial_e_revisao.test.mjs` (Ghost x0,8, Psychic x1,0) e `duelo_pela_interface.test.mjs` (Mismagius leva 0,8 do dano na névoa; o Espeon deixa de virar a luta). `docs/decisoes_mecanicas.md`: nova linha de 15/10/2026 e as linhas de 30/09 (Eerie Fog) e 10/10 (Sand Guard, Sun Basking) anotadas como revistas.

## Números
- Teste novo: `tests/unit/prioridade_e_campo_pelo_codigo.test.mjs`, 10 testes com chefões reais: Sunflora de Flannery 1 (Grassy Surge + Grassy Glide: campo de grama e prioridade 1), Dudunsparce de Lucy, Claydol de Tate e Liza 2 e Gastrodon de Calvin 2 (Sand Guard) e Exeggutor Alolan de Flannery 1 (Sun Basking) barram o Quick Attack sob o clima e não sem ele. Misty: Dragon x1,000 (era x0,5) e Fairy x1,3. Névoa: Ghost x0,8 (0,804 medido), Psychic x1,000.
- Sabotagens novas: 13 (`campo-*` e `prioridade-*`), as 13 pegas; conferi que o trecho de cada uma existe uma vez só no arquivo.
- Suíte inteira: 861 testes, 860 passam, 1 `todo` (Insect Impact, já existente). `npm run check`: tudo OK, exceto o erro de lint de `pipeline_build.js:67`, que já está no master (ticket 01).

## O que ficou de fora
- **Rank não recalculado** (ticket 08).
- A decisão de 14/10 (golpe com prioridade barrado falha inteiro) e o que ela fixou (`prioFalhaDuelo`, `turnoPerdidoPorPrioridadeDuelo`, `temPrioridadeNoDuelo`, `temPrioridadeNoCampoDuelo`) não foi reaberta: só ganhou dois barradores.
- O Madness Enhancement continua com o x0,5 da NextDex ("código upcoming usa 0,8", linha 38 do registro): é a divergência M8/M9 do ticket 07, que depende de medida.
- Na dupla, Sand Guard e Sun Basking protegem só o dono (o código não põe `onImmuneFor = APPLY_ON_ALLY`, ao contrário da Queenly Majesty); o ranking de dupla (`bloqueiaPrioLado` nas linhas de pesos) não os conta.
- O Grassy Glide de um alvo (ameaça de prioridade do pipeline de build) não considera o terreno: `pipelineAmeacasDePrioridade` lê só a prioridade do dado. Um Grassy Surge do alvo faz o Grassy Glide dele agir antes e o pipeline não avisa.
- O Sun Basking com Utility Umbrella perde também o corte de metade do dano físico no sol (mesma `IsBattlerWeatherAffected`); aqui o guarda-chuva só desliga o bloqueio de prioridade, o corte de dano segue pelo texto.
- A Surprise! (névoa) segue como a aproximação de 14/10 (zera a prioridade, não falha o golpe).

## Comentários
- Origem: varredura de calibração de 14 e 15/10/2026 (`docs/calibracao/`). Sem comentários ainda.
