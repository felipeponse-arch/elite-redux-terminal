# Curadoria: o que mudou da 2.65beta para a 2.65.4 (dado NextDex)

Gerado por script a partir de data/raw/snapshots/gameData_2.65beta.json.gz e data/gameData_2654.json. Listas completas.

## 1. Itens

Novos: 0 · Removidos: 0 · Renomeados: 2 (no dado da NextDex, que não traz descrição, efeito nem disponibilidade de item). Pela config oficial (er-config, ver docs/pesquisa_2654_config.md §3 e §3B): **nenhum item mudou de efeito**, e a **disponibilidade no Centro de Adoção mudou: Arbokite saiu** (27/04/2026, commit cbdac78, junto com a remoção de Arbok Mega) e **Duraludite entrou** (14/03/2026, commit 2e29630, portanto já no dado beta de 28/03: não é diferença entre as duas versões do dado). Outros textos de item corrigidos na config (Raichunite X, Ursalunite, Duraludite) também já estavam no dado beta.

- RENOMEADO: Skarmorite → Skarmorite X (ITEM_SKARMORITE)
- RENOMEADO: Skarmorite → Skarmorite Y (ITEM_SKARMORITE_Y)

## 3. Habilidades

Novas: **29** (ids novos, posições 1034 a 1062) + **5 renomeadas no mesmo id** (não são novas nem removidas) · Removidas: 0 · Descrição mudou: 164. Classe (coluna abaixo, conferida no AbilityList de 7be1617, 6a30b66 e 7285071; detalhe em docs/pesquisa_2654_config.md §1): 10 MECÂNICA, 10 MECÂNICA provável, 144 TEXTO.

### Novas (29)

Só ids novos. As 5 renomeadas no mesmo id estão na seção seguinte.

| Habilidade | Efeito (desc 2.65.4) |
|---|---|
| Butterfly Wings | Pollinate + Giant Wings |
| Sand Titan | Juggernaut + Sand Stream |
| Familia Bond | Moves hit twice. 1st hit at 100% power, 2nd hit at 50%. |
| Mega Sol | Chloroplast + Grassy Surge |
| Petroleum Jelly | Hyper Cleanse + Liquified |
| Spicy Spray | Taking damage from a move burns the attacker. |
| Crimson Crown | Spike Armor + Mighty Horn |
| Mana Coat | Physical attacks deal 30% more damage on Psychic Terrain. |
| Hemorrhage | Supresses target's abilities when user inflicts bleeding. |
| Overclock | Ground Shock + Overcharge |
| Bad Guy | Adds Dark-Type on entry |
| Ignition | Adds Fire-Type on entry |
| Smarty Pants | Adds Psychic-Type on entry |
| Bird Type | Adds Flying-Type on entry |
| Insect Eater | Deal 1.5x dmg to Bug-types. Take 0.5x dmg from Bug-types. |
| Creepy Crawlie | Adds Bug-Type on entry |
| Third-Degree Burn | Can burn any type. Fire-type moves ignore abilities. |
| Engulf | 50% chance to trap. Then ignores Defense & accuracy checks. |
| Grimace | Uses Mean Look on entry. |
| Thermal Dweller | Heatproof + Immolate. |
| Lethal Touch | Toxic Chains + Sharp Edges. |
| Frosty | Boosts Ice-type moves by 1.2x, or 1.5x when under 1/3 HP. |
| Poison Upsurge | Boosts Poison-type moves by 1.2x, or 1.5x when under 1/3 HP. |
| Packed Ice | Boosts Defense sharply instead of being hit by Ice-type moves. |
| Bush Rush | Grass-type moves get +1 priority at full HP. |
| Guerilla Fighter | Bush Rush + Fighting Spirit |
| Sour Apple | Corrosion + Aroma Veil |
| Searchlight | Frisk + Illuminate |
| Light Wield | Sets up Light Screen for 3 turns on entry |

### Renomeadas no mesmo id (5; nenhuma é removida, o efeito é o mesmo)
- Absorbant (id 425): Drain moves recover +50% HP & apply Leech Seed. → **Absorbent**: Drain moves recover +50% HP & apply Leech Seed.
- Menacing Situation (id 630): 30% chance to Fear on contact. Also works on offense. → **Phobia**: 30% chance to Fear on contact. Also works on offense.
- Apple Pie (id 714): Self Sufficient + Ripen. → **Apple Cake**: Self Sufficient + Ripen.
- Frosty Prescence (id 878): Uses Mist on entry. → **Frosty Presence**: Uses Mist on entry.
- Wings of Pestilence (id 927): Every attack has a 20% Bleed chance and 10% Curse chance. → **Malediction**: Every attack has a 20% Bleed chance and 10% Curse chance.

### Descrição mudou

