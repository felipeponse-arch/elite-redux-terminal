// Ticket 07 (07/10/2026): onde achar cada item na run, lido do código oficial do jogo (item no chão, escondido,
// presente, Pokémon de presente segurando o item, lojas por insígnia, troca por BP). O aviso de build "item que
// só sai depois" passa a valer para qualquer item com etapa conhecida, não só pedra Mega.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { carregarRegras } from "./carregar_regras.mjs";

const ONDE = JSON.parse(readFileSync(new URL("../../data/onde_achar_itens.json", import.meta.url), "utf8"));
const tardio = (R, item) => [...R.avisosDaBuild(R.getSpeciesBySname("SPECIES_CHARIZARD"), { moves: ["Scratch"], item })].find((a) => a.tipo === "item-tardio");

test("dado: Leftovers sai em Lavaridge (Milotic de presente, 3ª insígnia); Eviolite em Dewford", () => {
  assert.deepEqual(ONDE.Leftovers[0], { etapa: 3, local: "Lavaridge Town Pokemon Center 1F", como: "segurado por um Pokémon de presente" });
  assert.equal(ONDE.Eviolite[0].local, "Dewford Town");
  assert.ok(Object.keys(ONDE).length > 400, "o gerador leu as fontes do jogo");
});

test("item que só sai depois da etapa atual vira aviso; na etapa certa some", () => {
  const R = carregarRegras({ milestone: 1 });
  const av = tardio(R, "Leftovers");
  assert.ok(av && /3ª insígnia/.test(av.texto) && /Lavaridge/.test(av.texto), av && av.texto);
  R.state.settings.milestone = 3;
  assert.equal(tardio(R, "Leftovers"), undefined);
});

test("item sem lugar com etapa na run (Choice Band só na troca por BP) não gera aviso, mas mostra onde achar", () => {
  const R = carregarRegras({ milestone: 0 });
  assert.equal(tardio(R, "Choice Band"), undefined);
  assert.match(R.ondeAcharItemTexto("Choice Band"), /Battle Frontier.*fora da run/);
  assert.match(R.ondeAcharItemTexto("Leftovers"), /a partir da 3ª insígnia/);
});
