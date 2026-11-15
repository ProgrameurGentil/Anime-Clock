"use strict";

// Menu paramètres (engrenage). Pour l'instant : le thème.

const THEMES = ["auto", "light", "dark"];

/** "light" ou "dark" force le thème ; "auto" suit le système (voir css/base.css). */
function applyTheme(theme) {
  if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
}

function setSettingsMenuOpen(isOpen) {
  dom.settingsMenu.hidden = !isOpen;
  dom.settingsButton.setAttribute("aria-expanded", String(isOpen));
}

function initSettings() {
  const savedTheme = readStorage(STORAGE_KEYS.theme);
  const theme = THEMES.includes(savedTheme) ? savedTheme : "auto";
  document.querySelector(`input[name="theme"][value="${theme}"]`).checked = true;
  applyTheme(theme);

  for (const radio of document.querySelectorAll('input[name="theme"]')) {
    radio.addEventListener("change", () => {
      applyTheme(radio.value);
      writeStorage(STORAGE_KEYS.theme, radio.value);
    });
  }

  dom.settingsButton.addEventListener("click", (event) => {
    event.stopPropagation(); // sinon le clic remonte au document et referme le menu aussitôt
    setSettingsMenuOpen(dom.settingsMenu.hidden);
  });
  document.addEventListener("click", (event) => {
    if (!dom.settingsMenu.hidden && !dom.settingsMenu.contains(event.target)) setSettingsMenuOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !dom.settingsMenu.hidden) {
      setSettingsMenuOpen(false);
      dom.settingsButton.focus();
    }
  });
}
