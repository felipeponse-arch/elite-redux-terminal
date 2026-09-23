// Build salva que muda de espécie (auto-evolução) ou chega de um save antigo precisa
// valer pra espécie ATUAL. Achado do usuário (print, 2026-09-24): Haxorus com
// "Ability: Moxie", que só Axew e Fraxure têm.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();

function especie(sname) {
  const sp = R.getSpeciesBySname(sname);
  assert.ok(sp, "espécie " + sname + " existe no dado");
  return sp;
}
function escolhiveis(sp) { return R.uniqueIds(sp.ab).map((id) => R.ABILITIES[id][0]); }
function build(ability, moves) {
  return { ability, nature: "Adamant", item: "Choice Band", moves, ivs: [31, 31, 31, 31, 31, 31], evs: [0, 252, 0, 0, 0, 252], source: "ia", active: true, savedAt: "x", rationale: "r" };
}

test("pré-condição real do print: Moxie é de Axew/Fraxure e não do Haxorus", () => {
  assert.ok(escolhiveis(especie("SPECIES_FRAXURE")).includes("Moxie"));
  assert.ok(!escolhiveis(especie("SPECIES_HAXORUS")).includes("Moxie"));
});

test("build de Fraxure levada pro Haxorus troca a habilidade que ele não tem e mantém o resto", () => {
  const hax = especie("SPECIES_HAXORUS");
  const b = build("Moxie", ["Dragon Claw", "Earthquake", "Stone Edge", "Iron Tail"]);
  const r = R.reconciliarBuild(b, hax);
  assert.ok(escolhiveis(hax).includes(r.build.ability), "a nova habilidade é uma escolhível real do Haxorus: " + r.build.ability);
  assert.notEqual(r.build.ability, "Moxie");
  assert.equal(r.changes.length, 1);
  assert.equal(r.changes[0].campo, "habilidade");
  assert.equal(r.changes[0].de, "Moxie");
  assert.equal(r.build.moves.join(","), "Dragon Claw,Earthquake,Stone Edge,Iron Tail", "os 4 golpes valem no Haxorus e ficam");
  assert.equal(r.build.item, "Choice Band");
  assert.equal(r.build.nature, "Adamant");
  assert.equal(b.ability, "Moxie", "a build original nunca é alterada");
  assert.equal(r.build.rationale, "", "a justificativa citava a habilidade antiga, então sai");
  assert.equal(b.rationale, "r");
});

test("build que já vale volta idêntica, sem nenhuma mudança", () => {
  const hax = especie("SPECIES_HAXORUS");
  const b = build("Sheer Force", ["Dragon Claw", "Earthquake"]);
  const r = R.reconciliarBuild(b, hax);
  assert.equal(r.changes.length, 0);
  assert.equal(r.build.ability, "Sheer Force");
  assert.equal(r.build.moves.join(","), "Dragon Claw,Earthquake");
});

test("golpe que a espécie nova não aprende sai, os outros ficam", () => {
  const hax = especie("SPECIES_HAXORUS");
  const pool = R.movepoolCompletoDe(hax);
  const fora = Object.keys(R.MOVE_BY_NAME).find((n) => !pool[n] && R.moveRoleOf(n) === "dano");
  assert.ok(fora, "pré-condição: existe golpe de dano que o Haxorus não aprende");
  const r = R.reconciliarBuild(build("Sheer Force", ["Dragon Claw", fora]), hax);
  assert.equal(r.build.moves.join(","), "Dragon Claw");
  assert.ok(r.changes.some((c) => c.campo === "golpes" && c.de === fora));
});

test("golpe acima do level cap ainda é golpe válido da espécie (só o que ela NUNCA aprende sai)", () => {
  const hax = especie("SPECIES_HAXORUS");
  const nivelMax = Math.max(...hax.lm.map((p) => p[0]));
  const golpeAlto = hax.lm.filter((p) => p[0] === nivelMax).map((p) => R.MOVES[p[1]][0])[0];
  const r = R.reconciliarBuild(build("Sheer Force", [golpeAlto]), hax);
  assert.equal(r.changes.length, 0, golpeAlto + " (nível " + nivelMax + ")");
});

test("a habilidade nova prefere a que tem sinergia ativa com os golpes que ficaram", () => {
  let achado = null;
  for (const sn of Object.keys(R.ABILITY_SYNERGY)) {
    const sp = R.getSpeciesBySname(sn);
    if (!sp) continue;
    const esc = escolhiveis(sp);
    const hit = R.ABILITY_SYNERGY[sn].find((h) => h.kind !== "inn" && esc.includes(h.name) && esc[0] !== h.name && (h.golpes || []).length);
    if (hit) { achado = { sp, hit }; break; }
  }
  assert.ok(achado, "pré-condição: existe espécie com sinergia numa escolhível que NÃO é a primeira");
  const golpe = achado.hit.golpes[0];
  const r = R.reconciliarBuild(build("Habilidade Que Nao Existe", [golpe]), achado.sp);
  assert.equal(r.build.ability, achado.hit.name, achado.sp.n + " com " + golpe);
});

test("build sem habilidade preenchida não é 'consertada' (só o que está errado muda)", () => {
  const hax = especie("SPECIES_HAXORUS");
  const r = R.reconciliarBuild(build("", ["Dragon Claw"]), hax);
  assert.equal(r.changes.length, 0);
  assert.equal(r.build.ability, "");
});
