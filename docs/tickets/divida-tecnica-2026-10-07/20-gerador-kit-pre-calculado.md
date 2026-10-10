# 20 — Gerador de builds: redesenho do caminho espécie → kit → build

Status: a-avaliar
Bloqueado por: 17, 19

## O que entrega
Projetar duas vezes (codebase-design, design-it-twice) o caminho espécie → kit (habilidades, golpes liberados, itens e Mega da Etapa) → candidatos → build validada, e testar com um protótipo descartável (skill prototype) a ideia de o código pré-calcular o kit e a IA só decidir.

## Critérios de aceite
- [ ] 2-3 desenhos comparados em depth, locality e seam.
- [ ] Protótipo responde: a build fica melhor ou mais barata? com números.
- [ ] Usuário escolhe o desenho antes de virar tickets de implementação.
- [ ] Protótipo não entra no master.

## Comentários
Origem: pedido de 07/10 de revisar o gerador de builds (kit de habilidades, golpes, EVs, item, natureza, Mega) com skills do repositório.

- 10/10 (usuário): o desenho do ticket parte de `docs/pipeline_de_build.md`. Hit-kill vale em 2 níveis (1 golpe é o melhor, 2 golpes é o segundo), medido contra o próximo chefão da Etapa; kit = uma das 3 habilidades + as inatas. Caso de prova: espécie com Coil Up + Flaming Jaws + Hyper Aggressive deve sair com Fire Fang.
