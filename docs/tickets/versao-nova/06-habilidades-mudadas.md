# v06 — Habilidades mudadas (dados-2654/02 e 03, com o número da versão nova)

Status: resolvido (no master: c341fea, 1345f29, 2dd611a, 379b9fa; publicado na v178/v179; marcado em 21/10)
Tamanho: M
Autorização: Felipe, 15/10/2026 (fila v06–v09 repassada pelo "Elite Redux - Construção"). Regra do Felipe: quando as fontes divergem vale o CÓDIGO do jogo.

Fontes: `abilities.cc` e `battle_util.c` do upcoming `486026e`; texto curto da NextDex 2.65.4 (só para o que o motor lê por regex).

## Veredito por habilidade
| Habilidade | Veredito | Fonte | O que mudou no motor |
|---|---|---|---|
| Cute Charm, Yuki Onna, Attract | **corrigido** | `battle_util.c:5159` (`CanInfatuate` não olha gênero, nas duas versões) | a chance de paixão não é mais cortada pela metade; sem restrição de gênero |
| Justified | **corrigido** | `abilities.cc:2178` | absorve Dark e sobe o MAIOR ataque +1; o reforço x1,5 vale só para golpes da categoria do maior ataque (`absorveReforca.categoria`) |
| Jaws of Carnage | **corrigido** | `abilities.cc:5545` | nocaute cura 1/4 do HP máximo (1/2 se o golpe é de mordida); antes o motor "devorava" 1/2 do alvo. Helper `curaDoNocauteDuelo`, usado na luta inteira e na dupla |
| Perish Body | **corrigido** | `abilities.cc:3444` | só toca a canção se o atacante faz contato (`perecimentoDuelo`) |
| Poison Absorb | **corrigido** | `abilities.cc:4421` | além de absorver Poison, cura 1/8 por turno no Toxic Terrain |
| Lawnmower | **corrigido** | `abilities.cc:7626` | limpa o terreno e sobe Def (+1), ou Sp. Def (+1) se o terreno era Toxic/Psychic/Misty; entra no estágio de entrada |
| Low Visibility, Fog Machine, Cryo Proficiency, Power Leak | **corrigido (leitura)** | `abilities.cc:7799` e o texto novo | `ARMA_POR_TEXTO` aceita "Summons fog", "Sets fog", "Sets hail", "Sets Electric Terrain"; antes o texto novo deixava de armar o campo. Saem da lista "sem regra" |
| Toxic Surge, Low Visibility | já certo | `abilities.cc:10127`, `7799` | duram 8 turnos (`CLIMA_OFICIAL.duracaoTurnos`) |
| Madness, Feathercoat, Magus Blades, Best Offense | feitos em v02/v05 | ver `decisoes_mecanicas.md` | — |
| Friend Guard (+Caretaker, Food Lovers), Scarecrow (Cotton Down), World Serpent (Serpent Bind), King of the Jungle, Weather Control, Chuckster | **confirmados** | `battle_util.c:7664` e `abilities.cc` | teste de confirmação, sem mudança |
| Oblivious | não modelado | — | disable/encore/torment ficam fora do motor |
| Pyro Shells | aproximado | — | o golpe seguinte entra como poder extra; o Explosion/Outburst tipado fica "só texto" |
| Wonder Skin, Fort Knox, Familia Bond | **depende do v07** | — | tratados junto com as habilidades novas |

## Testes e sabotagens
- `tests/unit/habilidades_mudadas_2654.test.mjs` (11 testes, dado real).
- 10 sabotagens novas `versao-*` em `tests/unit/mutacoes.mjs`, todas pegas pelos testes (verificadas direto). `absorcao-flash-fire-reforca-todo-tipo` reapontada para a nova condição de categoria.
- `npm run check` ok; suíte unitária 958 testes (957 pass, 1 TODO preexistente). O portão `--mudados` completo não foi rodado (≈37 min por 25 mutações); só as novas.

## Ressalvas
- Jaws: o efeito é grande na luta inteira (hp final 0,89 x 0,36 num cenário de teste) e pequeno na dupla.
- Rank e builds seguem como no v05 (fecham no ticket de fechamento).
