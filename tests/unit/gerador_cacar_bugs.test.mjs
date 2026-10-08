// Ticket 17 da dívida técnica (08/10/2026): caça-bugs no caminho do gerador de builds por IA
// (prompt -> chamada -> validação -> gravação). Cada achado confirmado virou teste aqui; os
// "casos mínimos" do ticket (Mega antes da pedra, golpe acima do level cap, EV inválido,
// habilidade da forma Mega, item que só sai depois) ficam como guarda permanente.
// Fixtures achadas no dado real, nunca nomes supostos.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 8, difficulty: "ace", levelCapMode: "more" });
const dano = (n) => R.moveRoleOf(n) === "dano";
const tipoDe = (n) => R.TYPES[R.MOVES[R.MOVE_ID_BY_NAME[n]][1]];
const nomeAb = (id) => R.ABILITIES[id][0];

// Espécie comum sem exigência de sinergia (a regra do especialista rejeitaria antes), com 2 golpes de
// dano STAB e 2 de cobertura no movepool do cap.
let golpes;
const sp = R.SPECIES.find((s) => {
  if (!s || R.isMegaForm(s) || (R.ABILITY_SYNERGY[s.sname] || []).length || (R.CONDITION_MOVE_SYNERGY || {})[s.sname]) return false;
  if (R.megaFormsOf(s).length) return false;
  const mv = R.availableMovesFor(s).names;
  const t = R.speciesTypeNames(s);
  const stab = mv.filter((n) => dano(n) && t.indexOf(tipoDe(n)) !== -1);
  const cob = mv.filter((n) => dano(n) && t.indexOf(tipoDe(n)) === -1);
  if (stab.length < 2 || cob.length < 2) return false;
  golpes = [stab[0], stab[1], cob[0], cob[1]];
  return true;
});
const habilidade = nomeAb(sp.ab[0]);
const bruto = (extra) => Object.assign({ ability: habilidade, nature: "Adamant", item: "Life Orb", moves: golpes.slice(), evs: [0, 252, 0, 0, 4, 252], papel: "Wallbreaker", rationale: "x" }, extra);
const valida = (extra, especie) => { const m = {}; const v = R.validateAiBuild(especie || sp, bruto(extra), m); return { v, txt: m.txt }; };

test("pré-condição: a build-base da fixture passa na validação", () => {
  const { v, txt } = valida({});
  assert.ok(v, txt);
  assert.equal(v.item, "Life Orb");
});

// ---------- achados confirmados ----------

test("achado 1: golpe repetido nos 4 slots é rejeitado (antes passava e a build ficava com 3 golpes úteis)", () => {
  const { v, txt } = valida({ moves: [golpes[0], golpes[0], golpes[1], golpes[2]] });
  assert.equal(v, null);
  assert.match(txt, /repet/i);
  assert.ok(txt.includes(golpes[0]), "diz qual golpe repetiu, pra IA corrigir na nova tentativa");
});

test("achado 2: item que o prompt não oferece (pedra de outra espécie, item-chave) cai pra 'sem item'", () => {
  assert.equal(valida({ item: "Charizardite X" }).v.item, "", "pedra mega de outra espécie");
  assert.equal(valida({ item: "Rare Candy" }).v.item, "", "item-chave que não existe em batalha");
  // O que o prompt oferece continua valendo (grupos gerais, berries, gemas, tipo, utilidade).
  for (const ok of ["Life Orb", "Sitrus Berry", "Flying Gem", "Charcoal", "Scope Lens"]) {
    assert.equal(valida({ item: ok }).v.item, ok, ok + " é oferecido ao modelo");
  }
});

test("achado 2b: item exclusivo da espécie e a pedra da própria forma Mega continuam aceitos", () => {
  const pikachu = R.getSpeciesBySname("SPECIES_PIKACHU");
  assert.ok(pikachu);
  assert.deepEqual([...R.itensDeEspeciePara(pikachu)], ["Light Ball"]);
  // Light Ball no Pikachu: não cai pra "" pelo filtro de itens oferecidos (o resto da validação pode rejeitar por outro motivo).
  const m = {};
  const v = R.validateAiBuild(pikachu, Object.assign(bruto({ item: "Light Ball" }), { ability: nomeAb(pikachu.ab[0]), moves: R.availableMovesFor(pikachu).names.filter(dano).slice(0, 4) }), m);
  if (v) assert.equal(v.item, "Light Ball");
  // Pedra da própria Mega (modo temporário): continua sendo imposta/aceita.
  const mega = R.getSpeciesBySname("SPECIES_ABSOL_MEGA");
  assert.deepEqual([...R.stonesOf(mega)], ["Absolite"]);
  const mv = R.availableMovesFor(mega).names;
  const t = R.speciesTypeNames(mega);
  const stab = mv.filter((n) => dano(n) && t.indexOf(tipoDe(n)) !== -1).slice(0, 2);
  const cob = mv.filter((n) => dano(n) && t.indexOf(tipoDe(n)) === -1).slice(0, 2);
  const r = valida({ ability: nomeAb(mega.ab[0]), moves: stab.concat(cob), item: "Absolite" }, mega);
  assert.ok(r.v, r.txt);
  assert.equal(r.v.item, "Absolite");
});

