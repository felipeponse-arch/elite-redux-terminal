// Pacote 08 (11/11/2026): exportar/importar o save por arquivo. Formato, validação ANTES de aplicar,
// "não descarta em silêncio" e builds do aparelho preservadas como variantes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 0, difficulty: "ace", levelCapMode: "more" });
const xDe = (sn) => R.SPECIES_BY_SNAME[sn].x;
const build = (ability, moves, extra = {}) => ({
  ability, nature: "Adamant", item: "Charcoal", moves, ivs: [31, 31, 31, 31, 31, 31], evs: [0, 252, 0, 0, 0, 0],
  source: "manual", active: true, savedAt: "2026-01-01T00:00:00.000Z", rationale: "", ...extra,
});
const copia = (o) => JSON.parse(JSON.stringify(o));
// Mesma regra de "save igual" do sync: sem as datas e a soma, que mudam a cada gravação.
const semDatas = (s) => { const c = copia(s); delete c.savedAt; delete c.soma; delete c.autoLog; return c; };
const reassinar = (save) => { save.soma = R.somaDoSave(save); return save; };
const arquivoDe = (save, extra = {}) => JSON.stringify({ schema: 1, dataVersion: save.dataVersion, versaoApp: "abc1234", exportadoEm: "2026-11-11T10:00:00.000Z", save, ...extra });

function montarEstado() {
  R.state.team = [xDe("SPECIES_CHARIZARD"), xDe("SPECIES_BLASTOISE")];
  R.state.box = [xDe("SPECIES_VENUSAUR")];
  R.state.orphans = { team: [], box: [] };
  R.state.notes = { SPECIES_CHARIZARD: "voa alto" };
  R.state.customBuilds = { SPECIES_CHARIZARD: [build("Tough Claws", ["Flare Blitz"])] };
  R.state.savedTeams = [];
}
function zerarEstado() {
  R.state.team = []; R.state.box = []; R.state.orphans = { team: [], box: [] };
  R.state.notes = {}; R.state.customBuilds = {}; R.state.savedTeams = [];
}

test("ida e volta: exportar, limpar e importar devolve o mesmo save", () => {
  montarEstado();
  const antes = semDatas(R.buildSave());
  const arq = R.montarArquivoDeSave("abc1234");
  assert.equal(arq.schema, 1);
  assert.equal(arq.versaoApp, "abc1234");
  assert.match(arq.exportadoEm, /^\d{4}-\d\d-\d\dT/);
  assert.equal(typeof arq.save.soma, "string");
  const lido = R.lerArquivoDeSave(JSON.stringify(arq));
  assert.equal(lido.ok, true);
  zerarEstado();
  const mescla = R.mesclarBuildsDoAtual(lido.arquivo.save, R.state.customBuilds);
  R.applySave(mescla.save);
  assert.deepEqual(semDatas(R.buildSave()), antes);
  assert.equal(R.state.team.length, 2);
  assert.equal(mescla.preservadas, 0);
});

test("recusa: não é JSON, schema errado, sem save, soma errada, sem soma", () => {
  montarEstado();
  const bom = copia(R.buildSave());
  const falha = (texto, re) => { const r = R.lerArquivoDeSave(texto); assert.equal(r.ok, false); assert.match(r.erro, re); };
  falha("{ cortado", /JSON/);
  falha("[]", /não é um save/);
  falha(JSON.stringify({ schema: 2, save: bom }), /Formato de arquivo 2/);
  falha(JSON.stringify({ schema: 1 }), /não traz o save/);
  falha(arquivoDe({ ...bom, team: ["SPECIES_BLASTOISE"] }), /soma/);
  const sem = copia(bom); delete sem.soma;
  falha(arquivoDe(sem), /soma/);
});

