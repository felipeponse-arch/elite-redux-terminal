// Ticket versao-nova/06 (15/10/2026): habilidades cujo efeito mudou na versão mais nova (dados-2654/02 e 03). Fonte: abilities.cc (upcoming 486026e) e
// battle_util.c; pesquisa de apoio em docs/pesquisa_2654_config.md §1.2 e §1.2b. Dado real do app (NextDex 2.65.4 desde o v05).
// O que já estava certo (Friend Guard, Madness Enhancement, Feathercoat, Magus Blades, Scarecrow, World Serpent, King of the Jungle, Chuckster, Weather Control,
// Toxic Surge/Low Visibility com 8 turnos) tem teste de confirmação; o que mudava o motor tem teste que falha sem a regra.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";
import { EV, linha, meu, lutaInteira, lutaEmDupla } from "./cenarios_do_duelo.mjs";

const R = carregarRegras({ milestone: 8, difficulty: "ace", levelCapMode: "more" });
const NIVEL = 55;
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const perto = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, (msg || "") + ": " + a + " x " + b + " (tolerância " + tol + ")");
const efDe = (habs, clima = null) => R.efeitoDasHabilidadesNoDuelo(habs.map(idHab), "V06_" + habs.join("+") + "_" + clima, clima);
const golpe = (tipo, extra) => Object.assign({ nome: "T" + tipo, tipo, cat: "F", contato: false, prio: 0, precisao: 1, forcaBase: 80, forca: 80, poder: 80, status: [], cats: [], flags: [], crit: { estagio: 0, sempre: false }, recuo: 0, custoHP: 0, dreno: 0 }, extra || {});
const sintetica = (habs, tipos, golpes, extra) => {
  const ids = habs.map(idHab);
  return Object.assign({ sp: { n: "Teste", sname: "SPECIES_TESTE", inn: [] }, tipos, ids, ef: R.efeitoDasHabilidadesNoDuelo(ids, "V06S_" + habs.join("+"), null), item: "", it: R.itemDoDuelo("", null),
    stats: [320, 100, 100, 100, 100, 100], golpesProntos: golpes, statusIds: [] }, extra || {});
};

// ---------- clima armado pelo texto (regressão do texto novo) ----------
test("armar clima/terreno pelo texto: as redações novas (Low Visibility 'Summons fog', Fog Machine 'Sets fog', Cryo Proficiency 'Sets hail', Power Leak 'Sets Electric Terrain') seguem armando", () => {
  assert.equal(R.habilidadeArma("Low Visibility", "nevoa"), true);
  assert.equal(R.habilidadeArma("Fog Machine", "nevoa"), true);
  assert.equal(R.habilidadeArma("Cryo Proficiency", "granizo"), true);
  assert.equal(R.habilidadeArma("Power Leak", "terreno eletrico"), true);
  assert.equal(R.habilidadeSemRegraNoDuelo(idHab("Low Visibility")), false);
  assert.ok(efDe(["Low Visibility"]).climasProprios.includes("nevoa"));
});

test("Low Visibility e Toxic Surge duram 8 turnos (CLIMA_OFICIAL.duracaoTurnos; abilities.cc:7799 e 10127 usam a duração padrão)", () => {
  assert.equal(R.CLIMA_OFICIAL.duracaoTurnos, 8);
  assert.equal(efDe(["Toxic Surge"]).armaTerreno, "toxico");
});

// ---------- paixão sem restrição de gênero ----------
test("Cute Charm, Yuki Onna e Attract: sem restrição de gênero (battle_util.c:5159 CanInfatuate não olha gênero, nas duas versões) - a chance de paixão não cai pela metade", () => {
  const dono = sintetica(["Cute Charm"], ["Normal"], [golpe("Normal")]);
  const rival = sintetica([], ["Normal"], [golpe("Normal", { contato: true })]);
  const p = R.chancesDeStatusNoDuelo(rival, dono, rival.golpesProntos[0], dono.golpesProntos[0]);
  // o dono do Cute Charm leva um golpe de contato do rival: 50% de paixão no atacante (statusDefesa do dono)
  const q = R.chancesDeStatusNoDuelo(dono, rival, dono.golpesProntos[0], rival.golpesProntos[0]);
  perto(q.paixao || 0, 0.5, 1e-9, "Cute Charm contra golpe de contato do rival");
  assert.equal(p.paixao, undefined, "o rival não tem a habilidade");
});

