import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import GalleryView from "./components/Gallery.jsx";
import CareerShowcase from "./components/CareerShowcase.jsx";
import Navbar from "./components/Navbar.jsx";
import karachiLogo from "../Assests/images/Karachi_United_Football_Club_logo.png";
import pakistanLogo from "../Assests/images/pakistan_pakistan-national-team.football-logos.cc.svg";

gsap.registerPlugin(ScrollTrigger);

// Hero photo: put a background-removed (transparent) PNG/WebP in Assests/images
// and name it starting with "azan", e.g. azan.png or azan-cutout.png.
const heroImages = import.meta.glob("../Assests/images/azan*.{png,webp,PNG,WEBP}", {
  eager: true,
  import: "default",
});
const HERO_IMG = Object.values(heroImages)[0] || null;

// Gallery photos (optimized WebP): Assests/images/01.webp ... 60.webp
const galleryFiles = import.meta.glob("../Assests/images/[0-9][0-9].webp", {
  eager: true,
  import: "default",
});
const photoUrl = (n) => galleryFiles[`../Assests/images/${String(n).padStart(2, "0")}.webp`];

// [photo number, caption, size]  size: "tall" | "wide" | "normal" (default)
// To move a photo to another filter, cut its row and paste it under that category.
const GALLERY_RAW = {
  Match: [
    [4, "Referee steps in"], [5, "Chasing the ball"], [6, "Breaking forward"], [8, "Tempers flare"],
    [10, "Mid-air challenge", "wide"], [11, "Fighting for possession"], [14, "Shielding the ball"],
    [17, "Dribbling past defenders"], [18, "Race for the ball"], [21, "Pressing high", "wide"],
    [25, "Controlling the midfield"], [30, "Driving forward"], [32, "Dribble duel"], [34, "Leaping the tackle"],
    [35, "Midfield battle"], [37, "Tight marking"], [38, "Eyes on the ball"], [40, "Heated moment"],
    [41, "Close control"], [42, "Pressing as a unit"], [46, "Counter attack"], [51, "Striking the ball"],
    [54, "Physical contest"], [55, "Past the defender", "wide"], [56, "Crowded midfield"],
    [57, "Scramble for the ball"], [59, "Moving the ball"],
  ],
  Team: [
    [2, "National anthem"], [7, "Starting eleven", "wide"], [9, "Pre-match line-up"], [12, "Team photo", "wide"],
    [13, "Pre-match handshakes"], [16, "Anthem time"], [20, "Squad portrait", "wide"], [22, "Team photo", "wide"],
    [23, "Meeting the officials"], [24, "Teams line up"], [27, "White kit line-up", "wide"],
    [33, "Squad portrait", "wide"], [43, "Standing for the anthem"], [49, "Hand on heart"],
    [52, "Handshake line"], [60, "Match-day squad", "wide"],
  ],
  Moments: [
    [1, "Off the pitch", "tall"], [3, "Match-day shirt #6", "tall"], [19, "Squad off-duty", "tall"],
    [26, "Celebration"], [31, "Down time", "tall"], [39, "Ready in the locker room", "tall"],
    [45, "Smiles in the dugout"], [47, "Teammates"], [48, "Passport in hand", "tall"],
    [50, "Kit laid out", "tall"], [53, "At the stadium", "tall"],
  ],
};

// Mixes the categories so the "All" view doesn't show 27 match photos in a row.
function buildGallery() {
  const queues = {};
  Object.entries(GALLERY_RAW).forEach(([cat, rows]) => {
    queues[cat] = rows.filter(([n]) => photoUrl(n)).map(([n, caption, size]) => ({
      category: cat,
      caption,
      size: size || "normal",
      src: photoUrl(n),
      alt: `${caption} — Azan`,
    }));
  });
  const pattern = ["Match", "Team", "Match", "Moments"];
  const out = [];
  let left = Object.values(queues).reduce((t, q) => t + q.length, 0);
  for (let i = 0; left > 0; i++) {
    const item = queues[pattern[i % pattern.length]].shift();
    if (item) {
      out.push(item);
      left--;
    }
  }
  return out;
}

