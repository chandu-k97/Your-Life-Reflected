# Your Life, Reflected

> *"We don't write your story; we help you see it."*

**Your Life, Reflected** is a user-authenticated, privacy-first reflective journaling web application. Unlike conversational AI tools that rewrite, autocomplete, or generate text on the user's behalf, this application protects the user's raw, unedited voice. It silently classifies emotional nuances, thematic motifs, sentiment, and recurring entities, and visually reflects them back to the user as a personalized storyboard panel and weekly narrative arc.

---

## Architecture Overview

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **User Identity** | Firebase Authentication | Google Sign-In with federated credentials (zero password handling). |
| **Database** | Google Cloud Firestore | Owner-bound personal documents (`users/{userId}`, `entries`, `weeklyRecaps`). |
| **AI Extraction & Synthesis** | Gemini 3.6 Flash (with automated fallback ladder) | Constrained schema extraction (emotions/themes/entities) & weekly arc synthesis. |
| **Visual Composition** | Vector SVG Composition | Dynamic compositing of avatar, posture, background motif, and ambient color tint. |
| **Deployment Runtime** | Google Cloud Run | Containerized full-stack Express + React/Vite service. |
| **Secrets & Security** | Google Cloud Secret Manager | Dynamic API key injection with least-privilege IAM bindings. |

---

## 1. Environment & Prerequisites

1. **Google Cloud SDK (`gcloud` CLI)** installed and authorized:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```
2. **Enable Required Google Cloud Services**:
   ```bash
   gcloud services enable \
     run.googleapis.com \
     secretmanager.googleapis.com \
     firestore.googleapis.com \
     artifactregistry.googleapis.com \
     cloudbuild.googleapis.com
   ```
3. **Node.js**: Node 20+ with npm or bun installed locally.

---

## 2. Secret Management & Zero-Hardcoding Hygiene

To keep operational secrets strictly separated from client-side bundles and source control, configure Secret Manager:

```bash
# Create secret for Gemini API
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# Inject API key securely without saving to shell history
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant Cloud Run runtime service account permission to access the secret
export PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 3. Database Security Configuration (Cloud Firestore)

Deploy the following strict, owner-isolated security rules to ensure no user can read, query, or mutate another user's journal entries, recaps, or profiles:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /entries/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /weeklyRecaps/{weekId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

Deploy rules using Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 4. Google Cloud Run Deployment Flow

Build and deploy the container directly to Cloud Run:

```bash
# 1. Build and deploy container
gcloud run deploy your-life-reflected \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --port 3000

# 2. Apply Mandatory Campaign Labeling for Challenge Verification
gcloud run services update your-life-reflected \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 5. Security & Threat Modeling Standards

1. **Indirect Prompt Injection Defense (OWASP LLM01)**:
   Raw user journal entries are delimited and explicitly classified with instructions that forbid treating user writing as system commands or overriding classification tasks.
2. **Constrained Schema & Enum Whitelisting (OWASP LLM05)**:
   Extraction outputs are validated against strict enums:
   - `dominantEmotion`: `joyful | calm | grateful | stressed | sad | angry | neutral` (fallback to `neutral`)
   - `themes`: `work | relationships | family | health | social | hobbies | finances | personal_growth | other` (fallback to `other`)
   - `sentimentScore`: clamped to `[-1.0, 1.0]`
3. **Decoupled Save/Analysis Lifecycle**:
   Saving raw text to Firestore is an independent transaction that completes and confirms to the user first. Gemini extraction runs asynchronously. If extraction encounters transient API issues, the saved entry remains untouched and a non-blocking retry button is provided.
4. **Resilient Model Fallback Ladder**:
   Calls sequentially fall back: `gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`.

---

## 6. Functional Verification & Test Walkthroughs

| Test Case ID | Feature Surface | Step-by-Step User Walkthrough | Expected Outcome |
| :--- | :--- | :--- | :--- |
| **TC-01** | Landing & Google Auth | 1. Navigate to root `/`<br>2. Click "Sign In with Google"<br>3. Complete federated OAuth popup | User authenticates without entering passwords into app form; redirection takes user to dashboard or onboarding. |
| **TC-02** | One-Time Avatar Setup | 1. On initial login, review avatar modal<br>2. Select skin tone, hair style, hair color, and outfit<br>3. Click "Save & Continue" | Configuration persists to `/users/{userId}.avatarConfig`; modal dismisses and dashboard opens. |
| **TC-03** | Free-Form Journaling | 1. Navigate to Write tab<br>2. Type personal reflection<br>3. Click "Save Entry" | Raw text writes to Firestore immediately with green confirmation banner; input buffer clears only after confirmed write. |
| **TC-04** | Instant Reflection Panel | 1. Observe dashboard after saving entry in TC-03 | Loading indicator displays while asynchronous classification executes; visual storyboard panel renders avatar in emotional pose with themed background and sentiment tint. |
| **TC-05** | Fallback & Retry Behavior | 1. Simulate network disconnect during analysis<br>2. Observe entry status | Entry remains saved in history; non-blocking "Generate reflection" button displays without losing raw text. |
| **TC-06** | Storyboard Gallery | 1. Click "Past Storyboards" tab<br>2. Scroll through past entries | Chronological list of saved reflections with complete panels and expandable full text. |
| **TC-07** | Weekly Arc Synthesis | 1. Click "Weekly Arc" tab<br>2. Click "Generate Weekly Arc Caption" | Single Gemini call evaluates structured metadata (not raw text) and outputs a poetic one-line narrative caption alongside the week's storyboard panels. |
| **TC-08** | Calendar & Backdating | 1. Navigate to "Write" tab<br>2. Pick a past date from the calendar input<br>3. Submit journal entry | Entry is saved with distinct `entryDate` preserving system audit timestamp `createdAt`; backdated entry lands in that past week's Weekly Arc. |
| **TC-09** | Entry Edit & Stale Reflection | 1. In "Past Storyboards", click "Edit" on an entry<br>2. Modify entry text and click "Save Changes"<br>3. Inspect panel | Text updates in Firestore; panel is marked with `isStale: true` and an amber banner appears without silent re-analysis; tapping "Refresh reflection" re-analyzes and clears the stale badge. |
| **TC-10** | Entry Deletion | 1. Click "Delete" on an entry in "Past Storyboards"<br>2. Review confirmation prompt<br>3. Click "Yes, Delete Reflection" | Entry is permanently removed from Firestore; entry vanishes from UI and triggers change notice on any affected weekly recap. |
| **TC-11** | Weekly Recap Staleness Banner | 1. View a week in "Weekly Arc" that already has a generated narrative<br>2. Add or edit an entry belonging to that week<br>3. Return to "Weekly Arc" | Non-blocking banner displays: *"This week changed — tap to refresh recap."*; recap is NOT auto-regenerated until user taps "Refresh Recap". |
| **TC-12** | Avatar Setup Dismissal | 1. Open avatar modal (on first login or via settings)<br>2. Modify selection and click "Cancel" or "X" | Modal closes without writing to Firestore; unconfigured user remains in "setup incomplete" state and is prompted again next session. |
