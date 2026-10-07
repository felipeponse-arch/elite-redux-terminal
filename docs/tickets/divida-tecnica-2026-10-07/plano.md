# Plano da dívida técnica (07/10/2026)

Acessibilidade WCAG fora desta análise. Nada commitado por este plano.

## A. Mapa relatório de arquitetura -> tickets
1 Rank via rankDe -> 01. 2 Contexto da run -> 04 (Level cap) + 05 (o que a run libera; inclui pedra mega e time+caixa).
3 Testes pela interface do duelo -> 07. 4 Registro de efeitos -> 08, 09, 10. 5 Ferramentas da IA -> 06.
Especulativo prompts_ia.js -> NOVO 16 (a-avaliar, bloqueado por 05). Lacuna menor deixada de fora de propósito: leitura de state.archetype.weather dentro de regra (cabe no 05 se aparecer; sem ticket próprio).

## B. Matriz de Eisenhower (custo P/M/G; risco; decisão do usuário)
Urgente + Importante (fazer já)
- 01 rank por rankDe: M, risco baixo (ADR-003 já decidida).
- 04 Level cap padrão único: P, risco médio (muda tela sem save). DECISÃO: qual valor vale (50, 100 ou 0). Status falta-informacao.
- 05 o que a run libera: M, risco médio. Depende do 04.
Só importante (agendar)
- 07 testes pela interface do duelo: G, risco médio (3,9 mil linhas de motor; só testes). Destrava 08-10.
- 06 ferramentas da IA nas regras: M, risco baixo.
- 02 especificação em dia: M, risco nulo (só texto).
- 03 sobras da pasta: P, risco médio (apaga arquivo). DECISÃO: usuário aprova a lista antes de remover.
Só urgente (barato, visível ao jogador, pouco estrutural)
- 12 apagar Build com desfazer: P, risco baixo.
- 13 reticências: P, risco baixo (regex do rótulo da IA).
- 14 teclado e toque: M, risco baixo.
- 15 template: tema, pular conteúdo, bordas: P, risco baixo.
Nem tanto (depois, ou quando incomodar)
- 08 registro de efeitos, piloto: M, risco alto (coração do motor). DECISÃO: forma do registro (sabatina antes de codar).
- 09 migrar em lotes: G (vários tickets), risco alto.
- 10 retirar o antigo: M, risco médio. Único que recalcula o rank (no mesmo commit).
- 11 ESLint 10: P, risco baixo.
- 16 prompts da IA: M, risco baixo, a-avaliar.

## C. Ondas (uma sessão = um ticket ou 2-3 P; worktree por ticket; sem agentes em paralelo)
Em toda sessão: seguir docs/agents/issue-tracker.md (worktree, Status em-andamento/resolvido); pré-commit `npm run check --silent && node --test tests/unit/*.test.mjs && node tests/run_sabotage.mjs`; commitar só os próprios arquivos; rank só no ticket 10.
Publicar uma vez ao fechar cada grupo: após Onda 4 (grupo run/rank), após Onda 6 (grupo interface), após Onda 10 (grupo motor).

Onda 1 - ticket 01 (M)
Prompt: "Implemente o ticket docs/tickets/divida-tecnica-2026-10-07/01-rank-por-rankde.md no seu worktree (fluxo do issue-tracker.md, /tdd). Leia ADR-003 em docs/. Não recalcule o rank. Respostas curtas."

Onda 2 - ticket 04 (P) - PERGUNTA AO USUÁRIO NO MEIO
Prompt: "Ticket 04 (divida-tecnica-2026-10-07/04-level-cap-padrao-unico.md): levante o efeito de cada padrão de Level cap (50, 100, 0) e me pergunte qual vale, com opções, antes de editar. Depois implemente no worktree."

Onda 3 - ticket 05 (M), exige 01 e 04 resolvidos
Prompt: "Implemente o ticket 05 (divida-tecnica-2026-10-07/05-o-que-a-run-libera.md) no worktree, com /tdd. Respeite a ADR-004. Não mude regra de mecânica; se algo conflitar com regra existente, pergunte."

