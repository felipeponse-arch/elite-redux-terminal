# 01 — Modo "Motor" no Meu Time: montar time sem gastar a conta, com a mesma efetividade

Status: pronto-para-agente — **PRIORIDADE ALTA** (Felipe, 17/10/2026). Começar depois do reset semanal de terça 21/10, 23h.
Tamanho: G. Relaciona: todas-as-lutas/02 (mesma régua 60/40 de lutas), time-melhor-no-geral (v180).

## Pedido
"Montar times sem gastar a minha conta, mas com a mesma efetividade." Hoje o "Montar time completo" usa a IA do claude.ai
(`claude.use("sample")`, gasta a conta do jogador) para escolher os 6 Pokémon, escolher entre os candidatos de build e escrever o
guia.

## O que já existe e serve de base
- Builds: a IA só ESCOLHE entre os candidatos do pipeline (`candidatosParaAEscolhaDaIa`, `pipeline_build.js`); escolha inválida já
  cai no "melhor do motor" (`src/ui/ia.js`).
- Time: `montarTimeContraChefao` (`duelo.js`) monta time só pelo simulador, sem IA (botão da aba Chefões).
- Régua: `LUTAS_DA_RUN` (+ lutas comuns 60/40 quando o ticket todas-as-lutas/02 entrar).

## O que entrega
1. Modo "Motor" no Meu Time (padrão se passar no critério 4; a IA continua como opção):
   - os 6 Pokémon pelo simulador contra o campo da run, respeitando estilo (Balance, Hyper Offense, Stall...), clima/tática,
     mono e trava de Mega pela Etapa, com cobertura de tipos e sinergia;
   - build de cada um = 1º candidato do pipeline, já fechado (natureza/item/EVs do rascunho do motor);
   - guia do time em texto montado pelos números (papel, ameaça medida, plano de jogo), sem IA.
2. Funciona fora do claude.ai (sem `claude.use`).
3. Tempo medido no navegador (alvo: menos de 10 s por time).

## Critério de efetividade (antes de virar padrão)
- Mesmo time+caixa, N cenários reais (Etapas diferentes, 5 estilos, mono): montar pelo Motor e pela IA; comparar pelo simulador
  quantas lutas da run cada time vence (Battle Rating médio) e a cobertura de ameaças.
- Motor vira padrão só se empatar ou ganhar (diferença dentro do ruído medido). Relatório com números em
  `docs/tickets/time-pelo-motor/comparacao.md`; Felipe decide.

## Critérios de aceite
- [ ] Teste: modo Motor não chama `claude.use` (falha se chamar).
- [ ] Teste: time respeita estilo, mono e trava de Mega.
- [ ] Comparação Motor x IA com números; decisão do Felipe registrada.
- [ ] Portão nível 3 verde; changelog; publicar pela skill.
