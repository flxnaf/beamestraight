# Python Installation Guide for Beame Training

## Quick Install

### Option 1: Download Python Installer (Recommended)

1. **Download Python 3.11:**
   - Go to: https://www.python.org/downloads/
   - Click the big yellow "Download Python 3.11.x" button
   - Or direct link: https://www.python.org/ftp/python/3.11.7/python-3.11.7-amd64.exe

2. **Run the installer:**
   - ⚠️ **IMPORTANT:** Check both boxes at the bottom:
     - ✅ **Add python.exe to PATH**
     - ✅ **Install pip**
   - Click "Install Now"
   - Wait for installation to complete
   - Click "Close"

3. **Verify installation:**
   - Open a NEW Command Prompt or PowerShell
   - Type: `python --version`
   - Should show: `Python 3.11.x`

### Option 2: Microsoft Store (Easy)

1. Open Microsoft Store
2. Search for "Python 3.11"
3. Click "Get" or "Install"
4. Wait for installation
5. Open a new terminal and type: `python --version`

### Option 3: Winget (Command Line)

Open PowerShell and run:
```powershell
winget install Python.Python.3.11
```

---

## After Python is Installed

1. **Close and reopen your terminal** (important!)

2. **Run the setup script:**
   ```cmd
   cd "c:\Users\mrfel\OneDrive\ドキュメント\beamestraight"
   setup_training.bat
   ```

3. The script will:
   - ✅ Find your Python installation
   - ✅ Install dependencies (OpenCV, NumPy, etc.)
   - ✅ Convert your training data
   - ✅ Train the model

---

## Troubleshooting

### "Python not found" after installation

**Cause:** Terminal hasn't refreshed PATH

**Solution:**
1. Close ALL terminal windows
2. Open a NEW terminal
3. Try again: `python --version`

### "python is not recognized as an internal or external command"

**Cause:** Python not added to PATH during installation

**Solution 1 - Add to PATH manually:**
1. Search Windows for "Environment Variables"
2. Click "Environment Variables" button
3. Under "System variables", find "Path"
4. Click "Edit"
5. Click "New"
6. Add: `C:\Users\mrfel\AppData\Local\Programs\Python\Python311`
7. Add: `C:\Users\mrfel\AppData\Local\Programs\Python\Python311\Scripts`
8. Click OK on all dialogs
9. Restart terminal

**Solution 2 - Reinstall Python:**
1. Uninstall Python from Settings > Apps
2. Download installer again
3. This time, CHECK "Add Python to PATH" at the bottom
4. Install

### Can't find Python.exe location

**Find it with this command:**
```powershell
Get-Command python | Select-Object -ExpandProperty Source
```

Or search for `python.exe` in:
- `C:\Python311\`
- `C:\Program Files\Python311\`
- `%LOCALAPPDATA%\Programs\Python\Python311\`

---

## Quick Test After Installation

```powershell
# Test Python
python --version

# Test pip
python -m pip --version

# Test installing a package
python -m pip install numpy

# If all work, you're ready!
```

---

## Next Steps

Once Python is installed and working:

1. Run: `setup_training.bat`
2. Or manually:
   ```powershell
   pip install opencv-python numpy pyyaml
   python scripts/convert_labelstudio_to_yolo_obb.py
   python train_teeth_obb.py
   ```
