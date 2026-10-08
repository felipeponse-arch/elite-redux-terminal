# 01 — Trocar para o Dado do jogo 2.65.4

Status: pronto-para-agente
Bloqueado por: nenhum (mas só começar depois de fechar o 01 da dívida técnica e o 08 das pendências, que mexem nos mesmos arquivos)

## O que entrega
O app passa a usar o Dado do jogo NextDex 2.65.4 (corte de 07/10/2026): Dex, chefões, "onde achar" e validações já leem o dado novo, e o jogador vê "Dado: 2.65.4 (07/10)". Nenhuma regra do motor muda neste ticket.

## Contexto
- Curadoria aprovada: `docs/pesquisa_versao_2654.md`, `docs/pesquisa_2654_config.md`, `docs/pesquisa_2654_changelog.md`.
- O branch `dados-2654` já tem: o dado baixado e validado, os caminhos dos scripts/testes apontando para ele e os 3 documentos. Aproveitar (levar para o worktree do ticket).
- Os índices de espécie e habilidade mudaram: tudo que guarda índice da 2.65beta tem de ser regerado a partir do dado novo.
- A extração descarta o item de índice 0, que no dado é a Eviolite.
- Base da config oficial: dado antigo = er-config `6a30b66`; dado novo = `7285071`.

## Critérios de aceite
- [ ] Extração completa rodada no dado novo, com a Eviolite (item 0) preservada; teste que falha sem o conserto.
- [ ] Chefões regerados e conferidos contra o TrainerList de `7285071`: `diferenças: 0` (inclui os 5 casos de Hell e os 8 times que mudaram). O remendo antigo da Eviolite deixa de ser necessário.
- [ ] "Onde achar itens" regerado (Arbokite sai do Centro de Adoção).
- [ ] Arbok Mega fora da Dex, das builds e das sugestões.
- [ ] Rótulo do app e alarme semanal apontando para o Dado do jogo 2.65.4 (07/10); o app nunca afirma "2.65.4.1b".
- [ ] Builds curadas com golpe ou habilidade que sumiu ou foi renomeada (ex.: Absorbant → Absorbent): listar ao usuário ANTES de mexer.
- [ ] Pendência conhecida registrada: 3 commits de 07/10 fora do dado (Kirlia Redux Hydration, Morpekyll HP, times do Polartic).
- [ ] Rank NÃO recalculado (fica para o ticket 10). Sem publicar.

## Comentários
