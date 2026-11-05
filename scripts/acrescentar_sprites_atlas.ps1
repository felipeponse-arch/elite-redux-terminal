<#
Acrescenta sprites de espécies NOVAS nas casas livres do atlas (15/10/2026), sem remontar o atlas inteiro
(o build_sprite_atlas.ps1 baixa ~1900 sprites). Espécie sem casa em data/sprite_index_por_nome.json é baixada da
NextDex (static/sprites/<NOME>.png), desenhada na próxima casa livre e gravada no índice por nome. Depois rodar
scripts/remapear_sprite_index.mjs (o build.ps1 já roda) para refazer o índice por número.
Uso: powershell -File scripts\acrescentar_sprites_atlas.ps1
#>
Add-Type -AssemblyName System.Drawing
$dataDir = Join-Path (Split-Path $PSScriptRoot -Parent) "data"
$tmp = Join-Path $env:TEMP "er_sprites_novos"
if (-not (Test-Path $tmp)) { New-Item -ItemType Directory -Path $tmp | Out-Null }

# Lista (sname sem SPECIES_ e casa) calculada em Node: ler JSON grande no PowerShell 5.1 é lento e arrisca a codificação.
$pendentes = node -e "const d=require(process.argv[1]),p=require(process.argv[2]);let c=Math.max(...Object.values(p.index))+1;for(const s of d.species)if(s&&p.index[s.sname]===undefined)console.log(s.sname.replace(/^SPECIES_/,'')+' '+(c++))" (Join-Path $dataDir "dex_compact.json") (Join-Path $dataDir "sprite_index_por_nome.json")
if (-not $pendentes) { Write-Output "acrescentar_sprites_atlas: nenhuma espécie sem sprite"; exit 0 }

$atlasPath = Join-Path $dataDir "sprite_atlas.png"
$orig = [System.Drawing.Image]::FromFile($atlasPath)
$CELL = 48; $COLS = 44
# Cresce o atlas em linhas inteiras quando as espécies pendentes não cabem nas casas livres (04/11/2026, TK-51).
$primeira = [int](@($pendentes)[0] -split " ")[1]
$linhas = [math]::Max([math]::Floor($orig.Height / $CELL), [math]::Ceiling(($primeira + @($pendentes).Count) / $COLS))
$bmp = New-Object System.Drawing.Bitmap($orig.Width, ($linhas * $CELL), [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g0 = [System.Drawing.Graphics]::FromImage($bmp); $g0.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
$g0.DrawImageUnscaled($orig, 0, 0); $g0.Dispose()
$orig.Dispose()
$maxCasas = $COLS * [math]::Floor($bmp.Height / $CELL)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
$wc = New-Object System.Net.WebClient
$gravados = @()
$casa = $null
foreach ($linha in $pendentes) {
    $nome, $casaTxt = $linha -split " "
    if ($null -eq $casa) { $casa = [int]$casaTxt }
    if ($casa -ge $maxCasas) { Write-Output "  sem casa livre no atlas para $nome"; continue }
    $arq = Join-Path $tmp "$nome.png"
    try { $wc.DownloadFile("https://raw.githubusercontent.com/ForwardFeed/ER-nextdex/main/static/sprites/$nome.png", $arq) }
    catch { Write-Output "  sem sprite na NextDex: $nome"; continue }
    $img = [System.Drawing.Image]::FromFile($arq)
    $dst = New-Object System.Drawing.Rectangle((($casa % $COLS) * $CELL), ([math]::Floor($casa / $COLS) * $CELL), $CELL, $CELL)
    $g.DrawImage($img, $dst, (New-Object System.Drawing.Rectangle(0, 0, $img.Width, $img.Height)), [System.Drawing.GraphicsUnit]::Pixel)
    $img.Dispose()
    $gravados += "SPECIES_$nome=$casa"
    $casa++
}
$g.Dispose()
$bmp.Save($atlasPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
node -e "const fs=require('fs'),a=process.argv[1],p=JSON.parse(fs.readFileSync(a,'utf8'));for(const e of process.argv.slice(2)){const [k,v]=e.split('=');p.index[k]=+v}p.rows=Math.max(p.rows,Math.ceil((Math.max(...Object.values(p.index),0)+1)/p.cols));fs.writeFileSync(a,JSON.stringify(p))" (Join-Path $dataDir "sprite_index_por_nome.json") @gravados
Write-Output "acrescentar_sprites_atlas: $($gravados.Count) sprites novos no atlas"
