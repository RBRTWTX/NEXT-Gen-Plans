@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans R6.1 FIX1

echo.
echo ============================================================
echo  NXT Gen Plans R6.1 FIX1 - TCP+ Freeze Repair
echo ============================================================
echo.
echo This removes the recursive DOM observer that freezes TCP+.
echo It modifies ONLY r6-1-integration.js.
echo.

cscript //nologo //E:JScript "%~dp0APPLY_R6_1_FIX1.js"
set "RC=%ERRORLEVEL%"

echo.
if not "%RC%"=="0" (
  echo FIX FAILED.
  pause
  exit /b %RC%
)

echo ============================================================
echo  R6.1 FIX1 VERIFIED
echo ============================================================
echo.
echo Close the frozen browser window completely.
echo Then launch again using START_NXT_GEN_PLANS.bat.
echo.
pause
exit /b 0
