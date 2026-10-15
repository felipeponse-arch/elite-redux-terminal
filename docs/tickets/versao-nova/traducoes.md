# Traduções das habilidades novas e das que mudaram de efeito

Branch `traducoes-versao-nova` (a partir de `origin/versao-10-config`). Só dado e documento, sem código. Arquivo: `data/traducoes_novas_por_nome.json` = `{ "<nome inglês da habilidade>": "<descrição em português do Brasil>" }`, para a Construção aplicar por nome no `ability_translations_pt.json` realinhado.

Regras seguidas: traduzo a descrição do DADO NOVO (`dex_compact.json` da `versao-10-config`, que já traz o texto da config `d1a9a4c`), fiel ao número e à condição; nomes de golpe, habilidade e tipo ficam em inglês, como no resto do arquivo; mesmo vocabulário das traduções existentes ("golpes", "HP", "Velocidade", "com menos de 1/3 do HP", "em campo").

## (a) Habilidades NOVAS sem tradução (28)
Nenhuma delas tinha tradução em `ability_translations_pt.json`. As 29 do pedido são as 19 sem tradução da NextDex 2.65.4 (ids 1036-1062 que não são compostas já expandidas) mais as 9 do upcoming (ids 1063-1071); a Lethal Touch é composta.
- **Familia Bond**: Os golpes acertam duas vezes. O 1º acerto causa 100% do dano e o 2º, 50%.
- **Spicy Spray**: Ao sofrer dano de um golpe, queima o atacante.
- **Mana Coat**: Ataques físicos causam 30% mais dano sob Psychic Terrain.
- **Hemorrhage**: Suprime as habilidades do alvo quando o usuário causa sangramento.
- **Bad Guy**: Adiciona o tipo Dark ao entrar em campo.
- **Ignition**: Adiciona o tipo Fire ao entrar em campo.
- **Smarty Pants**: Adiciona o tipo Psychic ao entrar em campo.
- **Bird Type**: Adiciona o tipo Flying ao entrar em campo.
- **Creepy Crawlie**: Adiciona o tipo Bug ao entrar em campo.
- **Insect Eater**: Causa 1.5x de dano a tipos Bug. Recebe 0.5x de dano de tipos Bug.
- **Third-Degree Burn**: Pode queimar qualquer tipo. Golpes do tipo Fire ignoram habilidades.
- **Engulf**: 50% de chance de prender. Depois ignora a Defesa e as checagens de precisão.
- **Grimace**: Usa Mean Look ao entrar em campo.
- **Lethal Touch**: Toxic Chains + Sharp Edges / - Toxic Chain: Golpes têm 30% de chance de envenenar gravemente o oponente. / - Sharp Edges: Oponentes perdem 1/6 do HP máximo se atingirem o usuário com um golpe de contato.
- **Frosty**: Aumenta o poder de golpes do tipo Ice em 1.2x, ou 1.5x quando com menos de 1/3 do HP.
- **Poison Upsurge**: Aumenta o poder de golpes do tipo Poison em 1.2x, ou 1.5x quando com menos de 1/3 do HP.
- **Packed Ice**: Aumenta drasticamente a Defesa em vez de ser atingido por golpes do tipo Ice.
- **Bush Rush**: Golpes do tipo Grass ganham +1 de prioridade com o HP cheio.
- **Light Wield**: Monta Light Screen por 3 turnos ao entrar em campo.
- **Photokinesis**: Aumenta o poder de golpes de luz em 1.3x.
- **Photon Burst**: Golpes de luz visam a Defesa e ganham 1.3x de poder.
- **Rippling Punch**: Golpes de soco também são golpes de som.
- **Cackling**: Usa Eerie Laugh ao entrar em campo. Só funciona duas vezes por batalha.
- **Fresh Snowfall**: Lança um Powder Snow de 30 BP ao ser atingido por um ataque especial.
- **Sticky Situation**: Golpes do tipo Bug reduzem a Velocidade.
- **Bioluminescent**: Adiciona o tipo Electric ao usuário + Illuminate.
- **Blinking Flash**: Golpes de luz têm 10% de chance de reduzir a precisão.
- **Brain Freeze**: Golpes do tipo Psychic têm 30% de chance de causar frostbite.

Observação: o dado traz a composta como "Toxic Chains + Sharp Edges", mas a habilidade se chama **Toxic Chain** (sem "s"); por isso o expansor de compostas não achou a parte e a Lethal Touch ficou sem texto. A tradução dela já vem no formato das compostas expandidas, com as duas partes.

