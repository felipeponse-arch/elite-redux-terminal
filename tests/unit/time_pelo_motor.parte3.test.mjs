// Parte 3 de 5 de time_pelo_motor.test.mjs (dividido em 06/11/2026 para rodar em paralelo; ver tests/pesados.json).
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
const nomesDe = (v) => v.membros.map((m) => m.nome);


// ---- Fase F1: em passos e aquecido (a tela não trava; o tempo do caso comum fica abaixo de 10 s) ----

test("risco 6: Mega só depois da liberação; item não liberado na Etapa nunca entra; só Pokémon do jogador", () => {
  const cedo = run({ milestone: 0 }), tarde = run({ milestone: 4 });
  const cc = cedo.R.motorCandidatos(cedo.ctx, [], []), ct = tarde.R.motorCandidatos(tarde.ctx, [], []);
  assert.ok(cc.every((c) => c.sp.x === c.base.x), "sem Mega antes da 4ª insígnia");
  assert.ok(ct.some((c) => c.sp.x !== c.base.x), "com a Mega liberada ela aparece (o teste não é vazio)");
  // Pool: ninguém de fora do time e da caixa.
  const meus = new Set(cedo.R.xsDoJogador());
  assert.ok(cc.every((c) => meus.has(c.x)));
  // Item da build salva que a Etapa ainda não libera: o Modo Motor tira o item e avisa (nunca usa).
  const R = cedo.R, scizor = cedo.sp("Scizor");
  const tardio = R.ITEMS.find((i) => R.etapaDoItem(i) >= 5);
  R.state.customBuilds[scizor.sname] = [{ active: true, ability: "Technician", moves: ["Bullet Punch", "Swords Dance", "U-turn", "Roost"], item: tardio, nature: "Adamant", evs: [0, 252, 0, 0, 4, 252] }];
  const out = R.montarTimePeloMotor(cedo.ctx, { favoritos: [scizor.sname], variantes: ["ofensivo"] });
  const m = out.variantes[0].membros.find((x) => x.nome === "Scizor");
  assert.equal(m.origem, "build-salva");
  assert.equal(m.build.item, "");
  assert.ok(out.avisos.some((a) => a.includes(tardio)), "avisa do item");
  out.variantes[0].membros.forEach((x) => assert.ok(!x.build.item || R.liberadoNaRun(0, cedo.ctx.cap, { item: x.build.item }), x.nome + " " + x.build.item));
});

test("favorito da mesma linha evolutiva: nunca some em silêncio (está em membros ou em avisos, dizendo quem entrou)", () => {
  const r = run({ milestone: 2, nomes: ["Charmander", "Charizard", "Scizor", "Klefki", "Gyarados", "Metagross"] });
  const favs = ["Charmander", "Charizard", "Scizor"];
  const out = r.R.montarTimePeloMotor(r.ctx, { favoritos: favs.map((n) => r.sp(n).sname), variantes: ["ofensivo"] });
  const v = out.variantes[0];
  favs.forEach((n) => assert.ok(nomesDe(v).includes(n) || v.avisos.concat(out.avisos).some((a) => a.includes(n + " é favorito")), n + " sumiu sem aviso"));
  const fora = favs.filter((n) => !nomesDe(v).includes(n));
  assert.equal(fora.length, 1, "dois da mesma linha: só um entra");
  assert.ok(v.avisos.some((a) => a.includes(fora[0]) && /divide a linha evolutiva com (Charmander|Charizard)/.test(a)), v.avisos.join(" | "));
});
