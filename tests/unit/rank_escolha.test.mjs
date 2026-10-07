// Ticket 08 (07/10/2026): a escolha do set do rank avalia por inteiro os melhores pela soma rápida
// (scripts/rank_escolha.mjs). Carregado com a mesma sabotagem controlada de carregar_regras.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const NOME = "rank_escolha.mjs";
let codigo = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "..", "scripts", NOME), "utf8").replace(/\r\n/g, "\n");
if (process.env.MUTACAO_ARQUIVO === NOME) {
  const de = process.env.MUTACAO_DE, para = process.env.MUTACAO_PARA || "";
  if (codigo.split(de).length !== 2) throw new Error("trecho da sabotagem não encontrado (ou repetido) em " + NOME + ": " + de);
  codigo = codigo.replace(de, () => para);
}
const M = await import("data:text/javascript;base64," + Buffer.from(codigo).toString("base64"));
const eixo = (...brs) => [{ luta: "x", brs }];

test("candidatos: os 3 melhores pela soma rápida, em ordem", () => {
  const l = [{ s: 1 }, { s: 5 }, { s: 3 }, { s: 4 }, { s: 2 }];
  assert.deepEqual(M.melhoresPelaSoma(l).map((c) => c.s), [5, 4, 3]);
});

test("Crobat: o 2º pela soma (117,09) ganha do 1º (117,23) quando a nota final dele é maior", () => {
  const tanque = { s: 117.23, nota: 0.4 }, fisicoRapido = { s: 117.09, nota: 0.8 }, especial = { s: 116.61, nota: 0.7 };
  const cand = M.melhoresPelaSoma([tanque, fisicoRapido, especial, { s: 100, nota: 0.99 }]);
  assert.equal(M.escolherPelaNotaFinal(cand), fisicoRapido);
});

test("nota dos eixos: média geométrica das médias de BR do potencial e da viabilidade", () => {
  assert.ok(Math.abs(M.notaDosEixos({ potencial: eixo(1, 0.6), viabilidade: eixo(0.4) }) - Math.sqrt(0.8 * 0.4)) < 1e-12);
  assert.equal(M.notaDosEixos({ potencial: eixo(1), viabilidade: eixo(0) }), 0, "eixo zerado zera a nota");
});
