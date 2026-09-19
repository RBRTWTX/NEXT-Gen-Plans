@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans R6.1 FIX2 Verify

echo.
if not exist "%~dp0r6-1-integration.js" goto :fail
findstr /C:"NXT_R6_1_FIX2_NO_RECURSIVE_OBSERVER" "%~dp0r6-1-integration.js" >nul || goto :fail
findstr /C:"NXT_R6_1_FIX2_DIRECT_HOOKS" "%~dp0r6-1-integration.js" >nul || goto :fail
findstr /C:"observer.observe(document.body" "%~dp0r6-1-integration.js" >nul
if not errorlevel 1 goto :fail

echo PASS: FIX2 marker found.
echo PASS: Direct TCP+/Road+ hooks found.
echo PASS: Body-wide observer is absent.
echo.
pause
exit /b 0

:fail
echo FAIL: R6.1 FIX2 verification failed.
echo.
pause
exit /b 1
