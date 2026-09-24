// Sincronização entre dispositivos (claude.use("db")) - item 20 da auditoria
// de 2026-09-18: era o código mais complexo de merge de estado do app (2
// bugs reais já achados e corrigidos, 2026-09-11 e 2026-09-13) e tinha ZERO
// cobertura automatizada em qualquer lugar - os outros arquivos de smoke
// test só registram em comentário "não dá pra testar neste ambiente de dev
// server".
//
// Por que um script PRÓPRIO (não dentro de smoke_test_suite.js): connectSync()
// roda uma única vez, de forma síncrona, assim que o <script> principal
// carrega - ANTES de qualquer código de teste ter chance de rodar. Pra
// mockar claude.use("db") a tempo, o mock precisa existir no documento ANTES
// da navegação (page.addInitScript), o mesmo motivo estrutural que já vale
// pra run_fuzz_save_shapes.mjs com reload de página.
//
// O mock imita o contrato REAL que o próprio connectSync()/onSnapshot já
// esperam (confirmado lendo o código de produção, não inventado): doc.get()
// -> {exists, data()}; doc.set(obj) -> Promise; doc.onSnapshot(onNext, onErr)
// registra um callback que o TESTE aciona manualmente depois, simulando uma
// escrita remota chegando. Não é um mock "que sempre dá certo" - os 3
// cenários abaixo reproduzem exatamente os 2 bugs históricos documentados
// no próprio código (2026-09-11: state não atualizado no caminho de vitória
// do remoto; 2026-09-13: aceitar remoto mais VELHO só porque chegou depois),
// pra provar que a correção continua valendo, não só que o mock "funciona".
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const BASE_URL = process.env.CI_SMOKE_BASE_URL || "http://localhost:8100";
const SERVER_WAIT_TIMEOUT_MS = 30000;

