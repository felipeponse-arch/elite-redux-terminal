// Ticket 07 da dívida técnica (08/10/2026), 1ª metade: o duelo testado pela entrada pública.
// Cada cenário monta espécie, habilidade, golpe e item REAIS (build do jogador + Pokémon do chefão)
// e confere o veredito da luta (R.resultadoDoDuelo): quem vence, quanto do HP sobra, quantos turnos.
// Nenhum cenário toca em ef, stats ou golpesProntos, então uma refatoração interna do motor não
// quebra nada aqui; só mudança de comportamento quebra. As fórmulas puras ficam nos testes internos.
// Medidas (cenarios_do_duelo.mjs): "causado" = fração do HP do chefão que o jogador tirou (luta que
// ele perde); "sofrido" = fração do HP dele que o chefão tirou (luta que ele vence).
import { test } from "node:test";
import assert from "node:assert/strict";
import { R, NIVEL, EV, eu, chefao, lutar, causado, sofrido, razao, dentroDoEfeito, semEfeito } from "./cenarios_do_duelo.mjs";

// Chefões usados de parede ou de algoz, sempre com a mesma configuração.
const snorlax = (o = {}) => chefao("Snorlax", { hab: "Thick Fat", golpes: ["Body Slam"], evs: [252, 252, 4, 0, 0, 0], nat: "Adamant", ...o });
const machamp = (golpes = ["Knock Off"], o = {}) => chefao("Machamp", { hab: "No Guard", golpes, evs: EV.fisico, nat: "Adamant", ...o });
const alakazam = (golpes = ["Psychic"], o = {}) => chefao("Alakazam", { hab: "Magic Guard", golpes, evs: EV.especial, nat: "Modest", ...o });
const garchomp = (golpes = ["Outrage"], o = {}) => chefao("Garchomp", { hab: "Rough Skin", golpes, evs: EV.fisico, nat: "Jolly", ...o });
// Algoz sem cura passiva: derruba o atacante de 1 golpe depois do dele, então a razão entre duas lutas é o multiplicador puro.
const rhyperior = (o = {}) => chefao("Rhyperior", { hab: "Solid Rock", golpes: ["Rock Slide"], evs: [252, 252, 4, 0, 0, 0], nat: "Adamant", ...o });
const skarmory = (golpes = ["Iron Head"]) => chefao("Skarmory", { hab: "Mirror Armor", golpes, evs: [252, 0, 252, 0, 0, 0] });

// ---------- tipo e imunidade ----------
test("imunidade de tipo: Earthquake não toca em quem voa nem em quem flutua, e Thousand Arrows toca no Flying", () => {
  const voador = lutar(eu("Garchomp", { golpes: ["Earthquake"] }), chefao("Skarmory", { hab: "Mirror Armor", golpes: ["Flash Cannon"] }));
  assert.equal(voador.fracFoe, 1, "Earthquake em Flying: nenhum dano");
  const levitate = lutar(eu("Garchomp", { golpes: ["Earthquake"] }), chefao("Gengar", { hab: "Scare", golpes: ["Shadow Ball"], evs: EV.especial })); // Levitate de innate
  assert.equal(levitate.fracFoe, 1, "Earthquake em Levitate: nenhum dano");
  const normal = lutar(eu("Garchomp", { golpes: ["Earthquake"] }), snorlax());
  assert.ok(normal.fracFoe < 1, "controle: Earthquake machuca quem está no chão");
  const flechas = lutar(eu("Zygarde", { golpes: ["Thousand Arrows"] }), chefao("Skarmory", { hab: "Mirror Armor", golpes: ["Flash Cannon"] }));
  assert.ok(flechas.fracFoe < 1, "Thousand Arrows acerta o Flying; fracFoe=" + flechas.fracFoe);
});

