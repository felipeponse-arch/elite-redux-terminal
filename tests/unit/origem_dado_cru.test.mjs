// TK-25: o dado cru ativo não leva versão no nome, e todo .ps1 que grava/lê dado usa UTF-8 explícito
// (PowerShell 5.1 sem codificação gera mojibake).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";

test("data/gameData.json existe e o nome velho com versão sumiu", () => {
  assert.ok(existsSync("data/gameData.json"));
  assert.ok(!existsSync("data/gameData_2654.json"));
});

test("nenhum script ou teste lê gameData_<versão>.json", () => {
  for (const dir of ["scripts", "tests/unit", "scripts/estudo"]) {
    for (const f of readdirSync(dir).filter((n) => /\.(ps1|mjs)$/.test(n) && n !== "origem_dado_cru.test.mjs")) {
      assert.doesNotMatch(readFileSync(`${dir}/${f}`, "utf8"), /gameData_\d+\.json/, `${dir}/${f}`);
    }
  }
});

test("gravações dos .ps1 são UTF-8 sem BOM explícito; Set-Content/Out-File só com -Encoding", () => {
  for (const f of readdirSync("scripts").filter((n) => n.endsWith(".ps1"))) {
    const t = readFileSync(`scripts/${f}`, "utf8");
    for (const l of t.split("\n").filter((x) => /\b(Set-Content|Out-File|Add-Content)\b/.test(x))) assert.match(l, /-Encoding/, `${f}: ${l.trim()}`);
    for (const l of t.split("\n").filter((x) => /WriteAllText\(/.test(x) && !x.trim().startsWith("#"))) {
      assert.match(l, /UTF8Encoding\(\$false\)/, `${f}: ${l.trim()}`);
    }
  }
});
