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

function comAprendiveis(u, lista) { return { ...u, aprendiveis: lista }; }

test("fechar buracos: sugere o golpe já disponível que acerta o buraco, sem repetir golpe da build nem golpe fraco ou de status", () => {
  golpeExiste("Close Combat", "Earthquake", "Tackle", "Swords Dance", "Water Gun");
  const foe = inimigo("SPECIES_HEATRAN", "Flash Fire", ["Thunderbolt"]);
  const u = comAprendiveis(unidade("SPECIES_STARAPTOR", ["Tackle"]), ["Tackle", "Swords Dance", "Water Gun", "Earthquake", "Close Combat"]);
  const cx = R.confrontoTime([u], [foe]);
  assert.equal(cx.buracos.length, 1, "pré-condição: só com Tackle há um buraco");
  const s = R.coberturaSugerida([u], cx);
  assert.equal(s.length, 1);
  assert.equal(s[0].move, "Close Combat", "mesmo multiplicador que Earthquake, mais poder e STAB do Staraptor");
  assert.deepEqual(s[0].resolve.map((f) => f.name), [foe.name]);
  const jaTem = comAprendiveis(unidade("SPECIES_STARAPTOR", ["Tackle", "Close Combat"]), ["Close Combat", "Earthquake"]);
  const cx2 = R.confrontoTime([{ ...jaTem, moves: ["Tackle"] }], [foe]);
  const s2 = R.coberturaSugerida([{ ...jaTem, moves: ["Tackle", "Close Combat"] }], cx2);
  assert.ok(s2.every((x) => x.move !== "Close Combat"), "golpe que já está na build não é sugerido de novo");
});

test("fechar buracos: golpe super efetivo mas fraco (poder abaixo do mínimo) não é sugerido", () => {
  golpeExiste("Water Gun", "Tackle");
  assert.ok(R.MOVE_BY_NAME["Water Gun"][3] < R.COBERTURA_PODER_MINIMO, "pré-condição: Water Gun é fraco");
  const foe = inimigo("SPECIES_CHARIZARD", "Blaze", ["Thunderbolt"]);
  assert.ok(R.abilityTypeModFor("Water", R.speciesTypeNames(foe.sp), R.foeAbilityIds(foe.sp, "Blaze")).mult >= 2, "pré-condição: Water é super efetivo");
  const u = comAprendiveis(unidade("SPECIES_STARAPTOR", ["Tackle"]), ["Water Gun"]);
  const cx = R.confrontoTime([u], [foe]);
  assert.equal(cx.buracos.length, 1);
  assert.equal(R.coberturaSugerida([u], cx).length, 0);
});

test("fechar buracos: golpe com prioridade negativa (Focus Punch) não é sugerido", () => {
  golpeExiste("Focus Punch", "Tackle");
  assert.ok(R.MOVE_BY_NAME["Focus Punch"][7] < 0, "pré-condição: Focus Punch tem prioridade negativa");
  const foe = inimigo("SPECIES_HEATRAN", "Flash Fire", ["Thunderbolt"]);
  assert.ok(R.abilityTypeModFor("Fighting", R.speciesTypeNames(foe.sp), R.foeAbilityIds(foe.sp, "Flash Fire")).mult >= 2, "pré-condição: Fighting é super efetivo");
  const u = comAprendiveis(unidade("SPECIES_STARAPTOR", ["Tackle"]), ["Focus Punch"]);
  assert.equal(R.coberturaSugerida([u], R.confrontoTime([u], [foe])).length, 0);
});

test("fechar buracos: golpe impreciso demais não é sugerido", () => {
  const impreciso = Object.keys(R.MOVE_BY_NAME).find((n) => {
    const m = R.MOVE_BY_NAME[n];
    return m[4] > 0 && m[4] < R.COBERTURA_PRECISAO_MINIMA && (m[3] || 0) >= R.COBERTURA_PODER_MINIMO && (m[7] || 0) >= 0 &&
      R.moveRoleOf(n) === "dano" && R.TYPES[m[1]] === "Fighting";
  });
  assert.ok(impreciso, "pré-condição: existe golpe Fighting de poder alto e precisão baixa no dado");
  const foe = inimigo("SPECIES_HEATRAN", "Flash Fire", ["Thunderbolt"]);
  const u = comAprendiveis(unidade("SPECIES_STARAPTOR", ["Tackle"]), [impreciso]);
  assert.equal(R.coberturaSugerida([u], R.confrontoTime([u], [foe])).length, 0, impreciso);
});