test("Freeze-Dry é super efetivo em Water: ~2,7x o Ice Beam no Water, ~0,8x (só a diferença de poder) fora dele", () => {
  // Medido: 70/90 de poder x (2 / 0,5) de efetividade = 3,1; o Ice Beam ainda tem a chance de congelar, então a luta mede ~2,7.
  const blastoise = () => chefao("Blastoise", { hab: "Torrent", golpes: ["Hydro Pump"], evs: EV.especial, nat: "Modest" });
  const luta = (golpe, alvo) => lutar(eu("Weavile", { golpes: [golpe], evs: EV.especial, nat: "Modest" }), alvo());
  dentroDoEfeito(razao(luta("Freeze-Dry", blastoise), luta("Ice Beam", blastoise), causado), 2.7, "Freeze-Dry / Ice Beam em Water");
  // controle: em quem não é Water o Freeze-Dry não ganha o bônus e fica só com o poder menor (70 contra 90)
  dentroDoEfeito(razao(luta("Freeze-Dry", rhyperior), luta("Ice Beam", rhyperior), causado), 70 / 90, "Freeze-Dry / Ice Beam fora de Water");
});

test("Wonder Guard: só super efetivo passa; golpe neutro (Water em Bug/Ghost) não tira nada e a luta empata", () => {
  const shedinja = () => chefao("Shedinja", { hab: "Wonder Guard", golpes: ["Protect"] });
  const neutro = lutar(eu("Blastoise", { golpes: ["Surf"], evs: EV.tanqueF, nat: "Modest" }), shedinja());
  assert.equal(neutro.venceu, null, "sem dano possível a luta empata");
  assert.equal(neutro.fracFoe, 1);
  assert.equal(neutro.nota, 0.5, "empate vale metade");
  const fogo = lutar(eu("Charizard", { golpes: ["Flamethrower"], evs: EV.especial }), shedinja());
  assert.equal(fogo.venceu, true, "Fire é super efetivo no Bug/Ghost");
});

test("Seismic Toss tira o nível do usuário: não depende de EV, natureza nem Ataque; Ghost é imune", () => {
  const luta = (evs, nat) => lutar(eu("Blissey", { golpes: ["Seismic Toss"], evs, nat }), snorlax());
  const a = luta(EV.tanqueE, "Calm"), b = luta(EV.fisico, "Adamant");
  assert.equal(a.venceu, false);
  assert.equal(a.fracFoe, b.fracFoe, "o dano fixo não muda com EV ou natureza");
  assert.ok(a.fracFoe < 1 && a.fracFoe > 0.5, "tirou algo, mas pouco (50 de ~270 por golpe): " + a.fracFoe);
  const fantasma = lutar(eu("Blissey", { golpes: ["Seismic Toss"], evs: EV.tanqueE }), chefao("Gengar", { hab: "Scare", golpes: ["Shadow Ball"], evs: EV.especial }));
  assert.equal(fantasma.fracFoe, 1, "Fighting não toca em Ghost");
  // controle: um golpe comum depende do investimento em Ataque
  const comum = (evs) => lutar(eu("Blissey", { golpes: ["Body Slam"], evs }), snorlax());
  assert.ok(comum(EV.fisico).fracFoe < comum(EV.tanqueE).fracFoe, "Body Slam sim muda com os EVs");
});

// ---------- habilidades ----------
test("Tough Claws dá +30% em golpe de contato e nada em golpe sem contato", () => {
  const com = (hab, golpe) => lutar(eu("Charizard", { hab, golpes: [golpe] }), rhyperior());
  dentroDoEfeito(razao(com("Tough Claws", "Dragon Claw"), com("Giant Wings", "Dragon Claw"), causado), 1.3, "Dragon Claw (contato)");
  semEfeito(razao(com("Tough Claws", "Rock Slide"), com("Giant Wings", "Rock Slide"), causado), "Rock Slide (sem contato)");
});

