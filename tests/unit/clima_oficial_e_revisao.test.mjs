// Achados da reunião de alinhamento (2026-09-30): clima com os números oficiais
// (Weather Rework da página Full Features), Giant Shuriken lendo o golpe alterado
// antes do poder, e Lum/Chesto Berry de uso único contra o plano de sono.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const efDe = (nomes, clima) => R.efeitoDasHabilidadesNoDuelo(nomes.map(idHab), "CO_" + nomes.join("+") + (clima || ""), clima || null);
const perto = (a, b, tol) => Math.abs(a - b) < (tol || 1e-6);
const golpe = (cat, extra) => Object.assign({ nome: "T", tipo: "Normal", cat, contato: false, prio: 0, precisao: 1, forcaBase: 80, forca: 80, poder: 80, status: [], cats: [], flags: [], crit: { estagio: 0, sempre: false }, recuo: 0, custoHP: 0, dreno: 0 }, extra || {});
const unidade = (ef, g, extra) => Object.assign({ sp: { n: "Teste", sname: "T", inn: [] }, tipos: ["Water"], ids: [], ef, item: "", it: R.itemDoDuelo("", null), stats: [320, 100, 100, 100, 100, 100], golpesProntos: [g], statusIds: [] }, extra || {});
const u100 = (ids, tipos) => ({ ef: R.efeitoDasHabilidadesNoDuelo(ids, "CO_U" + ids.join(), null), tipos: tipos || ["Water"], stats: [100, 100, 100, 100, 100, 100] });

// 2026-10-02 (decisão do usuário): NextDex 2.65beta ("Lasts 8 turns") + código oficial (1,5x
// para clima de habilidade/golpe). O Full Features (+20%, infinito) ficou desatualizado.
test("sol/chuva reforçam 50% por 8 turnos (NextDex + código); o texto da mono run usa o mesmo número", () => {
  const surf = R.MOVE_ID_BY_NAME["Surf"];
  const forca = (clima) => R.prepararGolpesDuelo([surf], u100([]), clima)[0].forca;
  assert.ok(perto(forca("chuva") / forca(null), R.CLIMA_OFICIAL.reforcoSolChuva));
  assert.equal(R.CLIMA_OFICIAL.reforcoSolChuva, 1.5);
  assert.equal(R.CLIMA_OFICIAL.duracaoTurnos, 8);
  assert.match(R.climaQueCombina("Water").curto, /\+50%/);
  assert.match(R.climaQueCombina("Ice").curto, /\+50%/);
});

test("Giant Shuriken: Water Shuriken vira 1 acerto de 100 de poder (antes ficava mais fraco)", () => {
  const ws = R.MOVE_ID_BY_NAME["Water Shuriken"];
  const sem = R.prepararGolpesDuelo([ws], u100([]), null)[0];
  const com = R.prepararGolpesDuelo([ws], u100([idHab("Giant Shuriken")]), null)[0];
  assert.equal(com.acertos, 1);
  assert.ok(com.forca > sem.forca, com.forca + " x " + sem.forca);
});

