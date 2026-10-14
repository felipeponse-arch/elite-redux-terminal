// Classificador do gancho por nível (melhoria A de docs/pipeline_do_projeto.md, 2026-10-14).
// Função PURA (sem git, sem disco): decide quanto do gate roda conforme os arquivos em staging.
//
// REGRA DE OURO: este código decide o que cada commit verifica. Na dúvida SOBE de nível, nunca desce.
//
// Níveis:
//   0 só texto      -> check
//   1 testes        -> check + unitários (+ sabotagem --mudados se tests/unit/mutacoes.mjs mudou)
//   2 regras        -> check + unitários + sabotagem (--mudados fora do master)
//   3 tudo          -> check + unitários + sabotagem + build + navegador
// scripts/: só a lista branca é nível 2; o resto sobe. Sempre nível 3: branch master (junção e publicação), ER_VERIFICAR=completo, lista vazia,
// qualquer caminho desconhecido. ER_WIP=1 (npm run checkpoint) = nível 0, menos no master.

import { spawnSync } from 'node:child_process';

/** Variáveis do git que apontam para o repositório do gancho; NUNCA vão para os passos filhos
 *  (incidente de 14/10: um teste com `git init` escreveu core.bare=true no repositório real). */
export const VARIAVEIS_GIT_DE_LOCALIZACAO = [
  'GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_PREFIX', 'GIT_COMMON_DIR',
  'GIT_OBJECT_DIRECTORY', 'GIT_ALTERNATE_OBJECT_DIRECTORIES', 'GIT_NAMESPACE',
];

/** Cópia do ambiente sem as variáveis de localização do git. */
export function ambienteDosFilhos(env = process.env) {
  const limpo = { ...env };
  for (const nome of VARIAVEIS_GIT_DE_LOCALIZACAO) delete limpo[nome];
  return limpo;
}

/** Branch desconhecido, vazio ou destacado conta como master: o caminho seguro é o mais rigoroso. */
function ehMaster(branch) {
  const b = String(branch ?? '').trim();
  return b === 'master' || b === '' || b === 'HEAD';
}

/** Barra invertida do Windows vira "/", tira "./" do começo e resolve "..". Fora do repositório = null. */
function normalizar(caminho) {
  let c = String(caminho ?? '').trim().replace(/\\/g, '/').replace(/^(\.\/)+/, '');
  if (c === '') return null;
  const partes = [];
  for (const p of c.split('/')) {
    if (p === '' || p === '.') continue;
    if (p === '..') { if (partes.length === 0) return null; partes.pop(); continue; }
    partes.push(p);
  }
  return partes.length ? partes.join('/') : null;
}

const RAIZ_TEXTO = new Set(['GLOSSARY.md', 'AUDITORIA-DOSSIE.md']);
const PASTAS_DE_CODIGO = ['src/', 'data/', 'scripts/', 'tests/', 'types/', '.github/', '.claude/'];
// LISTA BRANCA de scripts/ nível 2: só os consumidos apenas por teste unitário ou por npm manual (conferido
// com grep: nenhum é importado por build.mjs, playwright.config.mjs, CI, src/ nem pelo gate). TODO o resto de
// scripts/ (build, verificar, vaga, validar_dados, servidor_estatico, checar_*, nivel_da_mudanca, script novo...) é nível 3.
const SCRIPTS_NIVEL_2 = new Set(['checkpoint', 'encalhados', 'validar_dado_cru', 'diff_versoes', 'rank_escolha', 'calcular_rank_v2']);

/** Nível de UM caminho (já normalizado) e se é o catálogo de sabotagem. */
function nivelDoArquivo(c) {
  if (RAIZ_TEXTO.has(c)) return 0;
  if (c.startsWith('docs/')) return 0;
  // *.md em qualquer pasta que não seja de código (código pode ler markdown como dado).
  if (c.endsWith('.md') && !PASTAS_DE_CODIGO.some((p) => c.startsWith(p))) return 0;
  if (c.startsWith('tests/unit/')) return 1;
  if (c.startsWith('src/regras/')) return 2;
  const m = /^scripts\/([^/]+)\.mjs$/.exec(c);
  if (m && SCRIPTS_NIVEL_2.has(m[1])) return 2;
  return 3; // src/ui, src/css, template, build, e2e, data, configs, .githooks, DESCONHECIDO...
}

/**
 * @param {string[]} arquivos caminhos em staging
 * @param {{branch?: string, env?: Record<string,string|undefined>}} [ctx]
 * @returns {{nivel: 0|1|2|3, motivo: string}}
 */
