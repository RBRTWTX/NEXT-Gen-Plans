@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans 0.1 R10 Installer

echo.
echo ============================================================
echo  NXT Gen Plans 0.1 R10 - Local Libraries / Scratchpad
echo ============================================================
echo.
echo Offline folders, reusable assemblies, symbols, styles,
echo and JSON library backup/import.
echo No cloud, maps, or automatic TCP design.
echo.

cscript //nologo //E:JScript "%~dp0INSTALL_R10.js"
set "RC=%ERRORLEVEL%"

echo.
if not "%RC%"=="0" (
  echo R10 INSTALL FAILED.
  pause
  exit /b %RC%
)

echo ============================================================
echo  R10 INSTALL VERIFIED
echo ============================================================
echo.
echo Launch with START_NXT_GEN_PLANS.bat.
echo.
pause
exit /b 0
