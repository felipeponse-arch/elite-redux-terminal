// Revisão dos ginásios (04/10): nos 8 scripts oficiais o líder, com o jogo zerado (FLAG_SYS_GAME_CLEAR), vai direto pro script
// de revanche e não registra nenhum buff do ginásio (os registerbattleevent ficam só no CheckTrainers do 1º encontro).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 9 });

test("revanche de líder (2 a 5) não tem buffs; o 1º encontro tem", () => {
  for (const n of ["Roxanne 2", "Roxanne 5", "Flannery 3", "Norman 4", "Winona 2", "Tate And Liza 2", "Juan 5", "Wallace 2"]) {
    assert.equal(R.ehRevancheDeLider(n), true, n);
    assert.equal(JSON.stringify(R.buffsAtivosDoChefao(n)), "[]", n + " sem buffs ativos");
    assert.equal(R.buffsParaMostrarDoChefao(n), null, n);
  }
  for (const n of ["Roxanne 1", "Brawly 1", "Wattson 1", "Flannery 1", "Norman 1", "Winona 1", "Tate And Liza 1", "Juan 1", "Wallace"]) assert.equal(R.ehRevancheDeLider(n), false, n);
  assert.ok(R.buffsAtivosDoChefao("Flannery 1").length === 8, "1º encontro da Flannery: 8 buffs");
  assert.equal(R.ehRevancheDeLider("Courtney Sunhollow"), false, "não é líder de ginásio");
});

// Modo Hell: habilidades extras por treinador (src/data/hell_trainer_skills.h, só até o Wattson no código público).
test("Hell: Roxanne 1 e Wattson 1 têm habilidades extras do código oficial; os demais líderes não constam", () => {
  assert.equal(JSON.stringify(R.habilidadesExtrasDoHell("Roxanne 1")), JSON.stringify(["Pressure", "Shed Skin", "Self Sufficient"]));
  assert.equal(JSON.stringify(R.habilidadesExtrasDoHell("Wattson 1")), JSON.stringify(["Surge Surfer"]));
  for (const n of ["Brawly 1", "Flannery 1", "Norman 1", "Winona 1", "Juan 1"]) assert.equal(R.habilidadesExtrasDoHell(n).length, 0, n);
  const nomes = R.ABILITIES.map((a) => a && a[0]);
  for (const n of ["Roxanne 1", "Wattson 1"]) R.habilidadesExtrasDoHell(n).forEach((h) => assert.ok(nomes.includes(h), h + " existe nas habilidades"));
});

test("plano: os buffs ativos que o simulador não calcula aparecem como 'fora da conta' (Flannery 1, Norman 1, Winona 1)", () => {
  const fora = (n) => R.buffsParaMostrarDoChefao(n).foraDaConta;
  assert.equal(JSON.stringify(fora("Flannery 1")), JSON.stringify(["Precisão sobe aos poucos", "Herda status ao entrar"]));
  assert.equal(fora("Norman 1").length, 2);
  assert.equal(JSON.stringify(fora("Winona 1")), JSON.stringify(["Embargo (4 turnos sem item)"]));
  assert.equal(fora("Roxanne 1").length, 0, "tudo da Roxanne o simulador calcula");
  assert.equal(fora("Tate And Liza 1").length, 0);
  // todo buff 'fora da conta' existe de verdade em gym_skills.json (id certo) e nenhum deles está no simulador
  const ids = new Set(); Object.values(R.GYM_SKILLS.leaders).forEach((l) => (l.buffs || []).forEach((b) => ids.add(b.id)));
  for (const id of ["brawly_foresight", "wattson_magnetrise_spdef", "flannery_accuracy", "flannery_copystats", "norman_accuracy_laststand", "norman_leechseed", "winona_embargo"]) assert.ok(ids.has(id), id);
});
