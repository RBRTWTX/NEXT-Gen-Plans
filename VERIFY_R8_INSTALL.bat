@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans R8 Verification

echo.
echo NXT Gen Plans R8 Verification
echo --------------------------------
echo.

if not exist "%~dp0r8-addon.js" goto :fail
if not exist "%~dp0r8-addon.css" goto :fail
findstr /C:"NXT_R6_1_FIX2_NO_RECURSIVE_OBSERVER" "%~dp0r6-1-integration.js" >nul || goto :fail
findstr /C:"NXT_R7_MANUAL_TCP" "%~dp0r7-addon.js" >nul || goto :fail
findstr /C:"NXT_R8_COMBINED_MANUAL" "%~dp0r8-addon.js" >nul || goto :fail
findstr /C:"r8-addon.js" "%~dp0index.html" >nul || goto :fail
findstr /C:"r8-addon.css" "%~dp0index.html" >nul || goto :fail

echo PASS: R6.1 FIX2 present.
echo PASS: R7 present.
echo PASS: R8 JS/CSS present and linked.
echo.
pause
exit /b 0

:fail
echo FAIL: R8 verification failed.
echo.
pause
exit /b 1
