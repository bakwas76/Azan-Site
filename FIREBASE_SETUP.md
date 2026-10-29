# Admin panel setup (you do this ONCE, about 20 minutes)

How it works
- The footballer opens  **https://YOUR-SITE/admin**  (nobody sees a link to it on the website),
  types an **email + password**, and uploads photos / videos / matches / trophies.
- Login + data = **your** Firebase account (free Spark plan).
- Photo and video files = **Cloudinary** (free account, no card). Firebase Storage needs a billing card
  on new projects, so we do not use it.
- You never give him your Google account: you just create an email + password for him.

---------------------------------------------------------------------------
## Part A: Firebase (login + data)

1. https://console.firebase.google.com -> **Add project** -> name it `azan` -> turn Google Analytics OFF -> Create.
2. Left menu **Build -> Authentication -> Get started -> Email/Password -> Enable -> Save**.
3. Same page, tab **Users -> Add user** -> write the footballer's **email** and a **password** -> Add.
   (Give him this email + password. Use a password only he knows. Write the email down: you need it in step 5.)
4. Left menu **Build -> Firestore Database -> Create database** -> location: any (e.g. `asia-south1` or `eur3`) ->
   **Start in production mode** -> Create.
5. In Firestore open the **Rules** tab. Delete everything and paste the content of
   `firebase-setup/firestore.rules` from this project. In it, replace
   `PUT-ADMIN-EMAIL-HERE@example.com` with the footballer's email (exactly the one from step 3, small letters).
   Press **Publish**.
   (This rule is what keeps strangers out: only that email can change anything.)
6. Click the gear icon (top-left) -> **Project settings** -> scroll to **Your apps** -> click the **`</>` (Web)**
   icon -> app nickname `azan-web` -> Register app. You will see a block called `firebaseConfig`.
   Copy `apiKey`, `authDomain`, `projectId`, `appId` into **src/firebase/config.js**:
   ```js
   export const firebaseConfig = {
     apiKey: "AIza....",
     authDomain: "azan-xxxx.firebaseapp.com",
     projectId: "azan-xxxx",
     appId: "1:123...:web:abc...",
   };
   ```

## Part B: Cloudinary (photo + video files)

1. https://cloudinary.com -> **Sign up for free**.
2. On the dashboard copy your **Cloud name** (example `dxyz123ab`).
3. **Settings (gear) -> Upload -> Upload presets -> Add upload preset**:
   - Signing mode: **Unsigned**
   - Folder: `azan` (optional)
   - Save, then copy the **preset name** (example `ml_default` or the name you gave).
4. Paste both into **src/firebase/config.js**:
   ```js
   export const cloudinary = { cloudName: "dxyz123ab", uploadPreset: "your_preset_name" };
   ```

## Part C: Test
1. In the project folder:  `npm install`  then  `npm run dev`
2. Open  http://localhost:5173/admin  -> log in with the footballer's email + password.
3. Add a test match, refresh http://localhost:5173 -> Stats and Highlights change.
   (Delete the test from the panel afterwards.)

## Part D: Deploy (Vercel)
1. Push the project to GitHub / redeploy on Vercel as before. `vercel.json` is already included so that `/admin` opens.
2. Firebase console -> Authentication -> **Settings -> Authorized domains -> Add domain** -> your Vercel domain
   (example `hen.vercel.app`).
3. Done: https://YOUR-SITE/admin

---------------------------------------------------------------------------
## Good to know
- Nothing is shown on the website to say "admin". The page `/admin` is just not linked, and search engines are told to skip it.
- Forgot password? On the login page "Forgot password?" sends a reset email (works if the email is real).
  Or in Firebase -> Authentication -> Users -> the 3 dots -> Reset password.
- Deleting something in the panel removes it from the website. The picture/video file stays in Cloudinary (it just is not shown).
- Free limits (Firebase Spark + Cloudinary Free) are far above what one footballer's site uses.
  Cloudinary free: videos up to 100 MB, photos up to 10 MB (the panel shrinks photos automatically). For longer videos use a YouTube link.
- The old files (`src/content/*.json`, `Assests/gallery`) still work and are shown together with panel content.
