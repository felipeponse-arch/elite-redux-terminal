// Ticket calibracao-2026-10-15/02 (15/10/2026): os parâmetros dos itens vêm do `hold_effect_strength` da er-config, como o
// jogo os lê (battle_util.c:7005-7034: modificador = 1 + força/100), e não de números soltos no motor. Antes: item de tipo
// e Plate x1,2, Muscle Band e Wise Glasses x1,1, gema x1,3, Wide Lens +10%; Soul Dew, Quick Claw e Utility Umbrella não
// existiam. Agora: tipo/Plate x1,3, Muscle/Wise x1,15, gema x1,5 uma vez, Soul Dew x1,5 (especial e Sp. Def de Latias/Latios),
// Wide Lens +12%, Quick Claw 20% de agir primeiro, Utility Umbrella sem efeito de sol/chuva no dano do portador.
// Chefões e espécies reais do app. Sabotagem controlada (tests/run_sabotage.mjs) também nos arquivos fora de src/regras.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { carregarRegras } from "./carregar_regras.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
function lerComMutacao(caminho, nome) {
  let t = readFileSync(join(RAIZ, caminho), "utf8").replace(/\r\n/g, "\n");
  if (process.env.MUTACAO_ARQUIVO === nome) {
    if (t.split(process.env.MUTACAO_DE).length !== 2) throw new Error("trecho da sabotagem não encontrado (ou repetido) em " + nome + ": " + process.env.MUTACAO_DE);
    t = t.replace(process.env.MUTACAO_DE, () => process.env.MUTACAO_PARA || "");
  }
  return t;
}
const M = await import("data:text/javascript;base64," + Buffer.from(lerComMutacao("scripts/itens_pela_config.mjs", "itens_pela_config.mjs")).toString("base64"));
const config = JSON.parse(lerComMutacao("data/itens_config.json", "itens_config.json"));
const itensDoApp = JSON.parse(readFileSync(join(RAIZ, "data", "item_descriptions.json"), "utf8"));

const R = carregarRegras({ milestone: 8, difficulty: "ace", levelCapMode: "more" });
const NIVEL = 55;
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const perto = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, (msg || "") + ": " + a + " x " + b + " (tolerância " + tol + ")");

// Alvo neutro para medir o dano de um atacante real.
const alvo = (extra) => Object.assign({ sp: { n: "Alvo", sname: "SPECIES_ALVO", inn: [] }, tipos: ["Normal"], ids: [], ef: R.efeitoDasHabilidadesNoDuelo([], "ALVO", null),
  item: "", it: R.itemDoDuelo("", null), stats: [400, 100, 100, 100, 100, 100], golpesProntos: [], statusIds: [] }, extra || {});
const pokemonDoChefao = (chefao, mon) => {
  const b = R.BOSSES.find((x) => x.name === chefao);
  const p = b && b.party.find((x) => x.n === mon);
  assert.ok(p, chefao + " / " + mon + " não existe em bosses.json");
  return p;
};
// Mesma unidade do chefão com e sem o item; a razão do melhor dano é o efeito do item.
const razaoDoItem = (chefao, mon, itemEsperado, clima) => {
  const p = pokemonDoChefao(chefao, mon);
  assert.equal(p.item, itemEsperado, mon + " de " + chefao + " segura " + itemEsperado);
  const com = R.foeDeDuelo(p, NIVEL, clima || null), sem = R.foeDeDuelo(Object.assign({}, p, { item: "" }), NIVEL, clima || null);
  const a = R.danoNoDuelo(com, alvo(), NIVEL).melhor, b = R.danoNoDuelo(sem, alvo(), NIVEL).melhor;
  assert.ok(a.golpe && b.golpe && a.golpe.nome === b.golpe.nome, "o melhor golpe é o mesmo com e sem o item (" + (a.golpe && a.golpe.nome) + ")");
  return { razao: a.dano / b.dano, golpe: a.golpe, com, sem };
};

