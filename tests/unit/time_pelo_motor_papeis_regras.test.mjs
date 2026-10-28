// Fronteiras das regras de papel e estilo do Modo Motor (TK-03, 27/10/2026): cada teste usa um time real da Etapa 4 que fica DO LADO DE DENTRO
// da fronteira e confere a regra (não só o resultado). Complementa time_pelo_motor_papeis.test.mjs, que cobre os casos em que a prova fecha.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

function monta(nomes, { milestone = 4, builds = {}, travados = [] } = {}) {
  const R = carregarRegras({ milestone });
  R.LUTAS_COMUNS_RUN = null; // juiz só dos chefões, como em time_pelo_motor_papeis.test.mjs (o papel não depende da fatia)
  const sp = (n) => R.SPECIES.find((s) => s && s.n === n);
  nomes.forEach((n) => assert.ok(sp(n), "espécie inexistente: " + n));
  R.state.team = nomes.slice(0, 6).map((n) => sp(n).x);
  R.state.box = nomes.slice(6).map((n) => sp(n).x);
  Object.keys(builds).forEach((n) => {
    const [ability, moves, nature, evs] = builds[n];
    R.state.customBuilds[sp(n).sname] = [{ active: true, ability, moves, item: "", nature, evs }];
  });
  const ctx = R.contextoDoMotor();
  ctx.cache = R.criarCacheDoMotor();
  ctx.fecharItens = false;
  const cands = R.motorCandidatos(ctx, travados.map((n) => sp(n).sname), []).filter((c) => c.sp.x === c.base.x);
  const time = nomes.slice(0, 6).map((n) => cands.find((c) => c.nome === n));
  time.forEach((c, i) => assert.ok(c, "sem candidato: " + nomes[i]));
  return { R, ctx, time, classifica: () => R.motorClassificar(ctx, time) };
}
const tem = (m, papel) => m.papeis.some((p) => p.papel === papel);
// A regra do estilo, escrita à parte do código (Hyper: 4+ ofensivos e nenhum tanque; Bulky: 3+ ofensivos e 1+ tanque; Stall: até 1 ofensivo e 3+ de tanque/apoio).
const estiloDaRegra = ({ ofensivos: o, tanques: t, apoio: a }) => (o + t + a === 0 ? null : o >= 4 && t === 0 ? "Hyper Offense" : o >= 3 && t >= 1 ? "Bulky Offense" : o <= 1 && t + a >= 3 ? "Stall" : "Balance");

test("wallbreaker: só vale quando os nocautes em robustos são metade ou mais dos nocautes (Whimsicott fica de fora, Etapa 4)", () => {
  const { classifica } = monta(["Ferrothorn", "Gyarados", "Dragonite", "Whimsicott", "Metagross", "Salamence"]);
  const cl = classifica();
  cl.membros.forEach((m) => m.papeis.filter((p) => p.papel === "wallbreaker").forEach((p) =>
    assert.ok(p.prova.nocautesEmRobustos >= 2 && p.prova.nocautesEmRobustos * 2 >= p.prova.nocautes, m.nome + " " + JSON.stringify(p.prova))));
  assert.ok(!tem(cl.membros.find((m) => m.nome === "Whimsicott"), "wallbreaker"), "Whimsicott derruba poucos robustos entre os nocautes dele");
  assert.ok(tem(cl.membros.find((m) => m.nome === "Ferrothorn"), "wallbreaker"), "e a regra continua dando o papel a quem prova");
});

test("armador: ter Tailwind NÃO basta, o efeito tem que valer ao menos 1 ponto na luta (Whimsicott em lutas onde o Tailwind rende 0 ou negativo, como em Flannery e Sidney)", () => {
  const builds = { Whimsicott: ["Prankster", ["Tailwind", "Moonblast", "Energy Ball", "Encore"], "Timid", [0, 0, 0, 252, 4, 252]] };
  ["Flannery 1", "Sidney"].forEach((nomeLuta) => {
    const { R, ctx, time, classifica } = monta(["Whimsicott", "Garchomp", "Gyarados", "Scizor", "Metagross", "Hatterene"], { builds, travados: ["Whimsicott"] });
    const luta = ctx.lutas.todas.find((l) => l.nome === nomeLuta);
    assert.ok(luta, "luta inexistente: " + nomeLuta);
    ctx.lutas = Object.assign({}, ctx.lutas, { amostra: [luta] });
    const w = time.find((c) => c.nome === "Whimsicott");
    assert.ok(R.motorTemTipo(ctx, w, R.MOTOR_TIPOS_DE_ARMAR), "a build tem o golpe de armar");
    assert.ok(R.motorDeltaSemTipos(ctx, time, w, luta, R.MOTOR_TIPOS_DE_ARMAR) < 1, "o efeito medido é menor que 1 ponto");
    assert.ok(!tem(classifica().membros.find((m) => m.nome === "Whimsicott"), "armador"), nomeLuta + ": armador sem ganho medido");
  });
});

test("estilo: Hyper Offense pede 4 ofensivos (com 3 e sem tanque é Balance) e Stall pede no máximo 1 (com 2 ofensivos e 3 de tanque/apoio é Balance)", () => {
  const tres = monta(["Togekiss", "Corviknight", "Venusaur", "Swampert", "Ferrothorn", "Metagross"]).classifica();
  assert.deepEqual([tres.estiloProva.ofensivos, tres.estiloProva.tanques], [3, 0], "caso na fronteira: 3 ofensivos e nenhum tanque");
  assert.equal(tres.estilo, estiloDaRegra(tres.estiloProva));
  assert.equal(tres.estilo, "Balance");
  const dois = monta(["Corviknight", "Clefable", "Chansey", "Blissey", "Tentacruel", "Cresselia"]).classifica();
  assert.deepEqual([dois.estiloProva.ofensivos, dois.estiloProva.tanques + dois.estiloProva.apoio], [2, 3], "caso na fronteira: 2 ofensivos e 3 de tanque/apoio");
  assert.equal(dois.estilo, estiloDaRegra(dois.estiloProva));
  assert.equal(dois.estilo, "Balance");
});