async function waitForServer(url) {
  const start = Date.now();
  while (Date.now() - start < SERVER_WAIT_TIMEOUT_MS) {
    try {
      const resp = await fetch(url);
      await resp.arrayBuffer();
      if (resp.ok) return;
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Servidor não respondeu em ${url}`);
}

// Instalado ANTES de cada navegação via addInitScript - roda no contexto da
// página, antes de qualquer script do artifact. `initialRemote` é o que
// doc.get() devolve na conexão inicial (null = "sem doc ainda", igual ao
// !snap.exists real).
function installMock(initialRemote) {
  window.__syncMock = { setCalls: [], snapshotCallback: null, errorCallback: null, currentRemote: initialRemote };
  function makeSnap(docOrNull) {
    return { exists: !!docOrNull, data: () => docOrNull, metadata: { hasPendingWrites: false } };
  }
  var ref = {
    get: function () {
      return Promise.resolve(makeSnap(window.__syncMock.currentRemote));
    },
    set: function (obj) {
      window.__syncMock.setCalls.push(JSON.parse(JSON.stringify(obj)));
      window.__syncMock.currentRemote = obj;
      return Promise.resolve();
    },
    onSnapshot: function (onNext, onError) {
      window.__syncMock.snapshotCallback = function (docOrNull) { onNext(makeSnap(docOrNull)); };
      window.__syncMock.errorCallback = onError;
    }
  };
  window.claude = { use: async function (name) { return name === "db" ? { doc: function () { return ref; } } : null; } };
}

async function withPage(browser, initialRemote, run) {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));
  await page.addInitScript(installMock, initialRemote);
  await page.goto(`${BASE_URL}/artifact_final.html`, { waitUntil: "load" });
  await page.waitForTimeout(200); // connectSync() é async - dá tempo do get() inicial resolver
  const result = await run(page);
  await page.close();
  return { result, pageErrors };
}

function baseSave(overrides) {
  return Object.assign({
    v: 2, team: [], box: [], savedTeams: [], customBuilds: {}, notes: {},
    settings: { difficulty: "ace", milestone: 0 }, archetype: { pace: null, weather: null, reasoning: "" },
    dataVersion: "sync-mock-test", savedAt: new Date().toISOString()
  }, overrides);
}

async function main() {
  console.log(`Esperando o dev server em ${BASE_URL}...`);
  await waitForServer(`${BASE_URL}/artifact_final.html`);
  const browser = await chromium.launch();
  const falhas = [];
  let totalChecks = 0;
  function check(nome, ok, detalhe) {
    totalChecks++;
    console.log((ok ? "pega      " : "FALHOU    ") + nome + (ok ? "" : " -- " + JSON.stringify(detalhe)));
    if (!ok) falhas.push(nome);
  }

  // ---- Cenário A: doc remoto mais NOVO na conexão inicial - bug real de
  // 2026-09-11 era `state` (memória) nunca ser atualizado, só localStorage;
  // uma ação normal do jogador (que sempre lê de `state`) revertia o
  // remoto em silêncio na próxima persist(). Confere direto o `state` em
  // memória via a ponte de teste, não só localStorage. ----
  {
    const remoto = baseSave({ team: ["SPECIES_CHARIZARD"], savedAt: "2099-01-01T00:00:00.000Z" });
    const { result, pageErrors } = await withPage(browser, remoto, async (page) => {
      // state.team guarda `x` (índice numérico), não sname - buildSave()/
      // applySave() convertem nos dois sentidos (xsToSnames/snamesToXs).
      // Resolve de volta pro sname aqui dentro, pra comparar com o que o
      // mock realmente mandou.
      return page.evaluate(() => {
        var T = window.__erTest;
        var sp = T.state.team[0] !== undefined ? T.getSpeciesByX(T.state.team[0]) : null;
        return {
          stateTeamSname: sp ? sp.sname : null,
          localStorageTeam: JSON.parse(localStorage.getItem("er_terminal_save") || "{}").team,
          bannerVisivel: !document.getElementById("sync-banner").hidden
        };
      });
    });
    check("conexão inicial com remoto mais novo: state EM MEMÓRIA reflete o remoto (bug de 2026-09-11)",
      result.stateTeamSname === "SPECIES_CHARIZARD", result);
    check("conexão inicial com remoto mais novo: localStorage também foi atualizado", Array.isArray(result.localStorageTeam) && result.localStorageTeam[0] === "SPECIES_CHARIZARD", result);
    check("conexão inicial com remoto mais novo: banner de sincronização aparece", result.bannerVisivel === true, result);
    check("nenhum erro de página durante o cenário A", pageErrors.length === 0, pageErrors);
  }

  // ---- Cenário B: onSnapshot recebe um remoto MAIS VELHO que o local - bug
  // real de 2026-09-13 era aceitar qualquer remoto diferente sem checar
  // savedAt, then um aparelho podia reverter a própria edição recente por
  // causa da ordem de chegada no servidor, não da ordem real de edição.
  // Confere que o app EMPURRA o local de volta (ref.set) em vez de aceitar
  // o remoto mais velho. ----
  {
    const remotoInicial = baseSave({ team: [], savedAt: "2020-01-01T00:00:00.000Z" });
    const { result, pageErrors } = await withPage(browser, remotoInicial, async (page) => {
      // Simula o jogador editando localmente (savedAt mais novo que qualquer
      // coisa no mock). state.team guarda `x` numérico, não sname - resolve
      // o x real de Blastoise antes de atribuir.
      await page.evaluate(() => {
        var T = window.__erTest;
        var blastoise = T.SPECIES.find(function (s) { return s.sname === "SPECIES_BLASTOISE"; });
        T.state.team = [blastoise.x];
        T.persist();
      });
      await page.waitForTimeout(50);
      // Agora simula uma escrita remota chegando que é MAIS VELHA que o local
      // (mesmo cenário do bug real: outro aparelho grava, mas com timestamp
      // anterior ao que o jogador já tem aqui).
      const remotoVelho = baseSave({ team: ["SPECIES_VENUSAUR"], savedAt: "2021-01-01T00:00:00.000Z" });
      await page.evaluate((doc) => window.__syncMock.snapshotCallback(doc), remotoVelho);
      await page.waitForTimeout(50);
      return page.evaluate(() => {
        var T = window.__erTest;
        var sp = T.state.team[0] !== undefined ? T.getSpeciesByX(T.state.team[0]) : null;
        return {
          stateTeamSname: sp ? sp.sname : null,
          setCalls: window.__syncMock.setCalls.map(function (c) { return { team: c.team, savedAt: c.savedAt }; })
        };
      });
    });
    check("onSnapshot com remoto mais VELHO: o time local (mais novo) NÃO é sobrescrito pelo remoto velho",
      result.stateTeamSname === "SPECIES_BLASTOISE", result);
    check("onSnapshot com remoto mais VELHO: o app empurra o local de volta pro servidor (não fica em silêncio)",
      result.setCalls.some((c) => Array.isArray(c.team) && c.team[0] === "SPECIES_BLASTOISE"),
      result.setCalls);
    check("nenhum erro de página durante o cenário B", pageErrors.length === 0, pageErrors);
  }

  // ---- Cenário C: onSnapshot recebe um remoto MAIS NOVO de verdade -
  // caminho feliz normal (outro aparelho editou depois, chega aqui). ----
  {
    const remotoInicial = baseSave({ team: [], savedAt: "2020-01-01T00:00:00.000Z" });
    const { result, pageErrors } = await withPage(browser, remotoInicial, async (page) => {
      const remotoNovo = baseSave({ team: ["SPECIES_PIKACHU"], savedAt: "2099-01-01T00:00:00.000Z" });
      await page.evaluate((doc) => window.__syncMock.snapshotCallback(doc), remotoNovo);
      await page.waitForTimeout(50);
      return page.evaluate(() => {
        var T = window.__erTest;
        var sp = T.state.team[0] !== undefined ? T.getSpeciesByX(T.state.team[0]) : null;
        return {
          stateTeamSname: sp ? sp.sname : null,
          bannerVisivel: !document.getElementById("sync-banner").hidden,
          bannerTexto: document.getElementById("sync-banner-text").textContent
        };
      });
    });
    check("onSnapshot com remoto mais NOVO: aplica de verdade (caminho feliz)",
      result.stateTeamSname === "SPECIES_PIKACHU", result);
    check("onSnapshot com remoto mais NOVO: avisa com o banner certo", result.bannerVisivel && /outro aparelho/.test(result.bannerTexto), result);
    check("nenhum erro de página durante o cenário C", pageErrors.length === 0, pageErrors);
  }

  // ---- Cenário D: localStorage corrompido no MEIO da sessão, bem na hora
  // que um onSnapshot chega - bug real de 2026-09-13 era essa leitura (ao
  // contrário das outras duas do mesmo fluxo) não ter try/catch, perdendo
  // um remoto legítimo em silêncio por causa de uma exceção não tratada. ----
  {
    const remotoInicial = baseSave({ team: [], savedAt: "2020-01-01T00:00:00.000Z" });
    const { result, pageErrors } = await withPage(browser, remotoInicial, async (page) => {
      await page.evaluate(() => { localStorage.setItem("er_terminal_save", "{isto nao eh json valido"); });
      const remotoNovo = baseSave({ team: ["SPECIES_MEWTWO"], savedAt: "2099-01-01T00:00:00.000Z" });
      await page.evaluate((doc) => window.__syncMock.snapshotCallback(doc), remotoNovo);
      await page.waitForTimeout(50);
      return page.evaluate(() => {
        var T = window.__erTest;
        var sp = T.state.team[0] !== undefined ? T.getSpeciesByX(T.state.team[0]) : null;
        return { stateTeamSname: sp ? sp.sname : null };
      });
    });
    check("onSnapshot com localStorage corrompido no meio da sessão: não quebra, aplica o remoto (bug de 2026-09-13)",
      result.stateTeamSname === "SPECIES_MEWTWO", result);
    check("nenhum erro de página durante o cenário D", pageErrors.length === 0, pageErrors);
  }

  // ---- Cenário E: save de outro aparelho chega com build que não vale pra
  // espécie (Haxorus com Moxie, o print do usuário de 2026-09-24). A conferência
  // ajusta - e desde 2026-09-24 o ajuste é GRAVADO e devolvido pro sync; antes
  // ficava só na memória (defeito c da revisão da v136). ----
  {
    const remotoInicial = baseSave({ team: [], savedAt: "2020-01-01T00:00:00.000Z" });
    const { result, pageErrors } = await withPage(browser, remotoInicial, async (page) => {
      const remotoNovo = baseSave({
        team: ["SPECIES_HAXORUS"], savedAt: "2099-01-01T00:00:00.000Z",
        customBuilds: { SPECIES_HAXORUS: [{ ability: "Moxie", nature: "Jolly", item: "", moves: ["Dragon Claw"], ivs: [31, 31, 31, 31, 31, 31], evs: [0, 0, 0, 0, 0, 0], source: "ia", active: true, savedAt: "x", rationale: "" }] }
      });
      const setsAntes = await page.evaluate(() => window.__syncMock.setCalls.length);
      await page.evaluate((doc) => window.__syncMock.snapshotCallback(doc), remotoNovo);
      await page.waitForTimeout(50);
      return page.evaluate((antes) => {
        var T = window.__erTest;
        var local = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
        var novos = window.__syncMock.setCalls.slice(antes);
        var ultimo = novos[novos.length - 1];
        return {
          memoria: T.state.customBuilds.SPECIES_HAXORUS && T.state.customBuilds.SPECIES_HAXORUS[0].ability,
          gravado: local.customBuilds && local.customBuilds.SPECIES_HAXORUS && local.customBuilds.SPECIES_HAXORUS[0].ability,
          devolvido: ultimo && ultimo.customBuilds && ultimo.customBuilds.SPECIES_HAXORUS && ultimo.customBuilds.SPECIES_HAXORUS[0].ability
        };
      }, setsAntes);
    });
    check("save remoto com habilidade inexistente: ajuste feito na memória", result.memoria && result.memoria !== "Moxie", result);
    check("save remoto com habilidade inexistente: ajuste GRAVADO no aparelho (antes sumia)", result.gravado && result.gravado !== "Moxie", result);
    check("save remoto com habilidade inexistente: ajuste devolvido pro sync", result.devolvido && result.devolvido !== "Moxie", result);
    check("nenhum erro de página durante o cenário E", pageErrors.length === 0, pageErrors);
  }

  // ---- Cenário F: o outro aparelho mudou SÓ um campo que a lista fixa antiga
  // não conferia (buff de ginásio resgatado, auto-evolução). Achado do
  // levantamento de 2026-09-24: a mudança era ignorada em silêncio. ----
  {
    const gym = JSON.parse(readFileSync(new URL("../data/gym_skills.json", import.meta.url), "utf8"));
    const lider = Object.keys(gym.leaders)[0];
    const buff = gym.leaders[lider].buffs[0].id;
    const remotoInicial = baseSave({ team: [], savedAt: "2020-01-01T00:00:00.000Z" });
    const { result, pageErrors } = await withPage(browser, remotoInicial, async (page) => {
      const remotoNovo = baseSave({ team: [], savedAt: "2099-01-01T00:00:00.000Z", gymSkillsCleared: { [lider]: [buff] } });
      await page.evaluate((doc) => window.__syncMock.snapshotCallback(doc), remotoNovo);
      await page.waitForTimeout(50);
      return page.evaluate((l) => ({ buffs: (window.__erTest.state.gymSkillsCleared || {})[l] || [] }), lider);
    });
    check("buff de ginásio marcado em outro aparelho chega aqui (antes era ignorado)", result.buffs.indexOf(buff) !== -1, result);
    check("nenhum erro de página durante o cenário F", pageErrors.length === 0, pageErrors);
  }

  await browser.close();
  console.log(`\n=== sincronização entre dispositivos (mock fiel do capability db): ${totalChecks - falhas.length}/${totalChecks} verificações passaram ===`);
  if (falhas.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error("Falha ao rodar o teste de sincronização:", err);
  process.exitCode = 1;
});
