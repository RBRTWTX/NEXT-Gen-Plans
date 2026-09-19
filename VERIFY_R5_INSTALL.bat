@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans R5 Verify
echo.
findstr /C:"r4-addon.js" "%~dp0index.html" >nul || goto :fail
findstr /C:"r5-addon.js" "%~dp0index.html" >nul || goto :fail
findstr /C:"r5-addon.css" "%~dp0index.html" >nul || goto :fail
if not exist "%~dp0r5-addon.js" goto :fail
if not exist "%~dp0r5-addon.css" goto :fail
echo PASS: R4 and R5 references are present.
echo PASS: R5 add-on files are present.
echo.
pause
exit /b 0
:fail
echo FAIL: R5 installation is incomplete.
echo.
pause
exit /b 1
