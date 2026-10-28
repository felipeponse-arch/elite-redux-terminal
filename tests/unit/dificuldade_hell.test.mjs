// TK-10a: a Dificuldade Hell existe no save e no seletor; Dificuldade do jogador e tier do chefão são mapas separados.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { carregarRegras } from "./carregar_regras.mjs";

test("save com Dificuldade hell abre como hell; easy/ace/elite e lixo seguem como antes", () => {
  const R = carregarRegras({ difficulty: "ace" });
  for (const d of ["easy", "ace", "elite", "hell"]) {
    R.applySave({ team: [], box: [], settings: { difficulty: d } });
    assert.equal(R.state.settings.difficulty, d);
  }
  R.state.settings.difficulty = "ace";
  R.applySave({ team: [], box: [], settings: { difficulty: "inventada" } });
  assert.equal(R.state.settings.difficulty, "ace", "valor desconhecido não muda a Dificuldade");
  R.applySave({ team: [], box: [], settings: { milestone: 2 } }); // save antigo sem difficulty
  assert.equal(R.state.settings.difficulty, "ace");
});

test("Hell lê o time 'hell' do chefão; os demais tiers não mudam", () => {
  const R = carregarRegras({ difficulty: "hell" });
  const comHell = R.BOSSES.filter((b) => b.hell && b.hell.length);
  assert.equal(comHell.length, 43, "43 chefões têm time hell nos dados");
  assert.ok(comHell.every((b) => R.varianteDoChefao(b) === "hell"));
  const semHell = R.BOSSES.find((b) => !(b.hell && b.hell.length));
  assert.equal(R.varianteDoChefao(semHell), "party", "sem time hell, cai no party como o insane já fazia");
  for (const [d, t] of [["easy", "party"], ["ace", "party"], ["elite", "insane"]]) {
    R.state.settings.difficulty = d;
    assert.equal(R.varianteDoChefao(comHell[0]), t);
  }
});

test("Nota (rank) em Hell usa a visão insane e não quebra", () => {
  const R = carregarRegras({ difficulty: "hell" });
  const sp = Object.keys(R.SPECIES_RANK)[0];
  const hell = R.rankDe(sp);
  R.state.settings.difficulty = "elite";
  assert.equal(hell.tier, R.rankDe(sp).tier);
});

test("seletor de Dificuldade do template tem a opção Hell", () => {
  const html = readFileSync(new URL("../../artifact_template.html", import.meta.url), "utf8");
  assert.match(html, /<select id="settings-difficulty"[\s\S]*?<option value="hell">Hell<\/option>[\s\S]*?<\/select>/);
});
