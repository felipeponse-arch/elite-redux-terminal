// Versão 2.65.4 deslocou ids de habilidade (Mighty Horn 391 -> 390; 391 virou Hardened Sheath...). A tradução PT é indexada por id, então
// tem que acompanhar a habilidade pelo NOME. Estes testes travam o realinhamento (scripts/extracao/realinhar_traducoes.mjs) e o dado gravado.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { realinhar, EFEITO_MUDOU } from "../../scripts/extracao/realinhar_traducoes.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ler = (a) => JSON.parse(readFileSync(join(RAIZ, a), "utf8"));

test("realinhar: ids deslocados levam a tradução junto, por nome", () => {
  const antigo = { abilities: [["-", ""], ["A", "a"], ["B", "b"], ["C", "c"]] };
  const novo = { abilities: [["-", ""], ["B", "b"], ["A", "a"], ["C", "c"]] };
  const r = realinhar(antigo, { 1: "pt A", 2: "pt B", 3: "pt C" }, novo);
  assert.deepEqual(r.pt, { 1: "pt B", 2: "pt A", 3: "pt C" });
});

test("realinhar: nome repetido casa por ordem; renomeada leva a tradução; nova fica sem entrada; efeito mudado fica sem entrada", () => {
  const antigo = { abilities: [["-", ""], ["Embody", "x"], ["Embody", "y"], ["Velha", "mesmo efeito"], ["Friend Guard", "50%"]] };
  const novo = { abilities: [["-", ""], ["Embody", "x"], ["Embody", "y"], ["Nova Grafia", "mesmo efeito"], ["Friend Guard", "25%"], ["Inedita", "z"]] };
  assert.ok(EFEITO_MUDOU.has("Friend Guard"));
  const r = realinhar(antigo, { 1: "pt1", 2: "pt2", 3: "pt velha", 4: "pt 50%" }, novo);
  assert.deepEqual(r.pt, { 1: "pt1", 2: "pt2", 3: "pt velha" });
  assert.deepEqual(r.renomeadas, ["Velha -> Nova Grafia"]);
  assert.deepEqual(r.novas, ["5:Inedita"]);
  assert.deepEqual(r.descartadas, ["4:Friend Guard"]);
});

test("dado gravado: cada habilidade deslocada da 2.65.4 tem o texto PT dela e não o de vizinha", () => {
  const dex = ler("data/dex_compact.json"), pt = ler("data/ability_translations_pt.json");
  const id = (n) => dex.abilities.findIndex((a) => a[0] === n);
  assert.match(pt[id("Mighty Horn")], /chifre e broca em 1\.3x/);
  assert.match(pt[id("Marine Apex")], /50% mais dano contra .*Water/);
  assert.match(pt[id("Arctic Fur")], /Enfraquece golpes físicos e especiais recebidos em 35%/);
  assert.match(pt[id("Spectralize")], /Normal se tornam do tipo Ghost/);
  assert.match(pt[id("Thundercall")], /Smite/);
  assert.match(pt[id("Discipline")], /fúria/);
  assert.match(pt[id("Hardened Sheath")], /acertam/, "efeito mudou na 2.65.4 (ao acertar, não ao usar): vale a tradução nova por nome");
});

test("dado gravado: toda tradução aponta para um id que existe no dex e nenhuma habilidade de efeito mudado tem texto antigo", () => {
  const dex = ler("data/dex_compact.json"), pt = ler("data/ability_translations_pt.json");
  for (const k of Object.keys(pt)) assert.ok(dex.abilities[Number(k)], `tradução do id ${k} não tem habilidade`);
  // as de efeito mudado que a tradução nova por nome cobre (nuvem, 15/10) têm o texto novo; as demais ficam sem texto (cai no inglês)
  const porNome = { ...ler("data/traducoes_v07_por_nome.json"), ...ler("data/traducoes_novas_por_nome.json") };
  dex.abilities.forEach((a, i) => {
    if (!EFEITO_MUDOU.has(a[0]) || /\+/.test(a[1])) return;
    if (porNome[a[0]]) assert.equal(pt[i], porNome[a[0]], `${a[0]} deveria ter a tradução nova por nome`);
    else assert.equal(pt[i], undefined, `${a[0]} deveria estar sem tradução`);
  });
});

test("realinhar com porNome: a tradução por nome vale para o id certo e tem precedência", () => {
  const dex = { abilities: [["-", ""], ["A", "x"], ["B", "y"]] };
  const r = realinhar(dex, { 1: "velho A", 2: "velho B" }, dex, {}, { B: "novo B" });
  assert.equal(r.pt[1], "velho A");
  assert.equal(r.pt[2], "novo B");
});
