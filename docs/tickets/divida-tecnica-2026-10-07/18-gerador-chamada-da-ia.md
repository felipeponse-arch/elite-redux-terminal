# 18 — Gerador de builds: chamada da IA (cache, saída estruturada, modelo)

Status: descartado (11/11/2026: a IA saiu do app no corte de 06/11; ticket sem objeto)
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

### Compatibilidade OmniRoute (10/10/2026)
- O Artifact não acessa o `localhost` do computador do usuário e não recebe chave ou segredo.
- A proposta inicial de build individual e do lote pode usar, somente quando o host injeta a ponte `window.__ER_OMNIROUTE_BRIDGE__`, o modelo explícito `antigravity/gemini-3.1-pro-high`.
- A ponte expõe apenas `modelo` e `json(prompt, opcoes)`. Modelo incompatível não é aceito; aliases `auto/*` e `COMBO-1` não entram no caminho.
- Sem ponte, o caminho oficial `sample` permanece igual. Se a ponte falhar, o `sample` é carregado sob demanda; se também não estiver disponível, a mensagem original é preservada.
- A validação local, gravação, simulação e revisão continuam sendo a autoridade. Resposta recebida de qualquer fornecedor passa pelo mesmo validador.
- Estratégia, revisão, plano manual e demais chamadas não recebem `provedor: "omniroute"`.

### Medição e limites
Ainda não há medição real de latência, custo ou taxa de aceitação: o runtime publicado não fornece acesso seguro à ponte local. A cobertura automatizada usa cliente fake para provar seleção, fallback e rejeição de modelo; não representa desempenho de produção.

### Critérios reavaliados
- [x] Runtime limitado e segredo fora do Artifact, com bloqueio registrado.
- [ ] Medir antes/depois em runtime autorizado; bloqueado até existir bridge seguro exercitável.
- [x] Respostas malformadas continuam no caminho de validação e retentativa já testado.
- [x] Fila, timeout e novas tentativas atuais preservados.
