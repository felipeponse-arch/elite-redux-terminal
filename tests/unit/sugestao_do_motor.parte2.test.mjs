// Parte 2 de 3 de sugestao_do_motor.test.mjs (dividido em 06/11/2026 para rodar em paralelo; ver tests/pesados.json).
// "Ficar com este time" grava as builds como "Sugestão do app" (ticket time-pelo-motor/01, F5, 21/10/2026).
// Dado real: o time vem do próprio Modo Motor. Cada teste cobre um risco do pedido do usuário (save, conflito com build própria, favorito da caixa).
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const ELENCO = ["Centiskorch", "Scizor", "Garchomp", "Metagross", "Grimmsnarl", "Togekiss", "Klefki", "Gardevoir"];
const R = carregarRegras({ milestone: 2 });
const sp = (n) => R.SPECIES.find((s) => s && s.n === n);
const zerar = () => {
  const s = R.state;
  s.team = ELENCO.slice(0, 6).map((n) => sp(n).x); s.box = ELENCO.slice(6).map((n) => sp(n).x);
  s.customBuilds = {}; s.orphans = { team: [], box: [] }; s.autoLog = [];
  s.archetype = { pace: null, weather: null, monotype: null, tatica: null, reasoning: "" };
};
zerar();
const cache = R.criarCacheDoMotor();

beforeEach(zerar);



test("favorito que está só na CAIXA entra travado nas três variantes", () => {
  const caixa = sp("Klefki");
  assert.ok(R.state.box.includes(caixa.x) && !R.state.team.includes(caixa.x));
  const ctx = R.contextoDoMotor(); ctx.cache = cache;
  const res = R.montarTimePeloMotor(ctx, { favoritos: [caixa.sname] });
  for (const v of res.variantes) {
    const m = v.membros.find((x) => x.base === caixa.sname);
    assert.ok(m, "Klefki (da caixa) está em " + v.chave);
    assert.equal(m.travado, true);
  }
});
