#requires -Version 5.1
<#
 Sync only original employer images to GitHub main through a disposable worktree.
 No local reset, pull, or unrelated file staging.
 Run: powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Sync-ExperienceLogos.ps1
#>
[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$source = Join-Path $repo 'src\assets\portfolio\experience'
$names = @('Exo.webp', 'LubricantesVilllars.webp', 'SolarisPKN.webp')
$git = Get-Command git -ErrorAction Stop
function Invoke-Git {
    param([string]$WorkingDirectory, [string[]]$Arguments)
    $output = & $git.Source -C $WorkingDirectory @Arguments 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw ('git ' + ($Arguments -join ' ') + ' failed: ' + [Environment]::NewLine + ($output -join [Environment]::NewLine))
    }
    return $output
}
$root = (Invoke-Git $repo @('rev-parse','--show-toplevel') | Select-Object -First 1).Trim()
if ([IO.Path]::GetFullPath($root).TrimEnd('\') -ine [IO.Path]::GetFullPath($repo).TrimEnd('\')) {
    throw 'Unexpected Git repository root. Nothing changed.'
}
$origin = (Invoke-Git $repo @('remote','get-url','origin') | Select-Object -First 1).Trim()
if ($origin -notmatch '^(https://github\.com/SolarisPKN/SolarisPKN-Labs(\.git)?|git@github\.com:SolarisPKN/SolarisPKN-Labs(\.git)?)$') {
    throw ('Unexpected origin remote: ' + $origin + '. Aborted without publishing.')
}
foreach ($name in $names) {
    $file = Join-Path $source $name
    if (!(Test-Path -LiteralPath $file -PathType Leaf)) { throw ('Missing image: ' + $file) }
    if ((Get-Item -LiteralPath $file).Length -eq 0) { throw ('Empty image: ' + $file) }
}
Write-Host 'Valid original images: EXO, Lubricantes Villars, SolarisPKN.' -ForegroundColor Cyan
$env:GIT_TERMINAL_PROMPT = '0'
$env:GCM_INTERACTIVE = 'Never'
Invoke-Git $repo @('fetch','--no-tags','origin','main') | Out-Null
$tempRoot = Join-Path $env:TEMP ('SolarisPKN-Labs-logos-' + [guid]::NewGuid().ToString('N'))
$worktreeCreated = $false
$published = $false
try {
    Invoke-Git $repo @('worktree','add','--detach',$tempRoot,'origin/main') | Out-Null
    $worktreeCreated = $true
    $destination = Join-Path $tempRoot 'src\assets\portfolio\experience'
    New-Item -ItemType Directory -Path $destination -Force | Out-Null
    foreach ($name in $names) {
        Copy-Item -LiteralPath (Join-Path $source $name) -Destination (Join-Path $destination $name)
        $before = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $source $name)).Hash
        $after = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $destination $name)).Hash
        if ($before -ne $after) { throw 'File copy integrity failure: ' + $name }
    }
    $paths = @('src/assets/portfolio/experience/Exo.webp',
               'src/assets/portfolio/experience/LubricantesVilllars.webp',
               'src/assets/portfolio/experience/SolarisPKN.webp')
    Invoke-Git $tempRoot (@('add','--') + $paths) | Out-Null
    & $git.Source -C $tempRoot diff --cached --quiet
    if ($LASTEXITCODE -eq 0) {
        Write-Host 'Images already present in origin/main.' -ForegroundColor Green
        $published = $true
    } elseif ($LASTEXITCODE -eq 1) {
        Invoke-Git $tempRoot @('commit','-m','assets(portfolio): add original employer logos') | Out-Null
        Invoke-Git $tempRoot @('push','origin','HEAD:refs/heads/main') | Out-Null
        $published = $true
        Write-Host 'Images published to origin/main.' -ForegroundColor Green
    } else {
        throw 'Could not determine staged changes.'
    }
} finally {
    if ($worktreeCreated -and $published) {
        Invoke-Git $repo @('worktree','remove','--force',$tempRoot) | Out-Null
    } elseif ($worktreeCreated) {
        Write-Warning ('Publication failed; temporary worktree retained at ' + $tempRoot)
    }
}
