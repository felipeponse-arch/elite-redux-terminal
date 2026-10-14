// Lista o trabalho encalhado: worktrees com mudança sem commit, staging na pasta principal
// e branches com commits que o master ainda não tem. SOMENTE LEITURA: nunca altera nada.
// Uso: npm run encalhados   (código de saída sempre 0: é informativo)
// Melhoria C do fluxo (docs/pipeline_do_projeto.md, seção 5).
import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LIMITE_SUJO_HORAS = 24;

/** Executa git e devolve a saída (string vazia se falhar). */
function git(cwd, args) {
  try {
    return execFileSync('git', ['--no-pager', ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
}

/** Normaliza caminho para comparação (barras e caixa, por causa do Windows). */
export function normalizarCaminho(p) {
  return path.resolve(p).replace(/\\/g, '/').toLowerCase();
}

/** Lê a saída de `git worktree list --porcelain` e devolve [{ caminho, branch, destacado }]. */
export function lerWorktrees(saida) {
  const lista = [];
  for (const bloco of saida.split(/\r?\n\r?\n/)) {
    const wt = { caminho: '', branch: null, destacado: false };
    for (const linha of bloco.split(/\r?\n/)) {
      if (linha.startsWith('worktree ')) wt.caminho = linha.slice(9).trim();
      else if (linha.startsWith('branch ')) wt.branch = linha.slice(7).trim().replace(/^refs\/heads\//, '');
      else if (linha.trim() === 'detached') wt.destacado = true;
    }
    if (wt.caminho) lista.push(wt);
  }
  return lista;
}

/**
 * Lê `git status --porcelain=v1 -z` e conta: staging (índice mexido), modificados (árvore mexida)
 * e novos (não rastreados). Devolve também a lista de caminhos sujos, sem repetição.
 */
export function lerStatus(saidaZ) {
  const partes = saidaZ.split('\0').filter((p) => p.length > 0);
  const r = { staging: 0, modificados: 0, novos: 0, arquivos: [] };
  for (let i = 0; i < partes.length; i++) {
    const entrada = partes[i];
    const x = entrada[0];
    const y = entrada[1];
    const arquivo = entrada.slice(3);
    // Renomeação/cópia traz o caminho de origem como entrada extra: pula.
    if (x === 'R' || x === 'C') i++;
    if (x === '?' && y === '?') r.novos++;
    else {
      if (x !== ' ' && x !== '?') r.staging++;
      if (y !== ' ' && y !== '?') r.modificados++;
    }
    if (!r.arquivos.includes(arquivo)) r.arquivos.push(arquivo);
  }
  return r;
}

/** Aplica as regras de alerta a um worktree já medido. Devolve a lista de textos de alerta. */
export function avaliarAlertas(wt, agoraMs, limiteHoras = LIMITE_SUJO_HORAS) {
  const alertas = [];
  if (wt.principal && wt.staging > 0) alertas.push(`${wt.staging} arquivo(s) em staging na pasta principal`);
  if (!wt.principal && wt.arquivosSujos > 0 && wt.ultimaMod != null) {
    const horas = (agoraMs - wt.ultimaMod) / 3600000;
    if (horas > limiteHoras) alertas.push(`sujo há ${Math.floor(horas)} h (mais de ${limiteHoras} h)`);
  }
  if (!wt.principal && wt.aFrente > 0) alertas.push(`${wt.aFrente} commit(s) que o master não tem`);
  return alertas;
}

function idade(ultimaMod, agoraMs) {
  if (ultimaMod == null) return '-';
  const h = (agoraMs - ultimaMod) / 3600000;
  return h < 1 ? 'há menos de 1 h' : h < 48 ? `há ${Math.floor(h)} h` : `há ${Math.floor(h / 24)} dias`;
}

/** Formata o relatório: uma linha por worktree e detalhes só dos que têm alerta. */
export function formatarRelatorio(itens, agoraMs) {
  const linhas = [];
  for (const wt of itens) {
    const nome = wt.principal ? `${wt.branch || '?'} (pasta principal)` : wt.branch || path.basename(wt.caminho);
    const marca = wt.alertas.length ? 'ALERTA' : 'ok    ';
    linhas.push(
      `${marca} ${nome}: ${wt.modificados} modificados, ${wt.novos} novos, ${wt.staging} em staging, ` +
        `${wt.aFrente} commit(s) à frente do master, última mudança ${idade(wt.ultimaMod, agoraMs)}`
    );
  }
  for (const wt of itens.filter((i) => i.alertas.length)) {
    linhas.push('', `-- ${wt.branch || path.basename(wt.caminho)} (${wt.caminho})`);
    for (const a of wt.alertas) linhas.push(`   ! ${a}`);
    for (const f of wt.arquivos.slice(0, 5)) linhas.push(`   - ${f}`);
    if (wt.arquivos.length > 5) linhas.push(`   ... e mais ${wt.arquivos.length - 5}`);
  }
  if (!itens.length) linhas.push('Nenhum worktree de trabalho encontrado.');
  return linhas.join('\n');
}

/** Mede todos os worktrees do repositório que contém `cwd`. */
export function coletar(cwd, agoraMs = Date.now()) {
  const todos = lerWorktrees(git(cwd, ['worktree', 'list', '--porcelain']));
  if (!todos.length) return [];
  const principal = normalizarCaminho(todos[0].caminho);
  const itens = [];
  for (const wt of todos) {
    const ehPrincipal = normalizarCaminho(wt.caminho) === principal;
    const dentro = normalizarCaminho(wt.caminho).includes('/.claude/worktrees/');
    if (!ehPrincipal && !dentro) continue; // pastas temporárias fora de .claude/worktrees
    if (!ehPrincipal && wt.branch === 'master') continue; // o worktree do master (publicar)
    const st = lerStatus(git(wt.caminho, ['status', '--porcelain=v1', '-z']));
    let ultimaMod = null;
    for (const f of st.arquivos) {
      try {
        const t = statSync(path.join(wt.caminho, f)).mtimeMs;
        if (ultimaMod == null || t > ultimaMod) ultimaMod = t;
      } catch {
        /* arquivo apagado: sem data */
      }
    }
    const aFrente = wt.branch && wt.branch !== 'master'
      ? Number(git(wt.caminho, ['rev-list', '--count', `master..${wt.branch}`]).trim()) || 0
      : 0;
    const item = {
      caminho: wt.caminho, branch: wt.branch, principal: ehPrincipal,
      modificados: st.modificados, novos: st.novos, staging: st.staging,
      arquivosSujos: st.arquivos.length, arquivos: st.arquivos, ultimaMod, aFrente, alertas: [],
    };
    item.alertas = avaliarAlertas(item, agoraMs);
    itens.push(item);
  }
  return itens;
}

const executadoDireto = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (executadoDireto) {
  const agora = Date.now();
  console.log(formatarRelatorio(coletar(process.cwd(), agora), agora));
}