| Habilidade | 2.65beta | 2.65.4 | Classe |
|---|---|---|---|
| Limber | Para immune, takes half recoil, immune to self stat drops. | Paralysis immune, halves recoil damage, negates self stat drop. | TEXTO |
| Oblivious | Immune to infatuation, Scare, Intimidate and Taunt. | Immune to infatuation, Scare, Intimidate and disabling. | MECÂNICA |
| Rough Skin | Enemies lose 1/8 of max HP if they use a contact move. | Enemies lose 1/8 of max HP if they hit user with contact move. | TEXTO |
| Illuminate | Grants a 1.2x accuracy boost. | 1.2x accuracy. Attacks remove Ghost-type from target. | TEXTO |
| Cute Charm | 50% chance to attract on contact. Also works on offense. | 50% chance to infatuate on contact. Also works on offense. | MECÂNICA provável |
| Guts | Ups Atk by 1.5x if suffering from a status condition. | Ups Attack by 1.5x if statused. | TEXTO |
| Marvel Scale | Ups Def by 1.5x when statused. | Ups Defense by 1.5x when statused. | TEXTO |
| Aftermath | After fainting uses 100 BP Explosion or Outburst. | 100BP Explosion / Outburst when KOed. Explosion moves flinch. | TEXTO |
| Friend Guard | Reduces damage that ally takes by 50% in double battles. | Reduces damage that ally takes by 25% in double battles. | MECÂNICA |
| Weak Armor | If hit by a contact attack: -1 Defense and +2 Speed. | If hit by a contact move: -1 Defense and +2 Speed. | TEXTO |
| Heavy Metal | Take half damage from Ghost and Dark. | Take half damage from Ghost/Dark and doubles user's weight. | TEXTO |
| Justified | Boosts Attack instead of being hit by Dark-type moves. | Boosts highest attack instead of being hit by Dark-type moves. | MECÂNICA |
| Grass Pelt | This Pokémon's Defense gets a 1.5x boost in Grassy Terrain. | Boosts Defense by 50% in Grassy Terrain. | TEXTO |
| Stamina | Getting hit raises Def by +1. Critical hits maximize Defense. | Boosts Defense by +1 when hit. Critical hits maximize Defense. | TEXTO |
| Triage | Moves that have a healing effect gain +3 priority. | Moves that restore HP gain +3 priority. | TEXTO |
| Fluffy | Takes 1/2 dmg from contact moves but Fire moves hurt it 2x more. | Halves contact damage taken. 2x weak to Fire-type moves. | TEXTO |
| Perish Body | If hit, casts Perish Song. | Uses Perish Song when hit by a contact move. | MECÂNICA provável |
| Vengeance | Boosts Ghost-type moves by 1.2x, or 1.5x when below 1/3 HP. | Boosts Ghost-type moves by 1.2x, or 1.5x when under 1/3 HP. | TEXTO |
| Blitz Boxer | At full HP, gives +1 priority to this Pokémon's punching moves. | Punching moves get +1 priority at full HP. | TEXTO |
| Growing Tooth | Raises Attack by one stage after using a biting move. | Raises Attack by +1 when the user's biting moves hit. | TEXTO |
| Lead Coat | Takes 40% less from Phys. moves. This Pokémon's Speed is 0.9x. | Take 40% less phys. dmg, but Speed x0.9. Triple user's weight. | TEXTO |
| Coil Up | On entry, gives +1 priority once to the first biting move used. | First biting move each entry gets +1 priority. | TEXTO |
| Tectonize | Normal moves becomes Ground. Might ignore hazards. | Normal moves become Ground. Ground ignores certain hazards. | TEXTO |
| Dragonslayer | Deals 1.5x damage to Dragons. Takes 0.5x damage from Dragons. | Deal 1.5x dmg to Dragon-types. Take 0.5x dmg from Dragon-types. | TEXTO |
| Short Circuit | Boosts Elec.-type moves by 1.2x, or 1.5x when below 1/3 HP. | Boosts Electric-type moves by 1.2x, or 1.5x when under 1/3 HP. | TEXTO |
| Poison Absorb | Redirects Poison moves. Absorbs them, healing 25% HP. | Redirects and absorbs Poison moves. Heals in Toxic Terrain. | MECÂNICA provável |
| Flaming Soul | Fire-type moves get +1 priority at max HP. | Fire-type moves get +1 priority at full HP. | TEXTO |
| Weather Control | Negates all weather based moves from enemies. | Immune to all weather-based moves. | MECÂNICA provável |
| Sea Guardian | Ups highest stat by +1 on entry when it rains. | Ups highest stat by +1 on entry in rain. | TEXTO |
| Flock | Boosts Flying-type moves by 1.2x, or 1.5x when below 1/3 HP. | Boosts Flying-type moves by 1.2x, or 1.5x when under 1/3 HP. | TEXTO |
| Frozen Soul | Ice-type moves get +1 priority at max HP. | Ice-type moves get +1 priority at full HP. | TEXTO |
| Sun Worship | Ups highest stat by +1 on entry when sunny. | Ups highest stat by +1 on entry in sun. | TEXTO |
| Pollinate | Normal moves becomes Bug. Immune to powder if Bug-type. | Normal moves become Bug. Immune to powder if Bug-type. | TEXTO |
| Spectral Shroud | Spectralize + 30% chance to badly poison the foe. | Spectralize + moves have 30% chance to badly poison the foe. | TEXTO |
| Hardened Sheath | Ups Attack by +1 when using horn moves. | Raises Attack by +1 when the user's horn moves hit. | TEXTO |
| Pyro Shells | Triggers 50 BP Outburst after using a Mega Launcher move. | Uses 50BP Explosion or Outburst after using Mega Launcher move. | MECÂNICA |
| Parry | Counters contact with Mach Punch. Takes 20% less damage. | Uses 20BP Mach Punch when hit by contact. Takes 20% less damage. | TEXTO |
| Scrapyard | Sets a layer of Spikes when hit (contact move). | Sets a layer of Spikes when hit by a contact move. | TEXTO |
| Loose Quills | Sets a layer of Spikes when hit (contact move). | Sets a layer of Spikes when hit by a contact move. | TEXTO |
| Toxic Debris | Sets a layer of Toxic Spikes when hit by contact moves. | Sets a layer of Toxic Spikes when hit by a contact move. | TEXTO |
| Loose Rocks | Deploys Stealth Rocks when hit by contact. | Deploys Stealth Rocks when hit by a contact move. | TEXTO |
| Hellblaze | Boosts Fire-type moves by 1.3x, or 1.8x when below 1/3 HP. | Boosts Fire-type moves by 1.3x, or 1.8x when under 1/3 HP. | TEXTO |
| Riptide | Boosts Water-type moves by 1.3x, or 1.8x when below 1/3 HP. | Boosts Water-type moves by 1.3x, or 1.8x when under 1/3 HP. | TEXTO |
| Forest Rage | Boosts Grass-type moves by 1.3x, or 1.8x when below 1/3 HP. | Boosts Grass-type moves by 1.3x, or 1.8x when under 1/3 HP. | TEXTO |
| Volt Rush | At full HP, gives +1 priority to its Electric-type moves. | Electric-type moves get +1 priority at full HP. | TEXTO |
| Infernal Rage | Fire-type moves are boosted by 35% with 5% recoil. | Fire-type moves deal 1.35x damage but have 5% recoil. | TEXTO |
| Radiance | +20% accuracy; Dark moves fail when user is present. | 1.2x accuracy. Dark moves fail when user is present. | TEXTO |
| Jaws of Carnage | Devours 1/2 of the foe when defeating it. | KOs heal 1/4 of max HP, 1/2 if using a biting move. | MECÂNICA provável |
| Shocking Jaws | Biting moves have 50% chance to paralyze the target. | Biting moves have a 50% chance to inflict paralysis. | TEXTO |
| Earth Eater | Heals 25% of max HP when hit by a Ground move. | Heals 25% of max HP when hit by a Ground-type move. | TEXTO |
| Purgatory | Boosts Ghost-type moves by 1.3x, or 1.8x when below 1/3 HP. | Boosts Ghost-type moves by 1.3x, or 1.8x when under 1/3 HP. | TEXTO |
| Super Hot Goo | Inflicts burn and lowers Speed on contact. | Flame Body + Gooey. | TEXTO |
| Nika | Iron fist + Water moves function normally under sun. | Iron Fist + Water moves function normally under sun. | TEXTO |
| Freezing Point | 20% chance to get frostbitten on contact and 30% non-contact. | 20% frostbite chance on contact, 30% chance on non-contact. | TEXTO |
| Cryo Proficiency | Freezing Point + triggers hail when hit. | Sets hail when hit + Freezing Point. | TEXTO |
| Yuki Onna | Scare + Intimidate. 30% chance to infatuate on hit. | Intimidate + Scare. 30% chance to infatuate on contact. | MECÂNICA provável |
| Mystic Blades | Keen edge moves become special and deal 30% more damage. | Keen Edge moves become special and deal 30% more damage. | TEXTO |
| Determination | Ups Special Attack by 50% if suffering. | Ups Special Attack by 50% if statused. | TEXTO |
| Fighter | Boosts Fight.-type moves by 1.2x, or 1.5x when below 1/3 HP. | Boosts Fight.-type moves by 1.2x, or 1.5x when under 1/3 HP. | TEXTO |
| Fortitude | Boosts SpDef +1 when hit. Maxes SpDef on crit. | Boosts Sp. Def +1 when hit. Critical hits maximize Sp. Def. | TEXTO |
| Early Grave | Ghost-type moves get +1 priority at max HP. | Ghost-type moves get +1 priority at full HP. | TEXTO |
| Flaming Jaws | Biting moves have 50% chance to burn the target. | Biting moves have a 50% chance to inflict burn. | TEXTO |
| Berserk DNA | Sharply ups highest attacking stat but enrages on entry. | On entry, ups highest attacking stat by +2 but enrages. | TEXTO |
| Clap Trap | Counters contact with 50BP Snap Trap. | Uses 50BP Snap Trap when hit by contact. | TEXTO |
| Spike Armor | 30% chance to bleed on contact or offense. | 30% chance to bleed on contact. Also works on offense. | TEXTO |
| Chrome Coat | Reduces special damage taken by 40%, but decreases Speed by 10%. | Take 40% less spec. dmg, but Speed x0.9. Triple user's weight. | TEXTO |
| Purifying Salt | Immune to status conditions. Take 1/2 damage from Ghost. | Immune to status. Takes 1/2 damage from Ghost-type moves. | TEXTO |
| Guard Dog | Can't be forced out. Inverts Intimidate effects. | Can't be forced to switch out. Inverts Intimidate effects. | TEXTO |
| Stygian Rush | Dark-type moves get +1 priority at max HP. | Dark-type moves get +1 priority at full HP. | TEXTO |
| Tidal Rush | Water-type moves get +1 priority at max HP. | Water-type moves get +1 priority at full HP. | TEXTO |
| Mind Crunch | Biting moves use SpAtk and deal 30% more damage. | Biting moves use Special Attack and deal 30% more damage. | TEXTO |
| Sharp Edges | 1/6 HP damage when touched. | Enemies lose 1/6 of max HP if they hit user with contact move. | TEXTO |
| Lawnmower | Removes terrain on switch-in. Stat up if terrain removed. | Removes Terrain on switch-in, then ups Def or Sp. Def. | MECÂNICA provável |
| Toxic Chain | Moves have a 30% chance to badly poison the foe. | Attacks have a 30% chance to badly poison. | TEXTO |
| Poison Puppeteer | Poison also inflicts confusion. | Inflicting poison also inflicts confusion. | TEXTO |
| Low Visibility | Summons Eerie Fog on entry. | Summons fog on entry. Lasts 8 turns. | MECÂNICA provável |
| Pretty Privilege | At full HP, gives +1 priority to its Fairy-type moves. | Fairy-type moves get +1 priority at full HP. | TEXTO |
| Ice Downfall | Counters contact with 60BP Icicle Crash. | Uses 60BP Icicle Crash when hit by contact. | TEXTO |
| Ultra Instinct | Counters contact with 20BP Vacuum Wave. Takes .8x damage. | Uses 20BP Vacuum Wave when hit by contact. Takes .8x damage. | TEXTO |
| Higher Rank | Priority moves get a 1.2x boost. | Boosts the power of priority moves by 1.2x. | TEXTO |
| Petrify | Clears stat buffs then lowers speed by one stage on entry. | Clears stat buffs then lowers foes' Speed one stage on entry. | TEXTO |
| Fluffiest | Quarters contact damage taken. 4x weak to fire. | Quarters contact damage taken. 4x weak to Fire-type moves. | TEXTO |
| Atomic Punch | Iron Fist + 30% Steel type damage. | Iron Fist + boosts the power of Steel-type moves by 1.3x. | TEXTO |
| Rage Point | Gets a 1.5x boost while statused. Raises offenses when crit. | Deals 1.5x damage while statused. Raises offenses when crit. | TEXTO |
| Shocking Maw | Strong Jaw + Bite moves have 50% paralysis chance. | Strong Jaw + Shocking Jaws. | TEXTO |
| Lucky Halo | Negates self stat drops. Endures the a single KO. | Negates self stat drops. Endures a single KO. | TEXTO |
| Know Your Place | Contact attacks make foes move last for 5 turns. | Contact moves make target move last for 5 turns. | TEXTO |
| Magical Fists | Punching moves use Special Attack and get a 1.3x boost. | Punching moves use Special Attack and deal 30% more damage. | TEXTO |
| Cutthroat | The first slicing move used on each entry in gets +1 priority. | First Keen Edge move each entry gets +1 priority. | TEXTO |
| Twinkle Toes | Boosts the power of kicking moves by 1.3x + Pixilate. | Striker + Pixilate. | TEXTO |
| Deep Freeze | Boosts Water and Ice by 1.25x. Halves Fire damage taken. | Boosts Water and Ice moves by 1.25x. Halves Fire damage taken. | TEXTO |
| JunshiSanda | Punches and Kicks are both Punches and Kicks. | Punching moves also become Kicking moves and vice versa. | TEXTO |
| Gladiator | Boosts Fighting-type moves by 1.3x, or 1.8x when below 1/3 HP. | Boosts Fighting-type moves by 1.3x, or 1.8x when under 1/3 HP. | TEXTO |
| Corrupted Mind | Psychic moves ignore resists and get 1.4x effect chance. | Psychic moves ignore resists / immunities, x1.4 effect chance. | TEXTO |
| Cryo Architect | Boosts Attack and Def when hit by Water or Ice. | +1 Atk when hit by Water, +1 Def next turn. Ice +1 both turn 1. | TEXTO |
| Glacial Rage | Triggers 50 BP Blizzard after using a Ice-type move. | Triggers 50 BP Blizzard after using an Ice-type move. | TEXTO |
| Embody Aspect | +1 Spdef on Entry. | On entry, raises Special Defense by one stage. | TEXTO |
| We Will Rock You | Boosts Rock-type moves by 1.3x, or 1.8x when below 1/3 HP. | Boosts Rock-type moves by 1.3x, or 1.8x when under 1/3 HP. | TEXTO |
| Headstrong | +1 Spdef on entry. | On entry, raises Special Defense by one stage. | TEXTO |
| Blur | Uses Speed as defense stat when hit by contact. | Uses Speed as defensive stat when hit by contact. | TEXTO |
| Elude | Uses Speed as defense stat when hit by non-contact. | Uses Speed as defensive stat when hit by non-contact. | TEXTO |
| Madness Enhancement | Enrages in fog, halves damage when enraged. | Enrages in fog, reduces damage taken by 20% when enraged. | MECÂNICA |
| Serpent Bind | 50% chance to trap, then drop the their speed by -1 each turn. | 50% chance to trap. Lowers Speed of trapped foes -1 each turn. | TEXTO |
| Scarecrow | Scare + Bad Luck. | Scare + Cotton Down. | MECÂNICA |
| Chilling Presence | 10BP Icy Wind on entry. | Attacks with 10BP Icy Wind on switch-in. | TEXTO |
| Hemotoxin | Supresses abilities of the target when they're poisoned. | Suppresses abilities of the target when they're poisoned. | TEXTO |
| Toxic Surge | sets Toxic Terrain on entry. | Casts Toxic Terrain on entry. Lasts 8 turns. | MECÂNICA provável |
| Biofilm | 50% spdef boost under Toxic Terrain. | Boosts Special Defense by 50% in Toxic Terrain. | TEXTO |
| Chokehold | Binding moves lower speed and paralyze. | Trapping moves paralyze and lower speed by -1 each turn. | TEXTO |
| Festivities | Sound moves become dance moves and vice versa. | Sound moves also become Dance moves and vice versa. | TEXTO |
| Fey Flight | Adds Fairy-type and levitates. | Fairy Tale + Levitate. | TEXTO |
| Best Offense | Mystic blades + use 20% of spdef during moves. | Keen Edge moves are special and use +20% Sp. Def. | TEXTO |
| Impaler | Mighty Horn + 30% Bleed chance on horn moves. | Mighty Horn + horn moves have a 30% chance to bleed. | TEXTO |
| Magus Blades | Dual Wield + Best Offense. | Best Offense + Keen Edge moves hit twice for 60%. | MECÂNICA |
| Superheavy | Steadfast + blocks phasing moves. | Steadfast + can't be forced to switch out. | TEXTO |
| World Serpent | Long Reach + Grip Pincer. | Serpent Bind + Grip Pincer. | MECÂNICA |
| Komodo | Adds Dragon-type + moves have 30% Bad Poison chance. | Adds Dragon-type. Attacks have a 30% chance to badly poison. | TEXTO |
| Envenom | Moves have a 30% chance to poison the target. | Attacks have a 30% chance to poison. | TEXTO |
| Purple Haze | Triggers a 20BP Poison Gas after using a move. | Triggers a 20BP Poison Gas after using a damaging move. | TEXTO |
| Hyper Cleanse | Immune to status. Halves poison damage taken. | Immune to status. Takes 1/2 damage from Poison-type moves. | TEXTO |
| Chuckster | Once per entry, take 1/2 damage and force-switch the target. | Once per entry, halves contact dmg then forces attacker out. | MECÂNICA provável |
| Sludge Spit | follows up with 35BP Venom Bolt after using an attack. | Triggers a 35BP Venom Bolt after using a move. | TEXTO |
| Swamp Thing | Sets the Swamp Pledge effect on entry. | Summons the Swamp Pledge effect on entry. | TEXTO |
| Warmonger | Boosts the user's rock, steel, and fighting moves by 30%. | Boosts the user's Rock, Steel, and Fighting moves by 30%. | TEXTO |
| Soul Harvest | Fainted Pokemon increase your offenses and spdef by 5%. | Fainted Pokemon increase Atk, Sp. Atk, and Sp. Def by 5%. | TEXTO |
| Thick Blubber | Take 1/4 damage from fire and ice in return for having 1/2 speed. | Take 1/4 damage from Fire and Ice attacks. Speed is halved. | TEXTO |
| Deep Fried | Summons a sea of fire on entry. | Summons the Sea of Fire Pledge effect on entry. | TEXTO |
| Lunar Wrath | After using a Ghost move, follow up with a 50BP Moongeist Beam. | Triggers 50BP Moongeist Beam after using a Ghost-type move. | TEXTO |
| Power Leak | When hit, set up Electric Terrain. | Sets Electric Terrain when hit. | TEXTO |
| Strong Foundation | Takes 1/2 Water and Ground dmg and can't be forced out. | Take 1/2 dmg from Ground and Water moves. Can't be forced out. | TEXTO |
| Fog Machine | When hit, Set up Eerie Fog. | Sets fog when hit. | TEXTO |
| Drop Blocks | When hit, set up spikes. | Sets a layer of Spikes when hit by damaging moves. | TEXTO |
| Turf War | Destroys terrain and boosts highest stat on entry. | Removes Terrain on switch-in, then ups highest stat by +1. | TEXTO |
| Chainsaw | Keen edge attacks lower defense by -1. | Keen Edge moves lower defense by one stage. | TEXTO |
| Galeforce Wings | Flying moves get +1 Priority. | Flying-type moves get +1 priority. | TEXTO |
| Hammer Fist | Boosts punch and hammer moves by 25%. | Boosts the power of punching and hammer moves by 1.25x. | TEXTO |
| Devious Present | Boosts Ice and throwing moves by 50%. | Boosts the power of Ice-type and throwing moves by 50%. | TEXTO |
| Zen Garden | Sets up Grassy or Psychic Terrain at random. | Sets Grassy or Psychic Terrain on entry with respective seed. | TEXTO |
| Brain Overload | When hit, sets up Psychic Terrain. | Sets Psychic Terrain when hit. | TEXTO |
| Chestnut Axe | Keen edge + Grass moves become Keen Edge boosted. | Keen Edge + Grass moves become Keen Edge boosted. | TEXTO |
| Rain Shroud | Ups evasion by 30% in rain. | Evasion is boosted by 1.3x in rain. | TEXTO |
| Angelic Wings | Prism Scales + Huge Wings. | Prism Scales + Imposing Wings. | TEXTO |
| Wrestle Showman | Flying Press gains +10BP and causes Taunt. | Flying Press gains +10BP and inflicts Taunt. | TEXTO |
| Fire's Wrath | Intimidate + Scare; 10% burn chance on non contact moves. | Intimidate + Scare; 10% chance to inflict burn on non contact. | TEXTO |
| Break it Down | After using an attack, follow up with a 20BP Rapid Spin. | Triggers 20BP Rapid Spin after using a damaging move. | TEXTO |
| Backflip | After using a Dance move, follow up with a 50BP Chip Away. | Triggers 50BP Chip Away after using a Dance move. | TEXTO |
| Overcast | Low Visibility + Sets Mist on entry. | Low Visibility + Frosty Presence. | TEXTO |
| Flower Necklace | This Pokémon's SpDef gets a 1.5x boost in Grassy Terrain. | Boosts Special Defense by 50% in Grassy Terrain. | TEXTO |
| Storm Cloud | Summon rain on entry for 8 turns. Gain Electric-type STAB. | Summon rain on entry. Lasts 8 turns. Gain Electric-type STAB. | TEXTO |
| Drakelp Head | Weakens first move taken and drops opponent's attack. | First hit taken deals 35% less damage, then lowers Atk by -1. | TEXTO |
| Thunder Clouds | After using a special move, launch a 35 BP Thunderbolt | Triggers 35BP Tunderbolt after using a special move. | TEXTO |
| Acid Reflux | Uses 20BP Acid when it takes damage. | Uses 20BP Acid when taking any damage. | TEXTO |
| Survivor Bias | Not very effective moves can't cause fainting. | Cannot be KOed by not very effective moves. | TEXTO |
| Feathercoat | Takes 10% less damage from attacks, 20% if resisted. | Takes 15% less damage from attacks, 30% if resisted. | MECÂNICA |
| Power Outage | Boosts first Electric attack by 2x then loses Electric type. | Boosts first Electric attack by 2x but user loses Electric-type. | TEXTO |
| Daredevil | +1 Atk after using recoil move. 1/2 recoil damage. | Ups Attack by +1 when using recoil move. Halves recoil dmg. | TEXTO |
| Petal Shield | Maxes Def on entry. -1 Def when hit. | Enters with +6 Defense, reduces Defense by -1 after each hit. | TEXTO |
| Ghost Pepper | Grass moves have a 30% to cause burn. | Grass moves have a 30% chance to burn. | TEXTO |
| Icicle Fist | Iron Fist + 30% chance to cause frostbite with punches. | Iron Fist + Punching moves have a 30% chance to frostbite. | TEXTO |
| Wind Chimes | Amplifier + attacks with 30 BP Hyper Voice when hit. | Amplifier + uses 30BP Hyper Voice when hit. | TEXTO |
| Aura Armor | Takes 35% reduced damage. | Takes 35% less damage from attacks. | TEXTO |
| Deflect | Counters with 20 BP Vacuum Wave when hit. Takes 20% less damage. | Uses 20 BP Vacuum Wave when hit. Takes 20% less damage. | TEXTO |
| Overwhelming Mind | Boosts Psychic-type moves by 1.3x, or 1.8x when below 1/3 HP. | Boosts Psychic-type moves by 1.3x, or 1.8x when under 1/3 HP. | TEXTO |
| King of the Jungle | Infiltrator + deals 1.5x more damage to Grass-types. | Grassy Surge + Infiltrator. | MECÂNICA |