// ---------- o gerador ----------
test("lerItensDaConfig: lê id, nome, efeito, força e tipo; pula o bloco aninhado e destrava o apóstrofo", () => {
  const texto = `# proto-file: ItemList.proto
item {
  id: ITEM_CHARCOAL
  name: "Charcoal"
  hold_effect: HOLD_EFFECT_TYPE_POWER
  hold_effect_strength: 30
  hold_effect_type: TYPE_FIRE
  inner {
    hold_effect_strength: 999
  }
}
item {
  id: ITEM_KINGS_ROCK
  name: "King\\'s Rock"
  hold_effect: HOLD_EFFECT_FLINCH
  hold_effect_strength: 10
}
item {
  id: ITEM_QUICK_CLAW
  name: "Quick Claw"
  hold_effect: HOLD_EFFECT_CUSTOM
  hold_effect_strength: 20
}
`;
  const l = M.lerItensDaConfig(texto);
  assert.deepEqual(l.map((i) => i.nome), ["Charcoal", "King's Rock", "Quick Claw"]);
  assert.deepEqual(l[0], { id: "ITEM_CHARCOAL", nome: "Charcoal", efeito: "HOLD_EFFECT_TYPE_POWER", forca: 30, tipo: "TYPE_FIRE" });
  assert.equal(l[0].forca, 30, "a força dentro de inner { } não é do item");
});

test("efeitoDoItem: CUSTOM vira o alias ou o nome do item (como o ItemGenerator.kt gera o enum); NONE vira nada", () => {
  assert.equal(M.efeitoDoItem({ id: "ITEM_QUICK_CLAW", efeito: "HOLD_EFFECT_CUSTOM" }), "QUICK_CLAW");
  assert.equal(M.efeitoDoItem({ id: "ITEM_X", efeito: "HOLD_EFFECT_CUSTOM", alias: "OUTRO" }), "OUTRO");
  assert.equal(M.efeitoDoItem({ id: "ITEM_CHARCOAL", efeito: "HOLD_EFFECT_TYPE_POWER" }), "TYPE_POWER");
  assert.equal(M.efeitoDoItem({ id: "ITEM_Y", efeito: "HOLD_EFFECT_NONE" }), null);
  assert.equal(M.efeitoDoItem({ id: "ITEM_Z" }), null);
});

test("itensDeBatalha: guarda efeito (e), força (f) e tipo em inglês (t); deixa de fora pedra mega e item sem efeito", () => {
  const itens = M.itensDeBatalha([
    { id: "ITEM_CHARCOAL", nome: "Charcoal", efeito: "HOLD_EFFECT_TYPE_POWER", forca: 30, tipo: "TYPE_FIRE" },
    { id: "ITEM_UTILITY_UMBRELLA", nome: "Utility Umbrella", efeito: "HOLD_EFFECT_CUSTOM" },
    { id: "ITEM_ABOMASITE", nome: "Abomasite", efeito: "HOLD_EFFECT_MEGA_STONE" },
    { id: "ITEM_REPEL", nome: "Repel" }
  ]);
  assert.deepEqual(itens, { Charcoal: { e: "TYPE_POWER", f: 30, t: "Fire" }, "Utility Umbrella": { e: "UTILITY_UMBRELLA" } });
});

// ---------- o dado ----------
test("itens_config.json: os números da er-config d1a9a4c que o ticket manda ler", () => {
  const f = (n) => config.itens[n] && config.itens[n].f;
  assert.equal(config.meta.commit, "d1a9a4c");
  for (const n of ["Charcoal", "Mystic Water", "Black Glasses", "Miracle Seed", "Dragon Fang", "Silk Scarf"]) assert.equal(config.itens[n].e + ":" + f(n), "TYPE_POWER:30", n);
  assert.equal(config.itens["Spooky Plate"].e + ":" + f("Spooky Plate"), "PLATE:30");
  assert.equal(f("Muscle Band"), 15);
  assert.equal(f("Wise Glasses"), 15);
  assert.equal(f("Fire Gem"), 50);
  assert.equal(f("Soul Dew"), 50);
  assert.equal(f("Wide Lens"), 12);
  assert.equal(f("Quick Claw"), 20);
  assert.equal(config.itens["Utility Umbrella"].e, "UTILITY_UMBRELLA");
});

