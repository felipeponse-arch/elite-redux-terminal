# A branch `upcoming` é a versão que os jogadores jogam? (15/10/2026)

Só leitura e relatório. Pergunta da Construção: o `upcoming` do `eliteredux-source` (`486026e`) já é o que os jogadores jogam? Qual versão pública corresponde e o que o `upcoming` tem a mais?

## 1. Resposta

**Não há evidência de que o `upcoming` seja a versão pública, e há evidência contrária.** Nenhuma fonte acessível mostra uma versão pública que corresponda ao `486026e`.

1. O repositório do jogo **não publica tags nem marca versões**: `git ls-remote --tags` devolve 0 tags em `eliteredux-source` e em `er-config`. As *releases* do GitHub não puderam ser consultadas daqui (ver seção 4). A versão pública não é identificável por commit.
2. A versão escrita no jogo, no próprio `upcoming`, é **`v2.65 Beta2.1`** e **não mudou desde 09/03/2026**, enquanto o ramo recebeu **428 commits depois** (340 depois de 28/03). Ou seja, o `upcoming` é desenvolvimento depois de uma build marcada, não uma build publicada.
3. O `master` do repositório está parado em junho de 2025 e **não** é a versão dos jogadores (seção 3).
4. O NextDex, que é a referência pública de dados, trata a versão mais nova (`2.65.4`) como dado criado em 07/10/2026 a partir da `er-config`, e a página oficial, segundo o registro interno de 06/10/2026, ainda não anunciava essa versão (seção 4).

**O que dá para dizer, com a ressalva de ser inferência:** a versão pública mais recente de que há registro é a **2.65.3b** (download atualizado em 26/03/2026, segundo a leitura do site feita em 06/10/2026). O dado do NextDex "2.65beta" e a `er-config` `6a30b66` são de **28/03/2026**, dois dias depois. É a âncora mais próxima, mas **a fonte não confirma** que 2.65.3b seja exatamente o commit `7d85acd` (código de 28/03) ou o `6a30b66`.

## 2. Evidências do repositório (verificadas hoje)

