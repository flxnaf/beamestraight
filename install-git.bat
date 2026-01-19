@echo off
echo Installing Git for Windows...
echo.

REM Try winget first
winget install --id Git.Git -e --source winget 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Git installed successfully via winget!
    goto :end
)

REM If winget fails, download and install manually
echo Downloading Git installer...
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/git-for-windows/git/releases/latest/download/Git-2.43.0-64-bit.exe' -OutFile '%TEMP%\GitInstaller.exe' -UseBasicParsing"

if exist "%TEMP%\GitInstaller.exe" (
    echo Installing Git...
    "%TEMP%\GitInstaller.exe" /VERYSILENT /NORESTART
    echo Git installation completed!
    echo Please restart your terminal to use Git.
) else (
    echo Failed to download Git installer.
    echo Please install Git manually from https://git-scm.com/download/win
)

:end
pause
