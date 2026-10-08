// Ticket 13 (07/10/2026): faixas Fraco/Resiste/Imune da ficha, com as innates (sempre ativas).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 9 });
const perfil = (s) => R.perfilDefensivoDaEspecie(R.getSpeciesBySname(s));
const tipos = (lista) => lista.map((x) => x.tipo + " " + x.mult);

test("Charizard (Fire/Flying): Rock 4x primeiro; Ground imune; Grass e Bug 1/4", () => {
  const p = perfil("SPECIES_CHARIZARD");
  assert.equal(tipos(p.fraco)[0], "Rock 4");
  assert.ok(tipos(p.imune).includes("Ground 0"));
  assert.ok(tipos(p.resiste).includes("Grass 0.25") && tipos(p.resiste).includes("Bug 0.25"));
});

test("innate que dá imunidade entra no perfil (como na tabela de tipos do motor)", () => {
  // Procura uma espécie cuja innate anula um tipo que a tipagem sozinha não anula.
  const sp = R.SPECIES.find((s) => s && R.USABLE_TYPES.some((t) => R.typeMultiplier(t, R.speciesTypeNames(s)) > 0 && R.abilityTypeMod(t, s).mult === 0));
  assert.ok(sp, "existe espécie com innate de imunidade");
  const t = R.USABLE_TYPES.find((x) => R.typeMultiplier(x, R.speciesTypeNames(sp)) > 0 && R.abilityTypeMod(x, sp).mult === 0);
  assert.ok(R.perfilDefensivoDaEspecie(sp).imune.some((x) => x.tipo === t), sp.n + " imune a " + t);
});

test("Rhydon (Solid Rock sempre ativa): ficha mostra Grass 4x e Fighting 2x reais, citando a redução", () => {
  const p = perfil("SPECIES_RHYDON");
  const grama = p.fraco.find((x) => x.tipo === "Grass");
  const luta = p.fraco.find((x) => x.tipo === "Fighting");
  assert.equal(grama.mult, 4);
  assert.equal(luta.mult, 2);
  assert.ok(grama.reducoes[0].includes("Solid Rock reduz"), "cita a redução");
});