test("achado 3: EV em formato inválido (ausente, tamanho errado, texto) é rejeitado em vez de salvar a build zerada", () => {
  for (const evs of [undefined, null, "252 Atk", { 1: 252 }, [0, 252, 0, 0, 252], [0, 252, 0, 0, 4, 252, 0], ["a", "b", "c", "d", "e", "f"], [0, 252, null, 0, 4, 252]]) {
    const { v, txt } = valida({ evs, papel: undefined });
    assert.equal(v, null, "evs=" + JSON.stringify(evs));
    assert.match(txt, /EV/);
  }
});

test("EV numérico fora da faixa continua sendo ajustado (negativo, acima de 252, soma acima de 510)", () => {
  assert.deepEqual(valida({ evs: [-5, 252, 0, 0, 4, 252], papel: undefined }).v.evs.every((e) => e >= 0 && e <= 252), true);
  const alto = valida({ evs: [252, 252, 252, 0, 0, 0], papel: undefined }).v.evs;
  assert.ok(alto.reduce((a, b) => a + b, 0) <= 510);
  assert.ok(Math.max(...valida({ evs: [999, 0, 0, 0, 0, 0], papel: undefined }).v.evs) <= 252);
  // Texto numérico ("252") é número escrito entre aspas, não formato inválido.
  assert.ok(valida({ evs: ["0", "252", "0", "0", "4", "252"] }).v);
});

test("achado 4: o texto que o modelo escreveu volta limitado no motivo da rejeição (vai ao prompt da nova tentativa)", () => {
  const longo = "x".repeat(500);
  for (const extra of [{ ability: longo }, { nature: longo }, { moves: [longo, golpes[1], golpes[2], golpes[3]] }]) {
    const { v, txt } = valida(extra);
    assert.equal(v, null);
    assert.ok(txt.length < 300, "motivo com " + txt.length + " caracteres");
  }
});

test("achado 5: build curada no time novo não leva habilidade que a forma não tem (Arbok Mega: Merciless é da base)", () => {
  const R2 = carregarRegras({ milestone: 9, difficulty: "ace", levelCapMode: "more" });
  const mega = R2.getSpeciesBySname("SPECIES_ARBOK_MEGA");
  const cur = R2.curadasDe("SPECIES_ARBOK_MEGA")[0];
  const escolhiveis = R2.uniqueIds(mega.ab).map((id) => R2.ABILITIES[id][0]);
  assert.ok(!escolhiveis.includes(cur.ability), "pré-condição (dado real): a curada usa uma habilidade que a Mega não escolhe");
  assert.equal(R2.entradaDaCuradaParaTimeNovo(mega, cur), null);
});

test("achado 5b: curada válida entra no time novo, com golpes e habilidade da curada", () => {
  const R2 = carregarRegras({ milestone: 9, difficulty: "ace", levelCapMode: "more" });
  let ok = null;
  for (const sname of Object.keys(R2.BUILDS)) {
    const s = R2.getSpeciesBySname(sname);
    const cur = s && R2.curadasDe(sname)[0];
    if (!cur) continue;
    const e = R2.entradaDaCuradaParaTimeNovo(s, cur);
    if (e) { ok = { s, cur, e }; break; }
  }
  assert.ok(ok, "alguma curada do dado real serve");
  assert.equal(ok.e.ability, ok.cur.ability);
  assert.deepEqual([...ok.e.moves], [...ok.cur.moves]);
  assert.equal(ok.e.planoConsultado, true);
});

