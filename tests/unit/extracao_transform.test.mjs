// Ticket versao-nova/05 (15/10/2026): a extração do dado em Node (scripts/extracao/) é o que gera os arquivos derivados. Estes testes travam que os arquivos
// gravados em data/ são exatamente o que a extração produz do dado bruto (data/gameData_2654.json): dado e derivado nunca divergem em silêncio.
// A equivalência com os scripts PowerShell antigos (transform.ps1 + slim_dex.ps1, expand_combo_abilities.ps1, extract_bosses.ps1) foi provada uma vez com o dado
// antigo: dex_compact.json e ability_translations_pt.json saíram idênticos byte a byte; bosses.json igual, exceto os 5 Eviolites dos times Hell (item de índice 0
// que o PowerShell descartava).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { extrairDex, ordenarUnicoComoPowerShell } from "../../scripts/extracao/transform.mjs";
import { aplicarPatch } from "../../scripts/extracao/config_nova.mjs";
import { expandirCompostas } from "../../scripts/extracao/expandir_compostas.mjs";
import { extrairChefoes, extrairBuildsDeReferencia, formatarEvs } from "../../scripts/extracao/chefoes.mjs";
import { lerPedrasDoAdoptionCenter } from "../../scripts/extracao/pedras_adoption_center.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ler = (a) => readFileSync(join(RAIZ, a), "utf8");
const bruto = JSON.parse(ler("data/gameData_2654.json"));
const dexGravado = JSON.parse(ler("data/dex_compact.json"));

test("dex_compact.json gravado == extração do dado bruto (2.65.4) + o delta da config d1a9a4c (data/config_nova.json), byte a byte", () => {
  const dex = extrairDex(bruto, { versao: dexGravado.meta.version, gerado: dexGravado.meta.generated, traducoesDeGolpe: JSON.parse(ler("data/move_translations_pt.json")) });
  aplicarPatch(dex, JSON.parse(ler("data/config_nova.json")));
  assert.equal(JSON.stringify(dex), ler("data/dex_compact.json"));
  assert.equal(dexGravado.meta.version, "2.65.4");
  assert.equal(dexGravado.species.length, 1923, "2.65.4: 1923 entradas de espécie");
  assert.equal(dexGravado.abilities.length, 1072, "1063 da NextDex + 9 da config nova");
});

test("ability_translations_pt.json gravado == compostas expandidas de novo (idempotente)", () => {
  const pt = JSON.parse(ler("data/ability_translations_pt.json"));
  const r = expandirCompostas(dexGravado, pt);
  assert.ok(r.expandidas >= 160, "compostas expandidas: " + r.expandidas);
  assert.equal(JSON.stringify(pt), ler("data/ability_translations_pt.json"));
});

test("boss_reference_builds.json gravado == extraído do bosses.json e do dex gravados", () => {
  const refs = extrairBuildsDeReferencia(JSON.parse(ler("data/bosses.json")), dexGravado);
  assert.equal(JSON.stringify(refs), ler("data/boss_reference_builds.json"));
});

test("chefões: o item de índice 0 (Eviolite) conta; a extração do dado bruto acha o Eviolite do Calvin 1 Hell, que o PowerShell perdia", () => {
  assert.equal(bruto.items[0].name, "Eviolite");
  const calvin = extrairChefoes(bruto).find((b) => b.name === "Calvin 1");
  const hell = [].concat(calvin.hell);
  assert.ok(hell.length > 0 && hell.some((m) => m.item === "Eviolite"), "Eviolite nos times Hell do Calvin 1");
  assert.equal(formatarEvs([252, 0, 4, 252, 0, 0]), "252 HP / 4 Def / 252 SpA");
});

test("ordem dos itens como o Sort-Object do PowerShell: ignora hífen e apóstrofo, não o espaço, sem diferenciar maiúscula", () => {
  assert.deepEqual(ordenarUnicoComoPowerShell(["King's Rock", "Kinglerite R", "AbilityPatch", "Ability Pill", "kinglerite r"]),
    ["Ability Pill", "AbilityPatch", "Kinglerite R", "King's Rock"]);
});

test("pedras do Adoption Center: lê só os itens com adoption_center: true", () => {
  const txt = 'item {\n  id: ITEM_A\n  name: "Pedra A"\n  adoption_center: true\n}\nitem {\n  id: ITEM_B\n  name: "Pedra B"\n  evolution { x: 1 }\n}\nitem {\n  id: ITEM_C\n  name: "Pedra C"\n  adoption_center: true\n}\n';
  assert.deepEqual(lerPedrasDoAdoptionCenter(txt), ["Pedra A", "Pedra C"]);
});
