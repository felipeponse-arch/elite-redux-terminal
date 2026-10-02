// Lote C da força-tarefa (2026-10-02): validação estratégica das builds da IA e o que a
// auditoria mostrou estar errado no dado que a IA recebe.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 8, difficulty: "ace", levelCapMode: "more" });
const sp = (s) => R.getSpeciesBySname(s);
const build = (extra) => Object.assign({ ability: "", nature: "Adamant", item: "Life Orb", moves: [], evs: [0, 252, 0, 0, 4, 252], rationale: "x" }, extra);
const ehValida = (s, b, ctx) => { const m = {}; const v = R.validateAiBuild(sp(s), b, m, ctx); return v ? "ok" : m.txt; };

test("os 30 golpes 'Not done yet' têm a tradução do texto longo (não 'ainda não implementado')", () => {
  const ruins = Object.keys(R.MOVE_PT).filter((k) => /ainda n[aã]o implementad/i.test(R.MOVE_PT[k]));
  assert.equal(ruins.length, 0, ruins.join(","));
  assert.match(R.MOVE_PT[String(R.MOVE_ID_BY_NAME["Diamond Blade"])], /Stealth Rocks/);
});

test("super efetivo pelo texto longo: Clay Dart em Flying, Fumigation Bomb em Bug, Aura Force em Ghost", () => {
  const ef = (golpe, tipoAtq, tipoAlvo) => {
    const u = { ef: R.efeitoDasHabilidadesNoDuelo([], "LC", null), tipos: [tipoAtq], stats: [300, 100, 100, 100, 100, 100] };
    u.golpesProntos = R.prepararGolpesDuelo([R.MOVE_ID_BY_NAME[golpe]], u, null);
    return R.danoNoDuelo(u, { ef: R.efeitoDasHabilidadesNoDuelo([], "LC2", null), tipos: [tipoAlvo], stats: [999, 100, 100, 100, 100, 100], ids: [] }, 50).melhor.efTipo;
  };
  assert.equal(ef("Clay Dart", "Ground", "Flying"), 2, "Ground não acertaria Flying");
  assert.equal(ef("Fumigation Bomb", "Poison", "Bug"), 2);
  assert.equal(ef("Aura Force", "Fighting", "Ghost"), 2, "Fighting não acertaria Ghost");
});

test("Skill Link/Loaded Dice reconhecem 2 a 5 acertos pelo efeito oficial", () => {
  const sl = R.ABILITY_ID_BY_NAME["Skill Link"];
  const u = { ef: R.efeitoDasHabilidadesNoDuelo([sl], "LC_SL", null), tipos: ["Grass"], stats: [300, 100, 100, 100, 100, 100] };
  assert.equal(R.prepararGolpesDuelo([R.MOVE_ID_BY_NAME["Bullet Seed"]], u, null)[0].acertos, 5);
  // Double Slap: efeito oficial 2 a 5, mas a tradução diz "pelo menos duas vezes".
  assert.equal(R.prepararGolpesDuelo([R.MOVE_ID_BY_NAME["Double Slap"]], u, null)[0].acertos, 5);
});

// Fixture achada no dado: espécie sem exigência de sinergia de habilidade (a regra do
// especialista rejeitaria antes) e com os golpes de que o teste precisa no movepool do cap.
function acharEspecie(filtro) {
  return R.SPECIES.find((s) => s && !(R.ABILITY_SYNERGY[s.sname] || []).length && !(R.CONDITION_MOVE_SYNERGY || {})[s.sname] && filtro(s, R.availableMovesFor(s).names));
}
const tipoDe = (n) => R.TYPES[R.MOVES[R.MOVE_ID_BY_NAME[n]][1]];
const dano = (n) => R.moveRoleOf(n) === "dano";

