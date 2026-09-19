@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans 0.1 R6.1 Installer

echo.
echo ============================================================
echo  NXT Gen Plans 0.1 R6.1 - TCP+ / Layer Integration
echo ============================================================
echo.
echo Baseline: current pushed R6.
echo This installer is additive and does NOT replace R3/R4/R5/R6.
echo.

cscript //nologo //E:JScript "%~dp0INSTALL_R6_1.js"
set "RC=%ERRORLEVEL%"

echo.
if not "%RC%"=="0" (
  echo R6.1 INSTALL FAILED.
  pause
  exit /b %RC%
)

echo ============================================================
echo  R6.1 INSTALL VERIFIED
echo ============================================================
echo.
echo Launch with your existing START_NXT_GEN_PLANS.bat.
echo.
pause
exit /b 0
