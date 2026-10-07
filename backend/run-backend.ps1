$ErrorActionPreference = 'Stop'

$rootEnvFile = Join-Path $PSScriptRoot '..\.env'
if (Test-Path $rootEnvFile) {
    Get-Content $rootEnvFile | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith('#') -or -not $line.Contains('=')) {
            return
        }

        $key, $value = $line.Split('=', 2)
        if ($key -and -not [Environment]::GetEnvironmentVariable($key)) {
            [Environment]::SetEnvironmentVariable($key, $value, 'Process')
        }
    }
}

if (-not $env:DB_URL) { $env:DB_URL = 'jdbc:postgresql://localhost:5432/gym_duong_double' }
if (-not $env:DB_USERNAME) { $env:DB_USERNAME = 'postgres' }
if (-not $env:DB_PASSWORD) { throw 'Set DB_PASSWORD before running backend/run-backend.ps1' }
if (-not $env:JWT_SECRET) { throw 'Set JWT_SECRET before running backend/run-backend.ps1' }

if (-not $env:JWT_ACCESS_TOKEN_MINUTES) { $env:JWT_ACCESS_TOKEN_MINUTES = '120' }
if (-not $env:OWNER_USERNAME) { $env:OWNER_USERNAME = 'owner' }
if (-not $env:OWNER_EMAIL) { $env:OWNER_EMAIL = 'owner@gymduongdouble.local' }
if (-not $env:OWNER_PASSWORD) { throw 'Set OWNER_PASSWORD before running backend/run-backend.ps1' }
if (-not $env:OWNER_FULL_NAME) { $env:OWNER_FULL_NAME = 'Owner Gym Duong Double' }
if (-not $env:OWNER_PHONE) { $env:OWNER_PHONE = '0965193907' }

Write-Host "Starting Gym Duong Double Spring Boot Backend..." -ForegroundColor Cyan
& .\mvnw.cmd spring-boot:run
