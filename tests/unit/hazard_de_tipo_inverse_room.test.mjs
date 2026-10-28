// TK-07 (decisão 6, 28/10/2026): Stealth Rock e Creeping Thorns passam por GetTypeModifier, que usa a tabela
// invertida sob Inverse Room (er-repo battle_util.c:8054-8083, battle_script_commands.c:8781-8786).
// Pacote: relatorios/tk07_evidencia.md. Dado real: Charizard (Fire/Flying) e a Phione do Archie.
import { test } from "node:test";
import assert from "node:assert/strict";
import { R, EV, especie } from "./cenarios_do_duelo.mjs";

const N = 100;
const charizard = () => R.unidadeDaBuild(especie("Charizard"), { ability: "", nature: "Modest", evs: EV.tanqueE, item: "", moves: ["Flamethrower"] }, N, null);
const dano = (lado, inversa) => {
  const c = { u: charizard(), frac: 1, status: {}, bonus: {} };
  R.entrarNoLadoDuelo(c, Object.assign(R.novoLadoDuelo(), lado), inversa);
  return 1 - c.frac;
};

// Rock x Fire/Flying = 4x (maxHP/2); invertido, 0,5 x 0,5 = 0,25x (maxHP/32). O pacote dizia 1/4 e 1/16: contas erradas.
test("Stealth Rock no Charizard: 1/2 normal, 1/32 sob Inverse Room", () => {
  assert.equal(dano({ rocha: true }, false), 0.5);
  assert.equal(dano({ rocha: true }, true), 1 / 32);
});

test("Creeping Thorns (Grass) no Charizard: 1/32 normal (0,25x), 1/2 sob Inverse Room (4x)", () => {
  assert.equal(dano({ espinhoVerde: true }, false), 1 / 32);
  assert.equal(dano({ espinhoVerde: true }, true), 0.5);
});

test("na luta inteira: Inverse Room permanente do chefão inverte o Stealth Rock de quem entra", () => {
  const b = R.BOSSES.find((x) => x.name === "Archie");
  const foes = (inv) => R.foesComRegraDeCampo(b.party.map((m) => R.foeDeDuelo(m, 20, null)), inv ? { inversa: true } : null);
  const hp = (inv) => R.simularLutaContraChefao([charizard()], foes(inv), 20, { statusNoFim: [], lado: { rocha: true } }).log[0].fracEu;
  assert.ok(hp(true) > 0.9 && hp(false) <= 0.5, "sob Inverse o Charizard perde 1/32 na entrada, não 1/2");
});

test("na dupla: Inverse Room permanente do chefão também inverte o Stealth Rock de quem entra", () => {
  const b = R.BOSSES.find((x) => x.name === "Archie");
  const foes = (inv) => R.foesComRegraDeCampo(b.party.map((m) => R.foeDeDuelo(m, 20, null)), inv ? { inversa: true } : null);
  const r = (inv) => R.simularDuplaContraChefao([charizard(), charizard()], foes(inv), 20, { statusNoFim: [], lado: { rocha: true } });
  // Dois Charizard entram sob Stealth Rock: 1/2 cada normal, 1/32 invertido (hpRestante soma os dois).
  assert.ok(r(true).hpRestante - r(false).hpRestante > 0.5, "sob Inverse a dupla perde bem menos HP na entrada");
});
