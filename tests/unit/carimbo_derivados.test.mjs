// Depende de dado: rank/lutas/chefões (lê os derivados gravados; muda quando eles são regerados).
// TK-24: todo derivado gerado (rank, lutas comuns, chefões) deixa carimbo de versão/frescor em
// data/carimbo_derivados.json, copiado de data/carimbo_dados.json no momento da geração.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { lerComMutacao } from "./carregar_regras.mjs";
import { carimbarDerivado } from "../../scripts/carimbo_derivado.mjs";

// Módulo recarregado a partir do texto (com a sabotagem aplicada, se houver) para as funções de frescor.
const { avisosDeFrescor, problemasDeCarimbo, PENDENTES_DO_GERADOR } = await import(
  "data:text/javascript;base64," + Buffer.from(lerComMutacao("scripts/carimbo_derivado.mjs", "carimbo_derivado.mjs")).toString("base64"));

test("carimbarDerivado copia jogo/er-repo/er-config/data do carimbo dos dados", () => {
  const d = mkdtempSync(join(tmpdir(), "carimbo-"));
  const origem = join(d, "carimbo_dados.json"), saida = join(d, "carimbo_derivados.json");
  writeFileSync(origem, JSON.stringify({ jogo: "v9", "er-repo": "abc", "er-config": "def", data: "2026-10-27" }));
  carimbarDerivado("species_rank.json", { origem, saida, hoje: "2026-10-28" });
  carimbarDerivado("bosses.json", { origem, saida, hoje: "2026-10-28" });
  const r = JSON.parse(readFileSync(saida, "utf8"));
  assert.deepEqual(r["species_rank.json"], { jogo: "v9", "er-repo": "abc", "er-config": "def", dadosDe: "2026-10-27", geradoEm: "2026-10-28" });
  assert.ok(r["bosses.json"], "segunda chamada preserva a primeira entrada e acrescenta a sua");
});

test("os geradores de rank, lutas comuns e chefões chamam carimbarDerivado", () => {
  const rank = lerComMutacao("scripts/calcular_rank_v2.mjs", "calcular_rank_v2.mjs");
  assert.match(rank, /carimbarDerivado\("species_rank\.json"\)/);
  assert.match(rank, /carimbarDerivado\("lutas_comuns_run\.json"\)/);
  assert.match(readFileSync("scripts/extracao/chefoes.mjs", "utf8"), /carimbarDerivado\("bosses\.json"\)/);
});

test("todo data/*.json derivado tem entrada no registro de carimbos", () => {
  // Os 3 gerados entram no registro quando o rank/extração rodar; gameData e os carimbos têm carimbo próprio.
  const SEM_REGISTRO = ["carimbo_dados.json", "carimbo_derivados.json", "gameData.json"];
  const reg = JSON.parse(lerComMutacao("data/carimbo_derivados.json", "carimbo_derivados.json"));
  const faltam = readdirSync("data").filter((f) => f.endsWith(".json") && !SEM_REGISTRO.includes(f) && !PENDENTES_DO_GERADOR.includes(f) && !reg[f]);
  assert.deepEqual(faltam, []);
});

const CARIMBO = { data: "2026-10-27" };

test("frescor: derivado com dadosDe anterior à data dos dados gera aviso; igual ou manual não", () => {
  const reg = { "a.json": { dadosDe: "2026-10-01" }, "b.json": { dadosDe: "2026-10-27" }, "c.json": { manual: true, curadoriaEm: "2026-01-01" } };
  const av = avisosDeFrescor(reg, CARIMBO);
  assert.equal(av.length, 1);
  assert.match(av[0], /a\.json/);
});

test("frescor e pendentes: aviso sempre, barra só com publicar", () => {
  const reg = { "a.json": { dadosDe: "2026-10-01" }, ...Object.fromEntries(PENDENTES_DO_GERADOR.map((f) => [f, { dadosDe: "2026-10-27" }])) };
  assert.equal(problemasDeCarimbo(reg, CARIMBO, false).barra, false);
  assert.equal(problemasDeCarimbo(reg, CARIMBO, true).barra, true);
  assert.equal(problemasDeCarimbo({ ...reg, "a.json": { dadosDe: "2026-10-27" } }, CARIMBO, true).barra, false);
  // pendente sem entrada (isenção do gerador não é eterna): avisa, e barra na publicação
  const sem = problemasDeCarimbo({}, CARIMBO, true);
  assert.equal(sem.avisos.length, PENDENTES_DO_GERADOR.length);
  assert.equal(sem.barra, true);
});

test("o build chama o checador de carimbos", () => {
  assert.match(lerComMutacao("scripts/build.mjs", "build.mjs"), /problemasDeCarimbo\([\s\S]*if \(barra\) falhar\(/);
});