test("itens_config.json: todo item de tipo, Plate e gema do app está na config, com o tipo que o texto da NextDex cita", () => {
  let tipo = 0, plates = 0, gemas = 0;
  for (const [nome, texto] of Object.entries(itensDoApp)) {
    const x = texto.match(/(?:raises|boosts|ups) the power of (\w+)-type moves|boosts (\w+)-type moves|ups the power of (\w+)-type moves|Increases the power of (\w+) Type moves/i);
    const tp = x && R.tipoDoTextoDuelo(x[1] || x[2] || x[3] || x[4]);
    if (!tp) continue;
    const c = config.itens[nome];
    assert.ok(c, nome + " está na config");
    assert.equal(c.t, tp, nome + ": tipo da config x tipo do texto");
    if (/ Gem$/.test(nome)) { assert.equal(c.e + ":" + c.f, "GEMS:50", nome); gemas++; }
    else if (/Plate$/.test(nome)) { assert.equal(c.e + ":" + c.f, "PLATE:30", nome); plates++; }
    else { assert.equal(c.e + ":" + c.f, "TYPE_POWER:30", nome); tipo++; }
  }
  assert.ok(tipo === 23 && plates === 14 && gemas === 18, "famílias achadas: tipo " + tipo + ", plates " + plates + ", gemas " + gemas);
});

// ---------- o motor: o item ----------
test("itemDoDuelo: item de tipo e Plate valem x1,3 (era 1,2), cada um no seu tipo", () => {
  for (const [nome, tipo] of [["Charcoal", "Fire"], ["Mystic Water", "Water"], ["Black Glasses", "Dark"], ["Miracle Seed", "Grass"], ["Spooky Plate", "Ghost"], ["Dragon Fang", "Dragon"], ["Zap Plate", "Electric"]]) {
    const it = R.itemDoDuelo(nome, null);
    assert.deepEqual(Object.keys(it.tipoMult), [tipo], nome);
    assert.equal(it.tipoMult[tipo], 1.3, nome);
  }
});

test("itemDoDuelo: Muscle Band x1,15 no físico e Wise Glasses x1,15 no especial (eram 1,1)", () => {
  const mb = R.itemDoDuelo("Muscle Band", null), wg = R.itemDoDuelo("Wise Glasses", null);
  assert.equal(mb.fisicoMult, 1.15);
  assert.equal(mb.especialMult, 1);
  assert.equal(wg.especialMult, 1.15);
  assert.equal(wg.fisicoMult, 1);
});

test("itemDoDuelo: gema x1,5 (era 1,3) uma vez, no tipo da gema", () => {
  const g = R.itemDoDuelo("Fire Gem", null);
  assert.equal(g.gema, "Fire");
  assert.equal(g.gemaMult, 1.5);
  assert.equal(g.consumivel, true);
  assert.deepEqual(Object.keys(g.tipoMult), [], "a gema não é item de tipo permanente");
});

test("itemDoDuelo: Wide Lens +12% de precisão (era 10%) e Quick Claw 20%; Utility Umbrella marcada", () => {
  assert.equal(R.itemDoDuelo("Wide Lens", null).precisaoMult, 1.12);
  assert.equal(R.itemDoDuelo("Quick Claw", null).garra, 0.2);
  assert.equal(R.itemDoDuelo("Utility Umbrella", null).guardaChuvaSol, true);
  assert.equal(R.itemDoDuelo("Charcoal", null).guardaChuvaSol, false);
});

test("itemDoDuelo: Soul Dew só em Latias/Latios (e megas): golpe especial e Sp. Def x1,5; em outra espécie não faz nada", () => {
  const sp = (nome) => R.SPECIES.find((s) => s && s.n === nome);
  for (const nome of ["Latias", "Latios"]) {
    const it = R.itemDoDuelo("Soul Dew", sp(nome));
    assert.equal(it.especialMult, 1.5, nome);
    assert.equal(it.spdMult, 1.5, nome);
    assert.equal(it.fisicoMult, 1, nome);
  }
  const outra = R.itemDoDuelo("Soul Dew", sp("Garchomp"));
  assert.equal(outra.especialMult, 1);
  assert.equal(outra.spdMult, 1);
});

