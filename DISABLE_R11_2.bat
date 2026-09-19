@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans - Disable R11.2

if not exist "%~dp0index.R11_1.before_R11_2.html" (
  echo ERROR: index.R11_1.before_R11_2.html not found.
  pause
  exit /b 1
)

copy /y "%~dp0index.R11_1.before_R11_2.html" "%~dp0index.html" >nul
if errorlevel 1 (
  echo ERROR: Could not restore pre-R11.2 index.
  pause
  exit /b 2
)

echo PASS: R11.2 disabled. R11.1 remains intact.
pause
exit /b 0