## 4. Golpes

Novos: 0 · Removidos: 0 · Alterados: 37. **eff/arg: 0 alterações; flags: 1 (Ice Ball, Throw Based)**. Dos 37, 35 são MECÂNICA (poder, PP, chance, precisão, prioridade, tipo, flag) e 2 são TEXTO (os dois lDesc, abaixo). O config oficial (docs/pesquisa_2654_config.md §3A) mostra mais um golpe com efeito corrigido que a NextDex não mostra: **Incite** (efeito aplicado MOVE_EFFECT_DOUBLESLAP para MOVE_EFFECT_ENRAGE, 12/04/2026), MECÂNICA.

| Golpe | Mudanças (antes → depois) |
|---|---|
| Blizzard | **chance**: 30 → 20 |
| Growth | **types**: Normal → Grass |
| Fire Blast | **chance**: 30 → 20 |
| Mind Reader | **pp**: 10 → 5 |
| Protect | **pp**: 10 → 5 |
| Detect | **pp**: 10 → 5 |
| Camouflage | **pp**: 10 → 5 |
| Ice Ball | **flags**: Makes Contact,Bullet Move → Makes Contact,Bullet Move,Throw Based |
| Sky Uppercut | **lDesc**: The user attacks with an uppercut thrown skywards. Iron Fist boost. → Attacks with an uppercut. Super-effective on Flying-types. Iron Fist boost. |
| Muddy Water | **lDesc**: Ground-and Water-type at the same time. 30% chance to lower foe's accuracy. → Ground and Water-type at the same time. 30% chance to lower foe's accuracy. |
| Night Slash | **pp**: 15 → 20 |
| Gear Grind | **pwr**: 50 → 60 |
| King's Shield | **pp**: 10 → 5 |
| Baneful Bunker | **pp**: 10 → 5 |
| Spirit Shackle | **pwr**: 85 → 90 |
| Anchor Shot | **pwr**: 80 → 90 |
| Fire Lash | **pwr**: 80 → 90 |
| Purify | **pp**: 20 → 5 |
| Trop Kick | **pwr**: 75 → 85 |
| Beak Blast | **pwr**: 100 → 120<br>**pp**: 15 → 5 |
| Clangorous Soul | **acc**: 100 → 101 |
| Apple Acid | **pwr**: 80 → 90 |
| Grav Apple | **pwr**: 80 → 90 |
| Obstruct | **pp**: 10 → 5 |
| Astral Barrage | **pwr**: 120 → 110 |
| Stone Axe | **pwr**: 60 → 65 |
| Silk Trap | **pp**: 10 → 5 |
| Spin Out | **pp**: 5 → 10 |
| Make It Rain | **acc**: 100 → 95 |
| Hyper Drill | **pwr**: 100 → 120 |
| Blood Moon | **pwr**: 140 → 130 |
| Burning Bulwark | **pp**: 10 → 5 |
| Psyshield Bash | **pwr**: 70 → 90 |
| Tangling Husk | **pp**: 10 → 5 |
| Merculight | **pp**: 10 → 5 |
| Mountain Gale | **pwr**: 100 → 120 |
| Pocket Sand | **chance**: 0 → 10<br>**prio**: 0 → 1 |

