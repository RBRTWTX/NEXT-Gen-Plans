@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans - Disable R11.1

echo.
if not exist "%~dp0index.R11.before_R11_1.html" (
  echo ERROR: index.R11.before_R11_1.html was not found.
  pause
  exit /b 1
)

copy /y "%~dp0index.R11.before_R11_1.html" "%~dp0index.html" >nul
if errorlevel 1 (
  echo ERROR: Could not restore pre-R11.1 index.html.
  pause
  exit /b 2
)

echo PASS: R11.1 disabled. R11 and earlier releases remain intact.
echo.
pause
exit /b 0
