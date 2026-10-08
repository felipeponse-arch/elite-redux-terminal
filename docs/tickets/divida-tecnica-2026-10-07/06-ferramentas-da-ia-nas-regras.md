# 06 — Ferramentas da IA nas regras, com teste

Status: resolvido
Bloqueado por: 01

## O que entrega
As ferramentas que a IA consulta (fraquezas do time, Rank da espécie, chefões restantes, velocidade, candidatos da caixa) e o caminho resposta da IA → build validada → o que gravar passam para as regras e ganham teste. A tela fica só com o pedido e o status.

## Critérios de aceite
- [x] Cada ferramenta tem teste sem navegador.
- [x] Os nomes e formatos citados no prompt são conferidos contra as ferramentas reais.
- [x] Checagem de fronteira (ADR-004) continua passando.

## Comentários
Origem: levantamento de dívida técnica e revisão de arquitetura de 07/10 (prioridades na conversa).

Feito em 08/10 (branch divida/06):
- Novos arquivos de regras: `ferramentas_ia.js` (as 10 ferramentas + fábrica, movidas sem mudar a lógica), `gravacao_build_ia.js` (validar a resposta, descartar a obsoleta, o que gravar, plano da IA) e `lista_de_builds.js` (as 4 mudanças na lista de até 3 builds, sem redesenho; `nucleo.js` as embrulha em `acao()` como antes).
- `src/ui/ia.js` ficou com o pedido (`pedirIA`, geradores) e o status; a tela entrega às regras `saida = { agir, aviso, toast }`.
- Testes: `ferramentas_ia.test.mjs` (16) e `gravacao_build_ia.test.mjs` (21), mais 21 sabotagens (prefixos `ia-` e `lista-`). `carregar_regras.mjs` passou a carregar `CONDITION_MOVE_SYNERGY`.
- Comportamento idêntico provado por teste diferencial (não commitado: o código antigo some): mesmas ferramentas, gravação em 168 cenários (modos × lista × time) e geração/lote/plano ponta a ponta com IA simulada, comparados com o master antigo, byte a byte. Suíte do navegador: 599/599.
- Achado (sem mudar o prompt): a descrição de `getSpeciesRank` diz "Pivo", a resposta traz "Pivô" (acento). O teste compara sem acento.
