// Verificação antes de um commit (hook de pre-commit) e antes de publicar (prepare_publish.ps1).
// Fase 8 da refatoração (2026-09-24): em Node, roda igual em Windows, Linux e macOS - era um .ps1,
// e o PowerShell 5.1 tratava qualquer aviso no stderr de um processo filho como erro fatal.
//
// GANCHO POR NÍVEL (melhoria A, 2026-10-14): o gancho lê os arquivos em staging
// (git diff --cached) e roda só o que o tipo de mudança pede. Quem decide é a função pura
// scripts/nivel_da_mudanca.mjs (testada em tests/unit/nivel_da_mudanca.test.mjs). Na dúvida SOBE.
//
//   Nível | Mudou                                                  | Roda
//   0     | só docs/, *.md, GLOSSARY.md, AUDITORIA-DOSSIE.md       | check
//   1     | só tests/unit/                                         | check + unitários (+ sabotagem --mudados se mutacoes.mjs)
//   2     | src/regras/, scripts/ da lista branca (checkpoint, encalhados...) | check + unitários + sabotagem (--mudados fora do master)
//   3     | o resto: src/ui, css, template, build, e2e, data, configs, caminho desconhecido | tudo (+ build + navegador)
//   Master: a sabotagem é INCREMENTAL (--desde o último master verde, gravado em <git-common-dir>/er-ultimo-master-verde)
//   quando há registro válido; COMPLETA sem registro, com ER_VERIFICAR=completo e no prepare_publish.
//   Sempre 3: branch master, ER_VERIFICAR=completo, nada em staging, execução MANUAL fora de um commit
//   (GIT_INDEX_FILE ausente; --por-staging força a classificação por staging).
//   ER_WIP=1 (npm run checkpoint) = nível 0, menos no master.
//
// Etapas, da mais barata pra mais cara (para na primeira que falhar):
//   travas estáticas -> unitários -> sabotagem -> build -> testes de navegador
//
// Uso: npm run verificar   (pular no commit, sem recomendação: git commit --no-verify)
//      node scripts/verificar.mjs --nivel [arquivos...]   só imprime o nível e as etapas (não roda nada)
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { gerarMapa } from "./mapa_do_codigo.mjs";
import { writeFileSync } from "node:fs";
import { segurarVaga } from "./vaga.mjs";
import { lerVerde, gravarVerde, modoDaSabotagemNoMaster } from "./sabotagem_incremental.mjs";
import { nivelDaMudanca, etapasDoNivel, ambienteDosFilhos, arquivosEmStaging, classificarPorStaging, precisaDaVagaPesada } from "./nivel_da_mudanca.mjs";

const RAIZ = fileURLToPath(new URL("..", import.meta.url));
const ARGS = process.argv.slice(2);

// Os passos filhos NÃO herdam as variáveis de localização do git (GIT_DIR, GIT_INDEX_FILE...) que o
// gancho recebe: senão um teste que roda `git` enxerga e ESCREVE no repositório real (incidente de
// 14/10/2026: core.bare=true). Lido a cada passo, depois de segurarVaga (que acrescenta ER_VAGA_*).
function rodar(comando) {
  // shell: true pro "npm" resolver igual em todo sistema (npm.cmd no Windows).
  return spawnSync(comando, { cwd: RAIZ, stdio: "inherit", shell: true, env: ambienteDosFilhos(process.env) });
}

// Sonda de teste: roda de verdade UM filho pelo mesmo caminho dos passos e mostra o env que ele recebeu.
if (ARGS.includes("--sonda-env")) {
  const r = rodar('node -p "Object.keys(process.env).filter(k=>k.startsWith(\'GIT_\')).join(\',\')+\'|\'+process.env.ER_SONDA"');
  process.exit(r.status ?? 1);
}

// Regra do QA (08/10/2026): no branch de um ticket, só as sabotagens ligadas ao que
// mudou; no master (merge e publicar) a suíte inteira.
const BRANCH = (spawnSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: RAIZ, encoding: "utf8" }).stdout || "").trim();

