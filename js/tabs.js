"use strict";

// Onglets exclusifs « Calcul » / « Détails de l'anime » (motif ARIA tablist).

const TABS = [
  { tab: dom.tabCalculation, panel: dom.panelCalculation },
  { tab: dom.tabDetails, panel: dom.panelDetails }
];

function selectTab(selectedTab, { focus = false } = {}) {
  for (const { tab, panel } of TABS) {
    const isSelected = tab === selectedTab;
    tab.setAttribute("aria-selected", String(isSelected));
    tab.tabIndex = isSelected ? 0 : -1;
    panel.hidden = !isSelected;
  }
  if (focus) selectedTab.focus();
  if (selectedTab === dom.tabDetails) loadDetails();
}

function isDetailsTabOpen() {
  return dom.tabDetails.getAttribute("aria-selected") === "true";
}

function initTabs() {
  for (const { tab } of TABS) {
    tab.addEventListener("click", () => selectTab(tab));
    // Flèches gauche et droite : onglet précédent ou suivant.
    tab.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const currentIndex = TABS.findIndex((item) => item.tab === tab);
      const step = event.key === "ArrowRight" ? 1 : -1;
      selectTab(TABS[(currentIndex + step + TABS.length) % TABS.length].tab, { focus: true });
    });
  }
}
