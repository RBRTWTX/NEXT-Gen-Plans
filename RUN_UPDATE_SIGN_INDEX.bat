@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo.
echo NXT Gen Plans - Update Sign Index
echo ---------------------------------
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0UPDATE_SIGN_INDEX.ps1" -RepoRoot "%~dp0"
set "RC=%ERRORLEVEL%"

echo.
if not "%RC%"=="0" (
  echo SIGN INDEX UPDATE FAILED.
  pause
  exit /b %RC%
)

echo PASS: Sign index updated.
echo.
pause
exit /b 0
