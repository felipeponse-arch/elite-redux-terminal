// Depende de dado: rank/lutas (muda quando o rank é recalculado; não é regra de jogo fixa).
// Ticket 02 (07/10/2026): times dos chefões conferidos contra a config oficial do jogo (er-config
// TrainerList.textproto, commit 7be1617 = versão do nosso dado). Resultado: 0 diferenças depois de
// preencher 11 Eviolites que a NextDex perdeu; as habilidades "diferentes" eram a regra da posição 0.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { lerTreinadores, compararMon, preencherItensPerdidos, usarMapas } from "../../scripts/conferir_chefoes_config.mjs";

const BOSSES = JSON.parse(readFileSync(new URL("../../data/bosses.json", import.meta.url), "utf8"));
const mon = (nome, chave, pos) => BOSSES.find((b) => b.name === nome)[chave][pos - 1];

const CONFIG = `trainer {
  id: TRAINER_ROXANNE_1
  name: "Roxanne"
  ace {
    mon {
      species: SPECIES_NOSEPASS
      item: ITEM_EVIOLITE
      nature: NATURE_BOLD
      ability: ABILITY_STURDY
      hp_ev: 252
      def_ev: 252
      move: MOVE_ROCK_TOMB
      move: MOVE_THUNDER_WAVE
    }
  }
}
`;

test("parser da config: bloco ace vira time Padrão, com item, EVs e golpes", () => {
  const t = lerTreinadores(CONFIG).TRAINER_ROXANNE_1;
  assert.equal(t.times.ace.length, 1);
  const m = t.times.ace[0];
  assert.equal(m.item, "ITEM_EVIOLITE");
  assert.deepEqual(m.evs, [252, 0, 252, 0, 0, 0]);
  assert.deepEqual(m.moves, ["MOVE_ROCK_TOMB", "MOVE_THUNDER_WAVE"]);
});

test("item perdido pela NextDex é preenchido com o nome do jogo; item já presente não muda", () => {
  usarMapas(null);
  const bosses = [{ name: "Roxanne 1", cat: "Lider de Ginasio", party: [{ n: "Nosepass", item: "" }] }];
  const feitos = preencherItensPerdidos(bosses, lerTreinadores(CONFIG), { ITEM_EVIOLITE: "Eviolite" }, /./);
  assert.equal(bosses[0].party[0].item, "Eviolite");
  assert.equal(feitos.length, 1);
  bosses[0].party[0].item = "Leftovers";
  assert.equal(preencherItensPerdidos(bosses, lerTreinadores(CONFIG), { ITEM_EVIOLITE: "Eviolite" }, /./).length, 0);
});

test("comparação acusa item diferente e aceita os mesmos golpes em outra ordem", () => {
  usarMapas(null);
  const cfg = lerTreinadores(CONFIG).TRAINER_ROXANNE_1.times.ace[0];
  const app = { n: "Nosepass", item: "Eviolite", nat: "Bold", abi: "Sturdy", mv: ["Thunder Wave", "Rock Tomb"], evsRaw: [252, 0, 252, 0, 0, 0] };
  assert.deepEqual(compararMon(app, cfg), []);
  assert.match(compararMon({ ...app, item: "" }, cfg).join(), /item/);
});

test("bosses.json tem os 11 Eviolites da config oficial (achado do ticket 02)", () => {
  const casos = [["Archie Slateport", "insane", 2], ["Archie Slateport", "insane", 5], ["Maxie Mt Chimney", "party", 3],
    ["Lucy Lavaridge", "insane", 3], ["Roxanne 1", "party", 5], ["Roxanne 1", "insane", 1], ["Roxanne 1", "insane", 2],
    ["Roxanne 1", "insane", 4], ["Roxanne 1", "insane", 5], ["Norman 3", "party", 2], ["Monochamp Ice", "party", 1]];
  for (const [nome, chave, pos] of casos) assert.equal(mon(nome, chave, pos).item, "Eviolite", nome + " " + chave + " " + pos);
});

test("treinadores opcionais (ticket 04): os 16 entram com a categoria própria; o parceiro Steven Mossdeep não", () => {
  const opcionais = BOSSES.filter((b) => b.cat === "Treinador opcional").map((b) => b.name);
  assert.equal(opcionais.length, 16, opcionais.join(", "));
  for (const n of ["Dragonitenite Sage 1", "Steven Route118", "Calvin E4", "Mega Fidough", "Blunder", "Granbullite Route123"]) assert.ok(opcionais.includes(n), n);
  assert.ok(!BOSSES.some((b) => b.name === "Steven Mossdeep"), "Steven Mossdeep é parceiro na dupla, não adversário");
  assert.equal(mon("Calvin 1", "party", 1).item, "Eviolite", "o item perdido pela NextDex também volta nos opcionais");
});