Onda 4 - ticket 06 (M), exige 01 -> publicar o grupo 01+04+05+06
Prompt: "Implemente o ticket 06 (divida-tecnica-2026-10-07/06-ferramentas-da-ia-nas-regras.md) no worktree. Ao fechar, publique a versão (skill publicar-versao) com o grupo 01, 04, 05, 06."

Onda 5 - ticket 07 (G; pode dividir em 2 sessões: duelo, depois chefão)
Prompt: "Ticket 07 (divida-tecnica-2026-10-07/07-testes-pela-interface-do-duelo.md): comece pelos testes de danoNoDuelo e efeitos, passando para resultadoDoDuelo. Nenhuma regra muda. Pare ao fim de uma metade e deixe o ticket em-andamento com o que falta nos Comentários."

Onda 6 - UX agrupada 13 + 15 + 12 (P+P+P), depois 14 em sessão própria -> publicar
Prompt: "Implemente os tickets 13, 15 e 12 de divida-tecnica-2026-10-07 em um worktree, um commit por ticket. Depois rode o e2e e confira as fotos de referência do celular."
Onda 6b: "Implemente o ticket 14 (teclado e toque) no worktree, com teste e2e. Publique ao fechar 12-15."

Onda 7 - 11 ESLint 10 (P) + 02 especificação (M), sessões separadas se o lint der trabalho
Prompt: "Ticket 11 (divida-tecnica-2026-10-07/11-eslint-10.md) no worktree. Depois o ticket 02. Vocabulário do GLOSSARY.md; mecânica só apontando para docs/decisoes_mecanicas.md."

Onda 8 - ticket 03 (P, usuário aprova)
Prompt: "Ticket 03 (sobras da pasta teste/): só gere a lista com tamanho, origem e proposta, e me mostre para aprovar. Não apague nada."

Onda 9 - ticket 08 (M): sabatina da forma do registro ANTES de codar
Prompt: "Ticket 08 (registro de efeitos, piloto semRecarga). Comece com /grill-with-docs para decidirmos a forma do registro. Só depois codar. Rank e cenários idênticos."

Onda 10 - tickets 09 (lotes, uma sessão por lote) e depois 10 -> publicar; 10 recalcula o rank no mesmo commit
Prompt (09): "Ticket 09: migre UM lote de efeitos de habilidade para o registro, resultado idêntico. Anote no ticket quais lotes restam."
Prompt (10): "Ticket 10: retire o objeto antigo de efeitos. Recalcule o rank no fim, no mesmo commit. Publique."

Onda 11 - ticket 16 (a-avaliar): só se ainda fizer sentido depois de 05 e 06.
Prompt: "Ticket 16: avalie os blocos de prompts_ia.js e me traga a lista com veredito para aprovar."

## Decisões que só o usuário toma
04 valor do Level cap (Onda 2). 03 aprovar lista (Onda 8). 08 forma do registro (Onda 9).

## D. Grupo gerador de builds (pedido de 07/10, depois da revisão)
Tickets 17-20. Importante (núcleo do projeto). Encaixe: logo depois da Onda 4 (precisa de 05 e 06 prontos para 18 e 19).
- 17 caçar bugs (M, risco baixo) - pode rodar já, sem bloqueio.
- 18 chamada da IA (M) - bloqueado por 06. Primeiro ver o que o runtime do artifact permite.
- 19 prompt da build (M) - bloqueado por 05 e 18. Mede antes/depois; pode absorver o 16.
- 20 redesenho kit pré-calculado (G, a-avaliar) - bloqueado por 17 e 19; usuário escolhe o desenho.

Onda 4b: "Implemente o ticket 17 (docs/tickets/divida-tecnica-2026-10-07/17-gerador-cacar-bugs.md): rode sentry-skills:find-bugs só no caminho do gerador de builds; bug confirmado vira teste + correção no worktree."
Onda 4c: "Implemente o ticket 18: rode a skill claude-api sobre a chamada do gerador; primeiro o que o runtime do artifact permite; meça antes/depois."
Onda 4d: "Implemente o ticket 19: rode sentry-skills:prompt-optimizer no prompt da build; meça recusas antes/depois com conjunto fixo; juízes meta-pokemon e playtester-de-build."
Onda 4e: "Ticket 20: design-it-twice do caminho espécie → kit → build e protótipo descartável; me traga os desenhos para eu escolher."
