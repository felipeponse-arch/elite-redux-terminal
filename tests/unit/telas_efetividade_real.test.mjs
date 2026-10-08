// Ticket 12 (dados-2654): as telas mostram a efetividade REAL contra Solid Rock / Primal Armor e citam a
// redução da habilidade, igual ao duelo (que usa `real` desde dbb2a9d). Antes elas liam `.mult`, já
// amortecido (1,3x em fraqueza 2x), e escondiam a fraqueza.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const idHab = (nome) => R.ABILITIES.findIndex((a) => a && a[0] === nome);
const SOLID_ROCK = idHab("Solid Rock");
const PRIMAL_ARMOR = idHab("Primal Armor");

// Tyranitar (Rock/Dark) com Solid Rock: Fighting é 4x, Ground é 2x. Golpes fictícios só pelo tipo.
const TIPOS = ["Rock", "Dark"];
const golpeExiste = (...nomes) => nomes.forEach((n) => { if (!R.MOVE_BY_NAME[n]) R.MOVE_BY_NAME[n] = [n, "Normal", "Physical", 80, 100, 10, 0, 0]; });

function unidadeTyranitar(abilityIds) {
  const sp = R.getSpeciesBySname("SPECIES_TYRANITAR");
  return { main: sp, mainTypes: TIPOS, moves: null, forms: [{ types: TIPOS, abilityIds }] };
}

test("pré-condição: Tyranitar é Rock/Dark e Solid Rock/Primal Armor são as habilidades certas", () => {
  assert.deepEqual(R.speciesTypeNames(R.getSpeciesBySname("SPECIES_TYRANITAR")), TIPOS);
  assert.ok(SOLID_ROCK > 0 && PRIMAL_ARMOR > 0);
  assert.equal(R.TYPE_MOD_ABILITIES[SOLID_ROCK].seDamper, 0.65);
  assert.equal(R.TYPE_MOD_ABILITIES[PRIMAL_ARMOR].seDamper, 0.5);
});

test("tipos.js: real é a efetividade cheia (2x e 4x) e a redução da habilidade vem escrita", () => {
  const quatro = R.abilityTypeModFor("Fighting", TIPOS, [SOLID_ROCK]);
  assert.equal(quatro.real, 4);
  assert.deepEqual(Array.from(quatro.reducoes), ["Solid Rock reduz 35%"]);
  const dois = R.abilityTypeModFor("Ground", TIPOS, [SOLID_ROCK]);
  assert.equal(dois.real, 2);
  assert.deepEqual(Array.from(dois.reducoes), ["Solid Rock reduz 35%"]);
  assert.deepEqual(Array.from(R.abilityTypeModFor("Ground", TIPOS, [PRIMAL_ARMOR]).reducoes), ["Primal Armor reduz 50%"]);
  assert.equal(R.abilityTypeModFor("Fire", TIPOS, [SOLID_ROCK]).reducoes.length, 0, "golpe que não é super efetivo não tem redução");
});

test("confronto (ataque): golpe 2x e 4x contra Solid Rock aparece como super efetivo cheio, com a redução", () => {
  golpeExiste("Close Combat", "Earthquake");
  const foe = (golpe) => ({ sp: R.getSpeciesBySname("SPECIES_TYRANITAR"), ability: "Solid Rock", moves: [golpe] });
  const mine = (golpe) => ({ main: R.getSpeciesBySname("SPECIES_GARCHOMP"), mainTypes: ["Dragon", "Ground"], moves: [golpe], forms: [] });
  const ofensa = R.ofensaContra(mine("Close Combat"), foe("Close Combat"));
  assert.equal(ofensa.best.type, "Fighting", "pré-condição: Close Combat é Fighting");
  assert.equal(ofensa.best.mult, 4, "Fighting 4x contra Tyranitar: nada de 2,6x");
  assert.match(ofensa.best.reducao, /Solid Rock reduz 35%/);
  const t = R.ofensaContra(mine("Earthquake"), foe("Earthquake"));
  assert.equal(t.best.mult, 2, "Ground 2x");
  assert.equal(t.classe, "super");
  assert.match(t.best.reducao, /Solid Rock reduz 35%/);
});

