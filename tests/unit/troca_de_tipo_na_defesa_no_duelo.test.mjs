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

// Caminho alcançável: o rival com Damp já pintou o Protean mono-Fire de Water (comTipoMudado) e o golpe é Fire (Flare Blitz, contato).
// O atalho do mesmo tipo tem que devolver o dano já ajustado, sem refazer a conta com o tipo Fire de antes.
test("TK-34: Protean mono-Fire que usa Fire mantém o dano já ajustado pelo Damp do rival (atalho do mesmo tipo)", () => {
  const meu = monoFire(eu("Arcanine", { hab: "Protean", golpes: ["Flare Blitz"], evs: EV.nenhum, nat: "Hardy" }));
  const foe = chefao("Raichu", { hab: "Damp", golpes: ["Thunderbolt"], evs: EV.nenhum, nat: "Hardy" });
  const dele = R.danoNoDuelo(foe, meu, NIVEL), ganho = R.danoNoDuelo(meu, foe, NIVEL);
  const ajustado = R.comTipoMudado(foe, meu, dele, ganho, NIVEL);
  assert.ok(ajustado.melhor.dano > dele.melhor.dano, "Damp piora o dano sobre o Fire: Electric x1 -> x2 no Water");
  assert.equal(R.comTipoDoGolpe(meu, foe, ganho, ajustado, NIVEL).melhor.dano, ajustado.melhor.dano);
});


// Empate no menor valor: Fire/Grass leva x0,5 de Fire pelo Fire e há outros tipos que também dão x0,5 (Water, Rock, Dragon).
// Strict <: fica com o tipo atual e mantém a efetividade do par (x1); trocar no empate a derrubaria para x0,5 sem ganho real.
test("TK-34: Color Change empatado com o tipo atual não troca (Fire/Grass x Fire fica x1, não x0,5)", () => {
  const def = Object.assign({}, eu("Arcanine", { hab: "Color Change", golpes: ["Flamethrower"], evs: EV.nenhum, nat: "Hardy" }), { tipos: ["Fire", "Grass"] });
  const atq = chefao("Arcanine", { hab: "Intimidate", golpes: ["Flamethrower"], evs: EV.nenhum, nat: "Hardy" });
  assert.equal(R.efetividadeComColorChange(atq, "Fire", def, 1), 1);
});
