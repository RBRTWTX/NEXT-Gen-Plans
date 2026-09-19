@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans - Disable R8

echo.
if not exist "%~dp0index.R7.before_R8.html" (
  echo ERROR: index.R7.before_R8.html was not found.
  pause
  exit /b 1
)

copy /y "%~dp0index.R7.before_R8.html" "%~dp0index.html" >nul
if errorlevel 1 (
  echo ERROR: Could not restore pre-R8 index.html.
  pause
  exit /b 2
)

echo PASS: R8 disabled. R7 and earlier releases remain intact.
echo.
pause
exit /b 0
