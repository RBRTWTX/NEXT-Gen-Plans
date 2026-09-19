@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans R4 - UTF-8 Safe Installer

echo.
echo ============================================================
echo  NXT Gen Plans 0.1 R4 - UTF-8 SAFE INSTALLER
echo ============================================================
echo.
echo This installer:
echo   - keeps the working R3 app.js untouched
echo   - keeps your working START_NXT_GEN_PLANS.bat untouched
echo   - adds only r4-addon.css and r4-addon.js references
echo   - preserves UTF-8 encoding
echo   - verifies index.html after installation
echo.

if not exist "%~dp0INSTALL_R4_FIXED.js" (
  echo ERROR: INSTALL_R4_FIXED.js is missing.
  echo.
  pause
  exit /b 10
)

cscript //nologo //E:JScript "%~dp0INSTALL_R4_FIXED.js"
set "RC=%ERRORLEVEL%"

echo.
if not "%RC%"=="0" (
  echo ============================================================
  echo  R4 INSTALL FAILED - index.html should remain unchanged.
  echo ============================================================
  echo.
  pause
  exit /b %RC%
)

echo ============================================================
echo  R4 INSTALL VERIFIED
echo ============================================================
echo.
echo Now launch NXT Gen Plans with your EXISTING working:
echo   START_NXT_GEN_PLANS.bat
echo.
pause
exit /b 0
