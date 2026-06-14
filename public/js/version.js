// Source unique du numero de version de l'app.
// Incrementer la sous-version (1.x) a chaque evolution.
const APP_VERSION = "1.3";

document.addEventListener("DOMContentLoaded", () => {
  const brand = document.querySelector("header.site .brand");
  if (brand && !brand.querySelector(".ver")) {
    const badge = document.createElement("span");
    badge.className = "ver";
    badge.textContent = "v" + APP_VERSION;
    badge.style.cssText =
      "margin-left:8px;font-size:0.7rem;font-weight:600;color:var(--accent-dark);" +
      "background:#f6e7d2;padding:2px 7px;border-radius:999px;vertical-align:middle";
    brand.appendChild(badge);
  }
});
