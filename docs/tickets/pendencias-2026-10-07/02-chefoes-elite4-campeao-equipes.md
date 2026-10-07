# 02 — Elite 4, Campeão e equipes Aqua/Magma conferidos pelo código do jogo

Status: pronto-para-agente
Bloqueado por: nenhum
Agentes: arquiteta-de-dados, meta-pokemon

## O que entrega
Cada luta de Elite 4, Campeão e Aqua/Magma do `bosses.json` comparada com o código oficial (er-repo: times party /
partyInsane, níveis, itens, habilidades, efeitos de campo, regras especiais). O usuário NUNCA teve vídeo dessas lutas:
a única fonte é o código. Diferenças corrigidas no dado/extrator, com linha em `docs/decisoes_mecanicas.md`.

## Como verificar
Teste de cobertura: todo treinador dessas lutas no código existe no `bosses.json` com o mesmo time; sabotagem que tira
um Pokémon do time é pega. Ver `project_pedido_revisao_ginasios_2026_10_04` na memória (revisão dos 8 ginásios = modelo).