| Fato | Comando ou arquivo | Resultado |
|---|---|---|
| Tags de `eliteredux-source` | `git ls-remote --tags https://github.com/Elite-Redux/eliteredux-source` | 0 |
| Tags de `er-config` | idem | 0 |
| Tags do NextDex (`ForwardFeed/ER-nextdex`) | idem | 1, `experimental` (`f928f82`), sem versão |
| `upcoming` | `git ls-remote --heads` | `486026e13d`, 14/10/2026 |
| `master` | idem | `1415629fd8`, 04/06/2025 (merge do PR #7 `add-claude-github-actions`) |
| `master` x `upcoming` | `git rev-list --left-right --count origin/master...486026e` | 245 só no `master`, 4667 só no `upcoming`; base comum `33ac81e` |
| Versão exibida no jogo | `src/strings.c:1688-1690`, `src/hall_of_fame.c:911-914`, `src/start_menu.c:88` | `v2.65 Beta2.1` (e `... Debug`); igual em 28/03 (`7d85acd`), 16/09 (`217dd0f`) e 14/10 (`486026e`) |
| Último commit de versão | `git log -S'v2.65 Beta2.1' -- src/strings.c` | `cf95b805b2`, 09/03/2026, "Prepare v2.65 Beta2.1 dev build" (antes `06da575972`, 08/03, "chore: prepare non-debug beta build") |
| Commits depois dele | `git rev-list --count cf95b805b2..486026e` | **428** |
| Commits depois do dado "2.65beta" | `git rev-list --count 7d85acd..486026e` | **340** |
| Distribuição | `git log --since=2026-03-10` por mês | mar 100, abr 101, mai 39, jun 24, jul 20, ago 25, set 54, out 65 |
| Mensagens com número de versão | `git log --grep` | só marcos antigos (v1.6.1, v2.0 Beta, 2.5, "2.65 Doc Implemenation Changes" de 02/02/2026); nenhum "2.65.3" nem "2.65.4" |

Nota: a string "Beta2.1" ficar igual não prova que o jogador veja "Beta2.1": a versão pública 2.65.3b pode ter sido compilada com outra string. O que prova é que **o texto do `upcoming` hoje não identifica uma build pública**.

## 3. Os ramos

O `eliteredux-source` tem 26 ramos de cabeça (`git ls-remote --heads`), entre eles `master` (parado em 2025), `upcoming` (14/10/2026) e ramos de trabalho (`3.0-pokemon-dev`, `Overworld-Overhaul`, `NewBattleInterface2025`, `test-suite` etc.). O `master` não é o código da versão atual; o `upcoming` é o ramo de desenvolvimento ativo. **A fonte não confirma** qual ramo ou commit gerou a ROM distribuída.

## 4. Site, changelog e releases

- **eliteredux.net (Full Documentation, `/full-changelog`, `/download`): não consultado nesta sessão.** O host é bloqueado pela política de rede do ambiente (`CONNECT tunnel failed, response 403`, e `getaddrinfo ENOTFOUND` pelo WebFetch). Quem puder liberar o host em *Network access* do ambiente permite refazer esta seção com leitura direta.
- **Registro interno, segunda mão e datado:** `docs/decisoes_mecanicas.md`, linha 75 (06/10/2026), diz que o changelog e a página de download do eliteredux.net "param na 2.65.3b" (download "Last Updated" 26/03/2026), que "2.65.4.1b" **não** existe em fonte oficial (só em pesquisas de IA) e que a decisão do usuário de 07/10 é manter o app em 2.65beta até a versão nova sair no site. Isso foi lido por outra sessão; **não foi reconferido hoje**.
- **Releases do GitHub:** a API do GitHub não cobre repositórios fora do escopo da sessão; **fonte não confirma**.
- **NextDex** (`ForwardFeed/ER-nextdex`, lido por `git`): `static/js/data_version.js` lista as versões `1.6.1, Beta2.0, Beta2.1, 2.1, 2.2, 2.5, AprilFools, 2.65beta, 2.65.4` e abre na última. O commit `54f751aa` (28/03/2026) atualizou o "2.65"; o `72f001f8` (07/10/2026, "adding the 2.65.4 data version") criou o dado `2.65.4` e o `8b7faf75` (07/10) moveu o submódulo `er-config` para `7285071` (06/10/2026, "Movepool fixes"). Em 23/07/2026 (`86893f13`) o NextDex passou a avisar quem não usa a versão mais recente. **O `2.65.4` do NextDex é, portanto, dado de desenvolvimento derivado da `er-config`**, e não prova uma build pública.

## 5. O que o `upcoming` tem a mais

Âncora de comparação: **28/03/2026** (código `7d85acd`, `er-config` `6a30b66`), a data mais próxima da 2.65.3b e o dado que o app usa. Diferenças até `486026e`/`d1a9a4c`, medidas em `varredura_versao_atual_2026-10-15.md` (seção 3) e `dados/deriva_versao_atual.json`:

| Área | Mais no `upcoming` | Fonte |
|---|---|---|
| Código de habilidade | 39 blocos novos e 51 alterados (3 com número alterado: Madness Enhancement x0,5 para x0,8; Feathercoat; King of the Jungle) | `git diff 7d85acd..486026e -- src/abilities.cc` |
| Habilidades | 38 novas; 201 com texto alterado; 8 renomeadas (Keen Edge virou Sharpness) | `AbilityList.textproto` `6a30b66` x `d1a9a4c` |
| Golpes | 9 novos; 42 alterados (Beak Blast 100 para 120, Hyper Drill 100 para 120, Mountain Gale 100 para 120, Psyshield Bash 70 para 90, Pocket Sand +1 de prioridade...) | `MoveList.textproto` |
| Espécies | 16 novas, 1 removida, 116 alteradas | `SpeciesList.textproto` |
| Treinadores | 6 diferenças nos chefões que o app já tem | `scripts/conferir_chefoes_config.mjs` |
| Itens | nenhuma mudança de efeito ou parâmetro | `items/*.textproto` |
| Fora disso (ex.: telas, mapas, scripts) | **fonte não confirma** o que mudou; só o código de batalha e os dados acima foram comparados | – |

**Não há como separar** o que entrou entre a 2.65.3b (26/03) e 28/03 (dois dias) do que veio depois; a diferença acima é "28/03 até hoje".

## 6. Consequência para o app

Isto não decide nada, só aponta o conflito: a decisão do usuário de 07/10 (linha 75) manda o app seguir a versão **oficialmente publicada** (2.65beta até a 2.65.x sair no site), e a instrução de hoje é mirar o código mais novo (`upcoming`). O `upcoming` hoje é **dado de desenvolvimento**, não uma build que o jogador tenha. Se o app passar a mirá-lo, a linha 75 precisa ser reescrita e o app deve avisar que mostra uma versão ainda não publicada.

## 7. O que a fonte não confirma

1. Qual commit gerou a ROM da 2.65.3b (ou de qualquer versão pública).
2. Qualquer afirmação sobre o site eliteredux.net feita hoje (host bloqueado): vale só o registro de 06/10.
3. As *releases* do GitHub.
4. Se existe uma versão pública posterior à 2.65.3b.
