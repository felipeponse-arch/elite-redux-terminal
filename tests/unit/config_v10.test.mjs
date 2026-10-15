// Ticket versao-nova/10 (15/10/2026): o que sobrou da config d1a9a4c depois do v09 - aprendizado de golpes de TODAS as espécies, os quatro "Hunter/jack" pelo tipo
// de quem ataca (abilities.cc:5752 Lumberjack, Fae Hunter, Monster Hunter, Firefighter; mesma família do Dragonslayer e do Insect Eater) e as Mega Bruxish e Jellicent.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { carregarRegras } from "./carregar_regras.mjs";
import { aplicarPatch } from "../../scripts/extracao/config_nova.mjs";
import { validarBuilds } from "../../scripts/validar_dados.mjs";

const R = carregarRegras({ milestone: 8, difficulty: "ace", levelCapMode: "more" });
const NIVEL = 55;
const json = (a) => JSON.parse(readFileSync(new URL("../../data/" + a, import.meta.url), "utf8"));
const patch = json("config_nova.json");
const sp = (n) => R.SPECIES.find((s) => s && s.n === n);
const id = (n) => R.MOVE_ID_BY_NAME[n];
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const golpe = (cat, extra) => Object.assign({ nome: "T", tipo: "Normal", cat, contato: false, prio: 0, precisao: 1, forcaBase: 80, forca: 80, poder: 80, status: [], cats: [], flags: [], crit: { estagio: 0, sempre: false }, recuo: 0, custoHP: 0, dreno: 0 }, extra || {});
const unid = (habs, tipos) => { const ids = habs.map(idHab); return { sp: { n: "T", sname: "S", inn: [], t: [0, 0] }, tipos, ids, abId: ids[0] ?? null, ab: habs[0] || "", ef: R.efeitoDasHabilidadesNoDuelo(ids, "V10_" + habs.join("+"), null), item: "", it: R.itemDoDuelo("", null), stats: [320, 100, 100, 100, 100, 100], golpesProntos: [golpe("F")], statusIds: [] }; };
const dano = (a, d) => R.danoNoDuelo(a, d, NIVEL).melhor.dano;

test("aprendizado pela config: 128 espécies mudam (level-up +105/-6, tutor +94/-15); retiradas valem; os tutores universais ficam como a NextDex", () => {
  const soma = { lm: 0, lmRem: 0, tu: 0, tuRem: 0 };
  for (const a of Object.values(patch.aprende)) for (const k of Object.keys(soma)) soma[k] += a[k].length;
  assert.equal(Object.keys(patch.aprende).length, 128);
  assert.deepEqual(soma, { lm: 105, lmRem: 6, tu: 94, tuRem: 15 });
  assert.ok(!sp("Arbok").lm.some((e) => e[0] === 61 && e[1] === id("Baneful Bunker")), "Arbok perdeu o Baneful Bunker no 61");
  assert.ok(!sp("Tentacool").tu.includes(id("Acid Armor")), "Tentacool perdeu o tutor Acid Armor");
  assert.ok(sp("Luxio").lm.some((e) => e[0] === 51 && e[1] === id("Arc Blast")), "Luxio ganhou o Arc Blast no 51");
  assert.ok(!sp("Bulbasaur").tu.includes(id("Snore")), "Snore (universal) fica como a NextDex");
  for (const a of Object.values(patch.aprende)) for (const n of a.tu.concat(a.tuRem)) assert.ok(!["Snore", "Metronome", "Rest", "Protect", "Return"].includes(n), n + " é universal");
});

test("builds: nenhuma build de data/builds.json perdeu golpe por causa do aprendizado novo (a validação não acha golpe fora da espécie)", () => {
  const r = validarBuilds();
  assert.deepEqual(r.problemas, []);
  assert.equal(r.pendentes.length, 259, "os 258 da v05 + Lanturn/Drizzle do v07; nenhum novo");
});

test("aplicarPatch: retira e põe golpe de level-up e de tutor; cria a Mega a partir da base e aponta a evolução da base para ela", () => {
  const dex = {
    types: ["Normal", "Water", "Psychic"], splits: ["PHYSICAL"], flags: [], abilities: [["-------", ""], ["Torrent", "x"], ["Dazzling", "y"]],
    moves: [null, ["Tackle", 0, 0, 40, 100, 35, "", 0, [], -1, 0, "Hit"], ["Surf", 1, 0, 90, 100, 15, "", 0, [], -1, 0, "Hit"]],
    species: [null, { x: 1, i: 1, n: "Peixe", sname: "SPECIES_PEIXE", t: [1], b: [50, 50, 50, 50, 50, 50], ab: [1], inn: [2], ev: [[1, "ITEM_PEIXITE", -1]], lm: [[1, 1], [5, 2]], tu: [2], d: "d", senc: [], wenc: null, frm: [], cab: 1 }],
  };
  const r = aplicarPatch(dex, { renomeadas: [], descricoes: {}, novas: [], especies: {}, golpes: [], aprende: { SPECIES_PEIXE: { lm: [[9, "Tackle"]], lmRem: [[5, "Surf"]], tu: [], tuRem: ["Surf"] } },
    especiesNovas: [{ sname: "SPECIES_PEIXE_MEGA", base: "SPECIES_PEIXE", pedraEnum: "ITEM_PEIXITE", tipos: ["WATER", "PSYCHIC"], b: [50, 60, 50, 50, 50, 70], ab: ["Torrent"], inn: ["Dazzling"], usaLearnset: "SPECIES_PEIXE" }] });
  assert.equal(r.aprende, 1); assert.equal(r.especiesNovas, 1);
  const peixe = dex.species[1], mega = dex.species[2];
  assert.deepEqual(peixe.lm, [[1, 1], [9, 1]]); assert.deepEqual(peixe.tu, []);
  assert.equal(mega.n, "Peixe Mega"); assert.equal(mega.x, 2); assert.deepEqual(mega.t, [1, 2]); assert.deepEqual(mega.lm, peixe.lm); assert.deepEqual(mega.ab, [1]); assert.deepEqual(mega.inn, [2]);
  assert.equal(peixe.ev[0][2], 2, "a base aponta para a Mega");
  aplicarPatch(dex, { renomeadas: [], descricoes: {}, novas: [], especies: {}, golpes: [], aprende: {}, especiesNovas: [{ sname: "SPECIES_PEIXE_MEGA", base: "SPECIES_PEIXE", pedraEnum: "ITEM_PEIXITE", tipos: ["WATER"], b: [1, 1, 1, 1, 1, 1], ab: ["Torrent"], inn: [], usaLearnset: "SPECIES_PEIXE" }] });
  assert.equal(dex.species.length, 3, "idempotente");
});

