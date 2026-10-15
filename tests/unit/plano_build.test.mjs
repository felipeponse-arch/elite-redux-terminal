// Testes da build que acompanha o jogador (src/regras/plano_build.js), pedido do
// usuário de 2026-09-24. Fixtures sempre achadas no dado real.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const especie = (sname) => { const sp = R.getSpeciesBySname(sname); assert.ok(sp, sname + " existe"); return sp; };
const nomeDe = (id) => R.MOVES[id][0];

// Fixture: espécie que NÃO evolui por nível, com um golpe de nível alto que ela
// só aprende por nível (nem tutor, nem em nível mais baixo) e 2 golpes de tutor.
function fixture() {
  for (const sp of R.SPECIES) {
    if (R.nivelDeEvolucaoDaForma(sp) !== null || sp.tu.length < 2) continue;
    const alto = sp.lm.find((p) => p[0] > 40 && !sp.tu.includes(p[1]) && R.nivelDoGolpe(sp, nomeDe(p[1])) === p[0]);
    if (alto) return { sp, alto: nomeDe(alto[1]), nivel: alto[0], t1: nomeDe(sp.tu[0]), t2: nomeDe(sp.tu[1]) };
  }
  throw new Error("sem fixture");
}

test("estilo pelos EVs e pelo Ritmo do time", () => {
  assert.equal(R.estiloDeEvs("252 Atk / 4 SpD / 252 Spe"), "ofensivo");
  assert.equal(R.estiloDeEvs([252, 0, 252, 0, 4, 0]), "defensivo");
  assert.equal(R.estiloDeEvs("252 HP / 252 SpA / 4 SpD"), "equilibrado");
  assert.equal(R.estiloDoRitmo("Hyper Offense"), "ofensivo");
  assert.equal(R.estiloDoRitmo("Semi-Stall"), "defensivo");
  assert.equal(R.estiloDoRitmo(null), "equilibrado");
  assert.equal(R.evsTextoParaArray("252 Atk / 4 SpD / 252 Spe").join(","), "0,252,0,0,4,252");
});

test("plano: golpe planejado entra quando o cap libera e volta se o cap descer", () => {
  const f = fixture();
  const plano = { [f.t1]: f.alto };
  const antes = R.golpesNoCap(f.sp, [f.t1, f.t2], plano, f.nivel - 1);
  assert.equal(antes.moves.join(","), f.t1 + "," + f.t2, "antes do nível, fica o golpe de agora");
  assert.equal(antes.pendentes.length, 1);
  assert.equal(antes.pendentes[0].nivel, f.nivel);
  const depois = R.golpesNoCap(f.sp, [f.t1, f.t2], plano, f.nivel);
  assert.equal(depois.moves.join(","), f.alto + "," + f.t2, "no nível exato já troca");
  assert.equal(depois.trocas.length, 1);
  assert.equal(R.golpesNoCap(f.sp, [f.t1, f.t2], plano, null).moves[0], f.alto, "sem cap (Campeão) aplica tudo");
  const t = R.trocasEntreCaps(f.sp, [f.t1, f.t2], plano, f.nivel - 1, f.nivel);
  assert.equal(t.entraram.length, 1);
  const volta = R.trocasEntreCaps(f.sp, [f.t1, f.t2], plano, f.nivel, f.nivel - 1);
  assert.equal(volta.voltaram.length, 1, "cap desceu: a troca é desfeita");
});

test("plano: passo que não vale pra forma é ignorado na derivação", () => {
  const f = fixture();
  const outra = R.SPECIES.find((s) => s !== f.sp && R.nivelDoGolpe(s, f.alto) === null);
  const d = R.golpesNoCap(outra, [f.t1], { [f.t1]: f.alto }, 100);
  assert.equal(d.moves[0], f.t1);
  assert.equal(d.trocas.length + d.pendentes.length, 0);
});

