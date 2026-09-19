@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans R11.1 Verification

echo.
echo NXT Gen Plans R11.1 Verification
echo --------------------------------
echo.

if not exist "%~dp0r11-1-responsive-text.js" goto :fail
if not exist "%~dp0r11-1-responsive-text.css" goto :fail
findstr /C:"NXT_R11_PLAN_DOCUMENTATION" "%~dp0r11-addon.js" >nul || goto :fail
findstr /C:"NXT_R11_1_RESPONSIVE_TEXT" "%~dp0r11-1-responsive-text.js" >nul || goto :fail
findstr /C:"r11-1-responsive-text.js" "%~dp0index.html" >nul || goto :fail
findstr /C:"r11-1-responsive-text.css" "%~dp0index.html" >nul || goto :fail

echo PASS: R11 present.
echo PASS: R11.1 Responsive Text present and linked.
echo.
pause
exit /b 0

:fail
echo FAIL: R11.1 verification failed.
echo.
pause
exit /b 1
