// Testes do motor de confronto (src/regras/confronto.js, 2026-09-24).
// Fixtures achadas no dado real; as pré-condições de cada teste conferem o
// dado antes de confiar nele, pra um rebalanceamento do hack acusar aqui em
// vez de passar em silêncio.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const BOSSES = JSON.parse(readFileSync(join(raiz, "data", "bosses.json"), "utf8"));

function especie(sname) {
  const sp = R.getSpeciesBySname(sname);
  assert.ok(sp, "espécie " + sname + " existe no dado");
  return sp;
}
// Unidade do jogador no formato que o motor recebe (moves null = sem build).
function unidade(sname, moves) {
  const sp = especie(sname);
  const types = R.speciesTypeNames(sp);
  return { main: sp, mainTypes: types, moves, forms: [{ types, abilityIds: R.alwaysActiveAbilities(sp) }] };
}
function inimigo(sname, abilidade, moves) {
  const sp = especie(sname);
  return R.foeFromBossMember({ x: sp.x, n: sp.n, abi: abilidade, mv: moves });
}
function golpeExiste(...nomes) {
  for (const n of nomes) assert.ok(R.MOVE_BY_NAME[n], "golpe " + n + " existe no dado");
}

test("ataque: a habilidade escolhida do chefão anula o tipo (Levitate contra Ground)", () => {
  golpeExiste("Earthquake");
  const heatran = especie("SPECIES_HEATRAN");
  assert.ok(R.typeMultiplier("Ground", R.speciesTypeNames(heatran)) >= 2, "pré-condição: Heatran é fraco a Ground na tabela crua");
  const semLevitate = R.ofensaContra(unidade("SPECIES_GARCHOMP", ["Earthquake"]), inimigo("SPECIES_HEATRAN", "Flash Fire", []));
  assert.equal(semLevitate.classe, "super");
  const comLevitate = R.ofensaContra(unidade("SPECIES_GARCHOMP", ["Earthquake"]), inimigo("SPECIES_HEATRAN", "Levitate", []));
  assert.equal(comLevitate.classe, "imune", "Levitate é a habilidade que o dado do chefão informa");
});

test("ataque: innate da espécie do chefão também vale (Mountaineer anula Rock)", () => {
  golpeExiste("Rock Slide");
  const heatran = especie("SPECIES_HEATRAN");
  assert.ok(heatran.inn.includes(R.ABILITY_ID_BY_NAME["Mountaineer"]), "pré-condição: Heatran tem Mountaineer como innate");
  const r = R.ofensaContra(unidade("SPECIES_GARCHOMP", ["Rock Slide"]), inimigo("SPECIES_HEATRAN", "Flash Fire", []));
  assert.equal(r.classe, "imune");
});

test("ataque: golpe de status não conta como dano", () => {
  golpeExiste("Swords Dance");
  const r = R.ofensaContra(unidade("SPECIES_GARCHOMP", ["Swords Dance"]), inimigo("SPECIES_HEATRAN", "Flash Fire", []));
  assert.equal(r.classe, "sem_dano");
  assert.equal(r.best, null);
});

test("ataque: sem build usa os tipos do próprio Pokémon e marca como estimada", () => {
  const r = R.ofensaContra(unidade("SPECIES_GARCHOMP", null), inimigo("SPECIES_HEATRAN", "Flash Fire", []));
  assert.equal(r.estimada, true);
  assert.equal(r.classe, "super", "Ground (tipo do Garchomp) é super efetivo contra Fire/Steel");
  const comBuild = R.ofensaContra(unidade("SPECIES_GARCHOMP", ["Earthquake"]), inimigo("SPECIES_HEATRAN", "Flash Fire", []));
  assert.equal(comBuild.estimada, false);
});

test("ataque: com vários golpes escolhe o de maior multiplicador, e o de maior poder no empate", () => {
  golpeExiste("Earthquake", "Tackle", "Water Gun");
  const r = R.ofensaContra(unidade("SPECIES_GARCHOMP", ["Tackle", "Earthquake", "Water Gun"]), inimigo("SPECIES_HEATRAN", "Flash Fire", []));
  assert.equal(r.best.move, "Earthquake");
  assert.deepEqual(r.se.map((s) => s.move), ["Earthquake"]);
});

test("ameaça: dobro exato já é perigo; imunidade por tipo é seguro", () => {
  golpeExiste("Thunderbolt");
  const staraptor = unidade("SPECIES_STARAPTOR", null);
  const exato = R.ameacaDe(inimigo("SPECIES_HEATRAN", "Flash Fire", ["Thunderbolt"]), staraptor);
  assert.equal(exato.worst.mult, 2, "pré-condição: Electric contra Normal/Flying é exatamente 2x");
  assert.equal(exato.classe, "perigo");
  const imune = R.ameacaDe(inimigo("SPECIES_HEATRAN", "Flash Fire", ["Thunderbolt"]), unidade("SPECIES_GARCHOMP", null));
  assert.equal(imune.classe, "seguro", "Ground é imune a Electric");
});

test("ameaça: golpe de status do chefão não ameaça", () => {
  golpeExiste("Swords Dance");
  const r = R.ameacaDe(inimigo("SPECIES_HEATRAN", "Flash Fire", ["Swords Dance"]), unidade("SPECIES_STARAPTOR", null));
  assert.equal(r.classe, "seguro");
  assert.equal(r.worst, null);
});

