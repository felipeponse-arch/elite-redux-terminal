// Sabotagem incremental no master (decisão do usuário, 14/10/2026). Cobre a regra:
//   master com registro verde válido -> incremental (--desde <sha>); sem registro / inválido -> completa;
//   publicar (prepare_publish) e ER_VERIFICAR=completo -> completa.
// E a prova de que o incremental NÃO ignora arquivo mudado (selecionarMutacoes contra o catálogo real).
// Os testes de git usam repositórios temporários; nada toca o repositório real.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { etapasDoNivel, ambienteDosFilhos } from '../../scripts/nivel_da_mudanca.mjs';
import {
  caminhoDoVerde, lerVerde, gravarVerde, modoDaSabotagemNoMaster, selecionarMutacoes,
} from '../../scripts/sabotagem_incremental.mjs';
import { MUTACOES } from './mutacoes.mjs';

const RAIZ = fileURLToPath(new URL('../..', import.meta.url));
const SHA = 'a'.repeat(40);
const MASTER = { branch: 'master' };
const comandoDaSabotagem = (ctx) => etapasDoNivel(3, ctx).find((e) => e.id === 'sabotagem')?.comando;

test('tabela: master com registro verde -> incremental', () => {
  assert.equal(comandoDaSabotagem({ ...MASTER, verde: SHA, env: {} }), `node tests/run_sabotage.mjs --desde ${SHA}`);
  assert.equal(modoDaSabotagemNoMaster({ verde: SHA, env: {} }).modo, 'incremental');
});

test('tabela: master sem registro (ou registro inválido = null) -> completa', () => {
  assert.equal(comandoDaSabotagem({ ...MASTER, env: {} }), 'node tests/run_sabotage.mjs');
  assert.equal(comandoDaSabotagem({ ...MASTER, verde: null, env: {} }), 'node tests/run_sabotage.mjs');
  assert.equal(modoDaSabotagemNoMaster({ verde: null, env: {} }).modo, 'completa');
});

test('tabela: ER_VERIFICAR=completo (e o prepare_publish, que o seta) -> completa mesmo com verde', () => {
  assert.equal(comandoDaSabotagem({ ...MASTER, verde: SHA, env: { ER_VERIFICAR: 'completo' } }), 'node tests/run_sabotage.mjs');
  assert.equal(modoDaSabotagemNoMaster({ verde: SHA, env: { ER_VERIFICAR: 'completo' } }).modo, 'completa');
});

test('prepare_publish.ps1 força o completo antes de chamar o verificar.mjs', () => {
  const ps = readFileSync(path.join(RAIZ, 'scripts', 'prepare_publish.ps1'), 'utf8');
  const iEnv = ps.indexOf('$env:ER_VERIFICAR = "completo"');
  const iVerificar = ps.indexOf('verificar.mjs")');
  assert.ok(iEnv > 0 && iVerificar > iEnv, 'ER_VERIFICAR=completo precisa vir antes da chamada do verificar.mjs');
});

test('fora do master nada muda: --mudados', () => {
  assert.equal(comandoDaSabotagem({ branch: 'ticket-x', verde: SHA, env: {} }), 'node tests/run_sabotage.mjs --mudados');
});

