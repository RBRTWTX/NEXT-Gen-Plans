@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans 0.1 R11.1 Responsive Text

echo.
echo ============================================================
echo  NXT Gen Plans 0.1 R11.1 - Responsive Text / Layout Fix
echo ============================================================
echo.
echo Fixes text/title/note/table layout when objects are resized.
echo.

cscript //nologo //E:JScript "%~dp0INSTALL_R11_1.js"
set "RC=%ERRORLEVEL%"

echo.
if not "%RC%"=="0" (
  echo R11.1 INSTALL FAILED.
  pause
  exit /b %RC%
)

echo ============================================================
echo  R11.1 INSTALL VERIFIED
echo ============================================================
echo.
echo Launch with START_NXT_GEN_PLANS.bat.
echo.
pause
exit /b 0
