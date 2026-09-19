param([string]$RepoRoot=(Get-Location).Path)

$ErrorActionPreference="Stop"
$RepoRoot=[IO.Path]::GetFullPath($RepoRoot)

$required=@(
  "index.html","standards.js","app.js","styles.css","START_NXT_GEN_PLANS.bat",
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
  "assets","vendor"
)

$missing=@($required | Where-Object { -not (Test-Path (Join-Path $RepoRoot $_)) })
if($missing.Count){
  Write-Host "FAIL: Required files missing:" -ForegroundColor Red
  $missing | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
  exit 10
}

$index=Get-Content (Join-Path $RepoRoot "index.html") -Raw
$order=@(
  'src="standards.js"','src="app.js"',
  'src="r4-addon.js"','src="r5-addon.js"','src="r6-addon.js"',
  'src="r6-1-integration.js"','src="r7-addon.js"',
  'src="r8-addon.js"','src="r8-1-compat.js"',
  'src="r9-addon.js"','src="r10-addon.js"',
  'src="r11-addon.js"','src="r11-1-responsive-text.js"',
  'src="r11-2-stabilization.js"'
)
$last=-1
foreach($needle in $order){
  $pos=$index.IndexOf($needle)
  if($pos -lt 0 -or $pos -le $last){ throw "Runtime order failure at $needle" }
  $last=$pos
}

$checks=@(
  @("r6-1-integration.js","NXT_R6_1_FIX2_NO_RECURSIVE_OBSERVER"),
  @("r7-addon.js","NXT_R7_MANUAL_TCP"),
  @("r8-addon.js","NXT_R8_COMBINED_MANUAL"),
  @("r8-1-compat.js","NXT_R8_1_UNIVERSAL_CANVAS"),
  @("r9-addon.js","NXT_R9_MANUAL_GEOMETRY"),
  @("r10-addon.js","NXT_R10_LOCAL_LIBRARY"),
  @("r11-addon.js","NXT_R11_PLAN_DOCUMENTATION"),
  @("r11-1-responsive-text.js","NXT_R11_1_RESPONSIVE_TEXT"),
  @("r11-2-stabilization.js","NXT_R11_2_STABILIZATION")
)
foreach($c in $checks){
  $txt=Get-Content (Join-Path $RepoRoot $c[0]) -Raw
  if($txt -notmatch [regex]::Escape($c[1])){ throw "Marker missing: $($c[0]) / $($c[1])" }
}

$r61=Get-Content (Join-Path $RepoRoot "r6-1-integration.js") -Raw
if($r61 -match 'observer\.observe\(document\.body'){ throw "Recursive R6.1 observer is present." }

$mutcd=Join-Path $RepoRoot "assets\Signs SVGs\mutcd-svg-main\svg"
$count=@(Get-ChildItem -LiteralPath $mutcd -Filter *.svg -File).Count
if($count -ne 1054){ throw "Expected 1054 MUTCD SVG files; found $count" }

$indexTags=[regex]::Matches($index,'<script src="([^"]+)"') | ForEach-Object {$_.Groups[1].Value}
$dupes=$indexTags | Group-Object | Where-Object Count -gt 1
if($dupes){ throw "Duplicate script tag(s): $($dupes.Name -join ', ')" }

Write-Host ""
Write-Host "NXT GEN PLANS R11.2 PROJECT AUDIT" -ForegroundColor Cyan
Write-Host "---------------------------------" -ForegroundColor Cyan
Write-Host "PASS: Active runtime files present." -ForegroundColor Green
Write-Host "PASS: Runtime load order correct." -ForegroundColor Green
Write-Host "PASS: No duplicate script tags." -ForegroundColor Green
Write-Host "PASS: R6.1 freeze fix intact." -ForegroundColor Green
Write-Host "PASS: R7-R11.2 dependency markers intact." -ForegroundColor Green
Write-Host "PASS: MUTCD SVG library = 1054." -ForegroundColor Green
Write-Host ""
Write-Host "Static project verification PASSED." -ForegroundColor Green
Write-Host "Windows/Edge behavior still requires the normal runtime acceptance test." -ForegroundColor Yellow
