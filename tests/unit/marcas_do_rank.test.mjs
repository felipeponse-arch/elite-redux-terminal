// Marcas sem nota do rank v2 (ponto 6, 2026-10-02): "Precisa de setter"
// (src/regras/condicoes_habilidade.js precisaDeSetter) e "Concorrência no tipo"
// (src/regras/rank_da_run.js dominantesNoTipo, gravada por scripts/calcular_rank_v2.mjs).
// "Papéis cumpridos" é o "Papel" que a ficha já mostra (species_role.json).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

// O app roda em outro contexto (vm): compara pelo JSON, não pelo protótipo do array.
const igual = (a, b, msg) => assert.equal(JSON.stringify(a), JSON.stringify(b), msg);

const R = carregarRegras({ milestone: 9 });
const id = (n) => R.ABILITIES.findIndex((a) => a && a[0] === n);
// Espécie real (movepool de verdade) com habilidades trocadas para o caso do teste.
const com = (inn, ab) => Object.assign({}, R.getSpeciesBySname("SPECIES_KINGDRA"), { inn: inn.map(id), ab: ab.map(id) });

test("setter: Swift Swim sem armador próprio precisa de chuva; Rain Dance aparece como saída própria", () => {
  const m = R.precisaDeSetter(com(["Multiscale"], ["Swift Swim", "Torrent"]), "Swift Swim");
  assert.equal(m.length, 1);
  assert.equal(m[0].condicao, "chuva");
  igual(m[0].habilidades, ["Swift Swim"]);
  assert.ok(m[0].golpes.indexOf("Rain Dance") !== -1);
});

test("setter: innate que arma a chuva resolve", () => {
  igual(R.precisaDeSetter(com(["Drizzle", "Swift Swim"], ["Torrent"]), "Torrent"), []);
});

test("setter: innate condicional + escolhível que arma resolve; escolhida condicional + outra escolhível não", () => {
  igual(R.precisaDeSetter(com(["Swift Swim"], ["Drizzle", "Torrent"]), "Torrent"), []);
  // As escolhíveis se excluem: com Swift Swim escolhida, o Drizzle fica de fora.
  assert.equal(R.precisaDeSetter(com(["Multiscale"], ["Swift Swim", "Drizzle"]), "Swift Swim").length, 1);
});

test("setter: só condição de campo (status e Booster Energy a espécie resolve sozinha)", () => {
  igual(R.precisaDeSetter(com(["Guts"], ["Torrent"]), "Torrent"), []);
  igual(R.precisaDeSetter(com(["Protosynthesis"], ["Torrent"]), "Torrent"), []);
});

test("setter: dado real - Cherrim (Flower Gift) precisa de sol, Kingdra (Swift Swim) de chuva", () => {
  const c = R.precisaDeSetter(R.getSpeciesBySname("SPECIES_CHERRIM"), null);
  assert.equal(c[0] && c[0].condicao, "sol");
  const k = R.precisaDeSetter(R.getSpeciesBySname("SPECIES_KINGDRA"), "Swift Swim");
  assert.equal(k[0] && k[0].condicao, "chuva");
});

test("Pareto: domina quem é >= nos dois eixos, chegou antes ou junto, e é melhor em algo", () => {
  const d = R.dominantesNoTipo([
    { s: "a", tipos: ["Ground"], pot: 0.5, via: 0.5, etapa: 3 },
    { s: "melhor", tipos: ["Ground"], pot: 0.6, via: 0.5, etapa: 3 },
    { s: "tarde", tipos: ["Ground"], pot: 0.9, via: 0.9, etapa: 5 },
    { s: "gemeo", tipos: ["Ground"], pot: 0.5, via: 0.5, etapa: 3 },
    { s: "soPot", tipos: ["Ground", "Flying"], pot: 0.9, via: 0.1, etapa: 0 }
  ]);
  assert.equal(d.a.Ground, 1, "só 'melhor' domina: 'tarde' chega depois, 'gemeo' é igual, 'soPot' perde na viabilidade");
  assert.equal(d.gemeo.Ground, 1);
  assert.equal(d.melhor.Ground, 0);
  assert.equal(d.soPot.Flying, 0);
});

test("Pareto gravado: cada espécie no rank tem dominadoPor por tipo, na dificuldade da run", () => {
  const ace = carregarRegras({ difficulty: "ace" });
  const nomes = Object.keys(ace.SPECIES_RANK).filter((s) => ace.SPECIES_RANK[s].porDificuldade);
  let zero = 0, algum = 0;
  for (const s of nomes) {
    const d = ace.rankDaDificuldadeDe(ace.SPECIES_RANK[s]);
    for (const t of ace.speciesTypeNames(ace.getSpeciesBySname(s))) {
      assert.equal(typeof d.dominadoPor[t], "number", s + " sem concorrência entre " + t);
      if (d.dominadoPor[t] === 0) zero++; else algum++;
    }
  }
  assert.ok(zero > 0 && algum > zero, "Pareto degenerado (" + zero + " sem dominante, " + algum + " dominados)");
  const elite = carregarRegras({ difficulty: "elite" });
  elite.applySave({ settings: { difficulty: "elite" }, team: [], box: [] });
  const s = nomes.find((x) => elite.SPECIES_RANK[x].porDificuldade.insane &&
    JSON.stringify(elite.SPECIES_RANK[x].porDificuldade.insane.dominadoPor) !== JSON.stringify(elite.SPECIES_RANK[x].porDificuldade.party.dominadoPor));
  assert.ok(s, "nenhuma espécie com concorrência diferente entre as dificuldades");
  igual(elite.rankDaDificuldadeDe(elite.SPECIES_RANK[s]).dominadoPor, elite.SPECIES_RANK[s].porDificuldade.insane.dominadoPor);
});
