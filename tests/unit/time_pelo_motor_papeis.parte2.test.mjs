// Parte 2 de 4 de time_pelo_motor_papeis.test.mjs (dividido em 06/11/2026 para rodar em paralelo; ver tests/pesados.json).
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

// ---------- papéis: prova fecha ----------

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

test("com a fatia: nenhuma tag de armador nasce com menos de dois beneficiários medidos, em nenhuma variante", () => {
  // Pool de chuva sem beneficiários de sol e sem Pelipper (build Air Blower não arma): Politoed arma e o ganho do time é medido em várias lutas (v2.65.4.1, 28/10).
  const r = run({ milestone: 3, nomes: ["Politoed", "Kingdra", "Floatzel", "Ludicolo", "Swampert", "Gyarados", "Scizor", "Garchomp"], comFatia: true });
  const out = r.R.montarTimePeloMotor(r.ctx, { variantes: ["ofensivo", "seguro", "sinergia"] });
  let tagsDeArmador = 0;
  out.variantes.forEach((v) => v.tags.filter((x) => x.armador).forEach((x) => {
    tagsDeArmador++;
    assert.ok(x.beneficiarios.length >= 2 && x.ganhoDoTime > 0, v.chave + " " + JSON.stringify(x));
  }));
  assert.ok(tagsDeArmador >= 1, "o caso real precisa gerar ao menos uma tag para a checagem provar algo");
});

test("wallbreaker e tanque com prova (Etapa 2, elenco do pipeline) e abstenção de quem não prova nada", () => {
  // Cresselia com build montada à mão que só faz Splash/Protect/Rest/Sleep Talk: não nocauteia nem aguenta o ritmo, por construção não prova papel.
  const r = run({ milestone: 2, nomes: ["Blissey", "Ferrothorn", "Clefable", "Dragonite", "Corviknight", "Cresselia"], builds: { Cresselia: ["Levitate", ["Splash", "Protect", "Rest", "Sleep Talk"], "Bold", [252, 0, 252, 0, 4, 0]] } });
  const out = r.R.montarTimePeloMotor(r.ctx, { variantes: ["ofensivo"] });
  const v = out.variantes[0];
  const m = (n) => v.membros.find((x) => x.nome === n);
  const wall = m("Ferrothorn").papeis.find((p) => p.papel === "wallbreaker");
  assert.ok(wall && wall.prova.nocautesEmRobustos >= 2 && wall.prova.nocautesEmRobustos * 2 >= wall.prova.nocautes, JSON.stringify(m("Ferrothorn").papeis));
  const tan = m("Blissey").papeis.find((p) => p.papel === "tanque");
  assert.ok(tan && tan.prova.confrontos >= 2 && tan.prova.exemplos.every((e) => e.turnos >= 3 && e.hpFinal >= 0.4), JSON.stringify(m("Blissey").papeis));
  // Abstenção: a Cresselia montada sem golpe de dano não prova nada. Sem papel, com o motivo, e o texto diz isso.
  assert.equal(m("Cresselia").papeis.length, 0);
  assert.match(m("Cresselia").abstencao, /nenhuma prova/);
  assert.ok(v.explicacao.some((t) => t.startsWith("Cresselia: sem papel provado")));
  // Multirrótulo: a Blissey tem DOIS papéis no mesmo time, cada um com a sua prova.
  const blis = m("Blissey").papeis.map((p) => p.papel).sort();
  assert.deepEqual([...blis], ["tanque", "wallbreaker"]);
  v.membros.forEach((x) => x.papeis.forEach((p) => assert.ok(p.prova && Object.keys(p.prova).length > 0, x.nome + " " + p.papel + " sem prova")));
});