test("Lumberjack, Fae Hunter, Monster Hunter e Firefighter: x1,5 contra ALVO do tipo e x0,5 contra ATACANTE do tipo (não pelo tipo do golpe)", () => {
  const casos = [["Lumberjack", "Grass"], ["Fae Hunter", "Fairy"], ["Monster Hunter", "Dark"], ["Firefighter", "Fire"], ["Dragonslayer", "Dragon"], ["Insect Eater", "Bug"]];
  const plano = unid([], ["Normal"]);
  for (const [hab, tipo] of casos) {
    const dono = unid([hab], ["Normal"]);
    const ofensivo = dano(dono, unid([], [tipo])) / dano(plano, unid([], [tipo]));
    assert.ok(Math.abs(ofensivo - 1.5) < 1e-6, hab + " ofensivo: " + ofensivo);
    const defensivo = dano(unid([], [tipo]), dono) / dano(unid([], [tipo]), plano);
    assert.ok(Math.abs(defensivo - 0.5) < 1e-6, hab + " defensivo (atacante " + tipo + " com golpe Normal): " + defensivo);
    const golpeDoTipo = dano(Object.assign(unid([], ["Normal"]), { golpesProntos: [golpe("F", { tipo })] }), dono) / dano(Object.assign(unid([], ["Normal"]), { golpesProntos: [golpe("F", { tipo })] }), plano);
    assert.ok(golpeDoTipo > 0.99, hab + ": golpe do tipo vindo de atacante de outro tipo não é cortado (" + golpeDoTipo + ")");
    assert.equal(R.habilidadeSemRegraNoDuelo(idHab(hab)), false, hab);
  }
  assert.equal(R.abilityTypeModFor("Grass", ["Normal"], [idHab("Lumberjack")]).mult, 1, "a tabela de tipos não conta mais o Lumberjack pelo tipo do golpe");
});

test("Mega Bruxish e Mega Jellicent entram a partir da config: tipos, atributos (a config omite a Speed: vale a da base), habilidades, aprendizado da base, pedra e etapa", () => {
  assert.equal(R.DATA.species.length, 1925);
  const b = sp("Bruxish Mega"), j = sp("Jellicent Mega");
  assert.equal(b.sname, "SPECIES_BRUXISH_MEGA"); assert.equal(j.sname, "SPECIES_JELLICENT_MEGA");
  assert.deepEqual([...b.t].map((i) => R.TYPES[i]), ["Water", "Psychic"]); assert.deepEqual([...j.t].map((i) => R.TYPES[i]), ["Water", "Ghost"]);
  assert.deepEqual([...b.b], [68, 105, 70, 70, 70, 92]); assert.deepEqual([...j.b], [120, 60, 70, 85, 105, 60]);
  assert.deepEqual([...b.ab, ...b.inn].map((i) => R.ABILITIES[i][0]), ["Dazzling", "Defiant", "Predator", "Strong Jaw", "Wonder Skin", "Psychic Mind"]);
  assert.deepEqual([...j.ab, ...j.inn].map((i) => R.ABILITIES[i][0]), ["Cursed Body", "Clear Body", "Immunity", "Water Bubble", "Soul Eater", "Poison Touch"]);
  assert.deepEqual(b.lm, sp("Bruxish").lm); assert.deepEqual(j.tu, sp("Jellicent").tu);
  assert.equal(R.MEGA_FORMS["Bruxishite"], "SPECIES_BRUXISH_MEGA"); assert.equal(R.MEGA_FORMS["Jellicentite"], "SPECIES_JELLICENT_MEGA");
  assert.equal(sp("Bruxish").ev[0][2], b.x); assert.equal(sp("Jellicent").ev[0][2], j.x);
  const rd = json("rank_disponibilidade.json");
  assert.ok(Number.isInteger(rd.etapa["SPECIES_BRUXISH_MEGA"]));
  assert.ok(Number.isInteger(rd.etapa["SPECIES_JELLICENT_MEGA"]));
  const pend = json("rank_pendente_ate_10.json").novasSemRank;
  assert.ok(pend.includes("SPECIES_BRUXISH_MEGA") && pend.includes("SPECIES_JELLICENT_MEGA"), "sem rank até o fechamento");
});
