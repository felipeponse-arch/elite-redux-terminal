// "Ficar com este time" grava as builds como "Sugestão do app" (ticket time-pelo-motor/01, F5, 21/10/2026).
// Dado real: o time vem do próprio Modo Motor. Cada teste cobre um risco do pedido do usuário (save, conflito com build própria, favorito da caixa).
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const ELENCO = ["Centiskorch", "Scizor", "Garchomp", "Metagross", "Grimmsnarl", "Togekiss", "Klefki", "Gardevoir"];
const R = carregarRegras({ milestone: 2 });
const sp = (n) => R.SPECIES.find((s) => s && s.n === n);
const copia = (o) => JSON.parse(JSON.stringify(o));
const zerar = () => {
  const s = R.state;
  s.team = ELENCO.slice(0, 6).map((n) => sp(n).x); s.box = ELENCO.slice(6).map((n) => sp(n).x);
  s.customBuilds = {}; s.orphans = { team: [], box: [] }; s.autoLog = [];
  s.archetype = { pace: null, weather: null, monotype: null, tatica: null, reasoning: "" };
};
zerar();
const cache = R.criarCacheDoMotor();
const variante = (favoritos = []) => {
  const ctx = R.contextoDoMotor(); ctx.cache = cache;
  return copia(R.montarTimePeloMotor(ctx, { favoritos }).variantes[0]);
};
const membros = variante().membros;
const entrada = (source, active, i = 0) => ({ ability: "X", nature: "Jolly", item: "", moves: ["M" + i, "N" + i], ivs: [31, 31, 31, 31, 31, 31], evs: [0, 0, 0, 0, 0, 0], source, active, savedAt: "2026-10-0" + (i + 1) + "T00:00:00Z", rationale: "" });
const lista = (m) => R.state.customBuilds[m.sname] || [];

beforeEach(zerar);

test("grava a build de cada membro como ativa, com origem 'sugestao', sem pedir plano à IA", () => {
  const r = R.gravarSugestoesDoMotor(membros);
  assert.equal(r.gravadas, membros.length);
  for (const m of membros) {
    const b = lista(m)[0];
    assert.equal(b.source, "sugestao");
    assert.equal(b.active, true);
    assert.deepEqual(copia(b.moves), copia(m.build.moves));
    assert.equal(b.ability, m.build.ability);
    assert.equal(b.revisar, undefined, "sem revisão automática (que chamaria a IA)");
    assert.equal(b.planoConsultado, true);
  }
});

test("save: a origem 'sugestao' sobrevive a buildSave -> applySave, a soma confere e a sincronização vê igual", () => {
  R.gravarSugestoesDoMotor(membros);
  const salvo = copia(R.buildSave());
  assert.equal(R.conferirSomaDoSave(salvo), "ok");
  R.state.customBuilds = {};
  R.applySave(salvo);
  assert.equal(lista(membros[0])[0].source, "sugestao");
  assert.equal(R.syncContentDiffers(salvo, copia(R.buildSave())), false);
});

test("save antigo carrega: build única no formato velho e origem desconhecida viram 'manual' sem perder dado", () => {
  const m = membros[0];
  R.applySave({ team: [], box: [], customBuilds: {
    [m.sname]: { ability: m.build.ability, nature: "Adamant", item: "", moves: [m.build.moves[0]], ivs: [31, 31, 31, 31, 31, 31], evs: [0, 252, 0, 0, 0, 0], source: "ia", active: true },
    [membros[1].sname]: [{ ability: membros[1].build.ability, nature: "Adamant", item: "", moves: [membros[1].build.moves[0]], source: "origem-do-futuro", active: true }],
  } });
  assert.equal(lista(m)[0].source, "ia");
  assert.equal(lista(m)[0].moves[0], m.build.moves[0]);
  assert.equal(lista(membros[1])[0].source, "manual", "origem que este app não conhece cai em manual, nunca é aceita crua");
});

