param(
  [string]$ProjectId = "ayah-9b1d5",
  [string]$Region = "us-central1",
  [string]$ServiceName = "ayah-studio-render",
  [int]$MaxInstances = 1,
  [int]$Concurrency = 1,
  [string]$Memory = "2Gi",
  [int]$Cpu = 2,
  [int]$TimeoutSeconds = 900,
  [string]$PrivateAppToken = $env:PRIVATE_APP_TOKEN
)

$ErrorActionPreference = "Stop"

$gcloud = "gcloud"
$installed = "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
if (Test-Path $installed) {
  $gcloud = $installed
}

$image = "gcr.io/$ProjectId/$ServiceName"

if (-not $PrivateAppToken) {
  $bytes = New-Object byte[] 24
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  $rng.GetBytes($bytes)
  $rng.Dispose()
  $PrivateAppToken = [Convert]::ToBase64String($bytes).TrimEnd("=").Replace("+", "-").Replace("/", "_")
  Write-Host "Generated PRIVATE_APP_TOKEN for this deploy:"
  Write-Host $PrivateAppToken
  Write-Host "Save this code. The phone app will ask for it on first render."
}

Write-Host "Using project: $ProjectId"
Write-Host "Using region: $Region"
Write-Host "Deploying service: $ServiceName"
Write-Host "Cost guard: min-instances=0 max-instances=$MaxInstances concurrency=$Concurrency"

& $gcloud config set project $ProjectId
& $gcloud config set run/region $Region

& $gcloud builds submit --tag $image

& $gcloud run deploy $ServiceName `
  --image $image `
  --region $Region `
  --allow-unauthenticated `
  --memory $Memory `
  --cpu $Cpu `
  --timeout $TimeoutSeconds `
  --min-instances 0 `
  --max-instances $MaxInstances `
  --concurrency $Concurrency `
  --set-env-vars NODE_ENV=production,FFMPEG=ffmpeg,FFPROBE=ffprobe,CHROMIUM=chromium,PANGO_VIEW=pango-view,QURAN_TEXT_RENDERER=pango,PRIVATE_APP_TOKEN=$PrivateAppToken
