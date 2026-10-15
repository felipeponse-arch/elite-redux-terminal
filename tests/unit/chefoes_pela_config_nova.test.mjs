// Ticket versao-nova/05 (15/10/2026): os chefões contra o TrainerList da versão MAIS NOVA (er-config d1a9a4c, 14/10/2026). A comparação achou
// 6 diferenças nos chefões que o app já tem (Matt, Drake, Archie); `--aplicar-tudo` as corrigiu e `diferenças: 0`. O TrainerList não está no repo,
// então o teste confere (1) a função de correção num recorte e (2) os 6 mons de bosses.json com os valores do TrainerList d1a9a4c.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { lerTreinadores, compararMon, corrigirTimes, usarMapas } from "../../scripts/conferir_chefoes_config.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
function lerComMutacao(caminho, nome) {
  let t = readFileSync(join(RAIZ, caminho), "utf8").replace(/\r\n/g, "\n");
  if (process.env.MUTACAO_ARQUIVO === nome) {
    if (t.split(process.env.MUTACAO_DE).length !== 2) throw new Error("trecho da sabotagem não encontrado (ou repetido) em " + nome + ": " + process.env.MUTACAO_DE);
    t = t.replace(process.env.MUTACAO_DE, () => process.env.MUTACAO_PARA || "");
  }
  return t;
}
const BOSSES = JSON.parse(lerComMutacao("data/bosses.json", "bosses.json"));
const mon = (nome, chave, pos) => BOSSES.find((b) => b.name === nome)[chave][pos - 1];

const CONFIG = `trainer {
  id: TRAINER_ROXANNE_1
  ace {
    mon {
      species: SPECIES_STARMIE
      item: ITEM_STARMINITE
      nature: NATURE_JOLLY
      ability: ABILITY_DEADEYE
      atk_ev: 252
      spe_ev: 252
      move: MOVE_AQUA_JET
      move: MOVE_PSYCHO_CUT
    }
    mon {
      species: SPECIES_NOSEPASS
      item: ITEM_EVIOLITE
      nature: NATURE_BOLD
      ability: ABILITY_STURDY
      hp_ev: 252
      def_ev: 252
      move: MOVE_ROCK_TOMB
    }
  }
}
`;
const CTX = {
  especie: { SPECIES_STARMIE: { x: 121, n: "Starmie" }, SPECIES_NOSEPASS: { x: 299, n: "Nosepass" } },
  golpe: { MOVE_AQUA_JET: "Aqua Jet", MOVE_PSYCHO_CUT: "Psycho Cut", MOVE_ROCK_TOMB: "Rock Tomb" },
  item: { ITEM_STARMINITE: "Starminite" }, natureza: { NATURE_JOLLY: "Jolly", NATURE_BOLD: "Bold", NATURE_HARDY: "Hardy" },
  habilidade: { ABILITY_DEADEYE: { abiId: 1, abi: "Deadeye" }, ABILITY_STURDY: { abiId: 5, abi: "Sturdy" }, ABILITY_SWIFT_SWIM: { abiId: 33, abi: "Swift Swim" } },
  habilidadesDaEspecie: (x) => (x === 121 ? ["ABILITY_SWIFT_SWIM", "ABILITY_ILLUMINATE"] : null) };

const MAPAS = { especie: (m) => "SPECIES_" + m.n.toUpperCase(), golpe: {}, item: { Starminite: "ITEM_STARMINITE", Eviolite: "ITEM_EVIOLITE", Leftovers: "ITEM_LEFTOVERS" },
  habilidade: (m) => "ABILITY_" + m.abi.toUpperCase().replace(/ /g, "_"), escolhiveis: (m) => (m.n === "Starmie" ? ["ABILITY_SWIFT_SWIM", "ABILITY_ILLUMINATE"] : null) };

