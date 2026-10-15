# Gasto da sessão na fila v01–v05

Pedido do Felipe (15/10/2026): registrar antes do v01 e ao fim de cada ticket o que a sessão consegue ver.

**O que é visível daqui:** `get_session` mostra `usage.cost_usd` (acumulado da sessão inteira, desde 14/10, incluindo calibração 01–08 e as tarefas A–D),
os tokens e o contexto usado. **O saldo de crédito não aparece em lugar nenhum desta sessão.** Só aparece `rate_limit_info`
(limite de sete dias, `status: allowed_warning`, sem `isUsingOverage`). Então a regra "parar abaixo de US$ 15 de saldo" não consegue ser checada;
o acumulado fica registrado para o Felipe comparar com o saldo que ele vê na conta.

| Data/hora (UTC) | Ticket | Gasto acumulado da sessão (US$) | Saída (tokens) | Contexto usado | Saldo visível |
|---|---|---|---|---|---|
| 15/10 09:25 | antes do v01 | 45,38 | 726.180 | 774.080 / 1.000.000 | não aparece |
| 15/10 11:20 | fim do v01–v04 (amostra única; não medi por ticket) | 47,98 | 755.459 | 148.684 / 1.000.000 (depois de uma compactação) | não aparece; o Felipe informou ~US$ 44 de saldo à parte |
