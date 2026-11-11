// buildFocadaDoMotor(sname, foco): a melhor build para o chip clicado no cartão (papel ou tipo de dano), na Etapa atual.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 4, difficulty: "ace", levelCapMode: "more" });
const BLASTOISE_MEGA = "SPECIES_BLASTOISE_MEGA", LUCARIO_MEGA = "SPECIES_LUCARIO_MEGA", MACHAMP = "SPECIES_MACHAMP", GARDEVOIR = "SPECIES_GARDEVOIR";
const plain = (v) => JSON.parse(JSON.stringify(v));
// MOVES[id] = [nome, tipo, categoria (0 físico, 1 especial, 2 status), poder, ...]
const cats = (golpes) => {
  const c = { f: 0, e: 0 };
  golpes.forEach((n) => { const m = R.MOVES[R.MOVE_ID_BY_NAME[n]]; if (m[3] > 0) { if (m[2] === 0) c.f++; else if (m[2] === 1) c.e++; } });
  return c;
};

test("Mega Blastoise Pivô: golpe de pivô na build, estimada e dito nos motivos (o simulador não executa troca)", () => {
  const r = R.buildFocadaDoMotor(BLASTOISE_MEGA, "Pivo");
  assert.equal(r.ok, true);
  assert.equal(r.build.golpes.length, 4);
  assert.ok(r.build.golpes.some((g) => R.ehGolpeDePivo(g)));
  assert.equal(r.estimado, true);
  assert.equal(r.rotulo, "estimada");
  assert.ok(r.motivos.some((m) => /simulador não executa golpe de troca/.test(m)));
});

test("Mega Blastoise Tanque: EVs de bulk, sem Velocidade, e é a build que o Motor já sugere hoje", () => {
  const r = R.buildFocadaDoMotor(BLASTOISE_MEGA, "Tanque");
  assert.equal(r.ok, true);
  const e = r.build.evs;
  assert.ok(e[0] + e[2] + e[4] >= 252 && e[5] <= 100, "bulk " + e.join());
  assert.ok(r.motivos.some((m) => /mesma build que o Motor já sugere/.test(m)));
});

test("Misto (Lucario Mega, split Misto no dado): >= 1 golpe físico e >= 1 especial com poder, EVs de ataque", () => {
  const r = R.buildFocadaDoMotor(LUCARIO_MEGA, "Misto");
  assert.equal(r.ok, true);
  const c = cats(r.build.golpes);
  assert.ok(c.f >= 1 && c.e >= 1, JSON.stringify(c) + " " + r.build.golpes.join());
  // a categoria efetiva muda com a habilidade (Magical Fists), então a natureza segue o split medido pelo motor: só confere que há EVs de ataque
  assert.ok(r.build.evs[1] + r.build.evs[3] >= 252, "EVs " + r.build.evs.join());
});

test("Misto (Gardevoir, especial): força 1 golpe físico com poder em cima da melhor base especial", () => {
  const r = R.buildFocadaDoMotor(GARDEVOIR, "Misto");
  assert.equal(r.ok, true);
  const c = cats(r.build.golpes);
  assert.ok(c.f >= 1 && c.e >= 1, JSON.stringify(c) + " " + r.build.golpes.join());
  // fixa o conjunto escolhido com o dado atual (Zen Headbutt é o físico forçado no lugar do pior especial)
  assert.deepEqual(plain(r.build.golpes).sort(), ["Future Sight", "Lumina Crash", "Pixie Beam", "Zen Headbutt"]);
});

test("Físico (Machamp) só tem golpe de dano físico; Especial (Gardevoir) só especial", () => {
  const f = R.buildFocadaDoMotor(MACHAMP, "Fisico"), e = R.buildFocadaDoMotor(GARDEVOIR, "Especial");
  assert.equal(f.ok, true); assert.equal(e.ok, true);
  assert.equal(cats(f.build.golpes).e, 0);
  assert.ok(cats(f.build.golpes).f >= 1);
  assert.equal(cats(e.build.golpes).f, 0);
  assert.ok(cats(e.build.golpes).e >= 1);
});

test("Wallbreaker (Machamp): build ofensiva do papel, validada pelo papel", () => {
  const r = R.buildFocadaDoMotor(MACHAMP, "Wallbreaker");
  assert.equal(r.ok, true);
  assert.ok(Math.max(r.build.evs[1], r.build.evs[3]) >= 200);
});

test("foco que não se aplica devolve ok:false com o motivo", () => {
  const a = R.buildFocadaDoMotor(MACHAMP, "Tanque");
  assert.equal(a.ok, false);
  assert.match(a.motivo, /não tem o papel Tanque/);
  assert.equal(R.buildFocadaDoMotor(GARDEVOIR, "Wallbreaker").ok, false);
  assert.equal(R.buildFocadaDoMotor(MACHAMP, "Voador").ok, false);
  assert.equal(R.buildFocadaDoMotor("SPECIES_NAO_EXISTE", "Misto").ok, false);
});

test("determinística: mesma entrada, mesma saída", () => {
  const a = plain(R.buildFocadaDoMotor(BLASTOISE_MEGA, "Pivo")), b = plain(R.buildFocadaDoMotor(BLASTOISE_MEGA, "Pivo"));
  assert.deepEqual(a, b);
});

// ---- opts.luta (pacote 09): a build olha o chefão ----
test("sem opts.luta o resultado é o de sempre (sem contraChefao, igual a opts vazio)", () => {
  const a = R.buildFocadaDoMotor(MACHAMP, "Fisico"), b = R.buildFocadaDoMotor(MACHAMP, "Fisico", { luta: undefined });
  assert.deepEqual(plain(b), plain(a));
  assert.equal("contraChefao" in a, false);
});

test("com luta devolve contraChefao { luta, resultado, hpRestante, motivo } e o motivo cita o chefão", () => {
  const r = R.buildFocadaDoMotor(MACHAMP, "Fisico", { luta: "Flannery 1" });
  assert.equal(r.ok, true);
  assert.ok(r.contraChefao, "contraChefao ausente");
  assert.equal(r.contraChefao.luta, "Flannery 1");
  assert.ok(["vence", "perde"].includes(r.contraChefao.resultado));
  assert.equal(typeof r.contraChefao.hpRestante, "number");
  assert.match(r.contraChefao.motivo, /Flannery 1/);
});

test("caso real: Machamp Físico na Etapa 8 — sem luta não há chefão adiante; com Sidney a build muda e o duelo é medido", () => {
  const E8 = carregarRegras({ milestone: 8, difficulty: "ace", levelCapMode: "more" });
  const sem = E8.buildFocadaDoMotor(MACHAMP, "Fisico"), com = E8.buildFocadaDoMotor(MACHAMP, "Fisico", { luta: "Sidney" });
  assert.equal(sem.ok && com.ok, true);
  assert.notDeepEqual(com.build.golpes.slice().sort(), sem.build.golpes.slice().sort());
  assert.match(com.contraChefao.motivo, /Sidney/);
});

test("luta inexistente: ok false, sem sugestão às cegas", () => {
  assert.equal(R.buildFocadaDoMotor(MACHAMP, "Fisico", { luta: "Ninguém 9" }).ok, false);
});
