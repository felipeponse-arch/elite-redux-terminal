// Fatia fixa de peso do rank (ticket todas-as-lutas/02, 21/10/2026): chefões 60% e lutas comuns 40%, com a composição REAL da run
// (as 29 lutas de chefão de LUTAS_DA_RUN + os treinadores comuns do dado do jogo). Sem fatia, as comuns pesam ~95% (estudo.md §4).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";
import { lutasComunsDaRun } from "../../scripts/estudo/lutas_comuns.mjs";
import { notasComFatia, comunsMaisPerigosas, FATIA_DOS_CHEFOES, COMUNS_POR_ETAPA } from "../../scripts/rank_fatia.mjs";

const R = carregarRegras({ milestone: 0 });
const comuns = lutasComunsDaRun().lutas;
const lutas = R.LUTAS_DA_RUN.map(([nome, etapa]) => ({ nome, etapa, comum: false })).concat(comuns.map((l) => ({ nome: l.nome, etapa: l.etapa, comum: true })));
const todas = lutas.map((_, i) => i);

test("a composição real: 29 chefões e centenas de comuns (sem a fatia as comuns dominariam)", () => {
  assert.equal(R.LUTAS_DA_RUN.length, 29);
  assert.ok(comuns.length >= 500, "comuns: " + comuns.length);
  assert.equal(FATIA_DOS_CHEFOES, 0.6);
});

test("a fatia 60/40 pesa certo: quem gabarita só os chefões tira 0,6; quem gabarita só as comuns tira 0,4", () => {
  const br = { soChefao: (i) => (lutas[i].comum ? 0 : 1), soComum: (i) => (lutas[i].comum ? 1 : 0) };
  const lista = (s) => todas.map((i) => [i, br[s](i)]);
  const validos = ["soChefao", "soComum"];
  const com = notasComFatia(lutas, validos, lista, FATIA_DOS_CHEFOES);
  assert.ok(Math.abs(com.nota.soChefao - 0.6) < 1e-9, "soChefao " + com.nota.soChefao);
  assert.ok(Math.abs(com.nota.soComum - 0.4) < 1e-9, "soComum " + com.nota.soComum);
  // Sem a fatia (todas no mesmo saco) quem só gabarita os chefões fica perto de zero: era o problema que a fatia resolve.
  const sem = notasComFatia(lutas, validos, lista, null);
  assert.ok(sem.nota.soChefao < 0.15, "sem fatia, os chefões valem pouco: " + sem.nota.soChefao);
  assert.ok(sem.nota.soComum > 0.85, "sem fatia, as comuns valem quase tudo: " + sem.nota.soComum);
});

test("espécie que só enfrenta uma fatia fica com a nota dessa fatia (não é punida por chegar tarde)", () => {
  const ultimaComum = Math.max(...comuns.map((l) => l.etapa));
  // "tarde" só cobre as lutas de chefão da última etapa em diante; nenhuma comum.
  const lista = (s) => todas.filter((i) => s === "cedo" || (!lutas[i].comum && lutas[i].etapa >= ultimaComum)).map((i) => [i, 0.8]);
  const r = notasComFatia(lutas, ["cedo", "tarde"], lista, FATIA_DOS_CHEFOES);
  assert.ok(Math.abs(r.nota.tarde - 0.8) < 1e-9 && Math.abs(r.nota.cedo - 0.8) < 1e-9);
});

test("comunsMaisPerigosas: no máximo 30 por etapa, as de maior ameaça, e a etapa 4 não fica vazia", () => {
  const peso = lutas.map((_, i) => ((i * 2654435761) % 1000) / 1000); // pesos fixos e espalhados
  const sel = comunsMaisPerigosas(lutas, peso);
  const porEtapa = {};
  sel.forEach((s) => { porEtapa[s.etapa] = (porEtapa[s.etapa] || 0) + 1; });
  assert.ok(Object.values(porEtapa).every((n) => n <= COMUNS_POR_ETAPA));
  assert.ok(porEtapa[4] > 0, "etapa 4 (ginásio do Norman) tem lutas comuns: " + JSON.stringify(porEtapa));
  // A mais perigosa de uma etapa cheia entra; a mais fraca dela não.
  const etapa = 6, daEtapa = lutas.map((l, i) => ({ l, p: peso[i] })).filter((x) => x.l.comum && x.l.etapa === etapa).sort((a, b) => b.p - a.p);
  assert.ok(daEtapa.length > COMUNS_POR_ETAPA);
  const nomes = new Set(sel.map((s) => s.nome));
  assert.ok(nomes.has(daEtapa[0].l.nome) && !nomes.has(daEtapa[daEtapa.length - 1].l.nome));
  assert.equal(R.LUTAS_DA_RUN.some(([n]) => nomes.has(n)), false, "chefão não entra na lista de comuns");
});
