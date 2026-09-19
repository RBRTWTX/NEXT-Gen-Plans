@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans R10 Verification

echo.
echo NXT Gen Plans R10 Verification
echo ------------------------------
echo.

if not exist "%~dp0r10-addon.js" goto :fail
if not exist "%~dp0r10-addon.css" goto :fail
findstr /C:"NXT_R6_1_FIX2_NO_RECURSIVE_OBSERVER" "%~dp0r6-1-integration.js" >nul || goto :fail
findstr /C:"NXT_R8_1_UNIVERSAL_CANVAS" "%~dp0r8-1-compat.js" >nul || goto :fail
findstr /C:"NXT_R9_MANUAL_GEOMETRY" "%~dp0r9-addon.js" >nul || goto :fail
findstr /C:"NXT_R10_LOCAL_LIBRARY" "%~dp0r10-addon.js" >nul || goto :fail
findstr /C:"r10-addon.js" "%~dp0index.html" >nul || goto :fail
findstr /C:"r10-addon.css" "%~dp0index.html" >nul || goto :fail

echo PASS: R8.1 Universal Canvas present.
echo PASS: R9 Manual Geometry present.
echo PASS: R10 Local Library linked.
echo.
pause
exit /b 0

:fail
echo FAIL: R10 verification failed.
echo.
pause
exit /b 1
