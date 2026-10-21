# Fase B (time-pelo-motor/01): evidência de efeitos de lado

Fonte: `ferramentas/er-repo` no commit **217dd0f** (branch upcoming, HEAD atual). O ticket diz 96af067, mas os números de linha do ticket batem com 217dd0f, não com 96af067 (ver "Divergência de commit" abaixo).

## 1. Regras do ticket x código (217dd0f)

| Regra | O que o ticket diz | O que o código diz (arquivo:linha, 217dd0f) | Confere? |
| --- | --- | --- | --- |
| Durações base | Trick Room 5 (curta 3), telas 5 (Light Clay 8, curta 3), Tailwind 3 | `include/battle_util.h:56-57` TRICK_ROOM 5 / SHORT 3; `:63-65` SCREEN 5 / EXTENDED 8 / SHORT 3; `:66-67` TAILWIND 3 / SHORT 3 | SIM |
| Reflect fica no lado; Light Clay estende | Turno do uso + 5; Light Clay estende | `src/battle_script_commands.c:9344` Cmd_setreflect; `:9345` checagem Screen Cleaner; `:9353` Light Clay = SCREEN_DURATION_EXTENDED (8); `:9355` sem Light Clay = 5 | SIM (Light Clay = 8, valor exato) |
| Light Screen igual ao Reflect | Igual ao Reflect | `src/battle_script_commands.c:10277` Cmd_setlightscreen; `:10278` checagem; `:10286` Light Clay = 8; `:10288` = 5 | SIM |
| Aurora Veil: só com granizo ou Aurora Borealis | Sujeito a clima/condição | `src/battle_script_commands.c:7775` case VARIOUS_SET_AURORA_VEIL; `:7776-7777` condição (SIDE_STATUS_AURORA_VEIL / Screen Cleaner) OU (granizo ou Aurora Borealis) | SIM (condição nas linhas 7776-7777) |
| Aurora Veil: duração com Light Clay | Não citado no ticket | `src/battle_script_commands.c:7786` Light Clay = SCREEN_DURATION_EXTENDED (8); `:7788` = SCREEN_DURATION (5) | Novo fato |
| Aurora Veil: dano físico e especial | Proteção física e especial | `src/battle_util.c:7648-7649` (reflect físico, light screen especial, OU aurora veil sem tipo) | SIM |
| Tailwind: fica no lado, 3 turnos | Turno do uso + 3 | `src/battle_script_commands.c:10986` Cmd_settailwind; `:10994` tailwindTimer = TAILWIND_DURATION (3) | SIM |
| Tailwind: Speed x2 | Speed x2 | `src/battle_main.c:4213` checa SIDE_STATUS_TAILWIND; `:4214` `speed *= 2` | SIM |
| Trick Room: 5 turnos | Turno do uso + 5 | `src/battle_script_commands.c:11906` case EFFECT_TRICK_ROOM; `:11911` HandleRoomMove(..., TRICK_ROOM_DURATION) | SIM |
| Trick Room: novo uso desliga | Novo uso desliga a condição | `src/battle_script_commands.c:11891` HandleRoomMove: se ativo, desliga e zera timer | SIM |
| Trick Room: timer > 10 = permanente | Caso especial, a tratar | `src/battle_script_commands.c:11907` `// Permanent`; `:11908` `if (ativo && trickRoomTimer > 10)` pula o toggle | SIM (ver §2d) |
| Habilidades de entrada: duração curta 3 | Duração curta de 3 turnos | `src/abilities.cc:1367` Air Blower (tailwind SHORT); `:4437` Twisted Dimension (Trick Room SHORT); `:4462-4464` North Wind (Aurora Veil); `:10085` Harukaze (tailwind SHORT) | SIM (ver §2b) |
| Turno do uso não decrementa | `started` impede decremento no turno do uso | `src/battle_util.c:1799` Reflect (`!started.reflect && --reflectTimer`); `:1930` Tailwind; `:2053` Trick Room | SIM |
| `started` zerado no turno seguinte | Zerado no começo do turno | `src/battle_main.c:4603` ZERO(gSideTimers[0].started); `:4604` [1]; `:4605` gFieldTimers.started | SIM |
| Dano x0,5 em singles, x0,66 em dupla | x0,5 singles; exceções | `src/battle_util.c:7653-7655` (dupla 0,66 / singles 0,5); exceções `:7649-7651` (`!Infiltrates(...)` e `!isCrit`) | SIM |
| Defog remove telas | Não citado no ticket (fonte da tabela) | `src/battle_script_commands.c:6534` Reflect, `:6535` Light Screen, `:6537` Aurora Veil | SIM |
| Brick Break remove telas | Não citado no ticket (fonte da tabela) | `src/battle_script_commands.c:12422` (B_BRICK_BREAK), `:12428-12431` zera Reflect, Light Screen, Aurora Veil | SIM |
| Screen Cleaner: pode pôr tela de novo mesmo ativa | "remoção pela habilidade NÃO conferida" | `src/battle_script_commands.c:9345`, `:10278`, `:7776-7777`: checagem `!BattlerHasAbility(..., ABILITY_SCREEN_CLEANER)` | SIM na parte "pôr de novo"; a nota "remoção não conferida" está DESATUALIZADA (ver §2a) |

