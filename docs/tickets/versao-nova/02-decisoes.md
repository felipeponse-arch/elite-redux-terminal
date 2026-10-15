# v02 — Decisões do Felipe de 15/10: versão mais nova, M9 pelo código, M8 e B1

Status: pronto-para-revisao (branch `versao-02-decisoes`, empilhada em `versao-01-dupla-contagem`, sem merge, sem PR)
Tamanho: M
Bloqueado por: v01
Autorização: Felipe, 15/10/2026 (decisões 1, 2 e 4 da fila v01–v05, em `docs/tickets/versao-nova-plano.md`; M8 e B1 são o ticket 07 da calibração, branch `calibracao-varredura`)

## O que entrega
1. **Decisão 75 reescrita** (`docs/decisoes_mecanicas.md`, linha "Versão do jogo"): o app mira SEMPRE a versão mais nova (`upcoming` + `er-config`); código/config da versão nova primeiro, NextDex depois. A ordem das fontes no topo do registro foi trocada (código/config em 1º, NextDex em 3º). Não há "aviso de versão não publicada" no app para reescrever; o rótulo `build 2.65beta` do `artifact_template.html` muda junto com o dado (v05).
2. **M9 "Normal vira X": STAB x1,5 pelo código**, substitui o x1,3 de 10/10. `abilities.cc:295-301`: a macro `ATE_ABILITY` troca o tipo e dá STAB (`onStab` = `moveType == tipo`) ao tipo novo, sem multiplicador. `duelo.js`: `ef.stabExtra` ganha o tipo novo; `converte.Normal.mult` e `ateMult` valem 1. Vale para as 31 habilidades que o motor lê com esse texto, inclusive Steelworker, Tectonize e Pollinate (que ficavam em x1,1). Normalize, Crystallize e Superconductor (x1,1 no código) não mudam.
3. **M8 Madness Enhancement x0,8** (era x0,5) e **B1 Feathercoat x0,85 / x0,7 resistido** (era x0,9 / x0,8, e o motor só lia o primeiro número). Campo novo `ef.reducao.resistido`.
4. **Dead Bark** (extra, mesma linha do B1 no ticket 07): `abilities.cc:11401-11412` dá x0,85 e x0,7 se super efetivo, igual nas duas versões, mas o motor não lia o texto e a habilidade não reduzia nada. Agora lê.

## Como entra o número novo com o dado antigo
O dado do app ainda é o de 28/03 (a troca é o v05). `TEXTO_DA_VERSAO_NOVA_DUELO` (`duelo.js`) guarda o texto da `er-config` d1a9a4c de Madness Enhancement e Feathercoat; `textoHabDuelo` usa esse texto no lugar do dado, e os leitores de texto seguem lendo texto. O teste `numeros_da_versao_nova` quebra de propósito quando o dado novo entrar, com a mensagem "apague TEXTO_DA_VERSAO_NOVA_DUELO".

## Critérios de aceite
- [x] Decisão 75 e fontes reescritas.
- [x] Aerilate e família: STAB x1,5 no convertido e nos nativos; x2 com Adaptability; sem x1,3.
- [x] Madness Enhancement x0,8 na névoa; Feathercoat x0,85 e x0,7 resistido; Dead Bark x0,85 e x0,7 super efetivo.
- [x] Registro em `docs/decisoes_mecanicas.md` com fonte arquivo:linha e data 15/10.

## O que o M9 faz com os números (o custo da decisão, medido)
- **Ledian** (Bug/Fighting, Aerilate) no Ninetales de Courtney, 1º golpe com Life Orb: Mega Punch **98%** (a calculadora do jogo mostrava 78%–93%) e Aerial Ace **92%** (calculadora: 58%–69%). O Aerial Ace sobe porque o Ledian não é Flying e agora ganha o STAB da Aerilate em todo golpe Flying, nativo ou convertido. Os dois testes de calibração contra a calculadora viraram testes do código (faixa nova), com o motivo no comentário. **Se a medida em batalha real que o Felipe dispensou mostrasse a calculadora certa, a decisão volta para a mesa**; hoje o motor e a calculadora divergem e o registro diz isso.
- Quem já é do tipo novo (um Flying com Aerilate) perde o x1,3 que ganhava por cima do STAB natural; quem não é, ganha x1,5 em vez de x1,3.

## Testes
- Novo: `tests/unit/numeros_da_versao_nova.test.mjs` (4 testes: Madness Enhancement, Feathercoat, Dead Bark, a tabela temporária).
- `calibracao_calculadora_do_jogo.test.mjs`: os testes da calculadora e do x1,3 reescritos para o STAB do código (2 viraram faixas novas, 2 novos: razão de STAB em 3 habilidades e Adaptability x2).
- Reescritos por consequência do M9 (a intenção de cada um fica igual):

| Arquivo | Teste | Mudança |
|---|---|---|
| `duelo_pela_interface` | Expert Belt só vale no golpe super efetivo | o Dragonite do cenário leva Choice Band (sem o x1,3 da Aerilate ele perdia a luta) |
| `duelo_pela_interface` | Electro Surge reforça golpe Electric | idem |
| `golpe_duplo` | Ledian: o poder do Mega Punch carrega a Raging Boxer uma vez só | a conta sem a Raging Boxer inclui o STAB x1,5 |
| `pipeline_build` | Ledian sem prioridade do alvo: melhor golpe Seismic Fist, "estimada" | procura o kit em que o Seismic Fist é o melhor (em alguns kits o Mega Punch passou a ser) |
| `buffs_e_pendencias_antigas` | Madness Enhancement | x0,8 em vez de x0,5 |

- Sabotagens novas: `versao-ate-sem-stab`, `-ate-volta-1-3`, `-madness-volta-0-5`, `-feathercoat-volta-0-9`, `-feathercoat-sem-resistido`, `-feathercoat-soma-os-cortes`, `-dead-bark-nao-le`, `-dead-bark-sem-super-efetivo`; a antiga `hab-madness-fora-da-nevoa` foi reapontada para a linha nova.

## O que ficou de fora
- **Rank não recalculado** (nada de rank até o último ticket da fila).
- Não medi o efeito do M9 nos chefões (o v01 já mexe nos mesmos 82; os dois efeitos se somam no rank final).
- As habilidades de `Impl<>` que só herdam `ATE_ABILITY` com outro texto (Half Drake, por exemplo) ficam para o parser estruturado (v04).
