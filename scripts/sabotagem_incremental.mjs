// Sabotagem incremental no master (decisão do usuário, 14/10/2026): no master a sabotagem roda só as
// mutações ligadas ao que mudou desde o ÚLTIMO MASTER VERDE; a completa fica para publicar
// (prepare_publish) e para ER_VERIFICAR=completo. Prioridade: nunca deixar passar mutação de arquivo
// mudado > velocidade. Na dúvida (sem registro, registro inválido) = completa.
//
// ONDE O VERDE FICA: <git-common-dir>/er-ultimo-master-verde (uma linha, o sha). O common-dir é o .git do
// repositório principal: é o MESMO arquivo para todos os worktrees, não aparece em git status, não vai
// para o GitHub e não depende de tmpdir. Um registro só vale se o commit existe e é ANTEPASSADO do HEAD
// atual (reset/rebase que tire o verde do histórico invalida: roda completa).
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { ambienteDosFilhos } from './nivel_da_mudanca.mjs';

const NOME_DO_REGISTRO = 'er-ultimo-master-verde';

function git(cwd, args) {
  const r = spawnSync('git', ['--no-pager', ...args], { cwd, encoding: 'utf8', env: ambienteDosFilhos(process.env) });
  return { ok: !r.error && r.status === 0, out: (r.stdout || '').trim() };
}

export function caminhoDoVerde(cwd) {
  const r = git(cwd, ['rev-parse', '--path-format=absolute', '--git-common-dir']);
  return r.ok && r.out ? path.join(r.out, NOME_DO_REGISTRO) : null;
}

/** Sha do último master verde, ou null (sem registro, lixo no arquivo, commit sumido ou fora do histórico do HEAD). */
export function lerVerde(cwd) {
  const arq = caminhoDoVerde(cwd);
  if (!arq) return null;
  let sha;
  try { sha = readFileSync(arq, 'utf8').trim(); } catch { return null; }
  if (!/^[0-9a-f]{40}$/.test(sha)) return null;
  if (!git(cwd, ['cat-file', '-e', `${sha}^{commit}`]).ok) return null;
  if (!git(cwd, ['merge-base', '--is-ancestor', sha, 'HEAD']).ok) return null;
  return sha;
}

/** Grava o HEAD como verde. Só com árvore LIMPA (HEAD é exatamente o que foi verificado). Devolve o sha ou null. */
export function gravarVerde(cwd) {
  const arq = caminhoDoVerde(cwd);
  if (!arq) return null;
  if (git(cwd, ['status', '--porcelain', '--untracked-files=no']).out !== '') return null;
  const head = git(cwd, ['rev-parse', 'HEAD']);
  if (!head.ok || !/^[0-9a-f]{40}$/.test(head.out)) return null;
  try { writeFileSync(arq, head.out + '\n'); } catch { return null; }
  return head.out;
}

/**
 * Regra da sabotagem no master. `verde` = sha válido ou null; `env` = ambiente de quem chama.
 * Completa quando: sem verde ou ER_VERIFICAR=completo (o prepare_publish seta o completo).
 * @returns {{modo: 'completa'|'incremental', motivo: string}}
 */
export function modoDaSabotagemNoMaster({ verde, env = {} } = {}) {
  if (env.ER_VERIFICAR === 'completo') return { modo: 'completa', motivo: 'ER_VERIFICAR=completo' };
  if (!verde) return { modo: 'completa', motivo: 'sem registro de master verde válido' };
  return { modo: 'incremental', motivo: `desde o último master verde ${verde.slice(0, 7)}` };
}

/**
 * Quais mutações rodar. Uma mutação entra se: o arquivo que ela sabota mudou (por nome), OU o teste que
 * costuma pegá-la (cache) mudou, OU ela é nova no catálogo (sem cache e id nas linhas acrescentadas),
 * OU é por comportamento (@comportamento) e algo de src/regras mudou.
 * @param {{id:string, arquivo:string}[]} mutacoes
 * @param {{mudados: Set<string>, cache: Record<string,string>, novas: Set<string>}} ctx
 */
export function selecionarMutacoes(mutacoes, { mudados, cache, novas }) {
  const nomes = new Set([...mudados].map((f) => f.split('/').pop()));
  // "@comportamento" sabota uma FUNÇÃO pelo nome (não há arquivo para comparar): entra sempre que algo de src/regras mudou.
  const mexeuEmRegras = [...mudados].some((f) => f.startsWith('src/regras/'));
  return mutacoes.filter((m) => nomes.has(m.arquivo) || (m.arquivo === '@comportamento' && mexeuEmRegras)
    || mudados.has(cache[m.id]) || (!cache[m.id] && novas.has(m.id)));
}