test("os itens que o ticket mandou deixar como estão: Life Orb 1,3, Expert Belt 1,2 (o jogo o fixa no código, apesar do 30 da config), Eviolite 1,5, Punching Glove 1,1", () => {
  assert.equal(config.itens["Expert Belt"].f, 30, "a config diz 30 para o Expert Belt, mas battle_util.c:7674-7676 usa UQ_4_12(1.2) fixo");
  assert.equal(R.itemDoDuelo("Life Orb", null).danoMult, 1.3);
  assert.equal(R.itemDoDuelo("Expert Belt", null).seMult, 1.2);
  const eviolite = R.itemDoDuelo("Eviolite", R.SPECIES.find((s) => s && s.n === "Ledyba"));
  assert.equal(eviolite.defMult, 1.5);
  assert.equal(eviolite.spdMult, 1.5);
  assert.equal(R.itemDoDuelo("Punching Glove", null).categoriaMult.soco, 1.1);
});

// ---------- o motor: o dano de chefões reais ----------
test("Charcoal (Torkoal de Flannery 4), Mystic Water (Phione de Archie) e Miracle Seed (Sagaracas de Tabitha): +30% no golpe do tipo", () => {
  const casos = [["Flannery 4", "Torkoal", "Charcoal", "Fire"], ["Archie", "Phione", "Mystic Water", "Water"], ["Tabitha Mt Chimney", "Sagaracas", "Miracle Seed", "Grass"]];
  for (const [chefao, mon, item, tipo] of casos) {
    const r = razaoDoItem(chefao, mon, item);
    assert.equal(r.golpe.tipo, tipo, mon + ": o melhor golpe é do tipo do item");
    perto(r.razao, 1.3, 0.01, mon + " com " + item);
  }
});

test("Muscle Band (Mawile de Steven) +15% no golpe físico e Wise Glasses (Blastoise de Matt) +15% no especial", () => {
  const mb = razaoDoItem("Steven Granite Cave", "Mawile", "Muscle Band");
  assert.equal(mb.golpe.cat, "F");
  perto(mb.razao, 1.15, 0.01, "Mawile com Muscle Band");
  const wg = razaoDoItem("Matt", "Blastoise", "Wise Glasses");
  assert.equal(wg.golpe.cat, "E");
  perto(wg.razao, 1.15, 0.01, "Blastoise com Wise Glasses");
});

test("Soul Dew (Latios do Monochamp Dragon): +50% no golpe especial; como alvo, a Sp. Def sobe 50% (o físico não muda)", () => {
  const r = razaoDoItem("Monochamp Dragon", "Latios", "Soul Dew");
  assert.equal(r.golpe.cat, "E");
  perto(r.razao, 1.5, 0.01, "Latios com Soul Dew");
  // como alvo: o mesmo ataque especial machuca menos o Latios com Soul Dew; o físico machuca igual.
  const comItem = r.com, semItem = r.sem;
  const atq = (cat) => ({ sp: { n: "A", sname: "SPECIES_A", inn: [] }, tipos: ["Normal"], ids: [], ef: R.efeitoDasHabilidadesNoDuelo([], "A" + cat, null), item: "", it: R.itemDoDuelo("", null), stats: [400, 150, 150, 150, 150, 100],
    golpesProntos: [{ nome: "T", tipo: "Normal", cat, contato: false, prio: 0, precisao: 1, forcaBase: 80, forca: 80, poder: 80, status: [], cats: [], flags: [], crit: { estagio: 0, sempre: false }, recuo: 0, custoHP: 0, dreno: 0 }] });
  const esp = R.danoNoDuelo(atq("E"), semItem, NIVEL).melhor.dano / R.danoNoDuelo(atq("E"), comItem, NIVEL).melhor.dano;
  const fis = R.danoNoDuelo(atq("F"), semItem, NIVEL).melhor.dano / R.danoNoDuelo(atq("F"), comItem, NIVEL).melhor.dano;
  perto(esp, 1.5, 0.05, "dano especial sofrido sem x com Soul Dew");
  perto(fis, 1, 0.001, "dano físico sofrido");
});

