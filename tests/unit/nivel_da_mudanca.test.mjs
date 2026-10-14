// Testes do gancho por nível (scripts/nivel_da_mudanca.mjs e scripts/verificar.mjs).
// Regra de ouro: na dúvida SOBE de nível. Nenhum teste toca o repositório real.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  nivelDaMudanca, etapasDoNivel, ambienteDosFilhos, VARIAVEIS_GIT_DE_LOCALIZACAO,
} from '../../scripts/nivel_da_mudanca.mjs';

const TICKET = { branch: 'ticket-x', env: {} };
const nivel = (arquivos, ctx = TICKET) => nivelDaMudanca(arquivos, ctx).nivel;

test('nível 0: só texto', () => {
  for (const a of ['docs/pipeline_do_projeto.md', 'docs/tickets/x/01.md', 'docs/dados.json', 'README.md',
    'GLOSSARY.md', 'AUDITORIA-DOSSIE.md', 'notas/coisa.md']) {
    assert.equal(nivel([a]), 0, a);
  }
  assert.equal(nivel(['docs/a.md', 'GLOSSARY.md']), 0);
});

test('nível 1: só tests/unit', () => {
  assert.equal(nivel(['tests/unit/x.test.mjs']), 1);
  assert.equal(nivel(['tests/unit/mutacoes.mjs', 'tests/unit/y.test.mjs']), 1);
  assert.equal(nivel(['tests/unit/x.test.mjs', 'docs/a.md']), 1);
});

test('nível 2: regras e scripts que não são de build', () => {
  for (const a of ['src/regras/dano.mjs', 'src/regras/sub/x.mjs', 'scripts/calcular_rank_v2.mjs', 'scripts/checkpoint.mjs']) {
    assert.equal(nivel([a]), 2, a);
  }
});

test('nível 3: UI, CSS, template, build, verificação, e2e, dados, configs', () => {
  const tudo = [
    'src/ui/aba.mjs', 'src/css/x.css', 'artifact_template.html', 'scripts/build.mjs', 'scripts/build.ps1',
    'scripts/build_sprite_atlas.ps1', 'scripts/verificar.mjs', 'scripts/vaga.mjs', 'scripts/nivel_da_mudanca.mjs.bak',
    'tests/run_sabotage.mjs', 'tests/e2e/x.spec.mjs', 'scripts/smoke_tests/a.mjs', 'data/builds.json',
    'package.json', 'package-lock.json', 'eslint.config.mjs', 'stylelint.config.mjs', 'playwright.config.mjs',
    'tsconfig.json', '.githooks/pre-commit', '.github/workflows/ci.yml',
  ];
  for (const a of tudo) assert.equal(nivel([a]), 3, a);
});

test('caminho DESCONHECIDO sobe para 3', () => {
  for (const a of ['coisa_nova.xyz', 'src/novo/x.mjs', 'tests/novo/x.mjs', 'scripts/x.ps1', 'scripts/sub/x.mjs',
    'Docs/x.txt', 'GLOSSARY.MD', 'src/ui.md', 'data/leia.md', 'types/x.d.ts', 'docs']) {
    assert.equal(nivel([a]), 3, a);
  }
  // "docs/../src/ui" não pode se passar por documento; fora do repositório também sobe
  assert.equal(nivel(['docs/../src/ui/x.mjs']), 3);
  assert.equal(nivel(['../fora/x.md']), 3);
  assert.equal(nivel(['']), 3);
});

test('mudança mista = o MAIOR nível', () => {
  assert.equal(nivel(['docs/a.md', 'tests/unit/x.test.mjs', 'src/regras/dano.mjs']), 2);
  assert.equal(nivel(['docs/a.md', 'src/ui/x.mjs']), 3);
  assert.equal(nivel(['src/regras/dano.mjs', 'tests/unit/x.test.mjs', 'coisa.xyz']), 3);
  // ordem não importa
  assert.equal(nivel(['src/ui/x.mjs', 'docs/a.md']), 3);
});

