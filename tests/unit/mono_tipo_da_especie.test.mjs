// TK-36: mono_disponibilidade.json listava a Snubbull em Ground; na 2.65.5 ela é Fada pura. Toda espécie sem marca (# % M) tem que ter o tipo da lista no dex.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lerJson = (n) => JSON.parse(readFileSync(new URL("../../data/" + n, import.meta.url), "utf8"));
const mono = lerJson("mono_disponibilidade.json");
const dex = lerJson("dex_compact.json");
const porSname = new Map(dex.species.filter(Boolean).map((s) => [s.sname, s]));

// Divergências antigas, ainda sem decisão do usuário (levadas como dúvida no TK-36): não entram na regra até alguém decidir.
const PENDENTES = new Set();

test("Snubbull não está em Ground (é Fada pura na 2.65.5)", () => {
  assert.ok(!mono.porTipo.Ground.some((x) => x.s === "SPECIES_SNUBBULL"));
  assert.ok(mono.porTipo.Fairy.some((x) => x.s === "SPECIES_SNUBBULL"));
});

test("espécie sem marca de evolução/forma tem o tipo da lista no dex_compact", () => {
  const erros = [];
  for (const [tipo, lista] of Object.entries(mono.porTipo)) for (const x of lista) {
    const sp = porSname.get(x.s);
    if (!sp) { erros.push(`${tipo}: ${x.s} não existe no dex`); continue; }
    if (/[#%M]/.test(x.m || "") || PENDENTES.has(`${tipo}:${x.s}`)) continue;
    const tipos = (sp.t || []).map((i) => dex.types[i]);
    if (!tipos.includes(tipo)) erros.push(`${tipo}: ${x.s} (no jogo: ${tipos.join("/")})`);
  }
  assert.deepEqual(erros, []);
});

// ---- TK-41.6: o importador cruza com o dex (a próxima importação não desfaz o TK-38) ----
import { cruzarComDex, preservarEApp } from "../../scripts/importar_mono.mjs";

test("cruzarComDex (fixture): tipo errado sem marca sai; dupla tipagem entra nos dois tipos; marcas e eApp ficam", () => {
  const mini = { types: ["Normal", "Fire", "Ice", "Fairy"], species: [null,
    { sname: "SPECIES_A", t: [1, 2] }, { sname: "SPECIES_B", t: [3] }, { sname: "SPECIES_C", t: [0] }] };
  const lista = { Normal: [{ s: "SPECIES_B", e: 2, l: "x" }, { s: "SPECIES_C", e: 1, l: "c", m: "*" }], Fire: [{ s: "SPECIES_A", e: 3, l: "Rota", m: "%", eApp: 1 }], Ice: [], Fairy: [{ s: "SPECIES_C", e: 5, l: "y", m: "#" }] };
  const r = cruzarComDex(lista, mini);
  assert.deepEqual(r.removidas, ["Normal:SPECIES_B"], "B é Fairy: Normal sem marca sai");
  assert.deepEqual([...r.acrescentadas].sort(), ["Fairy:SPECIES_B", "Ice:SPECIES_A"]);
  assert.deepEqual(r.porTipo.Ice, [{ s: "SPECIES_A", e: 3, l: "Rota", eApp: 1 }], "A entra em Ice com a etapa/local/eApp da entrada mais cedo, sem marca");
  assert.deepEqual(r.porTipo.Fire, lista.Fire, "marca % e eApp intactos");
  assert.ok(r.porTipo.Fairy.some((x) => x.s === "SPECIES_C" && x.m === "#"), "C com # em Fairy fica");
  assert.ok(r.porTipo.Normal.some((x) => x.s === "SPECIES_C" && x.m === "*"));
});

test("preservarEApp: reaproveita o eApp do arquivo anterior por (tipo, espécie) e, na falta, pela espécie", () => {
  const antigo = { porTipo: { Fire: [{ s: "SPECIES_A", e: 3, l: "r", eApp: 1 }] } };
  const novo = preservarEApp({ Fire: [{ s: "SPECIES_A", e: 3, l: "r" }], Ice: [{ s: "SPECIES_A", e: 3, l: "r" }, { s: "SPECIES_Z", e: 0, l: "z" }] }, antigo);
  assert.equal(novo.Fire[0].eApp, 1);
  assert.equal(novo.Ice[0].eApp, 1);
  assert.equal(novo.Ice[1].eApp, undefined);
});

test("dex -> lista: toda espécie que aparece em alguma lista aparece em todos os tipos dela (dupla tipagem em cada run mono)", () => {
  const onde = new Map();
  for (const [tipo, lista] of Object.entries(mono.porTipo)) for (const x of lista) (onde.get(x.s) || onde.set(x.s, new Set()).get(x.s)).add(tipo);
  const faltam = [];
  for (const [s, tipos] of onde) for (const i of porSname.get(s).t) if (!tipos.has(dex.types[i])) faltam.push(`${dex.types[i]}: ${s}`);
  assert.deepEqual(faltam, []);
});
