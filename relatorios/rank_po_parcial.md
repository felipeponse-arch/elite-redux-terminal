# Rank parcial dos pós (11/11/2026)

Antes = cache atual (`data/rank_medicao.json`); depois = só as espécies afetadas recalculadas com o motor novo (`--so`). Nada foi gravado em `data/`.

Linhas com nota ou tier diferente (mudança só de posição, por vizinhos, fica de fora): 31

| Dificuldade | Espécie | Nota antes | Nota depois | Tier antes | Tier depois | Posição antes | Posição depois |
|---|---|---|---|---|---|---|---|
| insane | SPECIES_ACCELGOR | 55 | 56 | B | B | 714 | 698 |
| insane | SPECIES_BRUTE_BONNET | 14 | 13 | D | D | 1372 | 1387 |
| insane | SPECIES_CARNIVINE | 56 | 55 | B | B | 701 | 714 |
| insane | SPECIES_ELEKID | 13 | 14 | D | D | 1389 | 1377 |
| insane | SPECIES_FURRET | 73 | 74 | B | B | 429 | 414 |
| insane | SPECIES_SHIINOTIC | 74 | 73 | B | B | 423 | 437 |
| party | SPECIES_CARNIVINE | 47 | 51 | C | B | 843 | 781 |
| party | SPECIES_ELDEGOSS | 17 | 19 | D | D | 1325 | 1293 |
| party | SPECIES_BELLOSSOM | 26 | 27 | C | C | 1180 | 1164 |
| party | SPECIES_CELEBI | 78 | 77 | A | A | 347 | 362 |
| party | SPECIES_CERULEDGE | 65 | 66 | B | B | 555 | 539 |
| party | SPECIES_CLEFAIRY_REDUX | 18 | 17 | D | D | 1309 | 1324 |
| party | SPECIES_EXEGGUTOR | 52 | 51 | B | B | 769 | 786 |
| party | SPECIES_EXEGGUTOR_ALOLAN | 66 | 65 | B | B | 543 | 558 |
| party | SPECIES_FOGGING | 19 | 18 | D | D | 1293 | 1312 |
| party | SPECIES_FURRET | 81 | 82 | A | A | 304 | 287 |
| party | SPECIES_GLALIE_REDUX | 51 | 50 | B | B | 785 | 802 |
| party | SPECIES_GLOOM | 33 | 32 | C | C | 1073 | 1089 |
| party | SPECIES_HYPNOCROAK | 40 | 41 | C | C | 961 | 947 |
| party | SPECIES_LILLIGANT_HISUIAN | 77 | 78 | A | A | 369 | 353 |
| party | SPECIES_LURANTIS | 49 | 48 | C | C | 818 | 837 |
| party | SPECIES_MURKROW | 31 | 32 | C | C | 1107 | 1094 |
| party | SPECIES_ORICORIO | 41 | 40 | C | C | 949 | 964 |
| party | SPECIES_OVERQWIL | 50 | 49 | C | C | 804 | 819 |
| party | SPECIES_ROSERADE | 32 | 31 | C | C | 1095 | 1112 |
| party | SPECIES_SCYTHER | 48 | 47 | C | C | 841 | 855 |
| party | SPECIES_SEEL | 27 | 26 | C | C | 1171 | 1192 |
| party | SPECIES_VENUSAUR_MEGA | 82 | 81 | A | A | 297 | 311 |
| party | SPECIES_VICTINI | 51 | 52 | B | B | 793 | 775 |
| party | SPECIES_ZWEILOUS | 32 | 33 | C | C | 1098 | 1082 |
| party | SPECIES_AMAURA | 50 | 50 | B | C | 795 | 795 |

## Como foi gerado e limites
- Cache (`data/rank_medicao.json`, 1940 espécies) = "antes", medido com o motor anterior; 150 espécies recalculadas com `node scripts/calcular_rank_v2.mjs --so=<lista>` (4 min), o resto mantido do cache. Os percentis são da população inteira, por isso vizinhos não recalculados podem mudar de posição sem mudar de nota.
- Afetadas = espécies Grass (139) + as que têm Spore/Sleep Powder nos 4 golpes medidos (33) + as que a habilidade medida é Overcoat/Shield Dust/Effect Spore/Guardian Coat/Charge Spores (12), união 150. Também entra o efeito do lado do chefão: 10 golpes de Spore/Sleep Powder em `data/bosses.json` agora falham contra quem é imune. Stun Spore, Poison Powder e Cotton Spore não aparecem nos 4 golpes de nenhuma espécie nem nos chefões: sem efeito no rank.
- Não coberto: espécie que passaria a ESCOLHER Overcoat/Shield Dust (ou Safety Goggles) por causa da nova imunidade sem tê-la medida hoje; só o rank completo mostra.
- Resumo: 31 linhas (espécie x dificuldade) com nota/tier diferente; 13 sobem, 17 descem, 2 mudam de tier; maior variação 4 pontos (Carnivine party 47 -> 51, C -> B). NADA foi gravado em `data/` (cache e `species_rank.json` intactos). Aguardando aprovação do usuário.
