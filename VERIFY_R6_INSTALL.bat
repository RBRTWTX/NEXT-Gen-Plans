@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans R6 Verify
echo.
echo NXT Gen Plans R6 - Verification
echo --------------------------------
echo.

if not exist "%~dp0r6-addon.js" goto :fail
if not exist "%~dp0r6-addon.css" goto :fail
findstr /C:"NXT_R5_ROAD_POINTER_FIX1" "%~dp0r5-addon.js" >nul || goto :fail
findstr /C:"r4-addon.js" "%~dp0index.html" >nul || goto :fail
findstr /C:"r5-addon.js" "%~dp0index.html" >nul || goto :fail
findstr /C:"r6-addon.js" "%~dp0index.html" >nul || goto :fail
findstr /C:"r6-addon.css" "%~dp0index.html" >nul || goto :fail

echo PASS: Accepted R5 FIX1 is still present.
echo PASS: R6 JS/CSS files exist.
echo PASS: index.html references R4, R5 and R6.
echo PASS: No R3/R4/R5 source replacement is required.
echo.
pause
exit /b 0

:fail
echo FAIL: R6 installation is incomplete or the R5 FIX1 baseline is missing.
echo.
pause
exit /b 1
