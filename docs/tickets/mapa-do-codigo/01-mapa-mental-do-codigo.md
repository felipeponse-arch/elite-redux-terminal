# 01 — Mapa mental do código (para não ler o código todo a cada tarefa)

Status: pronto-para-agente
Tamanho: M.
Pedido do usuário (22/10/2026): fazer um "mapping" do projeto, um mapa mental que a IA e os agentes leem antes de
mexer, em vez de reler arquivos grandes (duelo.js etc.) toda vez. Economia de token. Ele lembra de um repositório no
GitHub que ensina a fazer.

## O que já existe
- Graphify instalado em 17/10/2026 (venv em teste/ferramentas/graphify; regra em docs/agents/praticas-de-trabalho.md §E:
  "Graphify antes de mexer em função muito usada"). Já há um grafo gerado em `graphify-out/graph.json`, mas pouco usado
  e sem atualização automática.

## Decisão do usuário (22/10/2026)
Usar o que já temos (Graphify), mantido SEMPRE atualizado: regra de que toda mudança de código atualiza o mapa, sem
trabalho manual. Sem ferramenta nova.

## O que fazer
1. (descartado pela decisão: fica o Graphify.)
2. Gerar um mapa curto e navegável: por módulo, a responsabilidade, as funções-chave com arquivo:linha e quem chama
   quem (ex.: docs/mapa-do-codigo.md, com uma seção por arquivo de src/regras e src/ui).
3. Manter atualizado sozinho (gancho ou script no fim da junção), para não envelhecer.
4. Pôr nos prompts dos agentes: "leia o mapa antes; abra só o trecho que precisa".

## Critério de aceite
- Uma tarefa típica de motor (ex.: achar onde o item entra na build) resolvida lendo o mapa + 1-2 trechos, medida em
  chamadas/tokens contra o jeito de hoje.
- O mapa se atualiza sem trabalho manual.
