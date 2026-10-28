// Regras do Modo Motor que só a sabotagem do TK-03 (27/10/2026) mostrou sem proteção: item liberado e limite de repetição,
// nível pelo modo do level cap, fatia vinda do dado e desempate por nome. Cada teste usa dado real do app e checa a REGRA, não um exemplo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const ELENCO = ["Centiskorch", "Scizor", "Garchomp", "Metagross", "Grimmsnarl", "Togekiss", "Klefki", "Gardevoir", "Ledian", "Gyarados"];
function monta(milestone, nomes = ELENCO, extra = {}) {
  const R = carregarRegras({ milestone, ...extra });
  const sp = (n) => R.SPECIES.find((s) => s && s.n === n);
  nomes.forEach((n) => assert.ok(sp(n), "espécie inexistente: " + n));
  R.state.team = nomes.slice(0, 6).map((n) => sp(n).x);
  R.state.box = nomes.slice(6).map((n) => sp(n).x);
  const ctx = R.contextoDoMotor();
  ctx.cache = R.criarCacheDoMotor();
  return { R, sp, ctx };
}

test("item: o fechamento só oferece item que a Etapa libera (a lista pergunta ao filtro da run, item por item)", () => {
  // Caminho inalcançável com o dado atual (todo item gerável liberado na Etapa 0); a trava injetada prova o filtro.
  // Com o dado de hoje todo item que a lista pode gerar já está liberado desde a Etapa 0 (conferido); então o filtro só se prova
  // se ele mandar: aqui a run passa a travar o Life Orb (o palpite do motor para ofensivos) e a lista tem que deixá-lo de fora.
  const { R, ctx } = monta(2, ["Garchomp", "Scizor", "Metagross", "Gyarados", "Togekiss", "Gardevoir"]);
  const cands = R.motorCandidatos(ctx, [], []).filter((c) => c.sp.x === c.base.x);
  assert.ok(cands.some((c) => R.motorItensCandidatos(ctx, c).includes("Life Orb")), "sem a trava o Life Orb entra");
  const orig = R.liberadoNaRun;
  R.liberadoNaRun = (e, cap, alvo) => !(alvo && alvo.item === "Life Orb") && orig(e, cap, alvo);
  cands.forEach((c) => {
    const lista = R.motorItensCandidatos(ctx, c);
    assert.ok(!lista.includes("Life Orb"), c.nome + ": item travado entrou na lista");
    assert.ok(lista.length > 0);
  });
});

test("item: o mesmo item entra no máximo MAX_MESMO_ITEM_NO_TIME vezes no time fechado (6 ofensivos, Etapa 5)", () => {
  const { R, ctx } = monta(5);
  const v = R.montarTimePeloMotor(ctx, { variantes: ["ofensivo"] }).variantes[0];
  const cont = {};
  v.membros.forEach((m) => { if (m.build.item) cont[m.build.item] = (cont[m.build.item] || 0) + 1; });
  Object.keys(cont).forEach((n) => assert.ok(cont[n] <= R.MAX_MESMO_ITEM_NO_TIME, n + " x" + cont[n] + " no time: " + v.membros.map((m) => m.nome + "=" + m.build.item).join(", ")));
});

test("nível: o nível das lutas segue o modo do level cap escolhido (easy, more, elite), em toda Etapa", () => {
  ["easy", "more", "elite"].forEach((modo) => {
    const R = carregarRegras({ levelCapMode: modo });
    R.LEVELCAPS.rows.forEach((linha, etapa) => assert.equal(R.motorNivelDaEtapa(etapa), linha[modo] || linha.more || 100, modo + " Etapa " + etapa));
  });
  const R = carregarRegras();
  assert.ok(R.LEVELCAPS.rows.some((l) => l.easy !== l.more), "o dado precisa distinguir os modos para o teste valer");
});

test("fatia: o juiz usa a fatia do dado do rank (inclusive zero), e o padrão 60/40 só quando o dado não traz fatia", () => {
  const R = carregarRegras({ milestone: 2 });
  const real = R.LUTAS_COMUNS_RUN;
  assert.ok(real && real.lutas, "dado real das lutas comuns");
  const fatiaCom = (f) => { R.LUTAS_COMUNS_RUN = Object.assign({}, real, { fatia: f }); return R.motorLutasComunsDoContexto(2).fatia; };
  assert.equal(fatiaCom(0.45), 0.45);
  assert.equal(fatiaCom(0), 0);
  const { fatia: _f, ...semFatia } = real;
  R.LUTAS_COMUNS_RUN = semFatia;
  assert.equal(R.motorLutasComunsDoContexto(2).fatia, 0.6);
});

test("busca: empate no desempenho sozinho desempata pelo nome da espécie, não pela ordem em que os candidatos chegam", () => {
  const { R, ctx } = monta(2, ["Garchomp", "Scizor", "Metagross", "Gyarados", "Togekiss", "Gardevoir", "Blissey", "Ferrothorn"]);
  const cands = R.motorCandidatos(ctx, [], []).filter((c) => c.sp.x === c.base.x);
  assert.ok(cands.length >= 6);
  const empate = { valor: () => 1 };
  const nomes = cands.map((c) => c.sname).sort();
  [cands.slice().sort((a, b) => (a.sname < b.sname ? 1 : -1)), cands.slice().sort((a, b) => (a.sname < b.sname ? -1 : 1))].forEach((ordem) => {
    const b = R.motorBuscar(ctx, ordem, [], empate, () => 0);
    assert.deepEqual(b.solo.map((s) => s.c.sname), nomes);
  });
});