test("Skill Link faz Rock Blast acertar 5 vezes em vez de 3 (~x1,7)", () => {
  const com = (hab) => lutar(eu("Heracross", { hab, golpes: ["Rock Blast"] }), rhyperior());
  dentroDoEfeito(razao(com("Skill Link"), com("Moxie"), causado), 5 / 3, "Rock Blast");
});

test("Intimidate do chefão corta o Ataque do jogador em um terço; Clear Amulet devolve o dano", () => {
  const gyarados = () => chefao("Gyarados", { hab: "Moxie", golpes: ["Waterfall"], evs: [252, 252, 4, 0, 0, 0], nat: "Adamant" }); // Intimidate de innate
  const com = (item) => lutar(eu("Machamp", { hab: "Guts", golpes: ["Brick Break"], item }), gyarados());
  dentroDoEfeito(razao(com("Clear Amulet"), com(""), causado), 1.5, "Clear Amulet contra Intimidate");
});

test("o Intimidate do jogador corta o dano físico que ele recebe (~2/3); Clear Amulet do chefão anula", () => {
  const com = (hab, itemFoe) => lutar(eu("Corviknight", { hab, golpes: ["Iron Head"], evs: EV.tanqueF }), machamp(["Knock Off"], { item: itemFoe }));
  dentroDoEfeito(razao(com("Intimidate", ""), com("Chrome Coat", ""), sofrido), 2 / 3, "Intimidate");
  semEfeito(razao(com("Intimidate", "Clear Amulet"), com("Chrome Coat", "Clear Amulet"), sofrido), "Intimidate contra Clear Amulet");
});

test("Solid Rock corta o golpe super efetivo em 35%", () => {
  const hidro = () => chefao("Starmie", { hab: "Natural Cure", golpes: ["Hydro Pump"], evs: EV.especial, nat: "Modest" });
  const com = (hab) => lutar(eu("Tyranitar", { hab, golpes: ["Crunch"], evs: EV.tanqueE }), hidro());
  dentroDoEfeito(razao(com("Solid Rock"), com("Predator"), sofrido), 0.65, "Hydro Pump (2x) em Rock");
});

// Solid Rock/Filter/Prism Armor (-35%) e Primal Armor (-50%): UM corte só em golpe super efetivo, e o golpe continua
// super efetivo (Expert Belt e Weakness Policy disparam). Fonte: er-repo 217dd0f, src/abilities.cc (Filter, Solid Rock,
// Primal Armor): MUL(.65)/MUL(.5) quando typeEffectivenessModifier >= GetSuperEffectiveMult(), sem mexer na efetividade.
// Corrigido em 08/10/2026 (antes o corte valia duas vezes em 4x e zerava o "super efetivo" em 2x).
const maquinas = () => ({
  machamp: chefao("Machamp", { hab: "No Guard", golpes: ["Karate Chop"], evs: EV.nenhum, nat: "Hardy" }), // Fighting é 4x em Rock/Dark
  starmie: chefao("Starmie", { hab: "Natural Cure", golpes: ["Hydro Pump"], evs: EV.especial, nat: "Modest" }), // Water é 2x em Rock/Dark
});
test("efetividade do duelo com Solid Rock/Primal Armor continua real: 4x e 2x, o golpe segue super efetivo", () => {
  const { machamp, starmie } = maquinas();
  ["Predator", "Solid Rock", "Primal Armor"].forEach((hab) => {
    const tyranitar = eu("Tyranitar", { hab, golpes: ["Crunch"] });
    assert.equal(R.efetividadeNoDuelo(machamp, "Fighting", tyranitar), 4, hab + ": Fighting em Rock/Dark");
    assert.equal(R.efetividadeNoDuelo(starmie, "Water", tyranitar), 2, hab + ": Water em Rock/Dark");
  });
});

