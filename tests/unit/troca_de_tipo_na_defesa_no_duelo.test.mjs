// TK-34: a troca de tipo (Protean, Libero, RKS System, Pattern Change, Prismatic Fur, Color Change) vale para a DEFESA.
// Fonte: er-repo f34fc2b, abilities.cc:2300-2312 (Protean), 3111-3127 (RKS), 649-672 (Color Change); battle.h:759-764 (mono-tipo);
// battle_script_commands.c:1095-1135 (onBeforeAttack roda no attackcanceler, ANTES do dano); battle_main.c:3003 (volta ao tipo base ao cair).
import { test } from "node:test";
import assert from "node:assert/strict";
import { eu, chefao, NIVEL, EV, R } from "./cenarios_do_duelo.mjs";

const monoFire = (u) => Object.assign({}, u, { tipos: ["Fire"] });
// dano que o chefão (Electric) faz em quem usa a habilidade, depois do ajuste de troca de tipo que o duelo aplica
const eletrico = () => chefao("Raichu", { hab: "Static", golpes: ["Thunderbolt"], evs: EV.nenhum, nat: "Hardy" });
function danoSobre(hab, golpe) {
  const meu = monoFire(eu("Arcanine", { hab, golpes: [golpe], evs: EV.nenhum, nat: "Hardy" }));
  const foe = eletrico();
  const antes = R.danoNoDuelo(foe, meu, NIVEL);
  const ganho = R.danoNoDuelo(meu, foe, NIVEL);
  const depois = R.comTipoDoGolpe(meu, foe, ganho, antes, NIVEL);
  return { antes: antes.melhor.dano, depois: depois.melhor.dano };
}

test("TK-34: Protean Fire que usa Water (fixture inventada) fica fraco a Electric depois (mono-Water)", () => {
  const sem = danoSobre("Pressure", "Surf"), com = danoSobre("Protean", "Surf");
  assert.equal(sem.depois, sem.antes, "sem a habilidade nada muda");
  assert.ok(com.depois > com.antes * 1.2, "Electric passa de x1 (Fire) para x2 (Water): " + com.antes + " -> " + com.depois);
});

test("TK-34: Protean Fire que usa Fire não muda de tipo (golpe do mesmo tipo)", () => {
  const com = danoSobre("Protean", "Flamethrower");
  assert.equal(com.depois, com.antes);
});

test("TK-34: Libero, RKS System e Pattern Change trocam; Mystic Power, Arcane Force e Unown Power só dão STAB; Prismatic Fur tem Color Change, que já fica no melhor tipo", () => {
  for (const h of ["Libero", "RKS System", "Pattern Change"]) {
    const d = danoSobre(h, "Surf"); assert.ok(d.depois > d.antes * 1.2, h);
  }
  const pf = danoSobre("Prismatic Fur", "Surf"); assert.ok(pf.depois <= pf.antes, "Prismatic Fur: Color Change domina o Protean");
  for (const h of ["Mystic Power", "Arcane Force", "Unown Power"]) {
    const d = danoSobre(h, "Surf"); assert.equal(d.depois, d.antes, h);
  }
});

test("TK-34: Color Change (fixture Fire inventada) vira o tipo que mais resiste: Normal não a acerta (Ghost é imune); antes era teto 0,5", () => {
  const mk = (hab) => monoFire(eu("Arcanine", { hab, golpes: ["Body Slam"], evs: EV.nenhum, nat: "Hardy" }));
  const normal = chefao("Snorlax", { hab: "Thick Fat", golpes: ["Body Slam"], evs: EV.nenhum, nat: "Hardy" });
  assert.ok(R.danoNoDuelo(normal, mk("Pressure"), NIVEL).melhor.dano > 0);
  assert.equal(R.danoNoDuelo(normal, mk("Color Change"), NIVEL).melhor.dano, 0);
});

// Depende de dado: espécie real (Cinderace é Fire e já nasce com Libero; Surf o deixa mono-Water)
test("TK-34: caso real - Cinderace (Libero) com Surf apanha mais de Electric do que o dano de Fire puro", () => {
  const foe = eletrico(), m = eu("Cinderace", { hab: "Libero", golpes: ["Surf"], evs: EV.nenhum, nat: "Hardy" });
  const a = R.danoNoDuelo(foe, m, NIVEL);
  assert.ok(R.comTipoDoGolpe(m, foe, R.danoNoDuelo(m, foe, NIVEL), a, NIVEL).melhor.dano > a.melhor.dano * 1.2);
});
