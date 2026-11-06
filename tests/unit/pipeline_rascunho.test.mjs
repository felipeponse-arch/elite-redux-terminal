// Rascunho coerente do pipeline de build (ticket docs/tickets/pipeline-build-2026-10-14/05-rascunho-coerente.md, revisão de metagame de 15/10/2026):
// item (Eviolite em quem ainda evolui), EVs de espécie lenta, natureza pelo split dos golpes, sem Hidden Power e Rock Head com golpe de recuo.
// Só pela interface pública (candidatosDeBuild), com espécies reais do dado (as da revisão são da versão 2.65.4 e vivem no branch dados-2654;
// aqui valem as do dado atual com o mesmo padrão: Bulbasaur/Geodude ainda evoluem e são lentos, Butterfree tem Atk 55 x SpA 110...).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const novo = () => carregarRegras({ milestone: 6, difficulty: "ace", levelCapMode: "more" });
const R = novo();
const sp = (sname, regras = R) => regras.SPECIES.find((s) => s && s.sname === sname);
const cands = (sname, regras = R) => regras.candidatosDeBuild(sp(sname, regras), {}).candidatos;
const FISICAS = ["Adamant", "Jolly", "Brave", "Impish"];

// ---------- 1. item: quem ainda evolui leva Eviolite ----------
test("Bulbasaur (ainda evolui): todo candidato leva Eviolite no rascunho, com o aviso", () => {
  const lista = cands("SPECIES_BULBASAUR");
  assert.ok(lista.length >= 3);
  lista.forEach((c) => {
    assert.equal(c.build.item, "Eviolite", c.golpes.join("/"));
    assert.match(c.avisos.join(" | "), /ainda evolui: o rascunho leva Eviolite/);
  });
});

test("Venusaur (só evolui para Mega): não leva Eviolite", () => {
  cands("SPECIES_VENUSAUR").forEach((c) => assert.notEqual(c.build.item, "Eviolite"));
});

test("Eviolite que o jogo só dá depois da Etapa atual não entra no rascunho", () => {
  const cedo = novo();
  cedo.ONDE_ACHAR_ITENS.Eviolite = [{ etapa: 7, local: "teste", como: "teste" }];
  const lista = cands("SPECIES_BULBASAUR", cedo);
  assert.ok(lista.length >= 3);
  lista.forEach((c) => assert.notEqual(c.build.item, "Eviolite"));
});

// ---------- 2. EVs de espécie lenta ----------
test("Geodude (Speed base 20): EVs em HP, ataque e defesa, sem Velocidade, natureza que sobe o ataque", () => {
  const lista = cands("SPECIES_GEODUDE");
  assert.ok(lista.length >= 3);
  lista.forEach((c) => {
    assert.equal(c.build.evs[5], 0, c.golpes.join("/"));
    assert.ok(c.build.evs[0] >= 200, "HP " + c.build.evs[0]);
    assert.ok(c.build.evs[1] >= 200, "Atk " + c.build.evs[1]);
    assert.ok(["Adamant", "Modest"].includes(c.build.nature), c.build.nature);
    assert.match(c.motivos.join(" | "), /Velocidade base 20 \(lenta\)/);
  });
});

test("lenta que bate primeiro POR VELOCIDADE (Bulbasaur, Speed 45) mantém a Velocidade; rápida (Alakazam, 120) também", () => {
  const porVel = cands("SPECIES_BULBASAUR").filter((c) => c.baterPrimeiro && c.porQue === "velocidade");
  assert.ok(porVel.length > 0, "premissa: Bulbasaur bate primeiro por velocidade contra o líder da Etapa");
  porVel.forEach((c) => assert.ok(c.build.evs[5] >= 200, "Spe " + c.build.evs[5]));
  cands("SPECIES_ALAKAZAM").forEach((c) => assert.ok(c.build.evs[5] >= 200, "Alakazam Spe " + c.build.evs[5]));
});

