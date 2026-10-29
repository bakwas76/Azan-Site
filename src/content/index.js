// ---------------------------------------------------------------
// ALL the content that changes lives in the JSON files next to this one.
// You never need to touch the React code to add a match, trophy or video.
// See HOW_TO_UPDATE.md in the project root.
// ---------------------------------------------------------------
import stats from "./stats.json";
import matchesRaw from "./matches.json";
import trophiesRaw from "./trophies.json";
import highlightsRaw from "./highlights.json";

const byDateDesc = (a, b) => String(b.date || "").localeCompare(String(a.date || ""));


// Local files you drop into Assests/videos (mp4/webm + optional poster image)
const localVideos = import.meta.glob("../../Assests/videos/*.{mp4,webm,mov,MP4,WEBM,MOV}", {
  eager: true,
  query: "?url",
  import: "default",
});
const localPosters = import.meta.glob("../../Assests/videos/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}", {
  eager: true,
  query: "?url",
  import: "default",
});
const fileUrl = (map, name) => {
  if (!name) return null;
  const key = Object.keys(map).find((k) => k.endsWith(`/${name}`));
  return key ? map[key] : null;
};

function parseVideo(item) {
  const link = (item.video || "").trim();
  const remoteFile = item.fileUrl || null;
  const remotePoster = item.posterUrl || null;
  let m;
  if ((m = link.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([\w-]{6,})/))) {
    return {
      kind: "embed",
      embed: `https://www.youtube.com/embed/${m[1]}?autoplay=1&rel=0&modestbranding=1`,
      poster: remotePoster || fileUrl(localPosters, item.poster) || `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`,
      platform: "YouTube",
    };
  }
  if ((m = link.match(/drive\.google\.com\/file\/d\/([\w-]+)/))) {
    return {
      kind: "embed",
      embed: `https://drive.google.com/file/d/${m[1]}/preview`,
      poster: remotePoster || fileUrl(localPosters, item.poster),
      platform: "Google Drive",
    };
  }
  if (link) {
    // Instagram / TikTok / Facebook ...: these can't be embedded reliably, so they open in a new tab
    const host = (() => {
      try {
        return new URL(link).hostname.replace("www.", "").split(".")[0];
      } catch {
        return "Link";
      }
    })();
    return {
      kind: "external",
      href: link,
      poster: remotePoster || fileUrl(localPosters, item.poster),
      platform: host.charAt(0).toUpperCase() + host.slice(1),
    };
  }
  const src = remoteFile || fileUrl(localVideos, item.file);
  if (src) return { kind: "file", src, poster: remotePoster || fileUrl(localPosters, item.poster), platform: "Video" };
  return null;
}

const prettify = (file) => {
  const base = file.replace(/\.[^.]+$/, "").replace(/^\d+[-_ ]*/, "").replace(/[-_]+/g, " ").trim();
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : "Photo";
};
const localGallery = Object.entries(
  import.meta.glob("../../Assests/gallery/*/*.{webp,jpg,jpeg,png,WEBP,JPG,JPEG,PNG}", { eager: true, import: "default" })
)
  .map(([path, src]) => {
    const parts = path.split("/");
    const file = parts.pop();
    const category = parts.pop();
    const caption = prettify(file);
    return { category, caption, size: "normal", src, alt: `${caption} — M.Azan`, _k: path };
  })
  // newest names first (name files 2026-10-25-goal.webp or 101.webp to control order)
  .sort((a, b) => b._k.localeCompare(a._k));

// Builds everything the site shows from: the JSON files + local folders + (optional) live data from Sanity.
export function buildContent(remote = {}) {
  const matches = [...matchesRaw, ...(remote.matches || [])].sort(byDateDesc);
  const trophies = [...trophiesRaw, ...(remote.trophies || [])].sort((a, b) =>
    String(b.year || "").localeCompare(String(a.year || ""))
  );
  const highlights = [...highlightsRaw, ...(remote.highlights || [])]
    .sort(byDateDesc)
    .map((h, i) => ({ ...h, id: `${i}-${h.title}`, media: parseVideo(h) }))
    .filter((h) => h.media);

  const sum = (key) => matches.reduce((t, m) => t + (Number(m[key]) || 0), 0);
  const totals = {
    matches: stats.baseline.matches + matches.length,
    goals: stats.baseline.goals + sum("goals"),
    assists: stats.baseline.assists + sum("assists"),
    cleanSheets: stats.baseline.cleanSheets + matches.filter((m) => m.cleanSheet).length,
  };
  const countType = (t) => trophies.filter((x) => x.type === t).length;
  const honours = {
    trophies: stats.base.trophies + countType("trophy"),
    awards: stats.base.awards + countType("award"),
    bestPlayer: stats.base.bestPlayer + countType("bestplayer"),
  };
  const newGallery = [...(remote.photos || []), ...localGallery];
  return { matches, trophies, highlights, totals, honours, newGallery };
}

export const LOCAL_CONTENT = buildContent();