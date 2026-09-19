@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans R4 Add-on Installer
echo.
echo NXT Gen Plans 0.1 R4 - Plan Creation Add-on
echo ---------------------------------------------
echo This installer adds R4 files to the CURRENT R3 repo.
echo It does not replace app.js or the working browser launcher.
echo.
cscript //nologo //E:JScript "%~dp0INSTALL_R4.js"
set "RC=%ERRORLEVEL%"
echo.
if not "%RC%"=="0" (
  echo INSTALL FAILED.
  pause
  exit /b %RC%
)
echo Install verified.
echo Launch NXT Gen Plans using your WORKING START_NXT_GEN_PLANS.bat.
echo.
pause
exit /b 0
