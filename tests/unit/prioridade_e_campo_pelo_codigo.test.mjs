// Ticket calibracao-2026-10-15/06 (15/10/2026): prioridade e campo pelo código do jogo.
// M3) Grassy Glide sai com +1 de prioridade no Grassy Terrain (battle_main.c:4276-4278).
// M4) Misty Terrain só reforça o tipo Fairy x1,3; o x0,5 em Dragon era só do motor (battle_util.c:7088-7112).
// M7) Eerie Fog: o Atk de quem ataca um alvo Ghost sai x0,8; Psychic não entra e o corte é no ataque (battle_util.c:7275-7277).
// N4) (Sun Basking se chama Basking desde o er-config b58ea4d, AbilityList.textproto:3507; abilities.cc: Impl<ABILITY_SUN_BASKING>) Sand Guard (areia) e Sun Basking (sol) barram golpe com prioridade como a Queenly Majesty (abilities.cc:6238-6241, 7437-7440,
//     delegando ao onImmune de 2957-2967); o Utility Umbrella do dono desliga o do sol (battle_util.c:8674-8683).
// A decisão de 14/10 (o golpe com prioridade barrado FALHA inteiro) vale aqui também; este arquivo não a reabre.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 8, difficulty: "ace", levelCapMode: "more" });
const NIVEL = 55;
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const perto = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, (msg || "") + ": " + a + " x " + b + " (tolerância " + tol + ")");
const golpe = (tipo, cat, extra) => Object.assign({ nome: "T" + tipo, tipo, cat: cat || "F", contato: false, prio: 0, precisao: 1, forcaBase: 80, forca: 80, poder: 80, status: [], cats: [], flags: [], crit: { estagio: 0, sempre: false }, recuo: 0, custoHP: 0, dreno: 0 }, extra || {});
const sintetica = (habs, golpes, extra, clima) => {
  const ids = habs.map(idHab);
  return Object.assign({ sp: { n: "Teste", sname: "SPECIES_TESTE06", inn: [] }, tipos: ["Normal"], ids, ef: R.efeitoDasHabilidadesNoDuelo(ids, "AB06_" + habs.join("+") + "_" + clima, clima || null), item: "", it: R.itemDoDuelo("", null),
    stats: [320, 100, 100, 100, 100, 100], golpesProntos: golpes || [golpe("Normal")], statusIds: [], clima: clima || null }, extra || {});
};
const comTerreno = (terreno, fn) => { R.CAMPO_DUELO = terreno ? { terreno } : null; try { return fn(); } finally { R.CAMPO_DUELO = null; } };
const dano = (a, d) => R.danoNoDuelo(a, d, NIVEL).melhor.dano;

// ---------- M3: Grassy Glide ----------
test("Grassy Glide: +1 de prioridade no Grassy Terrain para quem está no chão; sem o terreno, ou voando, fica em 0", () => {
  const planta = (tipos) => sintetica([], R.prepararGolpesDuelo([R.MOVE_ID_BY_NAME["Grassy Glide"]], { ef: R.efeitoDasHabilidadesNoDuelo([], "GG06", null), tipos, stats: [320, 100, 100, 100, 100, 100], it: R.itemDoDuelo("", null) }, null), { tipos });
  const alvo = sintetica([], [golpe("Normal")]);
  const prio = (u) => R.danoNoDuelo(u, alvo, NIVEL).melhor.prio;
  assert.equal(R.MOVES[R.MOVE_ID_BY_NAME["Grassy Glide"]][7], 0, "o dado traz Grassy Glide com prioridade 0");
  assert.equal(prio(planta(["Grass"])), 0, "sem terreno");
  assert.equal(comTerreno("grama", () => prio(planta(["Grass"]))), 1, "no Grassy Terrain");
  assert.equal(comTerreno("eletrico", () => prio(planta(["Grass"]))), 0, "em outro terreno");
  assert.equal(comTerreno("grama", () => prio(planta(["Grass", "Flying"]))), 0, "voando não pega o terreno");
});

test("Sunflora de Flannery 1 (Grassy Surge + Grassy Glide): o campo é de grama e o Grassy Glide sai com prioridade 1", () => {
  const b = R.BOSSES.find((x) => x.name === "Flannery 1");
  const sunflora = R.foeDeDuelo(b.party[0], NIVEL, null);
  assert.equal(sunflora.ef.armaTerreno, "grama");
  const alvo = sintetica([], [golpe("Normal")]);
  const campo = R.campoDoDuelo(sunflora, alvo);
  assert.equal(campo.terreno, "grama");
  const soGlide = Object.assign({}, sunflora, { golpesProntos: sunflora.golpesProntos.filter((g) => g.nome === "Grassy Glide") });
  assert.equal(soGlide.golpesProntos.length, 1);
  assert.equal(comTerreno("grama", () => R.danoNoDuelo(soGlide, alvo, NIVEL).melhor.prio), 1);
  assert.equal(R.danoNoDuelo(soGlide, alvo, NIVEL).melhor.prio, 0, "fora do terreno");
});

