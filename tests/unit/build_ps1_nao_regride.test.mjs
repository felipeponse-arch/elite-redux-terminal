// Depende de dado: nome de habilidade das lutas comuns e versão gravada pelo build (muda quando o jogo troca de versão).
// TK-36: o build.ps1 regerava o dado com versão "2.65beta" e sobrescrevia data/species_rank.json (rank do duelo, só se grava no fim, à mão).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ler = (p) => readFileSync(new URL("../../" + p, import.meta.url), "utf8");
// Só as linhas de código (sem comentário) de um .ps1.
const codigo = (p) => ler(p).split(/\r?\n/).filter((l) => !l.trim().startsWith("#")).join("\n");

test("build.ps1 não chama o rank antigo que sobrescreve species_rank.json", () => {
  assert.doesNotMatch(codigo("scripts/build.ps1"), /compute_species_rank\.ps1/);
});

test("build.ps1 extrai o dex pelo transform.mjs com a versão do alarme, não pelo transform.ps1 fixo em 2.65beta", () => {
  const c = codigo("scripts/build.ps1");
  assert.doesNotMatch(c, /transform\.ps1/);
  assert.match(c, /Join-Path \$PSScriptRoot "extracao\/transform\.mjs"/);
  assert.match(c, /Join-Path \$PSScriptRoot "extracao\/expandir_compostas\.mjs"/);
  assert.match(c, /--versao=/);
});

test("nenhum script de build grava a versão 2.65beta", () => {
  for (const p of ["scripts/build.ps1", "scripts/check_upstream.ps1"]) assert.doesNotMatch(codigo(p), /2\.65beta/, p);
});
