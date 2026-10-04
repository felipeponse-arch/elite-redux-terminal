# Decisões de mecânica (registro único)

Regra travada pelo usuário em 2026-10-02: **nenhuma interpretação nova** de golpe, habilidade,
item ou regra de batalha sem (1) consultar este registro, (2) pesquisar a fundo nas fontes abaixo,
(3) varrer as mecânicas parecidas e decidir todas juntas, (4) registrar aqui com a fonte e um teste
que falha sem a decisão. Fontes em conflito: registrar o conflito e não modelar (ou perguntar).

## Fontes, em ordem
1. Documentação oficial (eliteredux.net, índice Full Documentation).
2. NextDex 2.65beta = `data/gameData_265beta.json` (versão dos dados do app). Ler **desc e lDesc**:
   o desc curto às vezes é placeholder ("Not done yet") e o efeito está no lDesc.
3. Campos estruturados do dado (effT do golpe, types, flags, stats.flags, hpType) **antes** de
   qualquer texto livre.
4. Código oficial do jogo (github Elite-Redux/eliteredux-source; o clone usado é do branch
   *upcoming* - marcar quando puder ser mais novo que a 2.65beta).
5. Transcrições de vídeos (`teste/ferramentas/transcricoes`, yt-dlp): só evidência de comportamento.

Nunca usar como fonte de mecânica: a tradução PT (`move_translations_pt.json` /
`ability_translations_pt.json`) nem qualquer gameData de outra versão.

## Decisões

