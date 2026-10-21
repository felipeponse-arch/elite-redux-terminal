# v01 — Dupla contagem da sinergia por golpe

Status: resolvido (no master: c341fea, 1345f29, 2dd611a, 379b9fa; publicado na v178/v179; marcado em 21/10)
Tamanho: M
Bloqueado por: nada
Autorização: Felipe, 15/10/2026 (decisão 3 da fila v01–v05): aplicar a correção geral, antes do rank. Pergunta 1 de `docs/tickets/calibracao-2026-10-15/03-perguntas.md`.

## O que entrega
- O código do jogo multiplica o bônus de golpe de uma habilidade UMA vez. O motor lia o texto da habilidade e somava por cima a sinergia por golpe da espécie (`species_ability_synergy.json` → `ef.bonusGolpes`). Agora, se o texto da habilidade sozinha já deu `bonusTipo`, `bonusCategoria`, `flagMult` ou `contatoMult`, a sinergia dela é pulada.
- `duelo.js`: função `bonusDeGolpeLidoDoTextoDuelo(ef)` e o `return` no laço de `ABILITY_SYNERGY`. A lista fixa `BONUS_DE_GOLPE_LIDO_DO_TEXTO_DUELO` (15 nomes do ticket calibracao-03) foi apagada: a regra geral cobre as 15 e mais.

## Critérios de aceite
- [x] Nocturnal, Levitate, Electrocytes rendem x1,25 uma vez (eram x1,54/x1,55); Overgrow x1,2 (era x1,44); Dragon's Maw e Transistor x1,5 (eram x2,25).
- [x] Em todas as 1.250 entradas do `species_ability_synergy.json`: habilidade com texto lido (1.039 entradas, 66 habilidades) não deixa `bonusGolpes`; habilidade sem leitura (211 entradas, 15 habilidades) mantém.
- [x] Os 5 testes que dependiam do número inflado reescritos.
- [x] Registro em `docs/decisoes_mecanicas.md` (linha de 15/10/2026).

## Testes
- Novo: `tests/unit/dupla_contagem_da_sinergia.test.mjs` (5 testes, dado real: Zubat, Butterfree, Pikachu, Bulbasaur, Dragonite, Raikou, as 1.250 entradas e os chefões Reshiram do Drake 4, Zekrom do Wattson 3, Braviary de Norman 5). Os 5 falham no código antigo.
- Os 5 testes reescritos (mesma intenção, mesma checagem; só o golpe/item que tornava a luta um empate "no fio" mudou, porque o número inflado sumiu):

| Arquivo | Teste | Mudança |
|---|---|---|
| `duelo_pela_interface` | Occa Berry aguenta um turno a mais | o Charizard (Blaze) ataca com Fire Blast no lugar do Flamethrower |
| `duelo_pela_interface` | névoa/clima: o Alakazam vence o Espeon sem névoa | o Alakazam leva Life Orb |
| `efeitos_pela_interface` | Giga Drain cura e vence o Snorlax | o Venusaur leva Miracle Seed |
| `chefao_pela_interface` | time Fire (`flamejante`) | golpe Fire Blast no lugar do Flamethrower |
| `pipeline_build` | garantido vale pela rolagem mínima | Charmeleon no lugar do Pikachu (mesma janela de dano contra o Ninetales) |

- Sabotagens novas: `dupla-contagem-ignora-tipo`, `-ignora-categoria`, `-ignora-flag`, `-ignora-contato`, `-corta-tudo`; a antiga `habilidades-sinergia-soma-de-novo` foi reapontada para a regra nova.

## Números (do relatório `docs/calibracao/dupla_contagem_impacto.md`, medidos sobre o rascunho idêntico a este código)
- 82 dos 690 Pokémon de chefão mudam o melhor golpe em mais de 0,5%, todos para baixo, de x0,50 (Reshiram do Drake 4) a x0,99.
- 1x1 contra as 595 builds de referência (`boss_reference_builds.json`): 153 duelos de 10.050 viram o resultado (1,5%), em 64 combinações build x Pokémon.

## O que ficou de fora
- **Rank não recalculado** (nada de rank até o último ticket da fila).
- As 211 entradas mantidas incluem habilidades condicionais (Flash Fire, Motor Drive, Justified, Aerodynamics, Amplifier...) cujo bônus o jogo só aplica depois de um gatilho; a sinergia por golpe as soma sempre. Não é dupla contagem do texto (o motor não lê o bônus delas), então não entrou aqui. Se o Felipe quiser, vira ticket próprio: a Flash Fire é a que mais pesa (45 entradas), e desde o ticket calibracao-04 ela também tem o `absorveReforca`.
