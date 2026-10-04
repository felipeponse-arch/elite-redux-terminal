// Efeitos de golpe da lista "sem regra" que pesavam em builds e chefes (03/10): Thunder/Hurricane no clima
// (código oficial: chuva sempre acerta, sol 50%), Axe Kick (dano ao errar) e Thousand Arrows (acerta Flying).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 9 });
const ef = R.efeitoDasHabilidadesNoDuelo([], "x", null);
const unid = (tipos) => ({ ef, tipos, stats: [300, 100, 100, 100, 100, 100], ids: [] });
const golpe = (nome, u, clima) => R.prepararGolpesDuelo([R.MOVE_ID_BY_NAME[nome]], u, clima || null)[0];

test("Thunder e Hurricane: chuva = sempre acerta, sol = 50%, sem clima = a precisão do golpe", () => {
  for (const n of ["Thunder", "Hurricane"]) {
    const base = golpe(n, unid(["Electric"])).precisao;
    assert.ok(base > 0.5 && base < 1, n + " sem clima: " + base);
    assert.equal(golpe(n, unid(["Electric"]), "chuva").precisao, 1);
    assert.equal(golpe(n, unid(["Electric"]), "sol").precisao, 0.5);
  }
  assert.equal(golpe("Surf", unid(["Water"]), "sol").precisao, golpe("Surf", unid(["Water"])).precisao, "golpe comum não muda com o clima");
});

test("Axe Kick: errar custa metade do HP máximo em média (1 - precisão) / 2 por uso", () => {
  const g = golpe("Axe Kick", unid(["Fighting"]));
  assert.ok(Math.abs(g.custoHP - (1 - g.precisao) * 0.5) < 1e-9, "custoHP " + g.custoHP);
  assert.equal(golpe("Close Combat", unid(["Fighting"])).custoHP, 0, "golpe comum sem custo");
});

test("Thousand Arrows acerta Flying (Earthquake não)", () => {
  const atq = unid(["Ground"]);
  atq.golpesProntos = [golpe("Thousand Arrows", atq)];
  assert.ok(R.danoNoDuelo(atq, unid(["Flying"]), 80).melhor.dano > 0);
  assert.ok(R.danoNoDuelo(atq, unid(["Flying", "Dragon"]), 80).melhor.dano > 0);
  atq.golpesProntos = [golpe("Earthquake", atq)];
  assert.equal(R.danoNoDuelo(atq, unid(["Flying"]), 80).melhor.dano, 0);
});

