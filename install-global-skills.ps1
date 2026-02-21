<#
.SYNOPSIS
    Backups and installs the Antigravity Global Brain (Skills + Agents) to a central repository.
    Ensures that critical engineering skills and specialized agent personas are reusable across projects.

.DESCRIPTION
    This script performs two main actions:
    1. BACKUP: Copies all skills and agents from the current project (.agent/) to a central location ($HOME/.antigravity/).
    2. INSTALL: Injects these global assets into a target project directory.

.EXAMPLE
    .\install-global-skills.ps1 -Action Backup
    .\install-global-skills.ps1 -Action Install -Target "C:\MyNewProject"
#>

param (
    [Parameter(Mandatory = $true)]
    [ValidateSet("Backup", "Install")]
    [string]$Action,

    [Parameter(Mandatory = $false)]
    [string]$Target = "."
)

$ErrorActionPreference = "Stop"
$CurrentAgentPath = Join-Path $PSScriptRoot ".agent"
$GlobalBasePath = Join-Path $HOME ".antigravity"

Function Backup-Assets {
    Write-Host "🧠 [BACKUP] Starting Global Brain Backup..." -ForegroundColor Cyan

    if (-not (Test-Path $GlobalBasePath)) {
        New-Item -ItemType Directory -Force -Path $GlobalBasePath | Out-Null
        Write-Host "Created global storage at $GlobalBasePath" -ForegroundColor Gray
    }

    # Backup Skills
    $CurrentSkillsPath = Join-Path $CurrentAgentPath "skills"
    $GlobalSkillsPath = Join-Path $GlobalBasePath "skills"
    
    if (Test-Path $CurrentSkillsPath) {
        Write-Host "📦 Backing up Skills..." -ForegroundColor Yellow
        if (-not (Test-Path $GlobalSkillsPath)) { New-Item -ItemType Directory -Force -Path $GlobalSkillsPath | Out-Null }
        
        $Skills = Get-ChildItem -Path $CurrentSkillsPath -Directory
        foreach ($skillDir in $Skills) {
            Write-Host "  Copying skill: $($skillDir.Name)..." -NoNewline
            Copy-Item -Path $skillDir.FullName -Destination $GlobalSkillsPath -Recurse -Force
            Write-Host " DONE" -ForegroundColor Green
        }
    }

    # Backup Agents
    $CurrentAgentsPath = Join-Path $CurrentAgentPath "agents"
    $GlobalAgentsPath = Join-Path $GlobalBasePath "agents"

    if (Test-Path $CurrentAgentsPath) {
        Write-Host "🤖 Backing up Agents..." -ForegroundColor Yellow
        if (-not (Test-Path $GlobalAgentsPath)) { New-Item -ItemType Directory -Force -Path $GlobalAgentsPath | Out-Null }
        
        $Agents = Get-ChildItem -Path $CurrentAgentsPath -File -Filter "*.md"
        foreach ($agentFile in $Agents) {
            Write-Host "  Copying agent: $($agentFile.Name)..." -NoNewline
            Copy-Item -Path $agentFile.FullName -Destination $GlobalAgentsPath -Force
            Write-Host " DONE" -ForegroundColor Green
        }
    }

    Write-Host "✅ Backup Complete. Global Brain stored at $GlobalBasePath" -ForegroundColor Green
}

Function Install-Assets {
    param ([string]$TargetDir)
    
    Write-Host "💉 [INSTALL] Injecting Global Brain into $TargetDir..." -ForegroundColor Cyan

    $TargetAgentDir = Join-Path $TargetDir ".agent"
    if (-not (Test-Path $TargetAgentDir)) { New-Item -ItemType Directory -Force -Path $TargetAgentDir | Out-Null }

    # Install Skills
    $GlobalSkillsPath = Join-Path $GlobalBasePath "skills"
    $TargetSkillsDir = Join-Path $TargetAgentDir "skills"

    if (Test-Path $GlobalSkillsPath) {
        Write-Host "📦 Injecting Skills..." -ForegroundColor Yellow
        if (-not (Test-Path $TargetSkillsDir)) { New-Item -ItemType Directory -Force -Path $TargetSkillsDir | Out-Null }
        
        $Skills = Get-ChildItem -Path $GlobalSkillsPath -Directory
        foreach ($skillDir in $Skills) {
            Write-Host "  Injecting skill: $($skillDir.Name)..." -NoNewline
            Copy-Item -Path $skillDir.FullName -Destination $TargetSkillsDir -Recurse -Force
            Write-Host " DONE" -ForegroundColor Green
        }
    }

    # Install Agents
    $GlobalAgentsPath = Join-Path $GlobalBasePath "agents"
    $TargetAgentsDir = Join-Path $TargetAgentDir "agents"

    if (Test-Path $GlobalAgentsPath) {
        Write-Host "🤖 Injecting Agents..." -ForegroundColor Yellow
        if (-not (Test-Path $TargetAgentsDir)) { New-Item -ItemType Directory -Force -Path $TargetAgentsDir | Out-Null }
        
        $Agents = Get-ChildItem -Path $GlobalAgentsPath -File -Filter "*.md"
        foreach ($agentFile in $Agents) {
            Write-Host "  Injecting agent: $($agentFile.Name)..." -NoNewline
            Copy-Item -Path $agentFile.FullName -Destination $TargetAgentsDir -Force
            Write-Host " DONE" -ForegroundColor Green
        }
    }

    Write-Host "✅ Injection Complete. Project is now fully intelligent." -ForegroundColor Green
}

# Main Execution Flow
try {
    if ($Action -eq "Backup") {
        Backup-Assets
    }
    elseif ($Action -eq "Install") {
        Install-Assets -TargetDir $Target
    }
}
catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}
