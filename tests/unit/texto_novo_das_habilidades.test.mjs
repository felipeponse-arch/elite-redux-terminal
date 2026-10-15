// Ticket versao-nova/04 (15/10/2026): o texto das habilidades mudou de redação na 2.65.4 da NextDex (07/10) e o parser do motor lê TEXTO. Medido:
// com o texto novo, 59 habilidades em uso perdem o efeito inteiro (Guts, Marvel Scale, Rough Skin, Fluffy, Stamina...) e outras leem outro efeito
// só pela redação. O código do jogo (`git diff 7d85acd..486026e` em abilities.cc, battle_util.c) não mudou o efeito delas; o dado estruturado
// da er-config não serve de fonte (`expanded_description` casa com o parser em 94 de 848 habilidades). Solução: tabela `TEXTO_LIDO_DA_VERSAO_NOVA_DUELO`
// ([nome, novo, lido]): quando o texto do dado é exatamente o `novo`, o parser lê o `lido` (a redação que ele conhece). O que o código MUDOU de fato
// (Friend Guard 50% -> 25%, Madness Enhancement, Feathercoat) segue o texto novo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 8, difficulty: "ace", levelCapMode: "more" });
const semClimas = (k, v) => (k === "climasProprios" ? undefined : v);
const tabela = R.TEXTO_LIDO_DA_VERSAO_NOVA_DUELO; // [nome, texto novo da NextDex 2.65.4, texto que o parser lê]
let n = 0;
const limpar = () => { for (const c of [R.descricaoPorIdCache, R.descricaoDeHabilidadeCache]) for (const k of Object.keys(c)) delete c[k]; };
// Troca o texto do dado de UMA habilidade (simula a entrada do dado novo), limpa os caches de texto e devolve o efeito lido.
function efeitoComTexto(nome, texto, textoAtual) {
  const id = R.ABILITIES.findIndex((a) => a && a[0] === nome && a[1] === textoAtual);
  assert.notEqual(id, -1, nome);
  const guardado = R.ABILITIES[id][1];
  R.ABILITIES[id][1] = texto;
  limpar();
  try { return JSON.stringify(R.efeitoDasHabilidadesNoDuelo([id], "V04_" + nome + "_" + (n++), null), semClimas); }
  finally { R.ABILITIES[id][1] = guardado; limpar(); }
}
const base = JSON.stringify(R.efeitoDasHabilidadesNoDuelo([], "V04_BASE", null), semClimas);

test("a tabela cobre as 74 habilidades cujo texto novo (NextDex 2.65.4) perdia ou trocava o efeito, cada texto novo uma vez", () => {
  assert.equal(tabela.length, 74);
  assert.equal(new Set(tabela.map((t) => t[1])).size, 74);
  for (const [nome, novo, lido] of tabela) { assert.notEqual(R.ABILITY_ID_BY_NAME[nome], undefined, nome); assert.notEqual(novo, lido, nome); }
});

test("com o texto da 2.65beta, o efeito é o de sempre (a tabela só age quando o texto é o novo)", () => {
  for (const [nome, , lido] of tabela) assert.ok(R.ABILITIES.some((a) => a && a[0] === nome && a[1] === lido), nome + ": o dado do app ainda é o de 28/03");
});

test("com o texto novo, cada uma das 74 mantém o efeito da 2.65beta (nenhuma perde efeito)", () => {
  for (const [nome, novo, lido] of tabela) {
    const antes = efeitoComTexto(nome, lido, lido);
    const depois = efeitoComTexto(nome, novo, lido);
    assert.notEqual(antes, base, nome + ": a habilidade tem efeito lido na 2.65beta");
    assert.equal(depois, antes, nome + ": o texto novo \"" + novo + "\" mudou o efeito");
  }
});

test("controle: sem a tabela, o texto novo derruba o efeito de 55 ou mais delas (é o que o ticket conserta)", () => {
  const guardada = tabela.slice(), indice = Object.assign({}, R.LIDO_PELO_TEXTO_NOVO_DUELO);
  for (const k of Object.keys(R.LIDO_PELO_TEXTO_NOVO_DUELO)) delete R.LIDO_PELO_TEXTO_NOVO_DUELO[k];
  try {
    let perdem = 0;
    for (const [nome, novo, lido] of guardada) if (efeitoComTexto(nome, novo, lido) === base) perdem++;
    assert.ok(perdem >= 55, "perdem sem a tabela: " + perdem);
  } finally { Object.assign(R.LIDO_PELO_TEXTO_NOVO_DUELO, indice); }
});

test("composta: a parte entra com o texto que o parser lê (Rough Skin dentro de uma composta não perde o efeito com o texto novo)", () => {
  const rough = tabela.find((t) => t[0] === "Rough Skin");
  assert.ok(rough);
  const idRough = R.ABILITIES.findIndex((a) => a && a[0] === "Rough Skin");
  const idComp = R.ABILITIES.findIndex((a) => a && /^Rough Skin \+ /.test(a[1] || ""));
  if (idComp === -1) return; // sem composta com Rough Skin no dado atual
  const efComp = () => JSON.stringify(R.efeitoDasHabilidadesNoDuelo([idComp], "V04_COMP_" + (n++), null), semClimas);
  limpar(); const antes = efComp();
  R.ABILITIES[idRough][1] = rough[1]; limpar();
  try { assert.equal(efComp(), antes); } finally { R.ABILITIES[idRough][1] = rough[2]; limpar(); }
});

test("o que o código MUDOU de verdade segue o texto novo: Friend Guard reduz 25% (battle_util.c:7664, era 50%)", () => {
  const velho = JSON.parse(efeitoComTexto("Friend Guard", "Reduces damage that ally takes by 50% in double battles.", "Reduces damage that ally takes by 50% in double battles."));
  const novo = JSON.parse(efeitoComTexto("Friend Guard", "Reduces damage that ally takes by 25% in double battles.", "Reduces damage that ally takes by 50% in double battles."));
  assert.equal(velho.aliadoReducao, 0.5, "multiplicador do dano que o aliado leva: 50% a menos");
  assert.equal(novo.aliadoReducao, 0.75, "25% a menos");
});
