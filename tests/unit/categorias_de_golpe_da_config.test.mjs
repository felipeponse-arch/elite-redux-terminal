// Depende de dado: rank/lutas (muda quando o rank é recalculado; não é regra de jogo fixa).
// Ticket calibracao-2026-10-15/01 (15/10/2026): as categorias de golpe (soco, mordida, corte, martelo, pulso, chifre,
// flecha, chute, arremesso...) vêm das FLAGS do MoveList da er-config (como o código do jogo as lê: abilities.cc
// DoesMoveMatchFlag e gBattleMoves[move].hammerBased/hornBased/arrowBased/throwingBased), não do texto da NextDex.
// Antes, 98 golpes (Crunch, Stone Edge, Brick Break, Wood Hammer, Sludge Bomb...) ficavam sem categoria e Strong Jaw,
// Keen Edge, Iron Fist, Super Slammer e Mega Launcher não os reforçavam.
// Chefões e espécies reais do app. Sabotagem controlada (tests/run_sabotage.mjs) também nos arquivos fora de src/regras.
import { N_GOLPES } from "./contagens_versao.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { carregarRegras, lerComMutacao } from "./carregar_regras.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const M = await import("data:text/javascript;base64," + Buffer.from(lerComMutacao("scripts/categorias_pela_config.mjs", "categorias_pela_config.mjs")).toString("base64"));
const categorias = JSON.parse(lerComMutacao("data/move_categorias.json", "move_categorias.json"));
const flagsDaConfig = JSON.parse(readFileSync(join(RAIZ, "data", "golpes_flags_config.json"), "utf8"));
const dex = JSON.parse(readFileSync(join(RAIZ, "data", "dex_compact.json"), "utf8"));
const faltavam = JSON.parse(readFileSync(join(RAIZ, "docs", "calibracao", "dados", "categorias_de_golpe_faltando.json"), "utf8")).faltamNoMotor;

const R = carregarRegras({ milestone: 8, difficulty: "ace", levelCapMode: "more" });
const NIVEL = 55;
const idDe = (nome) => R.MOVE_ID_BY_NAME[nome];
// Fator que as habilidades do atacante põem no poder do golpe (STAB natural fica fora: entra em forcaBase).
const hab = (u, nome) => { const g = R.prepararGolpesDuelo([idDe(nome)], u, null)[0]; return g.forca / g.forcaBase; };
const unidadeDoChefao = (chefao, mon, golpe) => {
  const b = R.BOSSES.find((x) => x.name === chefao);
  const p = b && b.party.find((x) => x.n === mon && (x.mv || []).includes(golpe));
  assert.ok(p, chefao + " / " + mon + " / " + golpe + " não existe em bosses.json");
  return R.foeDeDuelo(p, NIVEL, null);
};
const perto = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, msg + ": " + a + " x " + b);

// ---------- o gerador ----------
test("lerGolpesDaConfig: lê id, nome e flags de um bloco real do MoveList e pula o bloco aninhado (argument)", () => {
  const texto = `# proto-file: MoveList.proto
moves {
  id: MOVE_DOUBLE_SLAP
  name: "Double Slap"
  effect: EFFECT_MULTI_HIT
  split: PHYSICAL
  power: 25
  argument {
    effect {
      effect: MOVE_EFFECT_DOUBLESLAP
      hammer: true
    }
  }
  contact: true
  mirror_move_affected: true
}
moves {
  id: MOVE_WOOD_HAMMER
  name: "Wood Hammer"
  power: 120
  contact: true
  reckless: true
  hammer: true
}
moves {
  id: MOVE_MEGA_PUNCH
  name: "Mega Punch"
  iron_fist: true
}
`;
  const l = M.lerGolpesDaConfig(texto);
  assert.deepEqual(l.map((g) => g.nome), ["Double Slap", "Wood Hammer", "Mega Punch"]);
  assert.deepEqual(l[0].flags, [], "a flag dentro de argument { } não é do golpe");
  assert.deepEqual(l[1].flags, ["hammer"], "reckless e contact não são categorias");
  assert.deepEqual(l[2].flags, ["iron_fist"]);
});

test("flag -> categoria: as 8 que reforçam habilidades mais arremesso, luz, lunar e broca", () => {
  assert.deepEqual(
    Object.entries(M.FLAG_PARA_CATEGORIA).sort(),
    Object.entries({ iron_fist: "soco", strong_jaw: "mordida", keen_edge: "corte", mega_launcher: "pulso", horn: "chifre", striker: "chute", arrow: "flecha", hammer: "martelo", throwing: "arremesso", light: "luz", lunar: "lunar", drill: "broca" }).sort());
  assert.deepEqual(M.categoriasDasFlags(["hammer", "iron_fist"]), ["soco", "martelo"], "ordem fixa, não a da chamada");
  assert.deepEqual(M.categoriasDasFlags(undefined), []);
});

