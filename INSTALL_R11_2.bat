@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans R11.2 Stabilization

echo.
echo ============================================================
echo  NXT Gen Plans 0.1 R11.2 - Pre-R12 Stabilization
echo ============================================================
echo.
echo Fixes layer recovery and R9 duplicate-group isolation.
echo No feature changes.
echo.

cscript //nologo //E:JScript "%~dp0INSTALL_R11_2.js"
set "RC=%ERRORLEVEL%"

echo.
if not "%RC%"=="0" (
  echo R11.2 INSTALL FAILED.
  pause
  exit /b %RC%
)

echo PASS: R11.2 installed.
echo.
pause
exit /b 0
