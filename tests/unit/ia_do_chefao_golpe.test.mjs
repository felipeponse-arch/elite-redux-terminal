// Ticket 03 (07/10/2026): o chefão escolhe o golpe pelos pontos da IA do jogo (battle_ai_main.c AI_TryToFaint,
// battle_ai_util.c GetMoveDamageResult), não pelo maior dano. Sem nocaute, super efetivo (+2) ganha do golpe de
// mais dano (+1) quando o dano dos dois é parecido; golpe que nocauteia vale mais que tudo. O jogador continua
// com o golpe de mais dano. Ver docs/decisoes_mecanicas.md.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 9 });
const ef = () => R.efeitoDasHabilidadesNoDuelo([], "x", null);
// stats: [hp, atk, def, spa, spd, spe]
const unid = (tipos, stats, golpes) => {
  const u = { ef: ef(), tipos, stats, ids: [] };
  if (golpes) u.golpesProntos = R.prepararGolpesDuelo(golpes.map((n) => R.MOVE_ID_BY_NAME[n]), u, null);
  return u;
};
const chefao = (golpes, spe = 50) => unid(["Normal"], [300, 120, 100, 50, 100, spe], golpes);
const alvoNormal = (hp) => unid(["Normal"], [hp, 100, 100, 100, 100, 100], ["Tackle"]);

test("sem nocaute: a IA prefere o super efetivo de dano parecido ao golpe de mais dano", () => {
  const d = R.danoNoDuelo(chefao(["Body Slam", "Mach Punch"]), alvoNormal(3000), 50);
  assert.equal(d.melhor.golpe.nome, "Body Slam", "o de mais dano continua sendo o 'melhor'");
  assert.equal(d.ia.golpe.nome, "Mach Punch", "a IA soma +2 do super efetivo contra +1 do mais forte");
});

test("golpe que nocauteia ganha do super efetivo", () => {
  const d = R.danoNoDuelo(chefao(["Body Slam", "Mach Punch"], 200), alvoNormal(55), 50); // só o Body Slam nocauteia
  assert.ok(d.melhor.dano >= 55 && d.ia.dano >= 55);
  assert.equal(d.ia.golpe.nome, "Body Slam");
});

test("super efetivo muito mais fraco (mais de 30 pontos de HP abaixo) perde para o de mais dano", () => {
  // Alvo de HP baixo: a diferença em % do HP fica grande e o super efetivo vira 'fraco' (-1): 2-1=1 contra 1 -> empate,
  // e o empate fica com o de mais dano.
  const d = R.danoNoDuelo(chefao(["Body Slam", "Mach Punch"], 10), alvoNormal(68), 50);
  assert.ok(d.melhor.dano < 68, "nenhum dos dois nocauteia");
  assert.equal(d.ia.golpe.nome, "Body Slam");
});

test("no duelo, o lado do chefão usa a escolha da IA: o jogador apanha menos do que com o golpe mais forte", () => {
  const eu = unid(["Normal"], [3000, 100, 100, 100, 100, 10], ["Tackle"]);
  const comOsDois = R.resultadoDoDuelo(eu, chefao(["Body Slam", "Mach Punch"]), 50, { detalhe: true });
  const soOForte = R.resultadoDoDuelo(eu, chefao(["Body Slam"]), 50, { detalhe: true });
  assert.ok(comOsDois.fracEu > soOForte.fracEu, comOsDois.fracEu + " vs " + soOForte.fracEu);
});

test("jeito de lutar da IA: Roxanne 1 (status e stall) e Winona 2-5 (arriscada), todos chefões que existem no dado", async () => {
  const { readFileSync } = await import("node:fs");
  const nomes = new Set(JSON.parse(readFileSync(new URL("../../data/bosses.json", import.meta.url), "utf8")).map((b) => b.name));
  assert.equal(R.comportamentoDaIADoChefao("Roxanne 1").length, 2);
  for (const n of ["Winona 2", "Winona 3", "Winona 4", "Winona 5"]) assert.match(R.comportamentoDaIADoChefao(n)[0], /Arriscada/);
  assert.equal(R.comportamentoDaIADoChefao("Winona 1").length, 0);
  for (const n of ["Roxanne 1", "Winona 2", "Winona 3", "Winona 4", "Winona 5"]) assert.ok(nomes.has(n), n);
});
