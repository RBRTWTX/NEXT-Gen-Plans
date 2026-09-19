param(
    [string]$RepoRoot = (Get-Location).Path,
    [switch]$Execute
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " NXT Gen Plans - R8.1 Safe Repository Cleanup" -ForegroundColor Cyan
Write-Host " Baseline: Git 6a045e0b / R8.1 Universal Canvas" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$RepoRoot = [System.IO.Path]::GetFullPath($RepoRoot)
$Index = Join-Path $RepoRoot "index.html"

if (-not (Test-Path $Index)) {
    throw "index.html was not found at: $RepoRoot"
}

# -------------------------------------------------------------------------
# HARD SAFETY GATE
# -------------------------------------------------------------------------

$Required = @(
    ".gitattributes",
    "app.js",
    "standards.js",
    "styles.css",
    "index.html",
    "START_NXT_GEN_PLANS.bat",

    "r4-addon.js",
    "r4-addon.css",
    "r5-addon.js",
    "r5-addon.css",
    "r6-addon.js",
    "r6-addon.css",
    "r6-1-integration.js",
    "r6-1-integration.css",
    "r7-addon.js",
    "r7-addon.css",
    "r8-addon.js",
    "r8-addon.css",
    "r8-1-compat.js",
    "r8-1-compat.css",

    "assets",
    "vendor"
)

$Missing = @()
foreach ($Name in $Required) {
    if (-not (Test-Path (Join-Path $RepoRoot $Name))) {
        $Missing += $Name
    }
}

if ($Missing.Count -gt 0) {
    Write-Host "STOP: Required active project files are missing:" -ForegroundColor Red
    $Missing | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    exit 10
}

$IndexText = Get-Content $Index -Raw
$LoadOrder = @(
    'src="standards.js"',
    'src="app.js"',
    'src="r4-addon.js"',
    'src="r5-addon.js"',
    'src="r6-addon.js"',
    'src="r6-1-integration.js"',
    'src="r7-addon.js"',
    'src="r8-addon.js"',
    'src="r8-1-compat.js"'
)

$Last = -1
foreach ($Needle in $LoadOrder) {
    $Pos = $IndexText.IndexOf($Needle)
    if ($Pos -lt 0) {
        throw "Active index.html is missing $Needle"
    }
    if ($Pos -le $Last) {
        throw "Active runtime script order is incorrect at $Needle"
    }
    $Last = $Pos
}

$R61 = Get-Content (Join-Path $RepoRoot "r6-1-integration.js") -Raw
if ($R61 -notmatch "NXT_R6_1_FIX2_NO_RECURSIVE_OBSERVER") {
    throw "R6.1 FIX2 marker missing. Cleanup stopped."
}
if ($R61 -match "observer\.observe\(document\.body") {
    throw "Old recursive R6.1 observer is present. Cleanup stopped."
}

$R7 = Get-Content (Join-Path $RepoRoot "r7-addon.js") -Raw
if ($R7 -notmatch "NXT_R7_MANUAL_TCP") {
    throw "R7 marker missing. Cleanup stopped."
}

$R8 = Get-Content (Join-Path $RepoRoot "r8-addon.js") -Raw
if ($R8 -notmatch "NXT_R8_COMBINED_MANUAL") {
    throw "R8 marker missing. Cleanup stopped."
}

$R81 = Get-Content (Join-Path $RepoRoot "r8-1-compat.js") -Raw
if ($R81 -notmatch "NXT_R8_1_UNIVERSAL_CANVAS") {
    throw "R8.1 Universal Canvas marker missing. Cleanup stopped."
}

$MutcdDir = Join-Path $RepoRoot "assets\Signs SVGs\mutcd-svg-main\svg"
if (-not (Test-Path $MutcdDir)) {
    throw "MUTCD SVG directory is missing. Cleanup stopped."
}

$SvgCount = @(Get-ChildItem -LiteralPath $MutcdDir -Filter "*.svg" -File).Count
if ($SvgCount -ne 1054) {
    throw "Expected 1054 MUTCD SVGs but found $SvgCount. Cleanup stopped."
}

Write-Host "PASS: Active R8.1 runtime verified." -ForegroundColor Green
Write-Host "PASS: Script load order verified." -ForegroundColor Green
Write-Host "PASS: R6.1 FIX2 verified." -ForegroundColor Green
Write-Host "PASS: MUTCD library verified: 1054 SVGs." -ForegroundColor Green
Write-Host ""

# -------------------------------------------------------------------------
# RETAINED ROLLBACK
# -------------------------------------------------------------------------
#
# Keep ONLY the current useful rollback:
#   index.R8.before_R8_1.html
#   DISABLE_R8_1.bat
#
# Git history already preserves older R6/R7/R8 installation states.

$KeepRollback = @(
    "index.R8.before_R8_1.html",
    "DISABLE_R8_1.bat"
)

# -------------------------------------------------------------------------
# OBSOLETE ROOT CLUTTER
# -------------------------------------------------------------------------

$Obsolete = @(
    # Previous cleanup helper
    "CLEAN_NXT_GEN_PLANS_R6_1.ps1",

    # Old installers
    "INSTALL_R7.bat",
    "INSTALL_R7.js",
    "INSTALL_R8.bat",
    "INSTALL_R8.js",
    "INSTALL_R8_1.bat",
    "INSTALL_R8_1.js",

    # Old install verifiers
    "VERIFY_R7_INSTALL.bat",
    "VERIFY_R8_INSTALL.bat",
    "VERIFY_R8_1_INSTALL.bat",

    # Superseded rollback BATs
    "DISABLE_R6_1.bat",
    "DISABLE_R7.bat",
    "DISABLE_R8.bat",

    # Superseded HTML rollback points
    "index.R6.before_R6_1.html",
    "index.R6_1.before_R7.html",
    "index.R7.before_R8.html",

    # Very old integration backup
    "r6-1-integration.before_FIX2.js",

    # Version-specific README files
    "README_R7.txt",
    "README_R8.txt",
    "README_R8_1.txt"
)

$Found = @()
foreach ($Name in $Obsolete) {
    $Path = Join-Path $RepoRoot $Name
    if (Test-Path $Path) {
        $Found += [PSCustomObject]@{
            File = $Name
            Path = $Path
        }
    }
}

Write-Host "Files that will remain as the active runtime:" -ForegroundColor Green
@(
    "app.js / standards.js / styles.css",
    "R4 / R5 / R6",
    "R6.1 integration",
    "R7",
    "R8",
    "R8.1 Universal Canvas",
    "START_NXT_GEN_PLANS.bat",
    "assets / vendor",
    "README.txt",
    "RESEARCH_NOTES.txt"
) | ForEach-Object { Write-Host "  $_" }

Write-Host ""
Write-Host "Current rollback files that will be KEPT:" -ForegroundColor Green
$KeepRollback | ForEach-Object {
    if (Test-Path (Join-Path $RepoRoot $_)) {
        Write-Host "  $_"
    } else {
        Write-Host "  $_  [not currently present]" -ForegroundColor DarkYellow
    }
}

Write-Host ""

if ($Found.Count -eq 0) {
    Write-Host "Nothing obsolete was found. The root is already clean." -ForegroundColor Green
    exit 0
}

Write-Host "Obsolete files identified:" -ForegroundColor Yellow
$Found | ForEach-Object { Write-Host ("  " + $_.File) }
Write-Host ""
Write-Host ("Total obsolete files: {0}" -f $Found.Count) -ForegroundColor Yellow
Write-Host ""

if (-not $Execute) {
    Write-Host "PREVIEW ONLY - nothing has been deleted." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "If this list looks correct, run:" -ForegroundColor White
    Write-Host ('  powershell -ExecutionPolicy Bypass -File "{0}" -Execute' -f $MyInvocation.MyCommand.Path) -ForegroundColor White
    Write-Host ""
    exit 0
}

Write-Host "Deleting obsolete files..." -ForegroundColor Yellow
$Deleted = 0

foreach ($Item in $Found) {
    Remove-Item -LiteralPath $Item.Path -Force
    Write-Host ("  DELETED: " + $Item.File) -ForegroundColor DarkGray
    $Deleted++
}

Write-Host ""
Write-Host ("PASS: Deleted {0} obsolete files." -f $Deleted) -ForegroundColor Green
Write-Host "PASS: Active R8.1 runtime preserved." -ForegroundColor Green
Write-Host "PASS: Current pre-R8.1 rollback preserved." -ForegroundColor Green
Write-Host "PASS: MUTCD assets untouched." -ForegroundColor Green
Write-Host ""

# Show what GitHub Desktop / git will see.
$Git = Get-Command git -ErrorAction SilentlyContinue
if ($Git) {
    try {
        Push-Location $RepoRoot
        Write-Host "Git status after cleanup:" -ForegroundColor Cyan
        git status --short
        Pop-Location
    }
    catch {
        try { Pop-Location } catch {}
    }
}

Write-Host ""
Write-Host "Review the deletions in GitHub Desktop, then commit and push the cleanup." -ForegroundColor Cyan
