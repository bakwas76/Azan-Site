import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Number that counts up when scrolled into view, and smoothly re-counts when the value changes.
export default function CountUp({ n }) {
  const ref = useRef(null);
  const shown = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = String(n);
      return;
    }
    const run = () => {
      const obj = { v: shown.current ?? 0 };
      gsap.to(obj, {
        v: n,
        duration: 1.6,
        ease: "power2.out",
        onUpdate: () => (el.textContent = String(Math.round(obj.v))),
        onComplete: () => (shown.current = n),
      });
    };
    if (shown.current !== null) {
      run();
      return;
    }
    el.textContent = "0";
    const st = ScrollTrigger.create({ trigger: el, start: "top 92%", once: true, onEnter: run });
    return () => st.kill();
  }, [n]);

  return <span ref={ref}>{n}</span>;
}