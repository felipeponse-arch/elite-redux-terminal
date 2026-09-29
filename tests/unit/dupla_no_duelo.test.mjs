// Dupla (2026-09-29, decisão do usuário: duelo em dupla completo). 25 chefões
// são em dupla no dado (`db`). Golpe de área (BOTH/FOES_AND_ALLY) acerta os dois
// rivais a 0,75x; FOES_AND_ALLY (Earthquake) pega o aliado; habilidades de
// aliado (Friend Guard, Power Spot, Plus/Minus, Telepathy, Commander).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 3, difficulty: "ace", levelCapMode: "more" });
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const efDe = (nomes) => R.efeitoDasHabilidadesNoDuelo(nomes.map(idHab), "DP_" + nomes.join("+"), null);
const perto = (a, b) => Math.abs(a - b) < 1e-6;
const golpe = (cat, extra) => Object.assign({ nome: "T", tipo: "Normal", cat, contato: false, prio: 0, precisao: 1, forcaBase: 80, forca: 80, poder: 80, status: [], cats: [], flags: [], crit: { estagio: 0, sempre: false }, recuo: 0, custoHP: 0, dreno: 0, area: null }, extra || {});
const unidade = (ef, g, extra) => Object.assign({ sp: { n: "Teste", sname: "T", b: [100, 100, 100, 100, 100, 100] }, tipos: ["Water"], ids: [], ef, item: "", it: R.itemDoDuelo("", null), stats: [320, 100, 100, 100, 100, 100], golpesProntos: [g] }, extra || {});
const part = (u) => R.participanteDuelo(u);

test("dado: alvo de área dos golpes (Rock Slide nos dois, Earthquake também no aliado)", () => {
  const al = (n) => (R.MOVE_CATEGORIAS[R.MOVE_ID_BY_NAME[n]] || {}).al;
  assert.equal(al("Rock Slide"), "ambos");
  assert.equal(al("Earthquake"), "todos");
  assert.equal(al("Tackle"), undefined);
});

test("habilidades de aliado: Friend Guard corta o dano no parceiro; Power Spot reforça; Plus/Minus dobra", () => {
  const a = part(unidade(efDe([]), golpe("F"))), b = part(unidade(efDe([]), golpe("F")));
  assert.ok(perto(R.fatorDupla(a, null, b, part(unidade(efDe(["Friend Guard"]), golpe("F"))), golpe("F"), false), 0.5));
  assert.ok(perto(R.fatorDupla(a, part(unidade(efDe(["Power Spot"]), golpe("F"))), b, null, golpe("F"), false), 1.3));
  const plus = part(unidade(efDe(["Plus"]), golpe("E")));
  assert.ok(perto(R.fatorDupla(plus, part(unidade(efDe(["Minus"]), golpe("E"))), b, null, golpe("E"), false), 2));
});

test("luta em dupla: golpe de área acerta os dois rivais e rende mais que o de alvo único", () => {
  // Rivais que aguentam alguns golpes: acertar os dois por turno encurta a luta.
  const tanque = () => unidade(efDe([]), golpe("F", { forca: 30, forcaBase: 30 }), { stats: [320, 60, 100, 60, 100, 50] });
  const atk = (g) => unidade(efDe([]), g, { stats: [320, 100, 100, 100, 100, 150] });
  const quieto = () => unidade(efDe([]), golpe("F", { forca: 1, forcaBase: 1 }), { stats: [320, 10, 100, 10, 100, 150] });
  const area = R.simularDuplaContraChefao([atk(golpe("F", { forca: 90, forcaBase: 90, area: "ambos" })), quieto()], [tanque(), tanque()], 50);
  const um = R.simularDuplaContraChefao([atk(golpe("F", { forca: 90, forcaBase: 90 })), quieto()], [tanque(), tanque()], 50);
  assert.equal(area.dupla, true);
  assert.ok(area.venceu && um.venceu);
  assert.ok(area.hpRestante > um.hpRestante, area.hpRestante + " x " + um.hpRestante);
});

test("Earthquake fere o parceiro; Telepathy protege", () => {
  const eq = golpe("F", { nome: "Earthquake", tipo: "Ground", forca: 100, forcaBase: 100, area: "todos" });
  const rivais = () => [unidade(efDe([]), golpe("F"), { stats: [900, 50, 100, 50, 100, 50] }), unidade(efDe([]), golpe("F"), { stats: [900, 50, 100, 50, 100, 50] })];
  const parceiro = (ab) => unidade(efDe(ab), eq, { stats: [320, 100, 100, 100, 100, 120] });
  const s1 = R.simularDuplaContraChefao([parceiro([]), parceiro([])], rivais(), 50);
  const s2 = R.simularDuplaContraChefao([parceiro(["Telepathy"]), parceiro(["Telepathy"])], rivais(), 50);
  assert.ok(s2.pontos > s1.pontos, s2.pontos + " x " + s1.pontos);
});

test("chefão em dupla de verdade: o botão monta e a luta é 2 contra 2", () => {
  const boss = R.BOSSES.find((b) => b.db);
  assert.ok(boss, "fixture: chefão em dupla no dado");
  const party = R.bossPartyPorDificuldade(boss);
  const nomes = ["Garchomp", "Azumarill", "Togekiss", "Clefable", "Tyranitar", "Gyarados", "Metagross", "Salamence"];
  const cands = nomes.map((n) => R.SPECIES.find((s) => s && s.n === n)).filter(Boolean).map((sp) => ({ sp, owned: sp.x }));
  const r = R.montarTimeContraChefao(cands, party, 50, { dupla: true });
  assert.equal(r.simulacao.dupla, true);
  assert.equal(r.escolhidos.length, 6);
});

test("nota de dupla do rank: golpe de área vale 1,5x (0,75 em dois); suporte ao parceiro soma", () => {
  const u = unidade(efDe([]), golpe("F", { area: "ambos" }));
  const d = R.unidadeParaDupla(u);
  assert.ok(perto(d.golpesProntos[0].forca, 80 * 1.5));
  const eq = R.unidadeParaDupla(unidade(efDe([]), golpe("F", { area: "todos" })));
  assert.ok(perto(eq.golpesProntos[0].forca, 80 * 1.125));
  assert.equal(R.unidadeParaDupla(unidade(efDe([]), golpe("F"))).golpesProntos[0].forca, 80);
  assert.ok(R.suporteEmDupla(efDe(["Friend Guard"])) > 0 && R.suporteEmDupla(efDe(["Power Spot"])) > 0);
  assert.equal(R.suporteEmDupla(efDe([])), 0);
});
