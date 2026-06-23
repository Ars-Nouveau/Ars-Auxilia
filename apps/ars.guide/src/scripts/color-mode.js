/*!
 * Modified from
 * Color mode toggler for Bootstrap's docs (https://getbootstrap.com/)
 * Copyright 2011-2022 The Bootstrap Authors
 * Licensed under the Creative Commons Attribution 3.0 Unported License.
 *
 * The initial theme is applied by the inline blocking script in <head> (see
 * BaseLayout.astro) to avoid a flash of inaccurate theme before first paint.
 * This module only handles live theme switching after load.
 */

(() => {
  "use strict";

  const prefersDark = () =>
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  // Resolve a theme value to a concrete "light"/"dark" and apply it.
  const setTheme = (theme) => {
    const resolved = theme === "auto" && prefersDark() ? "dark" : theme;
    document.documentElement.setAttribute("data-bs-theme", resolved);
  };

  // Follow the OS setting only while the user hasn't chosen an explicit theme.
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      const storedTheme = localStorage.getItem("theme");
      if (!storedTheme || storedTheme === "auto") {
        setTheme("auto");
      }
    });

  // Enable theme switching via toggle buttons.
  document.querySelectorAll("[data-bs-theme-value]").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const theme = toggle.getAttribute("data-bs-theme-value");
      localStorage.setItem("theme", theme);
      setTheme(theme);
    });
  });
})();