// ---------- M4: Misty Terrain ----------
test("Misty Terrain: Fairy do atacante no chão sai x1,3; Dragon contra alvo no chão NÃO é cortado (era x0,5)", () => {
  const atq = (tipo) => sintetica([], [golpe(tipo, "E")], { stats: [320, 100, 100, 100, 100, 100] });
  const alvo = sintetica([], [golpe("Normal")], { tipos: ["Normal"] });
  const sem = (tipo) => dano(atq(tipo), alvo);
  const nevoento = (tipo) => comTerreno("nevoento", () => dano(atq(tipo), alvo));
  perto(nevoento("Dragon") / sem("Dragon"), 1, 1e-9, "Dragon no Misty Terrain");
  perto(nevoento("Fairy") / sem("Fairy"), 1.3, 0.03, "Fairy no Misty Terrain");
  perto(nevoento("Fire") / sem("Fire"), 1, 1e-9, "outro tipo");
});

// ---------- M7: Eerie Fog ----------
test("Eerie Fog: o Atk de quem ataca um alvo Ghost sai x0,8 (no ataque); alvo Psychic, Normal ou Ghost sem névoa: nada", () => {
  const atq = (clima) => sintetica([], [golpe("Fire", "E")], { clima });
  const alvo = (tipo) => sintetica([], [golpe("Normal")], { tipos: [tipo] });
  const razao = (tipo) => dano(atq("nevoa"), alvo(tipo)) / dano(atq(null), alvo(tipo));
  perto(razao("Ghost"), 0.8, 0.03, "Ghost");
  perto(razao("Psychic"), 1, 1e-9, "Psychic");
  perto(razao("Normal"), 1, 1e-9, "Normal");
  // o corte é no Atk, antes da fórmula (o +2 do fim não encolhe): 0,8 x Atk dá um pouco mais que 0,8 x o dano final
  assert.ok(razao("Ghost") > 0.8, "o corte é no ataque, não no dano final: " + razao("Ghost"));
});

test("Eerie Fog: os aumentos de status de quem é Ghost ou Psychic seguem sem cair (exceção do código, battle_script_commands.c:8637)", () => {
  assert.equal(R.CLIMA_OFICIAL.ataqueContraGhostNaNevoa, 0.8);
  assert.equal(R.climaQueCombina("Ghost").clima, "Eerie Fog");
  assert.match(R.climaQueCombina("Ghost").curto, /20% no ataque contra Ghost/);
  assert.match(R.climaQueCombina("Psychic").porque, /só contra Ghost/);
});

// ---------- N4: Sand Guard e Sun Basking ----------
test("os textos de Sand Guard e Sun Basking armam bloqueiaPrioClima só sob o clima certo (areia / sol)", () => {
  const ef = (hab, clima) => R.efeitoDasHabilidadesNoDuelo([idHab(hab)], "BP06_" + hab + "_" + clima, clima);
  assert.equal(ef("Sand Guard", "areia").bloqueiaPrioClima, "areia");
  assert.equal(ef("Sand Guard", null).bloqueiaPrioClima, null, "sem areia");
  assert.equal(ef("Sand Guard", "sol").bloqueiaPrioClima, null, "no sol não");
  assert.equal(ef("Basking", "sol").bloqueiaPrioClima, "sol");
  assert.equal(ef("Basking", "areia").bloqueiaPrioClima, null, "na areia não");
  assert.equal(ef("Queenly Majesty", null).bloqueiaPrioLado, true, "controle: a Queenly Majesty segue sempre");
  for (const n of ["Sepia Lens", "Sand Fiend"]) assert.equal(ef(n, "areia").bloqueiaPrioClima, "areia", n + " (soma com Sand Guard)");
});

test("golpe com prioridade FALHA contra Sand Guard na areia e Sun Basking no sol (Mold Breaker atravessa; clima errado não bloqueia)", () => {
  const rapido = (habs) => sintetica(habs, [golpe("Fire", "F", { prio: 1, nome: "Rapido" }), golpe("Normal", "F", { nome: "Comum", forca: 40, forcaBase: 40, poder: 40 })]);
  const alvo = (hab, clima) => sintetica([hab], [golpe("Normal")], { tipos: ["Rock"] }, clima);
  const melhor = (atq, def) => R.danoNoDuelo(atq, def, NIVEL).melhor;
  // areia
  assert.equal(R.prioFalhaDuelo(rapido([]), alvo("Sand Guard", "areia")), true);
  assert.equal(melhor(rapido([]), alvo("Sand Guard", "areia")).golpe.nome, "Comum", "o golpe com prioridade sai da lista contra Sand Guard na areia");
  assert.equal(melhor(rapido([]), alvo("Sand Guard", null)).golpe.nome, "Rapido", "sem areia o golpe com prioridade é o melhor");
  assert.equal(R.prioFalhaDuelo(rapido(["Mold Breaker"]), alvo("Sand Guard", "areia")), false, "Mold Breaker atravessa");
  assert.equal(R.prioFalhaDuelo(rapido([]), alvo("Sand Guard", "sol")), false, "Sand Guard no sol não bloqueia");
  // sol
  assert.equal(R.prioFalhaDuelo(rapido([]), alvo("Basking", "sol")), true);
  assert.equal(melhor(rapido([]), alvo("Basking", "sol")).golpe.nome, "Comum");
  assert.equal(R.prioFalhaDuelo(rapido([]), alvo("Basking", "areia")), false, "Sun Basking na areia não bloqueia");
  assert.equal(R.prioFalhaDuelo(rapido([]), alvo("Basking", null)), false);
});

