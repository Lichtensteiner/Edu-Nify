import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

// Safeguard against third-party translation extensions or Google Translate DOM mutations
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    const filename = event.filename || "";
    const message = event.message || "";
    if (
      filename.includes("translate.googleapis.com") ||
      filename.includes("translate.google.com") ||
      filename.includes("translate_http") ||
      message.includes("translate") ||
      message.includes("removeChild") ||
      message.includes("insertBefore")
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason?.stack || event.reason?.message || String(event.reason || "");
    if (
      reason.includes("translate.googleapis.com") ||
      reason.includes("translate.google.com") ||
      reason.includes("translate_http")
    ) {
      event.preventDefault();
    }
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
