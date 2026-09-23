// Trava de Mega Evolução nas SUGESTÕES (achado do usuário, print de 2026-09-24:
// com a insígnia em "Knuckle Badge (2o ginásio)" a caixa tinha "Altaria Mega" e a
// sugestão de time a tratava como opção real). Antes da 4ª insígnia (Flannery)
// só a forma base existe pro jogador; depois, a família inteira.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();

function especie(sname) {
  const sp = R.getSpeciesBySname(sname);
  assert.ok(sp, "espécie " + sname + " existe no dado");
  return sp;
}
function comMilestone(m, fn) {
  const antes = R.state.settings.milestone;
  R.state.settings.milestone = m;
  try { return fn(); } finally { R.state.settings.milestone = antes; }
}

test("família utilizável: antes da 4ª insígnia só a base, depois a família toda", () => {
  const mega = especie("SPECIES_ALTARIA_MEGA");
  assert.equal(R.isMegaForm(mega), true, "pré-condição: Altaria Mega é forma mega no dado");
  comMilestone(2, () => {
    assert.equal(R.battleFamilyOf(mega).map((s) => s.sname).join(","), "SPECIES_ALTARIA", "vindo da Mega, a família utilizável é só a base");
    assert.equal(R.battleFamilyOf(especie("SPECIES_ALTARIA")).map((s) => s.sname).join(","), "SPECIES_ALTARIA");
  });
  comMilestone(4, () => {
    const nomes = R.battleFamilyOf(especie("SPECIES_ALTARIA")).map((s) => s.sname);
    assert.ok(nomes.includes("SPECIES_ALTARIA") && nomes.includes("SPECIES_ALTARIA_MEGA"));
  });
});

test("criatura utilizável: forma Mega que já está no time/caixa conta como a base antes da 4ª insígnia", () => {
  const mega = especie("SPECIES_ALTARIA_MEGA");
  comMilestone(0, () => {
    assert.equal(R.usableSpeciesFor(mega).sname, "SPECIES_ALTARIA");
    assert.equal(R.usableSpeciesFor(especie("SPECIES_ALTARIA")).sname, "SPECIES_ALTARIA");
    assert.equal(R.usableSpeciesFor(especie("SPECIES_HEATRAN")).sname, "SPECIES_HEATRAN", "espécie que não é mega não muda");
  });
  comMilestone(4, () => {
    assert.equal(R.usableSpeciesFor(mega).sname, "SPECIES_ALTARIA_MEGA", "liberada: a Mega vale como ela mesma");
  });
});

test("prompt: antes da 4ª insígnia avisa que Mega ainda não existe, e não lista formas mega da espécie", () => {
  comMilestone(2, () => {
    const bloco = R.megaPromptBlock(especie("SPECIES_ALTARIA"));
    assert.match(bloco, /AINDA NAO DISPONIVEL/);
    assert.match(bloco, /4a insignia/);
    assert.equal(R.formFamilyPromptNote(especie("SPECIES_ALTARIA")), "", "sem 'outras formas' com a Mega antes de liberar");
  });
  comMilestone(4, () => {
    assert.match(R.megaPromptBlock(especie("SPECIES_ALTARIA")), /MODO DE MEGA EVOLUCAO/);
    assert.match(R.formFamilyPromptNote(especie("SPECIES_ALTARIA")), /Altaria Mega/);
  });
});

test("prompt: espécie sem linha de mega nunca ganha bloco de Mega", () => {
  const semMega = R.SPECIES.find((s) => !R.megaFormsOf(s).length && !R.isMegaForm(s));
  assert.ok(semMega, "pré-condição: existe espécie sem linha de mega");
  comMilestone(2, () => assert.equal(R.megaPromptBlock(semMega), ""));
  comMilestone(4, () => assert.equal(R.megaPromptBlock(semMega), ""));
});

test("prompt: a própria forma Mega continua tendo o bloco normal (é uma build pra ela, não uma sugestão de mega)", () => {
  comMilestone(2, () => assert.match(R.megaPromptBlock(especie("SPECIES_ALTARIA_MEGA")), /MODO DE MEGA EVOLUCAO/));
});
