// Parte 4 de 4 de time_pelo_motor_papeis.test.mjs (dividido em 06/11/2026 para rodar em paralelo; ver tests/pesados.json).
// Modo Motor do Meu Time, Fase D (ticket time-pelo-motor/01, 21/10/2026): papéis por build, tags, sinergia e explicação.
// Dado real (espécies, lutas e níveis da run). Cada papel tem um caso real em que a prova fecha e um em que ela NÃO fecha
// (o golpe está na build mas o simulador não mostra o efeito). Teste que protege comportamento não se afrouxa para passar.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { carregarRegras } from "./carregar_regras.mjs";

const igual = (a, b, msg) => assert.equal(JSON.stringify(a), JSON.stringify(b), msg);

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

// ---------- papéis: prova fecha ----------

// ---------- tags e a 3ª variante ----------
const POOL_CLIMA = ["Politoed", "Ludicolo", "Kingdra", "Swampert", "Floatzel", "Gyarados", "Scizor", "Garchomp", "Metagross", "Togekiss", "Pelipper", "Torkoal", "Charizard", "Venusaur", "Lilligant"];
// As 3 variantes usam um pool sem Politoed/Pelipper/Charizard: com a precisão corrigida (mecanica-01: Skill Link/Pinnacle Blade deixaram de "sempre acertar"; Plasma Lamp x1,2),
// a chuva do Politoed passou a render mais que o sol no pool completo e a sinergia escolhe a chuva. Aqui o sol é a única armação (Charizard seria o 2º beneficiário do sol e tira o Togekiss).
// ---------- explicação, legado e tempo ----------
// Sol e chuva são a mesma sinergia, medida da mesma forma, cada uma no pool do seu tipo de beneficiário (regra do usuário, 22/10/2026):
// nadadores de chuva perdem no sol e poluem a medida do sol, e vice-versa. Com a fatia, as duas precisam sair com prova medida.
// Lutas de prova: no máximo 5 (teste rápido); escolhidas onde o clima muda o resultado do time (medido 22/10: sol Norman 1 4 vs 3, Archie 13,7 vs 5; chuva Wattson 1 5,23 vs 4, Glacia 1,46 vs 0,44).
// Os 3 casos que o juiz com a fatia mudou (21/10): os papéis são da BUILD e da ordem do time na luta, não do juiz. Com a fatia, Ferrothorn,
// Blissey e Clefable seguem com os mesmos papéis e provas; só a Mandibuzz mudou (de abstenção para "revenge killer") porque o time saiu em
// outra ordem (o juiz escolhe a ordem) e a prova de revenge killer depende de quem entra depois do nocaute. O invariante abaixo vale nos dois juízes.
const clima = run({ milestone: 3, nomes: POOL_CLIMA });
const sol = run({ milestone: 3, nomes: POOL_CLIMA.filter((n) => !["Politoed", "Pelipper", "Charizard"].includes(n)) });
const tresVariantes = sol.R.montarTimePeloMotor(sol.ctx, { variantes: ["ofensivo", "seguro", "sinergia"] });
const porChave = (k) => tresVariantes.variantes.find((v) => v.chave === k);

test("risco 9: o papel legado da espécie (SPECIES_ROLE, ficha, builds, prompt) não muda; o classificador novo é paralelo", () => {
  const { R } = clima;
  const antes = JSON.stringify(R.SPECIES_ROLE), rotulos = JSON.stringify(R.ROLE_LABEL_PT);
  const arquivo = readFileSync(new URL("../../data/species_role.json", import.meta.url), "utf8");
  igual(JSON.parse(arquivo), JSON.parse(antes), "o dado carregado é o arquivo");
  R.montarTimePeloMotor(clima.ctx, { variantes: ["sinergia"] }); // roda tudo de novo (cache quente)
  assert.equal(JSON.stringify(R.SPECIES_ROLE), antes, "montar o time não pode mexer no papel legado");
  assert.equal(JSON.stringify(R.ROLE_LABEL_PT), rotulos);
  // O módulo novo nem lê o legado: nenhum caminho dele pode regredir por causa daqui.
  const src = readFileSync(new URL("../../src/regras/time_pelo_motor.js", import.meta.url), "utf8");
  assert.ok(!/SPECIES_ROLE|ROLE_LABEL_PT|species_role/.test(src.replace(/\/\/.*$/gm, "")), "o código (fora dos comentários) lê o papel legado");
  // Os campos novos têm nome próprio (papeis, não papel/roles) e o consumidor legado segue devolvendo a lista da espécie.
  porChave("sinergia").membros.forEach((m) => { assert.ok(Array.isArray(m.papeis)); assert.ok(!("papel" in m) && !("roles" in m)); });
  const sn = R.SPECIES.find((s) => s && s.n === "Garchomp").sname;
  assert.ok(Array.isArray(R.SPECIES_ROLE[sn].roles) && R.SPECIES_ROLE[sn].roles.length > 0);
});

