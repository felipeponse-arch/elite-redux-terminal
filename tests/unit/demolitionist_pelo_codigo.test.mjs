// Ticket mecanica-2026-10-22/03 (parte Demolitionist), 22/10/2026. Valem pelo CÓDIGO da versão nova (er-repo upcoming):
// abilities.cc:7745-7760 (onEntry = Readied Action; onInfiltrate quebra telas em golpe que não é de status; onAttacker derruba
// Reflect/Light Screen/Aurora Veil do lado do alvo quando acerta), battle_util.c:6620 (ignora Protect no turno readied),
// battle_util.c:7156 (readiedAction dobra o Atk) e :2969 (a flag dura 1 turno). Dado real: Regirock (tem Demolitionist no dado) contra o
// time do Wattson 5 com as 8 voltas de tela do Tapu Koko (cenário igual ao do Defog em lado_no_duelo.test.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { R, EV, especie } from "./cenarios_do_duelo.mjs";

const NV = 80;
const regirock = (hab) => R.unidadeDaBuild(especie("Regirock"), { ability: hab, nature: "Adamant", evs: EV.fisico, item: "", moves: ["Stone Edge"] }, NV, null);
const rotom = () => R.foeDeDuelo(R.BOSSES.find((b) => b.name === "Wattson 5").party.find((m) => m.n === "Rotom Wash"), NV, null);
const comTela = { statusNoFim: [], ladoDele: { reflect: 8, luz: 8 } };
const luta = (hab) => R.simularLutaContraChefao([regirock(hab)], [rotom()], NV, comTela).log[0];

test("Demolitionist: Readied Action (dobra o ataque na entrada) + quebra de telas; Sturdy não", () => {
  const e = regirock("Demolitionist").ef;
  assert.equal(e.demolidor, true);
  assert.equal(e.primeiroTurnoMult, 2, "battle_util.c:7156: statBase *= 2");
  assert.equal(regirock("Sturdy").ef.demolidor, false);
});

test("o primeiro golpe de dano ignora a tela do rival: Reflect de 8 turnos não corta o dano de Stone Edge", () => {
  const lado = (l) => Object.assign(R.novoLadoDuelo(), l);
  const causado = (hab, tela) => 1 - R.resultadoDoDuelo(regirock(hab), rotom(), NV, { detalhe: true, lados: { eu: lado({}), foe: lado(tela) }, sala: 0 }).fracFoe;
  const semTela = causado("Demolitionist", {});
  const dem = causado("Demolitionist", { reflect: 8, luz: 8 }), sturdy = causado("Sturdy", { reflect: 8, luz: 8 });
  // Só o turno readied ignora a tela (abilities.cc:7747/7754); do 2º turno em diante o corte normal volta.
  assert.ok(dem > sturdy + 1e-9, "Demolitionist fura a tela no turno readied: causa mais que sem a habilidade");
  assert.ok(dem < semTela - 1e-9, "mas a tela volta a cortar do 2º turno em diante: não é igual ao sem tela");
  assert.ok(causado("Sturdy", { reflect: 8, luz: 8 }) < causado("Sturdy", {}), "sem a habilidade a tela corta o dano (controle)");
});

test("na luta contra o time do chefão as telas do lado do rival caem e ficam caídas para os próximos", () => {
  const com = luta("Demolitionist").lados.dele, sem = luta("Sturdy").lados.dele;
  assert.deepEqual([com.reflect, com.luz, com.veu], [0, 0, 0]);
  assert.deepEqual([sem.reflect, sem.luz], [8, 8], "controle: sem a habilidade a tela fica");
});

test("ignora Protect: o Protect de entrada (Coward) não bloqueia o golpe de quem tem Demolitionist, de qualquer contato", () => {
  const cowardEf = R.efeitoDasHabilidadesNoDuelo([R.ABILITY_ID_BY_NAME.Coward], "DEMO_COWARD", null);
  assert.equal(cowardEf.protegeNaEntrada, true);
  const def = Object.assign({}, regirock("Sturdy"), { ef: cowardEf });
  const dano = (u) => R.danoNoDuelo(u, def, NV);
  const bq = (atq) => R.bloqueiosNoDuelo(def, atq, dano(atq));
  assert.equal(bq(regirock("Sturdy")), 1, "controle: sem a habilidade o Protect bloqueia 1 golpe");
  assert.equal(bq(regirock("Demolitionist")), 0, "battle_util.c:6620");
});

test("ef.demolidor sai na volta seguinte do time (readiedAction dura 1 turno)", () => {
  const r = R.simularLutaContraChefao([regirock("Demolitionist"), regirock("Demolitionist")], [rotom(), rotom(), rotom()], NV, comTela);
  assert.ok(r.log.length >= 2, "precisa de 2 voltas para ver a flag sair");
  assert.equal(r.log[0].lados.dele.reflect, 0, "quebra na volta de entrada");
});