test('lista vazia ou inválida = nível 3', () => {
  assert.equal(nivel([]), 3);
  assert.equal(nivel(undefined), 3);
  assert.equal(nivel(null), 3);
});

test('master é SEMPRE nível 3, sem exceção', () => {
  assert.equal(nivel(['docs/a.md'], { branch: 'master', env: {} }), 3);
  assert.equal(nivel(['docs/a.md'], { branch: 'master', env: { ER_WIP: '1' } }), 3);
  assert.equal(nivel([], { branch: 'master', env: { ER_WIP: '1' } }), 3);
});

test('branch desconhecido, vazio ou destacado conta como master', () => {
  for (const branch of ['', undefined, null, 'HEAD']) {
    assert.equal(nivelDaMudanca(['docs/a.md'], { branch, env: { ER_WIP: '1' } }).nivel, 3, String(branch));
  }
});

test('ER_VERIFICAR=completo força nível 3', () => {
  assert.equal(nivelDaMudanca(['docs/a.md'], { branch: 'x', env: { ER_VERIFICAR: 'completo' } }).nivel, 3);
  // outro valor não força nada
  assert.equal(nivelDaMudanca(['docs/a.md'], { branch: 'x', env: { ER_VERIFICAR: 'leve' } }).nivel, 0);
  // completo ganha do WIP
  assert.equal(nivelDaMudanca(['docs/a.md'], { branch: 'x', env: { ER_VERIFICAR: 'completo', ER_WIP: '1' } }).nivel, 3);
});

test('ER_WIP=1 vale nível 0 fora do master, mesmo com src/ui', () => {
  assert.equal(nivelDaMudanca(['src/ui/x.mjs'], { branch: 'ticket-x', env: { ER_WIP: '1' } }).nivel, 0);
  assert.equal(nivelDaMudanca([], { branch: 'ticket-x', env: { ER_WIP: '1' } }).nivel, 0);
  // só "1" conta
  assert.equal(nivelDaMudanca(['src/ui/x.mjs'], { branch: 'ticket-x', env: { ER_WIP: '0' } }).nivel, 3);
});

test('barra invertida do Windows e "./" são normalizados', () => {
  assert.equal(nivel(['docs\\tickets\\a.md']), 0);
  assert.equal(nivel(['tests\\unit\\x.test.mjs']), 1);
  assert.equal(nivel(['src\\regras\\dano.mjs']), 2);
  assert.equal(nivel(['src\\ui\\x.mjs']), 3);
  assert.equal(nivel(['./docs/a.md']), 0);
  assert.equal(nivel(['scripts\\build.mjs']), 3);
});

test('motivo diz o arquivo que decidiu', () => {
  assert.match(nivelDaMudanca(['docs/a.md', 'src/ui/x.mjs'], TICKET).motivo, /src\/ui\/x\.mjs/);
  assert.match(nivelDaMudanca(['docs/a.md'], { branch: 'master' }).motivo, /master/);
});

const ids = (n, ctx) => etapasDoNivel(n, ctx).map((e) => e.id);
const cmd = (n, ctx, id) => etapasDoNivel(n, ctx).find((e) => e.id === id)?.comando;

test('etapas por nível', () => {
  assert.deepEqual(ids(0, TICKET), ['check']);
  assert.deepEqual(ids(1, { ...TICKET, arquivos: ['tests/unit/x.test.mjs'] }), ['check', 'unitarios']);
  assert.deepEqual(ids(1, { ...TICKET, arquivos: ['tests/unit/mutacoes.mjs'] }), ['check', 'unitarios', 'sabotagem']);
  assert.deepEqual(ids(1, { ...TICKET, arquivos: ['tests\\unit\\mutacoes.mjs'] }), ['check', 'unitarios', 'sabotagem']);
  assert.deepEqual(ids(2, TICKET), ['check', 'unitarios', 'sabotagem']);
  assert.deepEqual(ids(3, TICKET), ['check', 'unitarios', 'sabotagem', 'build', 'navegador']);
});

