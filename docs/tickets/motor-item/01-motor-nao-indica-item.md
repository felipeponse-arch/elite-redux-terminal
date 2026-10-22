# Ticket 01 — Modo Motor não indica item na build

Status: resolvido (aprovado r2; master 52ef4a3, 22/10/2026)
Tamanho: M. Relaciona: time-pelo-motor/01 (Fase C), divida-tecnica 05 (liberado_na_run), pipeline-build-2026-10-14.

## Sintoma
Relato do usuário (22/10/2026, app v183): "o motor não está indicando item na hora de montar a build".
No "Montar meu melhor time" (Modo Motor) os membros aparecem só com habilidade e golpes; o item some (menos pedra mega).

## Causa
O item nunca é escolhido pelo Modo Motor. Não é a trava de liberado na run nem perda ao gravar.
- `src/regras/pipeline_build.js:25-26` e `:466`: o pipeline monta o top-1 SEM item de propósito ("o item e os EVs finais são da IA";
  `bruto.item = ""`). Só entram item por exceção: Eviolite (`:470-472`), pedra da Mega temporária (`:478`) e Berry de habilidade que gasta item (`:477`).
- `src/regras/time_pelo_motor.js:180-183`: `motorBuildDoCandidato` pega `pipelineCandidatos(...)[0].build` como está, sem fechar item
  (a IA faria isso no outro caminho; o Modo Motor não chama IA). Só o ramo "fallback" (`:189`, `receita.item`) traz item do motor.
- O motor já sabe escolher item: `src/regras/duelo.js:1057` `itemDoSetDuelo` (Toxic/Flame Orb, Sitrus, etc.), usado quando `item` é `undefined`/`null`
  (`duelo.js:3048`). Mas `unidadeDaBuild` (`duelo.js:3145`) passa `b.item || ""`, então item vazio = "sem item" explícito, e a UI (`src/ui/modo_motor.js:187`) mostra vazio.
- Trava `liberadoNaRun` (`time_pelo_motor.js:196-199`) só zera item que a build já tinha; não é a causa (etapa 8 também sai sem item).

## Reprodução (dado real, sem save, `carregarRegras`, elenco Centiskorch/Scizor/Garchomp/Metagross/Grimmsnarl/Togekiss/Klefki/Gardevoir/Ledian/Gyarados, mega temporária)
`montarTimePeloMotor(contextoDoMotor(), {})`, variante 0, item por membro:
- Etapa 2 (cap 40): 6 membros, todos `item: ""`.
- Etapa 5 (cap 70): só Garchomp Mega Z (Garchompite Z) e Scizor Mega (Scizorite) com item; Grimmsnarl, Centiskorch, Gyarados, Klefki vazios.
- Etapa 8 (cap 95): só as 4 megas com pedra; Centiskorch vazio. Sem avisos.
Todos com origem `pipeline`. Item aparece só quando é pedra. Não testei o clique "Ficar com este time" no navegador nem save real; a gravação copia `build` como veio (então grava vazio).
Se o usuário viu item sumindo em outra tela, perguntar qual.

## Proposta de correção (escolha de regra: precisa do usuário)
A) Fechar item pelo motor no Modo Motor: após o top-1, testar candidatos de item liberados na Etapa (`liberadoNaRun`) e ficar com o que mais sobe a nota na luta completa; itemDoSetDuelo como primeiro palpite. Mais fiel ao "extrair o máximo", mais cálculo (cabe no cache por build).
B) Mínimo: usar `itemDoSetDuelo` (já existente) como item da build quando vazio, filtrado por `liberadoNaRun`; a simulação passa a contar o item (muda notas e rank pode divergir do pipeline atual).
C) Só exibir: mostrar na UI o item que o motor usou na simulação, sem mudar a nota. Descartada por mentir se a simulação não usa item.
Recomendo A com B como degrau. Regra nova de item no pipeline/simulação muda números: pedir OK antes.

## Critério de aceite
- Teste novo (dado real, etapa 5 e 8, elenco acima) falha hoje: pelo menos os membros não-mega recebem item liberado na Etapa; nunca item não liberado.
- Mesmo item em "Ficar com este time" gravado no save (origem `sugestao`) e na tela.
- Etapa 2 sem item caro não liberado (sem aviso falso).
- Determinismo (mesma entrada, mesmo resultado) e cache mantidos; rank/baselines revisados só com aprovação.

## Decisões (usuário, 22/10/2026)
1. Opção A: o motor fecha o item. Depois da busca, cada membro sem item (origem pipeline/fallback; build salva do jogador nunca é mexida) testa itens liberados na Etapa (liberadoNaRun) que o motor simula e fica com o que mais sobe a nota na luta completa (o juiz da busca). Exceções que já existiam (pedra da Mega temporária, Eviolite, Berry de habilidade) seguem. Item não liberado nunca.
2. Antes do rank final: o rank (scripts/calcular_rank_v2.mjs) NÃO usa este caminho (escolhe o set por melhorUnidadeContra, que já usa itemDoSetDuelo); nada muda nele. Rank não foi rodado.

## Implementação (src/regras/time_pelo_motor.js, motorFecharItens)
Candidatos (lista pequena e determinística; só o que o motor simula): o palpite do motor (itemDoSetDuelo) primeiro, Life Orb, Leftovers, Assault Vest, Expert Belt, Sitrus Berry, Muscle Band (se há golpe físico), Wise Glasses (se há especial) e o item de tipo de cada tipo de golpe de dano (config do jogo, TYPE_POWER). Fora: Choice (a trava de golpe não é simulada: prometeria dano sem o custo), Focus Sash, gemas e bagas de gatilho (efeito só parcial). Triagem barata: cada item sozinho (cache) e só o palpite + os 2 melhores vão ao time inteiro. Empate = ordem da lista (estável). Escolha em cache (ctx.cache.aux) por time+membro. Máximo de 2 do mesmo item no time. A variante traz itensFechados e tempoItensMs.
Teste: tests/unit/motor_item.test.mjs.
