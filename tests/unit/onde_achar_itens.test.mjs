// Ticket 07 (07/10/2026): onde achar cada item na run, lido do código oficial do jogo (item no chão, escondido,
// presente, Pokémon de presente segurando o item, lojas por insígnia, troca por BP). O aviso de build "item que
// só sai depois" passa a valer para qualquer item com etapa conhecida, não só pedra Mega.
// Ticket 08 (07/10): o pacote inicial do vídeo do usuário (data/pacote_inicial.json) vem antes de tudo - Leftovers,
// Eviolite e Choice Band estão nele, então saem desde o começo (o código público é de outra versão).
import { N_PEDRAS_ADOPTION } from "./contagens_versao.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { carregarRegras, lerComMutacao } from "./carregar_regras.mjs";
import { lerPedrasDoAdoptionCenter } from "../../scripts/extracao/pedras_adoption_center.mjs";
import { existsSync } from "node:fs";

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
  const ad = JSON.parse(lerComMutacao("data/pedras_adoption_center.json", "pedras_adoption_center.json")).pedras;
  assert.equal(ad.length, N_PEDRAS_ADOPTION); // er-config 486a964 (TK-25): entram Salamencite R e Metagrossite R
  assert.ok(ad.includes("Salamencite R") && ad.includes("Metagrossite R"));
  const caminho = [6, 4].map((n) => new URL("../".repeat(n) + "ferramentas/er-config/items/MegaStonesList.textproto", import.meta.url)).find((u) => existsSync(u)); // fora do repo: confere só quando existe
  if (caminho) assert.deepEqual(ad, lerPedrasDoAdoptionCenter(readFileSync(caminho, "utf8")), "bate com a er-config, na ordem");
  const linha = (n) => ONDE[n].find((x) => x.local === "Adoption Center");
  assert.equal(linha("Garchompite Z").etapa, 4);
  assert.equal(linha("Dragoninite Y").etapa, 7, "trava da 7ª continua");
});

test("item que só sai depois da etapa atual vira aviso; na etapa certa some", () => {
  const R = carregarRegras({ milestone: 1 });
  const av = tardio(R, "Focus Band");
  assert.ok(av && /Etapa 6/.test(av.texto) && /Shoal Cave/.test(av.texto), av && av.texto);
  R.state.settings.milestone = 6;
  assert.equal(tardio(R, "Focus Band"), undefined);
  R.state.settings.milestone = 0;
  assert.equal(tardio(R, "Leftovers"), undefined, "item do pacote nunca é tardio");
});

test("item sem lugar com etapa na run (Lava Cookie; a Lansat Berry ganhou árvore no TK-05a) não gera aviso, mas mostra onde achar", () => {
  const R = carregarRegras({ milestone: 0 });
  assert.equal(tardio(R, "Lava Cookie"), undefined);
  assert.match(R.ondeAcharItemTexto("Lava Cookie"), /fora da run/);
  assert.match(R.ondeAcharItemTexto("Leftovers"), /Pacote inicial/);
});

test("Lum Berry tem Etapa vinda das árvores de berry do jogo (TK-05a; new_game.inc setberrytree 46/47/87)", () => {
  const dado = JSON.parse(readFileSync("data/onde_achar_itens.json", "utf8"))["Lum Berry"];
  assert.ok(dado && dado.length === 3 && dado.every((x) => x.como === "árvore de berry" && Number.isInteger(x.etapa)), JSON.stringify(dado));
});

test("NPC de lendários de Littleroot dá Etapa 9 (pós-campeão); Sweet Apple (mart sem mapa) segue sem Etapa (TK-05a)", () => {
  const d = JSON.parse(readFileSync("data/onde_achar_itens.json", "utf8"));
  assert.ok(d["Gracidea"].some((x) => x.etapa === 9 && /NPC de lendários/.test(x.local)), JSON.stringify(d["Gracidea"]));
  assert.ok(d["Fire Memory"].some((x) => x.etapa === 9));
  assert.ok(!(d["Sweet Apple"] || []).some((x) => Number.isInteger(x.etapa)));
});
