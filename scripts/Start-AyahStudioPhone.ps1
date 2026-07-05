param(
  [string]$DeviceId = "R5CX91G637Z",
  [int]$Port = 4173,
  [string]$HostName = "127.0.0.1"
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$url = "http://${HostName}:${Port}/?v=$(Get-Date -Format yyyyMMddHHmmss)"

function Test-HttpOk {
  param([string]$Target)
  try {
    $response = Invoke-WebRequest -UseBasicParsing $Target -TimeoutSec 3
    return [int]$response.StatusCode -eq 200
  } catch {
    return $false
  }
}

function Start-BackendIfNeeded {
  if (Test-HttpOk "http://${HostName}:${Port}/") {
    return
  }

  Start-Process `
    -FilePath "node" `
    -ArgumentList "scripts\serve-mobile-backend.mjs", "--host", $HostName, "--port", "$Port" `
    -WorkingDirectory $root `
    -WindowStyle Hidden | Out-Null

  $deadline = (Get-Date).AddSeconds(12)
  do {
    Start-Sleep -Milliseconds 500
    if (Test-HttpOk "http://${HostName}:${Port}/") {
      return
    }
  } while ((Get-Date) -lt $deadline)

  throw "Ayah Studio backend did not start on ${HostName}:${Port}."
}

function Assert-Device {
  $devices = (adb devices -l) -join "`n"
  if ($devices -notmatch [regex]::Escape($DeviceId) -or $devices -notmatch "\sdevice(?:\s|$)") {
    throw "Android device $DeviceId is not connected and authorized."
  }
}

Push-Location $root
try {
  Start-BackendIfNeeded
  Assert-Device

  adb -s $DeviceId reverse "tcp:$Port" "tcp:$Port" | Out-Null
  adb -s $DeviceId shell input keyevent KEYCODE_WAKEUP | Out-Null
  adb -s $DeviceId shell am force-stop com.google.android.photopicker | Out-Null
  adb -s $DeviceId shell am force-stop com.android.chrome | Out-Null
  adb -s $DeviceId shell am start -f 0x10008000 -a android.intent.action.VIEW -d $url com.android.chrome | Out-Null

  Start-Sleep -Seconds 2
  $reverse = adb -s $DeviceId reverse --list
  $window = adb -s $DeviceId shell dumpsys window | Select-String -Pattern "mCurrentFocus|mFocusedApp|screenState"

  [pscustomobject]@{
    Url = $url
    Backend = "OK"
    Device = $DeviceId
    Reverse = ($reverse -join "`n")
    Window = ($window -join "`n")
  } | Format-List
} finally {
  Pop-Location
}
