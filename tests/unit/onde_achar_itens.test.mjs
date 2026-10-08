// Ticket 07 (07/10/2026): onde achar cada item na run, lido do código oficial do jogo (item no chão, escondido,
// presente, Pokémon de presente segurando o item, lojas por insígnia, troca por BP). O aviso de build "item que
// só sai depois" passa a valer para qualquer item com etapa conhecida, não só pedra Mega.
// Ticket 08 (07/10): o pacote inicial do vídeo do usuário (data/pacote_inicial.json) vem antes de tudo - Leftovers,
// Eviolite e Choice Band estão nele, então saem desde o começo (o código público é de outra versão).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { carregarRegras } from "./carregar_regras.mjs";

const ONDE = JSON.parse(readFileSync(new URL("../../data/onde_achar_itens.json", import.meta.url), "utf8"));
const PACOTE = JSON.parse(readFileSync(new URL("../../data/pacote_inicial.json", import.meta.url), "utf8"));
const tardio = (R, item) => [...R.avisosDaBuild(R.getSpeciesBySname("SPECIES_CHARIZARD"), { moves: ["Scratch"], item })].find((a) => a.tipo === "item-tardio");

test("dado: item do pacote inicial sai desde o começo (Leftovers, Eviolite, Choice Band); o resto vem do código do jogo", () => {
  for (const n of ["Leftovers", "Eviolite", "Choice Band", "Sitrus Berry"]) assert.deepEqual(ONDE[n][0].etapa, 0, n);
  assert.equal(ONDE.Leftovers[0].local, "Pacote inicial");
  assert.deepEqual(ONDE["Focus Band"][0], { etapa: 6, local: "Shoal Cave Low Tide Lower Room", como: "presente" });
  assert.ok(Object.keys(ONDE).length > 400, "o gerador leu as fontes do jogo");
});

test("todo item do pacote está no Onde achar; pedra Mega libera no Norman (4) ou na trava que já tinha (Galladite 7)", () => {
  const T = carregarRegras().MEGA_PEDRAS_TARDIAS;
  for (const [grupo, nomes] of Object.entries(PACOTE)) {
    if (!Array.isArray(nomes)) continue;
    for (const n of nomes) {
      const p = (ONDE[n] || []).find((x) => x.local === "Pacote inicial");
      assert.ok(p, n + " sem a linha do pacote");
      assert.equal(p.etapa, grupo === "pedrasMega" ? Math.max(4, T[n] || 0) : 0, n);
    }
  }
  assert.equal(PACOTE.pedrasMega.length, 75);
  assert.equal(ONDE.Galladite.find((x) => x.local === "Pacote inicial").etapa, 7, "trava da 7ª continua");
});

test("o pacote não corta fonte antiga: Honey e Ultra Ball mantêm o Poké Mart da 6ª", () => {
  for (const n of ["Honey", "Ultra Ball"]) assert.ok(ONDE[n].some((x) => /Poké Mart/.test(x.local) && x.etapa === 6), n);
});

test("pedras do Adoption Center (er-config oficial): compra por BP, no Norman ou na trava que já têm", () => {
  const ad = JSON.parse(readFileSync(new URL("../../data/pedras_adoption_center.json", import.meta.url), "utf8")).pedras;
  assert.equal(ad.length, 139);
  const linha = (n) => ONDE[n].find((x) => x.local === "Adoption Center");
  assert.equal(linha("Garchompite Z").etapa, 4);
  assert.equal(linha("Dragoninite Y").etapa, 7, "trava da 7ª continua");
});

test("item que só sai depois da etapa atual vira aviso; na etapa certa some", () => {
  const R = carregarRegras({ milestone: 1 });
  const av = tardio(R, "Focus Band");
  assert.ok(av && /6ª insígnia/.test(av.texto) && /Shoal Cave/.test(av.texto), av && av.texto);
  R.state.settings.milestone = 6;
  assert.equal(tardio(R, "Focus Band"), undefined);
  R.state.settings.milestone = 0;
  assert.equal(tardio(R, "Leftovers"), undefined, "item do pacote nunca é tardio");
});

test("item sem lugar com etapa na run (Lansat Berry) não gera aviso, mas mostra onde achar", () => {
  const R = carregarRegras({ milestone: 0 });
  assert.equal(tardio(R, "Lansat Berry"), undefined);
  assert.match(R.ondeAcharItemTexto("Lansat Berry"), /fora da run/);
  assert.match(R.ondeAcharItemTexto("Leftovers"), /Pacote inicial/);
});
