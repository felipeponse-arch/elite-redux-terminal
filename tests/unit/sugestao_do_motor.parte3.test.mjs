// Parte 3 de 3 de sugestao_do_motor.test.mjs (dividido em 06/11/2026 para rodar em paralelo; ver tests/pesados.json).
// "Ficar com este time" grava as builds como "Sugestão do app" (ticket time-pelo-motor/01, F5, 21/10/2026).
// Dado real: o time vem do próprio Modo Motor. Cada teste cobre um risco do pedido do usuário (save, conflito com build própria, favorito da caixa).
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const ELENCO = ["Centiskorch", "Scizor", "Garchomp", "Metagross", "Grimmsnarl", "Togekiss", "Klefki", "Gardevoir"];
const R = carregarRegras({ milestone: 2 });
const sp = (n) => R.SPECIES.find((s) => s && s.n === n);
const copia = (o) => JSON.parse(JSON.stringify(o));
const zerar = () => {
  const s = R.state;
  s.team = ELENCO.slice(0, 6).map((n) => sp(n).x); s.box = ELENCO.slice(6).map((n) => sp(n).x);
  s.customBuilds = {}; s.orphans = { team: [], box: [] }; s.autoLog = [];
  s.archetype = { pace: null, weather: null, monotype: null, tatica: null, reasoning: "" };
};
zerar();
const cache = R.criarCacheDoMotor();
const variante = (favoritos = []) => {
  const ctx = R.contextoDoMotor(); ctx.cache = cache;
  return copia(R.montarTimePeloMotor(ctx, { favoritos }).variantes[0]);
};
const membros = variante().membros;
const entrada = (source, active, i = 0) => ({ ability: "X", nature: "Jolly", item: "", moves: ["M" + i, "N" + i], ivs: [31, 31, 31, 31, 31, 31], evs: [0, 0, 0, 0, 0, 0], source, active, savedAt: "2026-10-0" + (i + 1) + "T00:00:00Z", rationale: "" });

beforeEach(zerar);



test("a sugestão gravada não vira 'build salva do jogador' na próxima montagem; a build manual continua mandando", () => {
  const fav = membros[0];
  R.gravarSugestoesDoMotor(membros);
  const m = variante([fav.base]).membros.find((x) => x.base === fav.base);
  assert.notEqual(m.origem, "build-salva");
  R.state.customBuilds[fav.sname] = [entrada("manual", true, 0)];
  const m2 = variante([fav.base]).membros.find((x) => x.base === fav.base);
  assert.equal(m2.origem, "build-salva");
});
