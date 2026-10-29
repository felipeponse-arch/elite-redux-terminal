// TK-12 estrutura D4.3 (28/10/2026): SINERGIA_SEM_BONUS_DE_DANO_DUELO virou conjunto por ID, montado dos 7 nomes por ABILITY_ID_BY_NAME.
// Nenhum campo do texto separa essas 7 (Aerodynamics e Motor Drive não têm campo lido), então a lista de nomes fica, mas protegida aqui.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { carregarRegras } from "./carregar_regras.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const R = carregarRegras({ milestone: 8, difficulty: "ace", levelCapMode: "more" });
const sinergia = JSON.parse(readFileSync(join(RAIZ, "data", "species_ability_synergy.json"), "utf8"));

test("os 7 nomes existem no dado e o conjunto tem exatamente as 7 IDs deles", () => {
  assert.equal(R.NOMES_SINERGIA_SEM_BONUS_DE_DANO_DUELO.length, 7);
  const ids = R.NOMES_SINERGIA_SEM_BONUS_DE_DANO_DUELO.map((n) => {
    const id = R.ABILITY_ID_BY_NAME[n];
    assert.notEqual(id, undefined, n + " não existe no dado");
    assert.equal(R.ABILITIES[id][0], n);
    return String(id);
  });
  assert.deepEqual([...Object.keys(R.SINERGIA_SEM_BONUS_DE_DANO_DUELO)].sort(), [...ids].sort());
});

test("nenhuma habilidade da sinergia soma bônus em dobro: texto lido => sem bonusGolpes; sem bônus no jogo => sem bonusGolpes", () => {
  const nomes = new Set();
  for (const sname of Object.keys(sinergia)) for (const h of sinergia[sname]) nomes.add(h.name);
  assert.ok(nomes.size >= 80, "habilidades distintas na sinergia: " + nomes.size);
  const semBonus = new Set(R.NOMES_SINERGIA_SEM_BONUS_DE_DANO_DUELO);
  for (const sname of Object.keys(sinergia)) for (const h of sinergia[sname]) {
    const id = R.ABILITY_ID_BY_NAME[h.name];
    if (id === undefined) continue;
    const ef = R.efeitoDasHabilidadesNoDuelo([id], sname, null);
    const leu = R.bonusDeGolpeLidoDoTextoDuelo(R.efeitoDasHabilidadesNoDuelo([id], "solo#" + id, null));
    if (leu || semBonus.has(h.name)) assert.deepEqual(Object.keys(ef.bonusGolpes), [], sname + " / " + h.name + ": bônus em dobro");
  }
});