### Divergência de commit
- O ticket cita 96af067, mas as linhas dele batem com 217dd0f. Em 96af067 as mesmas funções estão em outras linhas: Cmd_setreflect 9354, Cmd_setlightscreen 10287, VARIOUS_SET_AURORA_VEIL 7784, Cmd_settailwind 10996, HandleRoomMove 11901, Defog 6543, Brick Break 12432; abilities: AIR_BLOWER 1357, TWISTED_DIMENSION 4457, NORTH_WIND 4480, HARUKAZE 10104, SCREEN_CLEANER 3437.
- Diff 96af067..217dd0f: `include/battle_util.h` só muda a assinatura de CanBeBurned (fora de 56-67). `src/battle_main.c` sem diff. `src/battle_util.c` hunks em 5083, 6284, 7403 (fora dos trechos citados; o trecho 7648-7649 só deslocou). `src/battle_script_commands.c` hunks em 2453, 2461, 6498 (-9 linhas), 7696, 8601, 8841 (fora dos trechos citados). `src/abilities.cc` tem diff grande (+45/-325): conferi só as 8 linhas-chave e os donos de cada uma; o resto do arquivo não foi conferido.

## 2. Perguntas em aberto

**(a) Screen Cleaner remove telas ao entrar? SIM.**
- `src/abilities.cc:3424-3428` (ABILITY_SCREEN_CLEANER): `.onEntry` chama `CHECK(TryRemoveScreens(battler))`.
- `src/battle_util.c:8390-8413` (TryRemoveScreens): zera Reflect, Light Screen, Aurora Veil e Smokescreen (e timers) do lado do portador (`:8392-8402`) e do lado inimigo (`:8404-8412`).
- Logo: a nota do ticket "remoção pela habilidade NÃO conferida" não bate com o código atual.

**(b) Habilidades com tela, Trick Room ou Tailwind de duração curta (4 linhas de abilities.cc):**
- `abilities.cc:1367` (dono ABILITY_AIR_BLOWER): Tailwind SHORT (3).
- `abilities.cc:4437` (dono ABILITY_TWISTED_DIMENSION): Trick Room SHORT (3).
- `abilities.cc:4462-4464` (dono ABILITY_NORTH_WIND): Aurora Veil = 5 com Light Clay, 3 sem.
- `abilities.cc:10085` (dono ABILITY_HARUKAZE): Tailwind SHORT (3).
- Fora da lista de telas: `abilities.cc:1345` (ABILITY_WHITE_SMOKE) usa Smokescreen (5 com Light Clay, 3 sem).

