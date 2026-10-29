// ---------------------------------------------------------------
// PASTE YOUR KEYS HERE (see FIREBASE_SETUP.md). These are not passwords:
// Firebase web keys are meant to be public. Security comes from the Firestore rules.
// ---------------------------------------------------------------
export const firebaseConfig = {
  apiKey: "AIzaSyDxMvdZfrSiSm-UmOS2uQdi2yLiRB3oMnQ",
  authDomain: "azan-85e97.firebaseapp.com",
  projectId: "azan-85e97",
  appId: "1:102163822500:web:4544cf1d44023f50b53331",
};

// Free account at cloudinary.com: photos and videos are stored there.
export const cloudinary = {
  cloudName: "ofkw3gbu",
  uploadPreset: "bl_default", // an UNSIGNED upload preset
};

export const firebaseReady = Boolean(firebaseConfig.projectId && firebaseConfig.apiKey);
export const cloudinaryReady = Boolean(cloudinary.cloudName && cloudinary.uploadPreset);