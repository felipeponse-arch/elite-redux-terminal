// TK-48 (DECISÃO DO USUÁRIO 05/11): o treinador do Mauville Game Corner (TRAINER_SINNOH_MEGAS_MAUVILLE_GAME_CORNER) ganha +1 estágio no
// maior entre Atq e Atq. Esp. BRUTOS de cada Pokémon que entra - SÓ no Hell e SÓ nele. O código público do jogo não define o critério
// (TODO em hell_trainer_skills.h:401-406; er-config TrainerBattleSkillList.textproto:1295 só traz SKILL_ON_ENTRY_HIGHEST_ATTACK_UP_1);
// o critério foi escolhido pelo usuário. Empate: Atq físico (regra fixa, a mesma do "Sharply ups highest attacking stat").
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const NOME = "Sinnoh Megas Mauville Game Corner";
const HELL = carregarRegras({ milestone: 4, difficulty: "hell", levelCapMode: "more" });
const ACE = carregarRegras({ milestone: 4, difficulty: "ace", levelCapMode: "more" });
const NIVEL = 50;

function alvo(R) {
  const sp = R.SPECIES.find((s) => s && s.n === "Magikarp");
  const u = R.unidadeDaBuild(sp, { ability: "Run Away", nature: "Hardy", evs: [0, 0, 0, 0, 0, 0], item: "", moves: ["Tackle"] }, NIVEL, null);
  u.ids = []; u.ef = R.efeitoDasHabilidadesNoDuelo([], "TK48_ALVO", null); u.tipos = ["Normal"];
  u.golpeIds = [R.MOVE_ID_BY_NAME.Tackle]; u.golpesProntos = R.prepararGolpesDuelo(u.golpeIds, u, null);
  return u;
}
const foesDoMauville = (R) => R.bossPartyPorDificuldade(R.BOSSES.find((b) => b.name === NOME)).map((m) => R.foeDeDuelo(m, NIVEL, null)).filter(Boolean);
const est = (R, f) => R.estagiosMediosDuelo(f, alvo(R), f.golpesProntos[0], alvo(R).golpesProntos[0], 1);

test("Hell: só o treinador do Mauville Game Corner recebe a skill", () => {
  assert.deepEqual(Array.from(HELL.buffsAtivosDoChefao(NOME)), ["mauville_hell_maior_ataque_1"]);
  assert.deepEqual(Array.from(HELL.buffsAtivosDoChefao("Steven Granite Cave")), [], "outro treinador opcional não recebe");
  assert.ok(!HELL.buffsAtivosDoChefao("Flannery 1").includes("mauville_hell_maior_ataque_1"), "nem um líder");
  assert.deepEqual(Array.from(ACE.buffsAtivosDoChefao(NOME)), [], "fora do Hell não ativa");
});

test("Hell: cada Pokémon do Mauville sobe +1 só no maior entre Atq e Atq. Esp. brutos", () => {
  const base = foesDoMauville(HELL);
  assert.ok(base.length > 0);
  const com = HELL.foesComBuffsDoGinasio(base, HELL.buffsAtivosDoChefao(NOME), 1);
  com.forEach((f, i) => {
    const antes = est(HELL, base[i]), depois = est(HELL, f);
    const maior = f.stats[1] >= f.stats[3] ? "atk" : "spa", outro = maior === "atk" ? "spa" : "atk";
    assert.equal(+(depois[maior] - antes[maior]).toFixed(6), 1, base[i].nome + ": +1 no " + maior);
    assert.equal(depois[outro], antes[outro], base[i].nome + ": o outro ataque não muda");
    assert.equal(depois.def, antes.def); assert.equal(depois.spe, antes.spe);
  });
});

test("Empate usa o Atq físico; Atq. Esp. só se for estritamente maior", () => {
  const [f] = HELL.foesComBuffsDoGinasio(foesDoMauville(HELL), HELL.buffsAtivosDoChefao(NOME), 1);
  const com = (atk, spa) => est(HELL, Object.assign({}, f, { stats: [f.stats[0], atk, f.stats[2], spa, f.stats[4], f.stats[5]] }));
  const sem = (atk, spa) => est(HELL, Object.assign({}, f, { ef: Object.assign({}, f.ef, { maiorAtaqueNaEntrada: 0 }), stats: [f.stats[0], atk, f.stats[2], spa, f.stats[4], f.stats[5]] }));
  const d = (a, b, k) => +(a[k] - b[k]).toFixed(6);
  assert.equal(d(com(100, 100), sem(100, 100), "atk"), 1); assert.equal(d(com(100, 100), sem(100, 100), "spa"), 0);
  assert.equal(d(com(100, 101), sem(100, 101), "spa"), 1); assert.equal(d(com(100, 101), sem(100, 101), "atk"), 0);
});
