param(
    [string]$RepoRoot = (Get-Location).Path
)

$ErrorActionPreference = "Stop"
$RepoRoot = [IO.Path]::GetFullPath($RepoRoot)
$SignRoot = Join-Path $RepoRoot "assets\Signs SVGs\mutcd-svg-main"
$SvgRoot = Join-Path $SignRoot "svg"
$IndexPath = Join-Path $SignRoot "index.json"

if (-not (Test-Path $SvgRoot)) { throw "Missing SVG directory: $SvgRoot" }
if (-not (Test-Path $IndexPath)) { throw "Missing index.json: $IndexPath" }

$svgs = @(Get-ChildItem -LiteralPath $SvgRoot -Filter *.svg -File | Sort-Object Name)
$idx = Get-Content -LiteralPath $IndexPath -Raw -Encoding UTF8 | ConvertFrom-Json
$props = @($idx.PSObject.Properties)

$disk = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
$svgs.Name | ForEach-Object { [void]$disk.Add($_) }

$seen = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
$missingOnDisk = @()
$duplicates = @()

foreach ($p in $props) {
    $fn = [IO.Path]::GetFileName([string]$p.Value.svg)
    if (-not $disk.Contains($fn)) { $missingOnDisk += "$($p.Name) -> $fn" }
    if (-not $seen.Add($fn)) { $duplicates += $fn }
}

$unindexed = @($svgs.Name | Where-Object { -not $seen.Contains($_) })

Write-Host ""
Write-Host "NXT Gen Plans Sign Library Verification" -ForegroundColor Cyan
Write-Host "---------------------------------------" -ForegroundColor Cyan
Write-Host "SVG files   : $($svgs.Count)"
Write-Host "Index entries: $($props.Count)"
Write-Host "Unindexed   : $($unindexed.Count)"
Write-Host "Missing SVG : $($missingOnDisk.Count)"
Write-Host "Duplicates  : $($duplicates.Count)"

if ($unindexed.Count -or $missingOnDisk.Count -or $duplicates.Count) {
    if ($unindexed.Count) {
        Write-Host "`nUnindexed files:" -ForegroundColor Red
        $unindexed | Select-Object -First 30 | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    }
    if ($missingOnDisk.Count) {
        Write-Host "`nIndex entries pointing to missing files:" -ForegroundColor Red
        $missingOnDisk | Select-Object -First 30 | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    }
    if ($duplicates.Count) {
        Write-Host "`nDuplicate indexed SVG paths:" -ForegroundColor Red
        $duplicates | Select-Object -Unique | Select-Object -First 30 | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    }
    exit 1
}

Write-Host ""
Write-Host "PASS: Sign library is fully synchronized." -ForegroundColor Green
exit 0