test("Fire Gem (Ninetales de Courtney): o 1º golpe Fire sai x1,5 (era 1,3) e o efeito se dilui nos turnos seguintes", () => {
  const p = pokemonDoChefao("Courtney Mossdeep", "Ninetales");
  assert.equal(p.item, "Fire Gem");
  const com = R.foeDeDuelo(p, NIVEL, null), sem = R.foeDeDuelo(Object.assign({}, p, { item: "" }), NIVEL, null), al = alvo();
  const meu = (x, turnos) => R.danoComStatusNoDuelo(x, al, R.danoNoDuelo(x, al, NIVEL), R.danoNoDuelo(al, x, NIVEL), turnos, true).meu;
  assert.equal(R.danoNoDuelo(com, al, NIVEL).melhor.golpe.tipo, "Fire");
  perto(meu(com, 1) / meu(sem, 1), 1.5, 0.05, "1 turno");
  perto(meu(com, 3) / meu(sem, 3), (1.5 + 2) / 3, 0.03, "3 turnos: a gema só vale uma vez");
});

test("Wide Lens: +12% de precisão num golpe de 70% (Focus Blast); item de outro tipo não mexe", () => {
  const focus = R.MOVE_ID_BY_NAME["Focus Blast"];
  const unidade = (item) => ({ sp: { n: "A", sname: "SPECIES_A", inn: [] }, tipos: ["Normal"], ids: [], ef: R.efeitoDasHabilidadesNoDuelo([], "WL", null), item, it: R.itemDoDuelo(item, null), stats: [400, 150, 150, 150, 150, 100],
    golpesProntos: R.prepararGolpesDuelo([focus], { ef: R.efeitoDasHabilidadesNoDuelo([], "WL", null), tipos: ["Normal"], stats: [400, 150, 150, 150, 150, 100], it: R.itemDoDuelo(item, null) }, null) });
  const dano = (item) => R.danoNoDuelo(unidade(item), alvo(), NIVEL).melhor.dano;
  perto(dano("Wide Lens") / dano(""), 1.12, 0.001, "Wide Lens");
  perto(dano("Charcoal") / dano(""), 1, 0.001, "Charcoal não dá precisão");
});

test("Quick Claw: 20% de o mais lento agir primeiro; junto do Quick Draw (30%) os dois sorteios se combinam, 1-(0,7*0,8) = 44%", () => {
  const golpe = { nome: "T", tipo: "Normal", cat: "F", contato: false, prio: 0, precisao: 1, forcaBase: 80, forca: 5000, poder: 5000, status: [], cats: [], flags: [], crit: { estagio: 0, sempre: false }, recuo: 0, custoHP: 0, dreno: 0 };
  const u = (item, spe, ab) => ({ sp: { n: "T", sname: "SPECIES_T", inn: [] }, tipos: ["Water"], ids: ab.map(idHab), ef: R.efeitoDasHabilidadesNoDuelo(ab.map(idHab), "QC" + ab.join(), null),
    item, it: R.itemDoDuelo(item, null), stats: [320, 100, 100, 100, 100, spe], golpesProntos: [golpe], statusIds: [] });
  const rapido = u("", 150, []);
  // um golpe mata o outro: quem age primeiro vence. O resultado do lento é a chance de ele agir primeiro.
  perto(R.resultadoDoDuelo(u("", 50, []), rapido, 50), 0, 1e-9, "lento sem item");
  perto(R.resultadoDoDuelo(u("Quick Claw", 50, []), rapido, 50), 0.2, 1e-9, "lento com Quick Claw");
  perto(R.resultadoDoDuelo(u("", 50, ["Quick Draw"]), rapido, 50), 0.3, 1e-9, "lento com Quick Draw");
  perto(R.resultadoDoDuelo(u("Quick Claw", 50, ["Quick Draw"]), rapido, 50), 0.44, 1e-9, "lento com os dois");
  // vale também para o rápido: o lento só vence 20% das vezes, mas o rápido com Quick Claw não perde nada que já tinha
  perto(R.resultadoDoDuelo(u("", 200, []), rapido, 50), 1, 1e-9, "mais rápido que o rival continua agindo primeiro");
});