test('comandos continuam EXATAMENTE os de antes', () => {
  assert.equal(cmd(3, TICKET, 'check'), 'npm run check --silent');
  assert.equal(cmd(3, TICKET, 'unitarios'), 'npm run test:unit --silent');
  assert.equal(cmd(3, TICKET, 'build'), 'npm run build --silent');
  assert.equal(cmd(3, TICKET, 'navegador'), 'npm run test:e2e --silent');
});

test('sabotagem: --mudados fora do master, catálogo inteiro no master', () => {
  assert.equal(cmd(2, TICKET, 'sabotagem'), 'node tests/run_sabotage.mjs --mudados');
  assert.equal(cmd(3, TICKET, 'sabotagem'), 'node tests/run_sabotage.mjs --mudados');
  assert.equal(cmd(3, { branch: 'master' }, 'sabotagem'), 'node tests/run_sabotage.mjs');
});

test('etapasDoNivel também sobe no master e com nível inválido (defesa em profundidade)', () => {
  assert.deepEqual(ids(0, { branch: 'master' }), ['check', 'unitarios', 'sabotagem', 'build', 'navegador']);
  assert.deepEqual(ids(1, { branch: 'master', arquivos: ['tests/unit/x.test.mjs'] }), ['check', 'unitarios', 'sabotagem', 'build', 'navegador']);
  assert.equal(cmd(0, { branch: 'master' }, 'sabotagem'), 'node tests/run_sabotage.mjs');
  for (const n of [undefined, NaN, 4, -1]) assert.deepEqual(ids(n, TICKET), ['check', 'unitarios', 'sabotagem', 'build', 'navegador']);
});

test('ambienteDosFilhos remove todas as variáveis de localização do git e guarda o resto', () => {
  const env = { PATH: 'x', ER_VAGA_DONO: '1' };
  for (const v of VARIAVEIS_GIT_DE_LOCALIZACAO) env[v] = '/nonexistent';
  const limpo = ambienteDosFilhos(env);
  for (const v of VARIAVEIS_GIT_DE_LOCALIZACAO) assert.equal(v in limpo, false, v);
  assert.equal(limpo.PATH, 'x');
  assert.equal(limpo.ER_VAGA_DONO, '1');
  assert.equal('GIT_DIR' in env, true, 'não muta o original');
  assert.deepEqual(VARIAVEIS_GIT_DE_LOCALIZACAO.length, 8);
});

const VERIFICAR = fileURLToPath(new URL('../../scripts/verificar.mjs', import.meta.url));

test('verificar.mjs: o filho de verdade NÃO recebe GIT_DIR nem parentes', () => {
  const env = { ...process.env, ER_SONDA: 'preservada' };
  for (const v of VARIAVEIS_GIT_DE_LOCALIZACAO) env[v] = '/nonexistent';
  env.GIT_AUTHOR_NAME = 'fica'; // só as de localização saem
  const r = spawnSync(process.execPath, [VERIFICAR, '--sonda-env'], { env, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const saida = r.stdout.trim();
  const [vars, marca] = saida.split('|');
  assert.equal(marca, 'preservada');
  assert.ok(vars.split(',').includes('GIT_AUTHOR_NAME'), 'as demais GIT_* ficam');
  for (const v of VARIAVEIS_GIT_DE_LOCALIZACAO) assert.equal(vars.split(',').includes(v), false, v);
});

test('verificar.mjs --nivel: imprime nível e etapas sem rodar nada', () => {
  const env = { ...process.env };
  delete env.ER_WIP; delete env.ER_VERIFICAR;
  const r = spawnSync(process.execPath, [VERIFICAR, '--nivel', 'docs/x.md'], { env, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^Nível [03] \(/);
});
