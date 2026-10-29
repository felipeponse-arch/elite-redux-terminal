// TK-24: todo derivado gerado (rank, lutas comuns, chefões) deixa carimbo de versão/frescor em
// data/carimbo_derivados.json, copiado de data/carimbo_dados.json no momento da geração.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { lerComMutacao } from "./carregar_regras.mjs";
import { carimbarDerivado } from "../../scripts/carimbo_derivado.mjs";

test("carimbarDerivado copia jogo/er-repo/er-config/data do carimbo dos dados", () => {
  const d = mkdtempSync(join(tmpdir(), "carimbo-"));
  const origem = join(d, "carimbo_dados.json"), saida = join(d, "carimbo_derivados.json");
  writeFileSync(origem, JSON.stringify({ jogo: "v9", "er-repo": "abc", "er-config": "def", data: "2026-10-27" }));
  carimbarDerivado("species_rank.json", { origem, saida, hoje: "2026-10-28" });
  carimbarDerivado("bosses.json", { origem, saida, hoje: "2026-10-28" });
  const r = JSON.parse(readFileSync(saida, "utf8"));
  assert.deepEqual(r["species_rank.json"], { jogo: "v9", "er-repo": "abc", "er-config": "def", dadosDe: "2026-10-27", geradoEm: "2026-10-28" });
  assert.ok(r["bosses.json"], "segunda chamada preserva a primeira entrada e acrescenta a sua");
});

test("os geradores de rank, lutas comuns e chefões chamam carimbarDerivado", () => {
  const rank = lerComMutacao("scripts/calcular_rank_v2.mjs", "calcular_rank_v2.mjs");
  assert.match(rank, /carimbarDerivado\("species_rank\.json"\)/);
  assert.match(rank, /carimbarDerivado\("lutas_comuns_run\.json"\)/);
  assert.match(readFileSync("scripts/extracao/chefoes.mjs", "utf8"), /carimbarDerivado\("bosses\.json"\)/);
});