## (b) Habilidades cujo EFEITO mudou na versão nova (46)
Texto inglês diferente entre o dado antigo (`master`, 2.65beta) e o novo, **só os que mudam o efeito** (as outras 130 do total de 178 são redação: "below" por "under", "Atk" por "Attack", "max HP" por "full HP", "attract" por "infatuate", "Keen Edge" por "Slashing/Sharpness"; essas já estavam certas em português, ou foram ajustadas no v07). A lista é um pouco maior que as 36 do pedido porque incluí toda mudança de número, condição, gatilho ou duração que a tradução antiga não diz:
- **Oblivious**: Imune a atração, Scare, Intimidate e a efeitos que desabilitam golpes.
- **Illuminate**: Precisão 1.2x. Ataques removem o tipo Ghost do alvo.
- **Aftermath**: Usa Explosion ou Outburst de 100 BP ao ser nocauteado. Golpes de explosão fazem o alvo recuar.
- **Friend Guard**: Reduz em 25% o dano recebido por um aliado em batalhas em dupla.
- **Heavy Metal**: Recebe metade do dano de golpes Ghost e Dark e dobra o peso do usuário.
- **Justified**: Aumenta o maior ataque em vez de ser atingido por golpes do tipo Dark.
- **Perish Body**: Usa Perish Song ao ser atingido por um golpe de contato.
- **Lead Coat**: Recebe 40% menos dano físico, mas a Velocidade é x0.9. Triplica o peso do usuário.
- **Chrome Coat**: Recebe 40% menos dano especial, mas a Velocidade é x0.9. Triplica o peso do usuário.
- **Poison Absorb**: Redireciona e absorve golpes Poison. Cura no Toxic Terrain.
- **Weather Control**: Imune a todos os golpes baseados em clima.
- **Hardened Sheath**: Aumenta o Ataque em +1 quando os golpes de chifre do usuário acertam.
- **Growing Tooth**: Aumenta o Ataque em +1 quando os golpes de mordida do usuário acertam.
- **Spectral Shroud**: Spectralize + os golpes têm 30% de chance de envenenar gravemente o alvo.
- **Pyro Shells**: Usa Explosion ou Outburst de 50 BP após usar um golpe de Mega Launcher.
- **Tectonize**: Golpes Normal se tornam do tipo Ground. Golpes Ground ignoram certos hazards.
- **Spike Armor**: 30% de chance de causar sangramento no contato. Também funciona ao atacar.
- **Sharp Edges**: Oponentes perdem 1/6 do HP máximo se atingirem o usuário com um golpe de contato.
- **Jaws of Carnage**: Nocautes curam 1/4 do HP máximo, ou 1/2 se usar um golpe de mordida.
- **Lawnmower**: Remove o terreno ao entrar em campo e então aumenta a Def ou a Sp. Def.
- **Low Visibility**: Invoca neblina ao entrar em campo. Dura 8 turnos.
- **Toxic Surge**: Cria Toxic Terrain ao entrar em campo. Dura 8 turnos.
- **Storm Cloud**: Invoca chuva ao entrar em campo. Dura 8 turnos. Ganha STAB do tipo Electric.
- **Petrify**: Limpa os aumentos de status e então reduz em um estágio a Velocidade dos oponentes ao entrar em campo.
- **Atomic Punch**: Iron Fist + aumenta o poder de golpes do tipo Steel em 1.3x.
- **Cryo Architect**: +1 de Atk ao ser atingido por Water e +1 de Def no turno seguinte. Ice dá +1 em ambos no turno 1.
- **Madness Enhancement**: Enfurece na neblina e reduz em 20% o dano recebido quando enfurecido.
- **Serpent Bind**: 50% de chance de prender. Reduz a Velocidade dos oponentes presos em -1 a cada turno.
- **Chokehold**: Golpes de prisão paralisam e reduzem a Velocidade em -1 a cada turno.
- **Magus Blades**: Best Offense + golpes cortantes acertam duas vezes, o 2º a 60% do dano.
- **Superheavy**: Steadfast + não pode ser forçado a trocar de Pokémon.
- **Purple Haze**: Dispara um Poison Gas de 20 BP após usar um golpe de dano.
- **Chuckster**: Uma vez por entrada, reduz à metade o dano de contato e então força o atacante a sair.
- **Sludge Spit**: Dispara um Venom Bolt de 35 BP após usar um golpe.
- **Drop Blocks**: Coloca uma camada de Spikes ao ser atingido por golpes de dano.
- **Turf War**: Remove o terreno ao entrar em campo e então aumenta o maior atributo em +1.
- **Zen Garden**: Cria Grassy ou Psychic Terrain ao entrar em campo, conforme a semente.
- **Break it Down**: Dispara um Rapid Spin de 20 BP após usar um golpe de dano.
- **Drakelp Head**: O primeiro golpe recebido causa 35% menos dano e então reduz o Atk em -1.
- **Survivor Bias**: Não pode ser nocauteado por golpes pouco efetivos.
- **Feathercoat**: Recebe 15% menos dano de ataques, 30% se for resistido.
- **Petal Shield**: Entra com +6 de Defesa e reduz a Defesa em -1 após cada acerto.
- **Aura Armor**: Recebe 35% menos dano de ataques.
- **Soul Harvest**: Pokémon desmaiados aumentam Atk, Sp. Atk e Sp. Def em 5%.
- **Cool Exit**: Usa Chilly Reception no fim do seu 2º turno. Funciona uma vez por batalha.
- **Fog Machine**: Cria neblina ao ser atingido.

Já traduzidas no v07 e por isso fora deste arquivo: Sharpness, Sweeping Edge, Dual Wield, Mystic Blades, Blademaster, Molten Blades, Power Edge, Cutthroat, Best Offense, Edgelord, Lightsaber, Chainsaw, Chestnut Axe, Sinister Claws, Power Fists. Compostas que o expansor monta sozinho a partir das partes (Super Hot Goo, Shocking Maw, Twinkle Toes, Fey Flight, World Serpent, Scarecrow, King of the Jungle, Angelic Wings, Overcast, Cryo Proficiency) não entram: basta reexpandir depois de aplicar as partes.