test("duelo: acerta super efetivo e é ameaçado - só é vantagem se for mais rápido", () => {
  golpeExiste("Close Combat", "Earthquake", "Thunderbolt");
  const foeStaraptor = inimigo("SPECIES_HEATRAN", "Flash Fire", ["Thunderbolt"]); // 2x contra Staraptor
  const rapido = R.confrontoDuelo(unidade("SPECIES_STARAPTOR", ["Close Combat"]), foeStaraptor);
  assert.equal(especie("SPECIES_STARAPTOR").b[5] > especie("SPECIES_HEATRAN").b[5], true, "pré-condição de velocidade");
  assert.equal(rapido.ofensa.classe, "super");
  assert.equal(rapido.ameaca.classe, "perigo");
  assert.equal(rapido.veredito, "vantagem", "mais rápido");

  golpeExiste("Energy Ball");
  const foeSwampert = inimigo("SPECIES_HEATRAN", "Flash Fire", ["Energy Ball"]); // Grass: 4x contra Water/Ground
  const lento = R.confrontoDuelo(unidade("SPECIES_SWAMPERT", ["Earthquake"]), foeSwampert);
  assert.equal(especie("SPECIES_SWAMPERT").b[5] < especie("SPECIES_HEATRAN").b[5], true, "pré-condição de velocidade");
  assert.equal(lento.ameaca.classe, "perigo");
  assert.equal(lento.veredito, "arriscado", "mais lento e ameaçado");
});

test("duelo: sem golpe super efetivo, ameaçado é desvantagem e resistindo a tudo é seguro", () => {
  golpeExiste("Tackle", "Thunderbolt");
  const desv = R.confrontoDuelo(unidade("SPECIES_STARAPTOR", ["Tackle"]), inimigo("SPECIES_HEATRAN", "Flash Fire", ["Thunderbolt"]));
  assert.equal(desv.veredito, "desvantagem");
  const seguro = R.confrontoDuelo(unidade("SPECIES_GARCHOMP", ["Tackle"]), inimigo("SPECIES_HEATRAN", "Flash Fire", ["Thunderbolt"]));
  assert.equal(seguro.veredito, "seguro");
});

test("time contra chefão real: estrutura coerente e buracos batem com as respostas", () => {
  const roxanne = BOSSES.find((b) => /^Roxanne/.test(b.name));
  assert.ok(roxanne && roxanne.party.length >= 2, "pré-condição: Roxanne existe no dado");
  const foes = roxanne.party.map((m) => R.foeFromBossMember(m)).filter(Boolean);
  assert.equal(foes.length, roxanne.party.length, "todo Pokémon do chefão resolve pra uma espécie real");
  const minhas = [unidade("SPECIES_STARAPTOR", null), unidade("SPECIES_GARCHOMP", null), unidade("SPECIES_SWAMPERT", null)];
  const c = R.confrontoTime(minhas, foes);
  assert.equal(c.linhas.length, foes.length);
  assert.ok(c.linhas.every((l) => l.respostas.length === minhas.length));
  assert.ok(c.linhas.every((l) => l.buraco === l.respostas.every((r) => r.duelo.ofensa.classe !== "super")), "buraco = ninguém acerta super efetivo");
  assert.ok(c.abertura >= 0 && c.abertura < minhas.length);
  assert.equal(c.estimada, true, "sem build nenhuma, o resultado inteiro é estimado");
  assert.deepEqual(c.buracos, c.linhas.filter((l) => l.buraco).map((l) => l.foe));
});

test("time contra chefão: só golpes Normal contra um time que resiste a Normal deixa buracos", () => {
  golpeExiste("Tackle");
  const foes = [inimigo("SPECIES_HEATRAN", "Flash Fire", ["Thunderbolt"])];
  const c = R.confrontoTime([unidade("SPECIES_STARAPTOR", ["Tackle"])], foes);
  assert.equal(c.buracos.length, 1);
  assert.equal(c.linhas[0].melhor.duelo.veredito, "desvantagem");
});

test("chefão que se transforma em Mega/Primal: vale o tipo e as innates da forma nova, habilidade escolhível desconhecida", () => {
  const base = especie("SPECIES_CHARIZARD");
  const mega = especie("SPECIES_CHARIZARD_MEGA_Y");
  const f = R.foeFromBossMember({ x: base.x, n: base.n, abi: "Blaze", mv: [] }, mega);
  assert.equal(f.sp.sname, "SPECIES_CHARIZARD_MEGA_Y");
  assert.equal(f.ability, "", "não inventa qual escolhível a forma transformada usa");
  assert.equal(f.transformado, true);
  const normal = R.foeFromBossMember({ x: base.x, n: base.n, abi: "Blaze", mv: [] });
  assert.equal(normal.ability, "Blaze");
  assert.equal(normal.transformado, false);
});

test("time vazio contra chefão não quebra", () => {
  const c = R.confrontoTime([], [inimigo("SPECIES_HEATRAN", "Flash Fire", [])]);
  assert.equal(c.abertura, null);
  assert.deepEqual(c.ameacas, []);
});
