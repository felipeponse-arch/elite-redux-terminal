// Depende de dado: rank/lutas (muda quando o rank é recalculado; não é regra de jogo fixa).
// Ticket versao-nova/10 (15/10/2026): o que sobrou da config d1a9a4c depois do v09 - aprendizado de golpes de TODAS as espécies, os quatro "Hunter/jack" pelo tipo
// de quem ataca (abilities.cc:5752 Lumberjack, Fae Hunter, Monster Hunter, Firefighter; mesma família do Dragonslayer e do Insect Eater) e as Mega Bruxish e Jellicent.
import { N_ESPECIES } from "./contagens_versao.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { carregarRegras } from "./carregar_regras.mjs";
import { aplicarPatch } from "../../scripts/extracao/config_nova.mjs";
import { validarBuilds } from "../../scripts/validar_dados.mjs";
import { conferirProvisorias, PRECISA_REVISAR } from "../../scripts/extracao/provisorias.mjs";

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

test("aprendizado pela config: 3 espécies mudam (level-up +3/-3, tutor +0/-1), config b58ea4d; retiradas valem; os tutores universais ficam como a NextDex", () => {
  const soma = { lm: 0, lmRem: 0, tu: 0, tuRem: 0 };
  for (const a of Object.values(patch.aprende)) for (const k of Object.keys(soma)) soma[k] += a[k].length;
  // 2.65.5 (03/11/2026): a NextDex já traz o aprendizado da config 486a964 (eram 359 espécies); o delta da b58ea4d sobra em Ninetales, Kecleon e Kecleong (data/config_nova.json)
  assert.deepEqual(Object.keys(patch.aprende), ["SPECIES_NINETALES", "SPECIES_KECLEON", "SPECIES_KECLEONG"]);
  assert.deepEqual(soma, { lm: 3, lmRem: 3, tu: 0, tuRem: 1 });
  assert.ok(!sp("Arbok").lm.some((e) => e[0] === 61 && e[1] === id("Baneful Bunker")), "Arbok perdeu o Baneful Bunker no 61");
  assert.ok(!sp("Tentacool").tu.includes(id("Acid Armor")), "Tentacool perdeu o tutor Acid Armor");
  assert.ok(sp("Luxio").lm.some((e) => e[0] === 51 && e[1] === id("Arc Blast")), "Luxio ganhou o Arc Blast no 51");
  assert.ok(!sp("Bulbasaur").tu.includes(id("Snore")), "Snore (universal) fica como a NextDex");
  for (const a of Object.values(patch.aprende)) for (const n of a.tu.concat(a.tuRem)) assert.ok(!["Snore", "Metronome", "Rest", "Protect", "Return"].includes(n), n + " é universal");
});

