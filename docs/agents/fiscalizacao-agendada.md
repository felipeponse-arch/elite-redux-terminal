# Fiscalização agendada (prática 7) — PREPARADA, NÃO ATIVA

Status: **pronta para criar, não criada** (Felipe, 16/10/2026: "pode preparar mas não vamos rodar ainda").
Ver [praticas-de-trabalho.md](praticas-de-trabalho.md), prática 7.

## Para ativar
Pedir ao orquestrador: "ativa a fiscalização agendada". Ele cria uma tarefa agendada local (ferramenta
`scheduled-tasks`, `create_scheduled_task`) com o nome e o prompt abaixo, toda segunda às 09:00 (antes da rotina de
desempenho de terça, e longe do reset do limite semanal na terça às 23h). Depende do app aberto.

- Nome: `fiscalizacao-do-que-entrou`
- Frequência sugerida: semanal (segunda 09:00). Custo estimado: uma sessão curta (só leitura, Haiku/Sonnet).
- Envio: **desligado** no começo (igual ao post: o relatório fica no projeto; nada é mandado para fora).

## Prompt da tarefa
```
Fiscalização semanal do Elite Redux Terminal (só leitura; nada de editar, commitar, publicar ou apagar).
Pasta: C:\Users\Ponse\Documents\Claude\teste\elite-redux-terminal\.claude\worktrees\publicar. Tudo em PT-BR.

1. Uso: se o limite semanal estiver acima de 90%, escreva só "pulado: semanal X%" no relatório e pare.
2. git fetch. Liste o que entrou desde a última fiscalização (data no fim de relatorios/fiscalizacao.md):
   - commits novos no origin/master;
   - branches da nuvem (origin/*) com commits que não estão no master.
3. Para cada item, diga se teve revisão: commit no master passou pelo portão (o gancho roda sempre; procure
   "--no-verify" ou mensagem de WIP), branch da nuvem tem ticket em docs/tickets e aprovação do supervisor
   registrada. Sem revisão = apontar.
4. Para cada item sem revisão: crítica curta (o que pode estar errado, com arquivo:linha) e o que fazer
   (revisar, juntar, descartar), sem refazer o trabalho.
5. Confira também: o app publicado (versão em "Versão do app") é o origin/master? data/ tem número de espécie
   usado como chave fora do sprite_index.json? (lição de 15/10).
6. Acrescente uma seção datada em C:\Users\Ponse\Documents\Claude\teste\relatorios\fiscalizacao.md
   (só acrescentar) com: o que entrou, o que estava sem revisão, recomendação. No máximo 30 linhas.
```

## Por que assim
- Só leitura e relatório local: o Claude ainda erra em julgamento de design (motivo de o autor do post ter desligado o
  envio automático), então quem decide é o Felipe.
- Junto com o alarme semanal do upstream (`check_upstream.ps1`), cobre as duas pontas: o que o jogo mudou e o que
  nós mudamos.
