// TK-22: mega_forms.json segue o jogo (SpeciesList/MegaStonesList do er-config 486a964), inclusive pedras de 2 alvos.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const MEGA = JSON.parse(readFileSync(new URL("../../data/mega_forms.json", import.meta.url), "utf8"));
const de = (sname, item) => R.megaDaPedra(item, R.getSpeciesBySname(sname));

test("as 3 pedras que o app tinha erradas apontam para a forma do jogo", () => {
  assert.equal(MEGA["Meowscaradite"], "SPECIES_MEOWSCARADA_MEGA");
  assert.equal(MEGA["Dragapultite"], "SPECIES_DRAGAPULT_MEGA");
  assert.equal(MEGA["Abomasite S"], "SPECIES_ABOMASNOW_SANTA");
});

test("pedra de 2 alvos: a forma sai da espécie atual (battle_util.c:8128)", () => {
  assert.equal(de("SPECIES_AEGISLASH_REDUX", "Aegislashite R"), "SPECIES_AEGISLASH_REDUX_MEGA");
  assert.equal(de("SPECIES_AEGISLASH_BLADE_REDUX", "Aegislashite R"), "SPECIES_AEGISLASH_BLADE_REDUX_MEGA");
  assert.equal(de("SPECIES_TOXTRICITY_REDUX", "Toxtricitite R"), "SPECIES_TOXTRICITY_REDUX_MEGA");
  assert.equal(de("SPECIES_TOXTRICITY_REDUX_FUZZ", "Toxtricitite R"), "SPECIES_TOXTRICITY_REDUX_FUZZ_MEGA");
  assert.equal(de("SPECIES_ABOMASNOW", "Abomasite"), "SPECIES_ABOMASNOW_MEGA"); // pedra de 1 alvo segue igual
});

test("cada Mega de pedra de 2 alvos lista a pedra", () => {
  for (const sn of ["SPECIES_AEGISLASH_BLADE_REDUX_MEGA", "SPECIES_TOXTRICITY_REDUX_MEGA"]) assert.ok(R.stonesOf(R.getSpeciesBySname(sn)).length, sn);
});

test("conferidor do jogo: só sobram Excadrillite-R (sem Mega no jogo) e os 2 sem alvo no dado bruto", () => {
  const out = execFileSync("node", ["scripts/gerar_mega_forms.mjs", "--conferir"], { cwd: new URL("../..", import.meta.url), encoding: "utf8" });
  assert.deepEqual(out.split("\n").filter((l) => /^(diverge|só no arquivo|sem alvo)/.test(l)).map((l) => l.split(":")[1].split(" ->")[0].trim()),
    ["Excadrillite-R", "Bruxishite", "Jellicentite"]);
});
