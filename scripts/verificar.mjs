// Verificação completa antes de um commit (hook de pre-commit) e antes de
// publicar (prepare_publish.ps1). Fase 8 da refatoração (2026-09-24): em Node,
// roda igual em Windows, Linux e macOS - era um .ps1, e o PowerShell 5.1
// tratava qualquer aviso no stderr de um processo filho como erro fatal.
//
// Etapas, da mais barata pra mais cara (para na primeira que falhar):
//   travas estáticas -> unitários -> sabotagem -> build -> testes de navegador
//
// Uso: npm run verificar   (pular no commit, sem recomendação: git commit --no-verify)
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { segurarVaga } from "./vaga.mjs";

const RAIZ = fileURLToPath(new URL("..", import.meta.url));
// Regra do QA (08/10/2026): no branch de um ticket, só as sabotagens ligadas ao que
// mudou; no master (merge e publicar) a suíte inteira.
const BRANCH = (spawnSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: RAIZ, encoding: "utf8" }).stdout || "").trim();
const SABOTAGEM = BRANCH === "master" ? "node tests/run_sabotage.mjs" : "node tests/run_sabotage.mjs --mudados";
const ETAPAS = [
  ["travas: codificação, sintaxe, lint (JS e CSS) e tipos", "npm run check --silent", "Trava estática falhou"],
  ["testes unitários das regras", "npm run test:unit --silent", "Testes unitários falharam"],
  ["sabotagem das regras (" + (BRANCH === "master" ? "catálogo inteiro" : "só o que mudou desde o master") + ")", SABOTAGEM, "Alguma sabotagem sobreviveu (ou o catálogo está desatualizado)"],
  ["build (npm run build)", "npm run build --silent", "Build falhou"],
  ["testes de navegador (Playwright, projeto funcional)", "npm run test:e2e --silent", "Teste de navegador falhou - detalhes: npm run test:relatorio"],
];


// Vaga de sessão (ADR-001 em docs/decisoes_arquitetura.md, 2026-10-02; melhoria B, 2026-10-13):
// duas sessões verificando ao mesmo tempo (mesma pasta OU worktrees diferentes) se atropelam -
// a porta 8101 dos testes é da máquina, e com reuseExistingServer uma sessão testa o build da
// outra; na mesma pasta ainda apagam o test-results uma da outra. Antes a trava FALHAVA na
// hora; agora a vaga "pesada" (scripts/vaga.mjs) faz fila e ESPERA, com pid do dono (morto =
// libera). Os filhos herdam ER_VAGA_DONO e não pedem a vaga de novo (a sabotagem roda aqui dentro).
try {
  await segurarVaga("pesada");
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

const inicio = Date.now();
for (const [titulo, comando, falha] of ETAPAS) {
  console.log(`--- ${titulo} ---`);
  // shell: true pro "npm" resolver igual em todo sistema (npm.cmd no Windows).
  const r = spawnSync(comando, { cwd: RAIZ, stdio: "inherit", shell: true });
  if (r.status !== 0) {
    console.error(`\n${falha} - bloqueado.`);
    console.error("Pra pular de propósito (não recomendado): git commit --no-verify");
    process.exit(1);
  }
}
console.log(`\nBuild + suíte completa passaram em ${Math.round((Date.now() - inicio) / 1000)} s - liberado.`);