test("suporte: Sleep Powder e Leech Seed do Venusaur valem pontos contra Archie (Etapa 2); só entra a utilidade, não o dano nem o setup", () => {
  const r = run({ milestone: 2, nomes: ["Venusaur", "Breloom", "Clefable", "Garchomp", "Metagross", "Gyarados"], builds: {
    Venusaur: ["Overgrow", ["Sleep Powder", "Giga Drain", "Sludge Bomb", "Leech Seed"], "Modest", [0, 0, 0, 252, 4, 252]],
    Breloom: ["Technician", ["Spore", "Mach Punch", "Seed Bomb", "Bullet Seed"], "Jolly", [0, 252, 0, 0, 4, 252]],
    Clefable: ["Magic Guard", ["Thunder Wave", "Moonblast", "Soft-Boiled", "Encore"], "Bold", [252, 0, 252, 0, 4, 0]] } });
  const time = r.cand(["Venusaur", "Breloom", "Clefable"]).filter((c) => c.sp.x === c.base.x);
  assert.equal(time.length, 6);
  const cl = r.R.motorClassificar(r.ctx, time);
  const sup = papeisDe(cl, "Venusaur").find((p) => p.papel === "suporte");
  assert.ok(sup, JSON.stringify(papeisDe(cl, "Venusaur")));
  assert.ok(sup.prova.exemplos.every((e) => e.pontos >= 1));
  // A prova é o contrafactual: o time com a build dele sem os golpes de utilidade, na mesma luta.
  const luta = r.ctx.lutas.amostra.find((l) => l.nome === sup.prova.exemplos[0].luta);
  const v = time.find((c) => c.nome === "Venusaur");
  assert.equal(r.R.motorDeltaSemTipos(r.ctx, time, v, luta, r.R.MOTOR_TIPOS_DE_UTILIDADE), sup.prova.exemplos[0].pontos);
});

test("risco 8: ter o golpe NÃO dá o papel (setup sem ganho medido, U-turn sem prova de pivô, Toxic/Haze/Recover sem efeito na amostra)", () => {
  const r = run({ milestone: 2, nomes: ["Garchomp", "Scizor", "Toxapex", "Metagross", "Gyarados", "Blissey"], builds: {
    Garchomp: ["Rough Skin", ["Swords Dance", "Earthquake", "Outrage", "Stone Edge"], "Jolly", [0, 252, 0, 0, 4, 252]],
    Scizor: ["Technician", ["U-turn", "Bullet Punch", "Swords Dance", "Roost"], "Adamant", [0, 252, 0, 0, 4, 252]],
    Toxapex: ["Regenerator", ["Toxic", "Scald", "Recover", "Haze"], "Bold", [252, 0, 252, 0, 4, 0]] } });
  const cands = r.cand(["Garchomp", "Scizor", "Toxapex"]).filter((c) => c.sp.x === c.base.x);
  const time = cands.slice(0, 6);
  const cl = r.R.motorClassificar(r.ctx, time); // amostra padrão da Etapa 2: nenhuma luta em que a utilidade do Toxapex pese
  ["Garchomp", "Scizor", "Toxapex"].forEach((n) => {
    const m = cl.membros.find((x) => x.nome === n);
    ["sweeper", "pivô", "pivo", "suporte"].forEach((p) => assert.ok(!m.papeis.some((x) => x.papel === p), n + " ganhou " + p + " só por ter o golpe"));
  });
  // O Garchomp tem sequência de nocautes mas o setup não rende ponto na luta completa: o rótulo some, o número fica no log medido.
  assert.ok(cl.membros.every((m) => m.papeis.every((p) => p.papel !== "pivô")));
  assert.ok(cl.naoMedidos.some((t) => /pivô/.test(t)), "o pivô é declarado como não medido");
});
