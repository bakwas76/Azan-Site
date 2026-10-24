import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

const STAT_KEYS = [
  ["matches", "Matches"],
  ["goals", "Goals"],
  ["assists", "Assists"],
];

// Tabs (Previous / Current / National) + a detail panel whose numbers
// count up from 0 every time a club is selected.
export default function CareerShowcase({ clubs, defaultId }) {
  const [activeId, setActiveId] = useState(defaultId ?? clubs[0].id);
  const panelRef = useRef(null);
  const active = clubs.find((c) => c.id === activeId);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nums = panel.querySelectorAll("[data-target]");

    if (reduce) {
      nums.forEach((el) => (el.textContent = el.dataset.target));
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".cs-fade",
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: "power3.out" }
      );
      gsap.fromTo(
        ".cs-logo",
        { scale: 0.85, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.7, ease: "back.out(1.6)" }
      );
      nums.forEach((el, i) => {
        const target = Number(el.dataset.target) || 0;
        const obj = { n: 0 };
        el.textContent = "0";
        gsap.to(obj, {
          n: target,
          duration: 1.6,
          delay: 0.25 + i * 0.12,
          ease: "power2.out",
          onUpdate: () => (el.textContent = String(Math.round(obj.n))),
        });
      });
      if (panel.querySelector(".cs-bar")) gsap.fromTo(
        ".cs-bar",
        { scaleX: 0 },
        { scaleX: 1, duration: 1.2, ease: "power3.out", transformOrigin: "left" }
      );
    }, panel);

    return () => ctx.revert();
  }, [activeId]);

  return (
    <div className="cs">
      <div
        className="cs__tabs"
        role="tablist"
        aria-label="Career clubs"
        style={{ gridTemplateColumns: `repeat(${clubs.length}, 1fr)` }}
      >
        {clubs.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={c.id === activeId}
            className={`cs__tab ${c.id === activeId ? "is-active" : ""}`}
            onClick={() => setActiveId(c.id)}
          >
            <span className="cs__tab-logo">
              <img src={c.logo} alt="" />
            </span>
            <span className="cs__tab-text">
              <span className="cs__tab-label">{c.label}</span>
              <span className="cs__tab-team">{c.team}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="cs__panel" ref={panelRef} role="tabpanel" key={active.id}>
        <div className="cs__head">
          <div className="cs-logo cs__logo">
            <img src={active.logo} alt={`${active.team} logo`} />
          </div>
          <div className="cs__title">
            <p className="cs-fade cs__label">{active.label}</p>
            <h3 className="cs-fade cs__team">{active.team}</h3>
            <p className="cs-fade cs__meta">
              {[active.years, active.role].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>

        {active.stats && (
          <>
            <div className="cs__stats">
              {STAT_KEYS.map(([key, label]) => (
                <div className="cs-fade cs__stat" key={key}>
                  <span className="cs__num" data-target={active.stats[key]}>
                    0
                  </span>
                  <span className="cs__stat-label">{label}</span>
                </div>
              ))}
            </div>
            <div className="cs__line">
              <span className="cs-bar" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}