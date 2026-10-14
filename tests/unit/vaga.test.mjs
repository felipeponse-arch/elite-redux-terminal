// Vaga de verificação pesada (scripts/vaga.mjs, melhoria B de 2026-10-13).
// Processos filhos de verdade, uma pasta de vagas temporária por teste (ER_VAGA_PASTA):
// nunca toca a vaga real da máquina.
import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const VAGA = pathToFileURL(fileURLToPath(new URL("../../scripts/vaga.mjs", import.meta.url))).href;

// Filho: pede a vaga "pesada", imprime ENTROU, segura SEGURA ms, imprime SAIU.
// Com FILHO=1 ainda roda um neto que pede a vaga de novo (reentrância).
const CODIGO = `
import { comVaga } from ${JSON.stringify(VAGA)};
import { spawn } from "node:child_process";
const seg = Number(process.env.SEGURA || 0);
try {
  await comVaga("pesada", async () => {
    console.log("ENTROU " + process.env.ROTULO);
    if (process.env.NETO) {
      await new Promise((res) => {
        const n = spawn(process.execPath, ["--input-type=module", "-e", process.env.NETO_CODIGO], { stdio: "inherit", env: { ...process.env, NETO: "" } });
        n.on("exit", res);
      });
    }
    await new Promise((r) => setTimeout(r, seg));
    console.log("SAIU " + process.env.ROTULO);
  }, { esperaMaxMs: Number(process.env.ESPERA_MAX || 20000), avisoMs: 100 });
} catch (e) { console.log("ERRO " + e.message); process.exit(3); }
`;

function pastaTemp() {
  return mkdtempSync(join(tmpdir(), "er-vaga-teste-"));
}

