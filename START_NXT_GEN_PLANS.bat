@echo off
setlocal
cd /d "%~dp0"
set "APP=%~dp0index.html"
set "APPURL=file:///%APP:\=/%"

rem Prefer an installed Chromium browser in app mode: no tabs/address bar, no install/admin required.
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
  start "NXT Gen Plans" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="%APPURL%" --start-maximized
  exit /b 0
)
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
  start "NXT Gen Plans" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app="%APPURL%" --start-maximized
  exit /b 0
)
if exist "%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe" (
  start "NXT Gen Plans" "%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe" --app="%APPURL%" --start-maximized
  exit /b 0
)
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
  start "NXT Gen Plans" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="%APPURL%" --start-maximized
  exit /b 0
)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
  start "NXT Gen Plans" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app="%APPURL%" --start-maximized
  exit /b 0
)

rem Fallback: use the normal Windows default handler for local HTML.
start "NXT Gen Plans" "%APP%"
exit /b 0
