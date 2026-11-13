// Categoria do set (pacote 12): build Especial só com golpe de dano E; Físico só com F; Misto aceita as duas. Vale em todo caminho
// (padrão, chip do foco, contra chefão e Meu Time), porque todos passam por pipelineCandidatos.
// A categoria é a EFETIVA do motor (unidadeDaBuild: habilidade como Energy Horns ou Magical Fists muda a categoria), não a do dado.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

// O set da candidata vem da NATUREZA (não do EV): Machamp Modest com 4 EV de Atk ainda é Especial. Natureza neutra = sem set.
const NATUREZA_DO_SET = { Adamant: "F", Jolly: "F", Modest: "E", Timid: "E" };
const setDaCandidata = (c) => NATUREZA_DO_SET[c.build.nature] || null;
const especiePorNome = (R, n) => R.SPECIES.find((s) => s && s.n === n);
const regrasDaEtapa = (m) => carregarRegras({ milestone: m, difficulty: "ace", levelCapMode: "more" });
// Golpes de dano da build com a categoria efetiva do motor (mesma conta de unidadeDaBuild). Status não entra.
function danoEfetivo(R, sp, c) {
  const u = R.unidadeDaBuild(sp, c.build, 50, null);
  const mapa = {};
  (u.golpesProntos || []).forEach((g) => { mapa[g.nome] = g; });
  return mapa;
}
// Golpes de dano da categoria `cat` que a build não podia ter.
function errados(R, sp, c) {
  const set = setDaCandidata(c);
  if (!set) return [];
  const mapa = danoEfetivo(R, sp, c);
  const proibida = set === "E" ? "F" : "E";
  // Golpe fora de golpesProntos não passa em branco: cai na categoria do dado (poder>0). Pivô é livre (decisão do usuário, 13/11).
  const info = (n) => { if (mapa[n]) return mapa[n]; const m = R.MOVE_BY_NAME[n]; return m ? { poder: m[3], cat: m[2] === 0 ? "F" : m[2] === 1 ? "E" : null } : { poder: 1, cat: proibida }; };
  // Array de outro realm (carregarRegras): deepStrictEqual com [] falha, então compara-se o tamanho.
  return c.golpes.filter((n) => !R.ehGolpeDePivo(n) && info(n).poder > 0 && info(n).cat === proibida);
}

test("Espeon Modest na Etapa 5: nenhum golpe físico de dano (Psycho Cut e Bite saíam antes)", () => {
  const R = regrasDaEtapa(5);
  const sp = especiePorNome(R, "Espeon");
  const r = R.candidatosDeBuild(sp, {});
  assert.ok(r.candidatos.length > 0);
  r.candidatos.forEach((c) => assert.equal(errados(R, sp, c).length, 0, `${c.build.nature}: ${c.golpes.join(", ")}`));
});

test("Indeedee Modest na Etapa 5: nenhum golpe físico de dano (Feint saía antes)", () => {
  const R = regrasDaEtapa(5);
  const sp = especiePorNome(R, "Indeedee");
  R.candidatosDeBuild(sp, {}).candidatos.forEach((c) => assert.equal(errados(R, sp, c).length, 0, `${c.build.nature}: ${c.golpes.join(", ")}`));
});

test("Espeon Timid na Etapa 9: nenhum golpe físico de dano (Bite saía antes)", () => {
  const R = regrasDaEtapa(9);
  const sp = especiePorNome(R, "Espeon");
  R.candidatosDeBuild(sp, {}).candidatos.forEach((c) => assert.equal(errados(R, sp, c).length, 0, `${c.build.nature}: ${c.golpes.join(", ")}`));
});

test("varredura: nenhum set Especial tem golpe F de dano, e nenhum Físico tem golpe E (amostra em 3 Etapas)", () => {
  const achados = [];
  [1, 5, 9].forEach((m) => {
    const R = regrasDaEtapa(m);
    ["Espeon", "Indeedee", "Alakazam Mega", "Machamp", "Gardevoir"].forEach((n) => {
      const sp = especiePorNome(R, n);
      if (!sp) return;
      R.candidatosDeBuild(sp, {}).candidatos.forEach((c) => {
        const e = errados(R, sp, c);
        if (e.length) achados.push(`Etapa ${m} ${n} ${setDaCandidata(c)}: ${e.join(", ")}`);
      });
    });
  });
  assert.equal(achados.length, 0, achados.join(" | "));
});

// Caminho do foco (chip Especial) e padrão, no kit e fora dele: o Alakazam Mega (especial) não leva golpe F de dano (Fire/Ice Punch).
// A categoria de golpe fora do kit é a estática do dado (shortcut documentado em pipeline_build.js); este teste prova que não vaza.
test("Alakazam Mega nas Etapas 1, 5 e 9: padrão e foco Especial sem golpe F de dano (Fire Punch, Ice Punch...)", () => {
  const achados = [];
  [1, 5, 9].forEach((m) => {
    const R = regrasDaEtapa(m);
    const sp = especiePorNome(R, "Alakazam Mega");
    const fisico = (n) => { const x = R.MOVE_BY_NAME[n]; return x && x[3] > 0 && x[2] === 0 && !R.ehGolpeDePivo(n); };
    R.candidatosDeBuild(sp, {}).candidatos.forEach((c) => { if (setDaCandidata(c) === "E") c.golpes.filter(fisico).forEach((n) => achados.push(`Etapa ${m} padrão ${n}`)); });
    const f = R.buildFocadaDoMotor("Alakazam Mega", "Especial");
    if (f.ok) f.build.golpes.filter(fisico).forEach((n) => achados.push(`Etapa ${m} foco ${n}`));
  });
  assert.equal(achados.length, 0, achados.join(" | "));
});

// Categoria efetiva: Magical Fists faz o golpe de soco ser especial; Meteor Mash (F no dado) PODE entrar no set Modest.
test("categoria efetiva: Magical Fists torna o Meteor Mash especial e ele entra no set Modest do Electabuzz (Etapa 5)", () => {
  const R = regrasDaEtapa(5);
  const sp = especiePorNome(R, "Electabuzz");
  const c = R.candidatosDeBuild(sp, {}).candidatos.find((x) => x.habilidade === "Magical Fists" && x.build.nature === "Modest" && x.golpes.includes("Meteor Mash"));
  assert.ok(c, "Meteor Mash (F no dado) deveria entrar no set especial com Magical Fists");
  assert.equal(R.MOVE_BY_NAME["Meteor Mash"][2], 0, "no dado é físico");
  assert.equal(danoEfetivo(R, sp, c)["Meteor Mash"].cat, "E", "efetivo é especial");
});
