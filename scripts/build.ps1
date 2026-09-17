<#
Elite Redux Terminal - single build entrypoint.

Regenerates data/dex_compact.json and data/bosses.json from the raw game data
snapshot, then splices template + all data files into artifact_final.html,
with validation.

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
$templatePath = Join-Path $root "artifact_template.html"
$outPath = Join-Path $root "artifact_final.html"

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
    Write-Output "--- computing ability x movepool synergy (Fase 3) ---"
    & (Join-Path $PSScriptRoot "compute_ability_movepool_synergy.ps1")
    # Papel de cada golpe de status (cura/setup/pivo...) a partir do efeito
    # real do jogo - usado pela coerencia papel x golpe da build por IA.
    Write-Output "--- classificando golpes de status pelo efeito real ---"
    & (Join-Path $PSScriptRoot "compute_move_roles.ps1")
} else {
    Write-Output "--- skipping extraction, reusing existing data/dex_compact.json and data/bosses.json ---"
}

if (-not (Test-Path (Join-Path $dataDir "sprite_atlas.png"))) {
    Write-Output "--- sprite atlas missing, building it (downloads ~1900 sprites on first run) ---"
    & (Join-Path $PSScriptRoot "build_sprite_atlas.ps1")
} else {
    Write-Output "--- reusing existing sprite atlas (run build_sprite_atlas.ps1 to refresh) ---"
}

$dataFiles = @{
    "__DEX_DATA_JSON__"  = Join-Path $dataDir "dex_compact.json"
    "__BUILDS_JSON__"    = Join-Path $dataDir "builds.json"
    "__BOSSES_JSON__"    = Join-Path $dataDir "bosses.json"
    "__LEVELCAPS_JSON__" = Join-Path $dataDir "levelcaps.json"
    "__SAVEDTEAMS_JSON__" = Join-Path $dataDir "saved_teams_seed.json"
    "__ABILITY_PT_JSON__" = Join-Path $dataDir "ability_translations_pt.json"
    "__SPRITE_INDEX_JSON__" = Join-Path $dataDir "sprite_index.json"
    "__MOVE_PT_JSON__" = Join-Path $dataDir "move_translations_pt.json"
    "__BUILD_HISTORY_JSON__" = Join-Path $dataDir "build_history.json"
    "__BOSS_BUILDS_JSON__" = Join-Path $dataDir "boss_reference_builds.json"
    "__SPECIES_RANK_JSON__" = Join-Path $dataDir "species_rank.json"
    "__SPECIES_ROLE_JSON__" = Join-Path $dataDir "species_role.json"
    "__ABILITY_SYNERGY_JSON__" = Join-Path $dataDir "species_ability_synergy.json"
    "__MEGA_FORMS_JSON__" = Join-Path $dataDir "mega_forms.json"
    "__MOVE_ROLES_JSON__" = Join-Path $dataDir "move_roles.json"
    "__CHANGELOG_JSON__" = Join-Path $dataDir "changelog.json"
    "__HOW_TO_OBTAIN_JSON__" = Join-Path $dataDir "how_to_obtain.json"
    "__ITEM_DESC_JSON__" = Join-Path $dataDir "item_descriptions.json"
    "__ITEM_PT_JSON__" = Join-Path $dataDir "item_translations_pt.json"
    "__GYM_SKILLS_JSON__" = Join-Path $dataDir "gym_skills.json"
}

foreach ($path in $dataFiles.Values) {
    if (-not (Test-Path $path)) { throw "Missing required data file: $path" }
}

# Trava de dado (2026-09-16): builds.json é curado à mão/por script a partir do
# Discord, e já shipou 29 entradas citando habilidade/golpe que a espécie não
# tem. Roda em TODO build (inclusive -SkipExtract, que é justamente o caminho
# usado quando só builds.json muda) e aborta em vez de avisar - dado inválido
# aqui vira conselho errado na tela do jogador.
Write-Output "--- validando builds.json contra os dados reais ---"
& (Join-Path $PSScriptRoot "validate_builds.ps1")
# Mesma ideia pros outros dados derivados (item Q2 da pauta técnica).
Write-Output "--- validando invariantes dos dados ---"
& (Join-Path $PSScriptRoot "validate_data_invariants.ps1")

Write-Output "--- splicing ---"
$final = Get-Content $templatePath -Raw -Encoding UTF8

# Regras do jogo (item D1 da pauta técnica, 2026-09-16): lógica pura mora em
# src/regras/*.js e é colada no ponto exato do marcador /*@regras NOME*/, no
# mesmo escopo do <script> principal. O artifact publicado continua sendo um
# arquivo só. Todo arquivo de src/regras precisa ter marcador, e todo marcador
# precisa de arquivo - senão o build aborta.
$regrasDir = Join-Path $root "src\regras"
$marcadores = [regex]::Matches($final, "/\*@regras ([A-Za-z0-9_.]+)\*/")
$usados = @{}
foreach ($m in $marcadores) {
    $nome = $m.Groups[1].Value
    if ($usados.ContainsKey($nome)) { throw "Marcador /*@regras $nome*/ aparece mais de uma vez no template." }
    $arq = Join-Path $regrasDir $nome
    if (-not (Test-Path $arq)) { throw "Marcador /*@regras $nome*/ sem arquivo em src/regras." }
    $usados[$nome] = $true
    $final = $final.Replace($m.Value, (Get-Content $arq -Raw -Encoding UTF8).TrimEnd())
}
foreach ($f in (Get-ChildItem $regrasDir -Filter "*.js" -File)) {
    if (-not $usados.ContainsKey($f.Name)) { throw "src/regras/$($f.Name) nao tem marcador /*@regras $($f.Name)*/ no template - nunca chegaria no app." }
}
if ($final -match "/\*@regras ") { throw "Sobrou marcador /*@regras ...*/ depois da colagem." }
Write-Output "  regras coladas: $($usados.Count) arquivo(s) de src/regras"
$ser = New-GameDataParser

