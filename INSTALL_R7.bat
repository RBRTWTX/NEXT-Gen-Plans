@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans 0.1 R7 Installer

echo.
echo ============================================================
echo  NXT Gen Plans 0.1 R7 - Manual Road-Attached TCP
echo ============================================================
echo.
echo R7 is manual. It does not auto-generate TCP layouts.
echo It is additive to the accepted R6.1 FIX2 baseline.
echo.

cscript //nologo //E:JScript "%~dp0INSTALL_R7.js"
set "RC=%ERRORLEVEL%"

echo.
if not "%RC%"=="0" (
  echo R7 INSTALL FAILED.
  pause
  exit /b %RC%
)

echo ============================================================
echo  R7 INSTALL VERIFIED
echo ============================================================
echo.
echo Launch with your existing START_NXT_GEN_PLANS.bat.
echo.
pause
exit /b 0