Notas sobre os 37 (config oficial, MoveList.textproto 6a30b66 x 7285071):

- **Sky Uppercut** (lDesc "...uppercut thrown skywards" para "...Super-effective on Flying-types"): **TEXTO**. O efeito (super-efetivo contra Flying) já existia: effect EFFECT_SE_AGAINST_TYPE_HIT com argument TYPE_FLYING em 7be1617 e custom_behavior super_effective_vs TYPE_FLYING em 6a30b66; só a descrição passou a dizer (commit 24/06/2026). Poder, tipo, PP e precisão iguais.
- **Muddy Water** (lDesc "Ground-and Water-type" para "Ground and Water-type"): **TEXTO**, só um hífen.
- **Clangorous Soul** (precisão 100 para 101): provável sentinela de "não erra" (interpretação, sem confirmação em código). É o único golpe com precisão acima de 100; os que não erram não têm precisão no config. O golpe só atinge o próprio usuário, então o efeito prático é nulo; pode ser typo do commit de 27/04/2026 ("Updating the moves to Champion ways").
- **Blizzard e Pocket Sand já tinham o texto novo na beta; só o número mudou.** A description de Blizzard em 6a30b66 já dizia "20% frostbite chance" com chance 30 (agora 20), e a de Pocket Sand já dizia "10% acc. drop, +1 priority" sem chance nem prioridade (agora 10 e +1). O jogo passou a cumprir o que o texto já dizia.
- **Ice Ball** (flag Throw Based): MECÂNICA, passa a contar para habilidades de arremesso (Devious Present, por exemplo). **Stone Axe** 60 para 65: o commit de 25/07/2026 diz "not technician boosted", ou seja, a mudança tira o Technician.
- Origem dos 37: 30 no commit 9e54b3d (27/04), Blizzard, Fire Blast e Muddy Water em 8bb34e1 (12/04), Pocket Sand em e89a485 (30/04), Sky Uppercut em c018862 (24/06), Stone Axe em c3bf9ad (25/07), Ice Ball em 79538b5 (27/09).

## 5. Espécies

Novas: 17 · Removidas: 1.

### Novas

| Espécie | Tipos | Status base | Habilidades | Inatas |
|---|---|---|---|---|
| Asudem | Poison/Dark | 108/73/93/130/88/70 | Mind Crunch, Pattern Change, Neurotoxin | Merciless, Petrify, Coil Up |
| Duraludon Mega | Steel/Dragon | 70/155/135/110/75/90 | Mirror Armor, Light Metal, Draco Morale | Steelworker, Mega Launcher, Long Reach |
| Grimer Redux | Grass/Poison | 74/78/69/48/48/28 | Grass Pelt, Ambush, Tangling Hair | Lightning Born, Effect Spore, Volt Absorb |
| Muk Redux | Grass/Poison | 101/101/72/78/90/58 | Engulf, Biofilm, Merciless | Lightning Born, Static, Earth Eater |
| Moravine | Grass/Poison | 128/135/92/66/104/30 | Earth Eater, Grass Pelt, Rain Dish | Lightning Born, Effect Spore, Analytic |
| Phanpy Redux | Rock/Grass | 60/84/84/40/50/32 | Rockhard Will, Grass Pelt, Overcoat | Earthbound, Solid Rock, Natural Cure |
| Donphan Redux | Rock/Grass | 80/110/110/60/70/70 | Loose Rocks, Guardian Coat, Rock Head | Water Absorb, Solid Rock, Fertilize |
| Mastophan | Rock/Grass | 135/125/135/60/70/30 | Loose Rocks, Flourish, Overcoat | Aftershock, Solid Rock, Water Absorb |
| Volbeep | Flying/Electric | 78/90/65/57/105/105 | Technician, Pressure, Anticipation | Self Sufficient, Illuminate, Overcoat |
| Astrobeep | Flying/Electric | 98/100/70/70/132/70 | Impenetrable, Precise Fist, Aerilate | Technician, Searchlight, Thick Fat |
| Illumars | Flying/Psychic | 73/52/75/105/85/110 | Retriever, Dazzling, Power Spot | Shield Dust, Illuminate, Overcoat |
| Illuminaut | Flying/Psychic | 78/70/70/110/95/117 | Cosmic Daze, Dazzling, Shield Dust | Light Wield, Illuminate, Overcoat |
| Rufflet Redux | Flying/Ground | 53/33/70/80/64/50 | Flock, Dust Cloud, Blaze | Ignition, Feathercoat, Third-Degree Burn |
| Braviary Redux | Flying/Ground | 113/57/80/100/80/80 | Flame Body, Sand Stream, Pyromancy | Ignition, Feathercoat, Third-Degree Burn |
| Isoshrew | Bug/Water | 64/75/46/20/85/30 | Scavenger, Let's Roll, Damp | Spike Armor, Heatproof, Swarm |
| Isoslash | Bug/Water | 74/101/67/49/111/68 | Overcoat, Pressure, Fortitude | Spike Armor, Heatproof, Swarm |
| Noxislash | Bug/Water | 104/121/67/49/131/73 | Rain Dish, Pressure, Catastrophe | Spike Armor, Battle Armor, Thermal Dweller |

