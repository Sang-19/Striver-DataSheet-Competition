# Striver Arena

Mobile-first DSA progress tracker and head-to-head competition app using Firebase Authentication and Cloud Firestore.

## Features
- Google and Email/Password sign-in.
- Personal dashboard and topic-wise manual completion tracking.
- Firestore-backed progress synchronization.
- Create competitions, share invite codes, join and compare progress.
- Responsive dark UI with lime accents and mobile navigation.

## Vercel deployment
1. Import this repository and select the application branch.
2. Framework Preset: **Vite** (Vercel should detect it automatically).
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. In Project Settings → Environment Variables, add all six `VITE_FIREBASE_*` values from `.env.example` for Production and Preview as needed.
6. Redeploy after changing environment variables.

## Local development
1. Run `npm install`.
2. Copy `.env.example` to `.env.local` and enter the Firebase Web App configuration values.
3. Run `npm run dev`.
4. Build with `npm run build`; preview with `npm run preview`.

## Firebase
Follow [firebase.txt](./firebase.txt), and publish [firestore.rules](./firestore.rules) in Firebase Console.

## Sheet data
`data/striver-sheet.json` contains the category/subtopic structure transcribed from the supplied screenshots. The screenshots supplied counts, not individual problem names; numbered placeholders are used where titles were not provided.

## Security
- Firebase Web API keys and Firebase client config are expected to be present in browser bundles. They are not passwords. Restrict the API key by HTTP referrer in Google Cloud Console and rely on Firebase Auth + Firestore Security Rules for access control.
- Never put service-account JSON, Admin SDK private keys, OAuth client secrets, or other server credentials in Vite variables or frontend code.
- Any variable prefixed with `VITE_` is exposed to the browser at build time.
- The invite-code client flow is an MVP. Move invite creation/joining and trusted score validation to Cloud Functions before a public launch.
