@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans 0.1 R6 Installer

echo.
echo ============================================================
echo  NXT Gen Plans 0.1 R6 - Editable Roadways
echo ============================================================
echo.
echo Requires the accepted R5 FIX1 baseline.
echo R6 is additive and does NOT modify R3, R4, or R5 source files.
echo.

cscript //nologo //E:JScript "%~dp0INSTALL_R6.js"
set "RC=%ERRORLEVEL%"

echo.
if not "%RC%"=="0" (
  echo R6 INSTALL FAILED.
  pause
  exit /b %RC%
)

echo ============================================================
echo  R6 INSTALL VERIFIED
echo ============================================================
echo.
echo Launch with the EXISTING working START_NXT_GEN_PLANS.bat.
echo.
pause
exit /b 0
