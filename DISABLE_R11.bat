@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans - Disable R11

echo.
if not exist "%~dp0index.R10.before_R11.html" (
  echo ERROR: index.R10.before_R11.html was not found.
  pause
  exit /b 1
)

copy /y "%~dp0index.R10.before_R11.html" "%~dp0index.html" >nul
if errorlevel 1 (
  echo ERROR: Could not restore pre-R11 index.html.
  pause
  exit /b 2
)

echo PASS: R11 disabled. R10 and earlier releases remain intact.
echo.
pause
exit /b 0
