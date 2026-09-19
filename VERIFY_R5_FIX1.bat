@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans R5 FIX1 Verify

echo.
echo NXT Gen Plans R5 FIX1 Verification
echo -----------------------------------
echo.

if not exist "%~dp0r5-addon.js" (
  echo FAIL: r5-addon.js is missing.
  pause
  exit /b 1
)

findstr /C:"NXT_R5_ROAD_POINTER_FIX1" "%~dp0r5-addon.js" >nul
if errorlevel 1 (
  echo FAIL: FIX1 marker is missing.
  pause
  exit /b 2
)

findstr /C:"stopImmediatePropagation" "%~dp0r5-addon.js" >nul
if errorlevel 1 (
  echo FAIL: pointer collision repair is missing.
  pause
  exit /b 3
)

echo PASS: R5 FIX1 marker found.
echo PASS: pointerdown collision repair found.
echo.
pause
exit /b 0