test("Utility Umbrella do dono desliga o bloqueio do Sun Basking no sol, mas não o do Sand Guard na areia; Klutz desliga o guarda-chuva", () => {
  const rapido = sintetica([], [golpe("Fire", "F", { prio: 1 })]);
  const comItem = (u, item) => Object.assign({}, u, { item, it: R.itemDoDuelo(item, u.sp) });
  const sunBasking = sintetica(["Basking"], [golpe("Normal")], {}, "sol");
  assert.equal(R.prioFalhaDuelo(rapido, sunBasking), true);
  assert.equal(R.prioFalhaDuelo(rapido, comItem(sunBasking, "Utility Umbrella")), false, "guarda-chuva: o sol não vale para o dono");
  const klutz = sintetica(["Basking", "Klutz"], [golpe("Normal")], {}, "sol");
  assert.equal(R.prioFalhaDuelo(rapido, comItem(klutz, "Utility Umbrella")), true, "Klutz desliga o item");
  const sandGuard = sintetica(["Sand Guard"], [golpe("Normal")], {}, "areia");
  assert.equal(R.prioFalhaDuelo(rapido, comItem(sandGuard, "Utility Umbrella")), true, "o guarda-chuva não mexe na areia");
});

test("chefões reais: Dudunsparce, Claydol e Gastrodon (Sand Guard, areia) e o Koraidon da Maxie Mossdeep (Sun Basking, sol) barram o Quick Attack", () => {
  const quick = sintetica([], [golpe("Normal", "F", { prio: 1, nome: "Quick Attack" })]);
  const membro = (chefao, i, clima) => R.foeDeDuelo(R.BOSSES.find((x) => x.name === chefao).party[i], NIVEL, clima);
  for (const [chefao, i] of [["Lucy Lavaridge", 3], ["Tate And Liza 2", 1], ["Calvin 2", 5]]) {
    const foe = membro(chefao, i, "areia");
    assert.equal(foe.ef.bloqueiaPrioClima, "areia", chefao);
    assert.equal(R.prioFalhaDuelo(quick, foe), true, chefao + " na areia");
    assert.equal(R.prioFalhaDuelo(quick, membro(chefao, i, null)), false, chefao + " sem areia");
  }
  // Sun Basking: o Exeggutor Alolan da Flannery 1 (2.65beta) perdeu a habilidade no dado 2.65.4 (versao-nova/05); o Koraidon da Maxie Mossdeep (Hell) a tem.
  const koraidon = R.foeDeDuelo([].concat(R.BOSSES.find((x) => x.name === "Maxie Mossdeep").hell)[1], NIVEL, "sol");
  assert.equal(koraidon.ef.bloqueiaPrioClima, "sol");
  assert.equal(R.prioFalhaDuelo(quick, koraidon), true, "Koraidon no sol");
});

test("prioridade condicional (Coil Up, On the Prowl...): o alvo com Sand Guard na areia também a barra, como a Queenly Majesty (decisão de 14/10)", () => {
  const eu = sintetica([], [golpe("Normal")]);
  const barra = (def, atq) => R.prioCondicionalBarradaDuelo(atq || eu, def);
  assert.equal(barra(sintetica(["Sand Guard"], [golpe("Normal")], {}, "areia")), true);
  assert.equal(barra(sintetica(["Sand Guard"], [golpe("Normal")], {}, null)), false);
  assert.equal(barra(sintetica(["Sand Guard"], [golpe("Normal")], {}, "areia"), sintetica(["Mold Breaker"], [golpe("Normal")])), false, "Mold Breaker atravessa");
  assert.equal(barra(sintetica(["Queenly Majesty"], [golpe("Normal")])), true, "controle: a Queenly Majesty segue barrando");
  // e a ameaça de prioridade do alvo no pipeline some quando o atacante-referência tem Sand Guard sob o clima
  const foe = sintetica([], [golpe("Normal", "F", { prio: 1, nome: "Rapido" })]);
  assert.equal(R.pipelineAmeacasDePrioridade(sintetica(["Sand Guard"], [golpe("Normal")], {}, "areia"), foe, NIVEL).length, 0);
  assert.equal(R.pipelineAmeacasDePrioridade(sintetica(["Sand Guard"], [golpe("Normal")], {}, null), foe, NIVEL).length, 1, "sem areia a ameaça existe");
});
