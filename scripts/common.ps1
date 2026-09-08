# Shared helpers for the Elite Redux Terminal data pipeline.
# Dot-source this from other scripts: . (Join-Path $PSScriptRoot "common.ps1")

Add-Type -AssemblyName System.Web.Extensions

function New-GameDataParser {
    $ser = New-Object System.Web.Script.Serialization.JavaScriptSerializer
    $ser.MaxJsonLength = 200000000
    return $ser
}

# Manual JSON writer - JavaScriptSerializer.Serialize() throws a circular-reference
# error on values that came out of DeserializeObject(), so we write JSON by hand.
function Write-JsonString([System.Text.StringBuilder]$sb, [string]$s) {
    [void]$sb.Append('"')
    if ($s) {
        foreach ($ch in $s.ToCharArray()) {
            switch ($ch) {
                '"' { [void]$sb.Append('\"'); break }
                '\' { [void]$sb.Append('\\'); break }
                "`n" { [void]$sb.Append('\n'); break }
                "`r" { [void]$sb.Append('\r'); break }
                "`t" { [void]$sb.Append('\t'); break }
                default {
                    if ([int]$ch -lt 0x20) { [void]$sb.Append([string]::Format('\u{0:x4}', [int]$ch)) }
                    else { [void]$sb.Append($ch) }
                }
            }
        }
    }
    [void]$sb.Append('"')
}

function Write-JsonValue([System.Text.StringBuilder]$sb, $val) {
    if ($null -eq $val) { [void]$sb.Append('null'); return }
    if ($val -is [bool]) { [void]$sb.Append($(if ($val) { 'true' } else { 'false' })); return }
    if ($val -is [string]) { Write-JsonString $sb $val; return }
    if ($val -is [int] -or $val -is [long] -or $val -is [double] -or $val -is [float] -or $val -is [decimal]) {
        [void]$sb.Append([System.Convert]::ToString($val, [System.Globalization.CultureInfo]::InvariantCulture))
        return
    }
    if ($val -is [System.Collections.IDictionary]) {
        [void]$sb.Append('{')
        $first = $true
        foreach ($key in $val.Keys) {
            if (-not $first) { [void]$sb.Append(',') }
            $first = $false
            Write-JsonString $sb ([string]$key)
            [void]$sb.Append(':')
            Write-JsonValue $sb $val[$key]
        }
        [void]$sb.Append('}')
        return
    }
    if ($val -is [System.Collections.IEnumerable]) {
        [void]$sb.Append('[')
        $first = $true
        foreach ($item in $val) {
            if (-not $first) { [void]$sb.Append(',') }
            $first = $false
            Write-JsonValue $sb $item
        }
        [void]$sb.Append(']')
        return
    }
    Write-JsonString $sb ([string]$val)
}

function ConvertTo-JsonManual($val) {
    $sb = New-Object System.Text.StringBuilder
    Write-JsonValue $sb $val
    return $sb.ToString()
}

