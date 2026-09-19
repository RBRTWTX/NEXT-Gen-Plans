@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans 0.1 R5 Installer
echo.
echo NXT Gen Plans 0.1 R5 - Advanced TCP Design
echo ============================================
echo Accepted R4 baseline is required.
echo This installer does NOT replace app.js, r4-addon.js,
echo START_NXT_GEN_PLANS.bat, standards.js, or MUTCD assets.
echo.
cscript //nologo //E:JScript "%~dp0INSTALL_R5.js"
set "RC=%ERRORLEVEL%"
echo.
if not "%RC%"=="0" (
  echo R5 INSTALL FAILED.
  pause
  exit /b %RC%
)
echo R5 INSTALL VERIFIED.
echo Launch using your existing START_NXT_GEN_PLANS.bat.
echo.
pause
exit /b 0