**(c) Light Clay vale para Aurora Veil? SIM, mas o valor depende do caminho.**
- Golpe Aurora Veil: `src/battle_script_commands.c:7786` Light Clay = 8; `:7788` sem = 5.
- Habilidade North Wind: `src/abilities.cc:4461-4464` Light Clay = 5 (SCREEN_DURATION); sem = 3. Não é 8.

**(d) Quem usa o timer permanente do Trick Room (> 10)? Chefão Tate & Liza (Ginásio de Mossdeep).**
- `data/maps/MossdeepCity_Gym/scripts.pory:104` (TateAndLizaRematch, TRAINER_TATE_AND_LIZA_3): `VAR_BATTLE_FIELD_EFFECT_TYPE = BATTLE_FIELD_EFFECT_ROOM`, `VAR_BATTLE_FIELD_ID = STATUS_FIELD_TRICK_ROOM`.
- `data/maps/MossdeepCity_Gym/scripts.pory:116` (TateAndLizaDoublesRematch, TRAINER_TATE_AND_LIZA_2): mesma configuração.
- `data/maps/MossdeepCity_Gym/scripts.pory:994` (TateAndLiza principal): mesma configuração, com FLAG_SYS_INVERSE_BATTLE.
- Mecanismo: `src/battle_util.c:4187-4190` (TryToSetFieldEffect, `isTemporary = FALSE`; nenhuma linha atribui TRUE). `:4275-4278`: `isTemporary ? TRICK_ROOM_DURATION : ROOM_DURATION_MAX` (255, `include/battle_util.h:62`). Chamado em `:4372` (ABILITYEFFECT_SWITCH_IN_TERRAIN).
- Logo: no código atual, o Trick Room de script de chefão sempre fica com timer 255, e o guarda `> 10` impede o golpe Trick Room de desligá-lo. Nenhum outro script ou habilidade define STATUS_FIELD_TRICK_ROOM por variável (busca em src, include e data).

## 3. Já registrado em docs/decisoes_mecanicas.md

- Seção `## Decisões`, linha 46 (regra de campo): "Tate&Liza 1: Trick Room + invertida; revanches: Trick Room" (cita scripts.pory oficiais). Cobre o item 2d.
- Seção `## Decisões`, linha 129: "Light Wield monta Light Screen de 3 turnos". CONFLITA com o código: "Light Wield" não encontrado em src, include nem data do er-repo 217dd0f. Não resolvido aqui. Atenção: a habilidade EXISTE no dado do jogo (data/gameData_2654.json, id 1062, "Sets up Light Screen for 3 turns on entry"); a pendência é achar onde o código a define, não "não existe no jogo".
- Seção `## Decisões`, linha 69: regra de campo visível na tela do chefe (não altera mecânica).
- Nenhuma decisão registrada para: durações de Reflect/Light Screen/Aurora Veil/Tailwind, Light Clay, Screen Cleaner, Defog/Brick Break, Speed x2 do Tailwind, dano de tela.

## 4. Casos parecidos (para varredura)
- Quebram telas: ABILITY_DEMOLITIONIST `src/abilities.cc:7755` (quebra Reflect/Light Screen/Aurora Veil do lado oposto); ABILITY_PINNACLE_BLADE `src/abilities.cc:8679` (mesma checagem).
- Limpam telas: Defog `src/battle_script_commands.c:6534-6537`; Brick Break `:12422-12431`; Screen Cleaner `src/abilities.cc:3424-3428`.
- Duração curta: Air Blower, Twisted Dimension, North Wind, Harukaze (ver §2b).

## 5. Lacunas
- Light Wield (decisoes_mecanicas.md:129): não encontrado no er-repo 217dd0f.
- Regra do ticket sobre troca/desmaio não remover o estado (linhas 131 do ticket): não verificada aqui.
- Ordem de execução entre `started` e o fim de turno: só as linhas citadas foram lidas; não rastreei o fluxo completo de `battle_main.c`.
- `abilities.cc` (diff +45/-325 desde 96af067): só as 8 linhas-chave e os donos conferidos.
- Nenhum teste de dado real foi rodado (fora do escopo, só leitura).
