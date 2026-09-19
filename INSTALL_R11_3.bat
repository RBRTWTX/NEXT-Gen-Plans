@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans 0.1 R11.3 Base Plan Stack
echo.
echo ============================================================
echo  NXT Gen Plans 0.1 R11.3 - Base Plan Drawing Stack
echo ============================================================
echo.
echo Keeps PDF/PNG/roadway infrastructure underneath TCP and
echo normal markups. Existing road editing remains available.
echo.
cscript //nologo //E:JScript "%~dp0INSTALL_R11_3.js"
set "RC=%ERRORLEVEL%"
echo.
if not "%RC%"=="0" (
  echo R11.3 INSTALL FAILED.
  pause
  exit /b %RC%
)
echo PASS: R11.3 installed.
echo.
pause
exit /b 0
