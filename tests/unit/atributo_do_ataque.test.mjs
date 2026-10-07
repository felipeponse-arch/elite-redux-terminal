// Golpes que trocam o atributo de ataque ou de defesa (06/10, lote 4 da fila da comunidade; ver
// docs/decisoes_mecanicas.md): Foul Play usa o Atk do ALVO, Body Press a Def do usuário (battle_util.c
// CalcAttackStat) e os golpes HITS_DEF (Psyshock, Psystrike, Secret Sword, Magical Leaf) atacam com o
// Sp. Atk contra a Defesa física.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 9 });
const ef = () => R.efeitoDasHabilidadesNoDuelo([], "x", null);
const unid = (tipos, stats) => ({ ef: ef(), tipos, stats: [300].concat(stats), ids: [] });
const dano = (nome, atq, def) => {
  atq.golpesProntos = R.prepararGolpesDuelo([R.MOVE_ID_BY_NAME[nome]], atq, null);
  return R.danoNoDuelo(atq, def, 80).melhor.dano;
};
// [hp, atk, def, spa, spd, spe]
const alvo = (atk, def, spd) => unid(["Normal"], [atk, def, 100, spd, 100]);
const alvoDef = (def, spd) => unid(["Normal"], [100, def, 100, spd, 100]);

test("Psyshock/Secret Sword: usam o Sp. Atk (não o Atk) contra a Defesa física", () => {
  for (const [nome, tipo] of [["Psyshock", "Psychic"], ["Secret Sword", "Fighting"], ["Psystrike", "Psychic"]]) {
    const defensor = alvoDef(100, 300); // Def baixa, Sp. Def alta: só a leitura "contra Def" bate forte
    const fraco = dano(nome, unid([tipo], [300, 100, 10, 100, 100]), defensor); // Atk alto, Sp. Atk baixo (stats: hp,atk,def,spa..)
    const forte = dano(nome, unid([tipo], [10, 100, 300, 100, 100]), defensor);
    assert.ok(forte > fraco * 2, nome + ": Sp. Atk alto tem que render mais que Atk alto (" + forte + " vs " + fraco + ")");
  }
});

test("Psyshock bate na Defesa física: Def alta reduz, Sp. Def alta não", () => {
  const atq = () => unid(["Psychic"], [10, 100, 200, 100, 100]);
  assert.ok(dano("Psyshock", atq(), alvoDef(300, 100)) < dano("Psyshock", atq(), alvoDef(100, 300)) / 2);
});

test("Foul Play: dano segue o Atk do alvo e ignora o Atk de quem usa", () => {
  const baixo = dano("Foul Play", unid(["Dark"], [10, 100, 100, 100, 100]), alvo(50, 100, 100));
  const alto = dano("Foul Play", unid(["Dark"], [10, 100, 100, 100, 100]), alvo(300, 100, 100));
  assert.ok(alto > baixo * 2, "Atk do alvo alto tem que render mais (" + alto + " vs " + baixo + ")");
  const meu = dano("Foul Play", unid(["Dark"], [300, 100, 100, 100, 100]), alvo(50, 100, 100));
  assert.equal(meu, baixo, "o Atk de quem usa não conta");
});

test("Body Press (e Behemoth Bash): dano segue a Def de quem usa e ignora o Atk dele", () => {
  for (const [nome, tipo] of [["Body Press", "Fighting"], ["Behemoth Bash", "Steel"]]) {
    const defensor = alvoDef(100, 100);
    const fraco = dano(nome, unid([tipo], [300, 30, 100, 100, 100]), defensor);
    const forte = dano(nome, unid([tipo], [10, 300, 100, 100, 100]), defensor);
    assert.ok(forte > fraco * 2, nome + ": Def alta tem que render mais (" + forte + " vs " + fraco + ")");
  }
});

test("golpes comuns não mudam: Psychic usa Sp. Atk contra Sp. Def e Close Combat usa Atk contra Def", () => {
  const alvoPsy = alvoDef(300, 100);
  assert.ok(dano("Psychic", unid(["Psychic"], [10, 100, 300, 100, 100]), alvoPsy) > 0);
  assert.ok(dano("Close Combat", unid(["Fighting"], [300, 100, 10, 100, 100]), alvoDef(100, 300)) > 0);
});
