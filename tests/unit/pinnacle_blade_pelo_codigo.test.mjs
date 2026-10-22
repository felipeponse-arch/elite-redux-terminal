// Ticket mecanica-2026-10-22/03 (parte Pinnacle Blade), 22/10/2026. Vale pelo CÓDIGO da versão nova (er-repo upcoming):
// abilities.cc:8661-8692 (onInfiltrate: golpe Keen Edge ignora as telas; onAttacker: ao acertar, derruba as telas do lado do alvo e dá Feint
// se o alvo estava protegido) e battle_util.c:6622 (Keen Edge fura Protect). Não há onAccuracy: a precisão não muda. O Substitute do alvo
// não é modelado no duelo (só como preparo do próprio lado), então fica sem teste. Dado real: Kartana Fallen (única espécie com a habilidade)
// contra o time do Wattson 5 com as telas de 8 voltas do Tapu Koko, mesmo cenário do Demolitionist.
import { test } from "node:test";
import assert from "node:assert/strict";
import { R, EV, especie } from "./cenarios_do_duelo.mjs";

const NV = 80;
const NK = 50; // nível baixo para o Rotom sobreviver ao golpe (senão a fração restante vai a 0 e a tela não aparece)
const kartana = (hab, golpes) => R.unidadeDaBuild(especie("Kartana Fallen"), { ability: hab, nature: "Adamant", evs: EV.fisico, item: "", moves: golpes }, NK, null);
const rotom = () => R.foeDeDuelo(R.BOSSES.find((b) => b.name === "Wattson 5").party.find((m) => m.n === "Rotom Wash"), NV, null);
const lado = (l) => Object.assign(R.novoLadoDuelo(), l);
const restante = (u, tela) => R.resultadoDoDuelo(u, rotom(), NV, { detalhe: true, lados: { eu: lado({}), foe: lado(tela) }, sala: 0 }).fracFoe;

test("Pinnacle Blade: a habilidade liga o efeito e o dado traz o texto de quebra", () => {
  assert.equal(kartana("Pinnacle Blade", ["Leaf Blade"]).ef.pinaculo, true);
  assert.equal(kartana("Inner Focus", ["Leaf Blade"]).ef.pinaculo, false);
  assert.equal(kartana("Pinnacle Blade", ["Leaf Blade"]).ef.semErrar, false, "o código não tem onAccuracy: nada de 'sempre acerta' global");
});

test("golpe Keen Edge ignora a tela do rival; golpe que não é Keen Edge não", () => {
  const tela = { reflect: 8, luz: 8 };
  const semTela = restante(kartana("Pinnacle Blade", ["Leaf Blade"]), {});
  assert.equal(restante(kartana("Pinnacle Blade", ["Leaf Blade"]), tela), semTela, "Leaf Blade é Keen Edge: fura a tela");
  assert.ok(restante(kartana("Inner Focus", ["Leaf Blade"]), tela) > restante(kartana("Inner Focus", ["Leaf Blade"]), {}), "controle: sem a habilidade a tela corta o dano");
  assert.ok(restante(kartana("Pinnacle Blade", ["Knock Off"]), tela) > restante(kartana("Pinnacle Blade", ["Knock Off"]), {}), "golpe sem Keen Edge continua sofrendo a tela");
});

test("ao acertar, o golpe Keen Edge derruba as telas do lado do alvo para os próximos", () => {
  const luta = (hab) => R.simularLutaContraChefao([kartana(hab, ["Leaf Blade"])], [rotom()], NV, { statusNoFim: [], ladoDele: { reflect: 8, luz: 8 } }).log[0].lados.dele;
  const com = luta("Pinnacle Blade"), sem = luta("Inner Focus");
  assert.deepEqual([com.reflect, com.luz, com.veu], [0, 0, 0]);
  assert.deepEqual([sem.reflect, sem.luz], [8, 8], "controle: sem a habilidade a tela fica");
});

test("Keen Edge fura o Protect de entrada (Coward); golpe comum não", () => {
  const cowardEf = R.efeitoDasHabilidadesNoDuelo([R.ABILITY_ID_BY_NAME.Coward], "PIN_COWARD", null);
  const def = Object.assign({}, kartana("Inner Focus", ["Leaf Blade"]), { ef: cowardEf });
  const bq = (atq) => R.bloqueiosNoDuelo(def, atq, R.danoNoDuelo(atq, def, NV));
  assert.equal(bq(kartana("Inner Focus", ["Leaf Blade"])), 1, "controle: sem a habilidade o Protect bloqueia 1 golpe");
  assert.equal(bq(kartana("Pinnacle Blade", ["Leaf Blade"])), 0, "battle_util.c:6622");
  assert.equal(bq(kartana("Pinnacle Blade", ["Knock Off"])), 1, "golpe sem Keen Edge não fura");
});
