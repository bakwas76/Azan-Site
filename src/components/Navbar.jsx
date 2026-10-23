import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import Hamburger, { GooeyFilter } from "./Hamburger.jsx";

const MOBILE_BREAKPOINT = 820;
const pad = (n) => String(n).padStart(2, "0");

export default function Navbar({ name, nav, contact, number }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");
  const menuRef = useRef(null);
  const barRef = useRef(null);
  const tlRef = useRef(null);

  const close = useCallback(() => setOpen(false), []);

  // Scrolled state + progress bar
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? Math.min(1, window.scrollY / h) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Scroll-spy: highlight the link of the section in view
  useEffect(() => {
    const els = nav.map(([id]) => document.getElementById(id)).filter(Boolean);
    if (!els.length || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    els.forEach((el) => io.observe(el));
    const top = document.getElementById("top");
    const onTop = () => window.scrollY < 200 && setActive("");
    window.addEventListener("scroll", onTop, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onTop);
      void top;
    };
  }, [nav]);

  // Menu timeline (built once, played / reversed)
  useLayoutEffect(() => {
    const menu = menuRef.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const origin = "calc(100% - 34px) 34px";
    const ctx = gsap.context(() => {
      gsap.set(".menu__bg--a, .menu__bg--b", { clipPath: `circle(0% at ${origin})` });
      gsap.set(".menu__txt", { yPercent: 115 });
      gsap.set(".menu__fade", { opacity: 0, y: 24 });
      gsap.set(".menu__num", { opacity: 0, scale: 0.9, xPercent: 8 });

      const tl = gsap.timeline({
        paused: true,
        defaults: { ease: "power3.out" },
        onReverseComplete: () => {
          menu.style.visibility = "hidden";
        },
      });
      tl.add(() => {
        menu.style.visibility = "visible";
      }, 0)
        .to(".menu__bg--a", { clipPath: `circle(150% at ${origin})`, duration: 0.9, ease: "power3.inOut" }, 0)
        .to(".menu__bg--b", { clipPath: `circle(150% at ${origin})`, duration: 0.9, ease: "power3.inOut" }, 0.14)
        .to(".menu__num", { opacity: 1, scale: 1, xPercent: 0, duration: 1.1 }, 0.5)
        .to(".menu__txt", { yPercent: 0, duration: 0.9, stagger: 0.07, ease: "power4.out" }, 0.5)
        .to(".menu__fade", { opacity: 1, y: 0, duration: 0.7, stagger: 0.06 }, 0.75);

      if (reduce) tl.timeScale(30);
      tlRef.current = tl;
    }, menu);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const tl = tlRef.current;
    if (!tl) return;
    if (open) {
      tl.timeScale(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 30 : 1).play();
    } else {
      tl.timeScale(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 30 : 1.5).reverse();
    }
  }, [open]);

  // Scroll lock, Esc to close, close when resizing to desktop
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && close();
    const onResize = () => window.innerWidth >= MOBILE_BREAKPOINT && close();
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open, close]);

  return (
    <>
      <GooeyFilter />
      <header className={`header ${scrolled ? "header--solid" : ""} ${open ? "header--open" : ""}`}>
        <a href="#top" className="logo" onClick={close}>
          {name}
        </a>

        <nav className="nav" aria-label="Primary">
          {nav.map(([id, label]) => (
            <a key={id} href={`#${id}`} className={active === id ? "is-active" : ""}>
              {label}
            </a>
          ))}
        </nav>

        <Hamburger open={open} onToggle={() => setOpen((o) => !o)} className="header__burger" />
        <span className="header__progress" ref={barRef} aria-hidden="true" />
      </header>

      <div className="menu" id="site-menu" ref={menuRef} aria-hidden={!open} inert={!open ? "" : undefined}>
        <div className="menu__bg menu__bg--a" />
        <div className="menu__bg menu__bg--b" />
        <span className="menu__num" aria-hidden="true">
          {number}
        </span>

        <nav className="menu__inner" aria-label="Mobile">
          <ul className="menu__list">
            {nav.map(([id, label], i) => (
              <li key={id}>
                <a href={`#${id}`} onClick={close} className={active === id ? "is-active" : ""}>
                  <span className="menu__idx menu__fade">{pad(i + 1)}</span>
                  <span className="menu__mask">
                    <span className="menu__txt">{label}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <div className="menu__foot">
            <a className="menu__fade menu__mail" href={`mailto:${contact.email}`}>
              {contact.email}
            </a>
            <div className="menu__social menu__fade">
              <a href={contact.instagram} target="_blank" rel="noreferrer">
                Instagram
              </a>
              <a href={contact.twitter} target="_blank" rel="noreferrer">
                X / Twitter
              </a>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}