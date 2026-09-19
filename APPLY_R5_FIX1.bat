@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans R5 FIX1

echo.
echo ============================================================
echo  NXT Gen Plans R5 FIX1 - TCP+ Roadway Repair
echo ============================================================
echo.
echo This repairs the R5 multi-segment roadway event collision.
echo It does NOT modify app.js, r4-addon.js, index.html,
echo START_NXT_GEN_PLANS.bat, or MUTCD assets.
echo.

cscript //nologo //E:JScript "%~dp0APPLY_R5_FIX1.js"
set "RC=%ERRORLEVEL%"

echo.
if not "%RC%"=="0" (
  echo R5 FIX1 FAILED.
  pause
  exit /b %RC%
)

echo R5 FIX1 VERIFIED.
echo.
echo Launch using your existing START_NXT_GEN_PLANS.bat.
echo Then open TCP+ and test Draw Multi-Segment Road.
echo.
pause
exit /b 0