# Raw EVs are stored as a 6-int array [HP,Atk,Def,SpA,SpD,Spe] (same order as
# dex_compact.json species "b" base-stat arrays). Format as the same Showdown
# EV string style already used by hand in data/builds.json, e.g.
# "252 HP / 252 SpD / 4 Def" - zero values dropped, HP/Atk/Def/SpA/SpD/Spe order.
# Scores one ability's translated Portuguese description (from
# data/ability_translations_pt.json) 0-3 for PERSONAL combat impact - the
# survivability/damage relevance to the one Pokemon that has it, not
# team-wide utility like weather-setting (out of scope: the regex patterns
# below can't reliably judge that, so it's left neutral rather than guessed).
# This is the ability dimension of scripts/compute_species_rank.ps1 - it
# exists as a shared function (not copy-pasted) so scripts/score_abilities.ps1
# (the calibration/research tool) and the real computation always agree.
# Calibrated 2026-09-08 against all 1033 translated abilities - see
# score_abilities.ps1's distribution/sample output before changing these
# rules, a bug here silently reweights every species' rank.
function Score-AbilityText([string]$desc) {
    if (-not $desc) { return 0 }
    $d = $desc

    # A "NAO dobra X" clause is a disambiguation note (the style guide adds it
    # after a flat damage-halving ability, to clarify it's NOT ALSO a Fur-Coat
    # -style stat-doubling effect) - strip it before any "Dobra" check below,
    # otherwise the negation reads as a false positive for "doubles a stat".
    $dobraPositive = $d -replace '[Nn][ãa]o dobra[^.]*\.?', ''

    # Tier 3: full type immunity combined with a beneficial secondary effect
    # (heals HP, boosts a stat by >=1.2x, or a "no damage instead" clause), or
    # a Sturdy-like "cannot be OHKO'd" guarantee.
    if ($d -match 'Imune a (golpes d[oe] tipo|ataques d[oe] tipo)') {
        if ($d -match 'Cura \d+% do HP|Aumenta.*em \d+(\.\d+)?x|usa \w+ se atingido|maximiza a Velocidade') { return 3 }
    }
    if ($d -match 'N[ãa]o recebe dano.*se atingido por um golpe d[oe] tipo') { return 3 }
    if ($d -match 'n[ãa]o pode ser nocauteado em um golpe s[óo]') { return 3 }

    # Tier 2: solid unconditional mechanical advantage.
    if ($d -match 'Imune a (golpes d[oe] tipo|ataques d[oe] tipo)') { return 2 }
    if ($d -match 'Recebe (3[0-9]|[4-9][0-9]|100)% menos dano de golpes super efetivos') { return 2 }
    # Whole-category damage halving (all physical OR all special hits) is
    # broad enough to matter against roughly half of all possible attackers -
    # distinct from (and stronger than) halving just ONE type, see tier 1.
    if ($d -match 'Reduz pela metade o dano recebido de golpes (f[íi]sicos|especiais)') { return 2 }
    if ($d -match 'Cura \d\d+% do HP m[áa]ximo (ao|no fim)') { return 2 }
    if ($d -match 'Aumenta (a pr[óo]pria|o pr[óo]prio|os pr[óo]prios golpes).*em [1-9]\.[3-9]x') { return 2 }
    if ($d -match 'Aumenta.*em [2-9] est[áa]gios?') { return 2 }
    if ($dobraPositive -match 'Dobra ') { return 2 }

    # Tier 1: minor/situational bonus - single status immunity, small flat
    # bonus, small stage change, small/conditional healing, single-TYPE
    # (not whole-category) damage halving.
    if ($d -match 'Imune a (paralisia|envenenamento|queimadura|sono|confus[ãa]o|congelamento|atra[çc][ãa]o)') { return 1 }
    if ($d -match 'N[ãa]o pode ser (envenenado|paralisado|queimado|confuso|adormecido|congelado)') { return 1 }
    if ($d -match 'Recebe \d+% menos dano') { return 1 }
    if ($d -match 'Reduz pela metade o dano recebido') { return 1 }
    if ($d -match 'Aumenta.*em 1 est[áa]gio') { return 1 }
    if ($d -match 'Cura \d+% do HP') { return 1 }
    if ($d -match 'Aumenta.*em 1\.[1-2]x') { return 1 }

    return 0
}

function Format-Evs($evsArr) {
    $labels = @("HP", "Atk", "Def", "SpA", "SpD", "Spe")
    $arr = @($evsArr)
    $parts = New-Object System.Collections.ArrayList
    for ($i = 0; $i -lt 6; $i++) {
        $v = if ($i -lt $arr.Count) { [int]$arr[$i] } else { 0 }
        if ($v -gt 0) { [void]$parts.Add("$v $($labels[$i])") }
    }
    return ($parts -join " / ")
}
