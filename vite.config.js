import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// After you deploy, put your real website address here (no slash at the end),
// for example "https://azan.vercel.app". It is used for the WhatsApp / social
// share preview in index.html. Leave "" while developing.
const SITE_URL = "";

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    {
      name: "site-url",
      transformIndexHtml: {
        order: "pre",
        handler: (html) => html.replaceAll("%SITE_URL%", command === "build" ? SITE_URL : ""),
      },
    },
  ],
}));