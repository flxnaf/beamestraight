# Install Git for Windows
Write-Host "Downloading Git installer..."
$installerPath = "$env:TEMP\GitInstaller.exe"
$downloadUrl = "https://github.com/git-for-windows/git/releases/latest/download/Git-2.43.0-64-bit.exe"

try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath -UseBasicParsing
    Write-Host "Installing Git..."
    Start-Process -FilePath $installerPath -ArgumentList "/VERYSILENT /NORESTART" -Wait
    Write-Host "Git installation completed!"
    
    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    # Verify installation
    Start-Sleep -Seconds 2
    $gitPath = (Get-Command git -ErrorAction SilentlyContinue).Source
    if ($gitPath) {
        Write-Host "Git successfully installed at: $gitPath"
        git --version
    } else {
        Write-Host "Git installed. Please restart your terminal to use it."
    }
} catch {
    Write-Host "Error: $_"
    Write-Host "Please install Git manually from https://git-scm.com/download/win"
}
