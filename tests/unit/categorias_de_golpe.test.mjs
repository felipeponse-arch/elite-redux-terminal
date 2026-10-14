// Categoria de golpe (soco, mordida, corte...) do NextDex (2026-09-29): antes
// nenhuma habilidade de categoria era lida - Iron Fist, Strong Jaw, Keen Edge,
// Mega Launcher e parecidas não davam bônus nem apareciam como sinergia.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const idGolpe = (n) => R.MOVE_ID_BY_NAME[n];
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];

test("o dado marca as categorias dos golpes clássicos", () => {
  assert.deepEqual([...R.categoriasDoGolpeDuelo(idGolpe("Fire Punch"))], ["soco"]);
  // Bite, não Crunch: a descrição longa do Crunch no NextDex não traz a marcação
  // "Strong Jaw boost" (lacuna do dado oficial, 2026-09-29) - seguimos o dado.
  assert.ok(R.categoriasDoGolpeDuelo(idGolpe("Bite")).includes("mordida"));
  assert.ok(R.categoriasDoGolpeDuelo(idGolpe("Slash")).includes("corte"));
  assert.ok(R.categoriasDoGolpeDuelo(idGolpe("Water Gun")).includes("pulso"));
  assert.deepEqual([...R.categoriasDoGolpeDuelo(idGolpe("Tackle"))], []);
});

test("habilidade de categoria dá bônus só no golpe da categoria (texto do jogo)", () => {
  const nivel = 50;
  const sp = R.SPECIES.find((s) => s && R.golpesDeDueloAte(s, null).includes(idGolpe("Fire Punch")) && R.golpesDeDueloAte(s, null).includes(idGolpe("Flamethrower")));
  assert.ok(sp, "fixture: espécie com Fire Punch e Flamethrower");
  const forca = (ab, golpe) => {
    const u = R.unidadeDeDuelo(sp, R.SETS_DE_DUELO[0], null, nivel, [idGolpe(golpe)], null);
    const ef = R.efeitoDasHabilidadesNoDuelo(ab === null ? [] : [idHab(ab)], "CATEG_" + ab, null);
    const u2 = Object.assign({}, u, { ef, tipos: R.speciesTypeNames(sp) });
    return R.prepararGolpesDuelo([idGolpe(golpe)], u2, null)[0].forca;
  };
  assert.ok(Math.abs(forca("Iron Fist", "Fire Punch") / forca(null, "Fire Punch") - 1.3) < 1e-9);
  assert.equal(forca("Iron Fist", "Flamethrower"), forca(null, "Flamethrower"));
});

test("Mind Crunch torna a mordida especial; Power Fists faz o soco mirar a Defesa Especial", () => {
  assert.ok(R.efeitoDasHabilidadesNoDuelo([idHab("Mind Crunch")], "MC", null).categoriaEspecial.mordida);
  assert.ok(R.efeitoDasHabilidadesNoDuelo([idHab("Power Fists")], "PF", null).categoriaNaSpDef.soco);
  assert.equal(R.efeitoDasHabilidadesNoDuelo([idHab("Dual Wield")], "DW", null).categoriaExtra.corte, 1.4);
});

test("sinergia da espécie inclui a de categoria: quem tem Iron Fist e aprende socos é avisado", () => {
  const sp = R.SPECIES.find((s) => s && R.uniqueIds((s.ab || []).concat(s.inn || [])).includes(idHab("Iron Fist")) &&
    R.golpesDeDueloAte(s, null).some((g) => R.categoriasDoGolpeDuelo(g).includes("soco")));
  assert.ok(sp, "fixture: espécie com Iron Fist que aprende soco");
  const s = R.sinergiasDaEspecie(sp).find((h) => h.name === "Iron Fist");
  assert.ok(s && s.golpes.some((g) => /Punch/.test(g)), JSON.stringify(s));
  assert.ok(s.motivos.includes("bônus de poder"), JSON.stringify(s));
  assert.match(R.montarPromptBuild(sp, {}), /Iron Fist \((innate|escolhivel)\) reforca soco por bônus de poder/);
});

test("sinergia geral preserva o motivo de prioridade e separa Fire Fang de Fire Lash", () => {
  const sp = R.SPECIES.find((s) => s && s.sname === "SPECIES_CENTISKORCH");
  assert.ok(sp, "fixture: Centiskorch");
  const sin = R.sinergiasDaEspecie(sp);
  const coil = sin.find((h) => h.name === "Coil Up");
  assert.ok(coil, JSON.stringify(sin));
  assert.ok(coil.golpes.includes("Fire Fang"), JSON.stringify(coil));
  assert.ok(!coil.golpes.includes("Fire Lash"), JSON.stringify(coil));
  assert.ok(coil.motivos.includes("prioridade no primeiro golpe"), JSON.stringify(coil));
  const jaws = sin.find((h) => h.name === "Flaming Jaws");
  assert.ok(jaws && jaws.motivos.some((m) => /efeito extra/.test(m)), JSON.stringify(jaws));
});

test("motivo de categoria não altera a força do golpe", () => {
  const sp = R.SPECIES.find((s) => s && s.sname === "SPECIES_CENTISKORCH");
  const id = idGolpe("Fire Fang");
  const nivel = 50;
  const sem = R.unidadeDeDuelo(sp, R.SETS_DE_DUELO[0], null, nivel, [id], null);
  const semEfeito = R.efeitoDasHabilidadesNoDuelo([], "PRIORIDADE_TEST_BASE", null);
  const comPrioridade = R.efeitoDasHabilidadesNoDuelo([], "PRIORIDADE_TEST_META", null);
  comPrioridade.prioCheioCategoria.mordida = true;
  const base = R.prepararGolpesDuelo([id], Object.assign({}, sem, { ef: semEfeito, tipos: R.speciesTypeNames(sp) }), null)[0];
  const alterado = R.prepararGolpesDuelo([id], Object.assign({}, sem, { ef: comPrioridade, tipos: R.speciesTypeNames(sp) }), null)[0];
  assert.equal(alterado.forca, base.forca);
  assert.equal(alterado.prioCheio, true);
});
