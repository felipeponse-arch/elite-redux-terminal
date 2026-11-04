// Depende de dado: nomes de habilidade de chefões/lutas (muda quando a config renomeia).
// TK-35: nome de habilidade guardado em dado lido POR NOME (chefões, lutas comuns, builds de referência) tem que existir no dex.
// Causa: a config renomeou "Sun Basking" para "Basking" (AbilityList.textproto:3507) e o nome antigo virava undefined em silêncio.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "data");
const ler = (n) => JSON.parse(readFileSync(join(raiz, n), "utf8"));
const nomes = new Set(ler("dex_compact.json").abilities.map((a) => a[0]));

function coletar(no, chaves, achados = []) {
  if (Array.isArray(no)) no.forEach((x) => coletar(x, chaves, achados));
  else if (no && typeof no === "object") {
    for (const [k, v] of Object.entries(no)) {
      if (chaves.includes(k) && typeof v === "string" && v) achados.push(v);
      else coletar(v, chaves, achados);
    }
  }
  return achados;
}

for (const [arquivo, chaves] of [["bosses.json", ["abi"]], ["lutas_comuns_run.json", ["abi"]], ["boss_reference_builds.json", ["ability"]]]) {
  test(`${arquivo}: toda habilidade por nome existe no dex`, () => {
    const faltam = [...new Set(coletar(ler(arquivo), chaves))].filter((n) => !nomes.has(n));
    assert.deepEqual(faltam, [], `nomes sem habilidade no dex: ${faltam.join(", ")}`);
  });
}

// TK-36: o texto das builds também não pode citar o nome velho (a nota de uma build dizia "virou Sun Basking").
test("builds.json não cita Sun Basking (agora Basking)", () => {
  assert.ok(!readFileSync(join(raiz, "builds.json"), "utf8").includes("Sun Basking"));
});
