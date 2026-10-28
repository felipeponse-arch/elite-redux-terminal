// TK-27: texto da UI usa "Etapa" (GLOSSARY.md), não "marco".
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ler = (p) => readFileSync(new URL("../../" + p, import.meta.url), "utf8");

test("banner de conflito de sync diz Etapa, não marco", () => {
  const s = ler("src/ui/sync.js");
  assert.ok(!/\(marco "/.test(s));
  assert.ok(s.includes('(Etapa "'));
});
test("cabeçalho da tabela de level cap diz Etapa", () => {
  assert.ok(ler("src/ui/tipos.js").includes('rowhead">Etapa<'));
});
test("rótulo do lugar do item usa Etapa", () => {
  const s = ler("src/regras/avisos_build.js");
  assert.ok(s.includes('"Etapa " + e'));
  assert.ok(!s.includes('"ª insígnia"'));
});
test("mensagens de progresso e rótulo de Mega dizem Etapa, não insígnia", () => {
  assert.ok(ler("src/ui/progresso.js").includes("Você avançou de Etapa"));
  const t = ler("src/ui/time.js");
  assert.ok(t.includes("progresso de Etapas") && t.includes("volta a Etapa pro início"));
  const m = ler("src/regras/formas_mega.js");
  assert.ok(m.includes('4: "Etapa 4 (Flannery)"') && m.includes('7: "Etapa 7 (Tate & Liza)"'));
  assert.ok(!/ROTULO_ETAPA_MEGA = \{[^}]*ª insígnia/.test(m));
});
// Insígnia fica de propósito em aba_chefoes.js ("Depois da Nª insígnia", fato do jogo: Hell) e em comentários.