// Eerie Fog (15/10/2026, ticket calibracao-06): o código do jogo (battle_util.c:7275-7277) corta x0,8 o Atk de quem ataca um alvo Ghost;
// Psychic não entra (a linha de 30/09, do Full Features, dava -20% de dano em Ghost e Psychic).
test("granizo: Ice ganha +50% de Defesa (só contra físico); Eerie Fog: quem ataca um Ghost tem o Atk x0,8, Psychic não muda", () => {
  const atq = (clima, cat) => unidade(efDe([]), golpe(cat), { clima });
  const gelo = unidade(efDe([]), golpe("F"), { tipos: ["Ice"] });
  const fis = (clima) => R.danoNoDuelo(atq(clima, "F"), gelo, 50).melhor.dano;
  const esp = (clima) => R.danoNoDuelo(atq(clima, "E"), gelo, 50).melhor.dano;
  assert.ok(fis("granizo") < fis(null) * 0.72 && fis("granizo") > fis(null) * 0.6, fis("granizo") / fis(null));
  assert.ok(perto(esp("granizo"), esp(null)));
  const fantasma = unidade(efDe([]), golpe("F"), { tipos: ["Ghost"] });
  const fogo = (clima) => unidade(efDe([]), golpe("E", { tipo: "Fire" }), { clima }); // Normal não acerta Ghost
  const naNevoa = R.danoNoDuelo(fogo("nevoa"), fantasma, 50).melhor.dano, semNevoa = R.danoNoDuelo(fogo(null), fantasma, 50).melhor.dano;
  assert.ok(semNevoa > 0);
  assert.equal(R.CLIMA_OFICIAL.ataqueContraGhostNaNevoa, 0.8);
  assert.ok(perto(naNevoa / semNevoa, 0.8, 0.03), "Ghost: " + naNevoa / semNevoa);
  const psiquico = unidade(efDe([]), golpe("F"), { tipos: ["Psychic"] });
  const naNevoaPsiquico = R.danoNoDuelo(fogo("nevoa"), psiquico, 50).melhor.dano, semNevoaPsiquico = R.danoNoDuelo(fogo(null), psiquico, 50).melhor.dano;
  assert.ok(perto(naNevoaPsiquico / semNevoaPsiquico, 1), "Psychic: " + naNevoaPsiquico / semNevoaPsiquico);
});

test("dois climas diferentes no campo: fica sem clima (depende de quem entra por último)", () => {
  assert.equal(R.climaNoCampoDuelo({ clima: "granizo", ef: {} }, { clima: "sol", ef: {} }), null);
  assert.equal(R.climaNoCampoDuelo({ clima: "granizo", ef: {} }, { clima: null, ef: {} }), "granizo");
  assert.equal(R.climaNoCampoDuelo({ clima: null, ef: { climasProprios: ["nevoa"] } }, { ef: {} }), "nevoa");
});

test("lote de builds: quem ainda vai ganhar build nova não conta nos itens em uso (trava de 2 iguais)", () => {
  const porNome = (n) => R.SPECIES.find((s) => s && s.n === n);
  const [a, b, c] = ["Luvdisc", "Wailmer", "Corphish"].map(porNome);
  R.state.team = [a.x, b.x, c.x]; R.state.box = []; R.state.customBuilds = {};
  const com = (item) => [{ ability: "", nature: "Hardy", item, moves: ["Tackle"], evs: [0, 0, 0, 0, 0, 0], ivs: [31, 31, 31, 31, 31, 31], active: true, source: "ia" }];
  R.state.customBuilds[a.sname] = com("Life Orb");
  R.state.customBuilds[b.sname] = com("Life Orb");
  assert.equal((R.itensEmUsoComQuem(c.x)["Life Orb"] || []).length, 2, "sem lote: as 2 builds antigas contam");
  R.comecarLoteDeBuilds([a.x, b.x, c.x]);
  try {
    assert.equal(R.itensEmUsoComQuem(c.x)["Life Orb"], undefined, "no lote: A e B ainda vão ser trocados");
    R.concluirBuildDoLote(a.x);
    assert.equal(R.itensEmUsoComQuem(c.x)["Life Orb"].length, 1, "A já ganhou a build nova - conta de novo");
  } finally {
    R.encerrarLoteDeBuilds();
    R.state.team = []; R.state.customBuilds = {};
  }
});

test("Lum/Chesto Berry: a 1ª tentativa de sono se perde (uma vez só); Unnerve e Klutz anulam a baga", () => {
  const eu = (ab) => unidade(efDe(ab), golpe("F"));
  const comLum = (ab) => unidade(efDe(ab || []), golpe("F"), { it: R.itemDoDuelo("Lum Berry", null) });
  assert.equal(R.podeDormirDuelo(comLum(), eu([])), "baga");
  assert.equal(R.podeDormirDuelo(comLum(), eu(["Unnerve"])), true);
  assert.equal(R.podeDormirDuelo(comLum(["Klutz"]), eu([])), true);
  assert.equal(R.podeDormirDuelo(unidade(efDe([]), golpe("F"), { it: R.itemDoDuelo("Chesto Berry", null) }), eu([])), "baga");
  assert.equal(R.podeDormirDuelo(unidade(efDe([]), golpe("F")), eu([])), true);
});
