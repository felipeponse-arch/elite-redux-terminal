# Elite Redux Terminal

Dex, rank e montador de times para quem joga o ROM hack **Elite Redux** (Pokémon). App de arquivo único (JS puro, sem
framework), publicado como Artifact no claude.ai. Tudo em português do Brasil, inclusive comentários e commits.

## Produto e fontes
- Produto e requisitos: `docs/ESPECIFICACAO_REQUISITOS.md` (faz o papel do PRODUCT.md). Vocabulário: `GLOSSARY.md`.
- Arquitetura e decisões: `docs/decisoes_arquitetura.md`, `docs/pipeline_do_projeto.md`. Mecânica do jogo: `docs/decisoes_mecanicas.md`.
- Qualidade e portão: `docs/quality.md`. Primeira vez no projeto: `docs/onboarding.md`. Estado do setup: `docs/setup.md`.
- Trabalho em andamento: `docs/tickets/<funcionalidade>/` (um arquivo por ticket, linha `Status:`).
- Fonte da verdade do jogo: código e config da versão mais nova (eliteredux-source `upcoming` + er-config); NextDex depois.

## Comandos (Node, npm, Windows; sem Python no fluxo do app)
- Instalar: `npm ci`
- Montar o app: `npm run build` (gera `artifact_final.html`, que não é versionado)
- Checagem rápida (lint, CSS, tipos, sintaxe, codificação, fronteira): `npm run check`
- Unitários: `node --test tests/unit/*.test.mjs`
- Sabotagens (teste de mutação): `node tests/run_sabotage.mjs`
- Navegador: `npm run test:e2e`
- Portão (o gancho de pré-commit roda; escolhe o nível pelo que mudou, no master roda tudo): `npm run verificar`
- CI: `.github/workflows/ci.yml` (mesmos comandos em Linux) e `alarme_upstream.yml` (aviso semanal de versão nova do jogo)
- Publicar: só pela skill `publicar-versao` (`scripts/prepare_publish.ps1` + Artifact). Nunca publicar `artifact_template.html`.

## Acordos de trabalho
- Ler o código e as instruções antes de mexer; separar fato observado, suposição e decisão.
- Fazer só o que foi pedido, com a menor mudança suficiente. Regra ou dado que já existe fica como está: informação nova que
  esbarra nele vira pergunta, não edição.
- Correção = teste que falha sem ela, com dado real. Auditoria à mão vira teste permanente.
- Nunca `--no-verify`, nunca `git add -A`; commitar só os próprios arquivos (várias sessões usam o mesmo repositório).
- Nada apagado, encerrado ou publicado sem autorização explícita.
- Bloqueio parcial não para o resto; continuar o que é independente. Ao retomar, conferir o estado real (git, arquivos,
  processos) antes de confiar num resumo.

## Ferramentas (instaladas em 17/10/2026, ver `docs/setup.md`)
- **Ponytail** (plugin, nível full): a solução mais simples que funciona. `stop ponytail` desliga.
- **Caveman** (plugin): conversa enxuta em português; código, documentos e commits em texto normal. `stop caveman` desliga.
- **Context7** (plugin/MCP): documentação atual de bibliotecas (ESLint, Playwright, Node). Uma pergunta por conceito; nunca
  enviar código privado ou segredo.
- **RTK**: resume a saída dos comandos (já ativo pelo cliente; `rtk proxy <cmd>` para a saída original).
- **Mapa do código**: leia `docs/mapa-do-codigo.md` ANTES de abrir código (arquivo, responsabilidade, funções com linha);
  abra só o trecho que precisa (offset/limit). Atualiza sozinho: o pré-commit regenera e inclui o mapa quando há `src/` ou
  `scripts/` em staging; à mão, `npm run mapa` (também roda o Graphify; `-- --rapido` só o mapa). Conflito de junção
  nele: regenerar. Graphify (`graphify-out/`, fora do git) segue disponível; não vê chamadas entre arquivos.
- **Agentes e modelos**: os papéis ficam em `teste/.claude/agents` e `docs/agents/` (modelo por papel, loops e grafos).
