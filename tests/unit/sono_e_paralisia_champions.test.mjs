// Ticket versao-nova/08 (15/10/2026; dados-2654/07): o código novo liga o sono e a paralisia estilo Pokémon Champions.
//   battle_config.h:156-157  B_USE_CHAMPIONS_SLEEP / B_USE_CHAMPIONS_PARALYSIS = TRUE (upcoming 486026e)
//   paralisia: 1 chance em 8 de não agir (battle_util.c:3406, `mod = 8`); Velocidade pela metade (battle_main.c:4196, B_PARALYSIS_SPEED GEN_7);
//              no modo Hell o chefão paralisado sempre age (battle_util.c:3403, disableParalysisCancel).
//   sono: contador 2 (1/3) ou 3 (2/3) (battle_script_commands.c:2558-2563); -1 por tentativa de agir (-2 com Early Bird) e age no turno em que zera
//         (battle_util.c:3210-3245): perde 1 turno (1/3) ou 2 (2/3) = 5/3; com Early Bird 0 (1/3) ou 1 (2/3) = 2/3. Rest: contador 3 (2 turnos), igual a antes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 8, difficulty: "ace", levelCapMode: "more" });
const NIVEL = 55;
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const golpe = (cat, extra) => Object.assign({ nome: "T", tipo: "Normal", cat, contato: false, prio: 0, precisao: 1, forcaBase: 80, forca: 80, poder: 80, status: [], cats: [], flags: [], crit: { estagio: 0, sempre: false }, recuo: 0, custoHP: 0, dreno: 0 }, extra || {});
const unid = (habs, tipos, golpes, extra) => {
  const ids = habs.map(idHab);
  return Object.assign({ sp: { n: "Teste", sname: "SPECIES_TESTE", inn: [], t: [0, 0] }, tipos, ids, abId: ids.length ? ids[0] : null, ab: habs[0] || "",
    ef: R.efeitoDasHabilidadesNoDuelo(ids, "SP08_" + habs.join("+"), null), item: "", it: R.itemDoDuelo("", null), stats: [320, 100, 100, 100, 100, 100], golpesProntos: golpes, statusIds: [] }, extra || {});
};
const perto = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, (msg || "") + ": " + a + " x " + b);
const plano = (nomeGolpe, y) => {
  const x = unid([], ["Normal"], [golpe("F")]);
  return R.efeitoDoPlanoDuelo(x, y, R.MOVE_ID_BY_NAME[nomeGolpe], { golpeX: x.golpesProntos[0], golpeY: y.golpesProntos[0], dX: 50, dY: 50, hpX: 320, hpY: 320, xPrimeiro: true }, NIVEL);
};
const acc = (nomeGolpe) => R.MOVES[R.MOVE_ID_BY_NAME[nomeGolpe]][4] / 100;

test("paralisia Champions: 12,5% de perder o turno (era 25%) e Velocidade pela metade", () => {
  assert.equal(R.STATUS_DUELO.paralisar.corte, 0.125);
  const alvo = unid([], ["Normal"], [golpe("F")]);
  const r = plano("Thunder Wave", alvo);
  perto(r.multY, 1 - 0.125 * acc("Thunder Wave"), 1e-9, "dano do alvo paralisado");
  perto(r.velY, 1 - 0.5 * acc("Thunder Wave"), 1e-9, "Velocidade do alvo");
});

test("paralisia no modo Hell: o chefão paralisado sempre age (só perde Velocidade); o jogador e o modo Ace seguem com 12,5%", () => {
  const chefao = unid([], ["Normal"], [golpe("F")], { chefao: true });
  const jogador = unid([], ["Normal"], [golpe("F")]);
  try {
    R.state.settings.difficulty = "hell";
    perto(plano("Thunder Wave", chefao).multY, 1, 1e-9, "chefão no Hell");
    perto(plano("Thunder Wave", chefao).velY, 1 - 0.5 * acc("Thunder Wave"), 1e-9, "Velocidade do chefão no Hell");
    perto(plano("Thunder Wave", jogador).multY, 1 - 0.125 * acc("Thunder Wave"), 1e-9, "jogador no Hell");
    R.state.settings.difficulty = "ace";
    perto(plano("Thunder Wave", chefao).multY, 1 - 0.125 * acc("Thunder Wave"), 1e-9, "chefão no Ace");
  } finally { R.state.settings.difficulty = "ace"; }
});

test("paralisia por chance de golpe (luta com status): o corte no dano do paralisado é de 12,5%, e some para o chefão no Hell", () => {
  const paralisa = golpe("F", { status: [{ st: "paralisar", p: 1 }] });
  const eu = unid([], ["Normal"], [paralisa]);
  const luta = (chefao) => {
    const foe = unid([], ["Normal"], [golpe("F")], { chefao });
    return R.danoComStatusNoDuelo(eu, foe, R.danoNoDuelo(eu, foe, NIVEL), R.danoNoDuelo(foe, eu, NIVEL), 8, true).dele;
  };
  const semStatusDe = (chefao) => { const e2 = unid([], ["Normal"], [golpe("F")]); const foe = unid([], ["Normal"], [golpe("F")], { chefao }); return R.danoComStatusNoDuelo(e2, foe, R.danoNoDuelo(e2, foe, NIVEL), R.danoNoDuelo(foe, e2, NIVEL), 8, true).dele; };
  const semStatus = semStatusDe(false);
  const razao = luta(false) / semStatus;
  assert.ok(razao < 0.97 && razao > 0.86, "corte de ~12,5% (com a presença do status menor que 100%): " + razao);
  try {
    R.state.settings.difficulty = "hell";
    // base no mesmo modo: isola a regra da paralisia dos outros fatores do Hell (x0,75 global etc.)
    perto(luta(true) / semStatusDe(true), 1, 1e-9, "chefão no Hell");
  } finally { R.state.settings.difficulty = "ace"; }
});

test("o Pokémon do chefão vem marcado (foeDeDuelo.chefao): a regra do Hell depende disso", () => {
  const b = R.BOSSES.find((x) => x.name === "Brawly 1");
  const foe = R.foeDeDuelo(b.party[0], NIVEL, null);
  assert.equal(foe.chefao, true);
});

test("sono Champions: o alvo perde 5/3 de turno (era 2); com Early Bird 2/3 (era 1); Spore sem falhar", () => {
  const alvo = unid([], ["Normal"], [golpe("F")]);
  perto(plano("Spore", alvo).perdeY, 5 / 3 * acc("Spore"), 1e-9, "sem habilidade");
  const early = unid(["Early Bird"], ["Normal"], [golpe("F")]);
  assert.equal(early.ef.acordaCedo, true);
  perto(plano("Spore", early).perdeY, 2 / 3 * acc("Spore"), 1e-9, "Early Bird");
  perto(plano("Hypnosis", alvo).perdeY, 5 / 3 * acc("Hypnosis"), 1e-9, "Hypnosis (60% de precisão)");
  const cura = unid(["Shed Skin"], ["Normal"], [golpe("F")]);
  assert.ok(plano("Spore", cura).perdeY < plano("Spore", alvo).perdeY, "cura de status encurta");
});