// ---------- 3. natureza e EVs seguem o split dos golpes ----------
// Maioria dos golpes de dano (Body Press e Foul Play usam outro atributo e ficam fora); empate = o atributo base maior.
function splitEsperado(regras, especie, golpes) {
  const cats = golpes.filter((m) => !["Body Press", "Foul Play"].includes(m)).map((m) => regras.DATA.splits[regras.MOVE_BY_NAME[m][2]]).filter((c) => c === "PHYSICAL" || c === "SPECIAL");
  const f = cats.filter((c) => c === "PHYSICAL").length, e = cats.filter((c) => c === "SPECIAL").length;
  return f > e ? "F" : e > f ? "E" : (especie.b[1] >= especie.b[3] ? "F" : "E");
}
test("natureza física só com maioria física, especial só com maioria especial (empate: o atributo maior); EVs no mesmo atributo", () => {
  ["SPECIES_CHARMANDER", "SPECIES_WARTORTLE", "SPECIES_BUTTERFREE", "SPECIES_ABRA", "SPECIES_BULBASAUR", "SPECIES_GRAVELER", "SPECIES_ALAKAZAM"].forEach((s) => {
    const lista = cands(s);
    assert.ok(lista.length > 0, s);
    lista.forEach((c) => {
      const fisica = FISICAS.includes(c.build.nature) || c.build.evs[1] > c.build.evs[3];
      const esperado = splitEsperado(R, sp(s), c.golpes);
      assert.equal(fisica ? "F" : "E", esperado, s + " " + c.build.nature + " " + c.golpes.join("/"));
      assert.ok(fisica ? c.build.evs[1] >= 200 : c.build.evs[3] >= 200, s + " EVs " + c.build.evs.join("/"));
    });
  });
});

// 04/11/2026 (TK-35f): nos dados 2.65.5 o Butterfree ganhou Emanate (Normal vira Psychic x1,3) e o Return físico passou a bater 25 pontos acima do
// especial (a penalidade é 15): abre físico. O caso do atributo fraco fica no Alakazam (Atk 50 x SpA 135), com físico mais forte (152,6 x 138,6) e abertura especial.
test("atributo fraco: Alakazam (Atk 50 x SpA 135) abre com o set especial, mesmo havendo set físico que bate mais forte", () => {
  const lista = cands("SPECIES_ALAKAZAM");
  const fisico = lista.find((c) => FISICAS.includes(c.build.nature));
  assert.ok(fisico, "premissa: o set físico existe (o motor o mede mais forte)");
  assert.ok(fisico.dano.max > lista[0].dano.max, "premissa: o físico bate mais forte");
  assert.ok(!FISICAS.includes(lista[0].build.nature), lista[0].build.nature);
});

// ---------- 4. Hidden Power ----------
test("nenhum candidato leva Hidden Power (sem tipo definido o motor lê Normal 80 sem STAB)", () => {
  ["SPECIES_BULBASAUR", "SPECIES_WARTORTLE", "SPECIES_VENUSAUR", "SPECIES_GEODUDE", "SPECIES_BUTTERFREE"].forEach((s) => {
    cands(s).forEach((c) => assert.ok(!c.golpes.includes("Hidden Power"), s + " " + c.golpes.join("/")));
  });
});

// ---------- 5. recuo com Rock Head ----------
test("Geodude, Graveler e Onix (Rock Head entre as habilidades): set com Head Smash usa Rock Head e diz isso", () => {
  let achou = 0;
  ["SPECIES_GEODUDE", "SPECIES_GRAVELER", "SPECIES_ONIX"].forEach((s) => {
    cands(s).filter((c) => c.golpes.includes("Head Smash")).forEach((c) => {
      achou++;
      assert.equal(c.habilidade, "Rock Head", s + " " + c.golpes.join("/"));
      assert.match(c.motivos.join(" | "), /Rock Head \(habilidade escolhida\): anula o recuo de .*Head Smash/);
    });
  });
  assert.ok(achou >= 3, "premissa: o pipeline propõe Head Smash nessas espécies (" + achou + ")");
});

// ---------- 6. Dream Eater ----------
// O jogo só deixa o Dream Eater agir em alvo dormindo (ou com Comatose): ferramentas/er-repo/data/battle_scripts_1.s
// BattleScript_EffectDreamEater (jumpifstatus SLEEP / jumpifabilityflag COMATOSE, senão BattleScript_DreamEaterNoEffect).
// O motor lê só poder 120 + dreno e mediria dano num alvo acordado: o pipeline não propõe o golpe (Butterfree abria o set especial por ele).
test("nenhum candidato leva Dream Eater (só funciona em alvo dormindo e o motor o mede como golpe comum)", () => {
  ["SPECIES_BUTTERFREE", "SPECIES_GENGAR", "SPECIES_HYPNO"].forEach((s) => {
    cands(s).forEach((c) => assert.ok(!c.golpes.includes("Dream Eater"), s + " " + c.golpes.join("/")));
  });
});

test("mesclarContextos: junta ctx do mundo e contexto da validação; chave repetida é erro, não sobrescrita", () => {
  const m = R.mesclarContextos({ cap: 30, team: [] }, { buffs: ["x"], golpesChave: ["y"] });
  assert.deepEqual(Object.keys(m).sort(), ["buffs", "cap", "golpesChave", "team"]);
  assert.throws(() => R.mesclarContextos({ cap: 30 }, { cap: 99 }), /contexto repetido: cap/);
  assert.deepEqual(Object.keys(R.mesclarContextos({ cap: 30 }, {})), ["cap"]);
});
