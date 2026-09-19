@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans - Disable R11.3
if not exist "%~dp0index.R11_2.before_R11_3.html" (
 echo ERROR: index.R11_2.before_R11_3.html not found.
 pause
 exit /b 1
)
copy /y "%~dp0index.R11_2.before_R11_3.html" "%~dp0index.html" >nul
if errorlevel 1 exit /b 2
echo PASS: R11.3 disabled. R11.2 remains intact.
pause
exit /b 0