test("Solid Rock e Primal Armor: o corte em fraqueza 4x vale uma vez só", () => {
  const luta = (hab) => lutar(eu("Tyranitar", { hab, golpes: ["Crunch"], evs: EV.tanqueF }), maquinas().machamp);
  assert.equal(luta("Predator").venceu, false);
  assert.equal(luta("Predator").turnos, 1, "sem a habilidade o 4x derruba o Tyranitar de um golpe");
  // Um corte de 0,65 (ou 0,5) ainda deixa o golpe forte: o Tyranitar cai no segundo, não aguenta o 3 do corte duplo.
  assert.equal(luta("Solid Rock").venceu, false, "4x x 0,65 = 2,6: ainda perde");
  assert.equal(luta("Solid Rock").turnos, 2);
  assert.equal(luta("Primal Armor").venceu, false, "4x x 0,5 = 2: ainda perde");
  assert.equal(luta("Primal Armor").turnos, 2);
});

test("Solid Rock e Primal Armor em fraqueza 2x: dano x0,65 e x0,5 (um corte só)", () => {
  const luta = (hab) => lutar(eu("Tyranitar", { hab, golpes: ["Crunch"], evs: EV.tanqueE }), maquinas().starmie);
  dentroDoEfeito(razao(luta("Solid Rock"), luta("Predator"), sofrido), 0.65, "Solid Rock em 2x");
  dentroDoEfeito(razao(luta("Primal Armor"), luta("Predator"), sofrido), 0.5, "Primal Armor em 2x");
});

test("Solid Rock e Primal Armor: o golpe cortado ainda é super efetivo, então o Expert Belt do chefão dispara", () => {
  const luta = (hab, item) => lutar(eu("Tyranitar", { hab, golpes: ["Crunch"], evs: EV.tanqueE }), chefao("Starmie", { hab: "Natural Cure", golpes: ["Hydro Pump"], evs: EV.especial, nat: "Modest", item }));
  ["Predator", "Solid Rock", "Primal Armor"].forEach((hab) =>
    dentroDoEfeito(razao(luta(hab, "Expert Belt"), luta(hab, ""), sofrido), 1.2, "Expert Belt contra " + hab));
});

test("Solid Rock e Primal Armor: o Weakness Policy de quem apanha dispara no golpe cortado", () => {
  const luta = (hab, item) => lutar(eu("Tyranitar", { hab, golpes: ["Crunch"], evs: EV.fisico, item }),
    chefao("Vaporeon", { hab: "Hydration", golpes: ["Hydro Pump"], evs: [252, 0, 0, 252, 0, 0], nat: "Modest" }));
  ["Predator", "Solid Rock", "Primal Armor"].forEach((hab) => {
    assert.equal(luta(hab, "").turnos, 2, hab + ": controle sem o item");
    assert.equal(luta(hab, "Weakness Policy").turnos, 1, hab + ": com o item o Ataque sobe e a luta acaba antes");
  });
});

test("Rough Skin machuca quem ataca por contato, e só por contato", () => {
  const luta = (hab, golpe) => lutar(eu("Corviknight", { hab, golpes: ["Iron Head"], evs: EV.tanqueF }), machamp([golpe]));
  assert.ok(luta("Rough Skin", "Knock Off").turnos < luta("Chrome Coat", "Knock Off").turnos, "Knock Off (contato): o chefão cai um turno antes");
  assert.equal(luta("Rough Skin", "Rock Slide").turnos, luta("Chrome Coat", "Rock Slide").turnos, "Rock Slide (sem contato): igual");
});

// ---------- itens ----------
test("item de ataque do jogador: Choice Band x1,5, Life Orb x1,3, item do tipo x1,2 só no golpe do tipo", () => {
  const com = (item, golpe = "Dragon Claw") => lutar(eu("Charizard", { hab: "Giant Wings", golpes: [golpe], item }), rhyperior());
  const base = com("");
  dentroDoEfeito(razao(com("Choice Band"), base, causado), 1.5, "Choice Band");
  dentroDoEfeito(razao(com("Life Orb"), base, causado), 1.3, "Life Orb");
  dentroDoEfeito(razao(com("Dragon Fang"), base, causado), 1.2, "Dragon Fang em golpe Dragon");
  semEfeito(razao(com("Dragon Fang", "Rock Slide"), com("", "Rock Slide"), causado), "Dragon Fang em golpe Rock");
});

