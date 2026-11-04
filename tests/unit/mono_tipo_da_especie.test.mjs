// TK-36: mono_disponibilidade.json listava a Snubbull em Ground; na 2.65.5 ela é Fada pura. Toda espécie sem marca (# % M) tem que ter o tipo da lista no dex.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lerJson = (n) => JSON.parse(readFileSync(new URL("../../data/" + n, import.meta.url), "utf8"));
const mono = lerJson("mono_disponibilidade.json");
const dex = lerJson("dex_compact.json");
const porSname = new Map(dex.species.filter(Boolean).map((s) => [s.sname, s]));

// Divergências antigas, ainda sem decisão do usuário (levadas como dúvida no TK-36): não entram na regra até alguém decidir.
const PENDENTES = new Set(["Electric:SPECIES_VOLBEAT", "Electric:SPECIES_IRON_EXO", "Fairy:SPECIES_ILLUMISE", "Fairy:SPECIES_ABSOL"]);

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
