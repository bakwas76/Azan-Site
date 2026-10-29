import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CountUp from "./CountUp.jsx";
import { useContent } from "../content/ContentContext.jsx";

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const Play = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8 5.5v13l11-6.5-11-6.5Z" />
  </svg>
);

const TrophyIcon = ({ type }) => {
  const c1 = type === "final" ? "#c9ced3" : type === "trophy" ? "#f3d26b" : "#4cc38a";
  const c2 = type === "final" ? "#8a9097" : type === "trophy" ? "#b8891b" : "#0b6b3a";
  const id = `tg-${type}`;
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className="hl-ticon">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c1} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
      </defs>
      {type === "award" || type === "bestplayer" ? (
        <path fill={`url(#${id})`} d="m32 6 7.4 15 16.6 2.4-12 11.7 2.8 16.5L32 43.8 17.2 51.6 20 35.1 8 23.4 24.6 21 32 6Z" />
      ) : (
        <>
          <path fill={`url(#${id})`} d="M18 8h28v14c0 8.8-6.3 16-14 16s-14-7.2-14-16V8Z" />
          <path fill="none" stroke={`url(#${id})`} strokeWidth="4" strokeLinecap="round" d="M18 13h-7c0 8 3 13 9 14M46 13h7c0 8-3 13-9 14" />
          <rect x="29" y="37" width="6" height="9" fill={`url(#${id})`} />
          <rect x="20" y="46" width="24" height="8" rx="2.5" fill={`url(#${id})`} />
        </>
      )}
    </svg>
  );
};

function resultOf(score) {
  const m = String(score || "").match(/(\d+)\s*[-–:]\s*(\d+)/);
  if (!m) return null;
  const a = +m[1];
  const b = +m[2];
  return { us: a, them: b, r: a > b ? "W" : a < b ? "L" : "D" };
}

const fmtDate = (d) => {
  const t = new Date(`${d}T00:00:00Z`);
  return Number.isNaN(t.getTime())
    ? d || ""
    : t.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
};

function MatchCard({ m, club }) {
  const res = resultOf(m.score);
  return (
    <article className="hl-match">
      <div className="hl-match__top">
        <span>{fmtDate(m.date)}</span>
        {res && <b className={`hl-pill hl-pill--${res.r}`}>{res.r}</b>}
      </div>
      <p className="hl-match__comp">{m.competition || "Match"}</p>
      <p className="hl-match__teams">
        <span>{m.team || club}</span>
        <em>vs</em>
        <span>{m.opponent}</span>
      </p>
      {res && (
        <p className="hl-match__score">
          {res.us}
          <i>–</i>
          {res.them}
        </p>
      )}
      <div className="hl-match__tags">
        {m.goals > 0 && <span className="hl-tag hl-tag--g">⚽ {m.goals} {m.goals > 1 ? "goals" : "goal"}</span>}
        {m.assists > 0 && <span className="hl-tag">🅰 {m.assists} {m.assists > 1 ? "assists" : "assist"}</span>}
        {m.cleanSheet && <span className="hl-tag">🧤 Clean sheet</span>}
        {!m.goals && !m.assists && !m.cleanSheet && <span className="hl-tag hl-tag--mute">Played {m.minutes ? `${m.minutes}'` : "the match"}</span>}
      </div>
    </article>
  );
}

// Bento layout: card #1 is big, #2 and #3 stack beside it, the rest fill rows of three (no gaps).
function bentoSpans(i, n) {
  if (n === 1) return { cs: 12, rs: 2 };
  if (i === 0) return { cs: 8, rs: 2 };
  if (n === 2) return { cs: 4, rs: 2 };
  if (i <= 2) return { cs: 4, rs: 1 };
  const rest = n - 3;
  const j = i - 3;
  const fullRows = Math.floor(rest / 3);
  const rem = rest % 3;
  return { cs: Math.floor(j / 3) < fullRows ? 4 : 12 / rem, rs: 1 };
}

