param(
  [int]$Port = 4173,
  [string]$HostName = "127.0.0.1"
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$out = Join-Path $root "server-compose.out.log"
$err = Join-Path $root "server-compose.err.log"
$ProbeHost = if ($HostName -eq "0.0.0.0") { "127.0.0.1" } else { $HostName }

$existing = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($existing) {
  Stop-Process -Id $existing.OwningProcess -Force
  Start-Sleep -Seconds 1
}

$command = "Set-Location '$root'; node scripts\serve-mobile-backend.mjs --host $HostName --port $Port *> '$out'"
Start-Process `
  -FilePath powershell.exe `
  -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $command `
  -WorkingDirectory $root `
  -WindowStyle Hidden | Out-Null

$deadline = (Get-Date).AddSeconds(10)
do {
  Start-Sleep -Milliseconds 500
  try {
    $response = Invoke-WebRequest -UseBasicParsing "http://${ProbeHost}:${Port}/" -TimeoutSec 2
    if ([int]$response.StatusCode -eq 200) {
      [pscustomobject]@{
        Url = "http://${ProbeHost}:${Port}/"
        Backend = "OK"
        Log = $out
      } | Format-List
      exit 0
    }
  } catch {
  }
} while ((Get-Date) -lt $deadline)

if (Test-Path $out) {
  Get-Content -Raw $out
}
throw "Ayah Studio generator backend did not start on ${HostName}:${Port}."
