# Striver Arena

A mobile-first DSA progress tracker and head-to-head competition app powered by Firebase Authentication and Cloud Firestore.

## Features
- Google and Email/Password sign-in.
- Personal dashboard with completion totals and progress.
- Topic-wise task checklist; users manually mark tasks complete or undo completion.
- Firestore-backed progress per authenticated user.
- Create a competition and share an invite code; join a competition with a code.
- Compare members' completed task counts and progress.
- Responsive dark UI with lime accents and mobile bottom navigation.

## Run locally
1. Configure Firebase in `env.js` using the guide in [firebase.txt](./firebase.txt).
2. Start a static server: `python3 -m http.server 8000`.
3. Open http://localhost:8000.

No build step is required. Firebase compat SDK is loaded from Google's CDN.

## Firebase setup
Follow [firebase.txt](./firebase.txt), then publish [firestore.rules](./firestore.rules) in the Firebase Console.

## Sheet data
The current `data/striver-sheet.json` is a clearly labelled starter catalogue. The complete Striver A2Z / selected sheet dataset and its exact item count have not yet been supplied in this repository. Replace the starter JSON with the verified catalogue before announcing the full sheet as available. Each task needs a stable `id`, `title`, optional `url`, and optional `difficulty`.

## Notes
- `env.js` contains public Firebase web configuration only. Do not put secrets or service-account keys in it.
- The included invite-code client flow is an MVP. For production competition integrity, implement invite creation/joining and score validation using Cloud Functions.
- Firestore rules intentionally protect each user's own progress.
