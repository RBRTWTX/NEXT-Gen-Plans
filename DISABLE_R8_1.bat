@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans - Disable R8.1

echo.
if not exist "%~dp0index.R8.before_R8_1.html" (
  echo ERROR: index.R8.before_R8_1.html was not found.
  pause
  exit /b 1
)

copy /y "%~dp0index.R8.before_R8_1.html" "%~dp0index.html" >nul
if errorlevel 1 (
  echo ERROR: Could not restore pre-R8.1 index.html.
  pause
  exit /b 2
)

echo PASS: R8.1 disabled. R8 and earlier releases remain intact.
echo.
pause
exit /b 0
