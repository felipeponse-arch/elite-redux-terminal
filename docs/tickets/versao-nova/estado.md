# Estado da fila v01–v09 (15/10/2026, atualizado ~13:15 UTC)

Novo (14:10): v08 (`versao-08-sono-paralisia`) e v09 (`versao-09-golpes`) prontos. A fila v06–v09 acabou; parei antes das builds (dados-2654/08, 09) e do fechamento (10).
Antes (13:00): v06 (`versao-06-habilidades-mudadas`) e v07 (`versao-07-habilidades-novas`) prontos e enviados; segue v08 (sono e paralisia) e v09 (golpes). `NOME_DA_CATEGORIA` ganhou luz/arremesso/broca/lunar no v07.
Antes (12:30): v05 fechado com a troca do dado; segue a fila v06 (habilidades mudadas), v07 (habilidades novas + delta do upcoming), v08 (sono e paralisia), v09 (golpes). Parar antes das builds (dados-2654/08, 09) e do fechamento (10).
Achados do /code-review (calibração, ainda não tratados; não bloqueiam): `drill` mapeado para "chifre" no leitor de texto mas gravado como "broca" pela flag; `arremesso: /throw/i` sem âncora; `NOME_DA_CATEGORIA` sem arremesso/broca/luz/lunar; `categorias_pela_config.mjs` junta golpe por nome com `Map` (nome repetido sobrescreve).

Branches no GitHub, todas empilhadas a partir do master `cb8d1ce`, sem PR, sem master:
`versao-01-dupla-contagem` -> `versao-02-decisoes` -> `versao-03-selo` -> `versao-04-parser` -> `versao-05-dado` (parcial).
Nada de rank recalculado. Nada publicado.

## O que foi feito
| Ticket | Resultado |
|---|---|
| v01 dupla contagem | Correção geral aplicada (`bonusDeGolpeLidoDoTextoDuelo`); lista fixa de 15 nomes saiu; 5 testes reescritos; 5 sabotagens novas; **o portão achou uma sabotagem sobrevivente** (`loteB-estrategia-sem-armador`: o caso fixo da Courtney deixou de provar a regra) e o v01 ganhou um 3º caso fixo (Flannery 2, granizo); lint antigo de `pipeline_build.js:67` corrigido (travava o `npm run check`). Impacto medido em `docs/calibracao/dupla_contagem_impacto.md`. |
| v02 decisões | Decisão 75 reescrita (versão mais nova; código/config primeiro); fontes reordenadas; M9 "Normal vira X" = STAB x1,5 (31 habilidades, sem x1,3; o motor deixa de reproduzir a calculadora do Ledian: 98% x 78%-93%); Madness Enhancement x0,8; Feathercoat x0,85/x0,7 resistido; Dead Bark x0,85/x0,7 super efetivo (o motor nem lia). Tabela temporária `TEXTO_DA_VERSAO_NOVA_DUELO`. 8 sabotagens novas. |
| v03 selo | Toda build `calibrada` ("Calculado pelo código do jogo"); `estimada` só com habilidade sem regra no motor (atacante ou alvo; `habilidadeSemRegraNoDuelo`, a mesma conta da auditoria), fuga no Intimidate ou consulta sem alvo. `CASOS_CALIBRADOS` saiu. Prioridade do alvo vira só aviso. 11 sabotagens novas. |
| v04 parser | **Desvio do pedido** (ver `perguntas.md` P1): a `er-config` não tem dado estruturado de efeito de habilidade. Entregue: tabela de 74 textos novos da NextDex 2.65.4 -> redação que o parser conhece (57 habilidades perdiam o efeito), inclusive dentro de compostas, e o portão `scripts/medir_texto_novo.mjs`. Falta: Best Offense (código e texto discordam, P2). 4 sabotagens novas. |
| v05 dado | **Entregue com ressalvas** (`05-dado.md`): dado trocado para a NextDex 2.65.4; extração portada para Node com equivalência byte a byte; chefões contra o TrainerList `d1a9a4c` (`diferenças: 0`); Arbok Mega fora; Eviolite (item 0); Best Offense/Magus Blades pelo código (P2). Rank e builds NÃO refeitos (`rank_pendente_ate_10.json`, `builds_pendentes_de_revisao.json`). |

