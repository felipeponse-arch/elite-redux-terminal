// Ticket 04 (divida-tecnica): sem Level cap o padrão é um só (0 = sem limite; nível de cálculo 100).
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { carregarRegras } from "./carregar_regras.mjs";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src");
const ultimo = (carregarRegras().LEVELCAPS.rows.length) - 1;

test("Champion (sem cap): capOuPadrao 0, nível de cálculo 100", () => {
  const R = carregarRegras({ milestone: ultimo });
  assert.equal(R.getCurrentCap(), null);
  assert.equal(R.capOuPadrao(), 0);
  assert.equal(R.nivelDeCalculo(), 100);
});

test("com cap, o valor do código do jogo não muda (Easy, More, Elite)", () => {
  for (const modo of ["easy", "more", "elite"]) {
    const R = carregarRegras({ milestone: 3, levelCapMode: modo });
    const esperado = R.LEVELCAPS.rows[3][modo];
    assert.equal(R.capOuPadrao(), esperado);
    assert.equal(R.nivelDeCalculo(), esperado);
  }
});

test("a tabela de velocidade do Champion usa o nível 100", () => {
  const R = carregarRegras({ milestone: ultimo });
  assert.equal(R.computeSpeedTiers("").level, 100);
});

test("nenhum chamador tem padrão próprio pro Level cap (varredura em src/)", () => {
  const achados = [];
  const andar = (dir) => readdirSync(dir, { withFileTypes: true }).forEach((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return andar(p);
    if (!p.endsWith(".js")) return;
    readFileSync(p, "utf8").split(/\r?\n/).forEach((l, i) => {
      if (/getCurrentCap\(\)\s*(\|\||\?\?)/.test(l) || /\bcap\s*\|\|\s*\d+/.test(l) || /\bmbCap\s*\|\|/.test(l)) achados.push(p + ":" + (i + 1) + ": " + l.trim());
    });
  });
  andar(raiz);
  assert.deepEqual(achados, []);
});