foreach ($placeholder in $dataFiles.Keys) {
    $path = $dataFiles[$placeholder]
    $json = Get-Content $path -Raw -Encoding UTF8

    # Validate each data file is actually parseable JSON before splicing it in -
    # a bad hand-edit to builds.json/levelcaps.json should fail loudly here,
    # not silently ship a broken artifact.
    try {
        [void]$ser.DeserializeObject($json)
    } catch {
        throw "Data file $path is not valid JSON: $($_.Exception.Message)"
    }

    if ($final -notmatch [regex]::Escape($placeholder)) {
        throw "Placeholder $placeholder not found in template - did the template change?"
    }

    # Achado real em revisão de segurança (2026-09-13, Especialista em
    # Segurança): .Replace() do .NET é case-SENSITIVE, mas o tokenizer
    # HTML de um navegador de verdade fecha uma tag </script> em qualquer
    # combinação de maiúsculas/minúsculas (</SCRIPT>, </Script> etc.) -
    # confirmado empiricamente que "</SCRIPT>".Replace("</script", ...)
    # não casava e vazava intacto. Como esses 15 blocos JSON vêm (via
    # data/gameData_265beta.json) de um site externo não totalmente
    # confiável (NextDex), um nome/descrição de espécie/habilidade/golpe
    # contendo qualquer variação de maiúscula de "</script" quebraria pra
    # fora do <script type="application/json"> e teria o resto da string
    # interpretado como HTML/script real pelo navegador - regex
    # case-insensitive fecha essa lacuna sem mudar o mecanismo (mesma
    # ideia: insere uma barra invertida no meio de "</script" pra
    # neutralizar o fechamento de tag, sem tocar no ">" nem no resto).
    $safeJson = [regex]::Replace($json, "</script", "<\/script", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    # Trava de regressão pro achado acima - se o escaping alguma vez voltar
    # a ser quebrado (ex: alguém trocar de volta pro .Replace() case-
    # sensitive), o build falha alto em vez de publicar silenciosamente
    # com uma tag </script (qualquer case) real ainda escondida no JSON.
    if ($safeJson -imatch "</script") {
        throw "Escaping de </script falhou pra $path - ainda ha uma ocorrencia nao escapada, publicar isto quebraria o HTML."
    }
    $final = $final.Replace($placeholder, $safeJson)
}

# The sprite atlas is a binary PNG, not JSON, so it gets its own step: embedded
# as a base64 data URI the CSS points at.
$atlasPath = Join-Path $dataDir "sprite_atlas.png"
if (-not (Test-Path $atlasPath)) { throw "Missing sprite atlas: $atlasPath (run build_sprite_atlas.ps1)" }
$atlasUri = "data:image/png;base64," + [System.Convert]::ToBase64String([System.IO.File]::ReadAllBytes($atlasPath))
if ($final -notmatch [regex]::Escape("__SPRITE_ATLAS_DATAURI__")) { throw "Placeholder __SPRITE_ATLAS_DATAURI__ not found in template." }
$final = $final.Replace("__SPRITE_ATLAS_DATAURI__", $atlasUri)

foreach ($placeholder in $dataFiles.Keys) {
    if ($final.Contains($placeholder)) { throw "Placeholder $placeholder still present after splice - build is broken." }
}
if ($final.Contains("__SPRITE_ATLAS_DATAURI__")) { throw "Sprite atlas placeholder still present after splice." }

# Versão no cabeçalho do app (2026-09-16, item I3 da pauta técnica): o commit do
# código que gerou este arquivo, pra saber o que está no ar. "-modificado"
# quando a pasta tem mudança não commitada - um build assim nunca devia ser
# publicado (scripts/prepare_publish.ps1 recusa).
$appVersion = "local"
try {
    $hash = (& git -C $root rev-parse --short HEAD 2>$null)
    if ($LASTEXITCODE -eq 0 -and $hash) {
        $appVersion = $hash.Trim()
        $dirty = (& git -C $root status --porcelain 2>$null)
        if ($dirty) { $appVersion += "-modificado" }
    }
} catch {}
if ($final -notmatch [regex]::Escape("__APP_VERSION__")) { throw "Placeholder __APP_VERSION__ not found in template." }
$final = $final.Replace("__APP_VERSION__", $appVersion)

[System.IO.File]::WriteAllText($outPath, $final, (New-Object System.Text.UTF8Encoding($false)))

$bytes = (Get-Item $outPath).Length
if ($bytes -lt 500000) { throw "Output file is suspiciously small ($bytes bytes) - something likely failed silently." }
# Artifact hard limit is 16MB; warn well before we get near it.
if ($bytes -gt 14000000) { throw "Output is ${bytes} bytes, too close to the 16MB artifact limit." }

Write-Output "--- done ---"
Write-Output "artifact_final.html: $bytes bytes ($([math]::Round($bytes/1MB,2)) MB), versao $appVersion"
Write-Output "Publish it with the Artifact tool (file_path=$outPath, keep the same artifact url to update in place)."
