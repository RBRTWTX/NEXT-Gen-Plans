@echo off
setlocal EnableExtensions
cd /d "%~dp0"

title NXT Gen Plans R3

rem Best-effort local MUTCD asset copy. This NEVER blocks startup.
if exist "%~dp0COPY_MUTCD_FROM_LOCAL_REPO.bat" call "%~dp0COPY_MUTCD_FROM_LOCAL_REPO.bat" >nul 2>&1

set "APP=%~dp0index.html"
set "APPURL=file:///%APP:\=/%"

if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
  start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --allow-file-access-from-files --app="%APPURL%" --start-maximized
  exit /b 0
)
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
  start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --allow-file-access-from-files --app="%APPURL%" --start-maximized
  exit /b 0
)
if exist "%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe" (
  start "" "%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe" --allow-file-access-from-files --app="%APPURL%" --start-maximized
  exit /b 0
)
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
  start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --allow-file-access-from-files --app="%APPURL%" --start-maximized
  exit /b 0
)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
  start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --allow-file-access-from-files --app="%APPURL%" --start-maximized
  exit /b 0
)

rem Final fallback: open index.html with the Windows default browser.
start "" "%APP%"
exit /b 0
