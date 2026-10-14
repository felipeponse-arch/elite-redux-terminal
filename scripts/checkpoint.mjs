// Salva o trabalho parado de um worktree de ticket: `git add -A` + commit "WIP: <motivo>".
// Uso: npm run checkpoint -- "motivo"
// Melhoria C do fluxo (docs/pipeline_do_projeto.md, seção 5).
//
// - Roda `git add -A` SÓ no próprio worktree (aqui é permitido: o worktree é de um ticket só).
// - Define ER_WIP=1 no ambiente do `git commit`. NÃO usa --no-verify: o gancho continua rodando.
// - Recusa rodar no branch master e na pasta principal.
// - Sem mudança: avisa e sai com 0.
// PENDENTE (melhoria A, gancho por nível): hoje scripts/verificar.mjs AINDA IGNORA ER_WIP e roda o
// gate completo. Quando a melhoria A entrar, o gancho passa a rodar só o nível leve com ER_WIP=1.
import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerWorktrees, normalizarCaminho } from './encalhados.mjs';

const ATRIBUICAO = 'Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>';

function git(cwd, args) {
  return execFileSync('git', ['--no-pager', ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

/** Monta a mensagem de commit do checkpoint. */
export function montarMensagem(motivo) {
  return `WIP: ${motivo}\n\n${ATRIBUICAO}\n`;
}

/**
 * Faz o checkpoint em `cwd`. Devolve { codigo, mensagem, commitou }.
 * `env` entra no ambiente do git (os testes usam para ler o ER_WIP num gancho).
 */
export function checkpoint({ cwd, motivo, env = {} }) {
  if (!motivo || !motivo.trim()) {
    return { codigo: 1, commitou: false, mensagem: 'Informe o motivo: npm run checkpoint -- "motivo"' };
  }
  let topo, branch, principal;
  try {
    topo = git(cwd, ['rev-parse', '--show-toplevel']);
    branch = git(cwd, ['branch', '--show-current']);
    principal = lerWorktrees(git(cwd, ['worktree', 'list', '--porcelain']))[0].caminho;
  } catch {
    return { codigo: 1, commitou: false, mensagem: 'Isto não é um repositório git.' };
  }
  if (branch === 'master') return { codigo: 1, commitou: false, mensagem: 'Recusado: o branch master não recebe checkpoint.' };
  if (!branch) return { codigo: 1, commitou: false, mensagem: 'Recusado: HEAD solto (sem branch).' };
  if (normalizarCaminho(topo) === normalizarCaminho(principal)) {
    return { codigo: 1, commitou: false, mensagem: 'Recusado: esta é a pasta principal. Rode dentro de um worktree de ticket.' };
  }
  git(topo, ['add', '-A']);
  if (!git(topo, ['status', '--porcelain'])) {
    return { codigo: 0, commitou: false, mensagem: 'Nada para commitar: o worktree já está limpo.' };
  }
  const r = spawnSync('git', ['--no-pager', 'commit', '-F', '-'], {
    cwd: topo, input: montarMensagem(motivo.trim()), encoding: 'utf8',
    env: { ...process.env, ...env, ER_WIP: '1' },
  });
  if (r.status !== 0) {
    return { codigo: r.status || 1, commitou: false, mensagem: `O commit falhou (o gancho pode ter barrado):\n${(r.stdout || '') + (r.stderr || '')}`.trim() };
  }
  return { codigo: 0, commitou: true, mensagem: `Checkpoint salvo em ${branch}: WIP: ${motivo.trim()}` };
}

const executadoDireto = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (executadoDireto) {
  const res = checkpoint({ cwd: process.cwd(), motivo: process.argv.slice(2).join(' ') });
  console.log(res.mensagem);
  process.exit(res.codigo);
}