function VideoThumb({ v, i, n, onOpen }) {
  const { media } = v;
  const vid = useRef(null);
  const { cs, rs } = bentoSpans(i, n);
  // phones show 2 columns: first card and a lonely last card are full width
  const mobileWide = i === 0 || (n > 1 && i === n - 1 && (n - 1) % 2 === 1);

  const move = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    e.currentTarget.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  };
  const enter = () => vid.current?.play().catch(() => {});
  const leave = () => {
    if (vid.current) {
      vid.current.pause();
      vid.current.currentTime = 0.6;
    }
  };

  return (
    <button
      type="button"
      className={`hv ${i === 0 ? "hv--big" : ""} ${mobileWide ? "hv--mw" : ""}`}
      style={{ "--cs": cs, "--rs": rs }}
      onClick={() => onOpen(v)}
      onPointerMove={move}
      onPointerEnter={enter}
      onPointerLeave={leave}
      aria-label={`Play: ${v.title}`}
    >
      <span className="hv__media">
        {media.kind === "file" ? (
          <video
            ref={vid}
            src={`${media.src}#t=0.6`}
            poster={media.poster || undefined}
            preload={media.poster ? "none" : "metadata"}
            muted
            loop
            playsInline
          />
        ) : media.poster ? (
          <img src={media.poster} alt="" loading="lazy" draggable="false" />
        ) : (
          <span className="hv__ph">{media.platform}</span>
        )}
      </span>
      <span className="hv__shade" />
      <span className="hv__glow" />
      {v.tag && <span className="hv__tag">{v.tag}</span>}
      <span className="hv__no">{String(i + 1).padStart(2, "0")}</span>
      <span className="hv__play">
        <Play />
      </span>
      <span className="hv__meta">
        <b>{v.title}</b>
        <small>{[v.date && fmtDate(v.date), media.platform].filter(Boolean).join(" · ")}</small>
      </span>
    </button>
  );
}

