import { useCallback, useEffect, useRef, useState } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  serverTimestamp,
} from "firebase/firestore";
import { cloudinary, cloudinaryReady, firebaseConfig, firebaseReady } from "../firebase/config.js";
import "./admin.css";

const app = firebaseReady ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;

const today = () => new Date().toISOString().slice(0, 10);
const num = (v) => (v === "" || v == null ? 0 : Number(v));

const friendly = (e) => {
  const c = e?.code || "";
  if (c.includes("invalid-credential") || c.includes("wrong-password") || c.includes("user-not-found")) return "Wrong email or password.";
  if (c.includes("too-many-requests")) return "Too many tries. Wait a few minutes and try again.";
  if (c.includes("permission-denied")) return "Not allowed. Check the Firestore rules and that you are logged in with the admin email.";
  if (c.includes("network")) return "No internet connection.";
  return e?.message || "Something went wrong.";
};

// ---------- helpers ----------
async function resizeImage(file, max = 1800) {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(bmp, 0, 0, w, h);
    const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.85));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file; // if the browser can't resize, upload the original
  }
}

function uploadToCloudinary(file, onProgress) {
  return new Promise((resolve, reject) => {
    if (!cloudinaryReady) return reject(new Error("Cloudinary keys are missing in src/firebase/config.js"));
    const isVideo = file.type.startsWith("video/");
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudinary.cloudName}/${isVideo ? "video" : "image"}/upload`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      try {
        const j = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(j);
        else reject(new Error(j?.error?.message || `Upload failed (${xhr.status})`));
      } catch {
        reject(new Error("Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed. Check your internet."));
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", cloudinary.uploadPreset);
    fd.append("folder", "azan");
    xhr.send(fd);
  });
}

const videoPoster = (url) =>
  url
    .replace("/video/upload/", "/video/upload/so_1,w_900,c_limit,f_jpg/")
    .replace(/\.[a-z0-9]+$/i, ".jpg");

function useList(name) {
  const [items, setItems] = useState(null);
  const reload = useCallback(async () => {
    const snap = await getDocs(collection(db, name));
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    rows.sort(
      (a, b) =>
        String(b.date || b.year || "").localeCompare(String(a.date || a.year || "")) ||
        (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
    );
    setItems(rows);
  }, [name]);
  useEffect(() => {
    reload().catch(() => setItems([]));
  }, [reload]);
  return [items, reload];
}

function useToast() {
  const [t, setT] = useState(null);
  const timer = useRef();
  const show = useCallback((text, kind = "ok") => {
    setT({ text, kind });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setT(null), kind === "ok" ? 3000 : 6000);
  }, []);
  return [t, show];
}

// ---------- screens ----------
function Setup() {
  return (
    <div className="adm adm-center">
      <div className="adm-card">
        <h1>Setup needed</h1>
        <p>The Firebase keys are not added yet. Open <b>src/firebase/config.js</b> and paste them (steps are in FIREBASE_SETUP.md).</p>
      </div>
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (err) {
      setMsg(friendly(err));
    } finally {
      setBusy(false);
    }
  };
  const reset = async () => {
    if (!email) return setMsg("Type your email first, then press this again.");
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMsg("Password reset email sent (if this email exists).");
    } catch (err) {
      setMsg(friendly(err));
    }
  };

  return (
    <div className="adm adm-center">
      <form className="adm-card adm-login" onSubmit={submit}>
        <span className="adm-logo">M</span>
        <h1>Admin login</h1>
        <p className="adm-muted">Only for M.Azan's website.</p>
        <label>
          Email
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} required />
        </label>
        {msg && <p className="adm-msg">{msg}</p>}
        <button className="adm-btn" disabled={busy}>{busy ? "Please wait…" : "Log in"}</button>
        <button type="button" className="adm-link" onClick={reset}>Forgot password?</button>
      </form>
    </div>
  );
}

function ListShell({ title, items, children }) {
  return (
    <section className="adm-list">
      <h3>{title} {items && <small>{items.length}</small>}</h3>
      {items === null ? <p className="adm-muted">Loading…</p> : items.length === 0 ? <p className="adm-muted">Nothing added yet.</p> : children}
    </section>
  );
}

function Progress({ pct, label }) {
  if (pct == null) return null;
  return (
    <div className="adm-progress" role="progressbar" aria-valuenow={pct}>
      <span style={{ width: `${pct}%` }} />
      <em>{label || `${pct}%`}</em>
    </div>
  );
}

function usePanel(name, toast) {
  const [items, reload] = useList(name);
  const remove = async (id) => {
    if (!window.confirm("Delete this? It will disappear from the website.")) return;
    try {
      await deleteDoc(doc(db, name, id));
      await reload();
      toast("Deleted.");
    } catch (e) {
      toast(friendly(e), "err");
    }
  };
  return [items, reload, remove];
}

function PhotosTab({ toast }) {
  const [items, reload, remove] = usePanel("photos", toast);
  const [files, setFiles] = useState([]);
  const [category, setCategory] = useState("Match");
  const [caption, setCaption] = useState("");
  const [pct, setPct] = useState(null);
  const [label, setLabel] = useState("");
  const fileRef = useRef();

  const cats = ["Match", "Team", "Moments", "Training", "Trophies", ...Array.from(new Set((items || []).map((i) => i.category)))];

  const submit = async (e) => {
    e.preventDefault();
    if (!files.length) return toast("Choose at least one photo.", "err");
    try {
      for (let i = 0; i < files.length; i++) {
        setLabel(`Photo ${i + 1} of ${files.length}`);
        setPct(0);
        const small = await resizeImage(files[i]);
        const up = await uploadToCloudinary(small, setPct);
        await addDoc(collection(db, "photos"), {
          src: up.secure_url,
          w: up.width,
          h: up.height,
          category: category.trim() || "Moments",
          caption: caption.trim() || "",
          createdAt: serverTimestamp(),
        });
      }
      toast(`${files.length} photo${files.length > 1 ? "s" : ""} added.`);
      setFiles([]);
      setCaption("");
      if (fileRef.current) fileRef.current.value = "";
      await reload();
    } catch (err) {
      toast(friendly(err), "err");
    } finally {
      setPct(null);
    }
  };

  return (
    <>
      <form className="adm-card adm-form" onSubmit={submit}>
        <h3>Add photos</h3>
        <label>
          Photos (you can choose many)
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
        </label>
        <label>
          Where should they appear?
          <input list="adm-cats" value={category} onChange={(e) => setCategory(e.target.value)} />
          <datalist id="adm-cats">{[...new Set(cats)].map((c) => <option key={c} value={c} />)}</datalist>
        </label>
        <label>
          Caption (optional)
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Example: Winning goal vs Karachi United" />
        </label>
        <Progress pct={pct} label={`${label} · ${pct}%`} />
        <button className="adm-btn" disabled={pct != null}>{pct != null ? "Uploading…" : "Upload"}</button>
      </form>

      <ListShell title="Photos on the website" items={items}>
        <div className="adm-photos">
          {items?.map((p) => (
            <figure key={p.id}>
              <img src={p.src.replace("/image/upload/", "/image/upload/w_300,c_fill,h_300,q_auto,f_auto/")} alt="" loading="lazy" />
              <figcaption>
                <b>{p.category}</b>
                <span>{p.caption}</span>
              </figcaption>
              <button type="button" className="adm-del" onClick={() => remove(p.id)} aria-label="Delete photo">✕</button>
            </figure>
          ))}
        </div>
      </ListShell>
    </>
  );
}

function VideosTab({ toast }) {
  const [items, reload, remove] = usePanel("highlights", toast);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(today());
  const [tag, setTag] = useState("Goal");
  const [link, setLink] = useState("");
  const [file, setFile] = useState(null);
  const [pct, setPct] = useState(null);
  const fileRef = useRef();

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast("Write a title.", "err");
    if (!file && !link.trim()) return toast("Choose a video file OR paste a link.", "err");
    if (file && file.size > 100 * 1024 * 1024) return toast("Video is over 100 MB. Upload it to YouTube and paste the link instead.", "err");
    try {
      const data = { title: title.trim(), date, tag, video: "", fileUrl: "", posterUrl: "", createdAt: serverTimestamp() };
      if (file) {
        setPct(0);
        const up = await uploadToCloudinary(file, setPct);
        data.fileUrl = up.secure_url;
        data.posterUrl = videoPoster(up.secure_url);
      } else {
        data.video = link.trim();
      }
      await addDoc(collection(db, "highlights"), data);
      toast("Video added.");
      setTitle("");
      setLink("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      await reload();
    } catch (err) {
      toast(friendly(err), "err");
    } finally {
      setPct(null);
    }
  };

  return (
    <>
      <form className="adm-card adm-form" onSubmit={submit}>
        <h3>Add a highlight video</h3>
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Example: Long-range goal vs Karachi United" />
        </label>
        <div className="adm-row">
          <label>
            Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>
            Type
            <select value={tag} onChange={(e) => setTag(e.target.value)}>
              {["Goal", "Assist", "Match", "Skills", "Training"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
        </div>
        <label>
          Upload video (up to 100 MB)
          <input ref={fileRef} type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
        <p className="adm-or">OR</p>
        <label>
          Paste a YouTube / Instagram / TikTok link
          <input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://youtu.be/…" disabled={!!file} />
        </label>
        <Progress pct={pct} label={`Uploading video · ${pct}%`} />
        <button className="adm-btn" disabled={pct != null}>{pct != null ? "Uploading…" : "Add video"}</button>
      </form>

      <ListShell title="Videos on the website" items={items}>
        <ul className="adm-rows">
          {items?.map((v) => (
            <li key={v.id}>
              <div>
                <b>{v.title}</b>
                <span>{[v.tag, v.date, v.fileUrl ? "uploaded file" : "link"].filter(Boolean).join(" · ")}</span>
              </div>
              <button type="button" className="adm-del" onClick={() => remove(v.id)} aria-label="Delete video">✕</button>
            </li>
          ))}
        </ul>
      </ListShell>
    </>
  );
}

function MatchesTab({ toast }) {
  const [items, reload, remove] = usePanel("matches", toast);
  const empty = { date: today(), competition: "", opponent: "", team: "", scoreUs: "0", scoreThem: "0", goals: "0", assists: "0", cleanSheet: false };
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!f.opponent.trim()) return toast("Who did you play against?", "err");
    setBusy(true);
    try {
      await addDoc(collection(db, "matches"), {
        date: f.date,
        competition: f.competition.trim(),
        opponent: f.opponent.trim(),
        team: f.team.trim(),
        scoreUs: num(f.scoreUs),
        scoreThem: num(f.scoreThem),
        goals: num(f.goals),
        assists: num(f.assists),
        cleanSheet: f.cleanSheet,
        createdAt: serverTimestamp(),
      });
      toast("Match added. Stats updated.");
      setF(empty);
      await reload();
    } catch (err) {
      toast(friendly(err), "err");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <form className="adm-card adm-form" onSubmit={submit}>
        <h3>Add a match</h3>
        <div className="adm-row">
          <label>Date<input type="date" value={f.date} onChange={set("date")} required /></label>
          <label>Tournament<input value={f.competition} onChange={set("competition")} placeholder="Super League" /></label>
        </div>
        <label>Played against<input value={f.opponent} onChange={set("opponent")} placeholder="Karachi United" required /></label>
        <label>Played for (empty = current club)<input value={f.team} onChange={set("team")} placeholder="Pakistan" /></label>
        <div className="adm-row">
          <label>Our goals<input type="number" min="0" inputMode="numeric" value={f.scoreUs} onChange={set("scoreUs")} /></label>
          <label>Their goals<input type="number" min="0" inputMode="numeric" value={f.scoreThem} onChange={set("scoreThem")} /></label>
        </div>
        <div className="adm-row">
          <label>Azan's goals<input type="number" min="0" inputMode="numeric" value={f.goals} onChange={set("goals")} /></label>
          <label>Azan's assists<input type="number" min="0" inputMode="numeric" value={f.assists} onChange={set("assists")} /></label>
        </div>
        <label className="adm-check"><input type="checkbox" checked={f.cleanSheet} onChange={set("cleanSheet")} /> Clean sheet (team conceded 0)</label>
        <button className="adm-btn" disabled={busy}>{busy ? "Saving…" : "Add match"}</button>
      </form>

      <ListShell title="Matches on the website" items={items}>
        <ul className="adm-rows">
          {items?.map((m) => (
            <li key={m.id}>
              <div>
                <b>vs {m.opponent} · {m.scoreUs}–{m.scoreThem}</b>
                <span>{[m.date, m.competition, m.goals ? `${m.goals} goal` : "", m.assists ? `${m.assists} assist` : "", m.cleanSheet ? "clean sheet" : ""].filter(Boolean).join(" · ")}</span>
              </div>
              <button type="button" className="adm-del" onClick={() => remove(m.id)} aria-label="Delete match">✕</button>
            </li>
          ))}
        </ul>
      </ListShell>
    </>
  );
}

const TROPHY_TYPES = [
  ["trophy", "🏆 Trophy (team won a tournament)"],
  ["award", "⭐ Tournament award"],
  ["bestplayer", "🥇 Best Player / Golden Boot"],
  ["final", "🥈 Final played (only listed, not counted)"],
];

function TrophiesTab({ toast }) {
  const [items, reload, remove] = usePanel("trophies", toast);
  const empty = { type: "trophy", title: "", result: "Champions", year: String(new Date().getFullYear()) };
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!f.title.trim()) return toast("Write the tournament name.", "err");
    setBusy(true);
    try {
      await addDoc(collection(db, "trophies"), { ...f, title: f.title.trim(), result: f.result.trim(), createdAt: serverTimestamp() });
      toast("Added to the trophy cabinet.");
      setF(empty);
      await reload();
    } catch (err) {
      toast(friendly(err), "err");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <form className="adm-card adm-form" onSubmit={submit}>
        <h3>Add a trophy or award</h3>
        <label>
          What is it?
          <select value={f.type} onChange={set("type")}>
            {TROPHY_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label>Tournament name<input value={f.title} onChange={set("title")} placeholder="CM Gold Cup" /></label>
        <div className="adm-row">
          <label>Result<input value={f.result} onChange={set("result")} placeholder="Champions" /></label>
          <label>Year<input value={f.year} onChange={set("year")} inputMode="numeric" /></label>
        </div>
        <button className="adm-btn" disabled={busy}>{busy ? "Saving…" : "Add"}</button>
      </form>

      <ListShell title="Trophy cabinet (added from here)" items={items}>
        <ul className="adm-rows">
          {items?.map((t) => (
            <li key={t.id}>
              <div>
                <b>{t.title}</b>
                <span>{[t.year, t.result, TROPHY_TYPES.find(([v]) => v === t.type)?.[1]].filter(Boolean).join(" · ")}</span>
              </div>
              <button type="button" className="adm-del" onClick={() => remove(t.id)} aria-label="Delete">✕</button>
            </li>
          ))}
        </ul>
      </ListShell>
    </>
  );
}

const TABS = [
  ["photos", "📷 Photos"],
  ["videos", "🎬 Videos"],
  ["matches", "⚽ Matches"],
  ["trophies", "🏆 Trophies"],
];

function Panel({ user }) {
  const [tab, setTab] = useState("photos");
  const [toastData, toast] = useToast();
  return (
    <div className="adm">
      <header className="adm-top">
        <div>
          <b>M.Azan · Admin</b>
          <small>{user.email}</small>
        </div>
        <div className="adm-top__btns">
          <a href="/" target="_blank" rel="noreferrer">View site ↗</a>
          <button type="button" onClick={() => signOut(auth)}>Log out</button>
        </div>
      </header>
      <nav className="adm-tabs" role="tablist">
        {TABS.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "is-on" : ""} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>
      <main className="adm-main">
        {!cloudinaryReady && (tab === "photos" || tab === "videos") && (
          <p className="adm-msg">Cloudinary keys are missing in src/firebase/config.js, so uploads will not work yet.</p>
        )}
        {tab === "photos" && <PhotosTab toast={toast} />}
        {tab === "videos" && <VideosTab toast={toast} />}
        {tab === "matches" && <MatchesTab toast={toast} />}
        {tab === "trophies" && <TrophiesTab toast={toast} />}
        <p className="adm-muted adm-foot">Changes show on the website within a few seconds. Refresh the website to see them.</p>
      </main>
      {toastData && <div className={`adm-toast adm-toast--${toastData.kind}`} role="status">{toastData.text}</div>}
    </div>
  );
}

export default function Admin() {
  const [user, setUser] = useState(undefined); // undefined = still checking

  useEffect(() => {
    document.title = "Admin";
    const m = document.createElement("meta");
    m.name = "robots";
    m.content = "noindex,nofollow";
    document.head.appendChild(m);
    document.body.style.background = "#f6f6f3";
    if (!auth) return;
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  if (!firebaseReady) return <Setup />;
  if (user === undefined) return <div className="adm adm-center"><p className="adm-muted">Loading…</p></div>;
  return user ? <Panel user={user} /> : <Login />;
}