test("Expert Belt só vale no golpe super efetivo", () => {
  const luta = (item, alvo) => lutar(eu("Charizard", { hab: "Giant Wings", golpes: ["Dragon Claw"], item }), alvo);
  const dragao = () => chefao("Dragonite", { hab: "Inner Focus", golpes: ["Body Slam"], evs: [252, 252, 4, 0, 0, 0], nat: "Adamant", item: "Choice Band" }); // Choice Band: sem o x1,3 do "empowered" da Aerilate (versao-nova/02) o Dragonite perdia a luta
  dentroDoEfeito(razao(luta("Expert Belt", dragao()), luta("", dragao()), causado), 1.2, "Expert Belt contra Dragon");
  semEfeito(razao(luta("Expert Belt", snorlax()), luta("", snorlax()), causado), "Expert Belt contra Normal");
});

test("itens de defesa: Assault Vest corta o dano especial; Leftovers e Rocky Helmet ajudam; Occa Berry segura o 1º Fire", () => {
  // Corviknight, não Blissey: a Self Sufficient da Blissey cura uma constante por turno e a razão dava 0,49 em vez de 0,67
  const especial = (item) => lutar(eu("Corviknight", { hab: "Chrome Coat", golpes: ["Iron Head"], evs: EV.tanqueE, item }), alakazam());
  dentroDoEfeito(razao(especial("Assault Vest"), especial(""), sofrido), 1 / 1.5, "Assault Vest");
  const fisico = (item) => lutar(eu("Corviknight", { hab: "Chrome Coat", golpes: ["Iron Head"], evs: EV.tanqueF, item }), machamp());
  assert.ok(fisico("Leftovers").fracEu > fisico("").fracEu + 0.05, "Leftovers: sobra mais HP");
  assert.ok(fisico("Rocky Helmet").turnos < fisico("").turnos, "Rocky Helmet: o atacante por contato cai antes");
  const fogo = (item) => lutar(eu("Corviknight", { hab: "Chrome Coat", golpes: ["Iron Head"], evs: EV.tanqueE, item }), chefao("Charizard", { hab: "Blaze", golpes: ["Fire Blast"], evs: EV.especial, nat: "Modest", item: "Life Orb" })); // Life Orb: com o dado 2.65.4 (Chrome Coat e Charizard novos) a luta dava 3 turnos com ou sem Occa Berry
  assert.ok(fogo("Occa Berry").turnos > fogo("").turnos, "Occa Berry: aguenta um turno a mais");
});

test("Eviolite só ajuda quem ainda evolui", () => {
  const chansey = (item) => lutar(eu("Chansey", { hab: "Natural Cure", golpes: ["Body Slam"], evs: EV.tanqueF, item }), machamp());
  assert.ok(chansey("Eviolite").turnos > chansey("").turnos, "Chansey (evolui): aguenta mais turnos");
  const corv = (item) => lutar(eu("Corviknight", { hab: "Chrome Coat", golpes: ["Iron Head"], evs: EV.tanqueF, item }), machamp());
  assert.equal(corv("Eviolite").fracEu, corv("").fracEu, "Corviknight (forma final): o item não faz nada");
});

test("item do chefão conta: o Life Orb dele cobra recuo e vira a luta", () => {
  const luta = (item) => lutar(eu("Corviknight", { hab: "Chrome Coat", golpes: ["Iron Head"], evs: EV.tanqueF }), snorlax({ item }));
  assert.equal(luta("").venceu, false, "pré-condição: sem item o Snorlax vence");
  assert.equal(luta("Life Orb").venceu, true, "com Life Orb o recuo derruba o Snorlax antes");
});

