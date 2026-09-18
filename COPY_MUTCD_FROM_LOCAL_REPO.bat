@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "TARGET=%~dp0assets\Signs SVGs\mutcd-svg-main"

rem If the real library is already bundled/copied, do nothing.
if exist "%TARGET%\index.json" if exist "%TARGET%\svg\D01-01.svg" exit /b 0

rem Best-effort LOCAL copy only. Failure never blocks NXT Gen Plans startup.
call :trycopy "%~dp0..\assets\Signs SVGs\mutcd-svg-main"
if exist "%TARGET%\index.json" if exist "%TARGET%\svg\D01-01.svg" exit /b 0

call :trycopy "%~dp0..\..\assets\Signs SVGs\mutcd-svg-main"
if exist "%TARGET%\index.json" if exist "%TARGET%\svg\D01-01.svg" exit /b 0

call :trycopy "C:\Projects\NEXT-Gen-Plans\assets\Signs SVGs\mutcd-svg-main"
if exist "%TARGET%\index.json" if exist "%TARGET%\svg\D01-01.svg" exit /b 0

call :trycopy "C:\Projects\NXT-Gen-Plans\assets\Signs SVGs\mutcd-svg-main"
if exist "%TARGET%\index.json" if exist "%TARGET%\svg\D01-01.svg" exit /b 0

call :trycopy "%USERPROFILE%\Documents\GitHub\NEXT-Gen-Plans\assets\Signs SVGs\mutcd-svg-main"
if exist "%TARGET%\index.json" if exist "%TARGET%\svg\D01-01.svg" exit /b 0

call :trycopy "%USERPROFILE%\Documents\GitHub\NXT-Gen-Plans\assets\Signs SVGs\mutcd-svg-main"
if exist "%TARGET%\index.json" if exist "%TARGET%\svg\D01-01.svg" exit /b 0

call :trycopy "%USERPROFILE%\source\repos\NEXT-Gen-Plans\assets\Signs SVGs\mutcd-svg-main"
exit /b 0

:trycopy
if not exist "%~1\index.json" goto :eof
if not exist "%~1\svg\D01-01.svg" goto :eof
if not exist "%TARGET%" mkdir "%TARGET%" >nul 2>&1
if not exist "%TARGET%\svg" mkdir "%TARGET%\svg" >nul 2>&1
copy /y "%~1\index.json" "%TARGET%\index.json" >nul 2>&1
xcopy "%~1\svg\*.svg" "%TARGET%\svg\" /Y /Q >nul 2>&1
goto :eof
