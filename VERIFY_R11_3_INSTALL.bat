@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans R11.3 Verification
echo.
if not exist "%~dp0r11-3-base-plan-stack.js" goto :fail
if not exist "%~dp0r11-3-base-plan-stack.css" goto :fail
findstr /C:"NXT_R11_2_STABILIZATION" "%~dp0r11-2-stabilization.js" >nul || goto :fail
findstr /C:"NXT_R11_3_BASE_PLAN_STACK" "%~dp0r11-3-base-plan-stack.js" >nul || goto :fail
findstr /C:"r11-3-base-plan-stack.js" "%~dp0index.html" >nul || goto :fail
echo PASS: R11.3 Base Plan stack present and linked.
pause
exit /b 0
:fail
echo FAIL: R11.3 verification failed.
pause
exit /b 1
