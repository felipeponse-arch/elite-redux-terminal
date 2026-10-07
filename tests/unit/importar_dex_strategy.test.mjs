// Importador das estratégias oficiais do código do jogo (src/data/dex-strategy.md), achado da pesquisa profunda de 06/10.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { lerBlocos, montarIndice, converter, juntar } from "../../scripts/importar_dex_strategy.mjs";
import { validarBuilds } from "../../scripts/validar_dados.mjs";

const dex = JSON.parse(readFileSync(new URL("../../data/dex_compact.json", import.meta.url), "utf8"));
const ind = montarIndice(dex, null);
const um = (texto) => converter(lerBlocos(texto)[0], ind);

const VENUSAUR = [
  "SPECIES_VENUSAUR", "{",
  "    .name = Physical Tank",
  "    .heldItem = ITEM_LEFTOVERS,",
  "    .ability = 0, // ABILITY_CHLOROPLAST, ABILITY_EFFECT_SPORE, ABILITY_CHLOROPHYLL},",
  "    .evs = {252, 0, 252, 0, 4, 0},",
  "    .nature = NATURE_BOLD,",
  "    .moves = MOVE_SOLAR_BEAM, MOVE_SLUDGE_BOMB, MOVE_LEECH_SEED, MOVE_SLEEP_POWDER",
  "    .tags = Singles, Defensive", "}"].join("\n");

test("formato com SPECIES_X, ability por número + comentário e EVs em chaves", () => {
  const r = um(VENUSAUR);
  assert.equal(r.ok, true, r.motivo);
  assert.equal(r.sname, "SPECIES_VENUSAUR");
  assert.equal(r.build.ability, "Chloroplast"); assert.equal(r.build.item, "Leftovers"); assert.equal(r.build.nature, "Bold");
  assert.equal(r.build.evs, "252 HP / 252 Def / 4 SpD");
  assert.equal(r.build.moves.length, 4);
  assert.equal(r.estiloPref, "defensivo");
  assert.equal(r.build.fonte, "dex-strategy-do-jogo");
});

test("formato livre: nome do Pokémon, opções com barra e natureza em texto", () => {
  const r = um(["Weavile", "{", "    name = Sash Sweeper", "    item = Focus Sash / Life Orb", "    ability = Hyper Aggressive", "    evs = 0, 252, 4, 0, 0, 252", "    nature = Jolly / Adamant", "    moves = Swords Dance, Triple Axel, Knock Off / Ice Spinner, Ice Shard", "    tags = Singles, Offensive", "}"].join("\n"));
  assert.equal(r.ok, true, r.motivo);
  assert.equal(r.build.item, "Focus Sash"); assert.equal(r.build.nature, "Jolly");
  assert.match(r.build.note, /Opções do autor que ficaram de fora/);
});

test("recusas: Troll, só dupla, espécie inexistente, habilidade não escolhível, golpe fora do pool, EVs acima, slots != 4", () => {
  const base = (extra) => ["Venusaur", "{", "    item = Leftovers", "    ability = Chlorophyll", "    evs = 252, 0, 252, 0, 4, 0", "    nature = Bold", "    moves = Solar Beam, Sludge Bomb, Leech Seed, Sleep Powder"].concat(extra || []).concat(["}"]).join("\n");
  assert.equal(um(base(["    tags = Singles, Troll"])).ok, false);
  assert.match(um(base(["    tags = Doubles"])).motivo, /só de dupla/);
  assert.match(um(base().replace("Venusaur", "Nomequenaoexiste")).motivo, /não encontrada/);
  assert.match(um(base().replace("Chlorophyll", "Intimidate")).motivo, /habilidade/);
  assert.match(um(base().replace("Solar Beam", "Judgment")).motivo, /nenhum golpe do slot/);
  assert.match(um(base().replace("252, 0, 252, 0, 4, 0", "252, 252, 252, 0, 4, 0")).motivo, /EVs/);
  assert.match(um(base().replace(", Sleep Powder", "")).motivo, /3 slots/);
});

test("juntar: máximo 3 por espécie, estilos únicos, sem repetir build igual", () => {
  const r = um(VENUSAUR);
  const outro = (m) => Object.assign({}, r, { build: Object.assign({}, r.build, { moves: m }) });
  const j1 = juntar({}, [r]);
  assert.equal(j1.aceitos.length, 1);
  const j2 = juntar(j1.builds, [r]);
  assert.equal(j2.recusados[0].motivo, "já existe build igual");
  const m2 = ["Solar Beam", "Sludge Bomb", "Earth Power", "Sleep Powder"], m3 = ["Solar Beam", "Sludge Bomb", "Synthesis", "Sleep Powder"], m4 = ["Solar Beam", "Sludge Bomb", "Giga Drain", "Sleep Powder"];
  const j3 = juntar(j2.builds, [outro(m2), outro(m3), outro(m4)]);
  const lista = [].concat(j3.builds.SPECIES_VENUSAUR);
  assert.equal(lista.length, 3, "no máximo 3");
  assert.equal(new Set(lista.map((b) => b.estilo)).size, 3, "um por estilo");
  assert.equal(j3.recusados.some((x) => /já tem 3/.test(x.motivo)), true);
});

test("o builds.json real continua válido (habilidade escolhível, golpes da espécie, fonte e versão)", () => {
  const r = validarBuilds();
  assert.equal(JSON.stringify(r.problemas), "[]");
});
