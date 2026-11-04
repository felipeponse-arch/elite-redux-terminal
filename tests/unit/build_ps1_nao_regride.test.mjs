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

test("a versão do dado tem fonte única (VERSAO_DEX no alarme): nenhum outro arquivo a repete à mão", async () => {
  const { VERSAO_DEX } = await import("../../scripts/alarme_upstream.mjs");
  const { VERSAO_DADO } = await import("./contagens_versao.mjs");
  assert.equal(VERSAO_DADO, VERSAO_DEX);
  const ps = codigo("scripts/check_upstream.ps1");
  assert.match(ps, /alarme_upstream\.mjs/);
  assert.doesNotMatch(ps, new RegExp(VERSAO_DEX.replace(/\./g, "\.")), "check_upstream.ps1 não pode citar a versão literal");
});

test("build.ps1 lê VERSAO_DEX por caminho relativo ao script e valida antes do Trim", () => {
  const c = codigo("scripts/build.ps1");
  assert.doesNotMatch(c, /import\('\.\/scripts/, "caminho relativo ao diretório atual");
  assert.match(c, /\$PSScriptRoot "alarme_upstream\.mjs"/);
  assert.doesNotMatch(c, /\)\.Trim\(\)/, "Trim direto no retorno do node estoura com $null");
  assert.match(c, /\$LASTEXITCODE -ne 0 -or -not \$lido/);
});

test("scripts .ps1 aposentados abortam sem -Forcar, apontando o substituto Node, antes de tocar em dado", () => {
  const casos = { "transform.ps1": /extracao\/transform\.mjs/, "slim_dex.ps1": /transform\.mjs/, "expand_combo_abilities.ps1": /extracao\/expandir_compostas\.mjs/, "compute_species_rank.ps1": /calcular_rank_v2\.mjs --gravar/ };
  for (const [nome, substituto] of Object.entries(casos)) {
    const c = codigo("scripts/" + nome), i = c.indexOf("GUARDA") === -1 ? c.indexOf("-Forcar") : c.indexOf("-Forcar");
    assert.ok(i !== -1, nome + " sem -Forcar");
    assert.match(c, /exit 1/, nome);
    assert.match(c.slice(0, c.indexOf('"common.ps1"')), substituto, nome + " não aponta o substituto antes de carregar o common.ps1");
    assert.ok(i < c.indexOf('"common.ps1"'), nome + ": guarda tem que vir antes do common.ps1");
  }
  assert.match(ler("scripts/compute_species_rank.ps1"), /SOBRESCREVE data\/species_rank\.json/);
});
