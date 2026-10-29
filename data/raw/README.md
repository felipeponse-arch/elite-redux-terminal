# data/raw

Dado bruto de fontes externas, guardado como veio - nunca editado à mão e
nunca lido pelo app. É a matéria-prima de onde os arquivos de `data/` foram
derivados, pra poder refazer uma integração sem repetir a coleta.

## discord_build_workshop_2.65.json

- **Fonte**: thread "Build Workshop for 2.65" do Discord oficial do Elite
  Redux, canal indicado pelo usuário, varrida inteira do primeiro post
  (07/03/2026) até 15/09/2026.
- **Conteúdo**: 341 builds, só os campos da build (`esp`, `item`, `hab`, `nat`,
  `evs`, `golpes`). Sem autor, ID de mensagem ou link.
- **Alternativas por slot preservadas**: 319 das 341 trazem opções como
  `"Mud Shot / Flame Burst"`. A integração de 2026-09-15 em `data/builds.json`
  escolheu uma opção por slot e descartou as outras - este arquivo é a única
  cópia desses cenários.
- **Grafia é a do post, não a do jogo**: nomes podem ter erro de digitação ou
  apóstrofo curvo. Qualquer uso precisa validar contra o dado do jogo e gravar
  a grafia canônica (lição de 2026-09-16: 29 builds inválidas publicadas por
  gravar a grafia do post).

## Onde fica o dado cru ativo (TK-25)

- `data/gameData.json` (sem versão no nome; a versão está em `data/carimbo_dados.json`) é o dado do jogo
  que o pipeline lê (`transform.ps1`, `extract_bosses.ps1`...) e que `scripts/atualizar_de_config.mjs` atualiza
  a partir do er-config. Fica em `data/` porque é lido pelo build.
- `data/raw/` guarda só coletas externas congeladas (Discord, snapshots antigos), nunca lidas pelo app.
