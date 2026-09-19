// Testes com save-shapes ALEATÓRIOS (não fixtures escolhidas à mão) - gap
// real que a QA já tinha identificado (ver [[project-elite-redux-team-roster]]):
// "generate random-but-valid save shapes and assert the app never crashes,
// which would have caught classes of bug the fixed fixtures structurally
// can't". Diferente do smoke_test_suite.js (que testa comportamentos
// ESPECÍFICOS com dados escolhidos à mão), isto gera MUITAS variações de
// save aleatórias - tamanhos de time/caixa fora do normal, snames
// desconhecidos, configurações inválidas - e só confirma uma coisa: o app
// nunca quebra (tela branca, exceção não tratada) ao carregar qualquer uma
// delas. Precisa rodar via Playwright (não dentro do smoke_test_suite.js)
// porque cada iteração precisa de um reload de página de verdade -
// loadSave() só roda uma vez, na carga inicial.
import { chromium } from "playwright";

const BASE_URL = process.env.CI_SMOKE_BASE_URL || "http://localhost:8100";
const ITERATIONS = Number(process.env.FUZZ_ITERATIONS || 30);
const SERVER_WAIT_TIMEOUT_MS = 30000;
const SERVER_WAIT_INTERVAL_MS = 500;

// PRNG determinístico (mulberry32) - uma falha é reproduzível citando só a
// seed, sem precisar salvar o save gerado inteiro pra debugar depois.
function makeRng(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomSaveShape(allSnames, rng) {
  function pick(arr) { return arr[Math.floor(rng() * arr.length)]; }
  function randInt(min, max) { return min + Math.floor(rng() * (max - min + 1)); }

  // De propósito fora dos limites normais às vezes (time >6, caixa enorme,
  // milestone negativo/absurdo, dificuldade que não existe) - o objetivo é
  // achar o que uma fixture escolhida à mão nunca exercitaria.
  const teamSize = randInt(0, 8);
  const team = [];
  for (let i = 0; i < teamSize; i++) team.push(pick(allSnames));
  if (rng() < 0.3) team.push("SPECIES_TOTALMENTE_INVENTADA_" + randInt(0, 999));

  const boxSize = randInt(0, 40);
  const box = [];
  for (let i = 0; i < boxSize; i++) box.push(pick(allSnames));
  if (rng() < 0.3) box.push("SPECIES_TOTALMENTE_INVENTADA_" + randInt(0, 999));

  const difficulties = ["easy", "ace", "elite", "dificuldade_que_nao_existe", "", null];
  const customBuilds = {};
  if (rng() < 0.5 && team.length) {
    const targetSname = pick(team);
    customBuilds[targetSname] = [{
      ability: rng() < 0.5 ? "Habilidade Inventada" : "",
      nature: pick(["Adamant", "Modest", "", "Nature Que Nao Existe"]),
      item: rng() < 0.5 ? "" : "Item Qualquer",
      moves: [pick(["Tackle", ""]), "", "", ""],
      evs: [randInt(-10, 300), randInt(-10, 300), randInt(-10, 300), randInt(-10, 300), randInt(-10, 300), randInt(-10, 300)],
      source: pick(["manual", "ia", "campo_desconhecido"])
    }];
  }
  const notes = {};
  if (rng() < 0.5 && box.length) notes[pick(box)] = "nota de teste gerada por fuzz " + rng();

  return {
    v: 2,
    team,
    box,
    savedTeams: [],
    settings: { difficulty: pick(difficulties), milestone: randInt(-2, 15) },
    dataVersion: "fuzz-test",
    savedAt: new Date().toISOString(),
    customBuilds,
    notes,
    archetype: { pace: pick([null, "Hyper Offense", "Ritmo Que Nao Existe"]), weather: null, reasoning: "" }
  };
}

async function waitForServer(url) {
  const start = Date.now();
  while (Date.now() - start < SERVER_WAIT_TIMEOUT_MS) {
    try {
      const resp = await fetch(url);
      // Lê o corpo inteiro: o dev_server.ps1 atende UMA requisição por vez, e
      // uma resposta de 5,6 MB deixada sem ler trava o servidor escrevendo nela
      // - a navegação do navegador logo depois nunca era atendida (CI #1
      // morreu assim, page.goto em timeout de 30s, no Node 20 do GitHub).
      await resp.arrayBuffer();
      if (resp.ok) return;
    } catch (e) {}
    await new Promise((r) => setTimeout(r, SERVER_WAIT_INTERVAL_MS));
  }
  throw new Error(`Servidor não respondeu em ${url} depois de ${SERVER_WAIT_TIMEOUT_MS}ms`);
}

async function main() {
  console.log(`Esperando o dev server em ${BASE_URL}...`);
  await waitForServer(`${BASE_URL}/artifact_final.html`);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  let pageErrors = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));

  await page.goto(`${BASE_URL}/artifact_final.html`, { waitUntil: "load" });
  const allSnames = await page.evaluate(() => {
    const dexData = JSON.parse(document.getElementById("dexdata").textContent);
    return dexData.species.filter((s) => s && s.sname).map((s) => s.sname);
  });
  console.log(`${allSnames.length} espécies reais carregadas pra sortear os saves.`);

  const failures = [];
  const baseSeed = Number(process.env.FUZZ_SEED || Date.now());
  for (let i = 0; i < ITERATIONS; i++) {
    const seed = baseSeed + i;
    const rng = makeRng(seed);
    const save = randomSaveShape(allSnames, rng);

    pageErrors = [];
    await page.evaluate((saveJson) => {
      localStorage.setItem("er_terminal_save", saveJson);
    }, JSON.stringify(save));
    await page.reload({ waitUntil: "load" });
    await page.waitForTimeout(250);

    const state = await page.evaluate(() => ({
      bodyText: document.body.innerText.slice(0, 300),
      tabsExist: !!document.querySelector(".tab-btn"),
    }));
    const crashed = !state.tabsExist || state.bodyText.trim().length === 0 || pageErrors.length > 0;
    if (crashed) {
      failures.push({ seed, errors: pageErrors.slice(), bodyText: state.bodyText, save });
    }
  }

  // ---- save genuinamente CORROMPIDO (não é um shape aleatório-mas-válido
  // como os de cima - é texto que nem chega a ser JSON) - achado em
  // auditoria, 2026-09-18, item 7 (bug P0): antes disto, isso caía direto
  // pro seed de exemplo, que persist() já sobrescrevia a chave corrompida
  // na mesma passagem - perda de progresso 100% silenciosa. Roda aqui (não
  // no smoke_test_suite.js) pelo mesmo motivo do resto do arquivo: precisa
  // de reload de verdade, loadSave() só roda uma vez. ----
  let corruptedSaveOk = true;
  let corruptedSaveDetail = "";
  try {
    await page.evaluate(() => {
      localStorage.removeItem("er_terminal_save_corrupted_backup");
      localStorage.setItem("er_terminal_save", "{isto nao eh json valido de jeito nenhum");
    });
    pageErrors = [];
    await page.reload({ waitUntil: "load" });
    await page.waitForTimeout(250);
    const result = await page.evaluate(() => ({
      bannerVisivel: !document.getElementById("storage-banner").hidden,
      textoBanner: document.getElementById("storage-banner-text").textContent,
      backup: localStorage.getItem("er_terminal_save_corrupted_backup"),
      saveNovoEhJsonValido: (() => { try { JSON.parse(localStorage.getItem("er_terminal_save")); return true; } catch (e) { return false; } })(),
      tabsExist: !!document.querySelector(".tab-btn"),
    }));
    corruptedSaveOk = result.bannerVisivel && result.textoBanner.indexOf("corrompido") !== -1 &&
      result.backup === "{isto nao eh json valido de jeito nenhum" && result.saveNovoEhJsonValido &&
      result.tabsExist && pageErrors.length === 0;
    corruptedSaveDetail = JSON.stringify({ ...result, pageErrors });
  } catch (e) {
    corruptedSaveOk = false;
    corruptedSaveDetail = String(e);
  }
  console.log(corruptedSaveOk
    ? "=== save corrompido (não-JSON): banner avisou, backup foi guardado, app recuperou sem crash ==="
    : `=== FALHA no teste de save corrompido: ${corruptedSaveDetail} ===`);
  if (!corruptedSaveOk) process.exitCode = 1;

  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await browser.close();

  console.log(`\n=== fuzz de save shapes: ${ITERATIONS - failures.length}/${ITERATIONS} não quebraram ===\n`);
  if (failures.length) {
    console.error(`${failures.length} save(s) aleatório(s) quebraram o app:\n`);
    for (const f of failures) {
      console.error(`  - seed ${f.seed}`);
      if (f.errors.length) console.error(`    erros: ${JSON.stringify(f.errors)}`);
      console.error(`    corpo da página: ${JSON.stringify(f.bodyText)}`);
      console.error(`    save usado: ${JSON.stringify(f.save)}`);
    }
    process.exitCode = 1;
  } else {
    console.log("Nenhum save aleatório quebrou o app.");
  }
}

main().catch((err) => {
  console.error("Falha ao rodar o fuzz de save shapes:", err);
  process.exitCode = 1;
});
