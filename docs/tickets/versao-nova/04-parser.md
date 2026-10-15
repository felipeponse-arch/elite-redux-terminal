# v04 — Parser: o motor entende a redação nova das habilidades

Status: pronto-para-revisao (branch `versao-04-parser`, empilhada em `versao-03-selo`, sem merge, sem PR) — **com um desvio do pedido, ver "O que não foi feito como pedido"**
Tamanho: M
Bloqueado por: v03
Autorização: Felipe, 15/10/2026 (fila v01–v05, 1º item do ticket 08 da calibração): "nenhuma das 59 pode perder efeito".

## O que o ticket pedia e o que a medida mostrou
O pedido: o motor lê as habilidades pelo dado estruturado da `er-config` (d1a9a4c), não pelo texto. Medido antes de mexer:
- A `er-config` **não tem dado estruturado de efeito de habilidade**: `AbilityList.proto` só tem `id`, `name`, `description` e `expanded_description` (texto livre). O efeito mora em C++ (`abilities.cc`), que não se lê por máquina.
- Trocar a fonte pelo `expanded_description` não funciona: com o texto expandido da `er-config` `6a30b66`, o parser só reproduz o efeito em **94 de 848** habilidades em uso (754 diferem; 148 nem têm expandido). O `description` da `er-config` também não serve: ele difere do texto curto da NextDex (que é o que as regexes conhecem) e, sozinho, derruba o efeito de 237 habilidades.
- O que quebra de verdade é a **redação nova da NextDex 2.65.4** (07/10): medido trocando o texto de todas as habilidades pelo do `gameDataV2.65.4.json`, **57 habilidades em uso perdem o efeito inteiro** e outras leem outro efeito só pela redação (o relatório da varredura contava 59 com a regra do `d1a9a4c`; a medida de hoje separa o que é redação do que é mudança do jogo).

## O que entrega
- `TEXTO_LIDO_DA_VERSAO_NOVA_DUELO` (`duelo.js`): 74 entradas `[nome, texto novo, texto que o parser lê]` e o índice `LIDO_PELO_TEXTO_NOVO_DUELO`. Quando o texto do dado é exatamente o texto novo, o parser lê o texto da 2.65beta. Vale também para a **parte de uma composta** (`condicoes_habilidade.js`, `expandirTextoDeHabilidade`): Poison Quills = Rough Skin + Poison Point não perde o Rough Skin.
- Só entram as que o **código do jogo** não mudou (`git diff 7d85acd..486026e` em `abilities.cc` e `battle_util.c`: só Madness Enhancement, Feathercoat e Friend Guard/Caretaker/Food Lovers tiveram número novo). Onde o jogo mudou, o texto novo manda: Friend Guard 25% (`battle_util.c:7664`, lido pelo parser), Madness Enhancement e Feathercoat (v02).
- `scripts/medir_texto_novo.mjs <gameData novo.json>`: o portão da troca de dado (v05). Troca o texto de toda habilidade pelo do dado novo, compara o efeito lido e sai com código 1 se alguma perder o efeito. Hoje, contra o `gameDataV2.65.4.json`: 982 iguais, **1 some** (Best Offense), 13 mudam (ver abaixo).

## Critérios de aceite
- [x] Nenhuma das habilidades simples cujo texto mudou perde o efeito (74 entradas, cada uma comparada com o efeito da 2.65beta; controle: sem a tabela, 57 perdem).
- [x] Composta com parte afetada mantém o efeito (Poison Quills).
- [x] Medida antes e depois (script).
- [ ] 1 habilidade segue sem efeito com o texto novo: **Best Offense** (o código MUDOU: tirou o multiplicador de Keen Edge e passou a dar +20% de DEFESA, enquanto o texto diz Sp. Def; precisa de regra nova e de decisão sobre código x texto). Ver `perguntas.md`.

## O que não foi feito como pedido
Ler "pelo dado estruturado" não é possível pelas razões acima. O que ficou no lugar é uma camada de compatibilidade medida (tabela + script + portão). A solução estrutural de verdade seria ler `abilities.cc`, o que é outro projeto. **Pergunta ao Felipe/Construção em `perguntas.md`.**

## Mudam de efeito com o texto novo e NÃO foram aliadas (mudança real do jogo: o texto novo manda)
Friend Guard, Caretaker, Food Lovers (25% em vez de 50%, só dupla); as compostas que trocaram de parte: World Serpent (Serpent Bind), Scarecrow (Cotton Down), As One (Grim Neigh), Angelic Wings (Imposing Wings), Shocking Maw (Shocking Jaws), King of the Jungle (Grassy Surge, perde o x1,5 em Grass), Magus Blades, Fey Flight (Fairy Tale), Tentalock; e as 4 Embody Aspect (Ogerpon, uma por forma, texto novo por forma). Cada uma lê as partes novas; as partes que o motor ainda não conhece (Serpent Bind, Cotton Down, Grim Neigh...) ficam sem efeito até alguém escrever a regra: é trabalho do "delta do upcoming".

## Testes
- Novo: `tests/unit/texto_novo_das_habilidades.test.mjs` (6 testes).
- Sabotagens novas: `versao-lido-indice-vazio`, `-textohab-ignora`, `-composta-ignora`, `-entrada-guts-some`.

## O que ficou de fora
- Habilidades novas da 2.65.4/upcoming sem regra (15 das 38): é o "delta do upcoming".
- As outras leituras de texto fora do motor (`habilidadeArma` e a lista de condições da UI usam o texto cru do dado): com o dado novo, os textos que elas procuram podem precisar do mesmo tratamento; o script não mede isso.
- **Rank não recalculado.**
