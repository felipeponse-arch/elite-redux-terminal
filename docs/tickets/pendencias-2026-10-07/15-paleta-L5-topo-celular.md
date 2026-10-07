# 15 — Paleta L5: marca e topo no celular

Status: resolvido
Bloqueado por: 14
Agentes: engenheira-frontend, ux-acessibilidade

## O que entrega
Marca Rayquaza shiny (ícone da aba e do topo) e abas do celular sem estouro. `topo.css`, `responsivo.css`. Baselines
celular-* e os que mostram o topo. Depois deste lote, publicar a versão nova uma vez só.

## Como verificar
Nenhuma rolagem lateral em 375 px; baselines regravados; publicação.

## Comentários

07/10: marca com o Rayquaza shiny (data/arte/rayquaza_icone.webp, 6 KB) no lugar do símbolo; no celular as 4 abas cabem sem rolar a partir de 360 px (antes faltavam 35 px a 375): padding 9->7 e o contador fixo da aba Chefões sai no celular; o esmaecimento das bordas desliga quando cabe. Ícone da aba do navegador: o app roda dentro do claude.ai (o ícone do artifact vem da publicação), então não se aplica. Teste de navegador a 360 e 375 px; 14 imagens regravadas. Paleta Shiny completa (tickets 11-15).