test("item do chefão que cura (Sitrus Berry, Leftovers) reduz o dano que o jogador consegue causar", () => {
  const luta = (item) => lutar(eu("Corviknight", { hab: "Chrome Coat", golpes: ["Iron Head"], evs: EV.tanqueF }), snorlax({ item }));
  const base = luta("");
  for (const item of ["Sitrus Berry", "Leftovers"]) {
    const com = luta(item);
    assert.equal(com.turnos, base.turnos, item + ": mesma duração");
    assert.ok(causado(com) < causado(base) * 0.85, item + " cura: causado " + causado(com).toFixed(3) + " x " + causado(base).toFixed(3));
  }
});

// ---------- status e condições ----------
test("Flame Orb queima o dono e corta o Ataque dele pela metade; com Guts não corta", () => {
  const garchomp = (item) => lutar(eu("Garchomp", { golpes: ["Dragon Claw"], item }), snorlax({ golpes: ["Body Slam"], evs: [252, 0, 252, 0, 0, 0], nat: "Careful" }));
  assert.ok(garchomp("Flame Orb").turnos > garchomp("").turnos, "queimado, o Garchomp precisa de um turno a mais");
  assert.ok(garchomp("Flame Orb").fracEu < garchomp("").fracEu - 0.2, "e leva muito mais dano no caminho");
  const machamp = (item) => lutar(eu("Machamp", { hab: "Guts", golpes: ["Brick Break"], item, evs: EV.tanqueF }), snorlax());
  assert.equal(machamp("Flame Orb").turnos, machamp("").turnos, "Guts: a queimadura não atrasa o Machamp");
  assert.ok(machamp("Flame Orb").fracEu > machamp("").fracEu - 0.1, "só o dano da queimadura pesa");
});

test("golpe do chefão com chance de queimar (Scald) corta o dano do atacante físico mais que o golpe sem efeito (Surf)", () => {
  const luta = (golpe) => lutar(eu("Machamp", { hab: "Power Fists", golpes: ["Brick Break"], evs: EV.tanqueF }), chefao("Vaporeon", { hab: "Water Absorb", golpes: [golpe], evs: [252, 0, 0, 252, 0, 0], nat: "Modest" }));
  const scald = luta("Scald"), surf = luta("Surf");
  assert.equal(scald.turnos, surf.turnos);
  assert.ok(causado(scald) < causado(surf) * 0.9, "Scald queima: causado " + causado(scald).toFixed(3) + " x " + causado(surf).toFixed(3) + " com Surf");
});

// ---------- habilidades que mudam a luta inteira ----------
test("Cloud Nine tira o sol da luta: o Fire Blast perde o reforço e o jogador deixa de vencer", () => {
  const luta = (hab) => lutar(eu("Charizard", { hab: "Giant Wings", golpes: ["Fire Blast"], evs: EV.especial, nat: "Modest", clima: "sol" }),
    chefao("Golduck", { hab, golpes: ["Surf"], evs: [252, 0, 0, 252, 0, 0], nat: "Modest", clima: "sol" }));
  assert.equal(luta("Sage Power").venceu, true, "pré-condição: com o sol aceso o Charizard vence");
  assert.equal(luta("Cloud Nine").venceu, false, "com Cloud Nine o sol some e ele perde");
});

test("Emergency Exit: o chefão sai com metade do HP, então só a metade de cima precisa cair", () => {
  const luta = (hab) => lutar(eu("Garchomp", { golpes: ["Dragon Claw"] }), chefao("Golisopod", { hab, golpes: ["Liquidation"], evs: [252, 252, 4, 0, 0, 0], nat: "Adamant" }));
  assert.ok(luta("Emergency Exit").turnos < luta("Tough Claws").turnos, "a luta acaba um turno antes");
  assert.ok(luta("Emergency Exit").fracEu > luta("Tough Claws").fracEu, "e o jogador sai com mais HP");
});

