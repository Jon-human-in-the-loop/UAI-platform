$ErrorActionPreference = "Stop"
$CurrentAgentPath = Join-Path $PSScriptRoot ".agent"
$GlobalBasePath = Join-Path $HOME ".antigravity"

function Backup-Assets {
    Write-Host "Starting Global Brain Backup..."
    if (-not (Test-Path $GlobalBasePath)) { New-Item -ItemType Directory -Force -Path $GlobalBasePath }

    $dirs = @("skills", "agents")
    foreach ($dir in $dirs) {
        $src = Join-Path $CurrentAgentPath $dir
        $dst = Join-Path $GlobalBasePath $dir
        if (Test-Path $src) {
            Write-Host "Backing up $dir..."
            if (-not (Test-Path $dst)) { New-Item -ItemType Directory -Force -Path $dst }
            Copy-Item -Path "$src\*" -Destination $dst -Recurse -Force
        }
    }
    Write-Host "Backup Complete at $GlobalBasePath"
}

function Install-Assets {
    param ([string]$TargetDir)
    Write-Host "Injecting Global Brain into $TargetDir..."
    $targetAgent = Join-Path $TargetDir ".agent"
    if (-not (Test-Path $targetAgent)) { New-Item -ItemType Directory -Force -Path $targetAgent }

    $dirs = @("skills", "agents")
    foreach ($dir in $dirs) {
        $src = Join-Path $GlobalBasePath $dir
        $dst = Join-Path $targetAgent $dir
        if (Test-Path $src) {
            Write-Host "Injecting $dir..."
            if (-not (Test-Path $dst)) { New-Item -ItemType Directory -Force -Path $dst }
            Copy-Item -Path "$src\*" -Destination $dst -Recurse -Force
        }
    }
    Write-Host "Injection Complete."
}

Backup-Assets
