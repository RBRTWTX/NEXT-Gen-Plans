param(
    [string]$RepoRoot = (Get-Location).Path,
    [switch]$Execute
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " NXT Gen Plans - Safe Project Cleanup" -ForegroundColor Cyan
Write-Host " Baseline: R6.1 FIX2 / Git c599a93a" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$RepoRoot = [System.IO.Path]::GetFullPath($RepoRoot)
$Index = Join-Path $RepoRoot "index.html"

if (-not (Test-Path $Index)) {
    throw "index.html was not found at: $RepoRoot"
}

$Required = @(
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
    "r6-1-integration.css"
)

$Missing = @()
foreach ($Name in $Required) {
    if (-not (Test-Path (Join-Path $RepoRoot $Name))) {
        $Missing += $Name
    }
}

if ($Missing.Count -gt 0) {
    Write-Host "STOP: Required active files are missing:" -ForegroundColor Red
    $Missing | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    exit 10
}

$IndexText = Get-Content $Index -Raw
$Needles = @(
    'src="app.js"',
    'src="r4-addon.js"',
    'src="r5-addon.js"',
    'src="r6-addon.js"',
    'src="r6-1-integration.js"'
)

$Positions = @()
foreach ($Needle in $Needles) {
    $P = $IndexText.IndexOf($Needle)
    if ($P -lt 0) {
        throw "Active index.html is missing: $Needle"
    }
    $Positions += $P
}

for ($i = 1; $i -lt $Positions.Count; $i++) {
    if ($Positions[$i] -le $Positions[$i-1]) {
        throw "Active script load order is not app.js -> R4 -> R5 -> R6 -> R6.1."
    }
}

$R61 = Get-Content (Join-Path $RepoRoot "r6-1-integration.js") -Raw
if ($R61 -notmatch "NXT_R6_1_FIX2_NO_RECURSIVE_OBSERVER") {
    throw "R6.1 FIX2 marker was not found. Cleanup stopped."
}
if ($R61 -match "observer\.observe\(document\.body") {
    throw "Old recursive observer is still present. Cleanup stopped."
}

Write-Host "PASS: Active R6.1 FIX2 runtime verified." -ForegroundColor Green
Write-Host "PASS: Script load order verified." -ForegroundColor Green
Write-Host ""

$Obsolete = @(
    "APPLY_R5_FIX1.bat",
    "APPLY_R5_FIX1.js",

    "APPLY_R6_1_FIX1.bat",
    "APPLY_R6_1_FIX1.js",
    "APPLY_R6_1_FIX2.bat",
    "APPLY_R6_1_FIX2.js",

    "INSTALL_R5.bat",
    "INSTALL_R5.js",
    "INSTALL_R6.bat",
    "INSTALL_R6.js",
    "INSTALL_R6_1.bat",
    "INSTALL_R6_1.js",

    "VERIFY_R5_INSTALL.bat",
    "VERIFY_R5_FIX1.bat",
    "VERIFY_R6_INSTALL.bat",
    "VERIFY_R6_1.bat",
    "VERIFY_R6_1_FIX1.bat",
    "VERIFY_R6_1_FIX2.bat",

    "COPY_MUTCD_FROM_LOCAL_REPO.bat",
    "SYNC_REAL_MUTCD_ASSETS.ps1",
    "VERIFY_MUTCD_ASSETS.bat",

    "RESTORE_NXT_GEN_PLANS_R3_NOW.bat",
    "REMOVE_R4.js",

    "R3_ACCEPTANCE_CHECKLIST.txt",
    "README_R4.txt",
    "README_R4_FIXED_INSTALLER.txt",
    "README_R5.txt",
    "README_R5_FIX1.txt",
    "README_R6.txt",
    "README_R6_1.txt",
    "README_R6_1_FIX1.txt",
    "README_R6_1_FIX2.txt",

    "index.R3.before_R4.html",
    "index.R4.before_R5.html",
    "index.R5.before_R6.html",

    "r5-addon.before_FIX1.js",
    "r6-1-integration.before_FIX1.js"
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

if ($Found.Count -eq 0) {
    Write-Host "Nothing to clean. The root folder is already clean." -ForegroundColor Green
    exit 0
}

Write-Host "Files identified as obsolete:" -ForegroundColor Yellow
$Found | ForEach-Object { Write-Host ("  " + $_.File) }
Write-Host ""
Write-Host ("Total: {0} files" -f $Found.Count) -ForegroundColor Yellow
Write-Host ""

if (-not $Execute) {
    Write-Host "PREVIEW ONLY - nothing was deleted." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To perform the cleanup, run:" -ForegroundColor White
    Write-Host ('  powershell -ExecutionPolicy Bypass -File "{0}" -RepoRoot "{1}" -Execute' -f $MyInvocation.MyCommand.Path, $RepoRoot) -ForegroundColor White
    Write-Host ""
    Write-Host "The following rollback files will be KEPT:" -ForegroundColor Green
    Write-Host "  index.R6.before_R6_1.html"
    Write-Host "  r6-1-integration.before_FIX2.js"
    Write-Host "  DISABLE_R6_1.bat"
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
Write-Host "PASS: Active R3/R4/R5/R6/R6.1 runtime files were preserved." -ForegroundColor Green
Write-Host "PASS: Current R6.1 rollback files were preserved." -ForegroundColor Green
Write-Host ""

$Git = Get-Command git -ErrorAction SilentlyContinue
if ($Git) {
    try {
        Push-Location $RepoRoot
        Write-Host "Git status after cleanup:" -ForegroundColor Cyan
        git status --short
        Pop-Location
    } catch {
        try { Pop-Location } catch {}
    }
}

Write-Host ""
Write-Host "If GitHub Desktop shows these deletions, review them and commit the cleanup when ready." -ForegroundColor Cyan
