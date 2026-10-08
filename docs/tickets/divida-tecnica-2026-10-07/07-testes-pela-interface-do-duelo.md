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
Novos: `tests/unit/duelo_pela_interface.test.mjs` (29 cenários) + `tests/unit/cenarios_do_duelo.mjs` (montagem dos lados e medidas).
Os dois lados entram como o app monta (R.unidadeDaBuild do jogador, R.foeDeDuelo do chefão) e a luta sai por R.resultadoDoDuelo; nenhum teste mexe em ef, stats ou golpesProntos. Espécie, habilidade, golpe e item são os reais do 2.65beta.
Medida: "causado" (luta que o jogador perde) e "sofrido" (luta que ele vence); o efeito vira razão entre duas lutas com o mesmo número de turnos e cai numa faixa em volta do multiplicador (o motor tira a média da luta, então não sai exato).
Cobertos: imunidade de tipo (Earthquake x Flying/Levitate, Thousand Arrows), Freeze-Dry, Wonder Guard, Seismic Toss, Tough Claws, Skill Link, Intimidate (nos dois sentidos) e Clear Amulet, Solid Rock (-35%), Rough Skin, itens (Choice Band, Life Orb, tipo, Expert Belt, Assault Vest, Leftovers, Rocky Helmet, Occa, Eviolite, Sitrus; item do chefão), sol/chuva, areia/granizo/névoa, Electro Surge, Psychic Terrain x prioridade, prioridade, Choice Scarf, Swords Dance no plano, Flame Orb x Guts, Scald, Cloud Nine, Emergency Exit, nota do veredito (vitória 1, derrota metade, empate 0,5) e HP que passa de uma luta pra outra.
Prova: 23 sabotagens em memória (itens, clima, terreno, imunidades, Wonder Guard, Seismic Toss...) e 3 à mão no duelo.js (sol, Thousand Arrows, Intimidate; depois desfeitas): todas pegas pelo arquivo novo.
Achado (não é bug): Solid Rock está modelado em dois lugares (tipos.js seDamper 0,65 e ef.reducao.superEf); tirar um só dos dois não muda o resultado (mutante equivalente). Os testes novos pegam a mudança do valor.
**Falta (2ª metade):**
- Luta contra o chefão: `simularLutaContraChefao`, `montarTimeContraChefao` e a dupla 2x2 (`simularDuplaContraChefao`) pela entrada pública, com Pokémon e times reais (sequência, hazards, troca, HP entre lutas, buffs de ginásio, regra de campo).
- Efeitos do duelo ainda só cobertos por teste interno: crítico (critico_no_duelo), cura e recuo, condições/status em geral (condicoes_no_duelo, status_no_duelo), extras e diversos, estágios, poder variável, IA do chefão (ia_do_chefao_golpe).
- Critério 2: sabotagens que não dependem do texto exato do código (hoje o catálogo troca trecho literal; pensar em sabotagem por comportamento, ex.: envolver a função e distorcer o retorno).
- Critério 3: depois que a 2ª metade existir, enxugar os testes internos que viraram duplicata (areia_e_sets_rapidos, clima_oficial_e_revisao, itens_no_duelo, campo_no_duelo...) deixando só fórmulas; conferir antes com o cache das sabotagens quais testes cada sabotagem do duelo usa.
