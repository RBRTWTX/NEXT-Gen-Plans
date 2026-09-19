@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans R11 Verification

echo.
echo NXT Gen Plans R11 Verification
echo ------------------------------
echo.

if not exist "%~dp0r11-addon.js" goto :fail
if not exist "%~dp0r11-addon.css" goto :fail
findstr /C:"NXT_R6_1_FIX2_NO_RECURSIVE_OBSERVER" "%~dp0r6-1-integration.js" >nul || goto :fail
findstr /C:"NXT_R8_1_UNIVERSAL_CANVAS" "%~dp0r8-1-compat.js" >nul || goto :fail
findstr /C:"NXT_R9_MANUAL_GEOMETRY" "%~dp0r9-addon.js" >nul || goto :fail
findstr /C:"NXT_R10_LOCAL_LIBRARY" "%~dp0r10-addon.js" >nul || goto :fail
findstr /C:"NXT_R11_PLAN_DOCUMENTATION" "%~dp0r11-addon.js" >nul || goto :fail
findstr /C:"r11-addon.js" "%~dp0index.html" >nul || goto :fail
findstr /C:"r11-addon.css" "%~dp0index.html" >nul || goto :fail

echo PASS: R8.1 present.
echo PASS: R9 present.
echo PASS: R10 present.
echo PASS: R11 linked.
echo.
pause
exit /b 0

:fail
echo FAIL: R11 verification failed.
echo.
pause
exit /b 1
