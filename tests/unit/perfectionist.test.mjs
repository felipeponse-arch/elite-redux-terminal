// Ticket 08 (07/10/2026): Perfectionist pelo código oficial (abilities.cc Impl<ABILITY_PERFECTIONIST>):
// golpe de até 50 de poder ganha +1 de crítico (já lido) e de até 25, +1 de prioridade (faltava -
// o Beniccino, forte na comunidade, ficava em C: Tail Slap com Pixilate + Skill Link sem prioridade).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 9 });
const unid = (habs) => ({ ef: R.efeitoDasHabilidadesNoDuelo(habs.map((n) => R.ABILITY_ID_BY_NAME[n]), "PF_" + habs.join("+"), null), tipos: ["Normal"], stats: [300, 100, 100, 100, 100, 100], ids: [], item: "" });
const golpe = (u, n) => R.prepararGolpesDuelo([R.MOVE_ID_BY_NAME[n]], u, null)[0];

test("Perfectionist: golpe de até 25 de poder ganha +1 de prioridade; de 26 em diante, não", () => {
  const u = unid(["Perfectionist"]);
  assert.equal(golpe(u, "Tail Slap").prio, 1); // 25
  assert.equal(golpe(u, "Bullet Seed").prio, 1); // 25
  assert.equal(golpe(u, "Rock Blast").prio, 1); // 25
  assert.equal(golpe(u, "Tackle").prio, 0);
  assert.equal(golpe(unid([]), "Tail Slap").prio, 0, "sem a habilidade, sem prioridade");
});

test("Beniccino (Pixilate + Skill Link + Perfectionist): Tail Slap Fairy, 5 acertos, +1 de prioridade e de crítico", () => {
  const g = golpe(unid(["Pixilate", "Skill Link", "Perfectionist"]), "Tail Slap");
  assert.equal(g.tipo, "Fairy");
  assert.equal(g.acertos, 5);
  assert.equal(g.prio, 1);
  assert.equal(g.crit.estagio, 1);
});
