# 13 — Ficha da Dex mostra a efetividade real contra Solid Rock / Primal Armor

Status: resolvido
Bloqueado por: 12

## O que entrega
`perfilDefensivoDaEspecie` (faixas Fraco/Resiste/Imune da ficha) passa a usar `real` e a citar `reducoes` de abilityTypeModFor, igual às outras telas (ticket 12). Ex.: Rhydon (Solid Rock sempre ativa) mostra Grass 4x e Fighting 2x, com "Solid Rock reduz 35%" ao lado.

## Contexto
A ficha só conta habilidades sempre ativas (innates ou slots iguais). Tyranitar tem Solid Rock como habilidade escolhível, então a regra existente a deixa fora da ficha; mantida (não adivinhar a build).

## Critérios de aceite
- [x] Ficha usa a efetividade real e mostra a redução da habilidade.
- [x] Teste unitário (Rhydon) e uma sabotagem (ficha-efetividade-amortecida).
- [x] Rank NÃO recalculado. Sem publicar.