test("fechar buracos: habilidade do chefão que anula o tipo tira o golpe da lista", () => {
  const foe = inimigo("SPECIES_HEATRAN", "Levitate", ["Thunderbolt"]);
  const u = comAprendiveis(unidade("SPECIES_STARAPTOR", ["Tackle"]), ["Earthquake"]);
  const s = R.coberturaSugerida([u], R.confrontoTime([u], [foe]));
  assert.equal(s.length, 0, "Earthquake é imune contra Levitate");
});

test("melhor time: entra a criatura da caixa que fecha o buraco, e não sugere troca sem ganho real", () => {
  const foe = inimigo("SPECIES_HEATRAN", "Flash Fire", ["Thunderbolt"]);
  const fraco = unidade("SPECIES_STARAPTOR", ["Tackle"]);
  const forte = unidade("SPECIES_GARCHOMP", ["Earthquake"]);
  const r = R.melhoresTrocas([fraco], [forte], [foe], 3);
  assert.equal(r.trocas.length, 1, "time com vaga: entra sem tirar ninguém, ou troca - o motor escolhe a que mais sobe");
  assert.equal(r.trocas[0].entra.main.sname, "SPECIES_GARCHOMP");
  assert.ok(r.trocas[0].ganho >= R.LIMIAR_TROCA);
  assert.ok(r.buracosDepois < r.buracosAntes);
  const igual = R.melhoresTrocas([forte], [unidade("SPECIES_GARCHOMP", ["Earthquake"])], [foe], 3);
  assert.equal(igual.trocas.length, 0, "candidato idêntico não traz ganho");
});

test("melhor time: time cheio troca em vez de adicionar", () => {
  const foe = inimigo("SPECIES_HEATRAN", "Flash Fire", ["Thunderbolt"]);
  const cheio = Array.from({ length: 6 }, () => unidade("SPECIES_STARAPTOR", ["Tackle"]));
  const r = R.melhoresTrocas(cheio, [unidade("SPECIES_GARCHOMP", ["Earthquake"])], [foe], 1);
  assert.equal(r.trocas.length, 1);
  assert.ok(r.trocas[0].sai, "com 6 no time alguém sai");
});

test("plano: os golpes que mais ameaçam o time vêm do mais grave pro menos, com limite", () => {
  golpeExiste("Thunderbolt", "Energy Ball");
  const foe = inimigo("SPECIES_HEATRAN", "Flash Fire", ["Thunderbolt", "Energy Ball"]);
  const minhas = [unidade("SPECIES_STARAPTOR", null), unidade("SPECIES_SWAMPERT", null)];
  const cx = R.confrontoTime(minhas, [foe]);
  const c = R.cuidadosDoChefao(cx, minhas, 5);
  assert.ok(c.length >= 2);
  assert.ok(c[0].mult >= c[c.length - 1].mult, "ordenado do mais grave pro menos");
  assert.equal(c[0].move, "Energy Ball", "Grass é 4x contra Water/Ground");
  assert.equal(R.cuidadosDoChefao(cx, minhas, 1).length, 1);
});

test("dupla: escolhe a melhor dupla contra os dois primeiros do chefão e exige 2+ de cada lado", () => {
  const f1 = inimigo("SPECIES_HEATRAN", "Flash Fire", ["Thunderbolt"]);
  const f2 = inimigo("SPECIES_HEATRAN", "Flash Fire", ["Thunderbolt"]);
  const minhas = [unidade("SPECIES_STARAPTOR", ["Tackle"]), unidade("SPECIES_GARCHOMP", ["Earthquake"]), unidade("SPECIES_SWAMPERT", ["Earthquake"])];
  const d = R.aberturaEmDupla(minhas, [f1, f2]);
  assert.equal(d.idx.length, 2);
  assert.ok(!d.idx.includes(0), "o Staraptor só com Tackle não entra na melhor dupla");
  assert.equal(R.aberturaEmDupla(minhas, [f1]), null);
  assert.equal(R.aberturaEmDupla([minhas[0]], [f1, f2]), null);
});

test("time vazio contra chefão não quebra", () => {
  const c = R.confrontoTime([], [inimigo("SPECIES_HEATRAN", "Flash Fire", [])]);
  assert.equal(c.abertura, null);
  assert.deepEqual(c.ameacas, []);
});