### Removidas
- Arbok Mega (SPECIES_ARBOK_MEGA)

### Mudanças de status, tipo, habilidades, inatas ou evolução

Movepool (só contagem): golpes por nível mudaram em 439 espécies; TM/HM em 0; tutor em 308; ovo em 0. Evolução mudou em 8.

| Espécie | Mudanças |
|---|---|
| Arbok | status HP 90→60, Atk 105→95, Def 84→69, SpD 84→79 (BST 508→448); evolução |
| Tentacool | habilidades [Liquid Ooze, Neuroforce, Water Veil]→[Liquid Ooze, Toxic Surge, Water Veil] |
| Electabuzz | status HP 60→65, Atk 100→83, SpA 83→100 (BST 490→495); habilidades [Power Fists, Short Circuit, Motor Drive]→[Magical Fists, Electro Surge, Motor Drive]; evolução |
| Magmar | habilidades [Pyromancy, Flaming Soul, Sun Basking]→[Drought, Flaming Soul, Sun Basking]; inatas [Molten Down, Flame Body, Flash Fire]→[Third-Degree Burn, Flame Body, Vital Spirit]; evolução |
| Octillery | inatas [Quick Draw, Breakwater, Predator]→[Artillery, Stall, Predator] |
| Donphan | status Atk 130→120, Def 130→120 (BST 520→500) |
| Elekid | evolução |
| Magby | evolução |
| Blaziken | habilidades [Mixed Martial Arts, Aerodynamics, Speed Boost]→[Defiant, Aerodynamics, Speed Boost] |
| Volbeat | tipos Bug/Electric→Bug |
| Roselia | status Atk 90→60, SpA 90→100, SpD 45→80 (BST 400→415); habilidades [Overgrow, Leaf Guard, Corrosion]→[Poison Absorb, Flourish, Merciless]; inatas [Natural Cure, Merciless, Poison Point]→[Natural Cure, Flower Veil, Rivalry] |
| Cacturne | status Spe 85→55 (BST 505→475) |
| Crawdaunt | habilidades [Swift Swim, Hyper Aggressive, Adaptability]→[Rain Shroud, Hyper Aggressive, Adaptability] |
| Cradily | habilidades [Absorbant, Regenerator, Storm Drain]→[Absorbent, Regenerator, Storm Drain] |
| Roserade | status HP 60→80, Atk 125→70, SpD 70→105 (BST 535→535); habilidades [Technician, Discipline, Corrosion]→[Flourish, Toxic Debris, Corrosion]; inatas [Natural Cure, Merciless, Aroma Veil]→[Natural Cure, Aroma Veil, Technician] |
| Chingling | inatas [Levitate, Magic Guard, Metallic]→[Levitate, Magic Guard, Clear Body] |
| Stunky | habilidades [Poison Point, Anticipation, Unnerve]→[Toxic Surge, Anticipation, Unnerve] |
| Chatot | inatas [Adaptability, Amplifier, Parroting]→[Adaptability, Flock, Parroting] |
| Finneon | evolução |
| Lumineon | evolução |
| Magmortar | habilidades [Nocturnal, Flaming Soul, Pyro Shells]→[Mountaineer, Flaming Soul, Pyro Shells] |
| Foongus | habilidades [Infiltrator, Mycelium Might, Adaptability]→[Rain Dish, Mycelium Might, Toxic Surge] |
| Virizion | inatas [Mighty Horn, Absorbant, Keen Edge]→[Mighty Horn, Absorbent, Keen Edge] |
| Talonflame | habilidades [Predator, Speed Force, Big Pecks]→[Predator, Speed Force, Violent Rush]; inatas [Flock, Violent Rush, Gale Wings]→[Flame Body, Big Pecks, Gale Wings] |
| Barbaracle | habilidades [Pickpocket, Swift Swim, Sand Force]→[Pickpocket, Spike Armor, Sand Force] |
| Toucannon | habilidades [Combustion, Super Luck, Sheer Force]→[Combustion, Super Luck, Feathercoat]; inatas [Flock, Keen Eye, Skill Link]→[Flock, Stall, Skill Link] |
| Lycanroc | habilidades [Speed Force, Adrenaline Rush, Violent Rush]→[Speed Force, Reckless, Violent Rush] |
| Salazzle | inatas [Corrosion, Queenly Majesty, Half Drake]→[Corrosion, Queenly Majesty, Draconize] |
| Pyukumuku | status Def 200→132, SpA 30→60, SpD 200→132 (BST 600→494) |
| Komala | status HP 65→85 (BST 490→510) |
| Duraludon | evolução |
| Arboliva | habilidades [Triage, Friend Guard, Absorbant]→[Triage, Friend Guard, Absorbent] |
| Toedscool | inatas [Stall, Absorbant, Mycelium Might]→[Stall, Absorbent, Mycelium Might] |
| Toedscruel | inatas [Stall, Absorbant, Mycelium Might]→[Stall, Absorbent, Mycelium Might] |
| Scovillain | inatas [Water Absorb, Multi-Headed, Pyromancy]→[Water Absorb, Multi-Headed, Ghost Pepper] |
| Espathra | habilidades [Speed Boost, Majestic Bird, Mystic Power]→[Speed Boost, Queenly Majesty, Mystic Power] |
| Annihilape | habilidades [Shallow Grave, Menacing Situation, Defiant]→[Shallow Grave, Phobia, Defiant] |
| Wo Chien | inatas [Tablets Of Ruin, Stall, Absorbant]→[Tablets Of Ruin, Stall, Absorbent] |
| Arachtres | status HP 100→128, Atk 130→128, SpA 60→56, SpD 80→71, Spe 100→93 (BST 550→556); habilidades [Spider Lair, Sniper, Exploit Weakness]→[Spider Lair, Jumpscare, Toxic Surge]; inatas [Terrify, Menacing Situation, Merciless]→[Terrify, Phobia, Unnerve] |
| Flairgrance | status Atk 72→61, Def 89→99, SpA 99→101, SpD 140→101, Spe 29→70 (BST 550→553); habilidades [Aroma Veil, Lingering Aroma, Fairy Aura]→[Dancer, Entrance, Purple Haze]; inatas [Soothing Aroma, Pixilate, Fragrant Daze]→[Corrosion, Feathercoat, Fragrant Daze] |
| Polartic | status HP 100→139, Atk 145→135, Def 90→92, SpA 45→47, SpD 80→77, Spe 90→60 (BST 550→550); tipos Ice/Fighting→Ice; habilidades [Guts, Quick Feet, Intimidate]→[Frozen Soul, Ice Body, Intimidate] |
| Boarlock | status HP 120→143, Atk 65→35, Def 65→75, SpA 110→111, SpD 130→132, Spe 60→54 (BST 550→550); habilidades [Headstrong, Gluttony, Magic Bounce]→[Entrance, Trickster, Magic Guard]; inatas [Power Core, Thick Fat, Fur Coat]→[Power Core, Thick Fat, Deviate] |
| Heliomodo | status Spe 120→119 (BST 531→530); inatas [Solar Power, Electrocytes, Shiny Lightning]→[Sun Basking, Electrocytes, Shiny Lightning] |
| Beefender | status HP 60→55, Atk 124→112, Def 60→95, SpA 78→40, SpD 60→80 (BST 494→494); tipos Bug/Flying→Bug/Fighting; habilidades [Beast Boost, Aerodynamics, Tag]→[Merciless, Aerodynamics, Dauntless Shield]; inatas [Pressure, Mighty Horn, Anger Point]→[Poison Touch, Mighty Horn, Neurotoxin] |
| Salazarus | status HP 85→117, Atk 104→111, Def 85→64, SpA 36→60, SpD 85→68, Spe 85→60 (BST 480→480); habilidades [Supreme Overlord, Big Pecks, Hustle]→[Neurotoxin, Greedy, Subdue]; inatas [Subdue, Half Drake, Moxie]→[Corrosion, Multiscale, Deviate] |
| Dredwood | status HP 111→91, Atk 130→132, Def 106→141, SpA 85→77, SpD 92→102, Spe 76→57 (BST 600→600); inatas [Lumberjack, Vengeful Spirit, Woodland Curse]→[Juggernaut, Vengeful Spirit, Cursed Body] |
| Phanfernal | tipos Fire/Grass→Ghost/Grass; inatas [Phantom, Flash Fire, Monster Mash]→[Ignition, Flash Fire, Monster Mash] |
| Bubbleo | status HP 72→63, Atk 85→69, Def 69→73, SpA 50→54, SpD 48→54, Spe 52→63 (BST 376→376); habilidades [Violent Rush, Accelerate, Scare]→[Nocturnal, Merciless, Stench]; inatas [Predator, Nocturnal, Moxie]→[Predator, Field Explorer, Poison Point] |
| Hydroar | status HP 100→106, Atk 125→129, Def 85→88, SpA 60→57, SpD 60→66, Spe 87→71 (BST 517→517); habilidades [Violent Rush, Accelerate, Terrify]→[Violent Rush, Accelerate, Moxie]; inatas [Predator, Nocturnal, Moxie]→[Predator, Nocturnal, Poison Point] |
| Granitun | status HP 110→111, Atk 100→81, Def 90→96, SpD 120→121, Spe 30→41 (BST 555→555); habilidades [Unaware, Looter, Friend Guard]→[Harvest, Grassy Surge, Unaware]; inatas [Apple Pie, Harvest, Thick Fat]→[Apple Cake, Sweet Veil, Thick Fat] |
| Fujiflap | status HP 80→92, Atk 125→121, SpA 85→81, SpD 60→73, Spe 120→103 (BST 555→555); habilidades [Hustle, Aerodynamics, Air Blower]→[Hustle, Immunity, Overwhelm]; inatas [Aerialist, Overwhelm, Corrosion]→[Sour Apple, Aerialist, Aerodynamics] |
| Crawdauntless | status HP 86→106, Atk 160→147, Def 105→147, SpA 75→55, SpD 77→65, Spe 65→48 (BST 568→568); habilidades [Swift Swim, Dauntless Shield, Adaptability]→[Sea Guardian, Dauntless Shield, Adaptability]; inatas [Hyper Cutter, Shell Armor, Grip Pincer]→[Rough Skin, Shell Armor, Bulletproof] |
| Morpekyll | status HP 87→97, Atk 121→104, SpD 85→74 (BST 554→536); habilidades [Gluttony, Unburden, Pickup]→[Gluttony, Looter, Pickup]; inatas [Two-Faced, Magic Bounce, Lightning Rod]→[Two-Faced, Overcoat, Short Circuit] |
| Cacjack | habilidades [Tipping Point, Prankster, Soul Tap]→[Shadow Shield, Prankster, Soul Tap]; inatas [Ominous Shroud, Nocturnal, Scarecrow]→[Phantom, Nocturnal, Scarecrow] |
| Krampird | habilidades [Snow Cloak, Slush Rush, Power Spot]→[Snow Cloak, Christmas Nightmare, Power Spot]; inatas [Devious Present, Christmas Nightmare, Deviate]→[Devious Present, Early Bird, Deviate] |
| Heracreus | status HP 75→94, Atk 100→109, Def 100→114, SpA 55→41, SpD 70→76, Spe 100→66 (BST 500→500); habilidades [Spike Armor, Serene Grace, Poison Point]→[Mighty Horn, Leaf Guard, Guardian Coat]; inatas [Half Drake, Mighty Horn, Rough Skin]→[Dragonfruit, Spike Armor, Serene Grace] |
| Iron Spirals | habilidades [Energy Horns, Earth Eater, Power Core]→[Impenetrable, Earth Eater, Power Core]; inatas [Quark Drive, Impenetrable, Laser Drill]→[Quark Drive, Energy Horns, Laser Drill] |
| Kangaskhan Mega | inatas [Parental Bond, Scrappy, Avenger]→[Familia Bond, Scrappy, Stalwart] |
| Tyranitar Mega | habilidades [Sheer Force, Fort Knox, Sand Stream]→[Sheer Force, Fort Knox, Violent Rush]; inatas [Juggernaut, Battle Armor, Power Core]→[Sand Titan, Primal Armor, Hyper Aggressive] |
| Manectric Mega | habilidades [Generator, Volt Rush, Blur]→[Generator, Thunder Clouds, Megabite]; inatas [Intimidate, Ground Shock, Overcharge]→[Blur, Overclock, Static] |
| Exeggutor Alolan | habilidades [Sun Basking, Super Slammer, Gluttony]→[Sun Worship, Super Slammer, Gluttony] |
| Gourgeist Small | habilidades [Flare Boost, Harvest, Moody]→[Flare Boost, Harvest, Frisk]; inatas [Insomnia, Cursed Body, Haunted Spirit]→[Scare, Pickup, Monster Mash] |
| Gourgeist Large | habilidades [Flare Boost, Harvest, Moody]→[Flare Boost, Harvest, Frisk]; inatas [Insomnia, Cursed Body, Haunted Spirit]→[Scare, Pickup, Monster Mash] |
| Gourgeist Super | habilidades [Flare Boost, Harvest, Moody]→[Flare Boost, Harvest, Frisk]; inatas [Insomnia, Cursed Body, Haunted Spirit]→[Scare, Pickup, Monster Mash] |
| Cramorant Gorging | inatas [Gulp Missile, Transistor, Field Explorer]→[Gulp Missile, Generator, Field Explorer] |
| Morpeko Hangry | status HP 67→58, Atk 101→95, Def 87→58, SpA 58→70, SpD 57→58, Spe 101→97 (BST 471→436) |
| Polartic Bluemoon | status HP 130→143, Atk 145→44, Def 70→79, SpA 50→143, SpD 105→101, Spe 55→45 (BST 555→555); tipos Ice/Fighting→Ice; habilidades [Sheer Force, Predator, Fearmonger]→[Battle Armor, Whiteout, Predator]; inatas [Equinox, Ice Downfall, Last Stand]→[Thick Fat, Cold Rebound, Last Stand] |
| Hydroar F | status HP 100→106, Atk 125→129, Def 85→88, SpA 60→57, SpD 60→66, Spe 87→71 (BST 517→517); habilidades [Violent Rush, Accelerate, Terrify]→[Violent Rush, Accelerate, Moxie]; inatas [Predator, Nocturnal, Moxie]→[Predator, Nocturnal, Poison Point] |
| Morpekyll Hangry | habilidades [Gluttony, Unburden, Menacing Situation]→[Gluttony, Greedy, Bad Omen]; inatas [Two-Faced, Magic Bounce, Lightning Rod]→[Two-Faced, Overcoat, Foul Energy] |
| Clefable Mega Y | inatas [Pollinate, Giant Wings, Magic Guard]→[Butterfly Wings, Powder Burst, Magic Bounce] |
| Chandelure Mega Y | inatas [Levitate, Ethereal Rush, Radiance]→[Levitate, Infiltrator, Radiance] |
| Starmie Mega | inatas [Break it Down, Blur, Mystic Power]→[Break it Down, Own Tempo, Mystic Power] |
| Meowstic Mega | habilidades [Prankster, Sheer Force, Hyper Aggressive]→[Prankster, Trace, Hyper Aggressive] |
| Crabominable Mega | habilidades [Pressure, Icicle Fist, Hyper Aggressive]→[Pressure, Abominable Monster, Hyper Aggressive]; inatas [Abominable Monster, Anger Point, Arctic Fur]→[Icicle Fist, Anger Point, Arctic Fur] |
| Scovillain Mega | habilidades [Flaming Jaws, Sun Basking, Big Leaves]→[Unnerve, Sun Basking, Rite Of Spring]; inatas [Mob Boss, Multi-Headed, Ghost Pepper]→[Mob Boss, Multi-Headed, Spicy Spray] |
| Machamp Mega | habilidades [Raging Boxer, Adrenaline Rush, Sheer Force]→[Raging Boxer, Adrenaline Rush, Battle Aura] |
| Empoleon Mega | status Atk 80→81, Def 118→111, SpD 121→134, Spe 96→89 (BST 635→635); habilidades [No Guard, Competitive, Impenetrable]→[Aurora Borealis, Competitive, Impenetrable] |
| Toucannon Mega | status Atk 120→130, Spe 70→60 (BST 625→625); habilidades [Sturdy, Filter, Sheer Force]→[Combustion, Aerialist, Steel Barrel]; inatas [Steel Barrel, Iron Barrage, Pyro Shells]→[Stall, Iron Barrage, Pyro Shells] |
| Meganium Mega | habilidades [Grassy Surge, Grassy Surge, Grassy Surge]→[Mega Sol, Mega Sol, Mega Sol] |
| Magnezone Mega | status Atk 75→89, Def 135→137, SpA 165→139, SpD 125→119, Spe 65→81 (BST 635→635); habilidades [Electric Burst, Overcharge, Steelworker]→[Steel Barrel, Backup Power, Magnet Pull]; inatas [Electro Surge, Multi-Headed, Magnet Pull]→[Electro Surge, Multi-Headed, Short Circuit] |
| Machamp Mega Redux | status HP 70→127, Atk 130→30, Def 140→127, SpA 65→148, SpD 145→102, Spe 55→71 (BST 605→605); habilidades [Raging Boxer, Multiscale, Dragonslayer]→[Rough Skin, Vital Spirit, Warmonger]; inatas [Brawling Wyvern, Stamina, Power Core]→[Brawling Wyvern, Magical Fists, Unnerve] |
| Skarmory Mega | habilidades [Molten Blades, Molten Down, Momentum]→[Levitate, Full Metal Body, Momentum]; inatas [Levitate, Flame Body, Speed Force]→[Molten Blades, Flame Body, Speed Force] |
| Gengar Mega X | inatas [Jumpscare, Jaws of Carnage, Menacing Situation]→[Jumpscare, Jaws of Carnage, Phobia] |
| Snorlax Mega | habilidades [Raw Wood, Flourish, Comatose]→[Craving, Flourish, Comatose] |
| Cinderace Mega | habilidades [Deadeye, Turboblaze, Defiant]→[Victory Star, Turboblaze, Defiant] |
| Copperajah Mega | habilidades [Stall, Sap Sipper, Growing Tooth]→[Stall, Steely Spirit, Growing Tooth]; inatas [Steely Spirit, Juggernaut, Battle Armor]→[Heavy Metal, Juggernaut, Battle Armor] |
| Serperior Mega | status Atk 87→59, Def 125→127, SpA 90→98, SpD 125→127, Spe 125→141 (BST 635→635); tipos Grass/Dragon→Grass; habilidades [Scare, Dragon's Maw, Contrary]→[Jungle's Guard, Multiscale, Egoist]; inatas [Forest Rage, Royal Decree, Multiscale]→[Forest Rage, Royal Decree, Terminal Velocity] |
| Roserade Mega | status HP 60→80, Atk 145→83, Def 70→99, SpD 90→101, Spe 125→127 (BST 635→635); habilidades [Technician, Rose Garden, Corrosion]→[Equinox, Grass Pelt, Chloroplast]; inatas [Equinox, Merciless, Long Reach]→[Rose Garden, Technician, Infiltrator] |
| Arcanine Hisuian Mega | status Atk 140→148, Def 110→136, SpA 110→72, SpD 110→112, Spe 140→142 (BST 700→700); habilidades [Tough Claws, Tough Claws, Tough Claws]→[Guardian Coat, Intimidate, Magic Bounce]; inatas [Rock Head, Molten Coat, Reckless]→[Brute Force, Molten Coat, Guard Dog] |
| Moltres Ex | status Def 90→100, SpD 85→95 (BST 580→600) |
| Frostuccino | inatas [Arctic Fur, Tangling Hair, Frosty Prescence]→[Arctic Fur, Tangling Hair, Frosty Presence] |
| Cetitan Redux | habilidades [Keen Edge, Lumberjack, Deep Cuts]→[Keen Edge, Lumberjack, Blood Price]; inatas [Monster Hunter, Blood Price, Chainsaw]→[Monster Hunter, Deep Cuts, Chainsaw] |
| Grotom Drum | inatas [Water Absorb, Lead Coat, Gooey]→[Water Absorb, Lead Coat, Slime Mold] |
| Heracreus Mega | status HP 75→94, Atk 120→124, Def 130→136, SpA 75→64, SpD 110→116, Spe 90→66 (BST 600→600); habilidades [Venom Crown, Dual Wield, Grass Pelt]→[Poison Absorb, Chloroplast, Grass Pelt]; inatas [Dragonfruit, Equinox, Spike Armor]→[Dragonfruit, Equinox, Crimson Crown] |
| Dragapult Mega | habilidades [Blur, Speed Boost, Elude]→[Amphibious, Aerodynamics, Tactical Retreat] |
| Sandslash Alolan Mega | status Atk 125→124, Def 135→136, SpD 75→76, Spe 85→84 (BST 570→570) |
| Scyther Mega | habilidades [Aerilate, Mystic Blades, Quick Draw]→[Aerilate, Mystic Blades, Aerodynamics] |
| Hydreigon Mega | status Atk 115→114, SpA 165→166, SpD 90→91, Spe 115→114 (BST 700→700); habilidades [Wings of Pestilence, Wings of Pestilence, Wings of Pestilence]→[Malediction, Malediction, Malediction] |
| Pentadug Alolan | status Def 90→80, SpA 55→65 (BST 525→525) |
| Victreebel Redux | inatas [Sap Trap, Bad Luck, Dead Bark]→[Sap Trap, Bad Omen, Dead Bark] |
| Sneasler Mega | status Def 70→90, SpD 120→100 (BST 610→610); habilidades [Weak Armor, Merciless, Sheer Force]→[Adrenaline Rush, Merciless, Solid Rock]; inatas [Lead Claws, Rocky Exterior, Mountaineer]→[Lead Claws, Rocky Exterior, Overcoat] |
| Exeggutor Redux | status SpA 130→120, Spe 30→40 (BST 530→530) |
| Machop Redux | status HP 50→87, Atk 70→67, Def 70→47, SpD 65→43, Spe 35→46 (BST 305→305); habilidades [Overwhelm, Rough Skin, Juggernaut]→[Overwhelm, Marvel Scale, Defiant]; inatas [No Guard, Iron Fist, Guts]→[Rough Skin, Rivalry, Scrappy] |
| Machoke Redux | status HP 60→106, Atk 80→84, Def 100→67, SpD 90→67, Spe 45→51 (BST 405→405); habilidades [Overwhelm, Rough Skin, Juggernaut]→[Overwhelm, Marvel Scale, Unnerve]; inatas [No Guard, Iron Fist, Guts]→[Rough Skin, Thick Skin, Juggernaut] |
| Machamp Redux | status HP 70→127, Atk 110→128, Def 110→92, SpA 45→30, SpD 115→77, Spe 55→51 (BST 505→505); habilidades [Overwhelm, Multiscale, Juggernaut]→[Regenerator, Marvel Scale, Impenetrable]; inatas [Impenetrable, Iron Fist, Guts]→[Unnerve, Rough Skin, Juggernaut] |
| Mawile Redux | habilidades [Adaptability, Dazzling, Scare]→[Adaptability, Dazzling, Nosferatu]; inatas [Strong Jaw, Opportunist, Fae Hunter]→[Strong Jaw, Opportunist, Jaws of Carnage] |
| Iron Exo | tipos Ghost/Electric→Ghost/Bug; habilidades [Teravolt, Dual Wield, Volt Rush]→[Artillery, Dual Wield, Volt Rush]; inatas [Quark Drive, Exploit Weakness, Artillery]→[Quark Drive, Exploit Weakness, Teravolt] |
| Crabrawler Redux | habilidades [Bulletproof, Merciless, Fighter]→[Hyper Aggressive, Merciless, Fighter]; inatas [Spike Armor, Hyper Aggressive, Shed Skin]→[Spike Armor, Bulletproof, Shed Skin] |
| Crabominable Redux | habilidades [Merciless, Grip Pincer, Raging Boxer]→[Merciless, Grip Pincer, Unnerve]; inatas [Spike Armor, Super Slammer, Shed Skin]→[Spike Armor, Hammer Fist, Shed Skin] |
| Luxray Redux Mega | inatas [King of the Jungle, Speed Force, Grassy Surge]→[King of the Jungle, Speed Force, Raw Wood] |
| Breezing | status HP 120→90 (BST 520→490) |
| Gardevoir Redux Mega | habilidades [Swift Swim, Marine Apex, Ambush]→[Swift Swim, Phobia, Ambush] |
| Snorlax Redux Mega | habilidades [Hyper Cleanse, Hyper Cleanse, Hyper Cleanse]→[Petroleum Jelly, Petroleum Jelly, Petroleum Jelly]; inatas [Gooey, Liquid Ooze, Liquified]→[Gooey, Liquid Ooze, Pickup] |

