import "modern-css-reset/dist/reset.min.css";

import type React from "react";
import { StrictMode } from "react";

import { enableMapSet } from "immer";
import { createRoot } from "react-dom/client";

import { App } from "@app/App";

const container = document.getElementById("root") as HTMLElement;
const root = createRoot(container);

enableMapSet();

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
