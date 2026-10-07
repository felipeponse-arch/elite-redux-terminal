// Lote 5 das pesquisas de 06/10: Avisos de build (um bloco, reaproveitando as contas
// que já existem) e selo de origem/confiança da build.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { carregarRegras } from "./carregar_regras.mjs";

const esp = (R, s) => { const sp = R.getSpeciesBySname(s); assert.ok(sp, s); return sp; };
const tipos = (R, sp, b) => [...R.avisosDaBuild(sp, b)].map((a) => a.tipo);

test("golpe só depois do level cap vira aviso, com o nível", () => {
  const R = carregarRegras({ milestone: 0 });
  const sp = esp(R, "SPECIES_CHARIZARD");
  const sem = tipos(R, sp, { moves: ["Scratch"], ability: "Blaze" });
  assert.ok(!sem.includes("golpe-cap"));
  const fim = sp.lm.slice().sort((a, b) => b[0] - a[0])[0];
  const nome = R.MOVES[fim[1]][0];
  assert.ok(fim[0] > R.getCurrentCap(), "pré-condição: golpe de nível alto trava no cap inicial");
  const av = R.avisosDaBuild(sp, { moves: [nome], ability: "Blaze" }).find((a) => a.tipo === "golpe-cap");
  assert.ok(av && av.texto.includes(nome) && av.texto.includes("nível " + fim[0]));
});

test("Mega antes da insígnia e pedra tardia viram um aviso só; liberada, some", () => {
  const R = carregarRegras({ milestone: 2 });
  const mega = esp(R, "SPECIES_ABSOL_MEGA");
  assert.deepEqual(tipos(R, mega, { moves: ["Scratch"] }).filter((t) => t === "mega" || t === "item-tardio"), ["mega"]);
  const base = esp(R, "SPECIES_GARDEVOIR");
  assert.ok(tipos(R, base, { moves: ["Scratch"], item: "Gardevoirite" }).includes("item-tardio"), "pedra da 7ª insígnia antes dela");
  R.state.settings.milestone = 7;
  assert.ok(!tipos(R, base, { moves: ["Scratch"], item: "Gardevoirite" }).includes("item-tardio"));
  assert.ok(!tipos(R, mega, { moves: ["Scratch"] }).includes("mega"));
});

test("clima sem setter: avisa; o time (ou o Clima do time) que arma cala o aviso", () => {
  const R = carregarRegras({ milestone: 0 });
  // acha uma espécie que precisa de setter de verdade, no próprio dado
  let achada = null;
  for (const sp of R.SPECIES) {
    for (const hab of R.nomesDeHabilidades(sp.ab)) {
      if (R.precisaDeSetter(sp, hab).length) { achada = { sp, hab }; break; }
    }
    if (achada) break;
  }
  assert.ok(achada, "pré-condição: existe espécie que precisa de setter");
  const b = { moves: ["Scratch"], ability: achada.hab };
  assert.ok(tipos(R, achada.sp, b).includes("setter"));
  const cond = R.precisaDeSetter(achada.sp, achada.hab)[0].condicao.split("|")[0];
  const clima = Object.keys(R.CONDICAO_DO_ARQUETIPO).find((k) => R.CONDICAO_DO_ARQUETIPO[k] === cond);
  R.state.archetype.weather = clima;
  assert.ok(!tipos(R, achada.sp, b).includes("setter"), "Clima do time arma a condição");
});

test("set de dupla em luta 1x1 avisa", () => {
  const R = carregarRegras();
  const sp = esp(R, "SPECIES_CHARIZARD");
  assert.ok(tipos(R, sp, { moves: ["Scratch"], formato: "dupla" }).includes("dupla"));
  assert.ok(!tipos(R, sp, { moves: ["Scratch"] }).includes("dupla"));
});

test("selo: níveis por fonte, IA é relato, Meu build e herdada não têm selo", () => {
  const R = carregarRegras();
  assert.equal(R.seloDaBuild({ origem: "curada", fonte: "dex-strategy-do-jogo" }).nivel, "confirmado");
  assert.equal(R.seloDaBuild({ origem: "curada", fonte: "curadoria-do-projeto" }).nivel, "confirmado");
  assert.equal(R.seloDaBuild({ origem: "curada", fonte: "discord-build-workshop-2.65" }).nivel, "consenso");
  assert.equal(R.seloDaBuild({ origem: "curada", fonte: "discord-movesets" }).nivel, "relato");
  assert.equal(R.seloDaBuild({ origem: "ia" }).nivel, "relato");
  assert.equal(R.seloDaBuild({ origem: "curada", fonte: "fonte-nova" }).nivel, "relato", "fonte desconhecida nunca vira confiável");
  assert.equal(R.seloDaBuild({ origem: "manual" }), null);
  assert.equal(R.seloDaBuild({ origem: "base" }), null);
  assert.equal(R.seloDaBuild(null), null);
});

test("toda fonte de data/builds.json tem selo conhecido (fonte nova precisa ser classificada de propósito)", () => {
  const R = carregarRegras();
  const builds = JSON.parse(readFileSync(new URL("../../data/builds.json", import.meta.url), "utf8"));
  const fontes = new Set();
  for (const v of Object.values(builds)) for (const b of Array.isArray(v) ? v : [v]) if (b.fonte) fontes.add(b.fonte);
  for (const f of fontes) assert.ok(R.SELOS_POR_FONTE[f], "fonte sem selo: " + f);
});