// ---------- clima e campo ----------
test("sol dá x1,5 em golpe Fire e a chuva corta pela metade", () => {
  const luta = (clima) => lutar(eu("Charizard", { hab: "Giant Wings", golpes: ["Fire Blast"], evs: EV.especial, nat: "Modest", clima }), rhyperior({ clima }));
  dentroDoEfeito(razao(luta("sol"), luta(null), causado), 1.5, "sol");
  dentroDoEfeito(razao(luta("chuva"), luta(null), causado), 0.5, "chuva");
});

test("clima defensivo: areia dá +50% de Sp. Def ao Rock, granizo +50% de Def ao Ice, névoa -20% de dano em Ghost (e em Psychic não)", () => {
  const golem = (clima) => lutar(eu("Golem", { golpes: ["Earthquake"], evs: EV.tanqueE, clima }), alakazam(["Shadow Ball"], { clima }));
  dentroDoEfeito(razao(golem("areia"), golem(null), sofrido), 1 / 1.5, "areia no Golem");
  const weavile = (clima) => lutar(eu("Weavile", { hab: "Pressure", golpes: ["Ice Punch"], evs: EV.tanqueF, clima }), machamp(["Knock Off"], { clima }));
  dentroDoEfeito(razao(weavile("granizo"), weavile(null), sofrido), 1 / 1.5, "granizo no Weavile");
  // Eerie Fog (15/10/2026, battle_util.c:7275-7277): o Atk de quem ataca um alvo Ghost sai x0,8; Psychic não entra.
  const mismagius = (clima) => lutar(eu("Mismagius", { hab: "Levitate", golpes: ["Shadow Ball"], evs: EV.tanqueE, nat: "Calm", clima }), alakazam(["Psychic"], { clima }));
  dentroDoEfeito(razao(mismagius("nevoa"), mismagius(null), sofrido), 0.8, "névoa no Mismagius (Ghost)");
  const espeon = (clima) => lutar(eu("Espeon", { hab: "Soul-Heart", golpes: ["Psychic"], evs: EV.tanqueE, nat: "Calm", clima }), alakazam(["Psychic"], { clima, item: "Life Orb" }));
  assert.equal(espeon(null).venceu, false, "pré-condição: sem névoa o Alakazam vence o Espeon");
  assert.equal(espeon("nevoa").venceu, false, "na névoa o Espeon (Psychic) segue perdendo: o corte de dano é só contra Ghost");
  // controle: o clima só mexe em quem tem o tipo (Corviknight não é Rock, Ice, Ghost nem Psychic)
  const corv = (clima) => lutar(eu("Corviknight", { hab: "Chrome Coat", golpes: ["Iron Head"], evs: EV.tanqueF, clima }), machamp());
  for (const c of ["areia", "granizo"]) semEfeito(razao(corv(c), corv(null), sofrido), c + " em quem não é do tipo");
});

test("terreno armado por habilidade: Electro Surge reforça golpe Electric (x1,3) e não mexe nos outros tipos", () => {
  const dragonite = () => chefao("Dragonite", { hab: "Inner Focus", golpes: ["Body Slam"], evs: [252, 252, 4, 0, 0, 0], nat: "Adamant", item: "Choice Band" });
  const jolteon = (hab, golpe) => lutar(eu("Jolteon", { hab, golpes: [golpe], evs: [0, 0, 0, 0, 0, 252], nat: "Modest" }), dragonite());
  dentroDoEfeito(razao(jolteon("Electro Surge", "Thunderbolt"), jolteon("Volt Absorb", "Thunderbolt"), causado), 1.3, "Electric Terrain");
  semEfeito(razao(jolteon("Electro Surge", "Energy Ball"), jolteon("Volt Absorb", "Energy Ball"), causado), "Energy Ball no terreno elétrico");
});