## 2. Rotas e locais de captura

Mapas com encontro: 161 → 161. Mapas novos: nenhum. Mapas que saíram: nenhum.
Taxas por slot: iguais. Mapas com Pokémon que entrou (+) ou saiu (−): 3.

| Mapa | Mudanças |
|---|---|
| Granite Cave 1F | +Isoshrew (land 12-14) |
| Mauville City | +Volbeep (land 5-5), +Illumars (land 5-5) |
| Route 106 | +Isoshrew (rock 30-35) |

**Centro de Adoção (fora do dump da NextDex; fonte: er-config SpeciesList.textproto e items/MegaStonesList.textproto)**

- Por espécie (campo adoption_center_badge): 66 espécies no dado beta (6a30b66, 28/03) e 69 em 7285071: **+3, nenhuma saiu**: Grimer Redux (insígnia 2), Phanpy Redux (1) e Rufflet Redux (2), que entram com as espécies novas. O campo nasceu em 14/03 (commit fcab1b4); em 7be1617 ele não existia.
- Por item (Mega Stones com adoption_center): **Arbokite sai** (27/04, cbdac78, "Arbok Mega Changed to Evo"; Arbok Mega some da §5 e Arbok passa a evoluir para Asudem no nível 55); **Duraludite entrou em 14/03** (2e29630), logo já estava no dado beta. Saldo A para B: -1 item.
- Presentes (mystery gifts) e encontros fixos: o er-config não tem arquivo nem campo para isso. Os outros campos de espécie que poderiam afetar captura (clima do randomizer, bp_cost, rare, tier, randomizer_banned) não mudaram, exceto randomizer_banned de Duraludon Partner Mega (liberado em 12/04).
- A comparação das 3 listas de mapa acima continua sendo só a da NextDex (3 mapas); a config não permite verificar Victory Road nem os mystery gifts de Meloetta, Silvally e Volcanion.

