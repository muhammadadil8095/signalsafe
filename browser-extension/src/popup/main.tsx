import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/red-hat-text/400.css";
import "@fontsource/red-hat-text/500.css";
import "@fontsource/red-hat-text/700.css";
import "@fontsource/red-hat-mono/400.css";
import "@fontsource/red-hat-mono/500.css";
import { Popup } from "./Popup";
import "./popup.css";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <Popup />
    </React.StrictMode>
  );
}
