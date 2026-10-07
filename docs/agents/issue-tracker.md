# Tickets: arquivos Markdown no repositório

Decisão do usuário (07/10/2026): tickets e especificações ficam em arquivos dentro de `docs/tickets/`,
versionados no git. Nada de GitHub Issues.

## Convenções

- Uma funcionalidade por pasta: `docs/tickets/<funcionalidade>/`.
- Especificação (só para funcionalidade GRANDE; correção pequena não precisa): `docs/tickets/<funcionalidade>/spec.md`.
- Um arquivo por ticket: `docs/tickets/<funcionalidade>/NN-<nome>.md`, numerado a partir de `01`; nunca um arquivo único com todos.
- Perto do topo de cada ticket:
  - `Status:` com um dos papéis de `triage-labels.md` (`pronto-para-agente`, `resolvido`...).
  - `Bloqueado por: NN, NN` (ou `Bloqueado por: nenhum`). Um ticket está livre quando todos os que ele lista estão `resolvido`.
- Comentários e histórico vão no fim do arquivo, sob `## Comentários`.
- Tudo em português do Brasil, com o vocabulário do `GLOSSARY.md`.

## Quando uma skill disser "publicar no rastreador"

Criar o arquivo em `docs/tickets/<funcionalidade>/` (criando a pasta se precisar).

## Quando uma skill disser "buscar o ticket"

Ler o arquivo do caminho indicado; o usuário normalmente passa o caminho ou o número.

## Implementar um ticket (um worktree por ticket)

Várias sessões usando a mesma pasta quebraram os commits em 06/10. Por isso cada ticket é feito numa cópia isolada:

1. Marcar o ticket `Status: em-andamento` e salvar.
2. `git worktree add .claude/worktrees/ticket-NN -b ticket/NN master`.
3. No PowerShell, ligar as dependências sem copiar:
   `New-Item -ItemType Junction -Path .claude\worktrees\ticket-NN\node_modules -Target <pasta do app>\node_modules`.
   E copiar o cache da sabotagem (fora do git): `tests/.sabotagem_cache.json` da pasta do app para o worktree.
   Sem ele cada uma das ~225 sabotagens roda a suíte inteira e o hook passa de 10 min (07/10; com ele, ~2,5 min).
4. Trabalhar e commitar DENTRO do worktree (o hook de pré-commit é o mesmo e roda lá).
5. Voltar ao master, `git merge --ff-only ticket/NN` (se o master andou: `git rebase master` no worktree antes).
6. Limpar: apagar a JUNÇÃO primeiro (`[System.IO.Directory]::Delete(<junção>, $false)`, que não toca no
   `node_modules` real), depois `git worktree remove` e `git branch -d ticket/NN`.
7. Marcar `Status: resolvido` no ticket, no master.

Um ticket por vez (sem agentes em paralelo, decisão de 07/10, por economia de uso). Publicar uma vez quando o grupo de tickets fechar.
