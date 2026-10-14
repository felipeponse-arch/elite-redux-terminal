// Vaga de máquina para verificação pesada (melhoria B de docs/pipeline_do_projeto.md, 2026-10-13).
// Antes só o gancho tinha trava, e ela FALHAVA na hora; testes avulsos (node --test, sabotagem)
// não tinham nenhuma - duas sabotagens completas juntas levaram 90+ min. Aqui a vaga é um
// semáforo em arquivos na pasta temporária (um dono por nome, pid do dono pra detectar morte)
// com FILA em ordem de chegada: quem chega depois ESPERA, avisando de tempos em tempos.
//
// Uso em código:  await comVaga("pesada", async () => { ... }, { esperaMaxMs, avisoMs })
// Uso em terminal: npm run pesado -- node --test tests/unit/x.test.mjs   (devolve o código de saída)
//
// Reentrância: enquanto segura a vaga, o processo põe ER_VAGA_DONO=<seu pid> e ER_VAGA_TOKEN=<token
// aleatório> no ambiente dos filhos. Quem os recebe NÃO pede de novo (senão o gancho, que segura
// "pesada" e roda a sabotagem, travaria em deadlock com o próprio filho) - mas só se pid E token
// batem com o dono REAL gravado em <pasta>/<nome>.dono e o pid está vivo. Um pid vivo qualquer
// não pula a fila; o token cobre o reuso de pid do Windows.
//
// Publicação do dono: o arquivo é escrito inteiro num temporário e publicado com link (atômico),
// então nunca aparece vazio. Mesmo assim, dono ilegível com mais de 5 s é tratado como abandonado.
// Limites assumidos: duas "primeiras" da fila ao mesmo tempo (uma sai da fila, outra chega) é uma
// janela de milissegundos; o compare-e-apague do dono morto reduz, não elimina. Se acontecer, a
// publicação atômica garante que só UM fica com a vaga.
//
// LIMITE do "npm run pesado": o comando vira uma string para o shell (cmd.exe no Windows), então
// ">", "|", "&&" e afins em argumentos são interpretados por ele. Use comando simples; a forma
// segura é "npm run pesado -- node arquivo.js args".
//
// ER_VAGA_PASTA troca a pasta das vagas (os testes usam uma por teste, sem tocar a real).
import { mkdirSync, writeFileSync, readFileSync, readdirSync, unlinkSync, linkSync, statSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ESPERA_MAX_PADRAO_MS = 20 * 60 * 1000;
const AVISO_PADRAO_MS = 30 * 1000;
const SONDAGEM_MS = 250;

function pasta() {
  const p = process.env.ER_VAGA_PASTA || join(tmpdir(), "elite-redux-vagas");
  mkdirSync(p, { recursive: true });
  return p;
}

function vivo(pid) {
  if (!pid) return false;
  try { process.kill(Number(pid), 0); return true; } catch (e) { return e.code === "EPERM"; }
}

function lerJson(arq) {
  try { return JSON.parse(readFileSync(arq, "utf8")); } catch { return null; }
}

// Dono ilegível (vazio, truncado) há mais de 5 s não é de ninguém: abandonado.
const ILEGIVEL_ABANDONADO_MS = 5000;
function donoAbandonado(arq) {
  const d = lerJson(arq);
  if (d) return !vivo(d.pid);
  try { return Date.now() - statSync(arq).mtimeMs > ILEGIVEL_ABANDONADO_MS; } catch { return false; }
}

function existe(arq) { try { statSync(arq); return true; } catch { return false; } }

function dorme(ms) { return new Promise((r) => setTimeout(r, ms)); }

// Fila viva do nome, em ordem de chegada (a fila tem o instante no nome do arquivo).
// Entradas de processos mortos são removidas no caminho.
function filaViva(dir, nome) {
  const prefixo = nome + ".fila.";
  const fila = [];
  for (const f of readdirSync(dir).filter((x) => x.startsWith(prefixo)).sort()) {
    const dados = lerJson(join(dir, f));
    if (dados && vivo(dados.pid)) fila.push({ arquivo: f, ...dados });
    else if (!dados) { /* ainda sendo escrita: ignora nesta rodada */ }
    else { try { unlinkSync(join(dir, f)); } catch { /* outro limpou */ } }
  }
  return fila;
}

// Pega a vaga (esperando na fila) e devolve a função que a solta. Também solta sozinha no exit.
export async function segurarVaga(nome, { esperaMaxMs = ESPERA_MAX_PADRAO_MS, avisoMs = AVISO_PADRAO_MS } = {}) {
  // Reentrância: o pai já segura a vaga e me avisou pelo ambiente.
  const dir = pasta();
  const dono = join(dir, nome + ".dono");
  const pai = Number(process.env.ER_VAGA_DONO);
  if (pai && vivo(pai)) {
    const real = lerJson(dono);
    if (real && real.pid === pai && real.token && real.token === process.env.ER_VAGA_TOKEN) return () => {};
  }
  const chegada = Date.now();
  const meu = nome + ".fila." + String(chegada).padStart(15, "0") + "-" + String(process.pid).padStart(8, "0") + "-" + Math.random().toString(36).slice(2, 6);
  const token = randomBytes(8).toString("hex");
  const info = { pid: process.pid, pasta: process.cwd(), desde: new Date(chegada).toISOString(), token };
  writeFileSync(join(dir, meu), JSON.stringify(info));

  const sair = () => { try { unlinkSync(join(dir, meu)); } catch { /* já saiu */ } };
  let ultimoAviso = chegada;
  try {
    for (;;) {
      const fila = filaViva(dir, nome);
      if (fila.length && fila[0].arquivo === meu) {
        // Sou o primeiro: libero dono morto e tento assumir (só o primeiro da fila faz isso).
        if (existe(dono) && donoAbandonado(dono)) {
          // compare-e-apague: relê logo antes, só apaga se continua abandonado
          if (donoAbandonado(dono)) { try { unlinkSync(dono); } catch { /* já limpo */ } }
        }
        const tmp = dono + ".tmp." + process.pid;
        writeFileSync(tmp, JSON.stringify(info));
        try {
          linkSync(tmp, dono); // atômico: ou publica inteiro, ou EEXIST
          break;
        } catch (e) {
          if (e.code !== "EEXIST") throw e;
        } finally {
          try { unlinkSync(tmp); } catch { /* já limpo */ }
        }
      }
      const agora = Date.now();
      if (agora - chegada >= esperaMaxMs) {
        const d = lerJson(dono) || (fila[0] && fila[0]);
        throw new Error("Vaga " + nome + ": esperei " + Math.round((agora - chegada) / 1000) + " s e estourei o limite de " +
          Math.round(esperaMaxMs / 1000) + " s (dono: pid " + (d && d.pid) + ", pasta " + (d && d.pasta) + ").");
      }
      if (agora - ultimoAviso >= avisoMs) {
        ultimoAviso = agora;
        const d = lerJson(dono);
        const atras = d || fila.find((x) => x.arquivo !== meu) || {};
        console.error("Aguardando vaga " + nome + ": na fila atrás de pid " + atras.pid + ", pasta " + atras.pasta + ", há " + Math.round((agora - chegada) / 1000) + " s");
      }
      await dorme(SONDAGEM_MS);
    }
  } catch (e) {
    sair();
    throw e;
  }
  sair();

  const antes = process.env.ER_VAGA_DONO;
  const antesToken = process.env.ER_VAGA_TOKEN;
  process.env.ER_VAGA_DONO = String(process.pid);
  process.env.ER_VAGA_TOKEN = token;
  const soltar = () => {
    process.off("exit", soltar);
    try { if (lerJson(dono)?.token === token) unlinkSync(dono); } catch { /* já solta */ }
    if (antes === undefined) delete process.env.ER_VAGA_DONO; else process.env.ER_VAGA_DONO = antes;
    if (antesToken === undefined) delete process.env.ER_VAGA_TOKEN; else process.env.ER_VAGA_TOKEN = antesToken;
  };
  // Se o processo sair (process.exit, fim normal) o gancho de exit solta; queda feia: o pid morto libera.
  process.on("exit", soltar);
  return soltar;
}

export async function comVaga(nome, fn, opcoes) {
  const soltar = await segurarVaga(nome, opcoes);
  try { return await fn(); } finally { soltar(); }
}

// CLI: node scripts/vaga.mjs <comando...>  -> roda o comando segurando a vaga "pesada".
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (!args.length) {
    console.error("Uso: npm run pesado -- <comando...>");
    process.exit(2);
  }
  const comando = args.map((a) => (/[\s"]/.test(a) ? '"' + a.replace(/"/g, '\\"') + '"' : a)).join(" ");
  try {
    const codigo = await comVaga("pesada", () => new Promise((resolve) => {
      const f = spawn(comando, { stdio: "inherit", shell: true });
      f.on("exit", (c, sinal) => resolve(c === null ? (sinal ? 1 : 0) : c));
      f.on("error", () => resolve(1));
    }));
    process.exit(codigo);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
