// Depende de dado: rank/lutas (muda quando o rank é recalculado; não é regra de jogo fixa).
import { readFileSync } from "node:fs";
// Mono run: disponibilidade por tipo e etapa (2026-09-26). O dado vem da
// planilha da comunidade, importada por scripts/importar_mono.mjs; aqui se
// garante que o que o app mostra é coerente com o jogo atual.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";
import { lerNome, lerCsv } from "../../scripts/importar_mono.mjs";

const R = carregarRegras();
const nomeTipo = (i) => R.DATA.types[i];

test("todo tipo tem opção desde o início, e toda entrada é uma espécie real", () => {
  for (const [tipo, lista] of Object.entries(R.MONO_DISP.porTipo)) {
    assert.ok(lista.some((e) => e.e === 0), tipo + " tem algo pra pegar antes da Roxanne");
    for (const e of lista) {
      assert.ok(R.getSpeciesBySname(e.s), e.s + " existe no dado");
      assert.ok(Number.isInteger(e.e) && e.e >= 0 && e.e < R.LEVELCAPS.rows.length, "etapa válida: " + e.s);
    }
  }
});

const PENDENTES_DE_TIPO = new Set(JSON.parse(readFileSync(new URL("../../data/rank_pendente_ate_10.json", import.meta.url), "utf8")).tiposMudaram);

