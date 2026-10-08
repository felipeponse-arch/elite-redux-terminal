// Ticket dados-2654/11 (08/10/2026): as 13 decisões que o usuário tomou sobre as dúvidas acumuladas.
// Cada decisão que muda comportamento (4-7, 8, 9, 13) tem teste aqui; 1-3, 10-12 são texto/registro.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { carregarRegras } from "./carregar_regras.mjs";
import { validarBuilds } from "../../scripts/validar_dados.mjs";

const R = carregarRegras({ milestone: 8, difficulty: "ace", levelCapMode: "more" });
const R0 = carregarRegras({ milestone: 0, difficulty: "ace", levelCapMode: "more" });
const bruto = JSON.parse(readFileSync(new URL("../../data/builds.json", import.meta.url), "utf8"));
const uma = (v) => (Array.isArray(v) ? v : [v]);

test("item 4: build da IA promovida pelo playtester tem Confiança consenso (não relato)", () => {
  const s = R.seloDaBuild({ origem: "curada", fonte: "ia-curada-playtester" });
  assert.equal(s.nivel, "consenso");
  assert.equal(R.seloDaBuild({ origem: "ia" }).nivel, "relato", "a build gerada na hora continua relato");
});

test("item 5: Mega cuja pedra ainda não saiu na Etapa não gera build; liberada, gera", () => {
  const mega = R0.getSpeciesBySname("SPECIES_ABSOL_MEGA");
  assert.equal(R0.megaFormLiberada(mega), false, "pré-condição: Etapa 0, pedra travada");
  const motivo = R0.motivoDeNaoGerarBuild(mega);
  assert.match(motivo, /Mega só a partir da/);
  assert.equal(R0.motivoDeNaoGerarBuild(R0.getSpeciesBySname("SPECIES_ABSOL")), null, "forma base gera");
  assert.equal(R.motivoDeNaoGerarBuild(R.getSpeciesBySname("SPECIES_ABSOL_MEGA")), null, "Etapa 8: pedra liberada");
});

test("item 6: o prompt diz quais itens ainda não estão disponíveis, e some quando já saíram", () => {
  const cedo = R0.blocoItensComunsIA(false, "");
  assert.match(cedo, /AINDA NAO DISPONIVEIS/);
  assert.match(cedo, /Zoom Lens \(a partir da 1ª insígnia\)/, "item real do dado que só sai na 1ª insígnia");
  assert.match(cedo, /com motivo claro/, "a IA evita mas pode usar com motivo");
  assert.doesNotMatch(R.blocoItensComunsIA(false, ""), /AINDA NAO DISPONIVEIS/, "Etapa 8 já liberou todos");
});

test("item 7: golpe-ponte com item da curada vira aviso (Choice com status, 3º item igual)", () => {
  const porNome = (n) => R.SPECIES.find((s) => s && s.n === n);
  const [a, b, c] = ["Luvdisc", "Wailmer", "Corphish"].map(porNome);
  const status = "Swords Dance";
  assert.equal(R.DATA.splits[R.MOVES[R.MOVE_ID_BY_NAME[status]][2]], "STATUS", "pré-condição: Swords Dance é golpe de status");
  const com = (item) => [{ ability: "", nature: "Hardy", item, moves: ["Tackle"], evs: [0, 0, 0, 0, 0, 0], ivs: [31, 31, 31, 31, 31, 31], active: true, source: "ia" }];
  R.state.team = [a.x, b.x, c.x]; R.state.box = []; R.state.customBuilds = {};
  try {
    R.state.customBuilds[a.sname] = com("Life Orb");
    R.state.customBuilds[b.sname] = com("Life Orb");
    const avisos = (sp, build) => R.avisosDaBuild(sp, build);
    const rep = avisos(c, { moves: ["Tackle"], item: "Life Orb" }).find((x) => x.tipo === "item-repetido");
    assert.ok(rep && /no máximo 2/.test(rep.texto), "terceiro Life Orb no time");
    assert.equal(avisos(c, { moves: ["Tackle"], item: "Leftovers" }).some((x) => x.tipo === "item-repetido"), false);
    const ch = avisos(c, { moves: ["Tackle", status], item: "Choice Band" }).find((x) => x.tipo === "item-conflito");
    assert.ok(ch && /Choice Band/.test(ch.texto) && !/Tente gerar de novo/.test(ch.texto), "Choice com golpe de status");
    assert.equal(avisos(c, { moves: ["Tackle"], item: "Choice Band" }).some((x) => x.tipo === "item-conflito"), false);
  } finally {
    R.state.team = []; R.state.customBuilds = {};
  }
});

