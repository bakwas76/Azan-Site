// Reads the content the footballer added in the admin panel (public read, tiny "lite" SDK).
// If Firebase is not configured, nothing is fetched and the site uses the saved files only.
import { firebaseConfig, firebaseReady } from "./config.js";

export { firebaseReady };

// Cloudinary image URL -> optimized version (smaller, auto format)
export const optimized = (url, w = 1400) =>
  typeof url === "string" && url.includes("/image/upload/")
    ? url.replace("/image/upload/", `/image/upload/f_auto,q_auto,w_${w},c_limit/`)
    : url;

export async function fetchRemote() {
  const [{ initializeApp, getApps, getApp }, { getFirestore, collection, getDocs }] = await Promise.all([
    import("firebase/app"),
    import("firebase/firestore/lite"),
  ]);
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const read = async (name) => (await getDocs(collection(db, name))).docs.map((d) => ({ id: d.id, ...d.data() }));

  const [matches, trophies, highlights, photos] = await Promise.all([
    read("matches"),
    read("trophies"),
    read("highlights"),
    read("photos"),
  ]);

  return {
    matches: matches.map((m) => ({
      date: m.date,
      competition: m.competition,
      opponent: m.opponent,
      team: m.team || undefined,
      score: Number.isFinite(m.scoreUs) && Number.isFinite(m.scoreThem) ? `${m.scoreUs}-${m.scoreThem}` : undefined,
      goals: m.goals || 0,
      assists: m.assists || 0,
      cleanSheet: Boolean(m.cleanSheet),
    })),
    trophies,
    highlights: highlights.map((h) => ({
      title: h.title,
      date: h.date,
      tag: h.tag,
      video: h.video || "",
      fileUrl: h.fileUrl || null,
      posterUrl: h.posterUrl || null,
    })),
    photos: photos
      .filter((p) => p.src)
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .map((p) => {
        const ratio = p.w && p.h ? p.h / p.w : 1;
        return {
          category: p.category || "Moments",
          caption: p.caption || "Photo",
          size: ratio > 1.2 ? "tall" : ratio < 0.62 ? "wide" : "normal",
          src: optimized(p.src),
          alt: `${p.caption || "Photo"} — M.Azan`,
        };
      }),
  };
}