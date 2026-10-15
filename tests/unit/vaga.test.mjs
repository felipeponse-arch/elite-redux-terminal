// Vaga de verificação pesada (scripts/vaga.mjs, melhoria B de 2026-10-13).
// Processos filhos de verdade, uma pasta temporária por teste (ER_VAGA_PASTA):
// nunca toca a vaga real da máquina.
//
// Como provar ordem e exclusão SEM depender de relógio (revisão de 14/10/2026: estes testes
// falhavam sob carga da máquina porque dependiam de esperas de tempo):
//  - cada filho grava "ENTROU <rótulo>" e "SAIU <rótulo>" num log com appendFileSync (síncrono).
//    A ordem do log é a ordem real: o SAIU do dono vem antes do ENTROU do próximo, porque o
//    próximo só consegue a vaga depois que o dono apaga o arquivo dele, e isso acontece depois
//    do SAIU ter sido gravado.
//  - o pai sabe que um processo ESTÁ NA FILA quando vê o aviso "Aguardando vaga" na saída dele
//    (evento, não tempo), e só então libera o dono criando um arquivo sentinela ("liberar-<rótulo>").
//  - as esperas (esperar, esperaSaida) têm um limite GUARDA generoso: só servem para não travar
//    o teste para sempre. A propriedade é provada pelo log e pelos eventos, não pelo limite.
import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, existsSync, utimesSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const VAGA = pathToFileURL(fileURLToPath(new URL("../../scripts/vaga.mjs", import.meta.url))).href;
const GUARDA = 15000; // limite só para não travar; não é a medida de nada

// Filho: pede a vaga "pesada" e grava ENTROU/SAIU no LOG. Com LIBERAR espera o arquivo sentinela
// (o pai decide quando o dono sai). Com SEGURA segura um tempo fixo (usado só pelo teste de exclusão).
// Com NETO=1 ainda roda um neto que pede a vaga de novo (reentrância).
const CODIGO = `
import { comVaga } from ${JSON.stringify(VAGA)};
import { appendFileSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
const sono = (ms) => new Promise((r) => setTimeout(r, ms));
const LOG = process.env.LOG;
const ROTULO = process.env.ROTULO;
try {
  await comVaga("pesada", async () => {
    appendFileSync(LOG, "ENTROU " + ROTULO + "\\n");
    if (process.env.NETO) {
      await new Promise((res) => {
        const n = spawn(process.execPath, ["--input-type=module", "-e", process.env.NETO_CODIGO], { stdio: "inherit", env: { ...process.env, NETO: "" } });
        n.on("exit", res);
      });
    }
    if (process.env.LIBERAR) {
      const t0 = Date.now();
      while (!existsSync(process.env.LIBERAR)) {
        if (Date.now() - t0 > Number(process.env.GUARDA || ${GUARDA})) throw new Error("liberação não chegou");
        await sono(20);
      }
    }
    if (process.env.SEGURA) await sono(Number(process.env.SEGURA));
    appendFileSync(LOG, "SAIU " + ROTULO + "\\n");
  }, { esperaMaxMs: Number(process.env.ESPERA_MAX || 20000), avisoMs: 100 });
} catch (e) { console.log("ERRO " + e.message); process.exit(3); }
`;

function novaBase() {
  return mkdtempSync(join(tmpdir(), "er-vaga-teste-"));
}

// Espera uma condição com limite GUARDA (só para não travar o teste).
async function esperar(condicao, descricao, ms = GUARDA) {
  const t0 = Date.now();
  while (!condicao()) {
    if (Date.now() - t0 > ms) throw new Error("não aconteceu: " + descricao);
    await new Promise((r) => setTimeout(r, 20));
  }
}

// Eventos ENTROU/SAIU na ordem em que foram gravados.
function eventos(base) {
  const log = join(base, "eventos.log");
  if (!existsSync(log)) return [];
  return readFileSync(log, "utf8").split(/\r?\n/).filter((l) => /^(ENTROU|SAIU)/.test(l));
}

