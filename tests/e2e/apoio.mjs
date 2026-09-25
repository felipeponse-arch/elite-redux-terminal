// Apoio comum dos testes de navegador (fase 6 da refatoração, 2026-09-24).
//
// `test` aqui é o do Playwright com uma trava a mais: qualquer erro não tratado
// na página (pageerror) derruba o teste no fim - antes o runner do smoke só
// imprimia esses erros e seguia passando.
import { test as base, expect } from "@playwright/test";

export { expect };

export const test = base.extend({
  errosDaPagina: [async ({ page }, use) => {
    const erros = [];
    page.on("pageerror", (err) => erros.push(err.message));
    await use(erros);
    expect(erros, "erro não tratado na página").toEqual([]);
  }, { auto: true }],
});

// Mock do capability db (sincronização entre aparelhos), instalado ANTES do
// script do app: connectSync() roda uma vez só, na carga. Mesmo contrato do
// real (doc().get()/.set()/.onSnapshot(onNext, onErr)) e mesmas pontes do
// mock do dev_server.ps1 (__fakeSyncDocs, __fakeSyncPushRemote,
// __fakeSyncTriggerError), que as seções da suíte já usam. `semente` é o doc
// remoto que já existe na conexão (null = instalação nova).
function instalarMockDb(semente) {
  var docs = {};
  if (semente) docs["sync/save"] = semente;
  var ouvintes = {};
  var ouvintesDeErro = {};
  var db = {
    doc: function (caminho) {
      return {
        get: function () {
          var tem = Object.prototype.hasOwnProperty.call(docs, caminho);
          return Promise.resolve({ exists: tem, data: function () { return docs[caminho]; } });
        },
        set: function (valor) {
          docs[caminho] = valor;
          (window.__fakeSyncSets = window.__fakeSyncSets || []).push(JSON.parse(JSON.stringify(valor)));
          return Promise.resolve();
        },
        onSnapshot: function (cb, errCb) {
          (ouvintes[caminho] = ouvintes[caminho] || []).push(cb);
          if (errCb) (ouvintesDeErro[caminho] = ouvintesDeErro[caminho] || []).push(errCb);
          return function () {
            var lista = ouvintes[caminho];
            var i = lista ? lista.indexOf(cb) : -1;
            if (i !== -1) lista.splice(i, 1);
          };
        }
      };
    }
  };
  window.__fakeSyncDocs = docs;
  window.__fakeSyncPushRemote = function (caminho, valor) {
    docs[caminho] = valor;
    (ouvintes[caminho] || []).forEach(function (cb) {
      cb({ exists: true, metadata: { hasPendingWrites: false }, data: function () { return valor; } });
    });
  };
  // Conexão ao vivo caindo: dispara o callback de erro mais recente e limpa os
  // ouvintes, como uma conexão real morta (nada chega até reconectar).
  window.__fakeSyncTriggerError = function (caminho) {
    var lista = ouvintesDeErro[caminho] || [];
    var ultimo = lista[lista.length - 1];
    ouvintes[caminho] = [];
    ouvintesDeErro[caminho] = [];
    if (ultimo) ultimo(new Error("mock connection lost"));
  };
  window.claude = { use: function (nome) { return Promise.resolve(nome === "db" ? db : null); } };
}

// Abre o app. mockDb: instala o db falso (com `semente` como doc remoto
// inicial). A espera final dá tempo do get() inicial da sincronização resolver.
export async function abrirApp(page, { mockDb = false, semente = null, arquivo = "artifact_final.html" } = {}) {
  if (mockDb) await ligarMockDb(page, semente);
  await page.goto("/" + arquivo, { waitUntil: "load" });
  await esperarFontes(page);
  if (mockDb) await page.waitForTimeout(200);
}

