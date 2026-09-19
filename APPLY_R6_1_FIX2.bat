@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans R6.1 FIX2

echo.
echo ============================================================
echo  NXT Gen Plans R6.1 FIX2 - TCP+ Freeze Repair
echo ============================================================
echo.
echo Structural patch - no exact whitespace match required.
echo It modifies ONLY r6-1-integration.js.
echo.

cscript //nologo //E:JScript "%~dp0APPLY_R6_1_FIX2.js"
set "RC=%ERRORLEVEL%"

echo.
if not "%RC%"=="0" (
  echo FIX2 FAILED.
  echo No R3/R4/R5/R6 source files were changed.
  pause
  exit /b %RC%
)

echo ============================================================
echo  R6.1 FIX2 VERIFIED
echo ============================================================
echo.
echo Completely close the current NXT Gen Plans browser window.
echo Relaunch with START_NXT_GEN_PLANS.bat.
echo Then test TCP+ first.
echo.
pause
exit /b 0
