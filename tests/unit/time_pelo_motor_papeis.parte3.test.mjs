// Parte 3 de 4 de time_pelo_motor_papeis.test.mjs (dividido em 06/11/2026 para rodar em paralelo; ver tests/pesados.json).
// Modo Motor do Meu Time, Fase D (ticket time-pelo-motor/01, 21/10/2026): papéis por build, tags, sinergia e explicação.
// Dado real (espécies, lutas e níveis da run). Cada papel tem um caso real em que a prova fecha e um em que ela NÃO fecha
// (o golpe está na build mas o simulador não mostra o efeito). Teste que protege comportamento não se afrouxa para passar.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";


// Run com o elenco dado (6 no time, o resto na caixa) e builds salvas opcionais: { nome: [habilidade, golpes, natureza, evs] }.
// `comFatia`: false (padrão) liga o juiz só dos chefões, o das Fases C e D, onde estes casos foram escolhidos (os elencos e as lutas aqui são
// fixados à mão). O juiz com as lutas comuns (todas-as-lutas/02, fatia 60/40) muda QUEM o Modo Motor escolhe, não o que um papel ou uma tag
// exige como prova; a fatia tem os testes dela em time_pelo_motor_comuns.test.mjs e o último teste deste arquivo confere que a tag de clima
// continua com prova no juiz com a fatia.
function run({ milestone = 2, nomes, builds = {}, comFatia = false }) {
  const R = carregarRegras({ milestone });
  if (!comFatia) R.LUTAS_COMUNS_RUN = null;
  const sp = (n) => R.SPECIES.find((s) => s && s.n === n);
  nomes.forEach((n) => assert.ok(sp(n), "espécie inexistente: " + n));
  R.state.team = nomes.slice(0, 6).map((n) => sp(n).x);
  R.state.box = nomes.slice(6).map((n) => sp(n).x);
  Object.keys(builds).forEach((n) => {
    const [ability, moves, nature, evs] = builds[n];
    R.state.customBuilds[sp(n).sname] = [{ active: true, ability, moves, item: "", nature, evs }];
  });
  const ctx = R.contextoDoMotor();
  ctx.cache = R.criarCacheDoMotor();
  ctx.fecharItens = false; // motor-item/01: o fechamento de item muda o time escolhido; estes casos fixam o papel no time SEM item (aprendizados 21/10); com item: motor_item.test.mjs
  const cand = (travados) => R.motorCandidatos(ctx, travados.map((n) => sp(n).sname), []);
  const usaLutas = (...nomesDasLutas) => {
    ctx.lutas = Object.assign({}, ctx.lutas, { amostra: nomesDasLutas.map((n) => ctx.lutas.todas.find((l) => l.nome === n)) });
    nomesDasLutas.forEach((n, i) => assert.ok(ctx.lutas.amostra[i], "luta inexistente: " + n));
  };
  return { R, sp, ctx, cand, usaLutas };
}
const papeisDe = (cl, nome) => cl.membros.find((m) => m.nome === nome).papeis;
const temPapel = (cl, nome, papel) => papeisDe(cl, nome).some((p) => p.papel === papel);

// ---------- papéis: prova fecha ----------
const SUPORTES = {
  Whimsicott: ["Prankster", ["Tailwind", "Moonblast", "Energy Ball", "Encore"], "Timid", [0, 0, 0, 252, 4, 252]],
  Hatterene: ["Magic Bounce", ["Trick Room", "Dazzling Gleam", "Psychic", "Mystical Fire"], "Quiet", [252, 0, 0, 252, 4, 0]]
};

// ---------- tags e a 3ª variante ----------
// As 3 variantes usam um pool sem Politoed/Pelipper/Charizard: com a precisão corrigida (mecanica-01: Skill Link/Pinnacle Blade deixaram de "sempre acertar"; Plasma Lamp x1,2),
// a chuva do Politoed passou a render mais que o sol no pool completo e a sinergia escolhe a chuva. Aqui o sol é a única armação (Charizard seria o 2º beneficiário do sol e tira o Togekiss).
// ---------- explicação, legado e tempo ----------
// Sol e chuva são a mesma sinergia, medida da mesma forma, cada uma no pool do seu tipo de beneficiário (regra do usuário, 22/10/2026):
// nadadores de chuva perdem no sol e poluem a medida do sol, e vice-versa. Com a fatia, as duas precisam sair com prova medida.
// Lutas de prova: no máximo 5 (teste rápido); escolhidas onde o clima muda o resultado do time (medido 22/10: sol Norman 1 4 vs 3, Archie 13,7 vs 5; chuva Wattson 1 5,23 vs 4, Glacia 1,46 vs 0,44).
// Os 3 casos que o juiz com a fatia mudou (21/10): os papéis são da BUILD e da ordem do time na luta, não do juiz. Com a fatia, Ferrothorn,
// Blissey e Clefable seguem com os mesmos papéis e provas; só a Mandibuzz mudou (de abstenção para "revenge killer") porque o time saiu em
// outra ordem (o juiz escolhe a ordem) e a prova de revenge killer depende de quem entra depois do nocaute. O invariante abaixo vale nos dois juízes.


