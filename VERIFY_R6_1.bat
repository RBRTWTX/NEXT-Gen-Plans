@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans R6.1 Verification

echo.
echo NXT Gen Plans R6.1 Verification
echo --------------------------------
echo.

if not exist "%~dp0r6-1-integration.js" goto :fail
if not exist "%~dp0r6-1-integration.css" goto :fail
findstr /C:"NXT_R5_ROAD_POINTER_FIX1" "%~dp0r5-addon.js" >nul || goto :fail
findstr /C:"r6-addon.js" "%~dp0index.html" >nul || goto :fail
findstr /C:"r6-1-integration.js" "%~dp0index.html" >nul || goto :fail
findstr /C:"r6-1-integration.css" "%~dp0index.html" >nul || goto :fail

echo PASS: R5 FIX1 is present.
echo PASS: R6 is present.
echo PASS: R6.1 integration JS/CSS are linked.
echo PASS: R6.1 files exist.
echo.
pause
exit /b 0

:fail
echo FAIL: R6.1 integration is incomplete.
echo.
pause
exit /b 1
