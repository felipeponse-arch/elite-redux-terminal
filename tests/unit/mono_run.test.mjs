// Mono run: disponibilidade por tipo e etapa (2026-09-26). O dado vem da
// planilha da comunidade, importada por scripts/importar_mono.mjs; aqui se
// garante que o que o app mostra é coerente com o jogo atual.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";
import { lerNome, lerCsv } from "../../scripts/importar_mono.mjs";

const R = carregarRegras();
const nomeTipo = (i) => R.DATA.types[i];

test("todo tipo tem opção desde o início, e toda entrada é uma espécie real", () => {
  for (const [tipo, lista] of Object.entries(R.MONO_DISP.porTipo)) {
    assert.ok(lista.some((e) => e.e === 0), tipo + " tem algo pra pegar antes da Roxanne");
    for (const e of lista) {
      assert.ok(R.getSpeciesBySname(e.s), e.s + " existe no dado");
      assert.ok(Number.isInteger(e.e) && e.e >= 0 && e.e < R.LEVELCAPS.rows.length, "etapa válida: " + e.s);
    }
  }
});

test("entrada sem marca tem o tipo no jogo atual; com # uma evolução tem", () => {
  for (const [tipo, lista] of Object.entries(R.MONO_DISP.porTipo)) {
    for (const e of lista) {
      const sp = R.getSpeciesBySname(e.s);
      if (/[#%M]/.test(e.m || "")) continue;
      assert.ok(sp.t.map(nomeTipo).includes(tipo), `${sp.n} listado em ${tipo} sem ter o tipo`);
    }
    for (const e of lista.filter((x) => (x.m || "").includes("#"))) {
      const linha = R.linhaEvolutivaDe(R.getSpeciesBySname(e.s));
      assert.ok(linha.some((s) => s.t.map(nomeTipo).includes(tipo)), `${e.s}: alguma evolução é ${tipo}`);
    }
    // "M": o tipo só aparece numa Mega da linha evolutiva.
    for (const e of lista.filter((x) => (x.m || "").includes("M"))) {
      const formas = R.linhaEvolutivaDe(R.getSpeciesBySname(e.s)).flatMap((s) => R.formFamilyOf(s));
      assert.ok(formas.some((s) => R.isMegaForm(s) && s.t.map(nomeTipo).includes(tipo)), `${e.s}: uma Mega da linha é ${tipo}`);
    }
  }
});

test("separa novos, anteriores e próxima etapa, e marca quem o jogador já tem", () => {
  const d0 = R.monoDisponibilidade("Fire", 0, []);
  assert.equal(d0.antes.length, 0, "no início nada é 'de antes'");
  assert.equal(d0.proximoLider, "Roxanne");
  assert.ok(d0.novos.some((i) => i.sp.n === "Charmander"));
  assert.ok(d0.proxima.length > 0, "algo libera depois da Roxanne");
  // Quem tem Charmeleon não precisa pegar Charmander.
  const charmeleon = R.SPECIES.find((s) => s.n === "Charmeleon");
  const d = R.monoDisponibilidade("Fire", 2, [charmeleon.x]);
  assert.equal(d.liderAnterior, "Brawley");
  assert.ok(d.antes.find((i) => i.sp.n === "Charmander").jaTem);
  assert.ok(d.novos.every((i) => i.etapa === 2) && d.antes.every((i) => i.etapa < 2));
  const notas = d.antes.filter((i) => i.score >= 0).map((i) => i.score);
  assert.deepEqual(notas, [...notas].sort((a, b) => b - a), "melhores do tipo primeiro");
});

test("importador: marcas e formas regionais da planilha", () => {
  assert.deepEqual(lerNome("Zigzagoon (Galarian)"), { nome: "Zigzagoon Galarian", marcas: "" });
  assert.deepEqual(lerNome("Sylvally (%)"), { nome: "Sylvally", marcas: "%" });
  assert.deepEqual(lerNome("Eevee #*"), { nome: "Eevee", marcas: "#*" });
  assert.deepEqual(lerCsv('a,"b, c",d\n1,2,3'), [["a", "b, c", "d"], ["1", "2", "3"]]);
});
