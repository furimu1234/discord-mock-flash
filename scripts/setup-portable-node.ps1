# scripts/setup-portable-node.ps1
# 本プロジェクト専用の Node.js ポータブル版 (v20 LTS) & corepack & pnpm のセットアップスクリプト

$ErrorActionPreference = "Stop"

$ProjectRoot = (Resolve-Path "$PSScriptRoot\..").Path
$ToolsDir = Join-Path $ProjectRoot ".tools"
$NodeZipUrl = "https://nodejs.org/dist/v20.18.0/node-v20.18.0-win-x64.zip"
$ZipFile = Join-Path $ToolsDir "node.zip"
$ExtractTarget = Join-Path $ToolsDir "node-temp"
$FinalNodeDir = Join-Path $ToolsDir "node"

Write-Host "=== Setting up Project-Local Portable Node.js ===" -ForegroundColor Cyan

if (-not (Test-Path $ToolsDir)) {
    New-Item -ItemType Directory -Path $ToolsDir -Force | Out-Null
}

if (-not (Test-Path $FinalNodeDir)) {
    Write-Host "Downloading Node.js v20.18.0 (Portable)..." -ForegroundColor Yellow
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $NodeZipUrl -OutFile $ZipFile -UseBasicParsing

    Write-Host "Extracting Node.js..." -ForegroundColor Yellow
    if (Test-Path $ExtractTarget) { Remove-Item -Recurse -Force $ExtractTarget }
    Expand-Archive -Path $ZipFile -DestinationPath $ExtractTarget -Force

    $ExtractedFolder = Get-ChildItem -Path $ExtractTarget -Directory | Select-Object -First 1
    Move-Item -Path $ExtractedFolder.FullName -Destination $FinalNodeDir
    Remove-Item -Recurse -Force $ExtractTarget
    Remove-Item -Force $ZipFile
    Write-Host "Node.js successfully installed to $FinalNodeDir" -ForegroundColor Green
} else {
    Write-Host "Portable Node.js is already installed at $FinalNodeDir" -ForegroundColor Green
}

# 一時的に PATH に追加して corepack を実行
$env:Path = "$FinalNodeDir;" + $env:Path

Write-Host "Enabling corepack & pnpm..." -ForegroundColor Yellow
& "$FinalNodeDir\corepack.cmd" enable
& "$FinalNodeDir\corepack.cmd" prepare pnpm@9.12.0 --activate

Write-Host "=== Setup Complete! ===" -ForegroundColor Green
Write-Host "You can now run:" -ForegroundColor Cyan
Write-Host "  . .\activate.ps1      (Activates node/pnpm in the current PowerShell)" -ForegroundColor White
Write-Host "  .\node.cmd -v         (Or run directly via project-local wrappers)" -ForegroundColor White
Write-Host "  .\pnpm.cmd -v" -ForegroundColor White
