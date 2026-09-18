param(
    [string]$AppRoot = $PSScriptRoot
)

$ErrorActionPreference = 'Stop'
$target = Join-Path $AppRoot 'assets\Signs SVGs\mutcd-svg-main'
$targetIndex = Join-Path $target 'index.json'
$targetSvg = Join-Path $target 'svg'

function Test-MutcdFolder([string]$Path) {
    $index = Join-Path $Path 'index.json'
    $svgDir = Join-Path $Path 'svg'
    if (-not (Test-Path -LiteralPath $index -PathType Leaf)) { return $false }
    if (-not (Test-Path -LiteralPath $svgDir -PathType Container)) { return $false }
    $count = @(Get-ChildItem -LiteralPath $svgDir -Filter '*.svg' -File -ErrorAction SilentlyContinue).Count
    return ($count -ge 1054)
}

if (Test-MutcdFolder $target) {
    $count = @(Get-ChildItem -LiteralPath $targetSvg -Filter '*.svg' -File).Count
    Write-Host "MUTCD SVG verification passed: $count real SVG files." -ForegroundColor Green
    exit 0
}

Write-Host 'Real MUTCD SVG folder is missing or incomplete.' -ForegroundColor Yellow
Write-Host 'Checking common local GitHub project locations first...'

$candidates = New-Object System.Collections.Generic.List[string]
$candidates.Add((Join-Path (Split-Path $AppRoot -Parent) 'assets\Signs SVGs\mutcd-svg-main'))
$candidates.Add((Join-Path (Split-Path (Split-Path $AppRoot -Parent) -Parent) 'assets\Signs SVGs\mutcd-svg-main'))
$candidates.Add('C:\Projects\NEXT-Gen-Plans\assets\Signs SVGs\mutcd-svg-main')
$candidates.Add('C:\Projects\NXT-Gen-Plans\assets\Signs SVGs\mutcd-svg-main')
$candidates.Add((Join-Path $env:USERPROFILE 'Documents\GitHub\NEXT-Gen-Plans\assets\Signs SVGs\mutcd-svg-main'))
$candidates.Add((Join-Path $env:USERPROFILE 'Documents\GitHub\NXT-Gen-Plans\assets\Signs SVGs\mutcd-svg-main'))
$candidates.Add((Join-Path $env:USERPROFILE 'source\repos\NEXT-Gen-Plans\assets\Signs SVGs\mutcd-svg-main'))

foreach ($candidate in $candidates) {
    if ($candidate -and ((Resolve-Path -LiteralPath $candidate -ErrorAction SilentlyContinue).Path -ne (Resolve-Path -LiteralPath $target -ErrorAction SilentlyContinue).Path) -and (Test-MutcdFolder $candidate)) {
        Write-Host "Found real MUTCD library locally: $candidate" -ForegroundColor Cyan
        New-Item -ItemType Directory -Force -Path (Split-Path $target -Parent) | Out-Null
        if (Test-Path -LiteralPath $target) { Remove-Item -LiteralPath $target -Recurse -Force }
        Copy-Item -LiteralPath $candidate -Destination $target -Recurse -Force
        if (Test-MutcdFolder $target) {
            $count = @(Get-ChildItem -LiteralPath $targetSvg -Filter '*.svg' -File).Count
            Write-Host "Copied and verified $count real SVG files." -ForegroundColor Green
            exit 0
        }
    }
}

Write-Host 'Local copy not found. Downloading the repository asset folder from GitHub...' -ForegroundColor Cyan
$tmpRoot = Join-Path $env:TEMP ('NXTGenPlans_MUTCD_' + [guid]::NewGuid().ToString('N'))
$zipPath = Join-Path $tmpRoot 'repo.zip'
$extractPath = Join-Path $tmpRoot 'extract'
New-Item -ItemType Directory -Force -Path $tmpRoot | Out-Null

try {
    $url = 'https://codeload.github.com/RBRTWTX/NEXT-Gen-Plans/zip/refs/heads/main'
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing
    Expand-Archive -LiteralPath $zipPath -DestinationPath $extractPath -Force

    $source = Get-ChildItem -LiteralPath $extractPath -Directory | ForEach-Object {
        Join-Path $_.FullName 'assets\Signs SVGs\mutcd-svg-main'
    } | Where-Object { Test-MutcdFolder $_ } | Select-Object -First 1

    if (-not $source) { throw 'Downloaded repository did not contain a complete mutcd-svg-main folder.' }

    New-Item -ItemType Directory -Force -Path (Split-Path $target -Parent) | Out-Null
    if (Test-Path -LiteralPath $target) { Remove-Item -LiteralPath $target -Recurse -Force }
    Copy-Item -LiteralPath $source -Destination $target -Recurse -Force

    if (-not (Test-MutcdFolder $target)) { throw 'Copied MUTCD folder failed verification.' }
    $count = @(Get-ChildItem -LiteralPath $targetSvg -Filter '*.svg' -File).Count
    Write-Host "Downloaded and verified $count real MUTCD SVG files." -ForegroundColor Green
    exit 0
}
catch {
    Write-Host ''
    Write-Host 'MUTCD SVG synchronization FAILED.' -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host 'The application can still open, but generated federal fallback signs are disabled.' -ForegroundColor Yellow
    exit 2
}
finally {
    if (Test-Path -LiteralPath $tmpRoot) { Remove-Item -LiteralPath $tmpRoot -Recurse -Force -ErrorAction SilentlyContinue }
}
