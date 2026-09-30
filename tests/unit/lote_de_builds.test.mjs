// Lote de builds do time (2026-09-30, decisão do usuário: "sim, uma chamada pro
// time"): uma consulta pras builds de todos. O que é igual pro time vai UMA vez;
// o que é da espécie vai dentro de cada uma.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 4 });
const porNome = (n) => { const s = R.SPECIES.find((x) => x && x.n === n); assert.ok(s, n); return s; };
const TIME = ["Garchomp", "Gardevoir", "Pikachu"].map(porNome);
const conta = (texto, trecho) => texto.split(trecho).length - 1;

test("cada espécie aparece uma vez, com a chave pedida no JSON", () => {
  const p = R.montarPromptBuildsDoTime(TIME, {});
  TIME.forEach((sp) => assert.equal(conta(p, '(chave "' + sp.sname + '")'), 1, sp.n));
  assert.match(p, /para CADA um dos 3 Pokemon/);
  assert.match(p, /"builds":\{"CHAVE_DO_POKEMON"/);
});

test("regras comuns vão UMA vez; o que é da espécie vai em cada uma", () => {
  const p = R.montarPromptBuildsDoTime(TIME, {});
  assert.equal(conta(p, "Itens de batalha reais disponiveis"), 1);
  assert.equal(conta(p, "ORDEM DE DECISAO"), 1);
  assert.equal(conta(p, "Chefoes que faltam"), 1);
  assert.equal(conta(p, "Movepool real"), TIME.length);
  // Item exclusivo da espécie (Light Ball do Pikachu) continua no bloco dela.
  const pika = p.slice(p.indexOf('(chave "' + porNome("Pikachu").sname + '")'));
  assert.match(pika, /Exclusivo desta especie/);
});

test("o lote é bem menor que as builds uma a uma (mesmo conteúdo por espécie)", () => {
  const soma = TIME.reduce((t, sp) => t + R.montarPromptBuild(sp, {}).length, 0);
  const lote = R.montarPromptBuildsDoTime(TIME, {}).length;
  assert.ok(lote < soma * 0.75, lote + " x " + soma);
});

test("contra um chefão: objetivo uma vez e, em cada Pokémon, a quem ele responde", () => {
  const flannery = R.BOSSES.find((b) => b.name === "Flannery 1");
  const chefao = { boss: flannery, party: R.bossPartyPorDificuldade(flannery), clima: "sol", estrategia: null };
  const responde = {}; responde[TIME[0].sname] = ["Torkoal"];
  const p = R.montarPromptBuildsDoTime(TIME, { chefao, responde });
  assert.equal(conta(p, "OBJETIVO DESTE TIME: vencer Flannery 1"), 1);
  assert.equal(conta(p, "Luta alvo desta build: Flannery 1"), 1);
  assert.equal(conta(p, "Este Pokemon e a resposta do time para: Torkoal"), 1);
});

test("o prompt de uma build sozinha não mudou com a divisão em partes", () => {
  const p = R.montarPromptBuild(TIME[2], {});
  assert.equal(conta(p, "Itens de batalha reais disponiveis"), 1);
  assert.match(p, /Exclusivo desta especie/);
  assert.match(p, /Chefoes que faltam/);
  assert.match(p, /"papel":"Tanque\|Pivô\|Wallbreaker\|Sweeper"/);
});
