# 08 — Rank × comunidade, builds dos vídeos e pedras sem fonte

Status: em-andamento
Bloqueado por: 03, 05, 16, 17, 18, 19
Agentes: meta-pokemon

## O que entrega
Rank recalculado UMA vez, JUNTO DO TICKET 19 (decisão do usuário 07/10: só se as etapas anteriores não tiverem problema), incluindo os Eviolites dos chefões (ticket 02), a IA do chefão (03), o setup entre duelos (05) e os tickets 16-19. Revisar os físicos fortes que a
comunidade põe acima do nosso rank; nota "cobertura/suporte" na explicação do rank; conferir o Zarude na página
oficial; Floettite e Dragoninite Y (sem fonte nos scripts); builds dos vídeos (Garchomp Mega Z sem build curada,
Mega Redux Garchomp com Swords Dance + Last Respects, Wooly Worm com Assault Vest).

## Como verificar
Comparação antes/depois anexada ao ticket; builds novas passam no `validar_dados.mjs`.

## 07/10
Rank recalculado com os tickets 02-19 e com a escolha de set corrigida (3 candidatos avaliados por inteiro). Falta: comparar com a comunidade (físicos fortes), nota de cobertura/suporte, Zarude, Floettite/Dragoninite Y e as builds dos vídeos.

## Comentários

### 08/10 (meta-pokemon)
- Feito: pacote inicial (`data/pacote_inicial.json`, vídeo do usuário) e pedras do Adoption Center (`data/pedras_adoption_center.json`, er-config) viraram linhas no Onde achar; Floettite pós-jogo (etapa 9); Perfectionist com +1 de prioridade; revisões do duelo de 07/10 (ver `docs/decisoes_mecanicas.md`).
- Builds dos vídeos: `SPECIES_GARCHOMP_MEGA_Z` criada (fonte `video-megafidough`, selo Relato). No Mega Redux Garchomp (Swords Dance, Last Respects) e no Wooly Worm (Assault Vest) a build curada do Discord NÃO foi trocada; o vídeo virou nota. Decisão do usuário pendente: o Assault Vest do Wooly Worm bloqueia o Sticky Web da build.
- Zarude: ausente das 7 páginas do índice oficial e do er-repo (só marca `Unfinished`); continua `sem-fonte`. Floettite: er-config `talk_to_legendary_sage`. Dragoninite Y: er-config `adoption_center` (trava da 7ª insígnia mantida).
- ADIADO: "comparar com a comunidade (físicos fortes)" e "nota cobertura/suporte". Dependem do rank final, que só será recalculado depois da troca para o dado 2.65.4 (`docs/tickets/dados-2654/10`). Texto da nota rascunhado pela sessão anterior e NÃO commitado (revertido em `src/ui/dex_ficha.js` antes do commit, para não antecipar; nunca esteve em nenhum commit): "Mede o Pokémon sozinho, 1x1: cobertura para o time, suporte (hazard, clima para os outros, Costar) e sinergia não entram na nota."
- Rank NÃO recalculado. As mudanças do motor (Perfectionist e revisões de 07/10) e a saída da Floette Mega do rank (`data/rank_disponibilidade.json`) só aparecem no próximo recálculo.

### 08/10, rodada 2 (meta-pokemon): perguntas para o usuário
Dois comportamentos do motor são modelagem minha, sem código oficial por trás. Mantidos como estão até a resposta (nada foi apagado).
1. Tirar o setup custa turno? Hoje, quem usa Clear Smog/Dragon Tail em vez do melhor golpe perde a fração do dano que o melhor golpe faria (custoDeTirarSetupDuelo). Na prática quase não muda resultado (4.320 duelos testados, nenhum mudou). Opções: (a) manter; (b) tirar o custo (tirar o setup é grátis, como antes); (c) manter só quando o golpe de tirar for bem mais fraco que o melhor.
2. Inverse Room e o golpe do chefão: hoje o chefão usa o golpe que a IA escolheria na maior parte dos turnos. Opções: (a) manter; (b) voltar ao golpe de maior dano entre a tabela normal e a invertida; (c) média dos dois golpes pelos turnos de cada tabela.
