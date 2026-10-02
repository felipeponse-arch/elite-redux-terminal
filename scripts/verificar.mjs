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
import { openSync, closeSync, writeSync, readFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const RAIZ = fileURLToPath(new URL("..", import.meta.url));
const ETAPAS = [
  ["travas: codificação, sintaxe, lint (JS e CSS) e tipos", "npm run check --silent", "Trava estática falhou"],
  ["testes unitários das regras", "npm run test:unit --silent", "Testes unitários falharam"],
  ["sabotagem das regras (todo defeito do catálogo tem que ser pego)", "npm run test:sabotage --silent", "Alguma sabotagem sobreviveu (ou o catálogo está desatualizado)"],
  ["build (npm run build)", "npm run build --silent", "Build falhou"],
  ["testes de navegador (Playwright, projeto funcional)", "npm run test:e2e --silent", "Teste de navegador falhou - detalhes: npm run test:relatorio"],
];

// Trava de sessão (ADR-001 em docs/decisoes_arquitetura.md, 2026-10-02): duas sessões
// verificando ao mesmo tempo (mesma pasta OU worktrees diferentes) se atropelam - a
// porta 8101 dos testes é da máquina, e com reuseExistingServer uma sessão testa o build
// da outra; na mesma pasta ainda apagam o test-results uma da outra (02/10: prepare_publish
// recusou 3 vezes assim). A trava é da máquina (pasta temporária), com o pid do dono:
// outra verificação viva = para na hora; dono morto (queda de energia, Ctrl+C) = assume.
const TRAVA = join(tmpdir(), "elite-redux-verificar.lock");
function pegarTrava() {
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    try {
      const fd = openSync(TRAVA, "wx");
      writeSync(fd, JSON.stringify({ pid: process.pid, pasta: RAIZ, desde: new Date().toISOString() }));
      closeSync(fd);
      return;
    } catch (e) {
      if (e.code !== "EEXIST") throw e;
      let dono = null;
      try { dono = JSON.parse(readFileSync(TRAVA, "utf8")); } catch { /* trava ilegível: trata como abandonada */ }
      let vivo = false;
      try { if (dono && dono.pid) { process.kill(dono.pid, 0); vivo = true; } } catch { /* pid não existe mais */ }
      if (vivo) {
        console.error("Outra sessão já está verificando (pid " + dono.pid + ", " + dono.pasta + ", desde " + dono.desde + ").");
        console.error("Espere ela terminar e rode de novo - as duas juntas se atropelam (porta 8101 e test-results).");
        process.exit(1);
      }
      try { unlinkSync(TRAVA); } catch { /* outra sessão limpou antes */ }
    }
  }
  console.error("Não consegui pegar a trava " + TRAVA + " - rode de novo.");
  process.exit(1);
}
pegarTrava();
process.on("exit", () => {
  try { if (JSON.parse(readFileSync(TRAVA, "utf8")).pid === process.pid) unlinkSync(TRAVA); } catch { /* já saiu */ }
});

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
