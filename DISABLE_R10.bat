@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans - Disable R10

echo.
if not exist "%~dp0index.R9.before_R10.html" (
  echo ERROR: index.R9.before_R10.html was not found.
  pause
  exit /b 1
)

copy /y "%~dp0index.R9.before_R10.html" "%~dp0index.html" >nul
if errorlevel 1 (
  echo ERROR: Could not restore pre-R10 index.html.
  pause
  exit /b 2
)

echo PASS: R10 disabled. R9 and earlier releases remain intact.
echo.
pause
exit /b 0
