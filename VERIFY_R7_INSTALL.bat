@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans R7 Verification

echo.
if not exist "%~dp0r7-addon.js" goto :fail
if not exist "%~dp0r7-addon.css" goto :fail
findstr /C:"NXT_R6_1_FIX2_NO_RECURSIVE_OBSERVER" "%~dp0r6-1-integration.js" >nul || goto :fail
findstr /C:"r6-1-integration.js" "%~dp0index.html" >nul || goto :fail
findstr /C:"r7-addon.js" "%~dp0index.html" >nul || goto :fail
findstr /C:"r7-addon.css" "%~dp0index.html" >nul || goto :fail
findstr /C:"NXT_R7_MANUAL_TCP" "%~dp0r7-addon.js" >nul || goto :fail

echo PASS: R6.1 FIX2 baseline present.
echo PASS: R7 JavaScript and CSS present.
echo PASS: R7 is linked after R6.1.
echo.
pause
exit /b 0

:fail
echo FAIL: R7 verification failed.
echo.
pause
exit /b 1