test("validarPlano: descarta passo inválido com o motivo, nunca a build", () => {
  const f = fixture();
  const cap = f.nivel - 1;
  const r = R.validarPlano(f.sp, [f.t1, f.t2], {
    [f.t1]: f.alto,                 // vale
    [f.t2]: f.alto,                 // destino repetido
    "Golpe Fora Da Build": f.alto,  // golpe de agora não está na build
  }, cap);
  assert.equal(Object.keys(r.plano).join(","), f.t1);
  assert.equal(r.descartados.length, 2);
  const tutor = R.validarPlano(f.sp, [f.t1], { [f.t1]: f.t2 }, cap);
  assert.equal(Object.keys(tutor.plano).length, 0, "destino de tutor já está liberado - devia estar na build agora");
  assert.match(tutor.descartados[0].motivo, /já está liberado/);
  assert.equal(Object.keys(R.validarPlano(f.sp, [f.t1], { [f.t1]: f.t2 }, null).plano).length, 0, "sem cap: tutor continua recusado");
  assert.equal(Object.keys(R.validarPlano(f.sp, [f.t1], { [f.t1]: f.alto }, null).plano).length, 0, "sem cap: tudo já está liberado, não há o que planejar");
  const semAprender = R.validarPlano(f.sp, [f.t1], { [f.t1]: "Golpe Que Nao Existe" }, cap);
  assert.match(semAprender.descartados[0].motivo, /não aprende/);
  assert.equal(Object.keys(R.validarPlano(f.sp, [f.t1], "lixo", cap).plano).length, 0);
});

test("validarPlano: golpe que só viria depois do nível de evolução é recusado", () => {
  // pré-evolução por nível com golpe de nível acima do nível em que evolui
  let caso = null;
  for (const sp of R.SPECIES) {
    const lim = R.nivelDeEvolucaoDaForma(sp);
    if (lim === null || !sp.tu.length) continue;
    const acima = sp.lm.find((p) => p[0] > lim && !sp.tu.includes(p[1]) && R.nivelDoGolpe(sp, nomeDe(p[1])) === p[0]);
    if (acima) { caso = { sp, lim, golpe: nomeDe(acima[1]), tutor: nomeDe(sp.tu[0]) }; break; }
  }
  assert.ok(caso, "fixture: pré-evolução com golpe acima do nível de evolução");
  const r = R.validarPlano(caso.sp, [caso.tutor], { [caso.tutor]: caso.golpe }, 1);
  assert.equal(Object.keys(r.plano).length, 0);
  assert.match(r.descartados[0].motivo, /evolui no nível/);
});

test("planoSaneado: só formato (texto -> texto, golpe de agora na build)", () => {
  assert.equal(R.planoSaneado(null, ["A"]), null);
  assert.equal(R.planoSaneado(["x"], ["A"]), null);
  assert.equal(JSON.stringify(R.planoSaneado({ A: "B", C: "D", E: 3 }, ["A", "E"])), '{"A":"B"}');
});

test("curadas: lista normalizada e escolha pelo estilo", () => {
  const sn = Object.keys(R.BUILDS).find((k) => !Array.isArray(R.BUILDS[k]) && R.curadasDe(k).length === 1); // curada única, no formato de objeto
  const lista = R.curadasDe(sn);
  assert.equal(lista.length, 1, "objeto único vira lista de 1");
  const estilo = R.estiloDeEvs(lista[0].evs);
  assert.equal(R.curadaParaEstilo(sn, estilo, true), lista[0]);
  const outro = R.ESTILOS_BUILD.find((e) => e !== estilo);
  assert.equal(R.curadaParaEstilo(sn, outro, true), null, "exato: sem curada do estilo = nada");
  assert.equal(R.curadaParaEstilo(sn, outro, false), lista[0], "não exato: cai na primeira");
  const antes = R.BUILDS[sn];
  try {
    R.BUILDS[sn] = [antes, Object.assign({}, antes, { estilo: outro })];
    assert.equal(R.curadaParaEstilo(sn, outro, true).estilo, outro, "lista com mais de uma: acha a do estilo");
  } finally {
    R.BUILDS[sn] = antes;
  }
  assert.equal(R.curadasDe("SPECIES_NAO_EXISTE").length, 0);
});

test("reconciliarBuild tira do plano o passo que a espécie nova não aprende", () => {
  const hax = especie("SPECIES_HAXORUS");
  const golpe = nomeDe(hax.tu[0]);
  const r =R.reconciliarBuild({ ability: "", moves: [golpe], plano: { [golpe]: "Golpe Que Nao Existe" } }, hax);
  assert.equal(Object.keys(r.build.plano).length, 0);
  assert.ok(r.changes.some((c) => c.campo === "plano"));
  const ok = R.reconciliarBuild({ ability: "", moves: [golpe], plano: {} }, hax);
  assert.equal(ok.changes.length, 0, "plano vazio e válido não gera ajuste");
});