test("confronto (ameaça): chefão com golpe 2x contra a nossa unidade Solid Rock vira perigo, com a redução", () => {
  golpeExiste("Close Combat", "Earthquake");
  const chefao = (golpe) => R.foeFromBossMember({ x: R.getSpeciesBySname("SPECIES_HEATRAN").x, n: "Heatran", abi: "Flash Fire", mv: [golpe] });
  const dois = R.ameacaDe(chefao("Earthquake"), unidadeTyranitar([SOLID_ROCK]));
  assert.equal(dois.worst.mult, 2);
  assert.equal(dois.classe, "perigo", "antes o 1,3x escondia o perigo");
  assert.match(dois.worst.reducao, /Solid Rock reduz 35%/);
  const quatro = R.ameacaDe(chefao("Close Combat"), unidadeTyranitar([SOLID_ROCK]));
  assert.equal(quatro.worst.mult, 4);
});

test("chefoes.js: fraqueza compartilhada conta 2x e 4x mesmo com Solid Rock (computeSharedRisks)", () => {
  const sp = R.getSpeciesBySname("SPECIES_TYRANITAR");
  const original = R.alwaysActiveAbilities;
  R.alwaysActiveAbilities = () => [SOLID_ROCK];
  try {
    const riscos = R.computeSharedRisks([sp, sp]);
    const tipos = riscos.map((r) => r.t);
    assert.ok(tipos.includes("Fighting"), "Fighting 4x");
    assert.ok(tipos.includes("Ground"), "Ground 2x");
  } finally { R.alwaysActiveAbilities = original; }
});

test("formas_mega.js: unitTypeMult devolve a efetividade real da unidade", () => {
  const original = R.alwaysActiveAbilities;
  R.alwaysActiveAbilities = () => [SOLID_ROCK];
  try {
    const u = { forms: [R.getSpeciesBySname("SPECIES_TYRANITAR")] };
    assert.equal(R.unitTypeMult(u, "Fighting"), 4);
    assert.equal(R.unitTypeMult(u, "Ground"), 2);
  } finally { R.alwaysActiveAbilities = original; }
});

test("mono_run.js: cobreFraquezas segue contando só quem de fato resiste (Solid Rock não 'cobre' 2x)", () => {
  const sp = R.getSpeciesBySname("SPECIES_TYRANITAR");
  const original = R.alwaysActiveAbilities;
  R.alwaysActiveAbilities = () => [SOLID_ROCK];
  try {
    assert.deepEqual(Array.from(R.cobreFraquezas(sp, ["Ground", "Fighting", "Fire"])), ["Fire"]);
  } finally { R.alwaysActiveAbilities = original; }
});

test("arquetipo.js: a tabela de cobertura mostra 4× / 2× e a dica cita 'Solid Rock reduz 35%'", () => {
  const fonte = readFileSync(join(raiz, "src", "ui", "arquetipo.js"), "utf8").replace(/\r\n/g, "\n");
  const ini = fonte.indexOf("function renderTeamAnalysis(members)");
  const fim = fonte.indexOf("\n  }\n", ini);
  assert.ok(ini > 0 && fim > ini, "achou renderTeamAnalysis");
  let html = "";
  const sp = R.getSpeciesBySname("SPECIES_TYRANITAR");
  const ctx = vm.createContext(Object.assign(Object.create(R), {
    document: { getElementById: () => ({ set innerHTML(v) { html = v; } }) },
    spriteImgHtml: () => "", typePill: (t) => t, escapeHtml: (s) => String(s),
    alwaysActiveAbilities: () => [SOLID_ROCK],
  }));
  // O contexto das regras é um objeto de vm; copiamos o que a função usa.
  for (const k of ["abilityTypeMod", "USABLE_TYPES", "computeSharedRisks", "speciesTypeNames"]) ctx[k] = R[k];
  ctx.abilityTypeMod = (atk, s) => R.abilityTypeModFor(atk, R.speciesTypeNames(s), [SOLID_ROCK]);
  ctx.computeSharedRisks = () => [];
  vm.runInContext(fonte.slice(ini, fim + 4) + "\nrenderTeamAnalysis([" + "__sp" + "]);", Object.assign(ctx, { __sp: sp }));
  assert.match(html, /cov-weak[^>]*>4&times;/, "Fighting 4x aparece cheio");
  assert.match(html, /cov-weak[^>]*>2&times;/, "Ground 2x aparece cheio");
  assert.match(html, /Solid Rock reduz 35%/);
});
