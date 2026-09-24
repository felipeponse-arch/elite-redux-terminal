// Saves ALEATÓRIOS (não escolhidos à mão): tamanhos de time/caixa fora do
// normal, espécies que não existem, configurações inválidas. Só confere uma
// coisa - o app nunca quebra ao carregar nenhum deles (tela branca, exceção
// não tratada). Cada save precisa de uma recarga de verdade: loadSave() só
// roda na carga.
//
// Semente: FUZZ_SEED fixa a sequência (pra reproduzir uma falha); sem ela, a
// data de hoje - todo mundo roda os mesmos saves no mesmo dia, e o conjunto
// muda de um dia pro outro. A semente aparece no nome de cada teste.
import { test, expect, abrirApp, recarregar } from "./apoio.mjs";

const ITERACOES = Number(process.env.FUZZ_ITERATIONS || 30);
const SEMENTE_BASE = Number(process.env.FUZZ_SEED || new Date().toISOString().slice(0, 10).replace(/-/g, ""));

// PRNG determinístico (mulberry32).
function geradorAleatorio(semente) {
  return function () {
    semente |= 0;
    semente = (semente + 0x6D2B79F5) | 0;
    let t = Math.imul(semente ^ (semente >>> 15), 1 | semente);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function saveAleatorio(snames, aleatorio) {
  const escolher = (lista) => lista[Math.floor(aleatorio() * lista.length)];
  const inteiro = (min, max) => min + Math.floor(aleatorio() * (max - min + 1));
  // De propósito fora dos limites às vezes (time >6, caixa enorme, marco
  // negativo, dificuldade que não existe).
  const team = Array.from({ length: inteiro(0, 8) }, () => escolher(snames));
  if (aleatorio() < 0.3) team.push("SPECIES_TOTALMENTE_INVENTADA_" + inteiro(0, 999));
  const box = Array.from({ length: inteiro(0, 40) }, () => escolher(snames));
  if (aleatorio() < 0.3) box.push("SPECIES_TOTALMENTE_INVENTADA_" + inteiro(0, 999));
  const customBuilds = {};
  if (aleatorio() < 0.5 && team.length) {
    customBuilds[escolher(team)] = [{
      ability: aleatorio() < 0.5 ? "Habilidade Inventada" : "",
      nature: escolher(["Adamant", "Modest", "", "Nature Que Nao Existe"]),
      item: aleatorio() < 0.5 ? "" : "Item Qualquer",
      moves: [escolher(["Tackle", ""]), "", "", ""],
      evs: Array.from({ length: 6 }, () => inteiro(-10, 300)),
      source: escolher(["manual", "ia", "campo_desconhecido"])
    }];
  }
  const notes = {};
  if (aleatorio() < 0.5 && box.length) notes[escolher(box)] = "nota de teste gerada por fuzz " + aleatorio();
  return {
    v: 2, team, box, savedTeams: [],
    settings: { difficulty: escolher(["easy", "ace", "elite", "dificuldade_que_nao_existe", "", null]), milestone: inteiro(-2, 15) },
    dataVersion: "fuzz-test", savedAt: new Date().toISOString(), customBuilds, notes,
    archetype: { pace: escolher([null, "Hyper Offense", "Ritmo Que Nao Existe"]), weather: null, reasoning: "" }
  };
}

async function snamesReais(page) {
  return page.evaluate(() => JSON.parse(document.getElementById("dexdata").textContent)
    .species.filter((s) => s && s.sname).map((s) => s.sname));
}

// Lotes de 10 saves por teste: cada recarga custa ~1 s, e um teste por save
// multiplicaria a abertura de navegador sem ganho.
const LOTE = 10;
for (let inicio = 0; inicio < ITERACOES; inicio += LOTE) {
  const sementes = Array.from({ length: Math.min(LOTE, ITERACOES - inicio) }, (_, i) => SEMENTE_BASE + inicio + i);
  test(`saves aleatórios, sementes ${sementes[0]}-${sementes[sementes.length - 1]}`, async ({ page, errosDaPagina }) => {
    await abrirApp(page);
    const snames = await snamesReais(page);
    for (const semente of sementes) {
      const save = saveAleatorio(snames, geradorAleatorio(semente));
      await page.evaluate((s) => localStorage.setItem("er_terminal_save", s), JSON.stringify(save));
      await recarregar(page);
      const detalhe = `semente ${semente} - rode com FUZZ_SEED=${semente} FUZZ_ITERATIONS=1 pra reproduzir. Save: ${JSON.stringify(save).slice(0, 600)}`;
      expect(errosDaPagina, detalhe).toEqual([]);
      await expect(page.locator(".tab-btn").first(), detalhe).toBeVisible();
      expect((await page.locator("body").innerText()).trim().length, detalhe).toBeGreaterThan(0);
    }
  });
}

// Save que nem é JSON (bug P0 de 2026-09-18: caía no exemplo e a gravação
// seguinte apagava o save corrompido - perda de progresso em silêncio).
test("save corrompido (não é JSON): avisa, guarda cópia e recupera", async ({ page }) => {
  const corrompido = "{isto nao eh json valido de jeito nenhum";
  await abrirApp(page);
  await page.evaluate((c) => {
    localStorage.removeItem("er_terminal_save_corrupted_backup");
    localStorage.setItem("er_terminal_save", c);
  }, corrompido);
  await recarregar(page);
  await expect(page.locator("#storage-banner")).toBeVisible();
  await expect(page.locator("#storage-banner-text")).toContainText("corrompido");
  const estado = await page.evaluate(() => ({
    copia: localStorage.getItem("er_terminal_save_corrupted_backup"),
    saveNovoValido: (() => { try { JSON.parse(localStorage.getItem("er_terminal_save")); return true; } catch { return false; } })()
  }));
  expect(estado.copia, "cópia do save corrompido guardada").toBe(corrompido);
  expect(estado.saveNovoValido, "o save novo é JSON válido").toBe(true);
  await expect(page.locator(".tab-btn").first()).toBeVisible();
});
