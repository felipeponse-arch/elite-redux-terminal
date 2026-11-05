# 01 — Design fase 1 (conservador): contraste, chip, rank, siglas, alvos e fonte

Status: resolvido
Bloqueado por: nenhum

## O que entrega
Só tokens, CSS e texto; IDs, `data-tab`, classes e `<details>` preservados.

## Contexto
- Decisão do usuário (05/11/2026): na lista da Dex a sigla de 3 letras fica dentro de uma etiqueta com a cor do tipo; os botões "Usar como meu build" e "Montar meu melhor time" ficam como estão.
- Fase 2 (aberta): ficha com abas/índice, cartão "Build sugerida" no topo, Dex vazia com destaque da Etapa, Chefões agrupados por Etapa, Comparar ao lado do "+", rank com foco por teclado nas notas da lista, nome do tipo para leitor de tela.
- Razões de contraste (WCAG, luminância relativa; recalculadas pelo supervisor e por este ticket):
  - `--badge-accent2` #6e5000 sobre #ffffff (tema claro) = 7,47:1 (antes `--accent-2`, 3,82:1).
  - #f3c941 sobre #1a0509 (tema escuro) = 12,38:1.
  - #00e5ff sobre #000000 (alto contraste) = 13,65:1.
  - Sigla dos 18 tipos: a tinta é a de maior contraste entre #1c1b17 e #fff9f2, com piso em preto/branco puro (`tintaDoTipo`). O pior caso medido é Normal, 4,86:1; os outros 17 ficam acima. Não existe garantia teórica de "≥ 4,58": o piso de 4,5 vem do teste abaixo, que mede os 18 tipos.
  - O "2,41:1" de `.boss-cat-tag` era erro do script de medição (não lia `color(srgb ...)` do color-mix); real ~5,4:1.

## Critérios de aceite
- [x] Chip do banner da run no celular (uma linha; detalhe segue no DOM): `src/css/responsivo.css:111-116`.
- [x] Alvos de toque de 44 px em `pointer: coarse`: `src/css/responsivo.css:118-124`.
- [x] Fonte mínima de 12 px SÓ em tela de toque (`@media (pointer: coarse)`, `src/css/responsivo.css`, `:root` com `--fs-micro` e `--fs-legenda`); no PC ficam 10 px e 11 px (`src/css/tokens.css`). Decisão do usuário 05/11: o alcance global foi recusado.
- [x] Rank com legenda visível (Geral / Estágio): `src/ui/dex_ficha.js:318,348` e `artifact_template.html:171`.
- [x] Sigla de 3 letras na etiqueta colorida do tipo: `src/ui/dex_lista.js:214` e `artifact_template.html:778`.
- [x] Contraste da sigla dos 18 tipos >= 4,5:1: `tests/unit/contraste_sigla_dos_tipos.test.mjs` (nenhuma exceção; todos passam).
- [x] Textos de estado vazio e ajuda impessoais (sem "eu").
- [x] Tokens: 28 cores iguais nos 3 temas (`npm run check`).

## Decisões e reversões (05/11/2026)
- Decisão do usuário: ficam os rótulos "Geral" e "Estágio (3º)" com a legenda do rank.
- Revertidos por estarem fora do pedido (voltaram ao estado de 4390d7b): cor do `.boss-cat-tag` (`src/ui/aba_chefoes.js:228`), truncamento do `.boss-cat-tag` (`src/css/time_caixa.css:118`), `.dex-shell` com minmax (`src/css/responsivo.css:9`), fundo do `sync-banner` (`src/css/cards_do_time.css:85`; revertido e depois reaplicado por decisão do usuário, 05/11, contraste: `--badge-accent2`) e os dois textos "pra eu focar" de `src/ui/arquetipo.js:160` e `:299` (são status, não ajuda).
- As 32 imagens-base de `tests/visual_baselines` voltaram às antigas (nada regravado). O visual PODE diferir nas telas da Dex, do rank e do chip por causa do que é do pedido (legenda, sigla, chip). A conferência é do verificador; a regravação só acontece depois, com o usuário vendo o diff.

## Decisões (05/11)
- Sigla de 3 letras dentro de etiqueta com a cor do tipo; os botões "Usar como meu build" e "Montar meu melhor time" ficam como estão.
- Rótulos "Geral" e "Estágio (3º)" com legenda do rank mantidos.
- Fonte de 12 px só em `@media (pointer: coarse)`; no PC seguem 10 px e 11 px.
- Os 3 textos reescritos sem "eu" (Meu Time, PC Box, Chefões vazio) foram aprovados pelo usuário.
- Os 5 pontos fora do pedido foram revertidos (acima).
- As 20 imagens-base de `tests/visual_baselines` foram regravadas a partir do HEAD, depois de o usuário ver os diffs: 14 telas mudaram pela fase 1; a aba Tipos ficou igual.
- "Rank em dupla" fora da ficha por decisão anterior do usuário (TK-21, 534cd57), não é do TK-60.
- Pendência que é do ticket de dados: o teste e2e do subtítulo espera "2.65.4" e o template traz "2.65.5" (`tests/e2e/interacao.spec.mjs:104`).

## Varredura de contraste dos tokens (05/11, opção agressiva)
Teste: `tests/unit/contraste_dos_tokens.test.mjs` (claro, escuro, alto contraste; texto 4,5:1, foco 3:1; texto = text, text-dim, badge-*, aviso, sem-*, cat-* sobre bg, surface, surface-2, surface-3; accent-ink sobre accent, accent-strong e badge-accent2).
- Corrigido (1 par): fundo do `.sync-banner` (`src/css/cards_do_time.css:85`) de `--accent-2` para `--badge-accent2`. Antes (claro): branco sobre #a67c00 = 3,82:1; depois: branco sobre #6e5000 = 7,47:1. Escuro: #1a0509 sobre #f3c941 = 12,38:1; alto contraste: #000000 sobre #00e5ff = 13,65:1.
- Todos os demais pares de texto e foco já passavam nos 3 temas; nenhum token de cor foi alterado.
- Decisão do usuário (05/11): `--border` FICA como exceção decorativa (cartões; texto e controles passam; alto contraste passa). Medidas: `--border` fica abaixo de 3:1 (componentes de UI, WCAG 1.4.11): claro #a9a38a = 1,77 a 2,53:1 sobre as superfícies (2,30 sobre o fundo); escuro #585c4a = 2,06 a 2,84:1. Escurecer/clarear a borda muda a identidade de todos os cartões. Alto contraste (#ffffff) passa.
- Telas regravadas por esta varredura: nenhuma (o banner de sincronização não aparece nas 20 telas do visual).
