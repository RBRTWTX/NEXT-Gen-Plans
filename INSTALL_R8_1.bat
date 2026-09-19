@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans 0.1 R8.1 Universal Canvas

echo.
echo ============================================================
echo  NXT Gen Plans 0.1 R8.1 - Universal Canvas Compatibility
echo ============================================================
echo.
echo This makes R7/R8 workflows usable with or without a roadway.
echo It also repairs page-reference duplication and image opening.
echo.

cscript //nologo //E:JScript "%~dp0INSTALL_R8_1.js"
set "RC=%ERRORLEVEL%"

echo.
if not "%RC%"=="0" (
  echo R8.1 INSTALL FAILED.
  pause
  exit /b %RC%
)

echo ============================================================
echo  R8.1 INSTALL VERIFIED
echo ============================================================
echo.
echo Launch with START_NXT_GEN_PLANS.bat.
echo.
pause
exit /b 0
