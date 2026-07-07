# Firebase Deployment

Ayah Studio online deployment uses two parts:

1. Firebase Hosting for the web UI.
2. Cloud Run for the backend render API and FFmpeg.

The app is not ready for public production until the generated videos are reviewed by a human and the background library is reviewed.

## 1. Create Firebase Project

Create a Firebase project from the Firebase console, then copy its project id.

Create a local `.firebaserc` file from the example:

```powershell
Copy-Item .firebaserc.example .firebaserc
```

Replace `YOUR_FIREBASE_PROJECT_ID` with your real project id.

Do not put secrets in `.firebaserc`.

## 2. Login

```powershell
firebase login
```

Then verify:

```powershell
firebase projects:list
```

## 3. Deploy Cloud Run Backend

Install Google Cloud CLI if `gcloud` is not available.

Build and deploy the backend service:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\deploy-cloud-run.ps1
```

The service id must match `ayah-studio-render` because `firebase.json` rewrites `/api/**` to that Cloud Run service.
`firebase.json` also rewrites `/outputs/**` to Cloud Run so generated MP4 links can be opened from Firebase Hosting.

Default cost guards in the deploy script:

- `--min-instances 0`: no always-on backend instance.
- `--max-instances 1`: only one render worker at a time while testing.
- `--concurrency 1`: one request per instance.
- `--memory 2Gi`, `--cpu 2`, `--timeout 900`: enough for FFmpeg, but still bounded.

These settings keep the first online version conservative. Later, raise `MaxInstances` only after testing cost and demand.

## 4. Deploy Automatic Budget Stop

Budget alerts do not stop spending by themselves. Ayah Studio uses a budget guard function for the 10 USD monthly budget:

- Budget: `Firebase Project ayah-9b1d5`
- Budget amount: `10 USD`
- Pub/Sub topic: `projects/ayah-9b1d5/topics/ayah-budget-guard`
- Function: `ayah-budget-guard`
- Target service: `ayah-studio-render`
- Monthly reset job: `ayah-budget-guard-monthly-reset`

When the budget notification reaches 100%, the function removes public `roles/run.invoker` access from the render service. The web page can still load, but render API calls stop until access is restored. On the first day of every month at `00:05 Asia/Kuwait`, Cloud Scheduler publishes an enable message to restore public access.

Deploy or update the guard:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\deploy-budget-guard.ps1
```

Manual test commands:

```powershell
gcloud pubsub topics publish ayah-budget-guard --project=ayah-9b1d5 --message '{action:disable}'
gcloud run services get-iam-policy ayah-studio-render --region us-central1 --project ayah-9b1d5
gcloud pubsub topics publish ayah-budget-guard --project=ayah-9b1d5 --message '{action:enable}'
```

Important: Google Cloud cost reporting can be delayed. The stop is automatic after Google sends the budget notification, but the final bill can exceed 10 USD slightly.

## 5. Deploy Firebase Hosting And Rules

```powershell
firebase deploy --only hosting,firestore:rules,storage
```

## 6. Checks

Before deploying:

```powershell
npm.cmd test
npm.cmd run proof:online-config
npm.cmd run proof:firebase-ready
```

After deploying, open the Hosting URL and test:

- Page loads on phone.
- Quran text appears correctly.
- Backgrounds load.
- Generate button reaches `/api/render`.
- A generated MP4 can be opened and downloaded.

## Current Limits

- The online backend needs Cloud Run, not Firebase Hosting alone.
- Rendering can cost money because FFmpeg uses CPU and memory.
- Large background and audio assets increase deployment size.
- Firebase Hosting ignores `assets/audio/**` and `assets/background-library/source/**`; the backend image still needs the audio and prepared render assets.
- Billing budgets are not a hard cap by default, but this project now has an automatic budget guard that disables public render access after the 100% budget notification.
- Instagram posting and scheduling are not included in this phase.
