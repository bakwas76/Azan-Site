import { createContext, useContext, useEffect, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { buildContent, LOCAL_CONTENT } from "./index.js";
import { firebaseReady } from "../firebase/config.js";

const Ctx = createContext(LOCAL_CONTENT);
export const useContent = () => useContext(Ctx);

// Shows the saved content immediately, then adds what the footballer uploaded in the admin panel.
export function ContentProvider({ children }) {
  const [content, setContent] = useState(LOCAL_CONTENT);

  useEffect(() => {
    if (!firebaseReady) return;
    let alive = true;
    import("../firebase/remote.js")
      .then((m) => m.fetchRemote())
      .then((remote) => {
        if (!alive) return;
        setContent(buildContent(remote));
        setTimeout(() => ScrollTrigger.refresh(), 400);
      })
      .catch((e) => console.warn("Live content unavailable, showing saved content.", e));
    return () => {
      alive = false;
    };
  }, []);

  return <Ctx.Provider value={content}>{children}</Ctx.Provider>;
}