// Parte 4 de 5 de time_pelo_motor.test.mjs (dividido em 06/11/2026 para rodar em paralelo; ver tests/pesados.json).
// Modo Motor do Meu Time, Fase C (ticket time-pelo-motor/01, 21/10/2026): montar o time SEM IA, só pelo simulador.
// Dado real (espécies, lutas e níveis da run); nada de valor à mão. Cada teste cobre um risco da §3 do ticket.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const ELENCO = ["Centiskorch", "Scizor", "Garchomp", "Metagross", "Grimmsnarl", "Togekiss", "Klefki", "Gardevoir", "Ledian", "Gyarados"];

// Run nova: o elenco vai 6 no time e o resto na caixa. O cache é compartilhado dentro do arquivo (as builds do pipeline custam ~0,6 s).
function run({ milestone = 2, nomes = ELENCO, mono = null, megaMode = "temporaria" } = {}) {
  const R = carregarRegras({ milestone, megaMode });
  const sp = (n) => R.SPECIES.find((s) => s && s.n === n);
  R.state.team = nomes.slice(0, 6).map((n) => sp(n).x);
  R.state.box = nomes.slice(6).map((n) => sp(n).x);
  R.state.archetype.monotype = mono;
  const ctx = R.contextoDoMotor();
  ctx.cache = R.criarCacheDoMotor();
  return { R, sp, ctx };
}
// Objetos do vm vêm de outro realm: compara pelo JSON.
const igual = (a, b, msg) => assert.equal(JSON.stringify(a), JSON.stringify(b), msg);
const nomesDe = (v) => v.membros.map((m) => m.nome);


// ---- Fase F1: em passos e aquecido (a tela não trava; o tempo do caso comum fica abaixo de 10 s) ----
const base = run();

test("risco 5: favoritos (1, 3 e 6) nunca saem; vagas livres são preenchidas; 6 favoritos = sem troca no plano B", () => {
  const sn = (n) => base.sp(n).sname;
  [["Ledian"], ["Ledian", "Klefki", "Gyarados"], ELENCO.slice(0, 6)].forEach((favs) => {
    const out = base.R.montarTimePeloMotor(base.ctx, { favoritos: favs.map(sn) });
    out.variantes.forEach((v) => {
      favs.forEach((f) => assert.ok(nomesDe(v).includes(f), f + " saiu em " + v.chave));
      assert.equal(v.membros.length, 6);
      assert.equal(v.membros.filter((m) => m.travado).length, favs.length);
      v.planoB.trocas.forEach((t) => assert.ok(!favs.includes(t.sai), "plano B tirou o favorito " + t.sai));
      assert.doesNotMatch(v.explicacao.join(" "), /tirar|retirar|remov|substitu/i, "nunca sugere tirar favorito");
    });
    if (favs.length < 6) {
      const trocas = out.variantes.flatMap((v) => v.planoB.trocas);
      assert.ok(trocas.length > 0, "com vaga livre o plano B acha troca medida (" + favs.length + " favoritos)");
      trocas.forEach((t) => assert.ok(t.vaga >= favs.length && !favs.includes(t.sai) && t.deltaPontos > 0, JSON.stringify(t)));
    }
    if (favs.length === 6) out.variantes.forEach((v) => {
      igual(v.planoB.trocas, []);
      assert.match(v.planoB.motivo, /favoritos/);
    });
  });
});

test("mono: todo candidato e todo membro tem o tipo da run", () => {
  const r = run({ nomes: ["Scizor", "Metagross", "Klefki", "Garchomp", "Gardevoir", "Ledian", "Ferrothorn"], mono: "Steel" });
  const out = r.R.montarTimePeloMotor(r.ctx, { variantes: ["ofensivo"] });
  assert.ok(out.variantes[0].membros.length >= 3);
  out.variantes[0].membros.forEach((m) => assert.ok(r.R.speciesTypeNames(r.R.getSpeciesByX(m.x)).includes("Steel") || r.R.speciesTypeNames(r.R.SPECIES.find((s) => s && s.sname === m.sname)).includes("Steel"), m.nome));
});

test("aceite (dívida 20): Centiskorch com Coil Up sai com Fire Fang, não com Fire Lash (top-1 contra o campo)", () => {
  const r = run({ milestone: 0, nomes: ["Centiskorch", "Scizor", "Klefki"] });
  const out = r.R.montarTimePeloMotor(r.ctx, { favoritos: [r.sp("Centiskorch").sname], variantes: ["ofensivo"] });
  const m = out.variantes[0].membros.find((x) => x.nome === "Centiskorch");
  assert.ok(m, "o favorito está no time");
  assert.equal(m.origem, "pipeline");
  assert.equal(m.build.ability, "Coil Up");
  assert.ok(m.build.moves.includes("Fire Fang"), JSON.stringify(m.build.moves));
  assert.ok(!m.build.moves.includes("Fire Lash"), JSON.stringify(m.build.moves));
});