const modoNivel = ARGS.includes("--nivel");
const manuais = ARGS.filter((a) => !a.startsWith("--"));
// Arquivos dados na linha de comando valem só no --nivel (simulação). Senão: staging (dentro do commit ou
// com --por-staging); execução manual fora do commit = lista vazia = nível 3. Lido ANTES de limpar o ambiente.
const ARQUIVOS = modoNivel && manuais.length ? manuais : classificarPorStaging(process.env, ARGS) ? arquivosEmStaging(RAIZ) : [];
const { nivel: NIVEL, motivo: MOTIVO } = nivelDaMudanca(ARQUIVOS, { branch: BRANCH, env: process.env });
// Master: sabotagem incremental desde o último master verde (se houver registro válido e sem ER_VERIFICAR=completo).
const VERDE = BRANCH === "master" ? lerVerde(RAIZ) : null;
const ETAPAS = etapasDoNivel(NIVEL, { branch: BRANCH, arquivos: ARQUIVOS, verde: VERDE, env: process.env });
const SABOTAGEM_DO_MASTER = BRANCH === "master" && ETAPAS.some((e) => e.id === "sabotagem" && !e.comando.includes("--mudados"));
console.log(`Nível ${NIVEL} (${MOTIVO}): ${ETAPAS.map((e) => e.id).join(", ")}`);
if (modoNivel) process.exit(0);

// Mapa do código sempre atualizado (ticket mapa-do-codigo/01): código em staging regenera docs/mapa-do-codigo.md
// e entra no mesmo commit. Só a parte local (sem Graphify): ~0,1 s.
if (ARQUIVOS.some((a) => /^(src|scripts)\//.test(a))) {
  writeFileSync(new URL("../docs/mapa-do-codigo.md", import.meta.url), gerarMapa(RAIZ));
  spawnSync("git", ["add", "docs/mapa-do-codigo.md"], { cwd: RAIZ, stdio: "inherit" });
}

// Vaga de sessão (ADR-001 em docs/decisoes_arquitetura.md, 2026-10-02; melhoria B, 2026-10-13):
// duas sessões verificando ao mesmo tempo (mesma pasta OU worktrees diferentes) se atropelam -
// a porta 8101 dos testes é da máquina, e com reuseExistingServer uma sessão testa o build da
// outra; na mesma pasta ainda apagam o test-results uma da outra. Antes a trava FALHAVA na
// hora; agora a vaga "pesada" (scripts/vaga.mjs) faz fila e ESPERA, com pid do dono (morto =
// libera). Nível sem etapa pesada (0, 1 sem sabotagem) não entra na fila (ticket portao-vaga/01). Os filhos herdam ER_VAGA_DONO e não pedem a vaga de novo (a sabotagem roda aqui dentro).
try {
  // Sem etapa pesada (nível 0, nível 1 sem sabotagem) não entra na fila (ticket portao-vaga/01).
  if (precisaDaVagaPesada(ETAPAS)) await segurarVaga("pesada");
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

const inicio = Date.now();
for (const { titulo, comando, falha } of ETAPAS) {
  console.log(`--- ${titulo} ---`);
  const r = rodar(comando);
  if (r.status !== 0) {
    console.error(`\n${falha} - bloqueado.`);
    console.error("Pra pular de propósito (não recomendado): git commit --no-verify");
    process.exit(1);
  }
}
// Portão do master passou (check, unitários, sabotagem completa OU incremental, build, navegador): este HEAD vira o
// "último master verde" - só com a árvore limpa (gravarVerde recusa se há mudança não commitada).
if (SABOTAGEM_DO_MASTER && ETAPAS.some((e) => e.id === "navegador")) {
  const g = gravarVerde(RAIZ);
  if (g) console.log(`Último master verde gravado: ${g.slice(0, 7)} (sabotagem ${modoDaSabotagemNoMaster({ verde: VERDE, env: process.env }).modo})`);
}
console.log(`\nNível ${NIVEL}: ${ETAPAS.map((e) => e.id).join(" + ")} passaram em ${Math.round((Date.now() - inicio) / 1000)} s - liberado.`);
