// Ticket versao-nova/02 (15/10/2026): o app mira a versão MAIS NOVA do jogo (código/config primeiro, NextDex depois). Três números que a 2.65beta (28/03)
// tinha diferentes do código de 14/10 (486026e) e da er-config (d1a9a4c); desde o v05 o dado do app é a NextDex 2.65.4 e traz o texto novo:
//   Madness Enhancement  x0,5 -> x0,8 quando enfurecido        (abilities.cc:9939-9947)
//   Feathercoat          x0,9 / x0,8 resistido -> x0,85 / x0,7 (abilities.cc:12377-12386; o jogo TROCA o fator quando o golpe é resistido)
//   Dead Bark            x0,85, x0,7 se super efetivo           (abilities.cc:11401-11412; igual na 2.65beta, mas o motor não lia o texto)
// Medido como o ticket 03 da calibração: o mesmo defensor com e sem a habilidade, tipos fixos (Dead Bark põe Ghost, e isso não é o que se mede).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 8, difficulty: "ace", levelCapMode: "more" });
const NIVEL = 55;
const sp = (n) => R.SPECIES.find((s) => s && s.n === n);
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const perto = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, (msg || "") + ": " + a + " x " + b + " (tolerância " + tol + ")");

function unidade(especie, habs, golpe, tipos, clima = null, evs = [0, 252, 0, 252, 0, 0]) {
  const s = sp(especie);
  const u = R.unidadeDaBuild(s, { ability: "Run Away", nature: "Hardy", evs, item: "", moves: [golpe] }, NIVEL, clima);
  const ids = habs.map(idHab);
  u.ids = ids; u.ab = habs[0] || ""; u.abId = ids.length ? ids[0] : null;
  u.ef = R.efeitoDasHabilidadesNoDuelo(ids, s.sname + "|" + habs.join("+") + "|" + clima, clima);
  u.tipos = tipos || R.tiposNaBatalha(s, u.ef); u.clima = clima;
  u.golpeIds = [R.MOVE_ID_BY_NAME[golpe]]; u.golpesProntos = R.prepararGolpesDuelo(u.golpeIds, u, clima);
  return u;
}
// Razão do dano que o defensor (Magikarp, Water, sem EV) com a habilidade leva sobre o que levaria sem ela.
const razao = (hab, golpe, clima = null) => {
  const a = unidade("Garchomp", [], golpe, null, clima);
  const dano = (habs) => R.danoNoDuelo(a, unidade("Magikarp", habs, "Tackle", ["Water"], clima, [0, 0, 0, 0, 0, 0]), NIVEL).melhor.dano;
  return dano([hab]) / dano([]);
};

test("Madness Enhancement: na névoa enfurecido leva x0,8 do dano (a 2.65beta dizia x0,5)", () => {
  perto(razao("Madness Enhancement", "Tackle", "nevoa"), 0.8, 0.02, "névoa");
  perto(razao("Madness Enhancement", "Tackle"), 1, 1e-9, "sem névoa não enfurece");
});

test("Feathercoat: x0,85 em todo golpe e x0,7 no TOTAL quando o golpe é resistido (não x0,85 x 0,7)", () => {
  perto(razao("Feathercoat", "Tackle"), 0.85, 0.02, "neutro (Tackle contra Water)");
  perto(razao("Feathercoat", "Thunder Shock"), 0.85, 0.02, "super efetivo (Electric contra Water): o corte não aumenta");
  perto(razao("Feathercoat", "Water Gun"), 0.7, 0.02, "resistido (Water contra Water)");
});

test("Dead Bark: x0,85 em todo golpe e x0,7 no TOTAL quando o golpe é super efetivo (o contrário do Feathercoat)", () => {
  perto(razao("Dead Bark", "Tackle"), 0.85, 0.02, "neutro");
  perto(razao("Dead Bark", "Water Gun"), 0.85, 0.02, "resistido: o corte não aumenta");
  perto(razao("Dead Bark", "Thunder Shock"), 0.7, 0.02, "super efetivo");
});

test("o dado do app (NextDex 2.65.4) já traz o texto novo de Madness Enhancement e Feathercoat: o parser lê o texto do dado, sem tabela", () => {
  const txt = (n) => R.descricaoDeHabilidadePorId(idHab(n));
  assert.match(txt("Madness Enhancement"), /reduces damage taken by 20% when enraged/);
  assert.match(txt("Feathercoat"), /15% less damage from attacks, 30% if resisted/);
  assert.equal(R.TEXTO_DA_VERSAO_NOVA_DUELO["Madness Enhancement"], undefined);
  assert.equal(R.TEXTO_DA_VERSAO_NOVA_DUELO["Feathercoat"], undefined);
  assert.equal(R.efeitoDasHabilidadesNoDuelo([idHab("Feathercoat")], "SOLO_FC", null).reducao.todos, 0.85);
});
