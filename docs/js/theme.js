// Burner Mason — light/dark theme toggle.
//
// Default: follow the system setting (prefers-color-scheme). Once a patron
// clicks the toggle, their explicit choice is remembered (localStorage) and
// overrides the system setting until they switch again.
//
// A tiny inline script in each page's <head> applies the stored choice BEFORE
// first paint (no flash). This file wires the toggle buttons and keeps their
// icons in sync.

(function () {
  const KEY = "bm_theme";
  const root = document.documentElement;
  const mq = window.matchMedia("(prefers-color-scheme: dark)");

  // Static, developer-controlled icon markup (safe to assign as HTML).
  const SUN =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const MOON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';

  function stored() {
    try {
      const v = localStorage.getItem(KEY);
      return v === "dark" || v === "light" ? v : null;
    } catch {
      return null;
    }
  }

  function effective() {
    return stored() || (mq.matches ? "dark" : "light");
  }

  function apply() {
    const choice = stored();
    if (choice) root.setAttribute("data-theme", choice);
    else root.removeAttribute("data-theme"); // fall back to system
    updateButtons();
  }

  function updateButtons() {
    const eff = effective();
    const next = eff === "dark" ? "light" : "dark";
    document.querySelectorAll(".theme-toggle").forEach((btn) => {
      // Show the icon for the mode a click will switch TO.
      btn.innerHTML = eff === "dark" ? SUN : MOON;
      btn.setAttribute("aria-label", `Switch to ${next} mode`);
      btn.setAttribute("title", `Switch to ${next} mode`);
      btn.setAttribute("aria-pressed", String(eff === "dark"));
    });
  }

  function toggle() {
    const next = effective() === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* storage unavailable — just apply for this session */
      root.setAttribute("data-theme", next);
    }
    apply();
  }

  // Delegated so it works regardless of which page rendered the button(s).
  document.addEventListener("click", (e) => {
    if (e.target.closest(".theme-toggle")) toggle();
  });

  // If the patron hasn't chosen, track live system changes.
  mq.addEventListener("change", () => {
    if (!stored()) updateButtons();
  });

  apply();
})();
