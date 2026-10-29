// TK-33a (limpeza do motor, 29/10/2026): comportamento igual, fontes únicas. Itens 1-4.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras, lerComMutacao } from "./carregar_regras.mjs";

const duelo = lerComMutacao("src/regras/duelo.js", "duelo.js");
const hell = (ms) => carregarRegras({ difficulty: "hell", milestone: ms });

test("TK-33a.1: limiares do Hell vêm das constantes de chefoes.js (3ª: +5 níveis; 2ª: dano x0,9; 5ª: IV 0), valores do jogo", () => {
  for (let ms = 0; ms <= 8; ms++) {
    const R = hell(ms);
    assert.equal(R.nivelDoInimigoHell(50), ms >= 3 ? 55 : 50, "nível, insígnia " + ms);
    assert.equal(R.nivelDoInimigoHell(98), ms >= 3 ? 100 : 98, "teto 100, insígnia " + ms);
    assert.equal(R.fDanoGlobalHell({ chefao: true }), ms >= 2 ? 0.75 * 0.9 : 0.75, "dano, insígnia " + ms);
    assert.equal(R.ivDoJogadorDuelo(), ms >= 5 ? 0 : 31, "IV, insígnia " + ms);
  }
  assert.equal(hell(0).HELL_NIVEIS_EXTRAS, 5);
});
test("TK-33a.1: duelo.js não repete literal de insígnia do Hell", () => {
  assert.ok(!/milestone >= \d/.test(duelo.replace(/\/\/.*$/gm, "")), "milestone >= <número> no duelo.js");
});

test("TK-33a.2: duelo.js consome campo.js (sem lista literal de climas, CLIMA local ou nomes de hazard)", () => {
  const cod = duelo.replace(/\/\/.*$/gm, "");
  assert.ok(!/\["chuva", "sol", "areia", "granizo", "nevoa"\]/.test(cod), "lista literal de climas");
  assert.ok(!/var CLIMA = \{/.test(cod), "CLIMA local");
  assert.ok(!/se === "Stealth Rock" \|\| se === "Spikes"/.test(cod), "nomes de hazard à mão");
});
test("TK-33a.2: o lado novo nasce de CAMADAS_DE_HAZARD e TELAS_DO_LADO (mesmo formato de antes)", () => {
  const R = carregarRegras();
  assert.deepEqual(JSON.parse(JSON.stringify(R.novoLadoDuelo())), { rocha: false, espinho: 0, toxico: 0, teia: false, reflect: 0, luz: 0, veu: 0, vento: 0 });
  assert.deepEqual(Array.from(R.TIMERS_DO_LADO_DUELO), ["reflect", "luz", "veu", "vento"]);
});

test("TK-33a.3: aliases de migração saíram (TERRENO_DO_TEXTO_DUELO, CLIMAS_DE_ESTRATEGIA)", () => {
  assert.ok(!/TERRENO_DO_TEXTO_DUELO|CLIMAS_DE_ESTRATEGIA/.test(duelo));
  assert.ok(!/mono_run\.js\)/.test(duelo), "comentário velho do mono_run");
});

test("TK-33a.4: o terreno da névoa (Misty) tem id próprio e não colide com o clima nevoa (Eerie Fog)", () => {
  const R = carregarRegras();
  assert.equal(R.TERRENO_DO_TEXTO.misty, "nevoento");
  assert.ok(Array.from(R.TERRENOS_DO_CAMPO).every((t) => !Array.from(R.CLIMAS_DO_CAMPO).includes(t)), "id de terreno repete id de clima");
  assert.equal(R.TIPO_DO_TERRENO.nevoento, "Fairy");
});

// ---- item 5 (sobra do TK-12): RKS System tem omniStab no jogo (abilities.cc:3111-3126: Protean + Adaptability) ----
import { eu, chefao, NIVEL, EV, R as RC, dentroDoEfeito } from "./cenarios_do_duelo.mjs";
test("TK-33a.5: RKS System dá STAB (x2, Adaptability) também em golpe fora do tipo de quem a usa (Garchomp, Fire fora de Dragon/Ground)", () => {
  const alvo = chefao("Snorlax", { hab: "Thick Fat", golpes: ["Body Slam"], evs: [252, 252, 0, 0, 252, 0], nat: "Adamant" });
  const dano = (hab) => RC.danoNoDuelo(eu("Garchomp", { hab, golpes: ["Flamethrower"], evs: EV.nenhum, nat: "Hardy" }), alvo, NIVEL).melhor.dano;
  dentroDoEfeito(dano("RKS System") / dano("Pressure"), 2, "RKS System x sem habilidade", 0.1);
  assert.deepEqual(Array.from(RC.camposLidosDaHabilidade(RC.ABILITY_ID_BY_NAME["RKS System"])).sort(), ["stabMult", "stabTodos"]);
});
