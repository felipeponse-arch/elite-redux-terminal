# 01 — Dois Pokémon iguais, cada um com a sua build

Status: a-avaliar (usuário, 21/10/2026: abrir para depois do time-pelo-motor/01)
Tamanho: G.

## Pedido
O jogador pode querer dois Pokémon da mesma espécie no time, com funções diferentes, mas só quando de fato capturou
dois (time e caixa). Palavras do usuário (21/10): "se eu quiser ter dois Poke iguais no time com funções diferentes pode
ser útil, mas a regra só se aplica se o usuário tiver pegado dois iguais".

## Por que é grande
Hoje o app guarda cada espécie uma vez só: builds e estado são por sname/x, e a Dex barra adicionar quem já está no time
ou na caixa (`src/ui/dex_ficha.js:704`, `src/ui/time.js:108`). `xsDoJogador()` tira o mesmo x repetido por isso;
`entradasDoJogador()` (divida-04-05, fd7dea7) já devolve as entradas sem tirar repetidos.

## O que entrega (a sabatinar antes)
- Modelo por captura (id próprio por Pokémon capturado) no save, na sincronização e nas builds, com migração do save atual.
- Dex/time/caixa permitindo a segunda captura da mesma espécie.
- Modo Motor: a regra "uma espécie por linha evolutiva" ganha a exceção "salvo quando o jogador tem duas capturas".

## Depende de
time-pelo-motor/01 terminado; arquiteta-de-dados (save, soma de verificação, sync).