test("builds: nenhuma build de data/builds.json perdeu golpe por causa do aprendizado novo (a validação não acha golpe fora da espécie)", () => {
  const r = validarBuilds();
  assert.deepEqual(r.problemas, []);
  assert.equal(r.pendentes.length, 242, "Ticket 44 (04/11): as 5 builds refeitas (Kecleon, Sawsbuck, Greninja Mega, Garchomp Mega Redux, Duraludon Partner Mega) saíram dos pendentes (252 - 5 de habilidade/golpe - 5 de versão = 242). v2.65.5 (03/11): 247 + 5 builds sem habilidade/golpe na NextDex 2.65.5 foram para pendentes (commit 122f827). v2.65.4.1 (28/10): lista regerada com a versão 2.65.4.1 (toda build validada antes volta a pedir revisão + 5 de habilidade perdida na config nova). Histórico: 259 antes de saírem as 14 builds da curadoria do projeto; 244 depois; 230 quando dados-2654/08 corrigiu as 14 da tabela A; 211 quando os 19 sets revisados (14 + Breezing, Exeggutor Redux, Arbok, Heliosunny, Victreebel Redux) passaram a versão 2.65.4; nenhuma nova");
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

test("Mega Bruxish e Mega Jellicent: no dado a partir da config, como as demais Megas (decisão do usuário, 28/10: entram na Dex, nas builds e no pipeline; a config não traz spe, vale a da base)", () => {
  // Fixture: a config 486a964 traz as duas sem spe; o usuário mandou trazê-las mesmo assim (spe da espécie base, speDaConfig:false).
  assert.equal(R.DATA.species.length, N_ESPECIES);
  const b = R.DATA.species.find((s) => s && s.sname === "SPECIES_BRUXISH_MEGA"), j = R.DATA.species.find((s) => s && s.sname === "SPECIES_JELLICENT_MEGA");
  assert.ok(b && j, "estão no dado"); assert.ok(!b.provisoria && !j.provisoria, "sem marca provisoria");
  assert.deepEqual([...b.t].map((i) => R.TYPES[i]), ["Water", "Psychic"]); assert.deepEqual([...j.t].map((i) => R.TYPES[i]), ["Water", "Ghost"]);
  assert.deepEqual([...b.b], [68, 105, 70, 70, 70, 92]); assert.deepEqual([...j.b], [120, 60, 70, 85, 105, 60]);
  assert.deepEqual([...b.ab, ...b.inn].map((i) => R.ABILITIES[i][0]), ["Dazzling", "Defiant", "Predator", "Strong Jaw", "Wonder Skin", "Psychic Mind"]);
  assert.deepEqual(b.lm, sp("Bruxish").lm); assert.deepEqual(j.tu, sp("Jellicent").tu);
  assert.equal(R.MEGA_FORMS["Bruxishite"], "SPECIES_BRUXISH_MEGA"); assert.equal(sp("Bruxish").ev[0][2], b.x);
  assert.equal(R.SPECIES.length, N_ESPECIES - 1); // as 1941 do dado menos a posição vazia
  assert.equal(R.getSpeciesBySname("SPECIES_JELLICENT_MEGA").x, j.x); assert.equal(R.getSpeciesByX(b.x).sname, "SPECIES_BRUXISH_MEGA");
  const role = json("species_role.json"), disp = json("rank_disponibilidade.json").etapa;
  assert.ok("SPECIES_BRUXISH_MEGA" in role && "SPECIES_JELLICENT_MEGA" in role);
  assert.equal(disp.SPECIES_BRUXISH_MEGA, 7); assert.equal(disp.SPECIES_JELLICENT_MEGA, 7); // pedra na Etapa 7 (sala do totem)
  assert.ok(json("rank_pendente_ate_10.json").novasSemRank.includes("SPECIES_BRUXISH_MEGA"), "rank real sai no rank completo da integração");
});

test("conferirProvisorias: avisa quando a config passa a ter os 6 atributos (ou sumir) e fica quieta enquanto está incompleta", () => {
  const dex = json("dex_compact.json");
  // Fixture: o dado real não tem mais provisórias (as 2 Megas entraram, 28/10); o conferidor segue valendo para a próxima, então marca as duas só em memória.
  dex.species.forEach((s) => { if (s && /^SPECIES_(BRUXISH|JELLICENT)_MEGA$/.test(s.sname)) s.provisoria = "fixture"; });
  const bloco = (sname, stats) => "species {\n  id: " + sname + "\n" + stats + "  type: TYPE_WATER\n}\n";
  const b = dex.species.find((s) => s && s.sname === "SPECIES_BRUXISH_MEGA").b;
  const cheio = (b2) => ["hp", "atk", "def", "spatk", "spdef", "spe"].map((k, i) => "  " + k + ": " + b2[i] + "\n").join("");
  const incompleto = bloco("SPECIES_BRUXISH_MEGA", cheio(b).replace(/ {2}spe: \d+\n/, "")) + bloco("SPECIES_JELLICENT_MEGA", cheio([1, 1, 1, 1, 1, 1]).replace(/ {2}spe: \d+\n/, ""));
  const estado = (txt, sn) => conferirProvisorias(dex, txt).find((e) => e.sname === sn).estado;
  assert.equal(estado(incompleto, "SPECIES_BRUXISH_MEGA"), "incompleta");
  assert.ok(!conferirProvisorias(dex, incompleto).some((e) => PRECISA_REVISAR.has(e.estado)));
  assert.equal(estado(bloco("SPECIES_BRUXISH_MEGA", cheio([68, 105, 70, 90, 70, 100])) + bloco("SPECIES_JELLICENT_MEGA", ""), "SPECIES_BRUXISH_MEGA"), "numeros-novos");
  assert.equal(estado(bloco("SPECIES_BRUXISH_MEGA", cheio(b)) + bloco("SPECIES_JELLICENT_MEGA", ""), "SPECIES_BRUXISH_MEGA"), "completa-igual-ao-dado");
  assert.equal(estado(bloco("SPECIES_BRUXISH_MEGA", cheio(b)), "SPECIES_JELLICENT_MEGA"), "sumiu-da-config");
  // contra a config de verdade, se estiver à mão
  try {
    const real = readFileSync("/home/user/elite-redux/er-config/SpeciesList.textproto", "utf8");
    assert.ok(!conferirProvisorias(dex, real).some((e) => PRECISA_REVISAR.has(e.estado)), "a config d1a9a4c segue incompleta para as duas");
  } catch (e) { if (e.code !== "ENOENT") throw e; }
});
