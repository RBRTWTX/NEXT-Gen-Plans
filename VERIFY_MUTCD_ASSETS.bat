@echo off
setlocal EnableExtensions
cd /d "%~dp0"
set "TARGET=%~dp0assets\Signs SVGs\mutcd-svg-main"

echo NXT Gen Plans - MUTCD Asset Check
echo.
if not exist "%TARGET%\index.json" (
  echo FAIL: index.json is missing.
  echo Expected: %TARGET%\index.json
  echo.
  pause
  exit /b 1
)
if not exist "%TARGET%\svg" (
  echo FAIL: SVG folder is missing.
  echo Expected: %TARGET%\svg
  echo.
  pause
  exit /b 1
)
for /f %%A in ('dir /b /a-d "%TARGET%\svg\*.svg" 2^>nul ^| find /c /v ""') do set "COUNT=%%A"
if not defined COUNT set "COUNT=0"
echo index.json: FOUND
echo SVG files: %COUNT%
if "%COUNT%"=="1054" (
  echo PASS: Complete 1,054-file MUTCD SVG library is present.
  echo.
  pause
  exit /b 0
)
echo FAIL: Expected exactly 1054 SVG files.
echo.
pause
exit /b 2
