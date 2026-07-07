param(
  [string]$ProjectId = "ayah-9b1d5",
  [string]$Region = "us-central1",
  [string]$FunctionName = "ayah-budget-guard",
  [string]$TopicName = "ayah-budget-guard",
  [string]$SchedulerName = "ayah-budget-guard-monthly-reset",
  [string]$BillingAccount = "012BDD-E7508B-B40E69"
)

$ErrorActionPreference = "Stop"

$gcloud = "gcloud"
$installed = "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
if (Test-Path $installed) { $gcloud = $installed }

$serviceAccountName = "budget-guard-sa"
$serviceAccountEmail = "$serviceAccountName@$ProjectId.iam.gserviceaccount.com"
$topic = "projects/$ProjectId/topics/$TopicName"
$resetMessage = '{"action":"enable"}'

Write-Host "Using project: $ProjectId"
Write-Host "Deploying budget guard function: $FunctionName"
Write-Host "Budget notification topic: $topic"

& $gcloud config set project $ProjectId

& $gcloud services enable `
  cloudfunctions.googleapis.com `
  pubsub.googleapis.com `
  eventarc.googleapis.com `
  cloudscheduler.googleapis.com `
  run.googleapis.com `
  cloudbuild.googleapis.com `
  artifactregistry.googleapis.com `
  billingbudgets.googleapis.com

$existingServiceAccount = & $gcloud iam service-accounts list --filter "email=$serviceAccountEmail" --format "value(email)"
if (-not $existingServiceAccount) {
  & $gcloud iam service-accounts create $serviceAccountName --display-name "Ayah Studio budget guard"
}

& $gcloud projects add-iam-policy-binding $ProjectId `
  --member "serviceAccount:$serviceAccountEmail" `
  --role "roles/run.admin"

$existingTopic = & $gcloud pubsub topics list --filter "name=$topic" --format "value(name)"
if (-not $existingTopic) {
  & $gcloud pubsub topics create $TopicName
}

& $gcloud functions deploy $FunctionName `
  --gen2 `
  --runtime nodejs22 `
  --region $Region `
  --source budget-guard `
  --entry-point budgetGuard `
  --trigger-topic $TopicName `
  --service-account $serviceAccountEmail `
  --set-env-vars "TARGET_PROJECT_ID=$ProjectId,TARGET_REGION=$Region,TARGET_SERVICE=ayah-studio-render"

$existingJob = & $gcloud scheduler jobs list --location $Region --filter "name:$SchedulerName" --format "value(name)"
if (-not $existingJob) {
  & $gcloud scheduler jobs create pubsub $SchedulerName `
    --location $Region `
    --schedule "5 0 1 * *" `
    --time-zone "Asia/Kuwait" `
    --topic $TopicName `
    --message-body $resetMessage
} else {
  & $gcloud scheduler jobs update pubsub $SchedulerName `
    --location $Region `
    --schedule "5 0 1 * *" `
    --time-zone "Asia/Kuwait" `
    --topic $TopicName `
    --message-body $resetMessage
}

Write-Host ""
Write-Host "Next step: connect the existing budget notification to this Pub/Sub topic:"
Write-Host "  $topic"
Write-Host ""
Write-Host "If you want to do it with gcloud, first get the budget id, then run:"
Write-Host "  gcloud billing budgets update BUDGET_ID --billing-account=$BillingAccount --notifications-rule-pubsub-topic=$topic"