## 6. Treinadores e chefões

Total de treinadores: 895 → 895. Chefões/rivais/equipes com time normal alterado: 24. (Times insane/hell não detalhados aqui; ver diff_2654.md.)

| Treinador | 2.65beta | 2.65.4 |
|---|---|---|
| Brendan Route 103 Treecko | Torchic @Fire Gem, Goomy | Torchic @Fire Gem, Goomy |
| May Rustboro Treecko | Swellow @Choice Specs, Starmie @Water Gem, Tsareena @Choice Band, Combusken, Runerigus @Leftovers | Beautifly @Coba Berry, Munchlax @Ganlon Berry, Pikachu @Electric Gem, Sliggoo Hisuian @Leftovers, Combusken |
| May Rustboro Mudkip | Swellow @Choice Specs, Starmie @Water Gem, Rapidash @Life Orb, Grovyle @Life Orb, Runerigus @Leftovers | Beautifly @Coba Berry, Munchlax @Ganlon Berry, Pikachu @Electric Gem, Sliggoo Hisuian @Leftovers, Grovyle @Focus Sash |
| May Rustboro Torchic | Swellow @Choice Specs, Tsareena @Choice Band, Rapidash @Life Orb, Marshtomp, Runerigus @Leftovers | Beautifly @Coba Berry, Munchlax @Ganlon Berry, Pikachu @Electric Gem, Sliggoo Hisuian @Leftovers, Marshtomp @Shell Bell |
| Brendan Rustboro Treecko | Swellow @Choice Specs, Araquanid @Assault Vest, Breloom @Toxic Orb, Combusken, Runerigus @Leftovers | Dustox @Occa Berry, Munchlax @Ganlon Berry, Pikachu @Electric Gem, Sliggoo @Leftovers, Combusken |
| Brendan Rustboro Mudkip | Swellow @Choice Specs, Araquanid @Assault Vest, Arcanine @Rocky Helmet, Grovyle @Life Orb, Runerigus @Leftovers | Dustox @Occa Berry, Munchlax @Ganlon Berry, Pikachu @Electric Gem, Sliggoo @Leftovers, Grovyle @Focus Sash |
| Brendan Rustboro Torchic | Swellow @Choice Specs, Arcanine @Rocky Helmet, Breloom @Toxic Orb, Marshtomp, Runerigus @Leftovers | Dustox @Occa Berry, Munchlax @Ganlon Berry, Pikachu @Electric Gem, Sliggoo @Leftovers, Marshtomp @Shell Bell |
| May Route 110 Treecko | Swellow @Choice Specs, Starmie @Life Orb, Tsareena @Grass Gem, Mimikyu @Life Orb, Blaziken @Choice Band, Vikavolt @Focus Sash | Cyclizar @Sitrus Berry, Rabsca @Shell Bell, Pikachu Pop Star @Life Orb, Sliggoo Hisuian, Blaziken @Fire Gem |
| May Route 110 Mudkip | Swellow @Choice Specs, Starmie @Life Orb, Rapidash @Choice Scarf, Mimikyu @Life Orb, Sceptile @Sitrus Berry, Vikavolt @Focus Sash | Cyclizar @Sitrus Berry, Rabsca @Shell Bell, Pikachu Pop Star @Life Orb, Sliggoo Hisuian, Sceptile @Focus Sash |
| May Route 110 Torchic | Swellow @Choice Specs, Tsareena @Grass Gem, Rapidash @Choice Scarf, Mimikyu @Life Orb, Swampert @Leftovers, Vikavolt @Focus Sash | Cyclizar @Sitrus Berry, Rabsca @Shell Bell, Pikachu Pop Star @Life Orb, Sliggoo Hisuian, Swampert @Assault Vest |
| Brendan Route 110 Treecko | Swellow @Choice Specs, Araquanid @Splash Plate, Breloom @Focus Sash, Mimikyu @Life Orb, Blaziken @Choice Band, Vikavolt @Focus Sash | Cyclizar @Sitrus Berry, Rabsca @Shell Bell, Pikachu Rock Star @Life Orb, Sliggoo, Blaziken @Fire Gem |
| Brendan Route 110 Mudkip | Swellow @Choice Specs, Araquanid @Splash Plate, Arcanine @Assault Vest, Mimikyu @Life Orb, Sceptile @Sitrus Berry, Vikavolt @Focus Sash | Cyclizar @Sitrus Berry, Rabsca @Shell Bell, Pikachu Rock Star @Life Orb, Sliggoo, Sceptile @Focus Sash |
| Brendan Route 110 Torchic | Swellow @Choice Specs, Arcanine @Assault Vest, Breloom @Focus Sash, Mimikyu @Life Orb, Swampert @Leftovers, Vikavolt @Focus Sash | Cyclizar @Sitrus Berry, Rabsca @Shell Bell, Pikachu Rock Star @Life Orb, Sliggoo, Swampert @Assault Vest |
| Tabitha Mt Chimney | Whimsicott @Leftovers, Coalossal @Absorb Bulb, Talonflame @Heavy-Duty Boots, Sagaracas @Miracle Seed, Gliscor Redux @Loaded Dice, Steelix @Muscle Band | Whimsicott @Leftovers, Coalossal @Absorb Bulb, Talonflame @Heavy-Duty Boots, Sagaracas @Miracle Seed, Gliscor Redux @Loaded Dice, Steelix @Muscle Band |
| Matt Mt Pyre | Barbaracle @White Herb, Carnivine @Life Orb, Machamp Redux @Shell Bell, Muk Alolan @Assault Vest, Gyaradeath @Life Orb, Blastoise @Blastoisinite X | Barbaracle @White Herb, Carnivine @Life Orb, Machamp Redux @Shell Bell, Muk Alolan @Assault Vest, Gyaradeath @Life Orb, Blastoise @Blastoisinite X |
| Matt | Blastoise @Wise Glasses, Carnivine @Life Orb, Machamp Redux @Shell Bell, Muk Alolan @Assault Vest, Corviknight @Life Orb, Barbaracle @Choice Band | Blastoise @Wise Glasses, Carnivine @Life Orb, Machamp Redux @Shell Bell, Muk Alolan @Assault Vest, Corviknight @Life Orb, Barbaracle @Barbaracite |
| Drake | Walking Wake @Choice Specs, Fujiflap @Yache Berry, Regidrago @Dragon Fang, Kyurem Black @Heavy-Duty Boots, Archaludon @Power Herb, Machamp Redux @Machampite R | Walking Wake @Choice Specs, Fujiflap @Yache Berry, Regidrago @Dragon Fang, Kyurem Black @Heavy-Duty Boots, Archaludon @Power Herb, Machamp Redux @Machampite R |
| May Treecko Meteor Falls | Pikachu Pop Star @Light Ball, Sliggoo Hisuian @Leftovers, Sceptile @Miracle Seed | Pikachu Pop Star @Light Ball, Sliggoo Hisuian @Leftovers, Sceptile @Miracle Seed |
| Brendan Treecko Meteor Falls | Pikachu Rock Star @Light Ball, Sliggoo @Toxic Orb, Sceptile @Miracle Seed | Pikachu Rock Star @Light Ball, Sliggoo @Toxic Orb, Sceptile @Miracle Seed |
| Norman 1 | Tauros @Swirly Glasses, Sawsbuck @Loaded Dice, Talonflame @Protective Pads, Porygon-Z @Choice Scarf, Azumarill @Cell Battery, Banette @Banettite | Tauros @Swirly Glasses, Sawsbuck @Loaded Dice, Talonflame @Protective Pads, Porygon-Z @Choice Scarf, Azumarill @Cell Battery, Banette @Banettite |
| Wally Vr 1 | Tyranitar Redux @Shuca Berry, Shaymin @Apicot Berry, Magnezone @Tactical Vest, Garchomp @Life Orb, Polartic Bluemoon @Tactical Vest, Gallade @Galladite | Tyranitar Redux @Shuca Berry, Shaymin @Apicot Berry, Magnezone @Tactical Vest, Garchomp @Life Orb, Polartic Bluemoon @Tactical Vest, Gallade @Galladite |
| Wally Vr 2 | Garchomp @Rock Gem, Magnezone @Air Balloon, Azumarill @Salac Berry, Roserade @Focus Sash, Talonflame @Choice Band, Gallade @Galladite | Garchomp @Rock Gem, Magnezone @Air Balloon, Azumarill @Salac Berry, Roserade @Focus Sash, Talonflame @Choice Band, Gallade @Galladite |
| Wally Vr 3 | Garchomp @Focus Sash, Magnezone @Choice Specs, Azumarill @Sitrus Berry, Roserade @Rocky Helmet, Talonflame @Heavy-Duty Boots, Gallade @Galladite | Garchomp @Focus Sash, Magnezone @Choice Specs, Azumarill @Sitrus Berry, Roserade @Rocky Helmet, Talonflame @Heavy-Duty Boots, Gallade @Galladite |
| Wally Vr 4 | Garchomp @Garchompite, Magnezone @Custap Berry, Azumarill @Assault Vest, Roserade @Wide Lens, Talonflame @Choice Band, Gallade @Psychic Gem | Garchomp @Garchompite, Magnezone @Custap Berry, Azumarill @Assault Vest, Roserade @Wide Lens, Talonflame @Choice Band, Gallade @Psychic Gem |
