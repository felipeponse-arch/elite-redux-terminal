// Speed Force, Momentum, Impulse, Blur e Elude: a config er-config 30f0f5a (04/11/2026) trocou contato/não-contato por Físico/Especial
// (docs/decisoes_mecanicas.md). O motor lê os DOIS textos: o antigo (dado velho) e o novo (config). Os textos novos entram por
// TEXTO_DA_VERSAO_NOVA_DUELO numa carga própria das regras (o dado do app só os traz depois do ticket de dados).
// Depende de dado: textos de habilidade do dex_compact.json (versão antiga) e os da config 30f0f5a (injetados aqui).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const NOVOS = {
  "Speed Force": "Physical moves use 20% of its Speed stat additionally.",
  Momentum: "Physical moves use the Speed stat for damage calculation.",
  Impulse: "Special moves use the Speed stat for damage.",
  Blur: "Uses Speed as defensive stat when hit by physical.",
  Elude: "Uses Speed as defensive stat when hit by special.",
};
// Textos do dado antigo (NextDex 2.65.4 / er-config b58ea4d): o dado do app já traz os novos (30f0f5a), então o mundo "antigo" os injeta.
// Fixture: er-config b58ea4d AbilityList.textproto (dex_compact.json do commit 4390d7b)
const ANTIGOS = {
  "Speed Force": "Contact moves use 20% of its Speed stat additionally.",
  Momentum: "Contact moves use the Speed stat for damage calculation.",
  Impulse: "Non-contact moves use the Speed stat for damage.",
  Blur: "Uses Speed as defensive stat when hit by contact.",
  Elude: "Uses Speed as defensive stat when hit by non-contact.",
};
function mundo(texto) {
  const R = carregarRegras();
  if (texto === "antigo") {
    for (const [n, t] of Object.entries(ANTIGOS)) R.ABILITIES[R.ABILITY_ID_BY_NAME[n]][1] = t;
    for (const c of [R.descricaoPorIdCache, R.descricaoDeHabilidadeCache]) for (const k of Object.keys(c)) delete c[k];
  }
  if (texto === "novo") Object.assign(R.TEXTO_DA_VERSAO_NOVA_DUELO, NOVOS);
  const ef = (n) => R.efeitoDasHabilidadesNoDuelo(n ? [R.ABILITY_ID_BY_NAME[n]] : [], "VC_" + texto + "_" + n, null);
  const golpe = (cat, contato) => ({ nome: "T", tipo: "Normal", cat, contato, contatoBruto: contato, prio: 0, precisao: 1, forcaBase: 80, forca: 80, poder: 80, status: [], cats: [], flags: [], crit: { estagio: 0 } });
  const u = (n, g, stats) => ({ tipos: ["Water"], ids: [], ef: ef(n), item: "", stats: stats || [320, 100, 100, 100, 100, 300], golpesProntos: [g] });
  const dano = (atq, def) => R.danoNoDuelo(atq, def, 50).melhor.dano;
  const base = (cat, contato) => dano(u(null, golpe(cat, contato)), u(null, golpe("F", false)));
  const com = (n, cat, contato) => dano(u(n, golpe(cat, contato)), u(null, golpe("F", false)));
  const apanha = (n, cat, contato) => dano(u(null, golpe(cat, contato)), u(n, golpe("F", false)));
  return { base, com, apanha };
}

for (const texto of ["antigo", "novo"]) {
  const { base, com } = mundo(texto);
  const sobe = (n, cat, contato) => com(n, cat, contato) > base(cat, contato) * 1.05;
  const igual = (n, cat, contato) => Math.abs(com(n, cat, contato) - base(cat, contato)) < 1e-6;

  test(`Momentum (texto ${texto}): ${texto === "novo" ? "golpe físico sem contato (Earthquake) usa Speed; especial não" : "golpe de contato usa Speed; sem contato não"}`, () => {
    if (texto === "novo") {
      assert.ok(sobe("Momentum", "F", false), "físico sem contato");
      assert.ok(sobe("Momentum", "F", true), "físico com contato");
      assert.ok(igual("Momentum", "E", false), "especial fica como estava");
    } else {
      assert.ok(sobe("Momentum", "F", true), "contato");
      assert.ok(igual("Momentum", "F", false), "sem contato");
    }
  });

  test(`Impulse (texto ${texto}): ${texto === "novo" ? "golpe especial usa Speed; físico não" : "golpe sem contato usa Speed; com contato não"}`, () => {
    if (texto === "novo") {
      assert.ok(sobe("Impulse", "E", false), "especial");
      assert.ok(igual("Impulse", "F", false), "físico sem contato fica como estava");
    } else {
      assert.ok(sobe("Impulse", "F", false), "sem contato");
      assert.ok(igual("Impulse", "F", true), "com contato");
    }
  });

  test(`Speed Force (texto ${texto}): +20% da Speed ${texto === "novo" ? "no golpe físico, não no especial" : "só no golpe de contato"}`, () => {
    if (texto === "novo") {
      assert.ok(sobe("Speed Force", "F", false), "físico sem contato");
      assert.ok(igual("Speed Force", "E", false), "especial");
    } else {
      assert.ok(sobe("Speed Force", "F", true), "contato");
      assert.ok(igual("Speed Force", "F", false), "sem contato");
    }
  });
}

test("Blur e Elude (texto novo): defende com Speed contra físico (Blur) e contra especial (Elude), não o contrário", () => {
  const { apanha, base } = mundo("novo");
  const b = (cat, c) => base(cat, c);
  assert.ok(apanha("Blur", "F", false) < b("F", false) * 0.95, "Blur contra físico sem contato");
  assert.ok(apanha("Blur", "F", true) < b("F", true) * 0.95, "Blur contra físico com contato");
  assert.ok(Math.abs(apanha("Blur", "E", false) - b("E", false)) < 1e-6, "Blur contra especial não muda");
  assert.ok(apanha("Elude", "E", false) < b("E", false) * 0.95, "Elude contra especial");
  assert.ok(Math.abs(apanha("Elude", "F", false) - b("F", false)) < 1e-6, "Elude contra físico não muda");
});

test("Blur e Elude (texto antigo): continuam por contato enquanto o dado for velho", () => {
  const { apanha, base } = mundo("antigo");
  assert.ok(apanha("Blur", "F", true) < base("F", true) * 0.95, "Blur contra contato");
  assert.ok(Math.abs(apanha("Blur", "F", false) - base("F", false)) < 1e-6, "Blur contra sem contato não muda");
  assert.ok(apanha("Elude", "F", false) < base("F", false) * 0.95, "Elude contra sem contato");
  assert.ok(Math.abs(apanha("Elude", "F", true) - base("F", true)) < 1e-6, "Elude contra contato não muda");
});
