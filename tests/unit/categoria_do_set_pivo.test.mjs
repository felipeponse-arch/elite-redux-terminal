// Pivô fica FORA da regra de categoria (decisão do usuário, 13/11, pacote 12): Mega Blastoise é especial e o pivô pode ser físico
// (Flip Turn/U-turn). Sem essa exceção, o pivô F sumiria do set Especial e a build focada do Pivô ficaria sem pivô.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 4, difficulty: "ace", levelCapMode: "more" });
const BLASTOISE_MEGA = "SPECIES_BLASTOISE_MEGA";

test("Mega Blastoise (especial) Pivô: o set continua Especial e leva pivô FÍSICO (Flip Turn), sem o filtro de categoria no pivô", () => {
  const r = R.buildFocadaDoMotor(BLASTOISE_MEGA, "Pivo");
  assert.equal(r.ok, true);
  const e = r.build.evs;
  assert.ok(e[3] > e[1], "set especial (EV de SpAtk > Atk): " + e.join());
  const pivos = r.build.golpes.filter((g) => R.ehGolpeDePivo(g));
  const fisicos = pivos.filter((g) => R.MOVES[R.MOVE_ID_BY_NAME[g]][2] === 0);
  assert.ok(fisicos.length >= 1, "pivô físico no set especial: " + r.build.golpes.join("/"));
});
