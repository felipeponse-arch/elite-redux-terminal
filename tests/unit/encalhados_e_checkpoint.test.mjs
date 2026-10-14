// Testes de scripts/encalhados.mjs e scripts/checkpoint.mjs (melhoria C do fluxo).
// Nunca tocam nos worktrees reais: tudo roda num repositório git montado em tmpdir.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, utimesSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  lerWorktrees, lerStatus, avaliarAlertas, formatarRelatorio, coletar,
} from '../../scripts/encalhados.mjs';
import { checkpoint, montarMensagem } from '../../scripts/checkpoint.mjs';

// Quando o gancho de pré-commit roda os testes, o git injeta GIT_DIR, GIT_INDEX_FILE etc. no ambiente.
// Herdar isso faria o `git init` do tmpdir mexer no repositório REAL (já aconteceu: core.bare virou true).
// Por isso limpamos todo GIT_* do processo antes de qualquer comando git.
for (const chave of Object.keys(process.env)) if (chave.startsWith('GIT_')) delete process.env[chave];

const git = (cwd, ...args) =>
  execFileSync('git', ['--no-pager', '-c', 'user.name=T', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', ...args],
    { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

/** Monta o repositório de teste: principal no master + worktree "t1" em .claude/worktrees. */
function montarRepo() {
  const raiz = mkdtempSync(path.join(tmpdir(), 'er-encalhados-'));
  const principal = path.join(raiz, 'principal');
  mkdirSync(principal);
  git(principal, 'init', '-q', '-b', 'master');
  writeFileSync(path.join(principal, '.gitignore'), '.claude/\n');
  writeFileSync(path.join(principal, 'a.txt'), 'a\n');
  git(principal, 'add', '-A');
  git(principal, 'commit', '-q', '-m', 'inicial');
  const t1 = path.join(principal, '.claude', 'worktrees', 't1');
  git(principal, 'worktree', 'add', '-q', t1, '-b', 't1');
  return { raiz, principal, t1 };
}

test('lerWorktrees e lerStatus: parsing puro, sem git', () => {
  const wts = lerWorktrees('worktree C:/r\nHEAD abc\nbranch refs/heads/master\n\nworktree C:/r/.claude/worktrees/x\nHEAD def\nbranch refs/heads/x\n\nworktree C:/tmp/y\nHEAD 123\ndetached\n');
  assert.deepEqual(wts.map((w) => w.branch), ['master', 'x', null]);
  assert.equal(wts[2].destacado, true);
  const st = lerStatus('M  a.txt\0 M b.txt\0?? c.txt\0R  novo.txt\0velho.txt\0');
  assert.equal(st.staging, 2);
  assert.equal(st.modificados, 1);
  assert.equal(st.novos, 1);
  assert.deepEqual(st.arquivos, ['a.txt', 'b.txt', 'c.txt', 'novo.txt']);
});

test('avaliarAlertas: staging na principal, sujo há mais de 24 h, commits à frente', () => {
  const agora = Date.now();
  const base = { principal: false, staging: 0, arquivosSujos: 0, ultimaMod: null, aFrente: 0 };
  assert.deepEqual(avaliarAlertas(base, agora), []);
  assert.equal(avaliarAlertas({ ...base, principal: true, staging: 3 }, agora).length, 1);
  assert.equal(avaliarAlertas({ ...base, arquivosSujos: 2, ultimaMod: agora - 25 * 3600000 }, agora).length, 1);
  assert.equal(avaliarAlertas({ ...base, arquivosSujos: 2, ultimaMod: agora - 3600000 }, agora).length, 0);
  assert.equal(avaliarAlertas({ ...base, aFrente: 2 }, agora).length, 1);
  assert.match(formatarRelatorio([{ ...base, caminho: 'C:/x', branch: 'x', modificados: 0, novos: 0, staging: 0, arquivos: [], alertas: [] }], agora), /^ok/);
});

test('encalhados: worktree sujo aparece com a contagem certa e fora dele é ignorado', () => {
  const { raiz, principal, t1 } = montarRepo();
  try {
    writeFileSync(path.join(t1, 'a.txt'), 'mudou\n');
    writeFileSync(path.join(t1, 'novo1.txt'), '1');
    writeFileSync(path.join(t1, 'novo2.txt'), '2');
    writeFileSync(path.join(t1, 'staged.txt'), 's');
    git(t1, 'add', 'staged.txt');
    // pasta temporária fora de .claude/worktrees: deve ser ignorada
    git(principal, 'worktree', 'add', '-q', '--detach', path.join(raiz, 'fora'));
    const itens = coletar(principal);
    assert.equal(itens.length, 2); // principal + t1; "fora" não entra
    const t = itens.find((i) => i.branch === 't1');
    assert.equal(t.modificados, 1);
    assert.equal(t.novos, 2);
    assert.equal(t.staging, 1);
    assert.equal(t.aFrente, 0);
    assert.ok(t.ultimaMod > 0);
    assert.equal(itens.find((i) => i.principal).alertas.length, 0);
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
});

test('encalhados: sujo há mais de 24 h, commit à frente do master e staging na principal geram alerta', () => {
  const { raiz, principal, t1 } = montarRepo();
  try {
    writeFileSync(path.join(t1, 'f.txt'), 'x');
    const antigo = new Date(Date.now() - 30 * 3600000);
    utimesSync(path.join(t1, 'f.txt'), antigo, antigo);
    git(t1, 'add', '-A');
    git(t1, 'commit', '-q', '-m', 'trabalho do ticket');
    writeFileSync(path.join(t1, 'g.txt'), 'y');
    utimesSync(path.join(t1, 'g.txt'), antigo, antigo);
    writeFileSync(path.join(principal, 'solto.txt'), 'z');
    git(principal, 'add', 'solto.txt');
    const itens = coletar(principal);
    const t = itens.find((i) => i.branch === 't1');
    assert.equal(t.aFrente, 1);
    assert.equal(t.alertas.length, 2); // à frente + sujo há mais de 24 h
    const p = itens.find((i) => i.principal);
    assert.equal(p.staging, 1);
    assert.equal(p.alertas.length, 1);
    const texto = formatarRelatorio(itens, Date.now());
    assert.match(texto, /ALERTA t1/);
    assert.match(texto, /staging na pasta principal/);
    assert.match(texto, /commit\(s\) que o master não tem/);
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
});

test('checkpoint: commita tudo, deixa o worktree limpo e roda o gancho com ER_WIP=1', () => {
  const { raiz, t1 } = montarRepo();
  try {
    writeFileSync(path.join(t1, 'novo.txt'), 'n');
    writeFileSync(path.join(t1, 'a.txt'), 'mudou');
    // gancho de teste: grava o valor de ER_WIP, prova que o gancho roda (sem --no-verify)
    const gancho = execFileSync('git', ['rev-parse', '--git-path', 'hooks/pre-commit'], { cwd: t1, encoding: 'utf8' }).trim();
    const caminhoGancho = path.resolve(t1, gancho);
    mkdirSync(path.dirname(caminhoGancho), { recursive: true });
    const marcador = path.join(raiz, 'er_wip.txt').replace(/\\/g, '/');
    writeFileSync(caminhoGancho, `#!/bin/sh\necho "$ER_WIP" > "${marcador}"\n`, { mode: 0o755 });
    const r = checkpoint({ cwd: t1, motivo: 'parado no meio', env: { GIT_AUTHOR_NAME: 'T', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 'T', GIT_COMMITTER_EMAIL: 't@t' } });
    assert.equal(r.codigo, 0, r.mensagem);
    assert.equal(r.commitou, true);
    assert.equal(git(t1, 'status', '--porcelain').trim(), '');
    const msg = git(t1, 'log', '-1', '--format=%B');
    assert.match(msg, /^WIP: parado no meio/);
    assert.match(msg, /Co-Authored-By: Claude Sonnet 5\.5 <noreply@anthropic\.com>/);
    assert.ok(existsSync(marcador), 'o gancho deveria ter rodado');
    assert.equal(readFileSync(marcador, 'utf8').trim(), '1');
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
});

test('checkpoint: sem mudança não faz commit e sai com 0', () => {
  const { raiz, t1 } = montarRepo();
  try {
    const antes = git(t1, 'rev-parse', 'HEAD');
    const r = checkpoint({ cwd: t1, motivo: 'nada' });
    assert.equal(r.codigo, 0);
    assert.equal(r.commitou, false);
    assert.match(r.mensagem, /Nada para commitar/);
    assert.equal(git(t1, 'rev-parse', 'HEAD'), antes);
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
});

test('checkpoint: recusa no master, na pasta principal e sem motivo', () => {
  const { raiz, principal, t1 } = montarRepo();
  try {
    writeFileSync(path.join(principal, 'sujo.txt'), 's');
    const r = checkpoint({ cwd: principal, motivo: 'x' });
    assert.equal(r.codigo, 1);
    assert.match(r.mensagem, /master/);
    assert.equal(git(principal, 'status', '--porcelain').trim(), '?? sujo.txt'); // nada foi tocado
    // principal em outro branch também é recusada (pasta principal)
    git(principal, 'checkout', '-q', '-b', 'outro');
    const r2 = checkpoint({ cwd: principal, motivo: 'x' });
    assert.equal(r2.codigo, 1);
    assert.match(r2.mensagem, /pasta principal/);
    assert.equal(checkpoint({ cwd: t1, motivo: '  ' }).codigo, 1);
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
});

test('montarMensagem: prefixo WIP e atribuição', () => {
  assert.equal(montarMensagem('abc'), 'WIP: abc\n\nCo-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\n');
});