## Portões (`npm run check` e suíte: verdes em cada branch; sabotagem `--mudados`: ver abaixo)
- Suíte inteira rodada: v01 918 testes (917 + 1 `todo`), v02 923, v04 933, v05 938; 0 falhas. No v03 não rodei a suíte inteira isolada (rodei `pipeline_build`, `selo_do_pipeline` e `auditoria_do_motor`; o v04, que a contém, passou inteira). `npm run check` limpo em v01, v02, v04 e v05 (o erro de lint antigo foi corrigido no v01); no v03 não rodei.
- **Sabotagem `--mudados` SÓ RODOU NO v01 e ainda não terminou**: com o cache vazio são 284 sabotagens e ~37 min por lote de 25 (12 lotes, ~7 h; log em `/tmp/claude-0/dc/portao_v01.log` neste ambiente). Lotes 0 e 1 prontos (1 sobrevivente no 0, já corrigido; 25/25 no 1); lote 2 em andamento. Os portões de v02 a v05 **não foram rodados** (as sabotagens novas de cada ticket foram todas verificadas direto contra os testes do ticket: v02 9/9, v03 12/12, v04 4/4, v05 4/4). O cache de "arquivo que pega" é gravado a cada lote, então as rodadas seguintes serão bem mais rápidas.
- Recomendação: rodar a sabotagem completa no master depois de juntar (a regra da casa já manda).

## O que falta
1. ~~Troca do dado (v05, P3)~~ **feita no v05** (NextDex 2.65.4; Arbok Mega fora; Eviolite). Os remendos do upcoming (Keen Edge -> Sharpness, Kirlia Redux, Morpekyll Hangry, as 9 habilidades) entraram no v07 pelo patch `data/config_nova.json`. As outras 5 renomeações (Absorbent, Phobia, Apple Cake, Frosty Presence, Malediction) já vieram com o dado do v05.
2. `dados-2654/02` a `06` feitos nos v06 e v07; `07` (sono e paralisia Champions) foi o v08.
3. **Delta do upcoming** (`d1a9a4c` sobre `7285071`): 9 habilidades e 9 golpes novos, Keen Edge -> Sharpness, 15 habilidades novas sem efeito lido, partes novas de compostas (Serpent Bind, Cotton Down, Grim Neigh...), chefões novos do TrainerList, Best Offense (P2), King of the Jungle.
4. Builds `dados-2654/08` (revisar afetadas) e `09` (17 espécies novas).
5. M10 (ordem do cálculo, multiplicador de habilidade depois do +2): não feito.
6. Fechamento `dados-2654/10`: rank recalculado UMA vez (v01, v02 e o dado novo mexem no rank), histórico, publicar.
7. Sobras já conhecidas: Plasma Lamp (precisão x1,2), Long Reach/Punching Glove e a reação do alvo ao contato (perguntas 2 e 3 do `03-perguntas.md`); as 211 entradas de sinergia mantidas (Flash Fire, Motor Drive... soma sempre, o jogo só depois do gatilho); as outras leituras de texto fora do motor (`habilidadeArma`, condições de habilidade da UI) não foram medidas contra o texto novo; selo olha habilidade, não golpe com efeito sem regra.

## Gasto
Ver `gasto.md`: US$ 45,38 antes do v01 e 47,98 ao fim do v04 (amostra única; cada ticket custou pouco porque as compactações zeraram o contexto). O saldo de crédito não aparece nesta sessão; o Felipe informou ~US$ 44. A fila não parou por crédito: parou no bloqueio do v05.
