# 01 — A sincronização não apaga run adiantada com run zerada

Status: feito (aguardando juntar no master)
Bloqueado por: nenhum

## O que entrega
Quando chega de outro aparelho um save com MENOS progresso que o deste, o app não troca nada: mostra um aviso com duas escolhas ("Manter este aparelho" ou "Usar o que chegou").

## Critérios de aceite
- [x] Regra pura `saveChegandoTemMenosProgresso` (marco, e no mesmo marco run confirmada vale mais que Novo jogo sem confirmar).
- [x] Os dois caminhos que aceitavam o save remoto (carga inicial e atualização ao vivo) passam pelo aviso.
- [x] "Manter" grava o local de novo (data nova); "Usar" aplica o que chegou.
- [x] Teste de unidade com o caso real (run zerada x run adiantada) e 3 sabotagens.

## Comentários
Origem: relato do usuário em 10/10/2026. O save avançado do celular foi trocado pela run zerada do PC porque o sync só comparava `savedAt`; o celular também recebeu a run zerada e perdeu a dele. Decisão do usuário: "avisar antes de trocar".
Limite conhecido: duas runs no mesmo marco e as duas confirmadas não entram na regra (nenhuma é "menos"). Soltar Pokémon do time ou da caixa não conta como perda de progresso.
Não coberto por teste de navegador: o banner novo (3 botões/ids no template). Conferir no celular depois de publicar.
