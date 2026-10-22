// O Modo Motor fecha o item de cada membro (ticket motor-item/01, 22/10/2026): testa os itens liberados na Etapa que o motor simula e
// fica com o que mais sobe a nota na luta completa. Dado real: o elenco do relato do usuário, sem save, etapas 5 e 8.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const ELENCO = ["Centiskorch", "Scizor", "Garchomp", "Metagross", "Grimmsnarl", "Togekiss", "Klefki", "Gardevoir", "Ledian", "Gyarados"];
function monta(milestone) {
  const R = carregarRegras({ milestone });
  const sp = (n) => R.SPECIES.find((s) => s && s.n === n);
  R.state.team = ELENCO.slice(0, 6).map((n) => sp(n).x);
  R.state.box = ELENCO.slice(6).map((n) => sp(n).x);
  const ctx = R.contextoDoMotor();
  ctx.cache = R.criarCacheDoMotor();
  const t0 = Date.now();
  const res = R.montarTimePeloMotor(ctx, { variantes: ["ofensivo"] });
  return { R, ctx, v: res.variantes[0], ms: Date.now() - t0 };
}
const tempo = {};
for (const etapa of [5, 8]) {
  test("etapa " + etapa + ": quem não é mega recebe item liberado na Etapa, nunca um item não liberado", () => {
    const { R, ctx, v, ms } = monta(etapa);
    tempo[etapa] = ms;
    const semPedra = v.membros.filter((m) => !/ite( [XYZ])?$/.test(m.build.item || ""));
    assert.ok(semPedra.length > 0);
    semPedra.forEach((m) => assert.ok(m.build.item, m.nome + " ficou sem item"));
    v.membros.forEach((m) => {
      if (m.build.item) assert.ok(R.liberadoNaRun(ctx.etapa, ctx.cap, { item: m.build.item }), m.nome + ": " + m.build.item + " não liberado");
    });
    console.log("etapa", etapa, ms + "ms", v.membros.map((m) => m.nome + "=" + m.build.item).join(", "));
  });
}

test("determinismo e o mesmo item na tela e no que é gravado (a build do membro é a que vai para o save)", () => {
  const a = monta(5), b = monta(5);
  const f = (x) => x.v.membros.map((m) => m.sname + "=" + m.build.item).join("|");
  assert.equal(f(a), f(b));
  // a tela (src/ui/modo_motor.js) e "Ficar com este time" leem membro.build: o item fechado tem que estar nela, e a chave de cache bate com ela
  a.v.membros.forEach((m) => assert.equal(typeof m.build.item, "string"));
});

test("item fica fora da lista se a Etapa não libera: lista de candidatos só tem liberados", () => {
  const R = carregarRegras({ milestone: 2 });
  const sp = R.SPECIES.find((s) => s && s.n === "Garchomp");
  R.state.team = [sp.x]; R.state.box = [];
  const ctx = R.contextoDoMotor(); ctx.cache = R.criarCacheDoMotor();
  const res = R.montarTimePeloMotor(ctx, { variantes: ["ofensivo"] });
  res.variantes[0].membros.forEach((m) => { if (m.build.item) assert.ok(R.liberadoNaRun(ctx.etapa, ctx.cap, { item: m.build.item }), m.build.item); });
});

test("ctx.fecharItens = false mantém o comportamento antigo (sem item além das exceções do pipeline)", () => {
  const R = carregarRegras({ milestone: 5 });
  const sp = (n) => R.SPECIES.find((s) => s && s.n === n);
  R.state.team = ELENCO.slice(0, 6).map((n) => sp(n).x); R.state.box = [];
  const ctx = R.contextoDoMotor(); ctx.cache = R.criarCacheDoMotor(); ctx.fecharItens = false;
  const v = R.montarTimePeloMotor(ctx, { variantes: ["ofensivo"] }).variantes[0];
  assert.equal(v.itensFechados.length, 0);
  v.membros.forEach((m) => assert.ok(!m.build.item || /ite( [XYZ])?$|Eviolite|Berry/.test(m.build.item), m.nome + ": " + m.build.item));
});
