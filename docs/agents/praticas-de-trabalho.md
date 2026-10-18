# Práticas de trabalho com IA

Status: **adotado em 16/10/2026** (pedido do Felipe; compilado pela sessão da nuvem a partir de dois posts que ele guardou). Vale para o orquestrador e para os agentes de `.claude/agents`. A seção C diz onde cada prática já vive no projeto e o que ainda depende de decisão do Felipe.

## A. Sete práticas (post do Rony Meisler, sobre o Claude Code)
1. **Nunca aceite a primeira resposta da IA.** Pedir 5 versões de tudo: 5 jeitos diferentes de resolver a mesma coisa, lado a lado. A primeira ideia da IA quase nunca é a melhor, a sua também não. Vale para proposta, anúncio, página de vendas: compara e escolhe.
2. **Faça a IA defender a escolha dela.** Depois das 5 versões: "escolhe a melhor e me diz por quê". Ela ganha alguém que discute antes do erro custar caro. Usar como um sócio: você ouve o argumento, a decisão continua sua.
3. **IA que não leu nada só chuta.** Antes de propor qualquer coisa, mandar ler as conversas do time, os documentos e as discussões antigas. Ela chega sabendo o que já foi decidido e o que já deu errado, como um funcionário que está há 5 anos na casa.
4. **Quem escreve instrução para a IA na mão perde tempo.** Descrever o que quer e deixar o Claude escrever os atalhos (skills, comandos). Transformar qualquer tarefa que se repete toda semana num processo pronto.
5. **Exigir o vídeo de tudo funcionando.** O Claude abre o navegador, testa sozinho, grava a tela e entrega junto. Parar de conferir linha por linha: pedir "me mostra funcionando".
6. **Parar de ser babá da IA.** Dois comandos: um faz o Claude ir até o fim sem parar no meio; o outro faz parar de pedir permissão a cada clique e só travar no que for arriscado. Largar a tarefa rodando e ir resolver outra coisa.
7. **Botar a IA para fiscalizar o que ninguém olha.** Tarefa agendada que varre tudo que o time lançou; se algo saiu sem revisão, o Claude critica, refaz e manda para o responsável. (O autor desligou o envio porque o Claude ainda erra em design, mas deixou pronto para o próximo modelo.) Usar para checar o que hoje só anda se alguém olhar.

## B. Prompt de aprofundamento (post do Diego Almeida, @diegoalmeida.ia)
Ideia: pedir uma versão **mais aprofundada** da tarefa, não uma versão **maior**. O texto do post, para colar depois da tarefa:

> Quero uma versão mais aprofundada desta tarefa, não uma versão maior. Antes de reescrevê-la: (1) diga o que um profissional de ponta nesta área faria aqui que eu não estou pedindo; (2) mencione a matéria-prima básica que ele usaria como ponto de partida, em vez do que já foi analisado para mim; (3) mencione os métodos e ferramentas específicos que ele usaria; (4) diga o que, além de você ou eu, demonstraria que o resultado está correto. Em seguida, reescreva meu enunciado para pedir exatamente isso.

## C. Como fica no projeto
| Prática | Regra | Onde já vive |
|---|---|---|
| 1 e 2 (várias versões, defender a escolha) | Em **decisão** (regra de motor, desenho de tela, texto de interface, plano de ticket G): gerar alternativas lado a lado (até 5), escolher uma e dizer por quê; a decisão final é do Felipe quando mexe em regra existente. Não vale para tarefa mecânica nem para os prompts de build (regra de 08/10). | Gauntlet Loop (supervisor), `docs/decisoes_mecanicas.md` (escolha com o porquê e fonte) |
| 3 (ler antes de propor) | Começo de ticket: ler o ticket, `estado.md`/`perguntas.md` da funcionalidade, `docs/decisoes_mecanicas.md`, a memória e o cofre (`resumo/`) antes de propor. | `issue-tracker.md`, memória "Consultar memória e cofre primeiro" |
| 4 (instruções escritas pelo Claude) | Tarefa que se repetiu 2 vezes vira skill ou script do projeto, escrita pelo Claude. | Skills `publicar-versao`, `atualizar-dados-do-jogo`, `importar-builds-discord`, `fim-de-sessao-obsidian`; receita do rank em `resumo/convencoes.md` (candidata a skill) |
| 5 (ver funcionando) | Entrega com evidência: portão verde (inclui o navegador) e, se a mudança é visual, captura da tela alterada mostrada ao Felipe. | Pré-commit nível 3, `scripts/smoke_tests` |
| 6 (não ser babá) | Ir até o fim sem parar no meio; só parar no arriscado (apagar, publicar fora do fluxo, gastar acima do limite). | Estilo Proativo; comandos de rotina liberados em `teste/.claude/settings.local.json` (16/10, autorizado pelo Felipe); push, apagar, desfazer e publicar continuam pedindo permissão |
| 7 (fiscalizar o que ninguém olha) | Varredura do que entrou sem revisão (branches da nuvem, master) junto do alarme semanal do upstream. | Preparada, NÃO ativa: [fiscalizacao-agendada.md](fiscalizacao-agendada.md) |
| B (aprofundar, não aumentar) | Ao escrever pedido de ticket ou prompt de agente: (1) o que um especialista faria que não foi pedido; (2) a matéria-prima, que aqui é o código do jogo e a config (`abilities.cc`, `er-config`), não as análises já feitas; (3) os métodos concretos (TDD com dado real, sabotagem, `validar_dados`, `medir_texto_novo`); (4) o que prova que está certo além do autor (calculadora do jogo, sabotagem que pega, supervisor). | `docs/agents/loops-e-grafos.md` (prompt do nó) |

## D. Depende do Felipe
- **7:** ativar a fiscalização agendada (pronta em fiscalizacao-agendada.md; gasta do limite semanal).

## E. Ferramentas do toolkit: padrão de uso (adotado em 17/10/2026)
Instaladas pelo setup do vibe-coding-toolkit (`docs/setup.md`). Padrão do projeto, decidido pelo Felipe:
| Ferramenta | Quando usar | Quando não usar |
|---|---|---|
| Ponytail | sempre, nível `full`; `ultra` quando o pedido for vago | — |
| Caveman | conversa do dia a dia | documentos, commits e explicação de decisão importante (texto normal) |
| Context7 | dúvida de biblioteca: ESLint, Playwright, Node, PowerShell | mecânica do jogo: a fonte é o código do jogo (`docs/decisoes_mecanicas.md`) |
| Graphify | antes de mexer em função usada em muitos lugares; regerar depois de mudança grande | chamadas entre arquivos (o app não usa `import`): conferir com grep |
| Revisão de segurança (`docs/prompts/revisao-de-seguranca.md`) | antes de publicar versão grande, pelo agente `seguranca` | — |
| Avaliação dos agentes (prompt 14) | depois de mudar agentes, ganchos ou regras de trabalho | — |
| `max-lines` 350 | arquivo novo nasce abaixo de 350 linhas | — |
| Subagentes | sempre pelo papel (`subagent_type`), nunca pelo nome do modelo | — |