// ---------------------------------------------------------------
// EDIT THIS SECTION: replace placeholders with Azan's real details.
// ---------------------------------------------------------------
const PLAYER = {
  name: "Azan",
  position: "Defensive Midfielder",
  country: "Pakistan",
  club: "Karachi United",
  number: "6", // from the photos (shirt #6). Change if wrong.
  tagline: "Football is simple. Doing it well is not.",
  about: [
    "Muhammad Azan grew up in Lyari, Karachi, a neighbourhood famous for its deep football roots. He started playing on local streets before joining the Karachi United Academy, driven by a dream to put Pakistani football on the global map.",
    "Now 18, he plays as a central defensive midfielder and can also operate as a right central midfielder. Known for his orchestrating role in the middle of the park, the right-footed Azan sets the tempo, links defence with attack, and represents both Karachi United and Pakistan.",
  ],
  // Shown in the About card
  role: "CDM / RCM",
  born: "2007-12-25", // age is calculated automatically
  height: "5′4″ · 163 cm",
  foot: "Right",
  // !! SAMPLE NUMBERS in `stats` below (not Azan's real stats). Replace them before publishing.
  // The Stats section totals are calculated from these, so edit them only here.
  // (If a team has no `stats`, its numbers are hidden. If no team has any, the Stats section hides.)
  career: [
    {
      id: "current",
      label: "Current Club",
      team: "Karachi United",
      years: "", // e.g. "2022 — Now"
      role: "Central Defensive Midfielder",
      logo: karachiLogo,
      stats: { matches: 30, goals: 5, assists: 8 }, // SAMPLE
    },
    {
      id: "national",
      label: "National Team",
      team: "Pakistan",
      years: "",
      role: "National team",
      logo: pakistanLogo,
      stats: { matches: 8, goals: 1, assists: 2 }, // SAMPLE
    },
  ],
  // Edit captions / categories in GALLERY_RAW at the top of this file.
  gallery: buildGallery(),
  contact: {
    email: "", // add an email here to show an email button + copy button
    instagram: "https://www.instagram.com/theazaanofficial/",
    instagramHandle: "@theazaanofficial",
    linktree: "https://linktr.ee/Azoo16",
  },
};

// The Stats section is only shown once real numbers are added to PLAYER.career
const HAS_STATS = PLAYER.career.some((c) => c.stats);

const NAV = [
  ["about", "About"],
  ["stats", "Stats"],
  ["career", "Career"],
  ["gallery", "Gallery"],
  ["contact", "Contact"],
].filter(([id]) => id !== "stats" || HAS_STATS);

const BALL_PATH =
  "m12 7.5 3.6 2.6-1.4 4.2H9.8l-1.4-4.2L12 7.5ZM12 3v4.5M3.8 9.3l4.6.8M20.2 9.3l-4.6.8M7 19.5l2.8-5.2M17 19.5l-2.8-5.2";