const cronologia = [];
test.beforeEach(() => { cronologia.length = 0; });
function rodar(pasta, rotulo, env = {}) {
  const linhas = [];
  const f = spawn(process.execPath, ["--input-type=module", "-e", env.CODIGO || CODIGO], {
    env: { ...process.env, ER_VAGA_DONO: "", ...env, ER_VAGA_PASTA: pasta, ROTULO: rotulo },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let saida = "";
  const onLinha = (txt) => { for (const l of txt.split(/\r?\n/).filter(Boolean)) { linhas.push(l); cronologia.push(l); } };
  f.stdout.on("data", (d) => { saida += d; onLinha(String(d)); });
  f.stderr.on("data", (d) => { saida += d; onLinha(String(d)); });
  const fim = new Promise((res) => f.on("exit", (codigo) => res({ codigo, linhas, saida })));
  const esperaLinha = async (prefixo, ms = 8000) => {
    const t0 = Date.now();
    while (!linhas.some((l) => l.startsWith(prefixo))) {
      if (Date.now() - t0 > ms) throw new Error("não apareceu " + prefixo + " em " + ms + " ms: " + saida);
      await new Promise((r) => setTimeout(r, 25));
    }
  };
  return { f, fim, linhas, esperaLinha };
}

test("vaga: o segundo processo espera e só entra depois que o primeiro sai", async () => {
  const pasta = pastaTemp();
  cronologia.length = 0;
  try {
    const a = rodar(pasta, "A", { SEGURA: "700" });
    await a.esperaLinha("ENTROU A");
    const b = rodar(pasta, "B", { SEGURA: "0" });
    const [ra, rb] = await Promise.all([a.fim, b.fim]);
    assert.equal(ra.codigo, 0);
    assert.equal(rb.codigo, 0);
    const ordem = cronologia.filter((l) => /^(ENTROU|SAIU)/.test(l));
    assert.deepEqual(ordem, ["ENTROU A", "SAIU A", "ENTROU B", "SAIU B"]);
    assert.ok(rb.linhas.some((l) => l.startsWith("Aguardando vaga pesada: na fila atrás de pid")), "B avisou que está esperando");
  } finally { rmSync(pasta, { recursive: true, force: true }); }
});

test("vaga: dono com pid morto libera a vaga", async () => {
  const pasta = pastaTemp();
  try {
    // pid de um processo que já terminou
    const morto = spawn(process.execPath, ["-e", "0"], { stdio: "ignore" });
    await new Promise((r) => morto.on("exit", r));
    mkdirSync(pasta, { recursive: true });
    writeFileSync(join(pasta, "pesada.dono"), JSON.stringify({ pid: morto.pid, pasta: "x", desde: "2026-01-01" }));
    const b = rodar(pasta, "B", { SEGURA: "0", ESPERA_MAX: "5000" });
    const r = await b.fim;
    assert.equal(r.codigo, 0, r.saida);
    assert.ok(r.linhas.includes("ENTROU B"));
  } finally { rmSync(pasta, { recursive: true, force: true }); }
});

test("vaga: estourar o limite de tempo dá erro claro e não trava a vaga do dono", async () => {
  const pasta = pastaTemp();
  try {
    const a = rodar(pasta, "A", { SEGURA: "1500" });
    await a.esperaLinha("ENTROU A");
    const b = rodar(pasta, "B", { SEGURA: "0", ESPERA_MAX: "500" });
    const rb = await b.fim;
    assert.equal(rb.codigo, 3);
    assert.ok(rb.linhas.some((l) => /^ERRO Vaga pesada: esperei .* estourei o limite de .*dono: pid \d+/.test(l)), rb.saida);
    assert.ok(!rb.linhas.includes("ENTROU B"));
    const ra = await a.fim;
    assert.equal(ra.codigo, 0);
  } finally { rmSync(pasta, { recursive: true, force: true }); }
});

test("vaga: reentrância - filho com ER_VAGA_DONO vivo não pede de novo (sem deadlock)", async () => {
  const pasta = pastaTemp();
  try {
    // O neto roda o mesmo código; se pedisse a vaga de novo, esperaria o pai (que espera o neto) e estouraria.
    const a = rodar(pasta, "A", { SEGURA: "0", NETO: "1", NETO_CODIGO: CODIGO.replace('"pesada"', '"pesada"'), ESPERA_MAX: "1500" });
    const r = await a.fim;
    assert.equal(r.codigo, 0, r.saida);
    assert.ok(r.linhas.filter((l) => l === "ENTROU A").length === 2, "pai e neto entraram: " + r.saida);
    assert.ok(!r.linhas.some((l) => l.startsWith("ERRO")), r.saida);
  } finally { rmSync(pasta, { recursive: true, force: true }); }
});

test("vaga: ER_VAGA_DONO com pid morto NÃO vale (pede a vaga normalmente)", async () => {
  const pasta = pastaTemp();
  try {
    const morto = spawn(process.execPath, ["-e", "0"], { stdio: "ignore" });
    await new Promise((r) => morto.on("exit", r));
    const a = rodar(pasta, "A", { SEGURA: "700" });
    await a.esperaLinha("ENTROU A");
    const b = rodar(pasta, "B", { SEGURA: "0", ER_VAGA_DONO: String(morto.pid) });
    await Promise.all([a.fim, b.fim]);
    const ordem = cronologia.filter((l) => /^(ENTROU|SAIU)/.test(l));
    assert.deepEqual(ordem, ["ENTROU A", "SAIU A", "ENTROU B", "SAIU B"]);
  } finally { rmSync(pasta, { recursive: true, force: true }); }
});

test("vaga: ordem de chegada com 3 processos", async () => {
  const pasta = pastaTemp();
  try {
    const a = rodar(pasta, "A", { SEGURA: "900" });
    await a.esperaLinha("ENTROU A");
    // B e C chegam em ordem, com folga entre eles para a fila registrar a chegada
    const b = rodar(pasta, "B", { SEGURA: "100" });
    await new Promise((r) => setTimeout(r, 500));
    const c = rodar(pasta, "C", { SEGURA: "100" });
    const rs = await Promise.all([a.fim, b.fim, c.fim]);
    for (const r of rs) assert.equal(r.codigo, 0, r.saida);
    // linhas de stdout ordenadas pela chegada real: junta tudo e filtra (cada filho imprime em ordem)
    const todas = cronologia.filter((l) => /^(ENTROU|SAIU)/.test(l));
    assert.deepEqual(todas.filter((l) => l.startsWith("ENTROU")), ["ENTROU A", "ENTROU B", "ENTROU C"]);
    // sem sobreposição: cada SAIU vem antes do próximo ENTROU
    assert.deepEqual(todas, ["ENTROU A", "SAIU A", "ENTROU B", "SAIU B", "ENTROU C", "SAIU C"]);
  } finally { rmSync(pasta, { recursive: true, force: true }); }
});
