param(
  [string]$RepoRoot=(Get-Location).Path,
  [switch]$Execute
)

$ErrorActionPreference="Stop"
$RepoRoot=[IO.Path]::GetFullPath($RepoRoot)

# Safety gate: R11.2 must already be installed and active.
$indexPath=Join-Path $RepoRoot "index.html"
if(-not (Test-Path $indexPath)){ throw "index.html not found." }
$index=Get-Content $indexPath -Raw
if($index -notmatch 'src="r11-2-stabilization\.js"'){ throw "R11.2 is not installed. Cleanup stopped." }

$mustKeep=@(
  ".gitattributes",
  "START_NXT_GEN_PLANS.bat",
  "index.html",
  "standards.js","app.js","styles.css",
  "r4-addon.js","r4-addon.css",
  "r5-addon.js","r5-addon.css",
  "r6-addon.js","r6-addon.css",
  "r6-1-integration.js","r6-1-integration.css",
  "r7-addon.js","r7-addon.css",
  "r8-addon.js","r8-addon.css",
  "r8-1-compat.js","r8-1-compat.css",
  "r9-addon.js","r9-addon.css",
  "r10-addon.js","r10-addon.css",
  "r11-addon.js","r11-addon.css",
  "r11-1-responsive-text.js","r11-1-responsive-text.css",
  "r11-2-stabilization.js",
  "index.R11_1.before_R11_2.html",
  "DISABLE_R11_2.bat",
  "RESEARCH_NOTES.txt",
  "assets","vendor"
)

foreach($x in $mustKeep){
  if(-not (Test-Path (Join-Path $RepoRoot $x))){ throw "Required retained item is missing: $x" }
}

$obsolete=@(
  "CLEAN_NXT_GEN_PLANS_R8_1.ps1",

  "INSTALL_R9.bat","INSTALL_R9.js","VERIFY_R9_INSTALL.bat","DISABLE_R9.bat","README_R9.txt",
  "INSTALL_R10.bat","INSTALL_R10.js","VERIFY_R10_INSTALL.bat","DISABLE_R10.bat","README_R10.txt",
  "INSTALL_R11.bat","INSTALL_R11.js","VERIFY_R11_INSTALL.bat","DISABLE_R11.bat","README_R11.txt",
  "INSTALL_R11_1.bat","INSTALL_R11_1.js","VERIFY_R11_1_INSTALL.bat","DISABLE_R11_1.bat","README_R11_1.txt",

  "INSTALL_R11_2.bat","INSTALL_R11_2.js","VERIFY_NXT_R11_2.ps1","README_R11_2.txt",

  "DISABLE_R8_1.bat",

  "index.R8.before_R8_1.html",
  "index.R8_1.before_R9.html",
  "index.R9.before_R10.html",
  "index.R10.before_R11.html",
  "index.R11.before_R11_1.html"
)

$found=@($obsolete | Where-Object { Test-Path (Join-Path $RepoRoot $_) })

Write-Host ""
Write-Host "NXT Gen Plans R11.2 cleanup" -ForegroundColor Cyan
Write-Host "Files identified as obsolete: $($found.Count)" -ForegroundColor Yellow
$found | ForEach-Object { Write-Host "  $_" }

if(-not $Execute){
  Write-Host ""
  Write-Host "PREVIEW ONLY. Nothing deleted." -ForegroundColor Cyan
  Write-Host 'Run again with -Execute after reviewing the list.' -ForegroundColor White
  exit 0
}

foreach($name in $found){
  Remove-Item -LiteralPath (Join-Path $RepoRoot $name) -Force
  Write-Host "DELETED: $name" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "PASS: Obsolete installers/rollback clutter removed." -ForegroundColor Green
Write-Host "PASS: Active R3-R11.2 runtime preserved." -ForegroundColor Green
Write-Host "PASS: Latest rollback index + DISABLE_R11_2.bat preserved." -ForegroundColor Green
Write-Host "PASS: assets/vendor/research notes preserved." -ForegroundColor Green

if(Get-Command git -ErrorAction SilentlyContinue){
  Push-Location $RepoRoot
  Write-Host ""
  Write-Host "git status --short" -ForegroundColor Cyan
  git status --short
  Pop-Location
}
