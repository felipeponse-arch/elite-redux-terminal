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
  // TK-33b item 6: o rótulo é montado de data/pedras_etapa.json (lideres); o valor final é testado em etapa_mega_fonte_unica.test.mjs
  const pe = ler("data/pedras_etapa.json");
  assert.ok(pe.includes('"4": "Flannery"') && pe.includes('"7": "Tate & Liza"'));
  assert.ok(m.includes('"Etapa " + et + " ("') && !/ROTULO_ETAPA_MEGA\[[^\]]*\] = [^;]*ª insígnia/.test(m));
});
// Insígnia fica de propósito em aba_chefoes.js ("Depois da Nª insígnia", fato do jogo: Hell) e em comentários.