test("build própria ativa nunca é sobrescrita: pede confirmação e, confirmada, a sugestão entra como variante", () => {
  const m = membros[0];
  R.state.customBuilds[m.sname] = [entrada("manual", true, 0)];
  const plano = R.planoDeGravarSugestoes(membros);
  const p = plano.find((x) => x.sname === m.sname);
  assert.equal(p.acao, "variante");
  assert.equal(p.confirmar, true, "tem que avisar o jogador antes");
  assert.equal(plano.filter((x) => x.confirmar).length, 1, "quem não tem build própria não pede confirmação");
  assert.equal(JSON.stringify(lista(m)), JSON.stringify([entrada("manual", true, 0)]), "planejar não muda nada");
  R.gravarSugestoesDoMotor(membros);
  assert.equal(lista(m).length, 2);
  assert.equal(lista(m)[0].source, "manual");
  assert.equal(lista(m)[0].moves[0], "M0", "a build do jogador continua inteira");
  assert.equal(lista(m)[0].active, false);
  assert.equal(lista(m)[1].source, "sugestao");
  assert.equal(lista(m)[1].active, true);
});

test("lista cheia de builds do jogador: sem vaga, nada é gravado nem apagado", () => {
  const m = membros[0];
  R.state.customBuilds[m.sname] = [entrada("manual", true, 0), entrada("manual", false, 1), entrada("ia", false, 2)];
  const antes = JSON.stringify(R.state.customBuilds[m.sname]);
  const r = R.gravarSugestoesDoMotor(membros);
  assert.deepEqual(copia(r.semVaga), [m.nome]);
  assert.equal(JSON.stringify(R.state.customBuilds[m.sname]), antes);
  assert.equal(R.planoDeGravarSugestoes(membros).find((x) => x.sname === m.sname).confirmar, false, "sem vaga não há o que confirmar");
});

test("lista cheia com uma build do app: a do app sai, as do jogador ficam", () => {
  const m = membros[0];
  R.state.customBuilds[m.sname] = [entrada("manual", true, 0), entrada("manual", false, 1), entrada("curada", false, 2)];
  R.gravarSugestoesDoMotor(membros);
  assert.equal(lista(m).length, 3);
  assert.equal(lista(m).filter((b) => b.source === "manual").length, 2);
  assert.equal(lista(m).filter((b) => b.source === "sugestao" && b.active).length, 1);
});

test("repetir não duplica: mesma sugestão só reativa; sugestão antiga diferente é trocada", () => {
  const m = membros[0];
  R.gravarSugestoesDoMotor(membros);
  R.gravarSugestoesDoMotor(membros);
  assert.equal(lista(m).length, 1);
  R.state.customBuilds[m.sname][0].moves = ["Outro", "Golpe"];
  const p = R.planoDeGravarSugestoes(membros).find((x) => x.sname === m.sname);
  assert.equal(p.acao, "trocar");
  assert.equal(p.confirmar, false, "trocar a sugestão do app não é mexer em build do jogador");
  R.gravarSugestoesDoMotor(membros);
  assert.equal(lista(m).length, 1);
  assert.deepEqual(copia(lista(m)[0].moves), copia(m.build.moves));
});

test("build já salva pelo jogador (origem 'build-salva' do favorito) não é regravada", () => {
  const m = membros[0];
  const doJogador = { ...m, origem: "build-salva" };
  assert.equal(R.planoDeGravarSugestoes([doJogador]).length, 0);
  assert.equal(R.gravarSugestoesDoMotor([doJogador]).gravadas, 0);
  assert.equal(lista(m).length, 0);
});

test("a sugestão gravada não vira 'build salva do jogador' na próxima montagem; a build manual continua mandando", () => {
  const fav = membros[0];
  R.gravarSugestoesDoMotor(membros);
  const m = variante([fav.base]).membros.find((x) => x.base === fav.base);
  assert.notEqual(m.origem, "build-salva");
  R.state.customBuilds[fav.sname] = [entrada("manual", true, 0)];
  const m2 = variante([fav.base]).membros.find((x) => x.base === fav.base);
  assert.equal(m2.origem, "build-salva");
});

test("favorito que está só na CAIXA entra travado nas três variantes", () => {
  const caixa = sp("Klefki");
  assert.ok(R.state.box.includes(caixa.x) && !R.state.team.includes(caixa.x));
  const ctx = R.contextoDoMotor(); ctx.cache = cache;
  const res = R.montarTimePeloMotor(ctx, { favoritos: [caixa.sname] });
  for (const v of res.variantes) {
    const m = v.membros.find((x) => x.base === caixa.sname);
    assert.ok(m, "Klefki (da caixa) está em " + v.chave);
    assert.equal(m.travado, true);
  }
});
