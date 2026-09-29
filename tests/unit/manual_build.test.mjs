// Manual de build competitivo (reunião de 2026-09-28): regras gerais de nature,
// cobertura e EVs no prompt, combinações só das habilidades que a espécie tem
// e duas travas novas (nature contra a própria build, Black Sludge fora de
// tipo Poison). Fixtures achadas no dado real.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const nomeHab = (id) => (R.ABILITIES[id] ? R.ABILITIES[id][0] : "");
const comHabilidade = (hab) => R.SPECIES.find((s) => s && R.uniqueIds((s.ab || []).concat(s.inn || [])).some((id) => nomeHab(id) === hab));
const golpesDe = (sp, split) => R.availableMovesFor(sp).names.filter((m) => R.moveRoleOf(m) === "dano" && R.DATA.splits[R.MOVE_BY_NAME[m][2]] === split);

beforeEach(() => {
  R.state.settings.milestone = 9;
  R.state.team = []; R.state.customBuilds = {};
  R.state.archetype = { pace: null, weather: null, monotype: null, tatica: null, reasoning: "" };
});

test("nature que reduz o ataque usado por todos os golpes de dano é conflito; a certa passa", () => {
  const sp = R.SPECIES.find((s) => s && golpesDe(s, "PHYSICAL").length >= 4 && golpesDe(s, "SPECIAL").length >= 4);
  assert.ok(sp, "fixture: espécie com 4 golpes físicos e 4 especiais");
  const fis = golpesDe(sp, "PHYSICAL").slice(0, 4), esp = golpesDe(sp, "SPECIAL").slice(0, 4);
  assert.match(R.conflitoDeNature("Modest", fis, null), /reduz o Ataque/);
  assert.equal(R.conflitoDeNature("Adamant", fis, null), null);
  assert.match(R.conflitoDeNature("Adamant", esp, null), /reduz o Ataque Especial/);
  assert.equal(R.conflitoDeNature("Modest", esp, null), null);
  // Build mista não reprova (a nature pode reduzir um dos lados de propósito).
  assert.equal(R.conflitoDeNature("Modest", fis.slice(0, 2).concat(esp.slice(0, 2)), null), null);
});

test("Sweeper com nature que reduz Velocidade é conflito, salvo em Trick Room", () => {
  const sp = R.SPECIES.find((s) => s && golpesDe(s, "PHYSICAL").length >= 4);
  const fis = golpesDe(sp, "PHYSICAL").slice(0, 4);
  assert.match(R.conflitoDeNature("Brave", fis, "Sweeper"), /Velocidade de um Sweeper/);
  R.state.archetype.weather = "Trick Room";
  assert.equal(R.conflitoDeNature("Brave", fis, "Sweeper"), null);
});

test("Black Sludge fora de tipo Poison é conflito (\"Damages others\")", () => {
  const poison = R.SPECIES.find((s) => s && R.speciesTypeNames(s).includes("Poison"));
  const outro = R.SPECIES.find((s) => s && !R.speciesTypeNames(s).includes("Poison"));
  assert.match(R.conflitoDeItem("Black Sludge", [], outro), /Black Sludge causa dano/);
  assert.equal(R.conflitoDeItem("Black Sludge", [], poison), null);
});

test("o prompt traz o manual e só as combinações das habilidades da espécie", () => {
  const tecnico = comHabilidade("Technician");
  assert.ok(tecnico, "fixture: espécie com Technician");
  const p = R.montarPromptBuild(tecnico, {});
  assert.match(p, /MANUAL DE BUILD \(regras gerais\)/);
  assert.match(p, /- Technician \(golpe de 60 de poder ou menos x1,5\)/);
  const semCombo = R.SPECIES.find((s) => s && !R.uniqueIds((s.ab || []).concat(s.inn || [])).some((id) => R.MANUAL_POR_HABILIDADE[nomeHab(id)]));
  const p2 = R.montarPromptBuild(semCombo, {});
  assert.match(p2, /MANUAL DE BUILD/);
  assert.doesNotMatch(p2, /COMBINACOES DAS HABILIDADES DESTA ESPECIE/);
  assert.match(R.montarPromptEstrategias(tecnico), /- Technician/);
});
