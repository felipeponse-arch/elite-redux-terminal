// Ticket mecanica-2026-10-22/01: "X moves always hit" não vale para todos os golpes; Plasma Lamp tem precisão x1,2 em Fire/Electric.
// Fonte: abilities.cc (er-repo upcoming 217dd0f): Pinnacle Blade 8661-8692 (sem onAccuracy), Artillery/Sweeping Edge (onAccuracy só no grupo), Plasma Lamp 6056.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 8, difficulty: "ace", levelCapMode: "more" });
const sp = (n) => R.SPECIES.find((s) => s && s.n === n);
const perto = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, a + " x " + b);

// Espécie real com a habilidade posta no lugar da dela (padrão de best_offense_pelo_codigo).
function prec(especie, hab, golpe) {
  const u = R.unidadeDaBuild(sp(especie), { ability: "Run Away", nature: "Hardy", evs: [0, 0, 0, 0, 0, 0], item: "", moves: [golpe] }, 55, null);
  const ids = [R.ABILITY_ID_BY_NAME[hab]];
  u.ids = ids; u.ab = hab; u.abId = ids[0];
  u.ef = R.efeitoDasHabilidadesNoDuelo(ids, "SA_" + hab, null);
  u.golpeIds = [R.MOVE_ID_BY_NAME[golpe]]; u.golpesProntos = R.prepararGolpesDuelo(u.golpeIds, u, null);
  return u.golpesProntos[0].precisao;
}

test("Pinnacle Blade (Kartana Fallen) não ganha sempre-acerta: Stone Edge fica em 90", () => {
  const u = R.efeitoDasHabilidadesNoDuelo([R.ABILITY_ID_BY_NAME["Pinnacle Blade"]], "SA_pb", null);
  assert.equal(u.semErrar, false);
  perto(prec("Kartana Fallen", "Pinnacle Blade", "Stone Edge"), 0.9); // antes do ajuste: 1
});

test("Sweeping Edge (Honedge): sempre acerta só em corte, não em Hydro Pump (85)", () => {
  assert.equal(R.efeitoDasHabilidadesNoDuelo([R.ABILITY_ID_BY_NAME["Sweeping Edge"]], "SA_se", null).semErrar, false);
  const ef = R.efeitoDasHabilidadesNoDuelo([R.ABILITY_ID_BY_NAME["Sweeping Edge"]], "SA_se", null);
  assert.equal(ef.semErrarCategoria.corte, true); // nenhum golpe de corte do jogo tem precisão < 100: vale a marca da categoria
  assert.equal(ef.semErrarCategoria.pulso, undefined);
  perto(prec("Honedge", "Sweeping Edge", "Stone Edge"), 1); // Stone Edge é Keen Edge no jogo
  perto(prec("Honedge", "Sweeping Edge", "Hydro Pump"), 0.85);
});

test("Artillery (Octillery): sempre acerta só no Mega Launcher (Inferno 50 -> 100), não em Fire Blast (85)", () => {
  assert.equal(R.efeitoDasHabilidadesNoDuelo([R.ABILITY_ID_BY_NAME.Artillery], "SA_ar", null).semErrar, false);
  perto(prec("Octillery", "Artillery", "Inferno"), 1);
  perto(prec("Octillery", "Artillery", "Fire Blast"), 0.85);
});

test("Sighting System continua sempre acerta global; Skill Link e Gifted Mind não ligam semErrar", () => {
  assert.equal(R.efeitoDasHabilidadesNoDuelo([R.ABILITY_ID_BY_NAME["Sighting System"]], "SA_ss", null).semErrar, true);
  assert.equal(R.efeitoDasHabilidadesNoDuelo([R.ABILITY_ID_BY_NAME["Skill Link"]], "SA_sl", null).semErrar, false);
  assert.equal(R.efeitoDasHabilidadesNoDuelo([R.ABILITY_ID_BY_NAME["Gifted Mind"]], "SA_gm", null).semErrar, false);
  // o semErrar global age no cálculo de acerto (precisaoAtq), não em g.precisao
});

test("Plasma Lamp (Rotom): precisão x1,2 em Fire/Electric, nenhuma em Normal; poder x1,2 mantido", () => {
  perto(prec("Rotom", "Plasma Lamp", "Zap Cannon"), 0.6); // Electric 50 x 1,2
  perto(prec("Rotom", "Plasma Lamp", "Inferno"), 0.6); // Fire 50 x 1,2
  perto(prec("Rotom", "Plasma Lamp", "Fire Blast"), 1); // 85 x 1,2 = 102 -> 100
  perto(prec("Rotom", "Plasma Lamp", "Hydro Pump"), 0.85); // Water: sem bônus
  const ef = R.efeitoDasHabilidadesNoDuelo([R.ABILITY_ID_BY_NAME["Plasma Lamp"]], "SA_pl", null);
  perto(ef.bonusTipo.Fire, 1.2); perto(ef.bonusTipo.Electric, 1.2);
});
