# Builds the game and zips it with its launcher: SpellcasterAcademy-v<version>.zip in the repo root.
#   powershell -ExecutionPolicy Bypass -File scripts/release/package.ps1
$ErrorActionPreference = 'Stop'
$repo = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $repo
$version = (Get-Content package.json -Raw | ConvertFrom-Json).version
npm run build
if ($LASTEXITCODE -ne 0) { throw 'Build failed' }
$name = "SpellcasterAcademy-v$version"
$stage = Join-Path $env:TEMP $name
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory $stage | Out-Null
Copy-Item dist (Join-Path $stage 'game') -Recurse
Copy-Item (Join-Path $PSScriptRoot 'Play.cmd'), (Join-Path $PSScriptRoot 'serve.ps1') $stage
$zip = Join-Path $repo "$name.zip"
if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path $stage -DestinationPath $zip
Remove-Item $stage -Recurse -Force
Write-Host "Made $zip"
