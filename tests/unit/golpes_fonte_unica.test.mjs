// TK-15 (29/10/2026): golpes - acertos com fonte, vocabulário cat/categoria/ef, e a fusão de move_effects.json no passo de sinergia.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { carregarRegras, lerComMutacao } from "./carregar_regras.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const flagsDaConfig = JSON.parse(readFileSync(join(RAIZ, "data", "golpes_flags_config.json"), "utf8"));
const R = carregarRegras({ milestone: 8, difficulty: "ace", levelCapMode: "more" });
const ac = (nome) => R.acertosDoGolpeDuelo(R.MOVE_ID_BY_NAME[nome]);

// D3.5: os golpes com hit_count na er-config (MoveList.textproto:734,7347,11438,15041,16057,17335) saem da tabela da CONFIG.
test("D3.5: a tabela de acertos da config espelha exatamente o hit_count da er-config (data/golpes_flags_config.json)", () => {
  assert.deepEqual({ ...R.ACERTOS_DA_CONFIG_DUELO }, flagsDaConfig.acertos);
  assert.equal(ac("Chiller"), 3);
});

// D3.5, decisão do usuário (29/10): sem hit_count na config = fica por nome, separado, esperando o battle_moves.h.
test("D3.5: Surging Strikes e Sparkling Barrage ficam em tabela própria SEM fonte, e a config ainda não os traz", () => {
  assert.deepEqual({ ...R.ACERTOS_SEM_FONTE_DUELO }, { "Surging Strikes": 3, "Sparkling Barrage": 3 });
  for (const nome of Object.keys(R.ACERTOS_SEM_FONTE_DUELO)) assert.equal(flagsDaConfig.acertos[nome], undefined, nome + " já tem fonte: sai da tabela sem fonte");
  assert.equal(ac("Surging Strikes"), 3);
  assert.equal(ac("Sparkling Barrage"), 3);
});

// D3.5: onde o efeito do dado existe, ele manda (Multi Hit 3 pela média de 2 a 5; decisoes_mecanicas.md:28).
test("D3.5: o efeito do dado ainda conta os acertos (Bullet Seed 3, Double Kick 2, Triple Kick 3)", () => {
  assert.equal(ac("Bullet Seed"), 3);
  assert.equal(ac("Double Kick"), 2);
  assert.equal(ac("Triple Kick"), 3);
});

// D3.4: "categoria" é o grupo por palavra (mordida/corte/soco) e "cat" fica só para a divisão F/E/S; o filtro de status usa "categoria".
test("D3.4: o filtro de status por palavra do golpe se chama 'categoria' (não 'cat', que é F/E)", () => {
  const src = readFileSync(join(RAIZ, "src", "regras", "duelo.js"), "utf8");
  assert.ok(/filtro\.categoria = "mordida"/.test(src));
  assert.ok(!/filtro\.cat\b/.test(src), "sobrou filtro.cat com o sentido antigo");
  assert.ok(!/\bvar cat = typeof MOVE_CATEGORIAS/.test(src), "a variável do dado do golpe voltou a se chamar cat");
});

// D3.1 (fundido em 29/10): move_effects.json deixou de existir; o efeito do golpe é calculado dentro de compute_condition_move_synergy.ps1.
test("D3.1: nenhum arquivo move_effects.json nem compute_move_effects.ps1; ninguém depende do intermediário", () => {
  assert.ok(!existsSync(join(RAIZ, "data/move_effects.json")), "data/move_effects.json voltou");
  assert.ok(!existsSync(join(RAIZ, "scripts/compute_move_effects.ps1")), "compute_move_effects.ps1 voltou");
  const consumidor = lerComMutacao("scripts/compute_condition_move_synergy.ps1", "compute_condition_move_synergy.ps1");
  assert.ok(!consumidor.includes("move_effects.json"), "o passo voltou a ler o intermediário move_effects.json");
  assert.ok(consumidor.includes("function Get-MoveEffects"), "o passo deixou de calcular os efeitos sozinho");
  assert.ok(!readFileSync(join(RAIZ, "scripts/build.ps1"), "utf8").includes("compute_move_effects"), "build.ps1 voltou a chamar compute_move_effects");
  for (const dir of ["src/regras", "src/ui"]) {
    for (const f of readdirSync(join(RAIZ, dir))) {
      if (!/\.(js|mjs|html)$/.test(f)) continue;
      assert.ok(!readFileSync(join(RAIZ, dir, f), "utf8").includes("move_effects"), dir + "/" + f + " passou a ler move_effects.json");
    }
  }
});
