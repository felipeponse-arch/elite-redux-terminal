// TK-23: data/levelcaps.json tem de bater com GetLevelCap() do código do jogo (pokemon.c); 100 = sem limite.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { carregarRegras } from "./carregar_regras.mjs";

const JOGO = "C:/Users/Ponse/Documents/Claude/teste/ferramentas/er-repo/src/pokemon.c";
const R0 = carregarRegras();
const rows = R0.LEVELCAPS.rows;

test("nenhum cap é null (o jogo usa 100)", () => {
  for (const r of rows) for (const m of ["easy", "more", "elite"]) assert.equal(typeof r[m], "number", r.milestone + " " + m);
});

test("bate com levelCapsStandard/More/Strict do pokemon.c", { skip: !existsSync(JOGO) && "er-repo ausente" }, () => {
  const c = readFileSync(JOGO, "utf8");
  const lista = (nome) => c.match(new RegExp(nome + String.raw`\[\] = \{([^}]*)\}`))[1].split(",").map(Number);
  const jogo = { easy: lista("levelCapsStandard"), more: lista("levelCapsMore"), elite: lista("levelCapsStrict") };
  for (const m of ["easy", "more", "elite"]) assert.deepEqual(rows.map((r) => r[m]), jogo[m], m);
});

test("cap 100 = sem limite: getCurrentCap segue null (Easy 7ª/8ª e Champion)", () => {
  for (const [et, modo] of [[7, "easy"], [8, "easy"], [9, "easy"], [9, "more"], [9, "elite"]]) {
    const R = carregarRegras({ milestone: et, levelCapMode: modo });
    assert.equal(R.getCurrentCap(), null, et + modo);
    assert.equal(R.nivelDeCalculo(), 100);
  }
});
