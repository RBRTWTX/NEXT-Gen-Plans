@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans R6.1 FIX1 Verify

echo.
findstr /C:"NXT_R6_1_FIX1_NO_RECURSIVE_OBSERVER" "%~dp0r6-1-integration.js" >nul || goto :fail
findstr /C:"new MutationObserver" "%~dp0r6-1-integration.js" >nul
if not errorlevel 1 goto :fail

echo PASS: R6.1 FIX1 marker found.
echo PASS: Recursive MutationObserver is gone.
echo.
pause
exit /b 0

:fail
echo FAIL: R6.1 FIX1 verification failed.
echo.
pause
exit /b 1
