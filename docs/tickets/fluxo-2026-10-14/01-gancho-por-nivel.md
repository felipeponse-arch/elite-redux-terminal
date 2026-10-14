# 01 — Gancho por nível (melhoria A do fluxo)

Status: feito (aguardando juntar no master)
Bloqueado por: nenhum (a vaga B e o checkpoint C já estão no master)

## O que entrega
O gancho de commit lê os arquivos em staging e roda só o que a mudança pede, em vez de ~4-6 min para um commit só de documento. Quem decide é a função pura `nivelDaMudanca` (`scripts/nivel_da_mudanca.mjs`); `scripts/verificar.mjs` imprime "Nível N (motivo): etapas" e roda só elas. Comandos das etapas inalterados.
- 0 só texto (`docs/`, `*.md`, GLOSSARY, AUDITORIA-DOSSIE): check.
- 1 `tests/unit/`: check + unitários (+ sabotagem --mudados se `mutacoes.mjs` mudou).
- 2 `src/regras/`, `scripts/*.mjs` (menos build*, verificar, vaga): check + unitários + sabotagem.
- 3 o resto (UI, CSS, template, build, e2e, data, configs, caminho desconhecido): tudo.
- Mista = maior nível. Lista vazia = 3. Branch master (ou desconhecido/destacado) = 3 sempre. `ER_VERIFICAR=completo` = 3. `ER_WIP=1` = 0, menos no master.
- Os passos filhos não herdam GIT_DIR, GIT_WORK_TREE, GIT_INDEX_FILE, GIT_PREFIX, GIT_COMMON_DIR, GIT_OBJECT_DIRECTORY, GIT_ALTERNATE_OBJECT_DIRECTORIES, GIT_NAMESPACE (incidente de 14/10, core.bare=true).
- `node scripts/verificar.mjs --nivel [arquivos]` só mostra o nível e as etapas (não roda nada).

## Critérios de aceite
- [x] Tabela de caminhos -> nível, mistura, vazio, desconhecido sobe, master sempre 3, ER_VERIFICAR, ER_WIP (não desce no master), barra invertida normalizada (`tests/unit/nivel_da_mudanca.test.mjs`).
- [x] Teste com filho de verdade (`--sonda-env`) provando que GIT_DIR e parentes não chegam ao passo filho.
- [x] Etapas e comandos idênticos aos de antes (teste).

## Comentários
Decisões de segurança (sempre sobe): branch vazio, `HEAD` destacado ou falha do git contam como master; falha ao ler o staging = lista vazia = nível 3; `*.md` dentro de `src/`, `data/`, `scripts/`, `tests/`, `types/`, `.github/`, `.claude/` NÃO é texto (nível 3); caixa diferente (`Docs/`) ou `..` fora do repositório = desconhecido = 3.
Execução manual (`npm run verificar`) sem nada em staging roda nível 3. Com algo em staging usa o nível dele; para forçar tudo: `ER_VERIFICAR=completo`.
Fora do escopo: a junção fast-forward continua sem gancho; o procedimento de junção deve rodar `ER_VERIFICAR=completo node scripts/verificar.mjs` no master antes de enviar.
