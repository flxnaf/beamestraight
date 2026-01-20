@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ========================================
echo   Beame Teeth Training Setup
echo ========================================
echo.

REM Check if Python is installed
echo [Step 1/5] Checking Python installation...
echo.

where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✓ Python found!
    python --version
    echo.
    goto :CheckPip
)

REM Try common Python locations
set PYTHON_PATHS=^
"C:\Python311\python.exe" ^
"C:\Python310\python.exe" ^
"C:\Program Files\Python311\python.exe" ^
"C:\Program Files\Python310\python.exe" ^
"%LOCALAPPDATA%\Programs\Python\Python311\python.exe" ^
"%LOCALAPPDATA%\Programs\Python\Python310\python.exe"

for %%p in (%PYTHON_PATHS%) do (
    if exist %%p (
        echo ✓ Found Python at %%p
        %%p --version
        echo.
        set PYTHON=%%p
        goto :CheckPip
    )
)

REM Python not found
echo ✗ Python NOT found!
echo.
echo Please install Python 3.10 or 3.11:
echo.
echo 1. Download from: https://www.python.org/downloads/
echo 2. During installation, CHECK these boxes:
echo    ✓ Add Python to PATH
echo    ✓ Install pip
echo.
echo 3. After installation, restart this script
echo.
pause
exit /b 1

:CheckPip
echo [Step 2/5] Checking pip...
if not defined PYTHON set PYTHON=python

%PYTHON% -m pip --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ✗ pip not found!
    echo Installing pip...
    %PYTHON% -m ensurepip --upgrade
)
echo ✓ pip is ready
echo.

echo [Step 3/5] Installing Python dependencies...
echo This may take 2-3 minutes...
echo.

%PYTHON% -m pip install --upgrade pip >nul 2>&1
%PYTHON% -m pip install opencv-python numpy pyyaml --quiet

if %ERRORLEVEL% NEQ 0 (
    echo ✗ Failed to install dependencies
    echo.
    echo Try manually:
    echo   pip install opencv-python numpy pyyaml
    echo.
    pause
    exit /b 1
)

echo ✓ Dependencies installed
echo.

echo [Step 4/5] Converting Label Studio data to YOLO OBB format...
echo.

if not exist "scripts\convert_labelstudio_to_yolo_obb.py" (
    echo ✗ Conversion script not found!
    echo Expected: scripts\convert_labelstudio_to_yolo_obb.py
    pause
    exit /b 1
)

%PYTHON% scripts\convert_labelstudio_to_yolo_obb.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ✗ Conversion failed!
    echo.
    echo Please check:
    echo 1. Do you have zip files in "Training Data" folder?
    echo 2. Are they Label Studio exports?
    echo.
    echo Run the inspector to check:
    echo   powershell -ExecutionPolicy Bypass -File scripts\inspect_training_data.ps1
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Conversion Complete!
echo ========================================
echo.

REM Check if dataset was created
if not exist "datasets\teeth-obb\data.yaml" (
    echo ✗ Dataset not created!
    echo.
    echo The conversion script ran but no dataset was generated.
    echo This usually means:
    echo 1. No images found in the zip files
    echo 2. Label Studio format not recognized
    echo.
    echo Please share the output above and I can help fix it.
    echo.
    pause
    exit /b 1
)

echo [Step 5/5] Ready to train!
echo.
echo Your dataset is ready at: datasets\teeth-obb\
echo.
echo ========================================
echo   Next Steps
echo ========================================
echo.
echo Option 1: Train now (takes 45-60 minutes)
echo   python train_teeth_obb.py
echo.
echo Option 2: Quick test (10 epochs, 5-10 minutes)
echo   python train_teeth_obb.py --epochs 10 --batch 4
echo.
echo Press any key to start full training, or close to train later...
pause

echo.
echo ========================================
echo   Starting Training...
echo ========================================
echo.

%PYTHON% train_teeth_obb.py

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   Training Complete! ✓
    echo ========================================
    echo.
    echo Model saved to: public\models\teeth-detection-obb.onnx
    echo.
    echo Next: Test in browser
    echo   npm run dev
    echo.
) else (
    echo.
    echo ✗ Training failed!
    echo.
    echo Check the error message above.
    echo Common issues:
    echo 1. CUDA not available - Install CUDA 11.8
    echo 2. Out of memory - Use: python train_teeth_obb.py --batch 4
    echo.
)

pause
