// Texto dos buffs de ginásio conferido contra o código do jogo (er-repo f34fc2b, src/battle_events.c; comitê 29/10, TK-33b).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ginasios = JSON.parse(readFileSync(new URL("../../data/gym_skills.json", import.meta.url), "utf8"));
const buffs = Object.values(ginasios).flatMap((g) => (g && g.buffs) || []);

test("status nos N últimos: o texto diz que só pega quem está sem status e nunca o 1º (battle_events.c:135-146)", () => {
  const nosUltimos = buffs.filter((b) => /últimos Pokémon do seu time começa/i.test(b.detail));
  assert.ok(nosUltimos.length >= 6, "buffs de status nos últimos: " + nosUltimos.length);
  for (const b of nosUltimos) assert.match(b.detail, /sem status, e nunca o 1º do time/, b.id);
});

test("Embargo da Winona: só o ativo, e o 2º em dupla (battle_events.c:351-357)", () => {
  const e = buffs.find((b) => b.id === "winona_embargo");
  assert.match(e.detail, /Pokémon ativo \(e o 2º, em luta dupla\)/);
});