// ---------- o dado ----------
test("move_categorias.json: o campo `c` de TODOS os golpes (1042 na 2.65.5) é exatamente o que as flags da config mandam", () => {
  assert.equal(flagsDaConfig.meta.golpesDoApp, dex.moves.filter(Boolean).length, "golpes_flags_config.json foi gerado para este dex_compact");
  let conferidos = 0;
  dex.moves.forEach((m, id) => {
    if (!m) return;
    const esperado = M.categoriasDasFlags(flagsDaConfig.golpes[m[0]]);
    assert.deepEqual((categorias[id] && categorias[id].c) || [], esperado, m[0]);
    conferidos++;
  });
  assert.equal(conferidos, N_GOLPES);
});

test("os golpes que o relatório de calibração achou sem categoria (99 pares golpe+categoria) agora têm a categoria do jogo", () => {
  let n = 0;
  for (const [cat, golpes] of Object.entries(faltavam)) {
    for (const nome of golpes) {
      assert.ok(R.categoriasDoGolpeDuelo(idDe(nome)).includes(cat), nome + " devia ser " + cat);
      n++;
    }
  }
  assert.equal(n, 99);
});

test("o Molten Strike deixa de ser soco (o texto da NextDex citava Iron Fist, a flag do jogo é martelo) e o Hammer Arm segue soco e ganha martelo", () => {
  assert.deepEqual(R.categoriasDoGolpeDuelo(idDe("Molten Strike")).slice(), ["martelo"]);
  assert.deepEqual(R.categoriasDoGolpeDuelo(idDe("Hammer Arm")).slice(), ["soco", "martelo"]);
});

// ---------- o motor, com chefões reais ----------
// Cada caso compara um golpe que ANTES não tinha categoria com um golpe da mesma habilidade que já tinha: o fator
// tem que ser igual. (ref = golpe de referência da mesma categoria que já era lido.)
const CASOS = [
  ["Archie Slateport", "Sharpedo", "Crunch", "Bite", "Strong Jaw"],
  ["Brawly 4", "Machamp", "Dynamic Punch", "Mach Punch", "Iron Fist"],
  ["Calvin E4", "Tinkaton", "Gigaton Hammer", "Berry Smash", "Super Slammer"],
  ["Archie", "Garchomp Redux", "Metal Claw", "Slash", "Sharpness"],
  ["Monochamp Ghost", "Decidueye", "Spirit Shackle", "Archer Shot", "Archer"]
];
for (const [chefao, mon, novo, ref, habilidade] of CASOS) {
  test(`${chefao}: ${mon} com ${habilidade} reforça ${novo} como reforça ${ref}`, () => {
    const u = unidadeDoChefao(chefao, mon, novo);
    assert.ok(u.ids.includes(R.ABILITY_ID_BY_NAME[habilidade]), mon + " tem " + habilidade);
    assert.ok(hab(u, novo) >= 1.3, novo + ": fator " + hab(u, novo));
    perto(hab(u, novo), hab(u, ref), novo + " x " + ref);
  });
}

test("Mega Launcher: Sludge Bomb (pulso pela flag) rende x1,3 sobre o Sludge, golpe do mesmo tipo e categoria especial sem flag", () => {
  const u = unidadeDoChefao("Matt", "Blastoise", "Hydro Cannon");
  assert.ok(u.ids.includes(R.ABILITY_ID_BY_NAME["Mega Launcher"]));
  perto(hab(u, "Sludge Bomb") / hab(u, "Sludge"), 1.3, "Sludge Bomb / Sludge");
});

test("Brick Break e Stone Edge: soco e corte pelas flags (a Machamp de Brawly 4 e o Terrakion de Roxanne 3)", () => {
  const machamp = unidadeDoChefao("Brawly 4", "Machamp", "Dynamic Punch");
  perto(hab(machamp, "Brick Break"), hab(machamp, "Mach Punch"), "Brick Break x Mach Punch");
  const terrakion = unidadeDoChefao("Roxanne 3", "Terrakion", "Stone Edge");
  assert.ok(terrakion.ids.includes(R.ABILITY_ID_BY_NAME["Sharpness"]), "o Terrakion de Roxanne 3 tem Sharpness (ex-Keen Edge)");
  perto(hab(terrakion, "Stone Edge"), hab(terrakion, "Slash"), "Stone Edge x Slash");
});

