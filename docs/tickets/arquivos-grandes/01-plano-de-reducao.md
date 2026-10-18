# 01 — Plano: arquivos acima de 350 linhas

Status: a-avaliar (decisão do Felipe, 17/10/2026: medir e planejar, sem refatorar agora)
Origem: setup do vibe-coding-toolkit (`docs/setup.md`). Regra `max-lines` (350) como AVISO em `eslint.config.mjs`.

## Medição na adoção (17/10/2026, master 7b154d0)
| Arquivo | Linhas |
|---|---|
| src/regras/duelo.js | 4455 |
| src/regras/prompts_ia.js | 938 |
| src/ui/dex_ficha.js | 754 |
| src/regras/pipeline_build.js | 692 |
| src/ui/arquetipo.js | 653 |
| src/ui/aba_chefoes.js | 638 |
| src/ui/editor_build.js | 607 |
| src/regras/validacao_build_ia.js | 528 |
| src/regras/chefoes.js | 512 |
| src/ui/dex_lista.js | 505 |
| src/ui/ia.js | 398 |
| src/ui/time.js | 390 |
| src/regras/save.js | 388 |
| src/ui/nucleo.js | 385 |

## Plano (uma onda por sessão, portão verde a cada passo)
1. **Fácil, baixo risco:** os 4 entre 385 e 400 linhas (ia, time, save, nucleo): separar por responsabilidade quando houver uma
   clara; senão, registrar a exceção com o porquê.
2. **UI média (500-760):** dex_ficha, arquetipo, aba_chefoes, editor_build, dex_lista: um módulo por painel/seção.
3. **Regras (500-940):** prompts_ia (um arquivo por prompt), validacao_build_ia, chefoes, pipeline_build.
4. **duelo.js (4455):** só com o mapa do Graphify (`graphify-out/`) e por fatias: dano, status, campo/clima, habilidades,
   duelo; cada fatia com as sabotagens apontando para o arquivo novo. O app junta os arquivos num só (sem import), então a
   ordem de carga em `scripts/build.mjs` e `carregar_regras.mjs` precisa acompanhar.

## Critérios de aceite por onda
- [ ] Nenhuma API mudada; portão nível 3 verde; sabotagens reapontadas (nenhuma apagada).
- [ ] Contagem de `max-lines` cai; quando chegar a 0 num grupo, a regra vira erro para ele.
