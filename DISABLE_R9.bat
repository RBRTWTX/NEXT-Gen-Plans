@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans - Disable R9

echo.
if not exist "%~dp0index.R8_1.before_R9.html" (
  echo ERROR: index.R8_1.before_R9.html was not found.
  pause
  exit /b 1
)

copy /y "%~dp0index.R8_1.before_R9.html" "%~dp0index.html" >nul
if errorlevel 1 (
  echo ERROR: Could not restore the pre-R9 index.html.
  pause
  exit /b 2
)

echo PASS: R9 disabled. R8.1 and earlier releases remain intact.
echo.
pause
exit /b 0