test("item 8: Heal Block permanente recusa Black Sludge (cura só em Poison; o jogo bloqueia pela CanBattlerHeal)", () => {
  const dano = (n) => R.moveRoleOf(n) === "dano";
  const tipoDe = (n) => R.TYPES[R.MOVES[R.MOVE_ID_BY_NAME[n]][1]];
  let golpes;
  const s = R.SPECIES.find((s) => {
    if (!s || R.isMegaForm(s) || (R.ABILITY_SYNERGY[s.sname] || []).length || (R.CONDITION_MOVE_SYNERGY || {})[s.sname]) return false;
    if (R.speciesTypeNames(s).indexOf("Poison") === -1 || R.megaFormsOf(s).length) return false;
    const mv = R.availableMovesFor(s).names.filter(dano);
    const t = R.speciesTypeNames(s);
    const stab = mv.filter((n) => t.indexOf(tipoDe(n)) !== -1), cob = mv.filter((n) => t.indexOf(tipoDe(n)) === -1);
    if (stab.length < 2 || cob.length < 2) return false;
    golpes = [stab[0], stab[1], cob[0], cob[1]];
    return true;
  });
  assert.ok(s, "fixture: espécie Poison do dado real");
  const b = (item) => ({ ability: R.ABILITIES[s.ab[0]][0], nature: "Adamant", item, moves: golpes, evs: [0, 252, 0, 0, 4, 252], papel: "Wallbreaker", rationale: "x" });
  const tenta = (item, ctx) => { const m = {}; const v = R.validateAiBuild(s, b(item), m, ctx); return v ? "ok" : m.txt; };
  assert.equal(tenta("Black Sludge", {}), "ok", "sem Heal Block, Black Sludge em Poison vale");
  assert.match(tenta("Black Sludge", { buffs: ["flannery_healblock"] }), /Heal Block permanente: Black Sludge não cura/);
});

test("item 9: curadas do Discord corrigidas (habilidade da forma, EV válido) e com nota do que mudou", () => {
  const dex = JSON.parse(readFileSync(new URL("../../data/dex_compact.json", import.meta.url), "utf8"));
  const escolhiveis = (sname) => {
    const s = dex.species.find((x) => x && x.sname === sname);
    return new Set([...new Set(s.ab)].map((id) => dex.abilities[id][0]));
  };
  const soma = (t) => String(t).split("/").reduce((acc, p) => acc + Number(p.trim().split(" ")[0]), 0);
  const k = bruto.SPECIES_KLEAVOR_REDUX_MEGA, a = bruto.SPECIES_AGGRON_REDUX_MEGA, g = bruto.SPECIES_GROTOM_KICK;
  assert.ok(escolhiveis("SPECIES_KLEAVOR_REDUX_MEGA").has(k.ability), "Kleavor Redux Mega: habilidade escolhível");
  assert.ok(escolhiveis("SPECIES_AGGRON_REDUX_MEGA").has(a.ability), "Aggron Redux Mega: habilidade escolhível");
  for (const [n, b] of [["Aggron", a], ["Grotom Kick", g]]) {
    assert.doesNotMatch(b.evs, /\bor\b/, n + ": EV sem 'or'");
    assert.ok(soma(b.evs) <= 510, n + ": soma de EV válida");
    assert.match(b.note, /CORREÇÃO \(08\/10/, n + ": nota do que mudou em relação ao Discord");
  }
  assert.match(k.note, /CORREÇÃO \(08\/10/);
  assert.equal(validarBuilds().problemas.length, 0, validarBuilds().problemas.join("; "));
});

test("item 13: builds dos vídeos entram como 2ª Build, ao lado da curada do Discord", () => {
  for (const [sname, golpes, item] of [
    ["SPECIES_GARCHOMP_MEGA_REDUX", ["Swords Dance", "Last Respects"], null],
    ["SPECIES_WOOLY_WORM", [], "Assault Vest"],
  ]) {
    const lista = uma(bruto[sname]);
    assert.equal(lista.length, 2, sname + ": curada do Discord + a do vídeo");
    assert.equal(lista[0].fonte, "discord-build-workshop-2.65");
    assert.equal(lista[1].fonte, "video-megafidough");
    for (const g of golpes) assert.ok(lista[1].moves.includes(g), sname + " leva " + g);
    if (item) assert.equal(lista[1].item, item);
  }
  // Assault Vest não convive com golpe de status: a 2ª do Wooly Worm não leva nenhum.
  const w = uma(bruto.SPECIES_WOOLY_WORM)[1];
  assert.equal(w.moves.filter((m) => R.DATA.splits[R.MOVES[R.MOVE_ID_BY_NAME[m]][2]] === "STATUS").length, 0);
  assert.equal(R.conflitoDeItem(w.item, w.moves, R.getSpeciesBySname("SPECIES_WOOLY_WORM")), null);
  // O app mostra as duas (curadasDe lê lista).
  assert.equal(R.curadasDe("SPECIES_WOOLY_WORM").length, 2);
});
