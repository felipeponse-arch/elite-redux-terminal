<#
Refaz o atlas de sprites com casas de 64 px (tamanho original do sprite), sem baixar nada (10/11/2026).
Por que: o atlas antigo guardava 48 px (64 reduzido sem suavizar, que come 1 a cada 4 pixels) e a ficha
mostra o sprite a 192 px; o desenho saia deformado e muito pixelado.
Como: as casas NAO mudam de lugar (data/sprite_index_por_nome.json continua valendo). O atlas original foi
montado na ordem do numero da especie, entao a casa N e o N-esimo arquivo de data/sprites_all; a imagem e
conferida antes de trocar (o original reduzido a 48 px tem de bater com a casa em pelo menos 80%).
Casa sem original (sprite acrescentado depois) e ampliada de 48 para 64 e listada.
Uso: powershell -File scripts\atlas_para_64.ps1   (so roda se o atlas ainda estiver em 48 px)
#>
Add-Type -AssemblyName System.Drawing
$dataDir = Join-Path (Split-Path $PSScriptRoot -Parent) "data"
$rawDir = Join-Path $dataDir "sprites_all"
$ANTES = 48; $DEPOIS = 64; $COLS = 44
$atlasPath = Join-Path $dataDir "sprite_atlas.png"
$nomePath = Join-Path $dataDir "sprite_index_por_nome.json"
$casas = [int](node -e "const p=require(process.argv[1]);console.log(p.cell!==${ANTES} ? -1 : Math.max(...Object.values(p.index))+1)" $nomePath)
if ($LASTEXITCODE -ne 0 -or $casas -eq 0) { Write-Output "atlas_para_64: nao consegui ler $nomePath"; exit 1 }
if ($casas -lt 0) { Write-Output "atlas_para_64: o atlas nao esta em $ANTES px; nada a fazer"; exit 0 }
if (-not (Test-Path $rawDir)) { Write-Output "atlas_para_64: falta data/sprites_all (originais de 64 px)"; exit 1 }

function Pixels($bmp, $x, $y, $lado) {
    $r = New-Object System.Drawing.Rectangle($x, $y, $lado, $lado)
    $d = $bmp.LockBits($r, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $bytes = New-Object byte[] ($lado * $lado * 4)
    for ($i = 0; $i -lt $lado; $i++) {
        [System.Runtime.InteropServices.Marshal]::Copy([IntPtr]($d.Scan0.ToInt64() + $i * $d.Stride), $bytes, $i * $lado * 4, $lado * 4)
    }
    $bmp.UnlockBits($d)
    return , $bytes
}
# fracao de pixels iguais (transparente com transparente conta como igual)
function Parecidos($a, $b) {
    $ig = 0
    for ($i = 0; $i -lt $a.Length; $i += 4) {
        if (($a[$i + 3] -eq 0 -and $b[$i + 3] -eq 0) -or ($a[$i] -eq $b[$i] -and $a[$i + 1] -eq $b[$i + 1] -and $a[$i + 2] -eq $b[$i + 2] -and $a[$i + 3] -eq $b[$i + 3])) { $ig++ }
    }
    return $ig / ($a.Length / 4)
}
function NovoDesenho($bmp) {
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
    return $g
}

$originais = @(Get-ChildItem $rawDir -Filter *.png | Sort-Object { [int]$_.BaseName })
$tmp = New-Object System.Drawing.Bitmap($ANTES, $ANTES, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gt = NovoDesenho $tmp
$velho = New-Object System.Drawing.Bitmap($atlasPath)
$linhas = [math]::Floor($velho.Height / $ANTES)
$novo = New-Object System.Drawing.Bitmap(($COLS * $DEPOIS), ($linhas * $DEPOIS), [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = NovoDesenho $novo
$achou = 0; $ampliadas = @()
for ($casa = 0; $casa -lt $casas; $casa++) {
    $col = $casa % $COLS; $lin = [math]::Floor($casa / $COLS)
    $dst = New-Object System.Drawing.Rectangle(($col * $DEPOIS), ($lin * $DEPOIS), $DEPOIS, $DEPOIS)
    $img = $null
    if ($casa -lt $originais.Count) {
        $img = [System.Drawing.Image]::FromFile($originais[$casa].FullName)
        $gt.Clear([System.Drawing.Color]::Transparent)
        $gt.DrawImage($img, (New-Object System.Drawing.Rectangle(0, 0, $ANTES, $ANTES)), (New-Object System.Drawing.Rectangle(0, 0, $img.Width, $img.Height)), [System.Drawing.GraphicsUnit]::Pixel)
        $igual = Parecidos (Pixels $tmp 0 0 $ANTES) (Pixels $velho ($col * $ANTES) ($lin * $ANTES) $ANTES)
        if ($img.Width -ne $DEPOIS -or $img.Height -ne $DEPOIS -or $igual -lt 0.8) { $img.Dispose(); $img = $null }
    }
    if ($img) {
        $g.DrawImage($img, $dst, (New-Object System.Drawing.Rectangle(0, 0, $DEPOIS, $DEPOIS)), [System.Drawing.GraphicsUnit]::Pixel)
        $img.Dispose(); $achou++
    } else {
        $g.DrawImage($velho, $dst, (New-Object System.Drawing.Rectangle(($col * $ANTES), ($lin * $ANTES), $ANTES, $ANTES)), [System.Drawing.GraphicsUnit]::Pixel)
        $ampliadas += $casa
    }
}
$g.Dispose(); $gt.Dispose(); $tmp.Dispose(); $velho.Dispose()
$saida = $atlasPath + ".novo"
$novo.Save($saida, [System.Drawing.Imaging.ImageFormat]::Png); $novo.Dispose()
Move-Item -Force $saida $atlasPath
node -e "const fs=require('fs'),a=process.argv[1],p=JSON.parse(fs.readFileSync(a,'utf8'));p.cell=$DEPOIS;fs.writeFileSync(a,JSON.stringify(p))" $nomePath
Write-Output "atlas_para_64: $achou casas com o original de 64 px, $($ampliadas.Count) ampliadas de 48 px"
if ($ampliadas.Count) { Write-Output ("  casas ampliadas: " + ($ampliadas -join ",")) }
Write-Output "  $atlasPath ($([math]::Round((Get-Item $atlasPath).Length/1MB,2)) MB). Agora rode: node scripts/remapear_sprite_index.mjs"
