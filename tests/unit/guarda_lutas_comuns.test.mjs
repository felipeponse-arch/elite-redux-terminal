// Depende de dado: rank/lutas (muda quando o rank é recalculado; não é regra de jogo fixa).
// Guardas de todas-as-lutas/02: dado provisório não publica; o rank gravado não aceita outra fatia nem outra lista de lutas.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { problemaDasLutasComuns } from "../../scripts/guarda_lutas_comuns.mjs";

const RAIZ = new URL("../../", import.meta.url);
const dado = JSON.parse(readFileSync(new URL("data/lutas_comuns_run.json", RAIZ), "utf8"));

test("guarda de publicação: só o rank completo (amostra 1) passa; amostra e ausência barram", () => {
  assert.equal(problemaDasLutasComuns({ amostra: 1 }), null);
  assert.match(problemaDasLutasComuns({ amostra: 80 }), /provisório \(amostra 80\)/);
  assert.match(problemaDasLutasComuns({}), /provisório/);
  assert.match(problemaDasLutasComuns(null), /provisório/);
});

test("o build de publicação (ER_PUBLICAR=1) falha enquanto o arquivo real for de amostra; sem ER_PUBLICAR o build não olha", () => {
  const r = spawnSync(process.execPath, ["scripts/build.mjs"], { cwd: RAIZ, encoding: "utf8", env: { ...process.env, ER_PUBLICAR: "1" } });
  // arquivo completo: a guarda das lutas não barra (outra guarda, como o carimbo do TK-24, pode barrar sozinha)
  if (dado.amostra === 1) assert.doesNotMatch(r.stderr + r.stdout, /provisório/, "arquivo completo: a guarda das lutas deixa seguir");
  else { assert.notEqual(r.status, 0); assert.match(r.stderr + r.stdout, /provisório/); }
});

test("calcular_rank_v2 --gravar recusa outra fatia, --lutas-extra e --so-chefoes (a decisão 60/40 de 16/10)", () => {
  for (const arg of ["--fatia=0.5", "--lutas-extra=x.json", "--so-chefoes"]) {
    const r = spawnSync(process.execPath, ["scripts/calcular_rank_v2.mjs", "--gravar", arg], { cwd: RAIZ, encoding: "utf8" });
    assert.notEqual(r.status, 0, arg);
    assert.match(r.stderr, /--gravar exige a fatia 0\.6/, arg);
  }
});