test("corrigirTimes troca o mon que a config diz diferente (espécie, item, natureza, EVs, golpes) e não mexe no que já é igual", () => {
  usarMapas(MAPAS);
  const igual = { x: 299, n: "Nosepass", abi: "Sturdy", abiId: 5, item: "Eviolite", nat: "Bold", evs: "252 HP / 252 Def", evsRaw: [252, 0, 252, 0, 0, 0], ivsRaw: [31, 31, 31, 31, 31, 31], mv: ["Rock Tomb"], hpt: "" };
  const copia = JSON.parse(JSON.stringify(igual));
  const bosses = [{ name: "Roxanne 1", cat: "Lider de Ginasio", party: [{ x: 134, n: "Vaporeon", abi: "Water Absorb", abiId: 11, item: "Leftovers", nat: "Calm", evs: "252 HP", evsRaw: [252, 0, 0, 0, 0, 0], ivsRaw: [31, 31, 31, 31, 31, 31], mv: ["Surf"], hpt: "" }, igual] }];
  const feitos = corrigirTimes(bosses, lerTreinadores(CONFIG), CTX, /./);
  assert.equal(feitos.length, 1);
  const m = bosses[0].party[0];
  assert.deepEqual([m.x, m.n, m.item, m.nat, m.evs, m.mv], [121, "Starmie", "Starminite", "Jolly", "252 Atk / 252 Spe", ["Aqua Jet", "Psycho Cut"]]);
  assert.deepEqual(m.evsRaw, [0, 252, 0, 0, 0, 252]);
  assert.equal(m.abi, "Swift Swim", "habilidade da config fora da lista da espécie = posição 0 (mesma regra da comparação)");
  assert.equal(m.abiId, 33);
  assert.deepEqual(bosses[0].party[1], copia, "o mon igual não muda");
  assert.equal(corrigirTimes(bosses, lerTreinadores(CONFIG), CTX, /./).length, 0, "segunda passada: nada a corrigir");
});

test("corrigirTimes recusa (erro, não palpite) o que não tem par no dado do app", () => {
  const bosses = [{ name: "Roxanne 1", cat: "Lider de Ginasio", party: [{ x: 1, n: "Bulbasaur", abi: "Overgrow", item: "", nat: "Hardy", evsRaw: [0, 0, 0, 0, 0, 0], mv: [] }, {}] }];
  assert.throws(() => corrigirTimes(bosses, lerTreinadores(CONFIG), { ...CTX, especie: {} }, /./), /espécie da config sem par/);
  assert.throws(() => corrigirTimes(bosses, lerTreinadores(CONFIG), { ...CTX, golpe: {} }, /./), /golpe da config sem par/);
});

test("bosses.json: os 6 mons que o TrainerList d1a9a4c diz diferentes agora batem com a config", () => {
  const matt = mon("Matt Mt Pyre", "insane", 6);
  assert.deepEqual([matt.n, matt.item, matt.nat, matt.evs], ["Starmie", "Starminite", "Jolly", "252 Atk / 252 Spe"]);
  assert.deepEqual(matt.mv, ["Psycho Cut", "Aqua Jet", "Ice Spinner", "Liquidation"]);
  assert.equal(mon("Matt", "party", 6).item, "Barbaracite");
  const matt2 = mon("Matt", "insane", 6);
  assert.deepEqual([matt2.n, matt2.item, matt2.nat], ["Starmie", "Starminite", "Jolly"]);
  assert.deepEqual(matt2.mv, ["Psychokinetic Slam", "Liquidation", "Triple Axel", "High Jump Kick"]);
  assert.equal(mon("Drake", "party", 2).abi, "Hustle");
  const drake6 = mon("Drake", "party", 6);
  assert.deepEqual([drake6.nat, drake6.evs, drake6.evsRaw], ["Modest", "252 HP / 4 Def / 252 SpA", [252, 0, 4, 252, 0, 0]]);
  assert.equal(mon("Archie Mt Pyre", "insane", 6).abi, "Rain Shroud");
  assert.equal(mon("Archie Mt Pyre", "insane", 6).abiId, 959);
});

test("a comparação aceita o mon corrigido (config em recorte)", () => {
  usarMapas(null);
  const cfg = lerTreinadores(CONFIG).TRAINER_ROXANNE_1.times.ace[0];
  assert.match(compararMon({ n: "Inteleon", item: "Inteleonite", nat: "Timid", abi: "Dual Wield", mv: ["Ice Beam"], evsRaw: [0, 0, 0, 252, 0, 252] }, cfg).join(" | "), /espécie/);
});
