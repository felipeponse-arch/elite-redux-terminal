// ADR-003 (ticket 01): o dado do Rank só é lido por rankDe(); SPECIES_RANK não é reescrito depois da carga.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { carregarRegras } from "./carregar_regras.mjs";

test("nenhum arquivo além de rank_da_run.js lê SPECIES_RANK[...] direto", () => {
  const achados = [];
  for (const pasta of ["src/regras", "src/ui"]) {
    for (const f of readdirSync(pasta).filter((n) => n.endsWith(".js") && n !== "rank_da_run.js")) {
      readFileSync(pasta + "/" + f, "utf8").split("\n").forEach((linha, i) => {
        if (/^\s*\/\//.test(linha)) return;
        if (/SPECIES_RANK\s*\[/.test(linha)) achados.push(pasta + "/" + f + ":" + (i + 1));
      });
    }
  }
  assert.deepEqual(achados, [], "leitura direta de SPECIES_RANK fora do rank_da_run.js");
});

test("trocar a Dificuldade não reescreve o dado de SPECIES_RANK", () => {
  const R = carregarRegras({ difficulty: "ace" });
  const s = Object.keys(R.SPECIES_RANK).find((k) => {
    const p = R.SPECIES_RANK[k].porDificuldade;
    return p && p.party && p.insane && p.party.score !== p.insane.score;
  });
  assert.ok(s);
  const antes = JSON.stringify(R.SPECIES_RANK[s]);
  R.rankDe(s);
  R.applySave({ settings: { difficulty: "elite" }, team: [], box: [] });
  assert.equal(R.rankDe(s).score, R.SPECIES_RANK[s].porDificuldade.insane.score);
  assert.equal(JSON.stringify(R.SPECIES_RANK[s]), antes, "o dado carregado mudou");
});
