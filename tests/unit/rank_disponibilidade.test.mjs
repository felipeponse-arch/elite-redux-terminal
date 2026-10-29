// Depende de dado: rank/lutas (muda quando o rank é recalculado; não é regra de jogo fixa).
// Rank v2, ponto 3: data/rank_disponibilidade.json (gerado por scripts/gerar_rank_disponibilidade.mjs
// a partir da planilha + código oficial). O gerador precisa do er-repo, que não vive no projeto;
// estes testes travam o RESULTADO e as regras que ele promete.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const D = JSON.parse(readFileSync(new URL("../../data/rank_disponibilidade.json", import.meta.url), "utf8"));
const REGRAS = JSON.parse(readFileSync(new URL("../../data/disponibilidade_regras.json", import.meta.url), "utf8"));
const ULTIMA_LUTA = JSON.parse(readFileSync(new URL("../../data/levelcaps.json", import.meta.url), "utf8")).rows.length - 2;

test("toda espécie tem etapa da run (0..última luta) ou null com motivo", () => {
  for (const sp of R.SPECIES) {
    if (!sp) continue;
    const e = D.etapa[sp.sname];
    assert.ok(sp.sname in D.etapa, sp.sname + " sumiu do arquivo");
    if (e === null) assert.ok(["pos-jogo", "dexnav", "sem-fonte"].includes(D.motivoFora[sp.sname]), sp.sname + " fora sem motivo");
    else assert.ok(Number.isInteger(e) && e >= 0 && e <= ULTIMA_LUTA, sp.sname + " etapa " + e);
  }
});

test("presente de pós-jogo no código fica fora, mesmo com 'Mystery Gift' na planilha", () => {
  for (const s of ["SPECIES_ZACIAN", "SPECIES_TERAPAGOS", "SPECIES_ETERNATUS"]) {
    assert.equal(D.etapa[s], null, s);
    assert.equal(D.motivoFora[s], "pos-jogo", s);
  }
});

test("presente por insígnia entra na etapa da insígnia (quando é a única fonte)", () => {
  assert.equal(D.etapa.SPECIES_GRENINJA_BATTLE_BOND, 4); // FLAG_BADGE04_GET
  assert.equal(D.etapa.SPECIES_FLOETTE_ETERNAL_FLOWER, 6); // FLAG_BADGE06_GET
});

test("Mega nunca antes da etapa da pedra", () => {
  let vistas = 0;
  for (const sp of R.SPECIES) {
    if (!sp || !/MEGA/.test(sp.sname) || D.etapa[sp.sname] === null || D.etapa[sp.sname] === undefined) continue;
    if (!R.isMegaForm(sp)) continue;
    vistas++;
    assert.ok(D.etapa[sp.sname] >= R.etapaDaMega(sp), sp.sname + " antes da pedra");
  }
  assert.ok(vistas > 50, "poucas Megas conferidas: " + vistas);
});

test("equipamento segue o código oficial (cada regra cita a fonte)", () => {
  assert.equal(REGRAS.equipamento.surf.etapa, 5);
  assert.equal(REGRAS.equipamento.rockSmash.etapa, 3);
  assert.equal(REGRAS.equipamento.superRod.etapa, 6);
  for (const [nome, r] of Object.entries(REGRAS.equipamento)) assert.match(r.fonte, /\.(pory|c)/, nome + " sem fonte");
  assert.deepEqual(REGRAS.varaDaVaga.goodRod, [2, 3, 4]);
});

test("versão das fontes registrada (commit do er-repo e data da planilha)", () => {
  assert.match(D.versaoDasFontes.erRepo, /^[0-9a-f]{40}$/);
  assert.ok(D.versaoDasFontes.planilha);
});
