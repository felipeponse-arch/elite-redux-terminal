# 18 — Gerador de builds: chamada da IA (cache, saída estruturada, modelo)

Status: pronto-para-agente
Bloqueado por: 06

## O que entrega
Rodar a skill claude-api sobre a chamada do gerador: o que a plataforma de Artifacts deixa usar (cache de prompt, saída estruturada/ferramentas, escolha de modelo) e aplicar o que couber, para a build sair mais rápida, mais barata e sem erro de leitura da resposta.

## Critérios de aceite
- [ ] PRIMEIRO: levantar o que o runtime do artifact permite; o que não permitir fica registrado e descartado.
- [ ] Medir antes e depois: tempo por build e taxa de resposta que falha na leitura.
- [ ] Respostas mal formadas deixam de existir ou caem num caminho testado.
- [ ] Fila e nova tentativa atuais continuam funcionando.

## Comentários
Origem: pedido de 07/10 de revisar o gerador de builds (kit de habilidades, golpes, EVs, item, natureza, Mega) com skills do repositório.
