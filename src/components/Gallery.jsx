import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";

const pad = (n) => String(n).padStart(2, "0");

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d={d} />
  </svg>
);

const ICON = {
  grid: "M4 4h6.5v6.5H4V4Zm9.5 0H20v6.5h-6.5V4ZM4 13.5h6.5V20H4v-6.5Zm9.5 0H20V20h-6.5v-6.5Z",
  carousel: "M8 5h8v14H8V5ZM3.5 8v8M20.5 8v8",
  expand: "M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7",
  close: "M6 6l12 12M18 6 6 18",
  left: "m14.5 6-6 6 6 6",
  right: "m9.5 6 6 6-6 6",
};

// items: [{ src, alt, caption, category, size: "tall" | "wide" | "normal" }]
export default function Gallery({ items }) {
  const [filter, setFilter] = useState("All");
  // Phones start in the carousel view, larger screens in the grid
  const [view, setView] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches ? "carousel" : "grid"
  );
  const [open, setOpen] = useState(null); // index inside `list`, or null
  const rootRef = useRef(null);
  const lbRef = useRef(null);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(items.map((i) => i.category).filter(Boolean)))],
    [items]
  );
  const list = useMemo(
    () => (filter === "All" ? items : items.filter((i) => i.category === filter)),
    [items, filter]
  );
  const total = list.length;

  // Tile entrance every time the filter or view changes
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".gal__item, .carousel",
        { y: 24, opacity: 0, scale: 0.97 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.05, ease: "power3.out", clearProps: "transform,opacity" }
      );
    }, rootRef);
    return () => ctx.revert();
  }, [filter, view]);

  const step = useCallback(
    (d) => setOpen((o) => (o === null || total === 0 ? o : (o + d + total) % total)),
    [total]
  );

  // Lightbox: keyboard + scroll lock
  const isOpen = open !== null;
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, step]);

  useEffect(() => {
    if (open === null || !lbRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".lb__img", { scale: 0.95, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "power3.out" });
    }, lbRef);
    return () => ctx.revert();
  }, [open]);

  const current = open !== null ? list[open] : null;

  return (
    <div className="gal" ref={rootRef}>
      <div className="gal__bar">
        <div className="gal__filters" role="tablist" aria-label="Photo categories">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={c === filter}
              className={`gal__chip ${c === filter ? "is-active" : ""}`}
              onClick={() => setFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="gal__view" role="group" aria-label="View">
          <button
            type="button"
            className={view === "grid" ? "is-active" : ""}
            aria-label="Grid view"
            aria-pressed={view === "grid"}
            onClick={() => setView("grid")}
          >
            <Icon d={ICON.grid} />
          </button>
          <button
            type="button"
            className={view === "carousel" ? "is-active" : ""}
            aria-label="Carousel view"
            aria-pressed={view === "carousel"}
            onClick={() => setView("carousel")}
          >
            <Icon d={ICON.carousel} />
          </button>
        </div>
      </div>

      {view === "grid" ? (
        <div className="gal__grid">
          {list.map((img, i) => (
            <button
              key={img.src}
              type="button"
              className={`gal__item gal__item--${img.size || "normal"}`}
              aria-label={`Open photo: ${img.caption}`}
              onClick={() => setOpen(i)}
            >
              <img src={img.src} alt={img.alt} loading="lazy" draggable="false" />
              <span className="gal__overlay">
                {img.category && <span className="gal__tag">{img.category}</span>}
                <span className="gal__caption">{img.caption}</span>
              </span>
              <span className="gal__expand">
                <Icon d={ICON.expand} />
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="gal__carousel carousel">
          <Swiper
            key={filter}
            modules={[EffectCoverflow, Autoplay, Pagination]}
            effect="coverflow"
            grabCursor
            centeredSlides
            slidesPerView="auto"
            loop={total >= 6}
            watchOverflow
            autoplay={total > 1 ? { delay: 3500, disableOnInteraction: true, pauseOnMouseEnter: true } : false}
            pagination={{ type: "progressbar" }}
            coverflowEffect={{ rotate: 32, stretch: 0, depth: 120, modifier: 1, slideShadows: false }}
            className="carousel__swiper"
          >
            {list.map((img, i) => (
              <SwiperSlide key={img.src} className="carousel__slide">
                <button
                  type="button"
                  className="carousel__btn"
                  aria-label={`Open photo: ${img.caption}`}
                  onClick={() => setOpen(i)}
                >
                  <img src={img.src} alt={img.alt} loading="lazy" draggable="false" />
                </button>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      {current &&
        createPortal(
        <div
          className="lb"
          ref={lbRef}
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          onClick={() => setOpen(null)}
        >
          <div className="lb__top" onClick={(e) => e.stopPropagation()}>
            <span className="lb__count">
              {pad(open + 1)} / {pad(total)}
            </span>
            <button type="button" className="lb__btn" aria-label="Close" onClick={() => setOpen(null)}>
              <Icon d={ICON.close} />
            </button>
          </div>

          {total > 1 && (
            <button
              type="button"
              className="lb__btn lb__nav lb__nav--prev"
              aria-label="Previous photo"
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
            >
              <Icon d={ICON.left} />
            </button>
          )}

          <figure className="lb__fig" onClick={(e) => e.stopPropagation()}>
            <img className="lb__img" src={current.src} alt={current.alt} />
            <figcaption className="lb__cap">
              <span>{current.caption}</span>
              {current.category && <span className="lb__tag">{current.category}</span>}
            </figcaption>
          </figure>

          {total > 1 && (
            <button
              type="button"
              className="lb__btn lb__nav lb__nav--next"
              aria-label="Next photo"
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
            >
              <Icon d={ICON.right} />
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}