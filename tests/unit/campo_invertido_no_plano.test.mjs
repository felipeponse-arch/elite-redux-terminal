// Achado do vídeo do usuário (02/10): o plano contra a Tate & Liza 1 chamava Axe Kick (Dark) de
// "super efetivo" nos Psychic, mas a luta tem batalha INVERTIDA (no jogo o golpe fez só 6-8% no
// Delphox). O plano mede o golpe fora do duelo, onde o campo não valia - tabela normal.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 6 });
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const efDe = (nomes) => R.efeitoDasHabilidadesNoDuelo(nomes.map(idHab), "CI_" + nomes.join("+"), null);
const unidade = (tipos) => ({ ef: efDe([]), tipos, stats: [300, 100, 100, 100, 100, 100], ids: [] });

function delphoxDaTateLiza(comRegra) {
  const tl = R.BOSSES.find((b) => b.name === "Tate And Liza 1");
  const m = tl.party.find((p) => p.n === "Delphox");
  assert.ok(m, "fixture: Delphox na Tate And Liza 1");
  const foes = [R.foeDeDuelo(m, 85, null)];
  return comRegra ? R.foesComRegraDeCampo(foes, R.regraDeCampoDoChefao("Tate And Liza 1"))[0] : foes[0];
}
function axeKickContra(foe) {
  const atq = unidade(["Normal"]);
  atq.golpesProntos = R.prepararGolpesDuelo([R.MOVE_ID_BY_NAME["Axe Kick"]], atq, null);
  assert.equal(atq.golpesProntos[0].tipo, "Dark", "Axe Kick é Dark no dado 2.65beta");
  return R.danoNoDuelo(atq, foe, 85).melhor.efTipo;
}

test("fora do duelo, a batalha invertida da Tate & Liza 1 vale: Dark em Delphox (Fire/Psychic) é resistido", () => {
  assert.equal(R.CAMPO_DUELO, null, "pré-condição: fora de qualquer duelo");
  assert.equal(axeKickContra(delphoxDaTateLiza(false)), 2, "sem a regra de campo é a tabela normal (super efetivo)");
  assert.equal(axeKickContra(delphoxDaTateLiza(true)), 0.5, "com a regra do chefão a tabela é a invertida");
});

test("a regra de campo da revanche (só Trick Room) não inverte nada", () => {
  const tl = R.BOSSES.find((b) => b.name === "Tate And Liza 2");
  const foe = R.foesComRegraDeCampo([R.foeDeDuelo(tl.party.find((p) => p.n === "Delphox") || tl.party[0], 85, null)], R.regraDeCampoDoChefao("Tate And Liza 2"))[0];
  assert.equal(foe.ef.inversa < 99, true);
});

test("Granbull Mega (Granbullite) só libera depois da Tate & Liza", () => {
  const mega = R.getSpeciesBySname("SPECIES_GRANBULL_MEGA");
  assert.ok(mega, "fixture: Granbull Mega no dado");
  assert.equal(R.etapaDaMega(mega), 7);
  const antes = R.state.settings.milestone;
  try {
    R.state.settings.milestone = 6; // luta contra a Tate & Liza 1
    assert.ok(!R.battleFamilyOf(R.getSpeciesBySname("SPECIES_GRANBULL")).some((s) => s.sname === "SPECIES_GRANBULL_MEGA"));
    R.state.settings.milestone = 7;
    assert.ok(R.battleFamilyOf(R.getSpeciesBySname("SPECIES_GRANBULL")).some((s) => s.sname === "SPECIES_GRANBULL_MEGA"));
  } finally { R.state.settings.milestone = antes; }
});

test("conferência com as builds: o plano refeito mostra o golpe da build e a luta segue a ordem da party", () => {
  const tl = R.BOSSES.find((b) => b.name === "Tate And Liza 1");
  const nomes = ["SPECIES_AZUMARILL", "SPECIES_HYDREIGON", "SPECIES_BEWEAR", "SPECIES_GRANBULL"];
  const time = nomes.map((n) => R.getSpeciesBySname(n)).filter(Boolean);
  assert.ok(time.length >= 3, "fixture: espécies no dado");
  const antes = R.state.customBuilds;
  try {
    R.state.customBuilds = {};
    time.forEach((sp, i) => {
      R.state.customBuilds[sp.sname] = [{ ability: R.ABILITIES[sp.ab[0]][0], nature: "Hardy", item: "", moves: ["Tackle", "Pound", "Scratch", "Slam"].filter((n) => R.MOVE_ID_BY_NAME[n] !== undefined),
        ivs: [31, 31, 31, 31, 31, 31], evs: [0, 0, 0, 0, 0, 0], source: "manual", active: true, savedAt: "x", rationale: "" }];
    });
    const c = R.conferirTimeComBuilds(time, tl.party, 85, { dupla: true, campo: R.regraDeCampoDoChefao("Tate And Liza 1") }, null);
    const golpes = new Set(c.plano.flatMap((p) => p.respostas.map((a) => a.golpe)).filter(Boolean));
    assert.ok([...golpes].every((g) => ["Tackle", "Pound", "Scratch", "Slam"].includes(g)), "só golpes da build: " + [...golpes].join(","));
    assert.ok(c.simulacao.log.length > 0);
  } finally { R.state.customBuilds = antes; }
});

