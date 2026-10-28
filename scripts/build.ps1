<#
Elite Redux Terminal - single build entrypoint.

Regenera os dados derivados (data/*.json) a partir do dado bruto do jogo e
depois monta o artifact_final.html com scripts/build.mjs (Node).

So pra atualizar os DADOS (versao nova do jogo, extracao). Pra montar o app a
partir dos dados ja versionados - o caso do dia a dia - basta: npm run build

Usage:
  powershell -File build.ps1                # full rebuild
  powershell -File build.ps1 -SkipExtract    # reuse existing dex_compact.json / bosses.json
                                              # (fast path when only editing the template,
                                              # builds.json or levelcaps.json)
#>
param(
    [switch]$SkipExtract
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

$root = Split-Path $PSScriptRoot -Parent
$dataDir = Join-Path $root "data"

if (-not $SkipExtract) {
    # Back-end review, 2026-09-09: this used to be a manual step nobody was
    # forced to remember - same class of risk as slim_dex.ps1/
    # expand_combo_abilities.ps1 used to be before they got wired in. Only
    # runs here (not on -SkipExtract, which never touches game data at all)
    # so routine template-only iteration doesn't pay a network round-trip.
    # A warning, not a hard failure: drift means "don't trust a build/strategy
    # off this data without re-checking", not "nothing can be built right
    # now" - hard-blocking would stop even unrelated template work the
    # moment upstream changes, which is worse than a loud warning.
    Write-Output "--- checking upstream data for drift ---"
    & (Join-Path $PSScriptRoot "check_upstream.ps1")
    if ($LASTEXITCODE -ne 0) {
        Write-Output ""
        Write-Output "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
        Write-Output "!! UPSTREAM DATA DRIFT DETECTED (or check failed) - see details above.  !!"
        Write-Output "!! Builds/strategy suggestions may be based on stale game data. Run     !!"
        Write-Output "!! scripts\check_upstream.ps1 directly for the full report.             !!"
        Write-Output "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
        Write-Output ""
    } else {
        Write-Output "  em dia."
    }
    Write-Output "--- regenerating dex_compact.json and bosses.json from raw source ---"
    & (Join-Path $PSScriptRoot "transform.ps1")
    & (Join-Path $PSScriptRoot "extract_bosses.ps1")
    # Regerar o bosses.json apaga o campo de batalha (Trick Room, Gravity, Monochamp); regrava dos scripts de mapa do jogo.
    $erRepo = if ($env:ER_REPO) { $env:ER_REPO } else { Join-Path $PSScriptRoot "..\..\ferramentas\er-repo" }
    if (Test-Path $erRepo) { & node (Join-Path $PSScriptRoot "extrair_campo_chefoes.mjs") $erRepo --aplicar } else { throw "er-repo nao encontrado em $erRepo (defina ER_REPO): sem ele o bosses.json perde o campo dos chefoes" }
    Write-Output "--- extracting boss reference builds ---"
    & (Join-Path $PSScriptRoot "extract_boss_builds.ps1")
    # These used to be manual, run-by-hand steps, which meant a fresh
    # transform.ps1 run silently reverted slim_dex.ps1's size cuts and
    # expand_combo_abilities.ps1's "A + B" expansions back to their raw
    # state (see AUDITORIA-DOSSIE.md 1.3). Both edit their target file
    # in place and are idempotent, so they're safe to always run here.
    Write-Output "--- slimming dex_compact.json ---"
    & (Join-Path $PSScriptRoot "slim_dex.ps1")
    Write-Output "--- expanding combo abilities ---"
    & (Join-Path $PSScriptRoot "expand_combo_abilities.ps1")
    # Must run AFTER expand_combo_abilities.ps1: it scores each ability's
    # translated text (including combo abilities), so it needs the final
    # expanded description, not the raw "A + B" placeholder.
    Write-Output "--- computing species ranks ---"
    & (Join-Path $PSScriptRoot "compute_species_rank.ps1")
    Write-Output "--- computing species roles (Pivo/Tanque/Wallbreaker/Sweeper) ---"
    & (Join-Path $PSScriptRoot "compute_species_role.ps1")
    # Fase 3 do roadmap de sinergia (2026-09-11): precisa dos flags de golpe
    # (transform.ps1) e do texto de habilidade ja combo-expandido
    # (expand_combo_abilities.ps1), por isso roda depois dos dois.
    # 15/10/2026: porte em Node (lê o inglês do dado; a tradução desalinha ids na versão nova).
    Write-Output "--- computing ability x movepool synergy (gerar_sinergia_habilidade_movepool.mjs) ---"
    node (Join-Path $PSScriptRoot "gerar_sinergia_habilidade_movepool.mjs") (Join-Path $dataDir "dex_compact.json") (Join-Path $dataDir "species_ability_synergy.json")
    if ($LASTEXITCODE -ne 0) { throw "gerar_sinergia_habilidade_movepool.mjs falhou" }
    # Rank por duelo simulado (2026-09-28): reescreve tier/score/estagio/
    # Monotype de species_rank.json. Precisa da sinergia acima (bonus de
    # habilidade a golpe) - por isso roda depois dela. Leva ~6 min.
    # Categoria de golpe (soco, mordida, corte...) e chance de efeito extra, da
    # descricao longa do NextDex (2026-09-29) - o rank por duelo abaixo usa.
    Write-Output "--- categorias de golpe do NextDex (extrair_categorias_golpes.mjs) ---"
    node (Join-Path $PSScriptRoot "extrair_categorias_golpes.mjs")
    if ($LASTEXITCODE -ne 0) { throw "extrair_categorias_golpes.mjs falhou" }
    Write-Output "--- rank por duelo contra os chefoes (calcular_rank_duelo.mjs) ---"
    node (Join-Path $PSScriptRoot "calcular_rank_duelo.mjs") --gravar
    if ($LASTEXITCODE -ne 0) { throw "calcular_rank_duelo.mjs falhou" }
    # Papel de cada golpe de status (cura/setup/pivo...) a partir do efeito
    # real do jogo - usado pela coerencia papel x golpe da build por IA.
    Write-Output "--- classificando golpes de status pelo efeito real ---"
    & (Join-Path $PSScriptRoot "compute_move_roles.ps1")
    # Pesquisa de sinergia habilidade x golpe (pedido do usuario, 2026-09-20/
    # 21): catalogo sistematico do efeito real de cada golpe (precisa de
    # move_translations_pt.json ja atualo, por isso roda depois do transform
    # principal), depois cruza com habilidades condicionais que a propria
    # especie consegue satisfazer sozinha (clima, HP baixo) - roda por
    # ultimo porque depende do arquivo que o passo anterior acabou de gerar.
    Write-Output "--- catalogando efeito real de cada golpe ---"
    & (Join-Path $PSScriptRoot "compute_move_effects.ps1")
    Write-Output "--- cruzando habilidades condicionais com golpes que ativam a condicao ---"
    & (Join-Path $PSScriptRoot "compute_condition_move_synergy.ps1")
} else {
    Write-Output "--- skipping extraction, reusing existing data/dex_compact.json and data/bosses.json ---"
}

if (-not (Test-Path (Join-Path $dataDir "sprite_atlas.png"))) {
    Write-Output "--- sprite atlas missing, building it (downloads ~1900 sprites on first run) ---"
    & (Join-Path $PSScriptRoot "build_sprite_atlas.ps1")
} else {
    Write-Output "--- reusing existing sprite atlas (run build_sprite_atlas.ps1 to refresh) ---"
}
# 15/10/2026: o atlas é por espécie (sname); o número muda entre versões do jogo, então o índice número -> casa é refeito do dado atual.
node (Join-Path $PSScriptRoot "remapear_sprite_index.mjs") (Join-Path $dataDir "dex_compact.json") (Join-Path $dataDir "sprite_index_por_nome.json") (Join-Path $dataDir "sprite_index.json")
if ($LASTEXITCODE -ne 0) { throw "remapear_sprite_index.mjs falhou" }

# Montagem (validacao dos dados, colagem de src/, dados, atlas e versao): em
# Node desde a fase 8 da refatoracao (2026-09-24) - o mesmo script roda no CI
# Linux e no hook. Saida byte a byte igual a da montagem antiga em PowerShell
# (conferido na migracao).
Write-Output "--- montando artifact_final.html (scripts/build.mjs) ---"
& node (Join-Path $PSScriptRoot "build.mjs")
if ($LASTEXITCODE -ne 0) { throw "scripts/build.mjs falhou (saida acima)." }