export function nivelDaMudanca(arquivos, { branch, env = {} } = {}) {
  if (ehMaster(branch)) {
    return { nivel: 3, motivo: `branch ${String(branch || '').trim() || 'desconhecido'}: junção e publicação rodam tudo` };
  }
  if (env.ER_VERIFICAR === 'completo') return { nivel: 3, motivo: 'ER_VERIFICAR=completo' };
  if (env.ER_WIP === '1') return { nivel: 0, motivo: 'ER_WIP=1 (checkpoint): só a checagem leve' };
  if (!Array.isArray(arquivos) || arquivos.length === 0) {
    return { nivel: 3, motivo: 'nenhum arquivo em staging: roda tudo' };
  }
  let nivel = 0;
  let causa = '';
  for (const bruto of arquivos) {
    const c = normalizar(bruto);
    const n = c === null ? 3 : nivelDoArquivo(c);
    if (n > nivel || (n === nivel && !causa)) { nivel = n; causa = c ?? String(bruto); }
  }
  const rotulos = ['só texto', 'só testes', 'regras', 'tudo'];
  const motivo = nivel === 0 ? `${rotulos[0]} (${arquivos.length} arquivo(s))` : `${rotulos[nivel]}, pelo arquivo ${causa}`;
  return { nivel, motivo };
}

// As etapas e comandos são EXATAMENTE os do gancho antes da melhoria A; só muda QUAIS rodam.
const ETAPA_CHECK = { id: 'check', titulo: 'travas: codificação, sintaxe, lint (JS e CSS) e tipos', comando: 'npm run check --silent', falha: 'Trava estática falhou' };
const ETAPA_UNITARIOS = { id: 'unitarios', titulo: 'testes unitários das regras', comando: 'npm run test:unit --silent', falha: 'Testes unitários falharam' };
const ETAPA_BUILD = { id: 'build', titulo: 'build (npm run build)', comando: 'npm run build --silent', falha: 'Build falhou' };
const ETAPA_NAVEGADOR = { id: 'navegador', titulo: 'testes de navegador (Playwright, projeto funcional)', comando: 'npm run test:e2e --silent', falha: 'Teste de navegador falhou - detalhes: npm run test:relatorio' };

function etapaSabotagem(master) {
  return {
    id: 'sabotagem',
    titulo: 'sabotagem das regras (' + (master ? 'catálogo inteiro' : 'só o que mudou desde o master') + ')',
    comando: master ? 'node tests/run_sabotage.mjs' : 'node tests/run_sabotage.mjs --mudados',
    falha: 'Alguma sabotagem sobreviveu (ou o catálogo está desatualizado)',
  };
}

/**
 * Etapas a rodar, na ordem (da mais barata à mais cara).
 * No master (ou branch desconhecido) o nível sobe para 3 aqui também: defesa em profundidade.
 */
export function etapasDoNivel(nivel, { branch, arquivos = [] } = {}) {
  const master = ehMaster(branch);
  const n = master || !(nivel >= 0 && nivel <= 2) ? 3 : nivel;
  const etapas = [ETAPA_CHECK];
  if (n === 0) return etapas;
  etapas.push(ETAPA_UNITARIOS);
  if (n === 1) {
    const mexeuNoCatalogo = arquivos.some((a) => normalizar(a) === 'tests/unit/mutacoes.mjs');
    if (mexeuNoCatalogo) etapas.push(etapaSabotagem(false));
    return etapas;
  }
  etapas.push(etapaSabotagem(master));
  if (n === 3) etapas.push(ETAPA_BUILD, ETAPA_NAVEGADOR);
  return etapas;
}

/**
 * Arquivos em staging, lidos com o ambiente de quem chama (no pre-commit o git já aponta GIT_INDEX_FILE
 * para o índice CERTO do commit: o temporário em git commit -a/-o/<arquivo>). -z: nomes com acento ou
 * espaço não vêm entre aspas; --no-renames: renomear lista origem E destino. Falha do git = [] (nível 3).
 */
export function arquivosEmStaging(cwd, env = process.env) {
  const r = spawnSync('git', ['--no-pager', 'diff', '--cached', '--name-only', '--no-renames', '-z'], { cwd, env, encoding: 'utf8' });
  if (r.error || r.status !== 0) return [];
  return (r.stdout || '').split('\0').filter(Boolean);
}

/**
 * Só dentro de um commit (o git define GIT_INDEX_FILE ao rodar o pre-commit) ou com --por-staging a
 * classificação usa o staging. Execução manual fora disso: nível 3 (na dúvida sobe).
 */
export function classificarPorStaging(env = process.env, argv = []) {
  return Boolean(env.GIT_INDEX_FILE) || argv.includes('--por-staging');
}
