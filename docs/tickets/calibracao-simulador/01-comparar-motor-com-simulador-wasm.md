# 01 — Calibrar o motor contra o simulador do jogo compilado (WebAssembly)

Status: feito em 21/10/2026 (comparação em comparacao.md; Aerodynamics corrigida; Insect Impact explicado). Falta só o rank no fim da fila.
Pedido: Felipe, 18/10/2026 — "tem a calculadora que precisamos entender pra nosso app".

## Fonte
- Simulador e calculadora de terceiro (fan-made): https://elite-redux-battle-simulator.darkchocolate069069.workers.dev/
  (link a partir do editor de save https://pokemon-elite-redux--srm-editor.pages.dev/, mesmo autor).
- Segundo o próprio site: "Battles and damage calculations both come from the native Elite Redux 2.65.3b engine, compiled to
  WebAssembly"; regras de `battle_util.c` e `abilities.cc`; o que o jogo não expõe é dito, nunca estimado. Singles e doubles,
  treinadores, clima e terreno, Mega.
- Versão **2.65.3b** (não a upcoming que o app segue). Pelo estudo de 15/10 (`calibracao-versao-publica`), 25 de 27 divergências
  têm código igual na 2.65.3b e na upcoming: vale como régua para o que não mudou.
- **Licença não encontrada.** Uso permitido aqui: referência de comparação (como a calculadora do jogo em 10/10). NÃO copiar o
  WebAssembly nem o código do site para o app ou para os testes sem autorização do autor.

## O que entrega
1. Lista de casos de calibração: os de `tests/unit/calibracao_calculadora_do_jogo.test.mjs` (Insect Impact, Aerilate, Raging
   Boxer...), os golpes e habilidades novos da versão nova que não mudaram desde a 2.65.3b, e itens (Life Orb, Choice, Eviolite).
2. Para cada caso: o dano do simulador (faixa mínimo-máximo) x o do motor (`danoNoDuelo`), com o mesmo atacante, alvo, nível,
   natureza, EVs, IVs, item, habilidade, clima e campo. Registro em `docs/tickets/calibracao-simulador/comparacao.md` com print
   ou valor anotado e a data.
3. Divergência = investigar no código do jogo (`ferramentas/er-repo`, `docs/decisoes_mecanicas.md`), não ajustar peso. Cada
   correção vira teste com o valor do simulador e a fonte arquivo:linha.
4. Rank só no fim, uma vez, se o motor mudar (regra "rank só no fim").

## Critérios de aceite
- [x] Tabela motor x simulador com pelo menos 20 casos, dentro da faixa ou com a causa da diferença explicada.
- [x] Insect Impact (~10% acima da calculadora) resolvido ou explicado.
- [x] Nada copiado do site; só valores observados e anotados.
- [ ] Portão verde (o verificador roda a suíte completa); changelog junto do rank, que é refeito no fim.
