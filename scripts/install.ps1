# Nuntly CLI installer for Windows
#
# Usage:
#   irm https://nuntly.com/install.ps1 | iex
#   $env:NUNTLY_VERSION = 'v1.2.3'; irm https://nuntly.com/install.ps1 | iex
#
# Environment overrides:
#   NUNTLY_INSTALL_DIR  install directory (default: %USERPROFILE%\.nuntly)
#   NUNTLY_VERSION      version to install (default: latest)

#Requires -Version 5.0

$ErrorActionPreference = 'Stop'

$GitHubRepo = if ($env:NUNTLY_GITHUB_REPO) { $env:NUNTLY_GITHUB_REPO } else { 'nuntly/nuntly-cli' }
$InstallDir = if ($env:NUNTLY_INSTALL_DIR) { $env:NUNTLY_INSTALL_DIR } else { "$env:USERPROFILE\.nuntly" }
$BinDir = Join-Path $InstallDir 'bin'
$Version = if ($env:NUNTLY_VERSION) { $env:NUNTLY_VERSION } else { 'latest' }

function Write-Info  { param($Message) Write-Host "info: $Message" -ForegroundColor Green }
function Write-Warn  { param($Message) Write-Host "warn: $Message" -ForegroundColor Yellow }
function Stop-WithError {
    param($Message)
    Write-Host "error: $Message" -ForegroundColor Red
    exit 1
}

function Get-Platform {
    $arch = if ([Environment]::Is64BitOperatingSystem) {
        if ((Get-CimInstance Win32_Processor).Architecture -eq 12) { 'arm64' } else { 'x64' }
    } else {
        Stop-WithError "Nuntly CLI requires a 64-bit Windows."
    }
    return "windows-$arch"
}

function Get-DownloadUrl {
    param($Platform)
    $file = "nuntly-$Platform.exe"
    if ($Version -eq 'latest') {
        return "https://github.com/$GitHubRepo/releases/latest/download/$file"
    }
    return "https://github.com/$GitHubRepo/releases/download/$Version/$file"
}

function Test-Checksum {
    param($File, $ExpectedUrl)
    $expected = (Invoke-WebRequest -Uri $ExpectedUrl -UseBasicParsing).Content.Split()[0].Trim()
    $actual = (Get-FileHash -Path $File -Algorithm SHA256).Hash.ToLower()
    if ($expected -ne $actual) {
        Stop-WithError "checksum mismatch (expected $expected, got $actual)"
    }
}

function Add-PathToUserEnv {
    param($Path)
    $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    $entries = if ($userPath) { $userPath.Split(';') } else { @() }
    if ($entries -notcontains $Path) {
        $newPath = if ($userPath) { "$userPath;$Path" } else { $Path }
        [Environment]::SetEnvironmentVariable('Path', $newPath, 'User')
        Write-Info "added $Path to your user PATH (open a new terminal to take effect)"
    }
}

$platform = Get-Platform
$url = Get-DownloadUrl -Platform $platform
$checksumUrl = "$url.sha256"

Write-Info "downloading nuntly for $platform (version: $Version)"

if (-not (Test-Path $BinDir)) {
    New-Item -ItemType Directory -Path $BinDir -Force | Out-Null
}

$exe = Join-Path $BinDir 'nuntly.exe'
$tmp = "$exe.download"

try {
    Invoke-WebRequest -Uri $url -OutFile $tmp -UseBasicParsing
} catch {
    Stop-WithError "download failed: $url"
}

Test-Checksum -File $tmp -ExpectedUrl $checksumUrl
Move-Item -Path $tmp -Destination $exe -Force

Write-Info "installed to $exe"
Add-PathToUserEnv -Path $BinDir

try { & $exe --version } catch { }

Write-Host ""
Write-Host "Nuntly CLI installed." -ForegroundColor Green
Write-Host "Next steps:"
Write-Host "  nuntly login           # authenticate"
Write-Host "  nuntly emails list     # send your first email"
Write-Host "  Documentation: https://nuntly.com/docs/cli"