function Preloader({ name, onReveal, onDone }) {
  const ref = useRef(null);
  const countRef = useRef(null);
  const barRef = useRef(null);

  useLayoutEffect(() => {
    let cancelled = false;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);

    const state = { n: 0 };
    const render = () => {
      if (countRef.current) countRef.current.firstChild.nodeValue = String(Math.round(state.n));
      if (barRef.current) barRef.current.style.transform = `scaleX(${state.n / 100})`;
    };

    const ctx = gsap.context(() => {
      if (!reduce) {
        gsap.from(".pre__char", { yPercent: 115, duration: 1, stagger: 0.09, ease: "power4.out" });
        gsap.from(".pre__fade", { opacity: 0, y: 14, duration: 0.8, stagger: 0.1, delay: 0.3, ease: "power3.out" });
      }
      const counter = gsap.to(state, { n: 90, duration: reduce ? 0.2 : 1.8, ease: "power2.out", onUpdate: render });

      const exit = () => {
        if (cancelled) return;
        onReveal();
        gsap
          .timeline({
            onComplete: () => {
              document.body.style.overflow = prevOverflow;
              onDone();
            },
          })
          .to(".pre__center, .pre__top, .pre__bottom", { y: -30, opacity: 0, duration: reduce ? 0.01 : 0.45, ease: "power2.in" })
          .to(ref.current, { yPercent: -102, duration: reduce ? 0.01 : 1, ease: "power4.inOut" }, "-=0.1");
      };

      const finish = () => {
        if (cancelled) return;
        counter.kill();
        gsap.to(state, { n: 100, duration: reduce ? 0.01 : 0.45, ease: "power1.out", onUpdate: render, onComplete: exit });
      };

      const pageLoaded = new Promise((res) =>
        document.readyState === "complete" ? res() : window.addEventListener("load", res, { once: true })
      );
      const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
      const minTime = new Promise((r) => setTimeout(r, reduce ? 0 : 2000));
      const cap = new Promise((r) => setTimeout(r, 5000)); // never wait forever
      Promise.race([Promise.all([pageLoaded, fonts, minTime]), cap]).then(finish);
    }, ref);

    return () => {
      cancelled = true;
      document.body.style.overflow = prevOverflow;
      ctx.revert();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="pre" ref={ref} role="status" aria-live="polite" aria-label="Loading">
      <div className="pre__top pre__fade">
        <span>Loading</span>
        <span>Pakistan</span>
      </div>

      <div className="pre__center">
        <span className="pre__ball pre__fade" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <path d={BALL_PATH} />
          </svg>
        </span>
        <div className="pre__name" aria-hidden="true">
          {name.split("").map((ch, i) => (
            <span className="pre__mask" key={i}>
              <span className="pre__char">{ch}</span>
            </span>
          ))}
        </div>
        <p className="pre__sub pre__fade">Professional footballer</p>
      </div>

      <div className="pre__bottom">
        <span className="pre__fade" style={{ fontSize: "0.72rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted)" }}>
          Warming up
        </span>
        <span className="pre__count" ref={countRef}>
          0<small>%</small>
        </span>
      </div>
      <span className="pre__bar" aria-hidden="true">
        <span ref={barRef} />
      </span>
    </div>
  );
}

function HeroPlaceholder() {
  return (
    <div className="hero__ph">
      <span>Add a transparent photo: Assests/images/azan.png</span>
      <svg viewBox="0 0 300 420" aria-hidden="true" preserveAspectRatio="xMidYMax meet">
        <circle cx="150" cy="105" r="62" opacity="0.95" />
        <path d="M30 420c0-92 48-160 120-160s120 68 120 160H30Z" opacity="0.8" />
      </svg>
    </div>
  );
}

function Hero() {
  const current = PLAYER.career.find((c) => c.id === "current");
  const national = PLAYER.career.find((c) => c.id === "national");
  const items = [PLAYER.position, current ? current.team : PLAYER.club, PLAYER.country, `No. ${PLAYER.number}`];
  const group = (key) => (
    <div className="marquee__group" key={key} aria-hidden={key !== "a" || undefined}>
      {[...items, ...items].map((t, i) => (
        <span className="marquee__item" key={i}>
          {t}
          <i />
        </span>
      ))}
    </div>
  );

  return (
    <section id="top" className="hero">
      <div className="hero__bg" aria-hidden="true" />
      <span className="hero__number" aria-hidden="true">
        {PLAYER.number}
      </span>

      <div className="hero__grid">
        <div className="hero__content">
          <p className="eyebrow">
            <span className="eyebrow__dot" aria-hidden="true" />
            {PLAYER.position} · {PLAYER.country}
          </p>
          <h1 aria-label={PLAYER.name}>
            {PLAYER.name.split("").map((c, i) => (
              <span className="char-wrap" aria-hidden="true" key={i}>
                <span className="char">{c}</span>
              </span>
            ))}
          </h1>
          <p className="hero__tagline">{PLAYER.tagline}</p>
          <div className="hero__cta">
            <a className="btn btn--primary" href="#career">
              View career
            </a>
            <a className="btn btn--ghost" href="#contact">
              Get in touch
            </a>
          </div>
        </div>

        <div className="hero__visual">
          <span className="hero__blob" aria-hidden="true" />
          {HERO_IMG ? (
            <img className="hero__img" src={HERO_IMG} alt={`${PLAYER.name}, ${PLAYER.position}`} />
          ) : (
            <HeroPlaceholder />
          )}

          <div className="chip chip--club">
            {current ? <img src={current.logo} alt="" /> : <span className="chip__icon">C</span>}
            <span className="chip__txt">
              <small>Club</small>
              <b>{current ? current.team : PLAYER.club}</b>
            </span>
          </div>
          <div className="chip chip--pos">
            <span className="chip__icon">{PLAYER.number}</span>
            <span className="chip__txt">
              <small>Position</small>
              <b>{PLAYER.position}</b>
            </span>
          </div>
          <div className="chip chip--country">
            {national ? <img src={national.logo} alt="" /> : <span className="chip__icon">PK</span>}
            <span className="chip__txt">
              <small>Country</small>
              <b>{PLAYER.country}</b>
            </span>
          </div>
        </div>
      </div>

      <div className="hero__marquee">
        <div className="marquee__track">
          {group("a")}
          {group("b")}
        </div>
      </div>
    </section>
  );
}

function Section({ id, title, wide, children }) {
  return (
    <section id={id} className={`section reveal-section ${wide ? "section--wide" : ""}`}>
      <h2 className="section__title">{title}</h2>
      <div className="section__body">{children}</div>
    </section>
  );
}

function About() {
  const current = PLAYER.career.find((c) => c.id === "current");
  const born = new Date(`${PLAYER.born}T00:00:00Z`);
  const now = new Date();
  let age = now.getUTCFullYear() - born.getUTCFullYear();
  if (now < new Date(Date.UTC(now.getUTCFullYear(), born.getUTCMonth(), born.getUTCDate()))) age--;
  const bornText = born.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const facts = [
    ["Position", PLAYER.position],
    ["Role", PLAYER.role],
    ["Club", current ? current.team : PLAYER.club],
    ["Nationality", PLAYER.country],
    ["Jersey", `#${PLAYER.number}`],
    ["Born", `${bornText} (${age})`],
    ["Height", PLAYER.height],
    ["Preferred foot", PLAYER.foot],
  ];
  const [lead, ...rest] = PLAYER.about;
  return (
    <Section id="about" title="About" wide>
      <div className="about">
        <div className="about__text">
          <p className="about__lead">{lead}</p>
          {rest.map((p, i) => (
            <p key={i} className="about__p">
              {p}
            </p>
          ))}
        </div>
        <aside className="about__card" aria-label="Player profile">
          <h3 className="about__card-title">Player profile</h3>
          <dl className="about__facts">
            {facts.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </Section>
  );
}

const ICONS = {
  matches: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m12 7.5 3.6 2.6-1.4 4.2H9.8l-1.4-4.2L12 7.5ZM12 3v4.5M3.8 9.3l4.6.8M20.2 9.3l-4.6.8M7 19.5l2.8-5.2M17 19.5l-2.8-5.2" />
    </svg>
  ),
  goals: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.2" />
    </svg>
  ),
  assists: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="5.5" cy="17.5" r="2.5" />
      <circle cx="18.5" cy="6.5" r="2.5" />
      <path d="M8 16c5 0 3-9 8-9.5M14.5 4.8l2 1.7-1.7 2" />
    </svg>
  ),
  caps: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 4.5 6v5.5c0 4.6 3.1 8 7.5 9.5 4.4-1.5 7.5-4.9 7.5-9.5V6L12 3Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </svg>
  ),
};