function VideoModal({ v, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!reduceMotion()) gsap.fromTo(ref.current, { opacity: 0 }, { opacity: 1, duration: 0.3, clearProps: "opacity" });
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const { media } = v;
  return createPortal(
    <div className="lb hl-modal" ref={ref} role="dialog" aria-modal="true" aria-label={v.title} onClick={onClose}>
      <div className="lb__top" onClick={(e) => e.stopPropagation()}>
        <span className="lb__count">{v.title}</span>
        <button type="button" className="lb__btn" aria-label="Close" onClick={onClose}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <div className="hl-modal__frame" onClick={(e) => e.stopPropagation()}>
        {media.kind === "embed" && (
          <iframe src={media.embed} title={v.title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
        )}
        {media.kind === "file" && <video src={media.src} controls autoPlay playsInline poster={media.poster || undefined} />}
      </div>
    </div>,
    document.body
  );
}

export default function Highlights({ club }) {
  const { matches, highlights, trophies, honours } = useContent();
  const root = useRef(null);
  const [tag, setTag] = useState("All");
  const [playing, setPlaying] = useState(null);

  const tags = useMemo(() => ["All", ...Array.from(new Set(highlights.map((h) => h.tag).filter(Boolean)))], [highlights]);
  const list = tag === "All" ? highlights : highlights.filter((h) => h.tag === tag);

  // Entrance animations. fromTo + clearProps so nothing is ever left half-animated.
  useLayoutEffect(() => {
    if (reduceMotion() || !root.current) return;
    const ctx = gsap.context(() => {
      const reveal = (sel, from) =>
        gsap.utils.toArray(sel).forEach((group) => {
          const items = Array.from(group.children);
          if (!items.length) return;
          gsap.fromTo(
            items,
            { opacity: 0, ...from },
            {
              opacity: 1,
              y: 0,
              x: 0,
              scale: 1,
              rotateX: 0,
              duration: 0.85,
              stagger: 0.09,
              ease: "power3.out",
              clearProps: "transform,opacity",
              scrollTrigger: { trigger: group, start: "top 88%", once: true },
            }
          );
        });
      reveal(".hl-rail", { x: 40 });
      gsap.utils.toArray(".hv-grid").forEach((grid) => {
        const cards = Array.from(grid.children);
        if (!cards.length) return;
        gsap.fromTo(
          cards,
          { opacity: 0, y: 36, clipPath: "inset(14% 14% 14% 14% round 26px)" },
          {
            opacity: 1,
            y: 0,
            clipPath: "inset(0% 0% 0% 0% round 26px)",
            duration: 1,
            stagger: 0.12,
            ease: "power3.out",
            clearProps: "transform,opacity,clipPath",
            scrollTrigger: { trigger: grid, start: "top 88%", once: true },
          }
        );
        gsap.fromTo(
          grid.querySelectorAll(".hv__media > *"),
          { scale: 1.35 },
          {
            scale: 1,
            duration: 1.6,
            stagger: 0.12,
            ease: "power3.out",
            clearProps: "transform",
            scrollTrigger: { trigger: grid, start: "top 88%", once: true },
          }
        );
      });
      reveal(".hl-cab__grid", { y: 50, scale: 0.94, rotateX: -16 });
      gsap.utils.toArray(".hl-sub").forEach((el) =>
        gsap.fromTo(
          el,
          { opacity: 0, x: -24 },
          { opacity: 1, x: 0, duration: 0.7, ease: "power3.out", clearProps: "transform,opacity", scrollTrigger: { trigger: el, start: "top 90%", once: true } }
        )
      );
      gsap.utils.toArray(".hl-cab__total").forEach((el) =>
        gsap.fromTo(
          el,
          { opacity: 0, scale: 0.92 },
          { opacity: 1, scale: 1, duration: 0.9, ease: "back.out(1.5)", clearProps: "transform,opacity", scrollTrigger: { trigger: el, start: "top 90%", once: true } }
        )
      );
    }, root);
    return () => ctx.revert();
  }, [tag, matches.length, highlights.length, trophies.length]);

  return (
    <div className="hl" ref={root}>
      {matches.length > 0 && (
        <div className="hl-block">
          <h3 className="hl-sub">
            <span>Latest matches</span>
            <small>{matches.length} logged</small>
          </h3>
          <div className={`hl-rail ${matches.length <= 4 ? "hl-rail--few" : ""}`}>
            {matches.slice(0, 12).map((m, i) => (
              <MatchCard key={`${m.date}-${m.opponent}-${i}`} m={m} club={club} />
            ))}
          </div>
        </div>
      )}

      <div className="hl-block">
        <h3 className="hl-sub">
          <span>Video highlights</span>
          {highlights.length > 0 && <small>{highlights.length} clips</small>}
        </h3>

        {highlights.length === 0 ? (
          <div className="hl-empty">
            <span className="hl-empty__icon">
              <Play />
            </span>
            <p>
              <b>Highlight reels are on the way.</b>
              <br />
              Goals, assists and match clips will appear here.
            </p>
          </div>
        ) : (
          <>
            {tags.length > 2 && (
              <div className="gal__filters hl-filters" role="tablist" aria-label="Highlight types">
                {tags.map((t) => (
                  <button key={t} type="button" role="tab" aria-selected={t === tag} className={`gal__chip ${t === tag ? "is-active" : ""}`} onClick={() => setTag(t)}>
                    {t}
                  </button>
                ))}
              </div>
            )}
            <div className="hv-grid" key={tag}>
              {list.map((v, i) => (
                <VideoThumb key={v.id} v={v} i={i} n={list.length} onOpen={setPlaying} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="hl-block">
        <h3 className="hl-sub">
          <span>Trophy cabinet</span>
        </h3>
        <div className="hl-cab__total">
          <div>
            <b>
              <CountUp n={honours.trophies} />
            </b>
            <span>Trophies</span>
          </div>
          <div>
            <b>
              <CountUp n={honours.awards} />
            </b>
            <span>Tournament awards</span>
          </div>
          <div>
            <b>
              <CountUp n={honours.bestPlayer} />
            </b>
            <span>Best Player / Golden Boot</span>
          </div>
        </div>
        {trophies.length > 0 && (
          <div className="hl-cab__grid">
            {trophies.map((t, i) => (
              <article key={`${t.title}-${i}`} className={`hl-trophy hl-trophy--${t.type || "trophy"}`}>
                <TrophyIcon type={t.type || "trophy"} />
                <span className="hl-trophy__year">{t.year}</span>
                <h4>{t.title}</h4>
                <p>{t.result}</p>
              </article>
            ))}
          </div>
        )}
      </div>

      {playing && <VideoModal v={playing} onClose={() => setPlaying(null)} />}
    </div>
  );
}