test("Rocky Payload (Throh Redux): golpe de arremesso Steel rende x1,5 sobre um golpe Steel que não é de arremesso", () => {
  const throh = R.SPECIES.find((s) => s && s.n === "Throh Redux");
  const u = R.unidadeDaBuild(throh, { ability: "Guts", nature: "Adamant", evs: [0, 252, 0, 0, 0, 252], item: "", moves: ["Shot Put"] }, NIVEL, null);
  assert.ok(u.ids.includes(R.ABILITY_ID_BY_NAME["Rocky Payload"]), "Rocky Payload é innate do Throh Redux e vale no nível " + NIVEL);
  // O texto "Rock-type and throwing moves" agora aponta para a categoria: a leitura direta (a tabela antiga de sinergia por
  // golpe, bonusGolpes, já cobria os golpes que estas 6 espécies aprendem, então o dano não mudou para elas).
  const ef = R.efeitoDasHabilidadesNoDuelo([R.ABILITY_ID_BY_NAME["Rocky Payload"]], throh.sname, null);
  assert.equal(ef.bonusCategoria.arremesso, 1.5);
  assert.equal(ef.bonusTipo.Rock, 1.5);
  assert.ok(R.categoriasDoGolpeDuelo(idDe("Shot Put")).includes("arremesso"));
  assert.ok(!R.categoriasDoGolpeDuelo(idDe("Iron Head")).includes("arremesso"));
  perto(hab(u, "Shot Put") / hab(u, "Iron Head"), 1.5, "Shot Put / Iron Head");
});

test("categorias que nenhuma habilidade do dado 2.65beta lê (luz, lunar, broca) ficam gravadas sem mudar nenhum dano", () => {
  const u = unidadeDoChefao("Archie Slateport", "Sharpedo", "Crunch");
  assert.ok(R.categoriasDoGolpeDuelo(idDe("Solar Beam")).includes("luz"));
  assert.ok(R.categoriasDoGolpeDuelo(idDe("Moonblast")).includes("lunar"));
  assert.ok(R.categoriasDoGolpeDuelo(idDe("Drill Run")).includes("broca"));
  perto(hab(u, "Moonblast"), hab(u, "Fairy Wind"), "Moonblast x Fairy Wind: a categoria lunar não reforça nada");
});

// ---------- recuo e acertos pelo effect/hit_count (ticket calibracao-03, B5) ----------
test("lerGolpesDaConfig: lê o effect e o hit_count do golpe (e ignora o hit_count dentro de argument { })", () => {
  const l = M.lerGolpesDaConfig(`moves {
  id: MOVE_ATOMIC_FIRE
  name: "Atomic Fire"
  effect: EFFECT_RECOIL_33
  power: 120
}
moves {
  id: MOVE_DOUBLE_SHOCK
  name: "Double Shock"
  effect: EFFECT_BURN_UP
  hit_count: 2
  argument {
    hit_count: 9
  }
}
`);
  assert.equal(l[0].efeito, "EFFECT_RECOIL_33");
  assert.equal(l[0].acertos, undefined);
  assert.equal(l[1].acertos, 2);
});

test("recuoDoEfeito: EFFECT_RECOIL_25/33/50 dão o percentual; os outros efeitos de recuo (de vida, por erro, com recuo e susto) não", () => {
  assert.equal(M.recuoDoEfeito("EFFECT_RECOIL_33"), 33);
  assert.equal(M.recuoDoEfeito("EFFECT_RECOIL_50"), 50);
  assert.equal(M.recuoDoEfeito("EFFECT_RECOIL_25"), 25);
  for (const e of ["EFFECT_RECOIL_HP_25", "EFFECT_RECOIL_IF_MISS", "EFFECT_FLINCH_RECOIL_33", "EFFECT_BURN_UP", undefined]) assert.equal(M.recuoDoEfeito(e), null, String(e));
});

test("PALAVRAS_DE_CATEGORIA do motor: cada categoria carrega a flag da config que a origina, e bate com FLAG_PARA_CATEGORIA", () => {
  const R = carregarRegras();
  assert.ok(R.PALAVRAS_DE_CATEGORIA.length >= 11);
  for (const p of R.PALAVRAS_DE_CATEGORIA) assert.equal(M.FLAG_PARA_CATEGORIA[p.flag], p.nome, "flag " + p.flag + " deve virar " + p.nome);
  // "lunar" e a Air/contact não têm habilidade que as descreva em texto: ficam só na tabela da config.
  const semTexto = Object.values(M.FLAG_PARA_CATEGORIA).filter((c) => !R.PALAVRAS_DE_CATEGORIA.some((p) => p.nome === c));
  assert.deepEqual(semTexto, ["lunar"]);
});
