@echo off
echo ========================================
echo   Installing Python 3.11
echo ========================================
echo.

echo Downloading Python installer...
powershell -Command "Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.7/python-3.11.7-amd64.exe' -OutFile '%TEMP%\python-installer.exe'"

if %ERRORLEVEL% NEQ 0 (
    echo Failed to download installer!
    pause
    exit /b 1
)

echo.
echo Installing Python (this will take 1-2 minutes)...
echo.

"%TEMP%\python-installer.exe" /quiet PrependPath=1 Include_pip=1

echo.
echo Installation complete!
echo.
echo Please:
echo 1. Close this window
echo 2. Close PowerShell/CMD completely
echo 3. Open a NEW terminal
echo 4. Test: python --version
echo.
echo Then run: setup_training.bat
echo.

del "%TEMP%\python-installer.exe"
pause
