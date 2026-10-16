// Tela do time = melhor time no geral, sem pensar no próximo chefão (usuário, 16/10/2026). As builds do "Montar time completo"
// saem do pipeline contra o campo inteiro da run (LUTAS_DA_RUN, a régua do rank v2), não contra o próximo líder de ginásio.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const sp = (n) => R.SPECIES.find((s) => s && s.n === n);

test("alvo { campo: true }: um ás por luta da run, nenhum chefão em foco", () => {
  const r = R.candidatosDeBuild(sp("Scizor"), { alvo: { campo: true } });
  assert.equal(r.alvo.origem, "campo");
  assert.equal(r.alvo.chefao, null);
  assert.ok(r.alvo.lutas >= 25 && r.alvo.lutas <= R.LUTAS_DA_RUN.length, "lutas: " + r.alvo.lutas);
  assert.ok(r.candidatos.length > 0, "tem candidatos");
  // Não é o próximo líder: o padrão sem alvo simula só 2 Pokémon de um chefão.
  const padrao = R.candidatosDeBuild(sp("Scizor"), {});
  assert.notEqual(padrao.alvo && padrao.alvo.origem, "campo");
});

test("a escolha da IA com opts.campo usa o campo inteiro e o prompt diz isso", () => {
  const r = R.candidatosParaAEscolhaDaIa(sp("Scizor"), { timeNovo: true, campo: true });
  assert.equal(r.alvo.origem, "campo");
  assert.match(R.blocoDeCandidatosParaIA(sp("Scizor"), r), /campo inteiro da run, sem focar em nenhum chefao/);
  const doChefao = R.candidatosParaAEscolhaDaIa(sp("Scizor"), { timeNovo: true });
  assert.notEqual(doChefao && doChefao.alvo && doChefao.alvo.origem, "campo", "sem campo: comportamento antigo");
});

test("a tela do time (Montar time completo) pede as builds com campo: true", () => {
  const src = readFileSync(new URL("../../src/ui/arquetipo.js", import.meta.url), "utf8");
  assert.match(src, /gerarBuildsDoTimeComIA\(paraIA, "archetype-status", function \(\) \{ return \{ timeNovo: true, campo: true \}; \}/);
});

test("o rank v2 e a tela do time usam a MESMA lista de lutas", () => {
  const script = readFileSync(new URL("../../scripts/calcular_rank_v2.mjs", import.meta.url), "utf8");
  assert.match(script, /const LUTAS_DA_RUN = R\.LUTAS_DA_RUN;/);
  assert.equal(R.LUTAS_DA_RUN.length, 29);
});