function Stats() {
  // Totals are calculated from the Career data, so you only edit stats once.
  const sum = (key) => PLAYER.career.reduce((t, c) => t + ((c.stats && c.stats[key]) || 0), 0);
  const national = PLAYER.career.find((c) => c.id === "national");
  const matches = sum("matches");
  const goals = sum("goals");
  const assists = sum("assists");
  const per = (n) => (matches ? (n / matches).toFixed(2) : "0.00");

  const cards = [
    { key: "matches", label: "Matches", value: matches, note: "All teams", big: true },
    { key: "goals", label: "Goals", value: goals, note: `${per(goals)} per match` },
    { key: "assists", label: "Assists", value: assists, note: `${per(assists)} per match` },
    { key: "caps", label: "Caps", value: national && national.stats ? national.stats.matches : 0, note: `For ${national ? national.team : "country"}` },
  ];

  return (
    <Section id="stats" title="Stats" wide>
      <div className="stats-grid">
        {cards.map((c) => (
          <article key={c.key} className={`stat-card ${c.big ? "stat-card--big" : ""}`}>
            <span className="stat-card__icon">{ICONS[c.key]}</span>
            <div className="stat-card__value">
              <span data-count={c.value}>{c.value}</span>
            </div>
            <h3 className="stat-card__label">{c.label}</h3>
            <p className="stat-card__note">{c.note}</p>
            <span className="stat-card__bar" />
          </article>
        ))}
      </div>
    </Section>
  );
}