test("achado 6: EV da curada copiado pra build do jogador nunca passa de 510 (Lepastry do Discord tem 520)", () => {
  const R2 = carregarRegras({ milestone: 9, difficulty: "ace", levelCapMode: "more" });
  const lepastry = R2.getSpeciesBySname("SPECIES_LEPASTRY");
  const cur = R2.curadasDe("SPECIES_LEPASTRY")[0];
  const bruta = R2.evsTextoParaArray(cur.evs);
  assert.ok(bruta.reduce((a, b) => a + b, 0) > 510, "pré-condição (dado real): a curada soma mais de 510");
  const e = R2.entradaDaCuradaParaTimeNovo(lepastry, cur);
  if (e) assert.ok(e.evs.reduce((a, b) => a + b, 0) <= 510);
  // Golpe-ponte: habilidade, natureza, item e EVs ficam os da curada, mas dentro do limite do jogo.
  const validated = { ability: "x", nature: "Calm", item: "", moves: [], evs: [0, 0, 0, 0, 0, 0], rationale: "" };
  R2.ajustarBuildDaIa(lepastry, validated, { modo: "ponte", alvo: cur }, 40);
  assert.ok(validated.evs.reduce((a, b) => a + b, 0) <= 510);
  assert.ok(validated.evs.every((v) => v >= 0 && v <= 252));
});

// ---------- casos mínimos do ticket (guardas) ----------

test("caso mínimo: golpe acima do level cap é rejeitado pela validação e vira aviso quando já está na build", () => {
  const R2 = carregarRegras({ milestone: 0, difficulty: "ace", levelCapMode: "more" });
  const cap = R2.getCurrentCap();
  const s = R2.SPECIES.find((x) => x && !R2.isMegaForm(x) && x.lm.some((p) => p[0] > cap && x.tu.indexOf(p[1]) === -1 && !x.lm.some((q) => q[1] === p[1] && q[0] <= cap)));
  assert.ok(s);
  const alto = R2.MOVES[s.lm.find((p) => p[0] > cap && s.tu.indexOf(p[1]) === -1 && !s.lm.some((q) => q[1] === p[1] && q[0] <= cap))[1]][0];
  const livres = R2.availableMovesFor(s).names;
  const m = {};
  const v = R2.validateAiBuild(s, { ability: R2.ABILITIES[s.ab[0]][0], nature: "Adamant", item: "", moves: [alto].concat(livres.slice(0, 3)), evs: [0, 252, 0, 0, 4, 252], rationale: "x" }, m);
  assert.equal(v, null);
  assert.match(m.txt, /level cap/);
  assert.ok(R2.avisosDaBuild(s, { moves: [alto], ability: "" }).some((a) => a.tipo === "golpe-cap"));
});

test("caso mínimo: habilidade da forma Mega é a da Mega, não a da base", () => {
  const mega = R.getSpeciesBySname("SPECIES_ABSOL_MEGA");
  const base = R.getSpeciesBySname("SPECIES_ABSOL");
  const daBase = R.uniqueIds(base.ab).map(nomeAb).find((n) => R.uniqueIds(mega.ab).map(nomeAb).indexOf(n) === -1);
  assert.ok(daBase, "pré-condição (dado real): a base tem escolhível que a Mega não tem");
  const mv = R.availableMovesFor(mega).names.filter(dano).slice(0, 4);
  const m = {};
  assert.equal(R.validateAiBuild(mega, bruto({ ability: daBase, moves: mv, item: "Absolite" }), m), null);
  assert.match(m.txt, /não é uma das escolhíveis do Absol Mega/);
});

test("caso mínimo: Mega antes da pedra/insígnia vira aviso (e a base não carrega a pedra tardia sem aviso)", () => {
  const R2 = carregarRegras({ milestone: 2, difficulty: "ace", levelCapMode: "more" });
  const mega = R2.getSpeciesBySname("SPECIES_ABSOL_MEGA");
  assert.equal(R2.megaFormLiberada(mega), false);
  assert.ok(R2.avisosDaBuild(mega, { moves: ["Scratch"] }).some((a) => a.tipo === "mega"));
  const base = R2.getSpeciesBySname("SPECIES_GARDEVOIR");
  assert.ok(R2.avisosDaBuild(base, { moves: ["Scratch"], item: "Gardevoirite" }).some((a) => a.tipo === "item-tardio"));
  assert.match(R2.megaPromptBlock(R2.getSpeciesBySname("SPECIES_ABSOL")), /AINDA NAO DISPONIVEL/);
});

test("caso mínimo: item que só sai depois da etapa atual vira aviso, com a etapa e o lugar", () => {
  const R2 = carregarRegras({ milestone: 0, difficulty: "ace", levelCapMode: "more" });
  const item = R2.AI_ITEM_POOL.find((n) => { const p = R2.primeiroLugarDoItem(n); return p && p.etapa >= 3; });
  assert.ok(item, "pré-condição (dado real): item oferecido à IA que só sai depois da 3ª insígnia");
  const av = R2.avisosDaBuild(R2.getSpeciesBySname("SPECIES_RATTATA"), { moves: ["Tackle"], item }).find((a) => a.tipo === "item-tardio");
  assert.ok(av && av.texto.includes(item));
});