// ---------- Justified ----------
test("Justified: o golpe Dark é absorvido e o MAIOR ataque sobe +1 (abilities.cc:2178): o golpe da categoria do maior ataque sai x1,5 dali em diante", () => {
  const ef = efDe(["Justified"]);
  assert.deepEqual(JSON.parse(JSON.stringify(ef.absorveReforca)), { tipo: "Dark", mult: 1.5, categoria: "maior" });
  const meu = (habs, golpes, stats) => { const eu = sintetica(habs, ["Normal"], golpes, { stats }); const rival = sintetica([], ["Water"], [golpe("Dark")]);
    return R.danoComStatusNoDuelo(eu, rival, R.danoNoDuelo(eu, rival, NIVEL), R.danoNoDuelo(rival, eu, NIVEL), 3, true).meu; };
  const fisico = [320, 150, 100, 100, 100, 100], especial = [320, 100, 100, 150, 100, 100];
  perto(meu(["Justified"], [golpe("Normal", { cat: "F" })], fisico) / meu([], [golpe("Normal", { cat: "F" })], fisico), (1 + 1.5 * 2) / 3, 1e-6, "maior ataque é o físico e o golpe é físico");
  perto(meu(["Justified"], [golpe("Normal", { cat: "E" })], fisico) / meu([], [golpe("Normal", { cat: "E" })], fisico), 1, 1e-9, "golpe especial com maior ataque físico: não sobe");
  perto(meu(["Justified"], [golpe("Normal", { cat: "E" })], especial) / meu([], [golpe("Normal", { cat: "E" })], especial), (1 + 1.5 * 2) / 3, 1e-6, "maior ataque é o especial");
});

// ---------- Jaws of Carnage ----------
test("Jaws of Carnage: nocaute cura 1/4 do HP máximo, 1/2 se o golpe é de mordida (abilities.cc:5545; antes o motor 'devorava' 1/2 do alvo)", () => {
  const ef = efDe(["Jaws of Carnage"]);
  assert.equal(ef.devora, 0);
  assert.equal(ef.curaNocaute, 0.25);
  assert.equal(ef.curaNocauteMordida, 0.5);
  const dono = (cats) => sintetica(["Jaws of Carnage"], ["Normal"], [golpe("Normal", { cats })]);
  assert.equal(R.curaDoNocauteDuelo(dono(["mordida"])), 0.5);
  assert.equal(R.curaDoNocauteDuelo(dono([])), 0.25);
  assert.equal(R.curaDoNocauteDuelo(sintetica([], ["Normal"], [golpe("Normal")])), 0);
});

test("Jaws of Carnage na luta inteira e na dupla: o nocaute cura o dono (HP final maior que o do mesmo Pokémon sem a habilidade)", () => {
  const fraco = () => linha("Magikarp", { golpes: ["Tackle"], evs: EV.nenhum });
  const forte = () => linha("Snorlax", { hab: "Thick Fat", golpes: ["Body Slam"], evs: [252, 252, 4, 0, 0, 0], nat: "Adamant" });
  const inteira = (hab) => lutaInteira([meu("Garchomp", ["Crunch"], { hab, evs: EV.tanqueF })], [fraco(), forte()]).hpRestante;
  assert.ok(inteira("Jaws of Carnage") > inteira("Run Away") + 0.3, inteira("Jaws of Carnage") + " x " + inteira("Run Away"));
  const dupla = (hab) => lutaEmDupla([meu("Garchomp", ["Crunch"], { hab, evs: EV.tanqueF }), meu("Dragonite", ["Outrage"], { hab: "Run Away", evs: EV.fisico })], [fraco(), fraco(), forte(), forte()]).hpRestante;
  assert.ok(dupla("Jaws of Carnage") > dupla("Run Away") + 0.01, dupla("Jaws of Carnage") + " x " + dupla("Run Away"));
});

// ---------- Perish Body ----------
test("Perish Body: só quando o atacante faz CONTATO (battle_util via IsMoveMakingContact, abilities.cc:3444); sem contato a canção não toca", () => {
  const ef = efDe(["Perish Body"]);
  assert.equal(ef.perecer, 3);
  assert.equal(ef.perecerContato, true);
  const dono = sintetica(["Perish Body"], ["Normal"], [golpe("Normal")]);
  const comContato = sintetica([], ["Normal"], [golpe("Normal", { contato: true })]), semContato = sintetica([], ["Normal"], [golpe("Normal")]);
  assert.equal(R.perecimentoDuelo(dono, comContato), 3);
  assert.equal(R.perecimentoDuelo(dono, semContato), 0);
  assert.equal(R.perecimentoDuelo(comContato, dono), 3, "vale nos dois sentidos");
});