// ---------- registro do verde, em repositório temporário ----------
function repoTemporario() {
  const dir = mkdtempSync(path.join(tmpdir(), 'er-verde-'));
  const git = (...args) => {
    const r = spawnSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', '-c', 'commit.gpgsign=false', ...args], { cwd: dir, encoding: 'utf8', env: ambienteDosFilhos(process.env) });
    assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`);
    return r.stdout.trim();
  };
  git('init', '-q', '-b', 'master');
  const commita = (nome) => { writeFileSync(path.join(dir, nome), nome); git('add', nome); git('commit', '-q', '-m', nome); return git('rev-parse', 'HEAD'); };
  return { dir, git, commita, limpar: () => rmSync(dir, { recursive: true, force: true }) };
}

test('gravarVerde grava o HEAD no common-dir (fora da árvore) e lerVerde devolve', () => {
  const r = repoTemporario();
  try {
    const c1 = r.commita('a.txt');
    assert.equal(lerVerde(r.dir), null, 'sem registro = null');
    assert.equal(gravarVerde(r.dir), c1);
    assert.equal(lerVerde(r.dir), c1);
    assert.ok(caminhoDoVerde(r.dir).replace(/\\/g, '/').endsWith('/.git/er-ultimo-master-verde'));
    assert.equal(r.git('status', '--porcelain'), '', 'o registro não suja o repositório');
    const c2 = r.commita('b.txt');
    assert.equal(lerVerde(r.dir), c1, 'commit novo não muda o verde sozinho');
    assert.equal(gravarVerde(r.dir), c2);
    assert.equal(lerVerde(r.dir), c2);
  } finally { r.limpar(); }
});

test('gravarVerde RECUSA árvore suja (o HEAD não é o que foi verificado)', () => {
  const r = repoTemporario();
  try {
    r.commita('a.txt');
    writeFileSync(path.join(r.dir, 'a.txt'), 'mudou');
    assert.equal(gravarVerde(r.dir), null);
    assert.equal(existsSync(caminhoDoVerde(r.dir)), false);
  } finally { r.limpar(); }
});

test('registro inválido = null (lixo, commit inexistente, fora do histórico do HEAD)', () => {
  const r = repoTemporario();
  try {
    const c1 = r.commita('a.txt');
    const arq = caminhoDoVerde(r.dir);
    writeFileSync(arq, 'lixo\n');
    assert.equal(lerVerde(r.dir), null, 'lixo');
    writeFileSync(arq, 'b'.repeat(40) + '\n');
    assert.equal(lerVerde(r.dir), null, 'commit inexistente');
    r.git('checkout', '-q', '-b', 'outro');
    const c2 = r.commita('b.txt');
    gravarVerde(r.dir);
    assert.equal(lerVerde(r.dir), c2);
    r.git('checkout', '-q', 'master');
    assert.notEqual(c1, c2);
    assert.equal(lerVerde(r.dir), null, 'verde de um ramo que o HEAD não contém não vale');
  } finally { r.limpar(); }
});

test('run_sabotage.mjs entende --desde e cai na completa com sha inválido (texto do código)', () => {
  // Não roda o script (ele pega a vaga pesada da máquina): confere que a lógica está no lugar.
  const fonte = readFileSync(path.join(RAIZ, 'tests', 'run_sabotage.mjs'), 'utf8');
  assert.match(fonte, /--desde/);
  assert.match(fonte, /merge-base", "--is-ancestor", DESDE/);
  assert.match(fonte, /sabotagem COMPLETA/);
  assert.match(fonte, /selecionarMutacoes\(MUTACOES/);
});

// ---------- o incremental nunca ignora arquivo mudado ----------
const vazio = { cache: {}, novas: new Set() };

test('SABOTAGEM DO INCREMENTAL: para TODA mutação do catálogo real, mudar o arquivo dela a seleciona', () => {
  for (const m of MUTACOES) {
    if (m.arquivo === '@comportamento') continue; // coberto no teste seguinte
    const sel = selecionarMutacoes(MUTACOES, { ...vazio, mudados: new Set([`src/regras/${m.arquivo}`]) });
    assert.ok(sel.some((x) => x.id === m.id), `${m.id}: mudar ${m.arquivo} deveria selecioná-la`);
  }
});

test('mutação por comportamento entra sempre que algo de src/regras mudou, e só então', () => {
  const comp = MUTACOES.filter((m) => m.arquivo === '@comportamento');
  assert.ok(comp.length > 0);
  const com = selecionarMutacoes(MUTACOES, { ...vazio, mudados: new Set(['src/regras/duelo.js']) });
  for (const m of comp) assert.ok(com.some((x) => x.id === m.id), m.id);
  const sem = selecionarMutacoes(MUTACOES, { ...vazio, mudados: new Set(['docs/x.md']) });
  assert.equal(sem.length, 0);
});

test('o teste que costuma pegar a mutação mudou -> seleciona; mutação nova sem cache -> seleciona', () => {
  const alvo = MUTACOES.find((m) => m.arquivo === 'level_cap.js');
  const porTeste = selecionarMutacoes(MUTACOES, { mudados: new Set(['tests/unit/x.test.mjs']), cache: { [alvo.id]: 'tests/unit/x.test.mjs' }, novas: new Set() });
  assert.deepEqual(porTeste.map((m) => m.id), [alvo.id]);
  const nova = selecionarMutacoes(MUTACOES, { mudados: new Set(['tests/unit/mutacoes.mjs']), cache: {}, novas: new Set([alvo.id]) });
  assert.deepEqual(nova.map((m) => m.id), [alvo.id]);
});

test('um seletor que ignora o arquivo mudado seria pego (o teste de cobertura falha para ele)', () => {
  const seletorQuebrado = () => [];
  const falha = MUTACOES.some((m) => m.arquivo !== '@comportamento'
    && !seletorQuebrado(MUTACOES, { ...vazio, mudados: new Set([`src/regras/${m.arquivo}`]) }).some((x) => x.id === m.id));
  assert.equal(falha, true);
});
