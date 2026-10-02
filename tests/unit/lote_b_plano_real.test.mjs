// Lote B da força-tarefa (2026-10-02): o plano contra o chefão tem que corresponder ao time
// que o jogador vai levar - 4 golpes, clima que dura 8 turnos e só com o armador em campo,
// a IA sabendo o que o simulador provou, e o time conferido de novo com as builds reais.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 3, difficulty: "ace", levelCapMode: "more" });
const porNome = (n) => { const s = R.SPECIES.find((x) => x && x.n === n); assert.ok(s, n); return s; };
const flannery = R.BOSSES.find((b) => b.name === "Flannery 1");
const party = R.bossPartyPorDificuldade(flannery);
const FADAS = ["Tinkaton", "Mawile", "Grimmsnarl", "Klefki", "Rapidash Galarian", "Tsareena Redux", "Alcremie", "Whimsicott",
  "Lilligant", "Ninetales Alolan", "Lycanroc Twilight", "Carbink", "Luvdisc", "Togekiss", "Florges White", "Gardevoir",
  "Granbull", "Wigglytuff", "Dachsbun", "Weezing Galarian", "Azumarill", "Clefable"];
const candidatos = () => FADAS.map((n) => ({ sp: porNome(n), owned: porNome(n).x }));
const r = R.montarTimeContraChefao(candidatos(), party, 50);

test("cada Pokémon do plano luta com no máximo 4 golpes (antes: o movepool inteiro)", () => {
  r.escolhidos.forEach((e) => {
    assert.ok(e.unidade.golpesDoSet.length <= 4, e.sp.n + ": " + e.unidade.golpesDoSet.length);
    assert.ok(e.unidade.golpesProntos.length + (e.unidade.statusIds || []).length <= 4, e.sp.n);
  });
  // o plano só cita golpes que o Pokémon leva
  r.plano.forEach((p) => p.respostas.forEach((a) => {
    const e = r.escolhidos.find((x) => x.sp === a.sp);
    if (a.golpe) assert.ok(e.unidade.golpesProntos.some((g) => g.nome === a.golpe), a.sp.n + " " + a.golpe);
  }));
});

test("estratégia de clima só é declarada se o armador entra na luta simulada", () => {
  if (!r.estrategia) return;
  const n = r.estrategia.armador;
  assert.ok(r.simulacao.log.some((l) => l.meu === n || l.entra === n), "armador " + n + " não entrou");
});

test("clima dura o número de turnos e só liga quando o armador entra", () => {
  const foesC = party.map((m) => R.foeDeDuelo(m, 50, "sol")).filter(Boolean);
  const foesS = party.map((m) => R.foeDeDuelo(m, 50, null)).filter(Boolean);
  const meus = r.escolhidos.map((e) => e.unidade);
  const base = { lado: R.novoLadoDuelo(), statusNoFim: [] };
  // clima do chefão (armador null): liga desde o início e apaga depois de 1 turno
  const s1 = R.simularLutaContraChefao(meus, foesC, 50, Object.assign({}, base, { clima: { duracao: 1, armadorIdx: null, meusSem: meus, foesSem: foesS } }));
  const lutas1 = s1.log.filter((l) => l.meu);
  assert.equal(lutas1[0].clima, true);
  assert.ok(lutas1.slice(1).every((l) => l.clima === false));
  // armador que nunca entra (índice inexistente): o clima nunca liga
  const s2 = R.simularLutaContraChefao(meus, foesC, 50, Object.assign({}, base, { clima: { duracao: 8, armadorIdx: -1, meusSem: meus, foesSem: foesS } }));
  assert.ok(s2.log.filter((l) => l.meu).every((l) => l.clima === false));
});

test("a IA recebe o set provado pelo simulador (habilidade, golpes e golpe-chave)", () => {
  const prov = R.resumoProvadoPeloSimulador(r);
  const e = r.escolhidos[0];
  const p = prov[e.sp.sname];
  assert.ok(p && p.golpes.length >= 1 && p.golpes.length <= 4);
  assert.equal(p.habilidade, e.ab);
  const prompt = R.montarPromptBuildsDoTime(r.escolhidos.map((x) => x.sp), { chefao: { boss: flannery, party, clima: r.clima, estrategia: r.estrategia }, responde: {}, provado: prov });
  assert.match(prompt, /O SIMULADOR PROVOU ESTE POKEMON/);
  assert.ok(prompt.indexOf(p.golpes[0]) !== -1);
});

test("o simulador usa a build salva do jogador quando existe", () => {
  const sp = porNome("Azumarill");
  const b = { ability: R.ABILITIES[sp.ab[0]][0], nature: "Adamant", item: "Choice Band", moves: ["Aqua Tail", "Play Rough", "Superpower", "Knock Off"].filter((n) => R.MOVE_ID_BY_NAME[n] !== undefined), evs: [252, 252, 0, 0, 4, 0] };
  const u = R.unidadeDaBuild(sp, b, 50, null);
  assert.equal(u.item, "Choice Band");
  assert.deepEqual(u.golpesProntos.map((g) => g.nome).sort().join(","), b.moves.filter((n) => R.golpeUtilNoDuelo(R.MOVE_ID_BY_NAME[n])).sort().join(","));
  const rr = R.montarTimeContraChefao([{ sp, owned: sp.x, build: b }], party, 50);
  assert.equal(rr.escolhidos[0].set, "build");
});

test("conferência com as builds reais: build fraca acusa que o plano piorou", () => {
  const time = r.escolhidos.map((e) => e.sp);
  const antes = R.state.customBuilds;
  try {
    // todas as builds só com golpes fracos: o plano não se sustenta
    R.state.customBuilds = {};
    time.forEach((sp) => {
      R.state.customBuilds[sp.sname] = [{ ability: R.ABILITIES[sp.ab[0]][0], nature: "Hardy", item: "", moves: ["Tackle", "Growl", "Leer", "Pound"].filter((n) => R.MOVE_ID_BY_NAME[n] !== undefined).slice(0, 4),
        ivs: [31, 31, 31, 31, 31, 31], evs: [0, 0, 0, 0, 0, 0], source: "manual", active: true, savedAt: "x", rationale: "" }];
    });
    const c = R.conferirTimeComBuilds(time, party, 50, {}, r.simulacao);
    assert.equal(c.pior, true, c.texto);
    assert.match(c.texto, /ATENÇÃO|Atenção/);
  } finally { R.state.customBuilds = antes; }
});
