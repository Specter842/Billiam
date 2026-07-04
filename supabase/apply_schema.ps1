# Apply Supabase schema via Management API
# Usage: Run this from the project root after setting SUPABASE_ACCESS_TOKEN env var
# OR pass access token as argument: .\apply_schema.ps1 -AccessToken "your-token"
param(
    [string]$AccessToken = $env:SUPABASE_ACCESS_TOKEN
)

$PROJECT_REF = "zsayoklpkyxqxkjaflca"
$SQL = Get-Content "$PSScriptRoot\schema.sql" -Raw

if (-not $AccessToken) {
    Write-Error "Provide access token via -AccessToken or SUPABASE_ACCESS_TOKEN env var"
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $AccessToken"
    "Content-Type"  = "application/json"
}

$body = @{ query = $SQL } | ConvertTo-Json -Compress

$resp = Invoke-RestMethod `
    -Method POST `
    -Uri "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" `
    -Headers $headers `
    -Body $body `
    -ErrorAction Stop

Write-Output "Schema applied successfully:"
$resp | ConvertTo-Json