| Mecânica | Decisão | Fonte | Data |
|---|---|---|---|
| Clima sol/chuva | +50%, 8 turnos (duração entra na luta inteira) | NextDex 2.65beta "Lasts 8 turns" + código (battle_util.c); Full Features (+20%, infinito) desatualizado; decisão do usuário | 2026-10-02 |
| Granizo / Eerie Fog | Ice +50% Def física; Ghost/Psychic recebem 0,8x | Full Features (Weather Rework) | 2026-09-30 |
| Elite: innates do jogador | escolhida sempre; 1ª innate nv 1, 2ª nv 17, 3ª nv 24 (nível do Pokémon) | código pokemon_config.h + pokemon.c:4968; vídeo Mono Fairy | 2026-10-02 |
| Acertos de golpe | pelo effT: Multi Hit 3 (2-5), Double Hit 2, Triple Kick 3, Ten Hits 6; exceções do lDesc: Twineedle, Cross Poison, Double Iron Bash, Rapid River 2; Chiller, Surging Strikes, Sparkling Barrage 3 | effT + lDesc 2.65beta | 2026-10-02 |
| "Can't be used twice in a row" | NÃO é acerto duplo (Gigaton/Tsunami Hammer, Blood Moon...) | lDesc | 2026-10-02 |
| Golpes de 2 tipos | efetividade = produto; STAB por qualquer dos dois | dado bruto types[] | 2026-10-02 |
| Hidden Power / Secret Power / Techno Blast | tipo = hpType do treinador | dado bruto usesHpType + hpType | 2026-10-02 |
| Multi-Headed | 2 cabeças 1,25x; 3 cabeças 1,35x (100%+20%+15%) | código GetParentalBondMultiplier + stats.flags | 2026-10-02 |
| Super efetivo contra X | Acid/Magnet Bomb/Gigaton Hammer/Crackle Slam/Hacksaw/Godspeed em Steel; Sludge/Sheer Cold/Freeze-Dry em Water; Poison Gas/Clay Dart em Flying; Razor Wind em Rock; Fumigation Bomb em Bug; Aura Force em Ghost | desc/lDesc 2.65beta | 2026-10-02 |
| Sonic Boom, Tsunami Hammer | NÃO modelado: desc e lDesc citam tipos diferentes | conflito de fonte | 2026-10-02 |
| Infernal Parade / Bitter Malice / Barb Barrage | +50% com o alvo sob status (não 2x) | lDesc 2.65beta | 2026-10-01 |
| Absorb | na 2.65beta NÃO drena (tira mudanças de atributo) | desc 2.65beta (o gameData de outra versão diz que drena) | 2026-10-01 |
| Golpes "Not done yet" (30) | funcionam; efeito = lDesc | lDesc + transcrições (Diamond Blade, Black Magic em 2025-2026) | 2026-10-02 |
| Madness Enhancement | enfurece na névoa, dano recebido 0,5x | NextDex 2.65beta (código upcoming usa 0,8) | 2026-10-01 |
| Mental Pollution | enfurecido = suprime as habilidades dos outros (como Neutralizing Gas) | código abilities.cc | 2026-10-01 |
| Power of Alchemy | baga do outro vira Black Sludge na entrada | código abilities.cc | 2026-10-01 |
| Pure Power / Cryptic Power | dobram o **Sp. Atk** neste hack (Huge Power dobra o Atk) | desc 2.65beta | 2026-10-02 |
| Buffs do ginásio | Posture x1,8; Steady +1/turno; Last Stand x2 no último (com 6); status nos últimos N; telas 5 turnos | código battle_events.c + scripts.pory | 2026-10-01 |
| Regra de campo | Tate&Liza 1: Trick Room + invertida; revanches: Trick Room; Steven Doubles: Gravity; Monochamp: NÃO modelado (efeito próprio não pesquisado) | scripts.pory oficiais | 2026-10-02 |
| Cute Charm | 50% (o ~90% visto em vídeo era bug de versão) | desc 2.65beta | 2026-10-02 |
| Rank v2: disponibilidade | etapa mais cedo em que a espécie é obtível; planilha "Mono earliest locations" manda quando cita a espécie (o código vê o mapa inteiro, sem barreira de área); código preenche o resto; presente segue a flag do código (manda sobre o "Mystery Gift" da planilha); pós-jogo, DexNav e sem fonte = fora do rank | planilha + wild_encounters.json, scripts.pory, field_specials.c; regras em data/disponibilidade_regras.json | 2026-10-02 |
| Rank v2: equipamento | Old Rod 0 (Littleroot), Good Rod 3, Super Rod 6 (Mossdeep), Surf insígnia 5, Rock Smash insígnia 3; vara pela vaga (0-1/2-4/5-9) | scripts.pory, field_control_avatar.c, party_menu.c, wild_encounter.c | 2026-10-02 |
| Rank v2: nota | média ponderada por ameaça só das lutas em que a espécie já existe (contar a luta ausente como 0 premiava quem aparece cedo); potencial = 4º golpe pode ser de status; viabilidade = 4 golpes de dano sem planos | validação: fortes da comunidade 76 (v1 73), fracos 28 (v1 33) | 2026-10-02 |
| Rank v2: marcas sem nota | "Precisa de setter": habilidade ativa (innates + a do set do rank) da tabela CONDICAO_DE_HABILIDADE cuja condição é só de campo (clima/terreno) e nenhuma habilidade da espécie arma (ARMA_POR_TEXTO; innate condicional aceita escolhível que arma, como no prompt da IA); golpe que arma (Rain Dance) é citado, não resolve; Solar Beam não gera marca porque o motor já tira do set o golpe de carga que não dispara; Trick Room/sala NÃO marcado (nenhuma habilidade do jogo depende de sala na tabela). "Concorrência": Pareto por tipo nas notas brutas de potencial e viabilidade + etapa, estritamente melhor em ao menos um. "Papéis": o Papel de species_role.json, sem duplicar | condicoes_habilidade.js (regra existente), duelo.js prepararGolpesDuelo | 2026-10-02 |
| Batalha invertida confirmada em jogo | Tate&Liza 1: Axe Kick (Dark) fez só 6-8% no Delphox na calculadora do jogo = tabela invertida vale. O plano/escolha de golpes fora do duelo agora também a usa (efetividadeNoDuelo lê ef.inversa >= 99 quando não há duelo em curso) | vídeo do usuário (gravacao da luta.mp4) + scripts.pory | 2026-10-02 |
| Sono do ginásio no último da party | Com 5 no time o sono cai no 5º (Grimmsnarl, último); o motor já assumia isso e agora a conferência com builds mantém a ordem real da party | vídeo do usuário | 2026-10-02 |
| Pedras mega tardias | Auditoria no código oficial (er-repo 217dd0f, scripts.pory): 20 pedras com NPC/treinador trancado por insígnia entram em MEGA_PEDRAS_TARDIAS (5ª: Breloomite, Empoleonite, Feraligite X/Y, Krookodilenite, Meganiumite, Sandslashite, Slakingite, Torterranite, Typhlosionite; 6ª: Hitmonchanite, Hitmontopite, Nidokingite, Nidoqueenite, Toucannonite; 7ª: Crobatite, Dewgongite, Granbullite, Gyaradosite Y, Slowkingite) + Haxorusite e Dragoninite Y (7, decisões anteriores). As 11 que SÓ saem do menu do totem Haxorus (Altarianite, Galladite, Gardevoirite, Sceptilite, Swampertite, Skarmorite, Relicanthite, Magnezonite, Swalotite, Luxraynite, Quagsirenite) valem 7: o Ace Trainer que tampa a porta da sala só sai com FLAG_BADGE07_GET (MeteorFalls_1F_1R/scripts.pory:17,619) e nem src/ (lojas, field_specials.c) nem data/ citam essas pedras em outro lugar (varredura de 02/10 à noite). Os 3 sem trava achada (Dragoninite Y no Sky Pillar, Latias/Latios, mono-champ) ficam como estão. Clone parcial em ferramentas/er-repo | relato do usuário (Granbullite) + código oficial | 2026-10-02 |
| Wide Guard permanente (T&L) | modelado (02/10): golpe em área (ex.: Dazzling Gleam) não acerta o time dela, os de alvo único sim; Mega do chefão (Slowbronite G) e Focus Sash já eram modelados. Forewarn do Delphox (Future Sight 80 BP na entrada, cai em 3 turnos) modelado como golpe Psychic especial de 80 BP em quem abre (1x1 e dupla; só na 1ª entrada de cada um). NÃO modelado: Telekinesis na entrada | vídeo do usuário | 2026-10-02 |
| Telekinesis na entrada (Delphox T&L) | NÃO modelado de propósito: levita o alvo por 3 turnos (golpes dele não erram, Ground não o acerta) e o motor não segue turno exato; efeito pequeno e em parte a favor do jogador | NextDex 2.65beta + vídeo do usuário | 2026-10-02 |
| mega_forms.json completo | O arquivo foi feito à mão e ficou 47 pedras atrás do dado 2.65beta (Lucarionite, Gyaradeathite, Arcanite, Hydreigonite, Clefablite... e Orbs/Primais); chefes com elas lutavam sem a Mega. Agora gerado por scripts/gerar_mega_forms.mjs (o que já estava manda) + teste de completude contra o dado do jogo | gameData_265beta.json (evolutions) | 2026-10-03 |
| Presentes (Mystery Gift) | Tabela oficial GetMysteryGiftSpecies (field_specials.c): 17 espécies faltavam no "Como conseguir", incluindo Floette Eternal Flower (6ª insígnia, segura Fairy Gem). Floettite (pedra da Mega dela) NÃO aparece em nenhum script do er-repo (217dd0f nem 334c545); o Legendary Sage de Oldale Town só conversa | er-repo src/field_specials.c, OldaleTown/scripts.pory | 2026-10-03 |
| Varredura de chefes (gym_skills x scripts) | Os eventos de batalha de cada ginásio nos scripts (registerbattleevent) batem 1 a 1 com data/gym_skills.json; TENSE_BATTLE é só um rótulo de texto. Regras de campo só existem em Tate&Liza, Steven (ROOM + Gravity nas duplas) e campeão monotype | er-repo data/maps, battle_util.c TryToSetFieldEffect | 2026-10-03 |
| Tempestade de areia: Rock | Tipo Rock ganha +50% de Sp. Def (STAT_SPDEF "Sandstorm"); corrige Tyranitar/Rock no rank. Antes os docs diziam "sem bônus confirmado" | er-repo src/battle_util.c (STAT_SPDEF) | 2026-10-03 |
| Thunder / Hurricane no clima | Chuva = sempre acertam; sol = 50% (EFFECT_THUNDER/EFFECT_HURRICANE) | er-repo src/battle_script_commands.c | 2026-10-03 |
| Axe Kick | "Hurts on miss": errar custa metade do HP máximo (regra da série), em média (1 - precisão) / 2 por uso | NextDex 2.65beta lDesc + série | 2026-10-03 |
| Thousand Arrows | Acerta Flying (o tipo do alvo não anula o Ground) | NextDex 2.65beta desc | 2026-10-03 |
| Sets do simulador | Menu ganha Jolly e Timid (a comunidade usa o rápido): Garchomp .649 -> .732 | diagnóstico do meta-pokemon, 03/10 | 2026-10-03 |
| Golpe-chave imposto | A validação da build da IA recoloca o golpe que o simulador provou (último golpe que não é chave e não quebra a sinergia) | relato Tate&Liza (Dragon Claw x Dragon Pulse) | 2026-10-03 |
| DECISÃO ABERTA (usuário): setup entre duelos | O motor não carrega +1/+1 de Dragon Dance de um duelo para o seguinte (limite superior estimado: Garchomp .649 -> .779, Tyranitar .568 -> .712). Mudaria o método do rank; não aplicado | diagnóstico do meta-pokemon, 03/10 | 2026-10-03 |
| Botão do chefão x sets rápidos | Medido (03/10): Tate & Liza 1 com 60 candidatos levava 35 s com os 5 sets; o botão avalia os 3 sets de sempre + só o par rápido (Jolly/Timid) do melhor (30 s); o rank avalia o menu inteiro | medição em Node | 2026-10-03 |
| Rodapé no celular (design) | Link com 28 px de altura (não 44): o teste "rodapé ocupa uma linha só" exige < 32 px e o overflow cortaria a área de toque; WCAG 2.5.8 exige 24 px | decisão do coordenador, 03/10 | 2026-10-03 |