// ---------- o motor: Utility Umbrella ----------
test("Utility Umbrella (Rotom Heat de Shelly): no sol o Flamethrower não ganha o x1,5; sem o item ganha", () => {
  const r = razaoDoItem("Shelly Seafloor Cavern", "Rotom Heat", "Utility Umbrella", "sol");
  assert.equal(r.golpe.tipo, "Fire");
  perto(r.razao, 1 / R.CLIMA_OFICIAL.reforcoSolChuva, 0.01, "com o guarda-chuva o dano é o do dia nublado, sem ele o do sol");
  // sem clima o item não muda nada
  const p = pokemonDoChefao("Shelly Seafloor Cavern", "Rotom Heat");
  const a = R.danoNoDuelo(R.foeDeDuelo(p, NIVEL, null), alvo(), NIVEL).melhor.dano, b = R.danoNoDuelo(R.foeDeDuelo(Object.assign({}, p, { item: "" }), NIVEL, null), alvo(), NIVEL).melhor.dano;
  perto(a / b, 1, 1e-9, "sem clima");
});

test("Utility Umbrella: na chuva o Fire do portador não é cortado e o Water não é reforçado; Klutz desliga o item", () => {
  const unidade = (item, ab) => ({ ef: R.efeitoDasHabilidadesNoDuelo(ab.map(idHab), "UU" + ab.join(), null), tipos: ["Water"], stats: [100, 100, 100, 100, 100, 100], it: R.itemDoDuelo(item, null) });
  const forca = (nome, item, ab, clima) => R.prepararGolpesDuelo([R.MOVE_ID_BY_NAME[nome]], unidade(item, ab), clima)[0].forca;
  const reforco = R.CLIMA_OFICIAL.reforcoSolChuva;
  perto(forca("Surf", "", [], "chuva") / forca("Surf", "", [], null), reforco, 1e-6, "sem guarda-chuva a chuva reforça o Water");
  perto(forca("Surf", "Utility Umbrella", [], "chuva") / forca("Surf", "Utility Umbrella", [], null), 1, 1e-6, "com guarda-chuva não");
  perto(forca("Flamethrower", "", [], "chuva") / forca("Flamethrower", "", [], null), 0.5, 1e-6, "sem guarda-chuva a chuva corta o Fire");
  perto(forca("Flamethrower", "Utility Umbrella", [], "chuva") / forca("Flamethrower", "Utility Umbrella", [], null), 1, 1e-6, "com guarda-chuva não");
  perto(forca("Surf", "Utility Umbrella", ["Klutz"], "chuva") / forca("Surf", "Utility Umbrella", ["Klutz"], null), reforco, 1e-6, "Klutz desliga o item");
});

test("Utility Umbrella não tira a carga do Solar Beam: no jogo ela lê o clima (IsWeatherActive), não o guarda-chuva", () => {
  const solar = R.MOVE_ID_BY_NAME["Solar Beam"];
  const unidade = (item) => ({ ef: R.efeitoDasHabilidadesNoDuelo([], "UUS", null), tipos: ["Grass"], stats: [100, 100, 100, 100, 100, 100], it: R.itemDoDuelo(item, null) });
  assert.equal(R.prepararGolpesDuelo([solar], unidade(""), null).length, 0, "sem sol o Solar Beam precisa carregar");
  assert.equal(R.prepararGolpesDuelo([solar], unidade(""), "sol").length, 1, "no sol sai direto");
  assert.equal(R.prepararGolpesDuelo([solar], unidade("Utility Umbrella"), "sol").length, 1, "no sol, com guarda-chuva, também");
});