test("Wide Guard permanente da Tate & Liza: golpe em área não acerta o time dela, o de alvo único sim", () => {
  const atq = unidade(["Fairy"]);
  const dg = R.prepararGolpesDuelo([R.MOVE_ID_BY_NAME["Dazzling Gleam"]], atq, null)[0];
  assert.ok(dg.area && dg.area !== "aleatorio", "fixture: Dazzling Gleam é golpe em área no dado");
  atq.golpesProntos = [dg];
  const alvo = R.foeDeDuelo(R.BOSSES.find((b) => b.name === "Tate And Liza 1").party.find((p) => p.n === "Delphox"), 85, null);
  assert.ok(R.danoNoDuelo(atq, alvo, 85).melhor.dano > 0, "sem o buff acerta");
  const [comBuff] = R.foesComBuffsDoGinasio([alvo], ["tateliza_wideguard"], 2);
  assert.equal(R.danoNoDuelo(atq, comBuff, 85).melhor.dano, 0, "com Wide Guard o golpe em área é bloqueado");
  const unico = R.prepararGolpesDuelo([R.MOVE_ID_BY_NAME["Play Rough"]], atq, null)[0];
  atq.golpesProntos = [dg, unico];
  assert.ok(R.danoNoDuelo(atq, comBuff, 85).melhor.dano > 0, "o golpe de alvo único continua valendo");
});

test("card do plano: avisa quais buffs do ginásio entraram na conta (relato: 6 marcados = nenhum ativo)", () => {
  const antes = R.state.gymSkillsCleared;
  try {
    R.state.gymSkillsCleared = {};
    const todos = R.buffsParaMostrarDoChefao("Tate And Liza 1");
    assert.equal(todos.total, 6);
    assert.equal(todos.ativos.length, 6, "nada tirado = os 6 ativos");
    R.state.gymSkillsCleared = { "Tate And Liza": R.GYM_SKILLS.leaders["Tate And Liza"].buffs.map((b) => b.id) };
    const nenhum = R.buffsParaMostrarDoChefao("Tate And Liza 1");
    assert.deepEqual(nenhum.ativos, [], "tudo marcado como tirado = simulador sem buffs");
    assert.equal(R.buffsAtivosDoChefao("Tate And Liza 1").length, 0);
  } finally { R.state.gymSkillsCleared = antes; }
});

test("pedras com trava de insígnia no código oficial (auditoria de 02/10): etapa de cada uma", () => {
  const etapa = (s) => R.etapaDaMega(R.getSpeciesBySname(s));
  assert.equal(etapa("SPECIES_NIDOKING_MEGA"), 6, "Route116: FLAG_BADGE06_GET");
  assert.equal(etapa("SPECIES_HITMONCHAN_MEGA"), 6);
  assert.equal(etapa("SPECIES_SLOWKING_MEGA"), 7, "ginásio de Mossdeep (Tate & Liza)");
  assert.equal(etapa("SPECIES_BRELOOM_MEGA"), 5, "FLAG_BADGE05_GET");
  assert.equal(etapa("SPECIES_ALTARIA_MEGA"), 4, "sem trava no código: continua na 4ª");
});

test("Forewarn (Delphox da Tate & Liza): o Future Sight de 80 de poder na entrada tira HP de quem abre", () => {
  const tl = R.BOSSES.find((b) => b.name === "Tate And Liza 1");
  const delphox = R.foeDeDuelo(tl.party.find((p) => p.n === "Delphox"), 85, null);
  assert.equal(delphox.ef.futuro, 80, "o texto 'Casts an 80 BP Future Sight on entry' vira efeito");
  const alvo = R.foeDeDuelo(tl.party.find((p) => p.n === "Medicham"), 85, null);
  const frac = R.danoDoFuturoDuelo(R.participanteDuelo(delphox), R.participanteDuelo(alvo), 85);
  assert.ok(frac > 0.02 && frac < 0.8, "fração de HP razoável: " + frac);
  const semFuturo = Object.assign({}, delphox, { ef: Object.assign({}, delphox.ef, { futuro: 0 }) });
  assert.equal(R.danoDoFuturoDuelo(R.participanteDuelo(semFuturo), R.participanteDuelo(alvo), 85), 0);
});

test("Forewarn na luta simulada (1x1 e dupla): o time chega com menos HP do que sem o Future Sight", () => {
  const tl = R.BOSSES.find((b) => b.name === "Tate And Liza 1");
  const mk = (n, futuro) => { const u = R.foeDeDuelo(tl.party.find((p) => p.n === n), 85, null); return futuro === undefined ? u : Object.assign({}, u, { ef: Object.assign({}, u.ef, { futuro }) }); };
  const hp = (sim) => sim.hpRestante;
  const meus = () => [mk("Slowking"), mk("Lunatone")];
  const com1 = R.simularLutaContraChefao(meus(), [mk("Delphox")], 85, null);
  const sem1 = R.simularLutaContraChefao(meus(), [mk("Delphox", 0)], 85, null);
  assert.ok(hp(com1) < hp(sem1) || com1.derrubados < sem1.derrubados, "1x1: " + hp(com1) + " vs " + hp(sem1));
  const com2 = R.simularDuplaContraChefao(meus(), [mk("Delphox"), mk("Oranguru")], 85, null);
  const sem2 = R.simularDuplaContraChefao(meus(), [mk("Delphox", 0), mk("Oranguru")], 85, null);
  assert.ok(hp(com2) < hp(sem2) || com2.derrubados < sem2.derrubados, "dupla: " + hp(com2) + " vs " + hp(sem2));
});
