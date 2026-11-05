// Rank v2 no app (src/regras/rank_da_run.js): nota pela dificuldade da run, dois eixos,
// rank por tipo e espécies fora do rank com motivo.
import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

// Fixture: data/rank_pendente_ate_10.json (tiposMudaram); er-config 30f0f5a SpeciesList.textproto SPECIES_BUTTERFREE
const PENDENTES_DE_TIPO = new Set(JSON.parse(readFileSync(new URL("../../data/rank_pendente_ate_10.json", import.meta.url), "utf8")).tiposMudaram);
const comRank = (R) => Object.keys(R.SPECIES_RANK).filter((s) => R.SPECIES_RANK[s].porDificuldade && R.SPECIES_RANK[s].porDificuldade.insane);
// espécie cuja nota muda entre Fácil/Ace e Elite (prova que a troca acontece)
const queMuda = (R) => comRank(R).find((s) => {
  const p = R.SPECIES_RANK[s].porDificuldade;
  return p.party && p.party.score !== p.insane.score;
});

test("Ace usa a nota do time party; Elite usa a do insane", () => {
  const ace = carregarRegras({ difficulty: "ace" });
  const s = queMuda(ace);
  assert.ok(s, "nenhuma espécie com nota diferente entre as dificuldades");
  assert.equal(ace.rankDe(s).score, ace.SPECIES_RANK[s].porDificuldade.party.score);
  const elite = carregarRegras({ difficulty: "elite" });
  // sem applySave: o state montado com a Dificuldade já basta (ADR-003)
  assert.equal(elite.rankDe(s).score, elite.SPECIES_RANK[s].porDificuldade.insane.score);
  assert.equal(elite.rankDe(s).tier, elite.SPECIES_RANK[s].porDificuldade.insane.tier);
  assert.equal(elite.rankDe(s).rankDaDificuldade, "insane");
});

test("trocar a dificuldade (ou carregar save) troca a nota", () => {
  const R = carregarRegras({ difficulty: "ace" });
  const s = queMuda(R);
  R.applySave({ settings: { difficulty: "elite" }, team: [], box: [] });
  assert.equal(R.rankDe(s).score, R.SPECIES_RANK[s].porDificuldade.insane.score, "save em Elite não trocou o rank");
  R.state.settings.difficulty = "easy";
  assert.equal(R.rankDe(s).score, R.SPECIES_RANK[s].porDificuldade.party.score);
});

test("dois eixos e rank por tipo para cada tipo da espécie", () => {
  const R = carregarRegras();
  for (const s of comRank(R).slice(0, 200)) {
    const r = R.SPECIES_RANK[s];
    assert.ok(r.potencial && r.viabilidade, s + " sem eixos");
    if (PENDENTES_DE_TIPO.has(s)) continue; // rank calculado sobre tipo antigo, a refazer no fechamento (rank_pendente_ate_10.json: Butterfree virou Bug/Flying na er-config 30f0f5a)
    for (const t of R.speciesTypeNames(R.getSpeciesBySname(s))) assert.ok(r.monoRanks[t], s + " sem rank entre " + t);
  }
});

test("fora do rank: sai de SPECIES_RANK e guarda o motivo", () => {
  const R = carregarRegras();
  assert.equal(R.SPECIES_RANK.SPECIES_ZACIAN, undefined);
  assert.equal(R.FORA_DO_RANK.SPECIES_ZACIAN, "pos-jogo");
  assert.ok(R.MOTIVO_FORA_DO_RANK_PT[R.FORA_DO_RANK.SPECIES_ZACIAN]);
  assert.ok(Object.keys(R.FORA_DO_RANK).length > 100);
});