test("armador: Tailwind do Whimsicott vale pontos medidos na luta completa (Matt Mt Pyre, Etapa 4); a mesma build sem o golpe faz menos", () => {
  const r = run({ milestone: 4, nomes: ["Whimsicott", "Hatterene", "Garchomp", "Scizor", "Metagross", "Gyarados"], builds: SUPORTES });
  const cands = r.cand(["Whimsicott", "Hatterene"]).filter((c) => c.sp.x === c.base.x);
  const time = [cands.find((c) => c.nome === "Whimsicott")].concat(cands.filter((c) => !c.travado).slice(0, 3), cands.filter((c) => c.nome === "Hatterene"));
  // Dados 2.65.5: na amostra padrão da Etapa 4 o Tailwind rende 0 em todas as lutas (o Meowscarada do chefão trocou Magic Bounce por Magician); Matt Mt Pyre, da mesma Etapa, rende 1,18.
  r.usaLutas(...r.ctx.lutas.amostra.map((l) => l.nome), "Matt Mt Pyre");
  const cl = r.R.motorClassificar(r.ctx, time);
  const arm = papeisDe(cl, "Whimsicott").find((p) => p.papel === "armador");
  assert.ok(arm, JSON.stringify(papeisDe(cl, "Whimsicott")));
  assert.ok(arm.prova.pontosDoEfeito >= 1);
  // A prova é reproduzível pelo contrafactual: o time com e sem os golpes de armar o campo, na mesma luta.
  const luta = r.ctx.lutas.amostra.find((l) => l.nome === arm.prova.luta);
  assert.equal(r.R.motorDeltaSemTipos(r.ctx, time, time[0], luta, r.R.MOTOR_TIPOS_DE_ARMAR), arm.prova.pontosDoEfeito);
  assert.ok(temPapel(cl, "Hatterene", "armador"), "Trick Room da Hatterene também vale pontos nessa amostra");
});

test("elenco pequeno: as três variantes chegam nos mesmos Pokémon e as duas últimas avisam, com o mesmo texto", () => {
  const r = run({ milestone: 2, nomes: ["Blissey", "Ferrothorn", "Clefable", "Dragonite", "Corviknight", "Mandibuzz"] });
  const out = r.R.montarTimePeloMotor(r.ctx, {});
  assert.equal(out.variantes.length, 3);
  assert.equal(new Set(out.variantes.map((v) => v.membros.map((m) => m.nome).sort().join())).size, 1);
  out.variantes.slice(1).forEach((v) => assert.ok(v.avisos.some((a) => /chegou nos mesmos Pokémon da variante "Mais ofensivo"/.test(a)), v.chave + ": " + v.avisos.join(" | ")));
  assert.equal(out.variantes[0].avisos.filter((a) => /chegou nos mesmos/.test(a)).length, 0);
});

test("sweeper: Salamence com Dragon Dance encadeia nocautes e o time faz mais de 1 ponto a menos sem o setup (Shelly Seafloor Cavern, Etapa 4)", () => {
  const r = run({ milestone: 4, nomes: ["Gyarados", "Garchomp", "Scizor", "Salamence", "Blissey", "Ferrothorn"], builds: {
    Gyarados: ["Intimidate", ["Dragon Dance", "Waterfall", "Earthquake", "Ice Fang"], "Jolly", [0, 252, 0, 0, 4, 252]],
    Garchomp: ["Rough Skin", ["Swords Dance", "Earthquake", "Outrage", "Stone Edge"], "Jolly", [0, 252, 0, 0, 4, 252]],
    Scizor: ["Technician", ["Swords Dance", "Bullet Punch", "Close Combat", "Roost"], "Adamant", [0, 252, 0, 0, 4, 252]],
    Salamence: ["Intimidate", ["Dragon Dance", "Outrage", "Earthquake", "Roost"], "Jolly", [0, 252, 0, 0, 4, 252]] } });
  const cands = r.cand(["Gyarados", "Garchomp", "Scizor", "Salamence"]);
  const time = cands.filter((c) => c.travado && c.sp.x === c.base.x).concat(cands.filter((c) => !c.travado).slice(0, 2));
  r.usaLutas("Shelly Seafloor Cavern");
  const cl = r.R.motorClassificar(r.ctx, time);
  const sw = papeisDe(cl, "Salamence").find((p) => p.papel === "sweeper");
  assert.ok(sw, JSON.stringify(papeisDe(cl, "Salamence")));
  assert.ok(sw.prova.nocautesSeguidos >= 2 && sw.prova.pontosGanhosPeloSetup >= 1, JSON.stringify(sw));
  // Mesma luta, mesmo time: Garchomp e Scizor também têm setup na build e NÃO ganham o rótulo (sem encadeamento medido com ganho).
  assert.ok(!temPapel(cl, "Scizor", "sweeper"));
});

test("risco 4: dois beneficiários medidos mas o time NÃO ganha na luta simulada (Trick Room da Hatterene) também não ganha a tag", () => {
  const r = run({ milestone: 3, nomes: ["Hatterene", "Ferrothorn", "Garchomp", "Slowbro", "Metagross", "Hippowdon"], builds: { Hatterene: SUPORTES.Hatterene } });
  const base = r.cand(["Hatterene"]).filter((c) => c.sp.x === c.base.x);
  const sin = r.R.motorSinergia(r.ctx, base.slice(0, 6));
  const sala = sin.itens.find((i) => i.cond.id === "sala");
  assert.ok(sala && sala.beneficiarios.length >= 2, "o caso precisa ter os dois beneficiários medidos");
  const cl = r.R.motorClassificar(r.ctx, base.slice(0, 6));
  assert.ok(!cl.tags.some((t) => /Trick Room/.test(t.tag)), JSON.stringify(cl.tags));
});