function Career() {
  return (
    <Section id="career" title="Career" wide>
      <CareerShowcase clubs={PLAYER.career} defaultId="current" />
    </Section>
  );
}

function Gallery() {
  return (
    <Section id="gallery" title="Gallery" wide>
      <GalleryView items={PLAYER.gallery} />
    </Section>
  );
}

const ArrowUpRight = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);

function Contact() {
  const { email, instagram, instagramHandle, linktree } = PLAYER.contact;
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the mailto button still works */
    }
  };

  // Main button: email if there is one, otherwise Instagram
  const main = email
    ? { href: `mailto:${email}`, label: email, external: false }
    : { href: instagram, label: instagramHandle || "Instagram", external: true };
  const pills = [
    ...(email ? [["Instagram", instagram]] : []),
    ["Linktree", linktree],
  ].filter(([, href]) => href);

  return (
    <Section id="contact" title="Contact" wide>
      <div className="contact">
        <h3 className="contact__title">Let’s talk football.</h3>
        <p className="contact__sub">For media, sponsorships, trials and collaborations.</p>
        <div className="contact__mail">
          <a
            className="contact__btn"
            href={main.href}
            {...(main.external ? { target: "_blank", rel: "noreferrer" } : {})}
          >
            {main.label}
            <ArrowUpRight />
          </a>
          {email && (
            <button type="button" className="contact__copy" onClick={copy} aria-live="polite">
              {copied ? "Copied!" : "Copy"}
            </button>
          )}
        </div>
        <ul className="contact__social">
          {pills.map(([label, href]) => (
            <li key={label}>
              <a href={href} target="_blank" rel="noreferrer">
                {label} <ArrowUpRight />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

function Footer() {
  const { email, instagram, instagramHandle, linktree } = PLAYER.contact;
  return (
    <footer className="footer">
      <div className="footer__inner">
        <p className="footer__word" aria-hidden="true">
          {PLAYER.name}
        </p>

        <div className="footer__cols">
          <div className="footer__brand">
            <p className="footer__tag">{PLAYER.tagline}</p>
            <p className="footer__meta">
              {PLAYER.position} · {PLAYER.club}
            </p>
          </div>

          <nav aria-label="Footer">
            <h4>Navigate</h4>
            <ul>
              {NAV.map(([id, label]) => (
                <li key={id}>
                  <a href={`#${id}`}>{label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h4>Connect</h4>
            <ul>
              {email && (
                <li>
                  <a href={`mailto:${email}`}>{email}</a>
                </li>
              )}
              <li>
                <a href={instagram} target="_blank" rel="noreferrer">
                  {instagramHandle || "Instagram"}
                </a>
              </li>
              <li>
                <a href={linktree} target="_blank" rel="noreferrer">
                  Linktree
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <span>
            © {new Date().getFullYear()} {PLAYER.name}. All rights reserved.
          </span>
          <a href="#top" className="footer__top">
            Back to top
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 19V5M6 11l6-6 6 6" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const root = useRef(null);
  const introRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      let off = () => {};
      const ctx = gsap.context(() => {
        // Hero intro (starts when the loader slides away)
        const intro = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
        intro
          .from(".header", { y: -30, opacity: 0, duration: 0.8 })
          .from(".eyebrow", { y: 16, opacity: 0, duration: 0.7 }, "-=0.4")
          .from(".char", { yPercent: 110, duration: 1, stagger: 0.07, ease: "power4.out" }, "-=0.4")
          .from(".hero__tagline", { y: 20, opacity: 0, duration: 0.8 }, "-=0.5")
          .from(".hero__cta > *", { y: 20, opacity: 0, duration: 0.7, stagger: 0.1 }, "-=0.5")
          .from(".hero__number", { opacity: 0, x: 60, duration: 1.4, ease: "power2.out" }, 0.1)
          .from(".hero__blob", { scale: 0.4, opacity: 0, duration: 1.2, ease: "back.out(1.4)" }, 0.15)
          .from(".hero__img, .hero__ph", { y: 90, opacity: 0, duration: 1.2 }, 0.35)
          .from(".chip", { scale: 0.6, opacity: 0, duration: 0.7, stagger: 0.12, ease: "back.out(2)" }, 0.95)
          .from(".hero__marquee", { yPercent: 100, duration: 0.9 }, 0.5);
        introRef.current = intro;

        // Floating chips
        gsap.to(".chip", {
          y: "+=10",
          duration: 2.2,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          stagger: { each: 0.5, from: "random" },
        });

        // Mouse parallax on the photo (desktop only)
        const hero = document.querySelector(".hero");
        if (hero && window.matchMedia("(hover: hover) and (min-width: 900px)").matches) {
          const imgX = gsap.quickTo(".hero__img, .hero__ph", "x", { duration: 0.8, ease: "power3.out" });
          const blobX = gsap.quickTo(".hero__blob", "x", { duration: 1, ease: "power3.out" });
          const onMove = (e) => {
            const nx = e.clientX / window.innerWidth - 0.5;
            imgX(nx * 22);
            blobX(nx * -30);
          };
          hero.addEventListener("pointermove", onMove);
          off = () => hero.removeEventListener("pointermove", onMove);
        }

        // Big jersey number drifts as you scroll
        gsap.to(".hero__number", {
          yPercent: -35,
          ease: "none",
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });

        // Section reveals
        gsap.utils.toArray(".reveal-section").forEach((sec) => {
          const title = sec.querySelector(".section__title");
          const body = sec.querySelector(".section__body");
          const tl = gsap.timeline({
            scrollTrigger: { trigger: sec, start: "top 80%", once: true },
            defaults: { ease: "power3.out" },
          });
          tl.from(title, { x: -20, opacity: 0, duration: 0.7 }).from(
            body.children,
            { y: 36, opacity: 0, duration: 0.9, stagger: 0.12 },
            "-=0.4"
          );
        });

        // Stat counters
        gsap.utils.toArray("[data-count]").forEach((el) => {
          const raw = el.dataset.count;
          const target = parseInt(raw, 10);
          if (!Number.isFinite(target) || target <= 0) return;
          const obj = { n: 0 };
          gsap.to(obj, {
            n: target,
            duration: 1.8,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
            onUpdate: () => {
              el.textContent = String(Math.round(obj.n)).padStart(raw.length, "0");
            },
          });
        });

        // Stat cards pop in one by one, accent bar fills
        if (HAS_STATS) {
        gsap.from(".stat-card", {
          y: 40,
          opacity: 0,
          scale: 0.96,
          duration: 0.9,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: ".stats-grid", start: "top 85%", once: true },
        });
        gsap.from(".stat-card__bar", {
          scaleX: 0,
          duration: 1.2,
          delay: 0.3,
          stagger: 0.12,
          ease: "power3.out",
          transformOrigin: "left",
          scrollTrigger: { trigger: ".stats-grid", start: "top 85%", once: true },
        });
        }

        // Footer
        gsap.from(".footer__word", {
          yPercent: 40,
          opacity: 0,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: { trigger: ".footer", start: "top 90%", once: true },
        });
        gsap.from(".footer__cols > *, .footer__bottom", {
          y: 24,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: ".footer", start: "top 85%", once: true },
        });
      }, root);

      return () => {
        off();
        ctx.revert();
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <div ref={root}>
      {!loaded && (
        <Preloader
          name={PLAYER.name}
          onReveal={() => introRef.current && introRef.current.play()}
          onDone={() => {
            setLoaded(true);
            requestAnimationFrame(() => ScrollTrigger.refresh());
          }}
        />
      )}
      <Navbar name={PLAYER.name} nav={NAV} contact={PLAYER.contact} number={PLAYER.number} />
      <main>
        <Hero />
        <About />
        {HAS_STATS && <Stats />}
        <Career />
        <Gallery />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}