test("dataVersion diferente: aplica o que cabe, guarda o desconhecido e avisa", () => {
  montarEstado();
  const save = copia(R.buildSave());
  save.dataVersion = "0.0.antigo";
  save.team = save.team.concat(["SPECIES_FUTURO_INEXISTENTE"]);
  reassinar(save);
  const lido = R.lerArquivoDeSave(arquivoDe(save));
  assert.equal(lido.ok, true);
  zerarEstado();
  const mescla = R.mesclarBuildsDoAtual(lido.arquivo.save, R.state.customBuilds);
  R.applySave(mescla.save);
  const linhas = R.resumoDaImportacao(lido.arquivo, mescla);
  assert.ok(linhas.some((l) => /Dados do arquivo: 0\.0\.antigo/.test(l)), "avisa a versão de dados diferente");
  assert.ok(linhas.some((l) => /SPECIES_FUTURO_INEXISTENTE/.test(l)), "nomeia o Pokémon desconhecido");
  assert.ok(R.buildSave().team.includes("SPECIES_FUTURO_INEXISTENTE"), "o desconhecido continua no save (volta quando o app o conhecer)");
  assert.equal(R.state.team.length, 2);
});

test("campo desconhecido e formato mais novo não quebram; entram no aviso", () => {
  montarEstado();
  const save = copia(R.buildSave());
  save.campoDoFuturo = { a: 1 };
  save.v = 99;
  reassinar(save);
  const lido = R.lerArquivoDeSave(arquivoDe(save, { outroCampoDoEnvelope: true }));
  assert.equal(lido.ok, true);
  const mescla = R.mesclarBuildsDoAtual(lido.arquivo.save, R.state.customBuilds);
  assert.doesNotThrow(() => R.applySave(mescla.save));
  assert.ok(R.resumoDaImportacao(lido.arquivo, mescla).some((l) => /campoDoFuturo/.test(l)));
});

test("não descarta em silêncio: builds além do limite e inválidas entram no aviso com número", () => {
  montarEstado();
  const save = copia(R.buildSave());
  save.customBuilds = { SPECIES_CHARIZARD: [1, 2, 3, 4].map((n) => build("Tough Claws", ["Flare Blitz", "Move" + n], { active: n === 1 })) };
  reassinar(save);
  const lido = R.lerArquivoDeSave(arquivoDe(save));
  zerarEstado();
  const mescla = R.mesclarBuildsDoAtual(lido.arquivo.save, R.state.customBuilds);
  R.applySave(mescla.save);
  assert.equal(R.state.customBuilds.SPECIES_CHARIZARD.length, 3);
  assert.ok(R.resumoDaImportacao(lido.arquivo, mescla).some((l) => /Ignoradas: 1 builds/.test(l)));
});

test("builds do aparelho que o arquivo não tem viram variantes; o que não cabe é contado", () => {
  montarEstado();
  const doArquivo = copia(R.buildSave());
  doArquivo.customBuilds = { SPECIES_CHARIZARD: [build("Molten Down", ["Fire Blast"])] };
  reassinar(doArquivo);
  const atuais = { SPECIES_CHARIZARD: [build("Tough Claws", ["Flare Blitz"])], SPECIES_BLASTOISE: [build("Stamina", ["Surf"])] };
  const m = R.mesclarBuildsDoAtual(doArquivo, atuais);
  assert.equal(m.preservadas, 2);
  assert.equal(m.naoCouberam, 0);
  const lista = m.save.customBuilds.SPECIES_CHARIZARD;
  assert.equal(lista.length, 2);
  assert.equal(lista[0].active, true, "a build ativa do arquivo continua a ativa");
  assert.equal(lista[1].active, false);
  assert.equal(m.save.customBuilds.SPECIES_BLASTOISE.length, 1);
  // Já tem igual: não duplica.
  assert.equal(R.mesclarBuildsDoAtual(doArquivo, doArquivo.customBuilds).preservadas, 0);
  // Cheio (3): a quarta não cabe e é contada, nunca some sem contar.
  const cheio = copia(doArquivo);
  cheio.customBuilds.SPECIES_CHARIZARD = [1, 2, 3].map((n) => build("Molten Down", ["Fire Blast", "M" + n], { active: n === 1 }));
  const m2 = R.mesclarBuildsDoAtual(cheio, atuais);
  assert.equal(m2.naoCouberam, 1);
  assert.equal(m2.save.customBuilds.SPECIES_CHARIZARD.length, 3);
});