test("validação: atacante sem nenhum golpe com STAB é rejeitado; com STAB passa dessa regra", () => {
  let semStab, comStabUm;
  const s = acharEspecie((s, mv) => {
    const tipos = R.speciesTypeNames(s);
    const fora = mv.filter((n) => dano(n) && tipos.indexOf(tipoDe(n)) === -1 && R.MOVES[R.MOVE_ID_BY_NAME[n]][9] < 0);
    const stab = mv.filter((n) => dano(n) && tipos.indexOf(tipoDe(n)) !== -1);
    if (fora.length < 4 || !stab.length) return false;
    semStab = fora.slice(0, 4); comStabUm = [stab[0]].concat(fora.slice(0, 3));
    return true;
  });
  assert.ok(s, "fixture");
  const ab = R.ABILITIES[s.ab[0]][0];
  const efSet = R.efeitoDasHabilidadesNoDuelo(R.uniqueIds(s.inn.concat([s.ab[0]])), s.sname, null);
  if (efSet.stabTodos) return; // habilidade dá STAB em tudo: regra não se aplica
  assert.match(ehValida(s.sname, build({ ability: ab, papel: "Wallbreaker", moves: semStab })), /STAB/);
  assert.doesNotMatch(String(ehValida(s.sname, build({ ability: ab, papel: "Wallbreaker", moves: comStabUm }))), /STAB/);
});

test("validação: Heal Block ativo na luta rejeita golpe de cura e Leftovers", () => {
  let cura, outros;
  const s = acharEspecie((s, mv) => {
    const tipos = R.speciesTypeNames(s);
    const c = mv.filter((n) => R.moveRoleOf(n) === "cura");
    const d = mv.filter((n) => dano(n) && tipos.indexOf(tipoDe(n)) !== -1);
    if (!c.length || d.length < 4) return false;
    cura = c[0]; outros = d.slice(0, 4);
    return true;
  });
  assert.ok(s, "fixture");
  const ab = R.ABILITIES[s.ab[0]][0];
  const ctx = { buffs: ["flannery_healblock"] };
  const comCura = build({ ability: ab, nature: "Hardy", papel: "Tanque", item: "Leftovers", moves: [cura].concat(outros.slice(0, 3)), evs: [252, 0, 252, 0, 4, 0] });
  assert.match(ehValida(s.sname, comCura, ctx), /Heal Block/);
  const semCura = Object.assign({}, comCura, { moves: outros });
  assert.match(ehValida(s.sname, semCura, ctx), /Leftovers/);
  assert.doesNotMatch(String(ehValida(s.sname, comCura, {})), /Heal Block/, "sem o buff, cura vale");
});

test("validação: o armador do clima precisa levar a habilidade que arma (contextoDeValidacao)", () => {
  const n = sp("SPECIES_NINETALES_ALOLAN");
  const escolhiveis = n.ab.map((id) => R.ABILITIES[id][0]);
  const arma = escolhiveis.find((a) => /Snow Warning/.test(a));
  assert.ok(arma, "fixture: Ninetales Alolan arma granizo por habilidade escolhível");
  const flannery = R.BOSSES.find((b) => b.name === "Flannery 1");
  const ctx = R.contextoDeValidacao(n, { chefao: { boss: flannery, estrategia: { armador: n.n, habilidade: arma, clima: "granizo", aproveitam: [] } } });
  assert.equal(ctx.habilidadeExigida, arma);
  assert.ok(ctx.buffs.length > 0, "buffs da Flannery ativos");
  const outra = escolhiveis.find((a) => a !== arma);
  const b = build({ ability: outra, nature: "Timid", item: "Choice Specs", moves: ["Blizzard", "Moonblast", "Freeze-Dry", "Ice Beam"], evs: [0, 0, 0, 252, 4, 252] });
  assert.match(ehValida("SPECIES_NINETALES_ALOLAN", b, ctx), /armador/);
  assert.equal(R.contextoDeValidacao(n, {}).habilidadeExigida, undefined);
});

test("papel natural conta as innates que dobram o atributo: Azumarill e Mawile (Huge Power) são físicos", () => {
  assert.equal(R.SPECIES_ROLE.SPECIES_AZUMARILL.split, "Fisico");
  assert.equal(R.SPECIES_ROLE.SPECIES_MAWILE.split, "Fisico");
});