function rodar(base, rotulo, extra = {}) {
  const env = {
    ...process.env,
    ER_VAGA_DONO: "",
    ER_VAGA_PASTA: join(base, "vagas"),
    LOG: join(base, "eventos.log"),
    ROTULO: rotulo,
    ...extra,
  };
  delete env.CODIGO;
  for (const k of Object.keys(env)) if (env[k] === undefined) delete env[k];
  const f = spawn(process.execPath, ["--input-type=module", "-e", extra.CODIGO || CODIGO], {
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let saida = "";
  f.stdout.on("data", (d) => { saida += d; });
  f.stderr.on("data", (d) => { saida += d; });
  const fim = new Promise((res) => f.on("exit", (codigo) => res({ codigo, saida })));
  const esperaSaida = (regex) => esperar(() => regex.test(saida), "saída " + regex + ": " + saida);
  return { f, fim, esperaSaida, saida: () => saida };
}

// Liberação do dono pelo pai: só quando o teste já viu o que precisava ver.
function liberar(base, rotulo) {
  writeFileSync(join(base, "liberar-" + rotulo), "");
}

const NA_FILA = /Aguardando vaga pesada: na fila atrás de pid/;

test("vaga: o segundo processo espera e só entra depois que o primeiro sai", async () => {
  const base = novaBase();
  try {
    const a = rodar(base, "A", { LIBERAR: join(base, "liberar-A") });
    await esperar(() => eventos(base).includes("ENTROU A"), "A entrar na vaga");
    const b = rodar(base, "B");
    await b.esperaSaida(NA_FILA); // B está na fila: só agora o dono sai
    liberar(base, "A");
    const [ra, rb] = await Promise.all([a.fim, b.fim]);
    assert.equal(ra.codigo, 0, ra.saida);
    assert.equal(rb.codigo, 0, rb.saida);
    assert.deepEqual(eventos(base), ["ENTROU A", "SAIU A", "ENTROU B", "SAIU B"]);
  } finally { rmSync(base, { recursive: true, force: true }); }
});

test("vaga: dono com pid morto libera a vaga", async () => {
  const base = novaBase();
  try {
    // pid de um processo que já terminou
    const morto = spawn(process.execPath, ["-e", "0"], { stdio: "ignore" });
    await new Promise((r) => morto.on("exit", r));
    mkdirSync(join(base, "vagas"), { recursive: true });
    writeFileSync(join(base, "vagas", "pesada.dono"), JSON.stringify({ pid: morto.pid, pasta: "x", desde: "2026-01-01" }));
    const r = await rodar(base, "B").fim;
    assert.equal(r.codigo, 0, r.saida);
    assert.deepEqual(eventos(base), ["ENTROU B", "SAIU B"]);
  } finally { rmSync(base, { recursive: true, force: true }); }
});

test("vaga: estourar o limite de tempo dá erro claro e não trava a vaga do dono", async () => {
  const base = novaBase();
  try {
    // A segura a vaga até o pai liberar. B tem limite curto: ele SÓ pode desistir, porque A não sai
    // antes de B terminar (a liberação vem depois do fim de B). Não depende de quanto tempo A segura.
    const a = rodar(base, "A", { LIBERAR: join(base, "liberar-A") });
    await esperar(() => eventos(base).includes("ENTROU A"), "A entrar na vaga");
    const b = rodar(base, "B", { ESPERA_MAX: "300" });
    const rb = await b.fim;
    assert.equal(rb.codigo, 3, rb.saida);
    assert.match(rb.saida, /ERRO Vaga pesada: esperei .* estourei o limite de .*dono: pid \d+/, rb.saida);
    liberar(base, "A");
    const ra = await a.fim;
    assert.equal(ra.codigo, 0, ra.saida);
    assert.deepEqual(eventos(base), ["ENTROU A", "SAIU A"]);
  } finally { rmSync(base, { recursive: true, force: true }); }
});

test("vaga: reentrância - filho com ER_VAGA_DONO vivo não pede de novo (sem deadlock)", async () => {
  const base = novaBase();
  try {
    // O neto roda o mesmo código e herda o rótulo do pai. Se pedisse a vaga de novo, esperaria o pai
    // (que espera o neto) e estouraria o limite curto - o que o teste pega.
    const a = rodar(base, "A", { NETO: "1", NETO_CODIGO: CODIGO, ESPERA_MAX: "1500" });
    const r = await a.fim;
    assert.equal(r.codigo, 0, r.saida);
    assert.ok(!r.saida.includes("ERRO"), r.saida);
    assert.deepEqual(eventos(base), ["ENTROU A", "ENTROU A", "SAIU A", "SAIU A"]);
  } finally { rmSync(base, { recursive: true, force: true }); }
});

test("vaga: ER_VAGA_DONO com pid morto NÃO vale (pede a vaga normalmente)", async () => {
  const base = novaBase();
  try {
    const morto = spawn(process.execPath, ["-e", "0"], { stdio: "ignore" });
    await new Promise((r) => morto.on("exit", r));
    const a = rodar(base, "A", { LIBERAR: join(base, "liberar-A") });
    await esperar(() => eventos(base).includes("ENTROU A"), "A entrar na vaga");
    const b = rodar(base, "B", { ER_VAGA_DONO: String(morto.pid) });
    await b.esperaSaida(NA_FILA); // B não passou direto: está na fila
    liberar(base, "A");
    await Promise.all([a.fim, b.fim]);
    assert.deepEqual(eventos(base), ["ENTROU A", "SAIU A", "ENTROU B", "SAIU B"]);
  } finally { rmSync(base, { recursive: true, force: true }); }
});

test("vaga: ordem de chegada com 3 processos", async () => {
  const base = novaBase();
  try {
    const a = rodar(base, "A", { LIBERAR: join(base, "liberar-A") });
    await esperar(() => eventos(base).includes("ENTROU A"), "A entrar na vaga");
    // B chega e está na fila; só então C chega (C fica atrás de B, por construção)
    const b = rodar(base, "B");
    await b.esperaSaida(NA_FILA);
    const c = rodar(base, "C");
    await c.esperaSaida(NA_FILA);
    liberar(base, "A");
    const rs = await Promise.all([a.fim, b.fim, c.fim]);
    for (const r of rs) assert.equal(r.codigo, 0, r.saida);
    // sem sobreposição e na ordem de chegada: A, B, C
    assert.deepEqual(eventos(base), ["ENTROU A", "SAIU A", "ENTROU B", "SAIU B", "ENTROU C", "SAIU C"]);
  } finally { rmSync(base, { recursive: true, force: true }); }
});

test("vaga: dono vazio e velho (queda entre criar e gravar) é abandonado, não trava", async () => {
  const base = novaBase();
  try {
    const vagas = join(base, "vagas");
    mkdirSync(vagas, { recursive: true });
    const arq = join(vagas, "pesada.dono");
    writeFileSync(arq, "");
    // mtime de 60 s atrás: a regra de abandono olha a idade do arquivo, não o relógio do teste
    const velho = new Date(Date.now() - 60000);
    utimesSync(arq, velho, velho);
    const r = await rodar(base, "B", { ESPERA_MAX: "4000" }).fim;
    assert.equal(r.codigo, 0, r.saida);
    assert.deepEqual(eventos(base), ["ENTROU B", "SAIU B"]);
  } finally { rmSync(base, { recursive: true, force: true }); }
});

test("vaga: ER_VAGA_DONO de pid vivo que NÃO é o dono real não pula a fila", async () => {
  const base = novaBase();
  try {
    const a = rodar(base, "A", { LIBERAR: join(base, "liberar-A") });
    await esperar(() => eventos(base).includes("ENTROU A"), "A entrar na vaga");
    // process.pid (deste teste) está vivo, mas não é o dono gravado; mesmo com token chutado
    const b = rodar(base, "B", { ER_VAGA_DONO: String(process.pid), ER_VAGA_TOKEN: "chute" });
    await b.esperaSaida(NA_FILA);
    liberar(base, "A");
    await Promise.all([a.fim, b.fim]);
    assert.deepEqual(eventos(base), ["ENTROU A", "SAIU A", "ENTROU B", "SAIU B"]);
  } finally { rmSync(base, { recursive: true, force: true }); }
});

test("vaga: pid certo com token errado (reuso de pid) não pula a fila", async () => {
  const base = novaBase();
  try {
    const a = rodar(base, "A", { LIBERAR: join(base, "liberar-A") });
    await esperar(() => eventos(base).includes("ENTROU A"), "A entrar na vaga");
    const b = rodar(base, "B", { ER_VAGA_DONO: String(a.f.pid), ER_VAGA_TOKEN: "errado" });
    await b.esperaSaida(NA_FILA);
    liberar(base, "A");
    await Promise.all([a.fim, b.fim]);
    assert.deepEqual(eventos(base), ["ENTROU A", "SAIU A", "ENTROU B", "SAIU B"]);
  } finally { rmSync(base, { recursive: true, force: true }); }
});

test("vaga: desistente (estourou o limite) não trava quem está atrás", async () => {
  const base = novaBase();
  try {
    const a = rodar(base, "A", { LIBERAR: join(base, "liberar-A") });
    await esperar(() => eventos(base).includes("ENTROU A"), "A entrar na vaga");
    // B chega primeiro e desiste (limite curto, com A ainda segurando); C chega atrás de B
    const b = rodar(base, "B", { ESPERA_MAX: "300" });
    await b.esperaSaida(NA_FILA);
    const c = rodar(base, "C");
    await c.esperaSaida(NA_FILA);
    const rb = await b.fim;
    assert.equal(rb.codigo, 3, rb.saida);
    liberar(base, "A");
    const [, rc] = await Promise.all([a.fim, c.fim]);
    assert.equal(rc.codigo, 0, rc.saida);
    assert.deepEqual(eventos(base), ["ENTROU A", "SAIU A", "ENTROU C", "SAIU C"]);
  } finally { rmSync(base, { recursive: true, force: true }); }
});

test("vaga: processo da fila que morre (kill) não trava quem está atrás", async () => {
  const base = novaBase();
  try {
    const a = rodar(base, "A", { LIBERAR: join(base, "liberar-A") });
    await esperar(() => eventos(base).includes("ENTROU A"), "A entrar na vaga");
    const b = rodar(base, "B");
    await b.esperaSaida(NA_FILA);
    const c = rodar(base, "C");
    await c.esperaSaida(NA_FILA);
    b.f.kill("SIGKILL");
    await b.fim; // B morto antes de A sair
    liberar(base, "A");
    const [, rc] = await Promise.all([a.fim, c.fim]);
    assert.equal(rc.codigo, 0, rc.saida);
    assert.deepEqual(eventos(base), ["ENTROU A", "SAIU A", "ENTROU C", "SAIU C"]);
  } finally { rmSync(base, { recursive: true, force: true }); }
});

test("vaga: 5 processos simultâneos nunca se sobrepõem (exclusão mútua)", async () => {
  const base = novaBase();
  try {
    // Cada um segura um pouco (SEGURA) para criar disputa de verdade. O que se prova é o log:
    // um ENTROU seguido do SAIU do mesmo rótulo, antes do próximo ENTROU. Sem exclusão, o log
    // mostra dois ENTROU seguidos - e com 5 disputando ao mesmo tempo isso acontece.
    const rs = await Promise.all(["A", "B", "C", "D", "E"].map((r) => rodar(base, r, { SEGURA: "120" })).map((t) => t.fim));
    for (const r of rs) assert.equal(r.codigo, 0, r.saida);
    const ev = eventos(base);
    assert.equal(ev.length, 10);
    for (let i = 0; i < ev.length; i += 2) {
      assert.ok(ev[i].startsWith("ENTROU "), ev.join(","));
      assert.equal(ev[i + 1], "SAIU " + ev[i].slice(7), ev.join(","));
    }
  } finally { rmSync(base, { recursive: true, force: true }); }
});
