// TK-29 (27/10/2026): o runner de sabotagem só conta "pega" quando uma ASSERÇÃO falha, confere os alvos antes
// de rodar e usa o carregador único. Cada teste aqui falha sem a correção correspondente.
import { test } from "node:test";
import assert from "node:assert/strict";
import { falhouPorAssercao, conferirAlvos, classificarFalha } from "../sabotagem_util.mjs";
import { aplicarTrecho, caminhoDoAlvo } from "./carregar_regras.mjs";
import { MUTACOES } from "./mutacoes.mjs";

test("falhouPorAssercao: ERR_ASSERTION conta; TypeError/SyntaxError de carga não", () => {
  assert.equal(falhouPorAssercao("✖ x\n  code: 'ERR_ASSERTION'\n"), true);
  assert.equal(falhouPorAssercao("✖ x\n  error: TypeError: nao e funcao\n  code: 'ERR_TEST_FAILURE'"), false);
  assert.equal(falhouPorAssercao("SyntaxError: Unexpected token"), false);
});

test("classificarFalha: saída verde = sobreviveu; quebra de alvo; erro sem asserção; pega", () => {
  assert.equal(classificarFalha({ status: 0, saida: "" }), "sobreviveu");
  assert.equal(classificarFalha({ status: 1, saida: "Error: trecho da sabotagem não encontrado em x" }), "quebrada");
  assert.equal(classificarFalha({ status: 1, saida: "TypeError: boom" }), "erro-sem-assercao");
  assert.equal(classificarFalha({ status: 1, saida: "code: 'ERR_ASSERTION'" }), "pega");
});

test("conferirAlvos: acusa alvo inexistente, trecho ausente e trecho repetido; aceita 1 ocorrência e @comportamento", () => {
  const ler = { "a.js": "x = 1; y = 2;", "b.js": "z; z;" };
  const resolver = (n) => (ler[n] !== undefined ? n : null);
  const ms = [
    { id: "ok", arquivo: "a.js", de: "x = 1" },
    { id: "ausente", arquivo: "a.js", de: "w = 9" },
    { id: "repetido", arquivo: "b.js", de: "z" },
    { id: "sem-alvo", arquivo: "nao-existe.js", de: "q" },
    { id: "comp", arquivo: "@comportamento", de: "f" },
  ];
  const r = conferirAlvos(ms, resolver, (c) => ler[c]);
  assert.deepEqual(r.map((e) => e.id), ["ausente", "repetido", "sem-alvo"]);
});

test("catálogo real: todo alvo (inclusive fora de src) existe e o trecho aparece exatamente 1 vez", async () => {
  const { lerComMutacao } = await import("./carregar_regras.mjs");
  const r = conferirAlvos(MUTACOES, caminhoDoAlvo, (c) => lerComMutacao(c, "-nenhum-"));
  assert.deepEqual(r, []);
});

test("aplicarTrecho: troca só com o nome certo e exige ocorrência única", () => {
  const env = { MUTACAO_ARQUIVO: "f.js", MUTACAO_DE: "a", MUTACAO_PARA: "b" };
  assert.equal(aplicarTrecho("xay", "f.js", env), "xby");
  assert.equal(aplicarTrecho("xay", "outro.js", env), "xay");
  assert.throws(() => aplicarTrecho("aa", "f.js", env), /trecho da sabotagem não encontrado/);
});

test("ordem das etapas (qa-16.13): em todo nível, branch e arquivo mexido, unitários vêm antes da sabotagem", async () => {
  const { etapasDoNivel } = await import("../../scripts/nivel_da_mudanca.mjs");
  for (const branch of ["master", "ticket/x"]) for (const nivel of [0, 1, 2, 3]) {
    const e = etapasDoNivel(nivel, { branch, arquivos: ["tests/unit/mutacoes.mjs"] }).map((x) => JSON.stringify(x));
    const iS = e.findIndex((t) => /test:sabotage|run_sabotage/.test(t));
    const iU = e.findIndex((t) => /node --test|test:unit/.test(t));
    if (iS >= 0) assert.ok(iU >= 0 && iU < iS, `${branch} nível ${nivel}: sabotagem sem unitários antes`);
  }
});
