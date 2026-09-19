@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans R8.1 Verify

echo.
echo R8.1 Universal Canvas Verification
echo -----------------------------------
echo.

if not exist "%~dp0r8-1-compat.js" goto :fail
if not exist "%~dp0r8-1-compat.css" goto :fail
findstr /C:"NXT_R6_1_FIX2_NO_RECURSIVE_OBSERVER" "%~dp0r6-1-integration.js" >nul || goto :fail
findstr /C:"NXT_R7_MANUAL_TCP" "%~dp0r7-addon.js" >nul || goto :fail
findstr /C:"NXT_R8_COMBINED_MANUAL" "%~dp0r8-addon.js" >nul || goto :fail
findstr /C:"NXT_R8_1_UNIVERSAL_CANVAS" "%~dp0r8-1-compat.js" >nul || goto :fail
findstr /C:"r8-1-compat.js" "%~dp0index.html" >nul || goto :fail

echo PASS: R6.1 FIX2 present.
echo PASS: R7 present.
echo PASS: R8 present.
echo PASS: R8.1 Universal Canvas present and linked.
echo.
pause
exit /b 0

:fail
echo FAIL: R8.1 verification failed.
echo.
pause
exit /b 1