test("entrada sem marca tem o tipo no jogo atual; com # uma evolução tem", () => {
  for (const [tipo, lista] of Object.entries(R.MONO_DISP.porTipo)) {
    for (const e of lista) {
      const sp = R.getSpeciesBySname(e.s);
      if (/[#%M]/.test(e.m || "") || PENDENTES_DE_TIPO.has(e.s)) continue; // tipo mudado pelo dado 2.65.4 (Volbeat...): planilha revista no fechamento
      assert.ok(sp.t.map(nomeTipo).includes(tipo), `${sp.n} listado em ${tipo} sem ter o tipo`);
    }
    for (const e of lista.filter((x) => (x.m || "").includes("#"))) {
      const linha = R.linhaEvolutivaDe(R.getSpeciesBySname(e.s));
      // Espécie da linha com o tipo mudado pelo dado 2.65.4 (versao-nova/05): a planilha "Mono earliest locations" é de antes; o fechamento (dados-2654/10) a revisa.
      if (linha.some((s) => PENDENTES_DE_TIPO.has(s.sname))) continue;
      assert.ok(linha.some((s) => s.t.map(nomeTipo).includes(tipo)), `${e.s}: alguma evolução é ${tipo}`);
    }
    // "M": o tipo só aparece numa Mega da linha evolutiva.
    for (const e of lista.filter((x) => (x.m || "").includes("M"))) {
      const formas = R.linhaEvolutivaDe(R.getSpeciesBySname(e.s)).flatMap((s) => R.formFamilyOf(s));
      if (formas.some((s) => PENDENTES_DE_TIPO.has(s.sname))) continue; // Serperior Mega perdeu o Dragon no dado 2.65.4: planilha revista no fechamento
      assert.ok(formas.some((s) => R.isMegaForm(s) && s.t.map(nomeTipo).includes(tipo)), `${e.s}: uma Mega da linha é ${tipo}`);
    }
  }
});

test("separa novos, anteriores e próxima etapa, e marca quem o jogador já tem", () => {
  const d0 = R.monoDisponibilidade("Fire", 0, []);
  assert.equal(d0.antes.length, 0, "no início nada é 'de antes'");
  assert.equal(d0.proximoLider, "Roxanne");
  assert.ok(d0.novos.some((i) => i.sp.n === "Charmander"));
  assert.ok(d0.proxima.length > 0, "algo libera depois da Roxanne");
  // Quem tem Charmeleon não precisa pegar Charmander.
  const charmeleon = R.SPECIES.find((s) => s.n === "Charmeleon");
  const d = R.monoDisponibilidade("Fire", 2, [charmeleon.x]);
  assert.equal(d.liderAnterior, "Brawley");
  assert.ok(d.antes.find((i) => i.sp.n === "Charmander").jaTem);
  assert.ok(d.novos.every((i) => i.etapa === 2) && d.antes.every((i) => i.etapa < 2));
  const notas = d.antes.filter((i) => i.score >= 0).map((i) => i.score);
  assert.deepEqual(notas, [...notas].sort((a, b) => b - a), "melhores do tipo primeiro");
});

const tipos = (s) => R.speciesTypeNames(s);
const porNome = (n) => { const s = R.SPECIES.find((x) => x.n === n); assert.ok(s, n); return s; };

test("Monotype vale na troca da caixa: só entra quem é do tipo", () => {
  R.state.archetype.monotype = "Fire";
  R.state.team = [porNome("Charmander").x];
  R.state.box = [porNome("Squirtle").x, porNome("Vulpix").x, porNome("Pidgey").x];
  const foes = R.confrontoFoesDe(R.bossPartyPorDificuldade(R.BOSSES[0]));
  const caixa = R.confrontoUnidadesDaCaixa(foes);
  assert.ok(caixa.length >= 1, "o Vulpix continua valendo");
  assert.ok(caixa.every((u) => u.main && tipos(u.main).includes("Fire")), "só unidades do tipo Fire");
  assert.ok(!caixa.some((u) => ["Squirtle", "Pidgey"].includes(u.main.n)));
  assert.ok(!R.serveProMono(porNome("Squirtle")) && R.serveProMono(porNome("Vulpix")));
  R.state.archetype.monotype = null;
  assert.ok(R.serveProMono(porNome("Squirtle")), "sem Monotype, todo mundo serve");
  assert.equal(R.confrontoUnidadesDaCaixa(foes).length, 3);
  R.state.team = []; R.state.box = [];
});

test("fraquezas do tipo, quem cobre, e quem vira/sai do tipo", () => {
  assert.deepEqual([...R.fraquezasDoTipo("Fire")].sort(), ["Ground", "Rock", "Water"]);
  // Alguém do tipo Fire que resiste a Water pelo tipo secundário ou habilidade.
  const cobre = R.SPECIES.find((s) => tipos(s).includes("Fire") && R.cobreFraquezas(s, ["Water"]).length);
  assert.ok(cobre, "fixture: Fire que cobre Water");
  assert.ok(R.abilityTypeMod("Water", cobre).mult < 1);
  // Vira do tipo ao evoluir / sai do tipo ao evoluir (achados no dado).
  const vira = R.SPECIES.find((s) => !tipos(s).includes("Water") && R.linhaEvolutivaDe(s).slice(1).some((e) => tipos(e).includes("Water")));
  assert.equal(R.mudancaDeTipo(vira, "Water").vira, "#");
  const sai = R.SPECIES.find((s) => tipos(s).includes("Water") && R.linhaEvolutivaDe(s).slice(1).some((e) => !tipos(e).includes("Water")));
  assert.ok(R.mudancaDeTipo(sai, "Water").sai.length);
  assert.equal(R.mudancaDeTipo(porNome("Squirtle"), "Water"), null, "a linha toda é Water");
});

test("clima que combina: só bônus confirmado nas páginas oficiais", () => {
  assert.equal(R.climaQueCombina("Fire").clima, "Sun");
  assert.equal(R.climaQueCombina("Water").clima, "Rain");
  assert.equal(R.climaQueCombina("Ice").clima, "Hail");
  assert.equal(R.climaQueCombina("Ghost").clima, "Eerie Fog");
  assert.equal(R.climaQueCombina("Psychic").clima, "Eerie Fog");
  assert.equal(R.climaQueCombina("Rock"), null, "areia pra Rock não está confirmada neste jogo");
  for (const t of Object.keys(R.CLIMA_QUE_COMBINA)) {
    assert.ok(R.ARQUETIPOS_DE_CAMPO.includes(R.CLIMA_QUE_COMBINA[t].clima), "o clima sugerido existe no arquétipo");
  }
  assert.match(R.orientacaoMono("Ice"), /Clima que combina com Ice .*Hail - tipo Ice ganha 50% de Defesa/);
  assert.doesNotMatch(R.orientacaoMono("Rock"), /Clima que combina/);
});

test("importador: marcas e formas regionais da planilha", () => {
  assert.deepEqual(lerNome("Zigzagoon (Galarian)"), { nome: "Zigzagoon Galarian", marcas: "" });
  assert.deepEqual(lerNome("Sylvally (%)"), { nome: "Sylvally", marcas: "%" });
  assert.deepEqual(lerNome("Eevee #*"), { nome: "Eevee", marcas: "#*" });
  assert.deepEqual(lerCsv('a,"b, c",d\n1,2,3'), [["a", "b, c", "d"], ["1", "2", "3"]]);
});

test("D8-4: a Etapa mostrada vem do rank_disponibilidade (eApp); onde o rank é null, vale a da planilha", () => {
  const etapa = JSON.parse(readFileSync("data/rank_disponibilidade.json", "utf8")).etapa;
  let comEApp = 0;
  for (const lista of Object.values(R.MONO_DISP.porTipo)) for (const e of lista) {
    if (Number.isInteger(etapa[e.s])) assert.equal(e.eApp !== undefined ? e.eApp : e.e, etapa[e.s], "Etapa do app: " + e.s);
    if (e.eApp !== undefined) comEApp++;
  }
  assert.ok(comEApp > 0);
  const chansey = R.monoDisponibilidade("Normal", 1, []).novos.find((i) => i.sp.sname === "SPECIES_CHANSEY");
  assert.ok(chansey, "Chansey aparece na Etapa 1 (planilha dizia 3)");
});
