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
