# 07 — Testes e sabotagens pela interface do duelo

Status: em-andamento
Bloqueado por: nenhum

## O que entrega
Cenários de duelo (espécie, habilidade, golpe → veredito e dano) testados pela entrada pública do duelo e da luta contra o chefão, para que uma refatoração interna não quebre a suíte.

## Critérios de aceite
- [ ] Os testes que hoje chamam funções internas do duelo e cobrem comportamento de efeito ganham cenário equivalente pela interface pública.
- [ ] Sabotagens do duelo ganham versão que não depende do texto exato do código, onde der.
- [ ] Testes internos ficam só para fórmulas.
- [ ] Nenhuma regra de mecânica muda.

## Comentários
Origem: levantamento de dívida técnica e revisão de arquitetura de 07/10 (prioridades na conversa).

### 08/10/2026 - 1ª metade (duelo 1x1) feita; ticket segue em-andamento
Novos: `tests/unit/duelo_pela_interface.test.mjs` (31 cenários) + `tests/unit/cenarios_do_duelo.mjs` (montagem dos lados, medidas e faixa de ±10%).
Os dois lados entram como o app monta (R.unidadeDaBuild do jogador, R.foeDeDuelo do chefão) e a luta sai por R.resultadoDoDuelo; nenhum teste mexe em ef, stats ou golpesProntos. Espécie, habilidade, golpe e item são os reais do 2.65beta.
Medida: "causado" (luta que o jogador perde) e "sofrido" (luta que ele vence). O efeito vira a razão entre duas lutas com o mesmo número de turnos e precisa cair a ±10% do multiplicador (rodada 2; a 1ª aceitava de meio efeito a dobro). Chefão e jogador SEM cura passiva: Snorlax e Blissey têm Self Sufficient, que soma uma constante por turno e entortava a razão (sol 1,6, chuva 0,4, Assault Vest 0,49). Não é bug do motor: é conta aditiva; trocando por Rhyperior/Corviknight/Dragonite as razões ficam em 1,29 (Tough Claws), 1,47 (Choice Band), 1,30 (Life Orb), 1,19 (Dragon Fang), 1,48 (sol), 0,52 (chuva), 1,64 (Skill Link), 1,30 (Electro Surge), 0,67 (Assault Vest).
Cobertos: imunidade de tipo (Earthquake x Flying/Levitate, Thousand Arrows), Freeze-Dry, Wonder Guard, Seismic Toss, Tough Claws, Skill Link, Intimidate (nos dois sentidos) e Clear Amulet, Solid Rock (-35%), Rough Skin, itens (Choice Band, Life Orb, tipo, Expert Belt, Assault Vest, Leftovers, Rocky Helmet, Occa, Eviolite, Sitrus; item do chefão), sol/chuva, areia/granizo/névoa, Electro Surge, Psychic Terrain x prioridade, prioridade, Choice Scarf, Swords Dance no plano, Flame Orb x Guts, Scald, Cloud Nine, Emergency Exit, nota do veredito (vitória 1, derrota metade, empate 0,5) e HP que passa de uma luta pra outra.
Prova: 23 sabotagens em memória removendo o efeito, 16 VIZINHAS (sol 1,3, chuva 0,7, Life Orb 1,5 e 1,15, Choice Band 1,3, item de tipo 1,4, Expert Belt 1,4, Tough Claws 1,5, Skill Link 4 acertos, Solid Rock 0,75 e 0,55, Assault Vest 1,3, areia 1,3, granizo 1,3, terreno 1,5, Intimidate 3/4) e 3 à mão no duelo.js (sol, Thousand Arrows, Intimidate; depois desfeitas): todas pegas pelo arquivo novo.
**BUG LATENTE, decisão do usuário (motor NÃO mexido): Solid Rock corta duas vezes.** O seDamper 0,65 de tipos.js:220, aplicado em duelo.js:1563, deixa o 4x em 2,6 (>= 2) e duelo.js:1678 multiplica 0,65 de novo: em fraqueza 4x o corte vale 0,42 em vez de 0,65. No 2x o seDamper deixa efTipo em 1,3 (< 2), então o golpe deixa de contar como super efetivo e Expert Belt e Weakness Policy do chefão não disparam contra Solid Rock. Primal Armor (seDamper 0,5) tem a mesma estrutura. Documentado por 2 testes marcados "comportamento atual, bug em aberto" (Tyranitar x Karate Chop do Machamp aguenta 3 golpes que o Predator não aguenta 1; Expert Belt do Starmie sem efeito contra Solid Rock e x1,2 contra Predator). Se o motor for corrigido, esses 2 testes quebram de propósito e devem ser trocados pelos valores certos.
**Falta (2ª metade):**
- Luta contra o chefão: `simularLutaContraChefao`, `montarTimeContraChefao` e a dupla 2x2 (`simularDuplaContraChefao`) pela entrada pública, com Pokémon e times reais (sequência, hazards, troca, HP entre lutas, buffs de ginásio, regra de campo).
- Efeitos do duelo ainda só cobertos por teste interno: crítico (critico_no_duelo), cura e recuo, condições/status em geral (condicoes_no_duelo, status_no_duelo), extras e diversos, estágios, poder variável, IA do chefão (ia_do_chefao_golpe).
- Critério 2: sabotagens que não dependem do texto exato do código (hoje o catálogo troca trecho literal; pensar em sabotagem por comportamento, ex.: envolver a função e distorcer o retorno).
- Critério 3: depois que a 2ª metade existir, enxugar os testes internos que viraram duplicata (areia_e_sets_rapidos, clima_oficial_e_revisao, itens_no_duelo, campo_no_duelo...) deixando só fórmulas; conferir antes com o cache das sabotagens quais testes cada sabotagem do duelo usa.
