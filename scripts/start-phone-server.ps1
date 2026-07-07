param(
  [int]$Port = 4175,
  [string]$HostName = "127.0.0.1",
  [string]$JobsFile = "outputs\render-jobs-phone.json"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

& "C:\Program Files\nodejs\node.exe" "scripts\serve-mobile-backend.mjs" --host $HostName --port $Port --jobs-file $JobsFile
