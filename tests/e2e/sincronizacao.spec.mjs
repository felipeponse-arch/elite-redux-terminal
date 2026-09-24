// Sincronização entre aparelhos (claude.use("db")) - o merge de estado mais
// delicado do app, com bugs reais no histórico. Os cenários reproduzem esses
// bugs pra provar que a correção continua valendo. O db falso (apoio.mjs) é
// instalado antes do script do app: connectSync() roda uma vez só, na carga.
import { readFileSync } from "node:fs";
import { test, expect, abrirApp } from "./apoio.mjs";

function baseSave(extra) {
  return {
    v: 2, team: [], box: [], savedTeams: [], customBuilds: {}, notes: {},
    settings: { difficulty: "ace", milestone: 0 }, archetype: { pace: null, weather: null, reasoning: "" },
    dataVersion: "sync-mock-test", savedAt: new Date().toISOString(), ...extra
  };
}
const REMOTO_ANTIGO = baseSave({ savedAt: "2020-01-01T00:00:00.000Z" });

// Outro aparelho gravou `doc` (o onSnapshot dispara aqui).
async function chegaDoOutroAparelho(page, doc) {
  await page.evaluate((d) => window.__fakeSyncPushRemote("sync/save", d), doc);
  await page.waitForTimeout(50);
}

// state.team guarda o índice `x`; devolve o sname do primeiro membro.
function primeiroDoTime(page) {
  return page.evaluate(() => {
    const T = window.__erTest;
    const sp = T.state.team[0] !== undefined ? T.getSpeciesByX(T.state.team[0]) : null;
    return sp ? sp.sname : null;
  });
}

// Bug de 2026-09-11: o remoto ia pro localStorage mas não pra memória (`state`),
// e a próxima gravação do jogador revertia o remoto em silêncio.
test("A - remoto mais novo na conexão: memória, armazenamento e aviso", async ({ page }) => {
  await abrirApp(page, { mockDb: true, semente: baseSave({ team: ["SPECIES_CHARIZARD"], savedAt: "2099-01-01T00:00:00.000Z" }) });
  expect(await primeiroDoTime(page), "o state EM MEMÓRIA reflete o remoto").toBe("SPECIES_CHARIZARD");
  const local = await page.evaluate(() => JSON.parse(localStorage.getItem("er_terminal_save") || "{}").team);
  expect(local, "o localStorage também").toEqual(["SPECIES_CHARIZARD"]);
  await expect(page.locator("#sync-banner")).toBeVisible();
  await expect(page.locator("#sync-banner-text")).toContainText("mais novo de outro aparelho");
});

// Bug de 2026-09-13: qualquer remoto diferente era aceito sem olhar a data - um
// eco atrasado de outro aparelho revertia a edição recente deste.
test("B - remoto mais VELHO ao vivo: o local fica e é empurrado de volta", async ({ page }) => {
  await abrirApp(page, { mockDb: true, semente: REMOTO_ANTIGO });
  await page.evaluate(() => {
    const T = window.__erTest;
    T.state.team = [T.SPECIES.find((s) => s.sname === "SPECIES_BLASTOISE").x];
    T.persist();
  });
  await page.waitForTimeout(50);
  await chegaDoOutroAparelho(page, baseSave({ team: ["SPECIES_VENUSAUR"], savedAt: "2021-01-01T00:00:00.000Z" }));
  expect(await primeiroDoTime(page), "o time local (mais novo) não é sobrescrito").toBe("SPECIES_BLASTOISE");
  const remoto = await page.evaluate(() => window.__fakeSyncDocs["sync/save"].team);
  expect(remoto, "o app devolve o local pro servidor").toEqual(["SPECIES_BLASTOISE"]);
});

test("C - remoto mais novo ao vivo: aplica e avisa", async ({ page }) => {
  await abrirApp(page, { mockDb: true, semente: REMOTO_ANTIGO });
  await chegaDoOutroAparelho(page, baseSave({ team: ["SPECIES_PIKACHU"], savedAt: "2099-01-01T00:00:00.000Z" }));
  expect(await primeiroDoTime(page)).toBe("SPECIES_PIKACHU");
  await expect(page.locator("#sync-banner")).toBeVisible();
  await expect(page.locator("#sync-banner-text")).toContainText(/outro aparelho/);
});

// Bug de 2026-09-13: esta leitura não tinha try/catch - um remoto legítimo se
// perdia por causa do armazenamento local corrompido.
test("D - armazenamento corrompido no meio da sessão: aplica o remoto sem quebrar", async ({ page }) => {
  await abrirApp(page, { mockDb: true, semente: REMOTO_ANTIGO });
  await page.evaluate(() => localStorage.setItem("er_terminal_save", "{isto nao eh json valido"));
  await chegaDoOutroAparelho(page, baseSave({ team: ["SPECIES_MEWTWO"], savedAt: "2099-01-01T00:00:00.000Z" }));
  expect(await primeiroDoTime(page)).toBe("SPECIES_MEWTWO");
});

// Haxorus com Moxie (print do usuário, 2026-09-24): a conferência ajusta a build
// e o ajuste é GRAVADO e devolvido pro sync (antes ficava só na memória).
test("E - build inválida vinda de outro aparelho: ajuste gravado e devolvido", async ({ page }) => {
  await abrirApp(page, { mockDb: true, semente: REMOTO_ANTIGO });
  const escritasAntes = await page.evaluate(() => (window.__fakeSyncSets || []).length);
  await chegaDoOutroAparelho(page, baseSave({
    team: ["SPECIES_HAXORUS"], savedAt: "2099-01-01T00:00:00.000Z",
    customBuilds: { SPECIES_HAXORUS: [{ ability: "Moxie", nature: "Jolly", item: "", moves: ["Dragon Claw"], ivs: [31, 31, 31, 31, 31, 31], evs: [0, 0, 0, 0, 0, 0], source: "ia", active: true, savedAt: "x", rationale: "" }] }
  }));
  const r = await page.evaluate((antes) => {
    const local = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
    const novas = (window.__fakeSyncSets || []).slice(antes);
    const ultima = novas[novas.length - 1];
    const hab = (save) => save && save.customBuilds && save.customBuilds.SPECIES_HAXORUS && save.customBuilds.SPECIES_HAXORUS[0].ability;
    return { memoria: hab({ customBuilds: window.__erTest.state.customBuilds }), gravado: hab(local), devolvido: hab(ultima) };
  }, escritasAntes);
  for (const onde of ["memoria", "gravado", "devolvido"]) {
    expect(r[onde], `habilidade ajustada (${onde})`).toBeTruthy();
    expect(r[onde], `habilidade ajustada (${onde})`).not.toBe("Moxie");
  }
});

// Achado de 2026-09-24: campos fora da lista fixa antiga (buff de ginásio,
// auto-evolução) eram ignorados em silêncio.
test("F - buff de ginásio marcado em outro aparelho chega aqui", async ({ page }) => {
  const gym = JSON.parse(readFileSync(new URL("../../data/gym_skills.json", import.meta.url), "utf8"));
  const lider = Object.keys(gym.leaders)[0];
  const buff = gym.leaders[lider].buffs[0].id;
  await abrirApp(page, { mockDb: true, semente: REMOTO_ANTIGO });
  await chegaDoOutroAparelho(page, baseSave({ savedAt: "2099-01-01T00:00:00.000Z", gymSkillsCleared: { [lider]: [buff] } }));
  const buffs = await page.evaluate((l) => (window.__erTest.state.gymSkillsCleared || {})[l] || [], lider);
  expect(buffs).toContain(buff);
});