// ---------- Poison Absorb ----------
test("Poison Absorb: absorve Poison (já valia) e cura 1/8 do HP por turno no Toxic Terrain (abilities.cc:4421; battle script RainDish: 1/8)", () => {
  const ef = efDe(["Poison Absorb"]);
  assert.deepEqual(JSON.parse(JSON.stringify(ef.noTerreno)), [{ terreno: "toxico", stat: "cura", mult: 0.125 }]);
  assert.equal(R.TYPE_MOD_ABILITIES[idHab("Poison Absorb")].immune[0], "Poison");
});

// ---------- Lawnmower ----------
test("Lawnmower: limpa o terreno e sobe Def (+1) ou, se o terreno era Toxic, Psychic ou Misty, Sp. Def (+1) (abilities.cc:7626)", () => {
  const ef = efDe(["Lawnmower"]);
  assert.equal(ef.limpaTerreno, true);
  assert.equal(ef.lawnmower, true);
  assert.equal(R.estagioDoLawnmowerDuelo("grama"), "def");
  assert.equal(R.estagioDoLawnmowerDuelo("eletrico"), "def");
  assert.equal(R.estagioDoLawnmowerDuelo("toxico"), "spd");
  assert.equal(R.estagioDoLawnmowerDuelo("psiquico"), "spd");
  assert.equal(R.estagioDoLawnmowerDuelo("nevoa"), "spd");
  // na luta: o estágio médio do dono sobe quando o rival arma terreno
  const g = golpe("Normal");
  const com = (habRival, habDono = ["Lawnmower"]) => R.estagiosMediosDuelo(sintetica(habDono, ["Normal"], [g]), sintetica(habRival, ["Normal"], [g]), g, g, 3);
  assert.ok(com(["Grassy Surge"]).def > 0 && com(["Grassy Surge"]).spd === 0, "terreno de grama: Def");
  assert.ok(com(["Toxic Surge"]).spd > 0 && com(["Toxic Surge"]).def === 0, "terreno tóxico: Sp. Def");
  assert.equal(com([]).def + com([]).spd, 0, "sem terreno adversário não sobe nada");
  assert.equal(com(["Grassy Surge"], []).def, 0, "sem Lawnmower não sobe");
});

test("Poison Absorb no duelo: a cura por turno do Toxic Terrain entra na conta do dono (1/8 do HP por turno) e só nesse terreno", () => {
  const dono = sintetica(["Poison Absorb"], ["Normal"], [golpe("Normal")]);
  assert.equal(JSON.stringify(dono.ef.noTerreno), JSON.stringify([{ terreno: "toxico", stat: "cura", mult: 0.125 }]));
  const guardado = R.CAMPO_DUELO;
  try {
    R.CAMPO_DUELO = { terreno: "toxico" };
    assert.equal(R.noTerrenoDuelo(dono, "cura"), 0.125, "no Toxic Terrain");
    R.CAMPO_DUELO = { terreno: "grama" };
    assert.equal(R.noTerrenoDuelo(dono, "cura"), 0, "em outro terreno não cura");
    R.CAMPO_DUELO = null;
    assert.equal(R.noTerrenoDuelo(dono, "cura"), 0, "sem terreno não cura");
  } finally { R.CAMPO_DUELO = guardado; }
});

// ---------- o que já estava certo ----------
test("confirmadas pelo código (já estavam certas): Friend Guard 25% (+Caretaker, Food Lovers), Scarecrow (Cotton Down), World Serpent (Serpent Bind), King of the Jungle (Grassy Surge), Weather Control, Chuckster", () => {
  assert.equal(efDe(["Friend Guard"]).aliadoReducao, 0.75);
  assert.equal(efDe(["Caretaker"]).aliadoReducao, 0.75);
  assert.equal(efDe(["Food Lovers"]).aliadoReducao, 0.75);
  assert.deepEqual(JSON.parse(JSON.stringify(efDe(["Scarecrow"]).aoApanharAtacante)), [{ stat: "spe", n: -1 }]);
  assert.equal(efDe(["World Serpent"]).prende, "chance");
  assert.equal(efDe(["King of the Jungle"]).armaTerreno, "grama");
  assert.equal(efDe(["King of the Jungle"]).vsTipo.Grass, undefined, "perdeu o x1,5 contra Grass");
  assert.equal(efDe(["Weather Control"]).bloqueiaGolpeClima, true);
  assert.equal(efDe(["Chuckster"]).primeiroGolpeRecebido, 0.5);
});