// As fontes não travam mais a primeira pintura (fase 8): chegam depois e trocam
// a fonte de reserva. Print e medida de layout só depois delas.
async function esperarFontes(page) {
  await page.waitForFunction(() => window.__fontesProntas === true, null, { timeout: 15_000 });
  // document.fonts.ready não garante os pesos que ainda não apareceram na
  // tela (o navegador baixa cada peso sob demanda) - um print de referência
  // já saiu com um peso ainda chegando (2026-09-24). Pede todos os usados.
  await page.evaluate(() => Promise.all([
    '400 15px "Figtree"', '500 15px "Figtree"', '600 15px "Figtree"', '700 15px "Figtree"',
    '700 20px "Bricolage Grotesque"', '800 20px "Bricolage Grotesque"',
    '400 13px "IBM Plex Mono"', '600 13px "IBM Plex Mono"',
  ].map((f) => document.fonts.load(f).catch(() => null))).then(() => document.fonts.ready));
}

// Liga o db falso a partir da PRÓXIMA navegação (addInitScript vale pras
// cargas seguintes, não pra página já aberta).
export async function ligarMockDb(page, semente = null) {
  await page.addInitScript(instalarMockDb, semente);
}

// Abre uma aba como o jogador: direto na barra ou, se ela estiver no menu
// "Mais" (Progresso, Tipos...), abrindo o menu primeiro.
export async function abrirAba(page, aba) {
  const naBarra = page.locator(`.tabs .tab-btn[data-tab="${aba}"]`);
  if (await naBarra.isVisible()) {
    await naBarra.click();
  } else {
    await page.locator("#tabs-more-toggle").click();
    await page.locator(`#tabs-more-panel .tab-btn[data-tab="${aba}"]`).click();
  }
  await expect(page.locator(`#view-${aba}`)).toBeVisible();
}

// Monta um time de verdade pela interface: busca na Dex, abre a ficha, "+ Time".
export async function adicionarAoTimePelaDex(page, nome) {
  await abrirAba(page, "dex");
  await page.locator("#search-input").fill(nome);
  await page.locator("#species-list .species-row", { hasText: nome }).first().click();
  await page.locator("#add-team-btn").click();
  await expect(page.locator("#add-team-btn")).toBeDisabled();
}

export async function saveLocal(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("er_terminal_save") || "{}"));
}

// Recarrega de verdade (loadSave() e a sincronização só rodam na carga).
export async function recarregar(page) {
  await page.reload({ waitUntil: "load" });
  await esperarFontes(page);
  await page.waitForTimeout(200);
}

// Carrega na página os arquivos da suíte (scripts/smoke_tests, na ordem do
// manifest). comOrquestrador inclui o 99_runner.js (runAllSections).
export async function carregarSuite(page, { comOrquestrador = false } = {}) {
  await page.evaluate(async (incluir99) => {
    const pasta = "/scripts/smoke_tests/";
    const manifest = await (await fetch(pasta + "manifest.json")).json();
    let codigo = "";
    for (const arquivo of manifest) {
      if (!incluir99 && arquivo.startsWith("99_")) continue;
      codigo += (await (await fetch(pasta + arquivo)).text()) + "\n";
    }
    // As seções são funções soltas que dividem o array `results` dos helpers;
    // rodarSecao zera, roda e devolve uma cópia.
    codigo += "\nwindow.__rodarSecao = async function (nome) { results.length = 0; await window[nome](); return results.slice(); };\n";
    if (incluir99) codigo += "window.__rodarTudo = runAllSections;\n";
    // eslint-disable-next-line no-eval -- carregador da suíte: roda os arquivos de scripts/smoke_tests na página
    (0, eval)(codigo);
  }, comOrquestrador);
}

// Transforma o array de checagens da suíte ({name, pass, detail}) em
// asserções: cada checagem que falhou aparece com nome e detalhe no relatório,
// sem parar as outras (expect.soft).
export function conferirChecagens(checagens, rotulo) {
  const falhas = checagens.filter((r) => !r.pass);
  test.info().annotations.push({ type: "checagens", description: `${checagens.length - falhas.length}/${checagens.length}` });
  console.log(`${rotulo}: ${checagens.length - falhas.length}/${checagens.length} checagens`);
  expect(checagens.length, `${rotulo}: a seção não registrou nenhuma checagem`).toBeGreaterThan(0);
  for (const r of falhas) {
    expect.soft(r.pass, `${r.name}${r.detail ? "  (" + JSON.stringify(r.detail).slice(0, 400) + ")" : ""}`).toBe(true);
  }
}
