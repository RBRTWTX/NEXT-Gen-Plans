param(
    [string]$RepoRoot = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

$RepoRoot = [IO.Path]::GetFullPath($RepoRoot)
$SignRoot = Join-Path $RepoRoot "assets\Signs SVGs\mutcd-svg-main"
$SvgRoot = Join-Path $SignRoot "svg"
$IndexPath = Join-Path $SignRoot "index.json"

if (-not (Test-Path $SvgRoot)) {
    throw "SVG folder not found: $SvgRoot"
}
if (-not (Test-Path $IndexPath)) {
    throw "index.json not found: $IndexPath"
}

function Normalize-Key([string]$Stem) {
    $s = $Stem.Trim()

    # Clean common source prefixes while preserving useful sign code text.
    $s = $s -replace '^(?i:Mutcd|Muctd)\s+', ''
    $s = $s -replace '^(?i:Fdot Road Sign)\s+', 'FDOT '
    $s = $s -replace '\s+', ' '

    # Prefer a recognizable sign-code token when one exists.
    $patterns = @(
        '(?i)\b(CW\d{1,2}(?:-\d+[A-Za-z0-9]*)*[A-Za-z]?)\b',
        '(?i)\b([RWSDGEMI]\d{1,2}(?:-\d+[A-Za-z0-9]*)+[A-Za-z]?)\b',
        '(?i)\b([RWSDGEMI]\d{1,2}-\d+[A-Za-z]?)\b'
    )
    foreach ($p in $patterns) {
        $m = [regex]::Match($s, $p)
        if ($m.Success) {
            $code = $m.Groups[1].Value.ToUpperInvariant()
            # Keep descriptive variant text when filename contains it.
            $variant = ""
            $paren = [regex]::Match($s, '\s*(\([^)]+\))\s*$')
            if ($paren.Success) { $variant = " " + $paren.Groups[1].Value }
            if ($s -match '^(?i:FDOT)') { return ("FDOT " + $code + $variant).Trim() }
            return ($code + $variant).Trim()
        }
    }

    # For filenames without a formal sign code, use the readable stem.
    return $s
}

function Infer-Category([string]$Key, [string]$Stem) {
    $u = ($Key + " " + $Stem).ToUpperInvariant()

    if ($u -match '\b(TXDOT|TEXAS)\b') { return "texas" }

    # Temporary traffic control families.
    if ($u -match '\bW(20|21|22|23|24|25|26)-' -or
        $u -match '\bCW(20|21|22|23|24|25|26)-' -or
        $u -match '\bG20-' -or
        $u -match '\bMOT-' -or
        $u -match '\bWORK ZONE\b') {
        return "ttc"
    }

    if ($u -match '(^|[^A-Z])R\d') { return "regulatory" }
    if ($u -match '(^|[^A-Z])(W|CW)\d' -or
        $u -match '\bADVISORY\b' -or
        $u -match '\bCURVE SPEED\b' -or
        $u -match '\bRAMP SPEED\b' -or
        $u -match '\bEXIT SPEED\b') {
        return "warning"
    }
    if ($u -match '(^|[^A-Z])(D|E|G|I|M)\d') { return "guide" }
    if ($u -match '(^|[^A-Z])S\d') { return "warning" }

    return "other"
}

function Infer-Shape([string]$Key, [string]$Category) {
    $u = $Key.ToUpperInvariant()
    if ($u -match '\bR1-1\b') { return "octagon" }
    if ($u -match '\bR1-2') { return "triangle" }
    if ($Category -eq "warning" -or $Category -eq "ttc") {
        if ($u -match '\bG20-' -or $u -match '\bMOT-') { return "rectangle" }
        return "diamond"
    }
    return "rectangle"
}

function Infer-Background([string]$Key, [string]$Category) {
    $u = $Key.ToUpperInvariant()
    if ($u -match '\bR1-1\b') { return "red" }
    if ($Category -eq "ttc") { return "orange" }
    if ($Category -eq "warning") { return "yellow" }
    if ($Category -eq "guide") { return "green" }
    return "white"
}

Write-Host ""
Write-Host "NXT Gen Plans - Sign Index Builder" -ForegroundColor Cyan
Write-Host "----------------------------------" -ForegroundColor Cyan

# Load JSON while preserving the existing entries as a dictionary.
$raw = Get-Content -LiteralPath $IndexPath -Raw -Encoding UTF8
$parsed = $raw | ConvertFrom-Json

$index = [ordered]@{}
foreach ($prop in $parsed.PSObject.Properties) {
    $index[$prop.Name] = $prop.Value
}

# Existing indexed SVG paths.
$indexedSvg = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
foreach ($key in @($index.Keys)) {
    $v = $index[$key]
    if ($null -ne $v.svg -and [string]$v.svg -ne "") {
        [void]$indexedSvg.Add(([IO.Path]::GetFileName([string]$v.svg)))
    }
}

$svgFiles = @(Get-ChildItem -LiteralPath $SvgRoot -Filter *.svg -File | Sort-Object Name)
$added = 0
$collisions = 0

foreach ($file in $svgFiles) {
    if ($indexedSvg.Contains($file.Name)) { continue }

    $stem = [IO.Path]::GetFileNameWithoutExtension($file.Name)
    $baseKey = Normalize-Key $stem
    if ([string]::IsNullOrWhiteSpace($baseKey)) { $baseKey = $stem }

    $key = $baseKey
    $n = 2
    while ($index.Contains($key)) {
        $key = "$baseKey [$n]"
        $n++
        $collisions++
    }

    $category = Infer-Category $key $stem
    $shape = Infer-Shape $key $category
    $background = Infer-Background $key $category

    $entry = [ordered]@{
        name       = $stem
        category   = $category
        shape      = $shape
        background = $background
        svg        = ("svg/" + $file.Name)
    }

    $index[$key] = $entry
    [void]$indexedSvg.Add($file.Name)
    $added++
}

# Backup before overwriting.
$backup = Join-Path $SignRoot ("index.before_sign_update_" + (Get-Date -Format "yyyyMMdd_HHmmss") + ".json")
Copy-Item -LiteralPath $IndexPath -Destination $backup -Force

# Write stable pretty JSON, UTF-8 without BOM.
$json = $index | ConvertTo-Json -Depth 8
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[IO.File]::WriteAllText($IndexPath, $json, $utf8NoBom)

# Re-verify.
$verify = Get-Content -LiteralPath $IndexPath -Raw -Encoding UTF8 | ConvertFrom-Json
$verifyProps = @($verify.PSObject.Properties)

$seen = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
$duplicatePaths = @()
foreach ($p in $verifyProps) {
    $fn = [IO.Path]::GetFileName([string]$p.Value.svg)
    if (-not $seen.Add($fn)) { $duplicatePaths += $fn }
}

$diskNames = @($svgFiles.Name)
$indexedNames = @($verifyProps | ForEach-Object { [IO.Path]::GetFileName([string]$_.Value.svg) })
$indexedSet = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
$indexedNames | ForEach-Object { [void]$indexedSet.Add($_) }

$missing = @($diskNames | Where-Object { -not $indexedSet.Contains($_) })
$badPaths = @($indexedNames | Where-Object { -not (Test-Path (Join-Path $SvgRoot $_)) })

Write-Host ""
Write-Host "SVG files on disk : $($svgFiles.Count)"
Write-Host "Index entries      : $($verifyProps.Count)"
Write-Host "New entries added  : $added"
Write-Host "Key collisions     : $collisions"
Write-Host "Backup created     : $backup"

if ($missing.Count -gt 0) {
    Write-Host ""
    Write-Host "FAIL: $($missing.Count) SVG file(s) are still not indexed." -ForegroundColor Red
    $missing | Select-Object -First 25 | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    exit 20
}

if ($badPaths.Count -gt 0) {
    Write-Host ""
    Write-Host "FAIL: $($badPaths.Count) index path(s) point to missing SVG files." -ForegroundColor Red
    $badPaths | Select-Object -First 25 | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    exit 21
}

if ($duplicatePaths.Count -gt 0) {
    Write-Host ""
    Write-Host "FAIL: duplicate indexed SVG path(s) found." -ForegroundColor Red
    $duplicatePaths | Select-Object -Unique | Select-Object -First 25 | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    exit 22
}

Write-Host ""
Write-Host "PASS: Every SVG file is indexed exactly once." -ForegroundColor Green
Write-Host "PASS: Every indexed SVG path exists." -ForegroundColor Green
Write-Host "PASS: Existing index entries were preserved." -ForegroundColor Green
Write-Host ""
Write-Host "Commit the updated index.json to Git after testing the Traffic palette." -ForegroundColor Yellow