test("Psychic Terrain barra o golpe de prioridade do chefão", () => {
  const luta = (hab) => lutar(eu("Espeon", { hab, golpes: ["Psychic"], evs: EV.tanqueE }), chefao("Machamp", { hab: "No Guard", golpes: ["Mach Punch"], evs: [0, 252, 0, 0, 0, 0], nat: "Adamant" }), { fracEu: 0.35 });
  assert.equal(luta("Sage Power").venceu, true);
  assert.ok(luta("Sage Power").fracEu < 0.35, "sem o terreno o Mach Punch entra antes do Espeon");
  assert.equal(luta("Psychic Surge").fracEu, 0.35, "com o terreno o Mach Punch não sai e o Espeon vence sem levar dano");
});

// ---------- velocidade e prioridade ----------
test("prioridade passa na frente de quem é mais rápido", () => {
  const luta = (golpe) => lutar(eu("Scizor", { golpes: [golpe] }), garchomp(["Outrage"]), { fracFoe: 0.2 });
  assert.equal(luta("Bullet Punch").fracEu, 1, "Bullet Punch acaba com o Garchomp ferido antes de ele agir");
  assert.ok(luta("Iron Head").fracEu < 0.6, "sem prioridade o Garchomp (mais rápido) bate primeiro: " + luta("Iron Head").fracEu);
});

test("Choice Scarf (x1,5 de Speed) troca quem age primeiro", () => {
  const luta = (item) => lutar(eu("Charizard", { hab: "Giant Wings", golpes: ["Flamethrower"], item, evs: EV.especial, nat: "Modest" }), garchomp(["Outrage"]));
  assert.equal(luta("").fracFoe, 1, "sem o Scarf o Garchomp mais rápido derruba o Charizard antes de ele agir");
  assert.ok(luta("Choice Scarf").fracFoe < 0.8, "com o Scarf o Charizard bate primeiro: " + luta("Choice Scarf").fracFoe);
});

// ---------- planos (golpes de status) ----------
test("Swords Dance entra no plano quando compensa: aparece no veredito com +2 de Atk e encurta a luta", () => {
  const luta = (golpes) => lutar(eu("Garchomp", { golpes }), skarmory());
  const com = luta(["Dragon Claw", "Swords Dance"]), sem = luta(["Dragon Claw"]);
  assert.equal(com.planoEu, "Swords Dance");
  assert.deepEqual({ ...com.setupEu }, { atk: 2 });
  assert.equal(sem.planoEu, null, "sem o golpe na build não existe plano");
  assert.ok(com.turnos < sem.turnos, "o setup encurta a luta: " + com.turnos + " x " + sem.turnos);
});

// ---------- o veredito em si ----------
test("veredito: vitória vale 1, derrota vale metade do HP tirado; sem detalhe a chamada devolve só a nota", () => {
  const vitoria = lutar(eu("Scizor", { golpes: ["Bullet Punch"] }), garchomp(["Outrage"]), { fracFoe: 0.2 });
  assert.equal(vitoria.venceu, true);
  assert.equal(vitoria.nota, 1);
  const build = () => eu("Charizard", { hab: "Giant Wings", golpes: ["Dragon Claw"] });
  const derrota = lutar(build(), snorlax());
  assert.equal(derrota.venceu, false);
  assert.ok(Math.abs(derrota.nota - (1 - derrota.fracFoe) / 2) < 1e-9, "nota " + derrota.nota + " x " + (1 - derrota.fracFoe) / 2);
  assert.equal(R.resultadoDoDuelo(build(), snorlax(), NIVEL), derrota.nota, "sem detalhe devolve só a nota");
});

test("HP que passa de uma luta pra outra: o jogador ferido perde a luta que ganhava com HP cheio", () => {
  const luta = (fracEu) => lutar(eu("Corviknight", { hab: "Chrome Coat", golpes: ["Iron Head"], evs: EV.tanqueF }), machamp(), { fracEu });
  assert.equal(luta(1).venceu, true, "pré-condição: com HP cheio ele vence");
  assert.equal(luta(0.2).venceu, false, "com 20% do HP ele cai");
});
