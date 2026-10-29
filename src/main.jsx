import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

const root = createRoot(document.getElementById("root"));

// The admin page lives at /admin. It is not linked anywhere on the website.
if (window.location.pathname.replace(/\/+$/, "") === "/admin") {
  import("./admin/Admin.jsx").then(({ default: Admin }) => root.render(<Admin />));
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}