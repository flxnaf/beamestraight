@echo off
chcp 65001 >nul
echo ========================================
echo   Move Beame Project to Local Drive
echo ========================================
echo.

echo Current location: %CD%
echo.
echo Moving to: C:\beamestraight
echo.

REM Create destination folder
if not exist "C:\beamestraight" (
    mkdir "C:\beamestraight"
)

echo Copying files (this may take a minute)...
xcopy "%~dp0*" "C:\beamestraight\" /E /I /H /Y /EXCLUDE:%~dp0move_to_local.bat

if %ERRORLEVEL% NEQ 0 (
    echo Failed to copy files!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Move Complete!
echo ========================================
echo.
echo Your project is now at: C:\beamestraight
echo.
echo Next steps:
echo 1. Close this window
echo 2. Open PowerShell or CMD
echo 3. Run: cd C:\beamestraight
echo 4. Run: .\install_python.bat
echo 5. Then: .\setup_training.bat
echo.
pause

REM Open the new location
explorer C:\beamestraight
